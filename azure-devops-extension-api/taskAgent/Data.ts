import { fake } from "../common/fixtures";
import {
    TaskAgent,
    TaskAgentPool,
    TaskAgentQueue,
    TaskGroup,
    VariableGroup,
    DeploymentGroup,
    TaskAgentStatus,
    TaskAgentPoolType,
    VariableGroupProviderData,
    TaskAgentCloud,
    TaskAgentCloudType,
    TaskAgentCloudRequest,
    TaskAgentQueueRestrictions,
    TaskHubLicenseDetails,
    ResourceLimit,
    ResourceUsage,
    TaskAgentJobRequest,
    TaskAgentMessage,
    TaskAgentSession,
    TaskOrchestrationOwner,
    TaskResult
} from "azure-devops-extension-api/TaskAgent";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef } from "../core/Data";

export const makeAgentPool = (name = "Default"): TaskAgentPool => ({
    id: fake.number.int({ min: 1, max: 1000 }),
    name,
    scope: fake.string.uuid(),
    isHosted: name.startsWith("Azure"),
    poolType: TaskAgentPoolType.Automation,
    size: fake.number.int({ min: 1, max: 50 }),
    agentCloudId: 0,
    isLegacy: false,
    autoProvision: false,
    autoSize: false,
    autoUpdate: true,
    createdOn: fake.date.past(),
    createdBy: makeIdentityRef(),
    owner: makeIdentityRef(),
    targetSize: 0,
    _links: {} as any
} as unknown as TaskAgentPool);

export const makeAgent = (name?: string): TaskAgent => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
    name: name ?? `agent-${fake.lorem.slug()}`,
    version: `${fake.number.int({ min: 2, max: 3 })}.218.0`,
    status: TaskAgentStatus.Online,
    enabled: true,
    osDescription: fake.helpers.arrayElement([
        "Linux 5.15.0",
        "Microsoft Windows 10.0.20348",
        "Darwin 22.4.0"
    ]),
    provisioningState: "Provisioned",
    accessPoint: "CodexAccessMapping",
    createdOn: fake.date.past(),
    maxParallelism: 1,
    statusChangedOn: fake.date.recent(),
    systemCapabilities: {
        "Agent.OS": "Linux",
        "Agent.OSArchitecture": "X64"
    },
    userCapabilities: {},
    _links: {} as any
} as unknown as TaskAgent);

export const makeAgentQueue = (name = "Default"): TaskAgentQueue => ({
    id: fake.number.int(),
    name,
    projectId: fake.string.uuid(),
    pool: {
        id: fake.number.int(),
        name,
        isHosted: name.startsWith("Azure"),
        poolType: TaskAgentPoolType.Automation
    } as any,
    _links: {} as any
} as unknown as TaskAgentQueue);

export const makeTaskGroup = (): TaskGroup => ({
    id: fake.string.uuid(),
    name: fake.lorem.slug(),
    description: fake.lorem.sentence(),
    version: { major: 1, minor: 0, patch: 0, isTest: false } as any,
    revision: 1,
    tasks: [],
    inputs: [],
    outputs: [],
    createdBy: makeIdentityRef(),
    createdOn: fake.date.past(),
    modifiedBy: makeIdentityRef(),
    modifiedOn: fake.date.recent(),
    author: fake.person.fullName(),
    owner: fake.person.fullName(),
    _links: {} as any
} as unknown as TaskGroup);

export const makeVariableGroup = (name?: string): VariableGroup => ({
    id: fake.number.int(),
    name: name ?? fake.lorem.slug(),
    description: fake.lorem.sentence(),
    type: "Vsts",
    providerData: undefined as unknown as VariableGroupProviderData,
    variables: {
        "MyVariable": { value: "myValue", isSecret: false }
    } as any,
    variableGroupProjectReferences: [],
    createdBy: makeIdentityRef(),
    createdOn: fake.date.past(),
    modifiedBy: makeIdentityRef(),
    modifiedOn: fake.date.recent(),
    isShared: false
} as unknown as VariableGroup);

export const makeDeploymentGroup = (): DeploymentGroup => ({
    id: fake.number.int(),
    name: fake.lorem.slug(),
    description: fake.lorem.sentence(),
    project: { id: fake.string.uuid(), name: fake.company.name() } as any,
    pool: makeAgentPool() as any,
    machineCount: fake.number.int({ min: 1, max: 50 }),
    machines: [],
    poolId: fake.number.int(),
    _links: {} as any
} as unknown as DeploymentGroup);

