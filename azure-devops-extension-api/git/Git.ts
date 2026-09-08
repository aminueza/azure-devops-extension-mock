import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    GitRestClient,
    GitRepository,
    GitPullRequest,
    GitPullRequestCommentThread,
    GitCommitRef,
    GitBranchStats,
    GitRef,
    GitItem,
    GitPush,
    Comment,
    GitPullRequestSearchCriteria,
    GetAccessibleRepositoriesRequest,
    GetAccessibleRepositoriesResponse,
    GitAsyncOperationStatus,
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
    GitItemRequestData,
    GitMerge,
    GitMergeParameters,
    GitPullRequestQuery,
    GitPullRequestQueryType,
    GitPullRequestStatus,
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
    branches,
    changes,
    commits,
    commitStatuses,
    deletedRepositories,
    forks,
    forkSyncRequests,
    importRequests,
    items,
    makeAnnotatedTag,
    makeBranchStats,
    makeCommentThread,
    makeCommit,
    makeCommitDiffs,
    makeFileDiff,
    makeForkSyncRequest,
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
    makePullRequestLabel,
    makePullRequestStatus,
    makePullRequestWorkItemRef,
    makePush,
    makeRefUpdateResult,
    makeTreeArchive,
    makeTreeRef,
    merges,
    pullRequestLabels,
    pullRequestProperties,
    pullRequestReviewers,
    pullRequestStatuses,
    pullRequestWorkItemRefs,
    pullRequests,
    refs,
    repositories,
    suggestions,
    trees
} from "./Data";

