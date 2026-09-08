import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    ReleaseRestClient,
    Release,
    ReleaseDefinition,
    ReleaseEnvironment,
    Deployment,
    ReleaseApproval,
    ReleaseEnvironmentUpdateMetadata,
    ReleaseStartMetadata,
    Folder,
    FolderPathQueryOrder,
    FavoriteItem,
    ReleaseDefinitionEnvironmentTemplate,
    AgentArtifactDefinition,
    Artifact,
    ArtifactTypeDefinition,
    ArtifactVersionQueryResult,
    AutoTriggerIssue,
    GateUpdateMetadata,
    ManualIntervention,
    ManualInterventionUpdateMetadata,
    ReleaseGates,
    ReleaseTask,
    ReleaseTaskAttachment,
    DefinitionEnvironmentReference,
    ReleaseDefinitionRevision,
    ReleaseDefinitionSummary,
    Change,
    DeploymentQueryParameters,
    ProjectReference,
    ReleaseRevision,
    ReleaseWorkItemRef,
    Metric,
    OrgPipelineReleaseSettings,
    OrgPipelineReleaseSettingsUpdateParameters,
    ProjectPipelineReleaseSettings,
    ProjectPipelineReleaseSettingsUpdateParameters,
    ReleaseSettings
} from "azure-devops-extension-api/Release";
import { InputValuesQuery } from "azure-devops-extension-api/FormInput";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    agentArtifactDefinitions,
    approvals,
    approvalsPage,
    artifactTypeDefinitions,
    artifactVersions,
    autoTriggerIssues,
    definitionEnvironmentReferences,
    definitionTags,
    deployments,
    deploymentsPage,
    environmentTemplates,
    favorites,
    folders,
    makeApproval,
    makeArtifactVersion,
    makeBuffer,
    makeDeployment,
    makeEnvironment,
    makeEnvironmentTemplate,
    makeFavoriteItem,
    makeFolder,
    makeInputValuesQuery,
    makeManualIntervention,
    makeRelease,
    makeReleaseDefinition,
    makeReleaseDefinitionShallowReference,
    makeReleaseGates,
    makeReleaseSettings,
    makeOrgPipelineReleaseSettings,
    makeProjectPipelineReleaseSettings,
    manualInterventions,
    metrics,
    releaseChanges,
    releaseDefinitionEnvironmentSummaries,
    releaseDefinitionRevisions,
    releaseDefinitions,
    releaseDefinitionsPage,
    releaseProjects,
    releaseRevisions,
    releaseTags,
    releaseTasks,
    releaseWorkItemRefs,
    releases,
    sourceBranches,
    tags,
    taskAttachments
} from "./Data";

export class MockReleaseRestClient extends RestClientBase {
    public TYPE = ReleaseRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getReleaseDefinitions(_project: string): Promise<PagedList<ReleaseDefinition>> {
        return Promise.resolve(releaseDefinitionsPage);
    }

    getReleaseDefinition(_project: string, definitionId: number): Promise<ReleaseDefinition> {
        const found = releaseDefinitions.find(d => d.id === definitionId);
        return Promise.resolve(found ?? { ...makeReleaseDefinition(), id: definitionId });
    }

    createReleaseDefinition(
        releaseDefinition: ReleaseDefinition,
        _project: string
    ): Promise<ReleaseDefinition> {
        return Promise.resolve({ ...makeReleaseDefinition(), ...releaseDefinition });
    }

    updateReleaseDefinition(
        releaseDefinition: ReleaseDefinition,
        _project: string
    ): Promise<ReleaseDefinition> {
        return Promise.resolve({ ...makeReleaseDefinition(), ...releaseDefinition });
    }

    deleteReleaseDefinition(_project: string, _definitionId: number): Promise<void> {
        return Promise.resolve();
    }

    getReleases(_project?: string): Promise<PagedList<Release>> {
        return Promise.resolve(
            Object.assign([...releases], { continuationToken: "" }) as unknown as PagedList<Release>
        );
    }

    getRelease(_project: string, releaseId: number): Promise<Release> {
        const found = releases.find(r => r.id === releaseId);
        return Promise.resolve(found ?? { ...makeRelease(), id: releaseId });
    }

    createRelease(releaseStartMetadata: ReleaseStartMetadata, _project: string): Promise<Release> {
        const release = makeRelease();
        return Promise.resolve({
            ...release,
            description: releaseStartMetadata.description ?? release.description,
            releaseDefinition: {
                ...release.releaseDefinition,
                id: releaseStartMetadata.definitionId ?? release.releaseDefinition.id
            }
        });
    }

