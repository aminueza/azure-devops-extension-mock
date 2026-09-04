import { TeamContext } from "azure-devops-extension-api/Core";
import {
    BacklogType,
    BoardBadgeColumnOptions,
    BoardColumnType,
    BugsBehavior,
    PlanType,
    TimeFrame,
    WorkRestClient
} from "azure-devops-extension-api/Work";

import { getClient } from "../azure-devops-extension-api";
import {
    backlogs,
    boardCharts,
    boards,
    columnSuggestedValues,
    iterations,
    makeBacklog,
    makeBoard,
    makeBoardBadge,
    makeBoardChart,
    makeBoardChartReference,
    makeBoardColumn,
    makeBoardReference,
    makeBoardRow,
    makeBoardSuggestedValue,
    makeCategoryConfiguration,
    makeFieldReference,
    makeFilterClause,
    makeIteration,
    makeReorderResult,
    makeTaskboardColumn,
    makeWorkItemFieldReference,
    makeWorkItemTypeReference,
    plans,
    rowSuggestedValues
} from "../azure-devops-extension-api/boards/Data";

const teamContext: TeamContext = {
    project: "proj",
    projectId: "11111111-1111-4111-8111-111111111111",
    team: "team",
    teamId: "22222222-2222-4222-8222-222222222222"
};

