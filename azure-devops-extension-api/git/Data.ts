import { faker } from "@faker-js/faker";
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
    id: faker.string.uuid(),
    name: faker.lorem.slug(),
    url: faker.internet.url(),
    remoteUrl: faker.internet.url(),
    sshUrl: `git@${faker.internet.domainName()}:${faker.lorem.slug()}.git`,
    webUrl: faker.internet.url(),
    defaultBranch: "refs/heads/main",
    size: faker.number.int({ min: 1024, max: 10_000_000 }),
    isFork: false,
    isDisabled: false,
    isInMaintenance: false,
    project: makeProjectReference() as any,
    _links: {} as any
} as unknown as GitRepository);

export const makeGitRef = (name = "refs/heads/main"): GitRef => ({
    name,
    objectId: faker.git.commitSha(),
    creator: makeIdentityRef(),
    url: faker.internet.url(),
    _links: {} as any
} as unknown as GitRef);

export const makeCommit = (): GitCommitRef => ({
    commitId: faker.git.commitSha(),
    author: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        date: faker.date.recent()
    },
    committer: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        date: faker.date.recent()
    },
    comment: faker.git.commitMessage(),
    url: faker.internet.url(),
    remoteUrl: faker.internet.url(),
    parents: [faker.git.commitSha()]
} as unknown as GitCommitRef);

export const makePullRequest = (): GitPullRequest => ({
    pullRequestId: faker.number.int({ min: 1, max: 10_000 }),
    codeReviewId: faker.number.int(),
    status: PullRequestStatus.Active,
    createdBy: makeIdentityRef(),
    creationDate: faker.date.recent(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    sourceRefName: `refs/heads/${faker.git.branch()}`,
    targetRefName: "refs/heads/main",
    mergeStatus: 3 as any,
    isDraft: false,
    reviewers: [],
    url: faker.internet.url(),
    repository: makeGitRepository(),
    labels: [],
    workItemRefs: [],
    _links: {} as any
} as unknown as GitPullRequest);

export const makeBranchStats = (name = "main"): GitBranchStats => ({
    name,
    aheadCount: faker.number.int({ min: 0, max: 5 }),
    behindCount: faker.number.int({ min: 0, max: 20 }),
    isBaseVersion: name === "main",
    commit: makeCommit()
} as unknown as GitBranchStats);

export const makeGitItem = (path = "/README.md"): GitItem => ({
    objectId: faker.git.commitSha(),
    commitId: faker.git.commitSha(),
    path,
    isFolder: path.endsWith("/"),
    url: faker.internet.url(),
    gitObjectType: path.endsWith("/") ? GitObjectType.Tree : GitObjectType.Blob,
    latestProcessedChange: makeCommit(),
    _links: {} as any
} as unknown as GitItem);

export const makePush = (): GitPush => ({
    pushId: faker.number.int({ min: 1, max: 10_000 }),
    date: faker.date.recent(),
    pushedBy: makeIdentityRef(),
    url: faker.internet.url(),
    refUpdates: [],
    commits: [makeCommit()],
    repository: makeGitRepository()
} as unknown as GitPush);

export const makeCommentThread = (): GitPullRequestCommentThread => ({
    id: faker.number.int(),
    pullRequestThreadContext: {
        iterationContext: {
            firstComparingIteration: 1,
            secondComparingIteration: 2
        },
        changeTrackingId: faker.number.int()
    },
    status: 1 as any,
    comments: [{
        id: 1,
        parentCommentId: 0,
        author: makeIdentityRef(),
        content: faker.lorem.sentence(),
        publishedDate: faker.date.recent(),
        lastUpdatedDate: faker.date.recent(),
        lastContentUpdatedDate: faker.date.recent(),
        commentType: 1
    }] as any,
    lastUpdatedDate: faker.date.recent(),
    publishedDate: faker.date.recent(),
    _links: {} as any
} as unknown as GitPullRequestCommentThread);

export const repositories: GitRepository[] = Array.from({ length: 5 }, makeGitRepository);
export const pullRequests: GitPullRequest[] = Array.from({ length: 5 }, makePullRequest);
export const refs: GitRef[] = [
    makeGitRef("refs/heads/main"),
    makeGitRef("refs/heads/develop"),
    makeGitRef(`refs/heads/feature/${faker.lorem.slug()}`),
    makeGitRef("refs/tags/v1.0.0")
];
export const commits: GitCommitRef[] = Array.from({ length: 10 }, makeCommit);
export const branches: GitBranchStats[] = [
    makeBranchStats("main"),
    makeBranchStats("develop"),
    makeBranchStats(`feature/${faker.lorem.slug()}`)
];
export const items: GitItem[] = [
    makeGitItem("/README.md"),
    makeGitItem("/src/"),
    makeGitItem("/src/index.ts"),
    makeGitItem("/package.json")
];
