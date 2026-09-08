import {
    CommentThreadStatus,
    GitConflictUpdateStatus,
    GitResolutionStatus,
    GitRestClient,
    GitStatusState
} from "azure-devops-extension-api/Git";
import { Operation } from "azure-devops-extension-api/WebApi";

import { getClient } from "../azure-devops-extension-api";
import {
    makeComment,
    makePullRequestStatus,
    pullRequestConflicts,
    pullRequestFileDiffDetails,
    pullRequestIterationStatuses,
    pullRequestIterations,
    pullRequestThreadComments,
    pullRequestThreads,
    pullRequests
} from "../azure-devops-extension-api/git/Data";

describe("GitRestClient mock iterations, conflicts and comments", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GitRestClient);

    const knownIterationId = pullRequestIterations[0].id;
    const unknownIterationId = Number.MAX_SAFE_INTEGER;
    const knownPullRequestId = pullRequests[0].pullRequestId;
    const unknownPullRequestId = Number.MAX_SAFE_INTEGER;

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getPullRequestIteration", () => client.getPullRequestIteration("repo-id", knownPullRequestId, knownIterationId)],
        ["getPullRequestIterations", () => client.getPullRequestIterations("repo-id", knownPullRequestId)],
        ["getPullRequestIterationChanges", () => client.getPullRequestIterationChanges("repo-id", knownPullRequestId, knownIterationId)],
        ["getPullRequestIterationCommits", () => client.getPullRequestIterationCommits("repo-id", knownPullRequestId, knownIterationId)],
        ["getPullRequestCommits", () => client.getPullRequestCommits("repo-id", knownPullRequestId)],
        ["getPullRequestFilesDiff", () => client.getPullRequestFilesDiff("repo-id", knownPullRequestId)],
        ["getPullRequestIterationStatuses", () => client.getPullRequestIterationStatuses("repo-id", knownPullRequestId, 5001)],
        ["getPullRequestIterationStatus", () => client.getPullRequestIterationStatus("repo-id", knownPullRequestId, 5001, 5101)],
        ["createPullRequestIterationStatus", () => client.createPullRequestIterationStatus(
            makePullRequestStatus(5150, GitStatusState.Pending, 5001),
            "repo-id",
            knownPullRequestId,
            5001
        )],
        ["getPullRequestConflict", () => client.getPullRequestConflict("repo-id", knownPullRequestId, 5201)],
        ["getPullRequestConflicts", () => client.getPullRequestConflicts("repo-id", knownPullRequestId)],
        ["updatePullRequestConflict", () => client.updatePullRequestConflict(
            pullRequestConflicts[0],
            "repo-id",
            knownPullRequestId,
            5201
        )],
        ["updatePullRequestConflicts", () => client.updatePullRequestConflicts(
            [pullRequestConflicts[0]],
            "repo-id",
            knownPullRequestId
        )],
        ["getPullRequestThread", () => client.getPullRequestThread("repo-id", knownPullRequestId, 5301)],
        ["updateThread", () => client.updateThread(
            pullRequestThreads[0],
            "repo-id",
            knownPullRequestId,
            5301
        )],
        ["getComments", () => client.getComments("repo-id", knownPullRequestId, 5301)],
        ["getComment", () => client.getComment("repo-id", knownPullRequestId, 5301, 5401)],
        ["updateComment", () => client.updateComment(
            makeComment(5401),
            "repo-id",
            knownPullRequestId,
            5301,
            5401
        )]
    ];

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deletePullRequestIterationStatus", () => client.deletePullRequestIterationStatus("repo-id", knownPullRequestId, 5001, 5101)],
        ["deleteComment", () => client.deleteComment("repo-id", knownPullRequestId, 5301, 5401)],
        ["updatePullRequestIterationStatuses", () => client.updatePullRequestIterationStatuses(
            [{ op: Operation.Remove, path: "/0", value: null, from: "" }],
            "repo-id",
            knownPullRequestId,
            5001
        )]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("returns the seeded iteration for a known id", async () => {
        const iteration = await client.getPullRequestIteration("repo-id", knownPullRequestId, 5002);
        expect(iteration).toBe(pullRequestIterations[1]);
    });

    it("fabricates an iteration for an unknown id", async () => {
        const iteration = await client.getPullRequestIteration("repo-id", knownPullRequestId, unknownIterationId);
        expect(iteration.id).toBe(unknownIterationId);
        expect(iteration.changeList).toHaveLength(3);
    });

    it("drops commits unless includeCommits is set", async () => {
        const withoutCommits = await client.getPullRequestIterations("repo-id", knownPullRequestId, "proj");
        expect(withoutCommits.every(i => i.commits.length === 0)).toBe(true);
        const withCommits = await client.getPullRequestIterations("repo-id", knownPullRequestId, "proj", true);
        expect(withCommits).toBe(pullRequestIterations);
    });

    it("returns every change entry unpaged", async () => {
        const changes = await client.getPullRequestIterationChanges("repo-id", knownPullRequestId, knownIterationId);
        expect(changes.changeEntries).toHaveLength(3);
        expect(changes.nextSkip).toBe(0);
        expect(changes.nextTop).toBe(0);
    });

    it("reports the next page of change entries", async () => {
        const changes = await client.getPullRequestIterationChanges("repo-id", knownPullRequestId, knownIterationId, "proj", 2);
        expect(changes.changeEntries).toHaveLength(2);
        expect(changes.nextSkip).toBe(2);
        expect(changes.nextTop).toBe(2);
    });

    it("skips change entries", async () => {
        const changes = await client.getPullRequestIterationChanges("repo-id", knownPullRequestId, knownIterationId, "proj", 5, 1);
        expect(changes.changeEntries).toHaveLength(2);
        expect(changes.nextSkip).toBe(0);
    });

    it("stamps compareTo onto change entries", async () => {
        const changes = await client.getPullRequestIterationChanges("repo-id", knownPullRequestId, knownIterationId, "proj", undefined, undefined, 7);
        expect(changes.changeEntries.map(entry => entry.changeTrackingId)).toEqual([7, 7, 7]);
    });

    it("fabricates change entries for an unknown iteration", async () => {
        const changes = await client.getPullRequestIterationChanges("repo-id", knownPullRequestId, unknownIterationId);
        expect(changes.changeEntries.map(entry => entry.changeTrackingId)).toEqual([
            unknownIterationId,
            unknownIterationId,
            unknownIterationId
        ]);
    });

    it("pages iteration commits", async () => {
        const all = await client.getPullRequestIterationCommits("repo-id", knownPullRequestId, knownIterationId);
        expect(all).toEqual(pullRequestIterations[0].commits);
        const paged = await client.getPullRequestIterationCommits("repo-id", knownPullRequestId, knownIterationId, "proj", 1, 1);
        expect(paged).toEqual([pullRequestIterations[0].commits[1]]);
    });

    it("fabricates commits for an unknown iteration", async () => {
        const fabricated = await client.getPullRequestIterationCommits("repo-id", knownPullRequestId, unknownIterationId);
        expect(fabricated).toHaveLength(3);
    });

    it("returns a paged list of pull request commits", async () => {
        const page = await client.getPullRequestCommits("repo-id", knownPullRequestId);
        expect(Array.isArray(page)).toBe(true);
        expect(page.continuationToken).toBeNull();
    });

    it("hands back a continuation token for an unknown pull request", async () => {
        const page = await client.getPullRequestCommits("repo-id", unknownPullRequestId, "proj");
        expect(page.continuationToken).toBe(String(unknownPullRequestId));
    });

    it("describes the pull request in its files diff", async () => {
        const diff = await client.getPullRequestFilesDiff("repo-id", knownPullRequestId);
        expect(diff.pullRequestTitle).toBe(pullRequests[0].title);
        expect(diff.pullRequestDescription).toBe(pullRequests[0].description);
        expect(diff.fileDiffs).toHaveLength(pullRequestFileDiffDetails.length);
    });

    it("pages file diffs for an unknown pull request", async () => {
        const diff = await client.getPullRequestFilesDiff("repo-id", unknownPullRequestId, "proj", 1, 2, 2, 1);
        expect(diff.fileDiffs).toEqual(pullRequestFileDiffDetails.slice(1, 3));
        expect(typeof diff.pullRequestTitle).toBe("string");
    });

    it("filters iteration statuses by iteration", async () => {
        const statuses = await client.getPullRequestIterationStatuses("repo-id", knownPullRequestId, 5001, "proj");
        expect(statuses.map(status => status.id)).toEqual([5101, 5102]);
    });

    it("returns the seeded iteration status for a known id", async () => {
        const status = await client.getPullRequestIterationStatus("repo-id", knownPullRequestId, 5002, 5103);
        expect(status).toBe(pullRequestIterationStatuses[2]);
    });

    it("fabricates an iteration status for an unknown id", async () => {
        const status = await client.getPullRequestIterationStatus("repo-id", knownPullRequestId, 5001, Number.MAX_SAFE_INTEGER, "proj");
        expect(status.id).toBe(Number.MAX_SAFE_INTEGER);
        expect(status.state).toBe(GitStatusState.NotSet);
        expect(status.iterationId).toBe(5001);
    });

    it("fabricates an iteration status when the iteration does not match", async () => {
        const status = await client.getPullRequestIterationStatus("repo-id", knownPullRequestId, 5003, 5101);
        expect(status.iterationId).toBe(5003);
    });

    it("echoes the created iteration status", async () => {
        const input = makePullRequestStatus(5199, GitStatusState.Succeeded, 1);
        const created = await client.createPullRequestIterationStatus(input, "repo-id", knownPullRequestId, 5002, "proj");
        expect(created.id).toBe(5199);
        expect(created.state).toBe(GitStatusState.Succeeded);
        expect(created.iterationId).toBe(5002);
    });

    it("returns the seeded conflict for a known id", async () => {
        const conflict = await client.getPullRequestConflict("repo-id", knownPullRequestId, 5202, "proj");
        expect(conflict).toBe(pullRequestConflicts[1]);
    });

    it("fabricates a conflict for an unknown id", async () => {
        const conflict = await client.getPullRequestConflict("repo-id", knownPullRequestId, Number.MAX_SAFE_INTEGER);
        expect(conflict.conflictId).toBe(Number.MAX_SAFE_INTEGER);
        expect(conflict.resolutionStatus).toBe(GitResolutionStatus.Unresolved);
    });

    it("lists every conflict unfiltered", async () => {
        const conflicts = await client.getPullRequestConflicts("repo-id", knownPullRequestId);
        expect(conflicts.map(c => c.conflictId)).toEqual([5201, 5202, 5203, 5204]);
    });

    it("keeps only resolved conflicts", async () => {
        const conflicts = await client.getPullRequestConflicts("repo-id", knownPullRequestId, "proj", undefined, undefined, false, false, true);
        expect(conflicts.map(c => c.conflictId)).toEqual([5202, 5204]);
    });

    it("drops resolved conflicts", async () => {
        const conflicts = await client.getPullRequestConflicts("repo-id", knownPullRequestId, "proj", undefined, undefined, true, true, false);
        expect(conflicts.map(c => c.conflictId)).toEqual([5201, 5203]);
    });

    it("pages conflicts", async () => {
        const conflicts = await client.getPullRequestConflicts("repo-id", knownPullRequestId, "proj", 1, 2);
        expect(conflicts.map(c => c.conflictId)).toEqual([5202, 5203]);
    });

    it("echoes the updated conflict over the seeded one", async () => {
        const updated = await client.updatePullRequestConflict(
            { ...pullRequestConflicts[0], resolutionStatus: GitResolutionStatus.Resolved },
            "repo-id",
            knownPullRequestId,
            5202,
            "proj"
        );
        expect(updated.conflictId).toBe(5202);
        expect(updated.resolutionStatus).toBe(GitResolutionStatus.Resolved);
        expect(updated.conflictPath).toBe(pullRequestConflicts[0].conflictPath);
    });

    it("reports a succeeded result for every conflict update", async () => {
        const results = await client.updatePullRequestConflicts(
            [pullRequestConflicts[0], pullRequestConflicts[2]],
            "repo-id",
            knownPullRequestId,
            "proj"
        );
        expect(results.map(r => r.conflictId)).toEqual([5201, 5203]);
        expect(results.every(r => r.updateStatus === GitConflictUpdateStatus.Succeeded)).toBe(true);
        expect(results.every(r => r.updatedConflict.resolutionStatus === GitResolutionStatus.Resolved)).toBe(true);
    });

    it("returns the seeded thread for a known id", async () => {
        const thread = await client.getPullRequestThread("repo-id", knownPullRequestId, 5302, "proj", 2, 1);
        expect(thread).toBe(pullRequestThreads[1]);
    });

    it("fabricates a thread for an unknown id", async () => {
        const thread = await client.getPullRequestThread("repo-id", knownPullRequestId, Number.MAX_SAFE_INTEGER);
        expect(thread.id).toBe(Number.MAX_SAFE_INTEGER);
        expect(thread.status).toBe(CommentThreadStatus.Unknown);
        expect(thread.comments.map(c => c.id)).toEqual([Number.MAX_SAFE_INTEGER]);
    });

    it("echoes the updated thread over the seeded one", async () => {
        const updated = await client.updateThread(
            { ...pullRequestThreads[0], status: CommentThreadStatus.Closed },
            "repo-id",
            knownPullRequestId,
            5302,
            "proj"
        );
        expect(updated.id).toBe(5302);
        expect(updated.status).toBe(CommentThreadStatus.Closed);
    });

    it("returns the comments of a seeded thread", async () => {
        const comments = await client.getComments("repo-id", knownPullRequestId, 5301, "proj");
        expect(comments).toBe(pullRequestThreadComments);
    });

    it("fabricates a comment list for an unknown thread", async () => {
        const comments = await client.getComments("repo-id", knownPullRequestId, Number.MAX_SAFE_INTEGER);
        expect(comments.map(c => c.id)).toEqual([Number.MAX_SAFE_INTEGER]);
    });

    it("returns the seeded comment for a known thread and comment", async () => {
        const comment = await client.getComment("repo-id", knownPullRequestId, 5301, 5402, "proj");
        expect(comment).toBe(pullRequestThreadComments[1]);
    });

    it("fabricates a comment missing from a known thread", async () => {
        const comment = await client.getComment("repo-id", knownPullRequestId, 5301, Number.MAX_SAFE_INTEGER);
        expect(comment.id).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("fabricates a comment for an unknown thread", async () => {
        const comment = await client.getComment("repo-id", knownPullRequestId, Number.MAX_SAFE_INTEGER, 5402);
        expect(comment.id).toBe(5402);
        expect(comment).not.toBe(pullRequestThreadComments[1]);
    });

    it("echoes the updated comment over the seeded one", async () => {
        const updated = await client.updateComment(
            { ...makeComment(1), content: "reworded" },
            "repo-id",
            knownPullRequestId,
            5301,
            5403,
            "proj"
        );
        expect(updated.id).toBe(5403);
        expect(updated.content).toBe("reworded");
    });
});
