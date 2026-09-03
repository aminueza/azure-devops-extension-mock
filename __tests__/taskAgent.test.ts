import {
    TaskAgentPoolType,
    TaskAgentRestClient,
    TaskAgentStatus
} from "azure-devops-extension-api/TaskAgent";

import { getClient } from "../azure-devops-extension-api";
import {
    agentPools,
    agentQueues,
    agents,
    deploymentGroups,
    deploymentGroupsPage,
    makeAgent,
    makeAgentPool,
    makeAgentQueue,
    makeDeploymentGroup,
    makeTaskGroup,
    makeVariableGroup,
    taskGroups,
    variableGroups,
    variableGroupsPage
} from "../azure-devops-extension-api/taskAgent/Data";

describe("TaskAgentRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TaskAgentRestClient);

    it("exposes the real client type", () => {
        expect((client as any).TYPE).toBe(TaskAgentRestClient);
    });

    it("lists agent pools", async () => {
        const pools = await client.getAgentPools();
        expect(pools).toBe(agentPools);
        expect(pools.map(p => p.name)).toEqual(["Azure Pipelines", "Default", "Self-Hosted"]);
        expect(pools[0].isHosted).toBe(true);
        expect(pools[1].isHosted).toBe(false);
    });

    it("returns a known agent pool", async () => {
        const pool = await client.getAgentPool(agentPools[2].id);
        expect(pool).toBe(agentPools[2]);
    });

    it("fabricates an agent pool for an unknown id", async () => {
        const pool = await client.getAgentPool(987_654);
        expect(pool.id).toBe(987_654);
        expect(pool.name).toBe("Default");
        expect(pool.poolType).toBe(TaskAgentPoolType.Automation);
    });

    it("lists agents stamped with the pool id", async () => {
        const list = await client.getAgents(31);
        expect(list.length).toBe(agents.length);
        list.forEach((a, i) => {
            expect((a as any).poolId).toBe(31);
            expect(a.id).toBe(agents[i].id);
            expect(a.status).toBe(TaskAgentStatus.Online);
        });
    });

    it("returns a known agent", async () => {
        const agent = await client.getAgent(1, agents[1].id);
        expect(agent).toBe(agents[1]);
    });

    it("fabricates an agent for an unknown id", async () => {
        const agent = await client.getAgent(1, 424_242);
        expect(agent.id).toBe(424_242);
        expect(agent.name.startsWith("agent-")).toBe(true);
        expect(agent.enabled).toBe(true);
    });

    it("adds an agent merging the caller's fields", async () => {
        const agent = await client.addAgent({ name: "build-01", enabled: false } as any, 1);
        expect(agent.name).toBe("build-01");
        expect(agent.enabled).toBe(false);
        expect(agent).toHaveProperty("version");
        expect(agent.systemCapabilities["Agent.OS"]).toBe("Linux");
    });

    it("updates an agent forcing the requested id", async () => {
        const agent = await client.updateAgent({ id: 1, maxParallelism: 4 } as any, 1, 88);
        expect(agent.id).toBe(88);
        expect(agent.maxParallelism).toBe(4);
    });

    it("deletes an agent", async () => {
        await expect(client.deleteAgent(1, 2)).resolves.toBeUndefined();
    });

    it("lists agent queues", async () => {
        const queues = await client.getAgentQueues("proj");
        expect(queues).toBe(agentQueues);
        expect(queues.map(q => q.name)).toEqual(["Azure Pipelines", "Default"]);
        expect(queues[0].pool.isHosted).toBe(true);
        expect(queues[1].pool.isHosted).toBe(false);
    });

    it("returns a known agent queue", async () => {
        const queue = await client.getAgentQueue(agentQueues[0].id, "proj");
        expect(queue).toBe(agentQueues[0]);
    });

    it("fabricates an agent queue for an unknown id", async () => {
        const queue = await client.getAgentQueue(313_131);
        expect(queue.id).toBe(313_131);
        expect(queue.name).toBe("Default");
        expect(queue.pool.name).toBe("Default");
    });

    it("lists task groups", async () => {
        const list = await client.getTaskGroups("proj");
        expect(list).toBe(taskGroups);
        expect(list.length).toBe(2);
        expect(list[0].version.major).toBe(1);
    });

    it("lists variable groups", async () => {
        const list = await client.getVariableGroups("proj");
        expect(list).toBe(variableGroups);
        expect(list.map(g => g.name)).toEqual(["Common", "Production"]);
        expect(list[0].variables["MyVariable"].value).toBe("myValue");
    });

    it("lists variable groups as a page", async () => {
        const page = await (client as any).getVariableGroupsPaged("proj");
        expect(page).toBe(variableGroupsPage);
        expect(page.length).toBe(2);
        expect(page.continuationToken).toBe("");
    });

    it("returns a known variable group", async () => {
        const group = await client.getVariableGroup("proj", variableGroups[1].id);
        expect(group).toBe(variableGroups[1]);
    });

    it("fabricates a variable group for an unknown id", async () => {
        const group = await client.getVariableGroup("proj", 606_060);
        expect(group.id).toBe(606_060);
        expect(group.type).toBe("Vsts");
        expect(group.isShared).toBe(false);
    });

    it("adds a variable group merging the caller's fields", async () => {
        const group = await client.addVariableGroup({
            name: "Secrets",
            variables: { Token: { value: "x", isSecret: true } }
        } as any);
        expect(group.name).toBe("Secrets");
        expect(group.variables["Token"].isSecret).toBe(true);
        expect(group).toHaveProperty("id");
        expect(group).toHaveProperty("createdBy");
    });

    it("updates a variable group forcing the requested id", async () => {
        const group = await client.updateVariableGroup({ name: "Renamed", id: 1 } as any, 99);
        expect(group.id).toBe(99);
        expect(group.name).toBe("Renamed");
    });

    it("deletes a variable group", async () => {
        await expect(client.deleteVariableGroup(1, ["proj-a", "proj-b"])).resolves.toBeUndefined();
    });

    it("lists deployment groups as a page", async () => {
        const page = await client.getDeploymentGroups("proj");
        expect(page).toBe(deploymentGroupsPage);
        expect(page.length).toBe(2);
        expect(page.continuationToken).toBe("");
        expect(page[0].machines).toEqual([]);
    });

    it("returns a known deployment group", async () => {
        const group = await client.getDeploymentGroup("proj", deploymentGroups[1].id);
        expect(group).toBe(deploymentGroups[1]);
    });

    it("fabricates a deployment group for an unknown id", async () => {
        const group = await client.getDeploymentGroup("proj", 505_050);
        expect(group.id).toBe(505_050);
        expect(group.pool.name).toBe("Default");
        expect(group.machineCount).toBeGreaterThan(0);
    });
});

