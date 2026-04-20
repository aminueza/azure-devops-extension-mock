import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
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
    GitPullRequestSearchCriteria
} from "azure-devops-extension-api/Git";
import {
    branches,
    commits,
    items,
    makeCommit,
    makeCommentThread,
    makeGitItem,
    makeGitRepository,
    makePullRequest,
    makePush,
    pullRequests,
    refs,
    repositories,
    makeBranchStats,
    makeGitRef
} from "./Data";

/**
 * Mocked GitRestClient — covers repository, branch, commit, ref, item, push,
 * and pull-request lookups commonly used by extensions.
 */
export class MockGitRestClient extends RestClientBase {
    public TYPE = GitRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    // Repositories
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

    // Refs
    getRefs(_repositoryId: string, _project?: string, filter?: string): Promise<GitRef[]> {
        if (!filter) return Promise.resolve(refs);
        return Promise.resolve(refs.filter(r => r.name.includes(filter)));
    }

    updateRef(): Promise<GitRef> {
        return Promise.resolve(makeGitRef());
    }

    // Branches
    getBranches(_repositoryId: string, _project?: string): Promise<GitBranchStats[]> {
        return Promise.resolve(branches);
    }

    getBranch(_repositoryId: string, name: string): Promise<GitBranchStats> {
        const found = branches.find(b => b.name === name);
        return Promise.resolve(found ?? makeBranchStats(name));
    }

    // Commits
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

    // Items (file tree / content)
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

    // Pushes
    getPushes(_repositoryId: string): Promise<GitPush[]> {
        return Promise.resolve([makePush(), makePush()]);
    }

    getPush(_repositoryId: string, pushId: number): Promise<GitPush> {
        return Promise.resolve({ ...makePush(), pushId });
    }

    createPush(push: GitPush): Promise<GitPush> {
        return Promise.resolve({ ...makePush(), ...push });
    }

    // Pull requests
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

    // PR threads/comments
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
}
