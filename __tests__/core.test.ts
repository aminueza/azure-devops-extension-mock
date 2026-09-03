import { CoreRestClient, ProcessType, ProjectVisibility } from "azure-devops-extension-api/Core";
import { OperationStatus } from "azure-devops-extension-api/Operations";

import { getClient } from "../azure-devops-extension-api";
import {
    makeIdentityRef,
    makeOperationReference,
    makeProcess,
    makeProject,
    makeProjectCollectionReference,
    makeProjectReference,
    makeTagDefinition,
    makeTeam,
    makeTeamMember,
    processes,
    projectCollections,
    projectReferences,
    projects,
    teamMembers,
    teams
} from "../azure-devops-extension-api/core/Data";

describe("CoreRestClient mock projects and collections", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(CoreRestClient);

    it("exposes the real class as TYPE", () => {
        expect((client as any).TYPE).toBe(CoreRestClient);
    });

    it("lists the fixture projects", async () => {
        const list = await client.getProjects();
        expect(list).toBe(projects);
        expect(list.length).toBe(5);
        expect(list[0]).toHaveProperty("capabilities");
        expect(list[0]).toHaveProperty("defaultTeam");
    });

    it("gets a project by id", async () => {
        const target = projects[1];
        const project = await client.getProject(target.id);
        expect(project).toBe(target);
    });

    it("gets a project by name", async () => {
        const target = projects[3];
        const project = await client.getProject(target.name);
        expect(project).toBe(target);
    });

    it("fabricates a project for an unknown id", async () => {
        const project = await client.getProject("does-not-exist");
        expect(projects.includes(project)).toBe(false);
        expect(project.id).not.toBe("does-not-exist");
        expect(project).toHaveProperty("name");
        expect(project).toHaveProperty("capabilities");
    });

    it("lists project collections", async () => {
        const list = await client.getProjectCollections();
        expect(list).toBe(projectCollections);
        expect(list.length).toBe(2);
        expect(list[0]).toHaveProperty("description");
    });

    it("returns the first collection for any collection id", async () => {
        const collection = await client.getProjectCollection("any-id");
        expect(collection).toBe(projectCollections[0]);
    });

    it("returns project references as a paged list", async () => {
        const list = await (client as any).getProjectsPaged();
        expect(list).toBe(projectReferences);
        expect(list.length).toBe(5);
        expect(list.continuationToken).toBe("");
    });

    it("queues a create-project operation", async () => {
        const op = await client.queueCreateProject({ name: "new" } as any);
        expect(op.status).toBe(OperationStatus.Succeeded);
        expect(op).toHaveProperty("id");
        expect(op).toHaveProperty("url");
    });

    it("queues a delete-project operation", async () => {
        const op = await client.queueDeleteProject("proj");
        expect(op.status).toBe(OperationStatus.Succeeded);
        expect(op).toHaveProperty("pluginId");
    });

    it("updates a project through an operation", async () => {
        const op = await client.updateProject({ description: "changed" } as any, "proj");
        expect(op.status).toBe(OperationStatus.Succeeded);
        expect(op).toHaveProperty("id");
    });
});

