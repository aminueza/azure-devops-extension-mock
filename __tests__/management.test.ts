import { ManagementRestClient, Plan } from "azure-devops-extension-api/Management";
import { getClient, getRegisteredMockClient, MockManagementRestClient } from "../azure-devops-extension-api";
import {
    CODEQL_JOB_COUNT,
    agentPoolDetails,
    billableCommitters,
    codeQLSchedule,
    enabledProjectIds,
    makeAgentPoolDetails,
    makeBillableCommitterDetails,
    makeBilledCommitter,
    makeBilledCommittersList,
    makeCodeQLScheduleDetails,
    makeCodeSecurityFeatures,
    makeEnablementOnCreateSettings,
    makeMeterUsageEstimate,
    makeMeterUsageForPlan,
    makeOrgEnablementSettings,
    makeProjectEnablementSettings,
    makeRepoEnablementSettings,
    makeSecretProtectionFeatures,
    meterUsage,
    meterUsageEstimate,
    orgEnablement,
    projectEnablement,
    repoEnablements
} from "../azure-devops-extension-api/management/Data";

describe("ManagementRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(ManagementRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(ManagementRestClient)).toBe(MockManagementRestClient);
    });

    it("implements every method of the real client", () => {
        const real = Object.getOwnPropertyNames(ManagementRestClient.prototype).filter(name => name !== "constructor");
        const mock = Object.getOwnPropertyNames(MockManagementRestClient.prototype);
        expect(real.filter(name => !mock.includes(name))).toEqual([]);
    });

    it("gets the agent pool selection", async () => {
        const details = await client.getAdvancedSecurityAgentPoolSelection();
        expect(details).toBe(agentPoolDetails);
        expect(details.allAvailableAgentPools).toContain(details.currentAgentPool);
    });

    it("updates the agent pool selection", async () => {
        const details = await client.updateAdvancedSecurityAgentPoolSelection("Default");
        expect(details.currentAgentPool).toBe("Default");
        expect(details.allAvailableAgentPools).toEqual(agentPoolDetails.allAvailableAgentPools);
        expect(agentPoolDetails.currentAgentPool).toBe("Azure Pipelines");
    });

    it("cancels the queued CodeQL jobs", async () => {
        expect(await client.cancelCodeQLJobs()).toBe(CODEQL_JOB_COUNT);
    });

    it("counts the queued CodeQL jobs", async () => {
        expect(await client.getCodeQLJobCount()).toBe(CODEQL_JOB_COUNT);
    });

    it("gets the CodeQL schedule", async () => {
        expect(await client.getCodeQLSchedule()).toBe(codeQLSchedule);
        expect(await client.getCodeQLScheduleLegacy()).toBe(codeQLSchedule);
    });

    it("updates the CodeQL schedule", async () => {
        const day = (codeQLSchedule.scheduleDayOfWeek + 1) % 7;
        const updated = await client.updateCodeQLSchedule(day);
        expect(updated).toEqual({ ...codeQLSchedule, scheduleDayOfWeek: day });
        const legacy = await client.updateCodeQLScheduleLegacy(day);
        expect(legacy).toEqual({ ...codeQLSchedule, scheduleDayOfWeek: day });
        expect(codeQLSchedule.scheduleDayOfWeek).not.toBe(day);
    });

    it("creates a billing snapshot", async () => {
        await expect(client.createBillingSnapshot2(meterUsage, Plan.CodeSecurity)).resolves.toBeUndefined();
    });

    it("lists the billable committers", async () => {
        expect(await client.getBillableCommitterDetails2(Plan.CodeSecurity)).toBe(billableCommitters);
        expect(await client.getBillableCommitterDetails2(Plan.SecretProtection, new Date())).toBe(billableCommitters);
    });

    it("gets the last meter usage", async () => {
        expect(await client.getLastMeterUsage2(Plan.All)).toBe(meterUsage);
    });

    it("gets the meter usage of the last billing date by default", async () => {
        expect(await client.getMeterUsage2(Plan.CodeSecurity)).toEqual(meterUsage);
    });

    it("gets the meter usage of the requested billing date", async () => {
        const billingDate = new Date("2025-01-31T00:00:00Z");
        const usage = await client.getMeterUsage2(Plan.CodeSecurity, billingDate);
        expect(usage.billingDate).toBe(billingDate);
        expect(usage.billedUsers).toBe(meterUsage.billedUsers);
        expect(meterUsage.billingDate).not.toBe(billingDate);
    });

    it("gets the organization enablement", async () => {
        expect(await client.getOrgEnablementStatus2(true)).toBe(orgEnablement);
    });

    it("updates the organization enablement", async () => {
        await expect(client.updateOrgEnablementStatus2(orgEnablement)).resolves.toBeUndefined();
    });

    it("estimates the billable pushers of the organization", async () => {
        expect(await client.getEstimatedBillablePushersDetailsForOrg2()).toBe(meterUsageEstimate);
        expect(await client.getEstimatedBillablePushersDetailsForOrg2(Plan.CodeSecurity)).toBe(meterUsageEstimate);
    });

    it("gets the enablement of a known project with its repositories", async () => {
        const settings = await client.getProjectEnablementStatus2(enabledProjectIds[0], true);
        expect(settings.reposEnablementStatus).toEqual([repoEnablements[0], repoEnablements[1]]);
        expect(settings.codeSecurityFeatures).toBe(projectEnablement.codeSecurityFeatures);
        expect(settings.enablementOnCreateSettings).toBe(projectEnablement.enablementOnCreateSettings);
    });

    it("fabricates the enablement of an unknown project", async () => {
        const settings = await client.getProjectEnablementStatus2("missing-project");
        expect(settings.reposEnablementStatus.length).toBe(1);
        expect(settings.reposEnablementStatus[0].projectId).toBe("missing-project");
    });

    it("updates the project enablement", async () => {
        await expect(
            client.updateProjectEnablementStatus2(projectEnablement, enabledProjectIds[0])
        ).resolves.toBeUndefined();
    });

    it("estimates the billable pushers of a project", async () => {
        expect(await client.getEstimatedBillablePushersDetailsForProject2("proj")).toBe(meterUsageEstimate);
        expect(await client.getEstimatedBillablePushersDetailsForProject2("proj", Plan.All)).toBe(meterUsageEstimate);
    });

    it("gets the enablement of a known repository", async () => {
        const target = repoEnablements[2];
        expect(await client.getRepoEnablementStatus2(target.projectId, target.repositoryId, true)).toBe(target);
    });

    it("fabricates the enablement of an unknown repository", async () => {
        const settings = await client.getRepoEnablementStatus2("proj", "missing-repository");
        expect(settings.projectId).toBe("proj");
        expect(settings.repositoryId).toBe("missing-repository");
        expect(settings.codeSecurityFeatures.codeSecurityEnabled).toBe(true);
        expect(settings.secretProtectionFeatures.secretProtectionEnabled).toBe(true);
    });

    it("updates the repository enablement", async () => {
        const target = repoEnablements[0];
        await expect(
            client.updateRepoAdvSecEnablementStatus2(target, target.projectId, target.repositoryId)
        ).resolves.toBeUndefined();
    });

    it("estimates the billable committers of a repository", async () => {
        expect(await client.getEstimatedBillableCommittersDetailsForRepo2("proj", "repo")).toBe(meterUsageEstimate);
        expect(await client.getEstimatedBillableCommittersDetailsForRepo2("proj", "repo", Plan.SecretProtection)).toBe(
            meterUsageEstimate
        );
    });
});

