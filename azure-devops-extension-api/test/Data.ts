import { fake } from "../common/fixtures";
import {
    TestRun,
    TestRunState,
    TestOutcome,
    TestCaseResult,
    ShallowTestCaseResult,
    TestAttachmentReference,
    TestAttachment,
    ShallowReference,
    WorkItemReference,
    LastResultDetails,
    TestPoint,
    PointAssignment,
    PointsFilter,
    TestPointsQuery,
    SuiteTestCase,
    TestMethod,
    TestToWorkItemLinks,
    WorkItemToTestLinks,
    LinkedWorkItemsQueryResult,
    StagedSuitesResponseModel,
    Service,
    TestActionResultModel,
    TestResultParameterModel,
    TestCaseResultAttachmentModel,
    TestIterationDetailsModel,
    AggregatedResultsByOutcome,
    TestResultsDetails,
    TestResultsContext,
    TestResultsContextType,
    ResultsFilter,
    TestResultsQuery,
    TestSession,
    TestSessionSource,
    TestSessionState,
    TestSettings,
    CoverageStatistics,
    FunctionCoverage,
    ModuleCoverage,
    BuildConfiguration,
    BuildCoverage,
    TestRunCoverage,
    CodeCoverageStatistics,
    CodeCoverageData,
    CodeCoverageSummary,
    CoverageDetailedSummaryStatus,
    CoverageSummaryStatus,
    TestMessageLogDetails,
    RunStatistic,
    ResultMetadata,
    TestRunStatistic,
    FieldDetailsForTestResults,
    ResultRetentionSettings,
    CustomTestFieldDefinition,
    CustomTestFieldScope,
    CustomTestFieldType,
    TestResultHistory,
    TestHistoryQuery,
    TestResultGroupBy,
    TestResultMetaData,
    TestResultDocument,
    AggregatedRunsByState,
    AggregatedDataForResultTrend,
    TestSummaryForWorkItem,
    TestResultSummary,
    TestRunOutcome
} from "azure-devops-extension-api/Test";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef, makeProjectReference } from "../core/Data";

const outcomeValues = [
    TestOutcome.Passed,
    TestOutcome.Failed,
    TestOutcome.NotExecuted,
    TestOutcome.Blocked
];

export const makeTestRun = (id?: number): TestRun => ({
    id: id ?? fake.number.int({ min: 1, max: 100_000 }),
    name: `Test Run ${fake.lorem.slug()}`,
    url: fake.internet.url(),
    isAutomated: true,
    state: TestRunState.Completed as unknown as string,
    startedDate: fake.date.recent(),
    completedDate: fake.date.recent(),
    owner: makeIdentityRef() as any,
    build: { id: String(fake.number.int()), name: fake.lorem.slug() } as any,
    project: { id: fake.string.uuid(), name: fake.company.name() } as any,
    totalTests: 100,
    passedTests: 95,
    incompleteTests: 0,
    unanalyzedTests: 0,
    notApplicableTests: 0,
    iteration: `Sprint ${fake.number.int({ min: 1, max: 30 })}`,
    webAccessUrl: fake.internet.url()
} as unknown as TestRun);

export const makeTestCaseResult = (id?: number): TestCaseResult => ({
    id: id ?? fake.number.int(),
    testRun: { id: String(fake.number.int()) } as any,
    testCase: {
        id: String(fake.number.int()),
        name: fake.lorem.sentence(),
        url: fake.internet.url()
    } as any,
    testCaseTitle: fake.lorem.sentence(),
    outcome: fake.helpers.arrayElement(outcomeValues) as unknown as string,
    state: "Completed",
    automatedTestName: fake.lorem.slug(),
    automatedTestStorage: fake.system.fileName(),
    priority: fake.number.int({ min: 1, max: 4 }),
    revision: 1,
    durationInMs: fake.number.int({ min: 1, max: 10_000 }),
    startedDate: fake.date.recent(),
    completedDate: fake.date.recent(),
    runBy: makeIdentityRef() as any,
    owner: makeIdentityRef() as any,
    build: { id: String(fake.number.int()), name: fake.lorem.slug() } as any,
    project: { id: fake.string.uuid(), name: fake.company.name() } as any
} as unknown as TestCaseResult);

