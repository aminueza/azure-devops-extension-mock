import {
    ResultDetails,
    TestOutcome,
    TestResultsContextType,
    TestRunSortOrderType,
    TestRunState
} from "azure-devops-extension-api/Test";
import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
import { getClient } from "../azure-devops-extension-api";
import {
    resultTrendData,
    shallowResults,
    testResults,
    testRuns,
    testRunStatistics,
    workItemRefs
} from "../azure-devops-extension-api/test/Data";
import { testResultsSettings } from "../azure-devops-extension-api/testResults/Data";

describe("TestResultsRestClient mock results, runs and reports", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(TestResultsRestClient);

    const minDate = new Date("2024-01-01T00:00:00.000Z");
    const maxDate = new Date("2024-12-31T00:00:00.000Z");
    const posted = [{ id: 71, revision: 4, testCaseTitle: "posted" }] as any;

    it("gets test result details for a build, a release and a pipeline", async () => {
        const forBuild = await client.getTestResultDetailsForBuild("proj", 1, "CI", "TestRun", "", "", true, false);
        const forRelease = await client.getTestResultDetailsForRelease("proj", 1, 2, "CD", "TestRun", "", "", true, false);
        const forPipeline = await client.testResultsGroupDetails("proj", 1, "stage", "phase", "job", true, false);
        for (const details of [forBuild, forRelease, forPipeline]) {
            expect(details.groupByField).toBe("TestRun");
            expect(details.resultsForGroup.length).toBe(1);
        }
    });

    it("echoes a results query over a fixture", async () => {
        const query = await client.getTestResultsByQuery({ fields: ["Outcome"] } as any, "proj");
        expect(query.fields).toEqual(["Outcome"]);
        expect(query.results.length).toBe(1);
    });

    it("gets test results by WIQL with paging", async () => {
        await expect(client.getTestResultsByQueryWiql({ query: "SELECT *" }, "proj")).resolves.toEqual(testResults);
        const paged = await client.getTestResultsByQueryWiql({ query: "SELECT *" }, "proj", true, true, 2, 3);
        expect(paged).toEqual(testResults.slice(2, 5));
    });

    it("adds test results to a test run", async () => {
        const added = await client.addTestResultsToTestRun(posted, "proj", 1);
        expect(added.length).toBe(1);
        expect(added[0].id).toBe(71);
        expect(added[0].testCaseTitle).toBe("posted");
        expect(typeof added[0].automatedTestName).toBe("string");
    });

    it("gets a seeded test result by id", async () => {
        const target = testResults[3];
        const found = await client.getTestResultById("proj", 1, target.id, ResultDetails.Iterations);
        expect(found.id).toBe(target.id);
    });

    it("fabricates a test result for an unknown id", async () => {
        const found = await client.getTestResultById("proj", 1, -44);
        expect(found.id).toBe(-44);
        expect(typeof found.testCaseTitle).toBe("string");
    });

    it("gets test results with paging", async () => {
        await expect(client.getTestResults("proj", 1)).resolves.toEqual(testResults);
        const paged = await client.getTestResults("proj", 1, ResultDetails.None, 1, 2, [TestOutcome.Passed], false);
        expect(paged).toEqual(testResults.slice(1, 3));
        const skipped = await client.getTestResults("proj", 1, ResultDetails.None, 8);
        expect(skipped).toEqual(testResults.slice(8));
    });

    it("updates test results and bumps the revision", async () => {
        const updated = await client.updateTestResults(posted, "proj", 1);
        expect(updated[0].id).toBe(71);
        expect(updated[0].revision).toBe(5);
    });

    it("gets shallow results by build, pipeline and release", async () => {
        await expect(client.getTestResultsByBuild("proj", 1, "CI", [TestOutcome.Failed], 5, "token")).resolves.toBe(shallowResults);
        await expect(
            client.getTestResultsByPipeline("proj", 1, "stage", "phase", "job", [TestOutcome.Failed], true, 5, "token")
        ).resolves.toBe(shallowResults);
        await expect(client.getTestResultsByRelease("proj", 1, 2, "CD", [TestOutcome.Failed], 5, "token")).resolves.toBe(shallowResults);
    });

    it("reports test results for a build", async () => {
        const summary = await client.queryTestResultsReportForBuild("proj", 4001, "CI", true);
        expect(summary.testResultsContext.contextType).toBe(TestResultsContextType.Build);
        expect(summary.testResultsContext.build.id).toBe(4001);
        expect(typeof summary.totalRunsCount).toBe("number");
    });

    it("reports test results for a pipeline", async () => {
        const summary = await client.queryTestResultsReportForPipeline("proj", 606, "stage", "phase", "job", true);
        expect(summary.testResultsContext.contextType).toBe(TestResultsContextType.Pipeline);
        expect(summary.testResultsContext.pipelineReference.pipelineId).toBe(606);
        expect(typeof summary.testResultsContext.pipelineReference.jobReference.jobName).toBe("string");
    });

    it("reports test results for a release", async () => {
        const summary = await client.queryTestResultsReportForRelease("proj", 51, 61, "CD", true);
        expect(summary.testResultsContext.contextType).toBe(TestResultsContextType.Release);
        expect(summary.testResultsContext.release.id).toBe(51);
        expect(summary.testResultsContext.release.environmentId).toBe(61);
    });

    it("summarises test results for releases", async () => {
        const releases = [{ id: 51, environmentId: 61 }, { id: 52, environmentId: 62 }] as any;
        const summaries = await client.queryTestResultsSummaryForReleases(releases, "proj");
        expect(summaries.map(summary => summary.testResultsContext.release.id)).toEqual([51, 52]);
        expect(summaries.map(summary => summary.testResultsContext.release.environmentId)).toEqual([61, 62]);
        expect(typeof summaries[0].testResultsContext.release.name).toBe("string");
    });

    it("summarises tests by requirement", async () => {
        const context = { contextType: TestResultsContextType.Build } as any;
        const chosen = await client.queryTestSummaryByRequirement(context, "proj", [1, 2]);
        expect(chosen.map(summary => summary.workItem.id)).toEqual(["1", "2"]);
        expect(chosen[0].summary.testResultsContext).toBe(context);
        const seeded = await client.queryTestSummaryByRequirement(context, "proj");
        expect(seeded.map(summary => summary.workItem.id)).toEqual(workItemRefs.map(ref => String(Number(ref.id))));
    });

    it("queries result trends", async () => {
        const filter = { buildCount: 2, definitionIds: [1], publishContext: "CI" } as any;
        await expect(client.queryResultTrendForBuild(filter, "proj")).resolves.toEqual(resultTrendData.slice(0, 2));
        await expect(client.queryResultTrendForRelease(filter, "proj")).resolves.toEqual(resultTrendData.slice(0, 2));
    });

    it("creates a test run from the posted model", async () => {
        const run = await client.createTestRun({ name: "Nightly", automated: false } as any, "proj");
        expect(run.name).toBe("Nightly");
        expect(run.isAutomated).toBe(false);
        expect(typeof run.id).toBe("number");
    });

    it("creates a test run with fixture defaults", async () => {
        const run = await client.createTestRun({} as any, "proj");
        expect(run.name.startsWith("Test Run ")).toBe(true);
        expect(run.isAutomated).toBe(true);
    });

    it("deletes a test run", async () => {
        await expect(client.deleteTestRun("proj", 1)).resolves.toBeUndefined();
    });

    it("gets a seeded test run by id", async () => {
        const target = testRuns[2];
        const found = await client.getTestRunById("proj", target.id, true, true);
        expect(found.id).toBe(target.id);
    });

    it("fabricates a test run for an unknown id", async () => {
        const found = await client.getTestRunById("proj", -12);
        expect(found.id).toBe(-12);
        expect(typeof found.name).toBe("string");
    });

    it("gets test runs with paging", async () => {
        await expect(client.getTestRuns("proj")).resolves.toEqual(testRuns);
        const paged = await client.getTestRuns("proj", "uri", "owner", "tmi", 1, true, true, 1, 2);
        expect(paged).toEqual(testRuns.slice(1, 3));
    });

    it("queries test runs in a date range", async () => {
        const runs = await client.queryTestRuns("proj", minDate, maxDate);
        expect(runs.map(run => run.id)).toEqual([9001, 9002, 9003, 9004]);
        expect(runs.continuationToken).toBeNull();
        const early = await client.queryTestRuns("proj", minDate, new Date("2024-03-01T00:00:00.000Z"));
        expect(early.map(run => run.id)).toEqual([9001, 9002]);
        const late = await client.queryTestRuns("proj", new Date("2024-03-01T00:00:00.000Z"), maxDate);
        expect(late.map(run => run.id)).toEqual([9003, 9004]);
    });

    it("queries test runs by state, top and sort order", async () => {
        const completed = await client.queryTestRuns("proj", minDate, maxDate, TestRunState.Completed);
        expect(completed.map(run => run.id)).toEqual([9001, 9002]);
        const top = await client.queryTestRuns(
            "proj", minDate, maxDate, undefined, [1], true, undefined, [1], [1], "main", [1], [1], [1], [1], "title", 3,
            TestRunSortOrderType.Desc, "token"
        );
        expect(top.map(run => run.id)).toEqual([9001, 9002, 9003]);
    });

    it("updates a seeded test run with the posted fields", async () => {
        const target = testRuns[0];
        const updated = await client.updateTestRun(
            { name: "Renamed", comment: "done", state: "Aborted" } as any,
            "proj",
            target.id
        );
        expect(updated.id).toBe(target.id);
        expect(updated.name).toBe("Renamed");
        expect(updated.comment).toBe("done");
        expect(updated.state).toBe("Aborted");
        expect(updated.url).toBe(target.url);
    });

    it("updates an unknown test run keeping fixture values", async () => {
        const updated = await client.updateTestRun({} as any, "proj", -31);
        expect(updated.id).toBe(-31);
        expect(updated.name.startsWith("Test Run ")).toBe(true);
        expect(typeof updated.comment).toBe("string");
        expect(updated.state).toBeDefined();
    });

    it("gets run statistics and the summary by outcome", async () => {
        await expect(client.getTestRunStatistics("proj", 5001)).resolves.toBe(testRunStatistics[0]);
        await expect(client.getTestRunSummaryByOutcome("proj", 5002)).resolves.toBe(testRunStatistics[1]);
        const fabricated = await client.getTestRunStatistics("proj", 77);
        expect(fabricated.run.id).toBe("77");
        const summary = await client.getTestRunSummaryByOutcome("proj", 78);
        expect(summary.run.id).toBe("78");
    });

    it("gets and updates the test results settings", async () => {
        await expect(client.getTestResultsSettings("proj")).resolves.toBe(testResultsSettings);
        const updated = await client.updatePipelinesTestSettings(
            { newTestResultLoggingSettings: { logNewTests: false } } as any,
            "proj"
        );
        expect(updated.newTestResultLoggingSettings.logNewTests).toBe(false);
        expect(updated.flakySettings).toBe(testResultsSettings.flakySettings);
        expect(updated.advancedFlakyDetectionSettings.weightedScores.length).toBe(1);
    });

    it("gets similar test results", async () => {
        await expect(client.getSimilarTestResults("proj", 1, 2, 3)).resolves.toEqual(testResults);
        await expect(client.getSimilarTestResults("proj", 1, 2, 3, 4, "token")).resolves.toEqual(testResults.slice(0, 4));
    });

    it("gets the coverage status badge", async () => {
        const defaults = await client.getCoverageStatusBadge("proj", "ci-build");
        expect(defaults).toContain("<title>coverage: ci-build@main</title>");
        const labelled = await client.getCoverageStatusBadge("proj", "ci-build", "release", "lines");
        expect(labelled).toContain("<title>lines: ci-build@release</title>");
        expect(labelled.startsWith("<svg")).toBe(true);
    });

    it("gets the weighted score by test run", async () => {
        await expect(client.getTestWeightedScoreByTestRun("proj", "1,2", true, false)).resolves.toBe(testResults);
    });
});
