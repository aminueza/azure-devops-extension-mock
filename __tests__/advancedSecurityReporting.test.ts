import {
    AdvancedFilterCreate,
    AlertType,
    AlertValidityStatus,
    CombinedAlertFilterCriteria,
    DashboardAlertState,
    EnablementFilterCriteria,
    FilterCriteria,
    ReportingRestClient,
    Severity,
    State
} from "azure-devops-extension-api/AdvancedSecurity.Reporting";
import { getClient, getRegisteredMockClient, MockReportingRestClient } from "../azure-devops-extension-api";
import {
    advancedFilters,
    alertSummary,
    CODE_TOOL,
    codeScanningRules,
    dashboardAlerts,
    dependencyComponentNames,
    enablementSummary,
    makeAdvancedFilter,
    makeCodeScanningRuleInfo,
    makeDashboardAlert,
    makeFilterCriteria,
    makeOrgAlertSummary,
    makeOrgEnablementSummary,
    makeProject,
    makeRepoAlertSummary,
    makeRepoEnablementSummary,
    ORG_ID,
    projectAlertSummaries,
    projectEnablementSummaries,
    projectsAndRepos,
    reportingProjects,
    repositoryName,
    SECRET_PLACEHOLDER,
    secretTypes,
    uxComputedFilters
} from "../azure-devops-extension-api/advancedSecurityReporting/Data";
import { advSecProjectIds, enablementStatuses, repositories } from "../azure-devops-extension-api/git/Data";

const combined = (partial: Partial<CombinedAlertFilterCriteria>): CombinedAlertFilterCriteria =>
    partial as CombinedAlertFilterCriteria;

