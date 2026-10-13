import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    AggregationType,
    ProjectActivityMetrics,
    ProjectAnalysisRestClient,
    ProjectLanguageAnalytics,
    RepositoryActivityMetrics
} from "azure-devops-extension-api/ProjectAnalysis";
import {
    makeProjectActivityMetrics,
    makeProjectLanguageAnalytics,
    makeRepositoryActivityMetrics,
    projectActivityMetrics,
    projectLanguageAnalytics,
    repositoryActivityMetrics,
    retimeCodeChangeTrend
} from "./Data";

const findLanguageAnalytics = (project: string): ProjectLanguageAnalytics =>
    projectLanguageAnalytics.find(a => a.projectId === project) ?? makeProjectLanguageAnalytics(project);

const findProjectMetrics = (project: string): ProjectActivityMetrics =>
    projectActivityMetrics.find(m => m.projectId === project) ?? makeProjectActivityMetrics(project);

const findRepositoryMetrics = (repositoryId: string): RepositoryActivityMetrics =>
    repositoryActivityMetrics.find(m => m.repositoryId === repositoryId) ?? makeRepositoryActivityMetrics(repositoryId);

const retime = <T extends RepositoryActivityMetrics | ProjectActivityMetrics>(
    metrics: T,
    fromDate: Date,
    aggregationType: AggregationType
): T => ({
    ...metrics,
    codeChangesTrend: retimeCodeChangeTrend(metrics.codeChangesTrend, fromDate, aggregationType)
});

export class MockProjectAnalysisRestClient extends RestClientBase {
    public TYPE = ProjectAnalysisRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getProjectLanguageAnalytics(project: string): Promise<ProjectLanguageAnalytics> {
        return Promise.resolve(findLanguageAnalytics(project));
    }

    getProjectActivityMetrics(
        project: string,
        fromDate: Date,
        aggregationType: AggregationType
    ): Promise<ProjectActivityMetrics> {
        return Promise.resolve(retime(findProjectMetrics(project), fromDate, aggregationType));
    }

    getGitRepositoriesActivityMetrics(
        _project: string,
        fromDate: Date,
        aggregationType: AggregationType,
        skip: number,
        top: number
    ): Promise<RepositoryActivityMetrics[]> {
        return Promise.resolve(
            repositoryActivityMetrics.slice(skip, skip + top).map(m => retime(m, fromDate, aggregationType))
        );
    }

    getRepositoryActivityMetrics(
        _project: string,
        repositoryId: string,
        fromDate: Date,
        aggregationType: AggregationType
    ): Promise<RepositoryActivityMetrics> {
        return Promise.resolve(retime(findRepositoryMetrics(repositoryId), fromDate, aggregationType));
    }
}
