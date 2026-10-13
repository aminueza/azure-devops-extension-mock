import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    AssociatedWorkItem,
    TfvcBranch,
    TfvcBranchRef,
    TfvcChange,
    TfvcChangeset,
    TfvcChangesetRef,
    TfvcChangesetSearchCriteria,
    TfvcChangesetsRequestData,
    TfvcItem,
    TfvcItemRequestData,
    TfvcLabel,
    TfvcLabelRef,
    TfvcLabelRequestData,
    TfvcRestClient,
    TfvcShelveset,
    TfvcShelvesetRef,
    TfvcShelvesetRequestData,
    TfvcStatistics,
    TfvcVersionDescriptor,
    VersionControlRecursionType
} from "azure-devops-extension-api/Tfvc";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    branches,
    changes,
    changesets,
    items,
    labels,
    makeBranch,
    makeBuffer,
    makeChangeset,
    makeChangesetRef,
    makeItem,
    makeLabel,
    makeShelveset,
    shelvesets,
    statistics,
    workItems
} from "./Data";

const findBranch = (path: string): TfvcBranch => branches.find(b => b.path === path) ?? makeBranch(path);

const findChangeset = (id: number): TfvcChangeset =>
    changesets.find(c => c.changesetId === id) ?? { ...makeChangeset(), changesetId: id };

const findItem = (path: string): TfvcItem => items.find(i => i.path === path) ?? makeItem(path);

const findLabel = (labelId: string): TfvcLabel => {
    const id = Number(labelId);
    const fallback = Number.isInteger(id) ? { ...makeLabel(), id } : { ...makeLabel(), name: labelId };
    return labels.find(l => String(l.id) === labelId) ?? fallback;
};

const findShelveset = (shelvesetId: string): TfvcShelveset =>
    shelvesets.find(s => s.id === shelvesetId) ?? { ...makeShelveset(shelvesetId), id: shelvesetId };

const slicePage = <T>(source: T[], skip?: number, top?: number): T[] => {
    const start = skip ?? 0;
    return source.slice(start, start + (top ?? source.length));
};

export class MockTfvcRestClient extends RestClientBase {
    public TYPE = TfvcRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getBranch(
        path: string,
        _project?: string,
        _includeParent?: boolean,
        _includeChildren?: boolean
    ): Promise<TfvcBranch> {
        return Promise.resolve(findBranch(path));
    }

    getBranches(
        _project?: string,
        _includeParent?: boolean,
        _includeChildren?: boolean,
        includeDeleted?: boolean,
        _includeLinks?: boolean
    ): Promise<TfvcBranch[]> {
        return Promise.resolve(branches.filter(b => includeDeleted || !b.isDeleted));
    }

    getBranchRefs(
        scopePath: string,
        _project?: string,
        includeDeleted?: boolean,
        _includeLinks?: boolean
    ): Promise<TfvcBranchRef[]> {
        return Promise.resolve(
            branches.filter(b => b.path.startsWith(scopePath) && (includeDeleted || !b.isDeleted))
        );
    }

    getChangesetChanges(id?: number, skip?: number, top?: number): Promise<PagedList<TfvcChange>> {
        const source = changesets.find(c => c.changesetId === id)?.changes ?? changes;
        const start = skip ?? 0;
        const end = start + (top ?? source.length);
        const page: PagedList<TfvcChange> = Object.assign(source.slice(start, end), {
            continuationToken: end < source.length ? String(end) : null
        });
        return Promise.resolve(page);
    }

    createChangeset(changeset: TfvcChangeset, _project?: string): Promise<TfvcChangesetRef> {
        return Promise.resolve({ ...makeChangesetRef(), ...changeset });
    }

    getChangeset(
        id: number,
        _project?: string,
        _maxChangeCount?: number,
        _includeDetails?: boolean,
        _includeWorkItems?: boolean,
        _maxCommentLength?: number,
        _includeSourceRename?: boolean,
        _skip?: number,
        _top?: number,
        _orderby?: string,
        _searchCriteria?: TfvcChangesetSearchCriteria
    ): Promise<TfvcChangeset> {
        return Promise.resolve(findChangeset(id));
    }

