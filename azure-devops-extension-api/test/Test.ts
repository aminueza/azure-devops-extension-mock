import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    TestRestClient,
    TestRun,
    TestCaseResult,
    ShallowTestCaseResult,
    RunCreateModel,
    RunUpdateModel,
    TestAttachment,
    TestAttachmentReference,
    TestAttachmentRequestModel,
    TestPoint,
    TestPointsQuery,
    PointUpdateModel,
    StagedSuitesRequestModel,
    StagedSuitesResponseModel,
    SuiteTestCase,
    SuiteTestCaseUpdateModel,
    WorkItemToTestLinks,
    TestToWorkItemLinks,
    LinkedWorkItemsQuery,
    LinkedWorkItemsQueryResult,
    WorkItemReference,
    TestIterationDetailsModel,
    TestOutcome,
    TestResultsDetails,
    TestResultsQuery,
    TestSession,
    TestSessionSource,
    TestSettings,
    BuildCoverage,
    CodeCoverageData,
    CodeCoverageSummary,
    TestRunCoverage,
    CustomTestFieldDefinition,
    CustomTestFieldScope,
    ResultsFilter,
    TestResultHistory,
    TestMessageLogDetails,
    TestResultDocument,
    FieldDetailsForTestResults,
    TestResultMetaData,
    ResultRetentionSettings,
    BuildReference,
    ReleaseReference,
    TestResultSummary,
    TestResultsContext,
    TestResultsContextType,
    TestSummaryForWorkItem,
    TestResultTrendFilter,
    AggregatedDataForResultTrend,
    TestRunStatistic,
    TestRunState,
    TestRunPublishContext,
    TestHistoryQuery
} from "azure-devops-extension-api/Test";
import { TeamContext } from "azure-devops-extension-api/Core";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    attachments,
    buildCoverages,
    codeCoverageSummaries,
    customFields,
    linkedBugs,
    makeAggregatedDataForResultTrend,
    makeAttachmentRef,
    makeBuffer,
    makeCodeCoverageSummary,
    makeCustomTestFieldDefinition,
    makeFieldDetailsForTestResults,
    makeLinkedWorkItemsQueryResult,
    makeResultRetentionSettings,
    makeShallowReference,
    makeTestHistoryQuery,
    makeTestResultDocument,
    makeTestResultHistory,
    makeTestResultMetaData,
    makeTestResultSummary,
    makeTestRunStatistic,
    makeTestSummaryForWorkItem,
    makePointAssignment,
    makeStagedSuitesResponse,
    makeSuiteTestCase,
    makeTestCaseResult,
    makeTestIterationDetails,
    makeTestPoint,
    makeTestPointsQuery,
    makeTestResultsDetails,
    makeTestResultsQuery,
    makeTestRun,
    makeTestSession,
    makeTestSettings,
    makeTestToWorkItemLinks,
    makeWorkItemReference,
    makeWorkItemToTestLinks,
    queryableTestRuns,
    resultGroups,
    resultRetentionSettings,
    resultTrendData,
    shallowResults,
    suiteTestCases,
    testIterations,
    testPoints,
    testResults,
    testRunCoverages,
    testRunLogs,
    testRuns,
    testRunStatistics,
    testSessions,
    testSettingsList,
    workItemRefs
} from "./Data";

export class MockTestRestClient extends RestClientBase {
    public TYPE = TestRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getTestRuns(_project: string): Promise<TestRun[]> {
        return Promise.resolve(testRuns);
    }

    getTestRunById(_project: string, runId: number): Promise<TestRun> {
        const found = testRuns.find(r => r.id === runId);
        return Promise.resolve(found ?? makeTestRun(runId));
    }

    createTestRun(testRun: RunCreateModel, _project: string): Promise<TestRun> {
        const run = makeTestRun();
        return Promise.resolve({
            ...run,
            name: testRun.name ?? run.name,
            isAutomated: testRun.automated ?? run.isAutomated
        });
    }

    updateTestRun(
        _runUpdateModel: RunUpdateModel,
        _project: string,
        runId: number
    ): Promise<TestRun> {
        return Promise.resolve(makeTestRun(runId));
    }

