import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    TaskAgentRestClient,
    TaskAgent,
    TaskAgentPool,
    TaskAgentQueue,
    TaskGroup,
    VariableGroup,
    DeploymentGroup,
    VariableGroupParameters,
    TaskAgentPoolActionFilter,
    TaskAgentQueueActionFilter,
    TaskAgentQueueRestrictions,
    TaskAgentCloud,
    TaskAgentCloudType,
    TaskAgentCloudRequest,
    TaskHubLicenseDetails,
    ResourceLimit,
    ResourceUsage,
    AadLoginPromptOption,
    TaskAgentJobRequest,
    TaskAgentMessage,
    TaskAgentRequestUpdateOptions,
    TaskAgentSession,
    TaskResult
} from "azure-devops-extension-api/TaskAgent";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    agentCloudRequests,
    agentCloudTypes,
    agentClouds,
    agentPools,
    agentQueues,
    agentRequests,
    agents,
    deploymentGroups,
    deploymentGroupsPage,
    makeAgent,
    makeAgentCloud,
    makeAgentJobRequest,
    makeAgentMessage,
    makeAgentPool,
    makeAgentQueue,
    makeAgentSession,
    makeDeploymentGroup,
    makeQueueRestrictions,
    makeResourceUsage,
    makeTaskGroup,
    makeTaskHubLicenseDetails,
    makeVariableGroup,
    messages,
    resourceLimits,
    taskGroups,
    variableGroups,
    vstsAadTenantId,
} from "./Data";

const page = <T>(items: T[], continuationToken: string | null): PagedList<T> =>
    Object.assign([...items], { continuationToken }) as PagedList<T>;

const take = <T>(items: T[], count?: number): T[] => items.slice(0, count ?? items.length);

export class MockTaskAgentRestClient extends RestClientBase {
    public TYPE = TaskAgentRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getAgentPools(): Promise<TaskAgentPool[]> {
        return Promise.resolve(agentPools);
    }

    getAgentPool(poolId: number): Promise<TaskAgentPool> {
        const found = agentPools.find(p => p.id === poolId);
        return Promise.resolve(found ?? { ...makeAgentPool(), id: poolId });
    }

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

    getAgentQueues(_project: string): Promise<TaskAgentQueue[]> {
        return Promise.resolve(agentQueues);
    }

    getAgentQueue(queueId: number, _project?: string): Promise<TaskAgentQueue> {
        const found = agentQueues.find(q => q.id === queueId);
        return Promise.resolve(found ?? { ...makeAgentQueue(), id: queueId });
    }

    getTaskGroups(_project: string): Promise<TaskGroup[]> {
        return Promise.resolve(taskGroups);
    }

