import { fake } from "../common/fixtures";
import {
    Attachment,
    AuditAction,
    Build,
    BuildBadge,
    BuildController,
    BuildDefinition,
    BuildDefinitionReference,
    BuildDefinitionRevision,
    BuildDefinitionTemplate,
    BuildArtifact,
    BuildMetric,
    BuildOptionDefinition,
    BuildOptionInputType,
    BuildReportMetadata,
    BuildResourceUsage,
    BuildResult,
    BuildRetentionHistory,
    BuildRetentionSample,
    BuildSettings,
    BuildStatus,
    BuildReason,
    ControllerStatus,
    DefinitionResourceReference,
    DefinitionTriggerType,
    DefinitionType,
    DefinitionQuality,
    Folder,
    MinimalRetentionLease,
    NewRetentionLease,
    PipelineGeneralSettings,
    ProjectRetentionSetting,
    PullRequest,
    RepositoryWebhook,
    RetentionLease,
    RetentionLeaseUpdate,
    RetentionPolicy,
    RetentionSetting,
    SourceProviderAttributes,
    SourceRepository,
    SourceRepositoryItem,
    SupportedTrigger,
    SupportLevel,
    Timeline,
    TimelineRecord,
    TimelineRecordState,
    Change
} from "azure-devops-extension-api/Build";
import { PagedList, ResourceRef } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef, makeProjectReference } from "../core/Data";

export const makeBuildDefinition = (): BuildDefinition => ({
    id: fake.number.id(),
    name: fake.lorem.slug(),
    path: "\\",
    revision: fake.number.int({ min: 1, max: 50 }),
    type: DefinitionType.Build,
    queueStatus: 0,
    uri: fake.internet.url(),
    url: fake.internet.url(),
    project: makeProjectReference() as any,
    quality: DefinitionQuality.Definition,
    authoredBy: makeIdentityRef(),
    queue: {
        id: fake.number.id(),
        name: "Azure Pipelines",
        url: fake.internet.url(),
        pool: { id: fake.number.id(), name: "Azure Pipelines", isHosted: true }
    },
    process: { type: 2, yamlFilename: "azure-pipelines.yml" } as any,
    repository: {
        id: fake.string.uuid(),
        type: "TfsGit",
        name: fake.lorem.slug(),
        url: fake.internet.url(),
        defaultBranch: "refs/heads/main"
    } as any,
    createdDate: fake.date.recent(),
    _links: {} as any
} as unknown as BuildDefinition);

export const makeBuild = (): Build => ({
    id: fake.number.id(),
    buildNumber: `${fake.date.recent().getFullYear()}.${fake.number.int({ min: 1, max: 999 })}`,
    status: BuildStatus.Completed,
    result: BuildResult.Succeeded,
    reason: BuildReason.Manual,
    queueTime: fake.date.recent(),
    startTime: fake.date.recent(),
    finishTime: fake.date.recent(),
    sourceBranch: "refs/heads/main",
    sourceVersion: fake.git.commitSha(),
    url: fake.internet.url(),
    uri: fake.internet.url(),
    definition: makeBuildDefinition() as BuildDefinitionReference,
    project: makeProjectReference() as any,
    requestedBy: makeIdentityRef(),
    requestedFor: makeIdentityRef(),
    lastChangedBy: makeIdentityRef(),
    lastChangedDate: fake.date.recent(),
    logs: {
        id: fake.number.id(),
        type: "Container",
        url: fake.internet.url()
    } as any,
    repository: {
        id: fake.string.uuid(),
        type: "TfsGit"
    } as any,
    _links: {} as any
} as unknown as Build);

export const makeArtifact = (name = "drop"): BuildArtifact => ({
    id: fake.number.id(),
    name,
    source: fake.string.uuid(),
    resource: {
        type: "Container",
        data: `#/${fake.number.int()}/${name}`,
        properties: {},
        url: fake.internet.url(),
        downloadUrl: fake.internet.url()
    } as any
} as unknown as BuildArtifact);

export const makeTimelineRecord = (): TimelineRecord => ({
    id: fake.string.uuid(),
    parentId: fake.string.uuid(),
    type: "Task",
    name: fake.lorem.slug(),
    startTime: fake.date.recent(),
    finishTime: fake.date.recent(),
    state: 2 as any,
    result: 0 as any,
    workerName: fake.lorem.slug(),
    order: fake.number.int(),
    log: { id: fake.number.id(), type: "Container", url: fake.internet.url() } as any,
    changeId: fake.number.int(),
    url: fake.internet.url()
} as unknown as TimelineRecord);

