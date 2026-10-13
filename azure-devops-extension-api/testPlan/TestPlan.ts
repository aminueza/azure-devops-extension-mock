import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    CloneTestCaseOperationInformation,
    CloneTestCaseParams,
    CloneTestPlanOperationInformation,
    CloneTestPlanParams,
    CloneTestSuiteOperationInformation,
    CloneTestSuiteParams,
    DestinationTestSuiteInfo,
    ExcludeFlags,
    ExportTestCaseParams,
    SuiteEntry,
    SuiteEntryTypes,
    SuiteEntryUpdateParams,
    SuiteExpand,
    SuiteTestCaseCreateUpdateParameters,
    TestCase,
    TestConfiguration,
    TestConfigurationCreateUpdateParameters,
    TestConfigurationReference,
    TestEntityCount,
    TestEntityTypes,
    TestPlan,
    TestPlanAndSuiteRestoreModel,
    TestPlanCreateParams,
    TestPlanReference,
    TestPlanRestClient,
    TestPlanUpdateParams,
    TestPlanWithTestCasesCreateParams,
    TestPoint,
    TestPointUpdateParams,
    TestSuite,
    TestSuiteCreateParams,
    TestSuiteReference,
    TestSuiteReferenceWithProject,
    TestSuiteUpdateParams,
    TestVariable,
    TestVariableCreateUpdateParameters,
    UserFriendlyTestOutcome
} from "azure-devops-extension-api/TestPlan";
import { CloneOperationState } from "azure-devops-extension-api/Test";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeProjectReference } from "../core/Data";
import { makeBuffer } from "../test/Data";
import {
    configurations,
    deletedPlans,
    deletedSuites,
    makeCloneOperationResponse,
    makeCloneTestCaseOperation,
    makeCloneTestPlanOperation,
    makeCloneTestSuiteOperation,
    makePage,
    makePointAssignment,
    makeSourceTestPlanResponse,
    makeSourceTestSuiteResponse,
    makeTestCase,
    makeTestConfiguration,
    makeTestEntityCount,
    makeTestPlan,
    makeTestPoint,
    makeTestSuite,
    makeTestSuiteReferenceWithProject,
    makeTestVariable,
    planCloneOperations,
    plans,
    points,
    suiteCloneOperations,
    suiteEntries,
    suites,
    testCaseCloneOperations,
    testCases,
    variables
} from "./Data";

const parseIds = (ids?: string): number[] => (ids ? ids.split(",").map(Number) : []);

const findPlan = (id: number): TestPlan => plans.find(p => p.id === id) ?? { ...makeTestPlan(), id };

const findSuite = (planId: number, id: number): TestSuite =>
    suites.find(s => s.id === id) ?? { ...makeTestSuite(planReference(planId)), id };

const findConfiguration = (id: number): TestConfiguration =>
    configurations.find(c => c.id === id) ?? { ...makeTestConfiguration(), id };

const findVariable = (id: number): TestVariable => variables.find(v => v.id === id) ?? { ...makeTestVariable(), id };

const findTestCase = (id: number): TestCase => testCases.find(t => t.workItem.id === id) ?? makeTestCase(id);

const findPoint = (id: number): TestPoint => points.find(p => p.id === id) ?? { ...makeTestPoint(), id };

const planReference = (id: number): TestPlanReference => {
    const plan = findPlan(id);
    return { id: plan.id, name: plan.name };
};

const suiteReference = (planId: number, id: number): TestSuiteReference => {
    const suite = findSuite(planId, id);
    return { id: suite.id, name: suite.name };
};

const configurationReference = (id: number): TestConfigurationReference => {
    const configuration = findConfiguration(id);
    return { id: configuration.id, name: configuration.name };
};

const destinationSuite = (destination: DestinationTestSuiteInfo): TestSuiteReferenceWithProject => ({
    ...makeTestSuiteReferenceWithProject(),
    id: destination.id,
    project: { ...makeProjectReference(), name: destination.project }
});

