import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    CategorizedWebApiTeams,
    ConnectedServiceKind,
    CoreRestClient,
    IdentityData,
    Process,
    ProjectAvatar,
    ProjectInfo,
    ProjectProperties,
    ProjectProperty,
    Proxy,
    TeamProject,
    TeamProjectCollection,
    TeamProjectCollectionReference,
    TeamProjectReference,
    WebApiConnectedService,
    WebApiConnectedServiceDetails,
    WebApiTeam
} from "azure-devops-extension-api/Core";
import { IdentityRef, JsonPatchDocument, PagedList, TeamMember } from "azure-devops-extension-api/WebApi";
import { OperationReference } from "azure-devops-extension-api/Operations";
import {
    connectedServices,
    identityMru,
    makeConnectedService,
    makeConnectedServiceDetails,
    makeOperationReference,
    makeProcess,
    makeProject,
    makeProjectCollection,
    makeProjectReference,
    makeProxy,
    makeTeam,
    processes,
    projectCollections,
    projectHistory,
    projectProperties,
    projects,
    proxies,
    readableTeams,
    teamMembers,
    teams
} from "./Data";

const page = <T>(list: T[], top?: number, skip?: number): T[] => {
    const start = skip ?? 0;
    return list.slice(start, start + (top ?? list.length));
};

const selectProperties = (keys?: string[]): ProjectProperty[] =>
    keys === undefined ? projectProperties : projectProperties.filter(p => keys.includes(p.name));

export class MockCoreRestClient extends RestClientBase {
    public TYPE = CoreRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    removeProjectAvatar(_projectId: string): Promise<void> {
        return Promise.resolve();
    }

    setProjectAvatar(_avatarBlob: ProjectAvatar, _projectId: string): Promise<void> {
        return Promise.resolve();
    }

    getProjectTeamsByCategory(
        projectId: string,
        _expandIdentity?: boolean,
        top?: number,
        skip?: number
    ): Promise<CategorizedWebApiTeams> {
        return Promise.resolve({
            myTeams: page(teams, top, skip).map(t => ({ ...t, projectId })),
            otherReadableTeams: readableTeams.map(t => ({ ...t, projectId }))
        });
    }

    createConnectedService(
        connectedServiceCreationData: WebApiConnectedServiceDetails,
        projectId: string
    ): Promise<WebApiConnectedService> {
        return Promise.resolve({
            ...makeConnectedService(),
            ...connectedServiceCreationData.connectedServiceMetaData,
            project: { ...makeProjectReference(), id: projectId }
        });
    }

    getConnectedServiceDetails(_projectId: string, name: string): Promise<WebApiConnectedServiceDetails> {
        const found = connectedServices.find(s => s.friendlyName === name || s.id === name);
        return Promise.resolve(
            makeConnectedServiceDetails(found ?? { ...makeConnectedService(), friendlyName: name })
        );
    }

    getConnectedServices(_projectId: string, kind?: ConnectedServiceKind): Promise<WebApiConnectedService[]> {
        return Promise.resolve(
            kind === undefined
                ? connectedServices
                : connectedServices.filter(s => s.kind === ConnectedServiceKind[kind])
        );
    }

    createIdentityMru(_mruData: IdentityData, _mruName: string): Promise<void> {
        return Promise.resolve();
    }

    deleteIdentityMru(_mruData: IdentityData, _mruName: string): Promise<void> {
        return Promise.resolve();
    }

    getIdentityMru(_mruName: string): Promise<IdentityRef[]> {
        return Promise.resolve(identityMru);
    }

    updateIdentityMru(_mruData: IdentityData, _mruName: string): Promise<void> {
        return Promise.resolve();
    }

    getTeamMembersWithExtendedProperties(
        _projectId: string,
        _teamId: string,
        top?: number,
        skip?: number
    ): Promise<TeamMember[]> {
        return Promise.resolve(page(teamMembers, top, skip));
    }

    getProcessById(processId: string): Promise<Process> {
        const found = processes.find(p => p.id === processId);
        return Promise.resolve(found ?? { ...makeProcess(), id: processId });
    }

    getProcesses(): Promise<Process[]> {
        return Promise.resolve(processes);
    }

