import { fake } from "../common/fixtures";
import {
    Activity,
    BacklogColumn,
    BacklogConfiguration,
    BacklogLevel,
    BacklogLevelConfiguration,
    BacklogLevelWorkItems,
    BacklogType,
    Board,
    BoardBadge,
    BoardCardRuleSettings,
    BoardCardSettings,
    BoardChart,
    BoardChartReference,
    BoardColumn,
    BoardColumnType,
    BoardReference,
    BoardRow,
    BoardSuggestedValue,
    BoardUserSettings,
    BugsBehavior,
    CategoryConfiguration,
    DateRange,
    DeliveryViewData,
    FieldReference,
    FilterClause,
    IterationCapacity,
    IterationWorkItems,
    ParentChildWIMap,
    Plan,
    PlanType,
    PlanUserPermissions,
    ProcessConfiguration,
    ReorderResult,
    Rule,
    TaskboardColumn,
    TaskboardColumns,
    TaskboardWorkItemColumn,
    TeamCapacity,
    TeamCapacityTotals,
    TeamFieldValue,
    TeamFieldValues,
    TeamMemberCapacityIdentityRef,
    TeamSetting,
    TeamSettingsDaysOff,
    TeamSettingsIteration,
    TimeFrame,
    TimelineCriteriaStatusCode,
    TimelineIterationStatusCode,
    TimelineTeamData,
    TimelineTeamIteration,
    TimelineTeamStatusCode
} from "azure-devops-extension-api/Work";
import {
    WorkItemFieldReference,
    WorkItemLink,
    WorkItemTypeReference
} from "azure-devops-extension-api/WorkItemTracking";
import { makeIdentityRef, makeProjectReference } from "../core/Data";

const WORK_ITEM_TYPES = ["Epic", "Feature", "User Story", "Task", "Bug"];
const STATES = ["New", "Active", "Resolved", "Closed"];

export const makeFieldReference = (referenceName = `System.${fake.lorem.word()}`): FieldReference => ({
    referenceName,
    url: fake.internet.url()
});

export const makeWorkItemFieldReference = (name = fake.lorem.word()): WorkItemFieldReference => ({
    name,
    referenceName: `System.${name}`,
    url: fake.internet.url()
});

export const makeWorkItemTypeReference = (name = fake.helpers.arrayElement(WORK_ITEM_TYPES)): WorkItemTypeReference => ({
    name,
    url: fake.internet.url()
});

export const makeWorkItemLink = (): WorkItemLink => ({
    rel: "System.LinkTypes.Hierarchy-Forward",
    source: { id: fake.number.int({ min: 1, max: 10_000 }), url: fake.internet.url() },
    target: { id: fake.number.int({ min: 1, max: 10_000 }), url: fake.internet.url() }
});

export const makeBacklogColumn = (): BacklogColumn => ({
    columnFieldReference: makeWorkItemFieldReference(),
    width: fake.number.int({ min: 50, max: 400 })
});

export const makeBacklog = (
    name = fake.helpers.arrayElement(["Epics", "Features", "Stories", "Tasks"]),
    type = BacklogType.Requirement
): BacklogLevelConfiguration => ({
    addPanelFields: [makeWorkItemFieldReference("Title")],
    color: fake.color.rgb(),
    columnFields: Array.from({ length: 3 }, makeBacklogColumn),
    defaultWorkItemType: makeWorkItemTypeReference(),
    id: `Microsoft.${name}Category`,
    isHidden: false,
    name,
    rank: fake.number.int({ min: 0, max: 5 }),
    type,
    workItemCountLimit: fake.number.int({ min: 100, max: 1000 }),
    workItemTypes: [makeWorkItemTypeReference()]
});

export const makeBacklogConfiguration = (): BacklogConfiguration => ({
    backlogFields: { typeFields: { Order: "Microsoft.VSTS.Common.StackRank", Effort: "Microsoft.VSTS.Scheduling.StoryPoints" } },
    bugsBehavior: BugsBehavior.AsRequirements,
    hiddenBacklogs: [],
    isBugsBehaviorConfigured: true,
    portfolioBacklogs: [makeBacklog("Epics", BacklogType.Portfolio), makeBacklog("Features", BacklogType.Portfolio)],
    requirementBacklog: makeBacklog("Stories", BacklogType.Requirement),
    taskBacklog: makeBacklog("Tasks", BacklogType.Task),
    url: fake.internet.url(),
    workItemTypeMappedStates: WORK_ITEM_TYPES.map(workItemTypeName => ({
        workItemTypeName,
        states: { New: "Proposed", Active: "InProgress", Closed: "Completed" }
    }))
});

export const makeBacklogLevelWorkItems = (): BacklogLevelWorkItems => ({
    workItems: Array.from({ length: 3 }, makeWorkItemLink)
});

