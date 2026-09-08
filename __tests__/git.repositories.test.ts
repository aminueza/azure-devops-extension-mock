import {
    GitAsyncOperationStatus,
    GitRefUpdateStatus,
    GitRestClient
} from "azure-devops-extension-api/Git";

import { getClient } from "../azure-devops-extension-api";
import {
    deletedRepositories,
    forks,
    forkSyncRequests,
    importRequests,
    makeDeletedRepository,
    makeGitRepositoryRef,
    makeImportRequest,
    makeSuggestion,
    makeTreeArchive,
    makeTreeRef,
    repositories,
    suggestions,
    trees
} from "../azure-devops-extension-api/git/Data";

describe("GitRestClient mock repositories, forks and imports", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GitRestClient);

    const branchCriteria = {
        baseCommit: { version: "main", versionOptions: 0, versionType: 0 },
        targetCommits: [
            { version: "develop", versionOptions: 0, versionType: 0 },
            { version: "release/1.0", versionOptions: 0, versionType: 0 }
        ]
    } as any;

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getAccessibleRepositories", () => client.getAccessibleRepositories({
            permission: "read",
            repositoryIds: [repositories[0].id]
        })],
        ["getRepositoriesPaged", () => client.getRepositoriesPaged("project-id")],
        ["getRepositoryWithParent", () => client.getRepositoryWithParent("repo-id", true)],
        ["getDeletedRepositories", () => client.getDeletedRepositories("proj")],
        ["getRecycleBinRepositories", () => client.getRecycleBinRepositories("proj")],
        ["restoreRepositoryFromRecycleBin", () => client.restoreRepositoryFromRecycleBin(
            { deleted: false },
            "proj",
            "repo-id"
        )],
        ["createForkSyncRequest", () => client.createForkSyncRequest({
            source: { collectionId: "c", projectId: "p", repositoryId: "r" },
            sourceToTargetRefs: []
        }, "repo-id")],
        ["getForkSyncRequest", () => client.getForkSyncRequest("repo-id", 42)],
        ["getForkSyncRequests", () => client.getForkSyncRequests("repo-id")],
        ["getForks", () => client.getForks("repo-id", "collection-id")],
        ["createImportRequest", () => client.createImportRequest(
            makeImportRequest(),
            "proj",
            "repo-id"
        )],
        ["getImportRequest", () => client.getImportRequest("proj", "repo-id", 7)],
        ["queryImportRequests", () => client.queryImportRequests("proj", "repo-id")],
        ["updateImportRequest", () => client.updateImportRequest(
            makeImportRequest(),
            "proj",
            "repo-id",
            7
        )],
        ["getPermission", () => client.getPermission("proj", repositories[0].id, "read")],
        ["getSuggestions", () => client.getSuggestions("repo-id")],
        ["getBranchStatsBatch", () => client.getBranchStatsBatch(branchCriteria, "repo-id")],
        ["updateRefs", () => client.updateRefs([{
            isLocked: false,
            name: "refs/heads/main",
            newObjectId: "b".repeat(40),
            oldObjectId: "a".repeat(40),
            repositoryId: "ignored"
        }], "repo-id")],
        ["getTree", () => client.getTree("repo-id", "sha")],
        ["getTreeZip", () => client.getTreeZip("repo-id", "sha")]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<unknown>]> = [
        ["deleteRepositoryFromRecycleBin", () => client.deleteRepositoryFromRecycleBin("proj", "repo-id")]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("filters accessible repositories to the seeded ids", async () => {
        const response = await client.getAccessibleRepositories({
            permission: "read",
            repositoryIds: [repositories[1].id, "not-a-repository"]
        });
        expect(response.accessibleRepositoryIds).toEqual([repositories[1].id]);
    });

    it("pages every repository when no options are given", async () => {
        const page = await client.getRepositoriesPaged("project-id");
        expect(page.length).toBe(repositories.length);
        expect(page.continuationToken).toBeNull();
    });

    it("returns a continuation token when a page is truncated", async () => {
        const page = await client.getRepositoriesPaged("project-id", true, true, false, undefined, 2);
        expect(page.length).toBe(2);
        expect(page.continuationToken).toBe("2");
    });

    it("filters and resumes from a continuation token", async () => {
        const page = await client.getRepositoriesPaged(
            "project-id",
            false,
            false,
            true,
            repositories[0].name,
            5,
            "0"
        );
        expect(page.length).toBeGreaterThan(0);
        expect(page.every(r => r.name.includes(repositories[0].name))).toBe(true);
    });

    it("returns a known repository without a parent", async () => {
        const repository = await client.getRepositoryWithParent(repositories[2].id, false);
        expect(repository).toBe(repositories[2]);
    });

    it("attaches a parent to a fabricated repository", async () => {
        const repository = await client.getRepositoryWithParent("missing-repo", true);
        expect(repository.id).toBe("missing-repo");
        expect(repository.parentRepository).toHaveProperty("collection");
        expect(repository.parentRepository.isFork).toBe(true);
    });

    it("shares the deleted repository list with the recycle bin", async () => {
        await expect(client.getDeletedRepositories("proj")).resolves.toBe(deletedRepositories);
        await expect(client.getRecycleBinRepositories("proj")).resolves.toBe(deletedRepositories);
    });

    it("restores a known deleted repository by name", async () => {
        const deleted = deletedRepositories[1];
        const restored = await client.restoreRepositoryFromRecycleBin(
            { deleted: false },
            "proj",
            deleted.id
        );
        expect(restored.id).toBe(deleted.id);
        expect(restored.name).toBe(deleted.name);
        expect(restored.project).toBe(deleted.project);
        expect(restored.isDisabled).toBe(false);
    });

    it("restores an unknown repository with a fabricated name", async () => {
        const restored = await client.restoreRepositoryFromRecycleBin(
            { deleted: true },
            "proj",
            "missing-repo"
        );
        expect(restored.id).toBe("missing-repo");
        expect(restored.isDisabled).toBe(true);
        expect(restored.name).not.toBe("");
    });

    it("queues a fork sync request from the caller parameters", async () => {
        const params = {
            source: { collectionId: "col", projectId: "proj", repositoryId: "repo" },
            sourceToTargetRefs: [{ sourceRef: "refs/heads/main", targetRef: "refs/heads/main" }]
        };
        const request = await client.createForkSyncRequest(params, "repo-id", "proj", true);
        expect(request.source).toBe(params.source);
        expect(request.sourceToTargetRefs).toBe(params.sourceToTargetRefs);
        expect(request.status).toBe(GitAsyncOperationStatus.Queued);
    });

    it("returns a known fork sync request", async () => {
        const known = forkSyncRequests[0];
        await expect(client.getForkSyncRequest("repo-id", known.operationId)).resolves.toBe(known);
    });

    it("fabricates a fork sync request for an unknown operation", async () => {
        const request = await client.getForkSyncRequest("repo-id", -1, "proj", true);
        expect(request.operationId).toBe(-1);
        expect(request.detailedStatus.allSteps.length).toBe(3);
    });

    it("hides abandoned fork sync requests by default", async () => {
        const visible = await client.getForkSyncRequests("repo-id");
        expect(visible.length).toBe(forkSyncRequests.length - 1);
        expect(visible.some(r => r.status === GitAsyncOperationStatus.Abandoned)).toBe(false);
    });

    it("includes abandoned fork sync requests on request", async () => {
        await expect(client.getForkSyncRequests("repo-id", "proj", true, false))
            .resolves.toBe(forkSyncRequests);
    });

    it("scopes forks to the requested collection", async () => {
        const result = await client.getForks("repo-id", "collection-id", "proj", true);
        expect(result.length).toBe(forks.length);
        expect(result.every(f => f.collection.id === "collection-id")).toBe(true);
        expect(result[0].name).toBe(forks[0].name);
    });

    it("queues an import request against the target repository", async () => {
        const input = makeImportRequest();
        const created = await client.createImportRequest(input, "proj", "repo-id");
        expect(created.repository.id).toBe("repo-id");
        expect(created.parameters).toBe(input.parameters);
        expect(created.status).toBe(GitAsyncOperationStatus.Queued);
    });

    it("returns a known import request", async () => {
        const known = importRequests[0];
        await expect(client.getImportRequest("proj", "repo-id", known.importRequestId))
            .resolves.toBe(known);
    });

    it("fabricates an import request for an unknown id", async () => {
        const request = await client.getImportRequest("proj", "repo-id", -1);
        expect(request.importRequestId).toBe(-1);
        expect(request.parameters.gitSource.overwrite).toBe(false);
    });

    it("hides abandoned import requests by default", async () => {
        const visible = await client.queryImportRequests("proj", "repo-id");
        expect(visible.length).toBe(importRequests.length - 1);
    });

    it("includes abandoned import requests on request", async () => {
        await expect(client.queryImportRequests("proj", "repo-id", true))
            .resolves.toBe(importRequests);
    });

    it("echoes the updated import request under the requested id", async () => {
        const input = makeImportRequest();
        const updated = await client.updateImportRequest(input, "proj", "repo-id", 99);
        expect(updated.importRequestId).toBe(99);
        expect(updated.status).toBe(input.status);
    });

    it("grants permission when no repository is scoped", async () => {
        await expect(client.getPermission()).resolves.toBe(true);
    });

    it("grants permission for a seeded repository", async () => {
        await expect(client.getPermission("proj", repositories[3].id, "read")).resolves.toBe(true);
    });

    it("denies permission for an unknown repository", async () => {
        await expect(client.getPermission("proj", "missing-repo", "read")).resolves.toBe(false);
    });

    it("returns every suggestion by default", async () => {
        await expect(client.getSuggestions("repo-id")).resolves.toBe(suggestions);
    });

    it("narrows suggestions when a compare branch is preferred", async () => {
        const narrowed = await client.getSuggestions("repo-id", "proj", true);
        expect(narrowed.length).toBe(1);
        expect(narrowed[0].type).toBe("pullRequest");
    });

    it("names branch stats after the requested target commits", async () => {
        const stats = await client.getBranchStatsBatch(branchCriteria, "repo-id", "proj");
        expect(stats.map(s => s.name)).toEqual(["develop", "release/1.0"]);
        expect(stats[0].isBaseVersion).toBe(false);
    });

    it("reports ref updates as succeeded against the target repository", async () => {
        const results = await client.updateRefs([
            {
                isLocked: true,
                name: "refs/heads/main",
                newObjectId: "b".repeat(40),
                oldObjectId: "a".repeat(40),
                repositoryId: "ignored"
            }
        ], "repo-id", "proj", "project-id");
        expect(results.length).toBe(1);
        expect(results[0].repositoryId).toBe("repo-id");
        expect(results[0].isLocked).toBe(true);
        expect(results[0].success).toBe(true);
        expect(results[0].updateStatus).toBe(GitRefUpdateStatus.Succeeded);
    });

    it("returns a shallow known tree by default", async () => {
        const tree = await client.getTree("repo-id", trees[0].objectId);
        expect(tree.objectId).toBe(trees[0].objectId);
        expect(tree.treeEntries.length).toBe(1);
    });

    it("returns a fabricated recursive tree for an unknown sha", async () => {
        const tree = await client.getTree("repo-id", "missing-sha", undefined, undefined, true);
        expect(tree.objectId).toBe("missing-sha");
        expect(tree.treeEntries.length).toBe(3);
    });

    it("rewrites tree entries when a file name is given", async () => {
        const tree = await client.getTree(
            "repo-id",
            trees[1].objectId,
            "proj",
            "project-id",
            true,
            "src/index.ts"
        );
        expect(tree.treeEntries.every(e => e.relativePath === "src/index.ts")).toBe(true);
    });

    it("encodes the tree sha into the zip buffer", async () => {
        const buffer = await client.getTreeZip("repo-id", "abc", "proj", "project-id", true, "x");
        expect(new TextDecoder().decode(buffer)).toBe("abc");
    });

    it("makes a deleted repository with an owner and dates", () => {
        const deleted = makeDeletedRepository();
        expect(deleted.deletedBy).toHaveProperty("displayName");
        expect(deleted.createdDate).toBeInstanceOf(Date);
        expect(deleted.deletedDate.getTime()).toBeLessThanOrEqual(Date.now());
        expect(deleted.project).toHaveProperty("id");
    });

    it("makes a repository ref flagged as a fork", () => {
        const ref = makeGitRepositoryRef();
        expect(ref.isFork).toBe(true);
        expect(ref.sshUrl.startsWith("git@")).toBe(true);
    });

    it("makes a suggestion carrying branch properties", () => {
        const suggestion = makeSuggestion();
        expect(suggestion.properties.targetBranch).toBe("refs/heads/main");
    });

    it("makes a tree with three entries", () => {
        const tree = makeTreeRef();
        expect(tree.treeEntries.length).toBe(3);
        expect(tree.treeEntries[0].mode).toBe("100644");
    });

    it("makes an empty archive for an empty sha", () => {
        expect(makeTreeArchive("").byteLength).toBe(0);
    });

    it("exposes the new seeded lists", () => {
        expect(deletedRepositories.length).toBe(3);
        expect(forks.length).toBe(3);
        expect(forkSyncRequests.length).toBe(3);
        expect(importRequests.length).toBe(3);
        expect(suggestions.length).toBe(2);
        expect(trees.length).toBe(2);
    });
});
