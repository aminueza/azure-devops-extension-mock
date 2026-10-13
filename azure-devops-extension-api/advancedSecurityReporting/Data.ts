import { fake } from "../common/fixtures";
import {
    AdvancedFilter,
    AlertType,
    AlertValidityStatus,
    CodeScanningRuleInfo,
    CombinedAlertFilterCriteria,
    DashboardAlert,
    DashboardAlertState,
    OrgAlertSummary,
    OrgEnablementSummary,
    Project,
    ProjectAlertSummary,
    ProjectAndRepoInfo,
    ProjectEnablementSummary,
    RepoAlertSummary,
    RepoEnablementSummary,
    ReportingUXComputedFilters,
    Severity,
    State
} from "azure-devops-extension-api/AdvancedSecurity.Reporting";
import { makeIdentityRef } from "../core/Data";
import { advSecProjectIds, enablementStatuses, repositories } from "../git/Data";

export const SECRET_PLACEHOLDER = "***";
export const ORG_ID = fake.string.uuid();
export const DEPENDENCY_TOOL = "Advanced Security Dependency Scanning";
export const SECRET_TOOL = "Advanced Security Secrets Scanning";
export const CODE_TOOL = "CodeQL";

export const makeProject = (id: string = fake.string.uuid()): Project => ({ id, name: fake.company.name() });

export const makeFilterCriteria = (): CombinedAlertFilterCriteria => ({
    alertType: AlertType.Code,
    alertValidityStatus: AlertValidityStatus.None,
    componentNames: [],
    componentTypes: [],
    dismissalTypes: [],
    fixedDateEnd: fake.helpers.absent(),
    fixedDateStart: fake.helpers.absent(),
    introducedDateEnd: fake.date.recent(),
    introducedDateStart: fake.date.past(),
    keywords: "",
    projects: [],
    repositories: [],
    repositoryIds: [],
    ruleNames: [],
    secretTypes: [],
    severities: [Severity.High, Severity.Critical],
    state: DashboardAlertState.Open,
    toolNames: [CODE_TOOL]
});

export const makeAdvancedFilter = (): AdvancedFilter => {
    const createdByIdentity = makeIdentityRef();
    const id = fake.string.uuid();
    return {
        _links: {},
        changedBy: createdByIdentity.id,
        changedDate: fake.date.recent(),
        createdBy: createdByIdentity.id,
        createdByIdentity,
        createdDate: fake.date.past(),
        filterCriteria: makeFilterCriteria(),
        id,
        isDeleted: false,
        name: fake.lorem.words(3),
        url: `${fake.internet.url()}/_apis/reporting/filters/${id}`
    };
};

export const makeCodeScanningRuleInfo = (toolName: string = CODE_TOOL): CodeScanningRuleInfo => ({
    friendlyName: fake.lorem.words(3),
    opaqueId: `rule/${fake.lorem.slug(2)}-${fake.number.id()}`,
    toolName
});

export const makeDashboardAlert = (
    alertType: AlertType = AlertType.Code,
    project: Project = makeProject()
): DashboardAlert => {
    const alertId = fake.number.id();
    return {
        alertId,
        alertType,
        introducedDate: fake.date.past(),
        locations: [
            {
                alertId,
                filePath: `/src/${fake.system.fileName()}`,
                region: { columnEnd: 40, columnStart: 1, lineEnd: 12, lineStart: 12 }
            }
        ],
        projectName: project.name,
        repositoryName: repositories[0].name,
        severity: Severity.High,
        state: State.Active,
        title: fake.lorem.sentence(4),
        truncatedSecret: alertType === AlertType.Secret ? SECRET_PLACEHOLDER : fake.helpers.absent(),
        validityStatus: alertType === AlertType.Secret ? AlertValidityStatus.Active : AlertValidityStatus.None
    };
};

export const makeRepoAlertSummary = (repoId: string = fake.string.uuid()): RepoAlertSummary => {
    const alertsBySeverity = {
        critical: fake.number.int({ min: 0, max: 3 }),
        high: fake.number.int({ min: 0, max: 5 }),
        low: fake.number.int({ min: 0, max: 5 }),
        medium: fake.number.int({ min: 0, max: 5 }),
        note: fake.number.int({ min: 0, max: 5 })
    };
    const alertsByState = {
        dismissed: fake.number.int({ min: 0, max: 5 }),
        fixed: fake.number.int({ min: 0, max: 5 }),
        new: fake.number.int({ min: 0, max: 5 })
    };
    const openAlerts = Object.values(alertsBySeverity).reduce((sum, count) => sum + count, 0);
    return {
        alertsBySeverity,
        alertsByState,
        openAlerts,
        repoId,
        repoName: fake.lorem.slug(2),
        totalAlerts: openAlerts + alertsByState.dismissed + alertsByState.fixed
    };
};

