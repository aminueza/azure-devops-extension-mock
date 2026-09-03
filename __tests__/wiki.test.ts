import { WikiRestClient, WikiType } from "azure-devops-extension-api/Wiki";
import { getClient, MockWikiRestClient } from "../azure-devops-extension-api";
import * as WikiData from "../azure-devops-extension-api/wiki/Data";

describe("WikiRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(WikiRestClient) as unknown as MockWikiRestClient;

    it("is registered under the WikiRestClient type", () => {
        expect(client.TYPE).toBe(WikiRestClient);
    });

    it("lists wikis", async () => {
        const wikis = await client.getAllWikis("proj");
        expect(wikis.map(w => w.name)).toEqual(["Project.wiki", "Code.wiki"]);
        for (const wiki of wikis) {
            expect(typeof wiki.id).toBe("string");
            expect(wiki.type).toBe(WikiType.ProjectWiki);
            expect(wiki.mappedPath).toBe("/");
        }
    });

    it("gets a wiki by id", async () => {
        const [first] = await client.getAllWikis();
        const found = await client.getWiki(first.id);
        expect(found).toBe(first);
    });

    it("gets a wiki by name", async () => {
        const [, second] = await client.getAllWikis();
        const found = await client.getWiki("Code.wiki", "proj");
        expect(found).toBe(second);
    });

    it("fabricates a wiki for an unknown identifier", async () => {
        const made = await client.getWiki("Missing.wiki");
        expect(made.name).toBe("Missing.wiki");
        expect(typeof made.id).toBe("string");
    });

    it("creates a wiki echoing the parameters", async () => {
        const created = await client.createWiki(
            {
                name: "New.wiki",
                projectId: "proj-id",
                repositoryId: "repo-id",
                mappedPath: "/docs",
                type: WikiType.CodeWiki
            } as any,
            "proj"
        );
        expect(created.name).toBe("New.wiki");
        expect(created.projectId).toBe("proj-id");
        expect(created.repositoryId).toBe("repo-id");
        expect(created.mappedPath).toBe("/docs");
        expect(created.type).toBe(WikiType.CodeWiki);
        expect(typeof created.id).toBe("string");
    });

    it("updates a wiki with provided versions", async () => {
        const updated = await client.updateWiki({ versions: [{ version: "release" }] } as any, "wiki-1", "proj");
        expect(updated.id).toBe("wiki-1");
        expect(updated.versions).toEqual([{ version: "release" }]);
    });

    it("updates a wiki with default versions", async () => {
        const updated = await client.updateWiki({} as any, "wiki-2");
        expect(updated.id).toBe("wiki-2");
        expect(updated.versions).toEqual([{ version: "wikiMain" }]);
    });

    it("deletes a wiki returning a wiki", async () => {
        const deleted = await client.deleteWiki("wiki-1", "proj");
        expect(deleted.name).toBe("Project.wiki");
        expect(typeof deleted.id).toBe("string");
    });

    it("returns a paged batch of page details", async () => {
        const batch = await client.getPagesBatch({ top: 10 }, "proj", "wiki-1");
        expect(batch.length).toBe(3);
        expect(batch.continuationToken).toBe("");
        for (const detail of batch) {
            expect(typeof detail.id).toBe("number");
            expect(detail.path.startsWith("/")).toBe(true);
            expect(detail.viewStats.length).toBeGreaterThan(0);
        }
    });

    it("gets page data for the requested id", async () => {
        const detail = await client.getPageData("proj", "wiki-1", 42);
        expect(detail.id).toBe(42);
        expect(detail.viewStats.length).toBeGreaterThan(0);
    });

    it("gets the first page when no path is given", async () => {
        const res = await client.getPage("proj", "wiki-1");
        expect(res.page.path).toBe("/Home");
        expect(res.page.isParentPage).toBe(true);
        expect(res.eTag).toEqual([`"${res.page.id}"`]);
    });

    it("gets a known page by path", async () => {
        const res = await client.getPage("proj", "wiki-1", "/FAQ");
        expect(res.page.path).toBe("/FAQ");
        expect(res.page.gitItemPath).toBe("/FAQ.md");
        expect(res.page.isParentPage).toBe(false);
    });

    it("fabricates a page for an unknown path", async () => {
        const res = await client.getPage("proj", "wiki-1", "/Nope/Deep");
        expect(res.page.path).toBe("/Nope/Deep");
        expect(res.page.content).toContain("# Deep");
    });

    it("gets page text for the first page when no path is given", async () => {
        const text = await client.getPageText("proj", "wiki-1");
        expect(text).toContain("# Home");
    });

    it("gets page text for a known path", async () => {
        const text = await client.getPageText("proj", "wiki-1", "/API/Overview");
        expect(text).toContain("# Overview");
    });

    it("fabricates page text for an unknown path", async () => {
        const text = await client.getPageText("proj", "wiki-1", "/Missing");
        expect(text).toContain("# Missing");
    });

    it("falls back to a generated home page when no fixture pages exist", async () => {
        const backup = WikiData.pages.splice(0, WikiData.pages.length);
        try {
            const res = await client.getPage("proj", "wiki-1");
            expect(res.page.path).toBe("/Home");
            const text = await client.getPageText("proj", "wiki-1");
            expect(text).toContain("# Home");
        } finally {
            WikiData.pages.push(...backup);
        }
    });

    it("returns an empty string when the generated page has no content", async () => {
        const spy = jest.spyOn(WikiData, "makeWikiPage").mockReturnValue({ id: 1, path: "/X" } as any);
        try {
            const text = await client.getPageText("proj", "wiki-1", "/X");
            expect(text).toBe("");
        } finally {
            spy.mockRestore();
        }
    });

    it("creates or updates a page with the given content", async () => {
        const res = await client.createOrUpdatePage({ content: "hello" }, "proj", "wiki-1", "/New", "v1");
        expect(res.page.path).toBe("/New");
        expect(res.page.content).toBe("hello");
        expect(res.eTag).toEqual([`"${res.page.id}"`]);
    });

    it("creates or updates a page without parameters", async () => {
        const res = await client.createOrUpdatePage(undefined, "proj", "wiki-1", "/Empty", "v1");
        expect(res.page.path).toBe("/Empty");
        expect(res.page.content).toBeUndefined();
    });

    it("deletes a page returning its response", async () => {
        const res = await client.deletePage("proj", "wiki-1", "/Old");
        expect(res.page.path).toBe("/Old");
        expect(res.eTag).toEqual([`"${res.page.id}"`]);
    });

    it("builds wiki pages and details with default arguments", () => {
        const page = WikiData.makeWikiPage();
        expect(page.path).toBe("/Home");
        const detail = WikiData.makeWikiPageDetail();
        expect(typeof detail.id).toBe("number");
        const wiki = WikiData.makeWiki();
        expect(wiki.name).toBe("Project.wiki");
    });
});
