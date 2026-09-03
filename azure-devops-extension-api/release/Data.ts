import { fake } from "../common/fixtures";
import {
    Release,
    ReleaseDefinition,
    ReleaseEnvironment,
    Deployment,
    ReleaseApproval,
    EnvironmentStatus,
    ReleaseStatus,
    DeploymentStatus,
    ApprovalStatus,
    ApprovalType
} from "azure-devops-extension-api/Release";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef, makeProjectReference } from "../core/Data";

export const makeEnvironment = (name = "Production"): ReleaseEnvironment => ({
    id: fake.number.int(),
    releaseId: fake.number.int(),
    name,
    status: EnvironmentStatus.Succeeded,
    deploySteps: [],
    variables: {},
    variableGroups: [],
    rank: 1,
    owner: makeIdentityRef(),
    createdOn: fake.date.recent(),
    modifiedOn: fake.date.recent(),
    conditions: [],
    postDeployApprovals: [],
    preDeployApprovals: [],
    _links: {} as any
} as unknown as ReleaseEnvironment);

export const makeReleaseDefinition = (): ReleaseDefinition => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
    name: fake.lorem.slug(),
    path: "\\",
    revision: fake.number.int({ min: 1, max: 30 }),
    url: fake.internet.url(),
    createdBy: makeIdentityRef(),
    createdOn: fake.date.recent(),
    modifiedBy: makeIdentityRef(),
    modifiedOn: fake.date.recent(),
    description: fake.lorem.sentence(),
    environments: [makeEnvironment("Dev"), makeEnvironment("QA"), makeEnvironment("Production")],
    artifacts: [],
    triggers: [],
    variables: {},
    variableGroups: [],
    tags: [],
    _links: {} as any
} as unknown as ReleaseDefinition);

export const makeRelease = (): Release => ({
    id: fake.number.int({ min: 1, max: 100_000 }),
    name: `Release-${fake.number.int({ min: 1, max: 999 })}`,
    status: ReleaseStatus.Active,
    createdOn: fake.date.recent(),
    modifiedOn: fake.date.recent(),
    modifiedBy: makeIdentityRef(),
    createdBy: makeIdentityRef(),
    environments: [makeEnvironment("Dev"), makeEnvironment("QA"), makeEnvironment("Production")],
    variables: {},
    variableGroups: [],
    artifacts: [],
    releaseDefinition: { id: fake.number.int(), name: fake.lorem.slug() } as any,
    description: fake.lorem.sentence(),
    reason: 1 as any,
    releaseNameFormat: "Release-$(rev:r)",
    keepForever: false,
    definitionSnapshotRevision: 1,
    logsContainerUrl: fake.internet.url(),
    url: fake.internet.url(),
    tags: [],
    projectReference: makeProjectReference() as any,
    _links: {} as any
} as unknown as Release);

export const makeDeployment = (): Deployment => ({
    id: fake.number.int(),
    release: { id: fake.number.int(), name: `Release-${fake.number.int()}` } as any,
    releaseDefinition: { id: fake.number.int(), name: fake.lorem.slug() } as any,
    releaseEnvironment: { id: fake.number.int(), name: "Production" } as any,
    deploymentStatus: DeploymentStatus.Succeeded,
    requestedBy: makeIdentityRef(),
    requestedFor: makeIdentityRef(),
    queuedOn: fake.date.recent(),
    startedOn: fake.date.recent(),
    completedOn: fake.date.recent(),
    attempt: 1,
    reason: 1 as any,
    _links: {} as any
} as unknown as Deployment);

export const makeApproval = (): ReleaseApproval => ({
    id: fake.number.int(),
    release: { id: fake.number.int(), name: `Release-${fake.number.int()}` } as any,
    releaseDefinition: { id: fake.number.int(), name: fake.lorem.slug() } as any,
    releaseEnvironment: { id: fake.number.int(), name: "Production" } as any,
    approver: makeIdentityRef(),
    approvedBy: makeIdentityRef(),
    status: ApprovalStatus.Pending,
    approvalType: ApprovalType.PreDeploy,
    rank: 1,
    attempt: 1,
    createdOn: fake.date.recent(),
    modifiedOn: fake.date.recent(),
    comments: "",
    url: fake.internet.url(),
    _links: {} as any
} as unknown as ReleaseApproval);

export const releaseDefinitions = Array.from({ length: 3 }, makeReleaseDefinition);
export const releases = Array.from({ length: 5 }, makeRelease);
export const deployments = Array.from({ length: 5 }, makeDeployment);
export const approvals = Array.from({ length: 3 }, makeApproval);

export const releaseDefinitionsPage: PagedList<ReleaseDefinition> =
    Object.assign([...releaseDefinitions], { continuationToken: "" }) as PagedList<ReleaseDefinition>;
export const deploymentsPage: PagedList<Deployment> =
    Object.assign([...deployments], { continuationToken: "" }) as PagedList<Deployment>;
export const approvalsPage: PagedList<ReleaseApproval> =
    Object.assign([...approvals], { continuationToken: "" }) as PagedList<ReleaseApproval>;
