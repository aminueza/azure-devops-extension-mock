import { fake } from "../common/fixtures";
import {
    AdvSecEnablementStatus,
    Attachment,
    BillableCommitter,
    BillableCommitterDetail,
    BillablePusher,
    Comment,
    CommentThreadStatus,
    CommentType,
    GitConflictUpdateResult,
    GitConflictUpdateStatus,
    GitRepository,
    GitRepositoryRef,
    GitPullRequest,
    GitPullRequestCommentThread,
    GitPullRequestMergeStrategy,
    GitCommit,
    GitCommitRef,
    GitBranchStats,
    GitRef,
    GitItem,
    PullRequestAsyncStatus,
    PullRequestMergeFailureType,
    PullRequestStatus,
    GitObjectType,
    GitPullRequestStatus,
    GitPush,
    GitAnnotatedTag,
    GitAsyncOperationStatus,
    GitAsyncRefOperation,
    GitAsyncRefOperationFailureStatus,
    GitCherryPick,
    GitChange,
    GitRevert,
    GitCommitDiffs,
    GitConflict,
    GitConflictType,
    GitDeletedRepository,
    GitForkSyncRequest,
    GitImportRequest,
    GitMerge,
    GitRefFavorite,
    GitRefUpdate,
    GitRefUpdateResult,
    GitRefUpdateStatus,
    GitResolutionError,
    GitResolutionStatus,
    GitStatus,
    GitStatusState,
    GitSuggestion,
    GitTreeEntryRef,
    GitTreeRef,
    GitUserDate,
    IdentityRefWithVote,
    FileDiff,
    FileDiffDetail,
    FileDiffParams,
    GitPullRequestChange,
    GitPullRequestIteration,
    GitPushRef,
    ItemContentType,
    IterationReason,
    LineDiffBlockChangeType,
    RefFavoriteType,
    VersionControlChangeType
} from "azure-devops-extension-api/Git";
import { WebApiTagDefinition } from "azure-devops-extension-api/Core";
import { IdentityRef, PagedList, ResourceRef } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef, makeProjectCollectionReference, makeProjectReference, makeTagDefinition } from "../core/Data";

export const makeGitRepositoryRef = (): GitRepositoryRef => ({
    id: fake.string.uuid(),
    name: fake.lorem.slug(),
    isFork: true,
    collection: makeProjectCollectionReference(),
    project: makeProjectReference(),
    remoteUrl: fake.internet.url(),
    sshUrl: `git@${fake.internet.domainName()}:${fake.lorem.slug()}.git`,
    url: fake.internet.url()
});

export const makeGitRepository = (): GitRepository => ({
    id: fake.string.uuid(),
    name: fake.lorem.slug(),
    url: fake.internet.url(),
    remoteUrl: fake.internet.url(),
    sshUrl: `git@${fake.internet.domainName()}:${fake.lorem.slug()}.git`,
    webUrl: fake.internet.url(),
    validRemoteUrls: [fake.internet.url()],
    defaultBranch: "refs/heads/main",
    size: fake.number.int({ min: 1024, max: 10_000_000 }),
    creationDate: fake.date.past(),
    isFork: false,
    isDisabled: false,
    isInMaintenance: false,
    parentRepository: fake.helpers.absent(),
    project: makeProjectReference(),
    _links: {}
});

export const makeGitRef = (name = "refs/heads/main"): GitRef => ({
    name,
    objectId: fake.git.commitSha(),
    peeledObjectId: fake.git.commitSha(),
    creator: makeIdentityRef(),
    isLocked: false,
    isLockedBy: fake.helpers.absent(),
    statuses: [],
    url: fake.internet.url(),
    _links: {}
});

export const makeGitUserDate = (): GitUserDate => ({
    date: fake.date.recent(),
    email: fake.internet.email(),
    imageUrl: fake.internet.url(),
    name: fake.person.fullName()
});

export const makePushRef = (pushId: number): GitPushRef => ({
    _links: {},
    date: fake.date.recent(),
    pushCorrelationId: fake.string.uuid(),
    pushedBy: makeIdentityRef(),
    pushId,
    url: fake.internet.url()
});

