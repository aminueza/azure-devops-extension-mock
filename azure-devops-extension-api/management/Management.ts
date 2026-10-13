import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    AgentPoolDetails,
    BillableCommitterDetails,
    CodeQLScheduleDetails,
    ManagementRestClient,
    MeterUsageEstimate,
    MeterUsageForPlan,
    OrgEnablementSettings,
    Plan,
    ProjectEnablementSettings,
    RepoEnablementSettings
} from "azure-devops-extension-api/Management";
import {
    CODEQL_JOB_COUNT,
    agentPoolDetails,
    billableCommitters,
    codeQLSchedule,
    makeRepoEnablementSettings,
    meterUsage,
    meterUsageEstimate,
    orgEnablement,
    projectEnablement,
    repoEnablements
} from "./Data";

const findRepoEnablements = (project: string): RepoEnablementSettings[] => {
    const known = repoEnablements.filter(r => r.projectId === project);
    return known.length > 0 ? known : [makeRepoEnablementSettings(project)];
};

export class MockManagementRestClient extends RestClientBase {
    public TYPE = ManagementRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getAdvancedSecurityAgentPoolSelection(): Promise<AgentPoolDetails> {
        return Promise.resolve(agentPoolDetails);
    }

    updateAdvancedSecurityAgentPoolSelection(agentPoolName: string): Promise<AgentPoolDetails> {
        return Promise.resolve({ ...agentPoolDetails, currentAgentPool: agentPoolName });
    }

    cancelCodeQLJobs(): Promise<number> {
        return Promise.resolve(CODEQL_JOB_COUNT);
    }

    getCodeQLJobCount(): Promise<number> {
        return Promise.resolve(CODEQL_JOB_COUNT);
    }

    getCodeQLSchedule(): Promise<CodeQLScheduleDetails> {
        return Promise.resolve(codeQLSchedule);
    }

    updateCodeQLSchedule(scheduleDayOfWeek: number): Promise<CodeQLScheduleDetails> {
        return Promise.resolve({ ...codeQLSchedule, scheduleDayOfWeek });
    }

    getCodeQLScheduleLegacy(): Promise<CodeQLScheduleDetails> {
        return Promise.resolve(codeQLSchedule);
    }

    updateCodeQLScheduleLegacy(scheduleDayOfWeek: number): Promise<CodeQLScheduleDetails> {
        return Promise.resolve({ ...codeQLSchedule, scheduleDayOfWeek });
    }

    createBillingSnapshot2(_meterUsage: MeterUsageForPlan, _plan: Plan): Promise<void> {
        return Promise.resolve();
    }

    getBillableCommitterDetails2(_plan: Plan, _billingDate?: Date): Promise<BillableCommitterDetails[]> {
        return Promise.resolve(billableCommitters);
    }

    getLastMeterUsage2(_plan: Plan): Promise<MeterUsageForPlan> {
        return Promise.resolve(meterUsage);
    }

    getMeterUsage2(_plan: Plan, billingDate?: Date): Promise<MeterUsageForPlan> {
        return Promise.resolve({ ...meterUsage, billingDate: billingDate ?? meterUsage.billingDate });
    }

    getOrgEnablementStatus2(_includeAllProperties?: boolean): Promise<OrgEnablementSettings> {
        return Promise.resolve(orgEnablement);
    }

    updateOrgEnablementStatus2(_orgEnablementSettings: OrgEnablementSettings): Promise<void> {
        return Promise.resolve();
    }

    getEstimatedBillablePushersDetailsForOrg2(_plan?: Plan): Promise<MeterUsageEstimate> {
        return Promise.resolve(meterUsageEstimate);
    }

    getProjectEnablementStatus2(project: string, _includeAllProperties?: boolean): Promise<ProjectEnablementSettings> {
        return Promise.resolve({ ...projectEnablement, reposEnablementStatus: findRepoEnablements(project) });
    }

    updateProjectEnablementStatus2(
        _projectEnablementSettings: ProjectEnablementSettings,
        _project: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getEstimatedBillablePushersDetailsForProject2(_project: string, _plan?: Plan): Promise<MeterUsageEstimate> {
        return Promise.resolve(meterUsageEstimate);
    }

    getRepoEnablementStatus2(
        project: string,
        repository: string,
        _includeAllProperties?: boolean
    ): Promise<RepoEnablementSettings> {
        return Promise.resolve(
            repoEnablements.find(r => r.repositoryId === repository) ?? makeRepoEnablementSettings(project, repository)
        );
    }

    updateRepoAdvSecEnablementStatus2(
        _repoEnablementSettings: RepoEnablementSettings,
        _project: string,
        _repository: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getEstimatedBillableCommittersDetailsForRepo2(
        _project: string,
        _repository: string,
        _plan?: Plan
    ): Promise<MeterUsageEstimate> {
        return Promise.resolve(meterUsageEstimate);
    }
}