export const makeShallowResult = (): ShallowTestCaseResult => ({
    id: fake.number.int(),
    runId: fake.number.int(),
    refId: fake.number.int(),
    testCaseTitle: fake.lorem.sentence(),
    automatedTestName: fake.lorem.slug(),
    automatedTestStorage: fake.system.fileName(),
    outcome: fake.helpers.arrayElement(["Passed", "Failed", "NotExecuted"]),
    priority: fake.number.int({ min: 1, max: 4 }),
    isReRun: false,
    owner: fake.person.fullName()
} as unknown as ShallowTestCaseResult);

export const makeAttachment = (): TestAttachment => ({
    id: fake.number.int(),
    fileName: fake.system.fileName(),
    comment: fake.lorem.sentence(),
    attachmentType: "GeneralAttachment" as any,
    size: fake.number.int({ min: 1, max: 10_000_000 }),
    createdDate: fake.date.recent(),
    url: fake.internet.url()
} as unknown as TestAttachment);

export const makeAttachmentRef = (): TestAttachmentReference => ({
    id: fake.number.int(),
    url: fake.internet.url()
} as unknown as TestAttachmentReference);

export const testRuns: TestRun[] = Array.from({ length: 5 }, () => makeTestRun());
export const testResults: TestCaseResult[] = Array.from({ length: 10 }, () => makeTestCaseResult());
export const shallowResults: PagedList<ShallowTestCaseResult> =
    Object.assign(Array.from({ length: 10 }, makeShallowResult), { continuationToken: "" }) as PagedList<ShallowTestCaseResult>;
export const attachments: TestAttachment[] = Array.from({ length: 2 }, makeAttachment);

export const makeShallowReference = (): ShallowReference => ({
    id: String(fake.number.int({ min: 1, max: 100_000 })),
    name: fake.lorem.slug(),
    url: fake.internet.url()
});

export const makeWorkItemReference = (): WorkItemReference => ({
    id: String(fake.number.int({ min: 1, max: 100_000 })),
    name: fake.lorem.sentence(),
    type: fake.helpers.arrayElement(["Bug", "Task", "User Story", "Test Case"]),
    url: fake.internet.url(),
    webUrl: fake.internet.url()
});

export const makeLastResultDetails = (): LastResultDetails => ({
    dateCompleted: fake.date.recent(),
    duration: fake.number.int({ min: 1, max: 10_000 }),
    runBy: makeIdentityRef()
});

export const makeTestPoint = (): TestPoint => ({
    assignedTo: makeIdentityRef(),
    automated: fake.datatype.boolean(),
    comment: fake.lorem.sentence(),
    configuration: makeShallowReference(),
    failureType: "None",
    id: fake.number.int({ min: 1, max: 100_000 }),
    lastResetToActive: fake.date.recent(),
    lastResolutionStateId: fake.number.int({ min: 0, max: 10 }),
    lastResult: makeShallowReference(),
    lastResultDetails: makeLastResultDetails(),
    lastResultState: "Completed",
    lastRunBuildNumber: fake.system.semver(),
    lastTestRun: makeShallowReference(),
    lastUpdatedBy: makeIdentityRef(),
    lastUpdatedDate: fake.date.recent(),
    outcome: fake.helpers.arrayElement(outcomeValues) as unknown as string,
    revision: 1,
    state: "Ready",
    suite: makeShallowReference(),
    testCase: makeWorkItemReference(),
    testPlan: makeShallowReference(),
    url: fake.internet.url(),
    workItemProperties: [{ "System.Title": fake.lorem.sentence() }]
});

export const makePointAssignment = (): PointAssignment => ({
    configuration: makeShallowReference(),
    tester: makeIdentityRef()
});

export const makePointsFilter = (): PointsFilter => ({
    configurationNames: [fake.lorem.slug()],
    testcaseIds: [fake.number.int({ min: 1, max: 100_000 })],
    testers: [makeIdentityRef()]
});

