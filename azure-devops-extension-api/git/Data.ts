import { fake } from "../common/fixtures";
import {
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
    GitPush
} from "azure-devops-extension-api/Git";
import { makeIdentityRef, makeProjectReference } from "../core/Data";

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
