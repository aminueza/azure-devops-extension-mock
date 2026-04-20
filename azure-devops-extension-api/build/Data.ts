import { faker } from "@faker-js/faker";
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
    id: faker.number.int({ min: 1, max: 10_000 }),
    name: faker.lorem.slug(),
    path: "\\",
    revision: faker.number.int({ min: 1, max: 50 }),
    type: DefinitionType.Build,
    queueStatus: 0,
    uri: faker.internet.url(),
    url: faker.internet.url(),
    project: makeProjectReference() as any,
    quality: DefinitionQuality.Definition,
    authoredBy: makeIdentityRef(),
    queue: {
        id: faker.number.int(),
        name: "Azure Pipelines",
        url: faker.internet.url(),
        pool: { id: faker.number.int(), name: "Azure Pipelines", isHosted: true }
    },
    process: { type: 2, yamlFilename: "azure-pipelines.yml" } as any,
    repository: {
        id: faker.string.uuid(),
        type: "TfsGit",
        name: faker.lorem.slug(),
        url: faker.internet.url(),
        defaultBranch: "refs/heads/main"
    } as any,
    createdDate: faker.date.recent(),
    _links: {} as any
} as unknown as BuildDefinition);

export const makeBuild = (): Build => ({
    id: faker.number.int({ min: 1, max: 100_000 }),
    buildNumber: `${faker.date.recent().getFullYear()}.${faker.number.int({ min: 1, max: 999 })}`,
    status: BuildStatus.Completed,
    result: BuildResult.Succeeded,
    reason: BuildReason.Manual,
    queueTime: faker.date.recent(),
    startTime: faker.date.recent(),
    finishTime: faker.date.recent(),
    sourceBranch: "refs/heads/main",
    sourceVersion: faker.git.commitSha(),
    url: faker.internet.url(),
    uri: faker.internet.url(),
    definition: makeBuildDefinition() as BuildDefinitionReference,
    project: makeProjectReference() as any,
    requestedBy: makeIdentityRef(),
    requestedFor: makeIdentityRef(),
    lastChangedBy: makeIdentityRef(),
    lastChangedDate: faker.date.recent(),
    logs: {
        id: faker.number.int(),
        type: "Container",
        url: faker.internet.url()
    } as any,
    repository: {
        id: faker.string.uuid(),
        type: "TfsGit"
    } as any,
    _links: {} as any
} as unknown as Build);

export const makeArtifact = (name = "drop"): BuildArtifact => ({
    id: faker.number.int(),
    name,
    source: faker.string.uuid(),
    resource: {
        type: "Container",
        data: `#/${faker.number.int()}/${name}`,
        properties: {},
        url: faker.internet.url(),
        downloadUrl: faker.internet.url()
    } as any
} as unknown as BuildArtifact);

export const makeTimelineRecord = (): TimelineRecord => ({
    id: faker.string.uuid(),
    parentId: faker.string.uuid(),
    type: "Task",
    name: faker.lorem.slug(),
    startTime: faker.date.recent(),
    finishTime: faker.date.recent(),
    state: 2 as any,
    result: 0 as any,
    workerName: faker.lorem.slug(),
    order: faker.number.int(),
    log: { id: faker.number.int(), type: "Container", url: faker.internet.url() } as any,
    changeId: faker.number.int(),
    url: faker.internet.url()
} as unknown as TimelineRecord);

export const makeTimeline = (): Timeline => ({
    id: faker.string.uuid(),
    changeId: faker.number.int(),
    lastChangedBy: faker.string.uuid(),
    lastChangedOn: faker.date.recent(),
    records: Array.from({ length: 3 }, makeTimelineRecord),
    url: faker.internet.url()
} as unknown as Timeline);

export const makeChange = (): Change => ({
    id: faker.git.commitSha(),
    message: faker.git.commitMessage(),
    type: "TfsGit",
    author: makeIdentityRef(),
    timestamp: faker.date.recent(),
    location: faker.internet.url()
} as unknown as Change);

export const buildDefinitions = Array.from({ length: 5 }, makeBuildDefinition);
const builds = Array.from({ length: 10 }, makeBuild);
export const buildList = builds;
export const buildsPage: PagedList<Build> = Object.assign(builds, { continuationToken: "" }) as PagedList<Build>;
export const artifacts: BuildArtifact[] = [makeArtifact("drop"), makeArtifact("symbols")];
export const timeline: Timeline = makeTimeline();
export const changes: Change[] = Array.from({ length: 3 }, makeChange);
