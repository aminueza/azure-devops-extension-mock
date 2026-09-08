import {
    CustomTestFieldScope,
    TestRestClient,
    TestResultsContextType,
    TestRunState
} from "azure-devops-extension-api/Test";
import { getClient } from "../azure-devops-extension-api";
import {
    buildCoverages,
    codeCoverageSummaries,
    resultGroups,
    resultRetentionSettings,
    resultTrendData,
    testRunLogs,
    workItemRefs
} from "../azure-devops-extension-api/test/Data";

describe("TestRestClient mock coverage, custom fields, retention and reporting", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(TestRestClient);

    const coverageData = { buildFlavor: "Debug", buildPlatform: "x64", coverageStats: [] } as any;
    const newFields = [{ fieldName: "flakyOwner", fieldType: 1, scope: CustomTestFieldScope.TestRun }] as any;
    const resultsFilter = { automatedTestName: "Suite.Test", groupBy: "Branch", trendDays: 7 } as any;
    const historyFilter = { automatedTestName: "Suite.Test", branch: "main", trendDays: 7 } as any;
    const resultDocument = {
        operationReference: { id: "seed", status: "Queued", url: "https://example.test/op" },
        payload: { comment: "nightly", name: "nightly-doc", stream: "QUJD" }
    } as any;
    const retentionSettings = {
        automatedResultsRetentionDuration: 11,
        manualResultsRetentionDuration: 22
    } as any;
    const releases = [{ id: 51, environmentId: 61 }, { id: 52, environmentId: 62 }] as any;
    const resultsContext = { contextType: TestResultsContextType.Build } as any;
    const trendFilter = { buildCount: 2, definitionIds: [1], publishContext: "CI" } as any;
    const minDate = new Date("2024-01-01T00:00:00.000Z");
    const maxDate = new Date("2024-12-31T00:00:00.000Z");

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getBuildCodeCoverage", () => client.getBuildCodeCoverage("proj", 4001, 7)],
        ["getCodeCoverageSummary", () => client.getCodeCoverageSummary("proj", 4001)],
        ["getTestRunCodeCoverage", () => client.getTestRunCodeCoverage("proj", 1, 7)],
        ["getTestRunLogs", () => client.getTestRunLogs("proj", 1)],
        ["getTestRunStatistics", () => client.getTestRunStatistics("proj", 5001)],
        ["queryTestRuns", () => client.queryTestRuns("proj", minDate, maxDate)],
        ["getResultGroupsByBuild", () => client.getResultGroupsByBuild("proj", 4001, "CI")],
        ["getResultGroupsByRelease", () => client.getResultGroupsByRelease("proj", 51, "CD", 61)],
        ["getResultRetentionSettings", () => client.getResultRetentionSettings("proj")],
        ["updateResultRetentionSettings", () => client.updateResultRetentionSettings(retentionSettings, "proj")],
        ["addCustomFields", () => client.addCustomFields(newFields, "proj")],
        ["queryCustomFields", () => client.queryCustomFields("proj", CustomTestFieldScope.TestRun)],
        ["queryResultTrendForBuild", () => client.queryResultTrendForBuild(trendFilter, "proj")],
        ["queryResultTrendForRelease", () => client.queryResultTrendForRelease(trendFilter, "proj")],
        ["queryTestHistory", () => client.queryTestHistory(historyFilter, "proj")],
        ["queryTestResultHistory", () => client.queryTestResultHistory(resultsFilter, "proj")],
        ["queryTestResultsMetaData", () => client.queryTestResultsMetaData(["101", "102"], "proj")],
        ["queryTestResultsReportForBuild", () => client.queryTestResultsReportForBuild("proj", 4001)],
        ["queryTestResultsReportForRelease", () => client.queryTestResultsReportForRelease("proj", 51, 61)],
        ["queryTestResultsSummaryForReleases", () => client.queryTestResultsSummaryForReleases(releases, "proj")],
        ["queryTestSummaryByRequirement", () => client.queryTestSummaryByRequirement(resultsContext, "proj", [1, 2])],
        ["publishTestResultDocument", () => client.publishTestResultDocument(resultDocument, "proj", 1)]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["updateCodeCoverageSummary", () => client.updateCodeCoverageSummary(coverageData, "proj", 4001)]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("returns the build coverage fixture", async () => {
        await expect(client.getBuildCodeCoverage("proj", 4001, 7)).resolves.toBe(buildCoverages);
    });

    it("returns the run log fixture", async () => {
        await expect(client.getTestRunLogs("proj", 1)).resolves.toBe(testRunLogs);
    });

    it("returns the retention settings fixture", async () => {
        await expect(client.getResultRetentionSettings("proj")).resolves.toBe(resultRetentionSettings);
    });

    it("echoes updated retention settings over a fixture", async () => {
        const updated = await client.updateResultRetentionSettings(retentionSettings, "proj");
        expect(updated.automatedResultsRetentionDuration).toBe(11);
        expect(updated.manualResultsRetentionDuration).toBe(22);
        expect(updated.lastUpdatedBy).toBeDefined();
    });

    it("scopes run coverage to the requested run", async () => {
        const coverages = await client.getTestRunCodeCoverage("proj", 8123, 7);
        expect(coverages).toHaveLength(2);
        expect(coverages.map(coverage => coverage.testRun.id)).toEqual(["8123", "8123"]);
    });

    it("finds a seeded code coverage summary", async () => {
        const summary = await client.getCodeCoverageSummary("proj", 4001);
        expect(summary.build).toBe(codeCoverageSummaries[0].build);
        expect(summary.deltaBuild).toBe(codeCoverageSummaries[0].deltaBuild);
    });

    it("builds a code coverage summary for an unknown build", async () => {
        const summary = await client.getCodeCoverageSummary("proj", 9999);
        expect(summary.build.id).toBe("9999");
        expect(codeCoverageSummaries.map(entry => entry.build.id)).not.toContain("9999");
    });

    it("overrides the delta build when a delta id is supplied", async () => {
        const summary = await client.getCodeCoverageSummary("proj", 4001, 8888);
        expect(summary.deltaBuild.id).toBe("8888");
        expect(summary.deltaBuild).not.toBe(codeCoverageSummaries[0].deltaBuild);
    });

    it("finds seeded run statistics", async () => {
        const statistic = await client.getTestRunStatistics("proj", 5001);
        expect(statistic.run.id).toBe("5001");
        expect(statistic.runStatistics).toHaveLength(1);
    });

    it("builds run statistics for an unknown run", async () => {
        const statistic = await client.getTestRunStatistics("proj", 7777);
        expect(statistic.run.id).toBe("7777");
    });

    it("returns the fixture result groups when no fields are requested", async () => {
        const groups = await client.getResultGroupsByBuild("proj", 4001, "CI");
        expect([...groups]).toEqual(resultGroups);
        expect(groups.continuationToken).toBeNull();
    });

    it("maps requested field names for build result groups", async () => {
        const groups = await client.getResultGroupsByBuild("proj", 4001, "CI", ["Owner", "Priority"], "tok");
        expect(groups.map(group => group.fieldName)).toEqual(["Owner", "Priority"]);
    });

    it("returns the fixture result groups for a release when no fields are requested", async () => {
        const groups = await client.getResultGroupsByRelease("proj", 51, "CD", 61);
        expect([...groups]).toEqual(resultGroups);
        expect(groups.continuationToken).toBeNull();
    });

    it("maps requested field names for release result groups", async () => {
        const groups = await client.getResultGroupsByRelease("proj", 51, "CD", 61, ["Container"], "tok");
        expect(groups.map(group => group.fieldName)).toEqual(["Container"]);
    });

    it("numbers added custom fields and keeps the supplied scope", async () => {
        const added = await client.addCustomFields(newFields, "proj");
        expect(added).toHaveLength(1);
        expect(added[0].fieldId).toBe(1);
        expect(added[0].fieldName).toBe("flakyOwner");
        expect(added[0].scope).toBe(CustomTestFieldScope.TestRun);
    });

    it("filters custom fields by scope", async () => {
        const runFields = await client.queryCustomFields("proj", CustomTestFieldScope.TestRun);
        const resultFields = await client.queryCustomFields("proj", CustomTestFieldScope.TestResult);
        const noneFields = await client.queryCustomFields("proj", CustomTestFieldScope.None);
        expect(runFields).toHaveLength(2);
        expect(resultFields).toHaveLength(1);
        expect(noneFields).toHaveLength(0);
    });

    it("echoes the group by field on result history", async () => {
        const history = await client.queryTestResultHistory(resultsFilter, "proj");
        expect(history.groupByField).toBe("Branch");
        expect(history.resultsForGroup).toHaveLength(1);
    });

    it("echoes the filter on test history", async () => {
        const history = await client.queryTestHistory(historyFilter, "proj");
        expect(history.automatedTestName).toBe("Suite.Test");
        expect(history.branch).toBe("main");
        expect(history.resultsForGroup).toHaveLength(1);
    });

    it("echoes the payload and stamps the run id on a published document", async () => {
        const published = await client.publishTestResultDocument(resultDocument, "proj", 4242);
        expect(published.payload).toBe(resultDocument.payload);
        expect(published.operationReference.id).toBe("4242");
        expect(published.operationReference.status).toBeDefined();
    });

    it("maps reference ids onto result meta data", async () => {
        const metaData = await client.queryTestResultsMetaData(["101", "102"], "proj");
        expect(metaData.map(entry => entry.testCaseReferenceId)).toEqual([101, 102]);
    });

    it("stamps the build context on a build report", async () => {
        const summary = await client.queryTestResultsReportForBuild("proj", 4001, "CI", true);
        const context = summary.testResultsContext as any;
        expect(context.contextType).toBe(TestResultsContextType.Build);
        expect(context.build.id).toBe(4001);
        expect(summary.aggregatedResultsAnalysis).toBeDefined();
    });

    it("stamps the release context on a release report", async () => {
        const summary = await client.queryTestResultsReportForRelease("proj", 51, 61, "CD", false);
        const context = summary.testResultsContext as any;
        expect(context.contextType).toBe(TestResultsContextType.Release);
        expect(context.release.id).toBe(51);
        expect(context.release.environmentId).toBe(61);
    });

    it("returns one summary per requested release", async () => {
        const summaries = await client.queryTestResultsSummaryForReleases(releases, "proj");
        expect(summaries).toHaveLength(2);
        expect((summaries[0].testResultsContext as any).release).toBe(releases[0]);
        expect((summaries[1].testResultsContext as any).release).toBe(releases[1]);
    });

    it("summarises the requested work items by requirement", async () => {
        const summaries = await client.queryTestSummaryByRequirement(resultsContext, "proj", [1, 2]);
        expect(summaries.map(entry => entry.workItem.id)).toEqual(["1", "2"]);
        expect(summaries[0].summary.testResultsContext).toBe(resultsContext);
    });

    it("falls back to the work item fixture when no ids are supplied", async () => {
        const summaries = await client.queryTestSummaryByRequirement(resultsContext, "proj");
        expect(summaries.map(entry => entry.workItem.id)).toEqual(workItemRefs.map(ref => ref.id));
    });

    it("limits the build result trend to the requested build count", async () => {
        const trend = await client.queryResultTrendForBuild(trendFilter, "proj");
        expect(trend).toEqual(resultTrendData.slice(0, 2));
    });

    it("limits the release result trend to the requested build count", async () => {
        const trend = await client.queryResultTrendForRelease({ ...trendFilter, buildCount: 3 }, "proj");
        expect(trend).toEqual(resultTrendData.slice(0, 3));
    });

    it("returns every seeded run inside a wide date range", async () => {
        const runs = await client.queryTestRuns("proj", minDate, maxDate);
        expect(runs.map(run => run.id)).toEqual([9001, 9002, 9003, 9004]);
        expect(runs.continuationToken).toBeNull();
    });

    it("filters runs by state", async () => {
        const completed = await client.queryTestRuns("proj", minDate, maxDate, TestRunState.Completed);
        const aborted = await client.queryTestRuns("proj", minDate, maxDate, TestRunState.Aborted);
        const inProgress = await client.queryTestRuns("proj", minDate, maxDate, TestRunState.InProgress);
        expect(completed.map(run => run.id)).toEqual([9001, 9002]);
        expect(aborted.map(run => run.id)).toEqual([9003]);
        expect(inProgress.map(run => run.id)).toEqual([9004]);
    });

    it("excludes runs updated before the minimum date", async () => {
        const runs = await client.queryTestRuns("proj", new Date("2024-03-01T00:00:00.000Z"), maxDate);
        expect(runs.map(run => run.id)).toEqual([9003, 9004]);
    });

    it("excludes runs updated after the maximum date", async () => {
        const runs = await client.queryTestRuns("proj", minDate, new Date("2024-01-31T00:00:00.000Z"));
        expect(runs.map(run => run.id)).toEqual([9001]);
    });

    it("returns no runs when the range matches nothing", async () => {
        const runs = await client.queryTestRuns(
            "proj",
            new Date("2025-01-01T00:00:00.000Z"),
            new Date("2025-12-31T00:00:00.000Z"),
            TestRunState.Completed,
            [1],
            true
        );
        expect(runs).toHaveLength(0);
    });
});