const asTree = (flat: TestSuite[]): TestSuite[] =>
    flat
        .filter(suite => !flat.some(other => other.id !== suite.id && other.id === suite.parentSuite.id))
        .map(root => ({
            ...root,
            children: flat.filter(child => child.id !== root.id && child.parentSuite.id === root.id)
        }));

const suitePage = (flat: TestSuite[], asTreeView?: boolean): PagedList<TestSuite> => {
    const listed = asTreeView ? asTree(flat) : flat;
    return makePage(listed);
};

const assignTestCases = (
    parameters: SuiteTestCaseCreateUpdateParameters[],
    planId: number,
    suiteId: number
): TestCase[] =>
    parameters.map(parameter => ({
        ...findTestCase(parameter.workItem.id),
        pointAssignments: parameter.pointAssignments.map(assignment =>
            makePointAssignment(configurationReference(assignment.configurationId))
        ),
        testPlan: planReference(planId),
        testSuite: suiteReference(planId, suiteId)
    }));

export class MockTestPlanRestClient extends RestClientBase {
    public TYPE = TestPlanRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createTestConfiguration(
        testConfigurationCreateUpdateParameters: TestConfigurationCreateUpdateParameters,
        _project: string
    ): Promise<TestConfiguration> {
        return Promise.resolve({ ...makeTestConfiguration(), ...testConfigurationCreateUpdateParameters });
    }

