import { BuildRestClient, StageUpdateType } from "azure-devops-extension-api/Build";

import { getClient } from "../azure-devops-extension-api";
import {
    attachments,
    attachmentType,
    buildLogLines,
    buildProperties,
    buildReports,
    buildSettings,
    generalSettings,
    makeAttachment,
    makeSourceRepositoryItem,
    optionDefinitions,
    sourceRepositoryItems,
    stageTimelines
} from "../azure-devops-extension-api/build/Data";

describe("BuildRestClient mock attachments, logs and properties", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(BuildRestClient);

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getAttachments", () => client.getAttachments("proj", 1, attachmentType)],
        [
            "getAttachment",
            () => client.getAttachment("proj", 1, "timeline-1", "record-1", "logs", "build.log")
        ],
        ["getBuildLogLines", () => client.getBuildLogLines("proj", 1, 2)],
        ["getBuildLogZip", () => client.getBuildLogZip("proj", 1, 2)],
        ["getBuildLogsZip", () => client.getBuildLogsZip("proj", 1)],
        ["getBuildProperties", () => client.getBuildProperties("proj", 1)],
        [
            "updateBuildProperties",
            () => client.updateBuildProperties([{ path: "/channel", value: "stable" }] as any, "proj", 1)
        ],
        ["getBuildReport", () => client.getBuildReport("proj", buildReports[0].buildId)],
        [
            "getBuildReportHtmlContent",
            () => client.getBuildReportHtmlContent("proj", buildReports[0].buildId)
        ],
        [
            "getBuildStageLatestTimeline",
            () => client.getBuildStageLatestTimeline("proj", 1, "Build")
        ],
        [
            "getBuildStageTimeline",
            () => client.getBuildStageTimeline("proj", 1, "timeline-build", "Build")
        ],
        ["getBuildOptionDefinitions", () => client.getBuildOptionDefinitions("proj")],
        ["getBuildGeneralSettings", () => client.getBuildGeneralSettings("proj")],
        [
            "updateBuildGeneralSettings",
            () => client.updateBuildGeneralSettings({ ...generalSettings }, "proj")
        ],
        ["getBuildSettings", () => client.getBuildSettings("proj")],
        ["updateBuildSettings", () => client.updateBuildSettings({ ...buildSettings }, "proj")],
        ["getFile", () => client.getFile("proj", 1, "drop", "file-1", "app.zip")],
        ["getFileContents", () => client.getFileContents("proj", "TfsGit")],
        ["getPathContents", () => client.getPathContents("proj", "TfsGit")]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<unknown>]> = [
        [
            "updateStage",
            () =>
                client.updateStage(
                    {
                        forceRetryAllJobs: true,
                        retryDependencies: false,
                        state: StageUpdateType.Retry
                    },
                    1,
                    "Build",
                    "proj"
                )
        ]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("returns seeded attachments for the known type", async () => {
        const result = await client.getAttachments("proj", 1, attachmentType);
        expect(result.map(attachment => attachment.name)).toEqual(
            attachments.map(attachment => attachment.name)
        );
    });

    it("fabricates a single attachment for an unknown type", async () => {
        const result = await client.getAttachments("proj", 1, "absent-type");
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("absent-type");
    });

    it("encodes attachment content from type and name", async () => {
        const buffer = await client.getAttachment(
            "proj",
            1,
            "timeline-1",
            "record-1",
            "logs",
            "build.log"
        );
        expect(String.fromCharCode(...new Uint8Array(buffer))).toBe("logs:build.log");
    });

    it("returns every log line when no range is given", async () => {
        await expect(client.getBuildLogLines("proj", 1, 2)).resolves.toEqual(buildLogLines);
    });

    it("slices log lines by start and end", async () => {
        await expect(client.getBuildLogLines("proj", 1, 2, 1, 3)).resolves.toEqual(
            buildLogLines.slice(1, 3)
        );
    });

    it("slices log lines from a start line only", async () => {
        await expect(client.getBuildLogLines("proj", 1, 2, 4)).resolves.toEqual(
            buildLogLines.slice(4)
        );
    });

    it("encodes a log zip keyed by the log id alone", async () => {
        const buffer = await client.getBuildLogZip("proj", 1, 7);
        expect(String.fromCharCode(...new Uint8Array(buffer))).toBe("log-7");
    });

    it("encodes a log zip from a start line only", async () => {
        const buffer = await client.getBuildLogZip("proj", 1, 7, 2);
        expect(String.fromCharCode(...new Uint8Array(buffer))).toBe("log-7-2");
    });

    it("encodes a log zip including the requested range", async () => {
        const buffer = await client.getBuildLogZip("proj", 1, 7, 2, 5);
        expect(String.fromCharCode(...new Uint8Array(buffer))).toBe("log-7-2-5");
    });

    it("encodes a logs zip keyed by build id", async () => {
        const buffer = await client.getBuildLogsZip("proj", 99);
        expect(String.fromCharCode(...new Uint8Array(buffer))).toBe("logs-99");
    });

    it("returns all build properties when unfiltered", async () => {
        await expect(client.getBuildProperties("proj", 1)).resolves.toEqual(buildProperties);
    });

    it("returns only the filtered build properties", async () => {
        await expect(client.getBuildProperties("proj", 1, ["channel"])).resolves.toEqual({
            channel: buildProperties.channel
        });
    });

    it("echoes patched build properties over the seeded ones", async () => {
        const result = await client.updateBuildProperties(
            [{ path: "/channel", value: "stable" }] as any,
            "proj",
            1
        );
        expect(result).toEqual({ ...buildProperties, channel: "stable" });
    });

    it("builds an attachment fixture with the requested name", () => {
        expect(makeAttachment("extra.txt").name).toBe("extra.txt");
    });

    it("returns the seeded report for a known build", async () => {
        await expect(client.getBuildReport("proj", buildReports[0].buildId)).resolves.toEqual(
            buildReports[0]
        );
    });

    it("fabricates a report for an unknown build", async () => {
        const report = await client.getBuildReport("proj", Number.MAX_SAFE_INTEGER);
        expect(report.buildId).toBe(Number.MAX_SAFE_INTEGER);
        expect(report.type).toBe("build");
    });

    it("overrides the report type when one is requested", async () => {
        const report = await client.getBuildReport("proj", buildReports[0].buildId, "custom");
        expect(report.type).toBe("custom");
        expect(report.buildId).toBe(buildReports[0].buildId);
    });

    it("renders report html using the seeded type", async () => {
        await expect(
            client.getBuildReportHtmlContent("proj", buildReports[0].buildId)
        ).resolves.toContain(`${buildReports[0].type} report ${buildReports[0].buildId}`);
    });

    it("renders report html with the default type for an unknown build", async () => {
        await expect(
            client.getBuildReportHtmlContent("proj", Number.MAX_SAFE_INTEGER)
        ).resolves.toContain(`build report ${Number.MAX_SAFE_INTEGER}`);
    });

    it("renders report html with an explicit type", async () => {
        await expect(
            client.getBuildReportHtmlContent("proj", buildReports[0].buildId, "custom")
        ).resolves.toContain(`custom report ${buildReports[0].buildId}`);
    });

    it("finds the latest stage timeline by stage name", async () => {
        const stage = await client.getBuildStageLatestTimeline("proj", 1, "Deploy");
        expect(stage.id).toBe("timeline-deploy");
        expect(stage.records[0].name).toBe("Deploy");
    });

    it("fabricates a latest stage timeline for an unknown stage", async () => {
        const stage = await client.getBuildStageLatestTimeline("proj", 1, "Absent");
        expect(stage.id).toBe("stage-Absent");
        expect(stage.records[0].name).toBe("Absent");
    });

    it("overrides the change id on the latest stage timeline", async () => {
        const stage = await client.getBuildStageLatestTimeline("proj", 1, "Build", 77);
        expect(stage.changeId).toBe(77);
        expect(stage.id).toBe("timeline-build");
    });

    it("finds a stage timeline by timeline id", async () => {
        const stage = await client.getBuildStageTimeline("proj", 1, "timeline-build", "Build");
        expect(stage.id).toBe("timeline-build");
        expect(stage.changeId).toBe(stageTimelines[0].changeId);
    });

    it("fabricates a stage timeline for an unknown timeline id", async () => {
        const stage = await client.getBuildStageTimeline("proj", 1, "absent-timeline", "Build");
        expect(stage.id).toBe("absent-timeline");
        expect(stage.records[0].name).toBe("Build");
    });

    it("overrides the change id on a stage timeline", async () => {
        const stage = await client.getBuildStageTimeline(
            "proj",
            1,
            "timeline-deploy",
            "Deploy",
            88
        );
        expect(stage.changeId).toBe(88);
    });

    it("returns the seeded option definitions", async () => {
        await expect(client.getBuildOptionDefinitions("proj")).resolves.toEqual(optionDefinitions);
    });

    it("returns option definitions without a project", async () => {
        await expect(client.getBuildOptionDefinitions()).resolves.toHaveLength(
            optionDefinitions.length
        );
    });

    it("returns the seeded general settings", async () => {
        await expect(client.getBuildGeneralSettings("proj")).resolves.toEqual(generalSettings);
    });

    it("echoes updated general settings over the seeded ones", async () => {
        const result = await client.updateBuildGeneralSettings(
            { ...generalSettings, statusBadgesArePrivate: false },
            "proj"
        );
        expect(result.statusBadgesArePrivate).toBe(false);
        expect(result.enforceJobAuthScope).toBe(generalSettings.enforceJobAuthScope);
    });

    it("returns the seeded build settings", async () => {
        await expect(client.getBuildSettings("proj")).resolves.toEqual(buildSettings);
    });

    it("returns build settings without a project", async () => {
        await expect(client.getBuildSettings()).resolves.toEqual(buildSettings);
    });

    it("echoes updated build settings over the seeded ones", async () => {
        const result = await client.updateBuildSettings(
            { ...buildSettings, daysToKeepDeletedBuildsBeforeDestroy: 7 },
            "proj"
        );
        expect(result.daysToKeepDeletedBuildsBeforeDestroy).toBe(7);
        expect(result.maximumRetentionPolicy).toEqual(buildSettings.maximumRetentionPolicy);
    });

    it("echoes updated build settings without a project", async () => {
        const result = await client.updateBuildSettings({
            ...buildSettings,
            daysToKeepDeletedBuildsBeforeDestroy: 9
        });
        expect(result.daysToKeepDeletedBuildsBeforeDestroy).toBe(9);
    });

    it("encodes a file from artifact, file id and name", async () => {
        const buffer = await client.getFile("proj", 1, "drop", "file-1", "app.zip");
        expect(String.fromCharCode(...new Uint8Array(buffer))).toBe("drop/file-1/app.zip");
    });

    it("joins only the provider when no source path is given", async () => {
        await expect(client.getFileContents("proj", "TfsGit")).resolves.toBe("TfsGit");
    });

    it("joins every provided source coordinate", async () => {
        await expect(
            client.getFileContents("proj", "TfsGit", "endpoint-1", "repo-1", "main", "src/app.ts")
        ).resolves.toBe("TfsGit/endpoint-1/repo-1/main/src/app.ts");
    });

    it("returns every path item when no path is given", async () => {
        await expect(client.getPathContents("proj", "TfsGit")).resolves.toEqual(
            sourceRepositoryItems
        );
    });

    it("filters path items by the requested prefix", async () => {
        const items = await client.getPathContents(
            "proj",
            "TfsGit",
            "endpoint-1",
            "repo-1",
            "main",
            "/src"
        );
        expect(items.map(item => item.path)).toEqual(["/src", "/src/index.ts"]);
    });

    it("returns no path items for an absent prefix", async () => {
        await expect(
            client.getPathContents("proj", "TfsGit", "endpoint-1", "repo-1", "main", "/absent")
        ).resolves.toEqual([]);
    });

    it("marks a non-container source item as a blob", () => {
        expect(makeSourceRepositoryItem("/readme.md", false).type).toBe("blob");
    });
});
