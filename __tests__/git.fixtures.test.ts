import {
    CommentThreadStatus,
    CommentType,
    GitPullRequestMergeStrategy,
    GitRestClient,
    PullRequestAsyncStatus,
    PullRequestStatus,
    PullRequestMergeFailureType,
    VersionControlChangeType
} from "azure-devops-extension-api/Git";

import { getClient } from "../azure-devops-extension-api";
import {
    commits,
    items,
    makeBranchStats,
    makeComment,
    makeCommentThread,
    makeCommit,
    makeFileDiffDetail,
    makeGitCommit,
    makeGitItem,
    makeGitRef,
    makeGitRepository,
    makePullRequest,
    makePullRequestThread,
    makePush,
    pullRequestThreads,
    pullRequests,
    refs,
    repositories
} from "../azure-devops-extension-api/git/Data";

const SHA = /^[0-9a-f]{40}$/;

describe("Git fixtures without casts", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GitRestClient);

    it("fills every repository field", () => {
        const repository = makeGitRepository();
        expect(repository.creationDate).toBeInstanceOf(Date);
        expect(repository.validRemoteUrls.length).toBe(1);
        expect(repository.isFork).toBe(false);
        expect(repository.parentRepository).toBeUndefined();
        expect(typeof repository.project.id).toBe("string");
        expect(repository._links).toEqual({});
        expect(repositories.every(seeded => seeded.parentRepository === undefined)).toBe(true);
    });

    it("fills every ref field", () => {
        const ref = makeGitRef("refs/heads/topic");
        expect(ref.peeledObjectId).toMatch(SHA);
        expect(ref.isLocked).toBe(false);
        expect(ref.isLockedBy).toBeUndefined();
        expect(ref.statuses).toEqual([]);
        expect(ref._links).toEqual({});
    });

    it("exposes the seeded refs as a paged list", () => {
        expect(Array.isArray(refs)).toBe(true);
        expect(refs.continuationToken).toBeNull();
    });

    it("fills every commit ref field", () => {
        const commit = makeCommit();
        expect(commit.author.imageUrl).toMatch(/^https?:/);
        expect(commit.committer.imageUrl).toMatch(/^https?:/);
        expect(commit.commentTruncated).toBe(false);
        expect(commit.commitTooManyChanges).toBe(false);
        expect(commit.changeCounts).toEqual({ [VersionControlChangeType.Edit]: 1 });
        expect(commit.changes).toEqual([]);
        expect(commit.statuses).toEqual([]);
        expect(commit.workItems).toEqual([]);
        expect(commit.push.pushId).toBeGreaterThan(0);
        expect(typeof commit.push.pushCorrelationId).toBe("string");
        expect(commit._links).toEqual({});
        expect(commit).not.toHaveProperty("treeId");
    });

    it("makes a full commit with a tree id", () => {
        const commit = makeGitCommit();
        expect(commit.treeId).toMatch(SHA);
        expect(commit.commitId).toMatch(SHA);
        expect(commits.every(seeded => SHA.test(seeded.treeId))).toBe(true);
    });

    it("returns a full commit from getCommit", async () => {
        const known = await client.getCommit(commits[0].commitId, "repo-id");
        expect(known.treeId).toBe(commits[0].treeId);
        const fabricated = await client.getCommit("cafebabe", "repo-id");
        expect(fabricated.commitId).toBe("cafebabe");
        expect(fabricated.treeId).toMatch(SHA);
    });

    it("returns refs as a paged list from getRefs", async () => {
        const all = await client.getRefs("repo-id");
        expect(all.continuationToken).toBeNull();
        const tags = await client.getRefs("repo-id", "proj", "tags");
        expect(tags.map(ref => ref.name)).toEqual(["refs/tags/v1.0.0"]);
        expect(tags.continuationToken).toBeNull();
        expect(refs.length).toBe(4);
    });

    it("returns a typed blob ref from getBlob", async () => {
        const blob = await client.getBlob("repo-id", "abc123");
        expect(blob).toEqual({ _links: {}, objectId: "abc123", size: 0, url: "" });
    });

    it("fills every pull request field", () => {
        const pullRequest = makePullRequest();
        expect(pullRequest.artifactId).toMatch(/^vstfs:\/\/\/Git\/PullRequestId\//);
        expect(pullRequest.status).toBe(PullRequestStatus.Active);
        expect(pullRequest.autoCompleteSetBy).toBeUndefined();
        expect(pullRequest.closedBy).toBeUndefined();
        expect(pullRequest.closedDate).toBeUndefined();
        expect(pullRequest.completionQueueTime).toBeUndefined();
        expect(pullRequest.completionOptions.mergeStrategy).toBe(GitPullRequestMergeStrategy.Squash);
        expect(pullRequest.completionOptions.squashMerge).toBe(true);
        expect(pullRequest.completionOptions.autoCompleteIgnoreConfigIds).toEqual([]);
        expect(pullRequest.mergeOptions).toEqual({
            conflictAuthorshipCommits: false,
            detectRenameFalsePositives: false,
            disableRenames: false
        });
        expect(pullRequest.mergeStatus).toBe(PullRequestAsyncStatus.Succeeded);
        expect(pullRequest.mergeStatus).toBe(3);
        expect(pullRequest.mergeFailureType).toBe(PullRequestMergeFailureType.None);
        expect(pullRequest.mergeFailureMessage).toBe("");
        expect(typeof pullRequest.mergeId).toBe("string");
        expect(pullRequest.forkSource).toBeUndefined();
        expect(pullRequest.hasMultipleMergeBases).toBe(false);
        expect(pullRequest.ignoreTargetRefAndChooseDynamically).toBe(false);
        expect(pullRequest.supportsIterations).toBe(true);
        expect(pullRequest.commits.length).toBe(1);
        expect(pullRequest.lastMergeCommit.commitId).toMatch(SHA);
        expect(pullRequest.lastMergeSourceCommit.commitId).toMatch(SHA);
        expect(pullRequest.lastMergeTargetCommit.commitId).toMatch(SHA);
        expect(pullRequest.remoteUrl).toMatch(/^https?:/);
        expect(pullRequest.repository.creationDate).toBeInstanceOf(Date);
        expect(pullRequests.every(seeded => seeded.reviewers.length === 0)).toBe(true);
    });

    it("fills the commit of branch stats", () => {
        const stats = makeBranchStats("develop");
        expect(stats.commit.push.pushId).toBeGreaterThan(0);
        expect(stats.commit.author.imageUrl).toMatch(/^https?:/);
    });

    it("fills every item field for a file", () => {
        const item = makeGitItem("/src/index.ts");
        expect(item.originalObjectId).toMatch(SHA);
        expect(item.isSymLink).toBe(false);
        expect(item.content).toBe("");
        expect(item.submoduleWebUrl).toBe("");
        expect(item.contentMetadata).toEqual({
            contentType: "text/plain",
            encoding: 65001,
            extension: "ts",
            fileName: "index.ts",
            isBinary: false,
            isImage: false,
            vsLink: ""
        });
        expect(item.latestProcessedChange.changes).toEqual([]);
        expect(item._links).toEqual({});
    });

    it("derives item metadata for folders and the root", () => {
        expect(makeGitItem("/src/").contentMetadata.fileName).toBe("src");
        expect(makeGitItem("/src/").contentMetadata.extension).toBe("");
        expect(makeGitItem("/").contentMetadata.fileName).toBe("");
        expect(makeGitItem("/").contentMetadata.extension).toBe("");
        expect(items[0].contentMetadata.extension).toBe("md");
    });

    it("fills every push field", () => {
        const push = makePush();
        expect(push.pushId).toBeGreaterThanOrEqual(1);
        expect(push.pushId).toBeLessThanOrEqual(10_000);
        expect(typeof push.pushCorrelationId).toBe("string");
        expect(push._links).toEqual({});
        expect(push.refUpdates).toEqual([]);
        expect(push.commits[0].push.pushId).toBeGreaterThan(0);
        expect(push.repository.validRemoteUrls.length).toBe(1);
    });

    it("fills every comment thread field", () => {
        const thread = makeCommentThread();
        const comment = thread.comments[0];
        expect(thread.status).toBe(CommentThreadStatus.Active);
        expect(thread.status).toBe(1);
        expect(thread.isDeleted).toBe(false);
        expect(thread.properties).toEqual({});
        expect(thread.identities).toEqual({ [comment.author.id]: comment.author });
        expect(thread.threadContext.filePath).toMatch(/^\/src\//);
        expect(thread.threadContext.rightFileStart).toEqual({ line: 1, offset: 1 });
        expect(thread.threadContext.rightFileEnd).toEqual({ line: 1, offset: 10 });
        expect(thread.threadContext.leftFileStart).toEqual({ line: 1, offset: 1 });
        expect(thread.threadContext.leftFileEnd).toEqual({ line: 1, offset: 10 });
        expect(thread.pullRequestThreadContext.trackingCriteria.origFilePath).toBe(thread.threadContext.filePath);
        expect(thread.pullRequestThreadContext.trackingCriteria.firstComparingIteration).toBe(1);
        expect(thread.pullRequestThreadContext.trackingCriteria.secondComparingIteration).toBe(2);
        expect(comment.id).toBe(1);
        expect(comment.parentCommentId).toBe(0);
        expect(comment.commentType).toBe(CommentType.Text);
        expect(comment.isDeleted).toBe(false);
        expect(comment.usersLiked).toEqual([]);
        expect(comment._links).toEqual({});
    });

    it("derives thread identities from the comments passed in", () => {
        const comments = [makeComment(1), makeComment(2)];
        const thread = makePullRequestThread(7, CommentThreadStatus.Fixed, comments);
        expect(thread.identities).toEqual({
            [comments[0].author.id]: comments[0].author,
            [comments[1].author.id]: comments[1].author
        });
        expect(pullRequestThreads[0].isDeleted).toBe(false);
    });

    it("keeps the newer file diff fields", () => {
        const file = makeFileDiffDetail("/README.md");
        const folder = makeFileDiffDetail("/src/");
        expect(file).toMatchObject({
            changeType: VersionControlChangeType.Edit,
            isFolder: false,
            isLinuxExecutable: false,
            isSymbolicLink: false,
            originalPath: "/README.md",
            path: "/README.md"
        });
        expect(folder.isFolder).toBe(true);
        expect(file.lineDiffBlocks.length).toBe(1);
    });

    it("has no cast left in the git mock", () => {
        const { readFileSync } = jest.requireActual<typeof import("fs")>("fs");
        const { join } = jest.requireActual<typeof import("path")>("path");
        const root = join(__dirname, "..", "azure-devops-extension-api", "git");
        const source = ["Data.ts", "Git.ts"].map(name => readFileSync(join(root, name), "utf8")).join("\n");
        expect(source).not.toMatch(/\bas (unknown|any)\b/);
        expect(source).not.toMatch(/[})\]] as [A-Z[]/);
    });
});
