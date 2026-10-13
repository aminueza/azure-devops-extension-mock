import {
    PublishTaskGroupMetadata,
    SecureFile,
    SecureFileActionFilter,
    TaskAgentRestClient,
    TaskCommandMode,
    TaskGroupCreateParameter,
    TaskGroupExpands,
    TaskGroupUpdateParameter
} from "azure-devops-extension-api/TaskAgent";

import { getClient } from "../azure-devops-extension-api";
import {
    makeSecureFile,
    makeTaskDefinition,
    makeTaskGroup,
    secureFiles,
    taskDefinitions,
    taskGroups
} from "../azure-devops-extension-api/taskAgent/Data";

const decode = (buffer: ArrayBuffer): string => String.fromCharCode(...new Uint8Array(buffer));

describe("TaskAgentRestClient secure files, task groups and task definitions", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(TaskAgentRestClient);
    const unmatchedId = "00000000-0000-4000-8000-000000000000";
    const createParameter: TaskGroupCreateParameter = {
        author: "Amanda Souza",
        category: "Deploy",
        description: "Deploys the service",
        friendlyName: "Deploy service",
        iconUrl: "https://example.com/icon.png",
        inputs: [],
        instanceNameFormat: "Deploy $(service)",
        name: "deploy-service",
        parentDefinitionId: "",
        runsOn: ["Agent"],
        tasks: [],
        version: { build: "", isTest: false, major: 2, minor: 1, patch: 0, preRelease: "" }
    };
    const updateParameter: TaskGroupUpdateParameter = {
        ...createParameter,
        comment: "Bump version",
        id: "body-id",
        revision: 4
    };

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteSecureFile", () => client.deleteSecureFile("proj", secureFiles[0].id)],
        ["deleteTaskGroup", () => client.deleteTaskGroup("proj", taskGroups[0].id, "obsolete")],
        ["deleteTaskDefinition", () => client.deleteTaskDefinition(taskDefinitions[0].id)]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("downloads a secure file as an array buffer", async () => {
        const buffer = await client.downloadSecureFile("proj", "file-1", "ticket-1", true);
        expect(buffer).toBeInstanceOf(ArrayBuffer);
        expect(decode(buffer)).toBe("proj-secure-file-file-1-ticket-1");
    });

    it("returns a seeded secure file without its download ticket", async () => {
        const seeded = secureFiles[1];
        const file = await client.getSecureFile("proj", seeded.id);
        expect(file.id).toBe(seeded.id);
        expect(file.name).toBe(seeded.name);
        expect(file.ticket).toBe("");
        expect(seeded.ticket.length).toBe(32);
    });

    it("returns a seeded secure file with its download ticket when asked", async () => {
        const seeded = secureFiles[1];
        const file = await client.getSecureFile(
            "proj",
            seeded.id,
            true,
            SecureFileActionFilter.Use
        );
        expect(file).toBe(seeded);
    });

    it("fabricates a secure file for an unknown id", async () => {
        const file = await client.getSecureFile("proj", unmatchedId, false);
        expect(file.id).toBe(unmatchedId);
        expect(file.ticket).toBe("");
        expect(file.name).toMatch(/\.(pfx|p12|mobileprovision|keystore)$/);
    });

    it("lists every secure file without tickets", async () => {
        const files = await client.getSecureFiles("proj");
        expect(files.map(f => f.id)).toEqual(secureFiles.map(f => f.id));
        expect(files.every(f => f.ticket === "")).toBe(true);
    });

    it("filters listed secure files by name pattern and includes tickets", async () => {
        const seeded = secureFiles[2];
        const files = await client.getSecureFiles(
            "proj",
            seeded.name,
            true,
            SecureFileActionFilter.Manage
        );
        expect(files).toEqual([seeded]);
        await expect(client.getSecureFiles("proj", "no-such-file")).resolves.toEqual([]);
    });

    it("returns the seeded secure files for the requested ids", async () => {
        const ids = [secureFiles[0].id, unmatchedId];
        const withTickets = await client.getSecureFilesByIds("proj", ids, true);
        expect(withTickets).toEqual([secureFiles[0]]);
        const withoutTickets = await client.getSecureFilesByIds("proj", ids);
        expect(withoutTickets).toEqual([{ ...secureFiles[0], ticket: "" }]);
    });

    it("returns the seeded secure files for the requested names", async () => {
        const names = [secureFiles[2].name, "no-such-file"];
        const withTickets = await client.getSecureFilesByNames("proj", names, true);
        expect(withTickets).toEqual([secureFiles[2]]);
        const withoutTickets = await client.getSecureFilesByNames("proj", names);
        expect(withoutTickets).toEqual([{ ...secureFiles[2], ticket: "" }]);
    });

    it("queries secure files by properties with and without a name pattern", async () => {
        const all = await client.querySecureFilesByProperties("environment eq 'prod'", "proj");
        expect(all.map(f => f.id)).toEqual(secureFiles.map(f => f.id));
        expect(all.every(f => f.ticket === "")).toBe(true);
        const named = await client.querySecureFilesByProperties(
            "environment eq 'prod'",
            "proj",
            secureFiles[0].name
        );
        expect(named.map(f => f.id)).toEqual([secureFiles[0].id]);
    });

    it("forces the path id onto an updated secure file", async () => {
        const input: SecureFile = {
            ...makeSecureFile("signing.pfx"),
            properties: { environment: "prod" }
        };
        const file = await client.updateSecureFile(input, "proj", "file-9");
        expect(file.id).toBe("file-9");
        expect(file.name).toBe("signing.pfx");
        expect(file.properties).toEqual({ environment: "prod" });
    });

    it("echoes updated secure files over fixtures", async () => {
        const input = [makeSecureFile("a.p12"), makeSecureFile("b.p12")];
        const files = await client.updateSecureFiles(input, "proj");
        expect(files).toEqual(input);
    });

    it("uploads a secure file under the given name", async () => {
        const file = await client.uploadSecureFile(new ArrayBuffer(4), "proj", "upload.pfx", true);
        expect(file.name).toBe("upload.pfx");
        expect(file.ticket).toBe("");
        expect(secureFiles.map(f => f.id)).not.toContain(file.id);
    });

    it("seeds secure files with distinct names", () => {
        expect(secureFiles.length).toBe(3);
        expect(new Set(secureFiles.map(f => f.name)).size).toBe(3);
    });

    it("creates a task group from the create parameter", async () => {
        const group = await client.addTaskGroup(createParameter, "proj");
        expect(group.name).toBe("deploy-service");
        expect(group.category).toBe("Deploy");
        expect(group.version.major).toBe(2);
        expect(group.revision).toBe(1);
        expect(typeof group.id).toBe("string");
    });

    it("returns a seeded task group by id", async () => {
        const group = await client.getTaskGroup(
            "proj",
            taskGroups[1].id,
            "1.*",
            TaskGroupExpands.Tasks
        );
        expect(group).toBe(taskGroups[1]);
    });

    it("fabricates a task group for an unknown id", async () => {
        const group = await client.getTaskGroup("proj", unmatchedId, "1.*");
        expect(group.id).toBe(unmatchedId);
        expect(group.revision).toBe(1);
    });

    it("serializes a task group at the requested revision", async () => {
        const seeded = taskGroups[0];
        const revision = JSON.parse(await client.getTaskGroupRevision("proj", seeded.id, 7));
        expect(revision.id).toBe(seeded.id);
        expect(revision.name).toBe(seeded.name);
        expect(revision.revision).toBe(7);
        const fabricated = JSON.parse(await client.getTaskGroupRevision("proj", unmatchedId, 2));
        expect(fabricated.id).toBe(unmatchedId);
        expect(fabricated.revision).toBe(2);
    });

    it("publishes a draft task group under its parent", async () => {
        const metadata: PublishTaskGroupMetadata = {
            comment: "Publish draft",
            parentDefinitionRevision: 3,
            preview: true,
            taskGroupId: taskGroups[0].id,
            taskGroupRevision: 5
        };
        const published = await client.publishTaskGroup(metadata, "proj", "parent-1");
        expect(published.length).toBe(1);
        expect(published[0].id).toBe(taskGroups[0].id);
        expect(published[0].name).toBe(taskGroups[0].name);
        expect(published[0].comment).toBe("Publish draft");
        expect(published[0].parentDefinitionId).toBe("parent-1");
        expect(published[0].preview).toBe(true);
        expect(published[0].revision).toBe(5);
        const unknown = await client.publishTaskGroup(
            { ...metadata, taskGroupId: unmatchedId },
            "proj",
            "parent-1"
        );
        expect(unknown[0].id).toBe(unmatchedId);
    });

    it("restores a deleted task group", async () => {
        const deleted = { ...makeTaskGroup(), deleted: true };
        const restored = await client.undeleteTaskGroup(deleted, "proj");
        expect(restored.length).toBe(1);
        expect(restored[0].id).toBe(deleted.id);
        expect(restored[0].deleted).toBe(false);
    });

    it("forces the path id onto an updated task group", async () => {
        const group = await client.updateTaskGroup(updateParameter, "proj", "path-id");
        expect(group.id).toBe("path-id");
        expect(group.comment).toBe("Bump version");
        expect(group.revision).toBe(4);
    });

    it("keeps the body id on an updated task group without a path id", async () => {
        const group = await client.updateTaskGroup(updateParameter, "proj");
        expect(group.id).toBe("body-id");
        expect(group.name).toBe("deploy-service");
    });

    it("updates the comment of a seeded and of an unknown task group", async () => {
        const seeded = await client.updateTaskGroupProperties(
            { comment: "Disable old versions" },
            "proj",
            taskGroups[1].id,
            true
        );
        expect(seeded).toEqual([{ ...taskGroups[1], comment: "Disable old versions" }]);
        const unknown = await client.updateTaskGroupProperties(
            { comment: "Missing" },
            "proj",
            unmatchedId
        );
        expect(unknown.length).toBe(1);
        expect(unknown[0].id).toBe(unmatchedId);
        expect(unknown[0].comment).toBe("Missing");
    });

    it("maps every requested task group id to one group per version", async () => {
        const groups = await client.getTaskGroupsByIds(
            { [taskGroups[0].id]: ["1.*", "2.*"], [unmatchedId]: ["1.*"], empty: [] },
            "proj",
            true
        );
        expect(Object.keys(groups)).toEqual([taskGroups[0].id, unmatchedId, "empty"]);
        expect(groups[taskGroups[0].id]).toEqual([taskGroups[0], taskGroups[0]]);
        expect(groups[unmatchedId].length).toBe(1);
        expect(groups[unmatchedId][0].id).toBe(unmatchedId);
        expect(groups.empty).toEqual([]);
    });

    it("downloads the task content zip as an array buffer", async () => {
        const buffer = await client.getTaskContentZip("task-1", "2.1.0", ["Build"], true);
        expect(buffer).toBeInstanceOf(ArrayBuffer);
        expect(decode(buffer)).toBe("task-task-1-2.1.0.zip");
    });

    it("returns a seeded task definition by id", async () => {
        const definition = await client.getTaskDefinition(
            taskDefinitions[2].id,
            "1.0.0",
            ["Build"],
            false
        );
        expect(definition).toBe(taskDefinitions[2]);
    });

    it("fabricates a task definition for an unknown id", async () => {
        const definition = await client.getTaskDefinition(unmatchedId, "1.0.0");
        expect(definition.id).toBe(unmatchedId);
        expect(definition.definitionType).toBe("task");
    });

    it("lists every task definition or only the requested one", async () => {
        await expect(client.getTaskDefinitions()).resolves.toBe(taskDefinitions);
        const one = await client.getTaskDefinitions(taskDefinitions[1].id, ["Build"], false, true);
        expect(one).toEqual([taskDefinitions[1]]);
        await expect(client.getTaskDefinitions(unmatchedId)).resolves.toEqual([]);
    });

    it("makes a complete task definition", () => {
        const definition = makeTaskDefinition();
        expect(definition.agentExecution.execTask.name).toBe(definition.name);
        expect(definition.contributionIdentifier).toBe(`ms.vss-distributed-task.${definition.name}`);
        expect(definition.inputs[0].name).toBe("workingDirectory");
        expect(definition.restrictions.commands.mode).toBe(TaskCommandMode.Any);
        expect(definition.deprecated).toBe(false);
        expect(definition).toHaveProperty("deprecationMessage", "");
        expect(definition).toHaveProperty("retiredDate");
        expect(taskDefinitions.length).toBe(3);
        expect(new Set(taskDefinitions.map(d => d.name)).size).toBe(3);
    });
});
