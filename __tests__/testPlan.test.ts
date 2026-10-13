import { TestPlanRestClient, TestEntityTypes, UserFriendlyTestOutcome } from "azure-devops-extension-api/TestPlan";
import { CloneOperationState, TestConfigurationState } from "azure-devops-extension-api/Test";
import { getClient, getRegisteredMockClient, MockTestPlanRestClient } from "../azure-devops-extension-api";

const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);

const cloneOptions = {
    cloneRequirements: true,
    copyAllSuites: false,
    copyAncestorHierarchy: true,
    destinationWorkItemType: "Test Case",
    overrideParameters: { "System.AreaPath": "area" },
    relatedLinkComment: "cloned"
};

describe("TestPlanRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TestPlanRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(TestPlanRestClient)).toBe(MockTestPlanRestClient);
        expect(new MockTestPlanRestClient({}).TYPE).toBe(TestPlanRestClient);
    });

    describe("configurations", () => {
        const parameters = {
            name: "Edge on Windows",
            description: "desktop",
            isDefault: true,
            state: TestConfigurationState.Inactive,
            values: [{ name: "Browser", value: "Edge" }]
        };

        it("lists the seeded configurations as a page", async () => {
            const page = await client.getTestConfigurations("proj", "token");
            expect(page.length).toBe(3);
            expect(page.continuationToken).toBeNull();
            expect(page[0].isDefault).toBe(true);
            expect(page[2].state).toBe(TestConfigurationState.Inactive);
            expect(new Set(page.map(c => c.id)).size).toBe(3);
            for (const configuration of page) {
                expect(typeof configuration.name).toBe("string");
                expect(typeof configuration.project.id).toBe("string");
                expect(configuration.values.map(v => v.name)).toEqual(["Operating System", "Browser"]);
            }
        });

        it("gets a known configuration", async () => {
            const [, second] = await client.getTestConfigurations("proj");
            expect(await client.getTestConfigurationById("proj", second.id)).toBe(second);
        });

        it("fabricates an unknown configuration", async () => {
            const made = await client.getTestConfigurationById("proj", 999_001);
            expect(made.id).toBe(999_001);
            expect(made.state).toBe(TestConfigurationState.Active);
        });

        it("creates a configuration echoing the parameters", async () => {
            const created = await client.createTestConfiguration(parameters, "proj");
            expect(created).toMatchObject(parameters);
            expect(typeof created.id).toBe("number");
            expect(typeof created.project.name).toBe("string");
        });

        it("updates a known configuration", async () => {
            const [first] = await client.getTestConfigurations("proj");
            const updated = await client.updateTestConfiguration(parameters, "proj", first.id);
            expect(updated).toMatchObject(parameters);
            expect(updated.id).toBe(first.id);
            expect(updated.project).toBe(first.project);
        });

        it("updates an unknown configuration", async () => {
            const updated = await client.updateTestConfiguration(parameters, "proj", 999_002);
            expect(updated.id).toBe(999_002);
            expect(updated.name).toBe("Edge on Windows");
        });

        it("deletes a configuration", async () => {
            await expect(client.deleteTestConfguration("proj", 1)).resolves.toBeUndefined();
        });
    });

    describe("variables", () => {
        const parameters = { name: "Browser", description: "supported browsers", values: ["Edge", "Chrome"] };

        it("lists the seeded variables as a page", async () => {
            const page = await client.getTestVariables("proj", "token");
            expect(page.length).toBe(3);
            expect(page.continuationToken).toBeNull();
            expect(new Set(page.map(v => v.id)).size).toBe(3);
            for (const variable of page) {
                expect(typeof variable.name).toBe("string");
                expect(typeof variable.description).toBe("string");
                expect(typeof variable.project.id).toBe("string");
                expect(variable.values.length).toBe(3);
            }
        });

        it("gets a known variable", async () => {
            const [first] = await client.getTestVariables("proj");
            expect(await client.getTestVariableById("proj", first.id)).toBe(first);
        });

        it("fabricates an unknown variable", async () => {
            const made = await client.getTestVariableById("proj", 999_003);
            expect(made.id).toBe(999_003);
            expect(made.values.length).toBe(3);
        });

        it("creates a variable echoing the parameters", async () => {
            const created = await client.createTestVariable(parameters, "proj");
            expect(created).toMatchObject(parameters);
            expect(typeof created.id).toBe("number");
        });

        it("updates a known variable", async () => {
            const [first] = await client.getTestVariables("proj");
            const updated = await client.updateTestVariable(parameters, "proj", first.id);
            expect(updated).toMatchObject(parameters);
            expect(updated.id).toBe(first.id);
            expect(updated.project).toBe(first.project);
        });

        it("updates an unknown variable", async () => {
            const updated = await client.updateTestVariable(parameters, "proj", 999_004);
            expect(updated.id).toBe(999_004);
            expect(updated.values).toEqual(["Edge", "Chrome"]);
        });

        it("deletes a variable", async () => {
            await expect(client.deleteTestVariable("proj", 1)).resolves.toBeUndefined();
        });
    });

    describe("plans", () => {
        it("lists the seeded plans as a page", async () => {
            const page = await client.getTestPlans("proj");
            expect(page.length).toBe(5);
            expect(page.continuationToken).toBeNull();
            expect(new Set(page.map(p => p.id)).size).toBe(5);
            expect(page.map(p => p.state)).toEqual(["Active", "Active", "Active", "Inactive", "Active"]);
            for (const plan of page) {
                expect(plan.name.startsWith("Plan ")).toBe(true);
                expect(typeof plan.owner.displayName).toBe("string");
                expect(typeof plan.project.id).toBe("string");
                expect(typeof plan.rootSuite.id).toBe("number");
                expect(typeof plan.buildDefinition.name).toBe("string");
                expect(typeof plan.releaseEnvironmentDefinition.definitionId).toBe("number");
                expect(typeof plan.yamlReleaseReference.definitionId).toBe("number");
                expect(plan.actualTestResultSettings.isActualTestResultEnabled).toBe(false);
                expect(plan.testOutcomeSettings.syncOutcomeAcrossSuites).toBe(false);
                expect(typeof plan.automatedTestEnvironment.environmentId).toBe("string");
                expect(typeof plan.manualTestSettings.testSettingsName).toBe("string");
                expect(plan.startDate).toBeInstanceOf(Date);
                expect(plan.endDate.getTime()).toBeGreaterThan(plan.startDate.getTime());
                expect(plan.updatedDate).toBeInstanceOf(Date);
            }
        });

        it("filters plans by owner id, display name and unique name", async () => {
            const all = await client.getTestPlans("proj");
            const { owner } = all[1];
            for (const key of [owner.id, owner.displayName, owner.uniqueName]) {
                const owned = await client.getTestPlans("proj", key, "token", true);
                expect(owned.length).toBeGreaterThan(0);
                expect(owned).toContain(all[1]);
                expect(owned.continuationToken).toBeNull();
            }
            expect(await client.getTestPlans("proj", "nobody")).toHaveLength(0);
        });

        it("filters active plans", async () => {
            const active = await client.getTestPlans("proj", undefined, undefined, false, true);
            expect(active.length).toBe(4);
            expect(active.every(p => p.state === "Active")).toBe(true);
        });

        it("combines the owner and active filters", async () => {
            const all = await client.getTestPlans("proj");
            expect(await client.getTestPlans("proj", all[3].owner.id, undefined, undefined, true)).not.toContain(all[3]);
        });

        it("gets a known plan", async () => {
            const all = await client.getTestPlans("proj");
            expect(await client.getTestPlanById("proj", all[2].id)).toBe(all[2]);
        });

        it("fabricates an unknown plan", async () => {
            const made = await client.getTestPlanById("proj", 999_005);
            expect(made.id).toBe(999_005);
            expect(made.state).toBe("Active");
        });

        it("creates a plan echoing the parameters", async () => {
            const [template] = await client.getTestPlans("proj");
            const { id: _id, ...parameters } = template;
            const created = await client.createTestPlan({ ...parameters, name: "Release 2", areaPath: "proj\\area" }, "proj");
            expect(created.name).toBe("Release 2");
            expect(created.areaPath).toBe("proj\\area");
            expect(created.owner).toBe(template.owner);
            expect(typeof created.id).toBe("number");
            expect(created.id).not.toBe(template.id);
        });

        it("updates a known plan", async () => {
            const all = await client.getTestPlans("proj");
            const updated = await client.updateTestPlan({ ...all[0], name: "Renamed", revision: 77 }, "proj", all[1].id);
            expect(updated.id).toBe(all[1].id);
            expect(updated.name).toBe("Renamed");
            expect(updated.revision).toBe(77);
        });

        it("updates an unknown plan", async () => {
            const [template] = await client.getTestPlans("proj");
            const updated = await client.updateTestPlan({ ...template, state: "Inactive" }, "proj", 999_006);
            expect(updated.id).toBe(999_006);
            expect(updated.state).toBe("Inactive");
        });

        it("deletes a plan", async () => {
            await expect(client.deleteTestPlan("proj", 1)).resolves.toBeUndefined();
        });

        it("lists deleted plans as a page", async () => {
            const live = await client.getTestPlans("proj");
            const deleted = await client.getDeletedTestPlans("proj", "token");
            expect(deleted.length).toBe(2);
            expect(deleted.continuationToken).toBeNull();
            for (const plan of deleted) {
                expect(live.map(p => p.id)).not.toContain(plan.id);
            }
        });

        it("restores a deleted plan", async () => {
            await expect(client.restoreDeletedTestPlan({ isDeleted: false }, "proj", 1)).resolves.toBeUndefined();
        });

        it("queues a plan with test cases", async () => {
            const queued = await client.createTestPlanWithTestCases(
                {
                    areaPath: "proj",
                    featureWorkItemId: 12,
                    testCaseData: [{ title: "Signs in", steps: "<steps />" }],
                    testPlanDescription: "generated",
                    testPlanName: "Generated plan"
                },
                "proj"
            );
            expect(queued).toBe(true);
        });

        it("counts entities per seeded suite of the plan", async () => {
            const suites = await client.getTestSuitesForPlan("proj", 1);
            const counts = await client.getTestEntityCountByPlanId(
                "proj",
                321,
                "Active",
                UserFriendlyTestOutcome.Passed,
                "1,2",
                "tester",
                "assignee",
                TestEntityTypes.TestPoint
            );
            expect(counts.map(c => c.testSuiteId)).toEqual(suites.map(s => s.id));
            for (const count of counts) {
                expect(count.testPlanId).toBe(321);
                expect(count.count).toBeGreaterThanOrEqual(0);
                expect(count.totalCount).toBeGreaterThanOrEqual(count.count);
            }
        });
    });

    describe("clone operations", () => {
        it("queues a plan clone echoing the request", async () => {
            const [template] = await client.getTestPlans("proj");
            const { id: _id, project: _project, ...parameters } = template;
            const operation = await client.cloneTestPlan(
                {
                    cloneOptions,
                    destinationTestPlan: { ...parameters, name: "Copy", project: "Destination" },
                    sourceTestPlan: { id: 41, suiteIds: [5, 6] }
                },
                "proj",
                true
            );
            expect(operation.cloneOperationResponse.state).toBe(CloneOperationState.Queued);
            expect(typeof operation.cloneOperationResponse.opId).toBe("number");
            expect(operation.cloneOptions).toBe(cloneOptions);
            expect(operation.destinationTestPlan.name).toBe("Copy");
            expect(operation.destinationTestPlan.project.name).toBe("Destination");
            expect(typeof operation.destinationTestPlan.project.id).toBe("string");
            expect(typeof operation.destinationTestPlan.id).toBe("number");
            expect(operation.sourceTestPlan.id).toBe(41);
            expect(operation.sourceTestPlan.suiteIds).toEqual([5, 6]);
            expect(typeof operation.sourceTestPlan.project.id).toBe("string");
        });

        it("fabricates plan clone information for an unknown operation", async () => {
            const operation = await client.getCloneInformation("proj", 999_010);
            expect(operation.cloneOperationResponse.opId).toBe(999_010);
            expect(operation.cloneOperationResponse.state).toBe(CloneOperationState.Succeeded);
            expect(operation.cloneOperationResponse.completionDate).toBeInstanceOf(Date);
            expect(operation.cloneOperationResponse.cloneStatistics.clonedTestCasesCount).toBe(
                operation.cloneOperationResponse.cloneStatistics.totalTestCasesCount
            );
            expect(operation.sourceTestPlan.suiteIds.length).toBe(2);
            expect(operation.cloneOptions.destinationWorkItemType).toBe("Test Case");
        });

        it("queues a suite clone echoing the request", async () => {
            const operation = await client.cloneTestSuite(
                { cloneOptions, destinationTestSuite: { id: 71, project: "Destination" }, sourceTestSuite: { id: 70 } },
                "proj",
                false
            );
            expect(operation.cloneOperationResponse.state).toBe(CloneOperationState.Queued);
            expect(operation.cloneOptions).toBe(cloneOptions);
            expect(operation.destinationTestSuite.id).toBe(71);
            expect(operation.destinationTestSuite.project.name).toBe("Destination");
            expect(operation.sourceTestSuite.id).toBe(70);
            expect(typeof operation.sourceTestSuite.project.id).toBe("string");
            expect(typeof operation.clonedTestSuite.id).toBe("number");
        });

        it("fabricates suite clone information for an unknown operation", async () => {
            const operation = await client.getSuiteCloneInformation("proj", 999_011);
            expect(operation.cloneOperationResponse.opId).toBe(999_011);
            expect(typeof operation.clonedTestSuite.name).toBe("string");
            expect(typeof operation.destinationTestSuite.project.id).toBe("string");
        });

        it("queues a test case clone echoing the request", async () => {
            const options = { includeAttachments: false, includeLinks: true, relatedLinkComment: "copied" };
            const operation = await client.cloneTestCase(
                {
                    cloneOptions: options,
                    destinationTestPlan: { id: 1, name: "Destination plan" },
                    destinationTestSuite: { id: 81, project: "Destination" },
                    sourceTestPlan: { id: 2, name: "Source plan" },
                    sourceTestSuite: { id: 80 },
                    testCaseIds: [11, 12, 13]
                },
                "proj"
            );
            expect(operation.cloneOperationResponse.state).toBe(CloneOperationState.Queued);
            expect(operation.cloneOptions).toBe(options);
            expect(operation.destinationTestSuite.id).toBe(81);
            expect(operation.destinationTestSuite.project.name).toBe("Destination");
            expect(operation.sourceTestSuite.id).toBe(80);
            expect(operation.sourceTestSuite.testCaseIds).toEqual([11, 12, 13]);
        });

        it("fabricates test case clone information for an unknown operation", async () => {
            const operation = await client.getTestCaseCloneInformation("proj", 999_012);
            expect(operation.cloneOperationResponse.opId).toBe(999_012);
            expect(operation.cloneOptions.includeAttachments).toBe(true);
            expect(operation.sourceTestSuite.testCaseIds.length).toBe(2);
        });

        it("exports test cases as a buffer", async () => {
            const exported = await client.exportTestCases(
                { columnOptions: ["System.Id", "System.Title"], testCaseIds: [11, 12], testPlanId: 1, testSuiteId: 2 },
                "proj"
            );
            expect(exported).toBeInstanceOf(ArrayBuffer);
            expect(decode(exported)).toBe("System.Id,System.Title\n11\n12");
        });
    });
});
