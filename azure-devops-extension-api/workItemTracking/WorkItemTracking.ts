import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    WorkItemTrackingRestClient,
    AccountMyWorkResult,
    AccountRecentActivityWorkItemModel2,
    AccountRecentMentionWorkItemModel,
    ArtifactUriQuery,
    ArtifactUriQueryResult,
    AttachmentReference,
    CommentSortOrder,
    ProjectWorkItemStateColors,
    ProvisioningResult,
    QueryOption,
    ReportingRevisionsExpand,
    ReportingWorkItemLinksBatch,
    ReportingWorkItemRevisionsBatch,
    ReportingWorkItemRevisionsFilter,
    SendMailBody,
    WorkArtifactLink,
    WorkItemBatchGetRequest,
    WorkItemIcon,
    WorkItemNextStateOnTransition,
    WorkItemReference,
    WorkItemRelationType,
    WorkItemStateColor,
    WorkItemTypeColor,
    WorkItemTypeColorAndIcon,
    WorkItemTypeFieldsExpandLevel,
    WorkItemTypeFieldWithReferences,
    WorkItemTypeTemplate,
    WorkItemTypeTemplateUpdateModel,
    WorkItem,
    WorkItemComment,
    WorkItemComments,
    WorkItemDelete,
    WorkItemDeleteReference,
    WorkItemDeleteShallowReference,
    WorkItemDeleteUpdate,
    WorkItemExpand,
    WorkItemTemplate,
    WorkItemTemplateReference,
    WorkItemType,
    WorkItemTypeCategory,
    WorkItemQueryResult,
    WorkItemField,
    WorkItemClassificationNode,
    WorkItemUpdate,
    FieldType,
    UpdateWorkItemField,
    GetFieldsExpand,
    TreeStructureGroup,
    TreeNodeStructureType,
    ClassificationNodesErrorPolicy,
    QueryHierarchyItem,
    QueryHierarchyItemsResult,
    QueryBatchGetRequest,
    QueryExpand,
    Wiql
} from "azure-devops-extension-api/WorkItemTracking";
import {
    categories,
    classificationNodes,
    comments,
    deletedWorkItems,
    fields,
    makeAttachmentReference,
    makeBuffer,
    makeClassificationNode,
    makeIconSvg,
    makeIconXaml,
    makeLinksBatch,
    makeProjectWorkItemStateColors,
    makeQueryResult,
    makeQuery,
    makeRevisionsBatch,
    makeWorkItem,
    makeWorkItemComment,
    makeWorkItemComments,
    makeWorkItemDelete,
    makeWorkItemField,
    makeWorkItemIcon,
    makeWorkItemNextState,
    makeWorkItemReference,
    makeWorkItemRelationType,
    makeWorkItemTemplate,
    makeWorkItemType,
    makeWorkItemTypeCategory,
    makeWorkItemTypeColor,
    makeWorkItemTypeColorAndIcon,
    makeWorkItemTypeFieldWithReferences,
    makeWorkItemTypeTemplate,
    makeWorkItemUpdate,
    myWorkItems,
    queries,
    recentActivity,
    recentMentions,
    relationTypes,
    revisions,
    rootNodes,
    stateColors,
    templates,
    typeFields,
    updates,
    workArtifactLinkTypes,
    workItemIcons,
    workItemRelations,
    workItems,
    workItemTypes
} from "./Data";

