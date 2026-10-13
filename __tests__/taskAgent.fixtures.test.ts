import {
    TaskAgentPoolOptions,
    TaskAgentPoolType,
    TaskAgentRestClient,
    TaskAgentStatus,
    TaskAgentUpdateReasonType
} from "azure-devops-extension-api/TaskAgent";

import { getClient } from "../azure-devops-extension-api";
import {
    agentCloudRequests,
    agentQueues,
    agentRequests,
    agents,
    deploymentGroups,
    deploymentGroupsPage,
    deploymentMachines,
    makeAgent,
    makeAgentCloudRequest,
    makeAgentJobRequest,
    makeAgentPool,
    makeAgentPoolReference,
    makeAgentQueue,
    makeAgentReference,
    makeDeploymentGroup,
    makeTaskGroup,
    makeVariableGroup,
    taskGroups,
    variableGroups
} from "../azure-devops-extension-api/taskAgent/Data";

const POOL_REFERENCE_KEYS = ["id", "isHosted", "isLegacy", "name", "options", "poolType", "scope", "size"];
const AGENT_REFERENCE_KEYS = [
    "_links",
    "accessPoint",
    "enabled",
    "id",
    "name",
    "osDescription",
    "provisioningState",
    "status",
    "version"
];

describe("TaskAgent fixtures are complete", () => {
    it("makes a pool reference with every declared field", () => {
        const reference = makeAgentPoolReference("Azure Pipelines");
        expect(Object.keys(reference).sort()).toEqual(POOL_REFERENCE_KEYS);
        expect(reference.name).toBe("Azure Pipelines");
        expect(reference.isHosted).toBe(true);
        expect(reference.isLegacy).toBe(false);
        expect(reference.options).toBe(TaskAgentPoolOptions.None);
        expect(reference.poolType).toBe(TaskAgentPoolType.Automation);
        expect(typeof reference.scope).toBe("string");
        expect(reference.size).toBeGreaterThanOrEqual(1);
    });

    it("defaults the pool reference name", () => {
        expect(makeAgentPoolReference().name).toBe("Default");
        expect(makeAgentPoolReference().isHosted).toBe(false);
    });

    it("makes a pool with options and properties and no undeclared fields", () => {
        const pool = makeAgentPool();
        expect(pool.options).toBe(TaskAgentPoolOptions.None);
        expect(pool.properties).toEqual({});
        expect(pool.isLegacy).toBe(false);
        expect(typeof pool.createdBy.id).toBe("string");
        expect(typeof pool.owner.id).toBe("string");
        expect(pool).not.toHaveProperty("_links");
    });

    it("makes an agent reference with every declared field", () => {
        const reference = makeAgentReference("runner-9");
        expect(Object.keys(reference).sort()).toEqual(AGENT_REFERENCE_KEYS);
        expect(reference.name).toBe("runner-9");
        expect(reference.status).toBe(TaskAgentStatus.Online);
        expect(reference._links).toEqual({});
    });

    it("generates an agent reference name", () => {
        expect(makeAgentReference().name.startsWith("agent-")).toBe(true);
    });

    it("makes an agent with authorization, update and properties", () => {
        const agent = makeAgent();
        expect(typeof agent.authorization.authorizationUrl).toBe("string");
        expect(typeof agent.authorization.clientId).toBe("string");
        expect(agent.authorization.publicKey.exponent).toEqual([1, 0, 1]);
        expect(agent.authorization.publicKey.modulus).toHaveLength(8);
        expect(agent.pendingUpdate.currentState).toBe("Completed");
        expect(agent.pendingUpdate.reason.code).toBe(TaskAgentUpdateReasonType.Manual);
        expect(typeof agent.pendingUpdate.requestedBy.id).toBe("string");
        expect(agent.pendingUpdate.requestTime).toBeInstanceOf(Date);
        expect(agent.pendingUpdate.sourceVersion).toEqual({ major: 2, minor: 217, patch: 0 });
        expect(agent.pendingUpdate.targetVersion).toEqual({ major: 2, minor: 218, patch: 0 });
        expect(agent.properties).toEqual({});
    });

    it("links the agent requests back to the agent by reference only", () => {
        const agent = makeAgent("runner-3");
        expect(agent.assignedRequest.reservedAgent.id).toBe(agent.id);
        expect(agent.assignedRequest.reservedAgent.name).toBe("runner-3");
        expect(agent.lastCompletedRequest.reservedAgent.id).toBe(agent.id);
        expect(agent.assignedAgentCloudRequest.agent.id).toBe(agent.id);
        expect(agent.assignedRequest.requestId).not.toBeUndefined();
        expect(Object.keys(agent.assignedRequest.reservedAgent).sort()).toEqual(AGENT_REFERENCE_KEYS);
        expect(Object.keys(agent.assignedAgentCloudRequest.agent).sort()).toEqual(AGENT_REFERENCE_KEYS);
        expect(Object.keys(agent.assignedAgentCloudRequest.pool).sort()).toEqual(POOL_REFERENCE_KEYS);
        expect(() => JSON.stringify(agent)).not.toThrow();
    });

    it("makes a job request whose agents are references", () => {
        const request = makeAgentJobRequest();
        expect(Object.keys(request.reservedAgent).sort()).toEqual(AGENT_REFERENCE_KEYS);
        expect(request.matchedAgents).toHaveLength(1);
        expect(Object.keys(request.matchedAgents[0]).sort()).toEqual(AGENT_REFERENCE_KEYS);
    });

    it("makes a cloud request whose agent and pool are references", () => {
        const request = makeAgentCloudRequest();
        expect(Object.keys(request.agent).sort()).toEqual(AGENT_REFERENCE_KEYS);
        expect(Object.keys(request.pool).sort()).toEqual(POOL_REFERENCE_KEYS);
        expect(request.pool.name).toBe("Default");
    });

    it("makes a queue with a full pool reference and no undeclared fields", () => {
        const queue = makeAgentQueue("Azure Pipelines");
        expect(Object.keys(queue).sort()).toEqual(["id", "name", "pool", "projectId"]);
        expect(Object.keys(queue.pool).sort()).toEqual(POOL_REFERENCE_KEYS);
        expect(queue.pool.name).toBe("Azure Pipelines");
        expect(queue.pool.options).toBe(TaskAgentPoolOptions.None);
        expect(queue.pool.isLegacy).toBe(false);
    });

    it("makes a task group that carries the whole task definition", () => {
        const group = makeTaskGroup();
        expect(group.definitionType).toBe("metaTask");
        expect(group.deleted).toBe(false);
        expect(typeof group.comment).toBe("string");
        expect(typeof group.parentDefinitionId).toBe("string");
        expect(group.version).toEqual({ build: "", isTest: false, major: 1, minor: 0, patch: 0, preRelease: "" });
        expect(group.inputs).toEqual([]);
        expect(group.outputVariables).toHaveLength(1);
        expect(group.agentExecution.execTask.version).toBe("1.0.0");
        expect(group.restrictions.settableVariables.allowed).toEqual([]);
        expect(group.runsOn).toEqual(["Agent", "DeploymentGroup"]);
        expect(group.retiredDate).toBeInstanceOf(Date);
        expect(group.deprecationMessage).toBe("");
        expect(group).not.toHaveProperty("_links");
        expect(group).not.toHaveProperty("outputs");
    });

    it("makes a variable group with provider data and read-only flags", () => {
        const group = makeVariableGroup();
        expect(group.providerData).toEqual({});
        expect(group.variables["MyVariable"]).toEqual({ value: "myValue", isReadOnly: false, isSecret: false });
        expect(group.variableGroupProjectReferences).toEqual([]);
    });

    it("makes a deployment group with machine tags and no undeclared fields", () => {
        const group = makeDeploymentGroup();
        expect(group.machineTags).toHaveLength(2);
        expect(group.machineTags.every(tag => typeof tag === "string")).toBe(true);
        expect(group.pool.options).toBe(TaskAgentPoolOptions.None);
        expect(typeof group.project.name).toBe("string");
        expect(group).not.toHaveProperty("_links");
        expect(group).not.toHaveProperty("poolId");
    });

    it("seeds every list with the completed shapes", () => {
        expect(agents.every(agent => agent.assignedRequest.reservedAgent.id === agent.id)).toBe(true);
        expect(agentQueues.every(queue => typeof queue.pool.scope === "string")).toBe(true);
        expect(taskGroups.every(group => group.definitionType === "metaTask")).toBe(true);
        expect(variableGroups.every(group => group.variables["MyVariable"].isReadOnly === false)).toBe(true);
        expect(deploymentGroups.every(group => group.machineTags.length === 2)).toBe(true);
        expect(agentCloudRequests.every(request => !("systemCapabilities" in request.agent))).toBe(true);
        expect(agentRequests.map(request => request.reservedAgent.id)).toEqual([700, 701, 702]);
        expect(agentRequests.every(request => !("systemCapabilities" in request.reservedAgent))).toBe(true);
        expect(deploymentMachines.every(machine => machine.agent.authorization.publicKey.modulus.length === 8)).toBe(true);
    });

    it("pages deployment groups with a continuation token", () => {
        expect(Array.isArray(deploymentGroupsPage)).toBe(true);
        expect(deploymentGroupsPage.continuationToken).toBe("");
    });
});

