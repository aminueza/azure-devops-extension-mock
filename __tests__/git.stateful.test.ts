import {
    CommentThreadStatus,
    GitAsyncOperationStatus,
    GitResolutionStatus,
    GitRestClient,
    GitStatusState
} from "azure-devops-extension-api/Git";
import { Operation } from "azure-devops-extension-api/WebApi";

import { getClient, stateful } from "../azure-devops-extension-api";
import { fake } from "../azure-devops-extension-api/common/fixtures";
import {
    advSecProjectIds,
    annotatedTags,
    cherryPickConflicts,
    cherryPicks,
    commentLikes,
    commitStatuses,
    deletedRepositories,
    enablementStatuses,
    forkSyncRequests,
    importRequests,
    likedComments,
    likingUser,
    merges,
    pullRequestAttachments,
    pullRequestConflicts,
    pullRequestIterationStatuses,
    pullRequestLabels,
    pullRequestReviewers,
    pullRequestStatuses,
    pullRequestThreadComments,
    pullRequestThreads,
    pullRequests,
    refFavorites,
    refs,
    repositories,
    revertConflicts,
    reverts
} from "../azure-devops-extension-api/git/Data";

const zeroObjectId = "0".repeat(40);
const everyRepositoryId = "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF";

const trackedLists = (): unknown[][] => [
    annotatedTags,
    cherryPickConflicts,
    cherryPicks,
    commitStatuses,
    deletedRepositories,
    enablementStatuses,
    forkSyncRequests,
    importRequests,
    likedComments,
    merges,
    pullRequestAttachments,
    pullRequestConflicts,
    pullRequestIterationStatuses,
    pullRequestLabels,
    pullRequestReviewers,
    pullRequestStatuses,
    pullRequestThreadComments,
    pullRequestThreads,
    pullRequests,
    refFavorites,
    refs,
    repositories,
    revertConflicts,
    reverts,
    ...pullRequestThreads.map(thread => thread.comments),
    ...likedComments.map(comment => comment.usersLiked)
];

const snapshot = (): Array<[unknown[], unknown[]]> => trackedLists().map(list => [list, [...list]]);

const expectUntouched = (taken: Array<[unknown[], unknown[]]>): void => {
    taken.forEach(([list, copy]) => {
        expect(list).toHaveLength(copy.length);
        list.forEach((entry, index) => expect(entry).toBe(copy[index]));
    });
};

const client = getClient(GitRestClient);

