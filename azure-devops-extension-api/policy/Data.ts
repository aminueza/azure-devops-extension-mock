import { fake } from "../common/fixtures";
import {
    PolicyConfiguration,
    PolicyEvaluationRecord,
    PolicyEvaluationStatus,
    PolicyType,
    PolicyTypeRef
} from "azure-devops-extension-api/Policy";
import { makeIdentityRef } from "../core/Data";

export const makePolicyType = (): PolicyType => ({
    id: fake.string.uuid(),
    displayName: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    url: fake.internet.url(),
    _links: {}
});

export const makePolicyTypeRef = ({ id, displayName, url }: PolicyTypeRef): PolicyTypeRef => ({ id, displayName, url });

export const makePolicyConfiguration = (type: PolicyTypeRef = makePolicyType()): PolicyConfiguration => ({
    id: fake.number.id(),
    revision: 1,
    type: makePolicyTypeRef(type),
    url: fake.internet.url(),
    createdBy: makeIdentityRef(),
    createdDate: fake.date.recent(),
    isBlocking: true,
    isDeleted: false,
    isEnabled: true,
    isEnterpriseManaged: false,
    settings: { scope: [{ refName: "refs/heads/main", matchKind: "Exact", repositoryId: fake.string.uuid() }] },
    _links: {}
});

export const makePolicyConfigurationRevisions = (configuration: PolicyConfiguration): PolicyConfiguration[] =>
    Array.from({ length: configuration.revision }, (_, index) => ({ ...configuration, revision: index + 1 }));

export const makePolicyEvaluationRecord = (
    configuration: PolicyConfiguration = makePolicyConfiguration()
): PolicyEvaluationRecord => ({
    evaluationId: fake.string.uuid(),
    artifactId: `vstfs:///CodeReview/CodeReviewId/${fake.string.uuid()}/${fake.number.id()}`,
    configuration,
    status: PolicyEvaluationStatus.Approved,
    startedDate: fake.date.recent({ days: 2 }),
    completedDate: fake.date.recent(),
    context: {},
    _links: {}
});

export const policyTypes: PolicyType[] = [
    { ...makePolicyType(), id: "fa4e907d-c16b-4a4c-9dfa-4906e5d171dd", displayName: "Minimum number of reviewers" },
    { ...makePolicyType(), id: "0609b952-1397-4640-95ec-e00a01b2c241", displayName: "Build" },
    { ...makePolicyType(), id: "40e92b44-2fe1-4dd6-b3d8-74a9c21d0c6e", displayName: "Work item linking" },
    { ...makePolicyType(), id: "c6a1889d-b943-4856-b76f-9e46bb6b0df2", displayName: "Comment requirements" }
];

export const configurations: PolicyConfiguration[] = [
    { ...makePolicyConfiguration(policyTypes[0]), revision: 3 },
    { ...makePolicyConfiguration(policyTypes[1]), revision: 2 },
    { ...makePolicyConfiguration(policyTypes[2]), isBlocking: false },
    makePolicyConfiguration(policyTypes[3])
];

export const configurationRevisions: PolicyConfiguration[] = configurations.flatMap(makePolicyConfigurationRevisions);

export const evaluations: PolicyEvaluationRecord[] = [
    makePolicyEvaluationRecord(configurations[0]),
    { ...makePolicyEvaluationRecord(configurations[1]), status: PolicyEvaluationStatus.Running },
    { ...makePolicyEvaluationRecord(configurations[2]), status: PolicyEvaluationStatus.NotApplicable },
    { ...makePolicyEvaluationRecord(configurations[3]), status: PolicyEvaluationStatus.Rejected }
];