describe("WorkRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(WorkRestClient);

    it("exposes the real client type", () => {
        expect((client as any).TYPE).toBe(WorkRestClient);
    });

    it("updates an automation rule", async () => {
        await expect(
            client.updateAutomationRule({ backlogLevelName: "Stories", rulesStates: { rule: true } }, teamContext)
        ).resolves.toBeUndefined();
    });

    it("gets backlog configuration", async () => {
        const config = await client.getBacklogConfigurations(teamContext);
        expect(config.requirementBacklog.type).toBe(BacklogType.Requirement);
        expect(config.taskBacklog.type).toBe(BacklogType.Task);
        expect(config.portfolioBacklogs.length).toBe(2);
        expect(config.bugsBehavior).toBe(BugsBehavior.AsRequirements);
        expect(config.workItemTypeMappedStates.length).toBeGreaterThan(0);
    });

    it("gets backlog level work items", async () => {
        const result = await client.getBacklogLevelWorkItems(teamContext, "Microsoft.RequirementCategory");
        expect(result.workItems.length).toBe(3);
        expect(result.workItems[0].source).toHaveProperty("id");
        expect(result.workItems[0].target).toHaveProperty("url");
    });

    it("returns a known backlog by id", async () => {
        const backlog = await client.getBacklog(teamContext, backlogs[0].id);
        expect(backlog).toBe(backlogs[0]);
    });

    it("returns a known backlog by name", async () => {
        const backlog = await client.getBacklog(teamContext, backlogs[2].name);
        expect(backlog).toBe(backlogs[2]);
    });

    it("fabricates a backlog for an unknown id", async () => {
        const backlog = await client.getBacklog(teamContext, "Custom.Category");
        expect(backlog.id).toBe("Custom.Category");
        expect(backlog).toHaveProperty("name");
        expect(backlog.columnFields.length).toBe(3);
    });

    it("lists backlogs", async () => {
        const result = await client.getBacklogs(teamContext);
        expect(result).toBe(backlogs);
        expect(result.map(b => b.name)).toEqual(["Epics", "Features", "Stories", "Tasks"]);
    });

    it("gets a board badge", async () => {
        const badge = await client.getBoardBadge(teamContext, "board-1", BoardBadgeColumnOptions.CustomColumns, ["Active"]);
        expect(badge.boardId).toBe("board-1");
        expect(badge.imageUrl).toMatch(/\.svg$/);
    });

    it("gets board badge data", async () => {
        const svg = await client.getBoardBadgeData(teamContext, "board-1");
        expect(svg).toContain("<svg");
        expect(svg).toContain("board-1");
    });

    it("gets column suggested values", async () => {
        const values = await client.getColumnSuggestedValues("proj");
        expect(values).toBe(columnSuggestedValues);
        expect(values.map(v => v.name)).toContain("Active");
    });

    it("gets board mapping parent items", async () => {
        const maps = await client.getBoardMappingParentItems(teamContext, "Microsoft.RequirementCategory", [1, 2, 3]);
        expect(maps.length).toBe(1);
        expect(maps[0].childWorkItemIds).toEqual([1, 2, 3]);
        expect(maps[0]).toHaveProperty("title");
        expect(maps[0]).toHaveProperty("teamProject");
    });

    it("gets row suggested values", async () => {
        const values = await client.getRowSuggestedValues();
        expect(values).toBe(rowSuggestedValues);
        expect(values.map(v => v.name)).toEqual(["Expedite", "Blocked", "Standard"]);
    });

    it("returns a known board by id", async () => {
        const board = await client.getBoard(teamContext, boards[1].id);
        expect(board).toBe(boards[1]);
    });

    it("returns a known board by name", async () => {
        const board = await client.getBoard(teamContext, "Epics");
        expect(board).toBe(boards[2]);
    });

    it("fabricates a board for an unknown id", async () => {
        const board = await client.getBoard(teamContext, "missing-board");
        expect(board.id).toBe("missing-board");
        expect(board.columns.length).toBe(3);
        expect(board.rows.length).toBe(2);
        expect(board.fields.columnField.referenceName).toBe("System.BoardColumn");
    });

    it("lists boards as references", async () => {
        const refs = await client.getBoards(teamContext);
        expect(refs.length).toBe(boards.length);
        expect(refs[0]).toEqual({ id: boards[0].id, name: boards[0].name, url: boards[0].url });
        expect(refs[0]).not.toHaveProperty("columns");
    });

    it("sets board options", async () => {
        const options = { showEmptyFields: "true" };
        await expect(client.setBoardOptions(options, teamContext, "Stories")).resolves.toBe(options);
    });

    it("gets board user settings", async () => {
        const settings = await client.getBoardUserSettings(teamContext, "Stories");
        expect(typeof settings.autoRefreshState).toBe("boolean");
    });

    it("updates board user settings", async () => {
        const enabled = await client.updateBoardUserSettings({ autoRefreshState: "true" }, teamContext, "Stories");
        expect(enabled.autoRefreshState).toBe(true);
        const disabled = await client.updateBoardUserSettings({ autoRefreshState: "false" }, teamContext, "Stories");
        expect(disabled.autoRefreshState).toBe(false);
    });

    it("gets capacities with totals", async () => {
        const capacity = await client.getCapacitiesWithIdentityRefAndTotals(teamContext, "iter-1");
        expect(capacity.teamMembers.length).toBe(3);
        expect(capacity.teamMembers[0].teamMember).toHaveProperty("displayName");
        expect(capacity.teamMembers[0].activities.length).toBe(1);
        expect(typeof capacity.totalCapacityPerDay).toBe("number");
    });

    it("gets a team member's capacity", async () => {
        const capacity = await client.getCapacityWithIdentityRef(teamContext, "iter-1", "member-1");
        expect(capacity.teamMember.id).toBe("member-1");
        expect(capacity.daysOff.length).toBe(1);
    });

    it("replaces capacities", async () => {
        const capacities = [{ activities: [], daysOff: [] } as any];
        await expect(client.replaceCapacitiesWithIdentityRef(capacities, teamContext, "iter-1")).resolves.toBe(capacities);
    });

    it("updates a team member's capacity", async () => {
        const patch = { activities: [{ name: "Testing", capacityPerDay: 4 }], daysOff: [] };
        const capacity = await client.updateCapacityWithIdentityRef(patch, teamContext, "iter-1", "member-2");
        expect(capacity.teamMember.id).toBe("member-2");
        expect(capacity.activities).toBe(patch.activities);
        expect(capacity.daysOff).toEqual([]);
        expect(capacity).toHaveProperty("url");
    });

    it("gets board card rule settings", async () => {
        const settings = await client.getBoardCardRuleSettings(teamContext, "Stories");
        expect(settings.rules.fill.length).toBe(1);
        expect(settings.rules.fill[0].clauses[0].index).toBe(0);
        expect(settings).toHaveProperty("url");
    });

    it("updates board card rule settings", async () => {
        const settings = { _links: {}, rules: {}, url: "u" };
        await expect(client.updateBoardCardRuleSettings(settings, teamContext, "Stories")).resolves.toBe(settings);
    });

    it("updates taskboard card rule settings", async () => {
        await expect(
            client.updateTaskboardCardRuleSettings({ _links: {}, rules: {}, url: "u" }, teamContext)
        ).resolves.toBeUndefined();
    });

    it("gets board card settings", async () => {
        const settings = await client.getBoardCardSettings(teamContext, "Stories");
        expect(Object.keys(settings.cards)).toEqual(["User Story", "Bug"]);
    });

    it("updates board card settings", async () => {
        const settings = { cards: { Task: [] } };
        await expect(client.updateBoardCardSettings(settings, teamContext, "Stories")).resolves.toBe(settings);
    });

    it("updates taskboard card settings", async () => {
        await expect(client.updateTaskboardCardSettings({ cards: {} }, teamContext)).resolves.toBeUndefined();
    });

    it("gets a board chart by name", async () => {
        const chart = await client.getBoardChart(teamContext, "Stories", "leadTime");
        expect(chart.name).toBe("leadTime");
        expect(chart).toHaveProperty("settings");
        expect(chart).toHaveProperty("url");
    });

    it("lists board charts", async () => {
        const charts = await client.getBoardCharts(teamContext, "Stories");
        expect(charts).toBe(boardCharts);
        expect(charts.map(c => c.name)).toEqual(["cumulativeFlow", "leadTime", "cycleTime"]);
    });

    it("updates a board chart forcing the requested name", async () => {
        const chart = await client.updateBoardChart(
            { name: "ignored", settings: { chartType: "bar" } } as any,
            teamContext,
            "Stories",
            "cycleTime"
        );
        expect(chart.name).toBe("cycleTime");
        expect(chart.settings).toEqual({ chartType: "bar" });
        expect(chart).toHaveProperty("url");
    });

    it("gets columns of a known board", async () => {
        const columns = await client.getBoardColumns(teamContext, boards[0].id);
        expect(columns).toBe(boards[0].columns);
        expect(columns.map(c => c.name)).toEqual(["New", "Active", "Closed"]);
    });

    it("gets columns of an unknown board", async () => {
        const columns = await client.getBoardColumns(teamContext, "missing-board");
        expect(columns.length).toBe(3);
        expect(columns[0]).toHaveProperty("stateMappings");
    });

    it("updates board columns", async () => {
        const columns = [makeBoardColumn("Doing")];
        await expect(client.updateBoardColumns(columns, teamContext, "Stories")).resolves.toBe(columns);
    });

    it("gets delivery timeline data with explicit revision and dates", async () => {
        const startDate = new Date("2026-01-01");
        const endDate = new Date("2026-03-01");
        const data = await client.getDeliveryTimelineData("proj", "plan-1", 7, startDate, endDate);
        expect(data.id).toBe("plan-1");
        expect(data.revision).toBe(7);
        expect(data.startDate).toBe(startDate);
        expect(data.endDate).toBe(endDate);
        expect(data.teams.length).toBe(1);
        expect(data.teams[0].iterations.length).toBe(1);
        expect(data.teams[0].workItemTypeColors.length).toBeGreaterThan(0);
    });

    it("gets delivery timeline data with fixture defaults", async () => {
        const data = await client.getDeliveryTimelineData("proj", "plan-2");
        expect(data.id).toBe("plan-2");
        expect(typeof data.revision).toBe("number");
        expect(data.startDate).toBeInstanceOf(Date);
        expect(data.endDate).toBeInstanceOf(Date);
    });

    it("gets total iteration capacities", async () => {
        const capacity = await client.getTotalIterationCapacities("proj", "iter-1");
        expect(capacity.teams.length).toBe(2);
        expect(capacity.teams[0]).toHaveProperty("teamId");
        expect(typeof capacity.totalIterationCapacityPerDay).toBe("number");
    });

    it("deletes a team iteration", async () => {
        await expect(client.deleteTeamIteration(teamContext, "iter-1")).resolves.toBeUndefined();
    });

    it("returns a known iteration", async () => {
        const iteration = await client.getTeamIteration(teamContext, iterations[1].id);
        expect(iteration).toBe(iterations[1]);
    });

    it("fabricates an iteration for an unknown id", async () => {
        const iteration = await client.getTeamIteration(teamContext, "missing-iteration");
        expect(iteration.id).toBe("missing-iteration");
        expect(iteration.attributes.timeFrame).toBe(TimeFrame.Current);
        expect(iteration.path).toContain(iteration.name);
    });

    it("lists every iteration when no timeframe is given", async () => {
        const result = await client.getTeamIterations(teamContext);
        expect(result).toBe(iterations);
        expect(result.map(i => i.attributes.timeFrame)).toEqual([TimeFrame.Past, TimeFrame.Current, TimeFrame.Future]);
    });

    it("filters to the current iteration when a timeframe is given", async () => {
        const result = await client.getTeamIterations(teamContext, "current");
        expect(result).toEqual([iterations[1]]);
    });

    it("posts a team iteration merging the caller's fields", async () => {
        const iteration = await client.postTeamIteration({ id: "iter-9", name: "Sprint 9" } as any, teamContext);
        expect(iteration.id).toBe("iter-9");
        expect(iteration.name).toBe("Sprint 9");
        expect(iteration).toHaveProperty("attributes");
        expect(iteration).toHaveProperty("url");
    });

    it("creates a plan merging the caller's fields", async () => {
        const plan = await client.createPlan(
            { name: "Roadmap", description: "Q3", properties: {}, type: PlanType.DeliveryTimelineView },
            "proj"
        );
        expect(plan.name).toBe("Roadmap");
        expect(plan.description).toBe("Q3");
        expect(plan.properties).toEqual({});
        expect(plan).toHaveProperty("id");
        expect(plan.createdByIdentity).toHaveProperty("displayName");
    });

    it("deletes a plan", async () => {
        await expect(client.deletePlan("proj", "plan-1")).resolves.toBeUndefined();
    });

    it("returns a known plan", async () => {
        const plan = await client.getPlan("proj", plans[2].id);
        expect(plan).toBe(plans[2]);
    });

    it("fabricates a plan for an unknown id", async () => {
        const plan = await client.getPlan("proj", "missing-plan");
        expect(plan.id).toBe("missing-plan");
        expect(plan.type).toBe(PlanType.DeliveryTimelineView);
    });

    it("lists plans", async () => {
        const result = await client.getPlans("proj");
        expect(result).toBe(plans);
        expect(result.length).toBe(3);
    });

    it("updates a plan forcing the requested id", async () => {
        const plan = await client.updatePlan(
            { name: "Renamed", description: "d", properties: { a: 1 }, revision: 4, type: PlanType.DeliveryTimelineView },
            "proj",
            "plan-42"
        );
        expect(plan.id).toBe("plan-42");
        expect(plan.name).toBe("Renamed");
        expect(plan.revision).toBe(4);
        expect(plan).toHaveProperty("url");
    });

    it("gets process configuration", async () => {
        const config = await client.getProcessConfiguration("proj");
        expect(config.bugWorkItems.referenceName).toBe("Microsoft.BugCategory");
        expect(config.portfolioBacklogs.map(b => b.name)).toEqual(["Epic", "Feature"]);
        expect(config.typeFields.Order.referenceName).toBe("System.StackRank");
    });

    it("gets rows of a known board", async () => {
        const rows = await client.getBoardRows(teamContext, "Features");
        expect(rows).toBe(boards[1].rows);
        expect(rows.map(r => r.name)).toEqual(["", "Expedite"]);
    });

    it("gets rows of an unknown board", async () => {
        const rows = await client.getBoardRows(teamContext, "missing-board");
        expect(rows.length).toBe(2);
        expect(rows[0]).toHaveProperty("color");
    });

    it("updates board rows", async () => {
        const rows = [makeBoardRow("Blocked")];
        await expect(client.updateBoardRows(rows, teamContext, "Stories")).resolves.toBe(rows);
    });

    it("gets taskboard columns", async () => {
        const columns = await client.getColumns(teamContext);
        expect(columns.columns.map(c => c.name)).toEqual(["To Do", "In Progress", "Done"]);
        expect(columns.isValid).toBe(true);
        expect(columns.validationMesssage).toBe("");
    });

    it("updates taskboard columns", async () => {
        const update = [{ id: "c1", name: "Doing", order: 1, mappings: [{ state: "Active", workItemType: "Task" }] }];
        const columns = await client.updateColumns(update, teamContext);
        expect(columns.columns).toBe(update);
        expect(columns.isCustomized).toBe(true);
        expect(columns.isValid).toBe(true);
    });

    it("gets work item columns", async () => {
        const columns = await client.getWorkItemColumns(teamContext, "iter-1");
        expect(columns.length).toBe(3);
        expect(columns[0]).toHaveProperty("columnId");
        expect(typeof columns[0].workItemId).toBe("number");
    });

    it("updates a work item column", async () => {
        await expect(client.updateWorkItemColumn({ newColumn: "Done" }, teamContext, "iter-1", 42)).resolves.toBeUndefined();
    });

    it("gets team days off", async () => {
        const daysOff = await client.getTeamDaysOff(teamContext, "iter-1");
        expect(daysOff.daysOff.length).toBe(1);
        expect(daysOff.daysOff[0].start).toBeInstanceOf(Date);
        expect(daysOff).toHaveProperty("url");
    });

    it("updates team days off", async () => {
        const patch = { daysOff: [{ start: new Date("2026-05-01"), end: new Date("2026-05-02") }] };
        const daysOff = await client.updateTeamDaysOff(patch, teamContext, "iter-1");
        expect(daysOff.daysOff).toBe(patch.daysOff);
        expect(daysOff).toHaveProperty("url");
    });

    it("gets team field values", async () => {
        const values = await client.getTeamFieldValues(teamContext);
        expect(values.field.referenceName).toBe("System.AreaPath");
        expect(values.values.length).toBe(2);
        expect(values.defaultValue).toBe(values.values[0].value);
    });

    it("updates team field values", async () => {
        const patch = { defaultValue: "Area\\Sub", values: [{ value: "Area\\Sub", includeChildren: true }] };
        const values = await client.updateTeamFieldValues(patch, teamContext);
        expect(values.defaultValue).toBe("Area\\Sub");
        expect(values.values).toBe(patch.values);
        expect(values.field).toHaveProperty("referenceName");
    });

    it("gets team settings", async () => {
        const settings = await client.getTeamSettings(teamContext);
        expect(settings.workingDays).toEqual([1, 2, 3, 4, 5]);
        expect(settings.defaultIterationMacro).toBe("@CurrentIteration");
        expect(settings.backlogIteration).toHaveProperty("path");
    });

    it("updates team settings mapping iteration ids onto the fixtures", async () => {
        const settings = await client.updateTeamSettings(
            {
                backlogIteration: "iter-root",
                defaultIteration: "iter-current",
                defaultIterationMacro: "",
                bugsBehavior: BugsBehavior.AsTasks,
                backlogVisibilities: { "Microsoft.EpicCategory": false },
                workingDays: [1, 2, 3] as any
            },
            teamContext
        );
        expect(settings.backlogIteration.id).toBe("iter-root");
        expect(settings.backlogIteration).toHaveProperty("attributes");
        expect(settings.defaultIteration.id).toBe("iter-current");
        expect(settings.bugsBehavior).toBe(BugsBehavior.AsTasks);
        expect(settings.workingDays).toEqual([1, 2, 3]);
        expect(settings.backlogVisibilities).toEqual({ "Microsoft.EpicCategory": false });
    });

    it("gets iteration work items", async () => {
        const result = await client.getIterationWorkItems(teamContext, "iter-1");
        expect(result.workItemRelations.length).toBe(3);
        expect(result).toHaveProperty("url");
    });

    it("reorders backlog work items", async () => {
        const results = await client.reorderBacklogWorkItems(
            { ids: [5, 6, 7], iterationPath: "", nextId: 0, parentId: 0, previousId: 0 },
            teamContext
        );
        expect(results.map(r => r.id)).toEqual([5, 6, 7]);
        expect(typeof results[0].order).toBe("number");
    });

    it("reorders iteration work items", async () => {
        const results = await client.reorderIterationWorkItems(
            { ids: [8, 9], iterationPath: "Proj\\Sprint 1", nextId: 0, parentId: 0, previousId: 0 },
            teamContext,
            "iter-1"
        );
        expect(results.map(r => r.id)).toEqual([8, 9]);
    });
});

