import { BranchType, CustomTestFieldScope, CustomTestFieldType, Metrics, ResultMetaDataDetails } from "azure-devops-extension-api/Test";
import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
import { getClient } from "../azure-devops-extension-api";
import {
    buildCoverages,
    codeCoverageSummaries,
    customFields,
    linkedBugs,
    resultGroups,
    testResults,
    testRunLogs
} from "../azure-devops-extension-api/test/Data";
import { flakyBranchInfos, sourceViewBuildCoverages } from "../azure-devops-extension-api/testResults/Data";

describe("TestResultsRestClient mock coverage, custom fields, flakiness and metadata", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(TestResultsRestClient);

    const branchInfo = { branchName: "refs/heads/main", branchType: BranchType.Heads };

    it("gets the AFD endpoint for a key", async () => {
        const endpoint = await client.getAfdTcmEndpoint("tcm-key");
        expect(endpoint.startsWith("https://")).toBe(true);
        expect(endpoint.endsWith("/tcm-key")).toBe(true);
    });

    it("gets bugs linked to a test result", async () => {
        await expect(client.getBugsLinkedToTestResult("proj", 1, 2)).resolves.toBe(linkedBugs);
    });

    it("fetches the source code coverage report", async () => {
        const report = await client.fetchSourceCodeCoverageReport("proj", 4001);
        expect(report).toBe(sourceViewBuildCoverages);
        expect(report.length).toBe(2);
        expect(typeof report[0].configuration.id).toBe("number");
        expect(report[0].folderCoverageData.folders.length).toBe(1);
        expect(report[0].folderCoverageData.files.length).toBe(2);
    });

    it("gets build code coverage", async () => {
        await expect(client.getBuildCodeCoverage("proj", 4001, 7)).resolves.toBe(buildCoverages);
    });

    it("gets the seeded code coverage summary", async () => {
        const summary = await client.getCodeCoverageSummary("proj", 4001);
        expect(summary).toEqual(codeCoverageSummaries[0]);
    });

    it("fabricates a code coverage summary and applies the delta build", async () => {
        const summary = await client.getCodeCoverageSummary("proj", 999, 998);
        expect(summary.build.id).toBe("999");
        expect(summary.deltaBuild.id).toBe("998");
    });

    it("updates the code coverage summary", async () => {
        await expect(client.updateCodeCoverageSummary("proj", 4001)).resolves.toBeUndefined();
        const coverageData = { buildFlavor: "Debug", buildPlatform: "x64", coverageStats: [] };
        await expect(client.updateCodeCoverageSummary("proj", 4001, coverageData)).resolves.toBeUndefined();
    });

    it("scopes test run code coverage to the run", async () => {
        const coverage = await client.getTestRunCodeCoverage("proj", 31, 7);
        expect(coverage.length).toBeGreaterThan(0);
        for (const entry of coverage) {
            expect(entry.testRun.id).toBe("31");
        }
    });

    it("adds custom fields", async () => {
        const added = await client.addCustomFields(
            [{ fieldId: 0, fieldName: "flakyOwner", fieldType: CustomTestFieldType.String, scope: CustomTestFieldScope.TestRun }],
            "proj"
        );
        expect(added).toEqual([
            { fieldId: 1, fieldName: "flakyOwner", fieldType: CustomTestFieldType.String, scope: CustomTestFieldScope.TestRun }
        ]);
    });

    it("queries custom fields by scope", async () => {
        const fields = await client.queryCustomFields("proj", CustomTestFieldScope.TestResult);
        expect(fields).toEqual(customFields.filter(field => field.scope === CustomTestFieldScope.TestResult));
        expect(fields.length).toBe(1);
    });

    it("deletes a custom field", async () => {
        await expect(client.deleteCustomFieldById("proj", 5)).resolves.toBeUndefined();
    });

    it("updates a seeded custom field", async () => {
        const target = customFields[0];
        const updated = await client.updateCustomField({ fieldId: target.fieldId, fieldName: "renamed" }, "proj");
        expect(updated).toEqual({ ...target, fieldName: "renamed" });
    });

    it("updates an unknown custom field over a fixture", async () => {
        const updated = await client.updateCustomField({ fieldId: -5, fieldName: "fresh" }, "proj");
        expect(updated.fieldId).toBe(-5);
        expect(updated.fieldName).toBe("fresh");
        expect(updated.scope).toBe(CustomTestFieldScope.TestRun);
    });

    it("gets file level code coverage as text", async () => {
        const text = await client.getFileLevelCodeCoverage(
            { filePath: "/src/app.ts", pullRequestBaseIterationId: 1, pullRequestId: 2, pullRequestIterationId: 3, repoId: "repo" },
            "proj"
        );
        expect(text).toBe("file-coverage-/src/app.ts");
    });

    it("deletes flaky test case references by branch", async () => {
        await expect(client.deleteFlakyTestCaseRefIdsByBranch("proj", "repo", branchInfo)).resolves.toBe(flakyBranchInfos.length);
    });

    it("gets flaky test case references for a branch", async () => {
        const infos = await client.getFlakyTestCaseRefIdsByBranch("proj", "repo", branchInfo);
        expect(infos.map(info => info.testCaseReferenceId)).toEqual(flakyBranchInfos.map(info => info.testCaseReferenceId));
        for (const info of infos) {
            expect(info.flakyBranches).toEqual(["refs/heads/main"]);
        }
    });

    it("gets flaky test results", async () => {
        await expect(client.getFlakyTestResultsByBuildDefinitionId("proj", 12, new Date())).resolves.toBe(testResults);
        await expect(client.getFlakyTestResultsByTestRun("proj", 1)).resolves.toBe(testResults);
    });

    it("gets the branches of a seeded flaky test case reference", async () => {
        const target = flakyBranchInfos[1];
        await expect(client.getBranchesByFlakyTestCaseRefId("proj", target.testCaseReferenceId)).resolves.toBe(target);
    });

    it("fabricates the branches of an unknown flaky test case reference", async () => {
        const info = await client.getBranchesByFlakyTestCaseRefId("proj", -9);
        expect(info.testCaseReferenceId).toBe(-9);
        expect(info.lastRefTestRunDate).toBeInstanceOf(Date);
        expect(info.flakyBranches.length).toBe(1);
    });

    it("queries test result history grouped by the filter", async () => {
        const history = await client.queryTestResultHistory({ groupBy: "Environment" } as any, "proj");
        expect(history.groupByField).toBe("Environment");
        expect(history.resultsForGroup.length).toBe(1);
    });

    it("gets the latest result for each test case id", async () => {
        const latest = await client.getLatestTestResultsByTestCaseIds({ testCaseIds: [11, 12] }, "proj");
        expect(latest.map(result => result.testCaseId)).toEqual([11, 12]);
        for (const result of latest) {
            expect(typeof result.outcome).toBe("string");
            expect(typeof result.resultId).toBe("number");
            expect(typeof result.runId).toBe("number");
            expect(typeof result.testPointId).toBe("number");
            expect(typeof result.configurationId).toBe("number");
            expect(result.dateStarted).toBeInstanceOf(Date);
            expect(result.dateCompleted).toBeInstanceOf(Date);
        }
    });

    it("gets test run message logs", async () => {
        await expect(client.getTestRunMessageLogs("proj", 1)).resolves.toBe(testRunLogs);
    });

    it("gets pipeline test metrics for the pipeline", async () => {
        const metrics = await client.getTestPipelineMetrics("proj", 808, "stage", "phase", "job", [Metrics.All], true);
        expect(metrics.currentContext.pipelineId).toBe(808);
        expect(typeof metrics.currentContext.stageReference.stageName).toBe("string");
        expect(typeof metrics.runSummary.totalRunsCount).toBe("number");
        expect(typeof metrics.resultsAnalysis.resultsDifference.increaseInFailures).toBe("number");
        expect(Object.keys(metrics.resultSummary.resultSummaryByRunState).length).toBe(1);
        expect(metrics.summaryAtChild).toEqual([]);
    });

    it("publishes a test result document", async () => {
        const document = {
            operationReference: { id: "seed", status: "Queued", url: "https://example.test/op" },
            payload: { comment: "nightly", name: "nightly-doc", stream: "QUJD" }
        };
        const published = await client.publishTestResultDocument(document, "proj", 14);
        expect(published.payload).toBe(document.payload);
        expect(published.operationReference.id).toBe("14");
    });

    it("gets result groups by build", async () => {
        const seeded = await client.getResultGroupsByBuild("proj", 4001, "CI");
        expect([...seeded]).toEqual(resultGroups);
        expect(seeded.continuationToken).toBeNull();
        const named = await client.getResultGroupsByBuild("proj", 4001, "CI", ["Owner", "Priority"], "token");
        expect(named.map(group => group.fieldName)).toEqual(["Owner", "Priority"]);
    });

    it("gets result groups by release", async () => {
        const seeded = await client.getResultGroupsByRelease("proj", 51, "CD");
        expect([...seeded]).toEqual(resultGroups);
        expect(seeded.continuationToken).toBeNull();
        const named = await client.getResultGroupsByRelease("proj", 51, "CD", 61, ["Container"], "token");
        expect(named.map(group => group.fieldName)).toEqual(["Container"]);
    });

    it("queries test results meta data by reference id", async () => {
        const metaData = await client.queryTestResultsMetaData(["101", "102"], "proj", ResultMetaDataDetails.FlakyIdentifiers);
        expect(metaData.map(entry => entry.testCaseReferenceId)).toEqual([101, 102]);
    });

    it("updates test results meta data", async () => {
        const flakyIdentifiers = [{ branchName: "main", isFlaky: true }];
        const updated = await client.updateTestResultsMetaData({ flakyIdentifiers }, "proj", 303);
        expect(updated.testCaseReferenceId).toBe(303);
        expect(updated.flakyIdentifiers).toBe(flakyIdentifiers);
        expect(typeof updated.automatedTestName).toBe("string");
    });
});