describe("taskAgent Data factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes a self-hosted default pool", () => {
        const pool = makeAgentPool();
        expect(pool.name).toBe("Default");
        expect(pool.isHosted).toBe(false);
        expect(pool.autoUpdate).toBe(true);
    });

    it("marks azure pools as hosted", () => {
        const pool = makeAgentPool("Azure Pipelines");
        expect(pool.isHosted).toBe(true);
    });

    it("makes an agent with a generated name", () => {
        const agent = makeAgent();
        expect(agent.name.startsWith("agent-")).toBe(true);
        expect(agent.version).toMatch(/^[23]\.218\.0$/);
        expect(["Linux 5.15.0", "Microsoft Windows 10.0.20348", "Darwin 22.4.0"]).toContain(agent.osDescription);
    });

    it("makes an agent with the given name", () => {
        expect(makeAgent("runner-7").name).toBe("runner-7");
    });

    it("makes a default queue", () => {
        const queue = makeAgentQueue();
        expect(queue.name).toBe("Default");
        expect(queue.pool.name).toBe("Default");
        expect(queue.pool.isHosted).toBe(false);
        expect(queue.pool.poolType).toBe(TaskAgentPoolType.Automation);
    });

    it("makes a hosted azure queue", () => {
        const queue = makeAgentQueue("Azure Pipelines");
        expect(queue.pool.isHosted).toBe(true);
    });

    it("makes a task group", () => {
        const group = makeTaskGroup();
        expect(group.revision).toBe(1);
        expect(group.tasks).toEqual([]);
        expect(group.version.isTest).toBe(false);
    });

    it("makes a variable group with a generated name", () => {
        const group = makeVariableGroup();
        expect(typeof group.name).toBe("string");
        expect(group.name.length).toBeGreaterThan(0);
        expect(group.variables["MyVariable"].isSecret).toBe(false);
    });

    it("makes a variable group with the given name", () => {
        expect(makeVariableGroup("Common").name).toBe("Common");
    });

    it("makes a deployment group backed by a default pool", () => {
        const group = makeDeploymentGroup();
        expect(group.pool.name).toBe("Default");
        expect(group.project).toHaveProperty("id");
        expect(group.machines).toEqual([]);
    });

    it("exposes seeded lists and pages", () => {
        expect(agentPools.length).toBe(3);
        expect(agents.length).toBe(3);
        expect(agentQueues.length).toBe(2);
        expect(taskGroups.length).toBe(2);
        expect(variableGroups.length).toBe(2);
        expect(deploymentGroups.length).toBe(2);
        expect([...deploymentGroupsPage]).toEqual(deploymentGroups);
        expect([...variableGroupsPage]).toEqual(variableGroups);
    });
});
