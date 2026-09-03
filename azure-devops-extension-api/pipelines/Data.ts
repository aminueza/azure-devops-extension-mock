import { fake } from "../common/fixtures";
import {
    Pipeline,
    Run,
    RunState,
    RunResult,
    Artifact,
    Log,
    LogCollection,
    PreviewRun
} from "azure-devops-extension-api/Pipelines";

export const makePipeline = (): Pipeline => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
    name: fake.lorem.slug(),
    folder: "\\",
    revision: fake.number.int({ min: 1, max: 20 }),
    url: fake.internet.url(),
    configuration: {
        type: "yaml" as any,
        path: "azure-pipelines.yml",
        repository: {
            id: fake.string.uuid(),
            type: "azureReposGit",
            fullName: `${fake.lorem.slug()}/${fake.lorem.slug()}`
        } as any
    } as any,
    _links: {} as any
} as unknown as Pipeline);

export const makeRun = (pipelineId = 1): Run => ({
    id: fake.number.int({ min: 1, max: 100_000 }),
    name: `${fake.date.recent().getFullYear()}.${fake.number.int()}`,
    state: RunState.Completed,
    result: RunResult.Succeeded,
    createdDate: fake.date.recent(),
    finishedDate: fake.date.recent(),
    url: fake.internet.url(),
    pipeline: { id: pipelineId, name: fake.lorem.slug() } as Pipeline,
    resources: {} as any,
    variables: {},
    _links: {} as any
} as unknown as Run);

export const makeArtifact = (name = "drop"): Artifact => ({
    name,
    signedContent: {
        url: fake.internet.url(),
        signatureExpires: fake.date.future()
    },
    url: fake.internet.url()
} as unknown as Artifact);

export const makeLog = (id = 1): Log => ({
    id,
    createdOn: fake.date.recent(),
    lastChangedOn: fake.date.recent(),
    lineCount: fake.number.int({ min: 1, max: 5000 }),
    signedContent: { url: fake.internet.url(), signatureExpires: fake.date.future() },
    url: fake.internet.url()
} as unknown as Log);

export const pipelines: Pipeline[] = Array.from({ length: 5 }, makePipeline);
export const runs: Run[] = Array.from({ length: 8 }, () => makeRun(pipelines[0].id));
export const logCollection: LogCollection = {
    logs: [makeLog(1), makeLog(2), makeLog(3)],
    url: fake.internet.url(),
    signedContent: { url: fake.internet.url(), signatureExpires: fake.date.future() } as any
} as LogCollection;

export const makePreviewRun = (): PreviewRun => ({
    finalYaml: "stages:\n- stage: Build\n  jobs:\n  - job: Build\n    steps:\n    - script: echo Hello",
    id: fake.number.int(),
    name: `preview-${fake.lorem.slug()}`
} as unknown as PreviewRun);
