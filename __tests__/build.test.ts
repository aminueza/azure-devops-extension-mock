import { BuildRestClient, BuildStatus, BuildResult, DefinitionType } from "azure-devops-extension-api/Build";

import { getClient } from "../azure-devops-extension-api";
import {
    artifacts,
    buildDefinitions,
    buildList,
    buildsPage,
    changes,
    makeArtifact,
    makeBuild,
    makeBuildDefinition,
    makeChange,
    makeTimeline,
    makeTimelineRecord,
    timeline
} from "../azure-devops-extension-api/build/Data";

describe("BuildRestClient mock definitions", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(BuildRestClient);

    it("exposes the real class as TYPE", () => {
        expect((client as any).TYPE).toBe(BuildRestClient);
    });

    it("lists definitions as a paged list", async () => {
        const defs = await client.getDefinitions("proj");
        expect(defs.length).toBe(buildDefinitions.length);
        expect(defs.continuationToken).toBe("");
        expect(defs[0]).toHaveProperty("id");
        expect(defs[0]).toHaveProperty("name");
        expect(defs[0].type).toBe(DefinitionType.Build);
    });

    it("returns a copy so callers cannot mutate the fixture list", async () => {
        const defs = await client.getDefinitions("proj");
        expect(defs).not.toBe(buildDefinitions);
        defs.pop();
        expect(buildDefinitions.length).toBe(5);
    });

    it("gets a known definition by id", async () => {
        const target = buildDefinitions[2];
        const def = await client.getDefinition("proj", target.id);
        expect(def).toBe(target);
    });

    it("fabricates a definition for an unknown id", async () => {
        const def = await client.getDefinition("proj", 999_999);
        expect(def.id).toBe(999_999);
        expect(def).toHaveProperty("name");
        expect(def).toHaveProperty("repository");
    });

    it("creates a definition merging the caller's fields", async () => {
        const def = await client.createDefinition({ name: "my-def", path: "\\folder" } as any, "proj");
        expect(def.name).toBe("my-def");
        expect(def.path).toBe("\\folder");
        expect(def).toHaveProperty("id");
        expect(def).toHaveProperty("queue");
    });

    it("updates a definition forcing the id from the route", async () => {
        const def = await client.updateDefinition({ name: "renamed", id: 1 } as any, "proj", 77);
        expect(def.id).toBe(77);
        expect(def.name).toBe("renamed");
    });

    it("deletes a definition", async () => {
        await expect(client.deleteDefinition("proj", 1)).resolves.toBeUndefined();
    });
});

describe("BuildRestClient mock builds", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(BuildRestClient);

    it("returns the paged build list", async () => {
        const builds = await client.getBuilds("proj");
        expect(builds).toBe(buildsPage);
        expect(builds.length).toBe(10);
        expect(builds.continuationToken).toBe("");
        builds.forEach(b => {
            expect(b.status).toBe(BuildStatus.Completed);
            expect(b.result).toBe(BuildResult.Succeeded);
        });
    });

    it("gets a known build by id", async () => {
        const target = buildList[4];
        const build = await client.getBuild("proj", target.id);
        expect(build).toBe(target);
    });

    it("fabricates a build for an unknown id", async () => {
        const build = await client.getBuild("proj", -1);
        expect(build.id).toBe(-1);
        expect(build).toHaveProperty("buildNumber");
        expect(build).toHaveProperty("definition");
    });

    it("queues a build merging the caller's fields", async () => {
        const build = await client.queueBuild({ sourceBranch: "refs/heads/feature", reason: 2 } as any, "proj");
        expect(build.sourceBranch).toBe("refs/heads/feature");
        expect(build.reason).toBe(2);
        expect(build).toHaveProperty("id");
        expect(build).toHaveProperty("requestedBy");
    });

    it("updates a build forcing the id from the route", async () => {
        const build = await client.updateBuild({ id: 1, keepForever: true } as any, "proj", 4242);
        expect(build.id).toBe(4242);
        expect(build.keepForever).toBe(true);
    });

    it("deletes a build", async () => {
        await expect(client.deleteBuild("proj", 1)).resolves.toBeUndefined();
    });
});