const writeEverything = async (): Promise<void> => {
    const repository = await client.createRepository({ name: "written" } as any, "proj");
    await client.updateRepository({ name: "rewritten" } as any, repository.id, "proj");
    await client.deleteRepository(repository.id, "proj");
    await client.deleteRepository(repositories[4].id, "proj");
    await client.restoreRepositoryFromRecycleBin({ deleted: false }, "proj", deletedRepositories[0].id);
    await client.deleteRepositoryFromRecycleBin("proj", deletedRepositories[1].id);
    await client.createPullRequest({ pullRequestId: 990101, title: "written" } as any, "repo");
    await client.updatePullRequest({ title: "rewritten" } as any, "repo", pullRequests[0].pullRequestId);
    await client.createThread({ id: 990201, comments: [] } as any, "repo", 1);
    await client.updateThread({ status: CommentThreadStatus.Closed } as any, "repo", 1, 5302);
    await client.createComment({ content: "written" } as any, "repo", 1, 5301);
    await client.updateComment({ content: "rewritten" } as any, "repo", 1, 5301, 5401);
    await client.deleteComment("repo", 1, 5301, 5402);
    await client.createPullRequestReviewer({ vote: 5 } as any, "repo", 1, "reviewer-written");
    await client.createPullRequestReviewers([{ id: "reviewer-batch" }] as any, "repo", 1);
    await client.createUnmaterializedPullRequestReviewer({ id: "reviewer-team", vote: 0 } as any, "repo", 1);
    await client.updatePullRequestReviewer({ vote: -10 } as any, "repo", 1, "reviewer-waiting");
    await client.updatePullRequestReviewers([{ id: "reviewer-approved", vote: 0 }] as any, "repo", 1);
    await client.deletePullRequestReviewer("repo", 1, "reviewer-required");
    await client.createPullRequestLabel({ name: "written" }, "repo", 1);
    await client.deletePullRequestLabels("repo", 1, "bug");
    await client.createPullRequestStatus({ id: 390, iterationId: 1 } as any, "repo", 1);
    await client.deletePullRequestStatus("repo", 1, 301);
    await client.updatePullRequestStatuses([{ op: Operation.Remove, path: "/302" }] as any, "repo", 1);
    await client.createPullRequestIterationStatus({ id: 5190 } as any, "repo", 1, 5001);
    await client.deletePullRequestIterationStatus("repo", 1, 5001, 5101);
    await client.updatePullRequestIterationStatuses([{ op: Operation.Remove, path: "/5102" }] as any, "repo", 1, 5001);
    await client.createCommitStatus({ id: 190 } as any, "commit", "repo");
    await client.updatePullRequestConflict({ conflictPath: "/written" } as any, "repo", 1, 5201);
    await client.updatePullRequestConflicts([{ conflictId: 5203, conflictPath: "/written" }] as any, "repo", 1);
    await client.updateCherryPickConflict({ conflictPath: "/written" } as any, "repo", 6001, 6201);
    await client.updateCherryPickConflicts([{ conflictId: 6203, conflictPath: "/written" }] as any, "repo", 6001);
    await client.updateRevertConflict({ conflictPath: "/written" } as any, "repo", 6101, 6302);
    await client.updateRevertConflicts([{ conflictId: 6301, conflictPath: "/written" }] as any, "repo", 6101);
    await client.createCherryPick({ generatedRefName: "refs/heads/cherry-pick/written" } as any, "proj", "repo");
    await client.createRevert({ generatedRefName: "refs/heads/revert/written" } as any, "proj", "repo");
    await client.createAttachment("content", "written.txt", "repo", 1);
    await client.deleteAttachment("design.png", "repo", 1);
    await client.createLike("repo", 1, 1, 6501);
    await client.deleteLike("repo", 1, 1, 6502);
    await client.createAnnotatedTag({ name: "v9.0.0", objectId: "9".repeat(40) } as any, "proj", "repo");
    await client.createImportRequest({ importRequestId: 990301 } as any, "proj", "repo");
    await client.updateImportRequest(
        { status: GitAsyncOperationStatus.Abandoned } as any,
        "proj",
        "repo",
        importRequests[0].importRequestId
    );
    await client.createForkSyncRequest({ operationId: 990401 } as any, "repo");
    await client.createMergeRequest({ comment: "written", mergeOperationId: 990501 } as any, "proj", "repo");
    await client.createFavorite({ name: "refs/heads/written", repositoryId: "repo", identityId: "me" } as any, "proj");
    await client.deleteRefFavorite("proj", refFavorites[0].id);
    await client.updateRefs(
        [
            { name: "refs/heads/written", oldObjectId: zeroObjectId, newObjectId: "a".repeat(40) },
            { name: "refs/heads/main", oldObjectId: refs[0].objectId, newObjectId: "b".repeat(40) },
            { name: "refs/tags/v1.0.0", oldObjectId: refs[3].objectId, newObjectId: zeroObjectId }
        ] as any,
        "repo"
    );
    await client.updateEnablementStatus([
        { projectId: advSecProjectIds[1], repositoryId: everyRepositoryId, newStatus: true } as any
    ]);
    await client.deleteEnablementStatus(false, false, [advSecProjectIds[0]]);
};

