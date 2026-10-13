import { fake } from "../common/fixtures";
import {
    Control,
    CustomizationType,
    Extension,
    FieldType,
    FormLayout,
    Group,
    Page,
    PageType,
    PickList,
    PickListMetadata,
    ProcessBehavior,
    ProcessBehaviorField,
    ProcessBehaviorReference,
    ProcessInfo,
    ProcessRule,
    ProcessWorkItemType,
    ProcessWorkItemTypeField,
    ProjectReference,
    RuleAction,
    RuleActionType,
    RuleCondition,
    RuleConditionType,
    Section,
    WitContribution,
    WorkItemBehaviorReference,
    WorkItemStateResultModel,
    WorkItemTypeBehavior
} from "azure-devops-extension-api/WorkItemTrackingProcess";

export const EMPTY_PROCESS_ID = "00000000-0000-0000-0000-000000000000";
export const AGILE_PROCESS_ID = "adcc42ab-9882-485e-a3ed-7678f01f66bc";
export const SCRUM_PROCESS_ID = "6b724908-ef14-45cf-84f8-768b5384da45";
export const CMMI_PROCESS_ID = "27450541-8e31-4150-9947-dc59f998fc01";
export const BASIC_PROCESS_ID = "b8a3a935-7e91-48b8-a94c-606d37c3e9f2";

export const ORDERED_BEHAVIOR = "System.OrderedBehavior";
export const PORTFOLIO_BEHAVIOR = "System.PortfolioBacklogBehavior";
export const REQUIREMENT_BEHAVIOR = "System.RequirementBacklogBehavior";
export const TASK_BEHAVIOR = "System.TaskBacklogBehavior";
export const EPIC_BEHAVIOR = "Microsoft.VSTS.Agile.EpicBacklogBehavior";
export const FEATURE_BEHAVIOR = "Microsoft.VSTS.Agile.FeatureBacklogBehavior";

const pascal = (): string => {
    const word = fake.lorem.word();
    return word.charAt(0).toUpperCase() + word.slice(1);
};

const color = (): string => fake.color.rgb().slice(1);

export const makeWitContribution = (): WitContribution => ({
    contributionId: `${fake.lorem.word()}.${fake.lorem.slug(2)}.${fake.lorem.word()}`,
    height: fake.number.int({ min: 50, max: 400 }),
    inputs: {},
    showOnDeletedWorkItem: false
});

export const makeControl = (id = `Custom.${pascal()}${pascal()}`): Control => ({
    contribution: fake.helpers.absent(),
    controlType: "FieldControl",
    height: fake.helpers.absent(),
    id,
    inherited: false,
    isContribution: false,
    label: fake.lorem.words(2),
    metadata: "",
    order: fake.number.int({ min: 1, max: 20 }),
    overridden: false,
    readOnly: false,
    visible: true,
    watermark: ""
});

export const makeHtmlControl = (id?: string): Control => ({
    ...makeControl(id),
    controlType: "HtmlFieldControl",
    height: fake.number.int({ min: 100, max: 400 })
});

export const makeContributionControl = (): Control => {
    const contribution = makeWitContribution();
    return {
        ...makeControl(fake.string.uuid()),
        contribution,
        controlType: "",
        height: contribution.height,
        isContribution: true
    };
};

export const makeGroup = (
    controls: Control[] = fake.helpers.distinct(2, makeControl, control => control.id)
): Group => ({
    contribution: fake.helpers.absent(),
    controls,
    height: fake.helpers.absent(),
    id: fake.string.uuid(),
    inherited: false,
    isContribution: false,
    label: fake.lorem.words(2),
    order: fake.number.int({ min: 1, max: 20 }),
    overridden: false,
    visible: true
});

export const makeContributionGroup = (): Group => {
    const contribution = makeWitContribution();
    return { ...makeGroup([]), contribution, height: contribution.height, isContribution: true };
};

export const makeSection = (id = "Section1", groups: Group[] = [makeGroup()]): Section => ({
    groups,
    id,
    overridden: false
});

export const makePage = (
    sections: Section[] = [
        makeSection("Section1"),
        makeSection("Section2"),
        makeSection("Section3", []),
        makeSection("Section4", [])
    ]
): Page => ({
    contribution: fake.helpers.absent(),
    id: fake.string.uuid(),
    inherited: false,
    isContribution: false,
    label: fake.lorem.words(2),
    locked: false,
    order: fake.number.int({ min: 1, max: 20 }),
    overridden: false,
    pageType: PageType.Custom,
    sections,
    visible: true
});

export const makeContributionPage = (): Page => ({
    ...makePage([]),
    contribution: makeWitContribution(),
    isContribution: true
});

