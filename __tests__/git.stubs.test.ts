import { AdvSecEnablementUpdate, GitRefFavorite, GitRestClient, RefFavoriteType } from "azure-devops-extension-api/Git";

import { getClient } from "../azure-devops-extension-api";
import {
    advSecProjectIds,
    billableCommitterDetails,
    billableCommitters,
    billablePushers,
    enablementStatuses,
    makeBillableCommitter,
    makeBillableCommitterDetail,
    makeBillablePusher,
    makeEnablementStatus,
    makeRefFavorite,
    refFavoriteIdentityIds,
    refFavorites,
    repositories
} from "../azure-devops-extension-api/git/Data";

describe("GitRestClient mock advanced security, billing and ref favorites", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GitRestClient);

    const unknownId = Number.MAX_SAFE_INTEGER;
    const unknownGuid = "00000000-0000-0000-0000-000000000000";
    const billingDate = new Date("2026-01-01T00:00:00Z");

    const enablementUpdate: AdvSecEnablementUpdate = {
        newDependabotStatus: true,
        newDependencyScanningInjectionEnablementStatus: true,
        newStatus: true,
        options: { forceRepoSecretScanning: false },
        projectId: advSecProjectIds[0],
        repositoryId: repositories[0].id
    };

    const favoriteToCreate: GitRefFavorite = {
        _links: {},
        id: 7001,
        identityId: refFavoriteIdentityIds[0],
        name: "refs/heads/topic",
        repositoryId: repositories[2].id,
        type: RefFavoriteType.Folder,
        url: "https://example.com/favorites/7001"
    };

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getEnablementStatus", () => client.getEnablementStatus()],
        ["getEnableOnCreateHost", () => client.getEnableOnCreateHost(true)],
        ["getEnableOnCreateProject", () => client.getEnableOnCreateProject(advSecProjectIds[0])],
        ["getEstimatedBillablePushersOrg", () => client.getEstimatedBillablePushersOrg()],
        ["getEstimatedBillablePushersProject", () => client.getEstimatedBillablePushersProject(advSecProjectIds[0])],
        [
            "getEstimatedBillableCommittersRepo",
            () => client.getEstimatedBillableCommittersRepo("proj", repositories[0].id)
        ],
        ["getBillableCommitters", () => client.getBillableCommitters("proj")],
        ["getBillableCommittersDetail", () => client.getBillableCommittersDetail("proj", "true")],
        ["createFavorite", () => client.createFavorite(favoriteToCreate, "proj")],
        ["getRefFavorite", () => client.getRefFavorite("proj", refFavorites[0].id)],
        ["getRefFavorites", () => client.getRefFavorites("proj")],
        ["getRefFavoritesForProject", () => client.getRefFavoritesForProject("proj")]
    ];

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["initializeConsolidationIdentity", () => client.initializeConsolidationIdentity("proj")],
        ["initializeAutofixIdentity", () => client.initializeAutofixIdentity("proj", "repo-id")],
        ["deleteEnablementStatus", () => client.deleteEnablementStatus(false, true, [advSecProjectIds[0]])],
        ["setEnableOnCreateHost", () => client.setEnableOnCreateHost(true)],
        ["setEnableOnCreateProject", () => client.setEnableOnCreateProject(advSecProjectIds[0], true)],
        ["updateEnablementStatus", () => client.updateEnablementStatus([enablementUpdate])],
        ["deleteRefFavorite", () => client.deleteRefFavorite("proj", refFavorites[0].id)]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("seeds enablement statuses for known repositories in both projects", () => {
        const repositoryIds = repositories.map(repository => repository.id);
        expect(enablementStatuses).toHaveLength(5);
        expect(enablementStatuses.every(status => repositoryIds.includes(status.repositoryId))).toBe(true);
        expect(new Set(enablementStatuses.map(status => status.projectId))).toEqual(new Set(advSecProjectIds));
    });

    it("makes an enablement status that carries its arguments", () => {
        const status = makeEnablementStatus("project-id", "repository-id", true);
        expect(status.projectId).toBe("project-id");
        expect(status.repositoryId).toBe("repository-id");
        expect(status.enabled).toBe(true);
        expect(status.dependabotEnabled).toBe(true);
        expect(status.dependencyScanningInjectionEnabled).toBe(true);
        expect(status.changedOnDate).toBeInstanceOf(Date);
        expect(typeof status.changedById).toBe("string");
    });

    it("returns every enablement status without a project filter", async () => {
        await expect(client.getEnablementStatus()).resolves.toEqual(enablementStatuses);
        await expect(client.getEnablementStatus([])).resolves.toEqual(enablementStatuses);
    });

    it("filters enablement statuses by project ids", async () => {
        const statuses = await client.getEnablementStatus([advSecProjectIds[1]], billingDate);
        expect(statuses).toEqual(enablementStatuses.slice(3));
    });

    it("returns no enablement status for an unknown project", async () => {
        await expect(client.getEnablementStatus([unknownGuid])).resolves.toEqual([]);
    });

    it("pages enablement statuses with skip and take", async () => {
        await expect(client.getEnablementStatus(undefined, undefined, 1, 2)).resolves.toEqual(
            enablementStatuses.slice(1, 3)
        );
        await expect(client.getEnablementStatus(undefined, undefined, 3)).resolves.toEqual(enablementStatuses.slice(3));
        await expect(client.getEnablementStatus([advSecProjectIds[0]], billingDate, undefined, 1)).resolves.toEqual([
            enablementStatuses[0]
        ]);
    });

    it("echoes the host enable-on-create flag", async () => {
        await expect(client.getEnableOnCreateHost(true)).resolves.toBe(true);
        await expect(client.getEnableOnCreateHost(false)).resolves.toBe(false);
    });

    it("reports enable-on-create per project from the seeded statuses", async () => {
        await expect(client.getEnableOnCreateProject(advSecProjectIds[0])).resolves.toBe(true);
        await expect(client.getEnableOnCreateProject(advSecProjectIds[1])).resolves.toBe(false);
        await expect(client.getEnableOnCreateProject(unknownGuid)).resolves.toBe(false);
    });

    it("makes billing fixtures that carry their arguments", () => {
        const pusher = makeBillablePusher("project-id", "repository-id");
        expect(pusher.projectId).toBe("project-id");
        expect(pusher.repoId).toBe("repository-id");
        expect(typeof pusher.vsid).toBe("string");

        const committer = makeBillableCommitter("repository-id");
        expect(committer.repoId).toBe("repository-id");

        const detail = makeBillableCommitterDetail("project-id", committer);
        expect(detail.repoId).toBe("repository-id");
        expect(detail.vsid).toBe(committer.vsid);
        expect(detail.projectId).toBe("project-id");
        expect(detail.commitId).toHaveLength(40);
        expect(detail.commitTime).toBeInstanceOf(Date);
        expect(detail.pushedTime).toBeInstanceOf(Date);
        expect(typeof detail.pushId).toBe("number");
    });

    it("returns the seeded billable pushers for the organization", async () => {
        await expect(client.getEstimatedBillablePushersOrg()).resolves.toBe(billablePushers);
    });

    it("filters billable pushers by project", async () => {
        await expect(client.getEstimatedBillablePushersProject(advSecProjectIds[0])).resolves.toEqual(
            billablePushers.slice(0, 2)
        );
        await expect(client.getEstimatedBillablePushersProject(unknownGuid)).resolves.toEqual([]);
    });

    it("filters billable committers by repository", async () => {
        await expect(client.getEstimatedBillableCommittersRepo("proj", repositories[1].id)).resolves.toEqual(
            billableCommitters.slice(2)
        );
        await expect(client.getEstimatedBillableCommittersRepo("proj", unknownGuid)).resolves.toEqual([]);
    });

    it("returns and pages the seeded billable committers", async () => {
        await expect(client.getBillableCommitters("proj")).resolves.toEqual(billableCommitters);
        await expect(client.getBillableCommitters("proj", billingDate, 1, 2)).resolves.toEqual(
            billableCommitters.slice(1, 3)
        );
        await expect(client.getBillableCommitters("proj", billingDate, 3)).resolves.toEqual(
            billableCommitters.slice(3)
        );
        await expect(client.getBillableCommitters("proj", undefined, undefined, 1)).resolves.toEqual([
            billableCommitters[0]
        ]);
    });

    it("returns a detail for every seeded billable committer", async () => {
        const details = await client.getBillableCommittersDetail("proj", "true", billingDate);
        expect(details).toBe(billableCommitterDetails);
        expect(details.map(detail => detail.vsid)).toEqual(billableCommitters.map(committer => committer.vsid));
    });

    it("makes a ref favorite that defaults to the ref type", () => {
        const favorite = makeRefFavorite("refs/heads/topic", "repository-id", "identity-id");
        expect(favorite.name).toBe("refs/heads/topic");
        expect(favorite.repositoryId).toBe("repository-id");
        expect(favorite.identityId).toBe("identity-id");
        expect(favorite.type).toBe(RefFavoriteType.Ref);
        expect(makeRefFavorite("refs/heads", "repository-id", "identity-id", RefFavoriteType.Folder).type).toBe(
            RefFavoriteType.Folder
        );
    });

    it("seeds ref favorites with distinct ids", () => {
        expect(new Set(refFavorites.map(favorite => favorite.id)).size).toBe(refFavorites.length);
    });

    it("echoes a created favorite", async () => {
        await expect(client.createFavorite(favoriteToCreate, "proj")).resolves.toEqual(favoriteToCreate);
    });

    it("does not keep a created favorite", async () => {
        await client.createFavorite(favoriteToCreate, "proj");
        await expect(client.getRefFavorites("proj")).resolves.toHaveLength(refFavorites.length);
    });

    it("returns the seeded favorite for a known id", async () => {
        await expect(client.getRefFavorite("proj", refFavorites[2].id)).resolves.toBe(refFavorites[2]);
    });

    it("fabricates a favorite for an unknown id", async () => {
        const favorite = await client.getRefFavorite("proj", unknownId);
        expect(favorite.id).toBe(unknownId);
        expect(favorite.repositoryId).toBe(repositories[0].id);
        expect(favorite.type).toBe(RefFavoriteType.Ref);
    });

    it("returns every favorite without filters", async () => {
        await expect(client.getRefFavorites("proj")).resolves.toEqual(refFavorites);
    });

    it("filters favorites by repository and identity", async () => {
        await expect(client.getRefFavorites("proj", repositories[1].id)).resolves.toEqual(refFavorites.slice(2));
        await expect(client.getRefFavorites("proj", undefined, refFavoriteIdentityIds[1])).resolves.toEqual([
            refFavorites[1],
            refFavorites[3]
        ]);
        await expect(client.getRefFavorites("proj", repositories[0].id, refFavoriteIdentityIds[1])).resolves.toEqual([
            refFavorites[1]
        ]);
        await expect(client.getRefFavorites("proj", unknownGuid, refFavoriteIdentityIds[0])).resolves.toEqual([]);
    });

    it("returns project favorites, optionally filtered by identity", async () => {
        await expect(client.getRefFavoritesForProject("proj")).resolves.toBe(refFavorites);
        await expect(client.getRefFavoritesForProject("proj", refFavoriteIdentityIds[0])).resolves.toEqual([
            refFavorites[0],
            refFavorites[2]
        ]);
        await expect(client.getRefFavoritesForProject("proj", unknownGuid)).resolves.toEqual([]);
    });
});
