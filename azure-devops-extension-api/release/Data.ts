import { faker } from "@faker-js/faker";
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
    id: faker.number.int(),
    releaseId: faker.number.int(),
    name,
    status: EnvironmentStatus.Succeeded,
    deploySteps: [],
    variables: {},
    variableGroups: [],
    rank: 1,
    owner: makeIdentityRef(),
    createdOn: faker.date.recent(),
    modifiedOn: faker.date.recent(),
    conditions: [],
    postDeployApprovals: [],
    preDeployApprovals: [],
    _links: {} as any
} as unknown as ReleaseEnvironment);

export const makeReleaseDefinition = (): ReleaseDefinition => ({
    id: faker.number.int({ min: 1, max: 10_000 }),
    name: faker.lorem.slug(),
    path: "\\",
    revision: faker.number.int({ min: 1, max: 30 }),
    url: faker.internet.url(),
    createdBy: makeIdentityRef(),
    createdOn: faker.date.recent(),
    modifiedBy: makeIdentityRef(),
    modifiedOn: faker.date.recent(),
    description: faker.lorem.sentence(),
    environments: [makeEnvironment("Dev"), makeEnvironment("QA"), makeEnvironment("Production")],
    artifacts: [],
    triggers: [],
    variables: {},
    variableGroups: [],
    tags: [],
    _links: {} as any
} as unknown as ReleaseDefinition);

export const makeRelease = (): Release => ({
    id: faker.number.int({ min: 1, max: 100_000 }),
    name: `Release-${faker.number.int({ min: 1, max: 999 })}`,
    status: ReleaseStatus.Active,
    createdOn: faker.date.recent(),
    modifiedOn: faker.date.recent(),
    modifiedBy: makeIdentityRef(),
    createdBy: makeIdentityRef(),
    environments: [makeEnvironment("Dev"), makeEnvironment("QA"), makeEnvironment("Production")],
    variables: {},
    variableGroups: [],
    artifacts: [],
    releaseDefinition: { id: faker.number.int(), name: faker.lorem.slug() } as any,
    description: faker.lorem.sentence(),
    reason: 1 as any,
    releaseNameFormat: "Release-$(rev:r)",
    keepForever: false,
    definitionSnapshotRevision: 1,
    logsContainerUrl: faker.internet.url(),
    url: faker.internet.url(),
    tags: [],
    projectReference: makeProjectReference() as any,
    _links: {} as any
} as unknown as Release);

export const makeDeployment = (): Deployment => ({
    id: faker.number.int(),
    release: { id: faker.number.int(), name: `Release-${faker.number.int()}` } as any,
    releaseDefinition: { id: faker.number.int(), name: faker.lorem.slug() } as any,
    releaseEnvironment: { id: faker.number.int(), name: "Production" } as any,
    deploymentStatus: DeploymentStatus.Succeeded,
    requestedBy: makeIdentityRef(),
    requestedFor: makeIdentityRef(),
    queuedOn: faker.date.recent(),
    startedOn: faker.date.recent(),
    completedOn: faker.date.recent(),
    attempt: 1,
    reason: 1 as any,
    _links: {} as any
} as unknown as Deployment);

export const makeApproval = (): ReleaseApproval => ({
    id: faker.number.int(),
    release: { id: faker.number.int(), name: `Release-${faker.number.int()}` } as any,
    releaseDefinition: { id: faker.number.int(), name: faker.lorem.slug() } as any,
    releaseEnvironment: { id: faker.number.int(), name: "Production" } as any,
    approver: makeIdentityRef(),
    approvedBy: makeIdentityRef(),
    status: ApprovalStatus.Pending,
    approvalType: ApprovalType.PreDeploy,
    rank: 1,
    attempt: 1,
    createdOn: faker.date.recent(),
    modifiedOn: faker.date.recent(),
    comments: "",
    url: faker.internet.url(),
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
