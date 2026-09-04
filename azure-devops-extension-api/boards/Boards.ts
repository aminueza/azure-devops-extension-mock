import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { TeamContext } from "azure-devops-extension-api/Core";
import * as Work from "azure-devops-extension-api/Work";
import { RestClientBase } from "../common/RestClientBase";
import { makeIdentityRef } from "../core/Data";
import {
    backlogs,
    boardCharts,
    boards,
    columnSuggestedValues,
    iterations,
    makeBacklog,
    makeBacklogConfiguration,
    makeBacklogLevelWorkItems,
    makeBoard,
    makeBoardBadge,
    makeBoardCardRuleSettings,
    makeBoardCardSettings,
    makeBoardChart,
    makeBoardUserSettings,
    makeDeliveryViewData,
    makeIteration,
    makeIterationCapacity,
    makeIterationWorkItems,
    makeParentChildWIMap,
    makePlan,
    makeProcessConfiguration,
    makeReorderResult,
    makeTaskboardColumns,
    makeTaskboardWorkItemColumn,
    makeTeamCapacity,
    makeTeamDaysOff,
    makeTeamFieldValues,
    makeTeamMemberCapacity,
    makeTeamSetting,
    plans,
    rowSuggestedValues
} from "./Data";

const findBoard = (id: string): Work.Board | undefined =>
    boards.find(b => b.id === id || b.name === id);

const badgeSvg = (id: string): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20"><title>${id}</title></svg>`;

export class MockBoardsRestClient extends RestClientBase {
    public TYPE = Work.WorkRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    updateAutomationRule(_ruleRequestModel: Work.TeamAutomationRulesSettingsRequestModel, _teamContext: TeamContext): Promise<void> {
        return Promise.resolve();
    }

    getBacklogConfigurations(_teamContext: TeamContext): Promise<Work.BacklogConfiguration> {
        return Promise.resolve(makeBacklogConfiguration());
    }

    getBacklogLevelWorkItems(_teamContext: TeamContext, _backlogId: string): Promise<Work.BacklogLevelWorkItems> {
        return Promise.resolve(makeBacklogLevelWorkItems());
    }

    getBacklog(_teamContext: TeamContext, id: string): Promise<Work.BacklogLevelConfiguration> {
        const found = backlogs.find(b => b.id === id || b.name === id);
        return Promise.resolve(found ?? { ...makeBacklog(), id });
    }

    getBacklogs(_teamContext: TeamContext): Promise<Work.BacklogLevelConfiguration[]> {
        return Promise.resolve(backlogs);
    }

    getBoardBadge(_teamContext: TeamContext, id: string, _columnOptions?: Work.BoardBadgeColumnOptions, _columns?: string[]): Promise<Work.BoardBadge> {
        return Promise.resolve(makeBoardBadge(id));
    }

    getBoardBadgeData(_teamContext: TeamContext, id: string, _columnOptions?: Work.BoardBadgeColumnOptions, _columns?: string[]): Promise<string> {
        return Promise.resolve(badgeSvg(id));
    }

    getColumnSuggestedValues(_project?: string): Promise<Work.BoardSuggestedValue[]> {
        return Promise.resolve(columnSuggestedValues);
    }

    getBoardMappingParentItems(_teamContext: TeamContext, _childBacklogContextCategoryRefName: string, workitemIds: number[]): Promise<Work.ParentChildWIMap[]> {
        return Promise.resolve([{ ...makeParentChildWIMap(), childWorkItemIds: workitemIds }]);
    }

    getRowSuggestedValues(_project?: string): Promise<Work.BoardSuggestedValue[]> {
        return Promise.resolve(rowSuggestedValues);
    }

    getBoard(_teamContext: TeamContext, id: string): Promise<Work.Board> {
        return Promise.resolve(findBoard(id) ?? { ...makeBoard(), id });
    }

    getBoards(_teamContext: TeamContext): Promise<Work.BoardReference[]> {
        return Promise.resolve(boards.map(({ id, name, url }) => ({ id, name, url })));
    }

    setBoardOptions(options: { [key: string]: string }, _teamContext: TeamContext, _id: string): Promise<{ [key: string]: string }> {
        return Promise.resolve(options);
    }

    getBoardUserSettings(_teamContext: TeamContext, _board: string): Promise<Work.BoardUserSettings> {
        return Promise.resolve(makeBoardUserSettings());
    }

    updateBoardUserSettings(boardUserSettings: { [key: string]: string }, _teamContext: TeamContext, _board: string): Promise<Work.BoardUserSettings> {
        return Promise.resolve({ autoRefreshState: boardUserSettings.autoRefreshState === "true" });
    }

