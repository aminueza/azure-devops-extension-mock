import { fake } from "../common/fixtures";
import {
    Alert,
    AlertAnalysisInstance,
    AlertMetadata,
    AlertType,
    AlertValidationRequestStatus,
    AlertValidityInfo,
    AlertValidityStatus,
    AnalysisConfiguration,
    AnalysisConfigurationType,
    AnalysisInstance,
    AnalysisResult,
    AutofixRequest,
    AutofixRequestStatus,
    Branch,
    ComponentType,
    Confidence,
    Dependency,
    DependencyKind,
    Dismissal,
    DismissalType,
    LegalReview,
    License,
    LicenseState,
    LicenseType,
    MetadataOperation,
    PhysicalLocation,
    Pipeline,
    RelationMetadata,
    ResultType,
    Rule,
    SarifJobStatus,
    SarifUploadStatus,
    Severity,
    State,
    Tool,
    UxFilters,
    ValidationFingerprint,
    ValidationRequestInfo,
    ValidationResult
} from "azure-devops-extension-api/Alert";
import { makeIdentityRef } from "../core/Data";
import { advSecProjectIds, repositories } from "../git/Data";

export interface AlertJobArtifact {
    type: number;
    url: string;
}

export interface AlertJob {
    alertIds: number[];
    artifacts: AlertJobArtifact[];
    branchRef: string;
    createdBy: string;
    createdDate: Date;
    jobId: string;
    jobState: string;
    jobType: number;
    lastUpdatedBy: string;
    lastUpdatedDate: Date;
    properties: any;
    provider: string;
    revision: number;
}

export const SECRET_PLACEHOLDER = "***";
export const DRAFT_STATE = 16;
export const DEFAULT_BRANCH = "refs/heads/main";
export const DEPENDENCY_TOOL = "Advanced Security Dependency Scanning";
export const SECRET_TOOL = "Advanced Security Secrets Scanning";
export const CODE_TOOL = "CodeQL";

export const makeBuffer = (text: string): ArrayBuffer => {
    const encoded = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(buffer).set(encoded);
    return buffer;
};

export const makeRule = (): Rule => ({
    additionalProperties: {},
    description: fake.lorem.sentence(),
    friendlyName: fake.lorem.words(3),
    helpMessage: fake.lorem.paragraph(),
    opaqueId: `rule/${fake.lorem.slug(2)}-${fake.number.id()}`,
    resources: fake.internet.url(),
    tags: ["security"]
});

export const makeTool = (name: string = CODE_TOOL, toolRules: Rule[] = [makeRule()]): Tool => ({
    isDeterministic: true,
    name,
    rules: toolRules,
    toolVersion: fake.system.semver()
});

export const makeLicense = (): License => ({
    name: "MIT",
    state: LicenseState.Harvested,
    type: LicenseType.Permissive,
    url: "https://opensource.org/license/mit"
});

export const makeDependency = (): Dependency => ({
    componentName: fake.lorem.slug(2),
    componentType: ComponentType.Npm,
    componentVersion: fake.system.semver(),
    dependencyId: fake.number.id(),
    license: makeLicense()
});

export const makePipeline = (): Pipeline => ({
    adoPipelineId: fake.number.id(),
    name: fake.lorem.slug(2),
    phase: "Build",
    phaseId: fake.string.uuid(),
    properties: {}
});

export const makeBranch = (name: string = `refs/heads/${fake.git.branch()}`): Branch => ({
    branchId: fake.number.id(),
    deletedDate: fake.helpers.absent(),
    name
});

export const makeRelationMetadata = (rel = "WorkItem"): RelationMetadata => ({
    attributes: {},
    properties: {},
    rel,
    url: `vstfs:///${rel}/${rel}/${fake.number.id()}`
});