export const makeTimeline = (): Timeline => ({
    id: fake.string.uuid(),
    changeId: fake.number.int(),
    lastChangedBy: fake.string.uuid(),
    lastChangedOn: fake.date.recent(),
    records: Array.from({ length: 3 }, makeTimelineRecord),
    url: fake.internet.url()
} as unknown as Timeline);

export const makeChange = (): Change => ({
    id: fake.git.commitSha(),
    message: fake.git.commitMessage(),
    type: "TfsGit",
    author: makeIdentityRef(),
    timestamp: fake.date.recent(),
    location: fake.internet.url()
} as unknown as Change);

export const makeBuildBadge = (): BuildBadge => ({
    buildId: fake.number.int({ min: 1, max: 100_000 }),
    imageUrl: fake.internet.url()
});

export const makeBuildController = (): BuildController => ({
    id: fake.number.id(),
    name: fake.lorem.slug(),
    url: fake.internet.url(),
    uri: fake.internet.url(),
    description: fake.lorem.sentence(),
    enabled: true,
    status: ControllerStatus.Available,
    createdDate: fake.date.recent(),
    updatedDate: fake.date.recent(),
    _links: {}
});

export const buildDefinitions = Array.from({ length: 5 }, makeBuildDefinition);
const builds = Array.from({ length: 10 }, makeBuild);
export const buildList = builds;
export const buildsPage: PagedList<Build> = Object.assign(builds, { continuationToken: "" }) as PagedList<Build>;
export const artifacts: BuildArtifact[] = [makeArtifact("drop"), makeArtifact("symbols")];
export const timeline: Timeline = makeTimeline();
export const changes: Change[] = Array.from({ length: 3 }, makeChange);
export const buildControllers: BuildController[] = Array.from({ length: 3 }, makeBuildController);
export const buildTags: string[] = Array.from({ length: 4 }, (_unused, index) => `${fake.lorem.word()}-build-${index}`);
export const definitionTags: string[] = Array.from({ length: 3 }, (_unused, index) => `${fake.lorem.word()}-def-${index}`);
export const projectTags: string[] = [...buildTags, ...definitionTags];

export const makeFolder = (path: string): Folder => ({
    path,
    description: fake.lorem.sentence(),
    createdBy: makeIdentityRef(),
    createdOn: fake.date.recent(),
    lastChangedBy: makeIdentityRef(),
    lastChangedDate: fake.date.recent(),
    project: makeProjectReference()
});

export const makeBuildDefinitionTemplate = (
    id: string,
    category: string
): BuildDefinitionTemplate => ({
    id,
    category,
    name: fake.lorem.slug(),
    description: fake.lorem.sentence(),
    canDelete: true,
    defaultHostedQueue: "Azure Pipelines",
    icons: { medium: fake.image.url() },
    iconTaskId: fake.string.uuid(),
    template: makeBuildDefinition()
});

export const makeBuildMetric = (name: string, scope: string, date: Date): BuildMetric => ({
    name,
    scope,
    date,
    intValue: fake.number.int({ min: 1, max: 500 })
});

export const makeBuildDefinitionRevision = (
    revision: number,
    changeType: AuditAction
): BuildDefinitionRevision => ({
    revision,
    changeType,
    name: fake.lorem.slug(),
    comment: fake.lorem.sentence(),
    changedBy: makeIdentityRef(),
    changedDate: fake.date.recent(),
    definitionUrl: fake.internet.url()
});

export const makeDefinitionResourceReference = (
    id: string,
    type: string
): DefinitionResourceReference => ({
    id,
    type,
    name: fake.lorem.slug(),
    authorized: true
});

export const makeBuildResourceUsage = (): BuildResourceUsage => ({
    distributedTaskAgents: fake.number.int({ min: 1, max: 50 }),
    paidPrivateAgentSlots: fake.number.int({ min: 0, max: 10 }),
    totalUsage: fake.number.int({ min: 1, max: 100 }),
    xamlControllers: fake.number.int({ min: 0, max: 5 })
});

export const folders: Folder[] = [
    makeFolder("\\"),
    makeFolder("\\shared"),
    makeFolder("\\shared\\nightly"),
    makeFolder("\\legacy")
];

