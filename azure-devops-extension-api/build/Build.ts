import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    BuildRestClient,
    Build,
    BuildBadge,
    BuildController,
    BuildDefinition,
    BuildDefinitionReference,
    BuildDefinitionRevision,
    BuildDefinitionTemplate,
    BuildArtifact,
    BuildMetric,
    BuildResourceUsage,
    DefinitionQueueStatus,
    DefinitionResourceReference,
    Folder,
    FolderQueryOrder,
    Timeline,
    Change,
    UpdateTagParameters,
    YamlBuild
} from "azure-devops-extension-api/Build";
import { JsonPatchDocument, PagedList } from "azure-devops-extension-api/WebApi";
import {
    artifacts,
    buildControllers,
    buildDefinitions,
    buildList,
    buildMetrics,
    buildsPage,
    buildTags,
    changes,
    definitionProperties,
    definitionResources,
    definitionRevisions,
    definitionTags,
    definitionTemplates,
    folders,
    makeArtifact,
    makeBuild,
    makeBuildBadge,
    makeBuildController,
    makeBuildDefinition,
    makeBuildDefinitionTemplate,
    makeDefinitionResourceReference,
    makeFolder,
    projectTags,
    resourceUsage,
    timeline
} from "./Data";

export class MockBuildRestClient extends RestClientBase {
    public TYPE = BuildRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

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

    updateBuilds(builds: Build[], _project: string): Promise<Build[]> {
        return Promise.resolve(builds.map(build => ({ ...makeBuild(), ...build })));
    }

    deleteBuild(_project: string, _buildId: number): Promise<void> {
        return Promise.resolve();
    }

    getLatestBuild(_project: string, definition: string, branchName?: string): Promise<Build> {
        const found = buildList.find(build => build.definition.name === definition);
        const latest = found ?? {
            ...makeBuild(),
            definition: { ...makeBuildDefinition(), name: definition } as BuildDefinitionReference
        };
        return Promise.resolve(branchName === undefined ? latest : { ...latest, sourceBranch: branchName });
    }

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

    getBuildTimeline(
        _project: string,
        _buildId: number,
        _timelineId?: string
    ): Promise<Timeline> {
        return Promise.resolve(timeline);
    }

    getBuildChanges(_project: string, _buildId: number): Promise<PagedList<Change>> {
        return Promise.resolve(
            Object.assign([...changes], { continuationToken: "" }) as unknown as PagedList<Change>
        );
    }

    getBuildLog(): Promise<string> {
        return Promise.resolve(["Starting: Build", "Finishing: Build"].join("\n"));
    }

    getBuildLogs(): Promise<any[]> {
        return Promise.resolve([]);
    }

    addBuildTag(_project: string, _buildId: number, tag: string): Promise<string[]> {
        return Promise.resolve([...new Set([...buildTags, tag])]);
    }

    addBuildTags(tags: string[], _project: string, _buildId: number): Promise<string[]> {
        return Promise.resolve([...new Set([...buildTags, ...tags])]);
    }

    deleteBuildTag(_project: string, _buildId: number, tag: string): Promise<string[]> {
        return Promise.resolve(buildTags.filter(existing => existing !== tag));
    }

    getBuildTags(_project: string, _buildId: number): Promise<string[]> {
        return Promise.resolve([...buildTags]);
    }

    updateBuildTags(
        updateParameters: UpdateTagParameters,
        _project: string,
        _buildId: number
    ): Promise<string[]> {
        const removed = new Set(updateParameters.tagsToRemove);
        return Promise.resolve(
            [...new Set([...buildTags, ...updateParameters.tagsToAdd])].filter(tag => !removed.has(tag))
        );
    }

    addDefinitionTag(_project: string, _definitionId: number, tag: string): Promise<string[]> {
        return Promise.resolve([...new Set([...definitionTags, tag])]);
    }

    addDefinitionTags(tags: string[], _project: string, _definitionId: number): Promise<string[]> {
        return Promise.resolve([...new Set([...definitionTags, ...tags])]);
    }

    deleteDefinitionTag(_project: string, _definitionId: number, tag: string): Promise<string[]> {
        return Promise.resolve(definitionTags.filter(existing => existing !== tag));
    }

