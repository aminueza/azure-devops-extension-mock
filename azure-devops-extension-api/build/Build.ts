import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    Attachment,
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
    BuildOptionDefinition,
    BuildReportMetadata,
    BuildResourceUsage,
    BuildRetentionHistory,
    BuildSettings,
    DefinitionQueueStatus,
    DefinitionResourceReference,
    DefinitionTriggerType,
    Folder,
    FolderQueryOrder,
    MinimalRetentionLease,
    NewRetentionLease,
    PipelineGeneralSettings,
    ProjectRetentionSetting,
    PullRequest,
    RepositoryWebhook,
    ResultSet,
    RetentionLease,
    RetentionLeaseUpdate,
    SourceProviderAttributes,
    SourceRepositories,
    SourceRepositoryItem,
    Timeline,
    Change,
    UpdateProjectRetentionSettingModel,
    UpdateStageParameters,
    UpdateTagParameters,
    YamlBuild
} from "azure-devops-extension-api/Build";
import { JsonPatchDocument, PagedList, ResourceRef } from "azure-devops-extension-api/WebApi";
import {
    artifacts,
    attachments,
    attachmentType,
    buildControllers,
    buildDefinitions,
    buildList,
    buildLogLines,
    buildMetrics,
    buildProperties,
    buildReports,
    buildSettings,
    buildsPage,
    buildTags,
    buildWorkItemRefs,
    changes,
    definitionProperties,
    definitionResources,
    definitionRevisions,
    definitionTags,
    definitionTemplates,
    folders,
    generalSettings,
    makeArtifact,
    makeAttachment,
    makeBuild,
    makeBuildBadge,
    makeBuildController,
    makeBuildDefinition,
    makeBuildDefinitionTemplate,
    makeBuildReportMetadata,
    makeDefinitionResourceReference,
    makeFolder,
    makeLeaseFromNew,
    makePullRequest,
    makeRetentionLease,
    makeStageTimeline,
    makeUpdatedLease,
    optionDefinitions,
    projectRetentionSetting,
    projectTags,
    pullRequests,
    repositoryWebhooks,
    resourceUsage,
    retentionHistory,
    retentionLeases,
    sourceBranches,
    sourceProviders,
    sourceRepositories,
    sourceRepositoryItems,
    stageTimelines,
    timeline
} from "./Data";

