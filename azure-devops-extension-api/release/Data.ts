import { fake } from "../common/fixtures";
import {
    Release,
    ReleaseDefinition,
    ReleaseEnvironment,
    Deployment,
    ReleaseApproval,
    AuditAction,
    Change,
    EnvironmentRetentionPolicy,
    MailSectionType,
    Metric,
    SummaryMailSection,
    OrgPipelineReleaseSettings,
    ProjectPipelineReleaseSettings,
    ReleaseSettings,
    ProjectReference,
    ReleaseRevision,
    ReleaseWorkItemRef,
    DefinitionEnvironmentReference,
    ReleaseDefinitionEnvironmentSummary,
    ReleaseDefinitionRevision,
    ReleaseDefinitionShallowReference,
    ReleaseShallowReference,
    EnvironmentStatus,
    ReleaseStatus,
    DeploymentStatus,
    ApprovalStatus,
    ApprovalType,
    Folder,
    FavoriteItem,
    ReleaseDefinitionEnvironment,
    ReleaseDefinitionEnvironmentTemplate,
    AgentArtifactDefinition,
    AgentArtifactType,
    Artifact,
    ArtifactTypeDefinition,
    ArtifactVersion,
    AutoTriggerIssue,
    BuildVersion,
    GateStatus,
    IssueSource,
    ManualIntervention,
    ManualInterventionStatus,
    ManualInterventionType,
    ReleaseGates,
    ReleaseTask,
    ReleaseTaskAttachment,
    ReleaseTriggerType,
    TaskStatus
} from "azure-devops-extension-api/Release";
import { InputValuesQuery } from "azure-devops-extension-api/FormInput";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef, makeProjectReference } from "../core/Data";

