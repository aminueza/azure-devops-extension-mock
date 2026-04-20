import { faker } from "@faker-js/faker";
import {
    Pipeline,
    Run,
    RunState,
    RunResult,
    Artifact,
    Log,
    LogCollection,
    PreviewRun
} from "azure-devops-extension-api/Pipelines/Pipelines";

export const makePipeline = (): Pipeline => ({
    id: faker.number.int({ min: 1, max: 10_000 }),
    name: faker.lorem.slug(),
    folder: "\\",
    revision: faker.number.int({ min: 1, max: 20 }),
    url: faker.internet.url(),
    configuration: {
        type: "yaml" as any,
        path: "azure-pipelines.yml",
        repository: {
            id: faker.string.uuid(),
            type: "azureReposGit",
            fullName: `${faker.lorem.slug()}/${faker.lorem.slug()}`
        } as any
    } as any,
    _links: {} as any
} as unknown as Pipeline);

export const makeRun = (pipelineId = 1): Run => ({
    id: faker.number.int({ min: 1, max: 100_000 }),
    name: `${faker.date.recent().getFullYear()}.${faker.number.int()}`,
    state: RunState.Completed,
    result: RunResult.Succeeded,
    createdDate: faker.date.recent(),
    finishedDate: faker.date.recent(),
    url: faker.internet.url(),
    pipeline: { id: pipelineId, name: faker.lorem.slug() } as Pipeline,
    resources: {} as any,
    variables: {},
    _links: {} as any
} as unknown as Run);

export const makeArtifact = (name = "drop"): Artifact => ({
    name,
    signedContent: {
        url: faker.internet.url(),
        signatureExpires: faker.date.future()
    },
    url: faker.internet.url()
} as unknown as Artifact);

export const makeLog = (id = 1): Log => ({
    id,
    createdOn: faker.date.recent(),
    lastChangedOn: faker.date.recent(),
    lineCount: faker.number.int({ min: 1, max: 5000 }),
    signedContent: { url: faker.internet.url(), signatureExpires: faker.date.future() },
    url: faker.internet.url()
} as unknown as Log);

export const pipelines: Pipeline[] = Array.from({ length: 5 }, makePipeline);
export const runs: Run[] = Array.from({ length: 8 }, () => makeRun(pipelines[0].id));
export const logCollection: LogCollection = {
    logs: [makeLog(1), makeLog(2), makeLog(3)],
    url: faker.internet.url(),
    signedContent: { url: faker.internet.url(), signatureExpires: faker.date.future() } as any
} as LogCollection;

export const makePreviewRun = (): PreviewRun => ({
    finalYaml: "stages:\n- stage: Build\n  jobs:\n  - job: Build\n    steps:\n    - script: echo Hello",
    id: faker.number.int(),
    name: `preview-${faker.lorem.slug()}`
} as unknown as PreviewRun);
