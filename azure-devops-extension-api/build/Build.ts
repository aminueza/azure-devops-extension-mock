import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    BuildRestClient,
    Build,
    BuildDefinition,
    BuildDefinitionReference,
    BuildArtifact,
    Timeline,
    Change
} from "azure-devops-extension-api/Build";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    artifacts,
    buildDefinitions,
    buildList,
    buildsPage,
    changes,
    makeArtifact,
    makeBuild,
    makeBuildDefinition,
    timeline
} from "./Data";

/**
 * Mocked BuildRestClient — covers definitions, builds, artifacts, timeline,
 * and change lookups commonly consumed by pipeline/build tab extensions.
 */
export class MockBuildRestClient extends RestClientBase {
    public TYPE = BuildRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    // Definitions
    getDefinitions(_project: string): Promise<PagedList<BuildDefinitionReference>> {
        return Promise.resolve(
            Object.assign([...buildDefinitions], { continuationToken: "" }) as unknown as PagedList<BuildDefinitionReference>
        );
    }

    getDefinition(_project: string, definitionId: number): Promise<BuildDefinition> {
        const found = buildDefinitions.find(d => d.id === definitionId);
        return Promise.resolve(found ?? { ...makeBuildDefinition(), id: definitionId });
    }

    createDefinition(definition: BuildDefinition, _project: string): Promise<BuildDefinition> {
        return Promise.resolve({ ...makeBuildDefinition(), ...definition });
    }

    updateDefinition(
        definition: BuildDefinition,
        _project: string,
        definitionId: number
    ): Promise<BuildDefinition> {
        return Promise.resolve({ ...makeBuildDefinition(), ...definition, id: definitionId });
    }

    deleteDefinition(_project: string, _definitionId: number): Promise<void> {
        return Promise.resolve();
    }

    // Builds
    getBuilds(_project: string): Promise<PagedList<Build>> {
        return Promise.resolve(buildsPage);
    }

    getBuild(_project: string, buildId: number): Promise<Build> {
        const found = buildList.find(b => b.id === buildId);
        return Promise.resolve(found ?? { ...makeBuild(), id: buildId });
    }

    queueBuild(build: Build, _project: string): Promise<Build> {
        return Promise.resolve({ ...makeBuild(), ...build });
    }

    updateBuild(build: Build, _project: string, buildId: number): Promise<Build> {
        return Promise.resolve({ ...makeBuild(), ...build, id: buildId });
    }

    deleteBuild(_project: string, _buildId: number): Promise<void> {
        return Promise.resolve();
    }

    // Artifacts
    getArtifacts(_project: string, _buildId: number): Promise<BuildArtifact[]> {
        return Promise.resolve(artifacts);
    }

    getArtifact(_project: string, _buildId: number, artifactName: string): Promise<BuildArtifact> {
        const found = artifacts.find(a => a.name === artifactName);
        return Promise.resolve(found ?? makeArtifact(artifactName));
    }

    createArtifact(
        artifact: BuildArtifact,
        _project: string,
        _buildId: number
    ): Promise<BuildArtifact> {
        return Promise.resolve({ ...makeArtifact(), ...artifact });
    }

    getArtifactContentZip(): Promise<ArrayBuffer> {
        return Promise.resolve(new ArrayBuffer(0));
    }

    // Timeline
    getBuildTimeline(
        _project: string,
        _buildId: number,
        _timelineId?: string
    ): Promise<Timeline> {
        return Promise.resolve(timeline);
    }

    // Changes
    getBuildChanges(_project: string, _buildId: number): Promise<PagedList<Change>> {
        return Promise.resolve(
            Object.assign([...changes], { continuationToken: "" }) as unknown as PagedList<Change>
        );
    }

    // Logs — return empty content. Callers typically use the `logs` link on the build.
    getBuildLog(): Promise<ArrayBuffer> {
        return Promise.resolve(new ArrayBuffer(0));
    }

    getBuildLogs(): Promise<any[]> {
        return Promise.resolve([]);
    }
}