    deleteTestConfguration(_project: string, _testConfiguartionId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestConfigurationById(_project: string, testConfigurationId: number): Promise<TestConfiguration> {
        return Promise.resolve(findConfiguration(testConfigurationId));
    }

    getTestConfigurations(_project: string, _continuationToken?: string): Promise<PagedList<TestConfiguration>> {
        return Promise.resolve(makePage(configurations));
    }

    updateTestConfiguration(
        testConfigurationCreateUpdateParameters: TestConfigurationCreateUpdateParameters,
        _project: string,
        testConfiguartionId: number
    ): Promise<TestConfiguration> {
        return Promise.resolve({
            ...findConfiguration(testConfiguartionId),
            ...testConfigurationCreateUpdateParameters,
            id: testConfiguartionId
        });
    }

    getTestEntityCountByPlanId(
        _project: string,
        planId: number,
        _states?: string,
        _outcome?: UserFriendlyTestOutcome,
        _configurations?: string,
        _testers?: string,
        _assignedTo?: string,
        _entity?: TestEntityTypes
    ): Promise<TestEntityCount[]> {
        return Promise.resolve(suites.map(suite => makeTestEntityCount(planId, suite.id)));
    }

    createTestPlan(testPlanCreateParams: TestPlanCreateParams, _project: string): Promise<TestPlan> {
        return Promise.resolve({ ...makeTestPlan(), ...testPlanCreateParams });
    }

    deleteTestPlan(_project: string, _planId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestPlanById(_project: string, planId: number): Promise<TestPlan> {
        return Promise.resolve(findPlan(planId));
    }

    getTestPlans(
        _project: string,
        owner?: string,
        _continuationToken?: string,
        _includePlanDetails?: boolean,
        filterActivePlans?: boolean
    ): Promise<PagedList<TestPlan>> {
        const owned = owner
            ? plans.filter(p => [p.owner.id, p.owner.displayName, p.owner.uniqueName].includes(owner))
            : plans;
        return Promise.resolve(makePage(filterActivePlans ? owned.filter(p => p.state === "Active") : owned));
    }

    updateTestPlan(testPlanUpdateParams: TestPlanUpdateParams, _project: string, planId: number): Promise<TestPlan> {
        return Promise.resolve({ ...findPlan(planId), ...testPlanUpdateParams, id: planId });
    }

    getSuiteEntries(_project: string, suiteId: number, suiteEntryType?: SuiteEntryTypes): Promise<SuiteEntry[]> {
        const matched =
            suiteEntryType === undefined ? suiteEntries : suiteEntries.filter(e => e.suiteEntryType === suiteEntryType);
        return Promise.resolve(matched.map(entry => ({ ...entry, suiteId })));
    }

    reorderSuiteEntries(
        suiteEntries: SuiteEntryUpdateParams[],
        _project: string,
        suiteId: number
    ): Promise<SuiteEntry[]> {
        return Promise.resolve(suiteEntries.map(entry => ({ ...entry, suiteId })));
    }

    createBulkTestSuites(
        testSuiteCreateParams: TestSuiteCreateParams[],
        _project: string,
        planId: number,
        parentSuiteId: number
    ): Promise<TestSuite[]> {
        const plan = planReference(planId);
        const parentSuite = suiteReference(planId, parentSuiteId);
        return Promise.resolve(
            testSuiteCreateParams.map(params => ({ ...makeTestSuite(plan, parentSuite), ...params, parentSuite }))
        );
    }

    createTestSuite(
        testSuiteCreateParams: TestSuiteCreateParams,
        _project: string,
        planId: number
    ): Promise<TestSuite> {
        return Promise.resolve({ ...makeTestSuite(planReference(planId)), ...testSuiteCreateParams });
    }

    deleteTestSuite(_project: string, _planId: number, _suiteId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestSuiteById(_project: string, planId: number, suiteId: number, _expand?: SuiteExpand): Promise<TestSuite> {
        return Promise.resolve(findSuite(planId, suiteId));
    }

    getTestSuitesForPlan(
        _project: string,
        _planId: number,
        _expand?: SuiteExpand,
        _continuationToken?: string,
        asTreeView?: boolean
    ): Promise<PagedList<TestSuite>> {
        return Promise.resolve(suitePage(suites, asTreeView));
    }

    updateTestSuite(
        testSuiteUpdateParams: TestSuiteUpdateParams,
        _project: string,
        planId: number,
        suiteId: number
    ): Promise<TestSuite> {
        return Promise.resolve({ ...findSuite(planId, suiteId), ...testSuiteUpdateParams, id: suiteId });
    }

    getSuitesByTestCaseId(testCaseId: number): Promise<TestSuite[]> {
        const suiteIds = testCases.filter(t => t.workItem.id === testCaseId).map(t => t.testSuite.id);
        const matched = suites.filter(s => suiteIds.includes(s.id));
        return Promise.resolve(matched.length ? matched : [makeTestSuite()]);
    }

    addTestCasesToSuite(
        suiteTestCaseCreateUpdateParameters: SuiteTestCaseCreateUpdateParameters[],
        _project: string,
        planId: number,
        suiteId: number
    ): Promise<TestCase[]> {
        return Promise.resolve(assignTestCases(suiteTestCaseCreateUpdateParameters, planId, suiteId));
    }

    getTestCase(
        _project: string,
        _planId: number,
        _suiteId: number,
        testCaseId: string,
        _witFields?: string,
        _returnIdentityRef?: boolean
    ): Promise<TestCase[]> {
        return Promise.resolve([findTestCase(Number(testCaseId))]);
    }

    getTestCaseList(
        _project: string,
        _planId: number,
        _suiteId: number,
        testIds?: string,
        configurationIds?: string,
        _witFields?: string,
        _continuationToken?: string,
        _returnIdentityRef?: boolean,
        _expand?: boolean,
        _excludeFlags?: ExcludeFlags,
        _isRecursive?: boolean
    ): Promise<PagedList<TestCase>> {
        const wantedIds = parseIds(testIds);
        const wantedConfigurations = parseIds(configurationIds);
        const matched = testCases.filter(
            t =>
                (wantedIds.length === 0 || wantedIds.includes(t.workItem.id)) &&
                wantedConfigurations.every(id => t.pointAssignments.some(a => a.configurationId === id))
        );
        return Promise.resolve(makePage(matched));
    }

    removeTestCasesFromSuite(_project: string, _planId: number, _suiteId: number, _testCaseIds: string): Promise<void> {
        return Promise.resolve();
    }

    removeTestCasesListFromSuite(_project: string, _planId: number, _suiteId: number, _testIds: string): Promise<void> {
        return Promise.resolve();
    }

    updateSuiteTestCases(
        suiteTestCaseCreateUpdateParameters: SuiteTestCaseCreateUpdateParameters[],
        _project: string,
        planId: number,
        suiteId: number
    ): Promise<TestCase[]> {
        return Promise.resolve(assignTestCases(suiteTestCaseCreateUpdateParameters, planId, suiteId));
    }

    cloneTestCase(cloneRequestBody: CloneTestCaseParams, _project: string): Promise<CloneTestCaseOperationInformation> {
        return Promise.resolve({
            ...makeCloneTestCaseOperation(),
            cloneOperationResponse: { ...makeCloneOperationResponse(), state: CloneOperationState.Queued },
            cloneOptions: cloneRequestBody.cloneOptions,
            destinationTestSuite: destinationSuite(cloneRequestBody.destinationTestSuite),
            sourceTestSuite: {
                ...makeSourceTestSuiteResponse(),
                id: cloneRequestBody.sourceTestSuite.id,
                testCaseIds: cloneRequestBody.testCaseIds
            }
        });
    }

    getTestCaseCloneInformation(
        _project: string,
        cloneOperationId: number
    ): Promise<CloneTestCaseOperationInformation> {
        return Promise.resolve(
            testCaseCloneOperations.find(o => o.cloneOperationResponse.opId === cloneOperationId) ??
                makeCloneTestCaseOperation(cloneOperationId)
        );
    }

    exportTestCases(exportTestCaseRequestBody: ExportTestCaseParams, _project: string): Promise<ArrayBuffer> {
        const rows = [
            exportTestCaseRequestBody.columnOptions.join(","),
            ...exportTestCaseRequestBody.testCaseIds.map(String)
        ];
        return Promise.resolve(makeBuffer(rows.join("\n")));
    }

    deleteTestCase(_project: string, _testCaseId: number): Promise<void> {
        return Promise.resolve();
    }

    getDeletedTestPlans(_project: string, _continuationToken?: string): Promise<PagedList<TestPlan>> {
        return Promise.resolve(makePage(deletedPlans));
    }

    restoreDeletedTestPlan(
        _restoreModel: TestPlanAndSuiteRestoreModel,
        _project: string,
        _planId: number
    ): Promise<void> {
        return Promise.resolve();
    }

    cloneTestPlan(
        cloneRequestBody: CloneTestPlanParams,
        _project: string,
        _deepClone?: boolean
    ): Promise<CloneTestPlanOperationInformation> {
        const { project, ...destinationParams } = cloneRequestBody.destinationTestPlan;
        return Promise.resolve({
            ...makeCloneTestPlanOperation(),
            cloneOperationResponse: { ...makeCloneOperationResponse(), state: CloneOperationState.Queued },
            cloneOptions: cloneRequestBody.cloneOptions,
            destinationTestPlan: {
                ...makeTestPlan(),
                ...destinationParams,
                project: { ...makeProjectReference(), name: project }
            },
            sourceTestPlan: {
                ...makeSourceTestPlanResponse(),
                id: cloneRequestBody.sourceTestPlan.id,
                suiteIds: cloneRequestBody.sourceTestPlan.suiteIds
            }
        });
    }

    getCloneInformation(_project: string, cloneOperationId: number): Promise<CloneTestPlanOperationInformation> {
        return Promise.resolve(
            planCloneOperations.find(o => o.cloneOperationResponse.opId === cloneOperationId) ??
                makeCloneTestPlanOperation(cloneOperationId)
        );
    }

    createTestPlanWithTestCases(
        _creationParams: TestPlanWithTestCasesCreateParams,
        _project: string
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    getPoints(
        _project: string,
        _planId: number,
        _suiteId: number,
        pointId: string,
        _returnIdentityRef?: boolean,
        _includePointDetails?: boolean
    ): Promise<TestPoint[]> {
        return Promise.resolve([findPoint(Number(pointId))]);
    }

    getPointsList(
        _project: string,
        _planId: number,
        _suiteId: number,
        testPointIds?: string,
        testCaseId?: string,
        _continuationToken?: string,
        _returnIdentityRef?: boolean,
        _includePointDetails?: boolean,
        _isRecursive?: boolean
    ): Promise<PagedList<TestPoint>> {
        const wantedPoints = parseIds(testPointIds);
        const wantedTestCases = parseIds(testCaseId);
        const matched = points.filter(
            p =>
                (wantedPoints.length === 0 || wantedPoints.includes(p.id)) &&
                (wantedTestCases.length === 0 || wantedTestCases.includes(p.testCaseReference.id))
        );
        return Promise.resolve(makePage(matched));
    }

    updateTestPoints(
        testPointUpdateParams: TestPointUpdateParams[],
        _project: string,
        _planId: number,
        _suiteId: number,
        _includePointDetails?: boolean,
        _returnIdentityRef?: boolean
    ): Promise<TestPoint[]> {
        return Promise.resolve(
            testPointUpdateParams.map(params => {
                const point = findPoint(params.id);
                return { ...point, ...params, results: { ...point.results, ...params.results } };
            })
        );
    }

    getDeletedTestSuitesForPlan(
        _project: string,
        _planId: number,
        _expand?: SuiteExpand,
        _continuationToken?: string,
        asTreeView?: boolean
    ): Promise<PagedList<TestSuite>> {
        return Promise.resolve(suitePage(deletedSuites, asTreeView));
    }

    getDeletedTestSuitesForProject(
        _project: string,
        _expand?: SuiteExpand,
        _continuationToken?: string,
        asTreeView?: boolean
    ): Promise<PagedList<TestSuite>> {
        return Promise.resolve(suitePage(deletedSuites, asTreeView));
    }

    restoreDeletedTestSuite(_payload: TestPlanAndSuiteRestoreModel, _project: string, _suiteId: number): Promise<void> {
        return Promise.resolve();
    }

    cloneTestSuite(
        cloneRequestBody: CloneTestSuiteParams,
        _project: string,
        _deepClone?: boolean
    ): Promise<CloneTestSuiteOperationInformation> {
        return Promise.resolve({
            ...makeCloneTestSuiteOperation(),
            cloneOperationResponse: { ...makeCloneOperationResponse(), state: CloneOperationState.Queued },
            cloneOptions: cloneRequestBody.cloneOptions,
            destinationTestSuite: destinationSuite(cloneRequestBody.destinationTestSuite),
            sourceTestSuite: { ...makeTestSuiteReferenceWithProject(), id: cloneRequestBody.sourceTestSuite.id }
        });
    }

    getSuiteCloneInformation(_project: string, cloneOperationId: number): Promise<CloneTestSuiteOperationInformation> {
        return Promise.resolve(
            suiteCloneOperations.find(o => o.cloneOperationResponse.opId === cloneOperationId) ??
                makeCloneTestSuiteOperation(cloneOperationId)
        );
    }

    createTestVariable(
        testVariableCreateUpdateParameters: TestVariableCreateUpdateParameters,
        _project: string
    ): Promise<TestVariable> {
        return Promise.resolve({ ...makeTestVariable(), ...testVariableCreateUpdateParameters });
    }

    deleteTestVariable(_project: string, _testVariableId: number): Promise<void> {
        return Promise.resolve();
    }

    getTestVariableById(_project: string, testVariableId: number): Promise<TestVariable> {
        return Promise.resolve(findVariable(testVariableId));
    }

    getTestVariables(_project: string, _continuationToken?: string): Promise<PagedList<TestVariable>> {
        return Promise.resolve(makePage(variables));
    }

    updateTestVariable(
        testVariableCreateUpdateParameters: TestVariableCreateUpdateParameters,
        _project: string,
        testVariableId: number
    ): Promise<TestVariable> {
        return Promise.resolve({
            ...findVariable(testVariableId),
            ...testVariableCreateUpdateParameters,
            id: testVariableId
        });
    }
}
