import {
    BuildRestClient,
    DefinitionTriggerType,
    ResultSet
} from "azure-devops-extension-api/Build";

import { getClient } from "../azure-devops-extension-api";
import {
    buildWorkItemRefs,
    changes,
    makeMinimalRetentionLease,
    makeSourceProviderAttributes,
    projectRetentionSetting,
    pullRequests,
    repositoryWebhooks,
    retentionHistory,
    retentionLeases,
    sourceBranches,
    sourceProviders,
    sourceRepositories
} from "../azure-devops-extension-api/build/Data";

const DAY_MS = 86_400_000;

describe("BuildRestClient mock retention leases", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(BuildRestClient);

    const newLease = {
        daysValid: 7,
        definitionId: 9_100_001,
        ownerId: "owner-alpha",
        protectPipeline: true,
        runId: 9_200_001
    };

    const updateModel = {
        artifactsRetention: { value: 11 },
        pullRequestRunRetention: { value: 22 },
        retainRunsPerProtectedBranch: { value: 33 },
        runRetention: { value: 44 }
    };

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["addRetentionLeases", () => client.addRetentionLeases([newLease], "proj")],
        ["getRetentionLease", () => client.getRetentionLease("proj", 9_000_001)],
        [
            "getRetentionLeasesByMinimalRetentionLeases",
            () =>
                client.getRetentionLeasesByMinimalRetentionLeases("proj", [
                    makeMinimalRetentionLease("owner-alpha", 9_100_001, 9_200_001)
                ])
        ],
        ["getRetentionLeasesByOwnerId", () => client.getRetentionLeasesByOwnerId("proj")],
        [
            "getRetentionLeasesByUserId",
            () => client.getRetentionLeasesByUserId("proj", "owner-alpha")
        ],
        ["getRetentionLeasesForBuild", () => client.getRetentionLeasesForBuild("proj", 9_200_001)],
        [
            "updateRetentionLease",
            () =>
                client.updateRetentionLease(
                    { daysValid: 30, protectPipeline: false },
                    "proj",
                    9_000_001
                )
        ],
        ["getRetentionHistory", () => client.getRetentionHistory()],
        ["getRetentionSettings", () => client.getRetentionSettings("proj")],
        [
            "updateRetentionSettings",
            () => client.updateRetentionSettings(updateModel, "proj")
        ],
        ["getBuildWorkItemsRefs", () => client.getBuildWorkItemsRefs("proj", 1)],
        [
            "getBuildWorkItemsRefsFromCommits",
            () => client.getBuildWorkItemsRefsFromCommits(["sha-1", "sha-2"], "proj", 1)
        ],
        ["getWorkItemsBetweenBuilds", () => client.getWorkItemsBetweenBuilds("proj", 1, 2)],
        ["getChangesBetweenBuilds", () => client.getChangesBetweenBuilds("proj")],
        ["getPullRequest", () => client.getPullRequest("proj", "TfsGit", "pr-9401")],
        ["listBranches", () => client.listBranches("proj", "TfsGit")],
        ["listRepositories", () => client.listRepositories("proj", "TfsGit")],
        ["listSourceProviders", () => client.listSourceProviders("proj")],
        ["listWebhooks", () => client.listWebhooks("proj", "TfsGit")]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<unknown>]> = [
        [
            "deleteRetentionLeasesById",
            () => client.deleteRetentionLeasesById("proj", [9_000_001, 9_000_002])
        ],
        [
            "restoreWebhooks",
            () =>
                client.restoreWebhooks(
                    [DefinitionTriggerType.ContinuousIntegration],
                    "proj",
                    "TfsGit"
                )
        ]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("echoes the new lease and derives validUntil from daysValid", async () => {
        const [created] = await client.addRetentionLeases([newLease], "proj");
        expect(created.ownerId).toBe("owner-alpha");
        expect(created.definitionId).toBe(9_100_001);
        expect(created.runId).toBe(9_200_001);
        expect(created.protectPipeline).toBe(true);
        expect(created.validUntil.getTime() - created.createdOn.getTime()).toBe(7 * DAY_MS);
    });

    it("creates one lease per requested lease", async () => {
        const created = await client.addRetentionLeases(
            [newLease, { ...newLease, ownerId: "owner-beta", daysValid: 1 }],
            "proj"
        );
        expect(created).toHaveLength(2);
        expect(created.map(lease => lease.ownerId)).toEqual(["owner-alpha", "owner-beta"]);
    });

    it("returns a seeded lease by id", async () => {
        const lease = await client.getRetentionLease("proj", 9_000_003);
        expect(lease).toBe(retentionLeases[2]);
        expect(lease.ownerId).toBe("owner-beta");
    });

    it("fabricates a lease for an unknown id", async () => {
        const lease = await client.getRetentionLease("proj", Number.MAX_SAFE_INTEGER);
        expect(lease.leaseId).toBe(Number.MAX_SAFE_INTEGER);
        expect(lease.ownerId).toBe("owner-unknown");
    });

    it("matches minimal leases on the full triple", async () => {
        const matched = await client.getRetentionLeasesByMinimalRetentionLeases("proj", [
            makeMinimalRetentionLease("owner-alpha", 9_100_001, 9_200_001),
            makeMinimalRetentionLease("owner-gamma", 9_100_003, 9_200_003)
        ]);
        expect(matched.map(lease => lease.leaseId)).toEqual([9_000_001, 9_000_004]);
    });

    it("returns nothing when no minimal lease matches", async () => {
        const matched = await client.getRetentionLeasesByMinimalRetentionLeases("proj", [
            makeMinimalRetentionLease("absent-owner", 9_100_001, 9_200_001)
        ]);
        expect(matched).toEqual([]);
    });

    it("rejects a minimal lease whose run differs", async () => {
        const matched = await client.getRetentionLeasesByMinimalRetentionLeases("proj", [
            makeMinimalRetentionLease("owner-alpha", 9_100_001, Number.MAX_SAFE_INTEGER)
        ]);
        expect(matched).toEqual([]);
    });

    it("returns every lease when no owner filter is given", async () => {
        const leases = await client.getRetentionLeasesByOwnerId("proj");
        expect(leases).toHaveLength(retentionLeases.length);
    });

    it("filters leases by owner, definition and run", async () => {
        const leases = await client.getRetentionLeasesByOwnerId(
            "proj",
            "owner-alpha",
            9_100_002,
            9_200_002
        );
        expect(leases.map(lease => lease.leaseId)).toEqual([9_000_002]);
    });

    it("returns nothing for an absent owner id", async () => {
        await expect(client.getRetentionLeasesByOwnerId("proj", "absent-owner")).resolves.toEqual(
            []
        );
    });

    it("returns every lease of a user when no extra filter is given", async () => {
        const leases = await client.getRetentionLeasesByUserId("proj", "owner-alpha");
        expect(leases.map(lease => lease.leaseId)).toEqual([9_000_001, 9_000_002]);
    });

    it("filters user leases by definition and run", async () => {
        const leases = await client.getRetentionLeasesByUserId(
            "proj",
            "owner-alpha",
            9_100_001,
            9_200_001
        );
        expect(leases.map(lease => lease.leaseId)).toEqual([9_000_001]);
    });

    it("returns nothing for an absent user id", async () => {
        await expect(client.getRetentionLeasesByUserId("proj", "absent-user")).resolves.toEqual([]);
    });

    it("returns the leases protecting a run", async () => {
        const leases = await client.getRetentionLeasesForBuild("proj", 9_200_001);
        expect(leases.map(lease => lease.leaseId)).toEqual([9_000_001, 9_000_003]);
    });

    it("returns nothing for a build with no lease", async () => {
        await expect(
            client.getRetentionLeasesForBuild("proj", Number.MAX_SAFE_INTEGER)
        ).resolves.toEqual([]);
    });

    it("applies the update to the lease it echoes back", async () => {
        const updated = await client.updateRetentionLease(
            { daysValid: 30, protectPipeline: false },
            "proj",
            9_000_002
        );
        expect(updated.leaseId).toBe(9_000_002);
        expect(updated.protectPipeline).toBe(false);
        expect(updated.validUntil.getTime() - updated.createdOn.getTime()).toBe(30 * DAY_MS);
    });

    it("returns every retention sample when no lookback is given", async () => {
        const history = await client.getRetentionHistory();
        expect(history.buildRetentionSamples).toEqual(retentionHistory.buildRetentionSamples);
    });

    it("drops retention samples older than the lookback window", async () => {
        const history = await client.getRetentionHistory(30);
        expect(history.buildRetentionSamples).toEqual(
            retentionHistory.buildRetentionSamples.slice(0, 2)
        );
    });

    it("returns the seeded project retention settings", async () => {
        await expect(client.getRetentionSettings("proj")).resolves.toEqual(
            projectRetentionSetting
        );
    });

    it("maps each update model field onto its retention setting", async () => {
        const updated = await client.updateRetentionSettings(updateModel, "proj");
        expect(updated.purgeArtifacts.value).toBe(11);
        expect(updated.purgePullRequestRuns.value).toBe(22);
        expect(updated.retainRunsPerProtectedBranch.value).toBe(33);
        expect(updated.purgeRuns.value).toBe(44);
    });

    it("keeps the bounds of each retention setting when updating", async () => {
        const updated = await client.updateRetentionSettings(updateModel, "proj");
        expect(updated.purgeRuns.min).toBe(projectRetentionSetting.purgeRuns.min);
        expect(updated.purgeRuns.max).toBe(projectRetentionSetting.purgeRuns.max);
        expect(Object.keys(updated).sort()).toEqual(Object.keys(projectRetentionSetting).sort());
    });

    it("returns every work item ref of a build", async () => {
        await expect(client.getBuildWorkItemsRefs("proj", 1)).resolves.toEqual(buildWorkItemRefs);
    });

    it("caps build work item refs at top", async () => {
        const refs = await client.getBuildWorkItemsRefs("proj", 1, 2);
        expect(refs.map(ref => ref.id)).toEqual(["9300001", "9300002"]);
    });

    it("returns one work item ref per commit", async () => {
        const refs = await client.getBuildWorkItemsRefsFromCommits(
            ["sha-1", "sha-2", "sha-3"],
            "proj",
            1
        );
        expect(refs).toHaveLength(3);
    });

    it("caps work item refs from commits at top", async () => {
        const refs = await client.getBuildWorkItemsRefsFromCommits(
            ["sha-1", "sha-2", "sha-3"],
            "proj",
            1,
            1
        );
        expect(refs.map(ref => ref.id)).toEqual(["9300001"]);
    });

    it("returns every work item ref between two builds", async () => {
        await expect(client.getWorkItemsBetweenBuilds("proj", 1, 2)).resolves.toEqual(
            buildWorkItemRefs
        );
    });

    it("caps work item refs between builds at top", async () => {
        const refs = await client.getWorkItemsBetweenBuilds("proj", 1, 2, 3);
        expect(refs).toHaveLength(3);
    });

    it("returns every change between two builds", async () => {
        await expect(client.getChangesBetweenBuilds("proj", 1, 2)).resolves.toEqual(changes);
    });

    it("caps changes between builds at top", async () => {
        const between = await client.getChangesBetweenBuilds("proj", 1, 2, 2);
        expect(between).toEqual(changes.slice(0, 2));
    });

    it("returns a seeded pull request by id", async () => {
        const request = await client.getPullRequest("proj", "TfsGit", "pr-9402");
        expect(request).toBe(pullRequests[1]);
        expect(request.providerName).toBe("GitHub");
    });

    it("fabricates a pull request for an unknown id", async () => {
        const request = await client.getPullRequest(
            "proj",
            "Bitbucket",
            "absent-pr",
            "repo-9501",
            "endpoint-1"
        );
        expect(request.id).toBe("absent-pr");
        expect(request.providerName).toBe("Bitbucket");
    });

    it("returns every branch when no branch name is given", async () => {
        await expect(client.listBranches("proj", "TfsGit")).resolves.toEqual(sourceBranches);
    });

    it("returns only the requested branch", async () => {
        await expect(
            client.listBranches("proj", "TfsGit", "endpoint-1", "checkout", "refs/heads/release")
        ).resolves.toEqual(["refs/heads/release"]);
    });

    it("returns nothing for an absent branch", async () => {
        await expect(
            client.listBranches("proj", "TfsGit", undefined, undefined, "refs/heads/absent-branch")
        ).resolves.toEqual([]);
    });

    it("returns every repository with an empty continuation token", async () => {
        const result = await client.listRepositories("proj", "TfsGit");
        expect(result.repositories).toEqual(sourceRepositories);
        expect(result.pageLength).toBe(sourceRepositories.length);
        expect(result.totalPageCount).toBe(1);
        expect(result.continuationToken).toBe("");
    });

    it("filters repositories by name", async () => {
        const result = await client.listRepositories("proj", "TfsGit", "endpoint-1", "billing");
        expect(result.repositories.map(repo => repo.id)).toEqual(["repo-9502"]);
        expect(result.pageLength).toBe(1);
    });

    it("returns nothing for an absent repository name", async () => {
        const result = await client.listRepositories("proj", "TfsGit", undefined, "absent-repo");
        expect(result.repositories).toEqual([]);
        expect(result.pageLength).toBe(0);
        expect(result.totalPageCount).toBe(0);
    });

    it("returns only the top repository for the top result set", async () => {
        const result = await client.listRepositories(
            "proj",
            "TfsGit",
            undefined,
            undefined,
            ResultSet.Top
        );
        expect(result.repositories.map(repo => repo.id)).toEqual(["repo-9501"]);
    });

    it("returns every repository for the all result set", async () => {
        const result = await client.listRepositories(
            "proj",
            "TfsGit",
            undefined,
            undefined,
            ResultSet.All
        );
        expect(result.repositories).toHaveLength(sourceRepositories.length);
    });

    it("hands back a continuation token when paging is requested", async () => {
        const result = await client.listRepositories(
            "proj",
            "TfsGit",
            undefined,
            undefined,
            ResultSet.All,
            true,
            "prev-page"
        );
        expect(result.continuationToken).toBe("next-page");
    });

    it("returns the seeded source providers", async () => {
        await expect(client.listSourceProviders("proj")).resolves.toEqual(sourceProviders);
    });

    it("returns every webhook when no repository is given", async () => {
        await expect(client.listWebhooks("proj", "TfsGit")).resolves.toEqual(repositoryWebhooks);
    });

    it("filters webhooks by repository", async () => {
        const webhooks = await client.listWebhooks("proj", "TfsGit", "endpoint-1", "website");
        expect(webhooks.map(webhook => webhook.name)).toEqual(["website"]);
        expect(webhooks[0].types).toContain(DefinitionTriggerType.PullRequest);
    });

    it("returns nothing for an absent webhook repository", async () => {
        await expect(
            client.listWebhooks("proj", "TfsGit", undefined, "absent-repo")
        ).resolves.toEqual([]);
    });

    it("builds source provider attributes for any provider name", () => {
        const attributes = makeSourceProviderAttributes("Svn");
        expect(attributes.name).toBe("Svn");
        expect(attributes.supportedTriggers.map(trigger => trigger.type)).toEqual([
            DefinitionTriggerType.ContinuousIntegration,
            DefinitionTriggerType.PullRequest
        ]);
    });
});
