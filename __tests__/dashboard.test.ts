import { DashboardRestClient, DashboardScope } from "azure-devops-extension-api/Dashboard";
import { getClient, MockDashboardRestClient } from "../azure-devops-extension-api";

describe("DashboardRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(DashboardRestClient) as unknown as MockDashboardRestClient;
    const teamContext = { projectId: "p", teamId: "t" } as any;

    it("is registered under the DashboardRestClient type", () => {
        expect(client.TYPE).toBe(DashboardRestClient);
    });

    it("lists dashboards with widgets", async () => {
        const list = await client.getDashboardsByProject(teamContext);
        expect(list.length).toBeGreaterThan(0);
        expect(list.map(d => d.name)).toEqual(["Overview", "Sprint Health", "Release Pipeline"]);
        for (const dash of list) {
            expect(typeof dash.id).toBe("string");
            expect(dash.widgets.length).toBeGreaterThan(0);
            expect(dash.dashboardScope).toBe(DashboardScope.Project_Team);
        }
    });

    it("gets a known dashboard by id", async () => {
        const [first] = await client.getDashboardsByProject(teamContext);
        const found = await client.getDashboard(teamContext, first.id);
        expect(found).toBe(first);
    });

    it("fabricates a dashboard for an unknown id", async () => {
        const made = await client.getDashboard(teamContext, "missing-dash");
        expect(made.id).toBe("missing-dash");
        expect(made.name).toBe("Overview");
        expect(made.widgets.length).toBeGreaterThan(0);
    });

    it("creates a dashboard merging caller fields", async () => {
        const created = await client.createDashboard({ name: "Custom", description: "mine" } as any, teamContext);
        expect(created.name).toBe("Custom");
        expect(created.description).toBe("mine");
        expect(typeof created.id).toBe("string");
    });

    it("replaces a dashboard keeping the requested id", async () => {
        const replaced = await client.replaceDashboard({ name: "Replaced", id: "ignored" } as any, teamContext, "dash-9");
        expect(replaced.id).toBe("dash-9");
        expect(replaced.name).toBe("Replaced");
    });

    it("replaces dashboard groups merging caller fields", async () => {
        const group = await client.replaceDashboards({ permission: 7 }, teamContext);
        expect(group.permission).toBe(7);
        expect(group.dashboardEntries.length).toBeGreaterThan(0);
        expect(typeof group.url).toBe("string");
    });

    it("deletes a dashboard", async () => {
        await expect(client.deleteDashboard(teamContext, "dash-1")).resolves.toBeUndefined();
    });

    it("gets a known widget by id", async () => {
        const created = await client.getWidget(teamContext, "dash-1", "missing-widget");
        expect(created.id).toBe("missing-widget");
        expect(created.name).toBe("Team Members");
        expect(created.settings).toBe("{}");
        expect(created.lightboxOptions).toEqual({ width: 800, height: 600, resizable: false });
    });

    it("returns the fixture widget when the id matches", async () => {
        const data = await import("../azure-devops-extension-api/dashboard/Data");
        const target = data.widgets[2];
        const found = await client.getWidget(teamContext, "dash-1", target.id);
        expect(found).toBe(target);
    });

    it("creates a widget merging caller fields", async () => {
        const widget = await client.createWidget({ name: "Burndown", settings: "{\"a\":1}" } as any, teamContext, "dash-1");
        expect(widget.name).toBe("Burndown");
        expect(widget.settings).toBe("{\"a\":1}");
        expect(typeof widget.contributionId).toBe("string");
    });

    it("updates a widget keeping the requested id", async () => {
        const widget = await client.updateWidget({ name: "Updated", id: "ignored" } as any, teamContext, "dash-1", "w-1");
        expect(widget.id).toBe("w-1");
        expect(widget.name).toBe("Updated");
    });

    it("replaces a widget keeping the requested id", async () => {
        const widget = await client.replaceWidget({ name: "Replaced" } as any, teamContext, "dash-1", "w-2");
        expect(widget.id).toBe("w-2");
        expect(widget.name).toBe("Replaced");
    });

    it("deletes a widget returning the known dashboard", async () => {
        const [, second] = await client.getDashboardsByProject(teamContext);
        const dash = await client.deleteWidget(teamContext, second.id, "w-1");
        expect(dash).toBe(second);
    });

    it("deletes a widget returning a fresh dashboard when unknown", async () => {
        const dash = await client.deleteWidget(teamContext, "missing-dash", "w-1");
        expect(dash.name).toBe("Overview");
        expect(dash.widgets.length).toBe(3);
    });
});
