import {
    WorkItemTrackingRestClient,
    FieldType,
    GetFieldsExpand,
    TreeStructureGroup,
    TreeNodeStructureType,
    ClassificationNodesErrorPolicy,
    QueryExpand,
    QueryErrorPolicy
} from "azure-devops-extension-api/WorkItemTracking";
import { getClient } from "../azure-devops-extension-api";
import {
    classificationNodes,
    fields,
    makeClassificationNode,
    makeQuery,
    makeWorkItemField,
    queries,
    rootNodes
} from "../azure-devops-extension-api/workItemTracking/Data";

describe("WorkItemTrackingRestClient fields, nodes and queries", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(WorkItemTrackingRestClient);
    const postedField = makeWorkItemField("Custom.Points", FieldType.Double);
    const postedNode = makeClassificationNode("Payments", TreeNodeStructureType.Area);
    const postedQuery = makeQuery();
    const batchRequest = {
        $expand: QueryExpand.All,
        errorPolicy: QueryErrorPolicy.Omit,
        ids: [queries[0].id]
    };

    const valueCases: Array<[string, () => Promise<unknown>]> = [
        ["createField", () => client.createField(postedField, "proj")],
        ["getField", () => client.getField("System.Title", "proj")],
        ["getFields", () => client.getFields("proj", GetFieldsExpand.None)],
        ["updateField", () => client.updateField({ isDeleted: false }, "System.Title", "proj")],
        ["createOrUpdateClassificationNode", () => client.createOrUpdateClassificationNode(postedNode, "proj", TreeStructureGroup.Areas, "Payments")],
        ["getClassificationNode", () => client.getClassificationNode("proj", TreeStructureGroup.Areas, rootNodes[0].path, 2)],
        ["getClassificationNodes", () => client.getClassificationNodes("proj", [classificationNodes[0].id], 1, ClassificationNodesErrorPolicy.Omit)],
        ["getRootNodes", () => client.getRootNodes("proj", 2)],
        ["updateClassificationNode", () => client.updateClassificationNode(postedNode, "proj", TreeStructureGroup.Iterations, "Payments")],
        ["createQuery", () => client.createQuery(postedQuery, "proj", "Shared Queries", false)],
        ["getQueriesBatch", () => client.getQueriesBatch(batchRequest, "proj")],
        ["getQueryResultCount", () => client.getQueryResultCount(queries[0].id, "proj", "team", true, 3)],
        ["searchQueries", () => client.searchQueries("proj", "Shared", 5, QueryExpand.Minimal, false)],
        ["updateQuery", () => client.updateQuery(postedQuery, "proj", queries[0].id, false)]
    ];

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteField", () => client.deleteField("Custom.Retired", "proj")],
        ["deleteClassificationNode", () => client.deleteClassificationNode("proj", TreeStructureGroup.Areas, "Payments", 1)],
        ["deleteQuery", () => client.deleteQuery("proj", queries[0].id)]
    ];

    it.each(valueCases)("%s resolves a value", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it.each(voidCases)("%s resolves nothing", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("echoes the posted field over a fixture", async () => {
        const created = await client.createField(
            { ...postedField, name: "Story Points", description: "estimate" }
        );
        expect(created.name).toBe("Story Points");
        expect(created.description).toBe("estimate");
        expect(created.type).toBe(FieldType.Double);
    });

    it("returns a seeded field by reference name", async () => {
        const field = await client.getField("System.State");
        expect(field).toBe(fields[2]);
    });

    it("returns a seeded field by name", async () => {
        const field = await client.getField("CreatedBy");
        expect(field).toBe(fields[3]);
    });

    it("fabricates an unknown field as a string field", async () => {
        const field = await client.getField("Custom.Missing", "proj");
        expect(field.referenceName).toBe("Custom.Missing");
        expect(field.name).toBe("Missing");
        expect(field.type).toBe(FieldType.String);
    });

    it("hides deleted fields unless they are requested", async () => {
        const visible = await client.getFields("proj");
        expect(visible.some(f => f.isDeleted)).toBe(false);
        const all = await client.getFields("proj", GetFieldsExpand.IncludeDeleted);
        expect(all).toBe(fields);
        expect(all.some(f => f.isDeleted)).toBe(true);
    });

    it("applies the delete flag from the update payload", async () => {
        const restored = await client.updateField({ isDeleted: false }, "Custom.Retired");
        expect(restored.isDeleted).toBe(false);
        expect(restored.referenceName).toBe("Custom.Retired");
        expect(fields[5].isDeleted).toBe(true);
    });

    it("maps the structure group onto the posted node", async () => {
        const area = await client.createOrUpdateClassificationNode(postedNode, "proj", TreeStructureGroup.Areas);
        expect(area.structureType).toBe(TreeNodeStructureType.Area);
        expect(area.name).toBe("Payments");
        const iteration = await client.createOrUpdateClassificationNode(postedNode, "proj", TreeStructureGroup.Iterations);
        expect(iteration.structureType).toBe(TreeNodeStructureType.Iteration);
    });

    it("finds a classification node by path and by name", async () => {
        const byPath = await client.getClassificationNode("proj", TreeStructureGroup.Areas, rootNodes[0].path);
        expect(byPath).toBe(rootNodes[0]);
        const byName = await client.getClassificationNode("proj", TreeStructureGroup.Iterations, "Sprint 2");
        expect(byName.name).toBe("Sprint 2");
        expect(byName.structureType).toBe(TreeNodeStructureType.Iteration);
    });

    it("fabricates an unknown classification node and a root when no path is given", async () => {
        const unknown = await client.getClassificationNode("proj", TreeStructureGroup.Iterations, "Sprint 99");
        expect(unknown.name).toBe("Sprint 99");
        expect(unknown.structureType).toBe(TreeNodeStructureType.Iteration);
        const root = await client.getClassificationNode("proj", TreeStructureGroup.Areas);
        expect(root.name).toBe("Root");
        expect(root.structureType).toBe(TreeNodeStructureType.Area);
    });

    it("resolves known ids and fabricates unknown ones in a node batch", async () => {
        const known = classificationNodes[1];
        const nodes = await client.getClassificationNodes("proj", [known.id, 999999]);
        expect(nodes[0]).toBe(known);
        expect(nodes[1].id).toBe(999999);
        expect(nodes[1].name).toBe("Fabricated");
    });

    it("strips children from root nodes unless a depth is requested", async () => {
        const shallow = await client.getRootNodes("proj");
        expect(shallow).toHaveLength(2);
        expect(shallow.every(node => node.children.length === 0)).toBe(true);
        const deep = await client.getRootNodes("proj", 2);
        expect(deep).toBe(rootNodes);
        expect(deep[0].children).toHaveLength(2);
    });

    it("builds the created query path from the parent folder", async () => {
        const created = await client.createQuery({ ...postedQuery, name: "My Bugs" }, "proj", "Shared Queries");
        expect(created.path).toBe("Shared Queries/My Bugs");
        expect(created.name).toBe("My Bugs");
    });

    it("resolves known and unknown ids in a query batch", async () => {
        const result = await client.getQueriesBatch(
            { ...batchRequest, ids: [queries[1].id, "missing-id"] },
            "proj"
        );
        expect(result[0]).toBe(queries[1]);
        expect(result[1].id).toBe("missing-id");
    });

    it("caps the query result count with top", async () => {
        await expect(client.getQueryResultCount("id")).resolves.toBe(5);
        await expect(client.getQueryResultCount("id", "proj", "team", false, 2)).resolves.toBe(2);
    });

    it("searches queries by name and by path", async () => {
        const byName = await client.searchQueries("proj", queries[0].name);
        expect(byName.value).toContain(queries[0]);
        expect(byName.hasMore).toBe(false);
        const byPath = await client.searchQueries("proj", "Shared Queries");
        expect(byPath.count).toBe(3);
    });

    it("reports more results when top truncates the matches", async () => {
        const truncated = await client.searchQueries("proj", "Shared Queries", 1);
        expect(truncated.count).toBe(1);
        expect(truncated.hasMore).toBe(true);
        expect(truncated.value).toHaveLength(1);
    });

    it("returns no matches for an unknown filter", async () => {
        const empty = await client.searchQueries("proj", "no-such-query");
        expect(empty.count).toBe(0);
        expect(empty.hasMore).toBe(false);
    });

    it("merges the update over a known query and fabricates an unknown one", async () => {
        const known = queries[2];
        const updated = await client.updateQuery({ ...known, name: "Renamed" }, "proj", known.id);
        expect(updated.id).toBe(known.id);
        expect(updated.name).toBe("Renamed");
        expect(known.name).not.toBe("Renamed");
        const fabricated = await client.updateQuery({ name: "Fresh" } as any, "proj", "missing-query", true);
        expect(fabricated.id).toBe("missing-query");
        expect(fabricated.name).toBe("Fresh");
    });
});