export const makeTestPointsQuery = (): TestPointsQuery => ({
    orderBy: "id",
    points: [makeTestPoint()],
    pointsFilter: makePointsFilter(),
    witFields: ["System.Title", "System.State"]
});

export const makeSuiteTestCase = (): SuiteTestCase => ({
    pointAssignments: [makePointAssignment()],
    testCase: makeWorkItemReference()
});

export const makeTestMethod = (): TestMethod => ({
    container: fake.system.fileName(),
    name: fake.lorem.slug(),
    testResult: makeTestCaseResult()
});

export const makeTestToWorkItemLinks = (): TestToWorkItemLinks => ({
    test: makeTestMethod(),
    workItems: [makeWorkItemReference()]
});

export const makeWorkItemToTestLinks = (): WorkItemToTestLinks => ({
    executedIn: Service.Tcm,
    tests: [makeTestMethod()],
    workItem: makeWorkItemReference()
});

export const makeLinkedWorkItemsQueryResult = (): LinkedWorkItemsQueryResult => ({
    automatedTestName: fake.lorem.slug(),
    planId: fake.number.int({ min: 1, max: 1_000 }),
    pointId: fake.number.int({ min: 1, max: 1_000 }),
    suiteId: fake.number.int({ min: 1, max: 1_000 }),
    testCaseId: fake.number.int({ min: 1, max: 1_000 }),
    workItems: [makeWorkItemReference()]
});

export const makeStagedSuitesResponse = (): StagedSuitesResponseModel => ({
    metadataId: fake.string.uuid(),
    success: true
});

export const testPoints: TestPoint[] = Array.from({ length: 5 }, () => makeTestPoint());
export const suiteTestCases: SuiteTestCase[] = Array.from({ length: 4 }, () => makeSuiteTestCase());
export const workItemRefs: WorkItemReference[] = Array.from({ length: 3 }, () => makeWorkItemReference());
export const linkedBugs: WorkItemReference[] = Array.from({ length: 3 }, () => ({
    ...makeWorkItemReference(),
    type: "Bug"
}));

export const makeBuffer = (text: string): ArrayBuffer => {
    const encoded = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(buffer).set(encoded);
    return buffer;
};

export const makeTestActionResult = (): TestActionResultModel => ({
    actionPath: fake.string.alphanumeric(8),
    actualResultMessage: fake.lorem.sentence(),
    comment: fake.lorem.sentence(),
    completedDate: fake.date.recent(),
    durationInMs: fake.number.int({ min: 1, max: 10_000 }),
    errorMessage: fake.lorem.sentence(),
    iterationId: fake.number.int({ min: 1, max: 20 }),
    outcome: fake.helpers.arrayElement(outcomeValues) as unknown as string,
    sharedStepModel: {
        id: fake.number.int({ min: 1, max: 1_000 }),
        revision: fake.number.int({ min: 1, max: 10 })
    },
    startedDate: fake.date.recent(),
    stepIdentifier: String(fake.number.int({ min: 1, max: 20 })),
    url: fake.internet.url()
});

export const makeTestResultParameter = (): TestResultParameterModel => ({
    actionPath: fake.string.alphanumeric(8),
    iterationId: fake.number.int({ min: 1, max: 20 }),
    parameterName: fake.lorem.word(),
    stepIdentifier: String(fake.number.int({ min: 1, max: 20 })),
    url: fake.internet.url(),
    value: fake.lorem.slug()
});

export const makeTestCaseResultAttachment = (): TestCaseResultAttachmentModel => ({
    actionPath: fake.string.alphanumeric(8),
    id: fake.number.int({ min: 1, max: 100_000 }),
    iterationId: fake.number.int({ min: 1, max: 20 }),
    name: fake.system.fileName(),
    size: fake.number.int({ min: 1, max: 1_000_000 }),
    url: fake.internet.url()
});