export const makeAgentCloud = (): TaskAgentCloud => ({
    acquireAgentEndpoint: fake.internet.url(),
    acquisitionTimeout: fake.number.int({ min: 60, max: 900 }),
    agentCloudId: fake.number.int({ min: 1, max: 500 }),
    getAccountParallelismEndpoint: fake.internet.url(),
    getAgentDefinitionEndpoint: fake.internet.url(),
    getAgentRequestStatusEndpoint: fake.internet.url(),
    id: fake.string.uuid(),
    internal: false,
    maxParallelism: fake.number.int({ min: 1, max: 25 }),
    name: fake.lorem.slug(),
    releaseAgentEndpoint: fake.internet.url(),
    sharedSecret: fake.string.alphanumeric(32),
    type: fake.helpers.arrayElement(["AzureVmss", "SelfHosted", "Kubernetes"])
});

export const makeAgentCloudType = (): TaskAgentCloudType => ({
    displayName: fake.commerce.productName(),
    inputDescriptors: [],
    name: fake.lorem.slug()
});

export const makeAgentCloudRequest = (): TaskAgentCloudRequest => ({
    agent: makeAgent(),
    agentCloudId: fake.number.int({ min: 1, max: 500 }),
    agentConnectedTime: fake.date.recent(),
    agentData: { poolName: fake.lorem.slug() },
    agentSpecification: { VMImage: fake.lorem.slug() },
    pool: makeAgentPool(),
    poolProvidersTags: { tier: fake.lorem.word() },
    provisionedTime: fake.date.recent(),
    provisionRequestTime: fake.date.recent(),
    releaseRequestTime: fake.date.recent(),
    requestId: fake.string.uuid(),
    requestVersion: fake.number.int({ min: 1, max: 5 })
});

export const makeQueueRestrictions = (): TaskAgentQueueRestrictions => ({
    restrictedImageLabels: [fake.lorem.slug(), fake.lorem.slug()]
});

export const makeResourceLimit = (): ResourceLimit => ({
    failedToReachAllProviders: false,
    hostId: fake.string.uuid(),
    isHosted: true,
    isPremium: false,
    parallelismTag: fake.helpers.arrayElement(["Public", "Private"]),
    quotaId: fake.string.uuid(),
    resourceLimitsData: { FreeCount: "1", PaidCount: "10" },
    totalCount: fake.number.int({ min: 1, max: 100 }),
    totalMinutes: fake.number.int({ min: 0, max: 5000 })
});

export const makeResourceUsage = (): ResourceUsage => ({
    resourceLimit: makeResourceLimit(),
    runningRequests: [],
    usedCount: fake.number.int({ min: 0, max: 50 }),
    usedMinutes: fake.number.int({ min: 0, max: 1000 })
});

export const makeTaskHubLicenseDetails = (): TaskHubLicenseDetails => ({
    enterpriseUsersCount: fake.number.int({ min: 0, max: 500 }),
    failedToReachAllProviders: false,
    freeHostedLicenseCount: fake.number.int({ min: 0, max: 10 }),
    freeLicenseCount: fake.number.int({ min: 0, max: 10 }),
    hasLicenseCountEverUpdated: true,
    hostedAgentMinutesFreeCount: fake.number.int({ min: 0, max: 1800 }),
    hostedAgentMinutesUsedCount: fake.number.int({ min: 0, max: 1800 }),
    hostedLicensesArePremium: false,
    msdnUsersCount: fake.number.int({ min: 0, max: 200 }),
    purchasedHostedLicenseCount: fake.number.int({ min: 0, max: 20 }),
    purchasedLicenseCount: fake.number.int({ min: 0, max: 20 }),
    totalHostedLicenseCount: fake.number.int({ min: 0, max: 30 }),
    totalLicenseCount: fake.number.int({ min: 0, max: 50 }),
    totalPrivateLicenseCount: fake.number.int({ min: 0, max: 30 })
});

