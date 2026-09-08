import {
    AadLoginPromptOption,
    TaskAgentRequestUpdateOptions,
    TaskAgentRestClient,
    TaskResult
} from "azure-devops-extension-api/TaskAgent";

import { getClient } from "../azure-devops-extension-api";
import {
    agentRequests,
    agentSessions,
    agents,
    makeAgent,
    makeAgentJobRequest,
    makeAgentMessage,
    makeAgentSession,
    messages,
    vstsAadTenantId
} from "../azure-devops-extension-api/taskAgent/Data";

describe("TaskAgentRestClient requests, sessions and messages", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TaskAgentRestClient);
    const unmatchedId = Number.MAX_SAFE_INTEGER;
    const seeded = agentRequests[0];

    const resolving: Array<[string, () => Promise<unknown>]> = [
        ["replaceAgent", () => client.replaceAgent(makeAgent(), 1, 5)],
        ["updateAgentUpdateState", () => client.updateAgentUpdateState(1, agents[0].id, "Ready")],
        [
            "updateAgentUserCapabilities",
            () => client.updateAgentUserCapabilities({ tier: "gold" }, 1, agents[0].id)
        ],
        ["getAgentRequest", () => client.getAgentRequest(1, seeded.requestId, true)],
        ["getAgentRequests", () => client.getAgentRequests(1, 2, "token")],
        [
            "getAgentRequestsForAgent",
            () => client.getAgentRequestsForAgent(1, seeded.reservedAgent.id, 1)
        ],
        [
            "getAgentRequestsForAgents",
            () => client.getAgentRequestsForAgents(1, [seeded.reservedAgent.id], 1)
        ],
        [
            "getAgentRequestsForPlan",
            () => client.getAgentRequestsForPlan(1, seeded.planId, seeded.jobId)
        ],
        [
            "getAgentRequestsForQueue",
            () => client.getAgentRequestsForQueue("proj", seeded.queueId, 5, "token")
        ],
        [
            "queueAgentRequest",
            () => client.queueAgentRequest(makeAgentJobRequest(), "proj", 12)
        ],
        [
            "queueAgentRequestByPool",
            () => client.queueAgentRequestByPool(makeAgentJobRequest(), 12)
        ],
        [
            "updateAgentRequest",
            () =>
                client.updateAgentRequest(
                    makeAgentJobRequest(),
                    1,
                    7,
                    "lock",
                    TaskAgentRequestUpdateOptions.BumpRequestToTop
                )
        ],
        ["createAgentSession", () => client.createAgentSession(makeAgentSession(), 1)],
        ["getMessage", () => client.getMessage(1, "session", messages[0].messageId)],
        [
            "createAadOAuthRequest",
            () =>
                client.createAadOAuthRequest(
                    "tenant",
                    "app.example.test/cb",
                    AadLoginPromptOption.FreshLogin,
                    "payload",
                    true
                )
        ],
        ["getVstsAadTenantId", () => client.getVstsAadTenantId()]
    ];

    it.each(resolving)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voiding: Array<[string, () => Promise<void>]> = [
        ["refreshAgent", () => client.refreshAgent(1, 5)],
        ["refreshAgents", () => client.refreshAgents(1)],
        [
            "deleteAgentRequest",
            () => client.deleteAgentRequest(1, 7, "lock", TaskResult.Succeeded, true)
        ],
        ["deleteAgentSession", () => client.deleteAgentSession(1, "session")],
        ["deleteMessage", () => client.deleteMessage(1, 3, "session")],
        ["sendMessage", () => client.sendMessage(makeAgentMessage(), 1, 7)],
        ["createTeamProject", () => client.createTeamProject("proj")]
    ];

    it.each(voiding)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("returns a seeded request by id", async () => {
        const request = await client.getAgentRequest(1, seeded.requestId);
        expect(request).toBe(seeded);
    });

    it("fabricates a request for an unknown id", async () => {
        const request = await client.getAgentRequest(42, unmatchedId);
        expect(request.requestId).toBe(unmatchedId);
        expect(request.poolId).toBe(42);
    });

    it("pages requests down to top and stamps the pool", async () => {
        const paged = await client.getAgentRequests(55, 2);
        expect(paged).toHaveLength(2);
        expect(paged.continuationToken).toBeNull();
        expect(paged.every(r => r.poolId === 55)).toBe(true);
    });

    it("filters requests by reserved agent", async () => {
        const found = await client.getAgentRequestsForAgent(3, seeded.reservedAgent.id);
        expect(found).toHaveLength(1);
        expect(found[0].requestId).toBe(seeded.requestId);
        expect(found[0].poolId).toBe(3);
        await expect(client.getAgentRequestsForAgent(3, unmatchedId)).resolves.toEqual([]);
    });

    it("caps requests for an agent at the completed count", async () => {
        await expect(
            client.getAgentRequestsForAgent(3, seeded.reservedAgent.id, 0)
        ).resolves.toEqual([]);
    });

    it("filters requests by a list of agents", async () => {
        const ids = [agentRequests[0].reservedAgent.id, agentRequests[1].reservedAgent.id];
        const found = await client.getAgentRequestsForAgents(4, ids, 1);
        expect(found).toHaveLength(1);
        expect(found[0].poolId).toBe(4);
    });

    it("returns every request when no agent list is given", async () => {
        const found = await client.getAgentRequestsForAgents(4);
        expect(found).toHaveLength(agentRequests.length);
    });

    it("filters requests by plan and job", async () => {
        const byPlan = await client.getAgentRequestsForPlan(6, seeded.planId);
        expect(byPlan).toHaveLength(1);
        expect(byPlan[0].poolId).toBe(6);
        const byJob = await client.getAgentRequestsForPlan(6, seeded.planId, seeded.jobId);
        expect(byJob).toHaveLength(1);
        await expect(
            client.getAgentRequestsForPlan(6, seeded.planId, "job-none")
        ).resolves.toEqual([]);
    });

    it("pages requests for a queue and echoes the project scope", async () => {
        const paged = await client.getAgentRequestsForQueue("proj", seeded.queueId, 5, "next");
        expect(paged).toHaveLength(1);
        expect(paged.continuationToken).toBe("next");
        expect(paged[0].scopeId).toBe("proj");
    });

    it("defaults the queue continuation token to null", async () => {
        const paged = await client.getAgentRequestsForQueue("proj", unmatchedId, 5);
        expect(paged).toHaveLength(0);
        expect(paged.continuationToken).toBeNull();
    });

    it("echoes a queued request with the queue and project", async () => {
        const input = makeAgentJobRequest();
        const request = await client.queueAgentRequest(input, "proj", 21);
        expect(request.queueId).toBe(21);
        expect(request.scopeId).toBe("proj");
        expect(request.jobName).toBe(input.jobName);
    });

    it("echoes a request queued by pool", async () => {
        const input = makeAgentJobRequest();
        const request = await client.queueAgentRequestByPool(input, 22);
        expect(request.poolId).toBe(22);
        expect(request.jobId).toBe(input.jobId);
    });

    it("stamps the lock token onto an updated request", async () => {
        const input = makeAgentJobRequest();
        const request = await client.updateAgentRequest(input, 23, 24, "lock-1");
        expect(request.poolId).toBe(23);
        expect(request.requestId).toBe(24);
        expect(request.data.lockToken).toBe("lock-1");
        expect(request.data.ParallelismTag).toBe(input.data.ParallelismTag);
    });

    it("replaces an agent with the given id", async () => {
        const input = makeAgent("replacement");
        const agent = await client.replaceAgent(input, 1, 31);
        expect(agent.id).toBe(31);
        expect(agent.name).toBe("replacement");
    });

    it("updates the state of a seeded agent", async () => {
        const agent = await client.updateAgentUpdateState(1, agents[0].id, "Updating");
        expect(agent.provisioningState).toBe("Updating");
        expect(agent.name).toBe(agents[0].name);
    });

    it("fabricates an agent when updating the state of an unknown id", async () => {
        const agent = await client.updateAgentUpdateState(1, unmatchedId, "Updating");
        expect(agent.id).toBe(unmatchedId);
        expect(agent.provisioningState).toBe("Updating");
    });

    it("sets user capabilities on a seeded agent", async () => {
        const agent = await client.updateAgentUserCapabilities({ gpu: "yes" }, 1, agents[0].id);
        expect(agent.userCapabilities).toEqual({ gpu: "yes" });
        expect(agent.name).toBe(agents[0].name);
    });

    it("fabricates an agent when setting capabilities on an unknown id", async () => {
        const agent = await client.updateAgentUserCapabilities({ gpu: "no" }, 1, unmatchedId);
        expect(agent.id).toBe(unmatchedId);
        expect(agent.userCapabilities).toEqual({ gpu: "no" });
    });

    it("echoes a created session", async () => {
        const input = makeAgentSession();
        const session = await client.createAgentSession(input, 1);
        expect(session.sessionId).toBe(input.sessionId);
        expect(session.encryptionKey.encryptionPadding).toBe("OaepSHA256");
    });

    it("seeds sessions with pinned ids", () => {
        expect(agentSessions.map(s => s.sessionId)).toEqual(["session-900", "session-901"]);
    });

    it("returns a seeded message by last message id", async () => {
        await expect(client.getMessage(1, "session", messages[1].messageId)).resolves.toBe(
            messages[1]
        );
    });

    it("fabricates a message for an unknown last message id", async () => {
        const message = await client.getMessage(1, "session", unmatchedId);
        expect(messages).not.toContain(message);
        expect(message.iv).toEqual([9, 8, 7, 6]);
    });

    it("builds an aad oauth request url from the tenant and redirect", async () => {
        await expect(
            client.createAadOAuthRequest("tenant-1", "app.example.test/cb")
        ).resolves.toBe("app.example.test/cb?tenantId=tenant-1");
    });

    it("returns the seeded aad tenant id", async () => {
        await expect(client.getVstsAadTenantId()).resolves.toBe(vstsAadTenantId);
    });
});
