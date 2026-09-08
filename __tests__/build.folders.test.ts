import {
    BuildRestClient,
    DefinitionQueueStatus,
    FolderQueryOrder
} from "azure-devops-extension-api/Build";

import { getClient } from "../azure-devops-extension-api";
import {
    buildDefinitions,
    buildMetrics,
    definitionProperties,
    definitionResources,
    definitionRevisions,
    definitionTemplates,
    folders,
    makeBuildMetric,
    makeBuildResourceUsage,
    makeDefinitionResourceReference,
    makeFolder,
    resourceUsage
} from "../azure-devops-extension-api/build/Data";

describe("BuildRestClient mock folders, templates and resources", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(BuildRestClient);

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["createFolder", () => client.createFolder({ description: "new" } as any, "proj", "\\created")],
        ["getFolders", () => client.getFolders("proj")],
        ["updateFolder", () => client.updateFolder({ description: "moved" } as any, "proj", "\\shared")],
        ["getTemplate", () => client.getTemplate("proj", definitionTemplates[0].id)],
        ["getTemplates", () => client.getTemplates("proj")],
        [
            "saveTemplate",
            () => client.saveTemplate({ name: "saved" } as any, "proj", "template-classic")
        ],
        ["restoreDefinition", () => client.restoreDefinition("proj", buildDefinitions[0].id, false)],
        ["getDefinitionMetrics", () => client.getDefinitionMetrics("proj", 1)],
        ["getDefinitionProperties", () => client.getDefinitionProperties("proj", 1)],
        [
            "updateDefinitionProperties",
            () => client.updateDefinitionProperties([{ path: "/stage", value: "prod" }] as any, "proj", 1)
        ],
        ["getDefinitionRevisions", () => client.getDefinitionRevisions("proj", 1)],
        ["getDefinitionYaml", () => client.getDefinitionYaml("proj", 42)],
        ["getDefinitionResources", () => client.getDefinitionResources("proj", 1)],
        [
            "authorizeDefinitionResources",
            () =>
                client.authorizeDefinitionResources(
                    [{ id: "endpoint-9", type: "endpoint" } as any],
                    "proj",
                    1
                )
        ],
        [
            "authorizeProjectResources",
            () => client.authorizeProjectResources([{ id: "queue-9", type: "queue" } as any], "proj")
        ],
        ["getProjectResources", () => client.getProjectResources("proj")],
        ["getProjectMetrics", () => client.getProjectMetrics("proj")],
        ["getResourceUsage", () => client.getResourceUsage()]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<unknown>]> = [
        ["deleteFolder", () => client.deleteFolder("proj", "\\legacy")],
        ["deleteTemplate", () => client.deleteTemplate("proj", "template-empty")]
    ];

    it.each(voidCases)("%s resolves with nothing", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("creates a folder at the path argument", async () => {
        const folder = await client.createFolder(
            { path: "\\ignored", description: "created here" } as any,
            "proj",
            "\\new"
        );
        expect(folder.path).toBe("\\new");
        expect(folder.description).toBe("created here");
        expect(folder).toHaveProperty("createdBy");
    });

    it("updates a folder at the path argument", async () => {
        const folder = await client.updateFolder(
            { path: "\\ignored", description: "updated here" } as any,
            "proj",
            "\\shared"
        );
        expect(folder.path).toBe("\\shared");
        expect(folder.description).toBe("updated here");
        expect(folder).toHaveProperty("lastChangedBy");
    });

    it("lists every folder when no path is given", async () => {
        const all = await client.getFolders("proj");
        expect(all).toHaveLength(folders.length);
        expect(all).toEqual(expect.arrayContaining(folders));
    });

    it("filters folders by path prefix", async () => {
        const scoped = await client.getFolders("proj", "\\shared");
        expect(scoped).toHaveLength(2);
        expect(scoped.every(folder => folder.path.startsWith("\\shared"))).toBe(true);
    });

    it("returns no folders for an unmatched path", async () => {
        await expect(client.getFolders("proj", "\\absent")).resolves.toEqual([]);
    });

    it("reverses the ascending order when descending is requested", async () => {
        const ascending = await client.getFolders("proj", "\\", FolderQueryOrder.FolderAscending);
        const descending = await client.getFolders("proj", "\\", FolderQueryOrder.FolderDescending);
        expect(descending).toEqual([...ascending].reverse());
        expect(descending).toHaveLength(folders.length);
    });

    it("gets a known template by id", async () => {
        const target = definitionTemplates[1];
        await expect(client.getTemplate("proj", target.id)).resolves.toBe(target);
    });

    it("fabricates a template for an unknown id", async () => {
        const template = await client.getTemplate("proj", "template-ghost");
        expect(template.id).toBe("template-ghost");
        expect(template.category).toBe("Build");
        expect(template.canDelete).toBe(true);
    });

    it("lists templates as a copy", async () => {
        const all = await client.getTemplates("proj");
        expect(all).toEqual(definitionTemplates);
        expect(all).not.toBe(definitionTemplates);
    });

    it("saves a template under the id argument", async () => {
        const saved = await client.saveTemplate(
            { id: "ignored", name: "my-template" } as any,
            "proj",
            "template-yaml"
        );
        expect(saved.id).toBe("template-yaml");
        expect(saved.name).toBe("my-template");
        expect(saved.defaultHostedQueue).toBe("Azure Pipelines");
    });

    it("restores a known definition as enabled", async () => {
        const target = buildDefinitions[1];
        const restored = await client.restoreDefinition("proj", target.id, false);
        expect(restored.id).toBe(target.id);
        expect(restored.name).toBe(target.name);
        expect(restored.queueStatus).toBe(DefinitionQueueStatus.Enabled);
    });

    it("disables a fabricated definition when deleted is true", async () => {
        const restored = await client.restoreDefinition("proj", -1, true);
        expect(restored.id).toBe(-1);
        expect(restored.queueStatus).toBe(DefinitionQueueStatus.Disabled);
        expect(restored).toHaveProperty("repository");
    });

    it("lists every definition metric when no time is given", async () => {
        await expect(client.getDefinitionMetrics("proj", 1)).resolves.toEqual(buildMetrics);
    });

    it("filters definition metrics from a minimum time", async () => {
        const recent = await client.getDefinitionMetrics(
            "proj",
            1,
            new Date("2024-12-01T00:00:00.000Z")
        );
        expect(recent).toHaveLength(1);
        expect(recent[0].name).toBe("FailedBuilds");
    });

    it("returns every definition property when no filter is given", async () => {
        const properties = await client.getDefinitionProperties("proj", 1);
        expect(Object.keys(properties).sort()).toEqual(Object.keys(definitionProperties).sort());
        expect(properties.stage).toBe("canary");
        expect(properties.retentionDays).toBe(30);
    });

    it("returns only the filtered definition properties", async () => {
        const properties = await client.getDefinitionProperties("proj", 1, ["stage", "retentionDays"]);
        expect(Object.keys(properties)).toEqual(["stage", "retentionDays"]);
        expect(properties.stage).toBe("canary");
    });

    it("applies patch operations to the definition properties", async () => {
        const properties = await client.updateDefinitionProperties(
            [
                { path: "/stage", value: "prod" },
                { path: "/extra", value: 7 }
            ] as any,
            "proj",
            1
        );
        expect(properties.stage).toBe("prod");
        expect(properties.extra).toBe(7);
        expect(properties.retentionDays).toBe(30);
        expect(definitionProperties.stage).toBe("canary");
    });

    it("lists definition revisions as a copy", async () => {
        const revisions = await client.getDefinitionRevisions("proj", 1);
        expect(revisions).toEqual(definitionRevisions);
        expect(revisions).not.toBe(definitionRevisions);
    });

    it("renders yaml naming the definition id", async () => {
        const yaml = await client.getDefinitionYaml("proj", 42);
        expect(yaml.yaml).toContain("name: definition 42");
        expect(yaml.yaml).toContain("trigger:");
        expect(yaml.yaml).toContain("vmImage: ubuntu-latest");
    });

    it("appends the optional yaml scope arguments", async () => {
        const yaml = await client.getDefinitionYaml(
            "proj",
            42,
            3,
            new Date("2024-06-01T00:00:00.000Z"),
            ["stage"],
            true
        );
        expect(yaml.yaml).toContain("definition 42 3");
        expect(yaml.yaml).toContain("stage");
        expect(yaml.yaml).toContain("true");
    });

    it("lists definition resources as a copy", async () => {
        const resources = await client.getDefinitionResources("proj", 1);
        expect(resources).toEqual(definitionResources);
        expect(resources).not.toBe(definitionResources);
    });

    it("authorizes definition resources filling in the factory fields", async () => {
        const authorized = await client.authorizeDefinitionResources(
            [{ id: "endpoint-9", type: "endpoint" } as any],
            "proj",
            1
        );
        expect(authorized).toHaveLength(1);
        expect(authorized[0].id).toBe("endpoint-9");
        expect(authorized[0].type).toBe("endpoint");
        expect(authorized[0].authorized).toBe(true);
        expect(authorized[0]).toHaveProperty("name");
    });

    it("authorizes project resources filling in the factory fields", async () => {
        const authorized = await client.authorizeProjectResources(
            [{ id: "queue-9", type: "queue", authorized: false } as any],
            "proj"
        );
        expect(authorized).toHaveLength(1);
        expect(authorized[0].id).toBe("queue-9");
        expect(authorized[0].authorized).toBe(false);
        expect(authorized[0]).toHaveProperty("name");
    });

    it("lists every project resource when no filter is given", async () => {
        await expect(client.getProjectResources("proj")).resolves.toEqual(definitionResources);
    });

    it("filters project resources by type", async () => {
        const queues = await client.getProjectResources("proj", "queue");
        expect(queues).toHaveLength(1);
        expect(queues[0].id).toBe("queue-1");
    });

    it("filters project resources by id", async () => {
        const byId = await client.getProjectResources("proj", undefined, "endpoint-1");
        expect(byId).toHaveLength(1);
        expect(byId[0].type).toBe("endpoint");
    });

    it("returns nothing when type and id disagree", async () => {
        await expect(client.getProjectResources("proj", "queue", "endpoint-1")).resolves.toEqual([]);
    });

    it("lists every project metric when no filter is given", async () => {
        await expect(client.getProjectMetrics("proj")).resolves.toEqual(buildMetrics);
    });

    it("filters project metrics by aggregation type", async () => {
        const hourly = await client.getProjectMetrics("proj", "Hourly");
        expect(hourly).toHaveLength(1);
        expect(hourly[0].name).toBe("FailedBuilds");
    });

    it("filters project metrics from a minimum time", async () => {
        const recent = await client.getProjectMetrics(
            "proj",
            undefined,
            new Date("2024-06-01T00:00:00.000Z")
        );
        expect(recent).toHaveLength(2);
        expect(recent.map(metric => metric.name)).toEqual(["SuccessfulBuilds", "FailedBuilds"]);
    });

    it("returns resource usage as a copy", async () => {
        const usage = await client.getResourceUsage();
        expect(usage).toEqual(resourceUsage);
        expect(usage).not.toBe(resourceUsage);
    });
});

