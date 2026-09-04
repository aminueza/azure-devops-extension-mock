import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import { fake } from "../common/fixtures";
import {
    DashboardRestClient,
    Dashboard,
    DashboardGroup,
    Widget,
    WidgetMetadataResponse,
    WidgetScope,
    WidgetTypesResponse
} from "azure-devops-extension-api/Dashboard";
import { TeamContext } from "azure-devops-extension-api/Core";
import {
    dashboards,
    dashboardGroup,
    makeDashboard,
    makeWidget,
    makeWidgetMetadata,
    widgets,
    widgetTypes
} from "./Data";

export class MockDashboardRestClient extends RestClientBase {
    public TYPE = DashboardRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createDashboard(dashboard: Dashboard, _teamContext: TeamContext): Promise<Dashboard> {
        return Promise.resolve({ ...makeDashboard(), ...dashboard });
    }

    deleteDashboard(_teamContext: TeamContext, _dashboardId: string): Promise<void> {
        return Promise.resolve();
    }

    getDashboard(_teamContext: TeamContext, dashboardId: string): Promise<Dashboard> {
        const found = dashboards.find(d => d.id === dashboardId);
        return Promise.resolve(found ?? { ...makeDashboard(), id: dashboardId });
    }

    getDashboardsByProject(_teamContext: TeamContext): Promise<Dashboard[]> {
        return Promise.resolve(dashboards);
    }

    replaceDashboard(
        dashboard: Dashboard,
        _teamContext: TeamContext,
        dashboardId: string
    ): Promise<Dashboard> {
        return Promise.resolve({ ...makeDashboard(), ...dashboard, id: dashboardId });
    }

    replaceDashboards(group: DashboardGroup, _teamContext: TeamContext): Promise<DashboardGroup> {
        return Promise.resolve({ ...dashboardGroup, ...group });
    }

    createWidget(
        widget: Widget,
        _teamContext: TeamContext,
        _dashboardId: string
    ): Promise<Widget> {
        return Promise.resolve({ ...makeWidget(), ...widget });
    }

    deleteWidget(
        _teamContext: TeamContext,
        dashboardId: string,
        _widgetId: string
    ): Promise<Dashboard> {
        const found = dashboards.find(d => d.id === dashboardId);
        return Promise.resolve(found ?? { ...makeDashboard(), id: dashboardId });
    }

    getWidget(
        _teamContext: TeamContext,
        _dashboardId: string,
        widgetId: string
    ): Promise<Widget> {
        const found = widgets.find(w => w.id === widgetId);
        return Promise.resolve(found ?? { ...makeWidget(), id: widgetId });
    }

    replaceWidget(
        widget: Widget,
        _teamContext: TeamContext,
        _dashboardId: string,
        widgetId: string
    ): Promise<Widget> {
        return Promise.resolve({ ...makeWidget(), ...widget, id: widgetId });
    }

    updateWidget(
        widget: Widget,
        _teamContext: TeamContext,
        _dashboardId: string,
        widgetId: string
    ): Promise<Widget> {
        return Promise.resolve({ ...makeWidget(), ...widget, id: widgetId });
    }

    getWidgetMetadata(contributionId: string, _project?: string): Promise<WidgetMetadataResponse> {
        const found = widgetTypes.find(w => w.contributionId === contributionId);
        return Promise.resolve({
            uri: fake.internet.url(),
            widgetMetadata: found ?? makeWidgetMetadata(contributionId)
        });
    }

    getWidgetTypes(scope: WidgetScope, _project?: string): Promise<WidgetTypesResponse> {
        return Promise.resolve({
            _links: {},
            uri: fake.internet.url(),
            widgetTypes: widgetTypes.filter(w => w.supportedScopes.includes(scope))
        });
    }
}