export const makeCommit = (): GitCommitRef => ({
    commitId: fake.git.commitSha(),
    author: makeGitUserDate(),
    committer: makeGitUserDate(),
    comment: fake.git.commitMessage(),
    commentTruncated: false,
    changeCounts: { [VersionControlChangeType.Edit]: 1 },
    changes: [],
    commitTooManyChanges: false,
    url: fake.internet.url(),
    remoteUrl: fake.internet.url(),
    parents: [fake.git.commitSha()],
    push: makePushRef(fake.number.id()),
    statuses: [],
    workItems: [],
    _links: {}
});

export const makeGitCommit = (): GitCommit => ({
    ...makeCommit(),
    treeId: fake.git.commitSha()
});

export const makePullRequest = (): GitPullRequest => {
    const sourceRefName = `refs/heads/${fake.git.branch()}`;
    return {
        pullRequestId: fake.number.int({ min: 1, max: 10_000 }),
        codeReviewId: fake.number.int(),
        artifactId: `vstfs:///Git/PullRequestId/${fake.string.uuid()}`,
        status: PullRequestStatus.Active,
        createdBy: makeIdentityRef(),
        creationDate: fake.date.recent(),
        closedBy: fake.helpers.absent(),
        closedDate: fake.helpers.absent(),
        autoCompleteSetBy: fake.helpers.absent(),
        completionQueueTime: fake.helpers.absent(),
        completionOptions: {
            autoCompleteIgnoreConfigIds: [],
            bypassPolicy: false,
            bypassReason: "",
            deleteSourceBranch: true,
            mergeCommitMessage: fake.git.commitMessage(),
            mergeStrategy: GitPullRequestMergeStrategy.Squash,
            squashMerge: true,
            transitionWorkItems: true,
            triggeredByAutoComplete: false
        },
        title: fake.lorem.sentence(),
        description: fake.lorem.paragraph(),
        sourceRefName,
        targetRefName: "refs/heads/main",
        forkSource: fake.helpers.absent(),
        mergeId: fake.string.uuid(),
        mergeStatus: PullRequestAsyncStatus.Succeeded,
        mergeFailureMessage: "",
        mergeFailureType: PullRequestMergeFailureType.None,
        mergeOptions: {
            conflictAuthorshipCommits: false,
            detectRenameFalsePositives: false,
            disableRenames: false
        },
        hasMultipleMergeBases: false,
        ignoreTargetRefAndChooseDynamically: false,
        isDraft: false,
        supportsIterations: true,
        reviewers: [],
        commits: [makeCommit()],
        lastMergeCommit: makeCommit(),
        lastMergeSourceCommit: makeCommit(),
        lastMergeTargetCommit: makeCommit(),
        url: fake.internet.url(),
        remoteUrl: fake.internet.url(),
        repository: makeGitRepository(),
        labels: [],
        workItemRefs: [],
        _links: {}
    };
};

export const makeBranchStats = (name = "main"): GitBranchStats => ({
    name,
    aheadCount: fake.number.int({ min: 0, max: 5 }),
    behindCount: fake.number.int({ min: 0, max: 20 }),
    isBaseVersion: name === "main",
    commit: makeCommit()
});

export const makeGitItem = (path = "/README.md"): GitItem => {
    const fileName = path.split("/").filter(Boolean).pop() ?? "";
    return {
        objectId: fake.git.commitSha(),
        originalObjectId: fake.git.commitSha(),
        commitId: fake.git.commitSha(),
        path,
        isFolder: path.endsWith("/"),
        isSymLink: false,
        url: fake.internet.url(),
        gitObjectType: path.endsWith("/") ? GitObjectType.Tree : GitObjectType.Blob,
        content: "",
        contentMetadata: {
            contentType: "text/plain",
            encoding: 65001,
            extension: fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".") + 1) : "",
            fileName,
            isBinary: false,
            isImage: false,
            vsLink: ""
        },
        submoduleWebUrl: "",
        latestProcessedChange: makeCommit(),
        _links: {}
    };
};

export const makePush = (): GitPush => ({
    ...makePushRef(fake.number.int({ min: 1, max: 10_000 })),
    refUpdates: [],
    commits: [makeCommit()],
    repository: makeGitRepository()
});

