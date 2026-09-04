import { ConnectedServiceKind, CoreRestClient, ProcessType, ProjectVisibility } from "azure-devops-extension-api/Core";
import { OperationStatus } from "azure-devops-extension-api/Operations";

import { getClient } from "../azure-devops-extension-api";
import {
    connectedServices,
    identityMru,
    makeConnectedService,
    makeConnectedServiceDetails,
    makeIdentityRef,
    makeOperationReference,
    makeProcess,
    makeProject,
    makeProjectCollectionReference,
    makeProjectInfo,
    makeProjectProperty,
    makeProjectReference,
    makeProxy,
    makeTagDefinition,
    makeTeam,
    makeTeamMember,
    processes,
    projectCollections,
    projectHistory,
    projectProperties,
    projects,
    proxies,
    readableTeams,
    teamMembers,
    teams
} from "../azure-devops-extension-api/core/Data";

const teamContextOf = (projectId: string) => ({ projectId } as any);

describe("CoreRestClient mock projects", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(CoreRestClient);

    it("exposes the real class as TYPE", () => {
        expect((client as any).TYPE).toBe(CoreRestClient);
    });

    it("lists every project without a continuation token", async () => {
        const list = await client.getProjects();
        expect([...list]).toEqual(projects);
        expect(list.continuationToken).toBeNull();
    });

    it("filters projects by state", async () => {
        const list = await client.getProjects("wellFormed");
        expect(list.length).toBe(projects.length);
        const none = await client.getProjects("deleting");
        expect(none.length).toBe(0);
    });

    it("pages projects with top, skip and continuation token", async () => {
        const first = await client.getProjects(undefined, 2);
        expect([...first]).toEqual(projects.slice(0, 2));
        expect(first.continuationToken).toBe("2");
        const next = await client.getProjects(undefined, 2, 0, Number(first.continuationToken));
        expect([...next]).toEqual(projects.slice(2, 4));
        const last = await client.getProjects(undefined, undefined, 4, undefined, true);
        expect([...last]).toEqual(projects.slice(4));
        expect(last.continuationToken).toBeNull();
    });

    it("gets a project by id or name and fabricates unknown ones", async () => {
        expect(await client.getProject(projects[1].id)).toBe(projects[1]);
        expect(await client.getProject(projects[3].name, true, true)).toBe(projects[3]);
        const made = await client.getProject("does-not-exist");
        expect(made.id).toBe("does-not-exist");
        expect(made).toHaveProperty("capabilities");
    });

    it("lists and pages project collections", async () => {
        expect(await client.getProjectCollections()).toEqual(projectCollections);
        expect(await client.getProjectCollections(1)).toEqual(projectCollections.slice(0, 1));
        expect(await client.getProjectCollections(undefined, 1)).toEqual(projectCollections.slice(1));
    });

    it("gets a collection by id or name and fabricates unknown ones", async () => {
        expect(await client.getProjectCollection(projectCollections[0].id)).toBe(projectCollections[0]);
        expect(await client.getProjectCollection(projectCollections[1].name)).toBe(projectCollections[1]);
        const made = await client.getProjectCollection("missing");
        expect(made.id).toBe("missing");
        expect(made).toHaveProperty("description");
    });

    it("returns project history entries from a minimum revision", async () => {
        expect(await client.getProjectHistoryEntries()).toEqual(projectHistory);
        const recent = await client.getProjectHistoryEntries(4);
        expect(recent.map(p => p.revision)).toEqual([4, 5]);
    });

    it("queues create, delete and update operations", async () => {
        for (const op of [
            await client.queueCreateProject({ name: "new" } as any),
            await client.queueDeleteProject("proj"),
            await client.updateProject({ description: "changed" } as any, "proj")
        ]) {
            expect(op.status).toBe(OperationStatus.Succeeded);
            expect(op).toHaveProperty("id");
            expect(op).toHaveProperty("pluginId");
        }
    });

    it("handles avatars", async () => {
        await expect(client.removeProjectAvatar("proj")).resolves.toBeUndefined();
        await expect(client.setProjectAvatar({ image: [1, 2, 3] } as any, "proj")).resolves.toBeUndefined();
    });

    it("returns project properties, optionally filtered by key", async () => {
        expect(await client.getProjectProperties("proj")).toEqual(projectProperties);
        const filtered = await client.getProjectProperties("proj", ["System.ProcessTemplateType"]);
        expect(filtered.map(p => p.name)).toEqual(["System.ProcessTemplateType"]);
    });

    it("returns properties for several projects", async () => {
        const all = await client.getProjectsProperties(["a", "b"]);
        expect(all.map(p => p.projectId)).toEqual(["a", "b"]);
        expect(all[0].properties).toEqual(projectProperties);
        const some = await client.getProjectsProperties(["a"], ["System.SourceControlGitEnabled"]);
        expect(some[0].properties.map(p => p.name)).toEqual(["System.SourceControlGitEnabled"]);
    });

    it("sets project properties", async () => {
        await expect(client.setProjectProperties("proj", [{ op: "add", path: "/x", value: 1 }] as any)).resolves.toBeUndefined();
    });
});

