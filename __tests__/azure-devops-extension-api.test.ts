import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { BoardsRestClient } from "azure-devops-extension-api/Boards";
import { BuildRestClient, BuildStatus } from "azure-devops-extension-api/Build";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { DashboardRestClient } from "azure-devops-extension-api/Dashboard";
import { GitRestClient, PullRequestStatus } from "azure-devops-extension-api/Git";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines/PipelinesClient";
import { ReleaseRestClient } from "azure-devops-extension-api/Release";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { TestRestClient } from "azure-devops-extension-api/Test";
import { WikiRestClient } from "azure-devops-extension-api/Wiki";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

import { getClient, getService, mockClient } from "../azure-devops-extension-api";
import { CommonServiceIds } from "azure-devops-extension-api/Common";

describe("getClient registry", () => {
    it("returns a working mock for each registered client class", () => {
        const classes: any[] = [
            AccountsRestClient,
            BoardsRestClient,
            BuildRestClient,
            CoreRestClient,
            DashboardRestClient,
            GitRestClient,
            PipelinesRestClient,
            ReleaseRestClient,
            TaskAgentRestClient,
            TestRestClient,
            WikiRestClient,
            WorkItemTrackingRestClient
        ];

        for (const cls of classes) {
            const instance = getClient(cls);
            expect(instance).toBeDefined();
            expect(typeof instance).toBe("object");
        }
    });

    it("returns distinct mock classes (no registry collision)", () => {
        const core = getClient(CoreRestClient);
        const git = getClient(GitRestClient);
        expect(core).not.toBe(git);
        expect((core as any).TYPE).toBe(CoreRestClient);
        expect((git as any).TYPE).toBe(GitRestClient);
    });
});

describe("CoreRestClient mock", () => {
    const client = getClient(CoreRestClient);

    it("lists projects", async () => {
        const projects = await client.getProjects();
        expect(Array.isArray(projects)).toBe(true);
        expect(projects.length).toBeGreaterThan(0);
        expect(projects[0]).toHaveProperty("id");
        expect(projects[0]).toHaveProperty("name");
    });

    it("returns the same project when queried by id", async () => {
        const [first] = await client.getProjects();
        const found = await client.getProject(first.id);
        expect(found.id).toBe(first.id);
    });

    it("lists teams and processes", async () => {
        const teams = await client.getTeams("any-project");
        expect(teams.length).toBeGreaterThan(0);
        const processes = await client.getProcesses();
        expect(processes.length).toBeGreaterThan(0);
    });

    it("queues a create-project operation", async () => {
        const op = await client.queueCreateProject({ name: "new" } as any);
        expect(op).toHaveProperty("id");
    });
});

describe("GitRestClient mock", () => {
    const client = getClient(GitRestClient);

    it("lists repositories", async () => {
        const repos = await client.getRepositories();
        expect(repos.length).toBeGreaterThan(0);
        expect(repos[0]).toHaveProperty("defaultBranch");
    });

    it("returns branches with stats", async () => {
        const repos = await client.getRepositories();
        const branches = await client.getBranches(repos[0].id);
        expect(branches.some(b => b.name === "main")).toBe(true);
    });

    it("lists pull requests in the active state", async () => {
        const prs = await client.getPullRequests("repo-id", {} as any);
        expect(prs.length).toBeGreaterThan(0);
        prs.forEach(pr => expect(pr.status).toBe(PullRequestStatus.Active));
    });

    it("creates a pull request honoring the provided title", async () => {
        const pr = await client.createPullRequest(
            { title: "Fix bug", sourceRefName: "refs/heads/fix", targetRefName: "refs/heads/main" } as any,
            "repo-id"
        );
        expect(pr.title).toBe("Fix bug");
        expect(pr.pullRequestId).toBeDefined();
    });

    it("filters refs by prefix", async () => {
        const refs = await client.getRefs("repo-id", undefined, "tags");
        expect(refs.every(r => r.name.includes("tags"))).toBe(true);
    });
});

describe("BuildRestClient mock", () => {
    const client = getClient(BuildRestClient);

    it("returns completed builds", async () => {
        const builds = await client.getBuilds("proj");
        expect(builds.length).toBeGreaterThan(0);
        expect(builds[0].status).toBe(BuildStatus.Completed);
    });

    it("returns an artifact with matching name", async () => {
        const artifact = await client.getArtifact("proj", 1, "drop");
        expect(artifact.name).toBe("drop");
    });

    it("returns a timeline with records", async () => {
        const timeline = await client.getBuildTimeline("proj", 1);
        expect(timeline.records.length).toBeGreaterThan(0);
    });
});

describe("WorkItemTrackingRestClient mock", () => {
    const client = getClient(WorkItemTrackingRestClient);

    it("returns as many work items as ids passed in", async () => {
        const items = await client.getWorkItems([1, 2, 3]);
        expect(items.map(i => i.id)).toEqual([1, 2, 3]);
    });

    it("applies field overrides on create", async () => {
        const wi = await client.createWorkItem(
            [{ op: "add", path: "/fields/System.Title", value: "My Title" }],
            "proj",
            "Bug"
        );
        expect(wi.fields["System.Title"]).toBe("My Title");
        expect(wi.fields["System.WorkItemType"]).toBe("Bug");
    });

    it("increments revision on update", async () => {
        const wi = await client.updateWorkItem(
            [{ op: "replace", path: "/fields/System.State", value: "Closed" }],
            42
        );
        expect(wi.fields["System.State"]).toBe("Closed");
        expect(wi.rev).toBeGreaterThan(0);
    });

    it("runs WIQL queries", async () => {
        const res = await client.queryByWiql({ query: "SELECT [System.Id] FROM WorkItems" } as any);
        expect(res.workItems.length).toBeGreaterThan(0);
    });
});