export const makeComment = (id: number): Comment => ({
    _links: {},
    author: makeIdentityRef(),
    commentType: CommentType.Text,
    content: fake.lorem.sentence(),
    id,
    isDeleted: false,
    lastContentUpdatedDate: fake.date.recent(),
    lastUpdatedDate: fake.date.recent(),
    parentCommentId: 0,
    publishedDate: fake.date.recent(),
    usersLiked: []
});

export const makeCommentThread = (): GitPullRequestCommentThread => {
    const filePath = `/src/${fake.system.fileName()}`;
    const author = makeIdentityRef();
    return {
        id: fake.number.id(),
        pullRequestThreadContext: {
            iterationContext: {
                firstComparingIteration: 1,
                secondComparingIteration: 2
            },
            changeTrackingId: fake.number.int(),
            trackingCriteria: {
                firstComparingIteration: 1,
                secondComparingIteration: 2,
                origFilePath: filePath,
                origLeftFileStart: { line: 1, offset: 1 },
                origLeftFileEnd: { line: 1, offset: 10 },
                origRightFileStart: { line: 1, offset: 1 },
                origRightFileEnd: { line: 1, offset: 10 }
            }
        },
        threadContext: {
            filePath,
            leftFileStart: { line: 1, offset: 1 },
            leftFileEnd: { line: 1, offset: 10 },
            rightFileStart: { line: 1, offset: 1 },
            rightFileEnd: { line: 1, offset: 10 }
        },
        status: CommentThreadStatus.Active,
        comments: [{ ...makeComment(1), author }],
        identities: { [author.id]: author },
        isDeleted: false,
        properties: {},
        lastUpdatedDate: fake.date.recent(),
        publishedDate: fake.date.recent(),
        _links: {}
    };
};

export const makeDeletedRepository = (): GitDeletedRepository => ({
    id: fake.string.uuid(),
    name: fake.lorem.slug(),
    createdDate: fake.date.past(),
    deletedDate: fake.date.recent(),
    deletedBy: makeIdentityRef(),
    project: makeProjectReference()
});

export const makeForkSyncRequest = (): GitForkSyncRequest => ({
    operationId: fake.number.int({ min: 1, max: 10_000 }),
    status: GitAsyncOperationStatus.Completed,
    source: {
        collectionId: fake.string.uuid(),
        projectId: fake.string.uuid(),
        repositoryId: fake.string.uuid()
    },
    sourceToTargetRefs: [{ sourceRef: "refs/heads/main", targetRef: "refs/heads/main" }],
    detailedStatus: {
        allSteps: ["queued", "syncing", "completed"],
        currentStep: 3,
        errorMessage: ""
    },
    _links: {}
});

export const makeImportRequest = (): GitImportRequest => ({
    importRequestId: fake.number.int({ min: 1, max: 10_000 }),
    status: GitAsyncOperationStatus.Completed,
    repository: makeGitRepository(),
    parameters: {
        deleteServiceEndpointAfterImportIsDone: false,
        serviceEndpointId: fake.string.uuid(),
        gitSource: { overwrite: false, url: fake.internet.url() },
        tfvcSource: { importHistory: false, importHistoryDurationInDays: 0, path: "$/" }
    },
    detailedStatus: {
        allSteps: ["queued", "cloning", "completed"],
        currentStep: 3,
        errorMessage: ""
    },
    url: fake.internet.url(),
    _links: {}
});

export const makeSuggestion = (): GitSuggestion => ({
    type: "pullRequest",
    properties: {
        sourceBranch: `refs/heads/${fake.git.branch()}`,
        targetBranch: "refs/heads/main"
    }
});

export const makeTreeEntryRef = (): GitTreeEntryRef => ({
    gitObjectType: fake.helpers.arrayElement([GitObjectType.Blob, GitObjectType.Tree]),
    mode: "100644",
    objectId: fake.git.commitSha(),
    relativePath: fake.system.fileName(),
    size: fake.number.int({ min: 1, max: 100_000 }),
    url: fake.internet.url()
});