    getChangesets(
        _project?: string,
        _maxCommentLength?: number,
        skip?: number,
        top?: number,
        _orderby?: string,
        _searchCriteria?: TfvcChangesetSearchCriteria
    ): Promise<TfvcChangesetRef[]> {
        return Promise.resolve(slicePage(changesets, skip, top));
    }

    getBatchedChangesets(changesetsRequestData: TfvcChangesetsRequestData): Promise<TfvcChangesetRef[]> {
        return Promise.resolve(changesetsRequestData.changesetIds.map(findChangeset));
    }

    getChangesetWorkItems(id?: number): Promise<AssociatedWorkItem[]> {
        return Promise.resolve(changesets.find(c => c.changesetId === id)?.workItems ?? workItems);
    }

    getItemsBatch(itemRequestData: TfvcItemRequestData, _project?: string): Promise<TfvcItem[][]> {
        return Promise.resolve(itemRequestData.itemDescriptors.map(d => [findItem(d.path)]));
    }

    getItemsBatchZip(itemRequestData: TfvcItemRequestData, _project?: string): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(itemRequestData.itemDescriptors.map(d => d.path).join("\n")));
    }

    getItem(
        path: string,
        _project?: string,
        _fileName?: string,
        _download?: boolean,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _versionDescriptor?: TfvcVersionDescriptor,
        _includeContent?: boolean
    ): Promise<TfvcItem> {
        return Promise.resolve(findItem(path));
    }

    getItemContent(
        path: string,
        _project?: string,
        _fileName?: string,
        _download?: boolean,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _versionDescriptor?: TfvcVersionDescriptor,
        _includeContent?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(findItem(path).content));
    }

    getItems(
        _project?: string,
        scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _includeLinks?: boolean,
        _versionDescriptor?: TfvcVersionDescriptor
    ): Promise<TfvcItem[]> {
        const scope = scopePath ?? "$/";
        return Promise.resolve(items.filter(i => i.path.startsWith(scope)));
    }

    getItemText(
        path: string,
        _project?: string,
        _fileName?: string,
        _download?: boolean,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _versionDescriptor?: TfvcVersionDescriptor,
        _includeContent?: boolean
    ): Promise<string> {
        return Promise.resolve(findItem(path).content);
    }

    getItemZip(
        path: string,
        _project?: string,
        _fileName?: string,
        _download?: boolean,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _versionDescriptor?: TfvcVersionDescriptor,
        _includeContent?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(findItem(path).content));
    }

    getLabelItems(labelId: string, top?: number, skip?: number): Promise<TfvcItem[]> {
        return Promise.resolve(slicePage(findLabel(labelId).items, skip, top));
    }

    getLabel(labelId: string, _requestData: TfvcLabelRequestData, _project?: string): Promise<TfvcLabel> {
        return Promise.resolve(findLabel(labelId));
    }

    getLabels(
        _requestData: TfvcLabelRequestData,
        _project?: string,
        top?: number,
        skip?: number
    ): Promise<TfvcLabelRef[]> {
        return Promise.resolve(slicePage(labels, skip, top));
    }

    getShelvesetChanges(shelvesetId: string, top?: number, skip?: number): Promise<TfvcChange[]> {
        return Promise.resolve(slicePage(findShelveset(shelvesetId).changes, skip, top));
    }

    getShelveset(shelvesetId: string, _requestData?: TfvcShelvesetRequestData): Promise<TfvcShelveset> {
        return Promise.resolve(findShelveset(shelvesetId));
    }

    getShelvesets(
        _requestData?: TfvcShelvesetRequestData,
        top?: number,
        skip?: number
    ): Promise<TfvcShelvesetRef[]> {
        return Promise.resolve(slicePage(shelvesets, skip, top));
    }

    getShelvesetWorkItems(shelvesetId: string): Promise<AssociatedWorkItem[]> {
        return Promise.resolve(findShelveset(shelvesetId).workItems);
    }

    getTfvcStatistics(_project?: string, _scopePath?: string): Promise<TfvcStatistics> {
        return Promise.resolve(statistics);
    }
}