describe("ReportingRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(ReportingRestClient);
    const [first, second] = reportingProjects;

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(ReportingRestClient)).toBe(MockReportingRestClient);
    });

    it("creates a filter echoing the posted object", async () => {
        const posted: AdvancedFilterCreate = {
            name: "critical secrets",
            filterCriteria: { ...makeFilterCriteria(), alertType: AlertType.Secret }
        };
        const created = await client.createAdvancedFilter(posted);
        expect(created.name).toBe("critical secrets");
        expect(created.filterCriteria).toBe(posted.filterCriteria);
        expect(typeof created.id).toBe("string");
        expect(created.isDeleted).toBe(false);
        expect(created.createdDate).toBeInstanceOf(Date);
        expect(advancedFilters.map(f => f.id)).not.toContain(created.id);
    });

    it("deletes a filter", async () => {
        await expect(client.deleteAdvancedFilter(advancedFilters[0].id)).resolves.toBeUndefined();
    });

    it("gets a known filter", async () => {
        expect(await client.getAdvancedFilter(advancedFilters[1].id)).toBe(advancedFilters[1]);
    });

    it("fabricates an unknown filter", async () => {
        const made = await client.getAdvancedFilter("missing-filter");
        expect(made.id).toBe("missing-filter");
        expect(typeof made.name).toBe("string");
        expect(made.createdBy).toBe(made.createdByIdentity.id);
    });

    it("lists the filters that are not deleted", async () => {
        expect(await client.listAdvancedFilters()).toEqual(advancedFilters.slice(0, 2));
        expect(await client.listAdvancedFilters(false)).toEqual(advancedFilters.slice(0, 2));
    });

    it("includes deleted filters when asked to", async () => {
        const list = await client.listAdvancedFilters(true);
        expect(list).toEqual(advancedFilters);
        expect(list[2].isDeleted).toBe(true);
    });

    it("filters the filters by keywords", async () => {
        const list = await client.listAdvancedFilters(true, advancedFilters[1].name.toUpperCase());
        expect(list).toEqual([advancedFilters[1]]);
        expect(await client.listAdvancedFilters(true, "no such filter name")).toEqual([]);
    });

    it("updates a filter", async () => {
        await expect(client.updateAdvancedFilter({ name: "renamed" }, advancedFilters[0].id)).resolves.toBeUndefined();
    });

    it("lists the dependency component names", async () => {
        expect(await client.getDependencyComponentNamesForOrg()).toBe(dependencyComponentNames);
    });

    it("lists the projects and repositories", async () => {
        const list = await client.getProjectsAndReposForOrg();
        expect(list).toBe(projectsAndRepos);
        expect(list.map(info => info.repositoryId)).toEqual(enablementStatuses.map(s => s.repositoryId));
    });

    it("lists every rule name", async () => {
        expect(await client.getRuleNamesForOrg()).toEqual(codeScanningRules);
    });

    it("lists the rule names of a tool", async () => {
        expect(await client.getRuleNamesForOrg("ESLint")).toEqual([codeScanningRules[2]]);
        expect(await client.getRuleNamesForOrg(CODE_TOOL)).toEqual(codeScanningRules.slice(0, 2));
        expect(await client.getRuleNamesForOrg("missing")).toEqual([]);
    });

    it("lists the secret types", async () => {
        expect(await client.getSecretTypesForOrg()).toBe(secretTypes);
    });

    it("gets the computed filters", async () => {
        const filters = await client.getUXComputedFilters();
        expect(filters).toBe(uxComputedFilters);
        expect(filters.projects).toBe(reportingProjects);
    });

    it("gets the alert summary of the whole org", async () => {
        const summary = await client.getAlertSummaryForOrg();
        expect(summary).toEqual(alertSummary);
        expect(summary.totals.matchingRepositoryCount).toBe(5);
    });

    it("gets the alert summary of the requested projects", async () => {
        const summary = await client.getAlertSummaryForOrg({ projects: [second.name] } as FilterCriteria);
        expect(summary.orgId).toBe(ORG_ID);
        expect(summary.projects).toEqual([projectAlertSummaries[1]]);
        expect(summary.totals.matchingRepositoryCount).toBe(2);
        expect(summary.totals.openAlerts).toBe(
            projectAlertSummaries[1].repos.reduce((sum, r) => sum + r.openAlerts, 0)
        );
    });

    it("gets the whole alert summary for an empty project filter", async () => {
        const summary = await client.getAlertSummaryForOrg({ projects: [] as string[] } as FilterCriteria);
        expect(summary.projects.length).toBe(2);
    });

    it("lists every combined alert", async () => {
        const list = await client.getCombinedAlertsForOrg();
        expect([...list]).toEqual(dashboardAlerts);
        expect(list.continuationToken).toBeNull();
        expect(new Set(list.map(a => a.alertId)).size).toBe(5);
    });

    it("limits the combined alerts with top", async () => {
        const list = await client.getCombinedAlertsForOrg(undefined, 2, "token");
        expect([...list]).toEqual(dashboardAlerts.slice(0, 2));
        expect(list.continuationToken).toBeNull();
    });

    it("filters the combined alerts by type", async () => {
        const list = await client.getCombinedAlertsForOrg(combined({ alertType: AlertType.Dependency }));
        expect([...list]).toEqual([dashboardAlerts[0], dashboardAlerts[4]]);
    });

    it("filters the combined alerts by state", async () => {
        const open = await client.getCombinedAlertsForOrg(combined({ state: DashboardAlertState.Open }));
        expect([...open]).toEqual(dashboardAlerts.slice(0, 3));
        const closed = await client.getCombinedAlertsForOrg(combined({ state: DashboardAlertState.Closed }));
        expect([...closed]).toEqual(dashboardAlerts.slice(3));
    });

    it("filters the combined alerts by severity and project", async () => {
        const critical = await client.getCombinedAlertsForOrg(combined({ severities: [Severity.Critical] }));
        expect([...critical]).toEqual(dashboardAlerts.slice(0, 2));
        const other = await client.getCombinedAlertsForOrg(combined({ severities: [], projects: [second.name] }));
        expect([...other]).toEqual(dashboardAlerts.slice(3));
        const none = await client.getCombinedAlertsForOrg(
            combined({ severities: [Severity.Critical], projects: [second.name] })
        );
        expect(none.length).toBe(0);
    });

    it("gets the enablement summary of the whole org", async () => {
        const summary = await client.getEnablementSummaryForOrg();
        expect(summary).toEqual(enablementSummary);
        expect(summary.totals.secrets.repositoryCount).toBe(2);
        expect(summary.totals.noTooling.repositoryCount).toBe(3);
    });

    it("gets the enablement summary of the requested projects", async () => {
        const summary = await client.getEnablementSummaryForOrg({ projects: [first.name] } as EnablementFilterCriteria);
        expect(summary.projects).toEqual([projectEnablementSummaries[0]]);
        expect(summary.totals.matchingRepositoryCount).toBe(3);
        expect(summary.totals.code.repositoryCount).toBe(2);
        expect(summary.totals.noTooling.repositoryCount).toBe(1);
    });
});

