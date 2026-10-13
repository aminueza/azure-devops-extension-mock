import { fake } from "../common/fixtures";
import {
    BuildDefinitionReference,
    CloneOperationCommonResponse,
    CloneTestCaseOperationInformation,
    CloneTestPlanOperationInformation,
    CloneTestSuiteOperationInformation,
    FailureType,
    LastResolutionState,
    Outcome,
    PointAssignment,
    PointState,
    ResultState,
    SourceTestSuiteResponse,
    SourceTestplanResponse,
    SuiteEntry,
    SuiteEntryTypes,
    TestCase,
    TestCaseReference,
    TestConfiguration,
    TestConfigurationReference,
    TestEntityCount,
    TestPlan,
    TestPlanReference,
    TestPoint,
    TestPointResults,
    TestSuite,
    TestSuiteReference,
    TestSuiteReferenceWithProject,
    TestSuiteType,
    TestVariable,
    WorkItemDetails
} from "azure-devops-extension-api/TestPlan";
import {
    CloneOperationState,
    CloneOptions,
    CloneStatistics,
    CloneTestCaseOptions,
    TestConfigurationState,
    TestEnvironment
} from "azure-devops-extension-api/Test";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef, makeProjectReference } from "../core/Data";
import { makeLastResultDetails, makeTestSettings } from "../test/Data";

export const makePage = <T>(items: T[]): PagedList<T> => Object.assign([...items], { continuationToken: null });

export const makeTestPlanReference = (): TestPlanReference => ({
    id: fake.number.id(),
    name: `Plan ${fake.lorem.slug()}`
});

export const makeTestSuiteReference = (): TestSuiteReference => ({
    id: fake.number.id(),
    name: `Suite ${fake.lorem.slug()}`
});

export const makeTestConfigurationReference = (): TestConfigurationReference => ({
    id: fake.number.id(),
    name: `Configuration ${fake.lorem.slug()}`
});

export const makeBuildDefinitionReference = (): BuildDefinitionReference => ({
    id: fake.number.id(),
    name: `Build ${fake.lorem.slug()}`
});

export const makeTestEnvironment = (): TestEnvironment => ({
    environmentId: fake.string.uuid(),
    environmentName: `Environment ${fake.lorem.word()}`
});

export const makeTestPlan = (): TestPlan => ({
    _links: {},
    id: fake.number.id(),
    name: `Plan ${fake.lorem.slug()}`,
    description: fake.lorem.sentence(),
    areaPath: fake.lorem.slug(),
    iteration: `${fake.lorem.word()}\\Sprint ${fake.number.int({ min: 1, max: 50 })}`,
    state: "Active",
    revision: fake.number.int({ min: 1, max: 50 }),
    startDate: fake.date.recent({ days: 30 }),
    endDate: fake.date.future(),
    owner: makeIdentityRef(),
    updatedBy: makeIdentityRef(),
    updatedDate: fake.date.recent(),
    project: makeProjectReference(),
    rootSuite: makeTestSuiteReference(),
    buildId: fake.number.id(),
    previousBuildId: fake.number.id(),
    buildDefinition: makeBuildDefinitionReference(),
    releaseEnvironmentDefinition: {
        definitionId: fake.number.id(),
        environmentDefinitionId: fake.number.id()
    },
    yamlReleaseReference: {
        definitionId: fake.number.id(),
        stagesToSkip: ""
    },
    actualTestResultSettings: {
        isActualTestResultEnabled: false,
        isActualTestResultMandatory: false
    },
    testOutcomeSettings: { syncOutcomeAcrossSuites: false },
    automatedTestEnvironment: makeTestEnvironment(),
    automatedTestSettings: makeTestSettings(),
    manualTestEnvironment: makeTestEnvironment(),
    manualTestSettings: makeTestSettings()
});

export const makeTestSuite = (
    plan: TestPlanReference = makeTestPlanReference(),
    parentSuite: TestSuiteReference = makeTestSuiteReference()
): TestSuite => ({
    _links: {},
    id: fake.number.id(),
    name: `Suite ${fake.lorem.slug()}`,
    suiteType: TestSuiteType.StaticTestSuite,
    requirementId: 0,
    queryString: "",
    inheritDefaultConfigurations: true,
    defaultConfigurations: [],
    defaultTesters: [],
    parentSuite,
    plan,
    project: makeProjectReference(),
    children: [],
    hasChildren: false,
    revision: fake.number.int({ min: 1, max: 50 }),
    lastError: "",
    lastPopulatedDate: fake.date.recent(),
    lastUpdatedBy: makeIdentityRef(),
    lastUpdatedDate: fake.date.recent()
});

export const makeSuiteEntry = (
    suiteId: number,
    id: number,
    sequenceNumber: number,
    suiteEntryType: SuiteEntryTypes
): SuiteEntry => ({
    id,
    sequenceNumber,
    suiteEntryType,
    suiteId
});

