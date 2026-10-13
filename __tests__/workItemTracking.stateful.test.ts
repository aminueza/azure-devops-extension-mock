import {
    FieldType,
    GetFieldsExpand,
    TreeNodeStructureType,
    TreeStructureGroup,
    WorkItemTrackingRestClient
} from "azure-devops-extension-api/WorkItemTracking";
import { getClient, stateful } from "../azure-devops-extension-api";
import {
    classificationNodes,
    deletedWorkItems,
    fields,
    makeClassificationNode,
    makeQuery,
    makeWorkItemField,
    makeWorkItemTemplate,
    queries,
    templates,
    workItems
} from "../azure-devops-extension-api/workItemTracking/Data";

const client = getClient(WorkItemTrackingRestClient);
const titled = (title: string) => [{ op: "add", path: "/fields/System.Title", value: title }];
const unusedId = (): number => Math.max(...workItems.map(w => w.id), ...deletedWorkItems.map(d => d.id)) + 1000;

describe("WorkItemTrackingRestClient mock in stateful mode", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });
    beforeEach(() => stateful.enable());
    afterEach(() => stateful.disable());

    describe("work items", () => {
        it("returns a created work item from every read", async () => {
            const seeded = [...workItems];
            const created = await client.createWorkItem(titled("Created"), "proj", "Bug");
            expect(created.fields["System.Title"]).toBe("Created");
            expect(await client.getWorkItem(created.id)).toBe(created);
            expect(await client.getWorkItems([created.id])).toEqual([created]);
            expect(await client.getWorkItemsBatch({ ids: [created.id] } as never)).toEqual([created]);
            expect(workItems.filter(w => w.id === created.id)).toEqual([created]);
            stateful.reset();
            expect(workItems).toEqual(seeded);
        });

        it("returns seeded work items from the list reads and fabricates unknown ids", async () => {
            const known = workItems[0];
            const missing = unusedId();
            const items = await client.getWorkItems([known.id, missing]);
            expect(items[0]).toBe(known);
            expect(items[1].id).toBe(missing);
            expect(workItems.some(w => w.id === missing)).toBe(false);
            const batch = await client.getWorkItemsBatch({ ids: [known.id, missing] } as never);
            expect(batch[0]).toBe(known);
            expect(batch[1].id).toBe(missing);
        });

        it("replaces a work item on update and bumps its revision", async () => {
            const seeded = [...workItems];
            const known = workItems[0];
            const updated = await client.updateWorkItem(
                [{ op: "replace", path: "/fields/System.Title", value: "Updated" }],
                known.id
            );
            expect(updated.rev).toBe(known.rev + 1);
            expect(await client.getWorkItem(known.id)).toBe(updated);
            expect((await client.getWorkItems([known.id]))[0].fields["System.Title"]).toBe("Updated");
            expect(workItems.length).toBe(seeded.length);
            const again = await client.updateWorkItem(titled("Again"), known.id);
            expect(again.rev).toBe(known.rev + 2);
            expect(workItems.length).toBe(seeded.length);
            stateful.reset();
            expect(workItems).toEqual(seeded);
            expect(await client.getWorkItem(known.id)).toBe(known);
        });

        it("keeps a work item updated under an unknown id", async () => {
            const missing = unusedId();
            const updated = await client.updateWorkItem(titled("Fresh"), missing);
            expect(await client.getWorkItem(missing)).toBe(updated);
        });

        it("moves a deleted work item to the recycle bin", async () => {
            const seeded = [...workItems];
            const seededDeleted = [...deletedWorkItems];
            const known = workItems[0];
            const deleted = await client.deleteWorkItem(known.id);
            expect(deleted.resource).toBe(known);
            expect(workItems.some(w => w.id === known.id)).toBe(false);
            expect(workItems.length).toBe(seeded.length - 1);
            expect(await client.getDeletedWorkItem(known.id)).toBe(deleted);
            expect(await client.getDeletedWorkItems([known.id])).toEqual([deleted]);
            expect((await client.getDeletedWorkItemShallowReferences()).map(d => d.id)).toContain(known.id);
            await client.deleteWorkItem(known.id);
            expect(deletedWorkItems.filter(d => d.id === known.id).length).toBe(1);
            stateful.reset();
            expect(workItems).toEqual(seeded);
            expect(deletedWorkItems).toEqual(seededDeleted);
        });

        it("restores a work item from the recycle bin", async () => {
            const seeded = [...workItems];
            const seededDeleted = [...deletedWorkItems];
            const target = deletedWorkItems[0];
            const kept = await client.restoreWorkItem({ isDeleted: true }, target.id);
            expect(kept.resource.fields["System.IsDeleted"]).toBe(true);
            expect(deletedWorkItems).toEqual(seededDeleted);
            expect(workItems).toEqual(seeded);
            const restored = await client.restoreWorkItem({ isDeleted: false }, target.id);
            expect(deletedWorkItems.some(d => d.id === target.id)).toBe(false);
            expect((await client.getDeletedWorkItemShallowReferences()).map(d => d.id)).not.toContain(target.id);
            expect(await client.getWorkItem(target.id)).toBe(restored.resource);
            expect(await client.getWorkItems([target.id])).toEqual([restored.resource]);
            stateful.reset();
            expect(workItems).toEqual(seeded);
            expect(deletedWorkItems).toEqual(seededDeleted);
        });

        it("round trips a delete followed by a restore", async () => {
            const known = workItems[1];
            await client.deleteWorkItem(known.id);
            await client.restoreWorkItem({ isDeleted: false }, known.id);
            expect(workItems.filter(w => w.id === known.id).length).toBe(1);
            expect(deletedWorkItems.some(d => d.id === known.id)).toBe(false);
        });

        it("removes a destroyed work item from the recycle bin", async () => {
            const seededDeleted = [...deletedWorkItems];
            const target = deletedWorkItems[0];
            await client.destroyWorkItem(target.id);
            expect((await client.getDeletedWorkItemShallowReferences()).map(d => d.id)).not.toContain(target.id);
            expect(deletedWorkItems.length).toBe(seededDeleted.length - 1);
            stateful.reset();
            expect(deletedWorkItems).toEqual(seededDeleted);
        });
    });

    describe("fields", () => {
        it("returns a created field from get and list", async () => {
            const seeded = [...fields];
            const created = await client.createField(makeWorkItemField("Custom.Effort", FieldType.Integer));
            expect(await client.getField("Custom.Effort")).toBe(created);
            expect(await client.getFields()).toContain(created);
            const recreated = await client.createField(makeWorkItemField("Custom.Effort", FieldType.Double));
            expect(fields.filter(f => f.referenceName === "Custom.Effort")).toEqual([recreated]);
            stateful.reset();
            expect(fields).toEqual(seeded);
        });

        it("replaces a field on update", async () => {
            const seeded = [...fields];
            const updated = await client.updateField({ isDeleted: true }, "System.Title");
            expect(await client.getField("System.Title")).toBe(updated);
            expect((await client.getFields()).map(f => f.referenceName)).not.toContain("System.Title");
            expect(await client.getFields(undefined, GetFieldsExpand.IncludeDeleted)).toContain(updated);
            expect(fields.length).toBe(seeded.length);
            stateful.reset();
            expect(fields).toEqual(seeded);
        });

        it("removes a deleted field", async () => {
            const seeded = [...fields];
            await client.deleteField("System.State");
            await client.deleteField("CreatedBy");
            const names = (await client.getFields(undefined, GetFieldsExpand.IncludeDeleted)).map(f => f.referenceName);
            expect(names).not.toContain("System.State");
            expect(names).not.toContain("System.CreatedBy");
            expect(fields.length).toBe(seeded.length - 2);
            stateful.reset();
            expect(fields).toEqual(seeded);
        });
    });

    describe("classification nodes", () => {
        it("returns a created node from the reads", async () => {
            const seeded = [...classificationNodes];
            const created = await client.createOrUpdateClassificationNode(
                makeClassificationNode("Payments", TreeNodeStructureType.Area),
                "proj",
                TreeStructureGroup.Areas
            );
            expect(await client.getClassificationNode("proj", TreeStructureGroup.Areas, "Payments")).toBe(created);
            expect(await client.getClassificationNodes("proj", [created.id])).toEqual([created]);
            const iteration = await client.createOrUpdateClassificationNode(
                makeClassificationNode("Payments", TreeNodeStructureType.Iteration),
                "proj",
                TreeStructureGroup.Iterations
            );
            expect(await client.getClassificationNode("proj", TreeStructureGroup.Iterations, "Payments")).toBe(
                iteration
            );
            expect(classificationNodes.length).toBe(seeded.length + 2);
            stateful.reset();
            expect(classificationNodes).toEqual(seeded);
        });

        it("replaces a node on update", async () => {
            const seeded = [...classificationNodes];
            const known = classificationNodes.find(node => node.name === "Sprint 1")!;
            const updated = await client.updateClassificationNode(
                { ...known, hasChildren: true },
                "proj",
                TreeStructureGroup.Iterations,
                known.path
            );
            expect(updated.hasChildren).toBe(true);
            expect(await client.getClassificationNode("proj", TreeStructureGroup.Iterations, known.path)).toBe(updated);
            expect(classificationNodes.length).toBe(seeded.length);
            stateful.reset();
            expect(classificationNodes).toEqual(seeded);
        });

        it("removes a deleted node", async () => {
            const seeded = [...classificationNodes];
            const web = classificationNodes.find(node => node.name === "Web")!;
            await client.deleteClassificationNode("proj", TreeStructureGroup.Areas, "Web");
            expect(classificationNodes).not.toContain(web);
            const sprint = classificationNodes.find(node => node.name === "Sprint 2")!;
            await client.deleteClassificationNode("proj", TreeStructureGroup.Iterations, sprint.path);
            expect(classificationNodes).not.toContain(sprint);
            await client.deleteClassificationNode("proj", TreeStructureGroup.Iterations, "Api");
            expect(classificationNodes.length).toBe(seeded.length - 2);
            stateful.reset();
            expect(classificationNodes).toEqual(seeded);
        });
    });

    describe("queries", () => {
        it("returns a created query and a created folder from the reads", async () => {
            const seeded = [...queries];
            const created = await client.createQuery({ ...makeQuery(), name: "My Bugs" }, "proj", "Shared Queries");
            expect(await client.getQuery("proj", created.id)).toBe(created);
            expect(await client.getQuery("proj", "Shared Queries/My Bugs")).toBe(created);
            expect(await client.getQueries("proj")).toContain(created);
            expect(await client.getQueriesBatch({ ids: [created.id] } as never, "proj")).toEqual([created]);
            expect((await client.searchQueries("proj", "My Bugs")).value).toEqual([created]);
            const folder = await client.createQuery(
                { ...makeQuery(), name: "Team", isFolder: true },
                "proj",
                "Shared Queries"
            );
            expect((await client.getQuery("proj", folder.id)).isFolder).toBe(true);
            const recreated = await client.createQuery({ ...makeQuery(), name: "My Bugs" }, "proj", "Shared Queries");
            expect(queries.filter(q => q.path === "Shared Queries/My Bugs")).toEqual([recreated]);
            expect(queries.length).toBe(seeded.length + 2);
            stateful.reset();
            expect(queries).toEqual(seeded);
        });

        it("replaces a query on update", async () => {
            const seeded = [...queries];
            const known = queries[0];
            const updated = await client.updateQuery({ ...known, wiql: "SELECT 1" }, "proj", known.id);
            expect(await client.getQuery("proj", known.id)).toBe(updated);
            expect(queries.length).toBe(seeded.length);
            const fresh = await client.updateQuery({ ...makeQuery("missing-query") }, "proj", "missing-query");
            expect(await client.getQuery("proj", "missing-query")).toBe(fresh);
            expect(queries.length).toBe(seeded.length + 1);
            stateful.reset();
            expect(queries).toEqual(seeded);
        });

        it("removes a deleted query", async () => {
            const seeded = [...queries];
            const [first, second, third] = seeded;
            await client.deleteQuery("proj", first.id);
            await client.deleteQuery("proj", second.path);
            await client.deleteQuery("proj", third.name);
            expect(await client.getQueries("proj")).toEqual([]);
            stateful.reset();
            expect(queries).toEqual(seeded);
        });
    });

    describe("templates", () => {
        it("returns a created template from get and list", async () => {
            const seeded = [...templates];
            const created = await client.createTemplate(makeWorkItemTemplate("template-new"), "proj", "team");
            expect(await client.getTemplate("proj", "team", "template-new")).toBe(created);
            expect(await client.getTemplates("proj", "team")).toContain(created);
            expect(await client.getTemplates("proj", "team", created.workItemTypeName)).toContain(created);
            const recreated = await client.createTemplate(makeWorkItemTemplate("template-new"), "proj", "team");
            expect(templates.filter(t => t.id === "template-new")).toEqual([recreated]);
            stateful.reset();
            expect(templates).toEqual(seeded);
        });

        it("replaces a template", async () => {
            const seeded = [...templates];
            const known = templates[0];
            const replaced = await client.replaceTemplate({ ...known, name: "Renamed" }, "proj", "team", known.id);
            expect(replaced.name).toBe("Renamed");
            expect(await client.getTemplate("proj", "team", known.id)).toBe(replaced);
            expect(templates.length).toBe(seeded.length);
            stateful.reset();
            expect(templates).toEqual(seeded);
        });

        it("removes a deleted template", async () => {
            const seeded = [...templates];
            const known = templates[0];
            await client.deleteTemplate("proj", "team", known.id);
            expect((await client.getTemplates("proj", "team")).map(t => t.id)).not.toContain(known.id);
            expect(templates.length).toBe(seeded.length - 1);
            stateful.reset();
            expect(templates).toEqual(seeded);
        });
    });
});