export class MockWorkItemTrackingRestClient extends RestClientBase {
    public TYPE = WorkItemTrackingRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

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
        const workItemFields: Record<string, any> = { ...wi.fields, "System.WorkItemType": type };
        for (const op of document ?? []) {
            if (op.op === "add" && typeof op.path === "string" && op.path.startsWith("/fields/")) {
                workItemFields[op.path.replace("/fields/", "")] = op.value;
            }
        }
        return Promise.resolve({ ...wi, fields: workItemFields } as WorkItem);
    }

    updateWorkItem(
        document: any,
        id: number,
        _project?: string
    ): Promise<WorkItem> {
        const existing = workItems.find(w => w.id === id) ?? makeWorkItem(id);
        const workItemFields: Record<string, any> = { ...existing.fields };
        for (const op of document ?? []) {
            if ((op.op === "add" || op.op === "replace") && typeof op.path === "string" && op.path.startsWith("/fields/")) {
                workItemFields[op.path.replace("/fields/", "")] = op.value;
            }
        }
        return Promise.resolve({ ...existing, fields: workItemFields, rev: (existing.rev ?? 0) + 1 });
    }

    deleteWorkItem(_id: number, _project?: string): Promise<any> {
        return Promise.resolve({ id: _id, deleted: true });
    }

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

    createField(workItemField: WorkItemField, _project?: string): Promise<WorkItemField> {
        const base = makeWorkItemField(workItemField.referenceName, workItemField.type);
        return Promise.resolve({ ...base, ...workItemField });
    }

    deleteField(_fieldNameOrRefName: string, _project?: string): Promise<void> {
        return Promise.resolve();
    }

    getField(fieldNameOrRefName: string, _project?: string): Promise<WorkItemField> {
        const found = fields.find(
            f => f.referenceName === fieldNameOrRefName || f.name === fieldNameOrRefName
        );
        return Promise.resolve(found ?? makeWorkItemField(fieldNameOrRefName, FieldType.String));
    }

    getFields(_project?: string, expand?: GetFieldsExpand): Promise<WorkItemField[]> {
        if (expand === GetFieldsExpand.IncludeDeleted) {
            return Promise.resolve(fields);
        }
        return Promise.resolve(fields.filter(f => !f.isDeleted));
    }

    updateField(
        payload: UpdateWorkItemField,
        fieldNameOrRefName: string,
        project?: string
    ): Promise<WorkItemField> {
        return this.getField(fieldNameOrRefName, project).then(field => ({
            ...field,
            isDeleted: payload.isDeleted
        }));
    }

    createOrUpdateClassificationNode(
        postedNode: WorkItemClassificationNode,
        _project: string,
        structureGroup: TreeStructureGroup,
        path?: string
    ): Promise<WorkItemClassificationNode> {
        const structureType = structureGroup === TreeStructureGroup.Areas
            ? TreeNodeStructureType.Area
            : TreeNodeStructureType.Iteration;
        const base = makeClassificationNode(postedNode.name, structureType);
        return Promise.resolve({ ...base, ...postedNode, structureType });
    }

    deleteClassificationNode(
        _project: string,
        _structureGroup: TreeStructureGroup,
        _path?: string,
        _reclassifyId?: number
    ): Promise<void> {
        return Promise.resolve();
    }

    getClassificationNode(
        _project: string,
        structureGroup: TreeStructureGroup,
        path?: string,
        _depth?: number
    ): Promise<WorkItemClassificationNode> {
        const structureType = structureGroup === TreeStructureGroup.Areas
            ? TreeNodeStructureType.Area
            : TreeNodeStructureType.Iteration;
        const scoped = classificationNodes.filter(node => node.structureType === structureType);
        const found = scoped.find(node => node.path === path || node.name === path);
        return Promise.resolve(found ?? makeClassificationNode(path ?? "Root", structureType));
    }

    getClassificationNodes(
        _project: string,
        ids: number[],
        _depth?: number,
        _errorPolicy?: ClassificationNodesErrorPolicy
    ): Promise<WorkItemClassificationNode[]> {
        return Promise.resolve(ids.map(id => {
            const found = classificationNodes.find(node => node.id === id);
            return found ?? { ...makeClassificationNode("Fabricated", TreeNodeStructureType.Area), id };
        }));
    }

    getRootNodes(_project: string, depth?: number): Promise<WorkItemClassificationNode[]> {
        if (!depth) {
            return Promise.resolve(rootNodes.map(node => ({ ...node, children: [] })));
        }
        return Promise.resolve(rootNodes);
    }

    updateClassificationNode(
        postedNode: WorkItemClassificationNode,
        project: string,
        structureGroup: TreeStructureGroup,
        path?: string
    ): Promise<WorkItemClassificationNode> {
        return this.createOrUpdateClassificationNode(postedNode, project, structureGroup, path);
    }

    createQuery(
        postedQuery: QueryHierarchyItem,
        _project: string,
        query: string,
        _validateWiqlOnly?: boolean
    ): Promise<QueryHierarchyItem> {
        return Promise.resolve({
            ...makeQuery(),
            ...postedQuery,
            path: `${query}/${postedQuery.name}`
        });
    }

    deleteQuery(_project: string, _query: string): Promise<void> {
        return Promise.resolve();
    }

    getQueriesBatch(
        queryGetRequest: QueryBatchGetRequest,
        _project: string
    ): Promise<QueryHierarchyItem[]> {
        return Promise.resolve(queryGetRequest.ids.map(id => {
            const found = queries.find(q => q.id === id);
            return found ?? makeQuery(id);
        }));
    }

    getQueryResultCount(
        _id: string,
        _project?: string,
        _team?: string,
        _timePrecision?: boolean,
        top?: number
    ): Promise<number> {
        const total = makeQueryResult().workItems.length;
        return Promise.resolve(top === undefined ? total : Math.min(total, top));
    }

    searchQueries(
        _project: string,
        filter: string,
        top?: number,
        _expand?: QueryExpand,
        _includeDeleted?: boolean
    ): Promise<QueryHierarchyItemsResult> {
        const matched = queries.filter(q => q.name.includes(filter) || q.path.includes(filter));
        const limit = top ?? matched.length;
        return Promise.resolve({
            count: Math.min(matched.length, limit),
            hasMore: matched.length > limit,
            value: matched.slice(0, limit)
        });
    }

    updateQuery(
        queryUpdate: QueryHierarchyItem,
        _project: string,
        query: string,
        _undeleteDescendants?: boolean
    ): Promise<QueryHierarchyItem> {
        const found = queries.find(q => q.id === query || q.path === query || q.name === query);
        return Promise.resolve({ ...(found ?? makeQuery(query)), ...queryUpdate });
    }

    createAttachment(
        _content: any,
        _project?: string,
        _fileName?: string,
        _uploadType?: string,
        _areaPath?: string
    ): Promise<AttachmentReference> {
        return Promise.resolve(makeAttachmentReference());
    }

    getAttachmentContent(
        id: string,
        _project?: string,
        _fileName?: string,
        _download?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(id));
    }

    getAttachmentZip(
        id: string,
        _project?: string,
        _fileName?: string,
        _download?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`${id}.zip`));
    }

    getComment(_id: number, revision: number, _project?: string): Promise<WorkItemComment> {
        const found = comments.find(c => c.revision === revision);
        return Promise.resolve(found ?? makeWorkItemComment(revision));
    }

    getComments(
        _id: number,
        _project?: string,
        fromRevision?: number,
        top?: number,
        order?: CommentSortOrder
    ): Promise<WorkItemComments> {
        const from = fromRevision ?? 0;
        const matched = comments.filter(c => c.revision >= from);
        const ordered = order === CommentSortOrder.Desc ? [...matched].reverse() : matched;
        const limited = top === undefined ? ordered : ordered.slice(0, top);
        return Promise.resolve(makeWorkItemComments(limited, matched.length, comments.length));
    }

    getRevision(
        id: number,
        revisionNumber: number,
        _project?: string,
        _expand?: WorkItemExpand
    ): Promise<WorkItem> {
        const found = revisions.find(r => r.id === id && r.rev === revisionNumber);
        return Promise.resolve(found ?? { ...makeWorkItem(id), rev: revisionNumber });
    }

    getRevisions(
        id: number,
        _project?: string,
        top?: number,
        skip?: number,
        _expand?: WorkItemExpand
    ): Promise<WorkItem[]> {
        const matched = revisions.filter(r => r.id === id);
        const source = matched.length > 0 ? matched : [makeWorkItem(id)];
        const start = skip ?? 0;
        const end = top === undefined ? source.length : start + top;
        return Promise.resolve(source.slice(start, end));
    }

    getUpdate(id: number, updateNumber: number, _project?: string): Promise<WorkItemUpdate> {
        const found = updates.find(u => u.workItemId === id && u.id === updateNumber);
        return Promise.resolve(found ?? makeWorkItemUpdate(updateNumber, id));
    }

    getUpdates(
        id: number,
        _project?: string,
        top?: number,
        skip?: number
    ): Promise<WorkItemUpdate[]> {
        const matched = updates.filter(u => u.workItemId === id);
        const source = matched.length > 0 ? matched : [makeWorkItemUpdate(1, id)];
        const start = skip ?? 0;
        const end = top === undefined ? source.length : start + top;
        return Promise.resolve(source.slice(start, end));
    }

    getDeletedWorkItem(id: number, _project?: string): Promise<WorkItemDelete> {
        const found = deletedWorkItems.find(d => d.id === id);
        return Promise.resolve(found ?? makeWorkItemDelete(id));
    }

    getDeletedWorkItemShallowReferences(
        _project?: string
    ): Promise<WorkItemDeleteShallowReference[]> {
        return Promise.resolve(deletedWorkItems.map(d => ({ id: d.id, url: d.url })));
    }

    getDeletedWorkItems(ids: number[], _project?: string): Promise<WorkItemDeleteReference[]> {
        return Promise.resolve(ids.map(id => {
            const found = deletedWorkItems.find(d => d.id === id);
            return found ?? makeWorkItemDelete(id);
        }));
    }

    destroyWorkItem(_id: number, _project?: string): Promise<void> {
        return Promise.resolve();
    }

    restoreWorkItem(
        payload: WorkItemDeleteUpdate,
        id: number,
        project?: string
    ): Promise<WorkItemDelete> {
        return this.getDeletedWorkItem(id, project).then(deleted => ({
            ...deleted,
            resource: {
                ...deleted.resource,
                fields: { ...deleted.resource.fields, "System.IsDeleted": payload.isDeleted }
            }
        }));
    }

    createTemplate(
        template: WorkItemTemplate,
        _project: string,
        _team: string
    ): Promise<WorkItemTemplate> {
        return Promise.resolve({ ...makeWorkItemTemplate(template.id), ...template });
    }

    deleteTemplate(_project: string, _team: string, _templateId: string): Promise<void> {
        return Promise.resolve();
    }

    getTemplate(
        _project: string,
        _team: string,
        templateId: string
    ): Promise<WorkItemTemplate> {
        const found = templates.find(t => t.id === templateId);
        return Promise.resolve(found ?? makeWorkItemTemplate(templateId));
    }

    getTemplates(
        _project: string,
        _team: string,
        workitemtypename?: string
    ): Promise<WorkItemTemplateReference[]> {
        if (workitemtypename === undefined) {
            return Promise.resolve(templates);
        }
        return Promise.resolve(templates.filter(t => t.workItemTypeName === workitemtypename));
    }

    replaceTemplate(
        templateContent: WorkItemTemplate,
        project: string,
        team: string,
        templateId: string
    ): Promise<WorkItemTemplate> {
        return this.getTemplate(project, team, templateId).then(existing => ({
            ...existing,
            ...templateContent,
            id: templateId
        }));
    }

    getWorkItemTemplate(
        _project: string,
        type: string,
        fields?: string,
        _asOf?: Date,
        _expand?: WorkItemExpand
    ): Promise<WorkItem> {
        const template = makeWorkItem();
        const all: Record<string, any> = { ...template.fields, "System.WorkItemType": type };
        if (fields === undefined) {
            return Promise.resolve({ ...template, fields: all });
        }
        const picked: Record<string, any> = {};
        for (const name of fields.split(",")) {
            picked[name] = all[name];
        }
        return Promise.resolve({ ...template, fields: picked });
    }

    exportWorkItemTypeDefinition(
        _project?: string,
        type?: string,
        exportGlobalLists?: boolean
    ): Promise<WorkItemTypeTemplate> {
        return Promise.resolve(makeWorkItemTypeTemplate(type ?? "Bug", exportGlobalLists ?? false));
    }

    updateWorkItemTypeDefinition(
        updateModel: WorkItemTypeTemplateUpdateModel,
        _project?: string
    ): Promise<ProvisioningResult> {
        return Promise.resolve({
            provisioningImportEvents: [
                `actionType:${updateModel.actionType}`,
                `templateType:${updateModel.templateType}`,
                `methodology:${updateModel.methodology}`
            ]
        });
    }

    getWorkItemTypeCategory(_project: string, category: string): Promise<WorkItemTypeCategory> {
        const found = categories.find(
            c => c.name === category || c.referenceName === category
        );
        return Promise.resolve(found ?? makeWorkItemTypeCategory(category));
    }

    getWorkItemTypeColors(
        projectNames: string[]
    ): Promise<{ key: string; value: WorkItemTypeColor[] }[]> {
        return Promise.resolve(projectNames.map(key => ({
            key,
            value: workItemTypes.map(type => makeWorkItemTypeColor(type.name))
        })));
    }

    getWorkItemTypeColorAndIcons(
        projectNames: string[]
    ): Promise<{ key: string; value: WorkItemTypeColorAndIcon[] }[]> {
        return Promise.resolve(projectNames.map(key => ({
            key,
            value: workItemTypes.map(type => makeWorkItemTypeColorAndIcon(type.name))
        })));
    }

    getWorkItemTypeFieldsWithReferences(
        _project: string,
        _type: string,
        expand?: WorkItemTypeFieldsExpandLevel
    ): Promise<WorkItemTypeFieldWithReferences[]> {
        if (expand === WorkItemTypeFieldsExpandLevel.None) {
            return Promise.resolve(typeFields.map(field => ({
                ...field,
                allowedValues: [],
                dependentFields: []
            })));
        }
        return Promise.resolve(typeFields);
    }

    getWorkItemTypeFieldWithReferences(
        project: string,
        type: string,
        field: string,
        expand?: WorkItemTypeFieldsExpandLevel
    ): Promise<WorkItemTypeFieldWithReferences> {
        return this.getWorkItemTypeFieldsWithReferences(project, type, expand).then(all => {
            const found = all.find(f => f.referenceName === field || f.name === field);
            return found ?? makeWorkItemTypeFieldWithReferences(field);
        });
    }

    getWorkItemTypeStates(_project: string, _type: string): Promise<WorkItemStateColor[]> {
        return Promise.resolve(stateColors);
    }

    getWorkItemIconJson(icon: string, _color?: string, _v?: number): Promise<WorkItemIcon> {
        const found = workItemIcons.find(i => i.id === icon);
        return Promise.resolve(found ?? makeWorkItemIcon(icon));
    }

    getWorkItemIconSvg(icon: string, color?: string, _v?: number): Promise<any> {
        return Promise.resolve(makeIconSvg(icon, color ?? "000000"));
    }

    getWorkItemIconXaml(icon: string, color?: string, _v?: number): Promise<any> {
        return Promise.resolve(makeIconXaml(icon, color ?? "000000"));
    }

    getWorkItemIcons(): Promise<WorkItemIcon[]> {
        return Promise.resolve(workItemIcons);
    }

    getWorkItemNextStatesOnCheckinAction(
        ids: number[],
        action?: string
    ): Promise<WorkItemNextStateOnTransition[]> {
        return Promise.resolve(ids.map(id => makeWorkItemNextState(id, action ?? "checkin")));
    }

    getWorkItemStateColors(projectNames: string[]): Promise<ProjectWorkItemStateColors[]> {
        return Promise.resolve(projectNames.map(makeProjectWorkItemStateColors));
    }

    getWorkItemsBatch(
        workItemGetRequest: WorkItemBatchGetRequest,
        _project?: string
    ): Promise<WorkItem[]> {
        return Promise.resolve(workItemGetRequest.ids.map(id => makeWorkItem(id)));
    }

    getRelationType(relation: string): Promise<WorkItemRelationType> {
        const found = relationTypes.find(
            t => t.referenceName === relation || t.name === relation
        );
        return Promise.resolve(found ?? makeWorkItemRelationType(relation));
    }

    getRelationTypes(): Promise<WorkItemRelationType[]> {
        return Promise.resolve(relationTypes);
    }

    getWorkArtifactLinkTypes(): Promise<WorkArtifactLink[]> {
        return Promise.resolve(workArtifactLinkTypes);
    }

    queryWorkItemsForArtifactUris(
        artifactUriQuery: ArtifactUriQuery,
        _project?: string
    ): Promise<ArtifactUriQueryResult> {
        const matches: { [key: string]: WorkItemReference[] } = {};
        for (const uri of artifactUriQuery.artifactUris) {
            matches[uri] = [makeWorkItemReference()];
        }
        return Promise.resolve({ artifactUrisQueryResult: matches });
    }

    getReportingLinksByLinkType(
        _project?: string,
        linkTypes?: string[],
        _types?: string[],
        continuationToken?: string,
        _startDateTime?: Date
    ): Promise<ReportingWorkItemLinksBatch> {
        const values = linkTypes === undefined
            ? workItemRelations
            : workItemRelations.filter(relation => linkTypes.includes(relation.rel));
        return Promise.resolve(makeLinksBatch(values, true, continuationToken ?? "links-1"));
    }

    readReportingRevisionsGet(
        _project?: string,
        _fields?: string[],
        _types?: string[],
        continuationToken?: string,
        _startDateTime?: Date,
        _includeIdentityRef?: boolean,
        _includeDeleted?: boolean,
        _includeTagRef?: boolean,
        includeLatestOnly?: boolean,
        _expand?: ReportingRevisionsExpand,
        _includeDiscussionChangesOnly?: boolean,
        maxPageSize?: number
    ): Promise<ReportingWorkItemRevisionsBatch> {
        const source = includeLatestOnly ? revisions.slice(-1) : revisions;
        const values = maxPageSize === undefined ? source : source.slice(0, maxPageSize);
        return Promise.resolve(makeRevisionsBatch(
            values,
            values.length === source.length,
            continuationToken ?? "revisions-1"
        ));
    }

    readReportingRevisionsPost(
        filter: ReportingWorkItemRevisionsFilter,
        project?: string,
        continuationToken?: string,
        startDateTime?: Date,
        expand?: ReportingRevisionsExpand
    ): Promise<ReportingWorkItemRevisionsBatch> {
        return this.readReportingRevisionsGet(
            project,
            filter.fields,
            filter.types,
            continuationToken,
            startDateTime,
            filter.includeIdentityRef,
            filter.includeDeleted,
            filter.includeTagRef,
            filter.includeLatestOnly,
            expand
        );
    }

    getAccountMyWorkData(queryOption?: QueryOption): Promise<AccountMyWorkResult> {
        const workItemDetails = queryOption === QueryOption.Done
            ? myWorkItems.filter(item => item.state === "Closed")
            : myWorkItems;
        return Promise.resolve({ querySizeLimitExceeded: false, workItemDetails });
    }

    getRecentActivityData(): Promise<AccountRecentActivityWorkItemModel2[]> {
        return Promise.resolve(recentActivity);
    }

    getRecentMentions(): Promise<AccountRecentMentionWorkItemModel[]> {
        return Promise.resolve(recentMentions);
    }

    sendMail(_body: SendMailBody, _project?: string): Promise<void> {
        return Promise.resolve();
    }
}
