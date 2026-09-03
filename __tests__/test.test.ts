import { TestRestClient } from "azure-devops-extension-api/Test";
import { getClient } from "../azure-devops-extension-api";

describe("TestRestClient mock", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(TestRestClient);

    it("exposes the real client class as TYPE", () => {
        expect((client as any).TYPE).toBe(TestRestClient);
    });

    it("lists test runs", async () => {
        const runs = await client.getTestRuns("proj");
        expect(runs).toHaveLength(5);
        runs.forEach(r => {
            expect(r).toHaveProperty("id");
            expect(r).toHaveProperty("name");
        });
    });

    it("returns a known run by id", async () => {
        const [first] = await client.getTestRuns("proj");
        const run = await client.getTestRunById("proj", first.id);
        expect(run).toBe(first);
    });

    it("fabricates an unknown run with the requested id", async () => {
        const run = await client.getTestRunById("proj", 987654321);
        expect(run.id).toBe(987654321);
        expect(run.isAutomated).toBe(true);
    });

    it("creates a test run honoring name and automated flag", async () => {
        const run = await client.createTestRun({ name: "Nightly", automated: false } as any, "proj");
        expect(run.name).toBe("Nightly");
        expect(run.isAutomated).toBe(false);
        expect(run.id).toBeGreaterThan(0);
    });

    it("creates a test run with defaults when name and automated are omitted", async () => {
        const run = await client.createTestRun({} as any, "proj");
        expect(run.name).toMatch(/^Test Run /);
        expect(run.isAutomated).toBe(true);
    });

    it("updates a test run and returns the same id", async () => {
        const run = await client.updateTestRun({ state: "Completed" } as any, "proj", 77);
        expect(run.id).toBe(77);
    });

    it("deletes a test run", async () => {
        await expect(client.deleteTestRun("proj", 77)).resolves.toBeUndefined();
    });

    it("lists test results for a run", async () => {
        const results = await client.getTestResults("proj", 1);
        expect(results).toHaveLength(10);
        results.forEach(r => expect(r).toHaveProperty("outcome"));
    });

    it("returns a known result by id", async () => {
        const [first] = await client.getTestResults("proj", 1);
        const result = await client.getTestResultById("proj", 1, first.id);
        expect(result).toBe(first);
    });

    it("fabricates an unknown result with the requested id", async () => {
        const result = await client.getTestResultById("proj", 1, -5);
        expect(result.id).toBe(-5);
        expect(result.testCaseTitle).toEqual(expect.any(String));
    });

    it("returns paged shallow results for a build", async () => {
        const paged = await client.getTestResultsByBuild("proj", 42);
        expect(paged).toHaveLength(10);
        expect(paged.continuationToken).toBe("");
        expect(paged[0]).toHaveProperty("runId");
    });

    it("lists run attachments", async () => {
        const list = await client.getTestRunAttachments("proj", 1);
        expect(list).toHaveLength(2);
        expect(list[0]).toHaveProperty("fileName");
    });

    it("creates a run attachment reference", async () => {
        const ref = await client.createTestRunAttachment({ fileName: "log.txt" } as any, "proj", 1);
        expect(ref.id).toEqual(expect.any(Number));
        expect(ref.url).toMatch(/^https?:\/\//);
    });
});
