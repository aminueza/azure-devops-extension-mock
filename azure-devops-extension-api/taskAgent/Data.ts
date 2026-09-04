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
    VariableGroupProviderData
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
export const taskGroups: TaskGroup[] = Array.from({ length: 2 }, makeTaskGroup);
export const variableGroups: VariableGroup[] = [
    makeVariableGroup("Common"),
    makeVariableGroup("Production")
];
export const deploymentGroups: DeploymentGroup[] = Array.from({ length: 2 }, makeDeploymentGroup);

export const deploymentGroupsPage: PagedList<DeploymentGroup> =
    Object.assign([...deploymentGroups], { continuationToken: "" }) as PagedList<DeploymentGroup>;
