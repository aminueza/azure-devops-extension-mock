import { faker } from "@faker-js/faker";
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
    id: faker.number.int({ min: 1, max: 10_000 }),
    url: faker.internet.url()
});

export const makeWorkItem = (id?: number): WorkItem => {
    const workItemId = id ?? faker.number.int({ min: 1, max: 10_000 });
    return {
        id: workItemId,
        rev: faker.number.int({ min: 1, max: 10 }),
        url: faker.internet.url(),
        fields: {
            "System.Id": workItemId,
            "System.Title": faker.lorem.sentence(),
            "System.State": faker.helpers.arrayElement(states),
            "System.WorkItemType": faker.helpers.arrayElement(types),
            "System.AssignedTo": {
                displayName: faker.person.fullName(),
                uniqueName: faker.internet.email(),
                id: faker.string.uuid()
            },
            "System.CreatedBy": faker.person.fullName(),
            "System.CreatedDate": faker.date.past().toISOString(),
            "System.ChangedDate": faker.date.recent().toISOString(),
            "System.AreaPath": `${faker.company.name()}\\Area`,
            "System.IterationPath": `${faker.company.name()}\\Sprint 1`,
            "System.TeamProject": faker.company.name(),
            "System.Tags": "",
            "System.Description": faker.lorem.paragraph()
        },
        relations: [],
        _links: {
            self: { href: faker.internet.url() },
            html: { href: faker.internet.url() },
            workItemType: { href: faker.internet.url() }
        } as any
    } as unknown as WorkItem;
};

export const makeWorkItemType = (name = "Bug"): WorkItemType => ({
    name,
    referenceName: `Microsoft.VSTS.WorkItemTypes.${name.replace(/\s/g, "")}`,
    description: faker.lorem.sentence(),
    color: faker.color.rgb({ format: "hex" }).slice(1),
    icon: {
        id: name.toLowerCase(),
        url: faker.internet.url()
    } as any,
    isDisabled: false,
    xmlForm: "",
    fields: [],
    fieldInstances: [],
    transitions: {},
    states: states.map(s => ({
        name: s,
        color: faker.color.rgb({ format: "hex" }).slice(1),
        category: s
    } as unknown as WorkItemStateColor)),
    url: faker.internet.url(),
    _links: {} as any
} as unknown as WorkItemType);

export const makeQuery = (id = faker.string.uuid()): QueryHierarchyItem => ({
    id,
    name: faker.lorem.words(3),
    path: `Shared Queries/${faker.lorem.word()}`,
    isFolder: false,
    isPublic: true,
    hasChildren: false,
    queryType: QueryType.Flat,
    wiql: "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project",
    url: faker.internet.url(),
    _links: {} as any
} as unknown as QueryHierarchyItem);

export const makeQueryResult = (): WorkItemQueryResult => ({
    queryType: QueryType.Flat,
    queryResultType: QueryResultType.WorkItem,
    asOf: faker.date.recent(),
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
    url: faker.internet.url(),
    _links: {} as any
} as unknown as WorkItemTypeCategory));
