import { FolderPathQueryOrder, ReleaseRestClient } from "azure-devops-extension-api/Release";

import { getClient } from "../azure-devops-extension-api";
import {
    definitionTags,
    environmentTemplates,
    favorites,
    folders,
    makeEnvironmentTemplate,
    makeFavoriteItem,
    makeFolder,
    releaseTags,
    tags
} from "../azure-devops-extension-api/release/Data";

const client = getClient(ReleaseRestClient);

describe("ReleaseRestClient tags, folders, favorites and templates", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["addDefinitionTag", () => client.addDefinitionTag("proj", 1, "new-tag")],
        ["addDefinitionTags", () => client.addDefinitionTags(["extra"], "proj", 1)],
        ["deleteDefinitionTag", () => client.deleteDefinitionTag("proj", 1, definitionTags[0])],
        ["getDefinitionTags", () => client.getDefinitionTags("proj", 1)],
        ["addReleaseTag", () => client.addReleaseTag("proj", 1, "new-tag")],
        ["addReleaseTags", () => client.addReleaseTags(["extra"], "proj", 1)],
        ["deleteReleaseTag", () => client.deleteReleaseTag("proj", 1, releaseTags[0])],
        ["getReleaseTags", () => client.getReleaseTags("proj", 1)],
        ["getTags", () => client.getTags("proj")],
        ["createFolder", () => client.createFolder(makeFolder("\\new"), "proj")],
        ["getFolders", () => client.getFolders("proj")],
        ["updateFolder", () => client.updateFolder(makeFolder("\\x"), "proj", folders[0].path)],
        [
            "createFavorites",
            () => client.createFavorites([makeFavoriteItem()], "proj", "ReleaseDefinition")
        ],
        ["getFavorites", () => client.getFavorites("proj", "Folder")],
        [
            "createDefinitionEnvironmentTemplate",
            () => client.createDefinitionEnvironmentTemplate(makeEnvironmentTemplate(), "proj")
        ],
        [
            "getDefinitionEnvironmentTemplate",
            () => client.getDefinitionEnvironmentTemplate("proj", environmentTemplates[0].id)
        ],
        [
            "listDefinitionEnvironmentTemplates",
            () => client.listDefinitionEnvironmentTemplates("proj")
        ],
        [
            "undeleteReleaseDefinitionEnvironmentTemplate",
            () =>
                client.undeleteReleaseDefinitionEnvironmentTemplate(
                    "proj",
                    environmentTemplates[2].id
                )
        ]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteFolder", () => client.deleteFolder("proj", folders[0].path)],
        ["deleteFavorites", () => client.deleteFavorites("proj", "ReleaseDefinition")],
        [
            "deleteFavoritesWithIdentity",
            () => client.deleteFavorites("proj", "ReleaseDefinition", "id-1", "fav-1")
        ],
        [
            "deleteDefinitionEnvironmentTemplate",
            () => client.deleteDefinitionEnvironmentTemplate("proj", environmentTemplates[0].id)
        ]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("adds a definition tag only when it is new", async () => {
        await expect(client.addDefinitionTag("proj", 1, "canary")).resolves.toEqual([
            ...definitionTags,
            "canary"
        ]);
        await expect(client.addDefinitionTag("proj", 1, definitionTags[0])).resolves.toEqual(
            definitionTags
        );
    });

    it("merges posted definition tags without duplicates", async () => {
        const merged = await client.addDefinitionTags([definitionTags[1], "fresh"], "proj", 1);
        expect(merged).toEqual([...definitionTags, "fresh"]);
    });

    it("deletes a definition tag", async () => {
        const remaining = await client.deleteDefinitionTag("proj", 1, definitionTags[0]);
        expect(remaining).not.toContain(definitionTags[0]);
        expect(remaining).toContain(definitionTags[1]);
    });

    it("returns the seeded definition tags as a copy", async () => {
        const current = await client.getDefinitionTags("proj", 1);
        expect(current).toEqual(definitionTags);
        expect(current).not.toBe(definitionTags);
    });

    it("adds a release tag only when it is new", async () => {
        await expect(client.addReleaseTag("proj", 1, "canary")).resolves.toEqual([
            ...releaseTags,
            "canary"
        ]);
        await expect(client.addReleaseTag("proj", 1, releaseTags[0])).resolves.toEqual(releaseTags);
    });

    it("merges posted release tags without duplicates", async () => {
        const merged = await client.addReleaseTags([releaseTags[2], "fresh"], "proj", 1);
        expect(merged).toEqual([...releaseTags, "fresh"]);
    });

    it("deletes a release tag", async () => {
        const remaining = await client.deleteReleaseTag("proj", 1, releaseTags[1]);
        expect(remaining).toEqual([releaseTags[0], releaseTags[2]]);
    });

    it("returns the seeded release tags as a copy", async () => {
        const current = await client.getReleaseTags("proj", 1);
        expect(current).toEqual(releaseTags);
        expect(current).not.toBe(releaseTags);
    });

    it("returns the union of release and definition tags", async () => {
        await expect(client.getTags("proj")).resolves.toEqual(tags);
    });

    it("creates a folder honoring the path argument", async () => {
        const folder = await client.createFolder(makeFolder("\\ignored"), "proj", "\\wanted");
        expect(folder.path).toBe("\\wanted");
        expect(folder).toHaveProperty("createdBy");
    });

    it("creates a folder falling back to the posted path", async () => {
        const folder = await client.createFolder(makeFolder("\\posted"), "proj");
        expect(folder.path).toBe("\\posted");
    });

    it("lists every folder when no path is given", async () => {
        await expect(client.getFolders("proj")).resolves.toEqual(folders);
    });

    it("filters folders by path prefix", async () => {
        const matched = await client.getFolders("proj", "\\shared");
        expect(matched.map(f => f.path)).toEqual([folders[0].path, folders[1].path]);
    });

    it("orders folders ascending", async () => {
        const ordered = await client.getFolders("proj", undefined, FolderPathQueryOrder.Ascending);
        expect(ordered.map(f => f.path)).toEqual(
            folders.map(f => f.path).sort((a, b) => a.localeCompare(b))
        );
    });

    it("orders folders descending", async () => {
        const ordered = await client.getFolders("proj", undefined, FolderPathQueryOrder.Descending);
        expect(ordered.map(f => f.path)).toEqual(
            folders.map(f => f.path).sort((a, b) => b.localeCompare(a))
        );
    });

    it("leaves folders unordered for the none query order", async () => {
        const ordered = await client.getFolders("proj", undefined, FolderPathQueryOrder.None);
        expect(ordered).toEqual(folders);
    });

    it("updates a known folder", async () => {
        const updated = await client.updateFolder(
            { description: "changed" } as any,
            "proj",
            folders[2].path
        );
        expect(updated.description).toBe("changed");
        expect(updated.createdOn).toBe(folders[2].createdOn);
        expect(updated.path).toBe(folders[2].path);
    });

    it("fabricates a folder for an unknown path", async () => {
        const updated = await client.updateFolder({} as any, "proj", "\\missing");
        expect(updated.path).toBe("\\missing");
        expect(updated.createdOn).toBeInstanceOf(Date);
    });

    it("creates favorites keeping the posted type", async () => {
        const created = await client.createFavorites(
            [makeFavoriteItem("Folder")],
            "proj",
            "ReleaseDefinition"
        );
        expect(created[0].type).toBe("Folder");
    });

    it("creates favorites defaulting the type to the scope", async () => {
        const created = await client.createFavorites(
            [{ id: "f1", name: "n", data: "d", type: "" }],
            "proj",
            "ReleaseDefinition",
            "identity-1"
        );
        expect(created[0].type).toBe("ReleaseDefinition");
        expect(created[0].id).toBe("f1");
    });

    it("filters favorites by scope", async () => {
        const matched = await client.getFavorites("proj", "Folder");
        expect(matched).toEqual([favorites[2]]);
    });

    it("falls back to every favorite for an unknown scope", async () => {
        const matched = await client.getFavorites("proj", "Nope", "identity-1");
        expect(matched).toEqual(favorites);
    });

    it("creates an environment template merging the posted fields", async () => {
        const created = await client.createDefinitionEnvironmentTemplate(
            { id: "tpl-1", name: "mine" } as any,
            "proj"
        );
        expect(created.id).toBe("tpl-1");
        expect(created.name).toBe("mine");
        expect(created.canDelete).toBe(true);
    });

    it("returns a known environment template", async () => {
        const template = await client.getDefinitionEnvironmentTemplate(
            "proj",
            environmentTemplates[1].id
        );
        expect(template).toBe(environmentTemplates[1]);
    });

    it("fabricates an environment template for an unknown id", async () => {
        const template = await client.getDefinitionEnvironmentTemplate("proj", "unknown-tpl");
        expect(template.id).toBe("unknown-tpl");
        expect(template.isDeleted).toBe(false);
    });

    it("lists live environment templates by default", async () => {
        const live = await client.listDefinitionEnvironmentTemplates("proj");
        expect(live).toEqual([environmentTemplates[0], environmentTemplates[1]]);
    });

    it("lists deleted environment templates when asked", async () => {
        const deleted = await client.listDefinitionEnvironmentTemplates("proj", true);
        expect(deleted).toEqual([environmentTemplates[2]]);
    });

    it("undeletes a known environment template", async () => {
        const restored = await client.undeleteReleaseDefinitionEnvironmentTemplate(
            "proj",
            environmentTemplates[2].id
        );
        expect(restored.id).toBe(environmentTemplates[2].id);
        expect(restored.isDeleted).toBe(false);
        expect(restored.name).toBe(environmentTemplates[2].name);
    });

    it("fabricates an undeleted environment template for an unknown id", async () => {
        const restored = await client.undeleteReleaseDefinitionEnvironmentTemplate("proj", "gone");
        expect(restored.id).toBe("gone");
        expect(restored.isDeleted).toBe(false);
    });
});

describe("release folder, favorite and template factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes a folder with a generated path", () => {
        const folder = makeFolder();
        expect(folder.path.startsWith("\\")).toBe(true);
        expect(folder.lastChangedBy).toHaveProperty("displayName");
    });

    it("makes a release definition favorite by default", () => {
        expect(makeFavoriteItem().type).toBe("ReleaseDefinition");
        expect(makeFavoriteItem("Folder").type).toBe("Folder");
    });

    it("makes a live environment template by default", () => {
        const template = makeEnvironmentTemplate();
        expect(template.isDeleted).toBe(false);
        expect(template.canDelete).toBe(true);
        expect(makeEnvironmentTemplate(true).isDeleted).toBe(true);
    });

    it("exposes seeded tags, folders, favorites and templates", () => {
        expect(releaseTags.length).toBe(3);
        expect(definitionTags.length).toBe(2);
        expect(tags.length).toBe(5);
        expect(folders.length).toBe(3);
        expect(favorites.length).toBe(3);
        expect(environmentTemplates.length).toBe(3);
    });
});