describe("management fixtures", () => {
    it("makes agent pool details whose current pool is available", () => {
        const details = makeAgentPoolDetails();
        expect(details.allAvailableAgentPools).toContain(details.currentAgentPool);
    });

    it("makes a CodeQL schedule on a day of the week", () => {
        const schedule = makeCodeQLScheduleDetails();
        expect(schedule.scheduleDayOfWeek).toBeGreaterThanOrEqual(0);
        expect(schedule.scheduleDayOfWeek).toBeLessThanOrEqual(6);
        expect(schedule.lastRunDate).toBeInstanceOf(Date);
    });

    it("makes a billed committer list of the requested size", () => {
        expect(typeof makeBilledCommitter().userIdentity.displayName).toBe("string");
        const list = makeBilledCommittersList(3);
        expect(list.billedUsers.length).toBe(3);
        expect(list.uniqueCommitterCount).toBe(3);
        expect(makeBilledCommittersList().uniqueCommitterCount).toBe(2);
    });

    it("makes meter usage for an enabled plan", () => {
        const usage = makeMeterUsageForPlan();
        expect(usage.isPlanEnabled).toBe(true);
        expect(usage.billedUsers.billedUsers.length).toBe(usage.billedUsers.uniqueCommitterCount);
    });

    it("makes a meter usage estimate for both plans", () => {
        const estimate = makeMeterUsageEstimate();
        expect(estimate.codeSecurityMeterUsageEstimate.uniqueCommitterCount).toBe(2);
        expect(estimate.secretProtectionMeterUsageEstimate.uniqueCommitterCount).toBe(2);
    });

    it("makes billable committer details whose nickname comes from the email", () => {
        const details = makeBillableCommitterDetails();
        expect(details.committerEmail.startsWith(`${details.mailNickName}@`)).toBe(true);
        expect(details.commitId.length).toBe(40);
        expect(typeof details.pushId).toBe("number");
    });

    it("makes code security features with the malware alerts flag", () => {
        const features = makeCodeSecurityFeatures();
        expect(features.malwareAlertsEnabled).toBe(false);
        expect(features.codeSecurityEnabled).toBe(true);
        expect(features.codeSecurityEnablementLastChangedDate).toBeInstanceOf(Date);
    });

    it("makes secret protection features", () => {
        const features = makeSecretProtectionFeatures();
        expect(features.secretProtectionEnabled).toBe(true);
        expect(features.blockPushes).toBe(true);
    });

    it("makes enablement on create settings with the newer flags", () => {
        const settings = makeEnablementOnCreateSettings();
        expect(settings.enableAutofixOnCreate).toBe(false);
        expect(settings.enableMalwareAlertsOnCreate).toBe(false);
        expect(settings.enableCodeSecurityOnCreate).toBe(true);
    });

    it("makes repository enablement for the given ids or random ones", () => {
        expect(makeRepoEnablementSettings("p", "r")).toMatchObject({ projectId: "p", repositoryId: "r" });
        const random = makeRepoEnablementSettings();
        expect(typeof random.projectId).toBe("string");
        expect(typeof random.repositoryId).toBe("string");
    });

    it("makes project and organization enablement over the given repositories or a random one", () => {
        expect(makeProjectEnablementSettings(repoEnablements).reposEnablementStatus).toBe(repoEnablements);
        expect(makeProjectEnablementSettings().reposEnablementStatus.length).toBe(1);
        expect(makeOrgEnablementSettings(repoEnablements).reposEnablementStatus).toBe(repoEnablements);
        expect(makeOrgEnablementSettings().reposEnablementStatus.length).toBe(1);
    });

    it("seeds repository enablement with unique repository ids", () => {
        expect(new Set(repoEnablements.map(r => r.repositoryId)).size).toBe(repoEnablements.length);
        expect(repoEnablements.map(r => r.projectId)).toEqual([
            enabledProjectIds[0],
            enabledProjectIds[0],
            enabledProjectIds[1]
        ]);
        expect(orgEnablement.reposEnablementStatus).toBe(repoEnablements);
    });

    it("seeds billable committers with unique push ids", () => {
        expect(new Set(billableCommitters.map(c => c.pushId)).size).toBe(billableCommitters.length);
    });
});
