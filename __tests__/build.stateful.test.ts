import {
    Build,
    BuildArtifact,
    BuildDefinition,
    BuildDefinitionTemplate,
    BuildRestClient,
    DefinitionQueueStatus,
    DefinitionResourceReference,
    Folder
} from "azure-devops-extension-api/Build";

import { getClient, stateful } from "../azure-devops-extension-api";
import {
    artifacts,
    buildDefinitions,
    buildList,
    buildsPage,
    buildTags,
    definitionResources,
    definitionTags,
    definitionTemplates,
    folders,
    projectTags,
    retentionLeases
} from "../azure-devops-extension-api/build/Data";

const partial = <T>(value: Partial<T>): T => value as T;

const newLease = {
    ownerId: "owner-stateful",
    definitionId: 9_100_009,
    runId: 9_200_009,
    daysValid: 7,
    protectPipeline: true
};

describe("BuildRestClient mock in stateful mode", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });
    beforeEach(() => stateful.enable());
    afterEach(() => stateful.disable());

    const client = getClient(BuildRestClient);

    describe("builds", () => {
        it("returns a queued build from get, list and latest", async () => {
            const seeded = [...buildList];
            const queued = await client.queueBuild(partial<Build>({ buildNumber: "stateful.1" }), "proj");
            await expect(client.getBuild("proj", queued.id)).resolves.toBe(queued);
            const page = await client.getBuilds("proj");
            expect(page).toContain(queued);
            expect(page.length).toBe(seeded.length + 1);
            await expect(client.getLatestBuild("proj", queued.definition.name)).resolves.toBe(queued);
            stateful.reset();
            expect([...buildList]).toEqual(seeded);
            expect(buildsPage).toBe(buildList);
            expect(buildsPage.continuationToken).toBe("");
        });

        it("replaces a build queued again with the same id", async () => {
            const count = buildList.length;
            const queued = await client.queueBuild(partial<Build>({ id: buildList[0].id, quality: "again" }), "proj");
            expect(buildList.length).toBe(count);
            await expect(client.getBuild("proj", queued.id)).resolves.toBe(queued);
        });

        it("replaces an updated build and appends an unknown one", async () => {
            const seeded = [...buildList];
            const target = seeded[2];
            const updated = await client.updateBuild(partial<Build>({ keepForever: true }), "proj", target.id);
            expect(buildList.length).toBe(seeded.length);
            await expect(client.getBuild("proj", target.id)).resolves.toBe(updated);
            expect((await client.getBuilds("proj"))[2]).toBe(updated);
            const added = await client.updateBuild(partial<Build>({ quality: "new" }), "proj", 987_654_321);
            expect(buildList.length).toBe(seeded.length + 1);
            await expect(client.getBuild("proj", 987_654_321)).resolves.toBe(added);
            stateful.reset();
            expect([...buildList]).toEqual(seeded);
        });

        it("applies every build of a batch update", async () => {
            const seeded = [...buildList];
            const [first, second] = await client.updateBuilds(
                [partial<Build>({ id: seeded[0].id, quality: "batch" }), partial<Build>({ quality: "fresh" })],
                "proj"
            );
            expect(buildList.length).toBe(seeded.length + 1);
            await expect(client.getBuild("proj", seeded[0].id)).resolves.toBe(first);
            await expect(client.getBuild("proj", second.id)).resolves.toBe(second);
        });

        it("removes a deleted build from the list", async () => {
            const seeded = [...buildList];
            const target = seeded[1];
            await client.deleteBuild("proj", target.id);
            const page = await client.getBuilds("proj");
            expect(page.map(build => build.id)).not.toContain(target.id);
            expect(page.length).toBe(seeded.length - 1);
            expect(await client.getBuild("proj", target.id)).not.toBe(target);
            stateful.reset();
            expect([...buildList]).toEqual(seeded);
        });

        it("still returns a badge when every build is deleted", async () => {
            const first = buildList[0].id;
            await expect(client.getBuildBadge("proj", "TfsGit")).resolves.toMatchObject({ buildId: first });
            for (const build of [...buildList]) {
                await client.deleteBuild("proj", build.id);
            }
            expect(buildList.length).toBe(0);
            const badge = await client.getBuildBadge("proj", "TfsGit");
            expect(typeof badge.buildId).toBe("number");
        });
    });

    describe("definitions", () => {
        it("returns a created definition from get and list", async () => {
            const seeded = [...buildDefinitions];
            const created = await client.createDefinition(partial<BuildDefinition>({ name: "stateful-def" }), "proj");
            await expect(client.getDefinition("proj", created.id)).resolves.toBe(created);
            const listed = await client.getDefinitions("proj");
            expect(listed).toContain(created);
            expect(listed.length).toBe(seeded.length + 1);
            stateful.reset();
            expect(buildDefinitions).toEqual(seeded);
            expect((await client.getDefinitions("proj")).length).toBe(seeded.length);
        });

        it("replaces an updated definition", async () => {
            const seeded = [...buildDefinitions];
            const target = seeded[0];
            const updated = await client.updateDefinition(
                partial<BuildDefinition>({ name: "renamed" }),
                "proj",
                target.id
            );
            expect(buildDefinitions.length).toBe(seeded.length);
            await expect(client.getDefinition("proj", target.id)).resolves.toBe(updated);
            expect((await client.getDefinitions("proj"))[0].name).toBe("renamed");
            stateful.reset();
            expect(buildDefinitions).toEqual(seeded);
        });

        it("removes a deleted definition and brings it back on restore", async () => {
            const seeded = [...buildDefinitions];
            const target = seeded[3];
            await client.deleteDefinition("proj", target.id);
            expect((await client.getDefinitions("proj")).map(definition => definition.id)).not.toContain(target.id);
            const restored = await client.restoreDefinition("proj", target.id, false);
            expect(restored.queueStatus).toBe(DefinitionQueueStatus.Enabled);
            await expect(client.getDefinition("proj", target.id)).resolves.toBe(restored);
            expect((await client.getDefinitions("proj")).length).toBe(seeded.length);
            stateful.reset();
            expect(buildDefinitions).toEqual(seeded);
        });

        it("keeps the status change of a restore on a listed definition", async () => {
            const target = buildDefinitions[1];
            const disabled = await client.restoreDefinition("proj", target.id, true);
            const read = await client.getDefinition("proj", target.id);
            expect(read).toBe(disabled);
            expect(read.queueStatus).toBe(DefinitionQueueStatus.Disabled);
            expect(read.name).toBe(target.name);
        });
    });

    describe("folders", () => {
        it("lists a created folder and replaces it when updated", async () => {
            const seeded = [...folders];
            const created = await client.createFolder(partial<Folder>({ description: "new" }), "proj", "\\stateful");
            expect(await client.getFolders("proj", "\\stateful")).toEqual([created]);
            const updated = await client.updateFolder(
                partial<Folder>({ description: "changed" }),
                "proj",
                "\\stateful"
            );
            expect(await client.getFolders("proj", "\\stateful")).toEqual([updated]);
            expect(folders.length).toBe(seeded.length + 1);
            await client.createFolder(partial<Folder>({ description: "again" }), "proj", "\\stateful");
            expect(folders.length).toBe(seeded.length + 1);
            stateful.reset();
            expect(folders).toEqual(seeded);
        });

        it("removes a deleted folder with its children only", async () => {
            const seeded = [...folders];
            await client.createFolder(partial<Folder>({}), "proj", "\\shared-other");
            await client.deleteFolder("proj", "\\shared");
            const paths = (await client.getFolders("proj")).map(folder => folder.path);
            expect(paths).toEqual(["\\", "\\legacy", "\\shared-other"]);
            stateful.reset();
            expect(folders).toEqual(seeded);
        });
    });

    describe("templates", () => {
        it("saves, replaces and deletes a template", async () => {
            const seeded = [...definitionTemplates];
            const saved = await client.saveTemplate(
                partial<BuildDefinitionTemplate>({ name: "saved" }),
                "proj",
                "template-stateful"
            );
            await expect(client.getTemplate("proj", "template-stateful")).resolves.toBe(saved);
            expect(await client.getTemplates("proj")).toContain(saved);
            const replaced = await client.saveTemplate(
                partial<BuildDefinitionTemplate>({ name: "replaced" }),
                "proj",
                "template-classic"
            );
            expect(definitionTemplates.length).toBe(seeded.length + 1);
            await expect(client.getTemplate("proj", "template-classic")).resolves.toBe(replaced);
            await client.deleteTemplate("proj", "template-yaml");
            expect((await client.getTemplates("proj")).map(template => template.id)).toEqual([
                "template-classic",
                "template-empty",
                "template-stateful"
            ]);
            stateful.reset();
            expect(definitionTemplates).toEqual(seeded);
        });
    });

    describe("artifacts", () => {
        it("returns a created artifact and replaces one with the same name", async () => {
            const seeded = [...artifacts];
            const created = await client.createArtifact(partial<BuildArtifact>({ name: "stateful" }), "proj", 1);
            await expect(client.getArtifact("proj", 1, "stateful")).resolves.toBe(created);
            expect(await client.getArtifacts("proj", 1)).toContain(created);
            const replaced = await client.createArtifact(partial<BuildArtifact>({ name: "drop" }), "proj", 1);
            expect(artifacts.length).toBe(seeded.length + 1);
            await expect(client.getArtifact("proj", 1, "drop")).resolves.toBe(replaced);
            stateful.reset();
            expect(artifacts).toEqual(seeded);
        });
    });

    describe("tags", () => {
        it("keeps added and removed build tags", async () => {
            const seeded = [...buildTags];
            const seededProject = [...projectTags];
            await expect(client.addBuildTag("proj", 1, "one")).resolves.toEqual([...seeded, "one"]);
            await expect(client.addBuildTag("proj", 1, "one")).resolves.toEqual([...seeded, "one"]);
            await expect(client.addBuildTags(["two", seeded[0]], "proj", 1)).resolves.toEqual([
                ...seeded,
                "one",
                "two"
            ]);
            await expect(client.getBuildTags("proj", 1)).resolves.toEqual([...seeded, "one", "two"]);
            await expect(client.getTags("proj")).resolves.toEqual([...seededProject, "one", "two"]);
            await expect(client.deleteBuildTag("proj", 1, seeded[0])).resolves.toEqual([
                ...seeded.slice(1),
                "one",
                "two"
            ]);
            const updated = await client.updateBuildTags({ tagsToAdd: ["three"], tagsToRemove: ["one"] }, "proj", 1);
            expect(updated).toEqual([...seeded.slice(1), "two", "three"]);
            await expect(client.getBuildTags("proj", 1)).resolves.toEqual(updated);
            await expect(client.getTags("proj")).resolves.toEqual([...seededProject, "one", "two", "three"]);
            stateful.reset();
            expect(buildTags).toEqual(seeded);
            expect(projectTags).toEqual(seededProject);
        });

        it("keeps added and removed definition tags", async () => {
            const seeded = [...definitionTags];
            const seededProject = [...projectTags];
            await expect(client.addDefinitionTag("proj", 1, "one")).resolves.toEqual([...seeded, "one"]);
            await expect(client.addDefinitionTags(["two", seeded[0]], "proj", 1)).resolves.toEqual([
                ...seeded,
                "one",
                "two"
            ]);
            await expect(client.getDefinitionTags("proj", 1)).resolves.toEqual([...seeded, "one", "two"]);
            await expect(client.deleteDefinitionTag("proj", 1, seeded[0])).resolves.toEqual([
                ...seeded.slice(1),
                "one",
                "two"
            ]);
            const updated = await client.updateDefinitionTags(
                { tagsToAdd: ["three"], tagsToRemove: ["one"] },
                "proj",
                1
            );
            expect(updated).toEqual([...seeded.slice(1), "two", "three"]);
            await expect(client.getDefinitionTags("proj", 1)).resolves.toEqual(updated);
            await expect(client.getTags("proj")).resolves.toEqual([...seededProject, "one", "two", "three"]);
            stateful.reset();
            expect(definitionTags).toEqual(seeded);
            expect(projectTags).toEqual(seededProject);
        });

        it("removes a project tag from the builds and the definitions", async () => {
            const seededProject = [...projectTags];
            const buildTag = buildTags[1];
            const definitionTag = definitionTags[1];
            await expect(client.deleteTag("proj", buildTag)).resolves.toEqual(
                seededProject.filter(tag => tag !== buildTag)
            );
            await client.deleteTag("proj", definitionTag);
            await expect(client.getTags("proj")).resolves.toEqual(
                seededProject.filter(tag => tag !== buildTag && tag !== definitionTag)
            );
            expect(await client.getBuildTags("proj", 1)).not.toContain(buildTag);
            expect(await client.getDefinitionTags("proj", 1)).not.toContain(definitionTag);
            stateful.reset();
            expect(projectTags).toEqual(seededProject);
            expect(buildTags).toContain(buildTag);
            expect(definitionTags).toContain(definitionTag);
        });
    });

    describe("resources", () => {
        it("keeps authorized resources", async () => {
            const seeded = [...definitionResources];
            const [added] = await client.authorizeDefinitionResources(
                [partial<DefinitionResourceReference>({ id: "endpoint-9", type: "endpoint" })],
                "proj",
                1
            );
            expect(await client.getDefinitionResources("proj", 1)).toContain(added);
            const [replaced, other] = await client.authorizeProjectResources(
                [
                    partial<DefinitionResourceReference>({ id: "queue-1", type: "queue", authorized: false }),
                    partial<DefinitionResourceReference>({ id: "queue-1", type: "endpoint" })
                ],
                "proj"
            );
            expect(definitionResources.length).toBe(seeded.length + 2);
            await expect(client.getProjectResources("proj", "queue", "queue-1")).resolves.toEqual([replaced]);
            await expect(client.getProjectResources("proj", "endpoint", "queue-1")).resolves.toEqual([other]);
            stateful.reset();
            expect(definitionResources).toEqual(seeded);
        });
    });

    describe("retention leases", () => {
        it("returns added leases from every lease query", async () => {
            const seeded = [...retentionLeases];
            const [added] = await client.addRetentionLeases([newLease], "proj");
            await expect(client.getRetentionLease("proj", added.leaseId)).resolves.toBe(added);
            await expect(client.getRetentionLeasesByOwnerId("proj", "owner-stateful")).resolves.toEqual([added]);
            await expect(client.getRetentionLeasesByUserId("proj", "owner-stateful")).resolves.toEqual([added]);
            await expect(client.getRetentionLeasesForBuild("proj", newLease.runId)).resolves.toEqual([added]);
            await expect(client.getRetentionLeasesByMinimalRetentionLeases("proj", [newLease])).resolves.toEqual([
                added
            ]);
            stateful.reset();
            expect(retentionLeases).toEqual(seeded);
        });

        it("replaces an updated lease and removes deleted ones", async () => {
            const seeded = [...retentionLeases];
            const target = seeded[0];
            const updated = await client.updateRetentionLease(
                { daysValid: 3, protectPipeline: !target.protectPipeline },
                "proj",
                target.leaseId
            );
            expect(retentionLeases.length).toBe(seeded.length);
            await expect(client.getRetentionLease("proj", target.leaseId)).resolves.toBe(updated);
            await client.deleteRetentionLeasesById("proj", [target.leaseId, seeded[1].leaseId]);
            expect(retentionLeases).toEqual(seeded.slice(2));
            expect(await client.getRetentionLease("proj", target.leaseId)).not.toBe(updated);
            stateful.reset();
            expect(retentionLeases).toEqual(seeded);
        });
    });

    it("leaves every list untouched when the mode is off", async () => {
        stateful.disable();
        const lists: unknown[][] = [
            buildList,
            buildDefinitions,
            folders,
            definitionTemplates,
            artifacts,
            buildTags,
            definitionTags,
            projectTags,
            definitionResources,
            retentionLeases
        ];
        const seeded = lists.map(list => [...list]);
        const resource = partial<DefinitionResourceReference>({ id: "endpoint-9", type: "endpoint" });
        const tagUpdate = { tagsToAdd: ["three"], tagsToRemove: [buildTags[1], definitionTags[1]] };
        await client.queueBuild(partial<Build>({}), "proj");
        await client.updateBuild(partial<Build>({}), "proj", buildList[0].id);
        await client.updateBuilds([partial<Build>({ id: buildList[1].id })], "proj");
        await client.deleteBuild("proj", buildList[2].id);
        await client.createDefinition(partial<BuildDefinition>({}), "proj");
        await client.updateDefinition(partial<BuildDefinition>({}), "proj", buildDefinitions[0].id);
        await client.deleteDefinition("proj", buildDefinitions[1].id);
        await client.restoreDefinition("proj", buildDefinitions[2].id, true);
        await client.createFolder(partial<Folder>({}), "proj", "\\stateful");
        await client.updateFolder(partial<Folder>({}), "proj", "\\shared");
        await client.deleteFolder("proj", "\\shared");
        await client.saveTemplate(partial<BuildDefinitionTemplate>({}), "proj", "template-classic");
        await client.deleteTemplate("proj", "template-yaml");
        await client.createArtifact(partial<BuildArtifact>({ name: "drop" }), "proj", 1);
        await client.addBuildTag("proj", 1, "one");
        await client.addBuildTags(["two"], "proj", 1);
        await client.deleteBuildTag("proj", 1, buildTags[0]);
        await client.updateBuildTags(tagUpdate, "proj", 1);
        await client.addDefinitionTag("proj", 1, "one");
        await client.addDefinitionTags(["two"], "proj", 1);
        await client.deleteDefinitionTag("proj", 1, definitionTags[0]);
        await client.updateDefinitionTags(tagUpdate, "proj", 1);
        await client.deleteTag("proj", projectTags[0]);
        await client.authorizeDefinitionResources([resource], "proj", 1);
        await client.authorizeProjectResources([resource], "proj");
        await client.addRetentionLeases([newLease], "proj");
        await client.updateRetentionLease({ daysValid: 3, protectPipeline: true }, "proj", retentionLeases[0].leaseId);
        await client.deleteRetentionLeasesById("proj", [retentionLeases[1].leaseId]);
        lists.forEach((list, index) => expect([...list]).toEqual(seeded[index]));
        await expect(client.getBuildBadge("proj", "TfsGit")).resolves.toMatchObject({ buildId: buildList[0].id });
    });
});
