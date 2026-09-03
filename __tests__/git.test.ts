import { GitObjectType, GitRestClient, PullRequestStatus } from "azure-devops-extension-api/Git";

import { getClient } from "../azure-devops-extension-api";
import {
    branches,
    commits,
    items,
    makeBranchStats,
    makeCommentThread,
    makeCommit,
    makeGitItem,
    makeGitRef,
    makeGitRepository,
    makePullRequest,
    makePush,
    pullRequests,
    refs,
    repositories
} from "../azure-devops-extension-api/git/Data";

describe("GitRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GitRestClient);

    it("exposes the real client type", () => {
        expect((client as any).TYPE).toBe(GitRestClient);
    });

    it("lists repositories", async () => {
        const repos = await client.getRepositories("proj");
        expect(repos).toBe(repositories);
        expect(repos.length).toBeGreaterThan(0);
        expect(repos[0]).toHaveProperty("id");
        expect(repos[0].defaultBranch).toBe("refs/heads/main");
    });

    it("returns a known repository by id", async () => {
        const repo = await client.getRepository(repositories[1].id);
        expect(repo).toBe(repositories[1]);
    });

    it("returns a known repository by name", async () => {
        const repo = await client.getRepository(repositories[2].name);
        expect(repo).toBe(repositories[2]);
    });

    it("fabricates a repository for an unknown id", async () => {
        const repo = await client.getRepository("missing-repo");
        expect(repo.id).toBe("missing-repo");
        expect(repo).toHaveProperty("name");
        expect(repo).toHaveProperty("remoteUrl");
    });

    it("creates a repository merging the caller's fields", async () => {
        const repo = await client.createRepository({ name: "brand-new", isFork: true } as any, "proj");
        expect(repo.name).toBe("brand-new");
        expect(repo.isFork).toBe(true);
        expect(repo).toHaveProperty("id");
        expect(repo).toHaveProperty("webUrl");
    });

    it("deletes a repository", async () => {
        await expect(client.deleteRepository("repo-id", "proj")).resolves.toBeUndefined();
    });

    it("updates a repository forcing the requested id", async () => {
        const repo = await client.updateRepository({ name: "renamed", id: "ignored" } as any, "repo-42", "proj");
        expect(repo.id).toBe("repo-42");
        expect(repo.name).toBe("renamed");
    });

    it("returns every ref when no filter is given", async () => {
        const all = await client.getRefs("repo-id");
        expect(all).toBe(refs);
        expect(all.length).toBe(4);
    });

    it("returns every ref when the filter is empty", async () => {
        const all = await client.getRefs("repo-id", "proj", "");
        expect(all).toBe(refs);
    });

    it("filters refs by substring", async () => {
        const heads = await client.getRefs("repo-id", "proj", "heads");
        expect(heads.length).toBe(3);
        expect(heads.every(r => r.name.startsWith("refs/heads/"))).toBe(true);
        const none = await client.getRefs("repo-id", "proj", "nope");
        expect(none).toEqual([]);
    });

    it("updates a ref returning the main ref", async () => {
        const ref = await client.updateRef({} as any, "repo-id", "heads/main");
        expect(ref.name).toBe("refs/heads/main");
        expect(ref.objectId).toMatch(/^[0-9a-f]{40}$/);
        expect(ref).toHaveProperty("creator");
    });

    it("lists branches", async () => {
        const list = await client.getBranches("repo-id", "proj");
        expect(list).toBe(branches);
        expect(list.map(b => b.name)).toEqual(expect.arrayContaining(["main", "develop"]));
    });

    it("returns a known branch", async () => {
        const branch = await client.getBranch("repo-id", "develop");
        expect(branch).toBe(branches[1]);
        expect(branch.isBaseVersion).toBe(false);
    });

    it("fabricates stats for an unknown branch", async () => {
        const branch = await client.getBranch("repo-id", "hotfix/urgent");
        expect(branch.name).toBe("hotfix/urgent");
        expect(branch.isBaseVersion).toBe(false);
        expect(branch.commit).toHaveProperty("commitId");
    });

    it("lists commits", async () => {
        const list = await client.getCommits("repo-id", {} as any);
        expect(list).toBe(commits);
        expect(list.length).toBe(10);
        expect(list[0]).toHaveProperty("author");
        expect(list[0]).toHaveProperty("committer");
    });

    it("returns a known commit", async () => {
        const commit = await client.getCommit(commits[3].commitId, "repo-id");
        expect(commit).toBe(commits[3]);
    });

    it("fabricates a commit for an unknown sha", async () => {
        const commit = await client.getCommit("deadbeef", "repo-id");
        expect(commit.commitId).toBe("deadbeef");
        expect(commit.parents.length).toBe(1);
    });

    it("returns commits in batch", async () => {
        const list = await client.getCommitsBatch({} as any, "repo-id");
        expect(list).toBe(commits);
    });

    it("lists items", async () => {
        const list = await client.getItems("repo-id", "proj");
        expect(list).toBe(items);
        expect(list.some(i => i.isFolder)).toBe(true);
        expect(list.some(i => !i.isFolder)).toBe(true);
    });

    it("returns a known item by path", async () => {
        const item = await client.getItem("repo-id", "/src/");
        expect(item).toBe(items[1]);
        expect(item.isFolder).toBe(true);
        expect(item.gitObjectType).toBe(GitObjectType.Tree);
    });

    it("fabricates an item for an unknown path", async () => {
        const item = await client.getItem("repo-id", "/docs/guide.md");
        expect(item.path).toBe("/docs/guide.md");
        expect(item.isFolder).toBe(false);
        expect(item.gitObjectType).toBe(GitObjectType.Blob);
    });

    it("returns empty item content", async () => {
        const content = await client.getItemContent("repo-id", "/README.md");
        expect(content).toBeInstanceOf(ArrayBuffer);
        expect(content.byteLength).toBe(0);
    });

    it("returns a blob echoing the sha", async () => {
        const blob = await client.getBlob("repo-id", "abc123");
        expect(blob.objectId).toBe("abc123");
        expect(blob.size).toBe(0);
        expect(blob.url).toBe("");
    });

    it("lists pushes", async () => {
        const pushes = await client.getPushes("repo-id");
        expect(pushes.length).toBe(2);
        expect(pushes[0]).toHaveProperty("pushId");
        expect(pushes[0].commits.length).toBe(1);
    });

    it("returns a push echoing the id", async () => {
        const push = await client.getPush("repo-id", 777);
        expect(push.pushId).toBe(777);
        expect(push).toHaveProperty("pushedBy");
    });

    it("creates a push merging the caller's fields", async () => {
        const push = await client.createPush({ pushId: 9, refUpdates: [{ name: "refs/heads/x" }] } as any, "repo-id");
        expect(push.pushId).toBe(9);
        expect(push.refUpdates).toEqual([{ name: "refs/heads/x" }]);
        expect(push).toHaveProperty("repository");
    });

    it("lists pull requests by repository", async () => {
        const prs = await client.getPullRequests("repo-id", {} as any);
        expect(prs).toBe(pullRequests);
        expect(prs.length).toBe(5);
        prs.forEach(pr => expect(pr.status).toBe(PullRequestStatus.Active));
    });

    it("lists pull requests by project", async () => {
        const prs = await client.getPullRequestsByProject("proj", {} as any);
        expect(prs).toBe(pullRequests);
    });

    it("returns a known pull request", async () => {
        const pr = await client.getPullRequest("repo-id", pullRequests[4].pullRequestId);
        expect(pr).toBe(pullRequests[4]);
    });

    it("fabricates a pull request for an unknown id", async () => {
        const pr = await client.getPullRequest("repo-id", 999_999);
        expect(pr.pullRequestId).toBe(999_999);
        expect(pr.targetRefName).toBe("refs/heads/main");
    });

    it("finds pull requests by id alone", async () => {
        const known = await client.getPullRequestById(pullRequests[0].pullRequestId);
        expect(known).toBe(pullRequests[0]);
        const unknown = await client.getPullRequestById(888_888);
        expect(unknown.pullRequestId).toBe(888_888);
    });

    it("creates a pull request merging the caller's fields", async () => {
        const pr = await client.createPullRequest(
            { title: "Fix bug", sourceRefName: "refs/heads/fix", isDraft: true } as any,
            "repo-id"
        );
        expect(pr.title).toBe("Fix bug");
        expect(pr.sourceRefName).toBe("refs/heads/fix");
        expect(pr.isDraft).toBe(true);
        expect(pr).toHaveProperty("pullRequestId");
    });

    it("updates a pull request forcing the requested id", async () => {
        const pr = await client.updatePullRequest(
            { title: "Updated", pullRequestId: 1 } as any,
            "repo-id",
            55
        );
        expect(pr.pullRequestId).toBe(55);
        expect(pr.title).toBe("Updated");
    });

    it("lists comment threads", async () => {
        const threads = await client.getThreads("repo-id", 1);
        expect(threads.length).toBe(1);
        expect(threads[0].comments.length).toBe(1);
        expect(threads[0].pullRequestThreadContext.iterationContext.firstComparingIteration).toBe(1);
    });

    it("creates a thread merging the caller's fields", async () => {
        const thread = await client.createThread({ id: 12, status: 2 } as any, "repo-id", 1);
        expect(thread.id).toBe(12);
        expect(thread.status).toBe(2);
        expect(thread.comments.length).toBe(1);
    });

    it("creates a comment keeping a provided id", async () => {
        const comment = await client.createComment({ id: 7, content: "hi" } as any, "repo-id", 1, 2);
        expect(comment.id).toBe(7);
        expect(comment.content).toBe("hi");
    });

    it("creates a comment defaulting the id to 1", async () => {
        const comment = await client.createComment({ content: "no id" } as any, "repo-id", 1, 2);
        expect(comment.id).toBe(1);
        expect(comment.content).toBe("no id");
    });
});