    deleteTestRun(_project: string, _runId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestResults(_project: string, _runId: number): Promise<TestCaseResult[]> {
        return Promise.resolve(testResults);
    }

    getTestResultById(
        _project: string,
        _runId: number,
        testCaseResultId: number
    ): Promise<TestCaseResult> {
        const found = testResults.find(r => r.id === testCaseResultId);
        return Promise.resolve(found ?? makeTestCaseResult(testCaseResultId));
    }

    getTestResultsByBuild(
        _project: string,
        _buildId: number
    ): Promise<PagedList<ShallowTestCaseResult>> {
        return Promise.resolve(shallowResults);
    }

    getTestRunAttachments(_project: string, _runId: number): Promise<TestAttachment[]> {
        return Promise.resolve(attachments);
    }

    createTestRunAttachment(
        _attachmentRequestModel: TestAttachmentRequestModel,
        _project: string,
        _runId: number
    ): Promise<TestAttachmentReference> {
        return Promise.resolve(makeAttachmentRef());
    }

    getPoint(
        _project: string,
        _planId: number,
        _suiteId: number,
        pointIds: number,
        _witFields?: string
    ): Promise<TestPoint> {
        const found = testPoints.find(p => p.id === pointIds);
        return Promise.resolve(found ?? { ...makeTestPoint(), id: pointIds });
    }

    getPoints(
        _project: string,
        _planId: number,
        _suiteId: number,
        _witFields?: string,
        _configurationId?: string,
        _testCaseId?: string,
        testPointIds?: string,
        _includePointDetails?: boolean,
        skip?: number,
        top?: number
    ): Promise<TestPoint[]> {
        const wanted = testPointIds ? testPointIds.split(",").map(Number) : [];
        const matched = wanted.length
            ? testPoints.filter(p => wanted.includes(p.id))
            : testPoints;
        return Promise.resolve(matched.slice(skip ?? 0, top ?? matched.length));
    }

    getPointsByQuery(
        query: TestPointsQuery,
        _project: string,
        _skip?: number,
        _top?: number
    ): Promise<TestPointsQuery> {
        return Promise.resolve({ ...makeTestPointsQuery(), ...query });
    }

    updateTestPoints(
        pointUpdateModel: PointUpdateModel,
        _project: string,
        _planId: number,
        _suiteId: number,
        pointIds: string
    ): Promise<TestPoint[]> {
        const updated = pointIds.split(",").map(id => ({
            ...makeTestPoint(),
            id: Number(id),
            outcome: pointUpdateModel.outcome,
            assignedTo: pointUpdateModel.tester
        }));
        return Promise.resolve(updated);
    }

    processSuitesForStaging(
        request: StagedSuitesRequestModel,
        _project: string,
        _workItemId: number
    ): Promise<StagedSuitesResponseModel> {
        return Promise.resolve({
            ...makeStagedSuitesResponse(),
            success: request.suites.length > 0
        });
    }

    addTestCasesToSuite(
        _project: string,
        _planId: number,
        _suiteId: number,
        testCaseIds: string
    ): Promise<SuiteTestCase[]> {
        const added = testCaseIds.split(",").map(id => ({
            ...makeSuiteTestCase(),
            testCase: { ...makeWorkItemReference(), id }
        }));
        return Promise.resolve(added);
    }

    removeTestCasesFromSuiteUrl(
        _project: string,
        _planId: number,
        _suiteId: number,
        _testCaseIds: string
    ): Promise<void> {
        return Promise.resolve();
    }

    updateSuiteTestCases(
        suiteTestCaseUpdateModel: SuiteTestCaseUpdateModel,
        _project: string,
        _planId: number,
        _suiteId: number,
        testCaseIds: string
    ): Promise<SuiteTestCase[]> {
        const updated = testCaseIds.split(",").map(id => ({
            testCase: { ...makeWorkItemReference(), id },
            pointAssignments: suiteTestCaseUpdateModel.configurations.map(configuration => ({
                ...makePointAssignment(),
                configuration
            }))
        }));
        return Promise.resolve(updated);
    }

    getTestCases(_project: string, _planId: number, _suiteId: number): Promise<SuiteTestCase[]> {
        return Promise.resolve(suiteTestCases);
    }

    getTestCaseById(
        _project: string,
        _planId: number,
        _suiteId: number,
        testCaseIds: number
    ): Promise<SuiteTestCase> {
        const id = String(testCaseIds);
        const found = suiteTestCases.find(c => c.testCase.id === id);
        return Promise.resolve(
            found ?? { ...makeSuiteTestCase(), testCase: { ...makeWorkItemReference(), id } }
        );
    }

    deleteTestCase(_project: string, _testCaseId: number): Promise<void> {
        return Promise.resolve();
    }

    addWorkItemToTestLinks(
        workItemToTestLinks: WorkItemToTestLinks,
        _project: string
    ): Promise<WorkItemToTestLinks> {
        return Promise.resolve({ ...makeWorkItemToTestLinks(), ...workItemToTestLinks });
    }

    deleteTestMethodToWorkItemLink(
        _project: string,
        _testName: string,
        _workItemId: number
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    queryTestMethodLinkedWorkItems(
        _project: string,
        testName: string
    ): Promise<TestToWorkItemLinks> {
        const links = makeTestToWorkItemLinks();
        return Promise.resolve({ ...links, test: { ...links.test, name: testName } });
    }

    getLinkedWorkItemsByQuery(
        workItemQuery: LinkedWorkItemsQuery,
        _project: string
    ): Promise<LinkedWorkItemsQueryResult[]> {
        const results = workItemQuery.testCaseIds.map(testCaseId => ({
            ...makeLinkedWorkItemsQueryResult(),
            planId: workItemQuery.planId,
            testCaseId
        }));
        return Promise.resolve(results);
    }

    getBugsLinkedToTestResult(
        _project: string,
        _runId: number,
        _testCaseResultId: number
    ): Promise<WorkItemReference[]> {
        return Promise.resolve(linkedBugs);
    }

    queryTestResultWorkItems(
        _project: string,
        workItemCategory: string,
        _automatedTestName?: string,
        _testCaseId?: number,
        _maxCompleteDate?: Date,
        _days?: number,
        workItemCount?: number
    ): Promise<WorkItemReference[]> {
        const categorised = workItemRefs.map(ref => ({ ...ref, type: workItemCategory }));
        return Promise.resolve(categorised.slice(0, workItemCount ?? categorised.length));
    }

    deleteSharedParameter(_project: string, _sharedParameterId: number): Promise<void> {
        return Promise.resolve();
    }

    deleteSharedStep(_project: string, _sharedStepId: number): Promise<void> {
        return Promise.resolve();
    }

    addTestResultsToTestRun(
        results: TestCaseResult[],
        _project: string,
        _runId: number
    ): Promise<TestCaseResult[]> {
        const added = results.map(result => ({ ...makeTestCaseResult(), ...result }));
        return Promise.resolve(added);
    }

    updateTestResults(
        results: TestCaseResult[],
        _project: string,
        _runId: number
    ): Promise<TestCaseResult[]> {
        const updated = results.map(result => ({
            ...makeTestCaseResult(),
            ...result,
            revision: result.revision + 1
        }));
        return Promise.resolve(updated);
    }

    getTestResultsByQuery(query: TestResultsQuery, _project: string): Promise<TestResultsQuery> {
        return Promise.resolve({ ...makeTestResultsQuery(), ...query });
    }

    getTestResultsByRelease(
        _project: string,
        _releaseId: number,
        _releaseEnvid?: number,
        _publishContext?: string,
        _outcomes?: TestOutcome[],
        _top?: number,
        _continuationToken?: string
    ): Promise<PagedList<ShallowTestCaseResult>> {
        return Promise.resolve(shallowResults);
    }

    getTestResultDetailsForBuild(
        _project: string,
        _buildId: number,
        _publishContext?: string,
        _groupBy?: string,
        _filter?: string,
        _orderby?: string,
        _shouldIncludeResults?: boolean,
        _queryRunSummaryForInProgress?: boolean
    ): Promise<TestResultsDetails> {
        return Promise.resolve(makeTestResultsDetails());
    }

    getTestResultDetailsForRelease(
        _project: string,
        _releaseId: number,
        _releaseEnvId: number,
        _publishContext?: string,
        _groupBy?: string,
        _filter?: string,
        _orderby?: string,
        _shouldIncludeResults?: boolean,
        _queryRunSummaryForInProgress?: boolean
    ): Promise<TestResultsDetails> {
        return Promise.resolve(makeTestResultsDetails());
    }

    getTestIteration(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        iterationId: number,
        _includeActionResults?: boolean
    ): Promise<TestIterationDetailsModel> {
        const found = testIterations.find(iteration => iteration.id === iterationId);
        return Promise.resolve(found ?? { ...makeTestIterationDetails(), id: iterationId });
    }

    getTestIterations(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _includeActionResults?: boolean
    ): Promise<TestIterationDetailsModel[]> {
        return Promise.resolve(testIterations);
    }

    createTestIterationResultAttachment(
        _attachmentRequestModel: TestAttachmentRequestModel,
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _iterationId: number,
        _actionPath?: string
    ): Promise<TestAttachmentReference> {
        return Promise.resolve(makeAttachmentRef());
    }

    createTestResultAttachment(
        _attachmentRequestModel: TestAttachmentRequestModel,
        _project: string,
        _runId: number,
        _testCaseResultId: number
    ): Promise<TestAttachmentReference> {
        return Promise.resolve(makeAttachmentRef());
    }

    createTestSubResultAttachment(
        _attachmentRequestModel: TestAttachmentRequestModel,
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _testSubResultId: number
    ): Promise<TestAttachmentReference> {
        return Promise.resolve(makeAttachmentRef());
    }

    getTestResultAttachmentContent(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        attachmentId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`result-attachment-${attachmentId}`));
    }

