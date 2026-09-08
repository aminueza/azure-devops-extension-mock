import {
    DeploymentPoolSummaryExpands,
    MachineGroupActionFilter,
    TaskAgentPoolMaintenanceJobStatus,
    TaskAgentRestClient
} from "azure-devops-extension-api/TaskAgent";

import { getClient } from "../azure-devops-extension-api";
import {
    deploymentGroupMetrics,
    deploymentMachineGroups,
    deploymentPoolSummaries,
    maintenanceDefinitions,
    maintenanceJobs,
    makeDeploymentMachineGroup,
    makeMaintenanceDefinition,
    makeMaintenanceJob
} from "../azure-devops-extension-api/taskAgent/Data";

describe("TaskAgentRestClient maintenance and deployment groups", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TaskAgentRestClient);
    const unmatchedId = Number.MAX_SAFE_INTEGER;
    const seededDefinition = maintenanceDefinitions[0];
    const seededJob = maintenanceJobs[0];
    const seededMachineGroup = deploymentMachineGroups[0];

    const resolving: Array<[string, () => Promise<unknown>]> = [
        [
            "createAgentPoolMaintenanceDefinition",
            () => client.createAgentPoolMaintenanceDefinition(makeMaintenanceDefinition(), 11)
        ],
        [
            "getAgentPoolMaintenanceDefinition",
            () => client.getAgentPoolMaintenanceDefinition(11, seededDefinition.id)
        ],
        [
            "getAgentPoolMaintenanceDefinitions",
            () => client.getAgentPoolMaintenanceDefinitions(11)
        ],
        [
            "updateAgentPoolMaintenanceDefinition",
            () =>
                client.updateAgentPoolMaintenanceDefinition(
                    makeMaintenanceDefinition(),
                    11,
                    seededDefinition.id
                )
        ],
        [
            "getAgentPoolMaintenanceJob",
            () => client.getAgentPoolMaintenanceJob(11, seededJob.jobId)
        ],
        [
            "getAgentPoolMaintenanceJobLogs",
            () => client.getAgentPoolMaintenanceJobLogs(11, seededJob.jobId)
        ],
        [
            "getAgentPoolMaintenanceJobs",
            () => client.getAgentPoolMaintenanceJobs(11, seededJob.definitionId)
        ],
        [
            "queueAgentPoolMaintenanceJob",
            () => client.queueAgentPoolMaintenanceJob(makeMaintenanceJob(), 11)
        ],
        [
            "updateAgentPoolMaintenanceJob",
            () => client.updateAgentPoolMaintenanceJob(makeMaintenanceJob(), 11, seededJob.jobId)
        ],
        [
            "addDeploymentGroup",
            () =>
                client.addDeploymentGroup(
                    { name: "group", description: "desc", pool: { id: 5 }, poolId: 5 },
                    "proj"
                )
        ],
        [
            "updateDeploymentGroup",
            () => client.updateDeploymentGroup({ name: "group", description: "desc" }, "proj", 61)
        ],
        [
            "getDeploymentGroupsMetrics",
            () => client.getDeploymentGroupsMetrics("proj", "group-900", "next", 1)
        ],
        [
            "generateDeploymentGroupAccessToken",
            () => client.generateDeploymentGroupAccessToken("proj", 62)
        ],
        ["generateDeploymentPoolAccessToken", () => client.generateDeploymentPoolAccessToken(63)],
        [
            "getDeploymentPoolsSummary",
            () =>
                client.getDeploymentPoolsSummary(
                    "pool-900",
                    DeploymentPoolSummaryExpands.DeploymentGroups,
                    [900]
                )
        ],
        [
            "addDeploymentMachineGroup",
            () => client.addDeploymentMachineGroup(makeDeploymentMachineGroup(), "proj")
        ],
        [
            "getDeploymentMachineGroup",
            () =>
                client.getDeploymentMachineGroup(
                    "proj",
                    seededMachineGroup.id,
                    MachineGroupActionFilter.Manage
                )
        ],
        [
            "getDeploymentMachineGroups",
            () =>
                client.getDeploymentMachineGroups(
                    "proj",
                    seededMachineGroup.name,
                    MachineGroupActionFilter.Use
                )
        ],
        [
            "updateDeploymentMachineGroup",
            () =>
                client.updateDeploymentMachineGroup(
                    makeDeploymentMachineGroup(),
                    "proj",
                    seededMachineGroup.id
                )
        ],
        [
            "generateDeploymentMachineGroupAccessToken",
            () => client.generateDeploymentMachineGroupAccessToken("proj", 64)
        ]
    ];

    it.each(resolving)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voiding: Array<[string, () => Promise<void>]> = [
        [
            "deleteAgentPoolMaintenanceDefinition",
            () => client.deleteAgentPoolMaintenanceDefinition(11, seededDefinition.id)
        ],
        [
            "deleteAgentPoolMaintenanceJob",
            () => client.deleteAgentPoolMaintenanceJob(11, seededJob.jobId)
        ],
        ["deleteDeploymentGroup", () => client.deleteDeploymentGroup("proj", 41)],
        [
            "deleteDeploymentMachineGroup",
            () => client.deleteDeploymentMachineGroup("proj", seededMachineGroup.id)
        ]
    ];

    it.each(voiding)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("seeds maintenance definitions and jobs with pinned ids", () => {
        expect(maintenanceDefinitions.map(d => d.id)).toEqual([900, 901]);
        expect(maintenanceJobs.map(j => j.jobId)).toEqual([900, 901, 902]);
        expect(maintenanceJobs.map(j => j.definitionId)).toEqual([950, 951, 950]);
    });

    it("echoes a created maintenance definition under the pool", async () => {
        const input = makeMaintenanceDefinition();
        const definition = await client.createAgentPoolMaintenanceDefinition(input, 31);
        expect(definition.pool.id).toBe(31);
        expect(definition.id).toBe(input.id);
        expect(definition.scheduleSetting.timeZoneId).toBe("UTC");
    });

    it("returns a seeded maintenance definition by id", async () => {
        await expect(
            client.getAgentPoolMaintenanceDefinition(11, seededDefinition.id)
        ).resolves.toBe(seededDefinition);
    });

    it("fabricates a maintenance definition for an unknown id", async () => {
        const definition = await client.getAgentPoolMaintenanceDefinition(11, unmatchedId);
        expect(definition.id).toBe(unmatchedId);
        expect(maintenanceDefinitions).not.toContain(definition);
    });

    it("stamps the pool onto every listed maintenance definition", async () => {
        const definitions = await client.getAgentPoolMaintenanceDefinitions(32);
        expect(definitions).toHaveLength(maintenanceDefinitions.length);
        expect(definitions.every(d => d.pool.id === 32)).toBe(true);
        expect(definitions.map(d => d.id)).toEqual([900, 901]);
    });

    it("updates a maintenance definition with the given ids", async () => {
        const input = makeMaintenanceDefinition();
        const definition = await client.updateAgentPoolMaintenanceDefinition(input, 33, 34);
        expect(definition.id).toBe(34);
        expect(definition.pool.id).toBe(33);
        expect(definition.enabled).toBe(input.enabled);
    });

    it("returns a seeded maintenance job by id", async () => {
        const job = await client.getAgentPoolMaintenanceJob(35, seededJob.jobId);
        expect(job.jobId).toBe(seededJob.jobId);
        expect(job.pool.id).toBe(35);
        expect(job.definitionId).toBe(seededJob.definitionId);
    });

    it("fabricates a maintenance job for an unknown id", async () => {
        const job = await client.getAgentPoolMaintenanceJob(36, unmatchedId);
        expect(job.jobId).toBe(unmatchedId);
        expect(job.pool.id).toBe(36);
        expect(maintenanceJobs).not.toContain(job);
    });

    it("builds maintenance jobs with enum-typed status and result", () => {
        const job = makeMaintenanceJob();
        expect(job.targetAgents).toHaveLength(1);
        expect(job.status).toBe(job.targetAgents[0].status);
        expect(job.result).toBe(job.targetAgents[0].result);
    });

    it("encodes maintenance job logs as an array buffer", async () => {
        const logs = await client.getAgentPoolMaintenanceJobLogs(37, 38);
        const expected = "pool-37-maintenance-job-38";
        expect(logs.byteLength).toBe(expected.length);
        expect(String.fromCharCode(...new Uint8Array(logs))).toBe(expected);
    });

    it("filters maintenance jobs by definition", async () => {
        const matched = await client.getAgentPoolMaintenanceJobs(39, 950);
        expect(matched.map(j => j.jobId)).toEqual([900, 902]);
        expect(matched.every(j => j.pool.id === 39)).toBe(true);
        await expect(client.getAgentPoolMaintenanceJobs(39, unmatchedId)).resolves.toEqual([]);
    });

    it("returns every maintenance job when no definition is given", async () => {
        const all = await client.getAgentPoolMaintenanceJobs(40);
        expect(all.map(j => j.jobId)).toEqual([900, 901, 902]);
        expect(all.every(j => j.pool.id === 40)).toBe(true);
    });

    it("queues a maintenance job with queued status", async () => {
        const input = makeMaintenanceJob();
        const job = await client.queueAgentPoolMaintenanceJob(input, 41);
        expect(job.status).toBe(TaskAgentPoolMaintenanceJobStatus.Queued);
        expect(job.pool.id).toBe(41);
        expect(job.definitionId).toBe(input.definitionId);
    });

    it("updates a maintenance job with the given ids", async () => {
        const input = makeMaintenanceJob();
        const job = await client.updateAgentPoolMaintenanceJob(input, 42, 43);
        expect(job.jobId).toBe(43);
        expect(job.pool.id).toBe(42);
        expect(job.orchestrationId).toBe(input.orchestrationId);
    });

    it("maps create parameters onto a new deployment group", async () => {
        const group = await client.addDeploymentGroup(
            { name: "canary", description: "canary ring", pool: { id: 7 }, poolId: 51 },
            "proj"
        );
        expect(group.name).toBe("canary");
        expect(group.description).toBe("canary ring");
        expect(group.pool.id).toBe(51);
        expect(group.project.name).toBe("proj");
    });

    it("maps update parameters onto an existing deployment group", async () => {
        const group = await client.updateDeploymentGroup(
            { name: "renamed", description: "new ring" },
            "proj",
            52
        );
        expect(group.id).toBe(52);
        expect(group.name).toBe("renamed");
        expect(group.description).toBe("new ring");
        expect(group.project.name).toBe("proj");
    });

    it("seeds deployment metrics and pool summaries with pinned names", () => {
        expect(deploymentGroupMetrics.map(m => m.deploymentGroup.name)).toEqual([
            "group-900",
            "group-901",
            "group-902"
        ]);
        expect(deploymentPoolSummaries.map(s => s.pool.id)).toEqual([900, 901, 902]);
        expect(deploymentPoolSummaries.map(s => s.pool.name)).toEqual([
            "pool-900",
            "pool-901",
            "pool-902"
        ]);
    });

    it("filters deployment metrics by group name and echoes the token", async () => {
        const paged = await client.getDeploymentGroupsMetrics("proj", "group-901", "next");
        expect(paged).toHaveLength(1);
        expect(paged.continuationToken).toBe("next");
        expect(paged[0].deploymentGroup.project.name).toBe("proj");
        await expect(
            client.getDeploymentGroupsMetrics("proj", "group-none")
        ).resolves.toHaveLength(0);
    });

    it("returns every deployment metric with a null token when unfiltered", async () => {
        const paged = await client.getDeploymentGroupsMetrics("proj");
        expect(paged).toHaveLength(deploymentGroupMetrics.length);
        expect(paged.continuationToken).toBeNull();
    });

    it("caps deployment metrics at top", async () => {
        const paged = await client.getDeploymentGroupsMetrics("proj", undefined, undefined, 2);
        expect(paged).toHaveLength(2);
        expect(paged.map(m => m.deploymentGroup.name)).toEqual(["group-900", "group-901"]);
    });

    it("builds deployment group and pool access tokens", async () => {
        await expect(client.generateDeploymentGroupAccessToken("proj", 71)).resolves.toBe(
            "proj-deployment-group-71-token"
        );
        await expect(client.generateDeploymentPoolAccessToken(72)).resolves.toBe(
            "deployment-pool-72-token"
        );
    });

    it("returns every pool summary when unfiltered", async () => {
        await expect(client.getDeploymentPoolsSummary()).resolves.toHaveLength(
            deploymentPoolSummaries.length
        );
    });

    it("filters pool summaries by name", async () => {
        const matched = await client.getDeploymentPoolsSummary("pool-901");
        expect(matched).toHaveLength(1);
        expect(matched[0].pool.id).toBe(901);
        await expect(client.getDeploymentPoolsSummary("pool-none")).resolves.toEqual([]);
    });

    it("filters pool summaries by ids", async () => {
        const matched = await client.getDeploymentPoolsSummary(
            undefined,
            DeploymentPoolSummaryExpands.Resource,
            [901, 902]
        );
        expect(matched.map(s => s.pool.id)).toEqual([901, 902]);
        await expect(
            client.getDeploymentPoolsSummary(undefined, undefined, [unmatchedId])
        ).resolves.toEqual([]);
    });

    it("combines the pool summary name and id filters", async () => {
        await expect(
            client.getDeploymentPoolsSummary("pool-900", undefined, [901])
        ).resolves.toEqual([]);
    });

    it("echoes a created machine group under the project", async () => {
        const input = makeDeploymentMachineGroup();
        const group = await client.addDeploymentMachineGroup(input, "proj");
        expect(group.id).toBe(input.id);
        expect(group.name).toBe(input.name);
        expect(group.project.name).toBe("proj");
        expect(group.machines).toHaveLength(1);
    });

    it("seeds machine groups with pinned ids and names", () => {
        expect(deploymentMachineGroups.map(g => g.id)).toEqual([900, 901, 902]);
        expect(deploymentMachineGroups.map(g => g.name)).toEqual([
            "machine-group-900",
            "machine-group-901",
            "machine-group-902"
        ]);
    });

    it("returns a seeded machine group by id", async () => {
        const group = await client.getDeploymentMachineGroup("proj", seededMachineGroup.id);
        expect(group.id).toBe(seededMachineGroup.id);
        expect(group.name).toBe(seededMachineGroup.name);
        expect(group.project.name).toBe("proj");
    });

    it("fabricates a machine group for an unknown id", async () => {
        const group = await client.getDeploymentMachineGroup("proj", unmatchedId);
        expect(group.id).toBe(unmatchedId);
        expect(group.name).not.toMatch(/^machine-group-/);
    });

    it("returns every machine group when no name is given", async () => {
        const groups = await client.getDeploymentMachineGroups("proj");
        expect(groups.map(g => g.id)).toEqual([900, 901, 902]);
        expect(groups.every(g => g.project.name === "proj")).toBe(true);
    });

    it("filters machine groups by name", async () => {
        const groups = await client.getDeploymentMachineGroups("proj", "machine-group-901");
        expect(groups).toHaveLength(1);
        expect(groups[0].id).toBe(901);
        await expect(
            client.getDeploymentMachineGroups("proj", "machine-group-none")
        ).resolves.toEqual([]);
    });

    it("updates a machine group with the given id and project", async () => {
        const input = makeDeploymentMachineGroup();
        const group = await client.updateDeploymentMachineGroup(input, "proj", 81);
        expect(group.id).toBe(81);
        expect(group.name).toBe(input.name);
        expect(group.project.name).toBe("proj");
    });

    it("builds a machine group access token", async () => {
        await expect(
            client.generateDeploymentMachineGroupAccessToken("proj", 82)
        ).resolves.toBe("proj-machine-group-82-token");
    });
});