const applyPropertyPatch = (
    base: Record<string, any>,
    patchDocument: JsonPatchDocument
): Record<string, any> => {
    const operations: JsonPatchOperation[] = Array.isArray(patchDocument) ? patchDocument : [];
    return operations.reduce(
        (properties, operation) => ({
            ...properties,
            [operation.path.replace(/^\//, "")]: operation.value
        }),
        { ...base }
    );
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

    createRepository(
        gitRepositoryToCreate: GitRepository,
        _project?: string
    ): Promise<GitRepository> {
        return Promise.resolve({ ...makeGitRepository(), ...gitRepositoryToCreate });
    }

    deleteRepository(_repositoryId: string, _project?: string): Promise<void> {
        return Promise.resolve();
    }

    updateRepository(
        newRepositoryInfo: GitRepository,
        repositoryId: string,
        _project?: string
    ): Promise<GitRepository> {
        return Promise.resolve({ ...makeGitRepository(), ...newRepositoryInfo, id: repositoryId });
    }

    getRefs(_repositoryId: string, _project?: string, filter?: string): Promise<GitRef[]> {
        if (!filter) return Promise.resolve(refs);
        return Promise.resolve(refs.filter(r => r.name.includes(filter)));
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

    getCommit(commitId: string): Promise<GitCommitRef> {
        const found = commits.find(c => c.commitId === commitId);
        return Promise.resolve(found ?? { ...makeCommit(), commitId });
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

    getBlob(_repositoryId: string, sha1: string): Promise<any> {
        return Promise.resolve({ objectId: sha1, size: 0, url: "" });
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

    getPullRequests(
        _repositoryId: string,
        _searchCriteria?: GitPullRequestSearchCriteria
    ): Promise<GitPullRequest[]> {
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

    createPullRequest(
        gitPullRequestToCreate: GitPullRequest,
        _repositoryId: string
    ): Promise<GitPullRequest> {
        return Promise.resolve({ ...makePullRequest(), ...gitPullRequestToCreate });
    }

    updatePullRequest(
        gitPullRequestToUpdate: GitPullRequest,
        _repositoryId: string,
        pullRequestId: number
    ): Promise<GitPullRequest> {
        return Promise.resolve({
            ...makePullRequest(),
            ...gitPullRequestToUpdate,
            pullRequestId
        });
    }

    getThreads(
        _repositoryId: string,
        _pullRequestId: number
    ): Promise<GitPullRequestCommentThread[]> {
        return Promise.resolve([makeCommentThread()]);
    }

    createThread(
        commentThread: GitPullRequestCommentThread,
        _repositoryId: string,
        _pullRequestId: number
    ): Promise<GitPullRequestCommentThread> {
        return Promise.resolve({ ...makeCommentThread(), ...commentThread });
    }

    createComment(
        comment: Comment,
        _repositoryId: string,
        _pullRequestId: number,
        _threadId: number
    ): Promise<Comment> {
        return Promise.resolve({ ...comment, id: comment.id ?? 1 } as Comment);
    }

    getAccessibleRepositories(
        request: GetAccessibleRepositoriesRequest
    ): Promise<GetAccessibleRepositoriesResponse> {
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
        const filtered = filterContains
            ? repositories.filter(r => r.name.includes(filterContains))
            : repositories;
        const start = continuationToken ? Number(continuationToken) : 0;
        const end = start + (top ?? filtered.length);
        const page: PagedList<GitRepository> = Object.assign(filtered.slice(start, end), {
            continuationToken: end < filtered.length ? String(end) : null
        });
        return Promise.resolve(page);
    }

    getRepositoryWithParent(
        repositoryId: string,
        includeParent: boolean,
        _project?: string
    ): Promise<GitRepository> {
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

    deleteRepositoryFromRecycleBin(_project: string, _repositoryId: string): Promise<void> {
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
        if (!found) return Promise.resolve(restored);
        return Promise.resolve({ ...restored, name: found.name, project: found.project });
    }

    createForkSyncRequest(
        syncParams: GitForkSyncRequestParameters,
        _repositoryNameOrId: string,
        _project?: string,
        _includeLinks?: boolean
    ): Promise<GitForkSyncRequest> {
        return Promise.resolve({
            ...makeForkSyncRequest(),
            ...syncParams,
            status: GitAsyncOperationStatus.Queued
        });
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
        return Promise.resolve(
            forkSyncRequests.filter(r => r.status !== GitAsyncOperationStatus.Abandoned)
        );
    }

    getForks(
        _repositoryNameOrId: string,
        collectionId: string,
        _project?: string,
        _includeLinks?: boolean
    ): Promise<GitRepositoryRef[]> {
        return Promise.resolve(
            forks.map(f => ({ ...f, collection: { ...f.collection, id: collectionId } }))
        );
    }

    createImportRequest(
        importRequest: GitImportRequest,
        _project: string,
        repositoryId: string
    ): Promise<GitImportRequest> {
        return Promise.resolve({
            ...makeImportRequest(),
            ...importRequest,
            repository: { ...makeGitRepository(), id: repositoryId },
            status: GitAsyncOperationStatus.Queued
        });
    }

    getImportRequest(
        _project: string,
        _repositoryId: string,
        importRequestId: number
    ): Promise<GitImportRequest> {
        const found = importRequests.find(r => r.importRequestId === importRequestId);
        return Promise.resolve(found ?? { ...makeImportRequest(), importRequestId });
    }

    queryImportRequests(
        _project: string,
        _repositoryId: string,
        includeAbandoned?: boolean
    ): Promise<GitImportRequest[]> {
        if (includeAbandoned) return Promise.resolve(importRequests);
        return Promise.resolve(
            importRequests.filter(r => r.status !== GitAsyncOperationStatus.Abandoned)
        );
    }

    updateImportRequest(
        importRequestToUpdate: GitImportRequest,
        _project: string,
        _repositoryId: string,
        importRequestId: number
    ): Promise<GitImportRequest> {
        return Promise.resolve({
            ...makeImportRequest(),
            ...importRequestToUpdate,
            importRequestId
        });
    }

    getPermission(
        _projectName?: string,
        repositoryId?: string,
        _permission?: string
    ): Promise<boolean> {
        if (!repositoryId) return Promise.resolve(true);
        return Promise.resolve(repositories.some(r => r.id === repositoryId));
    }

    getSuggestions(
        _repositoryId: string,
        _project?: string,
        preferCompareBranch?: boolean
    ): Promise<GitSuggestion[]> {
        if (!preferCompareBranch) return Promise.resolve(suggestions);
        return Promise.resolve(suggestions.slice(0, 1));
    }

    getBranchStatsBatch(
        searchCriteria: GitQueryBranchStatsCriteria,
        _repositoryId: string,
        _project?: string
    ): Promise<GitBranchStats[]> {
        return Promise.resolve(
            searchCriteria.targetCommits.map(target => makeBranchStats(target.version))
        );
    }

    updateRefs(
        refUpdates: GitRefUpdate[],
        repositoryId: string,
        _project?: string,
        _projectId?: string
    ): Promise<GitRefUpdateResult[]> {
        return Promise.resolve(
            refUpdates.map(update => makeRefUpdateResult({ ...update, repositoryId }))
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

    getItemsBatch(
        requestData: GitItemRequestData,
        _repositoryId: string,
        _project?: string
    ): Promise<GitItem[][]> {
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

    getBlobsZip(
        blobIds: string[],
        _repositoryId: string,
        _project?: string,
        _filename?: string
    ): Promise<ArrayBuffer> {
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

    getFileDiffs(
        fileDiffsCriteria: FileDiffsCriteria,
        _project: string,
        _repositoryId: string
    ): Promise<FileDiff[]> {
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
        return Promise.resolve(
            commits.filter(c => c.commitId !== commitId && c.commitId !== otherCommitId)
        );
    }

    createMergeRequest(
        mergeParameters: GitMergeParameters,
        _project: string,
        repositoryNameOrId: string,
        includeLinks?: boolean
    ): Promise<GitMerge> {
        return Promise.resolve({
            ...makeGitMerge(mergeParameters.comment),
            ...mergeParameters,
            status: GitAsyncOperationStatus.Queued,
            _links: includeLinks ? { repository: { href: repositoryNameOrId } } : {}
        });
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

    createAnnotatedTag(
        tagObject: GitAnnotatedTag,
        _project: string,
        _repositoryId: string
    ): Promise<GitAnnotatedTag> {
        return Promise.resolve({ ...makeAnnotatedTag(tagObject.name), ...tagObject });
    }

    getAnnotatedTag(
        _project: string,
        _repositoryId: string,
        objectId: string
    ): Promise<GitAnnotatedTag> {
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
        return Promise.resolve({
            ...makeGitStatus(gitCommitStatusToCreate.id, GitStatusState.Pending),
            ...gitCommitStatusToCreate
        });
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
        return Promise.resolve({
            ...makeIdentityRefWithVote(reviewerId, 0),
            ...reviewer,
            id: reviewerId
        });
    }

    createPullRequestReviewers(
        reviewers: IdentityRef[],
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<IdentityRefWithVote[]> {
        return Promise.resolve(
            reviewers.map(reviewer => ({
                ...makeIdentityRefWithVote(reviewer.id, 0),
                ...reviewer
            }))
        );
    }

    createUnmaterializedPullRequestReviewer(
        reviewer: IdentityRefWithVote,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<IdentityRefWithVote> {
        return Promise.resolve({
            ...makeIdentityRefWithVote(reviewer.id, reviewer.vote),
            ...reviewer,
            reviewerUrl: ""
        });
    }

    updatePullRequestReviewer(
        reviewer: IdentityRefWithVote,
        _repositoryId: string,
        _pullRequestId: number,
        reviewerId: string,
        _project?: string
    ): Promise<IdentityRefWithVote> {
        const found = pullRequestReviewers.find(r => r.id === reviewerId);
        return Promise.resolve({
            ...(found ?? makeIdentityRefWithVote(reviewerId, 0)),
            ...reviewer,
            id: reviewerId
        });
    }

    updatePullRequestReviewers(
        _patchVotes: IdentityRefWithVote[],
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    deletePullRequestReviewer(
        _repositoryId: string,
        _pullRequestId: number,
        _reviewerId: string,
        _project?: string
    ): Promise<void> {
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
        const found = pullRequestLabels.find(
            l => l.id === labelIdOrName || l.name === labelIdOrName
        );
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
        return Promise.resolve(found ?? makePullRequestLabel(`label-${label.name}`, label.name));
    }

    deletePullRequestLabels(
        _repositoryId: string,
        _pullRequestId: number,
        _labelIdOrName: string,
        _project?: string,
        _projectId?: string
    ): Promise<void> {
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
        return Promise.resolve({
            ...makePullRequestStatus(status.id, GitStatusState.Pending, status.iterationId),
            ...status
        });
    }

    deletePullRequestStatus(
        _repositoryId: string,
        _pullRequestId: number,
        _statusId: number,
        _project?: string
    ): Promise<void> {
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
        _patchDocument: JsonPatchDocument,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getPullRequestProperties(
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<any> {
        return Promise.resolve({ ...pullRequestProperties });
    }

    updatePullRequestProperties(
        patchDocument: JsonPatchDocument,
        _repositoryId: string,
        _pullRequestId: number,
        _project?: string
    ): Promise<any> {
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
                    input.items.map(item =>
                        [
                            item,
                            input.type === GitPullRequestQueryType.NotSet ? [] : pullRequests
                        ] as [string, GitPullRequest[]]
                    )
                )
            )
        });
    }

    getPullRequestWorkItemRefs(
        _repositoryId: string,
        pullRequestId: number,
        _project?: string
    ): Promise<ResourceRef[]> {
        const found = pullRequests.find(p => p.pullRequestId === pullRequestId);
        if (!found) return Promise.resolve(pullRequestWorkItemRefs);
        return Promise.resolve([
            ...pullRequestWorkItemRefs,
            makePullRequestWorkItemRef(String(pullRequestId))
        ]);
    }
}
