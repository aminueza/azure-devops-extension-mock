import { faker } from "@faker-js/faker";
import {
    TestRun,
    TestRunState,
    TestOutcome,
    TestCaseResult,
    ShallowTestCaseResult,
    TestAttachmentReference,
    TestAttachment
} from "azure-devops-extension-api/Test";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef } from "../core/Data";

const outcomeValues = [
    TestOutcome.Passed,
    TestOutcome.Failed,
    TestOutcome.NotExecuted,
    TestOutcome.Blocked
];

export const makeTestRun = (id?: number): TestRun => ({
    id: id ?? faker.number.int({ min: 1, max: 100_000 }),
    name: `Test Run ${faker.lorem.slug()}`,
    url: faker.internet.url(),
    isAutomated: true,
    state: TestRunState.Completed as unknown as string,
    startedDate: faker.date.recent(),
    completedDate: faker.date.recent(),
    owner: makeIdentityRef() as any,
    build: { id: String(faker.number.int()), name: faker.lorem.slug() } as any,
    project: { id: faker.string.uuid(), name: faker.company.name() } as any,
    totalTests: 100,
    passedTests: 95,
    incompleteTests: 0,
    unanalyzedTests: 0,
    notApplicableTests: 0,
    iteration: `Sprint ${faker.number.int({ min: 1, max: 30 })}`,
    webAccessUrl: faker.internet.url()
} as unknown as TestRun);

export const makeTestCaseResult = (id?: number): TestCaseResult => ({
    id: id ?? faker.number.int(),
    testRun: { id: String(faker.number.int()) } as any,
    testCase: {
        id: String(faker.number.int()),
        name: faker.lorem.sentence(),
        url: faker.internet.url()
    } as any,
    testCaseTitle: faker.lorem.sentence(),
    outcome: faker.helpers.arrayElement(outcomeValues) as unknown as string,
    state: "Completed",
    automatedTestName: faker.lorem.slug(),
    automatedTestStorage: faker.system.fileName(),
    priority: faker.number.int({ min: 1, max: 4 }),
    revision: 1,
    durationInMs: faker.number.int({ min: 1, max: 10_000 }),
    startedDate: faker.date.recent(),
    completedDate: faker.date.recent(),
    runBy: makeIdentityRef() as any,
    owner: makeIdentityRef() as any,
    build: { id: String(faker.number.int()), name: faker.lorem.slug() } as any,
    project: { id: faker.string.uuid(), name: faker.company.name() } as any
} as unknown as TestCaseResult);

export const makeShallowResult = (): ShallowTestCaseResult => ({
    id: faker.number.int(),
    runId: faker.number.int(),
    refId: faker.number.int(),
    testCaseTitle: faker.lorem.sentence(),
    automatedTestName: faker.lorem.slug(),
    automatedTestStorage: faker.system.fileName(),
    outcome: faker.helpers.arrayElement(["Passed", "Failed", "NotExecuted"]),
    priority: faker.number.int({ min: 1, max: 4 }),
    isReRun: false,
    owner: faker.person.fullName()
} as unknown as ShallowTestCaseResult);

export const makeAttachment = (): TestAttachment => ({
    id: faker.number.int(),
    fileName: faker.system.fileName(),
    comment: faker.lorem.sentence(),
    attachmentType: "GeneralAttachment" as any,
    size: faker.number.int({ min: 1, max: 10_000_000 }),
    createdDate: faker.date.recent(),
    url: faker.internet.url()
} as unknown as TestAttachment);

export const makeAttachmentRef = (): TestAttachmentReference => ({
    id: faker.number.int(),
    url: faker.internet.url()
} as unknown as TestAttachmentReference);

export const testRuns: TestRun[] = Array.from({ length: 5 }, () => makeTestRun());
export const testResults: TestCaseResult[] = Array.from({ length: 10 }, () => makeTestCaseResult());
export const shallowResults: PagedList<ShallowTestCaseResult> =
    Object.assign(Array.from({ length: 10 }, makeShallowResult), { continuationToken: "" }) as PagedList<ShallowTestCaseResult>;
export const attachments: TestAttachment[] = Array.from({ length: 2 }, makeAttachment);