export const makeTestIterationDetails = (): TestIterationDetailsModel => ({
    actionResults: [makeTestActionResult()],
    attachments: [makeTestCaseResultAttachment()],
    comment: fake.lorem.sentence(),
    completedDate: fake.date.recent(),
    durationInMs: fake.number.int({ min: 1, max: 10_000 }),
    errorMessage: fake.lorem.sentence(),
    id: fake.number.int({ min: 1, max: 20 }),
    outcome: fake.helpers.arrayElement(outcomeValues) as unknown as string,
    parameters: [makeTestResultParameter()],
    startedDate: fake.date.recent(),
    url: fake.internet.url()
});

export const makeAggregatedResultsByOutcome = (): AggregatedResultsByOutcome => ({
    count: fake.number.int({ min: 1, max: 500 }),
    duration: fake.number.int({ min: 1, max: 10_000 }),
    groupByField: "Outcome",
    groupByValue: "Passed",
    outcome: TestOutcome.Passed,
    rerunResultCount: fake.number.int({ min: 0, max: 5 })
});

export const makeTestResultsDetails = (): TestResultsDetails => ({
    groupByField: "TestRun",
    resultsForGroup: [
        {
            groupByValue: makeShallowReference(),
            results: [makeTestCaseResult()],
            resultsCountByOutcome: { [TestOutcome.Passed]: makeAggregatedResultsByOutcome() },
            tags: [fake.lorem.word()]
        }
    ]
});

export const makeResultsFilter = (): ResultsFilter => ({
    automatedTestName: fake.lorem.slug(),
    branch: fake.git.branch(),
    executedIn: Service.Tcm,
    groupBy: "TestRun",
    maxCompleteDate: fake.date.recent(),
    resultsCount: fake.number.int({ min: 1, max: 100 }),
    testCaseId: fake.number.int({ min: 1, max: 100_000 }),
    testCaseReferenceIds: [fake.number.int({ min: 1, max: 100_000 })],
    testPlanId: fake.number.int({ min: 1, max: 1_000 }),
    testPointIds: [fake.number.int({ min: 1, max: 100_000 })],
    testResultsContext: {
        contextType: TestResultsContextType.Build
    } as unknown as TestResultsContext,
    trendDays: fake.number.int({ min: 1, max: 30 })
});

export const makeTestResultsQuery = (): TestResultsQuery => ({
    fields: ["Outcome", "Priority"],
    results: [makeTestCaseResult()],
    resultsFilter: makeResultsFilter()
});

export const makeTestSession = (): TestSession => ({
    area: makeShallowReference(),
    comment: fake.lorem.sentence(),
    endDate: fake.date.recent(),
    id: fake.number.int({ min: 1, max: 100_000 }),
    lastUpdatedBy: makeIdentityRef(),
    lastUpdatedDate: fake.date.recent(),
    owner: makeIdentityRef(),
    project: makeShallowReference(),
    propertyBag: { bag: { owner: fake.person.fullName() } },
    revision: 1,
    source: TestSessionSource.XTWeb,
    startDate: fake.date.recent(),
    state: TestSessionState.Completed,
    title: `Session ${fake.lorem.slug()}`,
    url: fake.internet.url()
});

export const makeTestSettings = (): TestSettings => ({
    areaPath: fake.lorem.slug(),
    description: fake.lorem.sentence(),
    isPublic: fake.datatype.boolean(),
    machineRoles: `<Roles name="${fake.lorem.word()}" />`,
    testSettingsContent: `<TestSettings name="${fake.lorem.word()}" />`,
    testSettingsId: fake.number.int({ min: 1, max: 100_000 }),
    testSettingsName: `Settings ${fake.lorem.slug()}`
});

export const testIterations: TestIterationDetailsModel[] = Array.from({ length: 3 }, makeTestIterationDetails);
export const testSessions: TestSession[] = Array.from({ length: 4 }, makeTestSession);
export const testSettingsList: TestSettings[] = Array.from({ length: 3 }, makeTestSettings);

export const makeCoverageStatistics = (): CoverageStatistics => ({
    blocksCovered: fake.number.int({ min: 1, max: 5_000 }),
    blocksNotCovered: fake.number.int({ min: 0, max: 1_000 }),
    branchesCovered: fake.number.int({ min: 1, max: 5_000 }),
    branchesNotCovered: fake.number.int({ min: 0, max: 1_000 }),
    linesCovered: fake.number.int({ min: 1, max: 50_000 }),
    linesNotCovered: fake.number.int({ min: 0, max: 10_000 }),
    linesPartiallyCovered: fake.number.int({ min: 0, max: 1_000 })
});