describe("CoreRestClient mock teams", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(CoreRestClient);

    it("lists teams stamped with the requested project id", async () => {
        const list = await client.getTeams("proj-123");
        expect(list.length).toBe(teams.length);
        list.forEach((t, i) => {
            expect(t.projectId).toBe("proj-123");
            expect(t.id).toBe(teams[i].id);
            expect(t).not.toBe(teams[i]);
        });
    });

    it("lists all teams untouched", async () => {
        const list = await client.getAllTeams();
        expect(list).toBe(teams);
        expect(list.length).toBe(3);
    });

    it("gets a known team by id", async () => {
        const target = teams[2];
        const team = await client.getTeam("proj", target.id);
        expect(team).toBe(target);
    });

    it("fabricates a team for an unknown id", async () => {
        const team = await client.getTeam("proj-x", "team-missing");
        expect(team.id).toBe("team-missing");
        expect(team.projectId).toBe("proj-x");
        expect(team).toHaveProperty("name");
        expect(team).toHaveProperty("identity");
    });

    it("creates a team keeping the caller's id", async () => {
        const team = await client.createTeam({ id: "given-id", name: "Alpha" } as any, "proj-1");
        expect(team.id).toBe("given-id");
        expect(team.name).toBe("Alpha");
        expect(team.projectId).toBe("proj-1");
    });

    it("creates a team generating an id when none is provided", async () => {
        const team = await client.createTeam({ name: "Beta" } as any, "proj-2");
        expect(typeof team.id).toBe("string");
        expect(team.id.length).toBeGreaterThan(0);
        expect(team.name).toBe("Beta");
        expect(team.projectId).toBe("proj-2");
    });

    it("updates a team forcing the id from the route", async () => {
        const team = await client.updateTeam({ id: "old", name: "Gamma" } as any, "proj-3", "route-id");
        expect(team.id).toBe("route-id");
        expect(team.name).toBe("Gamma");
        expect(team.projectId).toBe("proj-3");
    });

    it("deletes a team", async () => {
        await expect(client.deleteTeam("proj", "team")).resolves.toBeUndefined();
    });

    it("returns every team member when no paging is given", async () => {
        const members = await client.getTeamMembersWithExtendedProperties("proj", "team");
        expect(members).toEqual(teamMembers);
        expect(members.length).toBe(5);
        expect(members[0].identity).toHaveProperty("displayName");
    });

    it("limits team members with top", async () => {
        const members = await client.getTeamMembersWithExtendedProperties("proj", "team", 2);
        expect(members).toEqual(teamMembers.slice(0, 2));
    });

    it("offsets team members with skip", async () => {
        const members = await client.getTeamMembersWithExtendedProperties("proj", "team", undefined, 3);
        expect(members).toEqual(teamMembers.slice(3));
    });

    it("pages team members with top and skip", async () => {
        const members = await client.getTeamMembersWithExtendedProperties("proj", "team", 2, 1);
        expect(members).toEqual(teamMembers.slice(1, 3));
    });
});

describe("CoreRestClient mock processes and identities", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(CoreRestClient);

    it("lists processes", async () => {
        const list = await client.getProcesses();
        expect(list).toBe(processes);
        expect(list.length).toBe(4);
        list.forEach(p => expect(p.type).toBe(ProcessType.System));
    });

    it("gets a known process by id", async () => {
        const target = processes[1];
        const process = await client.getProcessById(target.id);
        expect(process).toBe(target);
    });

    it("fabricates a process for an unknown id", async () => {
        const process = await client.getProcessById("proc-missing");
        expect(process.id).toBe("proc-missing");
        expect(["Agile", "Scrum", "CMMI", "Basic"]).toContain(process.name);
    });

    it("returns two identities for the mru", async () => {
        const list = await client.getIdentityMru("mru");
        expect(list).toHaveLength(2);
        list.forEach(i => {
            expect(i).toHaveProperty("id");
            expect(i).toHaveProperty("uniqueName");
        });
        expect(list[0].id).not.toBe(list[1].id);
    });
});

describe("core data factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes an aad identity ref", () => {
        const ref = makeIdentityRef();
        expect(ref.descriptor).toMatch(/^aad\./);
        expect(ref.isAadIdentity).toBe(true);
        expect(ref.inactive).toBe(false);
    });

    it("makes a well formed project reference", () => {
        const ref = makeProjectReference();
        expect(ref.state).toBe("wellFormed");
        expect(ref.abbreviation).toMatch(/^[A-Z]{4}$/);
        expect([ProjectVisibility.Private, ProjectVisibility.Public]).toContain(ref.visibility);
    });

    it("makes a project with git and agile capabilities", () => {
        const project = makeProject();
        expect(project.capabilities.versioncontrol.sourceControlType).toBe("Git");
        expect(project.capabilities.processTemplate.templateName).toBe("Agile");
        expect(project.defaultTeam.name).toMatch(/ Team$/);
    });

    it("makes a team with an identity", () => {
        const team = makeTeam();
        expect(team.name).toMatch(/ Team$/);
        expect(team.identity).toHaveProperty("id");
    });

    it("makes a team member with an admin flag", () => {
        const member = makeTeamMember();
        expect(typeof member.isTeamAdmin).toBe("boolean");
        expect(member.identity).toHaveProperty("displayName");
    });

    it("makes a system process", () => {
        const process = makeProcess();
        expect(process.type).toBe(ProcessType.System);
        expect(typeof process.isDefault).toBe("boolean");
    });

    it("makes a succeeded operation reference", () => {
        const op = makeOperationReference();
        expect(op.status).toBe(OperationStatus.Succeeded);
        expect(op).toHaveProperty("pluginId");
    });

    it("makes a project collection reference", () => {
        const ref = makeProjectCollectionReference();
        expect(ref).toHaveProperty("id");
        expect(ref).toHaveProperty("avatarUrl");
    });

    it("makes an active tag definition", () => {
        const tag = makeTagDefinition();
        expect(tag.active).toBe(true);
        expect(tag.name.length).toBeGreaterThan(0);
    });
});