describe("CoreRestClient mock teams", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(CoreRestClient);

    it("lists teams stamped with the requested project id and pages them", async () => {
        const list = await client.getTeams("proj-123");
        expect(list.map(t => t.id)).toEqual(teams.map(t => t.id));
        list.forEach(t => expect(t.projectId).toBe("proj-123"));
        const paged = await client.getTeams("proj-123", true, 1, 1, true);
        expect(paged.map(t => t.id)).toEqual([teams[1].id]);
    });

    it("lists all teams and pages them", async () => {
        expect(await client.getAllTeams()).toEqual(teams);
        expect(await client.getAllTeams(true, 2)).toEqual(teams.slice(0, 2));
        expect(await client.getAllTeams(undefined, undefined, 2, true)).toEqual(teams.slice(2));
    });

    it("categorises teams for a project", async () => {
        const categorised = await client.getProjectTeamsByCategory("proj-9");
        expect(categorised.myTeams.map(t => t.id)).toEqual(teams.map(t => t.id));
        expect(categorised.otherReadableTeams.map(t => t.id)).toEqual(readableTeams.map(t => t.id));
        [...categorised.myTeams, ...categorised.otherReadableTeams].forEach(t => expect(t.projectId).toBe("proj-9"));
        const paged = await client.getProjectTeamsByCategory("proj-9", true, 1, 2);
        expect(paged.myTeams.map(t => t.id)).toEqual([teams[2].id]);
    });

    it("gets a team by id or name and fabricates unknown ones", async () => {
        expect(await client.getTeam("proj", teams[2].id)).toBe(teams[2]);
        expect(await client.getTeam("proj", teams[0].name, true)).toBe(teams[0]);
        const made = await client.getTeam("proj-x", "team-missing");
        expect(made.id).toBe("team-missing");
        expect(made.projectId).toBe("proj-x");
        expect(made).toHaveProperty("identity");
    });

    it("creates, updates and deletes teams", async () => {
        const created = await client.createTeam({ id: "given-id", name: "Alpha" } as any, "proj-1");
        expect(created).toMatchObject({ id: "given-id", name: "Alpha", projectId: "proj-1" });
        const generated = await client.createTeam({ name: "Beta" } as any, "proj-2");
        expect(generated.id.length).toBeGreaterThan(0);
        const updated = await client.updateTeam({ id: "old", name: "Gamma" } as any, "proj-3", "route-id");
        expect(updated).toMatchObject({ id: "route-id", name: "Gamma", projectId: "proj-3" });
        await expect(client.deleteTeam("proj", "team")).resolves.toBeUndefined();
    });

    it("pages team members", async () => {
        expect(await client.getTeamMembersWithExtendedProperties("proj", "team")).toEqual(teamMembers);
        expect(await client.getTeamMembersWithExtendedProperties("proj", "team", 2)).toEqual(teamMembers.slice(0, 2));
        expect(await client.getTeamMembersWithExtendedProperties("proj", "team", undefined, 3)).toEqual(teamMembers.slice(3));
        expect(await client.getTeamMembersWithExtendedProperties("proj", "team", 2, 1)).toEqual(teamMembers.slice(1, 3));
    });
});

