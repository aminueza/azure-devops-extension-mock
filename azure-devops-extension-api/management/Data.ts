import { fake } from "../common/fixtures";
import {
    AgentPoolDetails,
    BillableCommitterDetails,
    BilledCommitter,
    BilledCommittersList,
    CodeQLScheduleDetails,
    CodeSecurityFeatures,
    EnablementOnCreateSettings,
    MeterUsageEstimate,
    MeterUsageForPlan,
    OrgEnablementSettings,
    ProjectEnablementSettings,
    RepoEnablementSettings,
    SecretProtectionFeatures
} from "azure-devops-extension-api/Management";
import { makeIdentityRef } from "../core/Data";

export const makeAgentPoolDetails = (): AgentPoolDetails => ({
    allAvailableAgentPools: ["Azure Pipelines", "Default"],
    currentAgentPool: "Azure Pipelines"
});

export const makeCodeQLScheduleDetails = (): CodeQLScheduleDetails => ({
    lastRunDate: fake.date.recent({ days: 7 }),
    lastRunResult: 0,
    scheduleDayOfWeek: fake.number.int({ min: 0, max: 6 })
});

export const makeBilledCommitter = (): BilledCommitter => ({
    cuid: fake.string.uuid(),
    userIdentity: makeIdentityRef()
});

export const makeBilledCommittersList = (count = 2): BilledCommittersList => ({
    billedUsers: Array.from({ length: count }, makeBilledCommitter),
    uniqueCommitterCount: count
});

export const makeMeterUsageForPlan = (): MeterUsageForPlan => ({
    accountId: fake.string.uuid(),
    azureSubscriptionId: fake.string.uuid(),
    billedUsers: makeBilledCommittersList(),
    billingDate: fake.date.recent(),
    isPlanEnabled: true,
    tenantId: fake.string.uuid()
});

export const makeMeterUsageEstimate = (): MeterUsageEstimate => ({
    codeSecurityMeterUsageEstimate: makeBilledCommittersList(),
    secretProtectionMeterUsageEstimate: makeBilledCommittersList()
});

export const makeBillableCommitterDetails = (): BillableCommitterDetails => {
    const email = fake.internet.email();
    return {
        commitId: fake.git.commitSha(),
        committerEmail: email,
        commitTime: fake.date.recent({ days: 3 }),
        displayName: fake.person.fullName(),
        mailNickName: email.split("@")[0],
        projectId: fake.string.uuid(),
        projectName: fake.lorem.words(2),
        pushedTime: fake.date.recent({ days: 2 }),
        pusherId: fake.string.uuid(),
        pushId: fake.number.id(),
        repoId: fake.string.uuid(),
        repoName: fake.lorem.slug(2),
        samAccountName: fake.internet.username(),
        vsid: fake.string.uuid()
    };
};

export const makeCodeSecurityFeatures = (): CodeSecurityFeatures & { malwareAlertsEnabled: boolean } => ({
    autofixEnabled: false,
    codeQLEnabled: true,
    codeSecurityChangedBy: fake.string.uuid(),
    codeSecurityEnabled: true,
    codeSecurityEnablementLastChangedDate: fake.date.recent({ days: 30 }),
    dependabotEnabled: true,
    dependencyScanningInjectionEnabled: false,
    malwareAlertsEnabled: false
});

export const makeSecretProtectionFeatures = (): SecretProtectionFeatures => ({
    blockPushes: true,
    secretProtectionChangedBy: fake.string.uuid(),
    secretProtectionEnabled: true,
    secretProtectionEnablementLastChangedDate: fake.date.recent({ days: 30 })
});

export const makeEnablementOnCreateSettings = (): EnablementOnCreateSettings & {
    enableAutofixOnCreate: boolean;
    enableMalwareAlertsOnCreate: boolean;
} => ({
    enableAutofixOnCreate: false,
    enableBlockPushesOnCreate: true,
    enableCodeQLOnCreate: false,
    enableCodeSecurityOnCreate: true,
    enableDependabotOnCreate: false,
    enableDependencyScanningInjectionOnCreate: false,
    enableMalwareAlertsOnCreate: false,
    enableSecretProtectionOnCreate: true
});

export const makeRepoEnablementSettings = (
    projectId: string = fake.string.uuid(),
    repositoryId: string = fake.string.uuid()
): RepoEnablementSettings => ({
    codeSecurityFeatures: makeCodeSecurityFeatures(),
    isBundledSKU: false,
    projectId,
    repositoryId,
    secretProtectionFeatures: makeSecretProtectionFeatures()
});

export const makeProjectEnablementSettings = (
    reposEnablementStatus: RepoEnablementSettings[] = [makeRepoEnablementSettings()]
): ProjectEnablementSettings => ({
    codeSecurityFeatures: makeCodeSecurityFeatures(),
    enablementOnCreateSettings: makeEnablementOnCreateSettings(),
    isBundledSKU: false,
    reposEnablementStatus,
    secretProtectionFeatures: makeSecretProtectionFeatures()
});

export const makeOrgEnablementSettings = (
    reposEnablementStatus: RepoEnablementSettings[] = [makeRepoEnablementSettings()]
): OrgEnablementSettings => makeProjectEnablementSettings(reposEnablementStatus);

export const CODEQL_JOB_COUNT = 2;

export const agentPoolDetails: AgentPoolDetails = makeAgentPoolDetails();

export const codeQLSchedule: CodeQLScheduleDetails = makeCodeQLScheduleDetails();

export const meterUsage: MeterUsageForPlan = makeMeterUsageForPlan();

export const meterUsageEstimate: MeterUsageEstimate = makeMeterUsageEstimate();

export const billableCommitters: BillableCommitterDetails[] = [
    makeBillableCommitterDetails(),
    makeBillableCommitterDetails(),
    makeBillableCommitterDetails()
];

export const enabledProjectIds: string[] = [fake.string.uuid(), fake.string.uuid()];

export const repoEnablements: RepoEnablementSettings[] = [
    makeRepoEnablementSettings(enabledProjectIds[0]),
    makeRepoEnablementSettings(enabledProjectIds[0]),
    makeRepoEnablementSettings(enabledProjectIds[1])
];

export const projectEnablement: ProjectEnablementSettings = makeProjectEnablementSettings(repoEnablements);

export const orgEnablement: OrgEnablementSettings = makeOrgEnablementSettings(repoEnablements);
