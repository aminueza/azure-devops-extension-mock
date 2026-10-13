import { fake } from "../common/fixtures";
import {
    AdvancedFlakyDetectionMode,
    AdvancedFlakyDetectionParameterType,
    AggregatedResultsDifference,
    AttachmentType,
    BuildReference,
    FlakyDetectionType,
    FlakyTestBugMetadata,
    FolderCoverageData,
    PipelineReference,
    PipelineTestMetrics,
    ReleaseReference,
    SessionResult,
    SourceViewBuildCoverage,
    TestAttachment,
    TestCaseFlakinessBranchInfo,
    TestLog,
    TestLogReference,
    TestLogScope,
    TestLogStatusCode,
    TestLogStoreAttachment,
    TestLogStoreAttachmentReference,
    TestLogStoreEndpointDetails,
    TestLogStoreEndpointType,
    TestLogType,
    TestOutcome,
    TestResultFailureType,
    TestResultFailuresAnalysis,
    TestResultMachine,
    TestResultsContext,
    TestResultsContextType,
    TestResultsSession,
    TestResultsSessionState,
    TestResultsSettings,
    TestRunOutcome,
    TestRunState,
    TestSessionNotification,
    TestTag,
    TestTagSummary,
    Timeline
} from "azure-devops-extension-api/Test";
import { makeAttachment, makeBuildConfiguration, makeCoverageStatistics } from "../test/Data";

export const makeBuildReference = (): BuildReference => ({
    branchName: fake.git.branch(),
    buildSystem: "Azure Pipelines",
    definitionId: fake.number.int({ min: 1, max: 1_000 }),
    id: fake.number.id(),
    number: fake.system.semver(),
    repositoryId: fake.string.uuid(),
    uri: fake.internet.url()
});

export const makeReleaseReference = (): ReleaseReference => ({
    attempt: 1,
    creationDate: fake.date.recent(),
    definitionId: fake.number.int({ min: 1, max: 1_000 }),
    environmentCreationDate: fake.date.recent(),
    environmentDefinitionId: fake.number.int({ min: 1, max: 1_000 }),
    environmentDefinitionName: fake.lorem.word(),
    environmentId: fake.number.id(),
    environmentName: fake.lorem.word(),
    id: fake.number.id(),
    name: `Release-${fake.number.int({ min: 1, max: 500 })}`
});

export const makePipelineReference = (): PipelineReference => ({
    jobReference: { attempt: 1, jobName: fake.lorem.word() },
    phaseReference: { attempt: 1, phaseName: fake.lorem.word() },
    pipelineDefinitionId: fake.number.int({ min: 1, max: 1_000 }),
    pipelineId: fake.number.id(),
    stageReference: { attempt: 1, stageName: fake.lorem.word() }
});

export const makeTestResultsContext = (contextType: TestResultsContextType): TestResultsContext => ({
    build: makeBuildReference(),
    contextType,
    pipelineReference: makePipelineReference(),
    release: makeReleaseReference()
});

export const makeFolderCoverageData = (): FolderCoverageData => ({
    coverageStatistics: makeCoverageStatistics(),
    files: [
        { coverageStatistics: makeCoverageStatistics(), name: fake.system.fileName() },
        { coverageStatistics: makeCoverageStatistics(), name: fake.system.fileName() }
    ],
    folders: [],
    name: fake.lorem.word()
});

export const makeSourceViewBuildCoverage = (): SourceViewBuildCoverage => ({
    configuration: makeBuildConfiguration(),
    folderCoverageData: { ...makeFolderCoverageData(), folders: [makeFolderCoverageData()] }
});

export const makeTestCaseFlakinessBranchInfo = (): TestCaseFlakinessBranchInfo => ({
    automatedTestName: fake.lorem.slug(),
    automatedTestStorage: fake.system.fileName(),
    flakyBranches: [fake.git.branch()],
    lastRefTestRunDate: fake.date.recent(),
    testCaseReferenceId: fake.number.id(),
    testCaseTitle: fake.lorem.sentence()
});

export const makeBlobStoreTestAttachment = (): TestAttachment & { dedupId: string; domainId: string } => ({
    ...makeAttachment(),
    dedupId: fake.git.commitSha(),
    domainId: fake.string.uuid()
});

export const makeTestAttachmentUploadDetails = (
    testRunId: number
): { domainId: string; isBlobStoreUploadEnabled: boolean; testRunId: number } => ({
    domainId: fake.string.uuid(),
    isBlobStoreUploadEnabled: true,
    testRunId
});

export const makeTestCaseLatestResult = (
    testCaseId: number
): {
    configurationId: number;
    dateCompleted: Date;
    dateStarted: Date;
    outcome: string;
    resultId: number;
    runId: number;
    testCaseId: number;
    testPointId: number;
} => ({
    configurationId: fake.number.int({ min: 1, max: 100 }),
    dateCompleted: fake.date.recent(),
    dateStarted: fake.date.recent(),
    outcome: fake.helpers.arrayElement(["Passed", "Failed", "NotExecuted", "Blocked"]),
    resultId: fake.number.id(),
    runId: fake.number.id(),
    testCaseId,
    testPointId: fake.number.id()
});

