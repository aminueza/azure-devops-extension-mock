import {
    AttachmentType,
    ResultGroupType,
    TestOutcome,
    TestRestClient,
    TestResultsContextType,
    TestRunState,
    TestRunSubstate
} from "azure-devops-extension-api/Test";
import { getClient } from "../azure-devops-extension-api";
import {
    attachments,
    makeAggregatedDataForResultTrend,
    makeAttachment,
    makeAttachmentRef,
    makeBuildReference,
    makeCustomTestField,
    makePipelineReference,
    makeReleaseReference,
    makeResultsFilter,
    makeShallowResult,
    makeTestActionResult,
    makeTestCaseResult,
    makeTestIterationDetails,
    makeTestPoint,
    makeTestResultSummary,
    makeTestResultsContext,
    makeTestRun,
    makeTestSubResult,
    queryableTestRuns,
    shallowResults,
    testResults,
    testRuns
} from "../azure-devops-extension-api/test/Data";

const outcomeNames = ["Passed", "Failed", "NotExecuted", "Blocked"];

const expectShallowReference = (reference: { id: string; name: string; url: string }): void => {
    expect(reference.id).toEqual(expect.any(String));
    expect(reference.name).toEqual(expect.any(String));
    expect(reference.url).toEqual(expect.any(String));
};