export const makePhysicalLocation = (): PhysicalLocation => ({
    additionalProperties: {},
    filePath: `/src/${fake.system.fileName()}`,
    isValidGitPath: true,
    region: { columnEnd: 40, columnStart: 1, lineEnd: 12, lineStart: 12 },
    versionControl: { commitHash: fake.git.commitSha(), itemUrl: fake.internet.url() }
});

export const makeDismissal = (): Dismissal => ({
    dismissalId: fake.number.id(),
    dismissalType: DismissalType.AcceptedRisk,
    message: fake.lorem.sentence(),
    requestedOn: fake.date.recent(),
    stateChangedBy: fake.string.uuid(),
    stateChangedByIdentity: makeIdentityRef()
});

export const makeValidityInfo = (): AlertValidityInfo => ({
    isDynamicAnalysisSupported: true,
    validityLastCheckedDate: fake.date.recent(),
    validityStatus: AlertValidityStatus.Active
});

export const makeValidationFingerprint = (): ValidationFingerprint => ({
    assetFingerprint: { account: fake.lorem.slug(2) },
    c3Id: fake.string.uuid(),
    normalizedValidationToolVersion: 1,
    validationFingerprintHash: fake.git.commitSha(),
    validationFingerprintJson: SECRET_PLACEHOLDER,
    validityLastUpdatedDate: fake.date.recent(),
    validityResult: ValidationResult.Exploitable
});

export const makeAlert = (alertType: AlertType = AlertType.Code, tool: Tool = makeTool()): Alert => ({
    additionalInformationMessage: "",
    additionalProperties: {},
    aiMetadataBlobReference: fake.helpers.absent(),
    alertId: fake.number.id(),
    alertType,
    confidence: Confidence.High,
    dismissal: fake.helpers.absent(),
    firstSeenDate: fake.date.past(),
    fixedDate: fake.helpers.absent(),
    gitRef: DEFAULT_BRANCH,
    hasTrustedSourceOrigin: true,
    introducedDate: fake.date.past(),
    isAutoFixable: false,
    isDevDependency: fake.helpers.absent(),
    lastSeenDate: fake.date.recent(),
    logicalLocations: [],
    physicalLocations: [makePhysicalLocation()],
    projectId: advSecProjectIds[0],
    relations: [],
    repositoryId: repositories[0].id,
    repositoryUrl: fake.internet.url(),
    severity: Severity.High,
    state: State.Active,
    title: fake.lorem.sentence(4),
    tools: [tool],
    truncatedSecret: fake.helpers.absent(),
    validationFingerprints: [],
    validityDetails: fake.helpers.absent()
});

export const makeDependencyAlert = (tool: Tool = makeTool(DEPENDENCY_TOOL)): Alert => {
    const dependency = makeDependency();
    return {
        ...makeAlert(AlertType.Dependency, tool),
        isDevDependency: false,
        logicalLocations: [
            {
                fullyQualifiedName: `${dependency.componentName} ${dependency.componentVersion}`,
                kind: DependencyKind.VulnerableDependency,
                license: dependency.license
            }
        ],
        severity: Severity.Critical
    };
};

export const makeSecretAlert = (tool: Tool = makeTool(SECRET_TOOL)): Alert => ({
    ...makeAlert(AlertType.Secret, tool),
    severity: Severity.Critical,
    truncatedSecret: SECRET_PLACEHOLDER,
    validationFingerprints: [makeValidationFingerprint()],
    validityDetails: makeValidityInfo()
});

export const makeCodeAlert = (tool: Tool = makeTool(CODE_TOOL)): Alert => ({
    ...makeAlert(AlertType.Code, tool),
    isAutoFixable: true,
    severity: Severity.Error
});

export const makeAnalysisConfiguration = (alertType: AlertType = AlertType.Code): AnalysisConfiguration => ({
    alertType,
    analysisConfigurationDetails: {
        additionalProperties: {},
        gitRef: DEFAULT_BRANCH,
        isDefaultBranch: true,
        phaseId: fake.string.uuid(),
        phaseName: "Build",
        pipelineId: fake.number.id(),
        pipelineName: fake.lorem.slug(2)
    },
    analysisConfigurationId: fake.number.id(),
    analysisConfigurationType: AnalysisConfigurationType.AdoPipeline,
    toolName: CODE_TOOL,
    toolVersion: fake.system.semver()
});