export const definitionTemplates: BuildDefinitionTemplate[] = [
    makeBuildDefinitionTemplate("template-classic", "Build"),
    makeBuildDefinitionTemplate("template-yaml", "Build"),
    makeBuildDefinitionTemplate("template-empty", "Deploy")
];

export const buildMetrics: BuildMetric[] = [
    makeBuildMetric("TotalBuilds", "Daily", new Date("2024-01-01T00:00:00.000Z")),
    makeBuildMetric("SuccessfulBuilds", "Daily", new Date("2024-06-01T00:00:00.000Z")),
    makeBuildMetric("FailedBuilds", "Hourly", new Date("2024-12-01T00:00:00.000Z"))
];

export const definitionRevisions: BuildDefinitionRevision[] = [
    makeBuildDefinitionRevision(1, AuditAction.Add),
    makeBuildDefinitionRevision(2, AuditAction.Update),
    makeBuildDefinitionRevision(3, AuditAction.Delete)
];

export const definitionResources: DefinitionResourceReference[] = [
    makeDefinitionResourceReference("endpoint-1", "endpoint"),
    makeDefinitionResourceReference("queue-1", "queue"),
    makeDefinitionResourceReference("variablegroup-1", "variablegroup")
];

export const resourceUsage: BuildResourceUsage = makeBuildResourceUsage();

export const definitionProperties: Record<string, unknown> = {
    owner: fake.person.fullName(),
    stage: "canary",
    retentionDays: 30
};

export const makeAttachment = (name: string): Attachment => ({
    name,
    _links: { self: { href: fake.internet.url() } }
});

export const attachmentType = "logs";

export const attachments: Attachment[] = [
    makeAttachment("build.log"),
    makeAttachment("coverage.xml")
];

export const buildLogLines: string[] = [
    "Starting: Checkout",
    "Checking out refs/heads/main",
    "Finishing: Checkout",
    "Starting: Build",
    "npm ci",
    "Finishing: Build"
];

export const buildProperties: Record<string, unknown> = {
    owner: fake.person.fullName(),
    channel: "nightly",
    attempts: 2
};

export const makeBuildReportMetadata = (buildId: number, type: string): BuildReportMetadata => ({
    buildId,
    type,
    content: `<html><body><h1>${type} report ${buildId}</h1></body></html>`
});

export const buildReports: BuildReportMetadata[] = [
    makeBuildReportMetadata(4242, "codecoverage"),
    makeBuildReportMetadata(4343, "testresults")
];

export const makeStageTimeline = (id: string, stageName: string): Timeline => ({
    id,
    changeId: fake.number.int({ min: 1, max: 500 }),
    lastChangedBy: fake.string.uuid(),
    lastChangedOn: fake.date.recent(),
    url: fake.internet.url(),
    records: [
        {
            ...makeTimelineRecord(),
            type: "Stage",
            name: stageName,
            state: TimelineRecordState.Completed
        }
    ]
} as unknown as Timeline);

export const stageTimelines: Timeline[] = [
    makeStageTimeline("timeline-build", "Build"),
    makeStageTimeline("timeline-deploy", "Deploy")
];

export const makeBuildOptionDefinition = (
    id: string,
    name: string
): BuildOptionDefinition => ({
    id,
    name,
    description: fake.lorem.sentence(),
    ordinal: fake.number.int({ min: 1, max: 10 }),
    groups: [
        {
            name: fake.lorem.slug(),
            displayName: fake.lorem.words(),
            isExpanded: true
        }
    ],
    inputs: [
        {
            name: fake.lorem.slug(),
            label: fake.lorem.words(),
            defaultValue: "",
            groupName: fake.lorem.slug(),
            help: {},
            options: {},
            required: false,
            type: BuildOptionInputType.String,
            visibleRule: ""
        }
    ]
});

export const optionDefinitions: BuildOptionDefinition[] = [
    makeBuildOptionDefinition("option-autolink", "AutoLinkWorkItems"),
    makeBuildOptionDefinition("option-gates", "ReleaseGates")
];