export const makeExtension = (): Extension => ({
    id: `${fake.lorem.word()}.${fake.lorem.slug(2)}`
});

export const makeSystemControls = (): Control[] => [
    { ...makeControl("System.Title"), inherited: true, label: "Title", order: 1 },
    { ...makeControl("System.AssignedTo"), inherited: true, label: "Assigned To", order: 2 },
    { ...makeControl("System.State"), inherited: true, label: "State", order: 3 },
    { ...makeControl("System.Reason"), inherited: true, label: "Reason", order: 4 },
    { ...makeControl("System.AreaPath"), inherited: true, label: "Area", order: 5 },
    { ...makeControl("System.IterationPath"), inherited: true, label: "Iteration", order: 6 }
];

const makeSystemPage = (label: string, pageType: PageType, order: number, controlType: string): Page => ({
    ...makePage([
        makeSection("Section1", [
            {
                ...makeGroup([{ ...makeControl(fake.string.uuid()), controlType, inherited: true, label }]),
                inherited: true,
                label
            }
        ])
    ]),
    inherited: true,
    label,
    locked: true,
    order,
    pageType
});

export const makeFormLayout = (): FormLayout => ({
    extensions: [makeExtension()],
    pages: [
        {
            ...makePage([
                makeSection("Section1", [
                    {
                        ...makeGroup([
                            { ...makeHtmlControl("System.Description"), inherited: true, label: "Description" }
                        ]),
                        inherited: true,
                        label: "Description",
                        order: 1
                    }
                ]),
                makeSection("Section2", [
                    {
                        ...makeGroup([
                            { ...makeControl("Microsoft.VSTS.Common.Priority"), inherited: true, label: "Priority" },
                            { ...makeControl("Microsoft.VSTS.Common.Severity"), inherited: true, label: "Severity" }
                        ]),
                        inherited: true,
                        label: "Planning",
                        order: 1
                    },
                    {
                        ...makeGroup([makeControl("Custom.Effort"), makeControl("Custom.Risk")]),
                        label: "Custom",
                        order: 2
                    }
                ]),
                makeSection("Section3", [
                    { ...makeGroup([makeContributionControl()]), label: "Extensions", order: 1 },
                    { ...makeContributionGroup(), order: 2 }
                ]),
                makeSection("Section4", [])
            ]),
            inherited: true,
            label: "Details",
            order: 1
        },
        makeSystemPage("History", PageType.History, 2, "WorkItemLogControl"),
        makeSystemPage("Links", PageType.Links, 3, "LinksControl"),
        makeSystemPage("Attachments", PageType.Attachments, 4, "AttachmentsControl")
    ],
    systemControls: makeSystemControls()
});

export const makePickList = (): PickList => {
    const id = fake.string.uuid();
    return {
        id,
        isSuggested: false,
        items: [fake.lorem.word(), fake.lorem.word(), fake.lorem.word()],
        name: `picklist_${fake.string.uuid()}`,
        type: "String",
        url: `${fake.internet.url()}/_apis/work/processes/lists/${id}`
    };
};

export const makePickListMetadata = ({ id, isSuggested, name, type, url }: PickListMetadata): PickListMetadata => ({
    id,
    isSuggested,
    name,
    type,
    url
});

export const makeProcessBehaviorField = (referenceName = `Custom.${pascal()}${pascal()}`): ProcessBehaviorField => ({
    name: referenceName.slice(referenceName.lastIndexOf(".") + 1),
    referenceName,
    url: `${fake.internet.url()}/_apis/work/processes/fields/${referenceName}`
});

export const makeProcessBehaviorReference = (behaviorRefName: string): ProcessBehaviorReference => ({
    behaviorRefName,
    url: `${fake.internet.url()}/_apis/work/processes/behaviors/${behaviorRefName}`
});

export const makeProcessBehavior = (): ProcessBehavior => {
    const name = `${pascal()} ${pascal()}`;
    const referenceName = `Custom.${fake.string.uuid()}`;
    return {
        color: color(),
        customization: CustomizationType.Custom,
        description: fake.lorem.sentence(),
        fields: [makeProcessBehaviorField()],
        inherits: makeProcessBehaviorReference(PORTFOLIO_BEHAVIOR),
        name,
        rank: fake.number.int({ min: 50, max: 90 }),
        referenceName,
        url: `${fake.internet.url()}/_apis/work/processes/behaviors/${referenceName}`
    };
};

export const makeProjectReference = (): ProjectReference => {
    const id = fake.string.uuid();
    return {
        description: fake.lorem.sentence(),
        id,
        name: fake.commerce.productName(),
        url: `${fake.internet.url()}/_apis/projects/${id}`
    };
};