export const makeTreeRef = (): GitTreeRef => ({
    objectId: fake.git.commitSha(),
    size: fake.number.int({ min: 1, max: 100_000 }),
    treeEntries: [makeTreeEntryRef(), makeTreeEntryRef(), makeTreeEntryRef()],
    url: fake.internet.url(),
    _links: {}
});

export const makeRefUpdateResult = (refUpdate: GitRefUpdate): GitRefUpdateResult => ({
    name: refUpdate.name,
    newObjectId: refUpdate.newObjectId,
    oldObjectId: refUpdate.oldObjectId,
    repositoryId: refUpdate.repositoryId,
    isLocked: refUpdate.isLocked,
    customMessage: "",
    rejectedBy: "",
    success: true,
    updateStatus: GitRefUpdateStatus.Succeeded
});

export const makeTreeArchive = (objectId: string): ArrayBuffer => {
    const encoded = new TextEncoder().encode(objectId);
    const buffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(buffer).set(encoded);
    return buffer;
};

export const makeAnnotatedTag = (name: string): GitAnnotatedTag => ({
    message: fake.lorem.sentence(),
    name,
    objectId: fake.git.commitSha(),
    taggedBy: makeGitUserDate(),
    taggedObject: {
        objectId: fake.git.commitSha(),
        objectType: GitObjectType.Commit
    },
    url: fake.internet.url()
});

export const makeGitChange = (path: string): GitChange => ({
    changeId: fake.number.int({ min: 1, max: 1000 }),
    changeType: VersionControlChangeType.Edit,
    item: makeGitItem(path),
    newContent: {
        content: fake.lorem.paragraph(),
        contentType: ItemContentType.RawText
    },
    newContentTemplate: {
        name: fake.lorem.slug(),
        type: "text"
    },
    originalPath: path,
    sourceServerItem: path,
    url: fake.internet.url()
});

export const makeCommitDiffs = (baseCommit: string, targetCommit: string): GitCommitDiffs => ({
    aheadCount: fake.number.int({ min: 0, max: 20 }),
    allChangesIncluded: true,
    baseCommit,
    behindCount: fake.number.int({ min: 0, max: 20 }),
    changeCounts: { [VersionControlChangeType.Edit]: 1 },
    changes: [],
    commonCommit: fake.git.commitSha(),
    targetCommit
});

export const makeFileDiff = (params: FileDiffParams): FileDiff => ({
    lineDiffBlocks: [
        {
            changeType: LineDiffBlockChangeType.Edit,
            modifiedLineNumberStart: 1,
            modifiedLinesCount: fake.number.int({ min: 1, max: 20 }),
            originalLineNumberStart: 1,
            originalLinesCount: fake.number.int({ min: 1, max: 20 })
        }
    ],
    originalPath: params.originalPath,
    path: params.path
});

export const makeGitMerge = (comment: string): GitMerge => ({
    comment,
    parents: [fake.git.commitSha(), fake.git.commitSha()],
    detailedStatus: {
        failureMessage: "",
        mergeCommitId: fake.git.commitSha()
    },
    mergeOperationId: fake.number.int({ min: 1, max: 10_000 }),
    status: GitAsyncOperationStatus.Completed,
    _links: {}
});

export const makeGitStatus = (id: number, state: GitStatusState): GitStatus => ({
    context: {
        genre: "continuous-integration",
        name: fake.lorem.slug()
    },
    createdBy: makeIdentityRef(),
    creationDate: fake.date.recent(),
    description: fake.lorem.sentence(),
    id,
    state,
    targetUrl: fake.internet.url(),
    updatedDate: fake.date.recent(),
    _links: {}
});

export const makeItemText = (item: GitItem): string => `${item.path}\n${item.objectId}`;

