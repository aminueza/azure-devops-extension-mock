import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import { forget, freshId, remember, stateful, stored } from "../common/state";
import {
    AdvSecEnablementStatus,
    AdvSecEnablementUpdate,
    Attachment,
    BillableCommitter,
    BillableCommitterDetail,
    BillablePusher,
    GitRefFavorite,
    GitRestClient,
    GitRepository,
    GitPullRequest,
    GitPullRequestCommentThread,
    GitBlobRef,
    GitCommit,
    GitCommitRef,
    GitBranchStats,
    GitRef,
    GitItem,
    GitPush,
    Comment,
    CommentThreadStatus,
    GitConflictUpdateResult,
    GitPullRequestSearchCriteria,
    GetAccessibleRepositoriesRequest,
    GetAccessibleRepositoriesResponse,
    GitAsyncOperationStatus,
    GitAsyncRefOperationParameters,
    GitCherryPick,
    GitRevert,
    GitDeletedRepository,
    GitForkSyncRequest,
    GitForkSyncRequestParameters,
    GitImportRequest,
    GitQueryBranchStatsCriteria,
    GitRecycleBinRepositoryDetails,
    GitRefUpdate,
    GitRefUpdateResult,
    GitRepositoryRef,
    GitSuggestion,
    GitTreeRef,
    GitAnnotatedTag,
    GitBaseVersionDescriptor,
    GitCommitChanges,
    GitCommitDiffs,
    GitConflict,
    GitItemRequestData,
    GitMerge,
    GitMergeParameters,
    GitPullRequestFilesDiff,
    GitPullRequestIteration,
    GitPullRequestIterationChanges,
    GitPullRequestQuery,
    GitPullRequestQueryType,
    GitPullRequestStatus,
    GitResolutionStatus,
    IterationReason,
    GitStatus,
    GitStatusState,
    GitTargetVersionDescriptor,
    GitVersionDescriptor,
    IdentityRefWithVote,
    ShareNotificationContext,
    FileDiff,
    FileDiffsCriteria,
    VersionControlChangeType,
    VersionControlRecursionType
} from "azure-devops-extension-api/Git";
import { WebApiCreateTagRequestData, WebApiTagDefinition } from "azure-devops-extension-api/Core";
import {
    IdentityRef,
    JsonPatchDocument,
    JsonPatchOperation,
    PagedList,
    ResourceRef
} from "azure-devops-extension-api/WebApi";
import {
    annotatedTags,
    billableCommitterDetails,
    billableCommitters,
    billablePushers,
    branches,
    changes,
    cherryPickConflicts,
    cherryPicks,
    commits,
    commitStatuses,
    deletedRepositories,
    enablementStatuses,
    forks,
    forkSyncRequests,
    importRequests,
    items,
    likedComments,
    likingUser,
    makeAnnotatedTag,
    makeAttachment,
    makeBranchStats,
    makeCherryPick,
    makeComment,
    makeCommentThread,
    makeCommit,
    makeCommitDiffs,
    makeDeletedRepository,
    makeEnablementStatus,
    makeConflictUpdateResult,
    makeFileDiff,
    makeForkSyncRequest,
    makeGitCommit,
    makeGitConflict,
    makeGitItem,
    makeGitMerge,
    makeGitRef,
    makeGitRepository,
    makeGitRepositoryRef,
    makeGitStatus,
    makeImportRequest,
    makeIdentityRefWithVote,
    makeItemText,
    makePullRequest,
    makePullRequestIteration,
    makePullRequestLabel,
    makePullRequestStatus,
    makePullRequestThread,
    makePush,
    makeRefFavorite,
    makeRefUpdateResult,
    makeRevert,
    makeTreeArchive,
    makeTreeRef,
    merges,
    pullRequestAttachments,
    pullRequestConflicts,
    pullRequestFileDiffDetails,
    pullRequestIterationStatuses,
    pullRequestIterations,
    pullRequestLabels,
    pullRequestProperties,
    pullRequestReviewers,
    pullRequestStatuses,
    pullRequestThreads,
    pullRequestWorkItemRefs,
    pullRequests,
    refFavorites,
    refs,
    repositories,
    revertConflicts,
    reverts,
    suggestions,
    trees
} from "./Data";

const patchOperations = (patchDocument: JsonPatchDocument): JsonPatchOperation[] =>
    Array.isArray(patchDocument) ? patchDocument : [];