    updateRelease(release: Release, _project: string, releaseId: number): Promise<Release> {
        return Promise.resolve({ ...makeRelease(), ...release, id: releaseId });
    }

    getReleaseEnvironment(
        _project: string,
        _releaseId: number,
        environmentId: number
    ): Promise<ReleaseEnvironment> {
        return Promise.resolve({ ...makeEnvironment(), id: environmentId });
    }

    updateReleaseEnvironment(
        _environmentUpdateData: ReleaseEnvironmentUpdateMetadata,
        _project: string,
        _releaseId: number,
        environmentId: number
    ): Promise<ReleaseEnvironment> {
        return Promise.resolve({ ...makeEnvironment(), id: environmentId });
    }

    getDeployments(_project: string): Promise<PagedList<Deployment>> {
        return Promise.resolve(deploymentsPage);
    }

    getApprovals(_project: string): Promise<PagedList<ReleaseApproval>> {
        return Promise.resolve(approvalsPage);
    }

    getApproval(_project: string, approvalId: number): Promise<ReleaseApproval> {
        const found = approvals.find(a => a.id === approvalId);
        return Promise.resolve(found ?? { ...makeApproval(), id: approvalId });
    }

    updateReleaseApproval(
        approval: ReleaseApproval,
        _project: string,
        approvalId: number
    ): Promise<ReleaseApproval> {
        return Promise.resolve({ ...makeApproval(), ...approval, id: approvalId });
    }

    addDefinitionTag(_project: string, _releaseDefinitionId: number, tag: string): Promise<string[]> {
        return Promise.resolve(
            definitionTags.includes(tag) ? [...definitionTags] : [...definitionTags, tag]
        );
    }

    addDefinitionTags(
        tags: string[],
        _project: string,
        _releaseDefinitionId: number
    ): Promise<string[]> {
        return Promise.resolve([...new Set([...definitionTags, ...tags])]);
    }

    deleteDefinitionTag(
        _project: string,
        _releaseDefinitionId: number,
        tag: string
    ): Promise<string[]> {
        return Promise.resolve(definitionTags.filter(existing => existing !== tag));
    }

    getDefinitionTags(_project: string, _releaseDefinitionId: number): Promise<string[]> {
        return Promise.resolve([...definitionTags]);
    }

    addReleaseTag(_project: string, _releaseId: number, tag: string): Promise<string[]> {
        return Promise.resolve(releaseTags.includes(tag) ? [...releaseTags] : [...releaseTags, tag]);
    }

    addReleaseTags(tags: string[], _project: string, _releaseId: number): Promise<string[]> {
        return Promise.resolve([...new Set([...releaseTags, ...tags])]);
    }

    deleteReleaseTag(_project: string, _releaseId: number, tag: string): Promise<string[]> {
        return Promise.resolve(releaseTags.filter(existing => existing !== tag));
    }

    getReleaseTags(_project: string, _releaseId: number): Promise<string[]> {
        return Promise.resolve([...releaseTags]);
    }

    getTags(_project: string): Promise<string[]> {
        return Promise.resolve([...tags]);
    }

    createFolder(folder: Folder, _project: string, path?: string): Promise<Folder> {
        return Promise.resolve({ ...makeFolder(), ...folder, path: path ?? folder.path });
    }

    deleteFolder(_project: string, _path: string): Promise<void> {
        return Promise.resolve();
    }

    getFolders(
        _project: string,
        path?: string,
        queryOrder?: FolderPathQueryOrder
    ): Promise<Folder[]> {
        const matched = path ? folders.filter(folder => folder.path.startsWith(path)) : [...folders];
        if (queryOrder === FolderPathQueryOrder.Ascending) {
            return Promise.resolve([...matched].sort((a, b) => a.path.localeCompare(b.path)));
        }
        if (queryOrder === FolderPathQueryOrder.Descending) {
            return Promise.resolve([...matched].sort((a, b) => b.path.localeCompare(a.path)));
        }
        return Promise.resolve(matched);
    }

    updateFolder(folder: Folder, _project: string, path: string): Promise<Folder> {
        const found = folders.find(existing => existing.path === path);
        return Promise.resolve({ ...(found ?? makeFolder()), ...folder, path });
    }

    createFavorites(
        favoriteItems: FavoriteItem[],
        _project: string,
        scope: string,
        _identityId?: string
    ): Promise<FavoriteItem[]> {
        return Promise.resolve(
            favoriteItems.map(item => ({ ...makeFavoriteItem(), ...item, type: item.type || scope }))
        );
    }

