import {
    OperationType,
    TestLogStatusCode,
    TestLogStoreEndpointType,
    TestLogStoreOperationType,
    TestLogType
} from "azure-devops-extension-api/Test";
import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
import { getClient } from "../azure-devops-extension-api";
import {
    failureTypes,
    logStoreAttachments,
    testAgentToken,
    testLogs,
    testTags
} from "../azure-devops-extension-api/testResults/Data";

const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);

describe("TestResultsRestClient mock tags, agent, log store and logs", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TestResultsRestClient);

    const request = { attachmentType: "GeneralAttachment", comment: "log", fileName: "agent.log", stream: "QUJD" };
    const fileNameOf = (filePath: string): string => filePath.slice(filePath.lastIndexOf("/") + 1);

    it("gets test tags for a build and a release", async () => {
        await expect(client.getTestTagsForBuild("proj", 1)).resolves.toBe(testTags);
        await expect(client.getTestTagsForRelease("proj", 1, 2)).resolves.toBe(testTags);
        expect(new Set(testTags.map(tag => tag.name)).size).toBe(testTags.length);
    });

    it("updates test run tags", async () => {
        const model = {
            tags: [
                { key: OperationType.Add, value: [{ name: "added-tag" }] },
                { key: OperationType.Delete, value: [{ name: testTags[0].name }] }
            ]
        };
        const tags = await client.updateTestRunTags(model, "proj", 1);
        expect(tags.map(tag => tag.name)).toEqual([...testTags.slice(1).map(tag => tag.name), "added-tag"]);
    });

    it("gets tag summaries keyed by artifact", async () => {
        const forBuild = await client.getTestTagSummaryForBuild("proj", 4001);
        expect(forBuild.tagsGroupByTestArtifact).toEqual({ 4001: testTags });
        const forRelease = await client.getTestTagSummaryForRelease("proj", 51, 61);
        expect(forRelease.tagsGroupByTestArtifact).toEqual({ 51: testTags });
    });

    it("calls back the test agent with the request outcome", async () => {
        await expect(
            client.callbackTestAgent({ success: true, task: "generate", workItemId: 1 } as any, "proj")
        ).resolves.toBe(true);
        await expect(
            client.callbackTestAgent({ success: false, task: "generate", workItemId: 1 } as any, "proj")
        ).resolves.toBe(false);
    });

    it("enhances coverage", async () => {
        await expect(client.enhanceCoverage("proj", "repo", 12)).resolves.toBeUndefined();
    });

    it("gets the test agent token", async () => {
        const token = await client.getTestAgentToken();
        expect(token).toBe(testAgentToken);
        expect(token.length).toBe(40);
    });

    it("triggers the test agent", async () => {
        await expect(client.triggerTestAgent({ task: "generate", workItemId: 1 } as any, "proj")).resolves.toBe(true);
    });

    it("completes the GitHub auth", async () => {
        await expect(client.completeGitHubAuth("proj", "abc123")).resolves.toBe("github-auth-abc123");
    });

    it("generates a test plan from a work item", async () => {
        await expect(client.generateTestPlanFromWorkItem({ userInstructions: "cover login" }, "proj", 1)).resolves.toBe(
            true
        );
    });

    it("creates a build attachment in the log store", async () => {
        await expect(client.createBuildAttachmentInLogStore(request, "proj", 1)).resolves.toBeUndefined();
    });

    it("creates a test run log store attachment", async () => {
        const reference = await client.createTestRunLogStoreAttachment(request, "proj", 1);
        expect(reference.url.endsWith("/agent.log")).toBe(true);
    });

    it("deletes a test run log store attachment", async () => {
        await expect(client.deleteTestRunLogStoreAttachment("proj", 1, "agent.log")).resolves.toBeUndefined();
    });

    it("gets test run log store attachment content and zip", async () => {
        const content = await client.getTestRunLogStoreAttachmentContent("proj", 1, "agent.log");
        expect(content).toBeInstanceOf(ArrayBuffer);
        expect(decode(content)).toBe("log-store-attachment-agent.log");
        const zip = await client.getTestRunLogStoreAttachmentZip("proj", 1, "agent.log");
        expect(zip).toBeInstanceOf(ArrayBuffer);
        expect(decode(zip)).toBe("log-store-attachment-zip-agent.log");
    });

    it("gets test run log store attachments", async () => {
        const found = await client.getTestRunLogStoreAttachments("proj", 1);
        expect(found).toBe(logStoreAttachments);
        expect(new Set(found.map(attachment => attachment.fileName)).size).toBe(found.length);
        expect(found[0].createdDate).toBeInstanceOf(Date);
    });

    it("creates a failure type echoing the request", async () => {
        const created = await client.createFailureType({ name: "Infrastructure" }, "proj");
        expect(created.name).toBe("Infrastructure");
        expect(typeof created.id).toBe("number");
    });

    it("deletes a failure type", async () => {
        await expect(client.deleteFailureType("proj", 1)).resolves.toBeUndefined();
    });

    it("gets failure types", async () => {
        const found = await client.getFailureTypes("proj");
        expect(found).toBe(failureTypes);
        expect(new Set(found.map(type => type.name)).size).toBe(found.length);
    });

    it("echoes a test history query over a fixture", async () => {
        const history = await client.queryTestHistory({ automatedTestName: "Suite.Test", trendDays: 3 } as any, "proj");
        expect(history.automatedTestName).toBe("Suite.Test");
        expect(history.trendDays).toBe(3);
        expect(history.resultsForGroup.length).toBe(1);
    });

    it("gets test logs for a build", async () => {
        const logs = await client.getTestLogsForBuild("proj", 4001, TestLogType.System);
        expect(logs.length).toBe(testLogs.length);
        expect(logs.continuationToken).toBeNull();
        for (const log of logs) {
            expect(log.logReference.buildId).toBe(4001);
            expect(log.logReference.type).toBe(TestLogType.System);
            expect(log.modifiedOn).toBeInstanceOf(Date);
        }
    });

    it("gets test result logs", async () => {
        const logs = await client.getTestResultLogs("proj", 5, 6, TestLogType.GeneralAttachment);
        expect(logs.length).toBe(testLogs.length);
        for (const log of logs) {
            expect(log.logReference.runId).toBe(5);
            expect(log.logReference.resultId).toBe(6);
        }
    });

    it("gets test sub result logs", async () => {
        const logs = await client.getTestSubResultLogs("proj", 5, 6, 7, TestLogType.GeneralAttachment);
        expect(logs.length).toBe(testLogs.length);
        for (const log of logs) {
            expect(log.logReference.runId).toBe(5);
            expect(log.logReference.resultId).toBe(6);
            expect(log.logReference.subResultId).toBe(7);
        }
    });

    it("gets test run logs", async () => {
        const logs = await client.getTestRunLogs("proj", 5, TestLogType.CodeCoverage);
        expect(logs.map(log => log.logReference.filePath)).toEqual(testLogs.map(log => log.logReference.filePath));
        for (const log of logs) {
            expect(log.logReference.runId).toBe(5);
            expect(log.logReference.type).toBe(TestLogType.CodeCoverage);
        }
    });

    it("filters logs by file name prefix and top", async () => {
        const target = testLogs[2].logReference.filePath;
        const prefix = fileNameOf(target);
        const forBuild = await client.getTestLogsForBuild(
            "proj",
            1,
            TestLogType.System,
            "dir",
            prefix,
            true,
            5,
            "token"
        );
        expect(forBuild.map(log => log.logReference.filePath)).toEqual([target]);
        const forResult = await client.getTestResultLogs(
            "proj",
            1,
            2,
            TestLogType.System,
            "dir",
            prefix,
            true,
            5,
            "token"
        );
        expect(forResult.map(log => log.logReference.filePath)).toEqual([target]);
        const forSubResult = await client.getTestSubResultLogs(
            "proj",
            1,
            2,
            3,
            TestLogType.System,
            "dir",
            prefix,
            true,
            5,
            "token"
        );
        expect(forSubResult.map(log => log.logReference.filePath)).toEqual([target]);
        const forRun = await client.getTestRunLogs("proj", 1, TestLogType.System, "dir", prefix, true, 5, "token");
        expect(forRun.map(log => log.logReference.filePath)).toEqual([target]);
        const none = await client.getTestRunLogs("proj", 1, TestLogType.System, "dir", "no-such-prefix");
        expect([...none]).toEqual([]);
        const top = await client.getTestRunLogs("proj", 1, TestLogType.System, undefined, undefined, false, 2);
        expect(top.length).toBe(2);
    });

    const fileEndpoints: Array<
        [
            string,
            () => Promise<{ endpointSASUri: string; endpointType: TestLogStoreEndpointType; status: TestLogStatusCode }>
        ]
    > = [
        [
            "getTestLogStoreEndpointDetailsForBuildLog",
            () => client.getTestLogStoreEndpointDetailsForBuildLog("proj", 1, TestLogType.System, "a.log")
        ],
        [
            "getTestLogStoreEndpointDetailsForResultLog",
            () => client.getTestLogStoreEndpointDetailsForResultLog("proj", 1, 2, TestLogType.System, "a.log")
        ],
        [
            "getTestLogStoreEndpointDetailsForSubResultLog",
            () => client.getTestLogStoreEndpointDetailsForSubResultLog("proj", 1, 2, 3, TestLogType.System, "a.log")
        ],
        [
            "testLogStoreEndpointDetailsForResult",
            () => client.testLogStoreEndpointDetailsForResult("proj", 1, 2, 3, "a.log", TestLogType.System)
        ],
        [
            "getTestLogStoreEndpointDetailsForRunLog",
            () => client.getTestLogStoreEndpointDetailsForRunLog("proj", 1, TestLogType.System, "a.log")
        ],
        [
            "testLogStoreEndpointDetailsForRun",
            () =>
                client.testLogStoreEndpointDetailsForRun(
                    "proj",
                    1,
                    TestLogStoreOperationType.Create,
                    "a.log",
                    TestLogType.System
                )
        ]
    ];

    it.each(fileEndpoints)("%s resolves a file endpoint", async (_name, call) => {
        const details = await call();
        expect(details.endpointType).toBe(TestLogStoreEndpointType.File);
        expect(details.status).toBe(TestLogStatusCode.Success);
        expect(details.endpointSASUri).toContain("?sv=");
    });

    it("resolves root endpoints when no file is named", async () => {
        const forBuild = await client.testLogStoreEndpointDetailsForBuild("proj", 1, TestLogStoreOperationType.Read);
        expect(forBuild.endpointType).toBe(TestLogStoreEndpointType.Root);
        const forRun = await client.testLogStoreEndpointDetailsForRun(
            "proj",
            1,
            TestLogStoreOperationType.ReadAndCreate
        );
        expect(forRun.endpointType).toBe(TestLogStoreEndpointType.Root);
        expect(forRun.status).toBe(TestLogStatusCode.Success);
    });
});