describe("PipelinesRestClient mock", () => {
    const client = getClient(PipelinesRestClient);

    it("lists pipelines and retrieves one by id", async () => {
        const pipelines = await client.listPipelines("proj");
        expect(pipelines.length).toBeGreaterThan(0);
        const found = await client.getPipeline("proj", pipelines[0].id);
        expect(found.id).toBe(pipelines[0].id);
    });

    it("runs a pipeline and returns a run", async () => {
        const run = await client.runPipeline({} as any, "proj", 5);
        expect(run.pipeline.id).toBe(5);
    });

    it("previews a pipeline with final yaml", async () => {
        const preview = await client.preview({} as any, "proj", 5);
        expect(preview.finalYaml).toContain("stages:");
    });
});

describe("ReleaseRestClient mock", () => {
    const client = getClient(ReleaseRestClient);

    it("lists release definitions and fetches one", async () => {
        const defs = await client.getReleaseDefinitions("proj");
        expect(defs.length).toBeGreaterThan(0);
        const def = await client.getReleaseDefinition("proj", defs[0].id);
        expect(def.id).toBe(defs[0].id);
    });

    it("creates a release referencing the chosen definition", async () => {
        const release = await client.createRelease({ definitionId: 42, description: "rel" } as any, "proj");
        expect(release.releaseDefinition.id).toBe(42);
        expect(release.description).toBe("rel");
    });
});

describe("TaskAgentRestClient mock", () => {
    const client = getClient(TaskAgentRestClient);

    it("lists agent pools", async () => {
        const pools = await client.getAgentPools();
        expect(pools.some(p => p.name === "Azure Pipelines")).toBe(true);
    });

    it("returns variable groups with variables", async () => {
        const groups = await client.getVariableGroups("proj");
        expect(groups[0].variables).toBeDefined();
    });
});

describe("WikiRestClient mock", () => {
    const client = getClient(WikiRestClient);

    it("lists all wikis and fetches one by identifier", async () => {
        const wikis = await client.getAllWikis();
        expect(wikis.length).toBeGreaterThan(0);
        const wiki = await client.getWiki(wikis[0].id);
        expect(wiki.id).toBe(wikis[0].id);
    });

    it("returns wiki page text for the home page", async () => {
        const text = await client.getPageText("proj", "wiki-id", "/Home");
        expect(typeof text).toBe("string");
        expect(text.length).toBeGreaterThan(0);
    });
});

describe("DashboardRestClient mock", () => {
    const client = getClient(DashboardRestClient);

    it("returns the project's dashboards", async () => {
        const list = await (client as any).getDashboardsByProject({ projectId: "p", teamId: "t" });
        expect(Array.isArray(list)).toBe(true);
        expect(list.length).toBeGreaterThan(0);
    });

    it("creates a widget preserving the caller's settings", async () => {
        const widget = await client.createWidget(
            { name: "My Widget", settings: "{\"foo\":\"bar\"}" } as any,
            { projectId: "p", teamId: "t" } as any,
            "dash-id"
        );
        expect(widget.name).toBe("My Widget");
        expect(widget.settings).toBe('{"foo":"bar"}');
    });
});

describe("TestRestClient mock", () => {
    const client = getClient(TestRestClient);

    it("lists test runs", async () => {
        const runs = await client.getTestRuns("proj");
        expect(runs.length).toBeGreaterThan(0);
    });

    it("creates a test run with the provided name", async () => {
        const run = await client.createTestRun({ name: "Sprint 1 run", automated: true } as any, "proj");
        expect(run.name).toBe("Sprint 1 run");
    });
});

describe("mockClient overrides", () => {
    it("replaces specific methods with caller-provided implementations", async () => {
        const git = mockClient(GitRestClient, {
            getRepositories: async () => [{ id: "repo-1", name: "custom" } as any]
        });
        const repos = await git.getRepositories();
        expect(repos).toHaveLength(1);
        expect(repos[0].name).toBe("custom");
    });

    it("falls back to the registered mock for non-overridden methods", async () => {
        const git = mockClient(GitRestClient, {
            getRepositories: async () => []
        });
        const branches = await git.getBranches("repo-id");
        expect(branches.length).toBeGreaterThan(0);
    });
});

describe("getService", () => {
    it("returns a service for a known service id", () => {
        const svc = getService<{ getProject: () => Promise<unknown> }>(
            CommonServiceIds.ProjectPageService
        );
        expect(svc).toBeDefined();
        expect(typeof svc.getProject).toBe("function");
    });

    it("throws for an unknown service id", () => {
        expect(() => getService("bogus.id")).toThrow(/Unknown service id/);
    });
});
