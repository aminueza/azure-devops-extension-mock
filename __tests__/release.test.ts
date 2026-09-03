import {
    ApprovalStatus,
    ApprovalType,
    DeploymentStatus,
    EnvironmentStatus,
    ReleaseRestClient,
    ReleaseStatus
} from "azure-devops-extension-api/Release";

import { getClient } from "../azure-devops-extension-api";
import {
    approvals,
    approvalsPage,
    deployments,
    deploymentsPage,
    makeApproval,
    makeDeployment,
    makeEnvironment,
    makeRelease,
    makeReleaseDefinition,
    releaseDefinitions,
    releaseDefinitionsPage,
    releases
} from "../azure-devops-extension-api/release/Data";

describe("ReleaseRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(ReleaseRestClient);

    it("exposes the real client type", () => {
        expect((client as any).TYPE).toBe(ReleaseRestClient);
    });

    it("lists release definitions as a page", async () => {
        const defs = await client.getReleaseDefinitions("proj");
        expect(defs).toBe(releaseDefinitionsPage);
        expect(defs.length).toBe(3);
        expect(defs.continuationToken).toBe("");
        expect(defs[0].environments.map(e => e.name)).toEqual(["Dev", "QA", "Production"]);
    });

    it("returns a known release definition", async () => {
        const def = await client.getReleaseDefinition("proj", releaseDefinitions[2].id);
        expect(def).toBe(releaseDefinitions[2]);
    });

    it("fabricates a release definition for an unknown id", async () => {
        const def = await client.getReleaseDefinition("proj", 123_456);
        expect(def.id).toBe(123_456);
        expect(def.path).toBe("\\");
        expect(def.environments.length).toBe(3);
    });

    it("creates a release definition merging the caller's fields", async () => {
        const def = await client.createReleaseDefinition({ name: "my-def", tags: ["x"] } as any, "proj");
        expect(def.name).toBe("my-def");
        expect(def.tags).toEqual(["x"]);
        expect(def).toHaveProperty("id");
        expect(def).toHaveProperty("revision");
    });

    it("updates a release definition merging the caller's fields", async () => {
        const def = await client.updateReleaseDefinition({ id: 5, revision: 99 } as any, "proj");
        expect(def.id).toBe(5);
        expect(def.revision).toBe(99);
        expect(def).toHaveProperty("createdBy");
    });

    it("deletes a release definition", async () => {
        await expect(client.deleteReleaseDefinition("proj", 5)).resolves.toBeUndefined();
    });

    it("lists releases as a fresh page", async () => {
        const first = await client.getReleases("proj");
        const second = await client.getReleases();
        expect(first).not.toBe(second);
        expect([...first]).toEqual(releases);
        expect((first as any).continuationToken).toBe("");
        first.forEach(r => expect(r.status).toBe(ReleaseStatus.Active));
    });

    it("returns a known release", async () => {
        const release = await client.getRelease("proj", releases[0].id);
        expect(release).toBe(releases[0]);
    });

    it("fabricates a release for an unknown id", async () => {
        const release = await client.getRelease("proj", 999_999);
        expect(release.id).toBe(999_999);
        expect(release.releaseNameFormat).toBe("Release-$(rev:r)");
    });

    it("creates a release honoring description and definition id", async () => {
        const release = await client.createRelease({ definitionId: 42, description: "rel" } as any, "proj");
        expect(release.releaseDefinition.id).toBe(42);
        expect(release.releaseDefinition).toHaveProperty("name");
        expect(release.description).toBe("rel");
    });

    it("creates a release falling back to generated values", async () => {
        const release = await client.createRelease({} as any, "proj");
        expect(typeof release.releaseDefinition.id).toBe("number");
        expect(typeof release.description).toBe("string");
        expect(release.description.length).toBeGreaterThan(0);
        expect(release.environments.length).toBe(3);
    });

    it("updates a release forcing the requested id", async () => {
        const release = await client.updateRelease({ id: 1, keepForever: true } as any, "proj", 77);
        expect(release.id).toBe(77);
        expect(release.keepForever).toBe(true);
        expect(release).toHaveProperty("name");
    });

    it("returns an environment echoing the id", async () => {
        const env = await client.getReleaseEnvironment("proj", 1, 33);
        expect(env.id).toBe(33);
        expect(env.name).toBe("Production");
        expect(env.status).toBe(EnvironmentStatus.Succeeded);
    });

    it("updates an environment echoing the id", async () => {
        const env = await client.updateReleaseEnvironment({ status: EnvironmentStatus.InProgress } as any, "proj", 1, 44);
        expect(env.id).toBe(44);
        expect(env).toHaveProperty("owner");
    });

    it("lists deployments as a page", async () => {
        const list = await client.getDeployments("proj");
        expect(list).toBe(deploymentsPage);
        expect(list.length).toBe(5);
        list.forEach(d => expect(d.deploymentStatus).toBe(DeploymentStatus.Succeeded));
    });

    it("lists approvals as a page", async () => {
        const list = await client.getApprovals("proj");
        expect(list).toBe(approvalsPage);
        expect(list.length).toBe(3);
        list.forEach(a => expect(a.status).toBe(ApprovalStatus.Pending));
    });

    it("returns a known approval", async () => {
        const approval = await client.getApproval("proj", approvals[1].id);
        expect(approval).toBe(approvals[1]);
    });

    it("fabricates an approval for an unknown id", async () => {
        const approval = await client.getApproval("proj", 555_555);
        expect(approval.id).toBe(555_555);
        expect(approval.approvalType).toBe(ApprovalType.PreDeploy);
    });

    it("updates an approval forcing the requested id", async () => {
        const approval = await client.updateReleaseApproval(
            { id: 1, status: ApprovalStatus.Approved, comments: "ok" } as any,
            "proj",
            66
        );
        expect(approval.id).toBe(66);
        expect(approval.status).toBe(ApprovalStatus.Approved);
        expect(approval.comments).toBe("ok");
    });
});

describe("release Data factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes a production environment by default", () => {
        const env = makeEnvironment();
        expect(env.name).toBe("Production");
        expect(env.rank).toBe(1);
        expect(env.deploySteps).toEqual([]);
    });

    it("makes a named environment", () => {
        expect(makeEnvironment("Staging").name).toBe("Staging");
    });

    it("makes a release definition with three environments", () => {
        const def = makeReleaseDefinition();
        expect(def.environments.map(e => e.name)).toEqual(["Dev", "QA", "Production"]);
        expect(def.id).toBeGreaterThan(0);
    });

    it("makes an active release", () => {
        const release = makeRelease();
        expect(release.name).toMatch(/^Release-\d+$/);
        expect(release.status).toBe(ReleaseStatus.Active);
        expect(release.projectReference).toHaveProperty("id");
    });

    it("makes a succeeded deployment", () => {
        const deployment = makeDeployment();
        expect(deployment.deploymentStatus).toBe(DeploymentStatus.Succeeded);
        expect(deployment.releaseEnvironment.name).toBe("Production");
    });

    it("makes a pending approval", () => {
        const approval = makeApproval();
        expect(approval.status).toBe(ApprovalStatus.Pending);
        expect(approval.comments).toBe("");
    });

    it("exposes seeded lists and pages", () => {
        expect(releaseDefinitions.length).toBe(3);
        expect(releases.length).toBe(5);
        expect(deployments.length).toBe(5);
        expect(approvals.length).toBe(3);
        expect([...releaseDefinitionsPage]).toEqual(releaseDefinitions);
        expect([...deploymentsPage]).toEqual(deployments);
        expect([...approvalsPage]).toEqual(approvals);
    });
});
