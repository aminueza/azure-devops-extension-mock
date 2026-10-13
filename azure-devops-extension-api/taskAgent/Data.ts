import { fake } from "../common/fixtures";
import {
    TaskAgent,
    TaskAgentPool,
    TaskAgentQueue,
    TaskGroup,
    VariableGroup,
    DeploymentGroup,
    DeploymentGroupMetrics,
    DeploymentMachine,
    DeploymentMachineGroup,
    DeploymentPoolSummary,
    EnvironmentResourceType,
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
    TaskAgentPoolMaintenanceDefinition,
    TaskAgentPoolMaintenanceJob,
    TaskAgentPoolMaintenanceJobResult,
    TaskAgentPoolMaintenanceJobStatus,
    TaskAgentPoolMaintenanceScheduleDays,
    TaskOrchestrationOwner,
    TaskResult,
    AuditAction,
    AzureManagementGroup,
    AzureSubscription,
    EnvironmentDeploymentExecutionRecord,
    EnvironmentInstance,
    EnvironmentResource,
    KubernetesResource,
    PackageMetadata,
    PackageVersion,
    SecureFile,
    TaskCommandMode,
    TaskDefinition,
    TaskGroupRevision,
    VirtualMachine,
    VirtualMachineGroup
} from "azure-devops-extension-api/TaskAgent";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef } from "../core/Data";