export const makeFunctionCoverage = (): FunctionCoverage => ({
    class: fake.word.noun(),
    name: fake.lorem.slug(),
    namespace: `${fake.word.noun()}.${fake.word.noun()}`,
    sourceFile: fake.system.fileName(),
    statistics: makeCoverageStatistics()
});

export const makeModuleCoverage = (): ModuleCoverage => ({
    blockCount: fake.number.int({ min: 1, max: 1_000 }),
    blockData: [fake.number.int({ min: 0, max: 255 })],
    fileUrl: fake.internet.url(),
    functions: [makeFunctionCoverage()],
    name: fake.system.fileName(),
    signature: fake.string.uuid(),
    signatureAge: fake.number.int({ min: 1, max: 10 }),
    statistics: makeCoverageStatistics()
});

export const makeBuildConfiguration = (): BuildConfiguration => ({
    branchName: fake.git.branch(),
    buildDefinitionId: fake.number.int({ min: 1, max: 1_000 }),
    buildSystem: "Azure Pipelines",
    creationDate: fake.date.recent(),
    flavor: fake.helpers.arrayElement(["Debug", "Release"]),
    id: fake.number.int({ min: 1, max: 100_000 }),
    number: fake.system.semver(),
    platform: fake.helpers.arrayElement(["x64", "x86", "ARM64"]),
    project: makeShallowReference(),
    repositoryGuid: fake.string.uuid(),
    repositoryId: fake.number.int({ min: 1, max: 1_000 }),
    repositoryType: "TfsGit",
    sourceVersion: fake.git.commitSha(),
    targetBranchName: fake.git.branch(),
    uri: fake.internet.url()
});

export const makeBuildCoverage = (): BuildCoverage => ({
    codeCoverageFileUrl: fake.internet.url(),
    configuration: makeBuildConfiguration(),
    lastError: "",
    modules: [makeModuleCoverage()],
    state: "Completed"
});

export const makeTestRunCoverage = (): TestRunCoverage => ({
    lastError: "",
    modules: [makeModuleCoverage()],
    state: "Completed",
    testRun: makeShallowReference()
});

export const makeCodeCoverageStatistics = (): CodeCoverageStatistics => ({
    covered: fake.number.int({ min: 1, max: 10_000 }),
    delta: fake.number.int({ min: 0, max: 100 }),
    isDeltaAvailable: fake.datatype.boolean(),
    label: fake.helpers.arrayElement(["Blocks", "Lines", "Modules"]),
    position: fake.number.int({ min: 0, max: 5 }),
    total: fake.number.int({ min: 10_000, max: 50_000 })
});

export const makeCodeCoverageData = (): CodeCoverageData => ({
    buildFlavor: fake.helpers.arrayElement(["Debug", "Release"]),
    buildPlatform: fake.helpers.arrayElement(["x64", "x86", "ARM64"]),
    coverageStats: [makeCodeCoverageStatistics()]
});

export const makeCodeCoverageSummary = (buildId: string): CodeCoverageSummary => ({
    build: { ...makeShallowReference(), id: buildId },
    coverageData: [makeCodeCoverageData()],
    coverageDetailedSummaryStatus: CoverageDetailedSummaryStatus.Finalized,
    deltaBuild: makeShallowReference(),
    status: CoverageSummaryStatus.Completed
});

export const makeTestMessageLogDetails = (): TestMessageLogDetails => ({
    dateCreated: fake.date.recent(),
    entryId: fake.number.int({ min: 1, max: 10_000 }),
    message: fake.lorem.sentence()
});

export const makeRunStatistic = (): RunStatistic => ({
    count: fake.number.int({ min: 1, max: 500 }),
    outcome: "Passed",
    resolutionState: {
        id: fake.number.int({ min: 1, max: 10 }),
        name: fake.lorem.word(),
        project: makeShallowReference()
    },
    resultMetadata: ResultMetadata.Flaky,
    state: "Completed"
});

