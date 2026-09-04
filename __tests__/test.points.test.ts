import { Service, TestRestClient } from "azure-devops-extension-api/Test";
import { getClient } from "../azure-devops-extension-api";

describe("TestRestClient mock points, suites and work item links", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(TestRestClient);

    const pointUpdate = { outcome: "Passed", resetToActive: false, tester: { id: "u-1" } } as any;
    const pointsQuery = {
        orderBy: "id",
        points: [],
        pointsFilter: { configurationNames: [], testcaseIds: [], testers: [] },
        witFields: ["System.Id"]
    } as any;
    const stagingRequest = {
        suites: [{ suiteId: 1, suiteName: "Regression", testCaseMetadata: [] }]
    } as any;
    const suiteUpdate = { configurations: [{ id: "1", name: "Windows", url: "u" }] } as any;
    const workItemLinks = {
        executedIn: Service.Tcm,
        tests: [{ container: "c", name: "n", testResult: {} }],
        workItem: { id: "9", name: "Bug", type: "Bug", url: "u", webUrl: "w" }
    } as any;
    const linkedQuery = {
        automatedTestNames: ["Suite.Test"],
        planId: 4,
        pointIds: [1],
        suiteIds: [2],
        testCaseIds: [31, 32],
        workItemCategory: "Microsoft.BugCategory"
    };

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["addTestCasesToSuite", () => client.addTestCasesToSuite("proj", 1, 2, "101,102")],
        ["getPoint", () => client.getPoint("proj", 1, 2, 5, "System.Title")],
        ["getPoints", () => client.getPoints("proj", 1, 2)],
        ["getPointsByQuery", () => client.getPointsByQuery(pointsQuery, "proj", 0, 10)],
        ["updateTestPoints", () => client.updateTestPoints(pointUpdate, "proj", 1, 2, "7,8")],
        ["processSuitesForStaging", () => client.processSuitesForStaging(stagingRequest, "proj", 3)],
        ["updateSuiteTestCases", () => client.updateSuiteTestCases(suiteUpdate, "proj", 1, 2, "77")],
        ["getTestCases", () => client.getTestCases("proj", 1, 2)],
        ["getTestCaseById", () => client.getTestCaseById("proj", 1, 2, 77)],
        ["addWorkItemToTestLinks", () => client.addWorkItemToTestLinks(workItemLinks, "proj")],
        ["deleteTestMethodToWorkItemLink", () => client.deleteTestMethodToWorkItemLink("proj", "Suite.Test", 9)],
        ["queryTestMethodLinkedWorkItems", () => client.queryTestMethodLinkedWorkItems("proj", "Suite.Test")],
        ["getLinkedWorkItemsByQuery", () => client.getLinkedWorkItemsByQuery(linkedQuery, "proj")],
        ["getBugsLinkedToTestResult", () => client.getBugsLinkedToTestResult("proj", 1, 2)],
        ["queryTestResultWorkItems", () => client.queryTestResultWorkItems("proj", "Microsoft.BugCategory")]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["removeTestCasesFromSuiteUrl", () => client.removeTestCasesFromSuiteUrl("proj", 1, 2, "101")],
        ["deleteTestCase", () => client.deleteTestCase("proj", 101)],
        ["deleteSharedParameter", () => client.deleteSharedParameter("proj", 55)],
        ["deleteSharedStep", () => client.deleteSharedStep("proj", 66)]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("returns a known point by id", async () => {
        const [first] = await client.getPoints("proj", 1, 2);
        const point = await client.getPoint("proj", 1, 2, first.id);
        expect(point).toBe(first);
    });

    it("fabricates an unknown point with the requested id", async () => {
        const point = await client.getPoint("proj", 1, 2, -12);
        expect(point.id).toBe(-12);
        expect(point.assignedTo).toHaveProperty("displayName");
    });

    it("lists every seeded point when no filter is given", async () => {
        const points = await client.getPoints("proj", 1, 2);
        expect(points).toHaveLength(5);
    });

    it("filters points by id and honors skip and top", async () => {
        const all = await client.getPoints("proj", 1, 2);
        const ids = `${all[0].id},${all[1].id},${all[2].id}`;
        const page = await client.getPoints("proj", 1, 2, undefined, undefined, undefined, ids, true, 1, 2);
        expect(page).toHaveLength(1);
        expect(page[0].id).toBe(all[1].id);
    });

    it("merges the caller query into the point query result", async () => {
        const result = await client.getPointsByQuery({ ...pointsQuery, orderBy: "outcome" }, "proj");
        expect(result.orderBy).toBe("outcome");
        expect(result.witFields).toEqual(["System.Id"]);
    });

    it("updates points echoing outcome and tester", async () => {
        const points = await client.updateTestPoints(pointUpdate, "proj", 1, 2, "11,12");
        expect(points.map(p => p.id)).toEqual([11, 12]);
        expect(points.every(p => p.outcome === "Passed")).toBe(true);
        expect(points[0].assignedTo).toBe(pointUpdate.tester);
    });

    it("reports staging success only for a non empty suite list", async () => {
        const staged = await client.processSuitesForStaging(stagingRequest, "proj", 3);
        expect(staged.success).toBe(true);
        expect(staged.metadataId).toEqual(expect.any(String));
        const empty = await client.processSuitesForStaging({ suites: [] } as any, "proj", 3);
        expect(empty.success).toBe(false);
    });

    it("adds test cases to a suite using the supplied ids", async () => {
        const added = await client.addTestCasesToSuite("proj", 1, 2, "201,202");
        expect(added.map(c => c.testCase.id)).toEqual(["201", "202"]);
        expect(added[0].pointAssignments).toHaveLength(1);
    });

    it("updates suite test cases echoing the configurations", async () => {
        const updated = await client.updateSuiteTestCases(suiteUpdate, "proj", 1, 2, "301");
        expect(updated).toHaveLength(1);
        expect(updated[0].testCase.id).toBe("301");
        expect(updated[0].pointAssignments[0].configuration).toBe(suiteUpdate.configurations[0]);
        expect(updated[0].pointAssignments[0].tester).toHaveProperty("displayName");
    });

    it("returns a known suite test case by id", async () => {
        const [first] = await client.getTestCases("proj", 1, 2);
        const found = await client.getTestCaseById("proj", 1, 2, Number(first.testCase.id));
        expect(found).toBe(first);
    });

    it("fabricates an unknown suite test case with the requested id", async () => {
        const found = await client.getTestCaseById("proj", 1, 2, -7);
        expect(found.testCase.id).toBe("-7");
        expect(found.pointAssignments).toHaveLength(1);
    });

    it("echoes the work item to test links payload", async () => {
        const links = await client.addWorkItemToTestLinks(workItemLinks, "proj");
        expect(links.workItem.id).toBe("9");
        expect(links.tests).toBe(workItemLinks.tests);
    });

    it("resolves the test method to work item link deletion as true", async () => {
        await expect(client.deleteTestMethodToWorkItemLink("proj", "Suite.Test", 9)).resolves.toBe(true);
    });

    it("echoes the test name when querying linked work items", async () => {
        const links = await client.queryTestMethodLinkedWorkItems("proj", "Suite.Case");
        expect(links.test.name).toBe("Suite.Case");
        expect(links.workItems).toHaveLength(1);
    });

    it("builds one linked work item result per queried test case", async () => {
        const results = await client.getLinkedWorkItemsByQuery(linkedQuery, "proj");
        expect(results.map(r => r.testCaseId)).toEqual([31, 32]);
        expect(results.every(r => r.planId === 4)).toBe(true);
    });

    it("lists bugs linked to a test result", async () => {
        const bugs = await client.getBugsLinkedToTestResult("proj", 1, 2);
        expect(bugs).toHaveLength(3);
        expect(bugs.every(b => b.type === "Bug")).toBe(true);
    });

    it("categorises result work items and caps them by count", async () => {
        const all = await client.queryTestResultWorkItems("proj", "Microsoft.RequirementCategory");
        expect(all).toHaveLength(3);
        expect(all.every(w => w.type === "Microsoft.RequirementCategory")).toBe(true);
        const capped = await client.queryTestResultWorkItems(
            "proj",
            "Microsoft.BugCategory",
            "Suite.Test",
            5,
            new Date(),
            7,
            2
        );
        expect(capped).toHaveLength(2);
    });
});
