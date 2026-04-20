import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    CoreRestClient,
    Process,
    TeamProject,
    TeamProjectCollection,
    TeamProjectCollectionReference,
    WebApiTeam
} from "azure-devops-extension-api/Core";
import { PagedList, IdentityRef, TeamMember } from "azure-devops-extension-api/WebApi";
import { OperationReference } from "azure-devops-extension-api/Operations";
import {
    makeIdentityRef,
    makeProcess,
    makeProject,
    makeTeam,
    processes,
    projectCollections,
    projectReferences,
    projects,
    teamMembers,
    teams,
    makeOperationReference
} from "./Data";

/**
 * Mocked CoreRestClient — covers the methods most extensions need.
 * Unimplemented methods fall back to the parent RestClientBase behavior.
 */
export class MockCoreRestClient extends RestClientBase {
    public TYPE = CoreRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getProjects(): Promise<PagedList<TeamProject>> {
        return Promise.resolve(projects as unknown as PagedList<TeamProject>);
    }

    getProject(projectId: string): Promise<TeamProject> {
        const found = projects.find(p => p.id === projectId || p.name === projectId);
        return Promise.resolve(found ?? makeProject());
    }

    getProjectCollections(): Promise<TeamProjectCollectionReference[]> {
        return Promise.resolve(projectCollections);
    }

    getProjectCollection(_collectionId: string): Promise<TeamProjectCollection> {
        return Promise.resolve(projectCollections[0]);
    }

    getTeams(projectId: string): Promise<WebApiTeam[]> {
        return Promise.resolve(teams.map(t => ({ ...t, projectId })));
    }

    getAllTeams(): Promise<WebApiTeam[]> {
        return Promise.resolve(teams);
    }

    getTeam(projectId: string, teamId: string): Promise<WebApiTeam> {
        const found = teams.find(t => t.id === teamId);
        return Promise.resolve(found ?? { ...makeTeam(), id: teamId, projectId });
    }

    createTeam(team: WebApiTeam, projectId: string): Promise<WebApiTeam> {
        return Promise.resolve({ ...team, projectId, id: team.id ?? makeTeam().id });
    }

    updateTeam(teamData: WebApiTeam, projectId: string, teamId: string): Promise<WebApiTeam> {
        return Promise.resolve({ ...teamData, projectId, id: teamId });
    }

    deleteTeam(_projectId: string, _teamId: string): Promise<void> {
        return Promise.resolve();
    }

    getTeamMembersWithExtendedProperties(
        _projectId: string,
        _teamId: string,
        top?: number,
        skip?: number
    ): Promise<TeamMember[]> {
        const start = skip ?? 0;
        const end = start + (top ?? teamMembers.length);
        return Promise.resolve(teamMembers.slice(start, end));
    }

    getProcesses(): Promise<Process[]> {
        return Promise.resolve(processes);
    }

    getProcessById(processId: string): Promise<Process> {
        const found = processes.find(p => p.id === processId);
        return Promise.resolve(found ?? { ...makeProcess(), id: processId });
    }

    queueCreateProject(projectToCreate: TeamProject): Promise<OperationReference> {
        return Promise.resolve(makeOperationReference());
    }

    queueDeleteProject(_projectId: string): Promise<OperationReference> {
        return Promise.resolve(makeOperationReference());
    }

    updateProject(_projectUpdate: TeamProject, _projectId: string): Promise<OperationReference> {
        return Promise.resolve(makeOperationReference());
    }

    getIdentityMru(_mruName: string): Promise<IdentityRef[]> {
        return Promise.resolve([makeIdentityRef(), makeIdentityRef()]);
    }

    // PagedList helper used by some consumers
    getProjectsPaged(): Promise<PagedList<TeamProject>> {
        return Promise.resolve(projectReferences as unknown as PagedList<TeamProject>);
    }
}
