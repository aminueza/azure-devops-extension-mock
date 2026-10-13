import { FavoriteCreateParameters, FavoriteRestClient } from "azure-devops-extension-api/Favorite";
import { getClient, getRegisteredMockClient, MockFavoriteRestClient } from "../azure-devops-extension-api";
import {
    favoriteProviders,
    favorites,
    favoriteScopes,
    makeArtifactScope,
    makeFavorite,
    makeFavoriteProvider
} from "../azure-devops-extension-api/favorite/Data";

const REPOSITORY = "Microsoft.TeamFoundation.Git.Repository";

describe("FavoriteRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(FavoriteRestClient);

    const posted: FavoriteCreateParameters = {
        artifactId: "artifact-1",
        artifactName: "My repository",
        artifactProperties: {},
        artifactScope: { id: "scope-1", name: "Project one", type: "Project" },
        artifactType: REPOSITORY
    };

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(FavoriteRestClient)).toBe(MockFavoriteRestClient);
    });

    it("lists the favorite providers", async () => {
        const providers = await client.getFavoriteProviders(true);
        expect(providers).toBe(favoriteProviders);
        expect(providers.map(p => p.pluralName)).toEqual(["Repositories", "Pipelines", "Projects"]);
    });

    it("creates a favorite echoing the posted parameters", async () => {
        const created = await client.createFavorite(posted);
        expect(created).toMatchObject(posted);
        expect(typeof created.id).toBe("string");
        expect(created.artifactIsDeleted).toBe(false);
        expect(created.creationDate).toBeInstanceOf(Date);
        expect(typeof created.owner.displayName).toBe("string");
    });

    it("creates a favorite for an owner echoing the posted parameters", async () => {
        const created = await client.createFavoriteOfOwner(posted, "Team", "team-1");
        expect(created).toMatchObject(posted);
        expect(typeof created.url).toBe("string");
    });

    it("deletes a favorite", async () => {
        await expect(
            client.deleteFavoriteById(favorites[0].id, REPOSITORY, "Project", "scope-1")
        ).resolves.toBeUndefined();
    });

    it("deletes a favorite of an owner", async () => {
        await expect(
            client.deleteFavoriteOfOwnerById(favorites[0].id, "Team", "team-1", REPOSITORY, "Project", "scope-1")
        ).resolves.toBeUndefined();
    });

    it("gets a known favorite by artifact", async () => {
        const target = favorites[1];
        expect(
            await client.getFavoriteByArtifact(target.artifactType, target.artifactId, target.artifactScope.type)
        ).toBe(target);
    });

    it("fabricates a favorite for an unknown artifact", async () => {
        const made = await client.getFavoriteByArtifact(REPOSITORY, "missing-artifact", "Collection", "scope-9", true);
        expect(made.artifactType).toBe(REPOSITORY);
        expect(made.artifactId).toBe("missing-artifact");
        expect(made.artifactScope.type).toBe("Collection");
        expect(typeof made.artifactScope.id).toBe("string");
    });

    it("fabricates a favorite when the artifact id is known under another type", async () => {
        const made = await client.getFavoriteByArtifact("Other.Type", favorites[0].artifactId, "Project");
        expect(made).not.toBe(favorites[0]);
        expect(made.artifactType).toBe("Other.Type");
    });

    it("gets a known favorite by id", async () => {
        expect(await client.getFavoriteById(favorites[2].id, "Project", REPOSITORY)).toBe(favorites[2]);
    });

    it("fabricates an unknown favorite by id", async () => {
        const made = await client.getFavoriteById("missing-favorite", "Project", REPOSITORY, "scope-1", true);
        expect(made.id).toBe("missing-favorite");
        expect(made._links).toEqual({});
    });

    it("gets a known favorite of an owner by id", async () => {
        expect(await client.getFavoriteOfOwnerById(favorites[3].id, "Team", "team-1", "Project", REPOSITORY)).toBe(
            favorites[3]
        );
    });

    it("fabricates an unknown favorite of an owner by id", async () => {
        const made = await client.getFavoriteOfOwnerById("missing-favorite", "Team", "team-1", "Project", REPOSITORY);
        expect(made.id).toBe("missing-favorite");
    });

    it("lists every favorite", async () => {
        expect(await client.getFavorites()).toEqual(favorites);
    });

    it("lists favorites filtered by artifact type", async () => {
        const list = await client.getFavorites(REPOSITORY);
        expect(list).toEqual([favorites[0], favorites[3]]);
    });

    it("lists favorites filtered by scope type", async () => {
        const list = await client.getFavorites(undefined, "Collection");
        expect(list).toEqual([favorites[1], favorites[3]]);
    });

    it("lists favorites filtered by scope id", async () => {
        const list = await client.getFavorites(undefined, undefined, favoriteScopes[0].id, true);
        expect(list).toEqual([favorites[0], favorites[2]]);
    });

    it("lists favorites matching every filter", async () => {
        const list = await client.getFavorites(REPOSITORY, "Collection", favoriteScopes[1].id);
        expect(list).toEqual([favorites[3]]);
        expect(await client.getFavorites(REPOSITORY, "Collection", "missing-scope")).toEqual([]);
    });

    it("lists the favorites of an owner with the same filters", async () => {
        expect(await client.getFavoritesOfOwner("Team", "team-1")).toEqual(favorites);
        expect(
            await client.getFavoritesOfOwner("Team", "team-1", REPOSITORY, "Collection", favoriteScopes[1].id)
        ).toEqual([favorites[3]]);
        expect(await client.getFavoritesOfOwner("Team", "team-1", "Missing.Type")).toEqual([]);
    });
});

describe("favorite fixtures", () => {
    it("makes a project scope", () => {
        const scope = makeArtifactScope();
        expect(scope.type).toBe("Project");
        expect(typeof scope.id).toBe("string");
        expect(typeof scope.name).toBe("string");
    });

    it("makes a provider with a security token", () => {
        const provider = makeFavoriteProvider();
        expect(provider.artifactType.startsWith("Microsoft.TeamFoundation.")).toBe(true);
        expect(provider.token.length).toBe(24);
        expect(typeof provider.order).toBe("number");
    });

    it("makes a favorite that is not deleted", () => {
        const favorite = makeFavorite();
        expect(favorite.artifactIsDeleted).toBe(false);
        expect(favorite.artifactProperties).toEqual({});
        expect(favorite.artifactType).toBe(REPOSITORY);
    });

    it("seeds favorites with unique ids and artifact ids", () => {
        expect(favorites.length).toBe(4);
        expect(new Set(favorites.map(f => f.id)).size).toBe(4);
        expect(new Set(favorites.map(f => f.artifactId)).size).toBe(4);
    });

    it("seeds favorites over the seeded providers and scopes", () => {
        expect(favorites.map(f => f.artifactType)).toEqual([
            favoriteProviders[0].artifactType,
            favoriteProviders[1].artifactType,
            favoriteProviders[2].artifactType,
            favoriteProviders[0].artifactType
        ]);
        expect(favorites.map(f => f.artifactScope)).toEqual([
            favoriteScopes[0],
            favoriteScopes[1],
            favoriteScopes[0],
            favoriteScopes[1]
        ]);
    });
});
