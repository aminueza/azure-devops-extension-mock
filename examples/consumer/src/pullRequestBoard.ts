import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IProjectPageService } from "azure-devops-extension-api";
import { GitRestClient, PullRequestStatus } from "azure-devops-extension-api/Git";
import { TestRestClient } from "azure-devops-extension-api/Test";

export interface PullRequestRow {
    id: number;
    title: string;
    author: string;
    repository: string;
}

export interface Board {
    user: string;
    project: string;
    pullRequests: PullRequestRow[];
    completedRuns: number;
}

export async function loadBoard(): Promise<Board> {
    await SDK.ready();
    const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
    const project = await projectService.getProject();
    if (!project) {
        throw new Error("The extension is not running inside a project");
    }

    const git = getClient(GitRestClient);
    const repositories = await git.getRepositories(project.name);
    const pullRequests: PullRequestRow[] = [];
    for (const repository of repositories) {
        const found = await git.getPullRequests(repository.id, {
            status: PullRequestStatus.Active
        } as Parameters<GitRestClient["getPullRequests"]>[1]);
        for (const pullRequest of found) {
            pullRequests.push({
                id: pullRequest.pullRequestId,
                title: pullRequest.title,
                author: pullRequest.createdBy.displayName,
                repository: repository.name
            });
        }
    }

    const runs = await getClient(TestRestClient).getTestRuns(project.name);
    return {
        user: SDK.getUser().displayName,
        project: project.name,
        pullRequests,
        completedRuns: runs.filter(run => run.state === "Completed").length
    };
}
