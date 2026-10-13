import { PolicyConfiguration, PolicyEvaluationStatus, PolicyRestClient } from "azure-devops-extension-api/Policy";
import { getClient, getRegisteredMockClient, MockPolicyRestClient } from "../azure-devops-extension-api";
import {
    configurationRevisions,
    configurations,
    evaluations,
    makePolicyConfiguration,
    makePolicyConfigurationRevisions,
    makePolicyEvaluationRecord,
    makePolicyType,
    makePolicyTypeRef,
    policyTypes
} from "../azure-devops-extension-api/policy/Data";

const REVIEWERS = "fa4e907d-c16b-4a4c-9dfa-4906e5d171dd";

describe("PolicyRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(PolicyRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(PolicyRestClient)).toBe(MockPolicyRestClient);
    });

    it("creates a configuration echoing the posted object", async () => {
        const posted: PolicyConfiguration = {
            ...makePolicyConfiguration(policyTypes[1]),
            isBlocking: false,
            settings: { minimumApproverCount: 2 }
        };
        const created = await client.createPolicyConfiguration(posted, "proj");
        expect(created).toEqual(posted);
        expect(created).not.toBe(posted);
    });

    it("fills a partially posted configuration from a fixture", async () => {
        const partial = { isEnabled: false, settings: { minimumApproverCount: 1 } } as PolicyConfiguration;
        const created = await client.createPolicyConfiguration(partial, "proj");
        expect(created.isEnabled).toBe(false);
        expect(created.settings).toEqual({ minimumApproverCount: 1 });
        expect(typeof created.id).toBe("number");
        expect(created.revision).toBe(1);
        expect(typeof created.type.id).toBe("string");
        expect(typeof created.createdBy.displayName).toBe("string");
        expect(created.createdDate).toBeInstanceOf(Date);
    });

    it("deletes a configuration", async () => {
        await expect(client.deletePolicyConfiguration("proj", configurations[0].id)).resolves.toBeUndefined();
    });

    it("gets a known configuration", async () => {
        expect(await client.getPolicyConfiguration("proj", configurations[1].id)).toBe(configurations[1]);
    });

    it("fabricates an unknown configuration", async () => {
        const made = await client.getPolicyConfiguration("proj", 999_999);
        expect(made.id).toBe(999_999);
        expect(made.isEnabled).toBe(true);
        expect(made.isEnterpriseManaged).toBe(false);
        expect(made._links).toEqual({});
    });

    it("lists every configuration", async () => {
        const list = await client.getPolicyConfigurations("proj");
        expect([...list]).toEqual(configurations);
        expect(list.length).toBe(4);
        expect(list.continuationToken).toBeNull();
        expect(new Set(list.map(c => c.id)).size).toBe(4);
        expect(list.map(c => c.type.displayName)).toEqual(policyTypes.map(t => t.displayName));
    });

    it("lists configurations filtered by policy type", async () => {
        const list = await client.getPolicyConfigurations("proj", "scope", REVIEWERS);
        expect(list.length).toBe(1);
        expect(list[0]).toBe(configurations[0]);
        expect(list.continuationToken).toBeNull();
    });

    it("lists nothing for an unknown policy type", async () => {
        const list = await client.getPolicyConfigurations("proj", undefined, "missing-type");
        expect(list.length).toBe(0);
        expect(list.continuationToken).toBeNull();
    });

    it("updates a known configuration", async () => {
        const target = configurations[2];
        const updated = await client.updatePolicyConfiguration(
            { ...target, id: 1, isBlocking: true, isEnabled: false },
            "proj",
            target.id
        );
        expect(updated.id).toBe(target.id);
        expect(updated.isBlocking).toBe(true);
        expect(updated.isEnabled).toBe(false);
        expect(updated.createdBy).toBe(target.createdBy);
        expect(target.isBlocking).toBe(false);
    });

    it("updates an unknown configuration", async () => {
        const updated = await client.updatePolicyConfiguration(
            { isDeleted: true } as PolicyConfiguration,
            "proj",
            888_888
        );
        expect(updated.id).toBe(888_888);
        expect(updated.isDeleted).toBe(true);
        expect(typeof updated.url).toBe("string");
    });

    it("gets a known evaluation", async () => {
        expect(await client.getPolicyEvaluation("proj", evaluations[0].evaluationId)).toBe(evaluations[0]);
    });

    it("fabricates an unknown evaluation", async () => {
        const made = await client.getPolicyEvaluation("proj", "missing-evaluation");
        expect(made.evaluationId).toBe("missing-evaluation");
        expect(made.status).toBe(PolicyEvaluationStatus.Approved);
        expect(made.startedDate).toBeInstanceOf(Date);
        expect(made.completedDate).toBeInstanceOf(Date);
        expect(typeof made.configuration.id).toBe("number");
    });

    it("requeues a known evaluation", async () => {
        const target = evaluations[3];
        const requeued = await client.requeuePolicyEvaluation("proj", target.evaluationId);
        expect(requeued.status).toBe(PolicyEvaluationStatus.Queued);
        expect(requeued.evaluationId).toBe(target.evaluationId);
        expect(requeued.configuration).toBe(target.configuration);
        expect(target.status).toBe(PolicyEvaluationStatus.Rejected);
    });

    it("requeues an unknown evaluation", async () => {
        const requeued = await client.requeuePolicyEvaluation("proj", "missing-evaluation");
        expect(requeued.evaluationId).toBe("missing-evaluation");
        expect(requeued.status).toBe(PolicyEvaluationStatus.Queued);
    });

    it("lists applicable evaluations for an artifact", async () => {
        const records = await client.getPolicyEvaluations("proj", "artifact-1");
        expect(records.length).toBe(3);
        expect(records.map(r => r.status)).toEqual([
            PolicyEvaluationStatus.Approved,
            PolicyEvaluationStatus.Running,
            PolicyEvaluationStatus.Rejected
        ]);
        for (const record of records) {
            expect(record.artifactId).toBe("artifact-1");
        }
    });

    it("leaves out not applicable evaluations when asked to", async () => {
        const records = await client.getPolicyEvaluations("proj", "artifact-1", false);
        expect(records.length).toBe(3);
    });

    it("includes not applicable evaluations when asked to", async () => {
        const records = await client.getPolicyEvaluations("proj", "artifact-1", true);
        expect(records.map(r => r.evaluationId)).toEqual(evaluations.map(e => e.evaluationId));
        expect(records[2].status).toBe(PolicyEvaluationStatus.NotApplicable);
    });

    it("lists evaluations with top and skip", async () => {
        const all = await client.getPolicyEvaluations("proj", "artifact-1", true);
        const records = await client.getPolicyEvaluations("proj", "artifact-1", true, 2, 1);
        expect(records).toEqual(all.slice(1, 3));
    });

    it("gets a known configuration revision", async () => {
        const target = configurations[0];
        const revision = await client.getPolicyConfigurationRevision("proj", target.id, 2);
        expect(revision.id).toBe(target.id);
        expect(revision.revision).toBe(2);
        expect(configurationRevisions).toContain(revision);
    });

    it("fabricates an unknown revision of a known configuration", async () => {
        const target = configurations[0];
        const revision = await client.getPolicyConfigurationRevision("proj", target.id, 42);
        expect(revision.id).toBe(target.id);
        expect(revision.revision).toBe(42);
        expect(revision.type).toBe(target.type);
    });

    it("fabricates a revision of an unknown configuration", async () => {
        const first = await client.getPolicyConfigurationRevision("proj", 777_777, 1);
        expect(first.id).toBe(777_777);
        expect(first.revision).toBe(1);
        const later = await client.getPolicyConfigurationRevision("proj", 777_777, 9);
        expect(later.id).toBe(777_777);
        expect(later.revision).toBe(9);
    });

    it("lists every revision of a known configuration", async () => {
        const target = configurations[0];
        const revisions = await client.getPolicyConfigurationRevisions("proj", target.id);
        expect(revisions.map(r => r.revision)).toEqual([1, 2, 3]);
        for (const revision of revisions) {
            expect(revision.id).toBe(target.id);
        }
    });

    it("lists revisions with top and skip", async () => {
        const target = configurations[0];
        const revisions = await client.getPolicyConfigurationRevisions("proj", target.id, 1, 1);
        expect(revisions.map(r => r.revision)).toEqual([2]);
    });

    it("fabricates the revisions of an unknown configuration", async () => {
        const revisions = await client.getPolicyConfigurationRevisions("proj", 666_666);
        expect(revisions.length).toBe(1);
        expect(revisions[0].id).toBe(666_666);
        expect(revisions[0].revision).toBe(1);
    });

    it("gets a known policy type", async () => {
        const type = await client.getPolicyType("proj", REVIEWERS);
        expect(type).toBe(policyTypes[0]);
        expect(type.displayName).toBe("Minimum number of reviewers");
    });

    it("fabricates an unknown policy type", async () => {
        const type = await client.getPolicyType("proj", "missing-type");
        expect(type.id).toBe("missing-type");
        expect(typeof type.displayName).toBe("string");
        expect(typeof type.description).toBe("string");
    });

    it("lists policy types", async () => {
        const types = await client.getPolicyTypes("proj");
        expect(types).toBe(policyTypes);
        expect(types.map(t => t.displayName)).toEqual([
            "Minimum number of reviewers",
            "Build",
            "Work item linking",
            "Comment requirements"
        ]);
        expect(new Set(types.map(t => t.id)).size).toBe(4);
    });
});

