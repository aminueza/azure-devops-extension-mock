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
    TaskAgentPoolMaintenanceDefinition,
    TaskAgentPoolMaintenanceJob,
    TaskAgentPoolMaintenanceJobStatus,
    DeploymentGroupCreateParameter,
    DeploymentGroupUpdateParameter,
    DeploymentGroupMetrics,
    DeploymentMachine,
    DeploymentMachineExpands,
    DeploymentMachineGroup,
    DeploymentPoolSummary,
    DeploymentPoolSummaryExpands,
    DeploymentTargetExpands,
    DeploymentTargetUpdateParameter,
    MachineGroupActionFilter,
    TaskAgentJobResultFilter,
    TaskAgentStatus,
    TaskAgentStatusFilter,
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
    deploymentGroupMetrics,
    deploymentGroups,
    deploymentGroupsPage,
    deploymentMachineGroups,
    deploymentMachines,
    deploymentPoolSummaries,
    makeAgent,
    makeAgentCloud,
    makeAgentJobRequest,
    makeAgentMessage,
    makeAgentPool,
    makeAgentQueue,
    makeAgentSession,
    makeDeploymentGroup,
    makeDeploymentMachine,
    makeDeploymentMachineGroup,
    makeMaintenanceDefinition,
    makeMaintenanceJob,
    maintenanceDefinitions,
    maintenanceJobs,
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

const encode = (value: string): ArrayBuffer => {
    const buffer = new ArrayBuffer(value.length);
    new Uint8Array(buffer).set(Array.from(value, character => character.charCodeAt(0)));
    return buffer;
};

const stampMachine = (
    machine: DeploymentMachine,
    project: string,
    deploymentGroupId: number
): DeploymentMachine => {
    return { ...machine, properties: { ...machine.properties, project, deploymentGroupId } };
};

const machineById = (machineId: number): DeploymentMachine => {
    const found = deploymentMachines.find(m => m.id === machineId);
    return found ?? { ...makeDeploymentMachine(), id: machineId };
};

const byTags = (machines: DeploymentMachine[], tags?: string[]): DeploymentMachine[] => {
    return tags === undefined
        ? machines
        : machines.filter(m => tags.every(tag => m.tags.includes(tag)));
};

const stampGroupMachine = (
    machine: DeploymentMachine,
    project: string,
    machineGroupId: number
): DeploymentMachine => {
    return { ...machine, properties: { ...machine.properties, project, machineGroupId } };
};

const byMachineName = (
    machines: DeploymentMachine[],
    name?: string,
    partialNameMatch?: boolean
): DeploymentMachine[] => {
    return name === undefined
        ? machines
        : machines.filter(m =>
              partialNameMatch === true ? m.agent.name.includes(name) : m.agent.name === name
          );
};

const byEnabled = (machines: DeploymentMachine[], enabled?: boolean): DeploymentMachine[] => {
    return enabled === undefined ? machines : machines.filter(m => m.agent.enabled === enabled);
};

const requestsForMachine = (
    deploymentGroupId: number,
    machineId: number,
    completedRequestCount?: number
): TaskAgentJobRequest[] => {
    const matched = take(agentRequests, completedRequestCount);
    return matched.map(request => ({
        ...request,
        data: {
            ...request.data,
            deploymentGroupId: `${deploymentGroupId}`,
            machineId: `${machineId}`
        }
    }));
};

const requestsForMachines = (
    deploymentGroupId: number,
    machineIds?: number[],
    completedRequestCount?: number
): TaskAgentJobRequest[] => {
    const ids = machineIds ?? deploymentMachines.map(m => m.id);
    return ids.flatMap(id => requestsForMachine(deploymentGroupId, id, completedRequestCount));
};