describe("Test fixtures are fully populated", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("builds a build reference with every field", () => {
        const reference = makeBuildReference();
        expect(reference.id).toEqual(expect.any(Number));
        expect(reference.definitionId).toEqual(expect.any(Number));
        expect(reference.branchName).toMatch(/^refs\/heads\//);
        expect(reference.buildSystem).toBe("Azure Pipelines");
        expect(reference.number).toEqual(expect.any(String));
        expect(reference.repositoryId).toEqual(expect.any(String));
        expect(reference.uri).toMatch(/^vstfs:\/\/\/Build\/Build\//);
    });

    it("builds a release reference with every field", () => {
        const reference = makeReleaseReference();
        expect(reference.id).toEqual(expect.any(Number));
        expect(reference.attempt).toBe(1);
        expect(reference.creationDate).toBeInstanceOf(Date);
        expect(reference.environmentCreationDate).toBeInstanceOf(Date);
        expect(reference.definitionId).toEqual(expect.any(Number));
        expect(reference.environmentDefinitionId).toEqual(expect.any(Number));
        expect(reference.environmentId).toEqual(expect.any(Number));
        expect(reference.environmentDefinitionName).toEqual(expect.any(String));
        expect(reference.environmentName).toEqual(expect.any(String));
        expect(reference.name).toMatch(/^Release-\d+$/);
    });

    it("builds a pipeline reference with stage, phase and job", () => {
        const reference = makePipelineReference();
        expect(reference.pipelineId).toEqual(expect.any(Number));
        expect(reference.pipelineDefinitionId).toEqual(expect.any(Number));
        expect(reference.stageReference).toEqual({ attempt: 1, stageName: expect.any(String) });
        expect(reference.phaseReference).toEqual({ attempt: 1, phaseName: expect.any(String) });
        expect(reference.jobReference).toEqual({ attempt: 1, jobName: expect.any(String) });
    });

    it("builds a results context that defaults to the build type", () => {
        const context = makeTestResultsContext();
        expect(context.contextType).toBe(TestResultsContextType.Build);
        expect(context.build.id).toEqual(expect.any(Number));
        expect(context.release.id).toEqual(expect.any(Number));
        expect(context.pipelineReference.pipelineId).toEqual(expect.any(Number));
    });

    it("builds a results context of the requested type", () => {
        expect(makeTestResultsContext(TestResultsContextType.Release).contextType).toBe(TestResultsContextType.Release);
    });

    it("builds a custom test field", () => {
        expect(makeCustomTestField()).toEqual({ fieldName: expect.any(String), value: expect.any(String) });
    });

    it("fills the references and nested objects of a test run", () => {
        const run = makeTestRun(42);
        expect(run.id).toBe(42);
        expect(run.state).toBe("Completed");
        expect(run.substate).toBe(TestRunSubstate.None);
        expect(run.owner.displayName).toEqual(expect.any(String));
        expect(run.lastUpdatedBy.displayName).toEqual(expect.any(String));
        [run.build, run.project, run.plan, run.testSettings, run.dtlEnvironment, run.dtlAutEnvironment].forEach(
            expectShallowReference
        );
        expect(run.buildConfiguration.project.id).toEqual(expect.any(String));
        expect(run.pipelineReference.stageReference.stageName).toEqual(expect.any(String));
        expect(run.release.environmentId).toEqual(expect.any(Number));
        expect(run.releaseUri).toMatch(/^vstfs:\/\/\/ReleaseManagement\/Release\//);
        expect(run.releaseEnvironmentUri).toMatch(/^vstfs:\/\/\/ReleaseManagement\/Environment\//);
        expect(run.runStatistics).toHaveLength(1);
        expect(run.runStatistics[0].resolutionState.project.id).toEqual(expect.any(String));
        expect(run.customFields[0].fieldName).toEqual(expect.any(String));
        expect(run.tags[0].name).toEqual(expect.any(String));
        expect(run.testEnvironment.environmentId).toEqual(expect.any(String));
        expect(run.dtlEnvironmentCreationDetails.subscriptionName).toEqual(expect.any(String));
        expect(run.filter).toEqual({ sourceFilter: "*.dll", testCaseFilter: "" });
        expect(run.createdDate).toBeInstanceOf(Date);
        expect(run.dueDate).toBeInstanceOf(Date);
        expect(run.lastUpdatedDate).toBeInstanceOf(Date);
        expect(run.revision).toBe(1);
        expect(run.testMessageLogId).toEqual(expect.any(Number));
    });

    it("keeps the counters existing consumers rely on in a test run", () => {
        const run = makeTestRun();
        expect(run.id).toEqual(expect.any(Number));
        expect(run.totalTests).toBe(100);
        expect(run.passedTests).toBe(95);
        expect(run.isAutomated).toBe(true);
    });

    it("builds a leaf sub result", () => {
        const subResult = makeTestSubResult();
        expect(outcomeNames).toContain(subResult.outcome);
        expect(subResult.resultGroupType).toBe(ResultGroupType.None);
        expect(subResult.subResults).toEqual([]);
        expect(subResult.testResult).toEqual({
            testResultId: expect.any(Number),
            testRunId: expect.any(Number)
        });
        expectShallowReference(subResult.configuration);
        expect(subResult.customFields).toHaveLength(1);
        expect(subResult.lastUpdatedDate).toBeInstanceOf(Date);
    });

    it("fills the references and nested objects of a test case result", () => {
        const result = makeTestCaseResult(7);
        expect(result.id).toBe(7);
        expect(outcomeNames).toContain(result.outcome);
        expect(result.state).toBe("Completed");
        [
            result.testRun,
            result.testCase,
            result.build,
            result.project,
            result.area,
            result.configuration,
            result.release,
            result.testPlan,
            result.testPoint,
            result.testSuite,
            result.associatedBugs[0]
        ].forEach(expectShallowReference);
        expect(result.runBy.displayName).toEqual(expect.any(String));
        expect(result.owner.displayName).toEqual(expect.any(String));
        expect(result.lastUpdatedBy.displayName).toEqual(expect.any(String));
        expect(result.buildReference.id).toEqual(expect.any(Number));
        expect(result.releaseReference.id).toEqual(expect.any(Number));
        expect(result.failingSince.build.id).toEqual(expect.any(Number));
        expect(result.failingSince.release.id).toEqual(expect.any(Number));
        expect(result.failingSince.date).toBeInstanceOf(Date);
        expect(result.analysisFailureGroups[0].uid).toEqual(expect.any(String));
        expect(result.dimensions[0].name).toBe("os");
        expect(result.links[0].type).toBe("MoreInfo");
        expect(result.customFields).toHaveLength(1);
        expect(result.subResults).toHaveLength(1);
        expect(result.subResults[0].subResults).toEqual([]);
        expect(result.iterationDetails).toEqual([]);
        expect(result.resultGroupType).toBe(ResultGroupType.None);
        expect(result.failureType).toBe("None");
        expect(result.isSystemIssue).toBe(false);
        expect(result.locale).toBe("en-US");
        expect(result.testCaseReferenceId).toEqual(expect.any(Number));
        expect(result.url).toEqual(expect.any(String));
    });

    it("generates an id for a test case result when none is given", () => {
        expect(makeTestCaseResult().id).toEqual(expect.any(Number));
    });

    it("fills duration and tags on a shallow result", () => {
        const result = makeShallowResult();
        expect(result.durationInMs).toEqual(expect.any(Number));
        expect(result.tags).toEqual([expect.any(String)]);
        expect(result.isReRun).toBe(false);
    });

    it("types the attachment type as the enum", () => {
        expect(makeAttachment().attachmentType).toBe(AttachmentType.GeneralAttachment);
        expect(attachments).toHaveLength(2);
    });

    it("builds an attachment reference", () => {
        expect(makeAttachmentRef()).toEqual({ id: expect.any(Number), url: expect.any(String) });
    });

    it("names the outcome on points, action results and iterations", () => {
        expect(outcomeNames).toContain(makeTestPoint().outcome);
        expect(outcomeNames).toContain(makeTestActionResult().outcome);
        expect(outcomeNames).toContain(makeTestIterationDetails().outcome);
        expect(outcomeNames).toContain(TestOutcome[TestOutcome.Blocked]);
    });

    it("fills the results context wherever a fixture carries one", () => {
        const summary = makeTestResultSummary();
        const contexts = [
            makeResultsFilter().testResultsContext,
            makeAggregatedDataForResultTrend().testResultsContext,
            summary.testResultsContext,
            summary.aggregatedResultsAnalysis.previousContext,
            summary.testFailures.previousContext
        ];
        contexts.forEach(context => {
            expect(context.contextType).toBe(TestResultsContextType.Build);
            expect(context.build.branchName).toEqual(expect.any(String));
            expect(context.release.name).toEqual(expect.any(String));
            expect(context.pipelineReference.jobReference.jobName).toEqual(expect.any(String));
        });
    });

    it("seeds the module lists without touching a later maker", () => {
        expect(testRuns).toHaveLength(5);
        expect(testResults).toHaveLength(10);
        expect(shallowResults).toHaveLength(10);
        expect(shallowResults.continuationToken).toBe("");
        expect(queryableTestRuns.map(run => run.state)).toEqual([
            TestRunState[TestRunState.Completed],
            TestRunState[TestRunState.Completed],
            TestRunState[TestRunState.Aborted],
            TestRunState[TestRunState.InProgress]
        ]);
    });
});

describe("TestRestClient mock builds full result contexts", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TestRestClient);

    it("keeps the rest of the build reference when stamping the build id", async () => {
        const summary = await client.queryTestResultsReportForBuild("proj", 4001);
        expect(summary.testResultsContext.build.id).toBe(4001);
        expect(summary.testResultsContext.build.branchName).toMatch(/^refs\/heads\//);
        expect(summary.testResultsContext.pipelineReference.pipelineId).toEqual(expect.any(Number));
        expect(summary.testResultsContext.release.id).toEqual(expect.any(Number));
    });

    it("keeps the rest of the release reference when stamping the release ids", async () => {
        const summary = await client.queryTestResultsReportForRelease("proj", 51, 61);
        expect(summary.testResultsContext.contextType).toBe(TestResultsContextType.Release);
        expect(summary.testResultsContext.release.id).toBe(51);
        expect(summary.testResultsContext.release.environmentId).toBe(61);
        expect(summary.testResultsContext.release.name).toMatch(/^Release-\d+$/);
        expect(summary.testResultsContext.build.id).toEqual(expect.any(Number));
    });

    it("passes the given release through and fills the build side", async () => {
        const release = makeReleaseReference();
        const [summary] = await client.queryTestResultsSummaryForReleases([release], "proj");
        expect(summary.testResultsContext.release).toBe(release);
        expect(summary.testResultsContext.build.id).toEqual(expect.any(Number));
    });

    it("returns typed paged lists with a null continuation token", async () => {
        const groups = await client.getResultGroupsByBuild("proj", 1, "CI", ["Owner"]);
        const releaseGroups = await client.getResultGroupsByRelease("proj", 1, "CD");
        const runs = await client.queryTestRuns("proj", new Date("2024-01-01"), new Date("2024-12-31"));
        expect(groups.continuationToken).toBeNull();
        expect(groups.map(group => group.fieldName)).toEqual(["Owner"]);
        expect(releaseGroups.continuationToken).toBeNull();
        expect(runs.continuationToken).toBeNull();
        expect(runs).toHaveLength(4);
    });
});