describe("boards fixtures", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("defaults a field reference name", () => {
        expect(makeFieldReference().referenceName).toMatch(/^System\./);
        expect(makeFieldReference("Custom.Field").referenceName).toBe("Custom.Field");
    });

    it("defaults a work item field reference name", () => {
        const ref = makeWorkItemFieldReference();
        expect(ref.referenceName).toBe(`System.${ref.name}`);
        expect(makeWorkItemFieldReference("Title").name).toBe("Title");
    });

    it("defaults a work item type reference name", () => {
        expect(["Epic", "Feature", "User Story", "Task", "Bug"]).toContain(makeWorkItemTypeReference().name);
        expect(makeWorkItemTypeReference("Issue").name).toBe("Issue");
    });

    it("defaults a backlog name and type", () => {
        const backlog = makeBacklog();
        expect(["Epics", "Features", "Stories", "Tasks"]).toContain(backlog.name);
        expect(backlog.type).toBe(BacklogType.Requirement);
        expect(backlog.id).toBe(`Microsoft.${backlog.name}Category`);
        expect(makeBacklog("Tasks", BacklogType.Task).type).toBe(BacklogType.Task);
    });

    it("defaults a board column name", () => {
        const column = makeBoardColumn();
        expect(["New", "Active", "Resolved", "Closed"]).toContain(column.name);
        expect(column.stateMappings.Bug).toBe(column.name);
        expect([BoardColumnType.Incoming, BoardColumnType.InProgress, BoardColumnType.Outgoing]).toContain(column.columnType);
    });

    it("defaults a board row name", () => {
        expect(typeof makeBoardRow().name).toBe("string");
        expect(makeBoardRow("Lane").name).toBe("Lane");
    });

    it("defaults a board reference name", () => {
        expect(["Stories", "Features", "Epics"]).toContain(makeBoardReference().name);
    });

    it("defaults a board name", () => {
        const board = makeBoard();
        expect(["Stories", "Features", "Epics"]).toContain(board.name);
        expect(board.canEdit).toBe(true);
        expect(board.allowedMappings.Incoming["User Story"]).toEqual(["New"]);
    });

    it("defaults a badge board id", () => {
        expect(makeBoardBadge().boardId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("defaults a suggested value name", () => {
        expect(typeof makeBoardSuggestedValue().name).toBe("string");
        expect(makeBoardSuggestedValue("Done").name).toBe("Done");
    });

    it("defaults a filter clause index", () => {
        expect(makeFilterClause().index).toBe(0);
        expect(makeFilterClause(3).index).toBe(3);
    });

    it("defaults chart names", () => {
        const names = ["cumulativeFlow", "leadTime", "cycleTime"];
        expect(names).toContain(makeBoardChartReference().name);
        expect(names).toContain(makeBoardChart().name);
        expect(makeBoardChart("burndown").name).toBe("burndown");
    });

    it("defaults an iteration timeframe", () => {
        expect(makeIteration().attributes.timeFrame).toBe(TimeFrame.Current);
        expect(makeIteration(TimeFrame.Past).attributes.timeFrame).toBe(TimeFrame.Past);
    });

    it("defaults a category configuration name", () => {
        const category = makeCategoryConfiguration();
        expect(category.referenceName).toBe(`Microsoft.${category.name}Category`);
    });

    it("defaults a taskboard column name", () => {
        const column = makeTaskboardColumn();
        expect(["To Do", "In Progress", "Done"]).toContain(column.name);
        expect(column.mappings[0].state).toBe(column.name);
    });

    it("defaults a reorder result id", () => {
        expect(typeof makeReorderResult().id).toBe("number");
        expect(makeReorderResult(12).id).toBe(12);
    });

    it("seeds boards with distinct names", () => {
        expect(boards.map(b => b.name)).toEqual(["Stories", "Features", "Epics"]);
        expect(new Set(boards.map(b => b.id)).size).toBe(3);
    });
});
