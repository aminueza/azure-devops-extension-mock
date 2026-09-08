import {
    DeploymentMachine,
    DeploymentMachineExpands,
    DeploymentTargetExpands,
    TaskAgentJobResultFilter,
    TaskAgentRestClient,
    TaskAgentStatusFilter
} from "azure-devops-extension-api/TaskAgent";

import { getClient } from "../azure-devops-extension-api";
import {
    agentRequests,
    deploymentMachines,
    makeDeploymentMachine
} from "../azure-devops-extension-api/taskAgent/Data";

describe("TaskAgentRestClient deployment machines and targets", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TaskAgentRestClient);
    const unmatchedId = Number.MAX_SAFE_INTEGER;
    const seededMachine = deploymentMachines[0];

    const resolving: Array<[string, () => Promise<unknown>]> = [
        [
            "addDeploymentMachine",
            () => client.addDeploymentMachine(makeDeploymentMachine(), "proj", 71)
        ],
        [
            "getDeploymentMachine",
            () =>
                client.getDeploymentMachine(
                    "proj",
                    71,
                    seededMachine.id,
                    DeploymentMachineExpands.Capabilities
                )
        ],
        [
            "getDeploymentMachines",
            () =>
                client.getDeploymentMachines(
                    "proj",
                    71,
                    ["web"],
                    "target-900",
                    DeploymentMachineExpands.AssignedRequest
                )
        ],
        [
            "replaceDeploymentMachine",
            () =>
                client.replaceDeploymentMachine(
                    makeDeploymentMachine(),
                    "proj",
                    71,
                    seededMachine.id
                )
        ],
        [
            "updateDeploymentMachine",
            () =>
                client.updateDeploymentMachine(
                    makeDeploymentMachine(),
                    "proj",
                    71,
                    seededMachine.id
                )
        ],
        [
            "updateDeploymentMachines",
            () => client.updateDeploymentMachines([makeDeploymentMachine()], "proj", 71)
        ],
        [
            "getDeploymentMachineGroupMachines",
            () => client.getDeploymentMachineGroupMachines("proj", 81, ["web"])
        ],
        [
            "updateDeploymentMachineGroupMachines",
            () =>
                client.updateDeploymentMachineGroupMachines(
                    [makeDeploymentMachine()],
                    "proj",
                    81
                )
        ],
        [
            "addDeploymentTarget",
            () => client.addDeploymentTarget(makeDeploymentMachine(), "proj", 91)
        ],
        [
            "getDeploymentTarget",
            () =>
                client.getDeploymentTarget(
                    "proj",
                    91,
                    seededMachine.id,
                    DeploymentTargetExpands.LastCompletedRequest
                )
        ],
        [
            "getDeploymentTargets",
            () =>
                client.getDeploymentTargets(
                    "proj",
                    91,
                    ["web"],
                    "target-90",
                    true,
                    DeploymentTargetExpands.Capabilities,
                    TaskAgentStatusFilter.All,
                    TaskAgentJobResultFilter.Passed,
                    "next",
                    2,
                    true,
                    ["region"]
                )
        ],
        [
            "replaceDeploymentTarget",
            () =>
                client.replaceDeploymentTarget(makeDeploymentMachine(), "proj", 91, seededMachine.id)
        ],
        [
            "updateDeploymentTarget",
            () =>
                client.updateDeploymentTarget(makeDeploymentMachine(), "proj", 91, seededMachine.id)
        ],
        [
            "updateDeploymentTargets",
            () => client.updateDeploymentTargets([{ id: 900, tags: ["web"] }], "proj", 91)
        ],
        [
            "getAgentRequestsForDeploymentMachine",
            () => client.getAgentRequestsForDeploymentMachine("proj", 71, seededMachine.id, 2)
        ],
        [
            "getAgentRequestsForDeploymentMachines",
            () => client.getAgentRequestsForDeploymentMachines("proj", 71, [900, 901], 1)
        ],
        [
            "getAgentRequestsForDeploymentTarget",
            () => client.getAgentRequestsForDeploymentTarget("proj", 91, seededMachine.id, 2)
        ],
        [
            "getAgentRequestsForDeploymentTargets",
            () =>
                client.getAgentRequestsForDeploymentTargets(
                    "proj",
                    91,
                    [900, 901],
                    55,
                    new Date("2024-01-01T00:00:00.000Z"),
                    1
                )
        ]
    ];

    it.each(resolving)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteDeploymentMachine", () => client.deleteDeploymentMachine("proj", 71, 902)],
        ["refreshDeploymentMachines", () => client.refreshDeploymentMachines("proj", 71)],
        ["deleteDeploymentTarget", () => client.deleteDeploymentTarget("proj", 91, 902)],
        ["refreshDeploymentTargets", () => client.refreshDeploymentTargets("proj", 91)]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("seeds deployment machines with pinned ids and agent names", () => {
        expect(deploymentMachines.map(m => m.id)).toEqual([900, 901, 902, 903]);
        expect(deploymentMachines.map(m => m.agent.name)).toEqual([
            "target-900",
            "target-901",
            "target-902",
            "target-903"
        ]);
        expect(deploymentMachines.map(m => m.agent.id)).toEqual([950, 951, 952, 953]);
    });

    it("returns a seeded machine by id", async () => {
        const machine = await client.getDeploymentMachine("proj", 71, seededMachine.id);
        expect(machine.id).toBe(900);
        expect(machine.agent.name).toBe("target-900");
        expect(machine.properties.region).toBe("region-900");
    });

    it("stamps the project and group onto a machine", async () => {
        const machine = await client.getDeploymentMachine("contoso", 71, 901);
        expect(machine.properties.project).toBe("contoso");
        expect(machine.properties.deploymentGroupId).toBe(71);
    });

    it("fabricates a machine for an unknown id", async () => {
        const machine = await client.getDeploymentMachine("proj", 71, unmatchedId);
        expect(machine.id).toBe(unmatchedId);
        expect(deploymentMachines.map(m => m.id)).not.toContain(machine.id);
    });

    it("lists every machine when no filter is given", async () => {
        const machines = await client.getDeploymentMachines("proj", 71);
        expect(machines.map(m => m.id)).toEqual([900, 901, 902, 903]);
        expect(machines.every(m => m.properties.deploymentGroupId === 71)).toBe(true);
    });

    it("filters listed machines by tags", async () => {
        const machines = await client.getDeploymentMachines("proj", 71, ["db", "staging"]);
        expect(machines.map(m => m.id)).toEqual([901, 903]);
    });

    it("filters listed machines by exact agent name", async () => {
        const machines = await client.getDeploymentMachines("proj", 71, undefined, "target-902");
        expect(machines.map(m => m.id)).toEqual([902]);
    });

    it("returns nothing for a name that matches no machine", async () => {
        const machines = await client.getDeploymentMachines("proj", 71, undefined, "target-90");
        expect(machines).toEqual([]);
    });

    it("echoes an added machine over a fixture", async () => {
        const input: DeploymentMachine = {
            ...makeDeploymentMachine(),
            id: 40,
            tags: ["canary"],
            properties: { region: "westus" }
        };
        const machine = await client.addDeploymentMachine(input, "proj", 72);
        expect(machine.id).toBe(40);
        expect(machine.tags).toEqual(["canary"]);
        expect(machine.properties.region).toBe("westus");
        expect(machine.properties.deploymentGroupId).toBe(72);
    });

    it("forces the path id onto a replaced machine", async () => {
        const input = { ...makeDeploymentMachine(), id: 41, tags: ["blue"] };
        const machine = await client.replaceDeploymentMachine(input, "proj", 73, 942);
        expect(machine.id).toBe(942);
        expect(machine.tags).toEqual(["blue"]);
        expect(machine.properties.project).toBe("proj");
    });

    it("forces the path id onto an updated machine", async () => {
        const input = { ...makeDeploymentMachine(), id: 42, tags: ["green"] };
        const machine = await client.updateDeploymentMachine(input, "proj", 74, 943);
        expect(machine.id).toBe(943);
        expect(machine.tags).toEqual(["green"]);
        expect(machine.properties.deploymentGroupId).toBe(74);
    });

    it("echoes every machine in a bulk update", async () => {
        const inputs = [
            { ...makeDeploymentMachine(), id: 51, tags: ["one"] },
            { ...makeDeploymentMachine(), id: 52, tags: ["two"] }
        ];
        const machines = await client.updateDeploymentMachines(inputs, "proj", 75);
        expect(machines.map(m => m.id)).toEqual([51, 52]);
        expect(machines.map(m => m.tags)).toEqual([["one"], ["two"]]);
        expect(machines.every(m => m.properties.deploymentGroupId === 75)).toBe(true);
    });

    it("lists machine group machines and stamps the group", async () => {
        const machines = await client.getDeploymentMachineGroupMachines("fabrikam", 81);
        expect(machines.map(m => m.id)).toEqual([900, 901, 902, 903]);
        expect(machines.every(m => m.properties.machineGroupId === 81)).toBe(true);
        expect(machines.every(m => m.properties.project === "fabrikam")).toBe(true);
    });

    it("filters machine group machines by tag filters", async () => {
        const machines = await client.getDeploymentMachineGroupMachines("proj", 81, ["prod"]);
        expect(machines.map(m => m.id)).toEqual([900, 902]);
    });

    it("echoes machines updated through a machine group", async () => {
        const inputs = [{ ...makeDeploymentMachine(), id: 61, tags: ["group"] }];
        const machines = await client.updateDeploymentMachineGroupMachines(inputs, "proj", 82);
        expect(machines.map(m => m.id)).toEqual([61]);
        expect(machines[0].tags).toEqual(["group"]);
        expect(machines[0].properties.machineGroupId).toBe(82);
    });

    it("echoes an added target over a fixture", async () => {
        const input = { ...makeDeploymentMachine(), id: 62, tags: ["target"] };
        const target = await client.addDeploymentTarget(input, "proj", 92);
        expect(target.id).toBe(62);
        expect(target.tags).toEqual(["target"]);
        expect(target.properties.deploymentGroupId).toBe(92);
    });

    it("returns a seeded target by id", async () => {
        const target = await client.getDeploymentTarget("proj", 91, 902);
        expect(target.id).toBe(902);
        expect(target.agent.name).toBe("target-902");
        expect(target.properties.project).toBe("proj");
    });

    it("fabricates a target for an unknown id", async () => {
        const target = await client.getDeploymentTarget("proj", 91, unmatchedId);
        expect(target.id).toBe(unmatchedId);
        expect(deploymentMachines.map(m => m.id)).not.toContain(target.id);
    });

    it("pages every target with a null continuation token by default", async () => {
        const targets = await client.getDeploymentTargets("proj", 91);
        expect(targets.map(t => t.id)).toEqual([900, 901, 902, 903]);
        expect(targets.continuationToken).toBeNull();
    });

    it("echoes the continuation token and honours top", async () => {
        const targets = await client.getDeploymentTargets(
            "proj",
            91,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            "next-page",
            2
        );
        expect(targets.map(t => t.id)).toEqual([900, 901]);
        expect(targets.continuationToken).toBe("next-page");
    });

    it("matches target names partially when asked", async () => {
        const targets = await client.getDeploymentTargets("proj", 91, undefined, "target-90", true);
        expect(targets.map(t => t.id)).toEqual([900, 901, 902, 903]);
    });

    it("matches target names exactly when partial match is off", async () => {
        const targets = await client.getDeploymentTargets(
            "proj",
            91,
            undefined,
            "target-901",
            false
        );
        expect(targets.map(t => t.id)).toEqual([901]);
    });

    it("filters targets by online status", async () => {
        const targets = await client.getDeploymentTargets(
            "proj",
            91,
            undefined,
            undefined,
            undefined,
            undefined,
            TaskAgentStatusFilter.Online
        );
        expect(targets.map(t => t.id)).toEqual([900, 901, 902]);
    });

    it("filters targets by offline status", async () => {
        const targets = await client.getDeploymentTargets(
            "proj",
            91,
            undefined,
            undefined,
            undefined,
            undefined,
            TaskAgentStatusFilter.Offline
        );
        expect(targets.map(t => t.id)).toEqual([903]);
    });

    it("keeps every target for the all status filter", async () => {
        const targets = await client.getDeploymentTargets(
            "proj",
            91,
            undefined,
            undefined,
            undefined,
            undefined,
            TaskAgentStatusFilter.All
        );
        expect(targets.map(t => t.id)).toEqual([900, 901, 902, 903]);
    });

    it("filters targets by enabled agents", async () => {
        const targets = await client.getDeploymentTargets(
            "proj",
            91,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true
        );
        expect(targets.map(t => t.id)).toEqual([900, 901, 902]);
    });

    it("filters targets by disabled agents", async () => {
        const targets = await client.getDeploymentTargets(
            "proj",
            91,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false
        );
        expect(targets.map(t => t.id)).toEqual([903]);
    });

    it("filters targets by tags", async () => {
        const targets = await client.getDeploymentTargets("proj", 91, ["web"]);
        expect(targets.map(t => t.id)).toEqual([900, 902]);
    });

    it("forces the path id onto a replaced target", async () => {
        const input = { ...makeDeploymentMachine(), id: 63, tags: ["old"] };
        const target = await client.replaceDeploymentTarget(input, "proj", 93, 944);
        expect(target.id).toBe(944);
        expect(target.tags).toEqual(["old"]);
        expect(target.properties.deploymentGroupId).toBe(93);
    });

    it("forces the path id onto an updated target", async () => {
        const input = { ...makeDeploymentMachine(), id: 64, tags: ["new"] };
        const target = await client.updateDeploymentTarget(input, "proj", 94, 945);
        expect(target.id).toBe(945);
        expect(target.tags).toEqual(["new"]);
        expect(target.properties.project).toBe("proj");
    });

    it("maps only id and tags from target update parameters", async () => {
        const targets = await client.updateDeploymentTargets(
            [
                { id: 900, tags: ["retagged"] },
                { id: 901, tags: [] }
            ],
            "proj",
            95
        );
        expect(targets.map(t => t.id)).toEqual([900, 901]);
        expect(targets.map(t => t.tags)).toEqual([["retagged"], []]);
        expect(targets.every(t => t.properties.deploymentGroupId === 95)).toBe(true);
    });

    it("returns the seeded requests for one machine", async () => {
        const requests = await client.getAgentRequestsForDeploymentMachine("proj", 71, 900);
        expect(requests.map(r => r.requestId)).toEqual(agentRequests.map(r => r.requestId));
        expect(requests.every(r => r.data.deploymentGroupId === "71")).toBe(true);
        expect(requests.every(r => r.data.machineId === "900")).toBe(true);
    });

    it("caps the requests for one machine by completed request count", async () => {
        const requests = await client.getAgentRequestsForDeploymentMachine("proj", 71, 900, 1);
        expect(requests).toHaveLength(1);
        expect(requests[0].requestId).toBe(agentRequests[0].requestId);
    });

    it("returns requests for the given machine ids", async () => {
        const requests = await client.getAgentRequestsForDeploymentMachines("proj", 71, [900, 903], 1);
        expect(requests.map(r => r.data.machineId)).toEqual(["900", "903"]);
    });

    it("falls back to every seeded machine when no ids are given", async () => {
        const requests = await client.getAgentRequestsForDeploymentMachines("proj", 71);
        expect(requests).toHaveLength(deploymentMachines.length * agentRequests.length);
    });

    it("returns the requests for one target", async () => {
        const requests = await client.getAgentRequestsForDeploymentTarget("proj", 91, 902, 2);
        expect(requests).toHaveLength(2);
        expect(requests.every(r => r.data.machineId === "902")).toBe(true);
        expect(requests.every(r => r.data.deploymentGroupId === "91")).toBe(true);
    });

    it("returns requests for the given target ids", async () => {
        const requests = await client.getAgentRequestsForDeploymentTargets("proj", 91, [901], 55);
        expect(requests.map(r => r.data.machineId)).toEqual(["901", "901", "901"]);
    });

    it("falls back to every seeded target when no target ids are given", async () => {
        const requests = await client.getAgentRequestsForDeploymentTargets("proj", 91);
        expect(requests).toHaveLength(deploymentMachines.length * agentRequests.length);
    });
});
