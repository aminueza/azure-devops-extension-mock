import { fake } from "../common/fixtures";
import { makeIdentityRef } from "../core/Data";
import {
    AccountRecentActivityWorkItemModel2,
    AccountRecentMentionWorkItemModel,
    AccountWorkWorkItemModel,
    AttachmentReference,
    CommentFormat,
    IdentityReference,
    ProjectWorkItemStateColors,
    ReportingWorkItemLinksBatch,
    ReportingWorkItemRevisionsBatch,
    WorkArtifactLink,
    WorkItem,
    WorkItemComment,
    WorkItemComments,
    WorkItemDelete,
    WorkItemIcon,
    WorkItemNextStateOnTransition,
    WorkItemRecentActivityType,
    WorkItemRelation,
    WorkItemRelationType,
    WorkItemTemplate,
    WorkItemType,
    WorkItemTypeCategory,
    WorkItemTypeColor,
    WorkItemTypeColorAndIcon,
    WorkItemTypeFieldWithReferences,
    WorkItemTypeTemplate,
    WorkItemQueryResult,
    WorkItemReference,
    WorkItemField,
    WorkItemClassificationNode,
    WorkItemUpdate,
    FieldType,
    FieldUsage,
    TreeNodeStructureType,
    QueryHierarchyItem,
    QueryType,
    QueryResultType,
    WorkItemStateColor
} from "azure-devops-extension-api/WorkItemTracking";

const states = ["New", "Active", "Resolved", "Closed", "Removed"];
const types = ["Bug", "Task", "User Story", "Feature", "Epic"];

export const makeWorkItemReference = (): WorkItemReference => ({
    id: fake.number.id(),
    url: fake.internet.url()
});

export const makeWorkItem = (id?: number): WorkItem => {
    const workItemId = id ?? fake.number.int({ min: 1, max: 10_000 });
    return {
        id: workItemId,
        rev: fake.number.int({ min: 1, max: 10 }),
        url: fake.internet.url(),
        fields: {
            "System.Id": workItemId,
            "System.Title": fake.lorem.sentence(),
            "System.State": fake.helpers.arrayElement(states),
            "System.WorkItemType": fake.helpers.arrayElement(types),
            "System.AssignedTo": {
                displayName: fake.person.fullName(),
                uniqueName: fake.internet.email(),
                id: fake.string.uuid()
            },
            "System.CreatedBy": fake.person.fullName(),
            "System.CreatedDate": fake.date.past().toISOString(),
            "System.ChangedDate": fake.date.recent().toISOString(),
            "System.AreaPath": `${fake.company.name()}\\Area`,
            "System.IterationPath": `${fake.company.name()}\\Sprint 1`,
            "System.TeamProject": fake.company.name(),
            "System.Tags": "",
            "System.Description": fake.lorem.paragraph()
        },
        relations: [],
        _links: {
            self: { href: fake.internet.url() },
            html: { href: fake.internet.url() },
            workItemType: { href: fake.internet.url() }
        } as any
    } as unknown as WorkItem;
};

export const makeWorkItemType = (name = "Bug"): WorkItemType => ({
    name,
    referenceName: `Microsoft.VSTS.WorkItemTypes.${name.replace(/\s/g, "")}`,
    description: fake.lorem.sentence(),
    color: fake.color.rgb({ format: "hex" }).slice(1),
    icon: {
        id: name.toLowerCase(),
        url: fake.internet.url()
    } as any,
    isDisabled: false,
    xmlForm: "",
    fields: [],
    fieldInstances: [],
    transitions: {},
    states: states.map(s => ({
        name: s,
        color: fake.color.rgb({ format: "hex" }).slice(1),
        category: s
    } as unknown as WorkItemStateColor)),
    url: fake.internet.url(),
    _links: {} as any
} as unknown as WorkItemType);

export const makeQuery = (id = fake.string.uuid()): QueryHierarchyItem => ({
    id,
    name: fake.lorem.words(3),
    path: `Shared Queries/${fake.lorem.word()}`,
    isFolder: false,
    isPublic: true,
    hasChildren: false,
    queryType: QueryType.Flat,
    wiql: "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project",
    url: fake.internet.url(),
    _links: {} as any
} as unknown as QueryHierarchyItem);

export const makeQueryResult = (): WorkItemQueryResult => ({
    queryType: QueryType.Flat,
    queryResultType: QueryResultType.WorkItem,
    asOf: fake.date.recent(),
    columns: [
        { referenceName: "System.Id", name: "ID", url: "" },
        { referenceName: "System.Title", name: "Title", url: "" },
        { referenceName: "System.State", name: "State", url: "" }
    ],
    sortColumns: [],
    workItems: Array.from({ length: 5 }, makeWorkItemReference),
    workItemRelations: []
} as unknown as WorkItemQueryResult);