export const makeTestRunStatistic = (runId: string): TestRunStatistic => ({
    run: { ...makeShallowReference(), id: runId },
    runStatistics: [makeRunStatistic()]
});

export const makeFieldDetailsForTestResults = (): FieldDetailsForTestResults => ({
    fieldName: fake.helpers.arrayElement(["Container", "Owner", "Priority"]),
    groupsForField: [fake.lorem.word()]
});

export const makeResultRetentionSettings = (): ResultRetentionSettings => ({
    automatedResultsRetentionDuration: fake.number.int({ min: 1, max: 180 }),
    lastUpdatedBy: makeIdentityRef(),
    lastUpdatedDate: fake.date.recent(),
    manualResultsRetentionDuration: fake.number.int({ min: 1, max: 365 })
});

export const makeCustomTestFieldDefinition = (scope: CustomTestFieldScope): CustomTestFieldDefinition => ({
    fieldId: fake.number.int({ min: 1, max: 10_000 }),
    fieldName: fake.lorem.word(),
    fieldType: CustomTestFieldType.String,
    scope
});

export const makeTestResultHistory = (): TestResultHistory => ({
    groupByField: "Branch",
    resultsForGroup: [
        {
            groupByValue: fake.git.branch(),
            latestResult: makeTestCaseResult()
        }
    ]
});

export const makeTestHistoryQuery = (): TestHistoryQuery => ({
    automatedTestName: fake.lorem.slug(),
    branch: fake.git.branch(),
    buildDefinitionId: fake.number.int({ min: 1, max: 1_000 }),
    continuationToken: "",
    groupBy: TestResultGroupBy.Branch,
    maxCompleteDate: fake.date.recent(),
    releaseEnvDefinitionId: fake.number.int({ min: 1, max: 1_000 }),
    resultsForGroup: [
        {
            displayName: fake.lorem.slug(),
            groupByValue: fake.git.branch(),
            results: [makeTestCaseResult()]
        }
    ],
    testCaseId: fake.number.int({ min: 1, max: 100_000 }),
    trendDays: 7
});

export const makeTestResultMetaData = (): TestResultMetaData => ({
    automatedTestName: fake.lorem.slug(),
    automatedTestStorage: fake.system.fileName(),
    flakyIdentifiers: [{ branchName: fake.git.branch(), isFlaky: fake.datatype.boolean() }],
    owner: fake.person.fullName(),
    priority: fake.number.int({ min: 1, max: 4 }),
    testCaseReferenceId: fake.number.int({ min: 1, max: 100_000 }),
    testCaseTitle: fake.lorem.sentence()
});

export const makeTestResultDocument = (): TestResultDocument => ({
    operationReference: {
        id: fake.string.uuid(),
        status: "Completed",
        url: fake.internet.url()
    },
    payload: {
        comment: fake.lorem.sentence(),
        name: fake.lorem.slug(),
        stream: fake.string.alphanumeric(16)
    }
});

export const makeAggregatedRunsByState = (): AggregatedRunsByState => ({
    resultsByOutcome: { [TestOutcome.Passed]: makeAggregatedResultsByOutcome() },
    runsCount: fake.number.int({ min: 1, max: 50 }),
    state: TestRunState.Completed
});

export const makeAggregatedDataForResultTrend = (): AggregatedDataForResultTrend => ({
    duration: `PT${fake.number.int({ min: 1, max: 600 })}S`,
    resultsByOutcome: { [TestOutcome.Passed]: makeAggregatedResultsByOutcome() },
    runSummaryByState: { [TestRunState.Completed]: makeAggregatedRunsByState() },
    testResultsContext: { contextType: TestResultsContextType.Build } as unknown as TestResultsContext,
    totalTests: fake.number.int({ min: 1, max: 500 })
});

export const makeTestSummaryForWorkItem = (): TestSummaryForWorkItem => ({
    summary: makeAggregatedDataForResultTrend(),
    workItem: makeWorkItemReference()
});

