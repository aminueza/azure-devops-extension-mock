import { TestRestClient, TestSessionSource } from "azure-devops-extension-api/Test";
import { getClient } from "../azure-devops-extension-api";
import { testSettingsList } from "../azure-devops-extension-api/test/Data";

describe("TestRestClient mock results, iterations, attachments, sessions and settings", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(TestRestClient);

    const teamContext = { project: "proj", projectId: "p-1", team: "team", teamId: "t-1" };
    const attachmentRequest = { attachmentType: 0, comment: "c", fileName: "f.txt", stream: "AAA" } as any;
    const results = [{ id: 11, revision: 3, testCaseTitle: "login works" }] as any;
    const resultsQuery = { fields: ["Outcome"], results: [], resultsFilter: null } as any;
    const session = { id: 21, revision: 4, title: "exploratory sweep" } as any;
    const settings = { testSettingsId: 31, testSettingsName: "local runsettings" } as any;

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["addTestResultsToTestRun", () => client.addTestResultsToTestRun(results, "proj", 1)],
        ["updateTestResults", () => client.updateTestResults(results, "proj", 1)],
        ["getTestResultsByQuery", () => client.getTestResultsByQuery(resultsQuery, "proj")],
        ["getTestResultsByRelease", () => client.getTestResultsByRelease("proj", 5, 6, "CI", undefined, 10, "tok")],
        ["getTestResultDetailsForBuild", () => client.getTestResultDetailsForBuild("proj", 7)],
        ["getTestResultDetailsForRelease", () => client.getTestResultDetailsForRelease("proj", 5, 6)],
        ["getTestIteration", () => client.getTestIteration("proj", 1, 2, 3, true)],
        ["getTestIterations", () => client.getTestIterations("proj", 1, 2)],
        ["createTestIterationResultAttachment", () => client.createTestIterationResultAttachment(attachmentRequest, "proj", 1, 2, 3, "00000002")],
        ["createTestResultAttachment", () => client.createTestResultAttachment(attachmentRequest, "proj", 1, 2)],
        ["createTestSubResultAttachment", () => client.createTestSubResultAttachment(attachmentRequest, "proj", 1, 2, 3)],
        ["getTestResultAttachmentContent", () => client.getTestResultAttachmentContent("proj", 1, 2, 3)],
        ["getTestResultAttachmentZip", () => client.getTestResultAttachmentZip("proj", 1, 2, 3)],
        ["getTestResultAttachments", () => client.getTestResultAttachments("proj", 1, 2)],
        ["getTestSubResultAttachmentContent", () => client.getTestSubResultAttachmentContent("proj", 1, 2, 3, 4)],
        ["getTestSubResultAttachmentZip", () => client.getTestSubResultAttachmentZip("proj", 1, 2, 3, 4)],
        ["getTestSubResultAttachments", () => client.getTestSubResultAttachments("proj", 1, 2, 3)],
        ["getTestRunAttachmentContent", () => client.getTestRunAttachmentContent("proj", 1, 3)],
        ["getTestRunAttachmentZip", () => client.getTestRunAttachmentZip("proj", 1, 3)],
        ["createTestSession", () => client.createTestSession(session, teamContext)],
        ["getTestSessions", () => client.getTestSessions(teamContext, 7, true, true, TestSessionSource.XTWeb, false)],
        ["updateTestSession", () => client.updateTestSession(session, teamContext)],
        ["createTestSettings", () => client.createTestSettings(settings, "proj")],
        ["getTestSettingsById", () => client.getTestSettingsById("proj", 31)]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteTestSettings", () => client.deleteTestSettings("proj", 31)]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("echoes added results over a fixture", async () => {
        const added = await client.addTestResultsToTestRun(results, "proj", 1);
        expect(added).toHaveLength(1);
        expect(added[0].id).toBe(11);
        expect(added[0].testCaseTitle).toBe("login works");
        expect(added[0].automatedTestName).toEqual(expect.any(String));
    });

    it("bumps the revision when updating results", async () => {
        const updated = await client.updateTestResults(results, "proj", 1);
        expect(updated[0].revision).toBe(4);
        expect(updated[0].id).toBe(11);
    });

    it("merges the caller query into the result query", async () => {
        const merged = await client.getTestResultsByQuery({ ...resultsQuery, fields: ["Priority"] }, "proj");
        expect(merged.fields).toEqual(["Priority"]);
        expect(merged.results).toEqual([]);
    });

    it("returns a paged list with a continuation token for releases", async () => {
        const paged = await client.getTestResultsByRelease("proj", 5);
        expect(paged).toHaveLength(10);
        expect(paged).toHaveProperty("continuationToken");
    });

    it("groups build and release result details by outcome", async () => {
        const build = await client.getTestResultDetailsForBuild("proj", 7, "CI", "TestRun", "f", "o", true, false);
        const release = await client.getTestResultDetailsForRelease("proj", 5, 6, "CI", "TestRun", "f", "o", true, false);
        expect(build.groupByField).toBe("TestRun");
        expect(build.resultsForGroup[0].resultsCountByOutcome).toHaveProperty("2");
        expect(release.resultsForGroup[0].results).toHaveLength(1);
    });

    it("returns a known iteration by id", async () => {
        const [first] = await client.getTestIterations("proj", 1, 2);
        const iteration = await client.getTestIteration("proj", 1, 2, first.id);
        expect(iteration).toBe(first);
    });

    it("fabricates an unknown iteration with the requested id", async () => {
        const iteration = await client.getTestIteration("proj", 1, 2, -9);
        expect(iteration.id).toBe(-9);
        expect(iteration.actionResults).toHaveLength(1);
        expect(iteration.parameters).toHaveLength(1);
        expect(iteration.attachments).toHaveLength(1);
    });

    it("returns attachment references from every create endpoint", async () => {
        const iteration = await client.createTestIterationResultAttachment(attachmentRequest, "proj", 1, 2, 3);
        const result = await client.createTestResultAttachment(attachmentRequest, "proj", 1, 2);
        const sub = await client.createTestSubResultAttachment(attachmentRequest, "proj", 1, 2, 3);
        for (const reference of [iteration, result, sub]) {
            expect(reference.id).toEqual(expect.any(Number));
            expect(reference.url).toEqual(expect.any(String));
        }
    });

    it("returns decodable buffers for every download endpoint", async () => {
        const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);
        expect(decode(await client.getTestResultAttachmentContent("proj", 1, 2, 8))).toBe("result-attachment-8");
        expect(decode(await client.getTestResultAttachmentZip("proj", 1, 2, 8))).toBe("result-attachment-zip-8");
        expect(decode(await client.getTestSubResultAttachmentContent("proj", 1, 2, 8, 4))).toBe("sub-attachment-8");
        expect(decode(await client.getTestSubResultAttachmentZip("proj", 1, 2, 8, 4))).toBe("sub-attachment-zip-8");
        expect(decode(await client.getTestRunAttachmentContent("proj", 1, 8))).toBe("run-attachment-8");
        expect(decode(await client.getTestRunAttachmentZip("proj", 1, 8))).toBe("run-attachment-zip-8");
    });

    it("shares the seeded attachment list across result and sub result lookups", async () => {
        const forResult = await client.getTestResultAttachments("proj", 1, 2);
        const forSubResult = await client.getTestSubResultAttachments("proj", 1, 2, 3);
        expect(forResult).toHaveLength(2);
        expect(forSubResult).toBe(forResult);
    });

    it("echoes a created session and bumps the revision on update", async () => {
        const created = await client.createTestSession(session, teamContext);
        expect(created.title).toBe("exploratory sweep");
        expect(created.revision).toBe(4);
        expect(created.source).toBe(TestSessionSource.XTWeb);
        const updated = await client.updateTestSession(session, teamContext);
        expect(updated.revision).toBe(5);
        expect(updated.propertyBag.bag).toEqual(expect.any(Object));
    });

    it("lists the seeded sessions", async () => {
        const sessions = await client.getTestSessions(teamContext);
        expect(sessions).toHaveLength(4);
        expect(sessions[0].area).toHaveProperty("name");
    });

    it("assigns a fresh id when creating settings", async () => {
        const id = await client.createTestSettings(settings, "proj");
        expect(id).toEqual(expect.any(Number));
        expect(id).toBeGreaterThan(testSettingsList.length);
    });

    it("returns known settings by id", async () => {
        const [seeded] = testSettingsList;
        const found = await client.getTestSettingsById("proj", seeded.testSettingsId);
        expect(found).toBe(seeded);
    });

    it("fabricates unknown settings with the requested id", async () => {
        const fabricated = await client.getTestSettingsById("proj", -4);
        expect(fabricated.testSettingsId).toBe(-4);
        expect(fabricated.testSettingsName).toEqual(expect.any(String));
    });
});
