import { DashboardRestClient, DashboardScope, WidgetScope } from "azure-devops-extension-api/Dashboard";
import { getClient } from "../azure-devops-extension-api";
import {
    dashboards,
    makeDashboard,
    makeDashboardGroup,
    makeWidget,
    makeWidgetMetadata,
    widgets,
    widgetTypes
} from "../azure-devops-extension-api/dashboard/Data";

describe("DashboardRestClient mock", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(DashboardRestClient);
    const teamContext = { projectId: "p", teamId: "t" } as any;

    it("is registered under the DashboardRestClient type", () => {
        expect((client as any).TYPE).toBe(DashboardRestClient);
    });

    it("lists dashboards with widgets", async () => {
        const list = await client.getDashboardsByProject(teamContext);
        expect(list).toBe(dashboards);
        expect(list.map(d => d.name)).toEqual(["Overview", "Sprint Health", "Release Pipeline"]);
        list.forEach(dash => {
            expect(dash.widgets.length).toBeGreaterThan(0);
            expect(dash.dashboardScope).toBe(DashboardScope.Project_Team);
        });
    });

    it("gets a known dashboard by id and fabricates unknown ones", async () => {
        expect(await client.getDashboard(teamContext, dashboards[0].id)).toBe(dashboards[0]);
        const made = await client.getDashboard(teamContext, "missing-dash");
        expect(made.id).toBe("missing-dash");
        expect(made.name).toBe("Overview");
    });

    it("creates and replaces dashboards", async () => {
        const created = await client.createDashboard({ name: "Custom", description: "mine" } as any, teamContext);
        expect(created).toMatchObject({ name: "Custom", description: "mine" });
        const replaced = await client.replaceDashboard({ name: "Replaced", id: "ignored" } as any, teamContext, "dash-9");
        expect(replaced).toMatchObject({ id: "dash-9", name: "Replaced" });
        await expect(client.deleteDashboard(teamContext, "dash-1")).resolves.toBeUndefined();
    });

    it("replaces dashboard groups merging caller fields", async () => {
        const group = await client.replaceDashboards({ permission: 7 } as any, teamContext);
        expect(group.permission).toBe(7);
        expect(group.dashboardEntries.length).toBeGreaterThan(0);
    });

    it("gets a known widget by id and fabricates unknown ones", async () => {
        expect(await client.getWidget(teamContext, "dash-1", widgets[2].id)).toBe(widgets[2]);
        const made = await client.getWidget(teamContext, "dash-1", "missing-widget");
        expect(made.id).toBe("missing-widget");
        expect(made.name).toBe("Team Members");
    });

    it("creates, updates and replaces widgets", async () => {
        const created = await client.createWidget({ name: "Burndown", settings: "{\"a\":1}" } as any, teamContext, "dash-1");
        expect(created).toMatchObject({ name: "Burndown", settings: "{\"a\":1}" });
        const updated = await client.updateWidget({ name: "Updated", id: "ignored" } as any, teamContext, "dash-1", "w-1");
        expect(updated).toMatchObject({ id: "w-1", name: "Updated" });
        const replaced = await client.replaceWidget({ name: "Replaced" } as any, teamContext, "dash-1", "w-2");
        expect(replaced).toMatchObject({ id: "w-2", name: "Replaced" });
    });

    it("deletes a widget returning the dashboard", async () => {
        expect(await client.deleteWidget(teamContext, dashboards[1].id, "w-1")).toBe(dashboards[1]);
        const made = await client.deleteWidget(teamContext, "missing-dash", "w-1");
        expect(made.id).toBe("missing-dash");
    });

    it("returns widget metadata for known and unknown contributions", async () => {
        const known = await client.getWidgetMetadata(widgetTypes[0].contributionId);
        expect(known.widgetMetadata).toBe(widgetTypes[0]);
        const made = await client.getWidgetMetadata("ms.vss.custom-widget", "proj");
        expect(made.widgetMetadata.contributionId).toBe("ms.vss.custom-widget");
        expect(made.uri).toMatch(/^https:/);
    });

    it("filters widget types by scope", async () => {
        const team = await client.getWidgetTypes(WidgetScope.Project_Team);
        expect(team.widgetTypes.length).toBe(widgetTypes.length);
        const user = await client.getWidgetTypes(WidgetScope.Collection_User, "proj");
        expect(user.widgetTypes.length).toBe(widgetTypes.length - 1);
        user.widgetTypes.forEach(w => expect(w.supportedScopes).toContain(WidgetScope.Collection_User));
    });
});

describe("dashboard data factories", () => {
    it("uses default names and ids", () => {
        expect(makeWidget().name).toBe("Team Members");
        expect(makeWidget("Velocity").name).toBe("Velocity");
        expect(makeDashboard().name).toBe("Overview");
        expect(makeDashboard("Ops").widgets.length).toBe(3);
        expect(makeDashboardGroup().dashboardEntries.length).toBe(2);
        expect(makeWidgetMetadata().contributionId).toMatch(/-widget$/);
        expect(makeWidgetMetadata("x.y").configurationContributionId).toBe("x.y-configuration");
    });
});
