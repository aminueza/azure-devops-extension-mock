import {
    GitPullRequestQueryType,
    GitRestClient,
    GitStatusState
} from "azure-devops-extension-api/Git";
import { Operation } from "azure-devops-extension-api/WebApi";

import { getClient } from "../azure-devops-extension-api";
import {
    makeIdentityRefWithVote,
    makePullRequestStatus,
    pullRequestLabels,
    pullRequestProperties,
    pullRequestReviewers,
    pullRequests,
    pullRequestStatuses,
    pullRequestWorkItemRefs
} from "../azure-devops-extension-api/git/Data";

describe("GitRestClient mock reviewers, labels, statuses and properties", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GitRestClient);

    const knownReviewerId = pullRequestReviewers[1].id;
    const unknownReviewerId = "reviewer-absent";
    const unknownLabel = "label-absent";
    const unknownStatusId = Number.MAX_SAFE_INTEGER;
    const pullRequestId = 42;

    const commitQuery = {
        queries: [
            {
                include: 0,
                items: ["a".repeat(40), "b".repeat(40)],
                type: GitPullRequestQueryType.Commit
            }
        ],
        results: []
    };

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getPullRequestReviewers", () => client.getPullRequestReviewers("repo-id", pullRequestId)],
        ["getPullRequestReviewer", () => client.getPullRequestReviewer("repo-id", pullRequestId, knownReviewerId)],
        ["createPullRequestReviewer", () => client.createPullRequestReviewer(
            makeIdentityRefWithVote("reviewer-new", 5),
            "repo-id",
            pullRequestId,
            "reviewer-new"
        )],
        ["createPullRequestReviewers", () => client.createPullRequestReviewers(
            [makeIdentityRefWithVote("reviewer-a", 0), makeIdentityRefWithVote("reviewer-b", 0)],
            "repo-id",
            pullRequestId
        )],
        ["createUnmaterializedPullRequestReviewer", () => client.createUnmaterializedPullRequestReviewer(
            makeIdentityRefWithVote("reviewer-unmaterialized", 0),
            "repo-id",
            pullRequestId
        )],
        ["updatePullRequestReviewer", () => client.updatePullRequestReviewer(
            makeIdentityRefWithVote(knownReviewerId, 10),
            "repo-id",
            pullRequestId,
            knownReviewerId
        )],
        ["getPullRequestLabels", () => client.getPullRequestLabels("repo-id", pullRequestId)],
        ["getPullRequestLabel", () => client.getPullRequestLabel("repo-id", pullRequestId, "label-bug")],
        ["createPullRequestLabel", () => client.createPullRequestLabel(
            { name: "regression" },
            "repo-id",
            pullRequestId
        )],
        ["getPullRequestStatus", () => client.getPullRequestStatus("repo-id", pullRequestId, 301)],
        ["createPullRequestStatus", () => client.createPullRequestStatus(
            makePullRequestStatus(401, GitStatusState.Succeeded, 4),
            "repo-id",
            pullRequestId
        )],
        ["getPullRequestStatuses", () => client.getPullRequestStatuses("repo-id", pullRequestId)],
        ["getPullRequestProperties", () => client.getPullRequestProperties("repo-id", pullRequestId)],
        ["updatePullRequestProperties", () => client.updatePullRequestProperties(
            [{ from: "", op: Operation.Add, path: "/riskLevel", value: "high" }],
            "repo-id",
            pullRequestId
        )],
        ["getPullRequestQuery", () => client.getPullRequestQuery(commitQuery, "repo-id")],
        ["getPullRequestWorkItemRefs", () => client.getPullRequestWorkItemRefs("repo-id", pullRequestId)]
    ];

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["updatePullRequestReviewers", () => client.updatePullRequestReviewers(
            [makeIdentityRefWithVote(knownReviewerId, 10)],
            "repo-id",
            pullRequestId
        )],
        ["deletePullRequestReviewer", () => client.deletePullRequestReviewer(
            "repo-id",
            pullRequestId,
            knownReviewerId
        )],
        ["deletePullRequestLabels", () => client.deletePullRequestLabels(
            "repo-id",
            pullRequestId,
            "label-bug"
        )],
        ["deletePullRequestStatus", () => client.deletePullRequestStatus(
            "repo-id",
            pullRequestId,
            301
        )],
        ["updatePullRequestStatuses", () => client.updatePullRequestStatuses(
            [{ from: "", op: Operation.Remove, path: "/0", value: null }],
            "repo-id",
            pullRequestId
        )],
        ["sharePullRequest", () => client.sharePullRequest(
            { message: "please review", receivers: [makeIdentityRefWithVote("reviewer-a", 0)] },
            "repo-id",
            pullRequestId
        )]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("lists every seeded reviewer", async () => {
        await expect(client.getPullRequestReviewers("repo-id", pullRequestId, "proj"))
            .resolves.toBe(pullRequestReviewers);
    });

    it("returns a seeded reviewer by id", async () => {
        const reviewer = await client.getPullRequestReviewer("repo-id", pullRequestId, knownReviewerId, "proj");
        expect(reviewer).toBe(pullRequestReviewers[1]);
        expect(reviewer.vote).toBe(-5);
    });

    it("fabricates an unknown reviewer with no vote", async () => {
        const reviewer = await client.getPullRequestReviewer("repo-id", pullRequestId, unknownReviewerId);
        expect(reviewer.id).toBe(unknownReviewerId);
        expect(reviewer.vote).toBe(0);
        expect(reviewer.isRequired).toBe(false);
    });

    it("echoes the created reviewer under the requested id", async () => {
        const reviewer = await client.createPullRequestReviewer(
            { ...makeIdentityRefWithVote("ignored", 10), isRequired: true },
            "repo-id",
            pullRequestId,
            unknownReviewerId,
            "proj"
        );
        expect(reviewer.id).toBe(unknownReviewerId);
        expect(reviewer.vote).toBe(10);
        expect(reviewer.isRequired).toBe(true);
    });

    it("gives every created reviewer a vote of zero", async () => {
        const created = await client.createPullRequestReviewers(
            [
                { ...makeIdentityRefWithVote("reviewer-a", 0), displayName: "Ada" },
                { ...makeIdentityRefWithVote("reviewer-b", 0), displayName: "Grace" }
            ],
            "repo-id",
            pullRequestId,
            "proj"
        );
        expect(created.map(r => r.id)).toEqual(["reviewer-a", "reviewer-b"]);
        expect(created.map(r => r.displayName)).toEqual(["Ada", "Grace"]);
        expect(created.every(r => r.vote === 0)).toBe(true);
    });

    it("clears the reviewer url for an unmaterialized reviewer", async () => {
        const reviewer = await client.createUnmaterializedPullRequestReviewer(
            makeIdentityRefWithVote("reviewer-unmaterialized", 5),
            "repo-id",
            pullRequestId,
            "proj"
        );
        expect(reviewer.id).toBe("reviewer-unmaterialized");
        expect(reviewer.vote).toBe(5);
        expect(reviewer.reviewerUrl).toBe("");
    });

    it("merges an update over a seeded reviewer", async () => {
        const updated = await client.updatePullRequestReviewer(
            { ...makeIdentityRefWithVote("ignored", 10), isFlagged: true },
            "repo-id",
            pullRequestId,
            knownReviewerId,
            "proj"
        );
        expect(updated.id).toBe(knownReviewerId);
        expect(updated.vote).toBe(10);
        expect(updated.isFlagged).toBe(true);
    });

    it("merges an update over a fabricated reviewer", async () => {
        const updated = await client.updatePullRequestReviewer(
            { ...makeIdentityRefWithVote("ignored", -10), hasDeclined: true },
            "repo-id",
            pullRequestId,
            unknownReviewerId
        );
        expect(updated.id).toBe(unknownReviewerId);
        expect(updated.vote).toBe(-10);
        expect(updated.hasDeclined).toBe(true);
    });

    it("lists every seeded label", async () => {
        await expect(client.getPullRequestLabels("repo-id", pullRequestId, "proj", "project-id"))
            .resolves.toBe(pullRequestLabels);
    });

    it("returns a seeded label by id", async () => {
        const label = await client.getPullRequestLabel("repo-id", pullRequestId, "label-docs");
        expect(label).toBe(pullRequestLabels[1]);
    });

    it("returns a seeded label by name", async () => {
        const label = await client.getPullRequestLabel("repo-id", pullRequestId, "bug", "proj", "project-id");
        expect(label).toBe(pullRequestLabels[0]);
        expect(label.active).toBe(true);
    });

    it("fabricates an unknown label from the requested key", async () => {
        const label = await client.getPullRequestLabel("repo-id", pullRequestId, unknownLabel);
        expect(label.id).toBe(unknownLabel);
        expect(label.name).toBe(unknownLabel);
    });

    it("returns the existing label when creating a known name", async () => {
        const label = await client.createPullRequestLabel(
            { name: "stale" },
            "repo-id",
            pullRequestId,
            "proj",
            "project-id"
        );
        expect(label).toBe(pullRequestLabels[2]);
        expect(label.active).toBe(false);
    });

    it("creates a label under a derived id", async () => {
        const label = await client.createPullRequestLabel({ name: "regression" }, "repo-id", pullRequestId);
        expect(label.id).toBe("label-regression");
        expect(label.name).toBe("regression");
    });

    it("returns a seeded status by id", async () => {
        const status = await client.getPullRequestStatus("repo-id", pullRequestId, 302, "proj");
        expect(status).toBe(pullRequestStatuses[1]);
        expect(status.state).toBe(GitStatusState.Failed);
        expect(status.iterationId).toBe(2);
    });

    it("fabricates an unknown status", async () => {
        const status = await client.getPullRequestStatus("repo-id", pullRequestId, unknownStatusId);
        expect(status.id).toBe(unknownStatusId);
        expect(status.state).toBe(GitStatusState.NotSet);
        expect(status.iterationId).toBe(1);
    });

    it("echoes the created status", async () => {
        const status = await client.createPullRequestStatus(
            {
                ...makePullRequestStatus(401, GitStatusState.Succeeded, 4),
                description: "build passed"
            },
            "repo-id",
            pullRequestId,
            "proj"
        );
        expect(status.id).toBe(401);
        expect(status.state).toBe(GitStatusState.Succeeded);
        expect(status.iterationId).toBe(4);
        expect(status.description).toBe("build passed");
    });
    it("lists every seeded status", async () => {
        await expect(client.getPullRequestStatuses("repo-id", pullRequestId, "proj"))
            .resolves.toBe(pullRequestStatuses);
    });

    it("copies the seeded properties", async () => {
        const properties = await client.getPullRequestProperties("repo-id", pullRequestId, "proj");
        expect(properties).toEqual(pullRequestProperties);
        expect(properties).not.toBe(pullRequestProperties);
    });

    it("applies each patch operation onto the properties", async () => {
        const properties = await client.updatePullRequestProperties(
            [
                { from: "", op: Operation.Replace, path: "/riskLevel", value: "high" },
                { from: "", op: Operation.Add, path: "/owner", value: "platform" }
            ],
            "repo-id",
            pullRequestId,
            "proj"
        );
        expect(properties.riskLevel).toBe("high");
        expect(properties.owner).toBe("platform");
        expect(properties.reviewedBy).toBe(pullRequestProperties.reviewedBy);
        expect(pullRequestProperties.riskLevel).toBe("low");
    });

    it("leaves the properties untouched for a non-array patch", async () => {
        const properties = await client.updatePullRequestProperties({}, "repo-id", pullRequestId);
        expect(properties).toEqual(pullRequestProperties);
    });

    it("answers a commit query with every pull request", async () => {
        const result = await client.getPullRequestQuery(commitQuery, "repo-id", "proj");
        expect(result.queries).toBe(commitQuery.queries);
        expect(Object.keys(result.results[0])).toEqual(commitQuery.queries[0].items);
        expect(result.results[0][commitQuery.queries[0].items[0]]).toBe(pullRequests);
    });

    it("answers an unset query with no pull requests", async () => {
        const result = await client.getPullRequestQuery(
            {
                queries: [{ include: 0, items: ["c".repeat(40)], type: GitPullRequestQueryType.NotSet }],
                results: []
            },
            "repo-id"
        );
        expect(result.results[0]["c".repeat(40)]).toEqual([]);
    });

    it("lists every seeded work item ref", async () => {
        await expect(client.getPullRequestWorkItemRefs("repo-id", pullRequestId, "proj"))
            .resolves.toBe(pullRequestWorkItemRefs);
    });
});