describe("TaskAgentRestClient typed results", () => {
    const client = getClient(TaskAgentRestClient);

    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("returns agents tagged with the pool and fully filled", async () => {
        const list = await client.getAgents(44);
        expect(list).toHaveLength(agents.length);
        expect(list.every(agent => (agent as unknown as { poolId: number }).poolId === 44)).toBe(true);
        expect(list[0].pendingUpdate.reason.code).toBe(TaskAgentUpdateReasonType.Manual);
    });

    it("merges variable group parameters over a complete fixture", async () => {
        const parameters = {
            description: "shared secrets",
            name: "Secrets",
            providerData: {},
            type: "Vsts",
            variableGroupProjectReferences: [],
            variables: { token: { isReadOnly: true, isSecret: true, value: "" } }
        };
        const added = await client.addVariableGroup(parameters);
        expect(added.name).toBe("Secrets");
        expect(added.variables).toEqual(parameters.variables);
        expect(added.isShared).toBe(false);
        const updated = await client.updateVariableGroup(parameters, 77);
        expect(updated.id).toBe(77);
        expect(updated.description).toBe("shared secrets");
        expect(updated.providerData).toEqual({});
    });

    it("returns paged lists carrying their continuation token", async () => {
        const groups = await client.getDeploymentGroups("proj");
        expect(groups.continuationToken).toBe("");
        const requests = await client.getAgentRequests(1, 2);
        expect(Array.isArray(requests)).toBe(true);
        expect(requests.continuationToken).toBeNull();
    });
});
