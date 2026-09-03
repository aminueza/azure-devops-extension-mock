import { fake } from "../common/fixtures";
import {
    Build,
    BuildDefinition,
    BuildDefinitionReference,
    BuildArtifact,
    BuildResult,
    BuildStatus,
    BuildReason,
    DefinitionType,
    DefinitionQuality,
    Timeline,
    TimelineRecord,
    Change
} from "azure-devops-extension-api/Build";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef, makeProjectReference } from "../core/Data";

export const makeBuildDefinition = (): BuildDefinition => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
    name: fake.lorem.slug(),
    path: "\\",
    revision: fake.number.int({ min: 1, max: 50 }),
    type: DefinitionType.Build,
    queueStatus: 0,
    uri: fake.internet.url(),
    url: fake.internet.url(),
    project: makeProjectReference() as any,
    quality: DefinitionQuality.Definition,
    authoredBy: makeIdentityRef(),
    queue: {
        id: fake.number.int(),
        name: "Azure Pipelines",
        url: fake.internet.url(),
        pool: { id: fake.number.int(), name: "Azure Pipelines", isHosted: true }
    },
    process: { type: 2, yamlFilename: "azure-pipelines.yml" } as any,
    repository: {
        id: fake.string.uuid(),
        type: "TfsGit",
        name: fake.lorem.slug(),
        url: fake.internet.url(),
        defaultBranch: "refs/heads/main"
    } as any,
    createdDate: fake.date.recent(),
    _links: {} as any
} as unknown as BuildDefinition);

export const makeBuild = (): Build => ({
    id: fake.number.int({ min: 1, max: 100_000 }),
    buildNumber: `${fake.date.recent().getFullYear()}.${fake.number.int({ min: 1, max: 999 })}`,
    status: BuildStatus.Completed,
    result: BuildResult.Succeeded,
    reason: BuildReason.Manual,
    queueTime: fake.date.recent(),
    startTime: fake.date.recent(),
    finishTime: fake.date.recent(),
    sourceBranch: "refs/heads/main",
    sourceVersion: fake.git.commitSha(),
    url: fake.internet.url(),
    uri: fake.internet.url(),
    definition: makeBuildDefinition() as BuildDefinitionReference,
    project: makeProjectReference() as any,
    requestedBy: makeIdentityRef(),
    requestedFor: makeIdentityRef(),
    lastChangedBy: makeIdentityRef(),
    lastChangedDate: fake.date.recent(),
    logs: {
        id: fake.number.int(),
        type: "Container",
        url: fake.internet.url()
    } as any,
    repository: {
        id: fake.string.uuid(),
        type: "TfsGit"
    } as any,
    _links: {} as any
} as unknown as Build);

export const makeArtifact = (name = "drop"): BuildArtifact => ({
    id: fake.number.int(),
    name,
    source: fake.string.uuid(),
    resource: {
        type: "Container",
        data: `#/${fake.number.int()}/${name}`,
        properties: {},
        url: fake.internet.url(),
        downloadUrl: fake.internet.url()
    } as any
} as unknown as BuildArtifact);

export const makeTimelineRecord = (): TimelineRecord => ({
    id: fake.string.uuid(),
    parentId: fake.string.uuid(),
    type: "Task",
    name: fake.lorem.slug(),
    startTime: fake.date.recent(),
    finishTime: fake.date.recent(),
    state: 2 as any,
    result: 0 as any,
    workerName: fake.lorem.slug(),
    order: fake.number.int(),
    log: { id: fake.number.int(), type: "Container", url: fake.internet.url() } as any,
    changeId: fake.number.int(),
    url: fake.internet.url()
} as unknown as TimelineRecord);

export const makeTimeline = (): Timeline => ({
    id: fake.string.uuid(),
    changeId: fake.number.int(),
    lastChangedBy: fake.string.uuid(),
    lastChangedOn: fake.date.recent(),
    records: Array.from({ length: 3 }, makeTimelineRecord),
    url: fake.internet.url()
} as unknown as Timeline);

export const makeChange = (): Change => ({
    id: fake.git.commitSha(),
    message: fake.git.commitMessage(),
    type: "TfsGit",
    author: makeIdentityRef(),
    timestamp: fake.date.recent(),
    location: fake.internet.url()
} as unknown as Change);

export const buildDefinitions = Array.from({ length: 5 }, makeBuildDefinition);
const builds = Array.from({ length: 10 }, makeBuild);
export const buildList = builds;
export const buildsPage: PagedList<Build> = Object.assign(builds, { continuationToken: "" }) as PagedList<Build>;
export const artifacts: BuildArtifact[] = [makeArtifact("drop"), makeArtifact("symbols")];
export const timeline: Timeline = makeTimeline();
export const changes: Change[] = Array.from({ length: 3 }, makeChange);