export const makeAnalysisResult = (state: State = State.Active): AnalysisResult => {
    const resultId = fake.number.id();
    const filePathId = fake.number.id();
    const instanceId = fake.number.id();
    return {
        analysisResultId: fake.number.id(),
        firstIntroducedInstanceId: instanceId,
        fixedInstanceId: fake.helpers.absent(),
        introducedInstanceId: instanceId,
        lastSeenInstanceId: fake.number.id(),
        result: {
            dependencyResult: fake.helpers.absent(),
            fingerprint: fake.git.commitSha(),
            fingerprintId: fake.number.id(),
            resultId,
            resultIndex: 0,
            resultMessage: fake.lorem.sentence(),
            resultType: ResultType.VersionControl,
            ruleId: fake.number.id(),
            ruleShortDescription: fake.lorem.words(4),
            severity: Severity.Error,
            versionControlResult: {
                resultId,
                versionControlSnippet: {
                    endColumn: 40,
                    endLine: 12,
                    startColumn: 1,
                    startLine: 12,
                    versionControlFilePath: {
                        filePath: `/src/${fake.system.fileName()}`,
                        filePathHash: [1, 2, 3, 4],
                        versionControlFilePathId: filePathId
                    },
                    versionControlFilePathId: filePathId,
                    versionControlSnippetId: fake.number.id()
                }
            }
        },
        state
    };
};

export const makeAnalysisInstance = (
    configuration: AnalysisConfiguration = makeAnalysisConfiguration()
): AnalysisInstance => ({
    commitId: fake.git.commitSha(),
    configuration,
    createdDate: fake.date.recent({ days: 5 }),
    instanceIdentifier: fake.string.uuid(),
    results: [makeAnalysisResult()],
    url: fake.internet.url()
});

export const makeAlertAnalysisInstance = (
    configuration: AnalysisConfiguration = makeAnalysisConfiguration()
): AlertAnalysisInstance => {
    const lastSeen = makeAnalysisInstance(configuration);
    return {
        analysisConfiguration: configuration,
        firstSeen: makeAnalysisInstance(configuration),
        fixedIn: fake.helpers.absent(),
        lastSeen,
        recentAnalysisInstance: lastSeen,
        state: State.Active
    };
};

export const makeAutofixRequest = (): AutofixRequest => ({
    createdDate: fake.date.recent(),
    failedReason: 0,
    pipelinePlanId: fake.string.uuid(),
    pullRequestId: fake.helpers.absent(),
    requestId: fake.number.id(),
    status: AutofixRequestStatus.Pending
});

export const makeAlertJob = (alertIds: number[] = []): AlertJob => ({
    alertIds,
    artifacts: [{ type: 1, url: fake.internet.url() }],
    branchRef: DEFAULT_BRANCH,
    createdBy: fake.string.uuid(),
    createdDate: fake.date.recent({ days: 3 }),
    jobId: fake.string.uuid(),
    jobState: "completed",
    jobType: 1,
    lastUpdatedBy: fake.string.uuid(),
    lastUpdatedDate: fake.date.recent(),
    properties: {},
    provider: "copilot",
    revision: 1
});

export const makeLegalReview = (): LegalReview => {
    const id = fake.number.id();
    return { id, state: "Active", webUrl: `${fake.internet.url()}/_workitems/edit/${id}` };
};

export const makeAlertMetadata = (
    alertId: number = fake.number.id(),
    relations: RelationMetadata[] = [makeRelationMetadata()]
): AlertMetadata => ({
    alertId,
    metadata: relations.map(value => ({ op: MetadataOperation.Add, value }))
});