export const makeProcessInfo = (): ProcessInfo => ({
    customizationType: CustomizationType.Inherited,
    description: fake.lorem.sentence(),
    isDefault: false,
    isEnabled: true,
    name: `${pascal()} ${pascal()} ${fake.string.alphanumeric(4)}`,
    parentProcessTypeId: AGILE_PROCESS_ID,
    projects: [makeProjectReference()],
    referenceName: `Inherited.${fake.string.uuid().replace(/-/g, "")}`,
    typeId: fake.string.uuid()
});

export const makeRuleAction = (): RuleAction => ({
    actionType: RuleActionType.MakeRequired,
    targetField: "Microsoft.VSTS.Common.Priority",
    value: ""
});

export const makeRuleCondition = (): RuleCondition => ({
    conditionType: RuleConditionType.When,
    field: "System.State",
    value: "Active"
});

export const makeProcessRule = (): ProcessRule => {
    const id = fake.string.uuid();
    return {
        actions: [makeRuleAction()],
        conditions: [makeRuleCondition()],
        customizationType: CustomizationType.Custom,
        id,
        isDisabled: false,
        name: fake.lorem.words(3),
        url: `${fake.internet.url()}/_apis/work/processes/rules/${id}`
    };
};

export const makeWorkItemStateResultModel = (): WorkItemStateResultModel => {
    const id = fake.string.uuid();
    return {
        color: color(),
        customizationType: CustomizationType.Custom,
        hidden: false,
        id,
        name: `${pascal()} ${fake.string.alphanumeric(4)}`,
        order: fake.number.int({ min: 1, max: 10 }),
        stateCategory: "InProgress",
        url: `${fake.internet.url()}/_apis/work/processes/states/${id}`
    };
};

export const makeWorkItemBehaviorReference = (id = REQUIREMENT_BEHAVIOR): WorkItemBehaviorReference => ({
    id,
    url: `${fake.internet.url()}/_apis/work/processes/behaviors/${id}`
});

export const makeWorkItemTypeBehavior = (behaviorRefName?: string): WorkItemTypeBehavior => {
    const behavior = makeWorkItemBehaviorReference(behaviorRefName);
    return {
        behavior,
        isDefault: false,
        isLegacyDefault: false,
        url: behavior.url
    };
};

export const makeProcessWorkItemTypeField = (): ProcessWorkItemTypeField => {
    const name = `${pascal()} ${pascal()}`;
    const referenceName = `Custom.${name.replace(" ", "")}`;
    return {
        allowedValues: [],
        allowGroups: false,
        customization: CustomizationType.Custom,
        defaultValue: null,
        description: fake.lorem.sentence(),
        isLocked: false,
        name,
        readOnly: false,
        referenceName,
        required: false,
        type: FieldType.String,
        url: `${fake.internet.url()}/_apis/work/processes/fields/${referenceName}`
    };
};

const makeSystemField = (referenceName: string, name: string, type: FieldType): ProcessWorkItemTypeField => ({
    ...makeProcessWorkItemTypeField(),
    customization: CustomizationType.System,
    name,
    referenceName,
    type
});

const makeSystemState = (name: string, stateCategory: string, order: number): WorkItemStateResultModel => ({
    ...makeWorkItemStateResultModel(),
    customizationType: CustomizationType.System,
    name,
    order,
    stateCategory
});

export const states: WorkItemStateResultModel[] = [
    makeSystemState("New", "Proposed", 1),
    makeSystemState("Active", "InProgress", 2),
    makeSystemState("Resolved", "Resolved", 3),
    makeSystemState("Closed", "Completed", 4),
    { ...makeSystemState("Removed", "Removed", 5), hidden: true, customizationType: CustomizationType.Inherited }
];

export const workItemTypeBehaviors: WorkItemTypeBehavior[] = [
    { ...makeWorkItemTypeBehavior(REQUIREMENT_BEHAVIOR), isDefault: true },
    makeWorkItemTypeBehavior(TASK_BEHAVIOR)
];

export const formLayout: FormLayout = makeFormLayout();
export const pages: Page[] = formLayout.pages;
export const groups: Group[] = pages.flatMap(page => page.sections.flatMap(section => section.groups));
export const controls: Control[] = groups.flatMap(group => group.controls);
export const systemControls: Control[] = formLayout.systemControls;

export const makeProcessWorkItemType = (): ProcessWorkItemType => {
    const name = `${pascal()} ${pascal()}`;
    const referenceName = `Custom.${name.replace(" ", "")}`;
    return {
        behaviors: workItemTypeBehaviors,
        color: color(),
        customization: CustomizationType.Custom,
        description: fake.lorem.sentence(),
        icon: "icon_clipboard",
        inherits: fake.helpers.absent(),
        isDisabled: false,
        layout: formLayout,
        name,
        referenceName,
        states,
        url: `${fake.internet.url()}/_apis/work/processes/workItemTypes/${referenceName}`
    };
};