    getDefinitionTags(_project: string, _definitionId: number, revision?: number): Promise<string[]> {
        return Promise.resolve(
            revision === undefined ? [...definitionTags] : definitionTags.slice(0, revision)
        );
    }

    updateDefinitionTags(
        updateParameters: UpdateTagParameters,
        _project: string,
        _definitionId: number
    ): Promise<string[]> {
        const removed = new Set(updateParameters.tagsToRemove);
        return Promise.resolve(
            [...new Set([...definitionTags, ...updateParameters.tagsToAdd])].filter(tag => !removed.has(tag))
        );
    }

    deleteTag(_project: string, tag: string): Promise<string[]> {
        return Promise.resolve(projectTags.filter(existing => existing !== tag));
    }

    getTags(_project: string): Promise<string[]> {
        return Promise.resolve([...projectTags]);
    }

    getBuildBadge(
        _project: string,
        _repoType: string,
        _repoId?: string,
        _branchName?: string
    ): Promise<BuildBadge> {
        return Promise.resolve({ ...makeBuildBadge(), buildId: buildList[0].id });
    }

    getBuildBadgeData(
        _project: string,
        repoType: string,
        repoId?: string,
        branchName?: string
    ): Promise<string> {
        const scope = [repoType, repoId, branchName].filter(Boolean).join(" ");
        return Promise.resolve(`<svg width="120" height="20"><text x="60" y="14">${scope} succeeded</text></svg>`);
    }

    getBadge(_project: string, definitionId: number, branchName?: string): Promise<string> {
        const scope = [`definition ${definitionId}`, branchName].filter(Boolean).join(" ");
        return Promise.resolve(`<svg width="120" height="20"><text x="60" y="14">${scope} succeeded</text></svg>`);
    }

    getStatusBadge(
        _project: string,
        definition: string,
        branchName?: string,
        stageName?: string,
        jobName?: string,
        configuration?: string,
        label?: string
    ): Promise<string> {
        const scope = [definition, branchName, stageName, jobName, configuration].filter(Boolean).join(" ");
        return Promise.resolve(label === undefined ? `${scope} succeeded` : `${scope} ${label}`);
    }

    getBuildController(controllerId: number): Promise<BuildController> {
        const found = buildControllers.find(controller => controller.id === controllerId);
        return Promise.resolve(found ?? { ...makeBuildController(), id: controllerId });
    }

    getBuildControllers(name?: string): Promise<BuildController[]> {
        return Promise.resolve(
            name === undefined ? [...buildControllers] : buildControllers.filter(c => c.name === name)
        );
    }

    createFolder(folder: Folder, _project: string, path: string): Promise<Folder> {
        return Promise.resolve({ ...makeFolder(path), ...folder, path });
    }

    deleteFolder(_project: string, _path: string): Promise<void> {
        return Promise.resolve();
    }

    getFolders(_project: string, path?: string, queryOrder?: FolderQueryOrder): Promise<Folder[]> {
        const matched = folders.filter(folder => folder.path.startsWith(path ?? "\\"));
        const ascending = [...matched].sort((left, right) => left.path.localeCompare(right.path));
        return Promise.resolve(
            queryOrder === FolderQueryOrder.FolderDescending ? ascending.reverse() : ascending
        );
    }

    updateFolder(folder: Folder, _project: string, path: string): Promise<Folder> {
        return Promise.resolve({ ...makeFolder(path), ...folder, path });
    }

    deleteTemplate(_project: string, _templateId: string): Promise<void> {
        return Promise.resolve();
    }

    getTemplate(_project: string, templateId: string): Promise<BuildDefinitionTemplate> {
        const found = definitionTemplates.find(template => template.id === templateId);
        return Promise.resolve(found ?? makeBuildDefinitionTemplate(templateId, "Build"));
    }

    getTemplates(_project: string): Promise<BuildDefinitionTemplate[]> {
        return Promise.resolve([...definitionTemplates]);
    }

    saveTemplate(
        template: BuildDefinitionTemplate,
        _project: string,
        templateId: string
    ): Promise<BuildDefinitionTemplate> {
        return Promise.resolve({
            ...makeBuildDefinitionTemplate(templateId, "Build"),
            ...template,
            id: templateId
        });
    }

