import {
    ApprovalExecutionOrder,
    ApprovalStatus,
    ApprovalType,
    ConditionType,
    DeploymentOperationStatus,
    DeploymentReason,
    DeploymentStatus,
    DeployPhaseTypes,
    EnvironmentStatus,
    ManualInterventionStatus,
    PipelineProcessTypes,
    ReleaseDefinitionSource,
    ReleaseReason,
    ReleaseRestClient,
    ReleaseStatus
} from "azure-devops-extension-api/Release";

import { getClient } from "../azure-devops-extension-api";
import {
    approvals,
    approvalsPage,
    deployments,
    deploymentsPage,
    environmentTemplates,
    makeApproval,
    makeDefinitionEnvironment,
    makeDeployment,
    makeDeployPhase,
    makeEnvironment,
    makeEnvironmentOptions,
    makeEnvironmentTemplate,
    makeManualIntervention,
    makePagedList,
    makeProcessParameters,
    makeRelease,
    makeReleaseDefinition,
    makeReleaseDefinitionApprovals,
    makeReleaseDefinitionGatesStep,
    makeReleaseEnvironmentShallowReference,
    makeReleaseReference,
    makeWorkflowTask,
    manualInterventions,
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
        const env = await client.updateReleaseEnvironment(
            { status: EnvironmentStatus.InProgress } as any,
            "proj",
            1,
            44
        );
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

    it("fills every environment field without a cast", () => {
        const env = makeEnvironment();
        expect(env).not.toHaveProperty("_links");
        expect(env.release).toEqual({
            _links: {},
            id: env.releaseId,
            name: `Release-${env.releaseId}`,
            url: expect.any(String)
        });
        expect(env.releaseDefinition.path).toBe("\\");
        expect(env.releaseDefinition.projectReference).toHaveProperty("name");
        expect(env.releaseCreatedBy).toHaveProperty("displayName");
        expect(typeof env.releaseDescription).toBe("string");
        expect(env.definitionEnvironmentId).toBeGreaterThan(0);
        expect(env.queueId).toBeGreaterThan(0);
        expect(env.demands).toEqual([]);
        expect(env.schedules).toEqual([]);
        expect(env.workflowTasks).toEqual([]);
        expect(env.deployPhasesSnapshot).toHaveLength(1);
        expect(env.environmentOptions.publishDeploymentStatus).toBe(true);
        expect(env.nextScheduledUtcTime).toBeInstanceOf(Date);
        expect(env.scheduledDeploymentTime).toBeInstanceOf(Date);
        expect(env.preApprovalsSnapshot.approvals).toHaveLength(1);
        expect(env.postApprovalsSnapshot.approvals).toHaveLength(1);
        expect(env.preDeploymentGatesSnapshot.gates).toEqual([]);
        expect(env.postDeploymentGatesSnapshot.gates).toEqual([]);
        expect(env.processParameters).toEqual(makeProcessParameters());
        expect(env.timeToDeploy).toBeGreaterThan(0);
        expect(env.triggerReason).toBe("Manual");
    });

    it("makes a definition environment with its own shape", () => {
        const env = makeDefinitionEnvironment();
        expect(env.name).toBe("Production");
        expect(env.rank).toBe(1);
        expect(makeDefinitionEnvironment("QA", 2)).toMatchObject({ name: "QA", rank: 2 });
        expect(env).not.toHaveProperty("status");
        expect(env.badgeUrl).toMatch(/^https:/);
        expect(env.conditions).toEqual([
            { conditionType: ConditionType.Event, name: "ReleaseStarted", result: true, value: "" }
        ]);
        expect(env.currentRelease.name).toBe(`Release-${env.currentRelease.id}`);
        expect(env.deployPhases).toHaveLength(1);
        expect(env.deployStep.tasks).toEqual([]);
        expect(env.deployStep.id).toBeGreaterThan(0);
        expect(env.environmentOptions).toEqual(makeEnvironmentOptions());
        expect(env.environmentTriggers).toEqual([]);
        expect(env.executionPolicy).toEqual({ concurrencyCount: 1, queueDepthCount: 0 });
        expect(env.owner).toHaveProperty("displayName");
        expect(env.retentionPolicy).toEqual({ daysToKeep: 30, releasesToKeep: 3, retainBuild: true });
        expect(env.runOptions).toEqual({});
        expect(env.properties).toEqual({});
        expect(env.variables).toEqual({});
        expect(env.variableGroups).toEqual([]);
        expect(env.schedules).toEqual([]);
        expect(env.demands).toEqual([]);
        expect(env.queueId).toBeGreaterThan(0);
    });

    it("makes the nested environment building blocks", () => {
        const task = makeWorkflowTask();
        expect(task.enabled).toBe(true);
        expect(task.condition).toBe("succeeded()");
        expect(task.checkConfig).toMatchObject({ resourceType: "endpoint", version: 1 });
        expect(task.inputs).toEqual({ script: "echo deploy" });
        expect(task.taskId).toMatch(/^[0-9a-f-]{36}$/);

        const phase = makeDeployPhase();
        expect(phase.phaseType).toBe(DeployPhaseTypes.AgentBasedDeployment);
        expect(phase.name).toBe("Agent job");
        expect(phase.rank).toBe(1);
        expect(phase.workflowTasks).toHaveLength(1);

        const definitionApprovals = makeReleaseDefinitionApprovals();
        expect(definitionApprovals.approvalOptions.executionOrder).toBe(ApprovalExecutionOrder.BeforeGates);
        expect(definitionApprovals.approvalOptions.requiredApproverCount).toBe(1);
        expect(definitionApprovals.approvals[0]).toMatchObject({
            isAutomated: false,
            isNotificationOn: true,
            rank: 1
        });
        expect(definitionApprovals.approvals[0].approver).toHaveProperty("displayName");

        const gates = makeReleaseDefinitionGatesStep();
        expect(gates.id).toBeGreaterThan(0);
        expect(gates.gatesOptions).toEqual({
            isEnabled: false,
            minimumSuccessDuration: 0,
            samplingInterval: 15,
            stabilizationTime: 5,
            timeout: 1440
        });

        expect(makeProcessParameters()).toEqual({
            dataSourceBindings: [],
            inputs: [],
            sourceDefinitions: []
        });
        expect(makeEnvironmentOptions().emailNotificationType).toBe("OnlyOnFailure");
    });

    it("makes shallow environment and release references", () => {
        expect(makeReleaseEnvironmentShallowReference().name).toBe("Production");
        const staging = makeReleaseEnvironmentShallowReference("Staging");
        expect(staging).toEqual({
            _links: {},
            id: expect.any(Number),
            name: "Staging",
            url: expect.any(String)
        });

        const reference = makeReleaseReference();
        expect(reference.name).toBe(`Release-${reference.id}`);
        expect(reference.reason).toBe(ReleaseReason.Manual);
        expect(reference.artifacts).toEqual([]);
        expect(reference.createdBy).toHaveProperty("displayName");
        expect(reference.modifiedBy).toHaveProperty("displayName");
        expect(reference.createdOn).toBeInstanceOf(Date);
        expect(reference.releaseDefinition.path).toBe("\\");
        expect(reference.webAccessUri).toMatch(/^https:/);
        expect(reference).not.toHaveProperty("environments");
    });

    it("fills every release definition field without a cast", () => {
        const def = makeReleaseDefinition();
        expect(def.environments.map(e => e.rank)).toEqual([1, 2, 3]);
        def.environments.forEach(e => {
            expect(e).not.toHaveProperty("status");
            expect(e.deployPhases).toHaveLength(1);
            expect(e.preDeployApprovals.approvals).toHaveLength(1);
        });
        expect(def._links).toEqual({});
        expect(def.comment).toBe("");
        expect(def.isDeleted).toBe(false);
        expect(def.isDisabled).toBe(false);
        expect(def.lastRelease.name).toBe(`Release-${def.lastRelease.id}`);
        expect(def.pipelineProcess).toEqual({ type: PipelineProcessTypes.Designer });
        expect(def.projectReference).toHaveProperty("id");
        expect(def.properties).toEqual({});
        expect(def.releaseNameFormat).toBe("Release-$(rev:r)");
        expect(def.retentionPolicy).toEqual({ daysToKeep: 30 });
        expect(def.source).toBe(ReleaseDefinitionSource.UserInterface);
    });

    it("fills every release field without a cast", () => {
        const release = makeRelease();
        expect(release.reason).toBe(ReleaseReason.Manual);
        expect(release.releaseDefinition).toEqual({
            _links: {},
            id: expect.any(Number),
            name: expect.any(String),
            path: "\\",
            projectReference: expect.objectContaining({ id: expect.any(String) }),
            url: expect.any(String)
        });
        expect(release.projectReference).toHaveProperty("name");
        expect(release._links).toEqual({});
        expect(release.comment).toBe("");
        expect(release.createdFor).toHaveProperty("displayName");
        expect(release.poolName).toBe("Azure Pipelines");
        expect(release.properties).toEqual({});
        expect(release.releaseDefinitionRevision).toBe(1);
        expect(release.triggeringArtifactAlias).toBe("");
        release.environments.forEach(e => expect(e.release.id).toBe(e.releaseId));
    });

    it("fills every deployment field without a cast", () => {
        const deployment = makeDeployment();
        expect(deployment.reason).toBe(DeploymentReason.Manual);
        expect(deployment.release.name).toBe(`Release-${deployment.release.id}`);
        expect(deployment.release.reason).toBe(ReleaseReason.Manual);
        expect(deployment.releaseDefinition.path).toBe("\\");
        expect(deployment.releaseEnvironment).toEqual({
            _links: {},
            id: expect.any(Number),
            name: "Production",
            url: expect.any(String)
        });
        expect(deployment._links).toEqual({});
        expect(deployment.conditions).toEqual([]);
        expect(deployment.definitionEnvironmentId).toBeGreaterThan(0);
        expect(deployment.lastModifiedBy).toHaveProperty("displayName");
        expect(deployment.lastModifiedOn).toBeInstanceOf(Date);
        expect(deployment.operationStatus).toBe(DeploymentOperationStatus.PhaseSucceeded);
        expect(deployment.preDeployApprovals).toEqual([]);
        expect(deployment.postDeployApprovals).toEqual([]);
        expect(deployment.projectReference).toHaveProperty("id");
        expect(deployment.scheduledDeploymentTime).toBeInstanceOf(Date);
    });

    it("fills every approval field without a cast", () => {
        const approval = makeApproval();
        expect(approval).not.toHaveProperty("_links");
        expect(approval.release.name).toBe(`Release-${approval.release.id}`);
        expect(approval.release.url).toMatch(/^https:/);
        expect(approval.releaseDefinition.projectReference).toHaveProperty("id");
        expect(approval.releaseEnvironment.name).toBe("Production");
        expect(approval.releaseEnvironment._links).toEqual({});
        expect(approval.history).toEqual([]);
        expect(approval.isAutomated).toBe(false);
        expect(approval.isNotificationOn).toBe(true);
        expect(approval.revision).toBe(1);
        expect(approval.trialNumber).toBe(1);
    });

    it("fills the environment of an environment template", () => {
        const template = makeEnvironmentTemplate();
        expect(template.environment.name).toBe("Production");
        expect(template.environment.rank).toBe(1);
        expect(template.environment.deployPhases[0].workflowTasks).toHaveLength(1);
        environmentTemplates.forEach(seeded => expect(seeded.environment.retentionPolicy.daysToKeep).toBe(30));
    });

    it("fills every manual intervention field without a cast", () => {
        const intervention = makeManualIntervention();
        expect(intervention.status).toBe(ManualInterventionStatus.Pending);
        expect(intervention.poPTenant).toEqual({
            authority: "https://login.microsoftonline.com",
            domainHint: expect.any(String),
            resources: [],
            tenantId: expect.stringMatching(/^[0-9a-f-]{36}$/),
            tenantName: expect.any(String),
            timeout: 30
        });
        expect(intervention.release.name).toBe(`Release-${intervention.release.id}`);
        expect(intervention.release._links).toEqual({});
        expect(intervention.releaseDefinition.path).toBe("\\");
        expect(intervention.releaseDefinition.projectReference).toHaveProperty("id");
        expect(intervention.releaseEnvironment.name).toBe("Production");
        expect(intervention.releaseEnvironment.url).toMatch(/^https:/);
        manualInterventions.forEach(seeded => expect(seeded.poPTenant.timeout).toBe(30));
    });

    it("builds a typed page that copies its items", () => {
        const items = [1, 2, 3];
        const page = makePagedList(items);
        expect(page).not.toBe(items);
        expect([...page]).toEqual(items);
        expect(page.continuationToken).toBe("");
        expect(Array.isArray(page)).toBe(true);
        expect(makePagedList([]).length).toBe(0);
    });
});