export const repositories: GitRepository[] = Array.from({ length: 5 }, makeGitRepository);
export const pullRequests: GitPullRequest[] = Array.from({ length: 5 }, makePullRequest);
export const refs: PagedList<GitRef> = Object.assign(
    [
        makeGitRef("refs/heads/main"),
        makeGitRef("refs/heads/develop"),
        makeGitRef(`refs/heads/feature/${fake.lorem.slug()}`),
        makeGitRef("refs/tags/v1.0.0")
    ],
    { continuationToken: null }
);
export const commits: GitCommit[] = Array.from({ length: 10 }, makeGitCommit);
export const branches: GitBranchStats[] = [
    makeBranchStats("main"),
    makeBranchStats("develop"),
    makeBranchStats(`feature/${fake.lorem.slug()}`)
];
export const items: GitItem[] = [
    makeGitItem("/README.md"),
    makeGitItem("/src/"),
    makeGitItem("/src/index.ts"),
    makeGitItem("/package.json")
];
export const deletedRepositories: GitDeletedRepository[] = Array.from({ length: 3 }, makeDeletedRepository);
export const forks: GitRepositoryRef[] = Array.from({ length: 3 }, makeGitRepositoryRef);
export const forkSyncRequests: GitForkSyncRequest[] = [
    makeForkSyncRequest(),
    makeForkSyncRequest(),
    { ...makeForkSyncRequest(), status: GitAsyncOperationStatus.Abandoned }
];
export const importRequests: GitImportRequest[] = [
    makeImportRequest(),
    makeImportRequest(),
    { ...makeImportRequest(), status: GitAsyncOperationStatus.Abandoned }
];
export const suggestions: GitSuggestion[] = Array.from({ length: 2 }, makeSuggestion);
export const trees: GitTreeRef[] = Array.from({ length: 2 }, makeTreeRef);
export const annotatedTags: GitAnnotatedTag[] = [
    { ...makeAnnotatedTag("v1.0.0"), objectId: "1".repeat(40) },
    { ...makeAnnotatedTag("v1.1.0"), objectId: "2".repeat(40) },
    { ...makeAnnotatedTag("v2.0.0"), objectId: "3".repeat(40) }
];
export const changes: GitChange[] = [
    makeGitChange("/README.md"),
    makeGitChange("/src/index.ts"),
    makeGitChange("/package.json"),
    makeGitChange("/src/git/Data.ts")
];
export const commitStatuses: GitStatus[] = [
    makeGitStatus(101, GitStatusState.Succeeded),
    makeGitStatus(102, GitStatusState.Failed),
    makeGitStatus(103, GitStatusState.Pending)
];
export const merges: GitMerge[] = [
    { ...makeGitMerge("merge main into develop"), mergeOperationId: 201 },
    { ...makeGitMerge("merge develop into main"), mergeOperationId: 202 }
];

export const makeIdentityRefWithVote = (id: string, vote: number): IdentityRefWithVote => ({
    ...makeIdentityRef(),
    id,
    hasDeclined: false,
    isFlagged: false,
    isReapprove: false,
    isRequired: false,
    reviewerUrl: fake.internet.url(),
    vote,
    votedFor: []
});

export const pullRequestReviewers: IdentityRefWithVote[] = [
    makeIdentityRefWithVote("reviewer-approved", 10),
    makeIdentityRefWithVote("reviewer-waiting", -5),
    { ...makeIdentityRefWithVote("reviewer-required", 0), isRequired: true }
];

export const makePullRequestLabel = (id: string, name: string): WebApiTagDefinition => ({
    ...makeTagDefinition(),
    id,
    name
});

export const makePullRequestStatus = (
    id: number,
    state: GitStatusState,
    iterationId: number
): GitPullRequestStatus => ({
    ...makeGitStatus(id, state),
    iterationId,
    properties: { source: fake.lorem.slug() }
});

export const pullRequestLabels: WebApiTagDefinition[] = [
    makePullRequestLabel("label-bug", "bug"),
    makePullRequestLabel("label-docs", "documentation"),
    { ...makePullRequestLabel("label-stale", "stale"), active: false }
];

export const pullRequestStatuses: GitPullRequestStatus[] = [
    makePullRequestStatus(301, GitStatusState.Succeeded, 1),
    makePullRequestStatus(302, GitStatusState.Failed, 2),
    makePullRequestStatus(303, GitStatusState.Pending, 3)
];

export const makePullRequestWorkItemRef = (id: string): ResourceRef => ({
    id,
    url: `https://dev.azure.com/_apis/wit/workItems/${id}`
});