describe("policy fixtures", () => {
    it("makes a type reference without the extra type fields", () => {
        const type = makePolicyType();
        const ref = makePolicyTypeRef(type);
        expect(ref).toEqual({ id: type.id, displayName: type.displayName, url: type.url });
    });

    it("makes a configuration of the given type", () => {
        const configuration = makePolicyConfiguration(policyTypes[1]);
        expect(configuration.type).toEqual(makePolicyTypeRef(policyTypes[1]));
        expect(configuration.settings.scope[0].refName).toBe("refs/heads/main");
    });

    it("makes one entry per revision", () => {
        const revisions = makePolicyConfigurationRevisions({ ...makePolicyConfiguration(), revision: 4 });
        expect(revisions.map(r => r.revision)).toEqual([1, 2, 3, 4]);
    });

    it("seeds a revision list that covers every configuration", () => {
        expect(configurationRevisions.length).toBe(configurations.reduce((sum, c) => sum + c.revision, 0));
    });

    it("makes an evaluation record for the given configuration", () => {
        const record = makePolicyEvaluationRecord(configurations[0]);
        expect(record.configuration).toBe(configurations[0]);
        expect(record.artifactId.startsWith("vstfs:///CodeReview/CodeReviewId/")).toBe(true);
        expect(record.context).toEqual({});
    });

    it("seeds unique evaluation ids", () => {
        expect(new Set(evaluations.map(e => e.evaluationId)).size).toBe(evaluations.length);
    });
});