export const makeTestConfiguration = (): TestConfiguration => ({
    id: fake.number.id(),
    name: `Configuration ${fake.lorem.slug()}`,
    description: fake.lorem.sentence(),
    isDefault: false,
    state: TestConfigurationState.Active,
    project: makeProjectReference(),
    values: [
        { name: "Operating System", value: fake.helpers.arrayElement(["Windows 11", "macOS 15", "Ubuntu 24.04"]) },
        { name: "Browser", value: fake.helpers.arrayElement(["Edge", "Chrome", "Firefox", "Safari"]) }
    ]
});

export const makeTestVariable = (): TestVariable => ({
    id: fake.number.id(),
    name: `Variable ${fake.lorem.slug()}`,
    description: fake.lorem.sentence(),
    project: makeProjectReference(),
    values: Array.from({ length: 3 }, () => fake.lorem.word())
});

export const makeWorkItemDetails = (id: number = fake.number.id()): WorkItemDetails => ({
    id,
    name: fake.lorem.sentence(),
    workItemFields: [
        { "System.State": "Design" },
        { "Microsoft.VSTS.Common.Priority": fake.number.int({ min: 1, max: 4 }) }
    ]
});

export const makePointAssignment = (
    configuration: TestConfigurationReference = makeTestConfigurationReference()
): PointAssignment => ({
    id: fake.number.id(),
    configurationId: configuration.id,
    configurationName: configuration.name,
    tester: makeIdentityRef()
});

export const makeTestCase = (workItemId?: number): TestCase => ({
    links: {},
    order: fake.number.int({ min: 1, max: 100 }),
    pointAssignments: [makePointAssignment()],
    project: makeProjectReference(),
    testPlan: makeTestPlanReference(),
    testSuite: makeTestSuiteReference(),
    workItem: makeWorkItemDetails(workItemId)
});

export const makeTestCaseReference = (): TestCaseReference => ({
    id: fake.number.id(),
    name: fake.lorem.sentence(),
    state: "Design",
    assignedTo: makeIdentityRef()
});

export const makeTestPointResults = (): TestPointResults => ({
    failureType: FailureType.None,
    lastResolutionState: LastResolutionState.None,
    lastResultDetails: makeLastResultDetails(),
    lastResultId: fake.number.id(),
    lastResultState: ResultState.Completed,
    lastRunBuildNumber: fake.system.semver(),
    lastTestRunId: fake.number.id(),
    outcome: fake.helpers.arrayElement([Outcome.Passed, Outcome.Failed, Outcome.Blocked, Outcome.NotApplicable]),
    state: PointState.Completed
});

export const makeTestPoint = (): TestPoint => ({
    id: fake.number.id(),
    comment: fake.lorem.sentence(),
    configuration: makeTestConfigurationReference(),
    isActive: true,
    isAutomated: false,
    lastResetToActive: fake.date.recent({ days: 7 }),
    lastUpdatedBy: makeIdentityRef(),
    lastUpdatedDate: fake.date.recent(),
    links: {},
    project: makeProjectReference(),
    results: makeTestPointResults(),
    testCaseReference: makeTestCaseReference(),
    tester: makeIdentityRef(),
    testPlan: makeTestPlanReference(),
    testSuite: makeTestSuiteReference()
});

export const makeTestEntityCount = (testPlanId: number, testSuiteId: number): TestEntityCount => {
    const count = fake.number.int({ min: 0, max: 50 });
    return {
        count,
        testPlanId,
        testSuiteId,
        totalCount: count + fake.number.int({ min: 0, max: 50 })
    };
};

export const makeCloneStatistics = (): CloneStatistics => {
    const totalRequirementsCount = fake.number.int({ min: 0, max: 20 });
    const totalTestCasesCount = fake.number.int({ min: 1, max: 100 });
    return {
        clonedRequirementsCount: totalRequirementsCount,
        clonedSharedStepsCount: fake.number.int({ min: 0, max: 10 }),
        clonedTestCasesCount: totalTestCasesCount,
        totalRequirementsCount,
        totalTestCasesCount
    };
};

export const makeCloneOperationResponse = (opId: number = fake.number.id()): CloneOperationCommonResponse => ({
    cloneStatistics: makeCloneStatistics(),
    completionDate: fake.date.recent(),
    creationDate: fake.date.recent({ days: 7 }),
    links: {},
    message: "",
    opId,
    state: CloneOperationState.Succeeded
});

export const makeCloneOptions = (): CloneOptions => ({
    cloneRequirements: false,
    copyAllSuites: true,
    copyAncestorHierarchy: false,
    destinationWorkItemType: "Test Case",
    overrideParameters: {},
    relatedLinkComment: fake.lorem.sentence()
});

export const makeCloneTestCaseOptions = (): CloneTestCaseOptions => ({
    includeAttachments: true,
    includeLinks: true,
    relatedLinkComment: fake.lorem.sentence()
});

export const makeTestSuiteReferenceWithProject = (): TestSuiteReferenceWithProject => ({
    ...makeTestSuiteReference(),
    project: makeProjectReference()
});

