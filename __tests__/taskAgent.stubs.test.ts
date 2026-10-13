import {
    AuditAction,
    EnvironmentExpands,
    EnvironmentResourceType,
    TaskAgentRestClient,
    TaskDefinitionEndpoint,
    TaskResult,
    VirtualMachineGroup
} from "azure-devops-extension-api/TaskAgent";

import { getClient } from "../azure-devops-extension-api";
import {
    azureManagementGroups,
    azureSubscriptions,
    endpointQueryResults,
    environmentDeploymentRecords,
    environments,
    kubernetesResources,
    makeAzureManagementGroup,
    makeAzureSubscription,
    makeEnvironment,
    makeEnvironmentDeploymentRecord,
    makeEnvironmentResource,
    makeKubernetesResource,
    makePackageMetadata,
    makeTaskGroupRevision,
    makeVirtualMachine,
    makeVirtualMachineGroup,
    packages,
    parsePackageVersion,
    taskGroupRevisions,
    variableGroups,
    virtualMachineGroups,
    virtualMachines,
    yamlSchema
} from "../azure-devops-extension-api/taskAgent/Data";

describe("TaskAgentRestClient environments, resources and packages", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TaskAgentRestClient);
    const unmatchedId = Number.MAX_SAFE_INTEGER;
    const endpoint: TaskDefinitionEndpoint = {
        connectionId: "connection-1",
        keySelector: "$.id",
        scope: "proj",
        selector: "jsonpath:$.value[*]",
        taskId: "task-1",
        url: "https://management.azure.com/subscriptions"
    };

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteEnvironment", () => client.deleteEnvironment("proj", 11)],
        ["deleteKubernetesResource", () => client.deleteKubernetesResource("proj", 11, 21)],
        ["deleteVirtualMachineGroup", () => client.deleteVirtualMachineGroup("proj", 11, 31)],
        [
            "shareVariableGroup",
            () =>
                client.shareVariableGroup(
                    [
                        {
                            description: "shared",
                            name: "Common",
                            projectReference: { id: "project-id", name: "proj" }
                        }
                    ],
                    variableGroups[0].id
                )
        ]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("returns the seeded azure management groups without an error", async () => {
        const result = await client.getAzureManagementGroups();
        expect(result.errorMessage).toBe("");
        expect(result.value).toBe(azureManagementGroups);
        expect(result.value.length).toBe(2);
        expect(result.value[0].id).toContain("/providers/Microsoft.Management/managementGroups/");
    });

    it("returns the seeded azure subscriptions without an error", async () => {
        const result = await client.getAzureSubscriptions();
        expect(result.errorMessage).toBe("");
        expect(result.value).toBe(azureSubscriptions);
        expect(result.value.length).toBe(3);
    });

    it("makes azure management groups and subscriptions", () => {
        expect(typeof makeAzureManagementGroup().tenantId).toBe("string");
        expect(typeof makeAzureSubscription().subscriptionId).toBe("string");
    });

    it("returns the seeded endpoint query results", async () => {
        const values = await client.queryEndpoint(endpoint);
        expect(values).toBe(endpointQueryResults);
        expect(new Set(values).size).toBe(3);
    });

    it("pages every deployment record stamped with the environment and project", async () => {
        const records = await client.getEnvironmentDeploymentExecutionRecords("contoso", 51);
        expect(records.length).toBe(environmentDeploymentRecords.length);
        expect(records.every(r => r.environmentId === 51)).toBe(true);
        expect(records.every(r => r.scopeId === "contoso")).toBe(true);
        expect(records.map(r => r.id)).toEqual(environmentDeploymentRecords.map(r => r.id));
        expect(records.continuationToken).toBeNull();
    });

    it("limits deployment records and echoes the continuation token", async () => {
        const records = await client.getEnvironmentDeploymentExecutionRecords("proj", 51, "next", 2);
        expect(records.length).toBe(2);
        expect(records.continuationToken).toBe("next");
    });

    it("makes a succeeded deployment record", () => {
        const record = makeEnvironmentDeploymentRecord();
        expect(record.result).toBe(TaskResult.Succeeded);
        expect(record.jobAttempt).toBe(1);
        expect(record.stageAttempt).toBe(1);
    });

    it("creates an environment from the create parameter", async () => {
        const environment = await client.addEnvironment(
            { name: "staging", description: "Staging slots" },
            "contoso"
        );
        expect(environment.name).toBe("staging");
        expect(environment.description).toBe("Staging slots");
        expect(environment.project.name).toBe("contoso");
        expect(environment.resources).toEqual([]);
        expect(environments.map(e => e.id)).not.toContain(environment.id);
    });

    it("returns a seeded environment by id", async () => {
        const seeded = environments[1];
        const environment = await client.getEnvironmentById(
            "contoso",
            seeded.id,
            EnvironmentExpands.ResourceReferences
        );
        expect(environment.id).toBe(seeded.id);
        expect(environment.name).toBe(seeded.name);
        expect(environment.resources).toBe(seeded.resources);
        expect(environment.project.id).toBe(seeded.project.id);
        expect(environment.project.name).toBe("contoso");
    });

    it("fabricates an environment for an unknown id", async () => {
        const environment = await client.getEnvironmentById("proj", unmatchedId);
        expect(environment.id).toBe(unmatchedId);
        expect(environment.project.name).toBe("proj");
        expect(environment.resources[0].type).toBe(EnvironmentResourceType.Kubernetes);
    });

    it("pages every environment when no filter is given", async () => {
        const list = await client.getEnvironments("contoso");
        expect(list.map(e => e.id)).toEqual(environments.map(e => e.id));
        expect(list.every(e => e.project.name === "contoso")).toBe(true);
        expect(list.continuationToken).toBeNull();
    });

    it("filters environments by exact name", async () => {
        const list = await client.getEnvironments("proj", environments[2].name);
        expect(list.map(e => e.id)).toEqual([environments[2].id]);
    });

    it("returns no environment for an unknown name", async () => {
        const list = await client.getEnvironments("proj", "no-such-environment");
        expect([...list]).toEqual([]);
    });

    it("limits environments and echoes the continuation token", async () => {
        const list = await client.getEnvironments("proj", undefined, "next", 1);
        expect(list.map(e => e.id)).toEqual([environments[0].id]);
        expect(list.continuationToken).toBe("next");
    });

    it("seeds environments with distinct names and ids", () => {
        expect(environments.length).toBe(3);
        expect(new Set(environments.map(e => e.name)).size).toBe(3);
        expect(new Set(environments.map(e => e.id)).size).toBe(3);
        expect(typeof makeEnvironment().description).toBe("string");
    });

    it("updates a seeded environment in place of its name and description", async () => {
        const seeded = environments[0];
        const environment = await client.updateEnvironment(
            { name: "renamed", description: "Renamed" },
            "contoso",
            seeded.id
        );
        expect(environment.id).toBe(seeded.id);
        expect(environment.name).toBe("renamed");
        expect(environment.description).toBe("Renamed");
        expect(environment.createdOn).toBe(seeded.createdOn);
        expect(environment.project.name).toBe("contoso");
        expect(seeded.name).not.toBe("renamed");
    });

    it("updates an unknown environment over a fixture", async () => {
        const environment = await client.updateEnvironment(
            { name: "fresh", description: "Fresh" },
            "proj",
            unmatchedId
        );
        expect(environment.id).toBe(unmatchedId);
        expect(environment.name).toBe("fresh");
    });

    it("marks every validated input as valid", async () => {
        const result = await client.validateInputs({
            inputs: {
                cron: { isValid: false, reason: "pending", type: "expression", value: "0 3 * * *" },
                name: { isValid: false, reason: "pending", type: "expression", value: "nightly" }
            }
        });
        expect(Object.keys(result.inputs)).toEqual(["cron", "name"]);
        expect(result.inputs.cron).toEqual({
            isValid: true,
            reason: "",
            type: "expression",
            value: "0 3 * * *"
        });
        expect(result.inputs.name.isValid).toBe(true);
    });

    it("validates a request without inputs", async () => {
        await expect(client.validateInputs({ inputs: {} })).resolves.toEqual({ inputs: {} });
    });

    it("creates a kubernetes resource in the environment", async () => {
        const resource = await client.addKubernetesResource(
            { name: "payments", clusterName: "aks-prod", namespace: "payments", tags: ["prod"] },
            "proj",
            51
        );
        expect(resource.name).toBe("payments");
        expect(resource.clusterName).toBe("aks-prod");
        expect(resource.namespace).toBe("payments");
        expect(resource.tags).toEqual(["prod"]);
        expect(resource.type).toBe(EnvironmentResourceType.Kubernetes);
        expect(resource.environmentReference.id).toBe(51);
    });

    it("returns a seeded kubernetes resource by id", async () => {
        const seeded = kubernetesResources[1];
        const resource = await client.getKubernetesResource("proj", 52, seeded.id);
        expect(resource.id).toBe(seeded.id);
        expect(resource.clusterName).toBe(seeded.clusterName);
        expect(resource.environmentReference.id).toBe(52);
        expect(resource.environmentReference.name).toBe(seeded.environmentReference.name);
    });

    it("fabricates a kubernetes resource for an unknown id", async () => {
        const resource = await client.getKubernetesResource("proj", 52, unmatchedId);
        expect(resource.id).toBe(unmatchedId);
        expect(resource.environmentReference.id).toBe(52);
        expect(resource.clusterName.startsWith("aks-")).toBe(true);
    });

    it("makes environment resources of the requested type", () => {
        expect(makeEnvironmentResource(EnvironmentResourceType.Generic).type).toBe(
            EnvironmentResourceType.Generic
        );
        expect(makeKubernetesResource().type).toBe(EnvironmentResourceType.Kubernetes);
        expect(makeVirtualMachineGroup().type).toBe(EnvironmentResourceType.VirtualMachine);
        expect(kubernetesResources.length).toBe(2);
        expect(virtualMachineGroups.length).toBe(2);
    });

    it("returns a seeded package by type, platform and version", async () => {
        const metadata = await client.getPackage("agent", "linux-x64", "3.246.0");
        expect(metadata).toBe(packages[3]);
        expect(metadata.version).toEqual({ major: 3, minor: 246, patch: 0 });
        expect(metadata.filename).toBe("vsts-agent-linux-x64-3.246.0.tar.gz");
    });

    it.each([
        ["type", "runner", "linux-x64", "4.248.0"],
        ["platform", "agent", "linux-musl-x64", "4.248.0"],
        ["major version", "agent", "linux-x64", "5.248.0"],
        ["minor version", "agent", "linux-x64", "4.249.0"],
        ["patch version", "agent", "linux-x64", "4.248.7"]
    ])("fabricates a package for an unknown %s", async (_field, type, platform, version) => {
        const metadata = await client.getPackage(type, platform, version);
        expect(packages).not.toContain(metadata);
        expect(metadata.type).toBe(type);
        expect(metadata.platform).toBe(platform);
        expect(`${metadata.version.major}.${metadata.version.minor}.${metadata.version.patch}`).toBe(
            version
        );
    });

    it("lists the packages of a type", async () => {
        const list = await client.getPackages("agent");
        expect(list).toEqual(packages.slice(0, 4));
    });

    it("filters packages by platform and limits them", async () => {
        const forPlatform = await client.getPackages("agent", "linux-x64");
        expect(forPlatform).toEqual([packages[1], packages[3]]);
        const limited = await client.getPackages("agent", "linux-x64", 1);
        expect(limited).toEqual([packages[1]]);
    });

    it("lists no packages for an unknown type", async () => {
        await expect(client.getPackages("runner")).resolves.toEqual([]);
    });

    it("parses full, partial and malformed package versions", () => {
        expect(parsePackageVersion("4.248.1")).toEqual({ major: 4, minor: 248, patch: 1 });
        expect(parsePackageVersion("4.248")).toEqual({ major: 4, minor: 248, patch: 0 });
        expect(parsePackageVersion("4")).toEqual({ major: 4, minor: 0, patch: 0 });
        expect(parsePackageVersion("latest")).toEqual({ major: 0, minor: 0, patch: 0 });
    });

    it("makes package metadata with defaults and a windows archive", () => {
        const metadata = makePackageMetadata();
        expect(metadata.type).toBe("agent");
        expect(metadata.platform).toBe("linux-x64");
        expect(metadata.filename.endsWith(".tar.gz")).toBe(true);
        expect(metadata.downloadUrl.endsWith(metadata.filename)).toBe(true);
        expect(metadata.version.major).toBeGreaterThanOrEqual(2);
        expect(makePackageMetadata("agent", "win-x64", "4.248.0").filename).toBe(
            "vsts-agent-win-x64-4.248.0.zip"
        );
    });

    it("returns the revision history stamped with the task group id", async () => {
        const history = await client.getTaskGroupHistory("proj", "group-1");
        expect(history.map(r => r.revision)).toEqual([1, 2, 3]);
        expect(history.map(r => r.changeType)).toEqual([
            AuditAction.Add,
            AuditAction.Update,
            AuditAction.Update
        ]);
        expect(history.every(r => r.taskGroupId === "group-1")).toBe(true);
        expect(history.length).toBe(taskGroupRevisions.length);
        expect(makeTaskGroupRevision().changeType).toBe(AuditAction.Update);
    });

    it("returns the seeded variable groups for the requested ids", async () => {
        const groups = await client.getVariableGroupsById(
            "proj",
            [variableGroups[1].id, unmatchedId],
            true
        );
        expect(groups).toEqual([variableGroups[1]]);
    });

    it("creates a virtual machine group in the environment", async () => {
        const group = await client.addVirtualMachineGroup({ name: "web-tier" }, "proj", 61);
        expect(group.name).toBe("web-tier");
        expect(group.type).toBe(EnvironmentResourceType.VirtualMachine);
        expect(group.environmentReference.id).toBe(61);
        expect(typeof group.poolId).toBe("number");
    });

    it("returns a seeded virtual machine group by id", async () => {
        const seeded = virtualMachineGroups[0];
        const group = await client.getVirtualMachineGroup("proj", 62, seeded.id);
        expect(group.id).toBe(seeded.id);
        expect(group.poolId).toBe(seeded.poolId);
        expect(group.environmentReference.id).toBe(62);
    });

    it("fabricates a virtual machine group for an unknown id", async () => {
        const group = await client.getVirtualMachineGroup("proj", 62, unmatchedId);
        expect(group.id).toBe(unmatchedId);
        expect(group.environmentReference.id).toBe(62);
    });

    it("echoes an updated virtual machine group over a fixture", async () => {
        const input: VirtualMachineGroup = {
            ...makeVirtualMachineGroup(),
            id: 44,
            name: "db-tier",
            poolId: 7
        };
        const group = await client.updateVirtualMachineGroup(input, "proj", 63);
        expect(group.id).toBe(44);
        expect(group.name).toBe("db-tier");
        expect(group.poolId).toBe(7);
        expect(group.environmentReference.id).toBe(63);
        expect(group.environmentReference.name).toBe(input.environmentReference.name);
    });

    it("pages every virtual machine when no filter is given", async () => {
        const machines = await client.getVirtualMachines("proj", 61, 71);
        expect([...machines]).toEqual(virtualMachines);
        expect(machines.continuationToken).toBeNull();
    });

    it("filters virtual machines by exact and partial agent name", async () => {
        const name = virtualMachines[2].agent.name;
        const exact = await client.getVirtualMachines("proj", 61, 71, undefined, name);
        expect(exact.map(m => m.id)).toEqual([virtualMachines[2].id]);
        const partial = await client.getVirtualMachines("proj", 61, 71, undefined, "agent-", true);
        expect(partial.length).toBe(4);
        const none = await client.getVirtualMachines("proj", 61, 71, undefined, "agent-", false);
        expect([...none]).toEqual([]);
    });

    it("filters virtual machines by tags, limits them and echoes the token", async () => {
        const tagged = await client.getVirtualMachines(
            "proj",
            61,
            71,
            "next",
            undefined,
            undefined,
            ["db", "staging"]
        );
        expect(tagged.map(m => m.id)).toEqual([virtualMachines[1].id, virtualMachines[3].id]);
        expect(tagged.continuationToken).toBe("next");
        const limited = await client.getVirtualMachines(
            "proj",
            61,
            71,
            undefined,
            undefined,
            undefined,
            ["web"],
            1
        );
        expect(limited.map(m => m.id)).toEqual([virtualMachines[0].id]);
    });

    it("seeds virtual machines with distinct ids and agent names", () => {
        expect(virtualMachines.length).toBe(4);
        expect(new Set(virtualMachines.map(m => m.id)).size).toBe(4);
        expect(new Set(virtualMachines.map(m => m.agent.name)).size).toBe(4);
        expect(makeVirtualMachine("vm-7").agent.name).toBe("vm-7");
    });

    it("echoes updated virtual machines over fixtures", async () => {
        const input = { ...makeVirtualMachine("vm-1"), id: 45, tags: ["canary"] };
        const machines = await client.updateVirtualMachines([input], "proj", 61, 71);
        expect(machines.length).toBe(1);
        expect(machines[0].id).toBe(45);
        expect(machines[0].tags).toEqual(["canary"]);
        expect(machines[0].agent.name).toBe("vm-1");
    });

    it("returns the pipeline yaml schema", async () => {
        const schema = await client.getYamlSchema();
        expect(schema).toBe(yamlSchema);
        expect(schema.definitions.pipeline.type).toBe("object");
        await expect(client.getYamlSchema(true)).resolves.toBe(yamlSchema);
    });
});