export const makeAggregatedResultsDifference = (): AggregatedResultsDifference => ({
    increaseInDuration: `PT${fake.number.int({ min: 1, max: 60 })}S`,
    increaseInFailures: fake.number.int({ min: 0, max: 10 }),
    increaseInNonImpactedTests: fake.number.int({ min: 0, max: 10 }),
    increaseInOtherTests: fake.number.int({ min: 0, max: 10 }),
    increaseInPassedTests: fake.number.int({ min: 0, max: 20 }),
    increaseInTotalTests: fake.number.int({ min: 0, max: 20 })
});

export const makeTestResultFailuresAnalysis = (): TestResultFailuresAnalysis => ({
    existingFailures: { count: fake.number.int({ min: 0, max: 5 }), testResults: [] },
    fixedTests: { count: fake.number.int({ min: 0, max: 5 }), testResults: [] },
    newFailures: { count: fake.number.int({ min: 0, max: 5 }), testResults: [] }
});

export const makePipelineTestMetrics = (): PipelineTestMetrics => ({
    currentContext: makePipelineReference(),
    resultsAnalysis: {
        previousContext: makePipelineReference(),
        resultsDifference: makeAggregatedResultsDifference(),
        testFailuresAnalysis: makeTestResultFailuresAnalysis()
    },
    resultSummary: {
        resultSummaryByRunState: {
            [TestRunState.Completed]: {
                aggregatedResultDetailsByOutcome: {
                    [TestOutcome.Passed]: {
                        count: fake.number.int({ min: 1, max: 500 }),
                        duration: `PT${fake.number.int({ min: 1, max: 600 })}S`,
                        outcome: TestOutcome.Passed,
                        rerunResultCount: fake.number.int({ min: 0, max: 5 })
                    }
                },
                duration: `PT${fake.number.int({ min: 1, max: 600 })}S`,
                notReportedTestCount: fake.number.int({ min: 0, max: 10 }),
                totalTestCount: fake.number.int({ min: 1, max: 500 })
            }
        }
    },
    runSummary: {
        duration: `PT${fake.number.int({ min: 1, max: 600 })}S`,
        noConfigRunsCount: fake.number.int({ min: 0, max: 10 }),
        runSummaryByOutcome: { [TestRunOutcome.Passed]: fake.number.int({ min: 1, max: 20 }) },
        runSummaryByState: { [TestRunState.Completed]: fake.number.int({ min: 1, max: 20 }) },
        totalRunsCount: fake.number.int({ min: 1, max: 20 })
    },
    summaryAtChild: []
});

export const makeTestResultsSettings = (): TestResultsSettings => ({
    advancedFlakyDetectionSettings: {
        filingBugThreshold: fake.number.int({ min: 1, max: 100 }),
        flakyTestBugConfig: {
            bugMetadata: [FlakyTestBugMetadata.ErrorMessage, FlakyTestBugMetadata.TestName],
            bugPriority: fake.number.int({ min: 1, max: 4 }),
            bugTemplateId: fake.string.uuid(),
            teamId: fake.string.uuid()
        },
        markingFlakyThreshold: fake.number.int({ min: 1, max: 100 }),
        weightedScores: [
            {
                lookbackPeriod: fake.number.int({ min: 1, max: 30 }),
                parameterType: AdvancedFlakyDetectionParameterType.FailureRate,
                weight: fake.number.int({ min: 1, max: 10 })
            }
        ]
    },
    flakySettings: {
        advancedSystemDetectionMode: AdvancedFlakyDetectionMode.Disabled,
        flakyDetection: {
            flakyDetectionPipelines: { allowedPipelines: [], isAllPipelinesAllowed: true },
            flakyDetectionType: FlakyDetectionType.System
        },
        flakyInSummaryReport: true,
        isFlakyBugCreated: false,
        manualMarkUnmarkFlaky: true
    },
    newTestResultLoggingSettings: { logNewTests: true }
});

export const makeTestTag = (): TestTag => ({
    name: fake.lorem.slug(2)
});

export const makeTestTagSummary = (artifactId: number, tags: TestTag[]): TestTagSummary => ({
    tagsGroupByTestArtifact: { [artifactId]: tags }
});

export const makeTestLogStoreAttachmentReference = (fileName: string): TestLogStoreAttachmentReference => ({
    url: `${fake.internet.url()}/${fileName}`
});

export const makeTestLogStoreAttachment = (): TestLogStoreAttachment => ({
    attachmentType: AttachmentType.GeneralAttachment,
    comment: fake.lorem.sentence(),
    createdDate: fake.date.recent(),
    fileName: `${fake.lorem.slug()}.log`,
    size: fake.number.int({ min: 1, max: 10_000_000 }),
    url: fake.internet.url()
});

