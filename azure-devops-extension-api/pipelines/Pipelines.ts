import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines/PipelinesClient";
import {
    Pipeline,
    Run,
    Artifact,
    Log,
    LogCollection,
    PreviewRun,
    CreatePipelineParameters,
    RunPipelineParameters
} from "azure-devops-extension-api/Pipelines/Pipelines";
import {
    makeArtifact,
    makeLog,
    makePipeline,
    makePreviewRun,
    makeRun,
    pipelines,
    runs,
    logCollection
} from "./Data";

/**
 * Mocked PipelinesRestClient — YAML pipelines, runs, artifacts, logs.
 */
export class MockPipelinesRestClient extends RestClientBase {
    public TYPE = PipelinesRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    listPipelines(_project: string): Promise<Pipeline[]> {
        return Promise.resolve(pipelines);
    }

    getPipeline(_project: string, pipelineId: number): Promise<Pipeline> {
        const found = pipelines.find(p => p.id === pipelineId);
        return Promise.resolve(found ?? { ...makePipeline(), id: pipelineId });
    }

    createPipeline(
        inputParameters: CreatePipelineParameters,
        _project: string
    ): Promise<Pipeline> {
        const next = makePipeline();
        return Promise.resolve({
            ...next,
            name: inputParameters.name ?? next.name,
            folder: inputParameters.folder ?? next.folder,
            configuration: inputParameters.configuration as any
        });
    }

    listRuns(_project: string, pipelineId: number): Promise<Run[]> {
        return Promise.resolve(runs.map(r => ({ ...r, pipeline: { ...r.pipeline, id: pipelineId } })));
    }

    getRun(_project: string, pipelineId: number, runId: number): Promise<Run> {
        const found = runs.find(r => r.id === runId);
        return Promise.resolve(found ?? { ...makeRun(pipelineId), id: runId });
    }

    runPipeline(
        runParameters: RunPipelineParameters,
        _project: string,
        pipelineId: number
    ): Promise<Run> {
        return Promise.resolve({
            ...makeRun(pipelineId),
            variables: (runParameters as any).variables ?? {}
        });
    }

    preview(
        _runParameters: RunPipelineParameters,
        _project: string,
        _pipelineId: number
    ): Promise<PreviewRun> {
        return Promise.resolve(makePreviewRun());
    }

    getArtifact(
        _project: string,
        _pipelineId: number,
        _runId: number,
        artifactName: string
    ): Promise<Artifact> {
        return Promise.resolve(makeArtifact(artifactName));
    }

    getLog(
        _project: string,
        _pipelineId: number,
        _runId: number,
        logId: number
    ): Promise<Log> {
        return Promise.resolve(makeLog(logId));
    }

    listLogs(
        _project: string,
        _pipelineId: number,
        _runId: number
    ): Promise<LogCollection> {
        return Promise.resolve(logCollection);
    }
}
