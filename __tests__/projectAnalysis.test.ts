import { AggregationType, ProjectAnalysisRestClient, ResultPhase } from "azure-devops-extension-api/ProjectAnalysis";
import { getClient, getRegisteredMockClient, MockProjectAnalysisRestClient } from "../azure-devops-extension-api";
import { projects } from "../azure-devops-extension-api/core/Data";
import { repositories } from "../azure-devops-extension-api/git/Data";
import {
    makeCodeChangeTrend,
    makeLanguageBreakdown,
    makeProjectActivityMetrics,
    makeProjectLanguageAnalytics,
    makeRepositoryActivityMetrics,
    makeRepositoryLanguageAnalytics,
    projectActivityMetrics,
    projectLanguageAnalytics,
    repositoryActivityMetrics,
    retimeCodeChangeTrend
} from "../azure-devops-extension-api/projectAnalysis/Data";

const HOUR_MS = 3_600_000;
const FROM = new Date("2026-01-05T00:00:00Z");

const steps = (times: Date[]): number[] => times.slice(1).map((time, index) => time.getTime() - times[index].getTime());

describe("ProjectAnalysisRestClient mock", () => {
    const client = getClient(ProjectAnalysisRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(ProjectAnalysisRestClient)).toBe(MockProjectAnalysisRestClient);
    });

    it("gets the language analytics of a known project", async () => {
        const analytics = await client.getProjectLanguageAnalytics(projects[1].id);
        expect(analytics).toBe(projectLanguageAnalytics[1]);
        expect(analytics.projectId).toBe(projects[1].id);
    });

    it("fabricates the language analytics of an unknown project", async () => {
        const analytics = await client.getProjectLanguageAnalytics("missing-project");
        expect(analytics.id).toBe("missing-project");
        expect(analytics.projectId).toBe("missing-project");
        expect(analytics.resultPhase).toBe(ResultPhase.Full);
        expect(analytics.languageBreakdown.every(l => l.projectId === "missing-project")).toBe(true);
        expect(analytics.repositoryLanguageAnalytics.every(r => r.projectId === "missing-project")).toBe(true);
    });

    it("gets the daily activity metrics of a known project", async () => {
        const seeded = projectActivityMetrics[0];
        const metrics = await client.getProjectActivityMetrics(projects[0].id, FROM, AggregationType.Daily);
        expect(metrics).toEqual({ ...seeded, codeChangesTrend: metrics.codeChangesTrend });
        expect(metrics.codeChangesTrend.map(i => i.value)).toEqual(seeded.codeChangesTrend.map(i => i.value));
        expect(metrics.codeChangesTrend[0].time).toEqual(FROM);
        expect(new Set(steps(metrics.codeChangesTrend.map(i => i.time)))).toEqual(new Set([24 * HOUR_MS]));
        expect(seeded.codeChangesTrend[0].time).not.toEqual(FROM);
    });

    it("gets the hourly activity metrics of an unknown project", async () => {
        const metrics = await client.getProjectActivityMetrics("missing-project", FROM, AggregationType.Hourly);
        expect(metrics.projectId).toBe("missing-project");
        expect(metrics.codeChangesTrend[0].time).toEqual(FROM);
        expect(new Set(steps(metrics.codeChangesTrend.map(i => i.time)))).toEqual(new Set([HOUR_MS]));
        expect(metrics.codeChangesCount).toBe(metrics.codeChangesTrend.reduce((total, i) => total + i.value, 0));
    });

    it("lists the activity metrics of every repository", async () => {
        const list = await client.getGitRepositoriesActivityMetrics("proj", FROM, AggregationType.Daily, 0, 100);
        expect(list.map(m => m.repositoryId)).toEqual(repositories.map(r => r.id));
        expect(list.map(m => m.codeChangesCount)).toEqual(repositoryActivityMetrics.map(m => m.codeChangesCount));
        for (const metrics of list) {
            expect(metrics.codeChangesTrend[0].time).toEqual(FROM);
            expect(metrics.codeChangesTrend[1].time.getTime() - FROM.getTime()).toBe(24 * HOUR_MS);
        }
    });

    it("lists repository activity metrics with skip and top", async () => {
        const list = await client.getGitRepositoriesActivityMetrics("proj", FROM, AggregationType.Hourly, 1, 2);
        expect(list.map(m => m.repositoryId)).toEqual([repositories[1].id, repositories[2].id]);
        expect(list[0].codeChangesTrend[1].time.getTime() - FROM.getTime()).toBe(HOUR_MS);
        expect(await client.getGitRepositoriesActivityMetrics("proj", FROM, AggregationType.Hourly, 50, 2)).toEqual([]);
    });

    it("gets the activity metrics of a known repository", async () => {
        const seeded = repositoryActivityMetrics[2];
        const metrics = await client.getRepositoryActivityMetrics(
            "proj",
            seeded.repositoryId,
            FROM,
            AggregationType.Hourly
        );
        expect(metrics.repositoryId).toBe(seeded.repositoryId);
        expect(metrics.codeChangesCount).toBe(seeded.codeChangesCount);
        expect(metrics.codeChangesTrend.map(i => i.value)).toEqual(seeded.codeChangesTrend.map(i => i.value));
        expect(new Set(steps(metrics.codeChangesTrend.map(i => i.time)))).toEqual(new Set([HOUR_MS]));
    });

    it("fabricates the activity metrics of an unknown repository", async () => {
        const metrics = await client.getRepositoryActivityMetrics(
            "proj",
            "missing-repository",
            FROM,
            AggregationType.Daily
        );
        expect(metrics.repositoryId).toBe("missing-repository");
        expect(metrics.codeChangesTrend.length).toBe(7);
        expect(metrics.codeChangesTrend[0].time).toEqual(FROM);
    });
});