const patchTarget = (operation: JsonPatchOperation): string => operation.path.replace(/^\//, "");

const applyPropertyPatch = (base: Record<string, unknown>, patchDocument: JsonPatchDocument): Record<string, unknown> =>
    patchOperations(patchDocument).reduce(
        (properties, operation) => ({
            ...properties,
            [patchTarget(operation)]: operation.value
        }),
        { ...base }
    );

const removeOperation = 1;
const deletedObjectId = /^0+$/;
const allRepositoriesId = "ffffffff-ffff-ffff-ffff-ffffffffffff";

const removedIds = (patchDocument: JsonPatchDocument): number[] =>
    patchOperations(patchDocument)
        .filter(operation => operation.op === removeOperation)
        .map(operation => Number(patchTarget(operation)));

const upsert = <T>(list: T[], item: T, same: (existing: T) => boolean): T[] =>
    list.some(same) ? list.map(existing => (same(existing) ? item : existing)) : [...list, item];

const rewriteComments = (threadId: number, change: (comments: Comment[]) => Comment[]): void => {
    const thread = pullRequestThreads.find(item => item.id === threadId);
    if (thread) {
        remember(pullRequestThreads, { ...thread, comments: change(thread.comments) }, item => item.id === threadId);
    }
};

const nextCommentId = (threadId: number): number => {
    const thread = pullRequestThreads.find(item => item.id === threadId);
    return stateful.isEnabled() && thread ? Math.max(0, ...thread.comments.map(comment => comment.id)) + 1 : 1;
};

const applyRefUpdate = (update: GitRefUpdate): void => {
    if (!stateful.isEnabled()) {
        return;
    }
    if (deletedObjectId.test(update.newObjectId)) {
        forget(refs, ref => ref.name === update.name);
        return;
    }
    const found = refs.find(ref => ref.name === update.name);
    remember(
        refs,
        { ...(found ?? makeGitRef(update.name)), objectId: update.newObjectId },
        ref => ref.name === update.name
    );
};

const resolveConflicts = (source: GitConflict[], conflictUpdates: GitConflict[]): GitConflictUpdateResult[] =>
    conflictUpdates.map(update => {
        const result = makeConflictUpdateResult(update);
        remember(source, result.updatedConflict, conflict => conflict.conflictId === update.conflictId);
        return result;
    });

const applyEnablementUpdate = (update: AdvSecEnablementUpdate): void => {
    if (!stateful.isEnabled()) {
        return;
    }
    const everyRepository = update.repositoryId.toLowerCase() === allRepositoriesId;
    const matched = enablementStatuses.filter(
        status =>
            status.projectId === update.projectId && (everyRepository || status.repositoryId === update.repositoryId)
    );
    const targets =
        matched.length > 0 ? matched : [makeEnablementStatus(update.projectId, update.repositoryId, update.newStatus)];
    targets.forEach(target =>
        remember(
            enablementStatuses,
            {
                ...target,
                dependabotEnabled: update.newDependabotStatus,
                dependencyScanningInjectionEnabled: update.newDependencyScanningInjectionEnablementStatus,
                enabled: update.newStatus
            },
            status => status.projectId === target.projectId && status.repositoryId === target.repositoryId
        )
    );
};

const createdCherryPickId = 6011;
const createdRevertId = 6111;
const createdAttachmentId = 6411;

const filterConflicts = (source: GitConflict[], excludeResolved?: boolean, onlyResolved?: boolean): GitConflict[] => {
    if (onlyResolved) {
        return source.filter(c => c.resolutionStatus === GitResolutionStatus.Resolved);
    }
    if (excludeResolved) {
        return source.filter(c => c.resolutionStatus !== GitResolutionStatus.Resolved);
    }
    return source;
};

const conflictPage = (
    source: GitConflict[],
    continuationToken?: string,
    top?: number,
    excludeResolved?: boolean,
    onlyResolved?: boolean
): PagedList<GitConflict> => {
    const start = continuationToken ? Number(continuationToken) : 0;
    const end = start + (top ?? source.length);
    const selected = filterConflicts(source.slice(start, end), excludeResolved, onlyResolved);
    const page: PagedList<GitConflict> = Object.assign(selected, {
        continuationToken: end < source.length ? String(end) : null
    });
    return page;
};

export class MockGitRestClient extends RestClientBase {
    public TYPE = GitRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getRepositories(_project?: string): Promise<GitRepository[]> {
        return Promise.resolve(repositories);
    }

    getRepository(repositoryId: string): Promise<GitRepository> {
        const found = repositories.find(r => r.id === repositoryId || r.name === repositoryId);
        return Promise.resolve(found ?? { ...makeGitRepository(), id: repositoryId });
    }

    createRepository(gitRepositoryToCreate: GitRepository, _project?: string): Promise<GitRepository> {
        const created = { ...makeGitRepository(), ...gitRepositoryToCreate };
        return Promise.resolve(remember(repositories, created, r => r.id === created.id));
    }

    deleteRepository(repositoryId: string, _project?: string): Promise<void> {
        const found = repositories.find(r => r.id === repositoryId);
        if (found && stateful.isEnabled()) {
            remember(
                deletedRepositories,
                { ...makeDeletedRepository(), id: found.id, name: found.name, project: found.project },
                r => r.id === repositoryId
            );
            forget(repositories, r => r.id === repositoryId);
        }
        return Promise.resolve();
    }

    updateRepository(
        newRepositoryInfo: GitRepository,
        repositoryId: string,
        _project?: string
    ): Promise<GitRepository> {
        return Promise.resolve(
            remember(
                repositories,
                {
                    ...stored(repositories, r => r.id === repositoryId, makeGitRepository),
                    ...newRepositoryInfo,
                    id: repositoryId
                },
                r => r.id === repositoryId
            )
        );
    }

    getRefs(_repositoryId: string, _project?: string, filter?: string): Promise<PagedList<GitRef>> {
        if (!filter) return Promise.resolve(refs);
        const page: PagedList<GitRef> = Object.assign(
            refs.filter(r => r.name.includes(filter)),
            { continuationToken: null }
        );
        return Promise.resolve(page);
    }

    updateRef(): Promise<GitRef> {
        return Promise.resolve(makeGitRef());
    }

    getBranches(_repositoryId: string, _project?: string): Promise<GitBranchStats[]> {
        return Promise.resolve(branches);
    }

    getBranch(_repositoryId: string, name: string): Promise<GitBranchStats> {
        const found = branches.find(b => b.name === name);
        return Promise.resolve(found ?? makeBranchStats(name));
    }

    getCommits(_repositoryId: string): Promise<GitCommitRef[]> {
        return Promise.resolve(commits);
    }

    getCommit(commitId: string): Promise<GitCommit> {
        const found = commits.find(c => c.commitId === commitId);
        return Promise.resolve(found ?? { ...makeGitCommit(), commitId });
    }

    getCommitsBatch(): Promise<GitCommitRef[]> {
        return Promise.resolve(commits);
    }

    getItems(_repositoryId: string, _project?: string): Promise<GitItem[]> {
        return Promise.resolve(items);
    }

    getItem(_repositoryId: string, path: string): Promise<GitItem> {
        const found = items.find(i => i.path === path);
        return Promise.resolve(found ?? makeGitItem(path));
    }

    getItemContent(_repositoryId: string, _path: string): Promise<ArrayBuffer> {
        return Promise.resolve(new ArrayBuffer(0));
    }

    getBlob(_repositoryId: string, sha1: string): Promise<GitBlobRef> {
        return Promise.resolve({ _links: {}, objectId: sha1, size: 0, url: "" });
    }

    getPushes(_repositoryId: string): Promise<GitPush[]> {
        return Promise.resolve([makePush(), makePush()]);
    }

    getPush(_repositoryId: string, pushId: number): Promise<GitPush> {
        return Promise.resolve({ ...makePush(), pushId });
    }

    createPush(push: GitPush): Promise<GitPush> {
        return Promise.resolve({ ...makePush(), ...push });
    }

    getPullRequests(_repositoryId: string, _searchCriteria?: GitPullRequestSearchCriteria): Promise<GitPullRequest[]> {
        return Promise.resolve(pullRequests);
    }

    getPullRequestsByProject(
        _project: string,
        _searchCriteria?: GitPullRequestSearchCriteria
    ): Promise<GitPullRequest[]> {
        return Promise.resolve(pullRequests);
    }

    getPullRequest(_repositoryId: string, pullRequestId: number): Promise<GitPullRequest> {
        const found = pullRequests.find(p => p.pullRequestId === pullRequestId);
        return Promise.resolve(found ?? { ...makePullRequest(), pullRequestId });
    }

    getPullRequestById(pullRequestId: number): Promise<GitPullRequest> {
        return this.getPullRequest("", pullRequestId);
    }

    createPullRequest(gitPullRequestToCreate: GitPullRequest, _repositoryId: string): Promise<GitPullRequest> {
        const drawn = makePullRequest();
        const created = {
            ...drawn,
            ...gitPullRequestToCreate,
            pullRequestId: gitPullRequestToCreate.pullRequestId ?? freshId(drawn.pullRequestId)
        };
        return Promise.resolve(remember(pullRequests, created, p => p.pullRequestId === created.pullRequestId));
    }

    updatePullRequest(
        gitPullRequestToUpdate: GitPullRequest,
        _repositoryId: string,
        pullRequestId: number
    ): Promise<GitPullRequest> {
        return Promise.resolve(
            remember(
                pullRequests,
                {
                    ...stored(pullRequests, p => p.pullRequestId === pullRequestId, makePullRequest),
                    ...gitPullRequestToUpdate,
                    pullRequestId
                },
                p => p.pullRequestId === pullRequestId
            )
        );
    }

    getThreads(_repositoryId: string, _pullRequestId: number): Promise<GitPullRequestCommentThread[]> {
        return Promise.resolve([makeCommentThread()]);
    }

    createThread(
        commentThread: GitPullRequestCommentThread,
        _repositoryId: string,
        _pullRequestId: number
    ): Promise<GitPullRequestCommentThread> {
        const created = { ...makeCommentThread(), ...commentThread };
        return Promise.resolve(remember(pullRequestThreads, created, thread => thread.id === created.id));
    }

    createComment(comment: Comment, _repositoryId: string, _pullRequestId: number, threadId: number): Promise<Comment> {
        const created = { ...comment, id: comment.id ?? nextCommentId(threadId) };
        rewriteComments(threadId, comments => upsert(comments, created, item => item.id === created.id));
        return Promise.resolve(created);
    }

    getAccessibleRepositories(request: GetAccessibleRepositoriesRequest): Promise<GetAccessibleRepositoriesResponse> {
        const known = new Set(repositories.map(r => r.id));
        return Promise.resolve({
            accessibleRepositoryIds: request.repositoryIds.filter(id => known.has(id))
        });
    }

    getRepositoriesPaged(
        _projectId: string,
        _includeLinks?: boolean,
        _includeAllUrls?: boolean,
        _includeHidden?: boolean,
        filterContains?: string,
        top?: number,
        continuationToken?: string
    ): Promise<PagedList<GitRepository>> {
        const filtered = filterContains ? repositories.filter(r => r.name.includes(filterContains)) : repositories;
        const start = continuationToken ? Number(continuationToken) : 0;
        const end = start + (top ?? filtered.length);
        const page: PagedList<GitRepository> = Object.assign(filtered.slice(start, end), {
            continuationToken: end < filtered.length ? String(end) : null
        });
        return Promise.resolve(page);
    }

    getRepositoryWithParent(repositoryId: string, includeParent: boolean, _project?: string): Promise<GitRepository> {
        const found = repositories.find(r => r.id === repositoryId);
        const repository = found ?? { ...makeGitRepository(), id: repositoryId };
        if (!includeParent) return Promise.resolve(repository);
        return Promise.resolve({ ...repository, parentRepository: makeGitRepositoryRef() });
    }

    getDeletedRepositories(_project: string): Promise<GitDeletedRepository[]> {
        return Promise.resolve(deletedRepositories);
    }

    getRecycleBinRepositories(_project: string): Promise<GitDeletedRepository[]> {
        return Promise.resolve(deletedRepositories);
    }

    deleteRepositoryFromRecycleBin(_project: string, repositoryId: string): Promise<void> {
        forget(deletedRepositories, r => r.id === repositoryId);
        return Promise.resolve();
    }

    restoreRepositoryFromRecycleBin(
        repositoryDetails: GitRecycleBinRepositoryDetails,
        _project: string,
        repositoryId: string
    ): Promise<GitRepository> {
        const found = deletedRepositories.find(r => r.id === repositoryId);
        const restored = {
            ...makeGitRepository(),
            id: repositoryId,
            isDisabled: repositoryDetails.deleted
        };
        const repository = found ? { ...restored, name: found.name, project: found.project } : restored;
        if (!repositoryDetails.deleted) {
            forget(deletedRepositories, r => r.id === repositoryId);
            remember(repositories, repository, r => r.id === repositoryId);
        }
        return Promise.resolve(repository);
    }

    createForkSyncRequest(
        syncParams: GitForkSyncRequestParameters,
        _repositoryNameOrId: string,
        _project?: string,
        _includeLinks?: boolean
    ): Promise<GitForkSyncRequest> {
        const drawn = makeForkSyncRequest();
        const created = {
            ...drawn,
            operationId: freshId(drawn.operationId),
            ...syncParams,
            status: GitAsyncOperationStatus.Queued
        };
        return Promise.resolve(remember(forkSyncRequests, created, r => r.operationId === created.operationId));
    }

    getForkSyncRequest(
        _repositoryNameOrId: string,
        forkSyncOperationId: number,
        _project?: string,
        _includeLinks?: boolean
    ): Promise<GitForkSyncRequest> {
        const found = forkSyncRequests.find(r => r.operationId === forkSyncOperationId);
        return Promise.resolve(found ?? { ...makeForkSyncRequest(), operationId: forkSyncOperationId });
    }

    getForkSyncRequests(
        _repositoryNameOrId: string,
        _project?: string,
        includeAbandoned?: boolean,
        _includeLinks?: boolean
    ): Promise<GitForkSyncRequest[]> {
        if (includeAbandoned) return Promise.resolve(forkSyncRequests);
        return Promise.resolve(forkSyncRequests.filter(r => r.status !== GitAsyncOperationStatus.Abandoned));
    }

    getForks(
        _repositoryNameOrId: string,
        collectionId: string,
        _project?: string,
        _includeLinks?: boolean
    ): Promise<GitRepositoryRef[]> {
        return Promise.resolve(forks.map(f => ({ ...f, collection: { ...f.collection, id: collectionId } })));
    }

    createImportRequest(
        importRequest: GitImportRequest,
        _project: string,
        repositoryId: string
    ): Promise<GitImportRequest> {
        const drawn = makeImportRequest();
        const created = {
            ...drawn,
            ...importRequest,
            importRequestId: importRequest.importRequestId ?? freshId(drawn.importRequestId),
            repository: { ...makeGitRepository(), id: repositoryId },
            status: GitAsyncOperationStatus.Queued
        };
        return Promise.resolve(remember(importRequests, created, r => r.importRequestId === created.importRequestId));
    }

    getImportRequest(_project: string, _repositoryId: string, importRequestId: number): Promise<GitImportRequest> {
        const found = importRequests.find(r => r.importRequestId === importRequestId);
        return Promise.resolve(found ?? { ...makeImportRequest(), importRequestId });
    }

    queryImportRequests(
        _project: string,
        _repositoryId: string,
        includeAbandoned?: boolean
    ): Promise<GitImportRequest[]> {
        if (includeAbandoned) return Promise.resolve(importRequests);
        return Promise.resolve(importRequests.filter(r => r.status !== GitAsyncOperationStatus.Abandoned));
    }

    updateImportRequest(
        importRequestToUpdate: GitImportRequest,
        _project: string,
        _repositoryId: string,
        importRequestId: number
    ): Promise<GitImportRequest> {
        return Promise.resolve(
            remember(
                importRequests,
                {
                    ...stored(importRequests, r => r.importRequestId === importRequestId, makeImportRequest),
                    ...importRequestToUpdate,
                    importRequestId
                },
                r => r.importRequestId === importRequestId
            )
        );
    }

    getPermission(_projectName?: string, repositoryId?: string, _permission?: string): Promise<boolean> {
        if (!repositoryId) return Promise.resolve(true);
        return Promise.resolve(repositories.some(r => r.id === repositoryId));
    }

    getSuggestions(_repositoryId: string, _project?: string, preferCompareBranch?: boolean): Promise<GitSuggestion[]> {
        if (!preferCompareBranch) return Promise.resolve(suggestions);
        return Promise.resolve(suggestions.slice(0, 1));
    }

    getBranchStatsBatch(
        searchCriteria: GitQueryBranchStatsCriteria,
        _repositoryId: string,
        _project?: string
    ): Promise<GitBranchStats[]> {
        return Promise.resolve(searchCriteria.targetCommits.map(target => makeBranchStats(target.version)));
    }

    updateRefs(
        refUpdates: GitRefUpdate[],
        repositoryId: string,
        _project?: string,
        _projectId?: string
    ): Promise<GitRefUpdateResult[]> {
        return Promise.resolve(
            refUpdates.map(update => {
                applyRefUpdate(update);
                return makeRefUpdateResult({ ...update, repositoryId });
            })
        );
    }

    getTree(
        _repositoryId: string,
        sha1: string,
        _project?: string,
        _projectId?: string,
        recursive?: boolean,
        fileName?: string
    ): Promise<GitTreeRef> {
        const found = trees.find(t => t.objectId === sha1);
        const tree = found ?? { ...makeTreeRef(), objectId: sha1 };
        if (!recursive) return Promise.resolve({ ...tree, treeEntries: tree.treeEntries.slice(0, 1) });
        if (!fileName) return Promise.resolve(tree);
        return Promise.resolve({
            ...tree,
            treeEntries: tree.treeEntries.map(entry => ({ ...entry, relativePath: fileName }))
        });
    }

    getTreeZip(
        _repositoryId: string,
        sha1: string,
        _project?: string,
        _projectId?: string,
        _recursive?: boolean,
        _fileName?: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(sha1));
    }

    getItemText(
        _repositoryId: string,
        path: string,
        _project?: string,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _includeContentMetadata?: boolean,
        _latestProcessedChange?: boolean,
        _download?: boolean,
        _versionDescriptor?: GitVersionDescriptor,
        _includeContent?: boolean,
        _resolveLfs?: boolean,
        _sanitize?: boolean
    ): Promise<string> {
        const found = items.find(i => i.path === path);
        return Promise.resolve(makeItemText(found ?? makeGitItem(path)));
    }

    getItemZip(
        _repositoryId: string,
        path: string,
        _project?: string,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _includeContentMetadata?: boolean,
        _latestProcessedChange?: boolean,
        _download?: boolean,
        _versionDescriptor?: GitVersionDescriptor,
        _includeContent?: boolean,
        _resolveLfs?: boolean,
        _sanitize?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(path));
    }

    getItemsBatch(requestData: GitItemRequestData, _repositoryId: string, _project?: string): Promise<GitItem[][]> {
        return Promise.resolve(
            requestData.itemDescriptors.map(descriptor => {
                const matched = items.filter(i => i.path.startsWith(descriptor.path));
                return matched.length > 0 ? matched : [makeGitItem(descriptor.path)];
            })
        );
    }

    getBlobContent(
        _repositoryId: string,
        sha1: string,
        _project?: string,
        _download?: boolean,
        _fileName?: string,
        _resolveLfs?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(sha1));
    }

    getBlobZip(
        _repositoryId: string,
        sha1: string,
        _project?: string,
        _download?: boolean,
        _fileName?: string,
        _resolveLfs?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(sha1));
    }

    getBlobsZip(blobIds: string[], _repositoryId: string, _project?: string, _filename?: string): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(blobIds.join(",")));
    }

    getHfsItem(
        _repositoryId: string,
        path: string,
        _project?: string,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _includeContentMetadata?: boolean,
        _latestProcessedChange?: boolean,
        _download?: boolean,
        _versionDescriptor?: GitVersionDescriptor,
        _includeContent?: boolean,
        _resolveHfs?: boolean,
        _sanitize?: boolean
    ): Promise<GitItem> {
        const found = items.find(i => i.path === path);
        return Promise.resolve(found ?? makeGitItem(path));
    }

    getHfsItemContent(
        _repositoryId: string,
        path: string,
        _project?: string,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _includeContentMetadata?: boolean,
        _latestProcessedChange?: boolean,
        _download?: boolean,
        _versionDescriptor?: GitVersionDescriptor,
        _includeContent?: boolean,
        _resolveHfs?: boolean,
        _sanitize?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(path));
    }

    getHfsItemText(
        repositoryId: string,
        path: string,
        project?: string,
        scopePath?: string,
        recursionLevel?: VersionControlRecursionType,
        includeContentMetadata?: boolean,
        latestProcessedChange?: boolean,
        download?: boolean,
        versionDescriptor?: GitVersionDescriptor,
        includeContent?: boolean,
        resolveHfs?: boolean,
        sanitize?: boolean
    ): Promise<string> {
        return this.getHfsItem(
            repositoryId,
            path,
            project,
            scopePath,
            recursionLevel,
            includeContentMetadata,
            latestProcessedChange,
            download,
            versionDescriptor,
            includeContent,
            resolveHfs,
            sanitize
        ).then(makeItemText);
    }

    getHfsItemZip(
        _repositoryId: string,
        path: string,
        _project?: string,
        _scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _includeContentMetadata?: boolean,
        _latestProcessedChange?: boolean,
        _download?: boolean,
        _versionDescriptor?: GitVersionDescriptor,
        _includeContent?: boolean,
        _resolveHfs?: boolean,
        _sanitize?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(path));
    }

    getHfsItems(
        _repositoryId: string,
        _project?: string,
        scopePath?: string,
        _recursionLevel?: VersionControlRecursionType,
        _includeContentMetadata?: boolean,
        _latestProcessedChange?: boolean,
        _download?: boolean,
        _includeLinks?: boolean,
        _versionDescriptor?: GitVersionDescriptor,
        _zipForUnix?: boolean
    ): Promise<GitItem[]> {
        if (!scopePath) return Promise.resolve(items);
        return Promise.resolve(items.filter(i => i.path.startsWith(scopePath)));
    }

    getChanges(
        commitId: string,
        _repositoryId: string,
        _project?: string,
        top?: number,
        skip?: number
    ): Promise<GitCommitChanges> {
        const start = skip ?? 0;
        const page = changes.slice(start, start + (top ?? changes.length));
        return Promise.resolve({
            changeCounts: { [VersionControlChangeType.Edit]: page.length },
            changes: page.map(change => ({ ...change, item: { ...change.item, commitId } }))
        });
    }

    getCommitDiffs(
        _repositoryId: string,
        _project?: string,
        diffCommonCommit?: boolean,
        top?: number,
        skip?: number,
        baseVersionDescriptor?: GitBaseVersionDescriptor,
        targetVersionDescriptor?: GitTargetVersionDescriptor
    ): Promise<GitCommitDiffs> {
        const start = skip ?? 0;
        const page = changes.slice(start, start + (top ?? changes.length));
        const diffs = makeCommitDiffs(
            baseVersionDescriptor?.version ?? "main",
            targetVersionDescriptor?.version ?? "develop"
        );
        return Promise.resolve({
            ...diffs,
            allChangesIncluded: page.length === changes.length,
            changes: page,
            commonCommit: diffCommonCommit ? diffs.baseCommit : diffs.commonCommit
        });
    }

    getFileDiffs(fileDiffsCriteria: FileDiffsCriteria, _project: string, _repositoryId: string): Promise<FileDiff[]> {
        return Promise.resolve(fileDiffsCriteria.fileDiffParams.map(makeFileDiff));
    }

    getMergeBases(
        _repositoryNameOrId: string,
        commitId: string,
        otherCommitId: string,
        _project?: string,
        _otherCollectionId?: string,
        _otherRepositoryId?: string
    ): Promise<GitCommitRef[]> {
        return Promise.resolve(commits.filter(c => c.commitId !== commitId && c.commitId !== otherCommitId));
    }

    createMergeRequest(
        mergeParameters: GitMergeParameters,
        _project: string,
        repositoryNameOrId: string,
        includeLinks?: boolean
    ): Promise<GitMerge> {
        const drawn = makeGitMerge(mergeParameters.comment);
        const created = {
            ...drawn,
            mergeOperationId: freshId(drawn.mergeOperationId),
            ...mergeParameters,
            status: GitAsyncOperationStatus.Queued,
            _links: includeLinks ? { repository: { href: repositoryNameOrId } } : {}
        };
        return Promise.resolve(remember(merges, created, m => m.mergeOperationId === created.mergeOperationId));
    }

    getMergeRequest(
        project: string,
        repositoryNameOrId: string,
        mergeOperationId: number,
        includeLinks?: boolean
    ): Promise<GitMerge> {
        const found = merges.find(m => m.mergeOperationId === mergeOperationId);
        const merge = found ?? {
            ...makeGitMerge(`merge into ${repositoryNameOrId}`),
            mergeOperationId
        };
        if (!includeLinks) return Promise.resolve(merge);
        return Promise.resolve({ ...merge, _links: { project: { href: project } } });
    }

    getPushCommits(
        _repositoryId: string,
        _pushId: number,
        _project?: string,
        top?: number,
        skip?: number,
        _includeLinks?: boolean
    ): Promise<GitCommitRef[]> {
        const start = skip ?? 0;
        return Promise.resolve(commits.slice(start, start + (top ?? commits.length)));
    }

    createAnnotatedTag(tagObject: GitAnnotatedTag, _project: string, _repositoryId: string): Promise<GitAnnotatedTag> {
        const created = { ...makeAnnotatedTag(tagObject.name), ...tagObject };
        return Promise.resolve(remember(annotatedTags, created, t => t.objectId === created.objectId));
    }

    getAnnotatedTag(_project: string, _repositoryId: string, objectId: string): Promise<GitAnnotatedTag> {
        const found = annotatedTags.find(t => t.objectId === objectId);
        return Promise.resolve(found ?? { ...makeAnnotatedTag("v0.0.0"), objectId });
    }

    getStatuses(
        _commitId: string,
        _repositoryId: string,
        _project?: string,
        top?: number,
        skip?: number,
        latestOnly?: boolean
    ): Promise<GitStatus[]> {
        const start = skip ?? 0;
        const page = commitStatuses.slice(start, start + (top ?? commitStatuses.length));
        if (!latestOnly) return Promise.resolve(page);
        return Promise.resolve(page.slice(0, 1));
    }

    createCommitStatus(
        gitCommitStatusToCreate: GitStatus,
        _commitId: string,
        _repositoryId: string,
        _project?: string
    ): Promise<GitStatus> {
        const created = {
            ...makeGitStatus(gitCommitStatusToCreate.id, GitStatusState.Pending),
            ...gitCommitStatusToCreate
        };
        return Promise.resolve(remember(commitStatuses, created, s => s.id === created.id));
    }

    getPullRequestReviewers(
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<IdentityRefWithVote[]> {
        return Promise.resolve(pullRequestReviewers);
    }

    getPullRequestReviewer(
        _repositoryId: string,
        _pullRequestId: number,
        reviewerId: string,
        _project?: string
    ): Promise<IdentityRefWithVote> {
        const found = pullRequestReviewers.find(r => r.id === reviewerId);
        return Promise.resolve(found ?? makeIdentityRefWithVote(reviewerId, 0));
    }

    createPullRequestReviewer(
        reviewer: IdentityRefWithVote,
        _repositoryId: string,
        _pullRequestId: number,
        reviewerId: string,
        _project?: string
    ): Promise<IdentityRefWithVote> {
        return Promise.resolve(
            remember(
                pullRequestReviewers,
                {
                    ...makeIdentityRefWithVote(reviewerId, 0),
                    ...reviewer,
                    id: reviewerId
                },
                r => r.id === reviewerId
            )
        );
    }

    createPullRequestReviewers(
        reviewers: IdentityRef[],
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<IdentityRefWithVote[]> {
        return Promise.resolve(
            reviewers.map(reviewer =>
                remember(
                    pullRequestReviewers,
                    {
                        ...makeIdentityRefWithVote(reviewer.id, 0),
                        ...reviewer
                    },
                    r => r.id === reviewer.id
                )
            )
        );
    }

    createUnmaterializedPullRequestReviewer(
        reviewer: IdentityRefWithVote,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<IdentityRefWithVote> {
        return Promise.resolve(
            remember(
                pullRequestReviewers,
                {
                    ...makeIdentityRefWithVote(reviewer.id, reviewer.vote),
                    ...reviewer,
                    reviewerUrl: ""
                },
                r => r.id === reviewer.id
            )
        );
    }

    updatePullRequestReviewer(
        reviewer: IdentityRefWithVote,
        _repositoryId: string,
        _pullRequestId: number,
        reviewerId: string,
        _project?: string
    ): Promise<IdentityRefWithVote> {
        const found = pullRequestReviewers.find(r => r.id === reviewerId);
        return Promise.resolve(
            remember(
                pullRequestReviewers,
                {
                    ...(found ?? makeIdentityRefWithVote(reviewerId, 0)),
                    ...reviewer,
                    id: reviewerId
                },
                r => r.id === reviewerId
            )
        );
    }

    updatePullRequestReviewers(
        patchVotes: IdentityRefWithVote[],
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<void> {
        patchVotes.forEach(patch => {
            const found = pullRequestReviewers.find(r => r.id === patch.id);
            if (found) {
                remember(pullRequestReviewers, { ...found, ...patch }, r => r.id === patch.id);
            }
        });
        return Promise.resolve();
    }

    deletePullRequestReviewer(
        _repositoryId: string,
        _pullRequestId: number,
        reviewerId: string,
        _project?: string
    ): Promise<void> {
        forget(pullRequestReviewers, r => r.id === reviewerId);
        return Promise.resolve();
    }

    getPullRequestLabels(
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string,
        _projectId?: string
    ): Promise<WebApiTagDefinition[]> {
        return Promise.resolve(pullRequestLabels);
    }

    getPullRequestLabel(
        _repositoryId: string,
        _pullRequestId: number,
        labelIdOrName: string,
        _project?: string,
        _projectId?: string
    ): Promise<WebApiTagDefinition> {
        const found = pullRequestLabels.find(l => l.id === labelIdOrName || l.name === labelIdOrName);
        return Promise.resolve(found ?? makePullRequestLabel(labelIdOrName, labelIdOrName));
    }

    createPullRequestLabel(
        label: WebApiCreateTagRequestData,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string,
        _projectId?: string
    ): Promise<WebApiTagDefinition> {
        const found = pullRequestLabels.find(l => l.name === label.name);
        return Promise.resolve(
            remember(
                pullRequestLabels,
                found ?? makePullRequestLabel(`label-${label.name}`, label.name),
                l => l.name === label.name
            )
        );
    }

    deletePullRequestLabels(
        _repositoryId: string,
        _pullRequestId: number,
        labelIdOrName: string,
        _project?: string,
        _projectId?: string
    ): Promise<void> {
        forget(pullRequestLabels, l => l.id === labelIdOrName || l.name === labelIdOrName);
        return Promise.resolve();
    }

    getPullRequestStatus(
        _repositoryId: string,
        _pullRequestId: number,
        statusId: number,
        _project?: string
    ): Promise<GitPullRequestStatus> {
        const found = pullRequestStatuses.find(s => s.id === statusId);
        return Promise.resolve(found ?? makePullRequestStatus(statusId, GitStatusState.NotSet, 1));
    }

    createPullRequestStatus(
        status: GitPullRequestStatus,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<GitPullRequestStatus> {
        const created = {
            ...makePullRequestStatus(status.id, GitStatusState.Pending, status.iterationId),
            ...status
        };
        return Promise.resolve(remember(pullRequestStatuses, created, s => s.id === created.id));
    }

    deletePullRequestStatus(
        _repositoryId: string,
        _pullRequestId: number,
        statusId: number,
        _project?: string
    ): Promise<void> {
        forget(pullRequestStatuses, s => s.id === statusId);
        return Promise.resolve();
    }

    getPullRequestStatuses(
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<GitPullRequestStatus[]> {
        return Promise.resolve(pullRequestStatuses);
    }

    updatePullRequestStatuses(
        patchDocument: JsonPatchDocument,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<void> {
        const removed = removedIds(patchDocument);
        forget(pullRequestStatuses, s => removed.includes(s.id));
        return Promise.resolve();
    }

    getPullRequestProperties(_repositoryId: string, _pullRequestId: number, _project?: string): Promise<unknown> {
        return Promise.resolve({ ...pullRequestProperties });
    }

    updatePullRequestProperties(
        patchDocument: JsonPatchDocument,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<unknown> {
        return Promise.resolve(applyPropertyPatch(pullRequestProperties, patchDocument));
    }

    sharePullRequest(
        _userMessage: ShareNotificationContext,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getPullRequestQuery(
        queries: GitPullRequestQuery,
        _repositoryId: string,
        _project?: string
    ): Promise<GitPullRequestQuery> {
        return Promise.resolve({
            queries: queries.queries,
            results: queries.queries.map(input =>
                Object.fromEntries(
                    input.items.map((item): [string, GitPullRequest[]] => [
                        item,
                        input.type === GitPullRequestQueryType.NotSet ? [] : pullRequests
                    ])
                )
            )
        });
    }

    getPullRequestWorkItemRefs(
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<ResourceRef[]> {
        return Promise.resolve(pullRequestWorkItemRefs);
    }

    getPullRequestIteration(
        _repositoryId: string,
        _pullRequestId: number,
        iterationId: number,
        _project?: string
    ): Promise<GitPullRequestIteration> {
        const found = pullRequestIterations.find(i => i.id === iterationId);
        return Promise.resolve(found ?? makePullRequestIteration(iterationId, IterationReason.Unknown));
    }

    getPullRequestIterations(
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string,
        includeCommits?: boolean
    ): Promise<GitPullRequestIteration[]> {
        if (includeCommits) return Promise.resolve(pullRequestIterations);
        return Promise.resolve(pullRequestIterations.map(iteration => ({ ...iteration, commits: [] })));
    }

    getPullRequestIterationChanges(
        _repositoryId: string,
        _pullRequestId: number,
        iterationId: number,
        _project?: string,
        top?: number,
        skip?: number,
        compareTo?: number
    ): Promise<GitPullRequestIterationChanges> {
        const found = pullRequestIterations.find(i => i.id === iterationId);
        const entries = (found ?? makePullRequestIteration(iterationId, IterationReason.Unknown)).changeList;
        const start = skip ?? 0;
        const size = top ?? entries.length;
        const page = entries.slice(start, start + size);
        const end = start + page.length;
        const exhausted = end >= entries.length;
        return Promise.resolve({
            changeEntries:
                compareTo === undefined ? page : page.map(entry => ({ ...entry, changeTrackingId: compareTo })),
            nextSkip: exhausted ? 0 : end,
            nextTop: exhausted ? 0 : size
        });
    }

    getPullRequestIterationCommits(
        _repositoryId: string,
        _pullRequestId: number,
        iterationId: number,
        _project?: string,
        top?: number,
        skip?: number
    ): Promise<GitCommitRef[]> {
        const found = pullRequestIterations.find(i => i.id === iterationId);
        const iterationCommits = (found ?? makePullRequestIteration(iterationId, IterationReason.Unknown)).commits;
        const start = skip ?? 0;
        return Promise.resolve(iterationCommits.slice(start, start + (top ?? iterationCommits.length)));
    }

    getPullRequestCommits(
        _repositoryId: string,
        pullRequestId: number,
        _project?: string
    ): Promise<PagedList<GitCommitRef>> {
        const found = pullRequests.find(p => p.pullRequestId === pullRequestId);
        const page: PagedList<GitCommitRef> = Object.assign(commits.slice(), {
            continuationToken: found ? null : String(pullRequestId)
        });
        return Promise.resolve(page);
    }

    getPullRequestFilesDiff(
        _repositoryId: string,
        pullRequestId: number,
        _project?: string,
        _iteration?: number,
        _baseIteration?: number,
        top?: number,
        skip?: number
    ): Promise<GitPullRequestFilesDiff> {
        const found = pullRequests.find(p => p.pullRequestId === pullRequestId);
        const pullRequest = found ?? { ...makePullRequest(), pullRequestId };
        const start = skip ?? 0;
        return Promise.resolve({
            fileDiffs: pullRequestFileDiffDetails.slice(start, start + (top ?? pullRequestFileDiffDetails.length)),
            pullRequestDescription: pullRequest.description,
            pullRequestTitle: pullRequest.title
        });
    }

    getPullRequestIterationStatuses(
        _repositoryId: string,
        _pullRequestId: number,
        iterationId: number,
        _project?: string
    ): Promise<GitPullRequestStatus[]> {
        return Promise.resolve(pullRequestIterationStatuses.filter(status => status.iterationId === iterationId));
    }

    getPullRequestIterationStatus(
        _repositoryId: string,
        _pullRequestId: number,
        iterationId: number,
        statusId: number,
        _project?: string
    ): Promise<GitPullRequestStatus> {
        const found = pullRequestIterationStatuses.find(
            status => status.id === statusId && status.iterationId === iterationId
        );
        return Promise.resolve(found ?? makePullRequestStatus(statusId, GitStatusState.NotSet, iterationId));
    }

    createPullRequestIterationStatus(
        status: GitPullRequestStatus,
        _repositoryId: string,
        _pullRequestId: number,
        iterationId: number,
        _project?: string
    ): Promise<GitPullRequestStatus> {
        const created = {
            ...makePullRequestStatus(status.id, GitStatusState.Pending, iterationId),
            ...status,
            iterationId
        };
        return Promise.resolve(
            remember(pullRequestIterationStatuses, created, s => s.id === created.id && s.iterationId === iterationId)
        );
    }

    deletePullRequestIterationStatus(
        _repositoryId: string,
        _pullRequestId: number,
        iterationId: number,
        statusId: number,
        _project?: string
    ): Promise<void> {
        forget(pullRequestIterationStatuses, s => s.id === statusId && s.iterationId === iterationId);
        return Promise.resolve();
    }

    updatePullRequestIterationStatuses(
        patchDocument: JsonPatchDocument,
        _repositoryId: string,
        _pullRequestId: number,
        iterationId: number,
        _project?: string
    ): Promise<void> {
        const removed = removedIds(patchDocument);
        forget(pullRequestIterationStatuses, s => removed.includes(s.id) && s.iterationId === iterationId);
        return Promise.resolve();
    }

    getPullRequestConflict(
        _repositoryId: string,
        _pullRequestId: number,
        conflictId: number,
        _project?: string
    ): Promise<GitConflict> {
        const found = pullRequestConflicts.find(c => c.conflictId === conflictId);
        return Promise.resolve(found ?? makeGitConflict(conflictId, "/README.md", GitResolutionStatus.Unresolved));
    }

    getPullRequestConflicts(
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string,
        skip?: number,
        top?: number,
        _includeObsolete?: boolean,
        excludeResolved?: boolean,
        onlyResolved?: boolean
    ): Promise<GitConflict[]> {
        const start = skip ?? 0;
        const page = pullRequestConflicts.slice(start, start + (top ?? pullRequestConflicts.length));
        if (onlyResolved) {
            return Promise.resolve(page.filter(c => c.resolutionStatus === GitResolutionStatus.Resolved));
        }
        if (excludeResolved) {
            return Promise.resolve(page.filter(c => c.resolutionStatus !== GitResolutionStatus.Resolved));
        }
        return Promise.resolve(page);
    }

    updatePullRequestConflict(
        conflict: GitConflict,
        repositoryId: string,
        pullRequestId: number,
        conflictId: number,
        project?: string
    ): Promise<GitConflict> {
        return this.getPullRequestConflict(repositoryId, pullRequestId, conflictId, project).then(existing =>
            remember(
                pullRequestConflicts,
                {
                    ...existing,
                    ...conflict,
                    conflictId
                },
                c => c.conflictId === conflictId
            )
        );
    }

    updatePullRequestConflicts(
        conflictUpdates: GitConflict[],
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<GitConflictUpdateResult[]> {
        return Promise.resolve(resolveConflicts(pullRequestConflicts, conflictUpdates));
    }

    getPullRequestThread(
        _repositoryId: string,
        _pullRequestId: number,
        threadId: number,
        _project?: string,
        _iteration?: number,
        _baseIteration?: number
    ): Promise<GitPullRequestCommentThread> {
        const found = pullRequestThreads.find(thread => thread.id === threadId);
        return Promise.resolve(
            found ?? makePullRequestThread(threadId, CommentThreadStatus.Unknown, [makeComment(threadId)])
        );
    }

    updateThread(
        commentThread: GitPullRequestCommentThread,
        repositoryId: string,
        pullRequestId: number,
        threadId: number,
        project?: string
    ): Promise<GitPullRequestCommentThread> {
        return this.getPullRequestThread(repositoryId, pullRequestId, threadId, project).then(existing =>
            remember(
                pullRequestThreads,
                {
                    ...existing,
                    ...commentThread,
                    id: threadId
                },
                thread => thread.id === threadId
            )
        );
    }

    getComments(
        _repositoryId: string,
        _pullRequestId: number,
        threadId: number,
        _project?: string
    ): Promise<Comment[]> {
        const found = pullRequestThreads.find(thread => thread.id === threadId);
        return Promise.resolve(found ? found.comments : [makeComment(threadId)]);
    }

    getComment(
        _repositoryId: string,
        _pullRequestId: number,
        threadId: number,
        commentId: number,
        _project?: string
    ): Promise<Comment> {
        const thread = pullRequestThreads.find(item => item.id === threadId);
        const found = thread?.comments.find(comment => comment.id === commentId);
        return Promise.resolve(found ?? makeComment(commentId));
    }

    updateComment(
        comment: Comment,
        repositoryId: string,
        pullRequestId: number,
        threadId: number,
        commentId: number,
        project?: string
    ): Promise<Comment> {
        return this.getComment(repositoryId, pullRequestId, threadId, commentId, project).then(existing => {
            const updated = {
                ...existing,
                ...comment,
                id: commentId
            };
            rewriteComments(threadId, comments => upsert(comments, updated, item => item.id === commentId));
            return updated;
        });
    }

    deleteComment(
        _repositoryId: string,
        _pullRequestId: number,
        threadId: number,
        commentId: number,
        _project?: string
    ): Promise<void> {
        rewriteComments(threadId, comments => comments.filter(item => item.id !== commentId));
        return Promise.resolve();
    }

    createCherryPick(
        cherryPickToCreate: GitAsyncRefOperationParameters,
        _project: string,
        _repositoryId: string
    ): Promise<GitCherryPick> {
        return Promise.resolve(
            remember(
                cherryPicks,
                {
                    ...makeCherryPick(createdCherryPickId, cherryPickToCreate.generatedRefName),
                    parameters: cherryPickToCreate
                },
                pick => pick.cherryPickId === createdCherryPickId
            )
        );
    }

    getCherryPick(_project: string, cherryPickId: number, _repositoryId: string): Promise<GitCherryPick> {
        const found = cherryPicks.find(pick => pick.cherryPickId === cherryPickId);
        return Promise.resolve(found ?? makeCherryPick(cherryPickId, `refs/heads/cherry-pick/${cherryPickId}`));
    }

    getCherryPickForRefName(_project: string, _repositoryId: string, refName: string): Promise<GitCherryPick> {
        const found = cherryPicks.find(pick => pick.parameters.generatedRefName === refName);
        return Promise.resolve(found ?? makeCherryPick(createdCherryPickId, refName));
    }

    getCherryPickRelationships(
        _repositoryNameOrId: string,
        commitId: string,
        _project?: string,
        _includeLinks?: boolean
    ): Promise<GitCommitRef[]> {
        const found = commits.find(commit => commit.commitId === commitId);
        return Promise.resolve(found ? [found] : [{ ...makeCommit(), commitId }]);
    }

    getCherryPickConflict(
        _repositoryId: string,
        _cherryPickId: number,
        conflictId: number,
        _project?: string
    ): Promise<GitConflict> {
        const found = cherryPickConflicts.find(conflict => conflict.conflictId === conflictId);
        return Promise.resolve(found ?? makeGitConflict(conflictId, "/README.md", GitResolutionStatus.Unresolved));
    }

    getCherryPickConflicts(
        _repositoryId: string,
        _cherryPickId: number,
        _project?: string,
        continuationToken?: string,
        top?: number,
        excludeResolved?: boolean,
        onlyResolved?: boolean,
        _includeObsolete?: boolean
    ): Promise<PagedList<GitConflict>> {
        return Promise.resolve(
            conflictPage(cherryPickConflicts, continuationToken, top, excludeResolved, onlyResolved)
        );
    }

    updateCherryPickConflict(
        conflict: GitConflict,
        repositoryId: string,
        cherryPickId: number,
        conflictId: number,
        project?: string
    ): Promise<GitConflict> {
        return this.getCherryPickConflict(repositoryId, cherryPickId, conflictId, project).then(existing =>
            remember(
                cherryPickConflicts,
                {
                    ...existing,
                    ...conflict,
                    conflictId
                },
                c => c.conflictId === conflictId
            )
        );
    }

    updateCherryPickConflicts(
        conflictUpdates: GitConflict[],
        _repositoryId: string,
        _cherryPickId: number,
        _project?: string
    ): Promise<GitConflictUpdateResult[]> {
        return Promise.resolve(resolveConflicts(cherryPickConflicts, conflictUpdates));
    }

    createRevert(
        revertToCreate: GitAsyncRefOperationParameters,
        _project: string,
        _repositoryId: string
    ): Promise<GitRevert> {
        return Promise.resolve(
            remember(
                reverts,
                {
                    ...makeRevert(createdRevertId, revertToCreate.generatedRefName),
                    parameters: revertToCreate
                },
                revert => revert.revertId === createdRevertId
            )
        );
    }

    getRevert(_project: string, revertId: number, _repositoryId: string): Promise<GitRevert> {
        const found = reverts.find(revert => revert.revertId === revertId);
        return Promise.resolve(found ?? makeRevert(revertId, `refs/heads/revert/${revertId}`));
    }

    getRevertForRefName(_project: string, _repositoryId: string, refName: string): Promise<GitRevert> {
        const found = reverts.find(revert => revert.parameters.generatedRefName === refName);
        return Promise.resolve(found ?? makeRevert(createdRevertId, refName));
    }

    getRevertConflict(
        _repositoryId: string,
        _revertId: number,
        conflictId: number,
        _project?: string
    ): Promise<GitConflict> {
        const found = revertConflicts.find(conflict => conflict.conflictId === conflictId);
        return Promise.resolve(found ?? makeGitConflict(conflictId, "/README.md", GitResolutionStatus.Unresolved));
    }

    getRevertConflicts(
        _repositoryId: string,
        _revertId: number,
        _project?: string,
        continuationToken?: string,
        top?: number,
        excludeResolved?: boolean,
        onlyResolved?: boolean,
        _includeObsolete?: boolean
    ): Promise<PagedList<GitConflict>> {
        return Promise.resolve(conflictPage(revertConflicts, continuationToken, top, excludeResolved, onlyResolved));
    }

    updateRevertConflict(
        conflict: GitConflict,
        repositoryId: string,
        revertId: number,
        conflictId: number,
        project?: string
    ): Promise<GitConflict> {
        return this.getRevertConflict(repositoryId, revertId, conflictId, project).then(existing =>
            remember(
                revertConflicts,
                {
                    ...existing,
                    ...conflict,
                    conflictId
                },
                c => c.conflictId === conflictId
            )
        );
    }

    updateRevertConflicts(
        conflictUpdates: GitConflict[],
        _repositoryId: string,
        _revertId: number,
        _project?: string
    ): Promise<GitConflictUpdateResult[]> {
        return Promise.resolve(resolveConflicts(revertConflicts, conflictUpdates));
    }

    createAttachment(
        content: unknown,
        fileName: string,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<Attachment> {
        return Promise.resolve(
            remember(
                pullRequestAttachments,
                {
                    ...makeAttachment(createdAttachmentId, fileName),
                    properties: { content }
                },
                attachment => attachment.displayName === fileName
            )
        );
    }

    deleteAttachment(
        fileName: string,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<void> {
        forget(pullRequestAttachments, attachment => attachment.displayName === fileName);
        return Promise.resolve();
    }

    getAttachmentContent(
        fileName: string,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(fileName));
    }

    getAttachmentZip(
        fileName: string,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeTreeArchive(`${fileName}.zip`));
    }

    getAttachments(_repositoryId: string, _pullRequestId: number, _project?: string): Promise<Attachment[]> {
        return Promise.resolve(pullRequestAttachments);
    }

    createLike(
        _repositoryId: string,
        _pullRequestId: number,
        _threadId: number,
        commentId: number,
        _project?: string
    ): Promise<void> {
        if (stateful.isEnabled()) {
            const comment = likedComments.find(item => item.id === commentId) ?? makeComment(commentId);
            remember(
                likedComments,
                { ...comment, usersLiked: upsert(comment.usersLiked, likingUser, user => user.id === likingUser.id) },
                item => item.id === commentId
            );
        }
        return Promise.resolve();
    }

    deleteLike(
        _repositoryId: string,
        _pullRequestId: number,
        _threadId: number,
        commentId: number,
        _project?: string
    ): Promise<void> {
        const comment = likedComments.find(item => item.id === commentId);
        if (comment) {
            remember(
                likedComments,
                { ...comment, usersLiked: comment.usersLiked.filter(user => user.id !== likingUser.id) },
                item => item.id === commentId
            );
        }
        return Promise.resolve();
    }

    getLikes(
        _repositoryId: string,
        _pullRequestId: number,
        _threadId: number,
        commentId: number,
        _project?: string
    ): Promise<IdentityRef[]> {
        const found = likedComments.find(comment => comment.id === commentId);
        return Promise.resolve(found ? found.usersLiked : []);
    }

    initializeConsolidationIdentity(_projectId?: string): Promise<void> {
        return Promise.resolve();
    }

    initializeAutofixIdentity(_projectId?: string, _repositoryId?: string): Promise<void> {
        return Promise.resolve();
    }

    deleteEnablementStatus(
        allProjects: boolean,
        _includeBillableCommitters?: boolean,
        projectIds?: string[]
    ): Promise<void> {
        const selected = projectIds ?? [];
        forget(enablementStatuses, s => allProjects || selected.includes(s.projectId));
        return Promise.resolve();
    }

    getEnablementStatus(
        projectIds?: string[],
        _billingDate?: Date,
        skip?: number,
        take?: number
    ): Promise<AdvSecEnablementStatus[]> {
        const selected =
            projectIds && projectIds.length > 0
                ? enablementStatuses.filter(s => projectIds.includes(s.projectId))
                : enablementStatuses;
        const start = skip ?? 0;
        return Promise.resolve(selected.slice(start, start + (take ?? selected.length)));
    }

    getEnableOnCreateHost(enableOnCreateHost: boolean): Promise<boolean> {
        return Promise.resolve(enableOnCreateHost);
    }

    getEnableOnCreateProject(enableOnCreateProjectId: string): Promise<boolean> {
        return Promise.resolve(enablementStatuses.some(s => s.projectId === enableOnCreateProjectId && s.enabled));
    }

    setEnableOnCreateHost(_enableOnCreateHost: boolean): Promise<void> {
        return Promise.resolve();
    }

    setEnableOnCreateProject(_enableOnCreateProjectId: string, _enableOnStatus: boolean): Promise<void> {
        return Promise.resolve();
    }

    updateEnablementStatus(enablementUpdates: AdvSecEnablementUpdate[]): Promise<void> {
        enablementUpdates.forEach(applyEnablementUpdate);
        return Promise.resolve();
    }

    getEstimatedBillablePushersOrg(): Promise<BillablePusher[]> {
        return Promise.resolve(billablePushers);
    }

    getEstimatedBillablePushersProject(project: string): Promise<BillablePusher[]> {
        return Promise.resolve(billablePushers.filter(p => p.projectId === project));
    }

    getEstimatedBillableCommittersRepo(_project: string, repositoryId: string): Promise<BillableCommitter[]> {
        return Promise.resolve(billableCommitters.filter(c => c.repoId === repositoryId));
    }

    getBillableCommitters(
        _project: string,
        _billingDate?: Date,
        skip?: number,
        take?: number
    ): Promise<BillableCommitter[]> {
        const start = skip ?? 0;
        return Promise.resolve(billableCommitters.slice(start, start + (take ?? billableCommitters.length)));
    }

    getBillableCommittersDetail(
        _project: string,
        _includeDetails: string,
        _billingDate?: Date
    ): Promise<BillableCommitterDetail[]> {
        return Promise.resolve(billableCommitterDetails);
    }

    createFavorite(favorite: GitRefFavorite, _project: string): Promise<GitRefFavorite> {
        const created = {
            ...makeRefFavorite(favorite.name, favorite.repositoryId, favorite.identityId),
            ...favorite
        };
        return Promise.resolve(remember(refFavorites, created, f => f.id === created.id));
    }

    deleteRefFavorite(_project: string, favoriteId: number): Promise<void> {
        forget(refFavorites, f => f.id === favoriteId);
        return Promise.resolve();
    }

    getRefFavorite(_project: string, favoriteId: number): Promise<GitRefFavorite> {
        const found = refFavorites.find(f => f.id === favoriteId);
        return Promise.resolve(
            found ?? {
                ...makeRefFavorite("refs/heads/main", repositories[0].id, refFavorites[0].identityId),
                id: favoriteId
            }
        );
    }

    getRefFavorites(_project: string, repositoryId?: string, identityId?: string): Promise<GitRefFavorite[]> {
        return Promise.resolve(
            refFavorites.filter(
                f => (!repositoryId || f.repositoryId === repositoryId) && (!identityId || f.identityId === identityId)
            )
        );
    }

    getRefFavoritesForProject(_project: string, identityId?: string): Promise<GitRefFavorite[]> {
        return Promise.resolve(identityId ? refFavorites.filter(f => f.identityId === identityId) : refFavorites);
    }
}
