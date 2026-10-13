import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    AdvancedFilter,
    AdvancedFilterCreate,
    AdvancedFilterUpdate,
    CodeScanningRuleInfo,
    CombinedAlertFilterCriteria,
    DashboardAlert,
    DashboardAlertState,
    EnablementFilterCriteria,
    FilterCriteria,
    OrgAlertSummary,
    OrgEnablementSummary,
    ProjectAndRepoInfo,
    ReportingRestClient,
    ReportingUXComputedFilters,
    State
} from "azure-devops-extension-api/AdvancedSecurity.Reporting";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    advancedFilters,
    codeScanningRules,
    dashboardAlerts,
    dependencyComponentNames,
    makeAdvancedFilter,
    makeOrgAlertSummary,
    makeOrgEnablementSummary,
    projectAlertSummaries,
    projectEnablementSummaries,
    projectsAndRepos,
    secretTypes,
    uxComputedFilters
} from "./Data";

const findFilter = (filterId: string): AdvancedFilter =>
    advancedFilters.find(f => f.id === filterId) ?? { ...makeAdvancedFilter(), id: filterId };

const wanted = <T>(values: T[] | undefined, value: T): boolean =>
    values === undefined || values.length === 0 || values.includes(value);

const stateOf = (alert: DashboardAlert): DashboardAlertState =>
    alert.state === State.Active ? DashboardAlertState.Open : DashboardAlertState.Closed;

export class MockReportingRestClient extends RestClientBase {
    public TYPE = ReportingRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createAdvancedFilter(filter: AdvancedFilterCreate): Promise<AdvancedFilter> {
        return Promise.resolve({ ...makeAdvancedFilter(), ...filter });
    }

    deleteAdvancedFilter(_filterId: string): Promise<void> {
        return Promise.resolve();
    }

    getAdvancedFilter(filterId: string): Promise<AdvancedFilter> {
        return Promise.resolve(findFilter(filterId));
    }

    listAdvancedFilters(includeDeleted?: boolean, keywords?: string): Promise<AdvancedFilter[]> {
        const text = (keywords ?? "").toLowerCase();
        return Promise.resolve(
            advancedFilters.filter(
                f => (includeDeleted === true || !f.isDeleted) && f.name.toLowerCase().includes(text)
            )
        );
    }

    updateAdvancedFilter(_filter: AdvancedFilterUpdate, _filterId: string): Promise<void> {
        return Promise.resolve();
    }

    getDependencyComponentNamesForOrg(): Promise<string[]> {
        return Promise.resolve(dependencyComponentNames);
    }

    getProjectsAndReposForOrg(): Promise<ProjectAndRepoInfo[]> {
        return Promise.resolve(projectsAndRepos);
    }

    getRuleNamesForOrg(toolName?: string): Promise<CodeScanningRuleInfo[]> {
        return Promise.resolve(codeScanningRules.filter(r => toolName === undefined || r.toolName === toolName));
    }

    getSecretTypesForOrg(): Promise<string[]> {
        return Promise.resolve(secretTypes);
    }

    getUXComputedFilters(): Promise<ReportingUXComputedFilters> {
        return Promise.resolve(uxComputedFilters);
    }

    getAlertSummaryForOrg(criteria?: FilterCriteria): Promise<OrgAlertSummary> {
        return Promise.resolve(
            makeOrgAlertSummary(projectAlertSummaries.filter(p => wanted(criteria?.projects, p.projectName)))
        );
    }

    getCombinedAlertsForOrg(
        criteria?: CombinedAlertFilterCriteria,
        top?: number,
        _continuationToken?: string
    ): Promise<PagedList<DashboardAlert>> {
        const matching = dashboardAlerts.filter(
            a =>
                (criteria?.alertType === undefined || a.alertType === criteria.alertType) &&
                (criteria?.state === undefined || stateOf(a) === criteria.state) &&
                wanted(criteria?.severities, a.severity) &&
                wanted(criteria?.projects, a.projectName)
        );
        const paged: PagedList<DashboardAlert> = Object.assign(matching.slice(0, top ?? matching.length), {
            continuationToken: null
        });
        return Promise.resolve(paged);
    }

    getEnablementSummaryForOrg(criteria?: EnablementFilterCriteria): Promise<OrgEnablementSummary> {
        return Promise.resolve(
            makeOrgEnablementSummary(projectEnablementSummaries.filter(p => wanted(criteria?.projects, p.projectName)))
        );
    }
}