const encode = (value: string): ArrayBuffer => {
    const buffer = new ArrayBuffer(value.length);
    const view = new Uint8Array(buffer);
    for (let index = 0; index < value.length; index += 1) {
        view[index] = value.charCodeAt(index) & 0xff;
    }
    return buffer;
};

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

    getAttachments(_project: string, _buildId: number, type: string): Promise<Attachment[]> {
        return Promise.resolve(type === attachmentType ? [...attachments] : [makeAttachment(type)]);
    }

    getAttachment(
        _project: string,
        _buildId: number,
        _timelineId: string,
        _recordId: string,
        type: string,
        name: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(encode(`${type}:${name}`));
    }

    getBuildLogLines(
        _project: string,
        _buildId: number,
        _logId: number,
        startLine?: number,
        endLine?: number
    ): Promise<string[]> {
        return Promise.resolve(
            buildLogLines.slice(startLine ?? 0, endLine ?? buildLogLines.length)
        );
    }

    getBuildLogZip(
        _project: string,
        _buildId: number,
        logId: number,
        startLine?: number,
        endLine?: number
    ): Promise<ArrayBuffer> {
        const range = [logId, startLine, endLine].filter(value => value !== undefined).join("-");
        return Promise.resolve(encode(`log-${range}`));
    }

    getBuildLogsZip(_project: string, buildId: number): Promise<ArrayBuffer> {
        return Promise.resolve(encode(`logs-${buildId}`));
    }

    getBuildProperties(_project: string, _buildId: number, filter?: string[]): Promise<any> {
        const properties: Record<string, unknown> = { ...buildProperties };
        const keys = filter ?? Object.keys(properties);
        return Promise.resolve(Object.fromEntries(keys.map(key => [key, properties[key]])));
    }

    updateBuildProperties(
        document: JsonPatchDocument,
        _project: string,
        _buildId: number
    ): Promise<any> {
        const operations = document as unknown as Array<{ path: string; value: unknown }>;
        const properties: Record<string, unknown> = { ...buildProperties };
        for (const operation of operations) {
            properties[operation.path.slice(1)] = operation.value;
        }
        return Promise.resolve(properties);
    }

    getBuildReport(
        _project: string,
        buildId: number,
        type?: string
    ): Promise<BuildReportMetadata> {
        const found = buildReports.find(report => report.buildId === buildId);
        const report = found ?? makeBuildReportMetadata(buildId, "build");
        return Promise.resolve(type === undefined ? report : { ...report, type });
    }

    getBuildReportHtmlContent(_project: string, buildId: number, type?: string): Promise<any> {
        const found = buildReports.find(report => report.buildId === buildId);
        const label = type ?? (found === undefined ? "build" : found.type);
        return Promise.resolve(`<html><body><h1>${label} report ${buildId}</h1></body></html>`);
    }

    getBuildStageLatestTimeline(
        _project: string,
        _buildId: number,
        stageName: string,
        changeId?: number,
        _planId?: string
    ): Promise<Timeline> {
        const found = stageTimelines.find(candidate => candidate.records[0].name === stageName);
        const stage = found ?? makeStageTimeline(`stage-${stageName}`, stageName);
        return Promise.resolve(changeId === undefined ? stage : { ...stage, changeId });
    }

    getBuildStageTimeline(
        _project: string,
        _buildId: number,
        timelineId: string,
        stageName: string,
        changeId?: number,
        _planId?: string
    ): Promise<Timeline> {
        const found = stageTimelines.find(candidate => candidate.id === timelineId);
        const stage = found ?? makeStageTimeline(timelineId, stageName);
        return Promise.resolve(
            changeId === undefined ? { ...stage } : { ...stage, changeId }
        );
    }

    updateStage(
        _updateParameters: UpdateStageParameters,
        _buildId: number,
        _stageRefName: string,
        _project?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getBuildOptionDefinitions(_project?: string): Promise<BuildOptionDefinition[]> {
        return Promise.resolve([...optionDefinitions]);
    }

    getBuildGeneralSettings(_project: string): Promise<PipelineGeneralSettings> {
        return Promise.resolve({ ...generalSettings });
    }

    updateBuildGeneralSettings(
        newSettings: PipelineGeneralSettings,
        _project: string
    ): Promise<PipelineGeneralSettings> {
        return Promise.resolve({ ...generalSettings, ...newSettings });
    }

    getBuildSettings(_project?: string): Promise<BuildSettings> {
        return Promise.resolve({ ...buildSettings });
    }

    updateBuildSettings(settings: BuildSettings, _project?: string): Promise<BuildSettings> {
        return Promise.resolve({ ...buildSettings, ...settings });
    }

    getFile(
        _project: string,
        _buildId: number,
        artifactName: string,
        fileId: string,
        fileName: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(encode(`${artifactName}/${fileId}/${fileName}`));
    }

    getFileContents(
        _project: string,
        providerName: string,
        serviceEndpointId?: string,
        repository?: string,
        commitOrBranch?: string,
        path?: string
    ): Promise<string> {
        return Promise.resolve(
            [providerName, serviceEndpointId, repository, commitOrBranch, path]
                .filter(Boolean)
                .join("/")
        );
    }

    getPathContents(
        _project: string,
        _providerName: string,
        _serviceEndpointId?: string,
        _repository?: string,
        _commitOrBranch?: string,
        path?: string
    ): Promise<SourceRepositoryItem[]> {
        return Promise.resolve(
            path === undefined
                ? [...sourceRepositoryItems]
                : sourceRepositoryItems.filter(item => item.path.startsWith(path))
        );
    }

    addRetentionLeases(
        newLeases: NewRetentionLease[],
        _project: string
    ): Promise<RetentionLease[]> {
        return Promise.resolve(newLeases.map(makeLeaseFromNew));
    }

    deleteRetentionLeasesById(_project: string, _ids: number[]): Promise<void> {
        return Promise.resolve();
    }

    getRetentionLease(_project: string, leaseId: number): Promise<RetentionLease> {
        const found = retentionLeases.find(lease => lease.leaseId === leaseId);
        return Promise.resolve(
            found ?? makeRetentionLease(leaseId, "owner-unknown", 0, 0)
        );
    }

    getRetentionLeasesByMinimalRetentionLeases(
        _project: string,
        leasesToFetch: MinimalRetentionLease[]
    ): Promise<RetentionLease[]> {
        return Promise.resolve(
            retentionLeases.filter(lease =>
                leasesToFetch.some(
                    wanted =>
                        wanted.ownerId === lease.ownerId &&
                        wanted.definitionId === lease.definitionId &&
                        wanted.runId === lease.runId
                )
            )
        );
    }

    getRetentionLeasesByOwnerId(
        _project: string,
        ownerId?: string,
        definitionId?: number,
        runId?: number
    ): Promise<RetentionLease[]> {
        return Promise.resolve(
            retentionLeases.filter(
                lease =>
                    lease.ownerId === (ownerId ?? lease.ownerId) &&
                    lease.definitionId === (definitionId ?? lease.definitionId) &&
                    lease.runId === (runId ?? lease.runId)
            )
        );
    }

    getRetentionLeasesByUserId(
        _project: string,
        userOwnerId: string,
        definitionId?: number,
        runId?: number
    ): Promise<RetentionLease[]> {
        return Promise.resolve(
            retentionLeases.filter(
                lease =>
                    lease.ownerId === userOwnerId &&
                    lease.definitionId === (definitionId ?? lease.definitionId) &&
                    lease.runId === (runId ?? lease.runId)
            )
        );
    }

    getRetentionLeasesForBuild(_project: string, buildId: number): Promise<RetentionLease[]> {
        return Promise.resolve(retentionLeases.filter(lease => lease.runId === buildId));
    }

    updateRetentionLease(
        leaseUpdate: RetentionLeaseUpdate,
        _project: string,
        leaseId: number
    ): Promise<RetentionLease> {
        return Promise.resolve(makeUpdatedLease(leaseId, leaseUpdate));
    }

    getRetentionHistory(daysToLookback?: number): Promise<BuildRetentionHistory> {
        const since = Date.now() - (daysToLookback ?? Number.MAX_SAFE_INTEGER) * 86_400_000;
        return Promise.resolve({
            buildRetentionSamples: retentionHistory.buildRetentionSamples.filter(
                sample => sample.sampleTime.getTime() >= since
            )
        });
    }

    getRetentionSettings(_project: string): Promise<ProjectRetentionSetting> {
        return Promise.resolve({ ...projectRetentionSetting });
    }

    updateRetentionSettings(
        updateModel: UpdateProjectRetentionSettingModel,
        _project: string
    ): Promise<ProjectRetentionSetting> {
        return Promise.resolve({
            purgeArtifacts: {
                ...projectRetentionSetting.purgeArtifacts,
                value: updateModel.artifactsRetention.value
            },
            purgePullRequestRuns: {
                ...projectRetentionSetting.purgePullRequestRuns,
                value: updateModel.pullRequestRunRetention.value
            },
            purgeRuns: {
                ...projectRetentionSetting.purgeRuns,
                value: updateModel.runRetention.value
            },
            retainRunsPerProtectedBranch: {
                ...projectRetentionSetting.retainRunsPerProtectedBranch,
                value: updateModel.retainRunsPerProtectedBranch.value
            }
        });
    }

    getBuildWorkItemsRefs(
        _project: string,
        _buildId: number,
        top?: number
    ): Promise<ResourceRef[]> {
        return Promise.resolve(buildWorkItemRefs.slice(0, top ?? buildWorkItemRefs.length));
    }

    getBuildWorkItemsRefsFromCommits(
        commitIds: string[],
        _project: string,
        _buildId: number,
        top?: number
    ): Promise<ResourceRef[]> {
        return Promise.resolve(buildWorkItemRefs.slice(0, top ?? commitIds.length));
    }

    getWorkItemsBetweenBuilds(
        _project: string,
        _fromBuildId: number,
        _toBuildId: number,
        top?: number
    ): Promise<ResourceRef[]> {
        return Promise.resolve(buildWorkItemRefs.slice(0, top ?? buildWorkItemRefs.length));
    }

    getChangesBetweenBuilds(
        _project: string,
        _fromBuildId?: number,
        _toBuildId?: number,
        top?: number
    ): Promise<Change[]> {
        return Promise.resolve(changes.slice(0, top ?? changes.length));
    }

    getPullRequest(
        _project: string,
        providerName: string,
        pullRequestId: string,
        _repositoryId?: string,
        _serviceEndpointId?: string
    ): Promise<PullRequest> {
        const found = pullRequests.find(request => request.id === pullRequestId);
        return Promise.resolve(found ?? makePullRequest(pullRequestId, providerName));
    }

    listBranches(
        _project: string,
        _providerName: string,
        _serviceEndpointId?: string,
        _repository?: string,
        branchName?: string
    ): Promise<string[]> {
        return Promise.resolve(sourceBranches.filter(branch => branch === (branchName ?? branch)));
    }

    listRepositories(
        _project: string,
        _providerName: string,
        _serviceEndpointId?: string,
        repository?: string,
        resultSet?: ResultSet,
        pageResults?: boolean,
        _continuationToken?: string
    ): Promise<SourceRepositories> {
        const named = sourceRepositories.filter(repo => repo.name === (repository ?? repo.name));
        const scoped = resultSet === ResultSet.Top ? named.slice(0, 1) : named;
        return Promise.resolve({
            repositories: scoped,
            pageLength: scoped.length,
            totalPageCount: scoped.length === 0 ? 0 : 1,
            continuationToken: pageResults === true ? "next-page" : ""
        });
    }

    listSourceProviders(_project: string): Promise<SourceProviderAttributes[]> {
        return Promise.resolve([...sourceProviders]);
    }

    listWebhooks(
        _project: string,
        _providerName: string,
        _serviceEndpointId?: string,
        repository?: string
    ): Promise<RepositoryWebhook[]> {
        return Promise.resolve(
            repositoryWebhooks.filter(webhook => webhook.name === (repository ?? webhook.name))
        );
    }

    restoreWebhooks(
        _triggerTypes: DefinitionTriggerType[],
        _project: string,
        _providerName: string,
        _serviceEndpointId?: string,
        _repository?: string
    ): Promise<void> {
        return Promise.resolve();
    }
}