export const makeWorkItemField = (referenceName: string, type: FieldType): WorkItemField => ({
    referenceName,
    name: referenceName.slice(referenceName.lastIndexOf(".") + 1),
    description: fake.lorem.sentence(),
    type,
    usage: FieldUsage.WorkItem,
    readOnly: false,
    canSortBy: true,
    isQueryable: true,
    isIdentity: type === FieldType.Identity,
    isPicklist: false,
    isPicklistSuggested: false,
    isDeleted: false,
    picklistId: "",
    supportedOperations: [
        { name: "=", referenceName: "SupportedOperations.Equals" },
        { name: "<>", referenceName: "SupportedOperations.NotEquals" }
    ],
    url: fake.internet.url(),
    _links: {}
});

export const makeAttachmentReference = (): AttachmentReference => ({
    id: fake.string.uuid(),
    url: fake.internet.url()
});

export const makeBuffer = (text: string): ArrayBuffer => {
    const encoded = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(buffer).set(encoded);
    return buffer;
};

export const makeIdentityReference = (): IdentityReference => ({
    ...makeIdentityRef(),
    name: fake.person.fullName()
});

export const makeWorkItemComment = (revision: number): WorkItemComment => {
    const text = fake.lorem.sentence();
    return {
        format: CommentFormat.Markdown,
        renderedText: `<p>${text}</p>`,
        revisedBy: makeIdentityReference(),
        revisedDate: fake.date.recent(),
        revision,
        text,
        url: fake.internet.url(),
        _links: {}
    };
};

export const makeWorkItemComments = (
    items: WorkItemComment[],
    fromRevisionCount: number,
    totalCount: number
): WorkItemComments => ({
    comments: items,
    count: items.length,
    fromRevisionCount,
    totalCount,
    url: fake.internet.url(),
    _links: {}
});

export const makeWorkItemUpdate = (id: number, workItemId: number): WorkItemUpdate => ({
    fields: {
        "System.State": { oldValue: states[0], newValue: states[1] },
        "System.ChangedDate": {
            oldValue: fake.date.past().toISOString(),
            newValue: fake.date.recent().toISOString()
        }
    },
    id,
    relations: { added: [], removed: [], updated: [] },
    rev: id + 1,
    revisedBy: makeIdentityReference(),
    revisedDate: fake.date.recent(),
    workItemId,
    url: fake.internet.url(),
    _links: {}
});

export const makeWorkItemDelete = (id: number): WorkItemDelete => ({
    code: 200,
    deletedBy: fake.person.fullName(),
    deletedDate: fake.date.recent().toISOString(),
    id,
    message: fake.lorem.sentence(),
    name: fake.lorem.sentence(),
    project: fake.company.name(),
    type: fake.helpers.arrayElement(types),
    url: fake.internet.url(),
    resource: makeWorkItem(id)
});

export const makeWorkItemTemplate = (id: string): WorkItemTemplate => ({
    id,
    name: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    workItemTypeName: fake.helpers.arrayElement(types),
    fields: {
        "System.Title": fake.lorem.sentence(),
        "System.Tags": fake.lorem.slug(2)
    },
    url: fake.internet.url(),
    _links: {}
});

let nodeId = 100;

export const makeClassificationNode = (
    name: string,
    structureType: TreeNodeStructureType
): WorkItemClassificationNode => ({
    id: nodeId++,
    identifier: fake.string.uuid(),
    name,
    path: `\\Contoso\\${name}`,
    structureType,
    hasChildren: false,
    children: [],
    attributes: {
        startDate: fake.date.recent(),
        finishDate: fake.date.future()
    },
    url: fake.internet.url(),
    _links: {}
});

export const makeWorkItemStateColor = (name: string): WorkItemStateColor => ({
    category: name,
    color: fake.color.rgb({ format: "hex" }).slice(1),
    name
});

export const makeWorkItemTypeCategory = (name: string): WorkItemTypeCategory => ({
    referenceName: `Microsoft.VSTS.WorkItemTypes.${name.replace(/\s/g, "")}Category`,
    name,
    defaultWorkItemType: makeWorkItemType("Bug"),
    workItemTypes: [makeWorkItemType("Bug")],
    url: fake.internet.url(),
    _links: {} as any
} as unknown as WorkItemTypeCategory);

export const makeWorkItemTypeColor = (workItemTypeName: string): WorkItemTypeColor => ({
    primaryColor: fake.color.rgb({ format: "hex" }).slice(1),
    secondaryColor: fake.color.rgb({ format: "hex" }).slice(1),
    workItemTypeName
});