const statusMatches = (
    machine: DeploymentMachine,
    agentStatus?: TaskAgentStatusFilter
): boolean => {
    if (agentStatus === TaskAgentStatusFilter.Online) {
        return machine.agent.status === TaskAgentStatus.Online;
    }
    if (agentStatus === TaskAgentStatusFilter.Offline) {
        return machine.agent.status === TaskAgentStatus.Offline;
    }
    return true;
};

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

    createAgentPoolMaintenanceDefinition(
        definition: TaskAgentPoolMaintenanceDefinition,
        poolId: number
    ): Promise<TaskAgentPoolMaintenanceDefinition> {
        const base = makeMaintenanceDefinition();
        return Promise.resolve({
            ...base,
            ...definition,
            pool: { ...base.pool, id: poolId }
        });
    }

    deleteAgentPoolMaintenanceDefinition(
        _poolId: number,
        _definitionId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    getAgentPoolMaintenanceDefinition(
        _poolId: number,
        definitionId: number
    ): Promise<TaskAgentPoolMaintenanceDefinition> {
        const found = maintenanceDefinitions.find(d => d.id === definitionId);
        return Promise.resolve(found ?? { ...makeMaintenanceDefinition(), id: definitionId });
    }

    getAgentPoolMaintenanceDefinitions(
        poolId: number
    ): Promise<TaskAgentPoolMaintenanceDefinition[]> {
        return Promise.resolve(
            maintenanceDefinitions.map(d => ({ ...d, pool: { ...d.pool, id: poolId } }))
        );
    }

    updateAgentPoolMaintenanceDefinition(
        definition: TaskAgentPoolMaintenanceDefinition,
        poolId: number,
        definitionId: number
    ): Promise<TaskAgentPoolMaintenanceDefinition> {
        const base = makeMaintenanceDefinition();
        return Promise.resolve({
            ...base,
            ...definition,
            id: definitionId,
            pool: { ...base.pool, id: poolId }
        });
    }

    deleteAgentPoolMaintenanceJob(_poolId: number, _jobId: number): Promise<void> {
        return Promise.resolve();
    }

    getAgentPoolMaintenanceJob(
        poolId: number,
        jobId: number
    ): Promise<TaskAgentPoolMaintenanceJob> {
        const found = maintenanceJobs.find(j => j.jobId === jobId);
        const base = found ?? makeMaintenanceJob();
        return Promise.resolve({ ...base, jobId, pool: { ...base.pool, id: poolId } });
    }

    getAgentPoolMaintenanceJobLogs(poolId: number, jobId: number): Promise<ArrayBuffer> {
        return Promise.resolve(encode(`pool-${poolId}-maintenance-job-${jobId}`));
    }

    getAgentPoolMaintenanceJobs(
        poolId: number,
        definitionId?: number
    ): Promise<TaskAgentPoolMaintenanceJob[]> {
        const matched =
            definitionId === undefined
                ? maintenanceJobs
                : maintenanceJobs.filter(j => j.definitionId === definitionId);
        return Promise.resolve(matched.map(j => ({ ...j, pool: { ...j.pool, id: poolId } })));
    }

    queueAgentPoolMaintenanceJob(
        job: TaskAgentPoolMaintenanceJob,
        poolId: number
    ): Promise<TaskAgentPoolMaintenanceJob> {
        const base = makeMaintenanceJob();
        return Promise.resolve({
            ...base,
            ...job,
            status: TaskAgentPoolMaintenanceJobStatus.Queued,
            pool: { ...base.pool, id: poolId }
        });
    }

    updateAgentPoolMaintenanceJob(
        job: TaskAgentPoolMaintenanceJob,
        poolId: number,
        jobId: number
    ): Promise<TaskAgentPoolMaintenanceJob> {
        const base = makeMaintenanceJob();
        return Promise.resolve({
            ...base,
            ...job,
            jobId,
            pool: { ...base.pool, id: poolId }
        });
    }

    addDeploymentGroup(
        deploymentGroup: DeploymentGroupCreateParameter,
        project: string
    ): Promise<DeploymentGroup> {
        const base = makeDeploymentGroup();
        return Promise.resolve({
            ...base,
            name: deploymentGroup.name,
            description: deploymentGroup.description,
            pool: { ...base.pool, id: deploymentGroup.poolId },
            project: { ...base.project, name: project }
        });
    }

    deleteDeploymentGroup(_project: string, _deploymentGroupId: number): Promise<void> {
        return Promise.resolve();
    }

    updateDeploymentGroup(
        deploymentGroup: DeploymentGroupUpdateParameter,
        project: string,
        deploymentGroupId: number
    ): Promise<DeploymentGroup> {
        const base = makeDeploymentGroup();
        return Promise.resolve({
            ...base,
            id: deploymentGroupId,
            name: deploymentGroup.name,
            description: deploymentGroup.description,
            project: { ...base.project, name: project }
        });
    }

    getDeploymentGroupsMetrics(
        project: string,
        deploymentGroupName?: string,
        continuationToken?: string,
        top?: number
    ): Promise<PagedList<DeploymentGroupMetrics>> {
        const matched =
            deploymentGroupName === undefined
                ? deploymentGroupMetrics
                : deploymentGroupMetrics.filter(
                      m => m.deploymentGroup.name === deploymentGroupName
                  );
        const items = take(matched, top).map(m => ({
            ...m,
            deploymentGroup: {
                ...m.deploymentGroup,
                project: { ...m.deploymentGroup.project, name: project }
            }
        }));
        return Promise.resolve(page(items, continuationToken ?? null));
    }

    generateDeploymentGroupAccessToken(
        project: string,
        deploymentGroupId: number
    ): Promise<string> {
        return Promise.resolve(`${project}-deployment-group-${deploymentGroupId}-token`);
    }

    generateDeploymentPoolAccessToken(poolId: number): Promise<string> {
        return Promise.resolve(`deployment-pool-${poolId}-token`);
    }

    getDeploymentPoolsSummary(
        poolName?: string,
        _expands?: DeploymentPoolSummaryExpands,
        poolIds?: number[]
    ): Promise<DeploymentPoolSummary[]> {
        const byName =
            poolName === undefined
                ? deploymentPoolSummaries
                : deploymentPoolSummaries.filter(s => s.pool.name === poolName);
        const byId =
            poolIds === undefined ? byName : byName.filter(s => poolIds.includes(s.pool.id));
        return Promise.resolve(byId);
    }

    addDeploymentMachineGroup(
        machineGroup: DeploymentMachineGroup,
        project: string
    ): Promise<DeploymentMachineGroup> {
        const base = makeDeploymentMachineGroup();
        return Promise.resolve({
            ...base,
            ...machineGroup,
            project: { ...base.project, name: project }
        });
    }

    deleteDeploymentMachineGroup(_project: string, _machineGroupId: number): Promise<void> {
        return Promise.resolve();
    }

    getDeploymentMachineGroup(
        project: string,
        machineGroupId: number,
        _actionFilter?: MachineGroupActionFilter
    ): Promise<DeploymentMachineGroup> {
        const found = deploymentMachineGroups.find(g => g.id === machineGroupId);
        const base = found ?? makeDeploymentMachineGroup();
        return Promise.resolve({
            ...base,
            id: machineGroupId,
            project: { ...base.project, name: project }
        });
    }

    getDeploymentMachineGroups(
        project: string,
        machineGroupName?: string,
        _actionFilter?: MachineGroupActionFilter
    ): Promise<DeploymentMachineGroup[]> {
        const matched =
            machineGroupName === undefined
                ? deploymentMachineGroups
                : deploymentMachineGroups.filter(g => g.name === machineGroupName);
        return Promise.resolve(
            matched.map(g => ({ ...g, project: { ...g.project, name: project } }))
        );
    }

    updateDeploymentMachineGroup(
        machineGroup: DeploymentMachineGroup,
        project: string,
        machineGroupId: number
    ): Promise<DeploymentMachineGroup> {
        const base = makeDeploymentMachineGroup();
        return Promise.resolve({
            ...base,
            ...machineGroup,
            id: machineGroupId,
            project: { ...base.project, name: project }
        });
    }

    generateDeploymentMachineGroupAccessToken(
        project: string,
        machineGroupId: number
    ): Promise<string> {
        return Promise.resolve(`${project}-machine-group-${machineGroupId}-token`);
    }

    addDeploymentMachine(
        machine: DeploymentMachine,
        project: string,
        deploymentGroupId: number
    ): Promise<DeploymentMachine> {
        const created = { ...makeDeploymentMachine(), ...machine };
        return Promise.resolve(stampMachine(created, project, deploymentGroupId));
    }

    deleteDeploymentMachine(
        _project: string,
        _deploymentGroupId: number,
        _machineId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    getDeploymentMachine(
        project: string,
        deploymentGroupId: number,
        machineId: number,
        _expand?: DeploymentMachineExpands
    ): Promise<DeploymentMachine> {
        return Promise.resolve(stampMachine(machineById(machineId), project, deploymentGroupId));
    }

    getDeploymentMachines(
        project: string,
        deploymentGroupId: number,
        tags?: string[],
        name?: string,
        _expand?: DeploymentMachineExpands
    ): Promise<DeploymentMachine[]> {
        const matched = byMachineName(byTags(deploymentMachines, tags), name);
        return Promise.resolve(matched.map(m => stampMachine(m, project, deploymentGroupId)));
    }

    replaceDeploymentMachine(
        machine: DeploymentMachine,
        project: string,
        deploymentGroupId: number,
        machineId: number
    ): Promise<DeploymentMachine> {
        const replaced = { ...makeDeploymentMachine(), ...machine, id: machineId };
        return Promise.resolve(stampMachine(replaced, project, deploymentGroupId));
    }

    updateDeploymentMachine(
        machine: DeploymentMachine,
        project: string,
        deploymentGroupId: number,
        machineId: number
    ): Promise<DeploymentMachine> {
        const updated = { ...makeDeploymentMachine(), ...machine, id: machineId };
        return Promise.resolve(stampMachine(updated, project, deploymentGroupId));
    }

    updateDeploymentMachines(
        machines: DeploymentMachine[],
        project: string,
        deploymentGroupId: number
    ): Promise<DeploymentMachine[]> {
        const updated = machines.map(m => ({ ...makeDeploymentMachine(), ...m }));
        return Promise.resolve(updated.map(m => stampMachine(m, project, deploymentGroupId)));
    }

    refreshDeploymentMachines(_project: string, _deploymentGroupId: number): Promise<void> {
        return Promise.resolve();
    }

    getDeploymentMachineGroupMachines(
        project: string,
        machineGroupId: number,
        tagFilters?: string[]
    ): Promise<DeploymentMachine[]> {
        const matched = byTags(deploymentMachines, tagFilters);
        return Promise.resolve(matched.map(m => stampGroupMachine(m, project, machineGroupId)));
    }

    updateDeploymentMachineGroupMachines(
        machines: DeploymentMachine[],
        project: string,
        machineGroupId: number
    ): Promise<DeploymentMachine[]> {
        const updated = machines.map(m => ({ ...makeDeploymentMachine(), ...m }));
        return Promise.resolve(updated.map(m => stampGroupMachine(m, project, machineGroupId)));
    }

    addDeploymentTarget(
        machine: DeploymentMachine,
        project: string,
        deploymentGroupId: number
    ): Promise<DeploymentMachine> {
        const created = { ...makeDeploymentMachine(), ...machine };
        return Promise.resolve(stampMachine(created, project, deploymentGroupId));
    }

    deleteDeploymentTarget(
        _project: string,
        _deploymentGroupId: number,
        _targetId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    getDeploymentTarget(
        project: string,
        deploymentGroupId: number,
        targetId: number,
        _expand?: DeploymentTargetExpands
    ): Promise<DeploymentMachine> {
        return Promise.resolve(stampMachine(machineById(targetId), project, deploymentGroupId));
    }

    getDeploymentTargets(
        project: string,
        deploymentGroupId: number,
        tags?: string[],
        name?: string,
        partialNameMatch?: boolean,
        _expand?: DeploymentTargetExpands,
        agentStatus?: TaskAgentStatusFilter,
        _agentJobResult?: TaskAgentJobResultFilter,
        continuationToken?: string,
        top?: number,
        enabled?: boolean,
        _propertyFilters?: string[]
    ): Promise<PagedList<DeploymentMachine>> {
        const named = byMachineName(byTags(deploymentMachines, tags), name, partialNameMatch);
        const matched = byEnabled(named, enabled).filter(m => statusMatches(m, agentStatus));
        const items = take(matched, top).map(m => stampMachine(m, project, deploymentGroupId));
        return Promise.resolve(page(items, continuationToken ?? null));
    }

    replaceDeploymentTarget(
        machine: DeploymentMachine,
        project: string,
        deploymentGroupId: number,
        targetId: number
    ): Promise<DeploymentMachine> {
        const replaced = { ...makeDeploymentMachine(), ...machine, id: targetId };
        return Promise.resolve(stampMachine(replaced, project, deploymentGroupId));
    }

    updateDeploymentTarget(
        machine: DeploymentMachine,
        project: string,
        deploymentGroupId: number,
        targetId: number
    ): Promise<DeploymentMachine> {
        const updated = { ...makeDeploymentMachine(), ...machine, id: targetId };
        return Promise.resolve(stampMachine(updated, project, deploymentGroupId));
    }

    updateDeploymentTargets(
        machines: DeploymentTargetUpdateParameter[],
        project: string,
        deploymentGroupId: number
    ): Promise<DeploymentMachine[]> {
        const updated = machines.map(m => ({
            ...makeDeploymentMachine(),
            id: m.id,
            tags: m.tags
        }));
        return Promise.resolve(updated.map(m => stampMachine(m, project, deploymentGroupId)));
    }

    refreshDeploymentTargets(_project: string, _deploymentGroupId: number): Promise<void> {
        return Promise.resolve();
    }

    getAgentRequestsForDeploymentMachine(
        _project: string,
        deploymentGroupId: number,
        machineId: number,
        completedRequestCount?: number
    ): Promise<TaskAgentJobRequest[]> {
        return Promise.resolve(
            requestsForMachine(deploymentGroupId, machineId, completedRequestCount)
        );
    }

    getAgentRequestsForDeploymentMachines(
        _project: string,
        deploymentGroupId: number,
        machineIds?: number[],
        completedRequestCount?: number
    ): Promise<TaskAgentJobRequest[]> {
        return Promise.resolve(
            requestsForMachines(deploymentGroupId, machineIds, completedRequestCount)
        );
    }

    getAgentRequestsForDeploymentTarget(
        _project: string,
        deploymentGroupId: number,
        targetId: number,
        completedRequestCount?: number
    ): Promise<TaskAgentJobRequest[]> {
        return Promise.resolve(
            requestsForMachine(deploymentGroupId, targetId, completedRequestCount)
        );
    }

    getAgentRequestsForDeploymentTargets(
        _project: string,
        deploymentGroupId: number,
        targetIds?: number[],
        _ownerId?: number,
        _completedOn?: Date,
        completedRequestCount?: number
    ): Promise<TaskAgentJobRequest[]> {
        return Promise.resolve(
            requestsForMachines(deploymentGroupId, targetIds, completedRequestCount)
        );
    }
}




