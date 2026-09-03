import { PipelinesRestClient, RunResult, RunState } from "azure-devops-extension-api/Pipelines";

import { getClient } from "../azure-devops-extension-api";
import {
    logCollection,
    makeArtifact,
    makeLog,
    makePipeline,
    makePreviewRun,
    makeRun,
    pipelines,
    runs
} from "../azure-devops-extension-api/pipelines/Data";

describe("PipelinesRestClient mock pipelines", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(PipelinesRestClient);

    it("exposes the real class as TYPE", () => {
        expect((client as any).TYPE).toBe(PipelinesRestClient);
    });

    it("lists the fixture pipelines", async () => {
        const list = await client.listPipelines("proj");
        expect(list).toBe(pipelines);
        expect(list.length).toBe(5);
        expect(list[0]).toHaveProperty("configuration");
    });

    it("gets a known pipeline by id", async () => {
        const target = pipelines[3];
        const pipeline = await client.getPipeline("proj", target.id);
        expect(pipeline).toBe(target);
    });

    it("fabricates a pipeline for an unknown id", async () => {
        const pipeline = await client.getPipeline("proj", 999_999);
        expect(pipeline.id).toBe(999_999);
        expect(pipeline).toHaveProperty("name");
        expect(pipeline.folder).toBe("\\");
    });

    it("creates a pipeline honoring name, folder and configuration", async () => {
        const configuration = { type: "yaml", path: "ci.yml" };
        const pipeline = await client.createPipeline(
            { name: "release", folder: "\\ops", configuration } as any,
            "proj"
        );
        expect(pipeline.name).toBe("release");
        expect(pipeline.folder).toBe("\\ops");
        expect(pipeline.configuration).toBe(configuration);
        expect(pipeline).toHaveProperty("id");
    });

    it("creates a pipeline generating name and folder when omitted", async () => {
        const pipeline = await client.createPipeline({} as any, "proj");
        expect(typeof pipeline.name).toBe("string");
        expect(pipeline.name.length).toBeGreaterThan(0);
        expect(pipeline.folder).toBe("\\");
        expect(pipeline.configuration).toBeUndefined();
    });
});

describe("PipelinesRestClient mock runs", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(PipelinesRestClient);

    it("lists runs re-pointed at the requested pipeline", async () => {
        const list = await client.listRuns("proj", 321);
        expect(list.length).toBe(runs.length);
        list.forEach((r, i) => {
            expect(r.pipeline.id).toBe(321);
            expect(r.pipeline.name).toBe(runs[i].pipeline.name);
            expect(r.id).toBe(runs[i].id);
            expect(r).not.toBe(runs[i]);
        });
        expect(runs[0].pipeline.id).toBe(pipelines[0].id);
    });

    it("gets a known run by id", async () => {
        const target = runs[5];
        const run = await client.getRun("proj", 1, target.id);
        expect(run).toBe(target);
    });

    it("fabricates a run for an unknown id bound to the pipeline", async () => {
        const run = await client.getRun("proj", 55, 999_999);
        expect(run.id).toBe(999_999);
        expect(run.pipeline.id).toBe(55);
        expect(run.state).toBe(RunState.Completed);
        expect(run.result).toBe(RunResult.Succeeded);
    });

    it("runs a pipeline carrying the caller's variables", async () => {
        const variables = { env: { value: "prod" } };
        const run = await client.runPipeline({ variables } as any, "proj", 7);
        expect(run.pipeline.id).toBe(7);
        expect(run.variables).toBe(variables);
    });

    it("runs a pipeline with empty variables when none are given", async () => {
        const run = await client.runPipeline({} as any, "proj", 8);
        expect(run.pipeline.id).toBe(8);
        expect(run.variables).toEqual({});
    });

    it("previews a run with final yaml", async () => {
        const preview = await client.preview({} as any, "proj", 1);
        expect(preview.finalYaml).toContain("stages:");
        expect((preview as any).name).toMatch(/^preview-/);
        expect(preview).toHaveProperty("id");
    });
});

describe("PipelinesRestClient mock artifacts and logs", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(PipelinesRestClient);

    it("gets an artifact with the requested name", async () => {
        const artifact = await client.getArtifact("proj", 1, 2, "bundle");
        expect(artifact.name).toBe("bundle");
        expect(artifact.signedContent).toHaveProperty("url");
    });

    it("gets a log with the requested id", async () => {
        const log = await client.getLog("proj", 1, 2, 42);
        expect(log.id).toBe(42);
        expect(log.lineCount).toBeGreaterThan(0);
        expect(log.signedContent).toHaveProperty("signatureExpires");
    });

    it("lists the fixture log collection", async () => {
        const collection = await client.listLogs("proj", 1, 2);
        expect(collection).toBe(logCollection);
        expect(collection.logs.map(l => l.id)).toEqual([1, 2, 3]);
        expect(collection).toHaveProperty("url");
    });
});

describe("pipelines data factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes a yaml pipeline in the root folder", () => {
        const pipeline = makePipeline();
        expect(pipeline.folder).toBe("\\");
        expect((pipeline.configuration as any).path).toBe("azure-pipelines.yml");
        expect((pipeline.configuration as any).repository.type).toBe("azureReposGit");
    });

    it("makes a run defaulting to pipeline 1", () => {
        const run = makeRun();
        expect(run.pipeline.id).toBe(1);
        expect(run.state).toBe(RunState.Completed);
        expect(run.variables).toEqual({});
    });

    it("makes a run for an explicit pipeline", () => {
        expect(makeRun(9).pipeline.id).toBe(9);
    });

    it("makes an artifact defaulting to drop", () => {
        expect(makeArtifact().name).toBe("drop");
        expect(makeArtifact("out").name).toBe("out");
        expect(makeArtifact().signedContent.signatureExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it("makes a log defaulting to id 1", () => {
        expect(makeLog().id).toBe(1);
        expect(makeLog(17).id).toBe(17);
        expect(makeLog().lineCount).toBeGreaterThanOrEqual(1);
    });

    it("makes a preview run with a build stage", () => {
        const preview = makePreviewRun();
        expect(preview.finalYaml).toContain("- stage: Build");
        expect((preview as any).name).toMatch(/^preview-/);
    });
});
