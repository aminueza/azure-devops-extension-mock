import { WikiRestClient, WikiType } from "azure-devops-extension-api/Wiki";
import {
    CommentExpandOptions,
    CommentReactionType,
    CommentSortOrder,
    CommentState
} from "azure-devops-extension-api/Comments";
import { GitVersionOptions, GitVersionType, VersionControlRecursionType } from "azure-devops-extension-api/Git";
import { getClient } from "../azure-devops-extension-api";

const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);

const version = { version: "wikiMain", versionOptions: GitVersionOptions.None, versionType: GitVersionType.Branch };

describe("WikiRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(WikiRestClient);

    it("creates a comment attachment", async () => {
        const attachment = await client.createCommentAttachment("bytes", "proj", "wiki", 1);
        expect(typeof attachment.id).toBe("string");
        expect(typeof attachment.createdBy.displayName).toBe("string");
        expect(attachment.createdDate).toBeInstanceOf(Date);
    });

    it("gets attachment content", async () => {
        const content = await client.getAttachmentContent("proj", "wiki", 1, "att-1");
        expect(content).toBeInstanceOf(ArrayBuffer);
        expect(decode(content)).toBe("att-1");
    });

    it("adds a comment reaction", async () => {
        const reaction = await client.addCommentReaction("proj", "wiki", 1, 7, CommentReactionType.Heart);
        expect(reaction.commentId).toBe(7);
        expect(reaction.type).toBe(CommentReactionType.Heart);
        expect(reaction.isCurrentUserEngaged).toBe(true);
        expect(reaction.count).toBeGreaterThan(0);
    });

    it("deletes a comment reaction", async () => {
        const reaction = await client.deleteCommentReaction("proj", "wiki", 1, 7, CommentReactionType.Like);
        expect(reaction.commentId).toBe(7);
        expect(reaction.type).toBe(CommentReactionType.Like);
        expect(reaction.isCurrentUserEngaged).toBe(false);
        expect(reaction.count).toBe(0);
    });

    it("gets engaged users with defaults", async () => {
        const users = await client.getEngagedUsers("proj", "wiki", 1, 7, CommentReactionType.Like);
        expect(users.length).toBe(5);
        for (const user of users) {
            expect(typeof user.id).toBe("string");
        }
    });

    it("gets engaged users with top and skip", async () => {
        const all = await client.getEngagedUsers("proj", "wiki", 1, 7, CommentReactionType.Like);
        const users = await client.getEngagedUsers("proj", "wiki", 1, 7, CommentReactionType.Like, 2, 1);
        expect(users).toEqual(all.slice(1, 3));
    });

    it("adds a comment echoing the request", async () => {
        const comment = await client.addComment({ parentId: 3, text: "hello" }, "proj", "wiki", 1);
        expect(comment.parentId).toBe(3);
        expect(comment.text).toBe("hello");
        expect(typeof comment.id).toBe("number");
        expect(comment.state).toBe(CommentState.Active);
    });

    it("deletes a comment", async () => {
        await expect(client.deleteComment("proj", "wiki", 1, 7)).resolves.toBeUndefined();
    });

    it("gets a known comment", async () => {
        const list = await client.listComments("proj", "wiki", 1);
        const comment = await client.getComment("proj", "wiki", 1, list.comments[0].id, true, CommentExpandOptions.All);
        expect(comment).toBe(list.comments[0]);
    });

    it("fabricates an unknown comment", async () => {
        const comment = await client.getComment("proj", "wiki", 1, 999_999);
        expect(comment.id).toBe(999_999);
        expect(typeof comment.text).toBe("string");
    });

    it("lists all comments", async () => {
        const list = await client.listComments("proj", "wiki", 1);
        expect(list.comments.length).toBe(3);
        expect(list.count).toBe(3);
        expect(list.totalCount).toBe(3);
        expect(list.continuationToken).toBe("");
    });

    it("lists comments limited by top", async () => {
        const list = await client.listComments(
            "proj",
            "wiki",
            1,
            2,
            "token",
            false,
            CommentExpandOptions.Reactions,
            CommentSortOrder.Desc,
            0
        );
        expect(list.comments.length).toBe(2);
        expect(list.count).toBe(2);
    });

    it("updates a comment", async () => {
        const list = await client.listComments("proj", "wiki", 1);
        const target = list.comments[1];
        const updated = await client.updateComment(
            { text: "edited", state: CommentState.Resolved },
            "proj",
            "wiki",
            1,
            target.id
        );
        expect(updated.id).toBe(target.id);
        expect(updated.text).toBe("edited");
        expect(updated.state).toBe(CommentState.Resolved);
        expect(updated.createdBy).toBe(target.createdBy);
    });

    it("gets home page text without a path", async () => {
        const text = await client.getPageText("proj", "wiki");
        expect(text).toContain("# Home");
    });

    it("gets page text for a known path", async () => {
        const text = await client.getPageText("proj", "wiki", "/API/Overview", VersionControlRecursionType.None, version, true);
        expect(text).toContain("# Overview");
    });

    it("fabricates page text for an unknown path", async () => {
        const text = await client.getPageText("proj", "wiki", "/Missing/Deep");
        expect(text).toContain("# Deep");
    });

    it("gets page zip", async () => {
        const zip = await client.getPageZip("proj", "wiki", "/FAQ");
        expect(zip).toBeInstanceOf(ArrayBuffer);
        expect(decode(zip)).toContain("# FAQ");
    });

    it("gets page text by known id", async () => {
        const batch = await client.getPagesBatch({ top: 10, continuationToken: "", pageViewsForDays: 1 }, "proj", "wiki");
        const faq = batch.find(d => d.path === "/FAQ")!;
        const text = await client.getPageByIdText("proj", "wiki", faq.id, VersionControlRecursionType.Full, true);
        expect(text).toContain("# FAQ");
    });

    it("fabricates page text for an unknown id", async () => {
        const text = await client.getPageByIdText("proj", "wiki", 424_242);
        expect(text).toContain("# Home");
    });

    it("gets page zip by id", async () => {
        const batch = await client.getPagesBatch({ top: 10, continuationToken: "", pageViewsForDays: 1 }, "proj", "wiki");
        const zip = await client.getPageByIdZip("proj", "wiki", batch[0].id);
        expect(zip).toBeInstanceOf(ArrayBuffer);
        expect(decode(zip)).toContain("# Home");
    });

    it("gets a batch of page details limited by top", async () => {
        const batch = await client.getPagesBatch({ top: 2, continuationToken: "", pageViewsForDays: 7 }, "proj", "wiki", version);
        expect(batch.length).toBe(2);
        expect(batch.continuationToken).toBeNull();
        for (const detail of batch) {
            expect(typeof detail.id).toBe("number");
            expect(detail.path.startsWith("/")).toBe(true);
            expect(detail.viewStats.length).toBe(7);
        }
    });

    it("gets the full batch when top is absent", async () => {
        const batch = await client.getPagesBatch({} as any, "proj", "wiki");
        expect(batch.length).toBe(4);
        expect(batch.map(d => d.path)).toEqual(["/Home", "/Getting-Started", "/FAQ", "/API/Overview"]);
    });

    it("gets page data for a known id", async () => {
        const [first] = await client.getPagesBatch({} as any, "proj", "wiki");
        const detail = await client.getPageData("proj", "wiki", first.id);
        expect(detail.id).toBe(first.id);
        expect(detail.path).toBe(first.path);
        expect(detail.viewStats.length).toBe(7);
    });

    it("gets page data limited to the requested days", async () => {
        const detail = await client.getPageData("proj", "wiki", 777, 3);
        expect(detail.id).toBe(777);
        expect(detail.viewStats.length).toBe(3);
        expect(detail.viewStats[0].day).toBeInstanceOf(Date);
    });

    it("creates or updates page view stats", async () => {
        const stats = await client.createOrUpdatePageViewStats("proj", "wiki", version, "/Home", "/Old");
        expect(stats.path).toBe("/Home");
        expect(stats.count).toBeGreaterThan(0);
        expect(stats.lastViewedTime).toBeInstanceOf(Date);
    });

    it("creates a wiki echoing the parameters", async () => {
        const created = await client.createWiki(
            {
                name: "New.wiki",
                projectId: "proj-id",
                repositoryId: "repo-id",
                mappedPath: "/docs",
                type: WikiType.CodeWiki,
                version
            },
            "proj"
        );
        expect(created.name).toBe("New.wiki");
        expect(created.projectId).toBe("proj-id");
        expect(created.repositoryId).toBe("repo-id");
        expect(created.mappedPath).toBe("/docs");
        expect(created.type).toBe(WikiType.CodeWiki);
        expect(typeof created.id).toBe("string");
    });

    it("deletes a known wiki", async () => {
        const [first] = await client.getAllWikis();
        const deleted = await client.deleteWiki(first.id, "proj");
        expect(deleted).toBe(first);
    });

    it("lists wikis", async () => {
        const wikis = await client.getAllWikis("proj");
        expect(wikis.map(w => w.name)).toEqual(["Project.wiki", "Code.wiki"]);
        expect(wikis[0].type).toBe(WikiType.ProjectWiki);
        expect(wikis[1].type).toBe(WikiType.CodeWiki);
        for (const wiki of wikis) {
            expect(typeof wiki.id).toBe("string");
            expect(wiki.versions[0].version).toBe("wikiMain");
        }
    });

    it("gets a wiki by id", async () => {
        const [first] = await client.getAllWikis();
        expect(await client.getWiki(first.id)).toBe(first);
    });

    it("gets a wiki by name", async () => {
        const [, second] = await client.getAllWikis();
        expect(await client.getWiki("Code.wiki", "proj")).toBe(second);
    });

    it("fabricates a wiki for an unknown identifier", async () => {
        const made = await client.getWiki("missing-id");
        expect(made.id).toBe("missing-id");
        expect(made.name.endsWith(".wiki")).toBe(true);
    });

    it("updates a wiki echoing the parameters", async () => {
        const [first] = await client.getAllWikis();
        const updated = await client.updateWiki(
            { name: "Renamed.wiki", versions: [{ ...version, version: "release" }] },
            first.id,
            "proj"
        );
        expect(updated.id).toBe(first.id);
        expect(updated.name).toBe("Renamed.wiki");
        expect(updated.versions[0].version).toBe("release");
    });
});