export const makeRepoEnablementSummary = (
    repoId: string = fake.string.uuid(),
    enabled = true
): RepoEnablementSummary => {
    const scan = { alerts: { enabled }, prAlerts: { enabled }, pushProtection: { enabled } };
    const scanTypes = [AlertType.Dependency, AlertType.Secret, AlertType.Code];
    return {
        advSecIsEnabled: enabled,
        codeSecurityEnabled: enabled,
        repoId,
        repoName: fake.lorem.slug(2),
        scanTypeMetadata: Object.fromEntries(
            scanTypes.filter(() => enabled).map(type => [type, { lastScanDate: fake.date.recent() }])
        ),
        scanTypeSummary: Object.fromEntries(scanTypes.map(type => [type, scan])),
        secretProtectionEnabled: enabled
    };
};

export const makeOrgAlertSummary = (summaries: ProjectAlertSummary[]): OrgAlertSummary => {
    const repos = summaries.flatMap(p => p.repos);
    return {
        orgId: ORG_ID,
        projects: summaries,
        totals: {
            dismissedAlerts: repos.reduce((sum, r) => sum + r.alertsByState.dismissed, 0),
            fixedAlerts: repos.reduce((sum, r) => sum + r.alertsByState.fixed, 0),
            matchingRepositoryCount: repos.length,
            newAlerts: repos.reduce((sum, r) => sum + r.alertsByState.new, 0),
            openAlerts: repos.reduce((sum, r) => sum + r.openAlerts, 0),
            totalRepositoryCount: repos.length
        }
    };
};

export const makeOrgEnablementSummary = (summaries: ProjectEnablementSummary[]): OrgEnablementSummary => {
    const repos = summaries.flatMap(p => p.repos);
    const enabled = repos.filter(r => r.advSecIsEnabled).length;
    return {
        orgId: ORG_ID,
        projects: summaries,
        totals: {
            code: { repositoryCount: enabled },
            dependencies: { repositoryCount: enabled },
            matchingRepositoryCount: repos.length,
            noTooling: { repositoryCount: repos.length - enabled },
            secrets: { repositoryCount: enabled },
            totalRepositoryCount: enabled
        }
    };
};

export const reportingProjects: Project[] = fake.helpers
    .distinct(advSecProjectIds.length, makeProject, p => p.name)
    .map((project, index) => ({ ...project, id: advSecProjectIds[index] }));

export const repositoryName = (repositoryId: string): string =>
    repositories.find(r => r.id === repositoryId)?.name ?? repositoryId;

export const projectsAndRepos: ProjectAndRepoInfo[] = reportingProjects.flatMap(project =>
    enablementStatuses
        .filter(status => status.projectId === project.id)
        .map(status => ({
            projectId: project.id,
            projectName: project.name,
            repositoryId: status.repositoryId,
            repositoryName: repositoryName(status.repositoryId)
        }))
);

export const advancedFilters: AdvancedFilter[] = fake.helpers
    .distinct(3, makeAdvancedFilter, f => f.name)
    .map((filter, index) => ({ ...filter, isDeleted: index === 2 }));

export const dependencyComponentNames: string[] = ["lodash", "minimist", "Newtonsoft.Json", "log4j-core"];

export const secretTypes: string[] = ["Azure DevOps personal access token", "Azure Storage account access key"];

export const codeScanningRules: CodeScanningRuleInfo[] = [
    makeCodeScanningRuleInfo(),
    makeCodeScanningRuleInfo(),
    makeCodeScanningRuleInfo("ESLint")
];

export const uxComputedFilters: ReportingUXComputedFilters = { projects: reportingProjects };

export const dashboardAlerts: DashboardAlert[] = [
    { ...makeDashboardAlert(AlertType.Dependency, reportingProjects[0]), severity: Severity.Critical },
    { ...makeDashboardAlert(AlertType.Secret, reportingProjects[0]), severity: Severity.Critical },
    makeDashboardAlert(AlertType.Code, reportingProjects[0]),
    { ...makeDashboardAlert(AlertType.Code, reportingProjects[1]), severity: Severity.Medium, state: State.Fixed },
    {
        ...makeDashboardAlert(AlertType.Dependency, reportingProjects[1]),
        severity: Severity.Low,
        state: State.Dismissed
    }
];

export const projectAlertSummaries: ProjectAlertSummary[] = reportingProjects.map(project => ({
    projectId: project.id,
    projectName: project.name,
    repos: projectsAndRepos
        .filter(info => info.projectId === project.id)
        .map(info => ({ ...makeRepoAlertSummary(info.repositoryId), repoName: info.repositoryName }))
}));

export const projectEnablementSummaries: ProjectEnablementSummary[] = reportingProjects.map(project => ({
    projectId: project.id,
    projectName: project.name,
    repos: enablementStatuses
        .filter(status => status.projectId === project.id)
        .map(status => ({
            ...makeRepoEnablementSummary(status.repositoryId, status.enabled),
            repoName: repositoryName(status.repositoryId)
        }))
}));

export const alertSummary: OrgAlertSummary = makeOrgAlertSummary(projectAlertSummaries);

export const enablementSummary: OrgEnablementSummary = makeOrgEnablementSummary(projectEnablementSummaries);
