import { ManualInterventionStatus, ReleaseRestClient } from "azure-devops-extension-api/Release";

import { getClient } from "../azure-devops-extension-api";
import {
    makeArtifact,
    makeInputValuesQuery,
    manualInterventions,
    taskAttachments
} from "../azure-devops-extension-api/release/Data";

const client = getClient(ReleaseRestClient);

const decode = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);

describe("ReleaseRestClient artifacts, logs, tasks and manual interventions", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getAgentArtifactDefinitions", () => client.getAgentArtifactDefinitions("proj", 1)],
        ["getArtifactTypeDefinitions", () => client.getArtifactTypeDefinitions("proj")],
        ["getArtifactVersions", () => client.getArtifactVersions("proj", 1)],
        [
            "getArtifactVersionsForSources",
            () => client.getArtifactVersionsForSources([makeArtifact("primary")], "proj")
        ],
        ["getSourceBranches", () => client.getSourceBranches("proj", 1)],
        ["getLog", () => client.getLog("proj", 1, 2, 3)],
        ["getLogWithAttempt", () => client.getLog("proj", 1, 2, 3, 4)],
        ["getLogs", () => client.getLogs("proj", 1)],
        ["getGateLog", () => client.getGateLog("proj", 1, 2, 3, 4)],
        ["getTaskLog", () => client.getTaskLog("proj", 1, 2, 3, 4)],
        ["getTaskLogWithRange", () => client.getTaskLog("proj", 1, 2, 3, 4, 1, 50)],
        ["getTasks", () => client.getTasks("proj", 1, 2)],
        ["getTasksWithAttempt", () => client.getTasks("proj", 1, 2, 3)],
        ["getTasksForTaskGroup", () => client.getTasksForTaskGroup("proj", 1, 2, 3)],
        [
            "getReleaseTaskAttachmentContent",
            () =>
                client.getReleaseTaskAttachmentContent(
                    "proj",
                    1,
                    2,
                    3,
                    "plan-1",
                    "timeline-1",
                    "record-1",
                    "logs",
                    "output.txt"
                )
        ],
        [
            "getReleaseTaskAttachments",
            () => client.getReleaseTaskAttachments("proj", 1, 2, 3, "plan-1", "logs")
        ],
        [
            "getTaskAttachmentContent",
            () =>
                client.getTaskAttachmentContent(
                    "proj",
                    1,
                    2,
                    3,
                    "timeline-1",
                    "record-1",
                    "logs",
                    "output.txt"
                )
        ],
        ["getTaskAttachments", () => client.getTaskAttachments("proj", 1, 2, 3, "timeline-1", "logs")],
        [
            "getManualIntervention",
            () => client.getManualIntervention("proj", 1, manualInterventions[0].id)
        ],
        ["getManualInterventions", () => client.getManualInterventions("proj", 1)],
        [
            "updateManualIntervention",
            () =>
                client.updateManualIntervention(
                    { comment: "approved", status: ManualInterventionStatus.Approved },
                    "proj",
                    1,
                    manualInterventions[0].id
                )
        ],
        [
            "updateGates",
            () => client.updateGates({ comment: "skip", gatesToIgnore: ["gate-a"] }, "proj", 7)
        ],
        ["getIssues", () => client.getIssues("proj", 10)],
        ["getIssuesWithSource", () => client.getIssues("proj", 10, "source-1")],
        [
            "getAutoTriggerIssues",
            () => client.getAutoTriggerIssues("Build", "source-1", "version-1")
        ],
        [
            "getAutoTriggerIssuesWithProject",
            () => client.getAutoTriggerIssues("Build", "source-1", "version-1", "proj")
        ],
        ["getInputValues", () => client.getInputValues(makeInputValuesQuery(), "proj")]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it("returns the seeded manual intervention for a known id", async () => {
        const intervention = await client.getManualIntervention("proj", 1, manualInterventions[1].id);
        expect(intervention).toBe(manualInterventions[1]);
    });

    it("fabricates a manual intervention for an unknown id", async () => {
        const intervention = await client.getManualIntervention("proj", 1, -1);
        expect(intervention.id).toBe(-1);
        expect(manualInterventions).not.toContain(intervention);
    });

    it("echoes the requested status on a known manual intervention", async () => {
        const updated = await client.updateManualIntervention(
            { comment: "rejecting", status: ManualInterventionStatus.Rejected },
            "proj",
            1,
            manualInterventions[2].id
        );
        expect(updated.id).toBe(manualInterventions[2].id);
        expect(updated.comments).toBe("rejecting");
        expect(updated.status).toBe(ManualInterventionStatus.Rejected);
    });

    it("echoes the requested status on an unknown manual intervention", async () => {
        const updated = await client.updateManualIntervention(
            { comment: "canceling", status: ManualInterventionStatus.Canceled },
            "proj",
            1,
            -2
        );
        expect(updated.id).toBe(-2);
        expect(updated.status).toBe(ManualInterventionStatus.Canceled);
    });

    it("filters task attachments by type", async () => {
        const attachments = await client.getTaskAttachments("proj", 1, 2, 3, "timeline-1", "summary");
        expect(attachments).toHaveLength(1);
        expect(attachments[0].type).toBe("summary");
    });

    it("falls back to every task attachment for an unknown type", async () => {
        const attachments = await client.getTaskAttachments("proj", 1, 2, 3, "timeline-1", "none");
        expect(attachments).toHaveLength(taskAttachments.length);
    });

    it("filters release task attachments by type", async () => {
        const attachments = await client.getReleaseTaskAttachments("proj", 1, 2, 3, "plan-1", "logs");
        expect(attachments).toHaveLength(2);
    });

    it("falls back to every release task attachment for an unknown type", async () => {
        const attachments = await client.getReleaseTaskAttachments("proj", 1, 2, 3, "plan-1", "none");
        expect(attachments).toHaveLength(taskAttachments.length);
    });

    it("maps ignored gates from the update metadata", async () => {
        const gates = await client.updateGates(
            { comment: "skip", gatesToIgnore: ["gate-a", "gate-b"] },
            "proj",
            42
        );
        expect(gates.id).toBe(42);
        expect(gates.ignoredGates.map(gate => gate.name)).toEqual(["gate-a", "gate-b"]);
    });

    it("returns one artifact version per requested source", async () => {
        const result = await client.getArtifactVersionsForSources(
            [makeArtifact("primary"), makeArtifact("secondary")],
            "proj"
        );
        expect(result.artifactVersions.map(version => version.alias)).toEqual([
            "primary",
            "secondary"
        ]);
    });

    it("echoes the caller input values query", async () => {
        const query = { ...makeInputValuesQuery(), currentValues: { definitionId: "echoed" } };
        const result = await client.getInputValues(query, "proj");
        expect(result.currentValues.definitionId).toBe("echoed");
        expect(result.inputValues).toBe(query.inputValues);
    });

    it("encodes release logs and attachment content", async () => {
        expect(decode(await client.getLogs("proj", 9))).toBe("release-9-logs");
        expect(
            decode(
                await client.getTaskAttachmentContent(
                    "proj",
                    9,
                    2,
                    3,
                    "timeline-1",
                    "record-1",
                    "logs",
                    "out.txt"
                )
            )
        ).toBe("task-9-record-1-out.txt");
        expect(
            decode(
                await client.getReleaseTaskAttachmentContent(
                    "proj",
                    9,
                    2,
                    3,
                    "plan-1",
                    "timeline-1",
                    "record-1",
                    "logs",
                    "out.txt"
                )
            )
        ).toBe("release-9-record-1-out.txt");
    });

    it("includes the identifiers in the log text", async () => {
        expect(await client.getLog("proj", 1, 2, 3)).toContain("task 3");
        expect(await client.getGateLog("proj", 1, 2, 5, 3)).toContain("gate 5");
        expect(await client.getTaskLog("proj", 1, 2, 6, 3)).toContain("phase 6");
    });
});
