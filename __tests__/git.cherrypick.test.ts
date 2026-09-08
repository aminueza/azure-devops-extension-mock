import {
    GitAsyncRefOperationParameters,
    GitConflictUpdateStatus,
    GitResolutionStatus,
    GitRestClient
} from "azure-devops-extension-api/Git";

import { getClient } from "../azure-devops-extension-api";
import {
    cherryPickConflicts,
    cherryPicks,
    commentLikes,
    commits,
    likedComments,
    makeGitRepository,
    pullRequestAttachments,
    revertConflicts,
    reverts
} from "../azure-devops-extension-api/git/Data";

describe("GitRestClient mock cherry pick, revert, attachments and likes", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GitRestClient);

    const unknownId = Number.MAX_SAFE_INTEGER;
    const unknownSha = "0".repeat(40);
    const knownCherryPickId = 6001;
    const knownCherryPickRefName = "refs/heads/cherry-pick/release";
    const fabricatedOperationId = 6011;

    const knownCommentId = 6501;
    const knownRevertId = 6101;
    const knownRevertRefName = "refs/heads/revert/release";
    const fabricatedRevertId = 6111;

    const cherryPickParameters: GitAsyncRefOperationParameters = {
        generatedRefName: "refs/heads/cherry-pick/topic",
        ontoRefName: "refs/heads/main",
        repository: makeGitRepository(),
        source: { commitList: [commits[0]], pullRequestId: 4242 }
    };

    const revertParameters: GitAsyncRefOperationParameters = {
        generatedRefName: "refs/heads/revert/topic",
        ontoRefName: "refs/heads/main",
        repository: makeGitRepository(),
        source: { commitList: [commits[1]], pullRequestId: 4343 }
    };

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["createCherryPick", () => client.createCherryPick(cherryPickParameters, "proj", "repo-id")],
        ["getCherryPick", () => client.getCherryPick("proj", knownCherryPickId, "repo-id")],
        ["getCherryPickForRefName", () => client.getCherryPickForRefName("proj", "repo-id", knownCherryPickRefName)],
        ["getCherryPickRelationships", () => client.getCherryPickRelationships("repo-id", commits[0].commitId)],
        ["getCherryPickConflict", () => client.getCherryPickConflict("repo-id", knownCherryPickId, 6201)],
        ["getCherryPickConflicts", () => client.getCherryPickConflicts("repo-id", knownCherryPickId)],
        ["updateCherryPickConflict", () => client.updateCherryPickConflict(
            cherryPickConflicts[0],
            "repo-id",
            knownCherryPickId,
            6201
        )],
        ["updateCherryPickConflicts", () => client.updateCherryPickConflicts(
            [cherryPickConflicts[0]],
            "repo-id",
            knownCherryPickId
        )],
        ["createRevert", () => client.createRevert(revertParameters, "proj", "repo-id")],
        ["getRevert", () => client.getRevert("proj", knownRevertId, "repo-id")],
        ["getRevertForRefName", () => client.getRevertForRefName("proj", "repo-id", knownRevertRefName)],
        ["getRevertConflict", () => client.getRevertConflict("repo-id", knownRevertId, 6301)],
        ["getRevertConflicts", () => client.getRevertConflicts("repo-id", knownRevertId)],
        ["updateRevertConflict", () => client.updateRevertConflict(
            revertConflicts[0],
            "repo-id",
            knownRevertId,
            6301
        )],
        ["updateRevertConflicts", () => client.updateRevertConflicts(
            [revertConflicts[0]],
            "repo-id",
            knownRevertId
        )],
        ["createAttachment", () => client.createAttachment("payload", "design.png", "repo-id", 42)],
        ["getAttachmentContent", () => client.getAttachmentContent("design.png", "repo-id", 42)],
        ["getAttachmentZip", () => client.getAttachmentZip("design.png", "repo-id", 42)],
        ["getAttachments", () => client.getAttachments("repo-id", 42)],
        ["getLikes", () => client.getLikes("repo-id", 42, 5301, knownCommentId)]
    ];

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteAttachment", () => client.deleteAttachment("design.png", "repo-id", 42, "proj")],
        ["createLike", () => client.createLike("repo-id", 42, 5301, knownCommentId, "proj")],
        ["deleteLike", () => client.deleteLike("repo-id", 42, 5301, knownCommentId, "proj")]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("echoes the parameters of a created cherry pick", async () => {
        const created = await client.createCherryPick(cherryPickParameters, "proj", "repo-id");
        expect(created.cherryPickId).toBe(fabricatedOperationId);
        expect(created.parameters).toBe(cherryPickParameters);
    });

    it("returns the seeded cherry pick for a known id", async () => {
        const pick = await client.getCherryPick("proj", 6002, "repo-id");
        expect(pick).toBe(cherryPicks[1]);
    });

    it("fabricates a cherry pick for an unknown id", async () => {
        const pick = await client.getCherryPick("proj", unknownId, "repo-id");
        expect(pick.cherryPickId).toBe(unknownId);
        expect(pick.parameters.generatedRefName).toBe(`refs/heads/cherry-pick/${unknownId}`);
    });

    it("returns the seeded cherry pick for a known ref name", async () => {
        const pick = await client.getCherryPickForRefName("proj", "repo-id", knownCherryPickRefName);
        expect(pick).toBe(cherryPicks[1]);
    });

    it("fabricates a cherry pick for an unknown ref name", async () => {
        const pick = await client.getCherryPickForRefName("proj", "repo-id", "refs/heads/cherry-pick/missing");
        expect(pick.cherryPickId).toBe(fabricatedOperationId);
        expect(pick.parameters.generatedRefName).toBe("refs/heads/cherry-pick/missing");
    });

    it("returns the seeded commit for a known cherry pick relationship", async () => {
        const related = await client.getCherryPickRelationships("repo-id", commits[2].commitId, "proj", true);
        expect(related).toEqual([commits[2]]);
    });

    it("fabricates a commit for an unknown cherry pick relationship", async () => {
        const related = await client.getCherryPickRelationships("repo-id", unknownSha);
        expect(related).toHaveLength(1);
        expect(related[0].commitId).toBe(unknownSha);
    });

    it("returns the seeded conflict for a known cherry pick conflict id", async () => {
        const conflict = await client.getCherryPickConflict("repo-id", knownCherryPickId, 6202);
        expect(conflict).toBe(cherryPickConflicts[1]);
    });

    it("fabricates a conflict for an unknown cherry pick conflict id", async () => {
        const conflict = await client.getCherryPickConflict("repo-id", knownCherryPickId, unknownId, "proj");
        expect(conflict.conflictId).toBe(unknownId);
        expect(conflict.resolutionStatus).toBe(GitResolutionStatus.Unresolved);
    });

    it("pages cherry pick conflicts with a continuation token", async () => {
        const first = await client.getCherryPickConflicts("repo-id", knownCherryPickId, "proj", undefined, 2);
        expect(first.map(c => c.conflictId)).toEqual([6201, 6202]);
        expect(first.continuationToken).toBe("2");
        const second = await client.getCherryPickConflicts("repo-id", knownCherryPickId, "proj", "2", 2);
        expect(second.map(c => c.conflictId)).toEqual([6203, 6204]);
        expect(second.continuationToken).toBeNull();
    });

    it("returns every cherry pick conflict without paging arguments", async () => {
        const page = await client.getCherryPickConflicts("repo-id", knownCherryPickId);
        expect(page).toHaveLength(cherryPickConflicts.length);
        expect(page.continuationToken).toBeNull();
    });

    it("keeps only resolved cherry pick conflicts", async () => {
        const page = await client.getCherryPickConflicts("repo-id", knownCherryPickId, "proj", undefined, undefined, false, true);
        expect(page.map(c => c.conflictId)).toEqual([6202, 6204]);
    });

    it("drops resolved cherry pick conflicts", async () => {
        const page = await client.getCherryPickConflicts("repo-id", knownCherryPickId, "proj", undefined, undefined, true, false, true);
        expect(page.map(c => c.conflictId)).toEqual([6201, 6203]);
    });

    it("merges the update over the seeded cherry pick conflict", async () => {
        const updated = await client.updateCherryPickConflict(
            { ...cherryPickConflicts[0], resolutionStatus: GitResolutionStatus.Resolved } as any,
            "repo-id",
            knownCherryPickId,
            6201
        );
        expect(updated.conflictId).toBe(6201);
        expect(updated.resolutionStatus).toBe(GitResolutionStatus.Resolved);
        expect(updated.conflictPath).toBe(cherryPickConflicts[0].conflictPath);
    });

    it("reports success for every cherry pick conflict update", async () => {
        const results = await client.updateCherryPickConflicts(
            [cherryPickConflicts[0], cherryPickConflicts[2]],
            "repo-id",
            knownCherryPickId,
            "proj"
        );
        expect(results.map(r => r.conflictId)).toEqual([6201, 6203]);
        expect(results.every(r => r.updateStatus === GitConflictUpdateStatus.Succeeded)).toBe(true);
    });

    it("echoes the parameters of a created revert", async () => {
        const created = await client.createRevert(revertParameters, "proj", "repo-id");
        expect(created.revertId).toBe(fabricatedRevertId);
        expect(created.parameters).toBe(revertParameters);
    });

    it("returns the seeded revert for a known id", async () => {
        const revert = await client.getRevert("proj", 6103, "repo-id");
        expect(revert).toBe(reverts[2]);
    });

    it("fabricates a revert for an unknown id", async () => {
        const revert = await client.getRevert("proj", unknownId, "repo-id");
        expect(revert.revertId).toBe(unknownId);
        expect(revert.parameters.generatedRefName).toBe(`refs/heads/revert/${unknownId}`);
    });

    it("returns the seeded revert for a known ref name", async () => {
        const revert = await client.getRevertForRefName("proj", "repo-id", knownRevertRefName);
        expect(revert).toBe(reverts[1]);
    });

    it("fabricates a revert for an unknown ref name", async () => {
        const revert = await client.getRevertForRefName("proj", "repo-id", "refs/heads/revert/missing");
        expect(revert.revertId).toBe(fabricatedRevertId);
        expect(revert.parameters.generatedRefName).toBe("refs/heads/revert/missing");
    });

    it("returns the seeded conflict for a known revert conflict id", async () => {
        const conflict = await client.getRevertConflict("repo-id", knownRevertId, 6302);
        expect(conflict).toBe(revertConflicts[1]);
    });

    it("fabricates a conflict for an unknown revert conflict id", async () => {
        const conflict = await client.getRevertConflict("repo-id", knownRevertId, unknownId, "proj");
        expect(conflict.conflictId).toBe(unknownId);
        expect(conflict.resolutionStatus).toBe(GitResolutionStatus.Unresolved);
    });

    it("pages revert conflicts from the revert list", async () => {
        const page = await client.getRevertConflicts("repo-id", knownRevertId, "proj", "1", 1);
        expect(page.map(c => c.conflictId)).toEqual([6302]);
        expect(page.continuationToken).toBe("2");
    });

    it("merges the update over the seeded revert conflict", async () => {
        const updated = await client.updateRevertConflict(
            { ...revertConflicts[1], resolutionStatus: GitResolutionStatus.Resolved } as any,
            "repo-id",
            knownRevertId,
            6302
        );
        expect(updated.conflictId).toBe(6302);
        expect(updated.resolutionStatus).toBe(GitResolutionStatus.Resolved);
        expect(updated.conflictPath).toBe(revertConflicts[1].conflictPath);
    });

    it("reports success for every revert conflict update", async () => {
        const results = await client.updateRevertConflicts(
            [revertConflicts[0], revertConflicts[2]],
            "repo-id",
            knownRevertId,
            "proj"
        );
        expect(results.map(r => r.conflictId)).toEqual([6301, 6303]);
        expect(results.every(r => r.updateStatus === GitConflictUpdateStatus.Succeeded)).toBe(true);
    });

    it("echoes the uploaded attachment content and name", async () => {
        const created = await client.createAttachment("raw-bytes", "trace.log", "repo-id", 42, "proj");
        expect(created.id).toBe(6411);
        expect(created.displayName).toBe("trace.log");
        expect(created.properties.content).toBe("raw-bytes");
    });

    it("returns the seeded pull request attachments", async () => {
        const attachments = await client.getAttachments("repo-id", 42, "proj");
        expect(attachments).toBe(pullRequestAttachments);
        expect(attachments.map(a => a.displayName)).toEqual(["design.png", "trace.log", "notes.md"]);
    });

    it("encodes the attachment file name as content", async () => {
        const buffer = await client.getAttachmentContent("notes.md", "repo-id", 42);
        expect(new TextDecoder().decode(buffer)).toBe("notes.md");
    });

    it("encodes the attachment file name as a zip", async () => {
        const buffer = await client.getAttachmentZip("notes.md", "repo-id", 42, "proj");
        expect(new TextDecoder().decode(buffer)).toBe("notes.md.zip");
    });

    it("returns the seeded likes for a known comment", async () => {
        const likes = await client.getLikes("repo-id", 42, 5301, knownCommentId);
        expect(likes).toBe(commentLikes);
        expect(likes.map(like => like.id)).toEqual(["liker-approver", "liker-reviewer"]);
    });

    it("returns the single like seeded on the second comment", async () => {
        const likes = await client.getLikes("repo-id", 42, 5301, 6502);
        expect(likes).toBe(likedComments[1].usersLiked);
        expect(likes.map(like => like.id)).toEqual(["liker-observer"]);
    });

    it("returns no likes for an unknown comment", async () => {
        const likes = await client.getLikes("repo-id", 42, 5301, unknownId, "proj");
        expect(likes).toEqual([]);
    });
});