export const pullRequestWorkItemRefs: ResourceRef[] = [
    makePullRequestWorkItemRef("4001"),
    makePullRequestWorkItemRef("4002"),
    makePullRequestWorkItemRef("4003")
];

export const pullRequestProperties: Record<string, any> = {
    riskLevel: "low",
    reviewedBy: "release-team"
};

export const makePullRequestChange = (path: string, changeTrackingId: number): GitPullRequestChange => ({
    ...makeGitChange(path),
    changeTrackingId
});

export const makePullRequestIteration = (id: number, reason: IterationReason): GitPullRequestIteration => ({
    _links: {},
    author: makeIdentityRef(),
    changeList: [
        makePullRequestChange("/README.md", id),
        makePullRequestChange("/src/index.ts", id),
        makePullRequestChange("/package.json", id)
    ],
    commits: [makeCommit(), makeCommit(), makeCommit()],
    commonRefCommit: makeCommit(),
    createdDate: fake.date.recent(),
    description: fake.lorem.sentence(),
    hasMoreCommits: false,
    id,
    newTargetRefName: "refs/heads/main",
    oldTargetRefName: "refs/heads/release",
    push: makePushRef(id),
    reason,
    sourceRefCommit: makeCommit(),
    targetRefCommit: makeCommit(),
    updatedDate: fake.date.recent()
});

type FileDiffDetailBase = Omit<FileDiffDetail, "changeType" | "isFolder" | "isLinuxExecutable" | "isSymbolicLink">;

const makeFileDiffDetailBase = (path: string): FileDiffDetailBase => ({
    lineDiffBlocks: [
        {
            changeType: LineDiffBlockChangeType.Edit,
            modifiedLineNumberStart: 1,
            modifiedLines: [fake.lorem.sentence()],
            modifiedLinesCount: 1,
            originalLineNumberStart: 1,
            originalLines: [fake.lorem.sentence()],
            originalLinesCount: 1
        }
    ],
    originalPath: path,
    path
});

export const makeFileDiffDetail = (path: string): FileDiffDetail => {
    const newerFields = {
        changeType: VersionControlChangeType.Edit,
        isFolder: path.endsWith("/"),
        isLinuxExecutable: false,
        isSymbolicLink: false
    };
    return { ...newerFields, ...makeFileDiffDetailBase(path) };
};

export const pullRequestIterations: GitPullRequestIteration[] = [
    makePullRequestIteration(5001, IterationReason.Create),
    makePullRequestIteration(5002, IterationReason.Push),
    makePullRequestIteration(5003, IterationReason.Retarget)
];

export const pullRequestFileDiffDetails: FileDiffDetail[] = [
    makeFileDiffDetail("/README.md"),
    makeFileDiffDetail("/src/index.ts"),
    makeFileDiffDetail("/package.json"),
    makeFileDiffDetail("/src/")
];

export const pullRequestIterationStatuses: GitPullRequestStatus[] = [
    makePullRequestStatus(5101, GitStatusState.Succeeded, 5001),
    makePullRequestStatus(5102, GitStatusState.Failed, 5001),
    makePullRequestStatus(5103, GitStatusState.Pending, 5002)
];

export const makeGitConflict = (
    conflictId: number,
    conflictPath: string,
    resolutionStatus: GitResolutionStatus
): GitConflict => ({
    _links: {},
    conflictId,
    conflictPath,
    conflictType: GitConflictType.EditEdit,
    mergeBaseCommit: makeCommit(),
    mergeOrigin: {
        cherryPickId: 0,
        pullRequestId: fake.number.int({ min: 1, max: 10_000 }),
        revertId: 0
    },
    mergeSourceCommit: makeCommit(),
    mergeTargetCommit: makeCommit(),
    resolutionError: GitResolutionError.None,
    resolutionStatus,
    resolvedBy: makeIdentityRef(),
    resolvedDate: fake.date.recent(),
    url: fake.internet.url()
});

export const pullRequestConflicts: GitConflict[] = [
    makeGitConflict(5201, "/README.md", GitResolutionStatus.Unresolved),
    makeGitConflict(5202, "/src/index.ts", GitResolutionStatus.Resolved),
    makeGitConflict(5203, "/package.json", GitResolutionStatus.PartiallyResolved),
    makeGitConflict(5204, "/src/git/Data.ts", GitResolutionStatus.Resolved)
];

