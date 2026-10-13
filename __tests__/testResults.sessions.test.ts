import { Service } from "azure-devops-extension-api/Test";
import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
import { getClient } from "../azure-devops-extension-api";
import { testResults, testSettingsList, workItemRefs } from "../azure-devops-extension-api/test/Data";
import {
    sessionLayout,
    sessionNotifications,
    sessionRunIds,
    testResultMachines,
    testResultsSessions
} from "../azure-devops-extension-api/testResults/Data";

describe("TestResultsRestClient mock sessions, settings and work item links", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TestResultsRestClient);

    const session = { name: "Nightly session", type: "Test" } as any;
    const posted = [{ id: 81, revision: 2, testCaseTitle: "session result" }] as any;

    it("creates a test session and returns a fresh id", async () => {
        const first = await client.createTestSession(session, "proj");
        const second = await client.createTestSession(session, "proj");
        expect(typeof first).toBe("number");
        expect(second).not.toBe(first);
    });

    it("gets the test sessions of a build", async () => {
        const sessions = await client.getTestSession("proj", 4001);
        expect(sessions.map(entry => entry.id)).toEqual(testResultsSessions.map(entry => entry.id));
        for (const entry of sessions) {
            expect(entry.sessionSourcePipeline.buildId).toBe(4001);
            expect(entry.startTimeUTC).toBeInstanceOf(Date);
            expect(entry.timeline.length).toBe(1);
            expect(entry.source.links.length).toBe(1);
        }
    });

    it("gets the session layout by uid and by id", async () => {
        await expect(client.getTestSessionLayout("proj", "session-uid")).resolves.toBe(sessionLayout);
        await expect(client.getTestSessionLayoutBySessionId("proj", 9)).resolves.toBe(sessionLayout);
        expect(sessionLayout.length).toBe(1);
    });

    it("updates a test session and returns its id", async () => {
        await expect(client.updateTestSession(session, "proj", 9)).resolves.toBe(9);
    });

    it("creates an analysis and returns its failure groups", async () => {
        const analysis = [
            {
                analysisEngine: "engine",
                analysisType: "type",
                analysisFailureGroups: [
                    { failureGroupId: 1, uid: "group-1" },
                    { failureGroupId: 2, uid: "group-2" }
                ]
            },
            {
                analysisEngine: "engine",
                analysisType: "type",
                analysisFailureGroups: [{ failureGroupId: 3, uid: "group-3" }]
            }
        ] as any;
        await expect(client.createAnalysis(analysis, "proj", 9)).resolves.toEqual([
            { analysisFailureGroupId: 1, failureGroupUid: "group-1" },
            { analysisFailureGroupId: 2, failureGroupUid: "group-2" },
            { analysisFailureGroupId: 3, failureGroupUid: "group-3" }
        ]);
    });

    it("creates environments and machines", async () => {
        const environments = [{ displayName: "Windows", processorArchitecture: "x64", uid: "env-1" }];
        await expect(client.createEnvironment(environments, "proj")).resolves.toBeUndefined();
        await expect(
            client.createEnvironmentAndMachine({ environments, machines: [] }, "proj", 9)
        ).resolves.toBeUndefined();
        await expect(client.createTestResultMachines(testResultMachines, "proj", 1)).resolves.toBeUndefined();
    });

    it("creates notifications and returns one id each", async () => {
        const ids = await client.createNotification(
            [
                { body: "a", severity: "Info", title: "A" },
                { body: "b", severity: "Error", title: "B" }
            ],
            "proj",
            9
        );
        expect(ids.length).toBe(2);
        expect(new Set(ids).size).toBe(2);
        for (const id of ids) {
            expect(typeof id).toBe("number");
        }
    });

    it("gets session notifications", async () => {
        const notifications = await client.getSessionNotifications("proj", 9);
        expect(notifications).toBe(sessionNotifications);
        expect(typeof notifications[0].title).toBe("string");
    });

    it("adds test results to a test run session", async () => {
        const added = await client.addTestResultsToTestRunSession(posted, "proj", 1);
        expect(added[0].id).toBe(81);
        expect(added[0].testCaseTitle).toBe("session result");
        expect(typeof added[0].automatedTestName).toBe("string");
    });

    it("gets test session results with paging", async () => {
        await expect(client.getTestSessionResults("proj", 1)).resolves.toEqual(testResults);
        await expect(client.getTestSessionResults("proj", 1, undefined, 2, 2)).resolves.toEqual(
            testResults.slice(2, 4)
        );
    });

    it("updates test results of a test run session and returns their ids", async () => {
        await expect(client.updateTestResultsToTestRunSession(posted, "proj", 1)).resolves.toEqual([81]);
    });

    it("gets test result machines", async () => {
        const machines = await client.getTestResultMachines("proj", 1);
        expect(machines).toBe(testResultMachines);
        expect(machines[0].testResultLogs.length).toBe(1);
    });

    it("gets full test results by pipeline", async () => {
        const all = await client.getTestResultsByPipelineMRX("proj", 1);
        expect([...all]).toEqual(testResults);
        expect(all.continuationToken).toBeNull();
        const top = await client.getTestResultsByPipelineMRX("proj", 1, "stage", "phase", "job", [], true, 3, "token");
        expect([...top]).toEqual(testResults.slice(0, 3));
    });

    it("gets and updates the test runs of a session", async () => {
        await expect(client.getTestRunsBySessionId("proj", 9)).resolves.toBe(sessionRunIds);
        await expect(client.updateTestRunsBySessionId({ testRuns: [4, 5] }, "proj", 9)).resolves.toEqual([4, 5]);
    });

    it("creates and deletes test settings", async () => {
        await expect(client.createTestSettings(testSettingsList[0], "proj")).resolves.toBe(testSettingsList.length + 1);
        await expect(client.deleteTestSettings("proj", 1)).resolves.toBeUndefined();
    });

    it("gets test settings by id", async () => {
        const fabricated = await client.getTestSettingsById("proj", -3);
        expect(fabricated.testSettingsId).toBe(-3);
        expect(typeof fabricated.testSettingsName).toBe("string");
        const target = testSettingsList[0];
        const found = await client.getTestSettingsById("proj", target.testSettingsId);
        expect(found).toBe(target);
    });

    it("adds work item to test links", async () => {
        const workItem = {
            id: "17",
            name: "Bug",
            type: "Bug",
            url: "https://example.test/17",
            webUrl: "https://example.test/w/17"
        };
        const links = await client.addWorkItemToTestLinks({ executedIn: Service.Tfs, tests: [], workItem }, "proj");
        expect(links).toEqual({ executedIn: Service.Tfs, tests: [], workItem });
    });

    it("deletes a test method to work item link", async () => {
        await expect(client.deleteTestMethodToWorkItemLink("proj", "Suite.Test", 17)).resolves.toBe(true);
    });

    it("queries the work items linked to a test method", async () => {
        const links = await client.queryTestMethodLinkedWorkItems("proj", "Suite.Test");
        expect(links.test.name).toBe("Suite.Test");
        expect(links.workItems.length).toBe(1);
    });

    it("gets the work items of a test result", async () => {
        await expect(client.getTestResultWorkItemsById("proj", 1, 2)).resolves.toBe(workItemRefs);
    });

    it("queries test result work items by category", async () => {
        const all = await client.queryTestResultWorkItems("proj", "Bug");
        expect(all.length).toBe(workItemRefs.length);
        for (const reference of all) {
            expect(reference.type).toBe("Bug");
        }
        const limited = await client.queryTestResultWorkItems("proj", "Task", "Suite.Test", 1, new Date(), 7, 2);
        expect(limited.map(reference => reference.id)).toEqual(workItemRefs.slice(0, 2).map(reference => reference.id));
    });
});
