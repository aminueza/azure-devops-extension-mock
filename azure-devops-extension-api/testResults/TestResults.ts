import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
import {
    AggregatedDataForResultTrend,
    AnalysisFailureGroupReturn,
    BranchInfo,
    BuildCoverage,
    BuildReference,
    CodeCoverageData,
    CodeCoverageSummary,
    CustomTestFieldDefinition,
    CustomTestFieldScope,
    CustomTestFieldUpdateDefinition,
    FieldDetailsForTestResults,
    FileCoverageRequest,
    GenerateTestPlanFromWorkItemModel,
    Metrics,
    OperationType,
    PipelineTestMetrics,
    QueryModel,
    ReleaseReference,
    ResultDetails,
    ResultMetaDataDetails,
    ResultsFilter,
    RunCreateModel,
    RunUpdateModel,
    SessionEnvironmentAndMachine,
    ShallowTestCaseResult,
    SourceViewBuildCoverage,
    TestAgentCallbackRequest,
    TestAgentTriggerRequest,
    TestAttachment,
    TestAttachmentReference,
    TestAttachmentRequestModel,
    TestCaseFlakinessBranchInfo,
    TestCaseResult,
    TestHistoryQuery,
    TestLog,
    TestLogReference,
    TestLogStoreAttachment,
    TestLogStoreAttachmentReference,
    TestLogStoreEndpointDetails,
    TestLogStoreEndpointType,
    TestLogStoreOperationType,
    TestLogType,
    TestMessageLogDetails,
    TestOutcome,
    TestResultDocument,
    TestResultFailureType,
    TestResultFailureTypeRequestModel,
    TestResultHistory,
    TestResultMachine,
    TestResultMetaData,
    TestResultMetaDataUpdateInput,
    TestResultSummary,
    TestResultTrendFilter,
    TestResultsContext,
    TestResultsContextType,
    TestResultsDetails,
    TestResultsQuery,
    TestResultsSession,
    TestResultsSettings,
    TestResultsSettingsType,
    TestResultsUpdateSettings,
    TestRun,
    TestRunCoverage,
    TestRunPublishContext,
    TestRunSortOrderType,
    TestRunState,
    TestRunStatistic,
    TestSessionAnalysis,
    TestSessionEnvironment,
    TestSessionNotification,
    TestSessionTestRun,
    TestSettings,
    TestSummaryForWorkItem,
    TestTag,
    TestTagSummary,
    TestTagsUpdateModel,
    TestToWorkItemLinks,
    WorkItemReference,
    WorkItemToTestLinks
} from "azure-devops-extension-api/Test";
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
    makeShallowReference,
    makeTestCaseResult,
    makeTestHistoryQuery,
    makeTestResultDocument,
    makeTestResultHistory,
    makeTestResultMetaData,
    makeTestResultSummary,
    makeTestResultsDetails,
    makeTestResultsQuery,
    makeTestRun,
    makeTestRunStatistic,
    makeTestSettings,
    makeTestSummaryForWorkItem,
    makeTestToWorkItemLinks,
    makeWorkItemReference,
    makeWorkItemToTestLinks,
    queryableTestRuns,
    resultGroups,
    resultTrendData,
    shallowResults,
    testResults,
    testRunCoverages,
    testRunLogs,
    testRunStatistics,
    testRuns,
    testSettingsList,
    workItemRefs
} from "../test/Data";
import {
    afdTcmEndpoint,
    blobStoreAttachments,
    failureTypes,
    flakyBranchInfos,
    logStoreAttachments,
    makeBlobStoreTestAttachment,
    makePipelineTestMetrics,
    makeSessionId,
    makeTestAttachmentUploadDetails,
    makeTestCaseFlakinessBranchInfo,
    makeTestCaseLatestResult,
    makeTestLogStoreAttachmentReference,
    makeTestLogStoreEndpointDetails,
    makeTestResultFailureType,
    makeTestResultsContext,
    makeTestTagSummary,
    sessionLayout,
    sessionNotifications,
    sessionRunIds,
    sourceViewBuildCoverages,
    testAgentToken,
    testLogs,
    testResultMachines,
    testResultsSessions,
    testResultsSettings,
    testTags
} from "./Data";

const page = <T>(items: T[]): PagedList<T> => Object.assign([...items], { continuationToken: null });

const paginate = <T>(items: T[], skip?: number, top?: number): T[] => {
    const start = skip ?? 0;
    return items.slice(start, start + (top ?? items.length));
};

const findRun = (runId: number): TestRun => testRuns.find(run => run.id === runId) ?? makeTestRun(runId);

const findResult = (testResultId: number): TestCaseResult =>
    testResults.find(result => result.id === testResultId) ?? makeTestCaseResult(testResultId);

