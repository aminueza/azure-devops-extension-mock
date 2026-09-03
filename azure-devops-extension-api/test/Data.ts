import { fake } from "../common/fixtures";
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
    id: id ?? fake.number.int({ min: 1, max: 100_000 }),
    name: `Test Run ${fake.lorem.slug()}`,
    url: fake.internet.url(),
    isAutomated: true,
    state: TestRunState.Completed as unknown as string,
    startedDate: fake.date.recent(),
    completedDate: fake.date.recent(),
    owner: makeIdentityRef() as any,
    build: { id: String(fake.number.int()), name: fake.lorem.slug() } as any,
    project: { id: fake.string.uuid(), name: fake.company.name() } as any,
    totalTests: 100,
    passedTests: 95,
    incompleteTests: 0,
    unanalyzedTests: 0,
    notApplicableTests: 0,
    iteration: `Sprint ${fake.number.int({ min: 1, max: 30 })}`,
    webAccessUrl: fake.internet.url()
} as unknown as TestRun);

export const makeTestCaseResult = (id?: number): TestCaseResult => ({
    id: id ?? fake.number.int(),
    testRun: { id: String(fake.number.int()) } as any,
    testCase: {
        id: String(fake.number.int()),
        name: fake.lorem.sentence(),
        url: fake.internet.url()
    } as any,
    testCaseTitle: fake.lorem.sentence(),
    outcome: fake.helpers.arrayElement(outcomeValues) as unknown as string,
    state: "Completed",
    automatedTestName: fake.lorem.slug(),
    automatedTestStorage: fake.system.fileName(),
    priority: fake.number.int({ min: 1, max: 4 }),
    revision: 1,
    durationInMs: fake.number.int({ min: 1, max: 10_000 }),
    startedDate: fake.date.recent(),
    completedDate: fake.date.recent(),
    runBy: makeIdentityRef() as any,
    owner: makeIdentityRef() as any,
    build: { id: String(fake.number.int()), name: fake.lorem.slug() } as any,
    project: { id: fake.string.uuid(), name: fake.company.name() } as any
} as unknown as TestCaseResult);

export const makeShallowResult = (): ShallowTestCaseResult => ({
    id: fake.number.int(),
    runId: fake.number.int(),
    refId: fake.number.int(),
    testCaseTitle: fake.lorem.sentence(),
    automatedTestName: fake.lorem.slug(),
    automatedTestStorage: fake.system.fileName(),
    outcome: fake.helpers.arrayElement(["Passed", "Failed", "NotExecuted"]),
    priority: fake.number.int({ min: 1, max: 4 }),
    isReRun: false,
    owner: fake.person.fullName()
} as unknown as ShallowTestCaseResult);

export const makeAttachment = (): TestAttachment => ({
    id: fake.number.int(),
    fileName: fake.system.fileName(),
    comment: fake.lorem.sentence(),
    attachmentType: "GeneralAttachment" as any,
    size: fake.number.int({ min: 1, max: 10_000_000 }),
    createdDate: fake.date.recent(),
    url: fake.internet.url()
} as unknown as TestAttachment);

export const makeAttachmentRef = (): TestAttachmentReference => ({
    id: fake.number.int(),
    url: fake.internet.url()
} as unknown as TestAttachmentReference);

export const testRuns: TestRun[] = Array.from({ length: 5 }, () => makeTestRun());
export const testResults: TestCaseResult[] = Array.from({ length: 10 }, () => makeTestCaseResult());
export const shallowResults: PagedList<ShallowTestCaseResult> =
    Object.assign(Array.from({ length: 10 }, makeShallowResult), { continuationToken: "" }) as PagedList<ShallowTestCaseResult>;
export const attachments: TestAttachment[] = Array.from({ length: 2 }, makeAttachment);
