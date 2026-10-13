import { fake } from "../common/fixtures";
import {
    ConfigurationType,
    Pipeline,
    PipelineConfiguration,
    RepositoryType,
    Run,
    RunState,
    RunResult,
    Artifact,
    Log,
    LogCollection,
    PreviewRun
} from "azure-devops-extension-api/Pipelines";

interface YamlPipelineConfiguration extends PipelineConfiguration {
    path: string;
    repository: { id: string; type: string; fullName: string };
}

interface IdentifiedPreviewRun extends PreviewRun {
    id: number;
    name: string;
}

export const makePipeline = (): Pipeline => {
    const configuration: YamlPipelineConfiguration = {
        type: ConfigurationType.Yaml,
        path: "azure-pipelines.yml",
        repository: {
            id: fake.string.uuid(),
            type: "azureReposGit",
            fullName: `${fake.lorem.slug()}/${fake.lorem.slug()}`
        }
    };
    return {
        id: fake.number.id(),
        name: fake.lorem.slug(),
        folder: "\\",
        revision: fake.number.int({ min: 1, max: 20 }),
        url: fake.internet.url(),
        configuration,
        _links: {}
    };
};

export const makeRun = (pipelineId = 1): Run => ({
    id: fake.number.id(),
    name: `${fake.date.recent().getFullYear()}.${fake.number.int()}`,
    state: RunState.Completed,
    result: RunResult.Succeeded,
    createdDate: fake.date.recent(),
    finishedDate: fake.date.recent(),
    url: fake.internet.url(),
    pipeline: {
        id: pipelineId,
        name: fake.lorem.slug(),
        folder: "\\",
        revision: fake.number.int({ min: 1, max: 20 }),
        url: fake.internet.url()
    },
    resources: {
        builds: {},
        containers: {},
        pipelines: {},
        repositories: {
            self: {
                refName: "refs/heads/main",
                repository: { type: RepositoryType.AzureReposGit },
                version: fake.git.commitSha()
            }
        }
    },
    finalYaml: "",
    tags: [],
    templateParameters: {},
    variables: {},
    yamlDetails: {
        expandedYamlUrl: fake.internet.url(),
        extendedTemplates: [],
        includedTemplates: [],
        rootYamlFile: { ref: "refs/heads/main", repoAlias: "self", yamlFile: "azure-pipelines.yml" }
    },
    _links: {}
});

export const makeArtifact = (name = "drop"): Artifact => ({
    name,
    signedContent: {
        url: fake.internet.url(),
        signatureExpires: fake.date.future()
    },
    url: fake.internet.url()
});

export const makeLog = (id = 1): Log => ({
    id,
    createdOn: fake.date.recent(),
    lastChangedOn: fake.date.recent(),
    lineCount: fake.number.int({ min: 1, max: 5000 }),
    signedContent: { url: fake.internet.url(), signatureExpires: fake.date.future() },
    url: fake.internet.url()
});

export const pipelines: Pipeline[] = Array.from({ length: 5 }, makePipeline);
export const runs: Run[] = Array.from({ length: 8 }, () => makeRun(pipelines[0].id));
export const logCollection: LogCollection = {
    logs: [makeLog(1), makeLog(2), makeLog(3)],
    url: fake.internet.url(),
    signedContent: { url: fake.internet.url(), signatureExpires: fake.date.future() }
};

export const makePreviewRun = (): PreviewRun => {
    const preview: IdentifiedPreviewRun = {
        finalYaml: "stages:\n- stage: Build\n  jobs:\n  - job: Build\n    steps:\n    - script: echo Hello",
        id: fake.number.id(),
        name: `preview-${fake.lorem.slug()}`
    };
    return preview;
};