describe("build folder, metric and resource factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes a folder at the given path", () => {
        const folder = makeFolder("\\team");
        expect(folder.path).toBe("\\team");
        expect(folder).toHaveProperty("createdBy");
        expect(folder).toHaveProperty("project");
    });

    it("makes a metric echoing name, scope and date", () => {
        const date = new Date("2024-03-01T00:00:00.000Z");
        expect(makeBuildMetric("Queued", "Daily", date)).toMatchObject({
            name: "Queued",
            scope: "Daily",
            date
        });
    });

    it("makes a resource reference echoing id and type", () => {
        const resource = makeDefinitionResourceReference("endpoint-77", "endpoint");
        expect(resource.id).toBe("endpoint-77");
        expect(resource.type).toBe("endpoint");
        expect(resource.authorized).toBe(true);
    });

    it("makes resource usage with numeric counters", () => {
        const usage = makeBuildResourceUsage();
        expect(typeof usage.totalUsage).toBe("number");
        expect(typeof usage.distributedTaskAgents).toBe("number");
        expect(typeof usage.xamlControllers).toBe("number");
    });

    it("seeds folders below a single root", () => {
        expect(folders.every(folder => folder.path.startsWith("\\"))).toBe(true);
        expect(new Set(folders.map(folder => folder.path)).size).toBe(folders.length);
    });
});