    deleteFavorites(
        _project: string,
        _scope: string,
        _identityId?: string,
        _favoriteItemIds?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getFavorites(_project: string, scope: string, _identityId?: string): Promise<FavoriteItem[]> {
        const matched = favorites.filter(item => item.type === scope);
        return Promise.resolve(matched.length > 0 ? matched : [...favorites]);
    }

    createDefinitionEnvironmentTemplate(
        template: ReleaseDefinitionEnvironmentTemplate,
        _project: string
    ): Promise<ReleaseDefinitionEnvironmentTemplate> {
        return Promise.resolve({ ...makeEnvironmentTemplate(), ...template });
    }

    deleteDefinitionEnvironmentTemplate(_project: string, _templateId: string): Promise<void> {
        return Promise.resolve();
    }

    getDefinitionEnvironmentTemplate(
        _project: string,
        templateId: string
    ): Promise<ReleaseDefinitionEnvironmentTemplate> {
        const found = environmentTemplates.find(template => template.id === templateId);
        return Promise.resolve(found ?? { ...makeEnvironmentTemplate(), id: templateId });
    }

    listDefinitionEnvironmentTemplates(
        _project: string,
        isDeleted?: boolean
    ): Promise<ReleaseDefinitionEnvironmentTemplate[]> {
        return Promise.resolve(
            environmentTemplates.filter(template => template.isDeleted === (isDeleted ?? false))
        );
    }

    undeleteReleaseDefinitionEnvironmentTemplate(
        _project: string,
        templateId: string
    ): Promise<ReleaseDefinitionEnvironmentTemplate> {
        const found = environmentTemplates.find(template => template.id === templateId);
        return Promise.resolve({
            ...(found ?? makeEnvironmentTemplate()),
            id: templateId,
            isDeleted: false
        });
    }

    getAgentArtifactDefinitions(
        _project: string,
        _releaseId: number
    ): Promise<AgentArtifactDefinition[]> {
        return Promise.resolve([...agentArtifactDefinitions]);
    }

    getArtifactTypeDefinitions(_project: string): Promise<ArtifactTypeDefinition[]> {
        return Promise.resolve([...artifactTypeDefinitions]);
    }

    getArtifactVersions(
        _project: string,
        _releaseDefinitionId: number
    ): Promise<ArtifactVersionQueryResult> {
        return Promise.resolve({ artifactVersions: [...artifactVersions] });
    }

    getArtifactVersionsForSources(
        artifacts: Artifact[],
        _project: string
    ): Promise<ArtifactVersionQueryResult> {
        return Promise.resolve({
            artifactVersions: artifacts.map(artifact => makeArtifactVersion(artifact.alias))
        });
    }

    getSourceBranches(_project: string, _definitionId: number): Promise<string[]> {
        return Promise.resolve([...sourceBranches]);
    }

    getLog(
        _project: string,
        releaseId: number,
        environmentId: number,
        taskId: number,
        _attemptId?: number
    ): Promise<string> {
        return Promise.resolve(`release ${releaseId} env ${environmentId} task ${taskId} log`);
    }

    getLogs(_project: string, releaseId: number): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`release-${releaseId}-logs`));
    }

    getGateLog(
        _project: string,
        releaseId: number,
        environmentId: number,
        gateId: number,
        taskId: number
    ): Promise<string> {
        return Promise.resolve(
            `release ${releaseId} env ${environmentId} gate ${gateId} task ${taskId} log`
        );
    }

    getTaskLog(
        _project: string,
        releaseId: number,
        environmentId: number,
        releaseDeployPhaseId: number,
        taskId: number,
        _startLine?: number,
        _endLine?: number
    ): Promise<string> {
        return Promise.resolve(
            `release ${releaseId} env ${environmentId} phase ${releaseDeployPhaseId} task ${taskId} log`
        );
    }

    getTasks(
        _project: string,
        _releaseId: number,
        _environmentId: number,
        _attemptId?: number
    ): Promise<ReleaseTask[]> {
        return Promise.resolve([...releaseTasks]);
    }

    getTasksForTaskGroup(
        _project: string,
        _releaseId: number,
        _environmentId: number,
        _releaseDeployPhaseId: number
    ): Promise<ReleaseTask[]> {
        return Promise.resolve([...releaseTasks]);
    }

    getReleaseTaskAttachmentContent(
        _project: string,
        releaseId: number,
        _environmentId: number,
        _attemptId: number,
        _planId: string,
        _timelineId: string,
        recordId: string,
        _type: string,
        name: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`release-${releaseId}-${recordId}-${name}`));
    }

    getReleaseTaskAttachments(
        _project: string,
        _releaseId: number,
        _environmentId: number,
        _attemptId: number,
        _planId: string,
        type: string
    ): Promise<ReleaseTaskAttachment[]> {
        const matched = taskAttachments.filter(attachment => attachment.type === type);
        return Promise.resolve(matched.length > 0 ? matched : [...taskAttachments]);
    }

    getTaskAttachmentContent(
        _project: string,
        releaseId: number,
        _environmentId: number,
        _attemptId: number,
        _timelineId: string,
        recordId: string,
        _type: string,
        name: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(`task-${releaseId}-${recordId}-${name}`));
    }

    getTaskAttachments(
        _project: string,
        _releaseId: number,
        _environmentId: number,
        _attemptId: number,
        _timelineId: string,
        type: string
    ): Promise<ReleaseTaskAttachment[]> {
        const matched = taskAttachments.filter(attachment => attachment.type === type);
        return Promise.resolve(matched.length > 0 ? matched : [...taskAttachments]);
    }

    getManualIntervention(
        _project: string,
        _releaseId: number,
        manualInterventionId: number
    ): Promise<ManualIntervention> {
        const found = manualInterventions.find(item => item.id === manualInterventionId);
        return Promise.resolve(found ?? { ...makeManualIntervention(), id: manualInterventionId });
    }

    getManualInterventions(_project: string, _releaseId: number): Promise<ManualIntervention[]> {
        return Promise.resolve([...manualInterventions]);
    }

    updateManualIntervention(
        manualInterventionUpdateMetadata: ManualInterventionUpdateMetadata,
        _project: string,
        _releaseId: number,
        manualInterventionId: number
    ): Promise<ManualIntervention> {
        const found = manualInterventions.find(item => item.id === manualInterventionId);
        return Promise.resolve({
            ...(found ?? makeManualIntervention()),
            id: manualInterventionId,
            comments: manualInterventionUpdateMetadata.comment,
            status: manualInterventionUpdateMetadata.status
        });
    }

    updateGates(
        gateUpdateMetadata: GateUpdateMetadata,
        _project: string,
        gateStepId: number
    ): Promise<ReleaseGates> {
        return Promise.resolve({
            ...makeReleaseGates(gateStepId),
            ignoredGates: gateUpdateMetadata.gatesToIgnore.map(name => ({
                name,
                lastModifiedOn: new Date()
            }))
        });
    }

    getIssues(
        _project: string,
        _buildId: number,
        _sourceId?: string
    ): Promise<AutoTriggerIssue[]> {
        return Promise.resolve([...autoTriggerIssues]);
    }

    getAutoTriggerIssues(
        _artifactType: string,
        _sourceId: string,
        _artifactVersionId: string,
        _project?: string
    ): Promise<AutoTriggerIssue[]> {
        return Promise.resolve([...autoTriggerIssues]);
    }

    getInputValues(query: InputValuesQuery, _project: string): Promise<InputValuesQuery> {
        return Promise.resolve({ ...makeInputValuesQuery(), ...query });
    }

    getApprovalHistory(_project: string, approvalStepId: number): Promise<ReleaseApproval> {
        const found = approvals.find(approval => approval.id === approvalStepId);
        return Promise.resolve(found ?? { ...makeApproval(), id: approvalStepId });
    }

    updateReleaseApprovals(
        approvals: ReleaseApproval[],
        _project: string
    ): Promise<ReleaseApproval[]> {
        return Promise.resolve(approvals.map(approval => ({ ...makeApproval(), ...approval })));
    }

    getDefinitionEnvironments(
        _project: string,
        _taskGroupId?: string,
        _propertyFilters?: string[]
    ): Promise<DefinitionEnvironmentReference[]> {
        return Promise.resolve([...definitionEnvironmentReferences]);
    }

    getDefinitionRevision(
        _project: string,
        definitionId: number,
        revision: number
    ): Promise<string> {
        return Promise.resolve(`definition ${definitionId} revision ${revision}`);
    }

    getReleaseDefinitionHistory(
        _project: string,
        definitionId: number
    ): Promise<ReleaseDefinitionRevision[]> {
        const matched = releaseDefinitionRevisions.filter(
            revision => revision.definitionId === definitionId
        );
        return Promise.resolve(matched.length > 0 ? matched : [...releaseDefinitionRevisions]);
    }

    getReleaseDefinitionRevision(
        _project: string,
        definitionId: number,
        revision: number
    ): Promise<string> {
        return Promise.resolve(`release definition ${definitionId} revision ${revision}`);
    }

    getReleaseDefinitionSummary(
        _project: string,
        definitionId: number,
        releaseCount: number,
        _includeArtifact?: boolean,
        definitionEnvironmentIdsFilter?: number[]
    ): Promise<ReleaseDefinitionSummary> {
        const environments = definitionEnvironmentIdsFilter
            ? releaseDefinitionEnvironmentSummaries.filter(environment =>
                  definitionEnvironmentIdsFilter.includes(environment.id)
              )
            : [...releaseDefinitionEnvironmentSummaries];
        return Promise.resolve({
            environments,
            releaseDefinition: makeReleaseDefinitionShallowReference(definitionId),
            releases: releases.slice(0, releaseCount)
        });
    }

    getReleaseHistory(_project: string, releaseId: number): Promise<ReleaseRevision[]> {
        const matched = releaseRevisions.filter(revision => revision.releaseId === releaseId);
        return Promise.resolve(matched.length > 0 ? matched : [...releaseRevisions]);
    }

    getReleaseRevision(
        _project: string,
        releaseId: number,
        definitionSnapshotRevision: number
    ): Promise<string> {
        return Promise.resolve(`release ${releaseId} revision ${definitionSnapshotRevision}`);
    }

    getReleaseChanges(
        _project: string,
        _releaseId: number,
        _baseReleaseId?: number,
        top?: number,
        _artifactAlias?: string
    ): Promise<Change[]> {
        return Promise.resolve(top ? releaseChanges.slice(0, top) : [...releaseChanges]);
    }

    getReleaseProjects(
        _artifactType: string,
        _artifactSourceId: string
    ): Promise<ProjectReference[]> {
        return Promise.resolve([...releaseProjects]);
    }

    getReleaseWorkItemsRefs(
        _project: string,
        _releaseId: number,
        _baseReleaseId?: number,
        top?: number,
        _artifactAlias?: string
    ): Promise<ReleaseWorkItemRef[]> {
        return Promise.resolve(top ? releaseWorkItemRefs.slice(0, top) : [...releaseWorkItemRefs]);
    }

    getDeploymentsForMultipleEnvironments(
        queryParameters: DeploymentQueryParameters,
        _project: string
    ): Promise<Deployment[]> {
        return Promise.resolve(
            deployments.filter(
                deployment => deployment.deploymentStatus === queryParameters.deploymentStatus
            )
        );
    }

    getDeploymentBadge(
        projectId: string,
        releaseDefinitionId: number,
        environmentId: number,
        branchName?: string
    ): Promise<string> {
        const scope = branchName
            ? `${projectId}/${releaseDefinitionId}/${environmentId}/${branchName}`
            : `${projectId}/${releaseDefinitionId}/${environmentId}`;
        return Promise.resolve(`${scope} succeeded`);
    }

    getMetrics(_project: string, _minMetricsTime?: Date): Promise<Metric[]> {
        return Promise.resolve([...metrics]);
    }

    getReleaseSettings(_project: string): Promise<ReleaseSettings> {
        return Promise.resolve(makeReleaseSettings());
    }

    updateReleaseSettings(
        releaseSettings: ReleaseSettings,
        _project: string
    ): Promise<ReleaseSettings> {
        return Promise.resolve({ ...makeReleaseSettings(), ...releaseSettings });
    }

    getPipelineReleaseSettings(_project: string): Promise<ProjectPipelineReleaseSettings> {
        return Promise.resolve(makeProjectPipelineReleaseSettings());
    }

    updatePipelineReleaseSettings(
        newSettings: ProjectPipelineReleaseSettingsUpdateParameters,
        _project: string
    ): Promise<ProjectPipelineReleaseSettings> {
        return Promise.resolve({
            ...makeProjectPipelineReleaseSettings(),
            enforceJobAuthScope: newSettings.enforceJobAuthScope
        });
    }

    getOrgPipelineReleaseSettings(): Promise<OrgPipelineReleaseSettings> {
        return Promise.resolve(makeOrgPipelineReleaseSettings());
    }

    updateOrgPipelineReleaseSettings(
        newSettings: OrgPipelineReleaseSettingsUpdateParameters
    ): Promise<OrgPipelineReleaseSettings> {
        return Promise.resolve({
            ...makeOrgPipelineReleaseSettings(),
            orgEnforceJobAuthScope: newSettings.orgEnforceJobAuthScope
        });
    }
}