export const makePipelineGeneralSettings = (): PipelineGeneralSettings => ({
    auditEnforceSettableVar: true,
    buildsEnabledForForks: true,
    disableClassicBuildPipelineCreation: false,
    disableClassicPipelineCreation: false,
    disableClassicReleasePipelineCreation: false,
    disableImpliedYAMLCiTrigger: true,
    enableShellTasksArgsSanitizing: true,
    enableShellTasksArgsSanitizingAudit: false,
    enforceJobAuthScope: true,
    enforceJobAuthScopeForForks: true,
    enforceJobAuthScopeForReleases: true,
    enforceNoAccessToSecretsFromForks: true,
    enforceReferencedGitHubRepoScopedToken: false,
    enforceReferencedRepoScopedToken: false,
    enforceSettableVar: true,
    forkProtectionEnabled: true,
    isCommentRequiredForPullRequest: false,
    publishPipelineMetadata: false,
    requireCommentsForNonTeamMemberAndNonContributors: false,
    requireCommentsForNonTeamMembersOnly: false,
    statusBadgesArePrivate: true
});

export const generalSettings: PipelineGeneralSettings = makePipelineGeneralSettings();

export const makeRetentionPolicy = (daysToKeep: number, minimumToKeep: number): RetentionPolicy => ({
    daysToKeep,
    minimumToKeep,
    artifacts: ["drop"],
    artifactTypesToDelete: ["FilePath", "SymbolStore"],
    branches: ["+refs/heads/main"],
    deleteBuildRecord: true,
    deleteTestResults: true
});

export const makeBuildSettings = (): BuildSettings => ({
    daysToKeepDeletedBuildsBeforeDestroy: 30,
    defaultRetentionPolicy: makeRetentionPolicy(10, 1),
    maximumRetentionPolicy: makeRetentionPolicy(365, 10)
});

export const buildSettings: BuildSettings = makeBuildSettings();

export const makeSourceRepositoryItem = (
    path: string,
    isContainer: boolean
): SourceRepositoryItem => ({
    path,
    isContainer,
    type: isContainer ? "tree" : "blob",
    url: fake.internet.url()
});

export const sourceRepositoryItems: SourceRepositoryItem[] = [
    makeSourceRepositoryItem("/", true),
    makeSourceRepositoryItem("/src", true),
    makeSourceRepositoryItem("/src/index.ts", false),
    makeSourceRepositoryItem("/docs", true)
];

const LEASE_DAY_MS = 86_400_000;

export const makeRetentionLease = (
    leaseId: number,
    ownerId: string,
    definitionId: number,
    runId: number
): RetentionLease => ({
    leaseId,
    ownerId,
    definitionId,
    runId,
    protectPipeline: fake.datatype.boolean(),
    createdOn: fake.date.recent(),
    validUntil: fake.date.future()
});

export const makeLeaseFromNew = (newLease: NewRetentionLease): RetentionLease => {
    const createdOn = fake.date.recent();
    return {
        leaseId: fake.number.int({ min: 1, max: 100_000 }),
        ownerId: newLease.ownerId,
        definitionId: newLease.definitionId,
        runId: newLease.runId,
        protectPipeline: newLease.protectPipeline,
        createdOn,
        validUntil: new Date(createdOn.getTime() + newLease.daysValid * LEASE_DAY_MS)
    };
};

export const makeUpdatedLease = (
    leaseId: number,
    update: RetentionLeaseUpdate
): RetentionLease => {
    const createdOn = fake.date.recent();
    return {
        leaseId,
        ownerId: `owner-${fake.lorem.slug()}`,
        definitionId: fake.number.int({ min: 1, max: 10_000 }),
        runId: fake.number.int({ min: 1, max: 100_000 }),
        protectPipeline: update.protectPipeline,
        createdOn,
        validUntil: new Date(createdOn.getTime() + update.daysValid * LEASE_DAY_MS)
    };
};

export const makeMinimalRetentionLease = (
    ownerId: string,
    definitionId: number,
    runId: number
): MinimalRetentionLease => ({ ownerId, definitionId, runId });

export const retentionLeases: RetentionLease[] = [
    makeRetentionLease(9_000_001, "owner-alpha", 9_100_001, 9_200_001),
    makeRetentionLease(9_000_002, "owner-alpha", 9_100_002, 9_200_002),
    makeRetentionLease(9_000_003, "owner-beta", 9_100_001, 9_200_001),
    makeRetentionLease(9_000_004, "owner-gamma", 9_100_003, 9_200_003)
];