export const makeBoardColumn = (name = fake.helpers.arrayElement(["New", "Active", "Resolved", "Closed"])): BoardColumn => ({
    columnType: fake.helpers.arrayElement([BoardColumnType.Incoming, BoardColumnType.InProgress, BoardColumnType.Outgoing]),
    description: fake.lorem.sentence(),
    id: fake.string.uuid(),
    isSplit: fake.datatype.boolean(),
    itemLimit: fake.number.int({ min: 0, max: 20 }),
    name,
    stateMappings: { "User Story": name, Bug: name }
});

export const makeBoardRow = (name = fake.lorem.word()): BoardRow => ({
    color: fake.color.rgb(),
    id: fake.string.uuid(),
    name
});

export const makeBoardReference = (name = fake.helpers.arrayElement(["Stories", "Features", "Epics"])): BoardReference => ({
    id: fake.string.uuid(),
    name,
    url: fake.internet.url()
});

export const makeBoard = (name = fake.helpers.arrayElement(["Stories", "Features", "Epics"])): Board => ({
    ...makeBoardReference(name),
    _links: {},
    allowedMappings: { Incoming: { "User Story": ["New"] }, Outgoing: { "User Story": ["Closed"] } },
    canEdit: true,
    columns: [makeBoardColumn("New"), makeBoardColumn("Active"), makeBoardColumn("Closed")],
    fields: {
        columnField: makeFieldReference("System.BoardColumn"),
        doneField: makeFieldReference("System.BoardColumnDone"),
        rowField: makeFieldReference("System.BoardLane")
    },
    isValid: true,
    revision: fake.number.int({ min: 1, max: 50 }),
    rows: [makeBoardRow(""), makeBoardRow("Expedite")]
});

export const makeBoardBadge = (boardId = fake.string.uuid()): BoardBadge => ({
    boardId,
    imageUrl: `${fake.internet.url()}/badge.svg`
});

export const makeBoardSuggestedValue = (name = fake.lorem.word()): BoardSuggestedValue => ({ name });

export const makeParentChildWIMap = (): ParentChildWIMap => ({
    childWorkItemIds: Array.from({ length: 3 }, () => fake.number.int({ min: 1, max: 10_000 })),
    id: fake.number.int({ min: 1, max: 10_000 }),
    teamProject: makeProjectReference().name,
    title: fake.lorem.sentence(),
    workItemTypeName: fake.helpers.arrayElement(WORK_ITEM_TYPES)
});

export const makeBoardUserSettings = (): BoardUserSettings => ({
    autoRefreshState: fake.datatype.boolean()
});

export const makeActivity = (): Activity => ({
    capacityPerDay: fake.number.int({ min: 1, max: 8 }),
    name: fake.helpers.arrayElement(["Development", "Testing", "Design", "Documentation"])
});

export const makeDateRange = (): DateRange => ({
    start: fake.date.recent(),
    end: fake.date.future()
});

export const makeTeamMemberCapacity = (): TeamMemberCapacityIdentityRef => ({
    _links: {},
    url: fake.internet.url(),
    activities: [makeActivity()],
    daysOff: [makeDateRange()],
    teamMember: makeIdentityRef()
});

export const makeTeamCapacity = (): TeamCapacity => ({
    teamMembers: Array.from({ length: 3 }, makeTeamMemberCapacity),
    totalCapacityPerDay: fake.number.int({ min: 8, max: 40 }),
    totalDaysOff: fake.number.int({ min: 0, max: 10 })
});

export const makeTeamCapacityTotals = (): TeamCapacityTotals => ({
    teamCapacityPerDay: fake.number.int({ min: 8, max: 40 }),
    teamId: fake.string.uuid(),
    teamTotalDaysOff: fake.number.int({ min: 0, max: 10 })
});

export const makeIterationCapacity = (): IterationCapacity => ({
    teams: Array.from({ length: 2 }, makeTeamCapacityTotals),
    totalIterationCapacityPerDay: fake.number.int({ min: 8, max: 80 }),
    totalIterationDaysOff: fake.number.int({ min: 0, max: 20 })
});

export const makeFilterClause = (index = 0): FilterClause => ({
    fieldName: "System.WorkItemType",
    index,
    logicalOperator: "AND",
    operator: "=",
    value: fake.helpers.arrayElement(WORK_ITEM_TYPES)
});

export const makeRule = (): Rule => ({
    clauses: [makeFilterClause()],
    filter: "[System.WorkItemType] = 'Bug'",
    isEnabled: "true",
    name: fake.lorem.word(),
    settings: { "background-color": fake.color.rgb() }
});

