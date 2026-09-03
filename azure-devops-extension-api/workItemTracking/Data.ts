import { fake } from "../common/fixtures";
import {
    WorkItem,
    WorkItemType,
    WorkItemTypeCategory,
    WorkItemQueryResult,
    WorkItemReference,
    QueryHierarchyItem,
    QueryType,
    QueryResultType,
    WorkItemStateColor
} from "azure-devops-extension-api/WorkItemTracking";

const states = ["New", "Active", "Resolved", "Closed", "Removed"];
const types = ["Bug", "Task", "User Story", "Feature", "Epic"];

export const makeWorkItemReference = (): WorkItemReference => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
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

export const workItems: WorkItem[] = Array.from({ length: 10 }, () => makeWorkItem());
export const workItemTypes: WorkItemType[] = types.map(makeWorkItemType);
export const queries: QueryHierarchyItem[] = Array.from({ length: 3 }, () => makeQuery());
export const categories: WorkItemTypeCategory[] = types.map(t => ({
    referenceName: `Microsoft.VSTS.WorkItemTypes.${t.replace(/\s/g, "")}Category`,
    name: `${t} Category`,
    defaultWorkItemType: makeWorkItemType(t),
    workItemTypes: [makeWorkItemType(t)],
    url: fake.internet.url(),
    _links: {} as any
} as unknown as WorkItemTypeCategory));