const makeSystemWorkItemType = (name: string, icon: string): ProcessWorkItemType => ({
    ...makeProcessWorkItemType(),
    customization: CustomizationType.System,
    icon,
    name,
    referenceName: `Microsoft.VSTS.WorkItemTypes.${name.replace(" ", "")}`
});

const makeSystemProcess = (typeId: string, name: string): ProcessInfo => ({
    ...makeProcessInfo(),
    customizationType: CustomizationType.System,
    name,
    parentProcessTypeId: EMPTY_PROCESS_ID,
    referenceName: `Microsoft.VSTS.${name}`,
    typeId
});

const makeSystemBehavior = (referenceName: string, name: string, rank: number, parent: string): ProcessBehavior => ({
    ...makeProcessBehavior(),
    customization: CustomizationType.System,
    fields: [makeProcessBehaviorField(`${referenceName}.Order`)],
    inherits: makeProcessBehaviorReference(parent),
    name,
    rank,
    referenceName
});

export const processes: ProcessInfo[] = [
    { ...makeSystemProcess(AGILE_PROCESS_ID, "Agile"), isDefault: true },
    makeSystemProcess(SCRUM_PROCESS_ID, "Scrum"),
    makeSystemProcess(CMMI_PROCESS_ID, "CMMI"),
    makeSystemProcess(BASIC_PROCESS_ID, "Basic"),
    ...fake.helpers.distinct(2, makeProcessInfo, process => process.name)
];

export const behaviors: ProcessBehavior[] = [
    {
        ...makeSystemBehavior(ORDERED_BEHAVIOR, "Ordered", 0, ORDERED_BEHAVIOR),
        fields: [makeProcessBehaviorField("Microsoft.VSTS.Common.StackRank")],
        inherits: fake.helpers.absent()
    },
    makeSystemBehavior(PORTFOLIO_BEHAVIOR, "Portfolio", 0, ORDERED_BEHAVIOR),
    makeSystemBehavior(EPIC_BEHAVIOR, "Epics", 40, PORTFOLIO_BEHAVIOR),
    makeSystemBehavior(FEATURE_BEHAVIOR, "Features", 30, PORTFOLIO_BEHAVIOR),
    makeSystemBehavior(REQUIREMENT_BEHAVIOR, "Stories", 20, ORDERED_BEHAVIOR),
    makeSystemBehavior(TASK_BEHAVIOR, "Tasks", 10, ORDERED_BEHAVIOR),
    ...fake.helpers.distinct(2, makeProcessBehavior, behavior => behavior.name)
];

export const workItemTypes: ProcessWorkItemType[] = [
    makeSystemWorkItemType("Bug", "icon_insect"),
    makeSystemWorkItemType("Epic", "icon_crown"),
    makeSystemWorkItemType("Feature", "icon_trophy"),
    makeSystemWorkItemType("Task", "icon_clipboard"),
    makeSystemWorkItemType("User Story", "icon_book"),
    ...fake.helpers.distinct(2, makeProcessWorkItemType, type => type.referenceName)
];

export const fields: ProcessWorkItemTypeField[] = [
    { ...makeSystemField("System.Title", "Title", FieldType.String), required: true },
    { ...makeSystemField("System.State", "State", FieldType.String), required: true },
    { ...makeSystemField("System.AssignedTo", "Assigned To", FieldType.Identity), allowGroups: true },
    {
        ...makeSystemField("Microsoft.VSTS.Common.Priority", "Priority", FieldType.Integer),
        allowedValues: [1, 2, 3, 4],
        defaultValue: 2
    },
    ...fake.helpers
        .distinct(2, makeProcessWorkItemTypeField, field => field.referenceName)
        .map(field => ({
            ...field,
            allowedValues: ["Low", "Medium", "High"],
            defaultValue: "Medium",
            type: FieldType.PicklistString
        }))
];

export const lists: PickList[] = fake.helpers.distinct(3, makePickList, list => list.name);

export const rules: ProcessRule[] = [
    { ...makeProcessRule(), customizationType: CustomizationType.System },
    makeProcessRule(),
    {
        ...makeProcessRule(),
        actions: [{ actionType: RuleActionType.CopyFromCurrentUser, targetField: "System.AssignedTo", value: "" }],
        conditions: [{ conditionType: RuleConditionType.WhenChanged, field: "System.State", value: "" }],
        isDisabled: true
    }
];
