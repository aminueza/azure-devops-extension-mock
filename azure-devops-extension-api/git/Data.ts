import { fake } from "../common/fixtures";
import {
    Comment,
    CommentThreadStatus,
    CommentType,
    GitConflictUpdateResult,
    GitConflictUpdateStatus,
    GitRepository,
    GitRepositoryRef,
    GitPullRequest,
    GitPullRequestCommentThread,
    GitCommitRef,
    GitBranchStats,
    GitRef,
    GitItem,
    GitVersionType,
    PullRequestStatus,
    GitObjectType,
    GitPullRequestStatus,
    GitPush,
    GitAnnotatedTag,
    GitAsyncOperationStatus,
    GitChange,
    GitCommitDiffs,
    GitConflict,
    GitConflictType,
    GitDeletedRepository,
    GitForkSyncRequest,
    GitImportRequest,
    GitMerge,
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
    VersionControlChangeType
} from "azure-devops-extension-api/Git";
import { WebApiTagDefinition } from "azure-devops-extension-api/Core";
import { ResourceRef } from "azure-devops-extension-api/WebApi";
import {
    makeIdentityRef,
    makeProjectCollectionReference,
    makeProjectReference,
    makeTagDefinition
} from "../core/Data";

export const makeGitRepository = (): GitRepository => ({
    id: fake.string.uuid(),
    name: fake.lorem.slug(),
    url: fake.internet.url(),
    remoteUrl: fake.internet.url(),
    sshUrl: `git@${fake.internet.domainName()}:${fake.lorem.slug()}.git`,
    webUrl: fake.internet.url(),
    defaultBranch: "refs/heads/main",
    size: fake.number.int({ min: 1024, max: 10_000_000 }),
    isFork: false,
    isDisabled: false,
    isInMaintenance: false,
    project: makeProjectReference() as any,
    _links: {} as any
} as unknown as GitRepository);

export const makeGitRef = (name = "refs/heads/main"): GitRef => ({
    name,
    objectId: fake.git.commitSha(),
    creator: makeIdentityRef(),
    url: fake.internet.url(),
    _links: {} as any
} as unknown as GitRef);

export const makeCommit = (): GitCommitRef => ({
    commitId: fake.git.commitSha(),
    author: {
        name: fake.person.fullName(),
        email: fake.internet.email(),
        date: fake.date.recent()
    },
    committer: {
        name: fake.person.fullName(),
        email: fake.internet.email(),
        date: fake.date.recent()
    },
    comment: fake.git.commitMessage(),
    url: fake.internet.url(),
    remoteUrl: fake.internet.url(),
    parents: [fake.git.commitSha()]
} as unknown as GitCommitRef);

export const makePullRequest = (): GitPullRequest => ({
    pullRequestId: fake.number.int({ min: 1, max: 10_000 }),
    codeReviewId: fake.number.int(),
    status: PullRequestStatus.Active,
    createdBy: makeIdentityRef(),
    creationDate: fake.date.recent(),
    title: fake.lorem.sentence(),
    description: fake.lorem.paragraph(),
    sourceRefName: `refs/heads/${fake.git.branch()}`,
    targetRefName: "refs/heads/main",
    mergeStatus: 3 as any,
    isDraft: false,
    reviewers: [],
    url: fake.internet.url(),
    repository: makeGitRepository(),
    labels: [],
    workItemRefs: [],
    _links: {} as any
} as unknown as GitPullRequest);

export const makeBranchStats = (name = "main"): GitBranchStats => ({
    name,
    aheadCount: fake.number.int({ min: 0, max: 5 }),
    behindCount: fake.number.int({ min: 0, max: 20 }),
    isBaseVersion: name === "main",
    commit: makeCommit()
} as unknown as GitBranchStats);