describe("WorkItemTrackingRestClient mock with stateful mode off", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("leaves every seeded list untouched", async () => {
        expect(stateful.isEnabled()).toBe(false);
        const lists: unknown[][] = [workItems, deletedWorkItems, fields, classificationNodes, queries, templates];
        const before = lists.map(list => [...list]);
        const known = workItems[0];
        const created = await client.createWorkItem(titled("Created"), "proj", "Bug");
        await client.updateWorkItem(titled("Updated"), known.id);
        await client.deleteWorkItem(known.id);
        await client.restoreWorkItem({ isDeleted: false }, deletedWorkItems[0].id);
        await client.destroyWorkItem(deletedWorkItems[0].id);
        await client.createField(makeWorkItemField("Custom.Effort", FieldType.Integer));
        await client.updateField({ isDeleted: true }, "System.Title");
        await client.deleteField("System.State");
        const node = makeClassificationNode("Payments", TreeNodeStructureType.Area);
        await client.createOrUpdateClassificationNode(node, "proj", TreeStructureGroup.Areas);
        await client.updateClassificationNode(node, "proj", TreeStructureGroup.Areas, "Web");
        await client.deleteClassificationNode("proj", TreeStructureGroup.Areas, "Web");
        await client.createQuery({ ...makeQuery(), name: "My Bugs" }, "proj", "Shared Queries");
        await client.updateQuery({ ...queries[0], wiql: "SELECT 1" }, "proj", queries[0].id);
        await client.deleteQuery("proj", queries[0].id);
        await client.createTemplate(makeWorkItemTemplate("template-new"), "proj", "team");
        await client.replaceTemplate({ ...templates[0], name: "Renamed" }, "proj", "team", templates[0].id);
        await client.deleteTemplate("proj", "team", templates[0].id);
        lists.forEach((list, index) => {
            expect(list.length).toBe(before[index].length);
            list.forEach((item, position) => expect(item).toBe(before[index][position]));
        });
        const [refetched] = await client.getWorkItems([known.id]);
        expect(refetched).not.toBe(known);
        expect(refetched.id).toBe(known.id);
        const [batched] = await client.getWorkItemsBatch({ ids: [created.id] } as never);
        expect(batched).not.toBe(created);
    });
});