export const makeEnvironment = (name = "Production"): ReleaseEnvironment => ({
    id: fake.number.id(),
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
    id: fake.number.id(),
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
    id: fake.number.id(),
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
    releaseDefinition: { id: fake.number.id(), name: fake.lorem.slug() } as any,
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
    id: fake.number.id(),
    release: { id: fake.number.id(), name: `Release-${fake.number.int()}` } as any,
    releaseDefinition: { id: fake.number.id(), name: fake.lorem.slug() } as any,
    releaseEnvironment: { id: fake.number.id(), name: "Production" } as any,
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
    id: fake.number.id(),
    release: { id: fake.number.id(), name: `Release-${fake.number.int()}` } as any,
    releaseDefinition: { id: fake.number.id(), name: fake.lorem.slug() } as any,
    releaseEnvironment: { id: fake.number.id(), name: "Production" } as any,
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

export const makeFolder = (path = `\\${fake.lorem.slug(2)}`): Folder => ({
    path,
    description: fake.lorem.sentence(),
    createdBy: makeIdentityRef(),
    createdOn: fake.date.recent(),
    lastChangedBy: makeIdentityRef(),
    lastChangedDate: fake.date.recent()
});

export const makeFavoriteItem = (type = "ReleaseDefinition"): FavoriteItem => ({
    id: fake.string.uuid(),
    name: fake.lorem.slug(),
    type,
    data: fake.string.alphanumeric(12)
});

export const makeEnvironmentTemplate = (isDeleted = false): ReleaseDefinitionEnvironmentTemplate => ({
    id: fake.string.uuid(),
    name: fake.lorem.slug(),
    description: fake.lorem.sentence(),
    category: fake.helpers.arrayElement(["Azure", "Deploy", "Utility"]),
    iconTaskId: fake.string.uuid(),
    iconUri: fake.image.url(),
    canDelete: true,
    isDeleted,
    environment: {} as ReleaseDefinitionEnvironment
});

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

export const releaseTags = ["candidate", "hotfix", "verified"];
export const definitionTags = ["nightly", "production"];
export const tags = [...new Set([...releaseTags, ...definitionTags])];

export const folders = [
    makeFolder("\\shared\\infra"),
    makeFolder("\\shared\\apps"),
    makeFolder("\\archive")
];

export const favorites = [
    makeFavoriteItem("ReleaseDefinition"),
    makeFavoriteItem("ReleaseDefinition"),
    makeFavoriteItem("Folder")
];

export const environmentTemplates = [
    makeEnvironmentTemplate(),
    makeEnvironmentTemplate(),
    makeEnvironmentTemplate(true)
];

export const makeBuffer = (text: string): ArrayBuffer => {
    const encoded = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(buffer).set(encoded);
    return buffer;
};

export const makeAgentArtifactDefinition = (): AgentArtifactDefinition => ({
    alias: fake.lorem.slug(2),
    artifactType: AgentArtifactType.Build,
    details: fake.lorem.sentence(),
    name: fake.lorem.slug(),
    version: fake.system.semver()
});

export const makeArtifactTypeDefinition = (): ArtifactTypeDefinition => ({
    artifactTriggerConfiguration: {
        isTriggerSupported: true,
        isTriggerSupportedOnlyInHosted: false,
        isWebhookSupportedAtServerLevel: false,
        payloadHashHeaderName: fake.lorem.slug(2),
        resources: {},
        webhookPayloadMapping: {}
    },
    artifactType: fake.helpers.arrayElement(["Build", "Package", "Source", "ContainerImage"]),
    displayName: fake.lorem.slug(2),
    endpointTypeId: fake.string.uuid(),
    inputDescriptors: [],
    isCommitsTraceabilitySupported: true,
    isWorkitemsTraceabilitySupported: true,
    name: fake.lorem.slug(),
    uniqueSourceIdentifier: fake.string.uuid()
});

export const makeBuildVersion = (): BuildVersion => ({
    commitMessage: fake.git.commitMessage(),
    definitionId: `${fake.number.int({ min: 1, max: 999 })}`,
    definitionName: fake.lorem.slug(),
    id: `${fake.number.int({ min: 1, max: 99_999 })}`,
    isMultiDefinitionType: false,
    name: `build-${fake.number.int({ min: 1, max: 999 })}`,
    sourceBranch: `refs/heads/${fake.git.branch()}`,
    sourcePullRequestVersion: {
        iterationId: `${fake.number.int({ min: 1, max: 10 })}`,
        pullRequestId: `${fake.number.int({ min: 1, max: 999 })}`,
        pullRequestMergedAt: fake.date.recent(),
        sourceBranch: `refs/heads/${fake.git.branch()}`,
        sourceBranchCommitId: fake.git.commitSha(),
        targetBranch: "refs/heads/main"
    },
    sourceRepositoryId: fake.string.uuid(),
    sourceRepositoryType: "TfsGit",
    sourceVersion: fake.git.commitSha()
});

export const makeArtifactVersion = (alias: string): ArtifactVersion => ({
    alias,
    defaultVersion: makeBuildVersion(),
    errorMessage: "",
    sourceId: fake.string.uuid(),
    versions: [makeBuildVersion(), makeBuildVersion()]
});

export const makeArtifact = (alias: string): Artifact => ({
    alias,
    definitionReference: {
        definition: {
            id: `${fake.number.int({ min: 1, max: 999 })}`,
            name: fake.lorem.slug()
        },
        project: { id: fake.string.uuid(), name: fake.company.name() }
    },
    isPrimary: true,
    isRetained: false,
    sourceId: fake.string.uuid(),
    type: "Build"
});

export const makeReleaseTask = (): ReleaseTask => ({
    agentName: `agent-${fake.number.int({ min: 1, max: 20 })}`,
    dateEnded: fake.date.recent(),
    dateStarted: fake.date.recent(),
    finishTime: fake.date.recent(),
    id: fake.number.id(),
    issues: [],
    lineCount: fake.number.int({ min: 1, max: 500 }),
    logUrl: fake.internet.url(),
    name: fake.lorem.slug(2),
    percentComplete: 100,
    rank: fake.number.int({ min: 1, max: 10 }),
    resultCode: "",
    startTime: fake.date.recent(),
    status: TaskStatus.Succeeded,
    task: {
        id: fake.string.uuid(),
        name: fake.lorem.slug(),
        version: fake.system.semver()
    },
    timelineRecordId: fake.string.uuid()
});

export const makeReleaseTaskAttachment = (type: string): ReleaseTaskAttachment => ({
    _links: {},
    createdOn: fake.date.recent(),
    modifiedBy: makeIdentityRef(),
    modifiedOn: fake.date.recent(),
    name: fake.system.fileName(),
    recordId: fake.string.uuid(),
    timelineId: fake.string.uuid(),
    type
});

export const makeManualIntervention = (): ManualIntervention => ({
    approver: makeIdentityRef(),
    comments: fake.lorem.sentence(),
    createdOn: fake.date.recent(),
    id: fake.number.id(),
    instructions: fake.lorem.paragraph(),
    modifiedOn: fake.date.recent(),
    name: fake.lorem.slug(2),
    release: { id: fake.number.id(), name: `Release-${fake.number.int()}` },
    releaseDefinition: { id: fake.number.id(), name: fake.lorem.slug() },
    releaseEnvironment: { id: fake.number.id(), name: "Production" },
    status: ManualInterventionStatus.Pending,
    taskInstanceId: fake.string.uuid(),
    type: ManualInterventionType.Task,
    url: fake.internet.url()
} as unknown as ManualIntervention);

export const makeReleaseGates = (id: number): ReleaseGates => ({
    deploymentJobs: [],
    id,
    ignoredGates: [],
    lastModifiedOn: fake.date.recent(),
    runPlanId: fake.string.uuid(),
    stabilizationCompletedOn: fake.date.recent(),
    startedOn: fake.date.recent(),
    status: GateStatus.Succeeded,
    succeedingSince: fake.date.recent()
});

export const makeAutoTriggerIssue = (): AutoTriggerIssue => ({
    issue: {
        data: {},
        issueType: fake.helpers.arrayElement(["error", "warning", "info"]),
        message: fake.lorem.sentence()
    },
    issueSource: IssueSource.System,
    project: makeProjectReference(),
    releaseDefinitionReference: {
        _links: {},
        id: fake.number.id(),
        name: fake.lorem.slug(),
        path: "\\",
        projectReference: makeProjectReference(),
        url: fake.internet.url()
    },
    releaseTriggerType: ReleaseTriggerType.ArtifactSource
});

export const makeInputValuesQuery = (): InputValuesQuery => ({
    currentValues: { definitionId: `${fake.number.int({ min: 1, max: 999 })}` },
    inputValues: [
        {
            defaultValue: fake.lorem.slug(),
            error: { message: "" },
            inputId: fake.lorem.slug(2),
            isDisabled: false,
            isLimitedToPossibleValues: true,
            isReadOnly: false,
            possibleValues: [
                {
                    data: {},
                    displayValue: fake.lorem.slug(),
                    value: fake.string.alphanumeric(8)
                }
            ]
        }
    ],
    resource: {}
});

export const agentArtifactDefinitions = Array.from({ length: 3 }, makeAgentArtifactDefinition);
export const artifactTypeDefinitions = Array.from({ length: 3 }, makeArtifactTypeDefinition);
export const artifactVersions = [makeArtifactVersion("primary"), makeArtifactVersion("secondary")];
export const releaseTasks = Array.from({ length: 3 }, makeReleaseTask);
export const manualInterventions = Array.from({ length: 3 }, makeManualIntervention);
export const autoTriggerIssues = Array.from({ length: 3 }, makeAutoTriggerIssue);

export const taskAttachments = [
    makeReleaseTaskAttachment("logs"),
    makeReleaseTaskAttachment("summary"),
    makeReleaseTaskAttachment("logs")
];

export const sourceBranches = ["refs/heads/main", "refs/heads/develop", "refs/heads/release"];

export const makeDefinitionEnvironmentReference = (
    definitionEnvironmentId: number,
    releaseDefinitionId: number
): DefinitionEnvironmentReference => ({
    definitionEnvironmentId,
    definitionEnvironmentName: fake.lorem.slug(2),
    releaseDefinitionId,
    releaseDefinitionName: fake.lorem.slug()
});

export const makeReleaseDefinitionRevision = (
    definitionId: number,
    revision: number
): ReleaseDefinitionRevision => ({
    apiVersion: "7.1",
    changedBy: makeIdentityRef(),
    changedDate: fake.date.recent(),
    changeType: AuditAction.Update,
    comment: fake.lorem.sentence(),
    definitionId,
    definitionUrl: fake.internet.url(),
    revision
});

export const makeReleaseShallowReference = (id: number): ReleaseShallowReference => ({
    _links: {},
    id,
    name: `Release-${id}`,
    url: fake.internet.url()
});

export const makeReleaseDefinitionShallowReference = (
    id: number
): ReleaseDefinitionShallowReference => ({
    _links: {},
    id,
    name: fake.lorem.slug(),
    path: "\\",
    projectReference: makeProjectReference(),
    url: fake.internet.url()
});

export const makeReleaseDefinitionEnvironmentSummary = (
    id: number
): ReleaseDefinitionEnvironmentSummary => ({
    id,
    lastReleases: [makeReleaseShallowReference(id * 10), makeReleaseShallowReference(id * 10 + 1)],
    name: fake.lorem.slug(2)
});

export const definitionEnvironmentReferences = [
    makeDefinitionEnvironmentReference(101, 11),
    makeDefinitionEnvironmentReference(102, 11),
    makeDefinitionEnvironmentReference(103, 12)
];

export const releaseDefinitionRevisions = [
    makeReleaseDefinitionRevision(11, 1),
    makeReleaseDefinitionRevision(11, 2),
    makeReleaseDefinitionRevision(12, 1)
];

export const releaseDefinitionEnvironmentSummaries = [
    makeReleaseDefinitionEnvironmentSummary(101),
    makeReleaseDefinitionEnvironmentSummary(102),
    makeReleaseDefinitionEnvironmentSummary(103)
];

export const makeReleaseRevision = (
    releaseId: number,
    definitionSnapshotRevision: number
): ReleaseRevision => ({
    changedBy: makeIdentityRef(),
    changedDate: fake.date.recent(),
    changeDetails: fake.lorem.sentence(),
    changeType: "Update",
    comment: fake.lorem.sentence(),
    definitionSnapshotRevision,
    releaseId
});

export const makeChange = (id: string): Change => ({
    author: makeIdentityRef(),
    changeType: "TfsGit",
    displayUri: fake.internet.url(),
    id,
    location: fake.internet.url(),
    message: fake.git.commitMessage(),
    pushedBy: makeIdentityRef(),
    pusher: fake.person.fullName(),
    timestamp: fake.date.recent()
});

export const makeReleaseWorkItemRef = (id: string): ReleaseWorkItemRef => ({
    assignee: fake.person.fullName(),
    id,
    provider: "TfsWorkItemTracking",
    state: "Active",
    title: fake.lorem.sentence(),
    type: "Bug",
    url: fake.internet.url()
});

export const releaseRevisions = [
    makeReleaseRevision(2001, 1),
    makeReleaseRevision(2001, 2),
    makeReleaseRevision(2002, 1)
];

export const releaseChanges = [
    makeChange("change-1"),
    makeChange("change-2"),
    makeChange("change-3")
];

export const releaseWorkItemRefs = [
    makeReleaseWorkItemRef("501"),
    makeReleaseWorkItemRef("502"),
    makeReleaseWorkItemRef("503")
];

export const releaseProjects: ProjectReference[] = Array.from({ length: 3 }, makeProjectReference);

export const makeMetric = (name: string, value: number): Metric => ({ name, value });

export const makeEnvironmentRetentionPolicy = (
    daysToKeep: number,
    releasesToKeep: number
): EnvironmentRetentionPolicy => ({
    daysToKeep,
    releasesToKeep,
    retainBuild: true
});

export const makeReleaseSettings = (): ReleaseSettings => ({
    complianceSettings: { checkForCredentialsAndOtherSecrets: true },
    retentionSettings: {
        daysToKeepDeletedReleases: 30,
        defaultEnvironmentRetentionPolicy: makeEnvironmentRetentionPolicy(30, 3),
        maximumEnvironmentRetentionPolicy: makeEnvironmentRetentionPolicy(365, 100)
    }
});

export const makeProjectPipelineReleaseSettings = (): ProjectPipelineReleaseSettings => ({
    enforceJobAuthScope: true,
    hasManageSettingsPermission: true,
    orgEnforceJobAuthScope: true,
    publicProject: false
});

export const makeOrgPipelineReleaseSettings = (): OrgPipelineReleaseSettings => ({
    hasManagePipelinePoliciesPermission: true,
    orgEnforceJobAuthScope: true
});

export const metrics = [
    makeMetric("TotalReleases", 42),
    makeMetric("ActiveReleases", 7),
    makeMetric("FailedDeployments", 3)
];

export const makeSummaryMailSection = (
    sectionType: MailSectionType,
    rank: number,
    title: string
): SummaryMailSection => ({
    htmlContent: `<p>${fake.lorem.sentence()}</p>`,
    rank,
    sectionType,
    title
});

export const summaryMailSections = [
    makeSummaryMailSection(MailSectionType.Details, 1, "Details"),
    makeSummaryMailSection(MailSectionType.Environments, 2, "Environments"),
    makeSummaryMailSection(MailSectionType.WorkItems, 3, "Work items")
];