describe("BuildRestClient mock artifacts, timeline, changes and logs", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(BuildRestClient);

    it("lists artifacts", async () => {
        const list = await client.getArtifacts("proj", 1);
        expect(list).toBe(artifacts);
        expect(list.map(a => a.name)).toEqual(["drop", "symbols"]);
    });

    it("gets a known artifact by name", async () => {
        const artifact = await client.getArtifact("proj", 1, "symbols");
        expect(artifact).toBe(artifacts[1]);
    });

    it("fabricates an artifact for an unknown name", async () => {
        const artifact = await client.getArtifact("proj", 1, "coverage");
        expect(artifact.name).toBe("coverage");
        expect(artifact.resource.data).toContain("/coverage");
        expect(artifacts.some(a => a === artifact)).toBe(false);
    });

    it("creates an artifact merging the caller's fields", async () => {
        const artifact = await client.createArtifact({ name: "custom" } as any, "proj", 1);
        expect(artifact.name).toBe("custom");
        expect(artifact).toHaveProperty("id");
        expect(artifact).toHaveProperty("resource");
    });

    it("returns an empty zip buffer", async () => {
        const zip = await client.getArtifactContentZip("proj", 1, "drop");
        expect(zip).toBeInstanceOf(ArrayBuffer);
        expect(zip.byteLength).toBe(0);
    });

    it("returns the timeline with and without a timeline id", async () => {
        const first = await client.getBuildTimeline("proj", 1);
        const second = await client.getBuildTimeline("proj", 1, "tl-id");
        expect(first).toBe(timeline);
        expect(second).toBe(timeline);
        expect(first.records.length).toBe(3);
        expect(first.records[0]).toHaveProperty("type", "Task");
    });

    it("returns changes as a paged copy", async () => {
        const list = await client.getBuildChanges("proj", 1);
        expect(list.length).toBe(changes.length);
        expect(list.continuationToken).toBe("");
        expect(list).not.toBe(changes);
        expect(list[0]).toHaveProperty("message");
        expect(list[0]).toHaveProperty("author");
    });

    it("returns an empty build log buffer", async () => {
        const log = await client.getBuildLog("proj", 1, 1);
        expect(typeof log).toBe("string");
        expect(log.split("\n")).toEqual(["Starting: Build", "Finishing: Build"]);
    });

    it("returns no build logs", async () => {
        const logs = await client.getBuildLogs("proj", 1);
        expect(logs).toEqual([]);
    });
});

describe("build data factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes a definition with a yaml process and git repository", () => {
        const def = makeBuildDefinition();
        expect(def.id).toBeGreaterThan(0);
        expect((def.process as any).yamlFilename).toBe("azure-pipelines.yml");
        expect(def.repository.defaultBranch).toBe("refs/heads/main");
        expect(def.queue.pool!.isHosted).toBe(true);
    });

    it("makes a completed successful build", () => {
        const build = makeBuild();
        expect(build.status).toBe(BuildStatus.Completed);
        expect(build.result).toBe(BuildResult.Succeeded);
        expect(build.buildNumber).toMatch(/^\d{4}\.\d+$/);
        expect(build.sourceVersion).toMatch(/^[0-9a-f]{40}$/);
    });

    it("makes an artifact defaulting to drop", () => {
        expect(makeArtifact().name).toBe("drop");
        expect(makeArtifact("bin").name).toBe("bin");
        expect(makeArtifact("bin").resource.data).toMatch(/^#\/\d+\/bin$/);
    });

    it("makes a timeline with three task records", () => {
        const tl = makeTimeline();
        expect(tl.records).toHaveLength(3);
        const record = makeTimelineRecord();
        expect(record.type).toBe("Task");
        expect(record).toHaveProperty("log");
    });

    it("makes a change with a commit sha and author", () => {
        const change = makeChange();
        expect(change.id).toMatch(/^[0-9a-f]{40}$/);
        expect(change.type).toBe("TfsGit");
        expect(change.author).toHaveProperty("displayName");
    });
});