const findRunStatistic = (runId: number): TestRunStatistic =>
    testRunStatistics.find(statistic => statistic.run.id === String(runId)) ?? makeTestRunStatistic(String(runId));

const queryBlobAttachments = (
    fileNamePrefix?: string,
    attachmentId?: number
): (TestAttachment & { dedupId: string; domainId: string })[] => {
    if (attachmentId !== undefined) {
        const found = blobStoreAttachments.find(attachment => attachment.id === attachmentId);
        return [found ?? { ...makeBlobStoreTestAttachment(), id: attachmentId }];
    }
    return blobStoreAttachments.filter(
        attachment => fileNamePrefix === undefined || attachment.fileName.startsWith(fileNamePrefix)
    );
};

const groupsForFields = (fields?: string[]): PagedList<FieldDetailsForTestResults> => {
    const groups = fields ? fields.map(fieldName => ({ ...makeFieldDetailsForTestResults(), fieldName })) : resultGroups;
    return page(groups);
};

const pageLogs = (
    type: TestLogType,
    scope: Partial<TestLogReference>,
    fileNamePrefix?: string,
    top?: number
): PagedList<TestLog> => {
    const scoped = testLogs.map(log => ({ ...log, logReference: { ...log.logReference, ...scope, type } }));
    const matched = scoped.filter(log => {
        const filePath = log.logReference.filePath;
        return fileNamePrefix === undefined || filePath.slice(filePath.lastIndexOf("/") + 1).startsWith(fileNamePrefix);
    });
    return page(paginate(matched, 0, top));
};

const summaryFor = (testResultsContext: TestResultsContext): TestResultSummary => ({
    ...makeTestResultSummary(),
    testResultsContext
});

export class MockTestResultsRestClient extends RestClientBase {
    public TYPE = TestResultsRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getAfdTcmEndpoint(key: string): Promise<string> {
        return Promise.resolve(`${afdTcmEndpoint}/${key}`);
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

    deleteTestResultAttachment(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _attachmentId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    getTestIterationAttachmentContent(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        attachmentId: number,
        _iterationId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`iteration-attachment-${attachmentId}`));
    }