    getTestResultAttachmentZip(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        attachmentId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`result-attachment-zip-${attachmentId}`));
    }

    getTestResultAttachments(
        _project: string,
        _runId: number,
        _testCaseResultId: number
    ): Promise<TestAttachment[]> {
        return Promise.resolve(attachments);
    }

    getTestSubResultAttachmentContent(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        attachmentId: number,
        _testSubResultId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`sub-attachment-${attachmentId}`));
    }

    getTestSubResultAttachmentZip(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        attachmentId: number,
        _testSubResultId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`sub-attachment-zip-${attachmentId}`));
    }

    getTestSubResultAttachments(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _testSubResultId: number
    ): Promise<TestAttachment[]> {
        return Promise.resolve(attachments);
    }

    getTestRunAttachmentContent(
        _project: string,
        _runId: number,
        attachmentId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`run-attachment-${attachmentId}`));
    }

    getTestRunAttachmentZip(
        _project: string,
        _runId: number,
        attachmentId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`run-attachment-zip-${attachmentId}`));
    }

    createTestSession(testSession: TestSession, _teamContext: TeamContext): Promise<TestSession> {
        return Promise.resolve({ ...makeTestSession(), ...testSession });
    }

    getTestSessions(
        _teamContext: TeamContext,
        _period?: number,
        _allSessions?: boolean,
        _includeAllProperties?: boolean,
        _source?: TestSessionSource,
        _includeOnlyCompletedSessions?: boolean
    ): Promise<TestSession[]> {
        return Promise.resolve(testSessions);
    }

    updateTestSession(testSession: TestSession, _teamContext: TeamContext): Promise<TestSession> {
        return Promise.resolve({
            ...makeTestSession(),
            ...testSession,
            revision: testSession.revision + 1
        });
    }

    createTestSettings(_testSettings: TestSettings, _project: string): Promise<number> {
        return Promise.resolve(testSettingsList.length + 1);
    }

    deleteTestSettings(_project: string, _testSettingsId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestSettingsById(_project: string, testSettingsId: number): Promise<TestSettings> {
        const found = testSettingsList.find(settings => settings.testSettingsId === testSettingsId);
        return Promise.resolve(found ?? { ...makeTestSettings(), testSettingsId });
    }

    getBuildCodeCoverage(
        _project: string,
        _buildId: number,
        _flags: number
    ): Promise<BuildCoverage[]> {
        return Promise.resolve(buildCoverages);
    }

    getCodeCoverageSummary(
        _project: string,
        buildId: number,
        deltaBuildId?: number
    ): Promise<CodeCoverageSummary> {
        const found = codeCoverageSummaries.find(summary => summary.build.id === String(buildId));
        const summary = found ?? makeCodeCoverageSummary(String(buildId));
        return Promise.resolve({
            ...summary,
            deltaBuild: deltaBuildId === undefined
                ? summary.deltaBuild
                : { ...makeShallowReference(), id: String(deltaBuildId) }
        });
    }

    updateCodeCoverageSummary(
        _coverageData: CodeCoverageData,
        _project: string,
        _buildId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    getTestRunCodeCoverage(
        _project: string,
        runId: number,
        _flags: number
    ): Promise<TestRunCoverage[]> {
        const scoped = testRunCoverages.map(coverage => ({
            ...coverage,
            testRun: { ...coverage.testRun, id: String(runId) }
        }));
        return Promise.resolve(scoped);
    }

    addCustomFields(
        newFields: CustomTestFieldDefinition[],
        _project: string
    ): Promise<CustomTestFieldDefinition[]> {
        const added = newFields.map((field, index) => ({
            ...makeCustomTestFieldDefinition(field.scope),
            ...field,
            fieldId: index + 1
        }));
        return Promise.resolve(added);
    }

    queryCustomFields(
        _project: string,
        scopeFilter: CustomTestFieldScope
    ): Promise<CustomTestFieldDefinition[]> {
        return Promise.resolve(customFields.filter(field => field.scope === scopeFilter));
    }

    queryTestResultHistory(filter: ResultsFilter, _project: string): Promise<TestResultHistory> {
        return Promise.resolve({ ...makeTestResultHistory(), groupByField: filter.groupBy });
    }

    getTestRunLogs(_project: string, _runId: number): Promise<TestMessageLogDetails[]> {
        return Promise.resolve(testRunLogs);
    }

    publishTestResultDocument(
        document: TestResultDocument,
        _project: string,
        runId: number
    ): Promise<TestResultDocument> {
        const published = makeTestResultDocument();
        return Promise.resolve({
            payload: document.payload,
            operationReference: { ...published.operationReference, id: String(runId) }
        });
    }

    getResultGroupsByBuild(
        _project: string,
        _buildId: number,
        _publishContext: string,
        fields?: string[],
        _continuationToken?: string
    ): Promise<PagedList<FieldDetailsForTestResults>> {
        const groups = fields
            ? fields.map(fieldName => ({ ...makeFieldDetailsForTestResults(), fieldName }))
            : resultGroups;
        return Promise.resolve(
            Object.assign([...groups], { continuationToken: null }) as PagedList<FieldDetailsForTestResults>
        );
    }

    getResultGroupsByRelease(
        _project: string,
        _releaseId: number,
        _publishContext: string,
        _releaseEnvId?: number,
        fields?: string[],
        _continuationToken?: string
    ): Promise<PagedList<FieldDetailsForTestResults>> {
        const groups = fields
            ? fields.map(fieldName => ({ ...makeFieldDetailsForTestResults(), fieldName }))
            : resultGroups;
        return Promise.resolve(
            Object.assign([...groups], { continuationToken: null }) as PagedList<FieldDetailsForTestResults>
        );
    }

    queryTestResultsMetaData(
        testReferenceIds: string[],
        _project: string
    ): Promise<TestResultMetaData[]> {
        const matched = testReferenceIds.map(id => ({
            ...makeTestResultMetaData(),
            testCaseReferenceId: Number(id)
        }));
        return Promise.resolve(matched);
    }

    getResultRetentionSettings(_project: string): Promise<ResultRetentionSettings> {
        return Promise.resolve(resultRetentionSettings);
    }

    updateResultRetentionSettings(
        retentionSettings: ResultRetentionSettings,
        _project: string
    ): Promise<ResultRetentionSettings> {
        return Promise.resolve({ ...makeResultRetentionSettings(), ...retentionSettings });
    }

    queryTestResultsReportForBuild(
        _project: string,
        buildId: number,
        _publishContext?: string,
        _includeFailureDetails?: boolean,
        _buildToCompare?: BuildReference
    ): Promise<TestResultSummary> {
        return Promise.resolve({
            ...makeTestResultSummary(),
            testResultsContext: {
                contextType: TestResultsContextType.Build,
                build: { id: buildId }
            } as unknown as TestResultsContext
        });
    }

    queryTestResultsReportForRelease(
        _project: string,
        releaseId: number,
        releaseEnvId: number,
        _publishContext?: string,
        _includeFailureDetails?: boolean,
        _releaseToCompare?: ReleaseReference
    ): Promise<TestResultSummary> {
        return Promise.resolve({
            ...makeTestResultSummary(),
            testResultsContext: {
                contextType: TestResultsContextType.Release,
                release: { id: releaseId, environmentId: releaseEnvId }
            } as unknown as TestResultsContext
        });
    }

    queryTestResultsSummaryForReleases(
        releases: ReleaseReference[],
        _project: string
    ): Promise<TestResultSummary[]> {
        const summaries = releases.map(release => ({
            ...makeTestResultSummary(),
            testResultsContext: {
                contextType: TestResultsContextType.Release,
                release
            } as unknown as TestResultsContext
        }));
        return Promise.resolve(summaries);
    }

    queryTestSummaryByRequirement(
        resultsContext: TestResultsContext,
        _project: string,
        workItemIds?: number[]
    ): Promise<TestSummaryForWorkItem[]> {
        const ids = workItemIds ?? workItemRefs.map(ref => Number(ref.id));
        const summaries = ids.map(id => ({
            ...makeTestSummaryForWorkItem(),
            summary: { ...makeAggregatedDataForResultTrend(), testResultsContext: resultsContext },
            workItem: { ...makeWorkItemReference(), id: String(id) }
        }));
        return Promise.resolve(summaries);
    }

    queryResultTrendForBuild(
        filter: TestResultTrendFilter,
        _project: string
    ): Promise<AggregatedDataForResultTrend[]> {
        return Promise.resolve(resultTrendData.slice(0, filter.buildCount));
    }

    queryResultTrendForRelease(
        filter: TestResultTrendFilter,
        _project: string
    ): Promise<AggregatedDataForResultTrend[]> {
        return Promise.resolve(resultTrendData.slice(0, filter.buildCount));
    }

    getTestRunStatistics(_project: string, runId: number): Promise<TestRunStatistic> {
        const found = testRunStatistics.find(statistic => statistic.run.id === String(runId));
        return Promise.resolve(found ?? makeTestRunStatistic(String(runId)));
    }

    queryTestRuns(
        _project: string,
        minLastUpdatedDate: Date,
        maxLastUpdatedDate: Date,
        state?: TestRunState,
        _planIds?: number[],
        _isAutomated?: boolean,
        _publishContext?: TestRunPublishContext,
        _buildIds?: number[],
        _buildDefIds?: number[],
        _branchName?: string,
        _releaseIds?: number[],
        _releaseDefIds?: number[],
        _releaseEnvIds?: number[],
        _releaseEnvDefIds?: number[],
        _runTitle?: string,
        _top?: number,
        _continuationToken?: string
    ): Promise<PagedList<TestRun>> {
        const matched = queryableTestRuns.filter(run => {
            const updated = run.lastUpdatedDate.getTime();
            const inRange =
                updated >= minLastUpdatedDate.getTime() && updated <= maxLastUpdatedDate.getTime();
            return inRange && (state === undefined || run.state === TestRunState[state]);
        });
        return Promise.resolve(
            Object.assign([...matched], { continuationToken: null }) as PagedList<TestRun>
        );
    }

    queryTestHistory(filter: TestHistoryQuery, _project: string): Promise<TestHistoryQuery> {
        return Promise.resolve({ ...makeTestHistoryQuery(), ...filter });
    }
}