export const makeTestResultSummary = (): TestResultSummary => ({
    aggregatedResultsAnalysis: {
        duration: `PT${fake.number.int({ min: 1, max: 600 })}S`,
        notReportedResultsByOutcome: { [TestOutcome.NotExecuted]: makeAggregatedResultsByOutcome() },
        previousContext: { contextType: TestResultsContextType.Build } as unknown as TestResultsContext,
        resultsByOutcome: { [TestOutcome.Passed]: makeAggregatedResultsByOutcome() },
        resultsDifference: {
            increaseInDuration: `PT${fake.number.int({ min: 1, max: 60 })}S`,
            increaseInFailures: fake.number.int({ min: 0, max: 10 }),
            increaseInNonImpactedTests: fake.number.int({ min: 0, max: 10 }),
            increaseInOtherTests: fake.number.int({ min: 0, max: 10 }),
            increaseInPassedTests: fake.number.int({ min: 0, max: 20 }),
            increaseInTotalTests: fake.number.int({ min: 0, max: 20 })
        },
        runSummaryByOutcome: {
            [TestRunOutcome.Passed]: {
                outcome: TestRunOutcome.Passed,
                runsCount: fake.number.int({ min: 1, max: 20 })
            }
        },
        runSummaryByState: { [TestRunState.Completed]: makeAggregatedRunsByState() },
        totalTests: fake.number.int({ min: 1, max: 500 })
    },
    noConfigRunsCount: fake.number.int({ min: 0, max: 10 }),
    teamProject: makeProjectReference(),
    testFailures: {
        existingFailures: { count: fake.number.int({ min: 0, max: 5 }), testResults: [] },
        fixedTests: { count: fake.number.int({ min: 0, max: 5 }), testResults: [] },
        newFailures: { count: fake.number.int({ min: 0, max: 5 }), testResults: [] },
        previousContext: { contextType: TestResultsContextType.Build } as unknown as TestResultsContext
    },
    testResultsContext: { contextType: TestResultsContextType.Build } as unknown as TestResultsContext,
    totalRunsCount: fake.number.int({ min: 1, max: 20 })
});

export const buildCoverages: BuildCoverage[] = Array.from({ length: 2 }, makeBuildCoverage);
export const testRunCoverages: TestRunCoverage[] = Array.from({ length: 2 }, makeTestRunCoverage);
export const codeCoverageSummaries: CodeCoverageSummary[] = ["4001", "4002"].map(makeCodeCoverageSummary);
export const testRunLogs: TestMessageLogDetails[] = Array.from({ length: 3 }, makeTestMessageLogDetails);
export const testRunStatistics: TestRunStatistic[] = ["5001", "5002"].map(makeTestRunStatistic);
export const resultGroups: FieldDetailsForTestResults[] = Array.from({ length: 3 }, makeFieldDetailsForTestResults);
export const customFields: CustomTestFieldDefinition[] = [
    CustomTestFieldScope.TestRun,
    CustomTestFieldScope.TestResult,
    CustomTestFieldScope.TestRun
].map(makeCustomTestFieldDefinition);
export const resultRetentionSettings: ResultRetentionSettings = makeResultRetentionSettings();
export const resultTrendData: AggregatedDataForResultTrend[] = Array.from({ length: 4 }, makeAggregatedDataForResultTrend);
export const testResultMetaData: TestResultMetaData[] = Array.from({ length: 3 }, makeTestResultMetaData);

const queryableRunSpecs: Array<[number, string, TestRunState]> = [
    [9001, "2024-01-10T00:00:00.000Z", TestRunState.Completed],
    [9002, "2024-02-15T00:00:00.000Z", TestRunState.Completed],
    [9003, "2024-03-20T00:00:00.000Z", TestRunState.Aborted],
    [9004, "2024-06-05T00:00:00.000Z", TestRunState.InProgress]
];

export const queryableTestRuns: TestRun[] = queryableRunSpecs.map(([id, lastUpdated, state]) => ({
    ...makeTestRun(id),
    lastUpdatedDate: new Date(lastUpdated),
    state: TestRunState[state]
}));