export const makeWorkItemTypeColorAndIcon = (workItemTypeName: string): WorkItemTypeColorAndIcon => ({
    color: fake.color.rgb({ format: "hex" }).slice(1),
    icon: `icon_${workItemTypeName.toLowerCase().replace(/\s/g, "_")}`,
    isDisabled: false,
    workItemTypeName
});

export const makeProjectWorkItemStateColors = (projectName: string): ProjectWorkItemStateColors => ({
    projectName,
    workItemTypeStateColors: types.map(workItemTypeName => ({
        stateColors: states.map(makeWorkItemStateColor),
        workItemTypeName
    }))
});

export const makeWorkItemTypeFieldWithReferences = (
    referenceName: string
): WorkItemTypeFieldWithReferences => ({
    allowedValues: [...states],
    alwaysRequired: false,
    defaultValue: states[0],
    dependentFields: [],
    helpText: fake.lorem.sentence(),
    name: referenceName.slice(referenceName.lastIndexOf(".") + 1),
    referenceName,
    url: fake.internet.url()
});

export const makeWorkItemTypeTemplate = (
    type: string,
    exportGlobalLists: boolean
): WorkItemTypeTemplate => ({
    template: `<WITD type="${type}" globalLists="${exportGlobalLists}" />`
});

export const makeWorkItemIcon = (id: string): WorkItemIcon => ({
    id,
    url: fake.internet.url()
});

export const makeIconSvg = (icon: string, color: string): string =>
    `<svg role="img" data-icon="${icon}" fill="${color}"><title>${icon}</title></svg>`;

export const makeIconXaml = (icon: string, color: string): string =>
    `<Canvas Tag="${icon}"><Path Fill="${color}" Data="M0,0 L16,16 Z" /></Canvas>`;

export const makeWorkItemNextState = (
    id: number,
    action: string
): WorkItemNextStateOnTransition => ({
    errorCode: "",
    id,
    message: `Next state on ${action}`,
    stateOnTransition: fake.helpers.arrayElement(states)
});

export const makeWorkItemRelationType = (referenceName: string): WorkItemRelationType => ({
    name: referenceName.slice(referenceName.lastIndexOf(".") + 1),
    referenceName,
    attributes: { usage: "workItemLink", editable: true, enabled: true },
    url: fake.internet.url(),
    _links: {}
});

export const makeWorkItemRelation = (rel: string): WorkItemRelation => ({
    attributes: { isLocked: false, name: rel },
    rel,
    url: fake.internet.url()
});

export const makeWorkArtifactLink = (
    linkType: string,
    artifactType: string,
    toolType: string
): WorkArtifactLink => ({
    artifactType,
    linkType,
    toolType
});

export const makeAccountWorkItem = (id: number, state: string): AccountWorkWorkItemModel => ({
    assignedTo: fake.person.fullName(),
    changedDate: fake.date.recent(),
    id,
    state,
    teamProject: fake.company.name(),
    title: fake.lorem.sentence(),
    workItemType: fake.helpers.arrayElement(types)
});

export const makeAccountRecentActivity = (
    id: number,
    activityType: WorkItemRecentActivityType
): AccountRecentActivityWorkItemModel2 => ({
    activityDate: fake.date.recent(),
    activityType,
    assignedTo: makeIdentityRef(),
    changedDate: fake.date.recent(),
    id,
    identityId: fake.string.uuid(),
    state: fake.helpers.arrayElement(states),
    teamProject: fake.company.name(),
    title: fake.lorem.sentence(),
    workItemType: fake.helpers.arrayElement(types)
});

export const makeAccountRecentMention = (id: number): AccountRecentMentionWorkItemModel => ({
    assignedTo: fake.person.fullName(),
    id,
    mentionedDateField: fake.date.recent(),
    state: fake.helpers.arrayElement(states),
    teamProject: fake.company.name(),
    title: fake.lorem.sentence(),
    workItemType: fake.helpers.arrayElement(types)
});

export const makeLinksBatch = (
    values: WorkItemRelation[],
    isLastBatch: boolean,
    continuationToken: string
): ReportingWorkItemLinksBatch => ({
    continuationToken,
    isLastBatch,
    nextLink: fake.internet.url(),
    values
});

export const makeRevisionsBatch = (
    values: WorkItem[],
    isLastBatch: boolean,
    continuationToken: string
): ReportingWorkItemRevisionsBatch => ({
    continuationToken,
    isLastBatch,
    nextLink: fake.internet.url(),
    values
});

