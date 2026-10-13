import { BuildRestClient, Build, BuildDefinition, Folder } from "azure-devops-extension-api/Build";
import { GitImportRequest, GitPullRequest, GitRepository, GitRestClient } from "azure-devops-extension-api/Git";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { getClient, stateful } from "../azure-devops-extension-api";
import { freshId, stored } from "../azure-devops-extension-api/common/state";
import { buildDefinitions, buildList, folders, retentionLeases } from "../azure-devops-extension-api/build/Data";
import { importRequests, pullRequests, repositories } from "../azure-devops-extension-api/git/Data";

describe("stateful helpers for updates and new ids", () => {
    afterEach(() => stateful.disable());

    it("uses the fallback when the mode is off and the stored entry when it is on", () => {
        const list = [{ id: 1, name: "stored" }];
        const fallback = () => ({ id: 1, name: "fresh" });
        expect(stored(list, item => item.id === 1, fallback).name).toBe("fresh");
        stateful.enable();
        expect(stored(list, item => item.id === 1, fallback)).toBe(list[0]);
        expect(stored(list, item => item.id === 2, fallback).name).toBe("fresh");
    });

    it("keeps the drawn id when the mode is off and hands out new ids when it is on", () => {
        expect(freshId(42)).toBe(42);
        stateful.enable();
        const first = freshId(42);
        const second = freshId(42);
        expect(first).toBeGreaterThan(10_000_000);
        expect(second).toBe(first + 1);
    });
});

describe("stateful updates start from the stored entry", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });
    beforeEach(() => stateful.enable());
    afterEach(() => stateful.disable());

    const git = getClient(GitRestClient);
    const build = getClient(BuildRestClient);
    const workItems = getClient(WorkItemTrackingRestClient);

    it("keeps the fields a repository update does not mention", async () => {
        const seeded = repositories[0];
        const updated = await git.updateRepository({ isDisabled: true } as GitRepository, seeded.id);
        expect(updated.isDisabled).toBe(true);
        expect(updated.name).toBe(seeded.name);
        expect(updated.remoteUrl).toBe(seeded.remoteUrl);
        expect((await git.getRepository(seeded.id)).name).toBe(seeded.name);
    });

    it("keeps the fields a pull request update does not mention", async () => {
        const seeded = pullRequests[0];
        const updated = await git.updatePullRequest(
            { title: "Renamed" } as GitPullRequest,
            "repo",
            seeded.pullRequestId
        );
        expect(updated.title).toBe("Renamed");
        expect(updated.createdBy).toBe(seeded.createdBy);
        expect(updated.sourceRefName).toBe(seeded.sourceRefName);
    });

    it("keeps the fields an import request update does not mention", async () => {
        const seeded = importRequests[0];
        const updated = await git.updateImportRequest(
            { detailedStatus: seeded.detailedStatus } as GitImportRequest,
            "proj",
            "repo",
            seeded.importRequestId
        );
        expect(updated.url).toBe(seeded.url);
        expect(updated.parameters).toBe(seeded.parameters);
    });

    it("gives created pull requests and import requests ids that cannot collide", async () => {
        const before = pullRequests.length;
        const first = await git.createPullRequest({ title: "First" } as GitPullRequest, "repo");
        const second = await git.createPullRequest({ title: "Second" } as GitPullRequest, "repo");
        expect(first.pullRequestId).toBeGreaterThan(10_000_000);
        expect(second.pullRequestId).not.toBe(first.pullRequestId);
        expect(pullRequests.length).toBe(before + 2);
        const explicit = await git.createPullRequest({ title: "Third", pullRequestId: 77 } as GitPullRequest, "repo");
        expect(explicit.pullRequestId).toBe(77);
        const importRequest = await git.createImportRequest({} as GitImportRequest, "proj", "repo");
        expect(importRequest.importRequestId).toBeGreaterThan(10_000_000);
        const pinned = await git.createImportRequest({ importRequestId: 88 } as GitImportRequest, "proj", "repo");
        expect(pinned.importRequestId).toBe(88);
        const sync = await git.createForkSyncRequest({} as never, "repo");
        expect(sync.operationId).toBeGreaterThan(10_000_000);
        const merge = await git.createMergeRequest({ comment: "merge" } as never, "proj", "repo");
        expect(merge.mergeOperationId).toBeGreaterThan(10_000_000);
    });

    it("keeps the fields a build, definition and folder update does not mention", async () => {
        const seededBuild = buildList[0];
        const updatedBuild = await build.updateBuild({ keepForever: true } as Build, "proj", seededBuild.id);
        expect(updatedBuild.keepForever).toBe(true);
        expect(updatedBuild.buildNumber).toBe(seededBuild.buildNumber);

        const other = buildList[1];
        const [batched] = await build.updateBuilds([{ id: other.id, keepForever: true } as Build], "proj");
        expect(batched.buildNumber).toBe(other.buildNumber);

        const seededDefinition = buildDefinitions[0];
        const updatedDefinition = await build.updateDefinition(
            { description: "Changed" } as BuildDefinition,
            "proj",
            seededDefinition.id
        );
        expect(updatedDefinition.description).toBe("Changed");
        expect(updatedDefinition.name).toBe(seededDefinition.name);

        const seededFolder = folders[0];
        const updatedFolder = await build.updateFolder({ description: "Changed" } as Folder, "proj", seededFolder.path);
        expect(updatedFolder.description).toBe("Changed");
        expect(updatedFolder.createdBy).toBe(seededFolder.createdBy);
    });

    it("keeps the owner and run of a retention lease it updates", async () => {
        const seeded = retentionLeases[0];
        const updated = await build.updateRetentionLease(
            { daysValid: 30, protectPipeline: !seeded.protectPipeline },
            "proj",
            seeded.leaseId
        );
        expect(updated.protectPipeline).toBe(!seeded.protectPipeline);
        expect(updated.ownerId).toBe(seeded.ownerId);
        expect(updated.definitionId).toBe(seeded.definitionId);
        expect(updated.runId).toBe(seeded.runId);
    });

    it("gives created work items new ids that match their System.Id field", async () => {
        const first = await workItems.createWorkItem([], "proj", "Bug");
        const second = await workItems.createWorkItem([], "proj", "Bug");
        expect(first.id).toBeGreaterThan(10_000_000);
        expect(second.id).not.toBe(first.id);
        expect(first.fields["System.Id"]).toBe(first.id);
        expect((await workItems.getWorkItem(first.id)).id).toBe(first.id);
    });
});

describe("the same calls with the mode off", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("draws ids as before and builds updates from fresh fixtures", async () => {
        const git = getClient(GitRestClient);
        const created = await git.createPullRequest({ title: "Off" } as GitPullRequest, "repo");
        expect(created.pullRequestId).toBeLessThanOrEqual(10_000);
        const seeded = pullRequests[0];
        const updated = await git.updatePullRequest({ title: "Off" } as GitPullRequest, "repo", seeded.pullRequestId);
        expect(updated.createdBy).not.toBe(seeded.createdBy);
        const workItem = await getClient(WorkItemTrackingRestClient).createWorkItem([], "proj", "Bug");
        expect(workItem.id).toBeLessThanOrEqual(10_000);
        expect(workItem.fields["System.Id"]).toBe(workItem.id);
    });
});