    restoreDefinition(
        _project: string,
        definitionId: number,
        deleted: boolean
    ): Promise<BuildDefinition> {
        const found = buildDefinitions.find(definition => definition.id === definitionId);
        const definition = found ?? { ...makeBuildDefinition(), id: definitionId };
        return Promise.resolve({
            ...definition,
            queueStatus: deleted ? DefinitionQueueStatus.Disabled : DefinitionQueueStatus.Enabled
        });
    }

    getDefinitionMetrics(
        _project: string,
        _definitionId: number,
        minMetricsTime?: Date
    ): Promise<BuildMetric[]> {
        const since = minMetricsTime ?? new Date(0);
        return Promise.resolve(buildMetrics.filter(metric => metric.date >= since));
    }

    getDefinitionProperties(
        _project: string,
        _definitionId: number,
        filter?: string[]
    ): Promise<any> {
        const properties: Record<string, unknown> = { ...definitionProperties };
        const keys = filter ?? Object.keys(properties);
        return Promise.resolve(Object.fromEntries(keys.map(key => [key, properties[key]])));
    }

    updateDefinitionProperties(
        document: JsonPatchDocument,
        _project: string,
        _definitionId: number
    ): Promise<any> {
        const operations = document as unknown as Array<{ path: string; value: unknown }>;
        const properties: Record<string, unknown> = { ...definitionProperties };
        for (const operation of operations) {
            properties[operation.path.slice(1)] = operation.value;
        }
        return Promise.resolve(properties);
    }

    getDefinitionRevisions(
        _project: string,
        _definitionId: number
    ): Promise<BuildDefinitionRevision[]> {
        return Promise.resolve([...definitionRevisions]);
    }

    getDefinitionYaml(
        _project: string,
        definitionId: number,
        revision?: number,
        minMetricsTime?: Date,
        propertyFilters?: string[],
        includeLatestBuilds?: boolean
    ): Promise<YamlBuild> {
        const scope = [
            `definition ${definitionId}`,
            revision,
            minMetricsTime,
            propertyFilters,
            includeLatestBuilds
        ]
            .filter(Boolean)
            .join(" ");
        return Promise.resolve({
            yaml: [
                `name: ${scope}`,
                "trigger:",
                "  - main",
                "pool:",
                "  vmImage: ubuntu-latest",
                "steps:",
                "  - script: npm ci",
                "  - script: npm test"
            ].join("\n")
        });
    }

    getDefinitionResources(
        _project: string,
        _definitionId: number
    ): Promise<DefinitionResourceReference[]> {
        return Promise.resolve([...definitionResources]);
    }

    authorizeDefinitionResources(
        resources: DefinitionResourceReference[],
        _project: string,
        _definitionId: number
    ): Promise<DefinitionResourceReference[]> {
        return Promise.resolve(
            resources.map(resource => ({
                ...makeDefinitionResourceReference(resource.id, resource.type),
                ...resource
            }))
        );
    }

    authorizeProjectResources(
        resources: DefinitionResourceReference[],
        _project: string
    ): Promise<DefinitionResourceReference[]> {
        return Promise.resolve(
            resources.map(resource => ({
                ...makeDefinitionResourceReference(resource.id, resource.type),
                ...resource
            }))
        );
    }

    getProjectResources(
        _project: string,
        type?: string,
        id?: string
    ): Promise<DefinitionResourceReference[]> {
        const typed = definitionResources.filter(
            resource => resource.type === (type ?? resource.type)
        );
        return Promise.resolve(typed.filter(resource => resource.id === (id ?? resource.id)));
    }

    getProjectMetrics(
        _project: string,
        metricAggregationType?: string,
        minMetricsTime?: Date
    ): Promise<BuildMetric[]> {
        const scoped = buildMetrics.filter(
            metric => metric.scope === (metricAggregationType ?? metric.scope)
        );
        const since = minMetricsTime ?? new Date(0);
        return Promise.resolve(scoped.filter(metric => metric.date >= since));
    }

    getResourceUsage(): Promise<BuildResourceUsage> {
        return Promise.resolve({ ...resourceUsage });
    }
}
