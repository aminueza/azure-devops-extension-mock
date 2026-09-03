import { WorkItemTrackingRestClient, QueryType } from "azure-devops-extension-api/WorkItemTracking";
import { getClient } from "../azure-devops-extension-api";
import {
    makeWorkItemType,
    queries,
    workItems,
    workItemTypes
} from "../azure-devops-extension-api/workItemTracking/Data";

describe("WorkItemTrackingRestClient mock", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(WorkItemTrackingRestClient);

    it("exposes the real client class as TYPE", () => {
        expect((client as any).TYPE).toBe(WorkItemTrackingRestClient);
    });

    it("returns one work item per requested id", async () => {
        const items = await client.getWorkItems([5, 6], "proj", ["System.Title"]);
        expect(items.map(i => i.id)).toEqual([5, 6]);
        expect(items[0].fields["System.Id"]).toBe(5);
    });

    it("returns a known work item by id", async () => {
        const known = workItems[0];
        const item = await client.getWorkItem(known.id);
        expect(item).toBe(known);
    });

    it("fabricates an unknown work item by id", async () => {
        const item = await client.getWorkItem(123456);
        expect(item.id).toBe(123456);
        expect(workItems.some(w => w.id === 123456)).toBe(false);
    });

    it("applies add operations under /fields on create", async () => {
        const wi = await client.createWorkItem(
            [
                { op: "add", path: "/fields/System.Title", value: "Created" },
                { op: "add", path: "/fields/System.Tags", value: "a; b" }
            ],
            "proj",
            "Task"
        );
        expect(wi.fields["System.Title"]).toBe("Created");
        expect(wi.fields["System.Tags"]).toBe("a; b");
        expect(wi.fields["System.WorkItemType"]).toBe("Task");
    });

    it("ignores non-add, non-field and malformed operations on create", async () => {
        const wi = await client.createWorkItem(
            [
                { op: "replace", path: "/fields/System.Title", value: "Ignored" },
                { op: "add", path: "/relations/-", value: { rel: "System.LinkTypes.Related" } },
                { op: "add", path: 42, value: "Ignored" }
            ] as any,
            "proj",
            "Bug"
        );
        expect(wi.fields["System.Title"]).not.toBe("Ignored");
        expect(wi.fields["42"]).toBeUndefined();
        expect(wi.fields["System.WorkItemType"]).toBe("Bug");
    });

    it("creates a work item when the document is missing", async () => {
        const wi = await client.createWorkItem(undefined as any, "proj", "Epic");
        expect(wi.fields["System.WorkItemType"]).toBe("Epic");
        expect(wi.id).toBeGreaterThan(0);
    });

    it("applies add and replace operations on a known work item", async () => {
        const known = workItems[1];
        const wi = await client.updateWorkItem(
            [
                { op: "replace", path: "/fields/System.State", value: "Resolved" },
                { op: "add", path: "/fields/Custom.Field", value: 7 }
            ],
            known.id,
            "proj"
        );
        expect(wi.id).toBe(known.id);
        expect(wi.fields["System.State"]).toBe("Resolved");
        expect(wi.fields["Custom.Field"]).toBe(7);
        expect(wi.rev).toBe(known.rev + 1);
        expect(known.fields["Custom.Field"]).toBeUndefined();
    });

    it("updates an unknown work item and bumps its revision", async () => {
        const wi = await client.updateWorkItem(
            [{ op: "replace", path: "/fields/System.Title", value: "Renamed" }],
            654321
        );
        expect(wi.id).toBe(654321);
        expect(wi.fields["System.Title"]).toBe("Renamed");
        expect(wi.rev).toBeGreaterThanOrEqual(2);
    });

    it("ignores remove, non-field and malformed operations on update", async () => {
        const known = workItems[2];
        const wi = await client.updateWorkItem(
            [
                { op: "remove", path: "/fields/System.Title" },
                { op: "replace", path: "/relations/0", value: {} },
                { op: "add", path: null, value: "x" }
            ] as any,
            known.id
        );
        expect(wi.fields).toEqual(known.fields);
        expect(wi.rev).toBe(known.rev + 1);
    });

    it("updates with a missing document and defaults a missing revision to zero", async () => {
        const stub = { id: 777777, rev: undefined, fields: { "System.Id": 777777 } } as any;
        workItems.push(stub);
        const wi = await client.updateWorkItem(undefined as any, 777777);
        workItems.splice(workItems.indexOf(stub), 1);
        expect(wi.rev).toBe(1);
        expect(wi.fields["System.Id"]).toBe(777777);
    });

    it("deletes a work item", async () => {
        await expect(client.deleteWorkItem(9, "proj")).resolves.toEqual({ id: 9, deleted: true });
    });

    it("lists work item types", async () => {
        const types = await client.getWorkItemTypes("proj");
        expect(types.map(t => t.name)).toEqual(["Bug", "Task", "User Story", "Feature", "Epic"]);
    });

    it("returns a work item type by name", async () => {
        const type = await client.getWorkItemType("proj", "Task");
        expect(type).toBe(workItemTypes[1]);
    });

    it("returns a work item type by reference name", async () => {
        const type = await client.getWorkItemType("proj", "Microsoft.VSTS.WorkItemTypes.UserStory");
        expect(type.name).toBe("User Story");
    });

    it("fabricates an unknown work item type", async () => {
        const type = await client.getWorkItemType("proj", "Impediment");
        expect(type.name).toBe("Impediment");
        expect(type.referenceName).toBe("Microsoft.VSTS.WorkItemTypes.Impediment");
        expect(type.states.length).toBeGreaterThan(0);
    });

    it("builds a bug type by default", () => {
        const type = makeWorkItemType();
        expect(type.name).toBe("Bug");
        expect(type.icon.id).toBe("bug");
    });

    it("lists work item type categories with default types", async () => {
        const cats = await client.getWorkItemTypeCategories("proj");
        expect(cats).toHaveLength(5);
        cats.forEach(c => {
            expect(c.referenceName).toMatch(/Category$/);
            expect(c.defaultWorkItemType.name).toBe(c.workItemTypes[0].name);
        });
    });

    it("lists queries", async () => {
        const list = await client.getQueries("proj");
        expect(list).toHaveLength(3);
        expect(list[0].queryType).toBe(QueryType.Flat);
    });

    it("finds a query by id, path or name", async () => {
        const known = queries[0];
        expect(await client.getQuery("proj", known.id)).toBe(known);
        expect(await client.getQuery("proj", known.path)).toBe(known);
        expect(await client.getQuery("proj", known.name)).toBe(known);
    });

    it("fabricates an unknown query using the lookup as id", async () => {
        const q = await client.getQuery("proj", "missing-query");
        expect(q.id).toBe("missing-query");
        expect(q.wiql).toContain("SELECT");
    });

    it("runs a saved query by id", async () => {
        const res = await client.queryById("some-id", "proj");
        expect(res.workItems).toHaveLength(5);
        expect(res.columns.map(c => c.referenceName)).toContain("System.Id");
    });

    it("runs a wiql query", async () => {
        const res = await client.queryByWiql({ query: "SELECT [System.Id] FROM WorkItems" }, "proj");
        expect(res.queryType).toBe(QueryType.Flat);
        expect(res.workItems.every(w => typeof w.id === "number")).toBe(true);
    });
});