export const makeSarifUploadStatus = (
    processingStatus: SarifJobStatus = SarifJobStatus.Completed
): SarifUploadStatus => ({
    errors: [],
    processingStatus
});

export const makeValidationRequestInfo = (validity: AlertValidityInfo = makeValidityInfo()): ValidationRequestInfo => ({
    ...validity,
    alertValidationRequestStatus: AlertValidationRequestStatus.Completed
});

export const makeSarif = (sarifAlerts: Alert[]): string =>
    JSON.stringify({
        $schema: "https://json.schemastore.org/sarif-2.1.0.json",
        version: "2.1.0",
        runs: [
            {
                tool: { driver: { name: CODE_TOOL } },
                results: sarifAlerts.map(alert => ({
                    ruleId: alert.tools[0].rules[0].opaqueId,
                    message: { text: alert.title },
                    properties: { alertId: alert.alertId }
                }))
            }
        ]
    });

export const rules: Rule[] = fake.helpers.distinct(4, makeRule, r => r.opaqueId);

export const tools: Tool[] = [
    makeTool(DEPENDENCY_TOOL, [rules[0]]),
    makeTool(SECRET_TOOL, [rules[1]]),
    makeTool(CODE_TOOL, [rules[2], rules[3]])
];

export const branches: Branch[] = [
    makeBranch(DEFAULT_BRANCH),
    makeBranch("refs/heads/develop"),
    makeBranch("refs/heads/release/1.0"),
    makeBranch("refs/pull/12/merge")
];

export const alerts: Alert[] = [
    makeDependencyAlert(tools[0]),
    {
        ...makeDependencyAlert(tools[0]),
        dismissal: makeDismissal(),
        isDevDependency: true,
        severity: Severity.Medium,
        state: State.Dismissed
    },
    makeSecretAlert(tools[1]),
    { ...makeCodeAlert(tools[2]), relations: [makeRelationMetadata("WorkItem")] },
    { ...makeCodeAlert(tools[2]), fixedDate: fake.date.recent(), severity: Severity.Warning, state: State.Fixed }
];

export const draftAlerts: Alert[] = [
    { ...makeCodeAlert(tools[2]), state: DRAFT_STATE },
    { ...makeCodeAlert(tools[2]), severity: Severity.Warning, state: DRAFT_STATE }
];

export const alertInstances: AlertAnalysisInstance[] = [
    makeAlertAnalysisInstance(),
    makeAlertAnalysisInstance(makeAnalysisConfiguration(AlertType.Dependency))
];

export const autofixRequests: AutofixRequest[] = [
    { ...makeAutofixRequest(), pullRequestId: fake.number.id(), status: AutofixRequestStatus.Done },
    makeAutofixRequest()
];

export const jobs: AlertJob[] = [
    makeAlertJob([alerts[3].alertId]),
    { ...makeAlertJob([alerts[3].alertId, alerts[4].alertId]), jobState: "running", artifacts: [] },
    makeAlertJob([alerts[4].alertId])
];

export const alertsMetadata: AlertMetadata[] = alerts.map(alert => makeAlertMetadata(alert.alertId, alert.relations));

export const sarifUploadStatus: SarifUploadStatus = makeSarifUploadStatus();

export const uxFilters: UxFilters = {
    branches,
    confidenceLevels: [Confidence.High, Confidence.Other],
    licenses: [makeLicense()],
    packages: [makeDependency(), makeDependency()],
    pipelines: [makePipeline()],
    progressPercentage: 100,
    rules,
    secretTypes: ["Azure DevOps personal access token", "Azure Storage account access key"],
    severities: [Severity.Low, Severity.Medium, Severity.High, Severity.Critical],
    states: [State.Active, State.Dismissed, State.Fixed],
    tools,
    validity: [AlertValidityStatus.Active, AlertValidityStatus.Inactive, AlertValidityStatus.Unknown]
};
