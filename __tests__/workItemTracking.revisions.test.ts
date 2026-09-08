import {
    WorkItemTrackingRestClient,
    CommentSortOrder,
    WorkItemExpand
} from "azure-devops-extension-api/WorkItemTracking";
import { getClient } from "../azure-devops-extension-api";
import {
    comments,
    deletedWorkItems,
    revisions,
    templates,
    updates,
    workItems
} from "../azure-devops-extension-api/workItemTracking/Data";

describe("WorkItemTrackingRestClient attachments, history, deletions and templates", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(WorkItemTrackingRestClient);
    const workItemId = workItems[0].id;
    const missingId = 999999;
    const seededTemplate = templates[0];

    const valueCases: Array<[string, () => Promise<unknown>]> = [
        ["createAttachment", () => client.createAttachment("payload", "proj", "notes.txt", "Simple", "Area")],
        ["getAttachmentContent", () => client.getAttachmentContent("att-1", "proj", "notes.txt", true)],
        ["getAttachmentZip", () => client.getAttachmentZip("att-1", "proj", "notes.txt", false)],
        ["getComment", () => client.getComment(workItemId, comments[0].revision, "proj")],
        ["getComments", () => client.getComments(workItemId, "proj", 1, 3, CommentSortOrder.Asc)],
        ["getRevision", () => client.getRevision(workItemId, 1, "proj", WorkItemExpand.All)],
        ["getRevisions", () => client.getRevisions(workItemId, "proj", 2, 1, WorkItemExpand.Fields)],
        ["getUpdate", () => client.getUpdate(workItemId, updates[0].id, "proj")],
        ["getUpdates", () => client.getUpdates(workItemId, "proj", 2, 1)],
        ["getDeletedWorkItem", () => client.getDeletedWorkItem(deletedWorkItems[0].id, "proj")],
        ["getDeletedWorkItemShallowReferences", () => client.getDeletedWorkItemShallowReferences("proj")],
        ["getDeletedWorkItems", () => client.getDeletedWorkItems([deletedWorkItems[0].id], "proj")],
        ["restoreWorkItem", () => client.restoreWorkItem({ isDeleted: false }, deletedWorkItems[0].id, "proj")],
        ["createTemplate", () => client.createTemplate(seededTemplate, "proj", "team")],
        ["getTemplate", () => client.getTemplate("proj", "team", seededTemplate.id)],
        ["getTemplates", () => client.getTemplates("proj", "team", "Bug")],
        ["replaceTemplate", () => client.replaceTemplate(seededTemplate, "proj", "team", seededTemplate.id)],
        ["getWorkItemTemplate", () => client.getWorkItemTemplate("proj", "Bug", "System.Title", new Date(), WorkItemExpand.None)]
    ];

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["destroyWorkItem", () => client.destroyWorkItem(workItemId, "proj")],
        ["deleteTemplate", () => client.deleteTemplate("proj", "team", seededTemplate.id)]
    ];

    it.each(valueCases)("%s resolves a value", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it.each(voidCases)("%s resolves nothing", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("mints a fresh attachment reference", async () => {
        const first = await client.createAttachment("payload");
        const second = await client.createAttachment("payload");
        expect(first.id).not.toBe(second.id);
        expect(first.url).toBeTruthy();
    });

    it("encodes the attachment id into the content buffer", async () => {
        const content = await client.getAttachmentContent("att-9");
        expect(new TextDecoder().decode(content)).toBe("att-9");
        const zip = await client.getAttachmentZip("att-9");
        expect(new TextDecoder().decode(zip)).toBe("att-9.zip");
    });

    it("returns a seeded comment and fabricates an unknown revision", async () => {
        const known = await client.getComment(workItemId, comments[2].revision);
        expect(known).toBe(comments[2]);
        const unknown = await client.getComment(workItemId, 99);
        expect(unknown.revision).toBe(99);
        expect(unknown.renderedText).toContain(unknown.text);
    });

    it("returns every comment when no filter is given", async () => {
        const all = await client.getComments(workItemId);
        expect(all.count).toBe(comments.length);
        expect(all.fromRevisionCount).toBe(comments.length);
        expect(all.totalCount).toBe(comments.length);
        expect(all.comments[0]).toBe(comments[0]);
    });

    it("filters comments from a revision", async () => {
        const tail = await client.getComments(workItemId, "proj", 3);
        expect(tail.count).toBe(3);
        expect(tail.fromRevisionCount).toBe(3);
        expect(tail.totalCount).toBe(comments.length);
        expect(tail.comments[0]).toBe(comments[2]);
    });

    it("caps comments with top without changing the matched count", async () => {
        const capped = await client.getComments(workItemId, "proj", undefined, 2);
        expect(capped.count).toBe(2);
        expect(capped.fromRevisionCount).toBe(comments.length);
    });

    it("sorts comments descending only when asked", async () => {
        const asc = await client.getComments(workItemId, "proj", undefined, undefined, CommentSortOrder.Asc);
        expect(asc.comments[0]).toBe(comments[0]);
        const desc = await client.getComments(workItemId, "proj", undefined, undefined, CommentSortOrder.Desc);
        expect(desc.comments[0]).toBe(comments[comments.length - 1]);
        expect(comments[0].revision).toBe(1);
    });

    it("returns a seeded revision and fabricates an unknown one", async () => {
        const known = await client.getRevision(workItemId, 2);
        expect(known).toBe(revisions[1]);
        const unknown = await client.getRevision(missingId, 7);
        expect(unknown.id).toBe(missingId);
        expect(unknown.rev).toBe(7);
    });

    it("lists seeded revisions and a single fabricated one", async () => {
        const known = await client.getRevisions(workItemId);
        expect(known).toHaveLength(revisions.length);
        expect(known[0]).toBe(revisions[0]);
        const unknown = await client.getRevisions(missingId);
        expect(unknown).toHaveLength(1);
        expect(unknown[0].id).toBe(missingId);
    });

    it("pages revisions with top and skip", async () => {
        const page = await client.getRevisions(workItemId, "proj", 2, 1);
        expect(page).toHaveLength(2);
        expect(page[0]).toBe(revisions[1]);
        const skipped = await client.getRevisions(workItemId, "proj", undefined, 3);
        expect(skipped).toHaveLength(2);
        expect(skipped[0]).toBe(revisions[3]);
    });

    it("returns a seeded update and fabricates an unknown one", async () => {
        const known = await client.getUpdate(workItemId, updates[1].id);
        expect(known).toBe(updates[1]);
        const unknown = await client.getUpdate(missingId, 12);
        expect(unknown.id).toBe(12);
        expect(unknown.workItemId).toBe(missingId);
    });

    it("lists seeded updates and a single fabricated one", async () => {
        const known = await client.getUpdates(workItemId);
        expect(known).toHaveLength(updates.length);
        const unknown = await client.getUpdates(missingId);
        expect(unknown).toHaveLength(1);
        expect(unknown[0].workItemId).toBe(missingId);
    });

    it("pages updates with top and skip", async () => {
        const page = await client.getUpdates(workItemId, "proj", 2, 1);
        expect(page).toHaveLength(2);
        expect(page[0]).toBe(updates[1]);
        const skipped = await client.getUpdates(workItemId, "proj", undefined, 2);
        expect(skipped).toHaveLength(2);
        expect(skipped[0]).toBe(updates[2]);
    });

    it("returns a seeded deleted work item and fabricates an unknown one", async () => {
        const known = await client.getDeletedWorkItem(deletedWorkItems[1].id);
        expect(known).toBe(deletedWorkItems[1]);
        const unknown = await client.getDeletedWorkItem(missingId);
        expect(unknown.id).toBe(missingId);
        expect(unknown.resource.id).toBe(missingId);
    });

    it("maps every deleted work item to a shallow reference", async () => {
        const shallow = await client.getDeletedWorkItemShallowReferences();
        expect(shallow).toHaveLength(deletedWorkItems.length);
        expect(shallow[0]).toEqual({ id: deletedWorkItems[0].id, url: deletedWorkItems[0].url });
    });

    it("resolves known ids and fabricates unknown ones in a delete batch", async () => {
        const batch = await client.getDeletedWorkItems([deletedWorkItems[2].id, missingId]);
        expect(batch[0]).toBe(deletedWorkItems[2]);
        expect(batch[1].id).toBe(missingId);
    });

    it("reflects the restore payload without mutating the seeded entry", async () => {
        const target = deletedWorkItems[0];
        const restored = await client.restoreWorkItem({ isDeleted: false }, target.id, "proj");
        expect(restored.id).toBe(target.id);
        expect(restored.resource.fields["System.IsDeleted"]).toBe(false);
        const redeleted = await client.restoreWorkItem({ isDeleted: true }, target.id);
        expect(redeleted.resource.fields["System.IsDeleted"]).toBe(true);
        expect(target.resource.fields["System.IsDeleted"]).toBeUndefined();
    });

    it("echoes the posted template over a fixture", async () => {
        const created = await client.createTemplate(
            { ...seededTemplate, id: "", name: "Bug triage", workItemTypeName: "Bug" },
            "proj",
            "team"
        );
        expect(created.name).toBe("Bug triage");
        expect(created.workItemTypeName).toBe("Bug");
        expect(created.fields).toEqual(seededTemplate.fields);
    });

    it("returns a seeded template and fabricates an unknown one", async () => {
        const known = await client.getTemplate("proj", "team", templates[1].id);
        expect(known).toBe(templates[1]);
        const unknown = await client.getTemplate("proj", "team", "missing-template");
        expect(unknown.id).toBe("missing-template");
    });

    it("filters templates by work item type only when one is given", async () => {
        const all = await client.getTemplates("proj", "team");
        expect(all).toBe(templates);
        const bugs = await client.getTemplates("proj", "team", "Bug");
        expect(bugs).toHaveLength(2);
        const none = await client.getTemplates("proj", "team", "Epic");
        expect(none).toHaveLength(0);
    });

    it("keeps the template id when replacing its content", async () => {
        const target = templates[2];
        const replaced = await client.replaceTemplate(
            { ...target, id: "ignored", description: "Rewritten" },
            "proj",
            "team",
            target.id
        );
        expect(replaced.id).toBe(target.id);
        expect(replaced.description).toBe("Rewritten");
        expect(target.description).not.toBe("Rewritten");
    });

    it("returns every template field unless a subset is requested", async () => {
        const full = await client.getWorkItemTemplate("proj", "Task");
        expect(full.fields["System.WorkItemType"]).toBe("Task");
        expect(Object.keys(full.fields).length).toBeGreaterThan(2);
        const subset = await client.getWorkItemTemplate("proj", "Task", "System.Title,System.State");
        expect(Object.keys(subset.fields)).toEqual(["System.Title", "System.State"]);
    });
});
