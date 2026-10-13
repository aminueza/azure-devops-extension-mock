import { fake } from "../common/fixtures";
import {
    BehaviorModel,
    Control,
    Extension,
    FieldModel,
    FieldType,
    FormLayout,
    Group,
    Page,
    PageType,
    PickListItemModel,
    PickListMetadataModel,
    PickListModel,
    Section,
    WitContribution,
    WorkItemBehaviorReference,
    WorkItemStateResultModel,
    WorkItemTypeBehavior,
    WorkItemTypeClass,
    WorkItemTypeFieldModel2,
    WorkItemTypeModel
} from "azure-devops-extension-api/WorkItemTrackingProcessDefinitions";

const ORDERED_BEHAVIOR = "System.OrderedBehavior";
const PORTFOLIO_BEHAVIOR = "System.PortfolioBacklogBehavior";
const REQUIREMENT_BEHAVIOR = "System.RequirementBacklogBehavior";
const TASK_BEHAVIOR = "System.TaskBacklogBehavior";

const STATE_CATEGORIES: Array<[string, string, string]> = [
    ["New", "Proposed", "b2b2b2"],
    ["Active", "InProgress", "007acc"],
    ["Resolved", "Resolved", "ff9d00"],
    ["Closed", "Completed", "339933"]
];

export const makeBehaviorReference = (id: string = PORTFOLIO_BEHAVIOR): WorkItemBehaviorReference => ({
    id,
    url: `${fake.internet.url()}/behaviors/${id}`
});

export const makeBehavior = (
    id = `Custom.${fake.string.alpha()}`,
    inherits: string = PORTFOLIO_BEHAVIOR
): BehaviorModel => ({
    id,
    name: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    color: fake.color.rgb().slice(1),
    abstract: false,
    overridden: false,
    rank: fake.number.int({ min: 1, max: 100 }),
    inherits: makeBehaviorReference(inherits),
    url: `${fake.internet.url()}/behaviors/${id}`
});

export const makeWitContribution = (): WitContribution => ({
    contributionId: `${fake.lorem.word()}.${fake.lorem.slug(2)}.${fake.lorem.word()}-control`,
    height: fake.number.int({ min: 50, max: 400 }),
    inputs: { FieldName: "System.Title" },
    showOnDeletedWorkItem: false
});

export const makeControl = (id = fake.string.uuid()): Control => ({
    id,
    label: fake.lorem.words(2),
    controlType: "FieldControl",
    contribution: fake.helpers.absent(),
    isContribution: false,
    height: fake.number.int({ min: 20, max: 200 }),
    inherited: false,
    overridden: false,
    metadata: "",
    order: fake.number.int({ min: 1, max: 20 }),
    readOnly: false,
    visible: true,
    watermark: ""
});

export const makeContributionControl = (id = fake.string.uuid()): Control => {
    const contribution = makeWitContribution();
    return {
        ...makeControl(id),
        controlType: "",
        contribution,
        isContribution: true,
        height: contribution.height
    };
};

export const makeGroup = (controls: Control[] = [makeControl(), makeControl()]): Group => ({
    id: fake.string.uuid(),
    label: fake.lorem.words(2),
    contribution: fake.helpers.absent(),
    isContribution: false,
    controls,
    height: fake.number.int({ min: 100, max: 600 }),
    inherited: false,
    overridden: false,
    order: fake.number.int({ min: 1, max: 20 }),
    visible: true
});

export const makeSection = (id = "Section1", groups: Group[] = [makeGroup()]): Section => ({
    id,
    groups,
    overridden: false
});

export const makePage = (pageType: PageType = PageType.Custom): Page => ({
    id: fake.string.uuid(),
    label: fake.lorem.words(2),
    contribution: fake.helpers.absent(),
    isContribution: false,
    inherited: false,
    locked: pageType !== PageType.Custom,
    order: fake.number.int({ min: 1, max: 20 }),
    overridden: false,
    pageType,
    sections:
        pageType === PageType.Custom
            ? [
                  makeSection("Section1", [makeGroup(), makeGroup([makeControl(), makeContributionControl()])]),
                  makeSection("Section2")
              ]
            : [makeSection("Section1", [makeGroup([makeControl()])])],
    visible: true
});

export const makeExtension = (): Extension => ({
    id: `${fake.lorem.word()}.${fake.lorem.slug(2)}`
});

export const makeFormLayout = (): FormLayout => ({
    extensions: [makeExtension()],
    pages: [
        { ...makePage(), label: "Details" },
        { ...makePage(PageType.History), label: "History" },
        { ...makePage(PageType.Links), label: "Links" },
        { ...makePage(PageType.Attachments), label: "Attachments" }
    ],
    systemControls: [
        { ...makeControl("System.Title"), label: "Title" },
        { ...makeControl("System.State"), label: "State" },
        { ...makeControl("System.Reason"), label: "Reason" }
    ]
});

export const makePickListItem = (): PickListItemModel => ({
    id: fake.string.uuid(),
    value: fake.lorem.word()
});

export const makePickList = (): PickListModel => {
    const id = fake.string.uuid();
    return {
        id,
        name: `picklist_${fake.string.uuid()}`,
        type: "String",
        isSuggested: false,
        url: `${fake.internet.url()}/lists/${id}`,
        items: fake.helpers.distinct(3, makePickListItem, item => item.value)
    };
};

export const makePickListMetadata = ({
    id,
    isSuggested,
    name,
    type,
    url
}: PickListMetadataModel): PickListMetadataModel => ({
    id,
    isSuggested,
    name,
    type,
    url
});