    getVariableGroups(_project: string): Promise<VariableGroup[]> {
        return Promise.resolve(variableGroups);
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

    getDeploymentGroups(_project: string): Promise<PagedList<DeploymentGroup>> {
        return Promise.resolve(deploymentGroupsPage);
    }

    getDeploymentGroup(_project: string, deploymentGroupId: number): Promise<DeploymentGroup> {
        const found = deploymentGroups.find(g => g.id === deploymentGroupId);
        return Promise.resolve(found ?? { ...makeDeploymentGroup(), id: deploymentGroupId });
    }

    addAgentPool(pool: TaskAgentPool): Promise<TaskAgentPool> {
        return Promise.resolve({ ...makeAgentPool(), ...pool });
    }

    updateAgentPool(pool: TaskAgentPool, poolId: number): Promise<TaskAgentPool> {
        return Promise.resolve({ ...makeAgentPool(), ...pool, id: poolId });
    }

    deleteAgentPool(_poolId: number): Promise<void> {
        return Promise.resolve();
    }

    getAgentPoolsByIds(
        poolIds: number[],
        _actionFilter?: TaskAgentPoolActionFilter
    ): Promise<TaskAgentPool[]> {
        return Promise.resolve(agentPools.filter(p => poolIds.includes(p.id)));
    }

    getAgentPoolMetadata(poolId: number): Promise<string> {
        return Promise.resolve(`pool-${poolId}-metadata`);
    }

    setAgentPoolMetadata(_agentPoolMetadata: any, _poolId: number): Promise<void> {
        return Promise.resolve();
    }

    hasPoolPermissions(_poolId: number, _permissions: number): Promise<boolean> {
        return Promise.resolve(true);
    }

    addAgentQueue(
        queue: TaskAgentQueue,
        _project?: string,
        _authorizePipelines?: boolean
    ): Promise<TaskAgentQueue> {
        return Promise.resolve({ ...makeAgentQueue(), ...queue });
    }

    deleteAgentQueue(_queueId: number, _project?: string): Promise<void> {
        return Promise.resolve();
    }

    getAgentQueuesByIds(
        queueIds: number[],
        _project?: string,
        _actionFilter?: TaskAgentQueueActionFilter
    ): Promise<TaskAgentQueue[]> {
        return Promise.resolve(agentQueues.filter(q => queueIds.includes(q.id)));
    }

    getAgentQueuesByNames(
        queueNames: string[],
        _project?: string,
        _actionFilter?: TaskAgentQueueActionFilter
    ): Promise<TaskAgentQueue[]> {
        return Promise.resolve(agentQueues.filter(q => queueNames.includes(q.name)));
    }

    getAgentQueuesForPools(
        poolIds: number[],
        _project?: string,
        _actionFilter?: TaskAgentQueueActionFilter
    ): Promise<TaskAgentQueue[]> {
        return Promise.resolve(agentQueues.filter(q => poolIds.includes(q.pool.id)));
    }

    updateQueueRestrictedImageLabels(
        restriction: TaskAgentQueueRestrictions,
        _project: string,
        _queueId: number
    ): Promise<TaskAgentQueueRestrictions> {
        return Promise.resolve({ ...makeQueueRestrictions(), ...restriction });
    }

    addAgentCloud(agentCloud: TaskAgentCloud): Promise<TaskAgentCloud> {
        return Promise.resolve({ ...makeAgentCloud(), ...agentCloud });
    }

    deleteAgentCloud(agentCloudId: number): Promise<TaskAgentCloud> {
        const found = agentClouds.find(c => c.agentCloudId === agentCloudId);
        return Promise.resolve(found ?? { ...makeAgentCloud(), agentCloudId });
    }

    getAgentCloud(agentCloudId: number): Promise<TaskAgentCloud> {
        const found = agentClouds.find(c => c.agentCloudId === agentCloudId);
        return Promise.resolve(found ?? { ...makeAgentCloud(), agentCloudId });
    }

    getAgentClouds(): Promise<TaskAgentCloud[]> {
        return Promise.resolve(agentClouds);
    }

    updateAgentCloud(
        updatedCloud: TaskAgentCloud,
        agentCloudId: number
    ): Promise<TaskAgentCloud> {
        return Promise.resolve({ ...makeAgentCloud(), ...updatedCloud, agentCloudId });
    }

    getAgentCloudRequests(agentCloudId: number): Promise<TaskAgentCloudRequest[]> {
        return Promise.resolve(agentCloudRequests.map(r => ({ ...r, agentCloudId })));
    }

    getAgentCloudTypes(): Promise<TaskAgentCloudType[]> {
        return Promise.resolve(agentCloudTypes);
    }

    getResourceLimits(): Promise<ResourceLimit[]> {
        return Promise.resolve(resourceLimits);
    }

    getResourceUsage(
        _parallelismTag?: string,
        _poolIsHosted?: boolean,
        _includeRunningRequests?: boolean
    ): Promise<ResourceUsage> {
        return Promise.resolve(makeResourceUsage());
    }

    getTaskHubLicenseDetails(
        _hubName: string,
        _includeEnterpriseUsersCount?: boolean,
        _includeHostedAgentMinutesCount?: boolean
    ): Promise<TaskHubLicenseDetails> {
        return Promise.resolve(makeTaskHubLicenseDetails());
    }

    updateTaskHubLicenseDetails(
        taskHubLicenseDetails: TaskHubLicenseDetails,
        _hubName: string
    ): Promise<TaskHubLicenseDetails> {
        return Promise.resolve({ ...makeTaskHubLicenseDetails(), ...taskHubLicenseDetails });
    }

    refreshAgent(_poolId: number, _agentId: number): Promise<void> {
        return Promise.resolve();
    }

    refreshAgents(_poolId: number): Promise<void> {
        return Promise.resolve();
    }

    replaceAgent(agent: TaskAgent, _poolId: number, agentId: number): Promise<TaskAgent> {
        return Promise.resolve({ ...makeAgent(), ...agent, id: agentId });
    }

    updateAgentUpdateState(
        _poolId: number,
        agentId: number,
        currentState: string
    ): Promise<TaskAgent> {
        const found = agents.find(a => a.id === agentId);
        return Promise.resolve({
            ...(found ?? makeAgent()),
            id: agentId,
            provisioningState: currentState
        });
    }

    updateAgentUserCapabilities(
        userCapabilities: { [key: string]: string },
        _poolId: number,
        agentId: number
    ): Promise<TaskAgent> {
        const found = agents.find(a => a.id === agentId);
        return Promise.resolve({ ...(found ?? makeAgent()), id: agentId, userCapabilities });
    }

    getAgentRequest(
        poolId: number,
        requestId: number,
        _includeStatus?: boolean
    ): Promise<TaskAgentJobRequest> {
        const found = agentRequests.find(r => r.requestId === requestId);
        return Promise.resolve(found ?? { ...makeAgentJobRequest(), requestId, poolId });
    }

    getAgentRequests(
        poolId: number,
        top: number,
        _continuationToken?: string
    ): Promise<PagedList<TaskAgentJobRequest>> {
        const items = agentRequests.slice(0, top).map(r => ({ ...r, poolId }));
        return Promise.resolve(page(items, null));
    }

    getAgentRequestsForAgent(
        poolId: number,
        agentId: number,
        completedRequestCount?: number
    ): Promise<TaskAgentJobRequest[]> {
        const matched = agentRequests.filter(r => r.reservedAgent.id === agentId);
        return Promise.resolve(take(matched, completedRequestCount).map(r => ({ ...r, poolId })));
    }

    getAgentRequestsForAgents(
        poolId: number,
        agentIds?: number[],
        completedRequestCount?: number
    ): Promise<TaskAgentJobRequest[]> {
        const matched = agentIds
            ? agentRequests.filter(r => agentIds.includes(r.reservedAgent.id))
            : agentRequests;
        return Promise.resolve(take(matched, completedRequestCount).map(r => ({ ...r, poolId })));
    }

    getAgentRequestsForPlan(
        poolId: number,
        planId: string,
        jobId?: string
    ): Promise<TaskAgentJobRequest[]> {
        const matched = agentRequests.filter(
            r => r.planId === planId && (jobId === undefined || r.jobId === jobId)
        );
        return Promise.resolve(matched.map(r => ({ ...r, poolId })));
    }

    getAgentRequestsForQueue(
        project: string,
        queueId: number,
        top: number,
        continuationToken?: string
    ): Promise<PagedList<TaskAgentJobRequest>> {
        const items = agentRequests
            .filter(r => r.queueId === queueId)
            .slice(0, top)
            .map(r => ({ ...r, scopeId: project }));
        return Promise.resolve(page(items, continuationToken ?? null));
    }

    queueAgentRequest(
        request: TaskAgentJobRequest,
        project: string,
        queueId: number
    ): Promise<TaskAgentJobRequest> {
        return Promise.resolve({
            ...makeAgentJobRequest(),
            ...request,
            queueId,
            scopeId: project
        });
    }

    queueAgentRequestByPool(
        request: TaskAgentJobRequest,
        poolId: number
    ): Promise<TaskAgentJobRequest> {
        return Promise.resolve({ ...makeAgentJobRequest(), ...request, poolId });
    }

    updateAgentRequest(
        request: TaskAgentJobRequest,
        poolId: number,
        requestId: number,
        lockToken: string,
        _updateOptions?: TaskAgentRequestUpdateOptions
    ): Promise<TaskAgentJobRequest> {
        return Promise.resolve({
            ...makeAgentJobRequest(),
            ...request,
            poolId,
            requestId,
            data: { ...request.data, lockToken }
        });
    }

    deleteAgentRequest(
        _poolId: number,
        _requestId: number,
        _lockToken: string,
        _result?: TaskResult,
        _agentShuttingDown?: boolean
    ): Promise<void> {
        return Promise.resolve();
    }

    createAgentSession(
        session: TaskAgentSession,
        _poolId: number
    ): Promise<TaskAgentSession> {
        return Promise.resolve({ ...makeAgentSession(), ...session });
    }

    deleteAgentSession(_poolId: number, _sessionId: string): Promise<void> {
        return Promise.resolve();
    }

    getMessage(
        _poolId: number,
        _sessionId: string,
        lastMessageId?: number
    ): Promise<TaskAgentMessage> {
        const found = messages.find(m => m.messageId === lastMessageId);
        return Promise.resolve(found ?? makeAgentMessage());
    }

    deleteMessage(_poolId: number, _messageId: number, _sessionId: string): Promise<void> {
        return Promise.resolve();
    }

    sendMessage(
        _message: TaskAgentMessage,
        _poolId: number,
        _requestId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    createAadOAuthRequest(
        tenantId: string,
        redirectUri: string,
        _promptOption?: AadLoginPromptOption,
        _completeCallbackPayload?: string,
        _completeCallbackByAuthCode?: boolean
    ): Promise<string> {
        return Promise.resolve(`${redirectUri}?tenantId=${tenantId}`);
    }

    getVstsAadTenantId(): Promise<string> {
        return Promise.resolve(vstsAadTenantId);
    }

    createTeamProject(_project?: string): Promise<void> {
        return Promise.resolve();
    }
}