    getTestIterationAttachmentZip(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        attachmentId: number,
        _iterationId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`iteration-attachment-zip-${attachmentId}`));
    }

    getTestResultAttachmentContent(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        attachmentId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`result-attachment-${attachmentId}`));
    }

    getTestResultAttachments(
        _project: string,
        _runId: number,
        _testCaseResultId: number
    ): Promise<TestAttachment[]> {
        return Promise.resolve(attachments);
    }

    getTestResultAttachmentZip(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        attachmentId: number
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`result-attachment-zip-${attachmentId}`));
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

    getTestSubResultAttachments(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _testSubResultId: number
    ): Promise<TestAttachment[]> {
        return Promise.resolve(attachments);
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

    createTestRunAttachment(
        _attachmentRequestModel: TestAttachmentRequestModel,
        _project: string,
        _runId: number
    ): Promise<TestAttachmentReference> {
        return Promise.resolve(makeAttachmentRef());
    }

    deleteTestRunAttachment(_project: string, _runId: number, _attachmentId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestRunAttachmentContent(_project: string, _runId: number, attachmentId: number): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`run-attachment-${attachmentId}`));
    }

    getTestRunAttachments(_project: string, _runId: number): Promise<TestAttachment[]> {
        return Promise.resolve(attachments);
    }

    getTestRunAttachmentZip(_project: string, _runId: number, attachmentId: number): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`run-attachment-zip-${attachmentId}`));
    }

    createTestResultAttachmentMetadata(
        _attachmentMetadataRequestModel: {
            attachmentType: string;
            comment: string;
            dedupId: string;
            domainId: string;
            fileName: string;
            length: number;
        },
        _project: string,
        _runId: number,
        _testCaseResultId: number
    ): Promise<TestAttachmentReference> {
        return Promise.resolve(makeAttachmentRef());
    }

    createTestSubResultAttachmentMetadata(
        _attachmentMetadataRequestModel: {
            attachmentType: string;
            comment: string;
            dedupId: string;
            domainId: string;
            fileName: string;
            length: number;
        },
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _testSubResultId: number
    ): Promise<TestAttachmentReference> {
        return Promise.resolve(makeAttachmentRef());
    }

    queryTestResultAttachmentsMetadata(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _attachmentType?: string,
        fileNamePrefix?: string,
        attachmentId?: number,
        _fetchMetaData?: boolean
    ): Promise<(TestAttachment & { dedupId: string; domainId: string })[]> {
        return Promise.resolve(queryBlobAttachments(fileNamePrefix, attachmentId));
    }

    queryTestSubResultAttachmentsMetadata(
        _project: string,
        _runId: number,
        _testCaseResultId: number,
        _testSubResultId: number,
        _attachmentType?: string,
        fileNamePrefix?: string,
        attachmentId?: number,
        _fetchMetaData?: boolean
    ): Promise<(TestAttachment & { dedupId: string; domainId: string })[]> {
        return Promise.resolve(queryBlobAttachments(fileNamePrefix, attachmentId));
    }

    createTestRunAttachmentMetadata(
        _attachmentMetadataRequestModel: {
            attachmentType: string;
            comment: string;
            dedupId: string;
            domainId: string;
            fileName: string;
            length: number;
        },
        _project: string,
        _runId: number
    ): Promise<TestAttachmentReference> {
        return Promise.resolve(makeAttachmentRef());
    }

    queryTestRunAttachmentsMetadata(
        _project: string,
        _runId: number,
        _attachmentType?: string,
        fileNamePrefix?: string,
        attachmentId?: number,
        _fetchMetaData?: boolean
    ): Promise<(TestAttachment & { dedupId: string; domainId: string })[]> {
        return Promise.resolve(queryBlobAttachments(fileNamePrefix, attachmentId));
    }

    getTestRunAttachmentUploadDetails(
        _project: string,
        runId: number
    ): Promise<{ domainId: string; isBlobStoreUploadEnabled: boolean; testRunId: number }> {
        return Promise.resolve(makeTestAttachmentUploadDetails(runId));
    }

    getBugsLinkedToTestResult(
        _project: string,
        _runId: number,
        _testCaseResultId: number
    ): Promise<WorkItemReference[]> {
        return Promise.resolve(linkedBugs);
    }

    fetchSourceCodeCoverageReport(_project: string, _buildId: number): Promise<SourceViewBuildCoverage[]> {
        return Promise.resolve(sourceViewBuildCoverages);
    }

    getBuildCodeCoverage(_project: string, _buildId: number, _flags: number): Promise<BuildCoverage[]> {
        return Promise.resolve(buildCoverages);
    }

    getCodeCoverageSummary(_project: string, buildId: number, deltaBuildId?: number): Promise<CodeCoverageSummary> {
        const found = codeCoverageSummaries.find(summary => summary.build.id === String(buildId));
        const summary = found ?? makeCodeCoverageSummary(String(buildId));
        return Promise.resolve({
            ...summary,
            deltaBuild: deltaBuildId === undefined
                ? summary.deltaBuild
                : { ...makeShallowReference(), id: String(deltaBuildId) }
        });
    }

    updateCodeCoverageSummary(_project: string, _buildId: number, _coverageData?: CodeCoverageData): Promise<void> {
        return Promise.resolve();
    }

    getTestRunCodeCoverage(_project: string, runId: number, _flags: number): Promise<TestRunCoverage[]> {
        const scoped = testRunCoverages.map(coverage => ({
            ...coverage,
            testRun: { ...coverage.testRun, id: String(runId) }
        }));
        return Promise.resolve(scoped);
    }

    addCustomFields(newFields: CustomTestFieldDefinition[], _project: string): Promise<CustomTestFieldDefinition[]> {
        const added = newFields.map((field, index) => ({
            ...makeCustomTestFieldDefinition(field.scope),
            ...field,
            fieldId: index + 1
        }));
        return Promise.resolve(added);
    }

    queryCustomFields(_project: string, scopeFilter: CustomTestFieldScope): Promise<CustomTestFieldDefinition[]> {
        return Promise.resolve(customFields.filter(field => field.scope === scopeFilter));
    }

    deleteCustomFieldById(_project: string, _testExtensionFieldId: number): Promise<void> {
        return Promise.resolve();
    }

    updateCustomField(
        updateCustomTestField: CustomTestFieldUpdateDefinition,
        _project: string
    ): Promise<CustomTestFieldDefinition> {
        const found = customFields.find(field => field.fieldId === updateCustomTestField.fieldId);
        return Promise.resolve({
            ...(found ?? makeCustomTestFieldDefinition(CustomTestFieldScope.TestRun)),
            ...updateCustomTestField
        });
    }

    getFileLevelCodeCoverage(fileCoverageRequest: FileCoverageRequest, _project: string): Promise<string> {
        return Promise.resolve(`file-coverage-${fileCoverageRequest.filePath}`);
    }

    deleteFlakyTestCaseRefIdsByBranch(_project: string, _repositoryId: string, _branchInfo: BranchInfo): Promise<number> {
        return Promise.resolve(flakyBranchInfos.length);
    }

    getFlakyTestCaseRefIdsByBranch(
        _project: string,
        _repositoryId: string,
        branchInfo: BranchInfo
    ): Promise<TestCaseFlakinessBranchInfo[]> {
        return Promise.resolve(flakyBranchInfos.map(info => ({ ...info, flakyBranches: [branchInfo.branchName] })));
    }

    getFlakyTestResultsByBuildDefinitionId(
        _project: string,
        _buildDefinitionId: number,
        _minBuildCreatedDate: Date
    ): Promise<TestCaseResult[]> {
        return Promise.resolve(testResults);
    }

    getFlakyTestResultsByTestRun(_project: string, _runId: number): Promise<TestCaseResult[]> {
        return Promise.resolve(testResults);
    }

    getBranchesByFlakyTestCaseRefId(_project: string, testCaseReferenceId: number): Promise<TestCaseFlakinessBranchInfo> {
        const found = flakyBranchInfos.find(info => info.testCaseReferenceId === testCaseReferenceId);
        return Promise.resolve(found ?? { ...makeTestCaseFlakinessBranchInfo(), testCaseReferenceId });
    }

    queryTestResultHistory(filter: ResultsFilter, _project: string): Promise<TestResultHistory> {
        return Promise.resolve({ ...makeTestResultHistory(), groupByField: filter.groupBy });
    }

    getLatestTestResultsByTestCaseIds(
        query: { testCaseIds: number[] },
        _project: string
    ): Promise<
        {
            configurationId: number;
            dateCompleted: Date;
            dateStarted: Date;
            outcome: string;
            resultId: number;
            runId: number;
            testCaseId: number;
            testPointId: number;
        }[]
    > {
        return Promise.resolve(query.testCaseIds.map(makeTestCaseLatestResult));
    }

    getTestRunMessageLogs(_project: string, _runId: number): Promise<TestMessageLogDetails[]> {
        return Promise.resolve(testRunLogs);
    }

    getTestPipelineMetrics(
        _project: string,
        pipelineId: number,
        _stageName?: string,
        _phaseName?: string,
        _jobName?: string,
        _metricNames?: Metrics[],
        _groupByNode?: boolean
    ): Promise<PipelineTestMetrics> {
        const metrics = makePipelineTestMetrics();
        return Promise.resolve({ ...metrics, currentContext: { ...metrics.currentContext, pipelineId } });
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
        return Promise.resolve(groupsForFields(fields));
    }

    getResultGroupsByRelease(
        _project: string,
        _releaseId: number,
        _publishContext: string,
        _releaseEnvId?: number,
        fields?: string[],
        _continuationToken?: string
    ): Promise<PagedList<FieldDetailsForTestResults>> {
        return Promise.resolve(groupsForFields(fields));
    }

    queryTestResultsMetaData(
        testCaseReferenceIds: string[],
        _project: string,
        _detailsToInclude?: ResultMetaDataDetails
    ): Promise<TestResultMetaData[]> {
        const matched = testCaseReferenceIds.map(id => ({
            ...makeTestResultMetaData(),
            testCaseReferenceId: Number(id)
        }));
        return Promise.resolve(matched);
    }

    updateTestResultsMetaData(
        testResultMetaDataUpdateInput: TestResultMetaDataUpdateInput,
        _project: string,
        testCaseReferenceId: number
    ): Promise<TestResultMetaData> {
        return Promise.resolve({ ...makeTestResultMetaData(), ...testResultMetaDataUpdateInput, testCaseReferenceId });
    }

    getTestResultsByQuery(query: TestResultsQuery, _project: string): Promise<TestResultsQuery> {
        return Promise.resolve({ ...makeTestResultsQuery(), ...query });
    }

    getTestResultsByQueryWiql(
        _queryModel: QueryModel,
        _project: string,
        _includeResultDetails?: boolean,
        _includeIterationDetails?: boolean,
        skip?: number,
        top?: number
    ): Promise<TestCaseResult[]> {
        return Promise.resolve(paginate(testResults, skip, top));
    }

    addTestResultsToTestRun(results: TestCaseResult[], _project: string, _runId: number): Promise<TestCaseResult[]> {
        return Promise.resolve(results.map(result => ({ ...makeTestCaseResult(), ...result })));
    }

    getTestResultById(
        _project: string,
        _runId: number,
        testResultId: number,
        _detailsToInclude?: ResultDetails
    ): Promise<TestCaseResult> {
        return Promise.resolve(findResult(testResultId));
    }

    getTestResults(
        _project: string,
        _runId: number,
        _detailsToInclude?: ResultDetails,
        skip?: number,
        top?: number,
        _outcomes?: TestOutcome[],
        _newTestsOnly?: boolean
    ): Promise<TestCaseResult[]> {
        return Promise.resolve(paginate(testResults, skip, top));
    }

    updateTestResults(results: TestCaseResult[], _project: string, _runId: number): Promise<TestCaseResult[]> {
        const updated = results.map(result => ({
            ...makeTestCaseResult(),
            ...result,
            revision: result.revision + 1
        }));
        return Promise.resolve(updated);
    }

    getTestResultsByBuild(
        _project: string,
        _buildId: number,
        _publishContext?: string,
        _outcomes?: TestOutcome[],
        _top?: number,
        _continuationToken?: string
    ): Promise<PagedList<ShallowTestCaseResult>> {
        return Promise.resolve(shallowResults);
    }

    getTestResultsByPipeline(
        _project: string,
        _pipelineId: number,
        _stageName?: string,
        _phaseName?: string,
        _jobName?: string,
        _outcomes?: TestOutcome[],
        _includeAllBuildRuns?: boolean,
        _top?: number,
        _continuationToken?: string
    ): Promise<PagedList<ShallowTestCaseResult>> {
        return Promise.resolve(shallowResults);
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

    testResultsGroupDetails(
        _project: string,
        _pipelineId: number,
        _stageName?: string,
        _phaseName?: string,
        _jobName?: string,
        _shouldIncludeFailedAndAbortedResults?: boolean,
        _queryGroupSummaryForInProgress?: boolean
    ): Promise<TestResultsDetails> {
        return Promise.resolve(makeTestResultsDetails());
    }

    queryTestResultsReportForBuild(
        _project: string,
        buildId: number,
        _publishContext?: string,
        _includeFailureDetails?: boolean,
        _buildToCompare?: BuildReference
    ): Promise<TestResultSummary> {
        const context = makeTestResultsContext(TestResultsContextType.Build);
        return Promise.resolve(summaryFor({ ...context, build: { ...context.build, id: buildId } }));
    }

    queryTestResultsReportForPipeline(
        _project: string,
        pipelineId: number,
        _stageName?: string,
        _phaseName?: string,
        _jobName?: string,
        _includeFailureDetails?: boolean
    ): Promise<TestResultSummary> {
        const context = makeTestResultsContext(TestResultsContextType.Pipeline);
        return Promise.resolve(
            summaryFor({ ...context, pipelineReference: { ...context.pipelineReference, pipelineId } })
        );
    }

    queryTestResultsReportForRelease(
        _project: string,
        releaseId: number,
        releaseEnvId: number,
        _publishContext?: string,
        _includeFailureDetails?: boolean,
        _releaseToCompare?: ReleaseReference
    ): Promise<TestResultSummary> {
        const context = makeTestResultsContext(TestResultsContextType.Release);
        return Promise.resolve(
            summaryFor({ ...context, release: { ...context.release, id: releaseId, environmentId: releaseEnvId } })
        );
    }

    queryTestResultsSummaryForReleases(releases: ReleaseReference[], _project: string): Promise<TestResultSummary[]> {
        const summaries = releases.map(release => {
            const context = makeTestResultsContext(TestResultsContextType.Release);
            return summaryFor({ ...context, release: { ...context.release, ...release } });
        });
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

    createTestRun(testRun: RunCreateModel, _project: string): Promise<TestRun> {
        const run = makeTestRun();
        return Promise.resolve({
            ...run,
            name: testRun.name ?? run.name,
            isAutomated: testRun.automated ?? run.isAutomated
        });
    }

    deleteTestRun(_project: string, _runId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestRunById(
        _project: string,
        runId: number,
        _includeDetails?: boolean,
        _includeTags?: boolean
    ): Promise<TestRun> {
        return Promise.resolve(findRun(runId));
    }

    getTestRuns(
        _project: string,
        _buildUri?: string,
        _owner?: string,
        _tmiRunId?: string,
        _planId?: number,
        _includeRunDetails?: boolean,
        _automated?: boolean,
        skip?: number,
        top?: number
    ): Promise<TestRun[]> {
        return Promise.resolve(paginate(testRuns, skip, top));
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
        top?: number,
        _sortOrder?: TestRunSortOrderType,
        _continuationToken?: string
    ): Promise<PagedList<TestRun>> {
        const matched = queryableTestRuns.filter(run => {
            const updated = run.lastUpdatedDate.getTime();
            const inRange =
                updated >= minLastUpdatedDate.getTime() && updated <= maxLastUpdatedDate.getTime();
            return inRange && (state === undefined || run.state === TestRunState[state]);
        });
        return Promise.resolve(page(paginate(matched, 0, top)));
    }

    updateTestRun(runUpdateModel: RunUpdateModel, _project: string, runId: number): Promise<TestRun> {
        const run = findRun(runId);
        return Promise.resolve({
            ...run,
            name: runUpdateModel.name ?? run.name,
            comment: runUpdateModel.comment ?? run.comment,
            state: runUpdateModel.state ?? run.state
        });
    }

    getTestRunSummaryByOutcome(_project: string, runId: number): Promise<TestRunStatistic> {
        return Promise.resolve(findRunStatistic(runId));
    }

    getTestResultsSettings(_project: string, _settingsType?: TestResultsSettingsType): Promise<TestResultsSettings> {
        return Promise.resolve(testResultsSettings);
    }

    updatePipelinesTestSettings(
        testResultsUpdateSettings: TestResultsUpdateSettings,
        _project: string
    ): Promise<TestResultsSettings> {
        return Promise.resolve({ ...testResultsSettings, ...testResultsUpdateSettings });
    }

    getSimilarTestResults(
        _project: string,
        _runId: number,
        _testResultId: number,
        _testSubResultId: number,
        top?: number,
        _continuationToken?: string
    ): Promise<TestCaseResult[]> {
        return Promise.resolve(paginate(testResults, 0, top));
    }

    getTestRunStatistics(_project: string, runId: number): Promise<TestRunStatistic> {
        return Promise.resolve(findRunStatistic(runId));
    }

    getCoverageStatusBadge(
        _project: string,
        definition: string,
        branchName?: string,
        label?: string
    ): Promise<string> {
        const title = `${label ?? "coverage"}: ${definition}@${branchName ?? "main"}`;
        return Promise.resolve(`<svg xmlns="http://www.w3.org/2000/svg"><title>${title}</title></svg>`);
    }

    getTestTagsForBuild(_project: string, _buildId: number): Promise<TestTag[]> {
        return Promise.resolve(testTags);
    }

    getTestTagsForRelease(_project: string, _releaseId: number, _releaseEnvId: number): Promise<TestTag[]> {
        return Promise.resolve(testTags);
    }

    updateTestRunTags(testTagsUpdateModel: TestTagsUpdateModel, _project: string, _runId: number): Promise<TestTag[]> {
        const tagsFor = (operation: OperationType): TestTag[] =>
            testTagsUpdateModel.tags.filter(entry => entry.key === operation).flatMap(entry => entry.value);
        const removed = tagsFor(OperationType.Delete).map(tag => tag.name);
        const kept = [...testTags, ...tagsFor(OperationType.Add)].filter(tag => !removed.includes(tag.name));
        return Promise.resolve(kept);
    }

    getTestTagSummaryForBuild(_project: string, buildId: number): Promise<TestTagSummary> {
        return Promise.resolve(makeTestTagSummary(buildId, testTags));
    }

    getTestTagSummaryForRelease(_project: string, releaseId: number, _releaseEnvId: number): Promise<TestTagSummary> {
        return Promise.resolve(makeTestTagSummary(releaseId, testTags));
    }

    callbackTestAgent(request: TestAgentCallbackRequest, _project: string): Promise<boolean> {
        return Promise.resolve(request.success);
    }

    enhanceCoverage(_project: string, _repository: string, _pullRequestId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestAgentToken(): Promise<string> {
        return Promise.resolve(testAgentToken);
    }

    triggerTestAgent(_request: TestAgentTriggerRequest, _project: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    completeGitHubAuth(_project: string, code: string): Promise<string> {
        return Promise.resolve(`github-auth-${code}`);
    }

    generateTestPlanFromWorkItem(
        _generateTestPlanFromWorkItemModel: GenerateTestPlanFromWorkItemModel,
        _project: string,
        _workItemId: number
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    createBuildAttachmentInLogStore(
        _attachmentRequestModel: TestAttachmentRequestModel,
        _project: string,
        _buildId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    createTestRunLogStoreAttachment(
        attachmentRequestModel: TestAttachmentRequestModel,
        _project: string,
        _runId: number
    ): Promise<TestLogStoreAttachmentReference> {
        return Promise.resolve(makeTestLogStoreAttachmentReference(attachmentRequestModel.fileName));
    }

    deleteTestRunLogStoreAttachment(_project: string, _runId: number, _filename: string): Promise<void> {
        return Promise.resolve();
    }

    getTestRunLogStoreAttachmentContent(_project: string, _runId: number, filename: string): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`log-store-attachment-${filename}`));
    }

    getTestRunLogStoreAttachments(_project: string, _runId: number): Promise<TestLogStoreAttachment[]> {
        return Promise.resolve(logStoreAttachments);
    }

    getTestRunLogStoreAttachmentZip(_project: string, _runId: number, filename: string): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`log-store-attachment-zip-${filename}`));
    }

    createFailureType(
        testResultFailureType: TestResultFailureTypeRequestModel,
        _project: string
    ): Promise<TestResultFailureType> {
        return Promise.resolve({ ...makeTestResultFailureType(), ...testResultFailureType });
    }

    deleteFailureType(_project: string, _failureTypeId: number): Promise<void> {
        return Promise.resolve();
    }

    getFailureTypes(_project: string): Promise<TestResultFailureType[]> {
        return Promise.resolve(failureTypes);
    }

    queryTestHistory(filter: TestHistoryQuery, _project: string): Promise<TestHistoryQuery> {
        return Promise.resolve({ ...makeTestHistoryQuery(), ...filter });
    }

    getTestLogsForBuild(
        _project: string,
        buildId: number,
        type: TestLogType,
        _directoryPath?: string,
        fileNamePrefix?: string,
        _fetchMetaData?: boolean,
        top?: number,
        _continuationToken?: string
    ): Promise<PagedList<TestLog>> {
        return Promise.resolve(pageLogs(type, { buildId }, fileNamePrefix, top));
    }

    getTestResultLogs(
        _project: string,
        runId: number,
        resultId: number,
        type: TestLogType,
        _directoryPath?: string,
        fileNamePrefix?: string,
        _fetchMetaData?: boolean,
        top?: number,
        _continuationToken?: string
    ): Promise<PagedList<TestLog>> {
        return Promise.resolve(pageLogs(type, { runId, resultId }, fileNamePrefix, top));
    }

    getTestSubResultLogs(
        _project: string,
        runId: number,
        resultId: number,
        subResultId: number,
        type: TestLogType,
        _directoryPath?: string,
        fileNamePrefix?: string,
        _fetchMetaData?: boolean,
        top?: number,
        _continuationToken?: string
    ): Promise<PagedList<TestLog>> {
        return Promise.resolve(pageLogs(type, { runId, resultId, subResultId }, fileNamePrefix, top));
    }

    getTestRunLogs(
        _project: string,
        runId: number,
        type: TestLogType,
        _directoryPath?: string,
        fileNamePrefix?: string,
        _fetchMetaData?: boolean,
        top?: number,
        _continuationToken?: string
    ): Promise<PagedList<TestLog>> {
        return Promise.resolve(pageLogs(type, { runId }, fileNamePrefix, top));
    }

    getTestLogStoreEndpointDetailsForBuildLog(
        _project: string,
        _build: number,
        _type: TestLogType,
        _filePath: string
    ): Promise<TestLogStoreEndpointDetails> {
        return Promise.resolve(makeTestLogStoreEndpointDetails(TestLogStoreEndpointType.File));
    }

    testLogStoreEndpointDetailsForBuild(
        _project: string,
        _buildId: number,
        _testLogStoreOperationType: TestLogStoreOperationType
    ): Promise<TestLogStoreEndpointDetails> {
        return Promise.resolve(makeTestLogStoreEndpointDetails(TestLogStoreEndpointType.Root));
    }

    getTestLogStoreEndpointDetailsForResultLog(
        _project: string,
        _runId: number,
        _resultId: number,
        _type: TestLogType,
        _filePath: string
    ): Promise<TestLogStoreEndpointDetails> {
        return Promise.resolve(makeTestLogStoreEndpointDetails(TestLogStoreEndpointType.File));
    }

    getTestLogStoreEndpointDetailsForSubResultLog(
        _project: string,
        _runId: number,
        _resultId: number,
        _subResultId: number,
        _type: TestLogType,
        _filePath: string
    ): Promise<TestLogStoreEndpointDetails> {
        return Promise.resolve(makeTestLogStoreEndpointDetails(TestLogStoreEndpointType.File));
    }

    testLogStoreEndpointDetailsForResult(
        _project: string,
        _runId: number,
        _resultId: number,
        _subResultId: number,
        _filePath: string,
        _type: TestLogType
    ): Promise<TestLogStoreEndpointDetails> {
        return Promise.resolve(makeTestLogStoreEndpointDetails(TestLogStoreEndpointType.File));
    }

    getTestLogStoreEndpointDetailsForRunLog(
        _project: string,
        _runId: number,
        _type: TestLogType,
        _filePath: string
    ): Promise<TestLogStoreEndpointDetails> {
        return Promise.resolve(makeTestLogStoreEndpointDetails(TestLogStoreEndpointType.File));
    }

    testLogStoreEndpointDetailsForRun(
        _project: string,
        _runId: number,
        _testLogStoreOperationType: TestLogStoreOperationType,
        filePath?: string,
        _type?: TestLogType
    ): Promise<TestLogStoreEndpointDetails> {
        const endpointType = filePath === undefined ? TestLogStoreEndpointType.Root : TestLogStoreEndpointType.File;
        return Promise.resolve(makeTestLogStoreEndpointDetails(endpointType));
    }

    createTestSession(_session: TestResultsSession, _project: string): Promise<number> {
        return Promise.resolve(makeSessionId());
    }

    getTestSession(_project: string, buildId: number): Promise<TestResultsSession[]> {
        const scoped = testResultsSessions.map(session => ({
            ...session,
            sessionSourcePipeline: { ...session.sessionSourcePipeline, buildId }
        }));
        return Promise.resolve(scoped);
    }

    getTestSessionLayout(_project: string, _sessionId: string): Promise<any[]> {
        return Promise.resolve(sessionLayout);
    }

    updateTestSession(_session: TestResultsSession, _project: string, sessionId: number): Promise<number> {
        return Promise.resolve(sessionId);
    }

    createAnalysis(
        analysis: TestSessionAnalysis[],
        _project: string,
        _sessionId: number
    ): Promise<AnalysisFailureGroupReturn[]> {
        const groups = analysis.flatMap(entry => entry.analysisFailureGroups).map(group => ({
            analysisFailureGroupId: group.failureGroupId,
            failureGroupUid: group.uid
        }));
        return Promise.resolve(groups);
    }

    createEnvironment(_environments: TestSessionEnvironment[], _project: string): Promise<void> {
        return Promise.resolve();
    }

    createEnvironmentAndMachine(
        _sessionEnvironmentAndMachine: SessionEnvironmentAndMachine,
        _project: string,
        _sessionId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    getTestSessionLayoutBySessionId(_project: string, _sessionId: number): Promise<any[]> {
        return Promise.resolve(sessionLayout);
    }

    createNotification(
        notifications: TestSessionNotification[],
        _project: string,
        _sessionId: number
    ): Promise<number[]> {
        return Promise.resolve(notifications.map(makeSessionId));
    }

    getSessionNotifications(_project: string, _sessionId: number): Promise<TestSessionNotification[]> {
        return Promise.resolve(sessionNotifications);
    }

    addTestResultsToTestRunSession(
        results: TestCaseResult[],
        _project: string,
        _runId: number
    ): Promise<TestCaseResult[]> {
        return Promise.resolve(results.map(result => ({ ...makeTestCaseResult(), ...result })));
    }

    getTestSessionResults(
        _project: string,
        _runId: number,
        _detailsToInclude?: ResultDetails,
        skip?: number,
        top?: number,
        _outcomes?: TestOutcome[],
        _newTestsOnly?: boolean
    ): Promise<TestCaseResult[]> {
        return Promise.resolve(paginate(testResults, skip, top));
    }

    updateTestResultsToTestRunSession(results: TestCaseResult[], _project: string, _runId: number): Promise<number[]> {
        return Promise.resolve(results.map(result => result.id));
    }

    createTestResultMachines(_testResultMachines: TestResultMachine[], _project: string, _runId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestResultMachines(_project: string, _runId: number): Promise<TestResultMachine[]> {
        return Promise.resolve(testResultMachines);
    }

    getTestResultsByPipelineMRX(
        _project: string,
        _pipelineId: number,
        _stageName?: string,
        _phaseName?: string,
        _jobName?: string,
        _outcomes?: TestOutcome[],
        _includeAllBuildRuns?: boolean,
        top?: number,
        _continuationToken?: string
    ): Promise<PagedList<TestCaseResult>> {
        return Promise.resolve(page(paginate(testResults, 0, top)));
    }

    getTestRunsBySessionId(_project: string, _sessionId: number): Promise<number[]> {
        return Promise.resolve(sessionRunIds);
    }

    updateTestRunsBySessionId(testRunIds: TestSessionTestRun, _project: string, _sessionId: number): Promise<number[]> {
        return Promise.resolve(testRunIds.testRuns);
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

    getTestWeightedScoreByTestRun(
        _project: string,
        _runIds: string,
        _includeAllOutcomes?: boolean,
        _onlyFlakyResults?: boolean
    ): Promise<TestCaseResult[]> {
        return Promise.resolve(testResults);
    }

    addWorkItemToTestLinks(workItemToTestLinks: WorkItemToTestLinks, _project: string): Promise<WorkItemToTestLinks> {
        return Promise.resolve({ ...makeWorkItemToTestLinks(), ...workItemToTestLinks });
    }

    deleteTestMethodToWorkItemLink(_project: string, _testName: string, _workItemId: number): Promise<boolean> {
        return Promise.resolve(true);
    }

    queryTestMethodLinkedWorkItems(_project: string, testName: string): Promise<TestToWorkItemLinks> {
        const links = makeTestToWorkItemLinks();
        return Promise.resolve({ ...links, test: { ...links.test, name: testName } });
    }

    getTestResultWorkItemsById(
        _project: string,
        _runId: number,
        _testCaseResultId: number
    ): Promise<WorkItemReference[]> {
        return Promise.resolve(workItemRefs);
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
        return Promise.resolve(paginate(categorised, 0, workItemCount));
    }
}