export const makeField = (id = `Custom.${fake.string.alpha()}`, type: FieldType = FieldType.String): FieldModel => ({
    id,
    name: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    type,
    pickList: fake.helpers.absent(),
    url: `${fake.internet.url()}/fields/${id}`
});

export const makeWorkItemState = (
    name = fake.lorem.word(),
    stateCategory = "InProgress",
    color = fake.color.rgb().slice(1)
): WorkItemStateResultModel => {
    const id = fake.string.uuid();
    return {
        id,
        name,
        color,
        stateCategory,
        order: fake.number.int({ min: 1, max: 20 }),
        hidden: false,
        url: `${fake.internet.url()}/states/${id}`
    };
};

export const makeWorkItemStates = (): WorkItemStateResultModel[] =>
    STATE_CATEGORIES.map(([name, category, color], index) => ({
        ...makeWorkItemState(name, category, color),
        order: index + 1
    }));

export const makeWorkItemTypeBehavior = (
    behavior: WorkItemBehaviorReference = makeBehaviorReference()
): WorkItemTypeBehavior => ({
    behavior,
    isDefault: false,
    isLegacyDefault: false,
    url: behavior.url
});

export const makeWorkItemTypeField = (
    referenceName = `Custom.${fake.string.alpha()}`,
    type: FieldType = FieldType.String
): WorkItemTypeFieldModel2 => ({
    referenceName,
    name: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    type,
    pickList: fake.helpers.absent(),
    allowGroups: false,
    defaultValue: null,
    readOnly: false,
    required: false,
    url: `${fake.internet.url()}/fields/${referenceName}`
});

export const makeWorkItemType = (
    id = `Custom.${fake.string.alpha()}`,
    behaviorId: string = REQUIREMENT_BEHAVIOR
): WorkItemTypeModel => ({
    id,
    name: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    class: WorkItemTypeClass.Custom,
    color: fake.color.rgb().slice(1),
    icon: "icon_clipboard",
    inherits: fake.helpers.absent(),
    isDisabled: false,
    behaviors: [{ ...makeWorkItemTypeBehavior(makeBehaviorReference(behaviorId)), isDefault: true }],
    states: makeWorkItemStates(),
    layout: makeFormLayout(),
    url: `${fake.internet.url()}/workItemTypes/${id}`
});

export const behaviors: BehaviorModel[] = [
    {
        ...makeBehavior(ORDERED_BEHAVIOR),
        name: "Ordered",
        abstract: true,
        inherits: fake.helpers.absent()
    },
    { ...makeBehavior(PORTFOLIO_BEHAVIOR, ORDERED_BEHAVIOR), name: "Portfolio", abstract: true },
    { ...makeBehavior(REQUIREMENT_BEHAVIOR, ORDERED_BEHAVIOR), name: "Requirements" },
    { ...makeBehavior(TASK_BEHAVIOR, ORDERED_BEHAVIOR), name: "Tasks" },
    { ...makeBehavior("Microsoft.VSTS.Agile.EpicBacklogBehavior"), name: "Epics" }
];

export const lists: PickListModel[] = fake.helpers.distinct(3, makePickList, list => list.id, list => list.name);

export const fields: FieldModel[] = [
    { ...makeField("System.Title"), name: "Title" },
    { ...makeField("System.Description", FieldType.Html), name: "Description" },
    { ...makeField("Microsoft.VSTS.Common.Priority", FieldType.Integer), name: "Priority" },
    {
        ...makeField("Custom.Severity", FieldType.PicklistString),
        name: "Severity",
        pickList: makePickListMetadata(lists[0])
    }
];

export const workItemTypes: WorkItemTypeModel[] = [
    {
        ...makeWorkItemType("Microsoft.VSTS.WorkItemTypes.Epic", "Microsoft.VSTS.Agile.EpicBacklogBehavior"),
        name: "Epic",
        class: WorkItemTypeClass.System,
        icon: "icon_crown"
    },
    {
        ...makeWorkItemType("Microsoft.VSTS.WorkItemTypes.UserStory"),
        name: "User Story",
        class: WorkItemTypeClass.System,
        icon: "icon_book"
    },
    {
        ...makeWorkItemType("Microsoft.VSTS.WorkItemTypes.Task", TASK_BEHAVIOR),
        name: "Task",
        class: WorkItemTypeClass.System,
        icon: "icon_clipboard"
    },
    {
        ...makeWorkItemType("Custom.Bug"),
        name: "Bug",
        class: WorkItemTypeClass.Derived,
        icon: "icon_insect",
        inherits: "Microsoft.VSTS.WorkItemTypes.Bug"
    }
];

export const workItemTypeBehaviors: WorkItemTypeBehavior[] = workItemTypes.flatMap(type => type.behaviors);

export const states: WorkItemStateResultModel[] = workItemTypes.flatMap(type => type.states);

export const pages: Page[] = workItemTypes.flatMap(type => type.layout.pages);

export const groups: Group[] = pages.flatMap(page => page.sections.flatMap(section => section.groups));

export const controls: Control[] = groups.flatMap(group => group.controls);

export const workItemTypeFields: WorkItemTypeFieldModel2[] = [
    { ...makeWorkItemTypeField("System.Title"), name: "Title", required: true },
    { ...makeWorkItemTypeField("System.State"), name: "State", required: true, defaultValue: "New" },
    {
        ...makeWorkItemTypeField("Microsoft.VSTS.Common.Priority", FieldType.Integer),
        name: "Priority",
        defaultValue: 2
    },
    {
        ...makeWorkItemTypeField("Custom.Severity", FieldType.PicklistString),
        name: "Severity",
        pickList: makePickListMetadata(lists[0])
    }
];