export const makeBoardCardRuleSettings = (): BoardCardRuleSettings => ({
    _links: {},
    rules: { fill: [makeRule()], tagStyle: [makeRule()] },
    url: fake.internet.url()
});

export const makeBoardCardSettings = (): BoardCardSettings => ({
    cards: {
        "User Story": [{ fieldIdentifier: "System.AssignedTo", displayType: "AVATAR_AND_FULLNAME" }],
        Bug: [{ fieldIdentifier: "System.Title" }]
    }
});

export const makeBoardChartReference = (name = fake.helpers.arrayElement(["cumulativeFlow", "leadTime", "cycleTime"])): BoardChartReference => ({
    name,
    url: fake.internet.url()
});

export const makeBoardChart = (name = fake.helpers.arrayElement(["cumulativeFlow", "leadTime", "cycleTime"])): BoardChart => ({
    ...makeBoardChartReference(name),
    _links: {},
    settings: { chartType: "cumulativeFlow", showTrendline: true }
});

export const makeBacklogLevel = (): BacklogLevel => ({
    categoryReferenceName: "Microsoft.RequirementCategory",
    pluralName: "Stories",
    workItemStates: STATES,
    workItemTypes: ["User Story", "Bug"]
});

export const makeTimelineTeamIteration = (): TimelineTeamIteration => ({
    cssNodeId: fake.string.uuid(),
    finishDate: fake.date.future(),
    name: `Sprint ${fake.number.int({ min: 1, max: 30 })}`,
    partiallyPagedWorkItems: [],
    path: `${fake.lorem.word()}\\Sprint ${fake.number.int({ min: 1, max: 30 })}`,
    startDate: fake.date.recent(),
    status: { message: "", type: TimelineIterationStatusCode.OK },
    workItems: [[fake.number.int({ min: 1, max: 10_000 }), fake.lorem.sentence()]]
});

export const makeTimelineTeamData = (): TimelineTeamData => ({
    backlog: makeBacklogLevel(),
    fieldReferenceNames: ["System.Id", "System.Title", "System.State"],
    id: fake.string.uuid(),
    isExpanded: true,
    iterations: [makeTimelineTeamIteration()],
    name: `${fake.company.name()} Team`,
    orderByField: "Microsoft.VSTS.Common.StackRank",
    partiallyPagedFieldReferenceNames: ["System.Id", "System.WorkItemType"],
    partiallyPagedWorkItems: [],
    projectId: fake.string.uuid(),
    rollupWorkItemTypes: ["Task"],
    status: { message: "", type: TimelineTeamStatusCode.OK },
    teamFieldDefaultValue: fake.lorem.word(),
    teamFieldName: "System.AreaPath",
    teamFieldValues: [{ includeChildren: true, value: fake.lorem.word() }],
    workItems: [],
    workItemTypeColors: WORK_ITEM_TYPES.map(workItemTypeName => ({
        workItemTypeName,
        icon: "icon_book",
        primaryColor: fake.color.rgb()
    }))
});

export const makeDeliveryViewData = (): DeliveryViewData => ({
    id: fake.string.uuid(),
    revision: fake.number.int({ min: 1, max: 50 }),
    childIdToParentIdMap: { 2: 1, 3: 1 },
    criteriaStatus: { message: "", type: TimelineCriteriaStatusCode.OK },
    endDate: fake.date.future(),
    maxExpandedTeams: 5,
    parentItemMaps: [makeParentChildWIMap()],
    startDate: fake.date.recent(),
    teams: [makeTimelineTeamData()],
    workItemDependencies: [],
    workItemViolations: []
});

export const makeIteration = (timeFrame = TimeFrame.Current): TeamSettingsIteration => {
    const name = `Sprint ${fake.number.int({ min: 1, max: 30 })}`;
    return {
        _links: {},
        url: fake.internet.url(),
        attributes: {
            startDate: fake.date.recent(),
            finishDate: fake.date.future(),
            timeFrame
        },
        id: fake.string.uuid(),
        name,
        path: `${fake.lorem.word()}\\${name}`
    };
};

export const makePlan = (): Plan => ({
    createdByIdentity: makeIdentityRef(),
    createdDate: fake.date.past(),
    description: fake.lorem.sentence(),
    id: fake.string.uuid(),
    lastAccessed: fake.date.recent(),
    modifiedByIdentity: makeIdentityRef(),
    modifiedDate: fake.date.recent(),
    name: `${fake.lorem.word()} delivery plan`,
    properties: { teamBacklogMappings: [{ teamId: fake.string.uuid(), categoryReferenceName: "Microsoft.RequirementCategory" }] },
    revision: fake.number.int({ min: 1, max: 20 }),
    type: PlanType.DeliveryTimelineView,
    url: fake.internet.url(),
    userPermissions: PlanUserPermissions.AllPermissions
});