describe("project analysis fixtures", () => {
    it("retimes a trend into hourly or daily buckets without touching the source", () => {
        const source = [
            { time: new Date(0), value: 4 },
            { time: new Date(0), value: 9 }
        ];
        const hourly = retimeCodeChangeTrend(source, FROM, AggregationType.Hourly);
        expect(hourly).toEqual([
            { time: FROM, value: 4 },
            { time: new Date(FROM.getTime() + HOUR_MS), value: 9 }
        ]);
        const daily = retimeCodeChangeTrend(source, FROM, AggregationType.Daily);
        expect(daily[1].time).toEqual(new Date(FROM.getTime() + 24 * HOUR_MS));
        expect(source[0].time).toEqual(new Date(0));
        expect(retimeCodeChangeTrend([], FROM, AggregationType.Daily)).toEqual([]);
    });

    it("makes a daily trend that ends before now", () => {
        const trend = makeCodeChangeTrend();
        expect(trend.length).toBe(7);
        expect(new Set(steps(trend.map(i => i.time)))).toEqual(new Set([24 * HOUR_MS]));
        expect(trend[6].time.getTime()).toBeLessThan(Date.now());
        for (const item of trend) {
            expect(item.value).toBeGreaterThanOrEqual(0);
            expect(item.value).toBeLessThanOrEqual(20);
        }
        expect(makeCodeChangeTrend(3).length).toBe(3);
    });

    it("makes a language breakdown whose percentages add up", () => {
        const breakdown = makeLanguageBreakdown("project-1");
        expect(breakdown.map(l => l.name)).toEqual(["TypeScript", "C#", "Python", "PowerShell"]);
        expect(breakdown.reduce((total, l) => total + l.languagePercentage, 0)).toBeCloseTo(100, 0);
        expect(breakdown.reduce((total, l) => total + l.filesPercentage, 0)).toBeCloseTo(100, 0);
        expect(breakdown.every(l => l.projectId === "project-1")).toBe(true);
        expect(typeof makeLanguageBreakdown()[0].projectId).toBe("string");
    });

    it("makes repository language analytics", () => {
        const analytics = makeRepositoryLanguageAnalytics("project-1");
        expect(analytics.projectId).toBe("project-1");
        expect(analytics.languageBreakdown.length).toBe(4);
        expect(analytics.updatedTime).toBeInstanceOf(Date);
        expect(typeof makeRepositoryLanguageAnalytics().projectId).toBe("string");
    });

    it("makes project language analytics", () => {
        const analytics = makeProjectLanguageAnalytics();
        expect(analytics.id).toBe(analytics.projectId);
        expect(analytics.repositoryLanguageAnalytics.length).toBe(2);
        expect(new Set(analytics.repositoryLanguageAnalytics.map(r => r.id)).size).toBe(2);
        expect(analytics.requiredPermissions).toBe(2);
    });

    it("makes project activity metrics", () => {
        const metrics = makeProjectActivityMetrics();
        expect(typeof metrics.projectId).toBe("string");
        expect(metrics.codeChangesCount).toBe(metrics.codeChangesTrend.reduce((total, i) => total + i.value, 0));
        expect(metrics.pullRequestsCreatedCount).toBeGreaterThanOrEqual(metrics.pullRequestsCompletedCount);
        expect(metrics.authorsCount).toBeGreaterThan(0);
    });

    it("makes repository activity metrics", () => {
        const metrics = makeRepositoryActivityMetrics();
        expect(typeof metrics.repositoryId).toBe("string");
        expect(metrics.codeChangesCount).toBe(metrics.codeChangesTrend.reduce((total, i) => total + i.value, 0));
    });

    it("seeds one entry per project and per repository", () => {
        expect(projectLanguageAnalytics.map(a => a.projectId)).toEqual(projects.map(p => p.id));
        expect(projectActivityMetrics.map(m => m.projectId)).toEqual(projects.map(p => p.id));
        expect(repositoryActivityMetrics.map(m => m.repositoryId)).toEqual(repositories.map(r => r.id));
    });
});