export const workItems: WorkItem[] = Array.from({ length: 10 }, () => makeWorkItem());
export const workItemTypes: WorkItemType[] = types.map(makeWorkItemType);
export const queries: QueryHierarchyItem[] = Array.from({ length: 3 }, () => makeQuery());
export const fields: WorkItemField[] = [
    makeWorkItemField("System.Id", FieldType.Integer),
    makeWorkItemField("System.Title", FieldType.String),
    makeWorkItemField("System.State", FieldType.String),
    makeWorkItemField("System.CreatedBy", FieldType.Identity),
    makeWorkItemField("System.CreatedDate", FieldType.DateTime),
    { ...makeWorkItemField("Custom.Retired", FieldType.String), isDeleted: true }
];
export const rootNodes: WorkItemClassificationNode[] = [
    {
        ...makeClassificationNode("Area", TreeNodeStructureType.Area),
        hasChildren: true,
        children: [
            makeClassificationNode("Web", TreeNodeStructureType.Area),
            makeClassificationNode("Api", TreeNodeStructureType.Area)
        ]
    },
    {
        ...makeClassificationNode("Iteration", TreeNodeStructureType.Iteration),
        hasChildren: true,
        children: [
            makeClassificationNode("Sprint 1", TreeNodeStructureType.Iteration),
            makeClassificationNode("Sprint 2", TreeNodeStructureType.Iteration)
        ]
    }
];
export const classificationNodes: WorkItemClassificationNode[] = rootNodes.flatMap(
    node => [node, ...node.children]
);
export const comments: WorkItemComment[] = Array.from(
    { length: 5 },
    (_value, index) => makeWorkItemComment(index + 1)
);
export const revisions: WorkItem[] = Array.from({ length: 5 }, (_value, index) => ({
    ...makeWorkItem(workItems[0].id),
    rev: index + 1
}));
export const updates: WorkItemUpdate[] = Array.from(
    { length: 4 },
    (_value, index) => makeWorkItemUpdate(index + 1, workItems[0].id)
);
export const deletedWorkItems: WorkItemDelete[] = Array.from(
    { length: 3 },
    (_value, index) => makeWorkItemDelete(20_001 + index)
);
export const templates: WorkItemTemplate[] = [
    { ...makeWorkItemTemplate(fake.string.uuid()), workItemTypeName: "Bug" },
    { ...makeWorkItemTemplate(fake.string.uuid()), workItemTypeName: "Task" },
    { ...makeWorkItemTemplate(fake.string.uuid()), workItemTypeName: "Bug" }
];
export const stateColors: WorkItemStateColor[] = states.map(makeWorkItemStateColor);
export const workItemIcons: WorkItemIcon[] = [
    "icon_book",
    "icon_bug",
    "icon_clipboard",
    "icon_code_review",
    "icon_test_plan"
].map(makeWorkItemIcon);
export const relationTypes: WorkItemRelationType[] = [
    "System.LinkTypes.Hierarchy-Forward",
    "System.LinkTypes.Hierarchy-Reverse",
    "System.LinkTypes.Related",
    "System.LinkTypes.Duplicate-Forward",
    "ArtifactLink"
].map(makeWorkItemRelationType);
export const workItemRelations: WorkItemRelation[] = relationTypes.map(
    type => makeWorkItemRelation(type.referenceName)
);
export const workArtifactLinkTypes: WorkArtifactLink[] = [
    makeWorkArtifactLink("Branch", "Branch", "Git"),
    makeWorkArtifactLink("Build", "Build", "Build"),
    makeWorkArtifactLink("Fixed in Commit", "Commit", "Git"),
    makeWorkArtifactLink("Pull Request", "PullRequestId", "Git")
];
export const typeFields: WorkItemTypeFieldWithReferences[] = [
    "System.Title",
    "System.State",
    "System.AssignedTo",
    "Microsoft.VSTS.Common.Priority"
].map(makeWorkItemTypeFieldWithReferences);
export const myWorkItems: AccountWorkWorkItemModel[] = [
    makeAccountWorkItem(30_001, "Active"),
    makeAccountWorkItem(30_002, "Closed"),
    makeAccountWorkItem(30_003, "New")
];
export const recentActivity: AccountRecentActivityWorkItemModel2[] = [
    makeAccountRecentActivity(31_001, WorkItemRecentActivityType.Visited),
    makeAccountRecentActivity(31_002, WorkItemRecentActivityType.Edited),
    makeAccountRecentActivity(31_003, WorkItemRecentActivityType.Restored)
];
export const recentMentions: AccountRecentMentionWorkItemModel[] = [
    makeAccountRecentMention(32_001),
    makeAccountRecentMention(32_002)
];
export const categories: WorkItemTypeCategory[] = types.map(t => ({
    referenceName: `Microsoft.VSTS.WorkItemTypes.${t.replace(/\s/g, "")}Category`,
    name: `${t} Category`,
    defaultWorkItemType: makeWorkItemType(t),
    workItemTypes: [makeWorkItemType(t)],
    url: fake.internet.url(),
    _links: {} as any
} as unknown as WorkItemTypeCategory));