export const makeConflictUpdateResult = (conflict: GitConflict): GitConflictUpdateResult => ({
    conflictId: conflict.conflictId,
    customMessage: "",
    updatedConflict: {
        ...makeGitConflict(conflict.conflictId, conflict.conflictPath, GitResolutionStatus.Resolved),
        ...conflict,
        resolutionStatus: GitResolutionStatus.Resolved
    },
    updateStatus: GitConflictUpdateStatus.Succeeded
});

export const makePullRequestThread = (
    id: number,
    status: CommentThreadStatus,
    comments: Comment[]
): GitPullRequestCommentThread => ({
    ...makeCommentThread(),
    comments,
    identities: Object.fromEntries(comments.map(comment => [comment.author.id, comment.author])),
    id,
    status
});

export const pullRequestThreadComments: Comment[] = [makeComment(5401), makeComment(5402), makeComment(5403)];

export const pullRequestThreads: GitPullRequestCommentThread[] = [
    makePullRequestThread(5301, CommentThreadStatus.Active, pullRequestThreadComments),
    makePullRequestThread(5302, CommentThreadStatus.Fixed, [makeComment(5411)])
];

export const makeAsyncRefOperation = (generatedRefName: string): GitAsyncRefOperation => ({
    _links: {},
    detailedStatus: {
        conflict: false,
        currentCommitId: fake.git.commitSha(),
        failureMessage: "",
        progress: 1,
        status: GitAsyncRefOperationFailureStatus.None,
        timedout: false
    },
    parameters: {
        generatedRefName,
        ontoRefName: "refs/heads/main",
        repository: makeGitRepository(),
        source: {
            commitList: [makeCommit()],
            pullRequestId: fake.number.int({ min: 1, max: 10_000 })
        }
    },
    status: GitAsyncOperationStatus.Completed,
    url: fake.internet.url()
});

export const makeCherryPick = (cherryPickId: number, generatedRefName: string): GitCherryPick => ({
    ...makeAsyncRefOperation(generatedRefName),
    cherryPickId
});

export const cherryPicks: GitCherryPick[] = [
    makeCherryPick(6001, "refs/heads/cherry-pick/hotfix"),
    makeCherryPick(6002, "refs/heads/cherry-pick/release"),
    {
        ...makeCherryPick(6003, "refs/heads/cherry-pick/feature"),
        status: GitAsyncOperationStatus.Abandoned
    }
];

export const cherryPickConflicts: GitConflict[] = [
    makeGitConflict(6201, "/README.md", GitResolutionStatus.Unresolved),
    makeGitConflict(6202, "/src/index.ts", GitResolutionStatus.Resolved),
    makeGitConflict(6203, "/package.json", GitResolutionStatus.PartiallyResolved),
    makeGitConflict(6204, "/src/git/Data.ts", GitResolutionStatus.Resolved)
];

export const makeRevert = (revertId: number, generatedRefName: string): GitRevert => ({
    ...makeAsyncRefOperation(generatedRefName),
    revertId
});

export const reverts: GitRevert[] = [
    makeRevert(6101, "refs/heads/revert/hotfix"),
    makeRevert(6102, "refs/heads/revert/release"),
    {
        ...makeRevert(6103, "refs/heads/revert/feature"),
        status: GitAsyncOperationStatus.Abandoned
    }
];

export const revertConflicts: GitConflict[] = [
    makeGitConflict(6301, "/README.md", GitResolutionStatus.Resolved),
    makeGitConflict(6302, "/src/index.ts", GitResolutionStatus.Unresolved),
    makeGitConflict(6303, "/package.json", GitResolutionStatus.Resolved)
];

export const makeAttachment = (id: number, displayName: string): Attachment => ({
    _links: {},
    author: makeIdentityRef(),
    contentHash: fake.git.commitSha(),
    createdDate: fake.date.recent(),
    description: fake.lorem.sentence(),
    displayName,
    id,
    properties: {},
    url: fake.internet.url()
});