describe("git Data factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes a repository", () => {
        const repo = makeGitRepository();
        expect(repo.defaultBranch).toBe("refs/heads/main");
        expect(repo.sshUrl).toMatch(/^git@.+\.git$/);
        expect(repo.project).toHaveProperty("id");
    });

    it("makes a ref with the default name", () => {
        expect(makeGitRef().name).toBe("refs/heads/main");
    });

    it("makes a ref with a custom name", () => {
        expect(makeGitRef("refs/tags/v2").name).toBe("refs/tags/v2");
    });

    it("makes a commit", () => {
        const commit = makeCommit();
        expect(commit.commitId).toMatch(/^[0-9a-f]{40}$/);
        expect(commit.author.email).toContain("@");
    });

    it("makes an active pull request", () => {
        const pr = makePullRequest();
        expect(pr.status).toBe(PullRequestStatus.Active);
        expect(pr.sourceRefName.startsWith("refs/heads/")).toBe(true);
        expect(pr.repository).toHaveProperty("id");
    });

    it("makes main branch stats by default", () => {
        const stats = makeBranchStats();
        expect(stats.name).toBe("main");
        expect(stats.isBaseVersion).toBe(true);
    });

    it("makes non-base stats for other branches", () => {
        const stats = makeBranchStats("release/1.0");
        expect(stats.name).toBe("release/1.0");
        expect(stats.isBaseVersion).toBe(false);
        expect(stats.aheadCount).toBeGreaterThanOrEqual(0);
    });

    it("makes a readme blob by default", () => {
        const item = makeGitItem();
        expect(item.path).toBe("/README.md");
        expect(item.isFolder).toBe(false);
        expect(item.gitObjectType).toBe(GitObjectType.Blob);
    });

    it("makes a tree for folder paths", () => {
        const item = makeGitItem("/lib/");
        expect(item.isFolder).toBe(true);
        expect(item.gitObjectType).toBe(GitObjectType.Tree);
    });

    it("makes a push with one commit", () => {
        const push = makePush();
        expect(push.commits.length).toBe(1);
        expect(push.refUpdates).toEqual([]);
    });

    it("makes a comment thread with one comment", () => {
        const thread = makeCommentThread();
        expect(thread.comments[0].id).toBe(1);
        expect(thread.comments[0].parentCommentId).toBe(0);
    });

    it("exposes seeded lists", () => {
        expect(repositories.length).toBe(5);
        expect(pullRequests.length).toBe(5);
        expect(refs.length).toBe(4);
        expect(commits.length).toBe(10);
        expect(branches.length).toBe(3);
        expect(items.length).toBe(4);
    });
});