    getCapacitiesWithIdentityRefAndTotals(_teamContext: TeamContext, _iterationId: string): Promise<Work.TeamCapacity> {
        return Promise.resolve(makeTeamCapacity());
    }

    getCapacityWithIdentityRef(_teamContext: TeamContext, _iterationId: string, teamMemberId: string): Promise<Work.TeamMemberCapacityIdentityRef> {
        return Promise.resolve({ ...makeTeamMemberCapacity(), teamMember: { ...makeIdentityRef(), id: teamMemberId } });
    }

    replaceCapacitiesWithIdentityRef(capacities: Work.TeamMemberCapacityIdentityRef[], _teamContext: TeamContext, _iterationId: string): Promise<Work.TeamMemberCapacityIdentityRef[]> {
        return Promise.resolve(capacities);
    }

    updateCapacityWithIdentityRef(patch: Work.CapacityPatch, _teamContext: TeamContext, _iterationId: string, teamMemberId: string): Promise<Work.TeamMemberCapacityIdentityRef> {
        return Promise.resolve({ ...makeTeamMemberCapacity(), ...patch, teamMember: { ...makeIdentityRef(), id: teamMemberId } });
    }

    getBoardCardRuleSettings(_teamContext: TeamContext, _board: string): Promise<Work.BoardCardRuleSettings> {
        return Promise.resolve(makeBoardCardRuleSettings());
    }

    updateBoardCardRuleSettings(boardCardRuleSettings: Work.BoardCardRuleSettings, _teamContext: TeamContext, _board: string): Promise<Work.BoardCardRuleSettings> {
        return Promise.resolve(boardCardRuleSettings);
    }

    updateTaskboardCardRuleSettings(_boardCardRuleSettings: Work.BoardCardRuleSettings, _teamContext: TeamContext): Promise<void> {
        return Promise.resolve();
    }

    getBoardCardSettings(_teamContext: TeamContext, _board: string): Promise<Work.BoardCardSettings> {
        return Promise.resolve(makeBoardCardSettings());
    }

    updateBoardCardSettings(boardCardSettingsToSave: Work.BoardCardSettings, _teamContext: TeamContext, _board: string): Promise<Work.BoardCardSettings> {
        return Promise.resolve(boardCardSettingsToSave);
    }

    updateTaskboardCardSettings(_boardCardSettingsToSave: Work.BoardCardSettings, _teamContext: TeamContext): Promise<void> {
        return Promise.resolve();
    }

    getBoardChart(_teamContext: TeamContext, _board: string, name: string): Promise<Work.BoardChart> {
        return Promise.resolve(makeBoardChart(name));
    }

    getBoardCharts(_teamContext: TeamContext, _board: string): Promise<Work.BoardChartReference[]> {
        return Promise.resolve(boardCharts);
    }

    updateBoardChart(chart: Work.BoardChart, _teamContext: TeamContext, _board: string, name: string): Promise<Work.BoardChart> {
        return Promise.resolve({ ...makeBoardChart(name), ...chart, name });
    }

    getBoardColumns(_teamContext: TeamContext, board: string): Promise<Work.BoardColumn[]> {
        return Promise.resolve((findBoard(board) ?? makeBoard()).columns);
    }

    updateBoardColumns(boardColumns: Work.BoardColumn[], _teamContext: TeamContext, _board: string): Promise<Work.BoardColumn[]> {
        return Promise.resolve(boardColumns);
    }

    getDeliveryTimelineData(_project: string, id: string, revision?: number, startDate?: Date, endDate?: Date): Promise<Work.DeliveryViewData> {
        const data = makeDeliveryViewData();
        return Promise.resolve({
            ...data,
            id,
            revision: revision ?? data.revision,
            startDate: startDate ?? data.startDate,
            endDate: endDate ?? data.endDate
        });
    }

    getTotalIterationCapacities(_project: string, _iterationId: string): Promise<Work.IterationCapacity> {
        return Promise.resolve(makeIterationCapacity());
    }

    deleteTeamIteration(_teamContext: TeamContext, _id: string): Promise<void> {
        return Promise.resolve();
    }

    getTeamIteration(_teamContext: TeamContext, id: string): Promise<Work.TeamSettingsIteration> {
        const found = iterations.find(i => i.id === id);
        return Promise.resolve(found ?? { ...makeIteration(), id });
    }

    getTeamIterations(_teamContext: TeamContext, timeframe?: string): Promise<Work.TeamSettingsIteration[]> {
        if (!timeframe) return Promise.resolve(iterations);
        return Promise.resolve(iterations.filter(i => i.attributes.timeFrame === Work.TimeFrame.Current));
    }