    getProjectCollection(collectionId: string): Promise<TeamProjectCollection> {
        const found = projectCollections.find(c => c.id === collectionId || c.name === collectionId);
        return Promise.resolve(found ?? { ...makeProjectCollection(), id: collectionId });
    }

    getProjectCollections(top?: number, skip?: number): Promise<TeamProjectCollectionReference[]> {
        return Promise.resolve(page(projectCollections, top, skip));
    }

    getProjectHistoryEntries(minRevision?: number): Promise<ProjectInfo[]> {
        return Promise.resolve(projectHistory.filter(p => p.revision >= (minRevision ?? 0)));
    }

    getProject(projectId: string, _includeCapabilities?: boolean, _includeHistory?: boolean): Promise<TeamProject> {
        const found = projects.find(p => p.id === projectId || p.name === projectId);
        return Promise.resolve(found ?? { ...makeProject(), id: projectId });
    }

    getProjects(
        stateFilter?: any,
        top?: number,
        skip?: number,
        continuationToken?: number,
        _getDefaultTeamImageUrl?: boolean
    ): Promise<PagedList<TeamProjectReference>> {
        const filtered = stateFilter === undefined ? projects : projects.filter(p => p.state === stateFilter);
        const start = (skip ?? 0) + (continuationToken ?? 0);
        const end = start + (top ?? filtered.length);
        const list = Object.assign(filtered.slice(start, end), {
            continuationToken: end < filtered.length ? String(end) : null
        }) as PagedList<TeamProjectReference>;
        return Promise.resolve(list);
    }

    queueCreateProject(_projectToCreate: TeamProject): Promise<OperationReference> {
        return Promise.resolve(makeOperationReference());
    }

    queueDeleteProject(_projectId: string): Promise<OperationReference> {
        return Promise.resolve(makeOperationReference());
    }

    updateProject(_projectUpdate: TeamProject, _projectId: string): Promise<OperationReference> {
        return Promise.resolve(makeOperationReference());
    }

    getProjectsProperties(projectIds: string[], properties?: string[]): Promise<ProjectProperties[]> {
        return Promise.resolve(projectIds.map(projectId => ({ projectId, properties: selectProperties(properties) })));
    }

    getProjectProperties(_projectId: string, keys?: string[]): Promise<ProjectProperty[]> {
        return Promise.resolve(selectProperties(keys));
    }

    setProjectProperties(_projectId: string, _patchDocument: JsonPatchDocument): Promise<void> {
        return Promise.resolve();
    }

    createOrUpdateProxy(proxy: Proxy): Promise<Proxy> {
        return Promise.resolve({ ...makeProxy(), ...proxy });
    }

    deleteProxy(_proxyUrl: string, _site?: string): Promise<void> {
        return Promise.resolve();
    }

    getProxies(proxyUrl?: string): Promise<Proxy[]> {
        return Promise.resolve(proxyUrl === undefined ? proxies : proxies.filter(p => p.url === proxyUrl));
    }

    getAllTeams(_mine?: boolean, top?: number, skip?: number, _expandIdentity?: boolean): Promise<WebApiTeam[]> {
        return Promise.resolve(page(teams, top, skip));
    }

    createTeam(team: WebApiTeam, projectId: string): Promise<WebApiTeam> {
        return Promise.resolve({ ...makeTeam(), ...team, projectId });
    }

    deleteTeam(_projectId: string, _teamId: string): Promise<void> {
        return Promise.resolve();
    }

    getTeam(projectId: string, teamId: string, _expandIdentity?: boolean): Promise<WebApiTeam> {
        const found = teams.find(t => t.id === teamId || t.name === teamId);
        return Promise.resolve(found ?? { ...makeTeam(), id: teamId, projectId });
    }

    getTeams(
        projectId: string,
        _mine?: boolean,
        top?: number,
        skip?: number,
        _expandIdentity?: boolean
    ): Promise<WebApiTeam[]> {
        return Promise.resolve(page(teams, top, skip).map(t => ({ ...t, projectId })));
    }

    updateTeam(teamData: WebApiTeam, projectId: string, teamId: string): Promise<WebApiTeam> {
        return Promise.resolve({ ...makeTeam(), ...teamData, projectId, id: teamId });
    }
}