describe("CoreRestClient mock processes, identities, services and proxies", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(CoreRestClient);

    it("lists processes and gets them by id", async () => {
        const list = await client.getProcesses();
        expect(list).toBe(processes);
        list.forEach(p => expect(p.type).toBe(ProcessType.System));
        expect(await client.getProcessById(processes[1].id)).toBe(processes[1]);
        const made = await client.getProcessById("proc-missing");
        expect(made.id).toBe("proc-missing");
        expect(["Agile", "Scrum", "CMMI", "Basic"]).toContain(made.name);
    });

    it("manages the identity mru", async () => {
        expect(await client.getIdentityMru("mru")).toBe(identityMru);
        const data = { identityIds: [identityMru[0].id] };
        await expect(client.createIdentityMru(data, "mru")).resolves.toBeUndefined();
        await expect(client.updateIdentityMru(data, "mru")).resolves.toBeUndefined();
        await expect(client.deleteIdentityMru(data, "mru")).resolves.toBeUndefined();
    });

    it("lists connected services, optionally by kind", async () => {
        expect(await client.getConnectedServices("proj")).toBe(connectedServices);
        const chef = await client.getConnectedServices("proj", ConnectedServiceKind.Chef);
        chef.forEach(s => expect(s.kind).toBe("Chef"));
        expect(chef).toEqual(connectedServices.filter(s => s.kind === "Chef"));
    });

    it("gets connected service details by name or id and fabricates unknown ones", async () => {
        const byName = await client.getConnectedServiceDetails("proj", connectedServices[0].friendlyName);
        expect(byName.connectedServiceMetaData).toBe(connectedServices[0]);
        const byId = await client.getConnectedServiceDetails("proj", connectedServices[1].id);
        expect(byId.id).toBe(connectedServices[1].id);
        const made = await client.getConnectedServiceDetails("proj", "nowhere");
        expect(made.connectedServiceMetaData.friendlyName).toBe("nowhere");
        expect(made.credentialsXml).toContain("token=");
    });

    it("creates a connected service for the project", async () => {
        const details = makeConnectedServiceDetails();
        const created = await client.createConnectedService(details, "proj-7");
        expect(created.friendlyName).toBe(details.connectedServiceMetaData.friendlyName);
        expect(created.project.id).toBe("proj-7");
    });

    it("lists proxies, optionally by url, and creates or deletes them", async () => {
        expect(await client.getProxies()).toBe(proxies);
        expect(await client.getProxies(proxies[1].url)).toEqual([proxies[1]]);
        const created = await client.createOrUpdateProxy({ url: "https://proxy.example.com", friendlyName: "edge" } as any);
        expect(created).toMatchObject({ url: "https://proxy.example.com", friendlyName: "edge" });
        expect(created).toHaveProperty("authorization");
        await expect(client.deleteProxy("https://proxy.example.com")).resolves.toBeUndefined();
        await expect(client.deleteProxy("https://proxy.example.com", "site")).resolves.toBeUndefined();
    });
});

describe("core data factories", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    it("makes an aad identity ref", () => {
        const ref = makeIdentityRef();
        expect(ref.descriptor).toMatch(/^aad\./);
        expect(ref.isAadIdentity).toBe(true);
    });

    it("makes a well formed project reference and project", () => {
        const ref = makeProjectReference();
        expect(ref.state).toBe("wellFormed");
        expect(ref.abbreviation).toMatch(/^[A-Z]{4}$/);
        expect([ProjectVisibility.Private, ProjectVisibility.Public]).toContain(ref.visibility);
        const project = makeProject();
        expect(project.capabilities.versioncontrol.sourceControlType).toBe("Git");
        expect(project.defaultTeam.name).toMatch(/ Team$/);
    });

    it("makes teams, members, processes and operations", () => {
        expect(makeTeam().identity).toHaveProperty("id");
        expect(typeof makeTeamMember().isTeamAdmin).toBe("boolean");
        expect(makeProcess().type).toBe(ProcessType.System);
        expect(makeOperationReference().status).toBe(OperationStatus.Succeeded);
    });

    it("makes collection references and tag definitions", () => {
        expect(makeProjectCollectionReference()).toHaveProperty("avatarUrl");
        expect(makeTagDefinition().active).toBe(true);
    });

    it("makes connected service details from a given or generated service", () => {
        const service = makeConnectedService();
        expect(makeConnectedServiceDetails(service).connectedServiceMetaData).toBe(service);
        expect(makeConnectedServiceDetails().endPoint).toMatch(/^https:/);
    });

    it("makes project properties, infos and proxies", () => {
        expect(makeProjectProperty().name).toMatch(/^System\./);
        expect(makeProjectProperty("Custom.Key").name).toBe("Custom.Key");
        const info = makeProjectInfo();
        expect(info.uri).toContain(info.id);
        expect(info.properties.length).toBe(2);
        expect(makeProxy().authorization.publicKey.exponent).toEqual([1, 0, 1]);
        expect(teamContextOf("p").projectId).toBe("p");
    });
});