    postTeamIteration(iteration: Work.TeamSettingsIteration, _teamContext: TeamContext): Promise<Work.TeamSettingsIteration> {
        return Promise.resolve({ ...makeIteration(), ...iteration });
    }

    createPlan(postedPlan: Work.CreatePlan, _project: string): Promise<Work.Plan> {
        return Promise.resolve({ ...makePlan(), ...postedPlan });
    }

    deletePlan(_project: string, _id: string): Promise<void> {
        return Promise.resolve();
    }

    getPlan(_project: string, id: string): Promise<Work.Plan> {
        const found = plans.find(p => p.id === id);
        return Promise.resolve(found ?? { ...makePlan(), id });
    }

    getPlans(_project: string): Promise<Work.Plan[]> {
        return Promise.resolve(plans);
    }

    updatePlan(updatedPlan: Work.UpdatePlan, _project: string, id: string): Promise<Work.Plan> {
        return Promise.resolve({ ...makePlan(), ...updatedPlan, id });
    }

    getProcessConfiguration(_project: string): Promise<Work.ProcessConfiguration> {
        return Promise.resolve(makeProcessConfiguration());
    }

    getBoardRows(_teamContext: TeamContext, board: string): Promise<Work.BoardRow[]> {
        return Promise.resolve((findBoard(board) ?? makeBoard()).rows);
    }

    updateBoardRows(boardRows: Work.BoardRow[], _teamContext: TeamContext, _board: string): Promise<Work.BoardRow[]> {
        return Promise.resolve(boardRows);
    }

    getColumns(_teamContext: TeamContext): Promise<Work.TaskboardColumns> {
        return Promise.resolve(makeTaskboardColumns());
    }

    updateColumns(updateColumns: Work.UpdateTaskboardColumn[], _teamContext: TeamContext): Promise<Work.TaskboardColumns> {
        return Promise.resolve({ ...makeTaskboardColumns(), columns: updateColumns, isCustomized: true });
    }

    getWorkItemColumns(_teamContext: TeamContext, _iterationId: string): Promise<Work.TaskboardWorkItemColumn[]> {
        return Promise.resolve(Array.from({ length: 3 }, makeTaskboardWorkItemColumn));
    }

    updateWorkItemColumn(_updateColumn: Work.UpdateTaskboardWorkItemColumn, _teamContext: TeamContext, _iterationId: string, _workItemId: number): Promise<void> {
        return Promise.resolve();
    }

    getTeamDaysOff(_teamContext: TeamContext, _iterationId: string): Promise<Work.TeamSettingsDaysOff> {
        return Promise.resolve(makeTeamDaysOff());
    }

    updateTeamDaysOff(daysOffPatch: Work.TeamSettingsDaysOffPatch, _teamContext: TeamContext, _iterationId: string): Promise<Work.TeamSettingsDaysOff> {
        return Promise.resolve({ ...makeTeamDaysOff(), ...daysOffPatch });
    }

    getTeamFieldValues(_teamContext: TeamContext): Promise<Work.TeamFieldValues> {
        return Promise.resolve(makeTeamFieldValues());
    }

    updateTeamFieldValues(patch: Work.TeamFieldValuesPatch, _teamContext: TeamContext): Promise<Work.TeamFieldValues> {
        return Promise.resolve({ ...makeTeamFieldValues(), ...patch });
    }

    getTeamSettings(_teamContext: TeamContext): Promise<Work.TeamSetting> {
        return Promise.resolve(makeTeamSetting());
    }

    updateTeamSettings(teamSettingsPatch: Work.TeamSettingsPatch, _teamContext: TeamContext): Promise<Work.TeamSetting> {
        const settings = makeTeamSetting();
        return Promise.resolve({
            ...settings,
            ...teamSettingsPatch,
            backlogIteration: { ...settings.backlogIteration, id: teamSettingsPatch.backlogIteration },
            defaultIteration: { ...settings.defaultIteration, id: teamSettingsPatch.defaultIteration }
        });
    }

    getIterationWorkItems(_teamContext: TeamContext, _iterationId: string): Promise<Work.IterationWorkItems> {
        return Promise.resolve(makeIterationWorkItems());
    }

    reorderBacklogWorkItems(operation: Work.ReorderOperation, _teamContext: TeamContext): Promise<Work.ReorderResult[]> {
        return Promise.resolve(operation.ids.map(makeReorderResult));
    }

    reorderIterationWorkItems(operation: Work.ReorderOperation, _teamContext: TeamContext, _iterationId: string): Promise<Work.ReorderResult[]> {
        return Promise.resolve(operation.ids.map(makeReorderResult));
    }
}
