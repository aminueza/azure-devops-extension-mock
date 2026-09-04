import {
    GitAsyncOperationStatus,
    GitRestClient,
    GitStatusState,
    VersionControlChangeType
} from "azure-devops-extension-api/Git";

import { getClient } from "../azure-devops-extension-api";
import {
    annotatedTags,
    changes,
    commits,
    commitStatuses,
    items,
    makeAnnotatedTag,
    makeCommitDiffs,
    makeFileDiff,
    makeGitChange,
    makeGitMerge,
    makeGitStatus,
    makeGitUserDate,
    makeItemText,
    merges
} from "../azure-devops-extension-api/git/Data";

describe("GitRestClient mock items, diffs, merges, tags and statuses", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GitRestClient);

    const unknownPath = "/missing/file.ts";
    const unknownObjectId = "0".repeat(40);
    const unknownOperationId = Number.MAX_SAFE_INTEGER;

    const itemRequest = {
        includeContentMetadata: true,
        includeLinks: true,
        itemDescriptors: [{ path: "/src", recursionLevel: 120, version: "main", versionOptions: 0, versionType: 0 }],
        latestProcessedChange: true
    } as any;

    const diffsCriteria = {
        baseVersionCommit: "a".repeat(40),
        fileDiffParams: [
            { originalPath: "/src/old.ts", path: "/src/new.ts" },
            { originalPath: "/README.md", path: "/README.md" }
        ],
        targetVersionCommit: "b".repeat(40)
    };

    const baseDescriptor = {
        baseVersion: "main",
        baseVersionOptions: 0,
        baseVersionType: 0,
        version: "main",
        versionOptions: 0,
        versionType: 0
    } as any;

    const targetDescriptor = {
        targetVersion: "develop",
        targetVersionOptions: 0,
        targetVersionType: 0,
        version: "develop",
        versionOptions: 0,
        versionType: 0
    } as any;

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getItemText", () => client.getItemText("repo-id", items[0].path)],
        ["getItemZip", () => client.getItemZip("repo-id", items[0].path)],
        ["getItemsBatch", () => client.getItemsBatch(itemRequest, "repo-id")],
        ["getBlobContent", () => client.getBlobContent("repo-id", "sha1")],
        ["getBlobZip", () => client.getBlobZip("repo-id", "sha1")],
        ["getBlobsZip", () => client.getBlobsZip(["sha1", "sha2"], "repo-id")],
        ["getHfsItem", () => client.getHfsItem("repo-id", items[0].path)],
        ["getHfsItemContent", () => client.getHfsItemContent("repo-id", items[0].path)],
        ["getHfsItemText", () => client.getHfsItemText("repo-id", items[0].path)],
        ["getHfsItemZip", () => client.getHfsItemZip("repo-id", items[0].path)],
        ["getHfsItems", () => client.getHfsItems("repo-id")],
        ["getChanges", () => client.getChanges(commits[0].commitId, "repo-id")],
        ["getCommitDiffs", () => client.getCommitDiffs("repo-id")],
        ["getFileDiffs", () => client.getFileDiffs(diffsCriteria, "proj", "repo-id")],
        ["getMergeBases", () => client.getMergeBases("repo-id", commits[0].commitId, commits[1].commitId)],
        ["createMergeRequest", () => client.createMergeRequest(
            { comment: "merge", parents: [commits[0].commitId] },
            "proj",
            "repo-id"
        )],
        ["getMergeRequest", () => client.getMergeRequest("proj", "repo-id", merges[0].mergeOperationId)],
        ["getPushCommits", () => client.getPushCommits("repo-id", 7)],
        ["createAnnotatedTag", () => client.createAnnotatedTag(makeAnnotatedTag("v9.9.9"), "proj", "repo-id")],
        ["getAnnotatedTag", () => client.getAnnotatedTag("proj", "repo-id", annotatedTags[0].objectId)],
        ["getStatuses", () => client.getStatuses(commits[0].commitId, "repo-id")],
        ["createCommitStatus", () => client.createCommitStatus(
            makeGitStatus(900, GitStatusState.Error),
            commits[0].commitId,
            "repo-id"
        )]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it("renders the text of a known item", async () => {
        const text = await client.getItemText("repo-id", items[0].path);
        expect(text).toBe(`${items[0].path}\n${items[0].objectId}`);
    });

    it("renders the text of a fabricated item", async () => {
        const text = await client.getItemText(
            "repo-id",
            unknownPath,
            "proj",
            "/src",
            120,
            true,
            true,
            true,
            baseDescriptor,
            true,
            true,
            true
        );
        expect(text.startsWith(`${unknownPath}\n`)).toBe(true);
    });

    it("encodes the item path into the item zip", async () => {
        const buffer = await client.getItemZip("repo-id", "/src/index.ts");
        expect(new TextDecoder().decode(buffer)).toBe("/src/index.ts");
    });

    it("groups batched items under each matching descriptor", async () => {
        const batch = await client.getItemsBatch(itemRequest, "repo-id", "proj");
        expect(batch.length).toBe(1);
        expect(batch[0].every(i => i.path.startsWith("/src"))).toBe(true);
        expect(batch[0].length).toBe(items.filter(i => i.path.startsWith("/src")).length);
    });

    it("fabricates a batched item when nothing matches", async () => {
        const batch = await client.getItemsBatch(
            { ...itemRequest, itemDescriptors: [{ ...itemRequest.itemDescriptors[0], path: unknownPath }] },
            "repo-id"
        );
        expect(batch[0].length).toBe(1);
        expect(batch[0][0].path).toBe(unknownPath);
    });

    it("encodes the blob sha into the blob buffers", async () => {
        const decoder = new TextDecoder();
        const content = await client.getBlobContent("repo-id", "blob-sha", "proj", true, "f.txt", true);
        const zip = await client.getBlobZip("repo-id", "blob-sha", "proj", true, "f.txt", true);
        expect(decoder.decode(content)).toBe("blob-sha");
        expect(decoder.decode(zip)).toBe("blob-sha");
    });

    it("joins every blob id into the blobs zip", async () => {
        const buffer = await client.getBlobsZip(["one", "two"], "repo-id", "proj", "bundle.zip");
        expect(new TextDecoder().decode(buffer)).toBe("one,two");
    });

    it("returns a known hfs item", async () => {
        await expect(client.getHfsItem("repo-id", items[2].path)).resolves.toBe(items[2]);
    });

    it("fabricates an unknown hfs item", async () => {
        const item = await client.getHfsItem(
            "repo-id",
            unknownPath,
            "proj",
            "/src",
            120,
            true,
            true,
            true,
            baseDescriptor,
            true,
            true,
            true
        );
        expect(item.path).toBe(unknownPath);
    });

    it("encodes the path into the hfs buffers", async () => {
        const decoder = new TextDecoder();
        const content = await client.getHfsItemContent("repo-id", "/src/index.ts");
        const zip = await client.getHfsItemZip("repo-id", "/src/index.ts");
        expect(decoder.decode(content)).toBe("/src/index.ts");
        expect(decoder.decode(zip)).toBe("/src/index.ts");
    });

    it("renders hfs item text through the item lookup", async () => {
        const text = await client.getHfsItemText("repo-id", items[0].path);
        expect(text).toBe(makeItemText(items[0]));
    });

    it("returns every hfs item without a scope", async () => {
        await expect(client.getHfsItems("repo-id")).resolves.toBe(items);
    });

    it("scopes hfs items to a path prefix", async () => {
        const scoped = await client.getHfsItems("repo-id", "proj", "/src", 120, true, true, true, true, baseDescriptor, true);
        expect(scoped.length).toBe(items.filter(i => i.path.startsWith("/src")).length);
        expect(scoped.every(i => i.path.startsWith("/src"))).toBe(true);
    });

    it("returns every change against the requested commit", async () => {
        const result = await client.getChanges(commits[0].commitId, "repo-id");
        expect(result.changes.length).toBe(changes.length);
        expect(result.changes.every(c => c.item.commitId === commits[0].commitId)).toBe(true);
        expect(result.changeCounts).toEqual({ [VersionControlChangeType.Edit]: changes.length });
    });

    it("pages changes with top and skip", async () => {
        const result = await client.getChanges(commits[0].commitId, "repo-id", "proj", 2, 1);
        expect(result.changes.length).toBe(2);
        expect(result.changes[0].changeId).toBe(changes[1].changeId);
    });

    it("diffs the default branches when no descriptor is given", async () => {
        const diffs = await client.getCommitDiffs("repo-id");
        expect(diffs.baseCommit).toBe("main");
        expect(diffs.targetCommit).toBe("develop");
        expect(diffs.allChangesIncluded).toBe(true);
        expect(diffs.changes.length).toBe(changes.length);
        expect(diffs.commonCommit).not.toBe("main");
    });

    it("diffs the requested descriptors and pages the changes", async () => {
        const diffs = await client.getCommitDiffs(
            "repo-id",
            "proj",
            true,
            2,
            1,
            { ...baseDescriptor, version: "release/1.0" },
            { ...targetDescriptor, version: "hotfix" }
        );
        expect(diffs.baseCommit).toBe("release/1.0");
        expect(diffs.targetCommit).toBe("hotfix");
        expect(diffs.allChangesIncluded).toBe(false);
        expect(diffs.changes.length).toBe(2);
        expect(diffs.commonCommit).toBe("release/1.0");
    });

    it("returns one file diff per requested path", async () => {
        const diffs = await client.getFileDiffs(diffsCriteria, "proj", "repo-id");
        expect(diffs.map(d => d.path)).toEqual(["/src/new.ts", "/README.md"]);
        expect(diffs[0].originalPath).toBe("/src/old.ts");
        expect(diffs[0].lineDiffBlocks.length).toBe(1);
    });

    it("excludes both endpoints from the merge bases", async () => {
        const bases = await client.getMergeBases(
            "repo-id",
            commits[0].commitId,
            commits[1].commitId,
            "proj",
            "other-collection",
            "other-repo"
        );
        expect(bases.length).toBe(commits.length - 2);
        expect(bases.some(c => c.commitId === commits[0].commitId)).toBe(false);
        expect(bases.some(c => c.commitId === commits[1].commitId)).toBe(false);
    });

    it("queues a merge request without links", async () => {
        const params = { comment: "merge main", parents: [commits[0].commitId] };
        const merge = await client.createMergeRequest(params, "proj", "repo-id");
        expect(merge.comment).toBe("merge main");
        expect(merge.parents).toBe(params.parents);
        expect(merge.status).toBe(GitAsyncOperationStatus.Queued);
        expect(merge._links).toEqual({});
    });

    it("links a queued merge request to its repository", async () => {
        const merge = await client.createMergeRequest(
            { comment: "merge develop", parents: [] },
            "proj",
            "repo-id",
            true
        );
        expect(merge._links.repository.href).toBe("repo-id");
    });

    it("returns a known merge request", async () => {
        await expect(client.getMergeRequest("proj", "repo-id", merges[0].mergeOperationId))
            .resolves.toBe(merges[0]);
    });

    it("fabricates and links an unknown merge request", async () => {
        const merge = await client.getMergeRequest("proj", "repo-id", unknownOperationId, true);
        expect(merge.mergeOperationId).toBe(unknownOperationId);
        expect(merge.comment).toBe("merge into repo-id");
        expect(merge._links.project.href).toBe("proj");
    });

    it("returns every push commit by default", async () => {
        const pushed = await client.getPushCommits("repo-id", 7);
        expect(pushed.length).toBe(commits.length);
    });

    it("pages push commits with top and skip", async () => {
        const pushed = await client.getPushCommits("repo-id", 7, "proj", 3, 2, true);
        expect(pushed.length).toBe(3);
        expect(pushed[0].commitId).toBe(commits[2].commitId);
    });

    it("echoes the created annotated tag", async () => {
        const tag = makeAnnotatedTag("v3.1.4");
        const created = await client.createAnnotatedTag(tag, "proj", "repo-id");
        expect(created.name).toBe("v3.1.4");
        expect(created.objectId).toBe(tag.objectId);
        expect(created.taggedObject).toBe(tag.taggedObject);
    });

    it("returns a known annotated tag", async () => {
        await expect(client.getAnnotatedTag("proj", "repo-id", annotatedTags[1].objectId))
            .resolves.toBe(annotatedTags[1]);
    });

    it("fabricates an unknown annotated tag", async () => {
        const tag = await client.getAnnotatedTag("proj", "repo-id", unknownObjectId);
        expect(tag.objectId).toBe(unknownObjectId);
        expect(tag.name).toBe("v0.0.0");
    });

    it("returns every status by default", async () => {
        const statuses = await client.getStatuses(commits[0].commitId, "repo-id");
        expect(statuses).toEqual(commitStatuses);
    });

    it("returns only the latest status of a page", async () => {
        const statuses = await client.getStatuses(commits[0].commitId, "repo-id", "proj", 2, 1, true);
        expect(statuses.length).toBe(1);
        expect(statuses[0].id).toBe(commitStatuses[1].id);
    });

    it("echoes the created commit status", async () => {
        const status = makeGitStatus(777, GitStatusState.Succeeded);
        const created = await client.createCommitStatus(status, commits[0].commitId, "repo-id", "proj");
        expect(created.id).toBe(777);
        expect(created.state).toBe(GitStatusState.Succeeded);
        expect(created.context).toBe(status.context);
    });

    it("makes a user date with a name and an avatar", () => {
        const userDate = makeGitUserDate();
        expect(userDate.date).toBeInstanceOf(Date);
        expect(userDate.imageUrl.startsWith("https://")).toBe(true);
        expect(userDate.name.length).toBeGreaterThan(0);
    });

    it("makes a change carrying raw text content", () => {
        const change = makeGitChange("/src/app.ts");
        expect(change.changeType).toBe(VersionControlChangeType.Edit);
        expect(change.item.path).toBe("/src/app.ts");
        expect(change.originalPath).toBe("/src/app.ts");
        expect(change.newContent.contentType).toBe(0);
        expect(change.newContentTemplate.type).toBe("text");
    });

    it("makes commit diffs around the given endpoints", () => {
        const diffs = makeCommitDiffs("base-sha", "target-sha");
        expect(diffs.baseCommit).toBe("base-sha");
        expect(diffs.targetCommit).toBe("target-sha");
        expect(diffs.changes).toEqual([]);
    });

    it("makes a file diff from its params", () => {
        const diff = makeFileDiff({ originalPath: "/a", path: "/b" });
        expect(diff.originalPath).toBe("/a");
        expect(diff.lineDiffBlocks[0].originalLineNumberStart).toBe(1);
    });

    it("makes a completed merge with two parents", () => {
        const merge = makeGitMerge("merge everything");
        expect(merge.comment).toBe("merge everything");
        expect(merge.parents.length).toBe(2);
        expect(merge.status).toBe(GitAsyncOperationStatus.Completed);
        expect(merge.detailedStatus.failureMessage).toBe("");
    });

    it("makes a status under the given id and state", () => {
        const status = makeGitStatus(42, GitStatusState.NotSet);
        expect(status.id).toBe(42);
        expect(status.state).toBe(GitStatusState.NotSet);
        expect(status.context.genre).toBe("continuous-integration");
    });

    it("exposes the new seeded lists with pinned keys", () => {
        expect(annotatedTags.map(t => t.objectId)).toEqual(["1".repeat(40), "2".repeat(40), "3".repeat(40)]);
        expect(changes.length).toBe(4);
        expect(commitStatuses.map(s => s.id)).toEqual([101, 102, 103]);
        expect(merges.map(m => m.mergeOperationId)).toEqual([201, 202]);
    });
});