export const makeSourceTestPlanResponse = (): SourceTestplanResponse => ({
    ...makeTestPlanReference(),
    project: makeProjectReference(),
    suiteIds: [fake.number.id(), fake.number.id()]
});

export const makeSourceTestSuiteResponse = (): SourceTestSuiteResponse => ({
    ...makeTestSuiteReference(),
    project: makeProjectReference(),
    testCaseIds: [fake.number.id(), fake.number.id()]
});

export const makeCloneTestPlanOperation = (opId?: number): CloneTestPlanOperationInformation => ({
    cloneOperationResponse: makeCloneOperationResponse(opId),
    cloneOptions: makeCloneOptions(),
    destinationTestPlan: makeTestPlan(),
    sourceTestPlan: makeSourceTestPlanResponse()
});

export const makeCloneTestSuiteOperation = (opId?: number): CloneTestSuiteOperationInformation => ({
    clonedTestSuite: makeTestSuiteReferenceWithProject(),
    cloneOperationResponse: makeCloneOperationResponse(opId),
    cloneOptions: makeCloneOptions(),
    destinationTestSuite: makeTestSuiteReferenceWithProject(),
    sourceTestSuite: makeTestSuiteReferenceWithProject()
});

export const makeCloneTestCaseOperation = (opId?: number): CloneTestCaseOperationInformation => ({
    cloneOperationResponse: makeCloneOperationResponse(opId),
    cloneOptions: makeCloneTestCaseOptions(),
    destinationTestSuite: makeTestSuiteReferenceWithProject(),
    sourceTestSuite: makeSourceTestSuiteResponse()
});

export const plans: TestPlan[] = [
    makeTestPlan(),
    makeTestPlan(),
    makeTestPlan(),
    { ...makeTestPlan(), state: "Inactive" },
    makeTestPlan()
];

export const deletedPlans: TestPlan[] = Array.from({ length: 2 }, makeTestPlan);

const seededPlan: TestPlanReference = { id: plans[0].id, name: plans[0].name };

const rootSuite: TestSuite = {
    ...makeTestSuite(seededPlan, plans[0].rootSuite),
    ...plans[0].rootSuite,
    hasChildren: true
};

export const suites: TestSuite[] = [
    rootSuite,
    makeTestSuite(seededPlan, plans[0].rootSuite),
    {
        ...makeTestSuite(seededPlan, plans[0].rootSuite),
        suiteType: TestSuiteType.RequirementTestSuite,
        requirementId: fake.number.id()
    },
    {
        ...makeTestSuite(seededPlan, plans[0].rootSuite),
        suiteType: TestSuiteType.DynamicTestSuite,
        queryString: "SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Test Case'"
    }
];

export const deletedSuites: TestSuite[] = Array.from({ length: 2 }, () =>
    makeTestSuite(seededPlan, plans[0].rootSuite)
);

export const configurations: TestConfiguration[] = [
    { ...makeTestConfiguration(), isDefault: true },
    makeTestConfiguration(),
    { ...makeTestConfiguration(), state: TestConfigurationState.Inactive }
];

export const variables: TestVariable[] = Array.from({ length: 3 }, makeTestVariable);

const seededSuite: TestSuiteReference = { id: suites[1].id, name: suites[1].name };

export const testCases: TestCase[] = Array.from({ length: 5 }, (_, index) => {
    const configuration = configurations[index % configurations.length];
    return {
        ...makeTestCase(),
        order: index + 1,
        pointAssignments: [makePointAssignment({ id: configuration.id, name: configuration.name })],
        testPlan: seededPlan,
        testSuite: seededSuite
    };
});

export const points: TestPoint[] = testCases.flatMap(testCase =>
    testCase.pointAssignments.map(assignment => ({
        ...makeTestPoint(),
        id: assignment.id,
        configuration: { id: assignment.configurationId, name: assignment.configurationName },
        tester: assignment.tester,
        testCaseReference: { ...makeTestCaseReference(), id: testCase.workItem.id, name: testCase.workItem.name },
        testPlan: testCase.testPlan,
        testSuite: testCase.testSuite
    }))
);

export const suiteEntries: SuiteEntry[] = [
    ...suites.slice(1).map((suite, index) => makeSuiteEntry(rootSuite.id, suite.id, index + 1, SuiteEntryTypes.Suite)),
    ...testCases.map((testCase, index) =>
        makeSuiteEntry(rootSuite.id, testCase.workItem.id, index + 1, SuiteEntryTypes.TestCase)
    )
];

export const planCloneOperations: CloneTestPlanOperationInformation[] = Array.from({ length: 2 }, () =>
    makeCloneTestPlanOperation()
);

export const suiteCloneOperations: CloneTestSuiteOperationInformation[] = Array.from({ length: 2 }, () =>
    makeCloneTestSuiteOperation()
);

export const testCaseCloneOperations: CloneTestCaseOperationInformation[] = Array.from({ length: 2 }, () =>
    makeCloneTestCaseOperation()
);