export const makeTestResultFailureType = (): TestResultFailureType => ({
    id: fake.number.id(),
    name: fake.lorem.slug(2)
});

export const makeTestLogReference = (): TestLogReference => ({
    buildId: fake.number.id(),
    filePath: `${fake.lorem.word()}/${fake.lorem.slug()}.log`,
    releaseEnvId: 0,
    releaseId: 0,
    resultId: 0,
    runId: 0,
    scope: TestLogScope.Run,
    subResultId: 0,
    type: TestLogType.GeneralAttachment
});

export const makeTestLog = (): TestLog => ({
    logReference: makeTestLogReference(),
    metaData: { owner: fake.person.fullName() },
    modifiedOn: fake.date.recent(),
    size: fake.number.int({ min: 1, max: 10_000_000 })
});

export const makeTestLogStoreEndpointDetails = (
    endpointType: TestLogStoreEndpointType
): TestLogStoreEndpointDetails => ({
    endpointSASUri: `${fake.internet.url()}?sv=${fake.string.alphanumeric(16)}`,
    endpointType,
    status: TestLogStatusCode.Success
});

export const makeTimeline = (): Timeline => ({
    display: fake.lorem.sentence(),
    timestampUTC: fake.date.recent(),
    type: fake.helpers.arrayElement(["Queued", "Started", "Completed"])
});

export const makeTestResultsSession = (): TestResultsSession => ({
    endTimeUTC: fake.date.recent(),
    id: fake.number.id(),
    layout: [{ uid: fake.string.uuid(), name: fake.lorem.word() }],
    name: `Session ${fake.lorem.slug()}`,
    result: SessionResult.Passed,
    sessionSourcePipeline: { buildId: fake.number.id(), buildUrl: fake.internet.url() },
    source: {
        links: [{ displayName: fake.lorem.word(), operationType: "Read", type: "Build", url: fake.internet.url() }],
        originSystem: "AzurePipelines",
        sessionId: fake.string.uuid(),
        tenantId: fake.string.uuid(),
        tenantName: fake.company.name()
    },
    startTimeUTC: fake.date.recent(),
    state: TestResultsSessionState.Completed,
    testRuns: [fake.number.id()],
    timeline: [makeTimeline()],
    type: "Test",
    uid: fake.string.uuid()
});

export const makeTestSessionNotification = (): TestSessionNotification => ({
    body: fake.lorem.paragraph(),
    severity: fake.helpers.arrayElement(["Info", "Warning", "Error"]),
    title: fake.lorem.sentence()
});

export const makeTestResultMachine = (): TestResultMachine => ({
    configurationName: fake.helpers.arrayElement(["Debug", "Release"]),
    isReportingMachine: fake.datatype.boolean(),
    machineName: `agent-${fake.lorem.word()}`,
    processorArchitecture: fake.helpers.arrayElement(["x64", "x86", "ARM64"]),
    properties: { os: fake.lorem.word() },
    sessionMachineInstanceId: fake.number.id(),
    testResultId: fake.number.id(),
    testResultLogs: [{ fileType: "log", path: `${fake.lorem.slug()}.log`, type: "Console" }]
});

export const makeSessionId = (): number => fake.number.id();

export const afdTcmEndpoint: string = fake.internet.url();

export const testAgentToken: string = fake.string.alphanumeric(40);

export const sourceViewBuildCoverages: SourceViewBuildCoverage[] = Array.from(
    { length: 2 },
    makeSourceViewBuildCoverage
);

export const flakyBranchInfos: TestCaseFlakinessBranchInfo[] = Array.from(
    { length: 3 },
    makeTestCaseFlakinessBranchInfo
);

export const blobStoreAttachments: Array<TestAttachment & { dedupId: string; domainId: string }> =
    fake.helpers.distinct(3, makeBlobStoreTestAttachment, item => item.fileName);

export const testResultsSettings: TestResultsSettings = makeTestResultsSettings();

export const testTags: TestTag[] = fake.helpers.distinct(3, makeTestTag, item => item.name);

export const logStoreAttachments: TestLogStoreAttachment[] = fake.helpers.distinct(
    3,
    makeTestLogStoreAttachment,
    item => item.fileName
);

export const failureTypes: TestResultFailureType[] = fake.helpers.distinct(
    3,
    makeTestResultFailureType,
    item => item.name
);

export const testLogs: TestLog[] = fake.helpers.distinct(4, makeTestLog, item => item.logReference.filePath);

export const testResultsSessions: TestResultsSession[] = Array.from({ length: 2 }, makeTestResultsSession);

export const sessionLayout: any[] = [
    { uid: fake.string.uuid(), name: "root", children: [{ uid: fake.string.uuid(), name: "suite" }] }
];

export const sessionNotifications: TestSessionNotification[] = Array.from({ length: 2 }, makeTestSessionNotification);

export const testResultMachines: TestResultMachine[] = Array.from({ length: 2 }, makeTestResultMachine);

export const sessionRunIds: number[] = Array.from({ length: 3 }, () => fake.number.id());
