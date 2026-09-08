import { BuildRestClient, ControllerStatus } from "azure-devops-extension-api/Build";

import { getClient } from "../azure-devops-extension-api";
import {
    buildControllers,
    buildList,
    buildTags,
    definitionTags,
    makeBuildBadge,
    makeBuildController,
    projectTags
} from "../azure-devops-extension-api/build/Data";

describe("BuildRestClient mock tags, badges and controllers", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(BuildRestClient);

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["addBuildTag", () => client.addBuildTag("proj", 1, "hotfix")],
        ["addBuildTags", () => client.addBuildTags(["hotfix"], "proj", 1)],
        ["deleteBuildTag", () => client.deleteBuildTag("proj", 1, buildTags[0])],
        ["getBuildTags", () => client.getBuildTags("proj", 1)],
        ["updateBuildTags", () => client.updateBuildTags({ tagsToAdd: ["x"], tagsToRemove: [] }, "proj", 1)],
        ["addDefinitionTag", () => client.addDefinitionTag("proj", 1, "hotfix")],
        ["addDefinitionTags", () => client.addDefinitionTags(["hotfix"], "proj", 1)],
        ["deleteDefinitionTag", () => client.deleteDefinitionTag("proj", 1, definitionTags[0])],
        ["getDefinitionTags", () => client.getDefinitionTags("proj", 1)],
        [
            "updateDefinitionTags",
            () => client.updateDefinitionTags({ tagsToAdd: ["x"], tagsToRemove: [] }, "proj", 1)
        ],
        ["deleteTag", () => client.deleteTag("proj", projectTags[0])],
        ["getTags", () => client.getTags("proj")],
        ["updateBuilds", () => client.updateBuilds([{ id: 5 } as any], "proj")],
        ["getLatestBuild", () => client.getLatestBuild("proj", "any-definition")],
        ["getBuildBadge", () => client.getBuildBadge("proj", "TfsGit")],
        ["getBuildBadgeData", () => client.getBuildBadgeData("proj", "TfsGit")],
        ["getBadge", () => client.getBadge("proj", 1)],
        ["getStatusBadge", () => client.getStatusBadge("proj", "my-def")],
        ["getBuildController", () => client.getBuildController(1)],
        ["getBuildControllers", () => client.getBuildControllers()]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it("adds a build tag to the seeded list", async () => {
        await expect(client.addBuildTag("proj", 1, "hotfix")).resolves.toEqual([...buildTags, "hotfix"]);
    });

    it("does not duplicate a build tag that already exists", async () => {
        await expect(client.addBuildTag("proj", 1, buildTags[0])).resolves.toEqual(buildTags);
    });

    it("reads the build tag body from the first argument", async () => {
        const tags = await client.addBuildTags(["release", buildTags[1]], "proj", 1);
        expect(tags).toContain("release");
        expect(tags.filter(tag => tag === buildTags[1])).toHaveLength(1);
    });

    it("deletes a seeded build tag", async () => {
        const tags = await client.deleteBuildTag("proj", 1, buildTags[2]);
        expect(tags).not.toContain(buildTags[2]);
        expect(tags).toHaveLength(buildTags.length - 1);
    });

    it("deletes nothing for an unknown build tag", async () => {
        await expect(client.deleteBuildTag("proj", 1, "absent")).resolves.toHaveLength(buildTags.length);
    });

    it("returns build tags as a copy", async () => {
        const tags = await client.getBuildTags("proj", 1);
        expect(tags).toEqual(buildTags);
        expect(tags).not.toBe(buildTags);
    });

    it("updates build tags adding and removing", async () => {
        const tags = await client.updateBuildTags(
            { tagsToAdd: ["nightly"], tagsToRemove: [buildTags[0]] },
            "proj",
            1
        );
        expect(tags).toContain("nightly");
        expect(tags).not.toContain(buildTags[0]);
        expect(tags).toContain(buildTags[1]);
    });

    it("adds a definition tag to the seeded list", async () => {
        await expect(client.addDefinitionTag("proj", 1, "nightly")).resolves.toEqual([
            ...definitionTags,
            "nightly"
        ]);
    });

    it("reads the definition tag body from the first argument", async () => {
        await expect(client.addDefinitionTags(["canary"], "proj", 1)).resolves.toEqual([
            ...definitionTags,
            "canary"
        ]);
    });

    it("deletes a seeded definition tag", async () => {
        const tags = await client.deleteDefinitionTag("proj", 1, definitionTags[1]);
        expect(tags).not.toContain(definitionTags[1]);
        expect(tags).toHaveLength(definitionTags.length - 1);
    });

    it("lists every definition tag when no revision is given", async () => {
        await expect(client.getDefinitionTags("proj", 1)).resolves.toEqual(definitionTags);
    });

    it("slices definition tags for a revision", async () => {
        await expect(client.getDefinitionTags("proj", 1, 2)).resolves.toEqual(definitionTags.slice(0, 2));
    });

    it("updates definition tags adding and removing", async () => {
        const tags = await client.updateDefinitionTags(
            { tagsToAdd: ["canary"], tagsToRemove: [definitionTags[0]] },
            "proj",
            1
        );
        expect(tags).toContain("canary");
        expect(tags).not.toContain(definitionTags[0]);
        expect(tags).toContain(definitionTags[1]);
    });

    it("deletes a project tag", async () => {
        const tags = await client.deleteTag("proj", projectTags[0]);
        expect(tags).not.toContain(projectTags[0]);
        expect(tags).toHaveLength(projectTags.length - 1);
    });

    it("returns project tags as a copy", async () => {
        const tags = await client.getTags("proj");
        expect(tags).toEqual(projectTags);
        expect(tags).not.toBe(projectTags);
    });

    it("updates many builds keeping the caller fields", async () => {
        const updated = await client.updateBuilds([{ id: 5, keepForever: true } as any], "proj");
        expect(updated).toHaveLength(1);
        expect(updated[0].id).toBe(5);
        expect(updated[0].keepForever).toBe(true);
        expect(updated[0]).toHaveProperty("buildNumber");
    });

    it("gets the latest build of a seeded definition", async () => {
        const target = buildList[0];
        await expect(client.getLatestBuild("proj", target.definition.name)).resolves.toBe(target);
    });

    it("fabricates the latest build of an unknown definition", async () => {
        const build = await client.getLatestBuild("proj", "ghost-definition");
        expect(build.definition.name).toBe("ghost-definition");
        expect(build).toHaveProperty("buildNumber");
    });

    it("overrides the source branch when a branch is given", async () => {
        const build = await client.getLatestBuild("proj", buildList[0].definition.name, "refs/heads/dev");
        expect(build.sourceBranch).toBe("refs/heads/dev");
        expect(build.id).toBe(buildList[0].id);
    });

    it("returns a build badge pointing at the first seeded build", async () => {
        const badge = await client.getBuildBadge("proj", "TfsGit", "repo-id", "refs/heads/main");
        expect(badge.buildId).toBe(buildList[0].id);
        expect(typeof badge.imageUrl).toBe("string");
    });

    it("renders badge data with and without the optional repo and branch", async () => {
        const full = await client.getBuildBadgeData("proj", "TfsGit", "repo-id", "refs/heads/main");
        const minimal = await client.getBuildBadgeData("proj", "TfsGit");
        expect(full).toContain("TfsGit repo-id refs/heads/main succeeded");
        expect(minimal).toContain("TfsGit succeeded");
        expect(minimal.startsWith("<svg")).toBe(true);
    });

    it("renders a definition badge with and without a branch", async () => {
        await expect(client.getBadge("proj", 7)).resolves.toContain("definition 7 succeeded");
        await expect(client.getBadge("proj", 7, "dev")).resolves.toContain("definition 7 dev succeeded");
    });

    it("returns a status word by default and the label when given", async () => {
        await expect(client.getStatusBadge("proj", "my-def")).resolves.toBe("my-def succeeded");
        await expect(
            client.getStatusBadge("proj", "my-def", "dev", "stage", "job", "cfg", "custom")
        ).resolves.toBe("my-def dev stage job cfg custom");
    });

    it("gets a known controller by id", async () => {
        const target = buildControllers[0];
        await expect(client.getBuildController(target.id)).resolves.toBe(target);
    });

    it("fabricates a controller for an unknown id", async () => {
        const controller = await client.getBuildController(-1);
        expect(controller.id).toBe(-1);
        expect(controller.status).toBe(ControllerStatus.Available);
        expect(controller.enabled).toBe(true);
    });

    it("lists controllers as a copy", async () => {
        const all = await client.getBuildControllers();
        expect(all).toEqual(buildControllers);
        expect(all).not.toBe(buildControllers);
    });

    it("filters controllers by name", async () => {
        const target = buildControllers[0];
        const filtered = await client.getBuildControllers(target.name);
        expect(filtered).toContain(target);
        expect(filtered.every(controller => controller.name === target.name)).toBe(true);
        await expect(client.getBuildControllers("absent-controller")).resolves.toEqual([]);
    });
});

describe("build badge and controller factories", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("makes a badge with a build id and an image url", () => {
        const badge = makeBuildBadge();
        expect(badge.buildId).toBeGreaterThan(0);
        expect(typeof badge.imageUrl).toBe("string");
    });

    it("makes an available enabled controller", () => {
        const controller = makeBuildController();
        expect(controller.status).toBe(ControllerStatus.Available);
        expect(controller.enabled).toBe(true);
        expect(controller).toHaveProperty("createdDate");
        expect(controller).toHaveProperty("uri");
    });

    it("seeds distinct tag lists", () => {
        expect(projectTags).toEqual([...buildTags, ...definitionTags]);
        expect(new Set(projectTags).size).toBe(projectTags.length);
    });
});
