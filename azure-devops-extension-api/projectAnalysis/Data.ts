import { fake } from "../common/fixtures";
import {
    AggregationType,
    CodeChangeTrendItem,
    LanguageStatistics,
    ProjectActivityMetrics,
    ProjectLanguageAnalytics,
    RepositoryActivityMetrics,
    RepositoryLanguageAnalytics,
    ResultPhase
} from "azure-devops-extension-api/ProjectAnalysis";
import { projects } from "../core/Data";
import { repositories } from "../git/Data";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const NAMESPACE_ID = "2e9eb7ed-3c0a-47d4-87c1-0ffdd275fd87";
const READ_PERMISSION = 2;
const LANGUAGES = ["TypeScript", "C#", "Python", "PowerShell"];

const percentage = (part: number, whole: number): number => Math.round((part / whole) * 10_000) / 100;

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

export const retimeCodeChangeTrend = (
    trend: CodeChangeTrendItem[],
    fromDate: Date,
    aggregationType: AggregationType
): CodeChangeTrendItem[] => {
    const bucket = aggregationType === AggregationType.Hourly ? HOUR_MS : DAY_MS;
    return trend.map((item, index) => ({ ...item, time: new Date(fromDate.getTime() + index * bucket) }));
};

export const makeCodeChangeTrend = (length = 7): CodeChangeTrendItem[] =>
    retimeCodeChangeTrend(
        Array.from({ length }, () => ({ time: new Date(), value: fake.number.int({ min: 0, max: 20 }) })),
        new Date(Date.now() - length * DAY_MS),
        AggregationType.Daily
    );

export const makeLanguageBreakdown = (projectId: string = fake.string.uuid()): LanguageStatistics[] => {
    const measured = LANGUAGES.map(name => ({
        name,
        bytes: fake.number.int({ min: 1_000, max: 500_000 }),
        files: fake.number.int({ min: 1, max: 200 })
    }));
    const bytes = sum(measured.map(language => language.bytes));
    const files = sum(measured.map(language => language.files));
    return measured.map(language => ({
        ...language,
        filesPercentage: percentage(language.files, files),
        languagePercentage: percentage(language.bytes, bytes),
        namespaceId: NAMESPACE_ID,
        projectId,
        requiredPermissions: READ_PERMISSION
    }));
};

export const makeRepositoryLanguageAnalytics = (
    projectId: string = fake.string.uuid()
): RepositoryLanguageAnalytics => ({
    id: fake.string.uuid(),
    name: fake.lorem.slug(2),
    languageBreakdown: makeLanguageBreakdown(projectId),
    resultPhase: ResultPhase.Full,
    updatedTime: fake.date.recent(),
    namespaceId: NAMESPACE_ID,
    projectId,
    requiredPermissions: READ_PERMISSION
});

export const makeProjectLanguageAnalytics = (projectId: string = fake.string.uuid()): ProjectLanguageAnalytics => ({
    id: projectId,
    languageBreakdown: makeLanguageBreakdown(projectId),
    repositoryLanguageAnalytics: [makeRepositoryLanguageAnalytics(projectId), makeRepositoryLanguageAnalytics(projectId)],
    resultPhase: ResultPhase.Full,
    url: fake.internet.url(),
    namespaceId: NAMESPACE_ID,
    projectId,
    requiredPermissions: READ_PERMISSION
});

export const makeProjectActivityMetrics = (projectId: string = fake.string.uuid()): ProjectActivityMetrics => {
    const codeChangesTrend = makeCodeChangeTrend();
    const pullRequestsCompletedCount = fake.number.int({ min: 0, max: 20 });
    return {
        projectId,
        authorsCount: fake.number.int({ min: 1, max: 15 }),
        codeChangesCount: sum(codeChangesTrend.map(item => item.value)),
        codeChangesTrend,
        pullRequestsCompletedCount,
        pullRequestsCreatedCount: pullRequestsCompletedCount + fake.number.int({ min: 0, max: 5 })
    };
};

export const makeRepositoryActivityMetrics = (
    repositoryId: string = fake.string.uuid()
): RepositoryActivityMetrics => {
    const codeChangesTrend = makeCodeChangeTrend();
    return {
        repositoryId,
        codeChangesCount: sum(codeChangesTrend.map(item => item.value)),
        codeChangesTrend
    };
};

export const projectLanguageAnalytics: ProjectLanguageAnalytics[] = projects.map(project =>
    makeProjectLanguageAnalytics(project.id)
);

export const projectActivityMetrics: ProjectActivityMetrics[] = projects.map(project =>
    makeProjectActivityMetrics(project.id)
);

export const repositoryActivityMetrics: RepositoryActivityMetrics[] = repositories.map(repository =>
    makeRepositoryActivityMetrics(repository.id)
);