describe("advanced security reporting fixtures", () => {
    it("makes a project with the given or a fabricated id", () => {
        expect(makeProject("p-1").id).toBe("p-1");
        expect(typeof makeProject().id).toBe("string");
    });

    it("makes filter criteria without a fixed date range", () => {
        const criteria = makeFilterCriteria();
        expect(criteria.state).toBe(DashboardAlertState.Open);
        expect(criteria.fixedDateStart).toBeUndefined();
        expect(criteria.fixedDateEnd).toBeUndefined();
        expect(criteria.introducedDateStart).toBeInstanceOf(Date);
        expect(criteria.toolNames).toEqual([CODE_TOOL]);
    });

    it("makes an advanced filter", () => {
        const filter = makeAdvancedFilter();
        expect(filter.url.endsWith(`/_apis/reporting/filters/${filter.id}`)).toBe(true);
        expect(filter._links).toEqual({});
    });

    it("makes rule info for a tool", () => {
        expect(makeCodeScanningRuleInfo().toolName).toBe(CODE_TOOL);
        expect(makeCodeScanningRuleInfo("Custom").toolName).toBe("Custom");
    });

    it("makes a dashboard alert without a secret unless it is a secret alert", () => {
        const code = makeDashboardAlert();
        expect(code.alertType).toBe(AlertType.Code);
        expect(code.truncatedSecret).toBeUndefined();
        expect(code.validityStatus).toBe(AlertValidityStatus.None);
        expect(code.locations[0].alertId).toBe(code.alertId);
        expect(code.repositoryName).toBe(repositories[0].name);
        const project = makeProject();
        const secret = makeDashboardAlert(AlertType.Secret, project);
        expect(secret.truncatedSecret).toBe(SECRET_PLACEHOLDER);
        expect(secret.validityStatus).toBe(AlertValidityStatus.Active);
        expect(secret.projectName).toBe(project.name);
        expect(makeDashboardAlert(AlertType.Dependency).state).toBe(State.Active);
    });

    it("makes a repository alert summary whose counts add up", () => {
        const summary = makeRepoAlertSummary("r-1");
        const { critical, high, low, medium, note } = summary.alertsBySeverity;
        expect(summary.repoId).toBe("r-1");
        expect(summary.openAlerts).toBe(critical + high + low + medium + note);
        expect(summary.totalAlerts).toBe(
            summary.openAlerts + summary.alertsByState.dismissed + summary.alertsByState.fixed
        );
        expect(typeof makeRepoAlertSummary().repoId).toBe("string");
    });

    it("makes a repository enablement summary", () => {
        const enabled = makeRepoEnablementSummary();
        expect(enabled.advSecIsEnabled).toBe(true);
        expect(Object.keys(enabled.scanTypeMetadata)).toEqual(
            [AlertType.Dependency, AlertType.Secret, AlertType.Code].map(String)
        );
        expect(enabled.scanTypeSummary[AlertType.Secret].pushProtection.enabled).toBe(true);
        expect(enabled.scanTypeMetadata[AlertType.Code].lastScanDate).toBeInstanceOf(Date);
        const disabled = makeRepoEnablementSummary("r-2", false);
        expect(disabled.repoId).toBe("r-2");
        expect(disabled.secretProtectionEnabled).toBe(false);
        expect(disabled.scanTypeMetadata).toEqual({});
        expect(disabled.scanTypeSummary[AlertType.Code].alerts.enabled).toBe(false);
        expect(makeRepoEnablementSummary("r-3").codeSecurityEnabled).toBe(true);
    });

    it("makes org summaries with totals over the given projects", () => {
        expect(makeOrgAlertSummary([]).totals).toEqual({
            dismissedAlerts: 0,
            fixedAlerts: 0,
            matchingRepositoryCount: 0,
            newAlerts: 0,
            openAlerts: 0,
            totalRepositoryCount: 0
        });
        const repos = projectAlertSummaries.flatMap(p => p.repos);
        expect(alertSummary.totals.newAlerts).toBe(repos.reduce((sum, r) => sum + r.alertsByState.new, 0));
        expect(alertSummary.totals.fixedAlerts).toBe(repos.reduce((sum, r) => sum + r.alertsByState.fixed, 0));
        expect(alertSummary.totals.dismissedAlerts).toBe(repos.reduce((sum, r) => sum + r.alertsByState.dismissed, 0));
        expect(makeOrgEnablementSummary([]).totals.totalRepositoryCount).toBe(0);
    });

    it("resolves repository names and falls back to the id", () => {
        expect(repositoryName(repositories[1].id)).toBe(repositories[1].name);
        expect(repositoryName("missing-repository")).toBe("missing-repository");
    });

    it("seeds projects consistent with the Git enablement fixtures", () => {
        expect(reportingProjects.map(p => p.id)).toEqual(advSecProjectIds);
        expect(new Set(reportingProjects.map(p => p.name)).size).toBe(2);
        expect(projectsAndRepos.map(info => info.repositoryName)).toEqual(repositories.map(r => r.name));
        expect(projectEnablementSummaries.flatMap(p => p.repos).map(r => r.advSecIsEnabled)).toEqual(
            enablementStatuses.map(s => s.enabled)
        );
        expect(projectAlertSummaries.flatMap(p => p.repos).map(r => r.repoName)).toEqual(repositories.map(r => r.name));
    });

    it("seeds distinct filters and alerts with placeholder secrets only", () => {
        expect(new Set(advancedFilters.map(f => f.name)).size).toBe(3);
        expect(new Set(advancedFilters.map(f => f.id)).size).toBe(3);
        expect(dashboardAlerts.map(a => a.truncatedSecret)).toEqual([
            undefined,
            SECRET_PLACEHOLDER,
            undefined,
            undefined,
            undefined
        ]);
    });
});
