import {
    ExcludeFlags,
    Outcome,
    PointState,
    SuiteEntryTypes,
    SuiteExpand,
    TestPlanRestClient,
    TestSuiteType
} from "azure-devops-extension-api/TestPlan";
import { getClient } from "../azure-devops-extension-api";
import * as data from "../azure-devops-extension-api/testPlan/Data";

describe("TestPlanRestClient mock suites, test cases and points", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TestPlanRestClient);
    const [plan] = data.plans;
    const [root, child] = data.suites;

    const suiteParameters = {
        name: "Regression",
        suiteType: TestSuiteType.StaticTestSuite,
        requirementId: 0,
        queryString: "",
        inheritDefaultConfigurations: false,
        defaultConfigurations: [{ id: 3, name: "Chrome" }],
        defaultTesters: [],
        parentSuite: { id: 55, name: "Parent" }
    };

    describe("clone operation lookups", () => {
        it("gets known plan clone information", async () => {
            const [known] = data.planCloneOperations;
            expect(await client.getCloneInformation("proj", known.cloneOperationResponse.opId)).toBe(known);
        });

        it("gets known suite clone information", async () => {
            const [known] = data.suiteCloneOperations;
            expect(await client.getSuiteCloneInformation("proj", known.cloneOperationResponse.opId)).toBe(known);
        });

        it("gets known test case clone information", async () => {
            const [known] = data.testCaseCloneOperations;
            expect(await client.getTestCaseCloneInformation("proj", known.cloneOperationResponse.opId)).toBe(known);
        });

        it("seeds operations with distinct ids", () => {
            const ids = [
                ...data.planCloneOperations,
                ...data.suiteCloneOperations,
                ...data.testCaseCloneOperations
            ].map(o => o.cloneOperationResponse.opId);
            expect(new Set(ids).size).toBe(6);
        });
    });

    describe("suites", () => {
        it("lists the seeded suites flat", async () => {
            const page = await client.getTestSuitesForPlan("proj", plan.id);
            expect(page.length).toBe(4);
            expect(page.continuationToken).toBeNull();
            expect(new Set(page.map(s => s.id)).size).toBe(4);
            expect(page[0].id).toBe(plan.rootSuite.id);
            expect(page[0].name).toBe(plan.rootSuite.name);
            expect(page[0].hasChildren).toBe(true);
            expect(page.map(s => s.suiteType)).toEqual([
                TestSuiteType.StaticTestSuite,
                TestSuiteType.StaticTestSuite,
                TestSuiteType.RequirementTestSuite,
                TestSuiteType.DynamicTestSuite
            ]);
            expect(page[2].requirementId).toBeGreaterThan(0);
            expect(page[3].queryString).toContain("Test Case");
            for (const suite of page) {
                expect(suite.plan).toEqual({ id: plan.id, name: plan.name });
                expect(suite.parentSuite).toEqual(plan.rootSuite);
                expect(suite.children).toEqual([]);
                expect(typeof suite.project.id).toBe("string");
                expect(suite.lastUpdatedDate).toBeInstanceOf(Date);
            }
        });

        it("lists the seeded suites flat when the tree view is declined", async () => {
            const page = await client.getTestSuitesForPlan("proj", plan.id, SuiteExpand.Children, "token", false);
            expect(page.map(s => s.id)).toEqual(data.suites.map(s => s.id));
        });

        it("lists the seeded suites as a tree", async () => {
            const page = await client.getTestSuitesForPlan("proj", plan.id, SuiteExpand.None, undefined, true);
            expect(page.length).toBe(1);
            expect(page.continuationToken).toBeNull();
            expect(page[0].id).toBe(root.id);
            expect(page[0].children.map(s => s.id)).toEqual(data.suites.slice(1).map(s => s.id));
            for (const nested of page[0].children) {
                expect(nested.children).toEqual([]);
            }
        });

        it("gets a known suite", async () => {
            expect(await client.getTestSuiteById("proj", plan.id, child.id, SuiteExpand.DefaultTesters)).toBe(child);
        });

        it("fabricates an unknown suite in a known plan", async () => {
            const made = await client.getTestSuiteById("proj", plan.id, 998_001);
            expect(made.id).toBe(998_001);
            expect(made.plan).toEqual({ id: plan.id, name: plan.name });
        });

        it("fabricates an unknown suite in an unknown plan", async () => {
            const made = await client.getTestSuiteById("proj", 998_002, 998_003);
            expect(made.id).toBe(998_003);
            expect(made.plan.id).toBe(998_002);
            expect(typeof made.plan.name).toBe("string");
        });

        it("creates a suite echoing the parameters", async () => {
            const created = await client.createTestSuite(suiteParameters, "proj", plan.id);
            expect(created).toMatchObject(suiteParameters);
            expect(created.plan).toEqual({ id: plan.id, name: plan.name });
            expect(typeof created.id).toBe("number");
            expect(created.children).toEqual([]);
        });

        it("creates suites in bulk under the requested parent", async () => {
            const created = await client.createBulkTestSuites(
                [
                    {
                        ...suiteParameters,
                        name: "First",
                        suiteType: TestSuiteType.RequirementTestSuite,
                        requirementId: 9
                    },
                    { ...suiteParameters, name: "Second" }
                ],
                "proj",
                plan.id,
                child.id
            );
            expect(created.map(s => s.name)).toEqual(["First", "Second"]);
            expect(created[0].requirementId).toBe(9);
            expect(created[0].id).not.toBe(created[1].id);
            for (const suite of created) {
                expect(suite.parentSuite).toEqual({ id: child.id, name: child.name });
                expect(suite.plan).toEqual({ id: plan.id, name: plan.name });
            }
        });

        it("creates suites in bulk under an unknown parent", async () => {
            const [created] = await client.createBulkTestSuites([suiteParameters], "proj", 998_004, 998_005);
            expect(created.parentSuite.id).toBe(998_005);
            expect(created.plan.id).toBe(998_004);
        });

        it("updates a known suite", async () => {
            const { suiteType: _suiteType, requirementId: _requirementId, ...common } = suiteParameters;
            const updated = await client.updateTestSuite({ ...common, revision: 12 }, "proj", plan.id, child.id);
            expect(updated.id).toBe(child.id);
            expect(updated.name).toBe("Regression");
            expect(updated.revision).toBe(12);
            expect(updated.plan).toBe(child.plan);
        });

        it("updates an unknown suite", async () => {
            const { suiteType: _suiteType, requirementId: _requirementId, ...common } = suiteParameters;
            const updated = await client.updateTestSuite({ ...common, revision: 3 }, "proj", plan.id, 998_006);
            expect(updated.id).toBe(998_006);
            expect(updated.revision).toBe(3);
        });

        it("deletes a suite", async () => {
            await expect(client.deleteTestSuite("proj", 1, 2)).resolves.toBeUndefined();
        });

        it("finds the suite holding a seeded test case", async () => {
            const found = await client.getSuitesByTestCaseId(data.testCases[0].workItem.id);
            expect(found).toEqual([child]);
        });

        it("fabricates a suite for an unknown test case", async () => {
            const found = await client.getSuitesByTestCaseId(998_007);
            expect(found.length).toBe(1);
            expect(data.suites).not.toContain(found[0]);
            expect(typeof found[0].plan.id).toBe("number");
        });

        it("lists deleted suites for a plan flat and as a tree", async () => {
            const flat = await client.getDeletedTestSuitesForPlan("proj", plan.id);
            const tree = await client.getDeletedTestSuitesForPlan("proj", plan.id, SuiteExpand.Children, "token", true);
            expect(flat.length).toBe(2);
            expect(flat.continuationToken).toBeNull();
            expect(tree.map(s => s.id)).toEqual(flat.map(s => s.id));
            expect(tree.continuationToken).toBeNull();
            for (const suite of flat) {
                expect(data.suites.map(s => s.id)).not.toContain(suite.id);
            }
        });

        it("lists deleted suites for a project flat and as a tree", async () => {
            const flat = await client.getDeletedTestSuitesForProject("proj");
            const tree = await client.getDeletedTestSuitesForProject("proj", SuiteExpand.None, "token", true);
            expect(flat.map(s => s.id)).toEqual(data.deletedSuites.map(s => s.id));
            expect(tree.map(s => s.children)).toEqual([[], []]);
        });

        it("restores a deleted suite", async () => {
            await expect(client.restoreDeletedTestSuite({ isDeleted: false }, "proj", 1)).resolves.toBeUndefined();
        });
    });

    describe("suite entries", () => {
        it("lists every entry under the requested suite", async () => {
            const entries = await client.getSuiteEntries("proj", 4242);
            expect(entries.length).toBe(8);
            expect(new Set(entries.map(e => e.id)).size).toBe(8);
            expect(entries.every(e => e.suiteId === 4242)).toBe(true);
        });

        it("filters test case entries", async () => {
            const entries = await client.getSuiteEntries("proj", root.id, SuiteEntryTypes.TestCase);
            expect(entries.map(e => e.id)).toEqual(data.testCases.map(t => t.workItem.id));
            expect(entries.map(e => e.sequenceNumber)).toEqual([1, 2, 3, 4, 5]);
        });

        it("filters suite entries", async () => {
            const entries = await client.getSuiteEntries("proj", root.id, SuiteEntryTypes.Suite);
            expect(entries.map(e => e.id)).toEqual(data.suites.slice(1).map(s => s.id));
            expect(entries.every(e => e.suiteEntryType === SuiteEntryTypes.Suite)).toBe(true);
        });

        it("reorders entries echoing the request", async () => {
            const reordered = await client.reorderSuiteEntries(
                [
                    { id: 2, sequenceNumber: 1, suiteEntryType: SuiteEntryTypes.TestCase },
                    { id: 1, sequenceNumber: 2, suiteEntryType: SuiteEntryTypes.Suite }
                ],
                "proj",
                77
            );
            expect(reordered).toEqual([
                { id: 2, sequenceNumber: 1, suiteEntryType: SuiteEntryTypes.TestCase, suiteId: 77 },
                { id: 1, sequenceNumber: 2, suiteEntryType: SuiteEntryTypes.Suite, suiteId: 77 }
            ]);
        });
    });

    describe("test cases", () => {
        it("lists the seeded test cases as a page", async () => {
            const page = await client.getTestCaseList("proj", plan.id, child.id);
            expect(page.length).toBe(5);
            expect(page.continuationToken).toBeNull();
            expect(new Set(page.map(t => t.workItem.id)).size).toBe(5);
            expect(page.map(t => t.order)).toEqual([1, 2, 3, 4, 5]);
            for (const testCase of page) {
                expect(testCase.testPlan).toEqual({ id: plan.id, name: plan.name });
                expect(testCase.testSuite).toEqual({ id: child.id, name: child.name });
                expect(testCase.pointAssignments.length).toBe(1);
                expect(data.configurations.map(c => c.id)).toContain(testCase.pointAssignments[0].configurationId);
                expect(typeof testCase.pointAssignments[0].tester.displayName).toBe("string");
                expect(typeof testCase.workItem.name).toBe("string");
                expect(testCase.workItem.workItemFields.length).toBe(2);
                expect(typeof testCase.project.id).toBe("string");
            }
        });

        it("filters test cases by id", async () => {
            const wanted = [data.testCases[1].workItem.id, data.testCases[3].workItem.id];
            const page = await client.getTestCaseList(
                "proj",
                plan.id,
                child.id,
                wanted.join(","),
                undefined,
                "System.Title",
                "token",
                true,
                false,
                ExcludeFlags.PointAssignments,
                true
            );
            expect(page.map(t => t.workItem.id)).toEqual(wanted);
        });

        it("filters test cases by configuration", async () => {
            const configurationId = data.configurations[0].id;
            const page = await client.getTestCaseList("proj", plan.id, child.id, undefined, String(configurationId));
            expect(page.map(t => t.workItem.id)).toEqual([
                data.testCases[0].workItem.id,
                data.testCases[3].workItem.id
            ]);
        });

        it("returns no test case that lacks one of the configurations", async () => {
            const wanted = `${data.configurations[0].id},${data.configurations[1].id}`;
            const page = await client.getTestCaseList("proj", plan.id, child.id, undefined, wanted);
            expect(page.length).toBe(0);
            expect(page.continuationToken).toBeNull();
        });

        it("gets a known test case", async () => {
            const known = data.testCases[2];
            const found = await client.getTestCase(
                "proj",
                plan.id,
                child.id,
                String(known.workItem.id),
                "System.Title",
                true
            );
            expect(found).toEqual([known]);
            expect(found[0]).toBe(known);
        });

        it("fabricates an unknown test case", async () => {
            const found = await client.getTestCase("proj", plan.id, child.id, "998010");
            expect(found.length).toBe(1);
            expect(found[0].workItem.id).toBe(998_010);
            expect(found[0].pointAssignments.length).toBe(1);
            expect(typeof found[0].pointAssignments[0].configurationName).toBe("string");
        });

        it("adds test cases with the requested configurations", async () => {
            const known = data.testCases[0];
            const [first, second] = data.configurations;
            const added = await client.addTestCasesToSuite(
                [
                    {
                        workItem: { id: known.workItem.id },
                        pointAssignments: [{ configurationId: first.id }, { configurationId: second.id }]
                    },
                    { workItem: { id: 998_011 }, pointAssignments: [{ configurationId: 998_012 }] }
                ],
                "proj",
                plan.id,
                child.id
            );
            expect(added.length).toBe(2);
            expect(added[0].workItem).toBe(known.workItem);
            expect(added[0].pointAssignments.map(a => a.configurationId)).toEqual([first.id, second.id]);
            expect(added[0].pointAssignments.map(a => a.configurationName)).toEqual([first.name, second.name]);
            expect(added[1].workItem.id).toBe(998_011);
            expect(added[1].pointAssignments[0].configurationId).toBe(998_012);
            expect(typeof added[1].pointAssignments[0].configurationName).toBe("string");
            for (const testCase of added) {
                expect(testCase.testPlan).toEqual({ id: plan.id, name: plan.name });
                expect(testCase.testSuite).toEqual({ id: child.id, name: child.name });
            }
        });

        it("updates the configurations of suite test cases", async () => {
            const known = data.testCases[1];
            const [updated] = await client.updateSuiteTestCases(
                [
                    {
                        workItem: { id: known.workItem.id },
                        pointAssignments: [{ configurationId: data.configurations[2].id }]
                    }
                ],
                "proj",
                998_013,
                998_014
            );
            expect(updated.workItem).toBe(known.workItem);
            expect(updated.pointAssignments.length).toBe(1);
            expect(updated.pointAssignments[0].configurationName).toBe(data.configurations[2].name);
            expect(updated.testPlan.id).toBe(998_013);
            expect(updated.testSuite.id).toBe(998_014);
            expect(known.pointAssignments[0].configurationId).toBe(data.configurations[1].id);
        });

        it("removes test cases from a suite", async () => {
            await expect(client.removeTestCasesFromSuite("proj", 1, 2, "3,4")).resolves.toBeUndefined();
            await expect(client.removeTestCasesListFromSuite("proj", 1, 2, "3,4")).resolves.toBeUndefined();
        });

        it("deletes a test case", async () => {
            await expect(client.deleteTestCase("proj", 3)).resolves.toBeUndefined();
        });
    });

    describe("points", () => {
        it("lists the seeded points as a page", async () => {
            const page = await client.getPointsList("proj", plan.id, child.id);
            expect(page.length).toBe(5);
            expect(page.continuationToken).toBeNull();
            expect(new Set(page.map(p => p.id)).size).toBe(5);
            page.forEach((point, index) => {
                const testCase = data.testCases[index];
                const [assignment] = testCase.pointAssignments;
                expect(point.id).toBe(assignment.id);
                expect(point.configuration).toEqual({
                    id: assignment.configurationId,
                    name: assignment.configurationName
                });
                expect(point.tester).toBe(assignment.tester);
                expect(point.testCaseReference.id).toBe(testCase.workItem.id);
                expect(point.testCaseReference.name).toBe(testCase.workItem.name);
                expect(point.testPlan).toBe(testCase.testPlan);
                expect(point.testSuite).toBe(testCase.testSuite);
                expect(point.isActive).toBe(true);
                expect(point.results.state).toBe(PointState.Completed);
                expect(point.results.lastResultDetails.dateCompleted).toBeInstanceOf(Date);
                expect(typeof point.results.lastRunBuildNumber).toBe("string");
                expect(point.lastResetToActive).toBeInstanceOf(Date);
            });
        });

        it("filters points by id", async () => {
            const wanted = [data.points[0].id, data.points[4].id];
            const page = await client.getPointsList("proj", plan.id, child.id, wanted.join(","));
            expect(page.map(p => p.id)).toEqual(wanted);
        });

        it("filters points by test case", async () => {
            const testCaseId = data.testCases[2].workItem.id;
            const page = await client.getPointsList(
                "proj",
                plan.id,
                child.id,
                undefined,
                String(testCaseId),
                "token",
                true,
                false,
                true
            );
            expect(page.length).toBe(1);
            expect(page[0]).toBe(data.points[2]);
        });

        it("combines the point and test case filters", async () => {
            const page = await client.getPointsList(
                "proj",
                plan.id,
                child.id,
                String(data.points[0].id),
                String(data.testCases[1].workItem.id)
            );
            expect(page.length).toBe(0);
        });

        it("gets a known point", async () => {
            const found = await client.getPoints("proj", plan.id, child.id, String(data.points[1].id), true, false);
            expect(found.length).toBe(1);
            expect(found[0]).toBe(data.points[1]);
        });

        it("fabricates an unknown point", async () => {
            const found = await client.getPoints("proj", plan.id, child.id, "998020");
            expect(found.length).toBe(1);
            expect(found[0].id).toBe(998_020);
            expect(typeof found[0].testCaseReference.assignedTo.displayName).toBe("string");
            expect(typeof found[0].configuration.name).toBe("string");
        });

        it("updates known and unknown points", async () => {
            const known = data.points[3];
            const tester = data.points[0].tester;
            const updated = await client.updateTestPoints(
                [
                    { id: known.id, isActive: false, tester, results: { outcome: Outcome.Blocked } },
                    { id: 998_021, isActive: true, tester, results: { outcome: Outcome.Passed } }
                ],
                "proj",
                plan.id,
                child.id,
                true,
                false
            );
            expect(updated.length).toBe(2);
            expect(updated[0].id).toBe(known.id);
            expect(updated[0].isActive).toBe(false);
            expect(updated[0].tester).toBe(tester);
            expect(updated[0].results.outcome).toBe(Outcome.Blocked);
            expect(updated[0].results.lastResultId).toBe(known.results.lastResultId);
            expect(updated[0].testCaseReference).toBe(known.testCaseReference);
            expect(updated[1].id).toBe(998_021);
            expect(updated[1].results.outcome).toBe(Outcome.Passed);
            expect(known.isActive).toBe(true);
        });
    });
});
