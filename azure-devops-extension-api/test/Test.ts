import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    TestRestClient,
    TestRun,
    TestCaseResult,
    ShallowTestCaseResult,
    RunCreateModel,
    RunUpdateModel,
    TestAttachment,
    TestAttachmentReference,
    TestAttachmentRequestModel
} from "azure-devops-extension-api/Test";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    attachments,
    makeAttachmentRef,
    makeTestCaseResult,
    makeTestRun,
    shallowResults,
    testResults,
    testRuns
} from "./Data";

/**
 * Mocked TestRestClient — runs, results, attachments.
 */
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
}