describe("GitRestClient mock in stateful mode", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => stateful.enable());

    afterEach(() => stateful.disable());

    it("keeps created, updated and deleted repositories", async () => {
        const taken = snapshot();
        const created = await client.createRepository({ name: "stateful-repo" } as any, "proj");
        expect(await client.getRepository(created.id)).toBe(created);
        expect(await client.getRepository("stateful-repo")).toBe(created);
        expect(await client.getRepositories("proj")).toContain(created);
        expect((await client.getRepositoriesPaged("proj", false, false, false, "stateful-repo")).slice()).toEqual([
            created
        ]);
        expect(await client.getPermission("proj", created.id)).toBe(true);

        const recreated = await client.createRepository({ id: created.id, name: "stateful-again" } as any, "proj");
        expect(await client.getRepository(created.id)).toBe(recreated);
        expect(repositories).toHaveLength(6);

        const updated = await client.updateRepository({ name: "stateful-renamed" } as any, created.id, "proj");
        expect(await client.getRepository(created.id)).toBe(updated);
        expect(repositories).toHaveLength(6);

        await client.deleteRepository("not-a-repository", "proj");
        expect(repositories).toHaveLength(6);
        expect(deletedRepositories).toHaveLength(3);

        await client.deleteRepository(created.id, "proj");
        expect(await client.getRepositories("proj")).not.toContain(updated);
        expect(await client.getPermission("proj", created.id)).toBe(false);
        const binned = (await client.getRecycleBinRepositories("proj")).find(r => r.id === created.id);
        expect(binned).toMatchObject({ name: "stateful-renamed", project: updated.project });
        expect(await client.getDeletedRepositories("proj")).toContain(binned);

        stateful.reset();
        expectUntouched(taken);
    });

    it("moves repositories out of the recycle bin", async () => {
        const taken = snapshot();
        const [first, second, third] = deletedRepositories;

        const kept = await client.restoreRepositoryFromRecycleBin({ deleted: true }, "proj", first.id);
        expect(kept.isDisabled).toBe(true);
        expect(await client.getRecycleBinRepositories("proj")).toContain(first);
        expect(repositories.some(r => r.id === first.id)).toBe(false);

        const restored = await client.restoreRepositoryFromRecycleBin({ deleted: false }, "proj", first.id);
        expect(restored.name).toBe(first.name);
        expect(await client.getRepository(first.id)).toBe(restored);
        expect(await client.getRepositories("proj")).toContain(restored);
        expect(await client.getRecycleBinRepositories("proj")).not.toContain(first);

        const fabricated = await client.restoreRepositoryFromRecycleBin({ deleted: false }, "proj", "never-deleted");
        expect(await client.getRepository("never-deleted")).toBe(fabricated);

        await client.deleteRepositoryFromRecycleBin("proj", second.id);
        expect(await client.getRecycleBinRepositories("proj")).toEqual([third]);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and updated pull requests", async () => {
        const taken = snapshot();
        const created = await client.createPullRequest({ pullRequestId: 990001, title: "stateful" } as any, "repo");
        expect(await client.getPullRequest("repo", 990001)).toBe(created);
        expect(await client.getPullRequestById(990001)).toBe(created);
        expect(await client.getPullRequests("repo", {} as any)).toContain(created);
        expect(await client.getPullRequestsByProject("proj", {} as any)).toContain(created);
        expect((await client.getPullRequestCommits("repo", 990001)).continuationToken).toBeNull();
        expect((await client.getPullRequestFilesDiff("repo", 990001)).pullRequestTitle).toBe("stateful");

        const updated = await client.updatePullRequest({ title: "stateful, edited" } as any, "repo", 990001);
        expect(await client.getPullRequest("repo", 990001)).toBe(updated);
        expect(pullRequests).toHaveLength(6);

        await client.createPullRequest({ pullRequestId: 990001, title: "stateful, again" } as any, "repo");
        expect(pullRequests).toHaveLength(6);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and updated threads", async () => {
        const taken = snapshot();
        const created = await client.createThread({ id: 990002, comments: [] } as any, "repo", 1);
        expect(await client.getPullRequestThread("repo", 1, 990002)).toBe(created);
        expect(await client.getComments("repo", 1, 990002)).toEqual([]);

        const updated = await client.updateThread({ status: CommentThreadStatus.Closed } as any, "repo", 1, 5301);
        expect(await client.getPullRequestThread("repo", 1, 5301)).toBe(updated);
        expect(updated.status).toBe(CommentThreadStatus.Closed);
        expect(pullRequestThreads).toHaveLength(3);

        const fabricated = await client.updateThread({ status: CommentThreadStatus.Fixed } as any, "repo", 1, 990003);
        expect(await client.getPullRequestThread("repo", 1, 990003)).toBe(fabricated);
        expect(pullRequestThreads).toHaveLength(4);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created, updated and deleted comments", async () => {
        const taken = snapshot();
        const first = await client.createComment({ content: "first" } as any, "repo", 1, 5301);
        const second = await client.createComment({ content: "second" } as any, "repo", 1, 5301);
        expect([first.id, second.id]).toEqual([5404, 5405]);
        expect(await client.getComment("repo", 1, 5301, 5404)).toBe(first);
        expect(await client.getComments("repo", 1, 5301)).toEqual([...pullRequestThreadComments, first, second]);

        const replaced = await client.createComment({ id: 5401, content: "replaced" } as any, "repo", 1, 5301);
        expect(await client.getComment("repo", 1, 5301, 5401)).toBe(replaced);
        expect(await client.getComments("repo", 1, 5301)).toHaveLength(5);

        await client.createThread({ id: 990004, comments: [] } as any, "repo", 1);
        const opening = await client.createComment({ content: "opening" } as any, "repo", 1, 990004);
        expect(opening.id).toBe(1);
        expect(await client.getComments("repo", 1, 990004)).toEqual([opening]);

        const orphan = await client.createComment({ content: "orphan" } as any, "repo", 1, 990005);
        expect(orphan.id).toBe(1);
        expect(pullRequestThreads.some(thread => thread.id === 990005)).toBe(false);

        const updated = await client.updateComment({ content: "edited" } as any, "repo", 1, 5301, 5402);
        expect(await client.getComment("repo", 1, 5301, 5402)).toBe(updated);
        expect(updated.content).toBe("edited");
        expect(await client.getComments("repo", 1, 5301)).toHaveLength(5);

        const appended = await client.updateComment({ content: "late" } as any, "repo", 1, 5301, 5499);
        expect(await client.getComment("repo", 1, 5301, 5499)).toBe(appended);
        await client.updateComment({ content: "orphan" } as any, "repo", 1, 990005, 1);
        expect(pullRequestThreads.some(thread => thread.id === 990005)).toBe(false);

        await client.deleteComment("repo", 1, 5301, 5403);
        await client.deleteComment("repo", 1, 990005, 1);
        const remaining = await client.getComments("repo", 1, 5301);
        expect(remaining.map(comment => comment.id)).toEqual([5401, 5402, 5404, 5405, 5499]);

        stateful.reset();
        expectUntouched(taken);
        expect(await client.getComments("repo", 1, 5301)).toBe(pullRequestThreadComments);
        expect(pullRequestThreadComments.map(comment => comment.id)).toEqual([5401, 5402, 5403]);
    });

    it("keeps created, updated and deleted reviewers", async () => {
        const taken = snapshot();
        const created = await client.createPullRequestReviewer({ vote: 10 } as any, "repo", 1, "reviewer-new");
        expect(await client.getPullRequestReviewer("repo", 1, "reviewer-new")).toBe(created);
        expect(await client.getPullRequestReviewers("repo", 1)).toContain(created);

        const batch = await client.createPullRequestReviewers(
            [{ id: "reviewer-batch" }, { id: "reviewer-approved" }] as any,
            "repo",
            1
        );
        expect(await client.getPullRequestReviewer("repo", 1, "reviewer-batch")).toBe(batch[0]);
        expect(await client.getPullRequestReviewer("repo", 1, "reviewer-approved")).toBe(batch[1]);
        expect(pullRequestReviewers).toHaveLength(5);

        const team = await client.createUnmaterializedPullRequestReviewer(
            { id: "reviewer-team", vote: 5 } as any,
            "repo",
            1
        );
        expect(await client.getPullRequestReviewer("repo", 1, "reviewer-team")).toBe(team);

        const updated = await client.updatePullRequestReviewer({ vote: -10 } as any, "repo", 1, "reviewer-waiting");
        expect(await client.getPullRequestReviewer("repo", 1, "reviewer-waiting")).toBe(updated);
        expect(updated.vote).toBe(-10);
        expect(pullRequestReviewers).toHaveLength(6);

        await client.updatePullRequestReviewers(
            [
                { id: "reviewer-required", vote: 5 },
                { id: "reviewer-unknown", vote: 10 }
            ] as any,
            "repo",
            1
        );
        expect(await client.getPullRequestReviewer("repo", 1, "reviewer-required")).toMatchObject({
            isRequired: true,
            vote: 5
        });
        expect(pullRequestReviewers).toHaveLength(6);

        await client.deletePullRequestReviewer("repo", 1, "reviewer-new");
        expect((await client.getPullRequestReviewers("repo", 1)).map(reviewer => reviewer.id)).toEqual([
            "reviewer-approved",
            "reviewer-waiting",
            "reviewer-required",
            "reviewer-batch",
            "reviewer-team"
        ]);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and deleted labels", async () => {
        const taken = snapshot();
        const created = await client.createPullRequestLabel({ name: "urgent" }, "repo", 1);
        expect(await client.getPullRequestLabel("repo", 1, "urgent")).toBe(created);
        expect(await client.getPullRequestLabel("repo", 1, "label-urgent")).toBe(created);
        expect(await client.getPullRequestLabels("repo", 1)).toContain(created);

        expect(await client.createPullRequestLabel({ name: "urgent" }, "repo", 1)).toBe(created);
        expect(await client.createPullRequestLabel({ name: "bug" }, "repo", 1)).toBe(taken[13][1][0]);
        expect(pullRequestLabels).toHaveLength(4);

        await client.deletePullRequestLabels("repo", 1, "urgent");
        await client.deletePullRequestLabels("repo", 1, "label-bug");
        expect((await client.getPullRequestLabels("repo", 1)).map(label => label.name)).toEqual([
            "documentation",
            "stale"
        ]);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and deleted pull request statuses", async () => {
        const taken = snapshot();
        const created = await client.createPullRequestStatus(
            { id: 399, iterationId: 1, state: GitStatusState.Succeeded } as any,
            "repo",
            1
        );
        expect(await client.getPullRequestStatus("repo", 1, 399)).toBe(created);
        expect(await client.getPullRequestStatuses("repo", 1)).toContain(created);

        await client.createPullRequestStatus({ id: 399, iterationId: 1 } as any, "repo", 1);
        expect(pullRequestStatuses).toHaveLength(4);

        await client.deletePullRequestStatus("repo", 1, 399);
        expect((await client.getPullRequestStatuses("repo", 1)).map(status => status.id)).toEqual([301, 302, 303]);

        await client.updatePullRequestStatuses(
            [
                { op: Operation.Remove, path: "/301" },
                { op: Operation.Replace, path: "/302", value: "kept" }
            ] as any,
            "repo",
            1
        );
        expect((await client.getPullRequestStatuses("repo", 1)).map(status => status.id)).toEqual([302, 303]);

        await client.updatePullRequestStatuses({} as any, "repo", 1);
        expect(pullRequestStatuses).toHaveLength(2);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and deleted iteration statuses", async () => {
        const taken = snapshot();
        const created = await client.createPullRequestIterationStatus({ id: 5199 } as any, "repo", 1, 5002);
        expect(await client.getPullRequestIterationStatus("repo", 1, 5002, 5199)).toBe(created);
        expect(await client.getPullRequestIterationStatuses("repo", 1, 5002)).toContain(created);

        await client.createPullRequestIterationStatus({ id: 5199 } as any, "repo", 1, 5002);
        await client.createPullRequestIterationStatus({ id: 5199 } as any, "repo", 1, 5003);
        expect(pullRequestIterationStatuses).toHaveLength(5);

        await client.deletePullRequestIterationStatus("repo", 1, 5002, 5199);
        expect((await client.getPullRequestIterationStatuses("repo", 1, 5002)).map(status => status.id)).toEqual([
            5103
        ]);
        expect(await client.getPullRequestIterationStatuses("repo", 1, 5003)).toHaveLength(1);

        await client.updatePullRequestIterationStatuses(
            [
                { op: Operation.Remove, path: "/5101" },
                { op: Operation.Remove, path: "/5103" }
            ] as any,
            "repo",
            1,
            5001
        );
        expect((await client.getPullRequestIterationStatuses("repo", 1, 5001)).map(status => status.id)).toEqual([
            5102
        ]);
        expect(await client.getPullRequestIterationStatuses("repo", 1, 5002)).toHaveLength(1);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created commit statuses", async () => {
        const taken = snapshot();
        const created = await client.createCommitStatus(
            { id: 199, state: GitStatusState.Succeeded } as any,
            "commit",
            "repo"
        );
        expect(await client.getStatuses("commit", "repo")).toEqual([...taken[3][1], created]);

        const replaced = await client.createCommitStatus({ id: 199 } as any, "commit", "repo");
        expect(await client.getStatuses("commit", "repo")).toEqual([...taken[3][1], replaced]);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps updated conflicts", async () => {
        const taken = snapshot();
        const pullRequestConflict = await client.updatePullRequestConflict(
            { resolutionStatus: GitResolutionStatus.Resolved } as any,
            "repo",
            1,
            5201
        );
        expect(await client.getPullRequestConflict("repo", 1, 5201)).toBe(pullRequestConflict);
        const pullRequestResults = await client.updatePullRequestConflicts(
            [{ conflictId: 5203, conflictPath: "/package.json" }] as any,
            "repo",
            1
        );
        expect(await client.getPullRequestConflict("repo", 1, 5203)).toBe(pullRequestResults[0].updatedConflict);
        expect(await client.getPullRequestConflicts("repo", 1, undefined, 0, 10, false, true)).toEqual([]);
        expect(pullRequestConflicts).toHaveLength(4);

        const cherryPickConflict = await client.updateCherryPickConflict(
            { resolutionStatus: GitResolutionStatus.Resolved } as any,
            "repo",
            6001,
            6201
        );
        expect(await client.getCherryPickConflict("repo", 6001, 6201)).toBe(cherryPickConflict);
        const cherryPickResults = await client.updateCherryPickConflicts(
            [{ conflictId: 6203, conflictPath: "/package.json" }] as any,
            "repo",
            6001
        );
        expect(await client.getCherryPickConflict("repo", 6001, 6203)).toBe(cherryPickResults[0].updatedConflict);
        expect(
            (await client.getCherryPickConflicts("repo", 6001, undefined, undefined, undefined, true)).slice()
        ).toEqual([]);
        expect(cherryPickConflicts).toHaveLength(4);

        const revertConflict = await client.updateRevertConflict(
            { resolutionStatus: GitResolutionStatus.Resolved } as any,
            "repo",
            6101,
            6302
        );
        expect(await client.getRevertConflict("repo", 6101, 6302)).toBe(revertConflict);
        const revertResults = await client.updateRevertConflicts(
            [{ conflictId: 6399, conflictPath: "/new.ts" }] as any,
            "repo",
            6101
        );
        expect(await client.getRevertConflict("repo", 6101, 6399)).toBe(revertResults[0].updatedConflict);
        expect((await client.getRevertConflicts("repo", 6101, undefined, undefined, undefined, true)).slice()).toEqual(
            []
        );
        expect(revertConflicts).toHaveLength(4);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created cherry-picks and reverts", async () => {
        const taken = snapshot();
        const cherryPick = await client.createCherryPick(
            { generatedRefName: "refs/heads/cherry-pick/stateful" } as any,
            "proj",
            "repo"
        );
        expect(await client.getCherryPick("proj", cherryPick.cherryPickId, "repo")).toBe(cherryPick);
        expect(await client.getCherryPickForRefName("proj", "repo", "refs/heads/cherry-pick/stateful")).toBe(
            cherryPick
        );
        const secondCherryPick = await client.createCherryPick(
            { generatedRefName: "refs/heads/cherry-pick/second" } as any,
            "proj",
            "repo"
        );
        expect(await client.getCherryPick("proj", cherryPick.cherryPickId, "repo")).toBe(secondCherryPick);
        expect(cherryPicks).toHaveLength(4);

        const revert = await client.createRevert(
            { generatedRefName: "refs/heads/revert/stateful" } as any,
            "proj",
            "repo"
        );
        expect(await client.getRevert("proj", revert.revertId, "repo")).toBe(revert);
        expect(await client.getRevertForRefName("proj", "repo", "refs/heads/revert/stateful")).toBe(revert);
        const secondRevert = await client.createRevert(
            { generatedRefName: "refs/heads/revert/second" } as any,
            "proj",
            "repo"
        );
        expect(await client.getRevert("proj", revert.revertId, "repo")).toBe(secondRevert);
        expect(reverts).toHaveLength(4);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and deleted attachments", async () => {
        const taken = snapshot();
        const created = await client.createAttachment("content", "stateful.txt", "repo", 1);
        expect(await client.getAttachments("repo", 1)).toContain(created);

        const replaced = await client.createAttachment("other", "stateful.txt", "repo", 1);
        expect(await client.getAttachments("repo", 1)).toContain(replaced);
        expect(pullRequestAttachments).toHaveLength(4);

        await client.deleteAttachment("stateful.txt", "repo", 1);
        await client.deleteAttachment("design.png", "repo", 1);
        expect((await client.getAttachments("repo", 1)).map(attachment => attachment.displayName)).toEqual([
            "trace.log",
            "notes.md"
        ]);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and deleted likes", async () => {
        const taken = snapshot();
        await client.createLike("repo", 1, 1, 6501);
        await client.createLike("repo", 1, 1, 6501);
        expect(await client.getLikes("repo", 1, 1, 6501)).toEqual([...commentLikes, likingUser]);

        await client.createLike("repo", 1, 1, 6599);
        expect(await client.getLikes("repo", 1, 1, 6599)).toEqual([likingUser]);

        await client.deleteLike("repo", 1, 1, 6501);
        await client.deleteLike("repo", 1, 1, 6598);
        expect(await client.getLikes("repo", 1, 1, 6501)).toEqual(commentLikes);
        expect(likedComments).toHaveLength(3);

        stateful.reset();
        expectUntouched(taken);
        expect(await client.getLikes("repo", 1, 1, 6501)).toBe(commentLikes);
    });

    it("keeps created annotated tags, merges and fork sync requests", async () => {
        const taken = snapshot();
        const tag = await client.createAnnotatedTag(
            { name: "v9.0.0", objectId: "9".repeat(40) } as any,
            "proj",
            "repo"
        );
        expect(await client.getAnnotatedTag("proj", "repo", "9".repeat(40))).toBe(tag);
        await client.createAnnotatedTag({ name: "v9.0.1", objectId: "9".repeat(40) } as any, "proj", "repo");
        expect(annotatedTags).toHaveLength(4);

        const merge = await client.createMergeRequest(
            { comment: "stateful", mergeOperationId: 990006 } as any,
            "proj",
            "repo"
        );
        expect(await client.getMergeRequest("proj", "repo", 990006)).toBe(merge);
        await client.createMergeRequest({ comment: "again", mergeOperationId: 990006 } as any, "proj", "repo", true);
        expect(merges).toHaveLength(3);

        const sync = await client.createForkSyncRequest({ operationId: 990007 } as any, "repo");
        expect(await client.getForkSyncRequest("repo", 990007)).toBe(sync);
        expect(await client.getForkSyncRequests("repo")).toContain(sync);
        await client.createForkSyncRequest({ operationId: 990007 } as any, "repo");
        expect(forkSyncRequests).toHaveLength(4);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and updated import requests", async () => {
        const taken = snapshot();
        const created = await client.createImportRequest({ importRequestId: 990008 } as any, "proj", "repo");
        expect(await client.getImportRequest("proj", "repo", 990008)).toBe(created);
        expect(await client.queryImportRequests("proj", "repo")).toContain(created);

        const updated = await client.updateImportRequest(
            { status: GitAsyncOperationStatus.Abandoned } as any,
            "proj",
            "repo",
            990008
        );
        expect(await client.getImportRequest("proj", "repo", 990008)).toBe(updated);
        expect(await client.queryImportRequests("proj", "repo")).not.toContain(updated);
        expect(await client.queryImportRequests("proj", "repo", true)).toContain(updated);
        expect(importRequests).toHaveLength(4);

        stateful.reset();
        expectUntouched(taken);
    });

    it("keeps created and deleted ref favorites", async () => {
        const taken = snapshot();
        const created = await client.createFavorite(
            { name: "refs/heads/stateful", repositoryId: repositories[0].id, identityId: "stateful-user" } as any,
            "proj"
        );
        expect(await client.getRefFavorite("proj", created.id)).toBe(created);
        expect(await client.getRefFavorites("proj", repositories[0].id, "stateful-user")).toEqual([created]);
        expect(await client.getRefFavoritesForProject("proj")).toContain(created);

        await client.createFavorite({ ...created, name: "refs/heads/again" }, "proj");
        expect(refFavorites).toHaveLength(5);

        await client.deleteRefFavorite("proj", created.id);
        expect(await client.getRefFavoritesForProject("proj", "stateful-user")).toEqual([]);
        expect(refFavorites).toHaveLength(4);

        stateful.reset();
        expectUntouched(taken);
    });

    it("applies ref updates to the refs", async () => {
        const taken = snapshot();
        const main = refs[0];
        const results = await client.updateRefs(
            [
                { name: "refs/heads/stateful", oldObjectId: zeroObjectId, newObjectId: "a".repeat(40) },
                { name: "refs/heads/main", oldObjectId: main.objectId, newObjectId: "b".repeat(40) },
                { name: "refs/tags/v1.0.0", oldObjectId: refs[3].objectId, newObjectId: zeroObjectId }
            ] as any,
            "repo"
        );
        expect(results.map(result => result.success)).toEqual([true, true, true]);

        const listed = await client.getRefs("repo");
        expect(listed.map(ref => ref.name)).toEqual([
            "refs/heads/main",
            "refs/heads/develop",
            taken[20][1].map(ref => (ref as { name: string }).name)[2],
            "refs/heads/stateful"
        ]);
        expect(listed[0]).toEqual({ ...main, objectId: "b".repeat(40) });
        expect((await client.getRefs("repo", "proj", "stateful")).map(ref => ref.objectId)).toEqual(["a".repeat(40)]);
        expect((await client.getRefs("repo", "proj", "tags")).slice()).toEqual([]);

        stateful.reset();
        expectUntouched(taken);
        expect(refs.continuationToken).toBeNull();
    });

    it("keeps updated and deleted enablement statuses", async () => {
        const taken = snapshot();
        const [firstProject, secondProject] = advSecProjectIds;
        await client.updateEnablementStatus([
            {
                projectId: firstProject,
                repositoryId: repositories[2].id,
                newStatus: true,
                newDependabotStatus: true,
                newDependencyScanningInjectionEnablementStatus: false
            } as any
        ]);
        expect((await client.getEnablementStatus([firstProject]))[2]).toMatchObject({
            dependabotEnabled: true,
            dependencyScanningInjectionEnabled: false,
            enabled: true,
            repositoryId: repositories[2].id
        });
        expect(enablementStatuses).toHaveLength(5);

        expect(await client.getEnableOnCreateProject(secondProject)).toBe(false);
        await client.updateEnablementStatus([
            { projectId: secondProject, repositoryId: everyRepositoryId, newStatus: true } as any
        ]);
        expect((await client.getEnablementStatus([secondProject])).map(status => status.enabled)).toEqual([true, true]);
        expect(await client.getEnableOnCreateProject(secondProject)).toBe(true);

        await client.updateEnablementStatus([
            { projectId: "stateful-project", repositoryId: "stateful-repo", newStatus: true } as any
        ]);
        expect(await client.getEnablementStatus(["stateful-project"])).toMatchObject([
            { enabled: true, repositoryId: "stateful-repo" }
        ]);
        expect(enablementStatuses).toHaveLength(6);

        await client.deleteEnablementStatus(false);
        expect(enablementStatuses).toHaveLength(6);
        await client.deleteEnablementStatus(false, false, [firstProject]);
        expect(await client.getEnablementStatus([firstProject])).toEqual([]);
        expect(enablementStatuses).toHaveLength(3);
        await client.deleteEnablementStatus(true);
        expect(await client.getEnablementStatus()).toEqual([]);

        stateful.reset();
        expectUntouched(taken);
    });

    it("restores every seeded list after a mixed run of writes", async () => {
        const taken = snapshot();
        await writeEverything();
        expect(repositories).not.toContain(taken[21][1][4]);
        expect(refs.map(ref => ref.name)).toContain("refs/heads/written");
        stateful.reset();
        expectUntouched(taken);
    });
});

describe("GitRestClient mock with stateful mode off", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("leaves every seeded list untouched", async () => {
        expect(stateful.isEnabled()).toBe(false);
        const taken = snapshot();
        await writeEverything();
        expectUntouched(taken);
        expect((await client.createComment({ content: "no id" } as any, "repo", 1, 5301)).id).toBe(1);
        expect(await client.getLikes("repo", 1, 1, 6501)).toBe(commentLikes);
    });

    it("draws no extra random values in the methods that used to do nothing", async () => {
        fake.seed(20261013);
        const expected = fake.number.int();
        fake.seed(20261013);
        await client.deleteRepository(repositories[0].id, "proj");
        await client.createLike("repo", 1, 1, 6599);
        await client.updateRefs([{ name: "refs/heads/unseeded", newObjectId: "c".repeat(40) }] as any, "repo");
        await client.updateEnablementStatus([
            { projectId: "unseeded-project", repositoryId: "unseeded-repo", newStatus: true } as any
        ]);
        expect(fake.number.int()).toBe(expected);
    });
});