export const agentPools: TaskAgentPool[] = [
    makeAgentPool("Azure Pipelines"),
    makeAgentPool("Default"),
    makeAgentPool("Self-Hosted")
];
export const agents: TaskAgent[] = Array.from({ length: 3 }, () => makeAgent());
export const agentQueues: TaskAgentQueue[] = [
    makeAgentQueue("Azure Pipelines"),
    makeAgentQueue("Default")
];
export const agentClouds: TaskAgentCloud[] = Array.from({ length: 3 }, (_value, index) => ({
    ...makeAgentCloud(),
    agentCloudId: 900 + index
}));
export const agentCloudTypes: TaskAgentCloudType[] = Array.from({ length: 2 }, makeAgentCloudType);
export const agentCloudRequests: TaskAgentCloudRequest[] = Array.from({ length: 2 }, makeAgentCloudRequest);
export const resourceLimits: ResourceLimit[] = Array.from({ length: 2 }, makeResourceLimit);
export const taskGroups: TaskGroup[] = Array.from({ length: 2 }, makeTaskGroup);
export const variableGroups: VariableGroup[] = [
    makeVariableGroup("Common"),
    makeVariableGroup("Production")
];
export const deploymentGroups: DeploymentGroup[] = Array.from({ length: 2 }, makeDeploymentGroup);

export const deploymentGroupsPage: PagedList<DeploymentGroup> =
    Object.assign([...deploymentGroups], { continuationToken: "" }) as PagedList<DeploymentGroup>;

export const makeOrchestrationOwner = (): TaskOrchestrationOwner => ({
    _links: {},
    id: fake.number.int({ min: 1, max: 5000 }),
    name: fake.lorem.slug()
});

export const makeAgentJobRequest = (): TaskAgentJobRequest => ({
    agentSpecification: { VMImage: fake.lorem.slug() },
    assignTime: fake.date.recent(),
    data: { ParallelismTag: "Private", ServiceOwner: fake.string.uuid() },
    definition: makeOrchestrationOwner(),
    demands: [{ name: "Agent.Version", value: "2.218.0" }],
    finishTime: fake.date.recent(),
    hostId: fake.string.uuid(),
    jobId: fake.string.uuid(),
    jobName: fake.lorem.slug(),
    lockedUntil: fake.date.future(),
    matchedAgents: [makeAgent()],
    matchesAllAgentsInPool: false,
    orchestrationId: fake.string.uuid(),
    owner: makeOrchestrationOwner(),
    planGroup: fake.lorem.slug(),
    planId: fake.string.uuid(),
    planType: "Build",
    poolId: fake.number.int({ min: 1, max: 1000 }),
    priority: fake.number.int({ min: 0, max: 10 }),
    queueId: fake.number.int({ min: 1, max: 1000 }),
    queueTime: fake.date.past(),
    receiveTime: fake.date.recent(),
    requestId: fake.number.int({ min: 1, max: 10_000 }),
    reservedAgent: makeAgent(),
    result: TaskResult.Succeeded,
    scopeId: fake.string.uuid(),
    serviceOwner: fake.string.uuid(),
    statusMessage: fake.lorem.sentence(),
    userDelayed: false
});

export const makeAgentSession = (): TaskAgentSession => ({
    agent: makeAgent(),
    agentCanHandleOaepSHA256: true,
    encryptionKey: {
        encrypted: false,
        encryptionPadding: "OaepSHA256",
        value: [1, 2, 3, 4]
    },
    ownerName: fake.person.fullName(),
    sessionId: fake.string.uuid(),
    systemCapabilities: {
        "Agent.OS": "Linux",
        "Agent.OSArchitecture": "X64"
    }
});

export const makeAgentMessage = (): TaskAgentMessage => ({
    body: JSON.stringify({ jobId: fake.string.uuid() }),
    iv: [9, 8, 7, 6],
    messageId: fake.number.int({ min: 1, max: 10_000 }),
    messageType: fake.helpers.arrayElement(["PipelineAgentJobRequest", "AgentRefresh", "JobCancellation"])
});

export const agentRequests: TaskAgentJobRequest[] = Array.from(
    { length: 3 },
    (_value, index) => ({
        ...makeAgentJobRequest(),
        requestId: 900 + index,
        planId: `plan-${900 + index}`,
        jobId: `job-${900 + index}`,
        queueId: 800 + index,
        poolId: 600 + index,
        reservedAgent: { ...makeAgent(), id: 700 + index }
    })
);

export const agentSessions: TaskAgentSession[] = Array.from(
    { length: 2 },
    (_value, index) => ({ ...makeAgentSession(), sessionId: `session-${900 + index}` })
);

export const messages: TaskAgentMessage[] = Array.from(
    { length: 3 },
    (_value, index) => ({ ...makeAgentMessage(), messageId: 900 + index })
);

export const vstsAadTenantId: string = fake.string.uuid();