export const makeGitItem = (path = "/README.md"): GitItem => ({
    objectId: fake.git.commitSha(),
    commitId: fake.git.commitSha(),
    path,
    isFolder: path.endsWith("/"),
    url: fake.internet.url(),
    gitObjectType: path.endsWith("/") ? GitObjectType.Tree : GitObjectType.Blob,
    latestProcessedChange: makeCommit(),
    _links: {} as any
} as unknown as GitItem);

export const makePush = (): GitPush => ({
    pushId: fake.number.int({ min: 1, max: 10_000 }),
    date: fake.date.recent(),
    pushedBy: makeIdentityRef(),
    url: fake.internet.url(),
    refUpdates: [],
    commits: [makeCommit()],
    repository: makeGitRepository()
} as unknown as GitPush);

export const makeCommentThread = (): GitPullRequestCommentThread => ({
    id: fake.number.int(),
    pullRequestThreadContext: {
        iterationContext: {
            firstComparingIteration: 1,
            secondComparingIteration: 2
        },
        changeTrackingId: fake.number.int()
    },
    status: 1 as any,
    comments: [{
        id: 1,
        parentCommentId: 0,
        author: makeIdentityRef(),
        content: fake.lorem.sentence(),
        publishedDate: fake.date.recent(),
        lastUpdatedDate: fake.date.recent(),
        lastContentUpdatedDate: fake.date.recent(),
        commentType: 1
    }] as any,
    lastUpdatedDate: fake.date.recent(),
    publishedDate: fake.date.recent(),
    _links: {} as any
} as unknown as GitPullRequestCommentThread);

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
    sourceToTargetRefs: [
        { sourceRef: "refs/heads/main", targetRef: "refs/heads/main" }
    ],
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

export const makeGitUserDate = (): GitUserDate => ({
    date: fake.date.recent(),
    email: fake.internet.email(),
    imageUrl: fake.internet.url(),
    name: fake.person.fullName()
});

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
export const refs: GitRef[] = [
    makeGitRef("refs/heads/main"),
    makeGitRef("refs/heads/develop"),
    makeGitRef(`refs/heads/feature/${fake.lorem.slug()}`),
    makeGitRef("refs/tags/v1.0.0")
];
export const commits: GitCommitRef[] = Array.from({ length: 10 }, makeCommit);
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

export const makePushRef = (pushId: number): GitPushRef => ({
    _links: {},
    date: fake.date.recent(),
    pushCorrelationId: fake.string.uuid(),
    pushedBy: makeIdentityRef(),
    pushId,
    url: fake.internet.url()
});

export const makePullRequestChange = (
    path: string,
    changeTrackingId: number
): GitPullRequestChange => ({
    ...makeGitChange(path),
    changeTrackingId
});

export const makePullRequestIteration = (
    id: number,
    reason: IterationReason
): GitPullRequestIteration => ({
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

export const makeFileDiffDetail = (path: string): FileDiffDetail => ({
    changeType: VersionControlChangeType.Edit,
    isFolder: path.endsWith("/"),
    isLinuxExecutable: false,
    isSymbolicLink: false,
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
        ...makeGitConflict(
            conflict.conflictId,
            conflict.conflictPath,
            GitResolutionStatus.Resolved
        ),
        ...conflict,
        resolutionStatus: GitResolutionStatus.Resolved
    },
    updateStatus: GitConflictUpdateStatus.Succeeded
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

export const makePullRequestThread = (
    id: number,
    status: CommentThreadStatus,
    comments: Comment[]
): GitPullRequestCommentThread => ({
    ...makeCommentThread(),
    comments,
    id,
    status
});

export const pullRequestThreadComments: Comment[] = [
    makeComment(5401),
    makeComment(5402),
    makeComment(5403)
];

export const pullRequestThreads: GitPullRequestCommentThread[] = [
    makePullRequestThread(5301, CommentThreadStatus.Active, pullRequestThreadComments),
    makePullRequestThread(5302, CommentThreadStatus.Fixed, [makeComment(5411)])
];