export const makeBuildRetentionSample = (daysAgo: number): BuildRetentionSample => ({
    sampleTime: new Date(Date.now() - daysAgo * LEASE_DAY_MS),
    builds: `${fake.number.int({ min: 1, max: 500 })} builds retained`,
    definitions: `${fake.number.int({ min: 1, max: 50 })} definitions`,
    files: `${fake.number.int({ min: 1, max: 5_000 })} files`
});

export const retentionSampleDaysAgo: number[] = [1, 15, 60];

export const retentionHistory: BuildRetentionHistory = {
    buildRetentionSamples: retentionSampleDaysAgo.map(makeBuildRetentionSample)
};

export const makeRetentionSetting = (
    min: number,
    max: number,
    value: number
): RetentionSetting => ({ min, max, value });

export const projectRetentionSetting: ProjectRetentionSetting = {
    purgeArtifacts: makeRetentionSetting(1, 60, 30),
    purgePullRequestRuns: makeRetentionSetting(1, 30, 10),
    purgeRuns: makeRetentionSetting(30, 730, 365),
    retainRunsPerProtectedBranch: makeRetentionSetting(0, 50, 3)
};

export const makeWorkItemRef = (id: string): ResourceRef => ({
    id,
    url: `${fake.internet.url()}/_apis/wit/workItems/${id}`
});

export const buildWorkItemRefs: ResourceRef[] = [
    makeWorkItemRef("9300001"),
    makeWorkItemRef("9300002"),
    makeWorkItemRef("9300003"),
    makeWorkItemRef("9300004")
];

export const makePullRequest = (id: string, providerName: string): PullRequest => ({
    id,
    providerName,
    title: fake.lorem.sentence(),
    description: fake.lorem.sentence(),
    currentState: fake.helpers.arrayElement(["open", "merged", "closed"]),
    draft: fake.datatype.boolean(),
    author: makeIdentityRef(),
    sourceBranchRef: "refs/heads/feature",
    sourceRepositoryOwner: fake.internet.username(),
    targetBranchRef: "refs/heads/main",
    targetRepositoryOwner: fake.internet.username(),
    _links: {}
});

export const pullRequests: PullRequest[] = [
    makePullRequest("pr-9401", "TfsGit"),
    makePullRequest("pr-9402", "GitHub")
];

export const sourceBranches: string[] = [
    "refs/heads/main",
    "refs/heads/release",
    "refs/heads/feature"
];

export const makeSourceRepository = (
    id: string,
    name: string,
    sourceProviderName: string
): SourceRepository => ({
    id,
    name,
    sourceProviderName,
    fullName: `${fake.internet.username()}/${name}`,
    defaultBranch: "refs/heads/main",
    url: fake.internet.url(),
    properties: { visibility: "private" }
});

export const sourceRepositories: SourceRepository[] = [
    makeSourceRepository("repo-9501", "checkout", "TfsGit"),
    makeSourceRepository("repo-9502", "billing", "TfsGit"),
    makeSourceRepository("repo-9503", "website", "GitHub")
];

export const makeSupportedTrigger = (type: DefinitionTriggerType): SupportedTrigger => ({
    type,
    notificationType: "Webhook",
    defaultPollingInterval: fake.number.int({ min: 60, max: 300 }),
    supportedCapabilities: {
        branchFilters: SupportLevel.Supported,
        pathFilters: SupportLevel.Required
    }
});

export const makeSourceProviderAttributes = (name: string): SourceProviderAttributes => ({
    name,
    supportedCapabilities: { queryFileContents: true, createLabel: false },
    supportedTriggers: [
        makeSupportedTrigger(DefinitionTriggerType.ContinuousIntegration),
        makeSupportedTrigger(DefinitionTriggerType.PullRequest)
    ]
});

export const sourceProviders: SourceProviderAttributes[] = [
    makeSourceProviderAttributes("TfsGit"),
    makeSourceProviderAttributes("GitHub"),
    makeSourceProviderAttributes("Bitbucket")
];

export const makeRepositoryWebhook = (name: string): RepositoryWebhook => ({
    name,
    lastDeliveryStatus: fake.number.int({ min: 200, max: 204 }),
    types: [DefinitionTriggerType.ContinuousIntegration, DefinitionTriggerType.PullRequest],
    url: fake.internet.url()
});

export const repositoryWebhooks: RepositoryWebhook[] = [
    makeRepositoryWebhook("checkout"),
    makeRepositoryWebhook("billing"),
    makeRepositoryWebhook("website")
];
