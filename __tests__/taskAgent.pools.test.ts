import {
    TaskAgentPoolActionFilter,
    TaskAgentQueueActionFilter,
    TaskAgentRestClient
} from "azure-devops-extension-api/TaskAgent";

import { getClient } from "../azure-devops-extension-api";
import {
    agentCloudRequests,
    agentCloudTypes,
    agentClouds,
    agentPools,
    agentQueues,
    makeAgentCloud,
    makeAgentPool,
    makeAgentQueue,
    makeQueueRestrictions,
    makeTaskHubLicenseDetails,
    resourceLimits
} from "../azure-devops-extension-api/taskAgent/Data";

describe("TaskAgentRestClient pools, queues and clouds", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TaskAgentRestClient);
    const unmatchedId = Number.MAX_SAFE_INTEGER;

    const resolving: Array<[string, () => Promise<unknown>]> = [
        ["addAgentPool", () => client.addAgentPool(makeAgentPool("Custom"))],
        ["updateAgentPool", () => client.updateAgentPool(makeAgentPool("Custom"), 12)],
        [
            "getAgentPoolsByIds",
            () => client.getAgentPoolsByIds([agentPools[0].id], TaskAgentPoolActionFilter.Manage)
        ],
        ["getAgentPoolMetadata", () => client.getAgentPoolMetadata(agentPools[0].id)],
        ["hasPoolPermissions", () => client.hasPoolPermissions(agentPools[0].id, 2)],
        ["addAgentQueue", () => client.addAgentQueue(makeAgentQueue("Hosted"), "proj", true)],
        [
            "getAgentQueuesByIds",
            () => client.getAgentQueuesByIds([agentQueues[0].id], "proj", TaskAgentQueueActionFilter.Use)
        ],
        [
            "getAgentQueuesByNames",
            () => client.getAgentQueuesByNames(["Default"], "proj", TaskAgentQueueActionFilter.Use)
        ],
        [
            "getAgentQueuesForPools",
            () => client.getAgentQueuesForPools([agentQueues[0].pool.id], "proj", TaskAgentQueueActionFilter.None)
        ],
        [
            "updateQueueRestrictedImageLabels",
            () => client.updateQueueRestrictedImageLabels(makeQueueRestrictions(), "proj", 7)
        ],
        ["addAgentCloud", () => client.addAgentCloud(makeAgentCloud())],
        ["deleteAgentCloud", () => client.deleteAgentCloud(agentClouds[0].agentCloudId)],
        ["getAgentCloud", () => client.getAgentCloud(agentClouds[0].agentCloudId)],
        ["getAgentClouds", () => client.getAgentClouds()],
        ["updateAgentCloud", () => client.updateAgentCloud(makeAgentCloud(), 44)],
        ["getAgentCloudRequests", () => client.getAgentCloudRequests(44)],
        ["getAgentCloudTypes", () => client.getAgentCloudTypes()],
        ["getResourceLimits", () => client.getResourceLimits()],
        ["getResourceUsage", () => client.getResourceUsage("Public", true, false)],
        ["getTaskHubLicenseDetails", () => client.getTaskHubLicenseDetails("build", true, true)],
        [
            "updateTaskHubLicenseDetails",
            () => client.updateTaskHubLicenseDetails(makeTaskHubLicenseDetails(), "build")
        ]
    ];

    it.each(resolving)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voiding: Array<[string, () => Promise<void>]> = [
        ["deleteAgentPool", () => client.deleteAgentPool(agentPools[0].id)],
        ["setAgentPoolMetadata", () => client.setAgentPoolMetadata({ tier: "gold" }, agentPools[0].id)],
        ["deleteAgentQueue", () => client.deleteAgentQueue(agentQueues[0].id, "proj")]
    ];

    it.each(voiding)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("echoes an added pool over a fixture", async () => {
        const pool = await client.addAgentPool(makeAgentPool("Contoso"));
        expect(pool.name).toBe("Contoso");
        expect(pool.poolType).toBe(agentPools[0].poolType);
    });

    it("stamps the pool id on update", async () => {
        const pool = await client.updateAgentPool(makeAgentPool("Contoso"), 4242);
        expect(pool.id).toBe(4242);
        expect(pool.name).toBe("Contoso");
    });

    it("filters pools by id", async () => {
        const pools = await client.getAgentPoolsByIds([agentPools[1].id]);
        expect(pools).toContain(agentPools[1]);
        expect(pools.every(p => p.id === agentPools[1].id)).toBe(true);
    });

    it("returns no pools for unknown ids", async () => {
        await expect(client.getAgentPoolsByIds([unmatchedId])).resolves.toEqual([]);
    });

    it("derives pool metadata from the id", async () => {
        await expect(client.getAgentPoolMetadata(9)).resolves.toBe("pool-9-metadata");
    });

    it("grants every pool permission", async () => {
        await expect(client.hasPoolPermissions(1, 0)).resolves.toBe(true);
    });

    it("echoes an added queue over a fixture", async () => {
        const queue = await client.addAgentQueue(makeAgentQueue("Hosted Ubuntu"));
        expect(queue.name).toBe("Hosted Ubuntu");
        expect(queue.projectId).toBeDefined();
    });

    it("filters queues by id", async () => {
        const queues = await client.getAgentQueuesByIds([agentQueues[0].id]);
        expect(queues).toContain(agentQueues[0]);
        expect(queues.every(q => q.id === agentQueues[0].id)).toBe(true);
    });

    it("filters queues by name", async () => {
        const queues = await client.getAgentQueuesByNames(["Default", "Nope"]);
        expect(queues.map(q => q.name)).toEqual(["Default"]);
    });

    it("filters queues by pool id", async () => {
        const queues = await client.getAgentQueuesForPools([agentQueues[1].pool.id]);
        expect(queues).toContain(agentQueues[1]);
        expect(queues.every(q => q.pool.id === agentQueues[1].pool.id)).toBe(true);
        await expect(client.getAgentQueuesForPools([unmatchedId])).resolves.toEqual([]);
    });

    it("echoes restricted image labels", async () => {
        const restriction = await client.updateQueueRestrictedImageLabels(
            { restrictedImageLabels: ["ubuntu-latest"] },
            "proj",
            7
        );
        expect(restriction.restrictedImageLabels).toEqual(["ubuntu-latest"]);
    });

    it("echoes an added agent cloud over a fixture", async () => {
        const input = makeAgentCloud();
        const cloud = await client.addAgentCloud(input);
        expect(cloud.name).toBe(input.name);
        expect(cloud.internal).toBe(false);
    });

    it("returns a known agent cloud", async () => {
        await expect(client.getAgentCloud(agentClouds[1].agentCloudId)).resolves.toBe(agentClouds[1]);
    });

    it("fabricates an agent cloud for an unknown id", async () => {
        const cloud = await client.getAgentCloud(unmatchedId);
        expect(cloud.agentCloudId).toBe(unmatchedId);
        expect(typeof cloud.id).toBe("string");
    });

    it("deletes a known agent cloud", async () => {
        await expect(client.deleteAgentCloud(agentClouds[2].agentCloudId)).resolves.toBe(agentClouds[2]);
    });

    it("fabricates the deleted agent cloud for an unknown id", async () => {
        const cloud = await client.deleteAgentCloud(unmatchedId);
        expect(cloud.agentCloudId).toBe(unmatchedId);
    });

    it("lists the seeded agent clouds and types", async () => {
        await expect(client.getAgentClouds()).resolves.toBe(agentClouds);
        await expect(client.getAgentCloudTypes()).resolves.toBe(agentCloudTypes);
    });

    it("stamps the cloud id on update", async () => {
        const input = makeAgentCloud();
        const cloud = await client.updateAgentCloud(input, 77);
        expect(cloud.agentCloudId).toBe(77);
        expect(cloud.name).toBe(input.name);
    });

    it("stamps the cloud id on every request", async () => {
        const requests = await client.getAgentCloudRequests(88);
        expect(requests).toHaveLength(agentCloudRequests.length);
        expect(requests.every(r => r.agentCloudId === 88)).toBe(true);
        expect(requests[0].requestId).toBe(agentCloudRequests[0].requestId);
    });

    it("lists the seeded resource limits", async () => {
        await expect(client.getResourceLimits()).resolves.toBe(resourceLimits);
    });

    it("reports resource usage with a limit and no running requests", async () => {
        const usage = await client.getResourceUsage();
        expect(usage.runningRequests).toEqual([]);
        expect(usage.resourceLimit.isHosted).toBe(true);
    });

    it("reports task hub license details", async () => {
        const details = await client.getTaskHubLicenseDetails("build");
        expect(details.failedToReachAllProviders).toBe(false);
        expect(details.hasLicenseCountEverUpdated).toBe(true);
    });

    it("echoes updated task hub license details", async () => {
        const input = makeTaskHubLicenseDetails();
        const details = await client.updateTaskHubLicenseDetails(input, "release");
        expect(details.totalLicenseCount).toBe(input.totalLicenseCount);
    });
});
