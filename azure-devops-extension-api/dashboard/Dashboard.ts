import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    DashboardRestClient,
    Dashboard,
    DashboardGroup,
    Widget
} from "azure-devops-extension-api/Dashboard";
import { TeamContext } from "azure-devops-extension-api/Core";
import {
    dashboards,
    dashboardGroup,
    makeDashboard,
    makeWidget,
    widgets
} from "./Data";

/**
 * Mocked DashboardRestClient — dashboards and widgets.
 */
export class MockDashboardRestClient extends RestClientBase {
    public TYPE = DashboardRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getDashboardsByProject(_teamContext: TeamContext): Promise<Dashboard[]> {
        return Promise.resolve(dashboards);
    }

    getDashboard(_teamContext: TeamContext, dashboardId: string): Promise<Dashboard> {
        const found = dashboards.find(d => d.id === dashboardId);
        return Promise.resolve(found ?? { ...makeDashboard(), id: dashboardId });
    }

    createDashboard(dashboard: Dashboard, _teamContext: TeamContext): Promise<Dashboard> {
        return Promise.resolve({ ...makeDashboard(), ...dashboard });
    }

    replaceDashboard(
        dashboard: Dashboard,
        _teamContext: TeamContext,
        dashboardId: string
    ): Promise<Dashboard> {
        return Promise.resolve({ ...makeDashboard(), ...dashboard, id: dashboardId });
    }

    replaceDashboards(group: any, _teamContext: TeamContext): Promise<any> {
        return Promise.resolve({ ...dashboardGroup, ...group });
    }

    deleteDashboard(_teamContext: TeamContext, _dashboardId: string): Promise<void> {
        return Promise.resolve();
    }

    // Widgets
    getWidget(
        _teamContext: TeamContext,
        _dashboardId: string,
        widgetId: string
    ): Promise<Widget> {
        const found = widgets.find(w => w.id === widgetId);
        return Promise.resolve(found ?? { ...makeWidget(), id: widgetId });
    }

    createWidget(
        widget: Widget,
        _teamContext: TeamContext,
        _dashboardId: string
    ): Promise<Widget> {
        return Promise.resolve({ ...makeWidget(), ...widget });
    }

    updateWidget(
        widget: Widget,
        _teamContext: TeamContext,
        _dashboardId: string,
        widgetId: string
    ): Promise<Widget> {
        return Promise.resolve({ ...makeWidget(), ...widget, id: widgetId });
    }

    replaceWidget(
        widget: Widget,
        _teamContext: TeamContext,
        _dashboardId: string,
        widgetId: string
    ): Promise<Widget> {
        return Promise.resolve({ ...makeWidget(), ...widget, id: widgetId });
    }

    deleteWidget(
        _teamContext: TeamContext,
        dashboardId: string,
        _widgetId: string
    ): Promise<Dashboard> {
        const dash = dashboards.find(d => d.id === dashboardId) ?? makeDashboard();
        return Promise.resolve(dash);
    }
}
