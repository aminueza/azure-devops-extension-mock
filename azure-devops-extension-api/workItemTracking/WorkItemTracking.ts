import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    WorkItemTrackingRestClient,
    WorkItem,
    WorkItemType,
    WorkItemTypeCategory,
    WorkItemQueryResult,
    QueryHierarchyItem,
    Wiql
} from "azure-devops-extension-api/WorkItemTracking";
import {
    categories,
    makeQueryResult,
    makeQuery,
    makeWorkItem,
    makeWorkItemType,
    queries,
    workItems,
    workItemTypes
} from "./Data";

/**
 * Mocked WorkItemTrackingRestClient — work items, queries, types, and WIQL.
 */
export class MockWorkItemTrackingRestClient extends RestClientBase {
    public TYPE = WorkItemTrackingRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    // Work items
    getWorkItems(
        ids: number[],
        _project?: string,
        _fields?: string[]
    ): Promise<WorkItem[]> {
        return Promise.resolve(ids.map(id => makeWorkItem(id)));
    }

    getWorkItem(id: number): Promise<WorkItem> {
        const found = workItems.find(w => w.id === id);
        return Promise.resolve(found ?? makeWorkItem(id));
    }

    createWorkItem(
        document: any,
        _project: string,
        type: string
    ): Promise<WorkItem> {
        const wi = makeWorkItem();
        const fields: Record<string, any> = { ...wi.fields, "System.WorkItemType": type };
        for (const op of document ?? []) {
            if (op.op === "add" && typeof op.path === "string" && op.path.startsWith("/fields/")) {
                fields[op.path.replace("/fields/", "")] = op.value;
            }
        }
        return Promise.resolve({ ...wi, fields } as WorkItem);
    }

    updateWorkItem(
        document: any,
        id: number,
        _project?: string
    ): Promise<WorkItem> {
        const existing = workItems.find(w => w.id === id) ?? makeWorkItem(id);
        const fields: Record<string, any> = { ...existing.fields };
        for (const op of document ?? []) {
            if ((op.op === "add" || op.op === "replace") && typeof op.path === "string" && op.path.startsWith("/fields/")) {
                fields[op.path.replace("/fields/", "")] = op.value;
            }
        }
        return Promise.resolve({ ...existing, fields, rev: (existing.rev ?? 0) + 1 });
    }

    deleteWorkItem(_id: number, _project?: string): Promise<any> {
        return Promise.resolve({ id: _id, deleted: true });
    }

    // Types
    getWorkItemTypes(_project: string): Promise<WorkItemType[]> {
        return Promise.resolve(workItemTypes);
    }

    getWorkItemType(_project: string, type: string): Promise<WorkItemType> {
        const found = workItemTypes.find(t => t.name === type || t.referenceName === type);
        return Promise.resolve(found ?? makeWorkItemType(type));
    }

    getWorkItemTypeCategories(_project: string): Promise<WorkItemTypeCategory[]> {
        return Promise.resolve(categories);
    }

    // Queries
    getQueries(_project: string): Promise<QueryHierarchyItem[]> {
        return Promise.resolve(queries);
    }

    getQuery(_project: string, query: string): Promise<QueryHierarchyItem> {
        const found = queries.find(q => q.id === query || q.path === query || q.name === query);
        return Promise.resolve(found ?? makeQuery(query));
    }

    queryById(_id: string, _project?: string): Promise<WorkItemQueryResult> {
        return Promise.resolve(makeQueryResult());
    }

    queryByWiql(_wiql: Wiql, _project?: string): Promise<WorkItemQueryResult> {
        return Promise.resolve(makeQueryResult());
    }
}