export const pullRequestAttachments: Attachment[] = [
    makeAttachment(6401, "design.png"),
    makeAttachment(6402, "trace.log"),
    makeAttachment(6403, "notes.md")
];

export const commentLikes: IdentityRef[] = [
    { ...makeIdentityRef(), id: "liker-approver" },
    { ...makeIdentityRef(), id: "liker-reviewer" }
];

export const likedComments: Comment[] = [
    { ...makeComment(6501), usersLiked: commentLikes },
    { ...makeComment(6502), usersLiked: [{ ...makeIdentityRef(), id: "liker-observer" }] }
];

export const makeEnablementStatus = (
    projectId: string,
    repositoryId: string,
    enabled: boolean
): AdvSecEnablementStatus => ({
    changedById: fake.string.uuid(),
    changedOnDate: fake.date.recent(),
    dependabotEnabled: enabled,
    dependencyScanningInjectionEnabled: enabled,
    enabled,
    projectId,
    repositoryId
});

export const advSecProjectIds: string[] = [fake.string.uuid(), fake.string.uuid()];

export const enablementStatuses: AdvSecEnablementStatus[] = [
    makeEnablementStatus(advSecProjectIds[0], repositories[0].id, true),
    makeEnablementStatus(advSecProjectIds[0], repositories[1].id, true),
    makeEnablementStatus(advSecProjectIds[0], repositories[2].id, false),
    makeEnablementStatus(advSecProjectIds[1], repositories[3].id, false),
    makeEnablementStatus(advSecProjectIds[1], repositories[4].id, false)
];

export const makeBillablePusher = (projectId: string, repoId: string): BillablePusher => ({
    projectId,
    repoId,
    vsid: fake.string.uuid()
});

export const billablePushers: BillablePusher[] = [
    makeBillablePusher(advSecProjectIds[0], repositories[0].id),
    makeBillablePusher(advSecProjectIds[0], repositories[1].id),
    makeBillablePusher(advSecProjectIds[1], repositories[3].id)
];

export const makeBillableCommitter = (repoId: string): BillableCommitter => ({
    repoId,
    vsid: fake.string.uuid()
});

export const billableCommitters: BillableCommitter[] = [
    makeBillableCommitter(repositories[0].id),
    makeBillableCommitter(repositories[0].id),
    makeBillableCommitter(repositories[1].id),
    makeBillableCommitter(repositories[1].id)
];

export const makeBillableCommitterDetail = (
    projectId: string,
    committer: BillableCommitter
): BillableCommitterDetail => ({
    ...committer,
    commitId: fake.git.commitSha(),
    committerEmail: fake.internet.email(),
    commitTime: fake.date.recent(),
    displayName: fake.person.fullName(),
    mailNickName: fake.internet.username(),
    projectId,
    projectName: fake.lorem.slug(),
    pushedTime: fake.date.recent(),
    pusherId: fake.string.uuid(),
    pushId: fake.number.id(),
    repoName: fake.lorem.slug(),
    samAccountName: fake.internet.username()
});

export const billableCommitterDetails: BillableCommitterDetail[] = billableCommitters.map(committer =>
    makeBillableCommitterDetail(advSecProjectIds[0], committer)
);

export const makeRefFavorite = (
    name: string,
    repositoryId: string,
    identityId: string,
    type: RefFavoriteType = RefFavoriteType.Ref
): GitRefFavorite => ({
    _links: {},
    id: fake.number.id(),
    identityId,
    name,
    repositoryId,
    type,
    url: fake.internet.url()
});

export const refFavoriteIdentityIds: string[] = [fake.string.uuid(), fake.string.uuid()];

export const refFavorites: GitRefFavorite[] = [
    makeRefFavorite("refs/heads/main", repositories[0].id, refFavoriteIdentityIds[0]),
    makeRefFavorite("refs/heads/release", repositories[0].id, refFavoriteIdentityIds[1], RefFavoriteType.Folder),
    makeRefFavorite("refs/heads/develop", repositories[1].id, refFavoriteIdentityIds[0]),
    makeRefFavorite("refs/tags/v1.0.0", repositories[1].id, refFavoriteIdentityIds[1])
];