export const makeAgentPool = (name = "Default"): TaskAgentPool => ({
    id: fake.number.id(),
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
    id: fake.number.id(),
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
    id: fake.number.id(),
    name,
    projectId: fake.string.uuid(),
    pool: {
        id: fake.number.id(),
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
    id: fake.number.id(),
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
    id: fake.number.id(),
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
    id: fake.number.id(),
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

export const makeMaintenanceDefinition = (): TaskAgentPoolMaintenanceDefinition => ({
    enabled: true,
    id: fake.number.id(),
    jobTimeoutInMinutes: fake.number.int({ min: 30, max: 240 }),
    maxConcurrentAgentsPercentage: fake.number.int({ min: 10, max: 100 }),
    options: { workingDirectoryExpirationInDays: fake.number.int({ min: 1, max: 30 }) },
    pool: makeAgentPool(),
    retentionPolicy: { numberOfHistoryRecordsToKeep: fake.number.int({ min: 1, max: 50 }) },
    scheduleSetting: {
        daysToBuild: TaskAgentPoolMaintenanceScheduleDays.Sunday,
        scheduleJobId: fake.string.uuid(),
        startHours: fake.number.int({ min: 0, max: 23 }),
        startMinutes: fake.number.int({ min: 0, max: 59 }),
        timeZoneId: "UTC"
    }
});

export const makeMaintenanceJob = (): TaskAgentPoolMaintenanceJob => ({
    definitionId: fake.number.int({ min: 1, max: 1000 }),
    errorCount: 0,
    finishTime: fake.date.recent(),
    jobId: fake.number.int({ min: 1, max: 10_000 }),
    logsDownloadUrl: fake.internet.url(),
    orchestrationId: fake.string.uuid(),
    pool: makeAgentPool(),
    queueTime: fake.date.past(),
    requestedBy: makeIdentityRef(),
    result: TaskAgentPoolMaintenanceJobResult.Succeeded,
    startTime: fake.date.recent(),
    status: TaskAgentPoolMaintenanceJobStatus.Completed,
    targetAgents: [
        {
            agent: makeAgent(),
            jobId: fake.number.int({ min: 1, max: 10_000 }),
            result: TaskAgentPoolMaintenanceJobResult.Succeeded,
            status: TaskAgentPoolMaintenanceJobStatus.Completed
        }
    ],
    warningCount: 0
});

export const maintenanceDefinitions: TaskAgentPoolMaintenanceDefinition[] = Array.from(
    { length: 2 },
    (_value, index) => ({ ...makeMaintenanceDefinition(), id: 900 + index })
);

export const maintenanceJobs: TaskAgentPoolMaintenanceJob[] = Array.from(
    { length: 3 },
    (_value, index) => ({
        ...makeMaintenanceJob(),
        jobId: 900 + index,
        definitionId: 950 + (index % 2)
    })
);

export const makeDeploymentGroupMetrics = (): DeploymentGroupMetrics => ({
    columnsHeader: {
        dimensions: [{ columnName: "TargetState", columnValueType: "String" }],
        metrics: [{ columnName: "TotalCount", columnValueType: "Number" }]
    },
    deploymentGroup: makeDeploymentGroup(),
    rows: [
        { dimensions: ["online"], metrics: [`${fake.number.int({ min: 0, max: 50 })}`] },
        { dimensions: ["offline"], metrics: [`${fake.number.int({ min: 0, max: 50 })}`] }
    ]
});

export const makeDeploymentPoolSummary = (): DeploymentPoolSummary => ({
    deploymentGroups: [makeDeploymentGroup()],
    offlineAgentsCount: fake.number.int({ min: 0, max: 10 }),
    onlineAgentsCount: fake.number.int({ min: 1, max: 20 }),
    pool: makeAgentPool(),
    resource: {
        id: fake.number.id(),
        name: fake.lorem.slug(),
        tags: [fake.lorem.word()],
        type: EnvironmentResourceType.VirtualMachine
    }
});

export const makeDeploymentMachine = (): DeploymentMachine => ({
    agent: makeAgent(),
    id: fake.number.id(),
    properties: { region: fake.lorem.word() },
    tags: [fake.lorem.word(), fake.lorem.word()]
});

export const makeDeploymentMachineGroup = (): DeploymentMachineGroup => ({
    id: fake.number.id(),
    machines: [makeDeploymentMachine()],
    name: fake.lorem.slug(),
    pool: makeAgentPool(),
    project: { id: fake.string.uuid(), name: fake.company.name() },
    size: fake.number.int({ min: 1, max: 20 })
});

export const deploymentGroupMetrics: DeploymentGroupMetrics[] = Array.from(
    { length: 3 },
    (_value, index) => {
        const metrics = makeDeploymentGroupMetrics();
        return {
            ...metrics,
            deploymentGroup: {
                ...metrics.deploymentGroup,
                id: 900 + index,
                name: `group-${900 + index}`
            }
        };
    }
);

export const deploymentPoolSummaries: DeploymentPoolSummary[] = Array.from(
    { length: 3 },
    (_value, index) => {
        const summary = makeDeploymentPoolSummary();
        return {
            ...summary,
            pool: { ...summary.pool, id: 900 + index, name: `pool-${900 + index}` }
        };
    }
);

export const deploymentMachineGroups: DeploymentMachineGroup[] = Array.from(
    { length: 3 },
    (_value, index) => ({
        ...makeDeploymentMachineGroup(),
        id: 900 + index,
        name: `machine-group-${900 + index}`
    })
);

export const deploymentMachines: DeploymentMachine[] = Array.from(
    { length: 4 },
    (_value, index) => ({
        ...makeDeploymentMachine(),
        id: 900 + index,
        agent: {
            ...makeAgent(`target-${900 + index}`),
            id: 950 + index,
            enabled: index !== 3,
            status: index === 3 ? TaskAgentStatus.Offline : TaskAgentStatus.Online
        },
        properties: { region: `region-${900 + index}` },
        tags: index % 2 === 0 ? ["web", "prod"] : ["db", "staging"]
    })
);

export const makeAzureManagementGroup = (): AzureManagementGroup => ({
    displayName: fake.company.name(),
    id: `/providers/Microsoft.Management/managementGroups/${fake.lorem.slug()}`,
    name: fake.lorem.slug(),
    tenantId: fake.string.uuid()
});

export const makeAzureSubscription = (): AzureSubscription => ({
    displayName: fake.company.name(),
    subscriptionId: fake.string.uuid(),
    subscriptionTenantId: fake.string.uuid(),
    subscriptionTenantName: fake.company.name()
});

export const makeEnvironment = (): EnvironmentInstance => ({
    createdBy: makeIdentityRef(),
    createdOn: fake.date.past(),
    description: fake.lorem.sentence(),
    id: fake.number.id(),
    lastModifiedBy: makeIdentityRef(),
    lastModifiedOn: fake.date.recent(),
    name: fake.lorem.slug(),
    project: { id: fake.string.uuid(), name: fake.company.name() },
    resources: [
        {
            id: fake.number.id(),
            name: fake.lorem.slug(),
            tags: [fake.lorem.word()],
            type: EnvironmentResourceType.Kubernetes
        }
    ]
});

export const makeEnvironmentDeploymentRecord = (): EnvironmentDeploymentExecutionRecord => ({
    definition: makeOrchestrationOwner(),
    environmentId: fake.number.id(),
    finishTime: fake.date.recent(),
    id: fake.number.id(),
    jobAttempt: 1,
    jobName: fake.lorem.slug(),
    owner: makeOrchestrationOwner(),
    planId: fake.string.uuid(),
    planType: "Build",
    queueTime: fake.date.past(),
    requestIdentifier: fake.string.uuid(),
    resourceId: fake.number.id(),
    result: TaskResult.Succeeded,
    scopeId: fake.string.uuid(),
    serviceOwner: fake.string.uuid(),
    stageAttempt: 1,
    stageName: fake.lorem.slug(),
    startTime: fake.date.recent()
});

export const makeEnvironmentResource = (type: EnvironmentResourceType): EnvironmentResource => ({
    createdBy: makeIdentityRef(),
    createdOn: fake.date.past(),
    environmentReference: { id: fake.number.id(), name: fake.lorem.slug() },
    id: fake.number.id(),
    lastModifiedBy: makeIdentityRef(),
    lastModifiedOn: fake.date.recent(),
    name: fake.lorem.slug(),
    tags: [fake.lorem.word()],
    type
});

export const makeKubernetesResource = (): KubernetesResource => ({
    ...makeEnvironmentResource(EnvironmentResourceType.Kubernetes),
    clusterName: `aks-${fake.lorem.slug()}`,
    namespace: fake.lorem.word(),
    serviceEndpointId: fake.string.uuid()
});

export const makeVirtualMachineGroup = (): VirtualMachineGroup => ({
    ...makeEnvironmentResource(EnvironmentResourceType.VirtualMachine),
    poolId: fake.number.id()
});

export const makeVirtualMachine = (name?: string): VirtualMachine => ({
    agent: makeAgent(name),
    id: fake.number.id(),
    tags: [fake.lorem.word(), fake.lorem.word()]
});

export const parsePackageVersion = (version: string): PackageVersion => {
    const [major = 0, minor = 0, patch = 0] = version
        .split(".")
        .map(part => Number.parseInt(part, 10))
        .filter(part => !Number.isNaN(part));
    return { major, minor, patch };
};

export const makePackageMetadata = (
    type = "agent",
    platform = "linux-x64",
    version = `${fake.number.int({ min: 2, max: 4 })}.${fake.number.int({ min: 200, max: 260 })}.${fake.number.int({ min: 0, max: 9 })}`
): PackageMetadata => {
    const parsed = parsePackageVersion(version);
    const label = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    const filename = `vsts-${type}-${platform}-${label}.${platform.startsWith("win") ? "zip" : "tar.gz"}`;
    return {
        createdOn: fake.date.past(),
        downloadUrl: `https://download.agent.dev.azure.com/${type}/${label}/${filename}`,
        filename,
        hashValue: fake.git.commitSha(),
        infoUrl: `https://go.microsoft.com/fwlink/?LinkId=${fake.number.int({ min: 100_000, max: 999_999 })}`,
        platform,
        type,
        version: parsed
    };
};

export const makeTaskGroupRevision = (): TaskGroupRevision => ({
    changedBy: makeIdentityRef(),
    changedDate: fake.date.recent(),
    changeType: AuditAction.Update,
    comment: fake.lorem.sentence(),
    fileId: fake.number.id(),
    majorVersion: 1,
    revision: fake.number.int({ min: 1, max: 50 }),
    taskGroupId: fake.string.uuid()
});

export const makeSecureFile = (name?: string): SecureFile => ({
    createdBy: makeIdentityRef(),
    createdOn: fake.date.past(),
    id: fake.string.uuid(),
    modifiedBy: makeIdentityRef(),
    modifiedOn: fake.date.recent(),
    name: name ?? `${fake.lorem.slug()}.${fake.helpers.arrayElement(["pfx", "p12", "mobileprovision", "keystore"])}`,
    properties: { environment: fake.lorem.word() },
    ticket: fake.string.alphanumeric(32)
});

export const makeTaskDefinition = (): TaskDefinition => {
    const name = fake.lorem.slug(2);
    const base: Omit<TaskDefinition, "deprecationMessage" | "retiredDate"> = {
        _buildConfigMapping: { Default: "1.0.0" },
        agentExecution: {
            execTask: {
                buildConfig: "Default",
                contributionIdentifier: `ms.vss-distributed-task.${name}`,
                contributionVersion: "1.0.0",
                id: fake.string.uuid(),
                inputs: {},
                name,
                version: "1.0.0"
            },
            platformInstructions: {}
        },
        author: fake.company.name(),
        buildConfig: "Default",
        category: fake.helpers.arrayElement(["Build", "Deploy", "Package", "Test", "Utility"]),
        contentsUploaded: true,
        contributionIdentifier: `ms.vss-distributed-task.${name}`,
        contributionVersion: "1.0.0",
        dataSourceBindings: [],
        definitionType: "task",
        demands: [{ name: "Agent.Version", value: "2.218.0" }],
        deprecated: false,
        description: fake.lorem.sentence(),
        disabled: false,
        ecosystem: "",
        execution: { Node20_1: { target: "index.js" } },
        friendlyName: fake.commerce.productName(),
        groups: [
            {
                displayName: "Advanced",
                isExpanded: false,
                name: "advanced",
                tags: [],
                visibleRule: ""
            }
        ],
        helpMarkDown: fake.lorem.sentence(),
        helpUrl: fake.internet.url(),
        hostType: "",
        iconUrl: fake.image.url(),
        id: fake.string.uuid(),
        inputs: [
            {
                aliases: [],
                defaultValue: "",
                groupName: "advanced",
                helpMarkDown: fake.lorem.sentence(),
                label: "Working directory",
                name: "workingDirectory",
                options: {},
                properties: {},
                required: false,
                type: "filePath",
                validation: { expression: "", message: "" },
                visibleRule: ""
            }
        ],
        instanceNameFormat: `Run ${name}`,
        minimumAgentVersion: "2.144.0",
        name,
        outputVariables: [{ description: fake.lorem.sentence(), name: "result" }],
        packageLocation: "",
        packageType: "",
        postJobExecution: {},
        preJobExecution: {},
        preview: false,
        release: { ordinal: 1, sprint: fake.number.int({ min: 180, max: 260 }) },
        releaseNotes: fake.lorem.sentence(),
        restrictions: {
            commands: { mode: TaskCommandMode.Any },
            settableVariables: { allowed: [] }
        },
        runsOn: ["Agent", "DeploymentGroup"],
        satisfies: [],
        serverOwned: true,
        showEnvironmentVariables: false,
        sourceDefinitions: [],
        sourceLocation: "",
        version: {
            build: "",
            isTest: false,
            major: fake.number.int({ min: 0, max: 5 }),
            minor: fake.number.int({ min: 0, max: 260 }),
            patch: fake.number.int({ min: 0, max: 20 }),
            preRelease: ""
        },
        visibility: ["Build", "Release"]
    };
    const newerFields = { deprecationMessage: "", retiredDate: fake.date.future() };
    return { ...base, ...newerFields };
};

export const azureManagementGroups: AzureManagementGroup[] = Array.from(
    { length: 2 },
    makeAzureManagementGroup
);

export const azureSubscriptions: AzureSubscription[] = Array.from(
    { length: 3 },
    makeAzureSubscription
);

export const endpointQueryResults: string[] = fake.helpers.distinct(
    3,
    () => fake.lorem.slug(),
    item => item
);

export const environments: EnvironmentInstance[] = fake.helpers.distinct(
    3,
    makeEnvironment,
    item => item.name
);

export const environmentDeploymentRecords: EnvironmentDeploymentExecutionRecord[] = Array.from(
    { length: 3 },
    makeEnvironmentDeploymentRecord
);

export const kubernetesResources: KubernetesResource[] = Array.from(
    { length: 2 },
    makeKubernetesResource
);

export const virtualMachineGroups: VirtualMachineGroup[] = Array.from(
    { length: 2 },
    makeVirtualMachineGroup
);

export const virtualMachines: VirtualMachine[] = fake.helpers
    .distinct(4, () => makeVirtualMachine(), item => item.agent.name)
    .map((machine, index) => ({
        ...machine,
        tags: index % 2 === 0 ? ["web", "prod"] : ["db", "staging"]
    }));

export const packages: PackageMetadata[] = [
    makePackageMetadata("agent", "win-x64", "4.248.0"),
    makePackageMetadata("agent", "linux-x64", "4.248.0"),
    makePackageMetadata("agent", "osx-x64", "4.248.0"),
    makePackageMetadata("agent", "linux-x64", "3.246.0"),
    makePackageMetadata("pipelines-agent", "linux-arm64", "4.248.0")
];

export const taskGroupRevisions: TaskGroupRevision[] = Array.from(
    { length: 3 },
    (_value, index) => ({
        ...makeTaskGroupRevision(),
        changeType: index === 0 ? AuditAction.Add : AuditAction.Update,
        revision: index + 1
    })
);

export const secureFiles: SecureFile[] = fake.helpers.distinct(
    3,
    () => makeSecureFile(),
    item => item.name
);

export const taskDefinitions: TaskDefinition[] = fake.helpers.distinct(
    3,
    makeTaskDefinition,
    item => item.name
);

export const yamlSchema: Record<string, unknown> = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://github.com/Microsoft/azure-pipelines-vscode/blob/main/service-schema.json",
    $comment: "v1.248.0",
    title: "Pipeline schema",
    description: "A pipeline definition",
    oneOf: [{ $ref: "#/definitions/pipeline" }],
    definitions: {
        pipeline: {
            type: "object",
            properties: {
                trigger: { $ref: "#/definitions/trigger" },
                pool: { $ref: "#/definitions/pool" },
                steps: { type: "array", items: { $ref: "#/definitions/step" } }
            }
        },
        trigger: { type: ["string", "array", "object"] },
        pool: { type: ["string", "object"] },
        step: { type: "object", properties: { task: { type: "string" } } }
    }
};
