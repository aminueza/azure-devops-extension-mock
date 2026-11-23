import * as build from "../azure-devops-extension-api/build/Data";
import * as git from "../azure-devops-extension-api/git/Data";
import * as taskAgent from "../azure-devops-extension-api/taskAgent/Data";
import * as workItemTracking from "../azure-devops-extension-api/workItemTracking/Data";

const SEEDS = 2_000;

const KEYED_LISTS: Array<[string, () => number[]]> = [
    ["git pull requests", () => git.pullRequests.map(item => item.pullRequestId)],
    ["git fork sync requests", () => git.forkSyncRequests.map(item => item.operationId)],
    ["git import requests", () => git.importRequests.map(item => item.importRequestId)],
    ["git merges", () => git.merges.map(item => item.mergeOperationId)],
    ["build retention leases", () => build.retentionLeases.map(item => item.leaseId)],
    ["task agent job requests", () => taskAgent.agentRequests.map(item => item.requestId)],
    ["task agent maintenance jobs", () => taskAgent.maintenanceJobs.map(item => item.jobId)],
    ["work items", () => workItemTracking.workItems.map(item => item.id)]
];

const MAKERS: Array<[string, () => number]> = [
    ["makePullRequest", () => git.makePullRequest().pullRequestId],
    ["makeForkSyncRequest", () => git.makeForkSyncRequest().operationId],
    ["makeImportRequest", () => git.makeImportRequest().importRequestId],
    ["makeGitMerge", () => git.makeGitMerge("merge").mergeOperationId],
    [
        "makeLeaseFromNew",
        () =>
            build.makeLeaseFromNew({
                daysValid: 30,
                definitionId: 1,
                ownerId: "owner",
                protectPipeline: false,
                runId: 2
            }).leaseId
    ],
    ["makeAgentJobRequest", () => taskAgent.makeAgentJobRequest().requestId],
    ["makeAgentMessage", () => taskAgent.makeAgentMessage().messageId],
    ["makeMaintenanceJob", () => taskAgent.makeMaintenanceJob().jobId],
    ["makeWorkItem", () => workItemTracking.makeWorkItem().id]
];

describe("primary keys of seeded entities", () => {
    it.each(KEYED_LISTS)("%s never repeat a key", (_name, keys) => {
        const values = keys();
        expect(values.length).toBeGreaterThan(1);
        expect(new Set(values).size).toBe(values.length);
    });

    it.each(MAKERS)("%s never draws the same key twice", (_name, draw) => {
        const values = Array.from({ length: SEEDS }, draw);
        expect(new Set(values).size).toBe(values.length);
    });
});
