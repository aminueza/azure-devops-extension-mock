import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    TaskAgentRestClient,
    TaskAgent,
    TaskAgentPool,
    TaskAgentQueue,
    TaskGroup,
    VariableGroup,
    DeploymentGroup,
    VariableGroupParameters
} from "azure-devops-extension-api/TaskAgent";
import { PagedList } from "azure-devops-extension-api/WebApi";
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
} from "./Data";

/**
 * Mocked TaskAgentRestClient — pools, agents, queues, task groups, variable
 * groups and deployment groups. Covers the flows most pipeline extensions need.
 */
export class MockTaskAgentRestClient extends RestClientBase {
    public TYPE = TaskAgentRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    // Agent pools
    getAgentPools(): Promise<TaskAgentPool[]> {
        return Promise.resolve(agentPools);
    }

    getAgentPool(poolId: number): Promise<TaskAgentPool> {
        const found = agentPools.find(p => p.id === poolId);
        return Promise.resolve(found ?? { ...makeAgentPool(), id: poolId });
    }

    // Agents
    getAgents(poolId: number): Promise<TaskAgent[]> {
        return Promise.resolve(agents.map(a => ({ ...a, poolId } as unknown as TaskAgent)));
    }

    getAgent(_poolId: number, agentId: number): Promise<TaskAgent> {
        const found = agents.find(a => a.id === agentId);
        return Promise.resolve(found ?? { ...makeAgent(), id: agentId });
    }

    addAgent(agent: TaskAgent, _poolId: number): Promise<TaskAgent> {
        return Promise.resolve({ ...makeAgent(), ...agent });
    }

    updateAgent(agent: TaskAgent, _poolId: number, agentId: number): Promise<TaskAgent> {
        return Promise.resolve({ ...makeAgent(), ...agent, id: agentId });
    }

    deleteAgent(_poolId: number, _agentId: number): Promise<void> {
        return Promise.resolve();
    }

    // Queues
    getAgentQueues(_project: string): Promise<TaskAgentQueue[]> {
        return Promise.resolve(agentQueues);
    }

    getAgentQueue(_project: string, queueId: number): Promise<TaskAgentQueue> {
        const found = agentQueues.find(q => q.id === queueId);
        return Promise.resolve(found ?? { ...makeAgentQueue(), id: queueId });
    }

    // Task groups
    getTaskGroups(_project: string): Promise<TaskGroup[]> {
        return Promise.resolve(taskGroups);
    }

    // Variable groups
    getVariableGroups(_project: string): Promise<VariableGroup[]> {
        return Promise.resolve(variableGroups);
    }

    getVariableGroupsPaged(_project: string): Promise<PagedList<VariableGroup>> {
        return Promise.resolve(variableGroupsPage);
    }

    getVariableGroup(_project: string, groupId: number): Promise<VariableGroup> {
        const found = variableGroups.find(g => g.id === groupId);
        return Promise.resolve(found ?? { ...makeVariableGroup(), id: groupId });
    }

    addVariableGroup(group: VariableGroupParameters): Promise<VariableGroup> {
        return Promise.resolve({ ...makeVariableGroup(), ...(group as unknown as VariableGroup) });
    }

    updateVariableGroup(
        group: VariableGroupParameters,
        groupId: number
    ): Promise<VariableGroup> {
        return Promise.resolve({
            ...makeVariableGroup(),
            ...(group as unknown as VariableGroup),
            id: groupId
        });
    }

    deleteVariableGroup(_groupId: number, _projectIds: string[]): Promise<void> {
        return Promise.resolve();
    }

    // Deployment groups
    getDeploymentGroups(_project: string): Promise<PagedList<DeploymentGroup>> {
        return Promise.resolve(deploymentGroupsPage);
    }

    getDeploymentGroup(_project: string, deploymentGroupId: number): Promise<DeploymentGroup> {
        const found = deploymentGroups.find(g => g.id === deploymentGroupId);
        return Promise.resolve(found ?? { ...makeDeploymentGroup(), id: deploymentGroupId });
    }
}