export const makeCategoryConfiguration = (name = fake.helpers.arrayElement(["Epic", "Feature", "Requirement", "Task", "Bug"])): CategoryConfiguration => ({
    name,
    referenceName: `Microsoft.${name}Category`,
    workItemTypes: [makeWorkItemTypeReference()]
});

export const makeProcessConfiguration = (): ProcessConfiguration => ({
    bugWorkItems: makeCategoryConfiguration("Bug"),
    portfolioBacklogs: [makeCategoryConfiguration("Epic"), makeCategoryConfiguration("Feature")],
    requirementBacklog: makeCategoryConfiguration("Requirement"),
    taskBacklog: makeCategoryConfiguration("Task"),
    typeFields: {
        Order: makeWorkItemFieldReference("StackRank"),
        Effort: makeWorkItemFieldReference("StoryPoints"),
        Team: makeWorkItemFieldReference("AreaPath")
    },
    url: fake.internet.url()
});

export const makeTaskboardColumn = (name = fake.helpers.arrayElement(["To Do", "In Progress", "Done"])): TaskboardColumn => ({
    id: fake.string.uuid(),
    mappings: [{ state: name, workItemType: "Task" }],
    name,
    order: fake.number.int({ min: 0, max: 5 })
});

export const makeTaskboardColumns = (): TaskboardColumns => ({
    columns: [makeTaskboardColumn("To Do"), makeTaskboardColumn("In Progress"), makeTaskboardColumn("Done")],
    isCustomized: fake.datatype.boolean(),
    isValid: true,
    validationMesssage: ""
});

export const makeTaskboardWorkItemColumn = (): TaskboardWorkItemColumn => ({
    column: fake.helpers.arrayElement(["To Do", "In Progress", "Done"]),
    columnId: fake.string.uuid(),
    state: fake.helpers.arrayElement(STATES),
    workItemId: fake.number.int({ min: 1, max: 10_000 })
});

export const makeTeamDaysOff = (): TeamSettingsDaysOff => ({
    _links: {},
    url: fake.internet.url(),
    daysOff: [makeDateRange()]
});

export const makeTeamFieldValue = (): TeamFieldValue => ({
    includeChildren: fake.datatype.boolean(),
    value: `${fake.lorem.word()}\\${fake.lorem.word()}`
});

export const makeTeamFieldValues = (): TeamFieldValues => {
    const values = Array.from({ length: 2 }, makeTeamFieldValue);
    return {
        _links: {},
        url: fake.internet.url(),
        defaultValue: values[0].value,
        field: makeFieldReference("System.AreaPath"),
        values
    };
};

export const makeTeamSetting = (): TeamSetting => ({
    _links: {},
    url: fake.internet.url(),
    backlogIteration: makeIteration(),
    backlogVisibilities: {
        "Microsoft.EpicCategory": true,
        "Microsoft.FeatureCategory": true,
        "Microsoft.RequirementCategory": true
    },
    bugsBehavior: BugsBehavior.AsRequirements,
    defaultIteration: makeIteration(),
    defaultIterationMacro: "@CurrentIteration",
    workingDays: [1, 2, 3, 4, 5] as TeamSetting["workingDays"]
});

export const makeIterationWorkItems = (): IterationWorkItems => ({
    _links: {},
    url: fake.internet.url(),
    workItemRelations: Array.from({ length: 3 }, makeWorkItemLink)
});

export const makeReorderResult = (id = fake.number.int({ min: 1, max: 10_000 })): ReorderResult => ({
    id,
    order: fake.number.int({ min: 1, max: 1_000_000 })
});

export const boards: Board[] = [makeBoard("Stories"), makeBoard("Features"), makeBoard("Epics")];
export const backlogs: BacklogLevelConfiguration[] = [
    makeBacklog("Epics", BacklogType.Portfolio),
    makeBacklog("Features", BacklogType.Portfolio),
    makeBacklog("Stories", BacklogType.Requirement),
    makeBacklog("Tasks", BacklogType.Task)
];
export const iterations: TeamSettingsIteration[] = [
    makeIteration(TimeFrame.Past),
    makeIteration(TimeFrame.Current),
    makeIteration(TimeFrame.Future)
];
export const plans: Plan[] = Array.from({ length: 3 }, makePlan);
export const boardCharts: BoardChartReference[] = [
    makeBoardChartReference("cumulativeFlow"),
    makeBoardChartReference("leadTime"),
    makeBoardChartReference("cycleTime")
];
export const columnSuggestedValues: BoardSuggestedValue[] = STATES.map(makeBoardSuggestedValue);
export const rowSuggestedValues: BoardSuggestedValue[] = ["Expedite", "Blocked", "Standard"].map(makeBoardSuggestedValue);
