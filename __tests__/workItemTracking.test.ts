import {
    LargeTextCustomHtmlFormat,
    LinkQueryMode,
    LogicalOperation,
    QueryRecursionOption,
    QueryResultType,
    QueryType,
    WorkItemTrackingRestClient
} from "azure-devops-extension-api/WorkItemTracking";
import { getClient } from "../azure-devops-extension-api";
import {
    categories,
    makeFieldReference,
    makeQuery,
    makeQueryClause,
    makeQueryResult,
    makeWorkItem,
    makeWorkItemType,
    makeWorkItemTypeCategory,
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

    it("fills the comment version and multiline format of a work item", () => {
        const item = makeWorkItem(42);
        expect(item.commentVersionRef).toEqual({
            commentId: expect.any(Number),
            createdInRevision: item.rev,
            isDeleted: false,
            text: expect.any(String),
            version: 1,
            url: expect.stringMatching(/^https:/)
        });
        expect(item.multilineFieldsFormat).toEqual({
            "System.Description": LargeTextCustomHtmlFormat.Html
        });
        expect(item.relations).toEqual([]);
        expect(item._links.self.href).toMatch(/^https:/);
    });

    it("keeps the filled work item fields when creating a work item", async () => {
        const created = await client.createWorkItem(
            [{ op: "add", path: "/fields/System.Title", value: "typed" }],
            "proj",
            "Task"
        );
        expect(created.fields["System.Title"]).toBe("typed");
        expect(created.commentVersionRef.createdInRevision).toBe(created.rev);
        expect(created.multilineFieldsFormat["System.Description"]).toBe(LargeTextCustomHtmlFormat.Html);
    });

    it("fills every member of a work item type", () => {
        const type = makeWorkItemType("User Story");
        expect(type.icon).toEqual({ id: "user story", url: expect.stringMatching(/^https:/) });
        expect(type.states.map(s => s.name)).toEqual(["New", "Active", "Resolved", "Closed", "Removed"]);
        type.states.forEach(s => {
            expect(s.category).toBe(s.name);
            expect(s.color).toMatch(/^[0-9a-f]{6}$/);
        });
        expect(type.fields).toEqual([]);
        expect(type.fieldInstances).toEqual([]);
        expect(type.transitions).toEqual({});
        expect(type.isDisabled).toBe(false);
        expect(type.xmlForm).toBe("");
        expect(type._links).toEqual({});
    });

    it("builds a field reference from a reference name", () => {
        expect(makeFieldReference("System.AreaPath")).toEqual({
            name: "AreaPath",
            referenceName: "System.AreaPath",
            url: expect.stringMatching(/^https:/)
        });
    });

    it("builds a query clause with finite depth", () => {
        const leaf = makeQueryClause("System.State", "Active");
        expect(leaf.clauses).toEqual([]);
        expect(leaf.field.referenceName).toBe("System.State");
        expect(leaf.fieldValue.name).toBe("State");
        expect(leaf.isFieldValue).toBe(false);
        expect(leaf.logicalOperator).toBe(LogicalOperation.AND);
        expect(leaf.operator).toEqual({ name: "=", referenceName: "SupportedOperations.Equals" });
        expect(leaf.value).toBe("Active");
        const group = makeQueryClause("System.TeamProject", "@project", [leaf]);
        expect(group.clauses).toEqual([leaf]);
    });

    it("fills every member of a query", () => {
        const query = makeQuery("query-id");
        expect(query.id).toBe("query-id");
        expect(query.children).toEqual([]);
        expect(query.clauses.field.referenceName).toBe("System.TeamProject");
        expect(query.clauses.clauses).toHaveLength(1);
        expect(query.clauses.clauses[0].clauses).toEqual([]);
        expect(query.columns.map(c => c.referenceName)).toEqual(["System.Id", "System.Title"]);
        expect(typeof query.createdBy.name).toBe("string");
        expect(typeof query.lastExecutedBy.id).toBe("string");
        expect(typeof query.lastModifiedBy.displayName).toBe("string");
        expect(query.createdDate).toBeInstanceOf(Date);
        expect(query.lastExecutedDate).toBeInstanceOf(Date);
        expect(query.lastModifiedDate).toBeInstanceOf(Date);
        expect(query.filterOptions).toBe(LinkQueryMode.WorkItems);
        expect(query.isDeleted).toBe(false);
        expect(query.isInvalidSyntax).toBe(false);
        expect(query.queryRecursionOption).toBe(QueryRecursionOption.ParentFirst);
        expect(query.sortColumns).toEqual([
            { descending: false, field: expect.objectContaining({ referenceName: "System.Id" }) }
        ]);
        expect(query.linkClauses.value).toBe("System.LinkTypes.Hierarchy-Forward");
        expect(query.sourceClauses.value).toBe("Feature");
        expect(query.targetClauses.value).toBe("User Story");
        expect(query._links).toEqual({});
    });

    it("seeds queries with distinct names and paths and filled members", () => {
        expect(new Set(queries.map(q => q.name)).size).toBe(queries.length);
        expect(new Set(queries.map(q => q.path)).size).toBe(queries.length);
        queries.forEach(q => {
            expect(q.children).toEqual([]);
            expect(q.sortColumns).toHaveLength(1);
        });
    });

    it("fills every member of a query result", () => {
        const result = makeQueryResult();
        expect(result.queryResultType).toBe(QueryResultType.WorkItem);
        expect(result.asOf).toBeInstanceOf(Date);
        expect(result.columns).toEqual([
            { referenceName: "System.Id", name: "ID", url: "" },
            { referenceName: "System.Title", name: "Title", url: "" },
            { referenceName: "System.State", name: "State", url: "" }
        ]);
        expect(result.sortColumns).toEqual([]);
        expect(result.workItemRelations).toEqual([]);
        result.workItems.forEach(w => expect(w.url).toMatch(/^https:/));
    });

    it("fills every member of a work item type category", () => {
        const category = makeWorkItemTypeCategory("Hidden Types");
        expect(category.name).toBe("Hidden Types");
        expect(category.referenceName).toBe("Microsoft.VSTS.WorkItemTypes.HiddenTypesCategory");
        expect(category.defaultWorkItemType.name).toBe("Bug");
        expect(category.workItemTypes.map(t => t.name)).toEqual(["Bug"]);
        expect(category.url).toMatch(/^https:/);
        expect(category._links).toEqual({});
    });

    it("seeds one category per work item type", () => {
        expect(categories.map(c => c.name)).toEqual([
            "Bug Category",
            "Task Category",
            "User Story Category",
            "Feature Category",
            "Epic Category"
        ]);
        categories.forEach(c => {
            expect(c.defaultWorkItemType.url).toMatch(/^https:/);
            expect(c.url).toMatch(/^https:/);
            expect(c._links).toEqual({});
        });
    });
});
