import {
    DeploymentStatus,
    MailSectionType,
    ReleaseRestClient,
    ReleaseStatus
} from "azure-devops-extension-api/Release";

import { getClient } from "../azure-devops-extension-api";
import {
    approvals,
    definitionEnvironmentReferences,
    deployments,
    makeApproval,
    makeReleaseSettings,
    metrics,
    releaseChanges,
    releaseDefinitionEnvironmentSummaries,
    releaseDefinitionRevisions,
    releaseDefinitions,
    releaseProjects,
    releaseRevisions,
    releaseWorkItemRefs,
    releases,
    summaryMailSections
} from "../azure-devops-extension-api/release/Data";

const client = getClient(ReleaseRestClient);

const UNMATCHED_ID = Number.MAX_SAFE_INTEGER;

describe("ReleaseRestClient history, summaries and settings", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const cases: Array<[string, () => Promise<unknown>]> = [
        ["getApprovalHistory", () => client.getApprovalHistory("proj", approvals[0].id)],
        [
            "updateReleaseApprovals",
            () => client.updateReleaseApprovals([makeApproval()], "proj")
        ],
        ["getDefinitionEnvironments", () => client.getDefinitionEnvironments("proj")],
        [
            "getDefinitionEnvironmentsFiltered",
            () => client.getDefinitionEnvironments("proj", "group-1", ["prop"])
        ],
        ["getDefinitionRevision", () => client.getDefinitionRevision("proj", 11, 2)],
        ["getReleaseDefinitionHistory", () => client.getReleaseDefinitionHistory("proj", 11)],
        [
            "getReleaseDefinitionRevision",
            () => client.getReleaseDefinitionRevision("proj", 11, 2)
        ],
        [
            "getReleaseDefinitionSummary",
            () => client.getReleaseDefinitionSummary("proj", 11, 2)
        ],
        ["getReleaseHistory", () => client.getReleaseHistory("proj", 2001)],
        ["getReleaseRevision", () => client.getReleaseRevision("proj", 2001, 2)],
        ["getReleaseChanges", () => client.getReleaseChanges("proj", 2001)],
        [
            "getReleaseChangesWithTop",
            () => client.getReleaseChanges("proj", 2001, 2000, 2, "primary")
        ],
        ["getReleaseProjects", () => client.getReleaseProjects("Build", "source-1")],
        ["getReleaseWorkItemsRefs", () => client.getReleaseWorkItemsRefs("proj", 2001)],
        [
            "getReleaseWorkItemsRefsWithTop",
            () => client.getReleaseWorkItemsRefs("proj", 2001, 2000, 1, "primary")
        ],
        [
            "getDeploymentsForMultipleEnvironments",
            () =>
                client.getDeploymentsForMultipleEnvironments(
                    { deploymentStatus: DeploymentStatus.Succeeded } as any,
                    "proj"
                )
        ],
        ["getDeploymentBadge", () => client.getDeploymentBadge("proj", 11, 101)],
        [
            "getDeploymentBadgeWithBranch",
            () => client.getDeploymentBadge("proj", 11, 101, "refs/heads/main")
        ],
        ["getMetrics", () => client.getMetrics("proj")],
        ["getMetricsSince", () => client.getMetrics("proj", new Date("2024-01-01"))],
        ["getReleaseSettings", () => client.getReleaseSettings("proj")],
        [
            "updateReleaseSettings",
            () => client.updateReleaseSettings(makeReleaseSettings(), "proj")
        ],
        ["getPipelineReleaseSettings", () => client.getPipelineReleaseSettings("proj")],
        [
            "updatePipelineReleaseSettings",
            () => client.updatePipelineReleaseSettings({ enforceJobAuthScope: false }, "proj")
        ],
        ["getOrgPipelineReleaseSettings", () => client.getOrgPipelineReleaseSettings()],
        [
            "updateOrgPipelineReleaseSettings",
            () => client.updateOrgPipelineReleaseSettings({ orgEnforceJobAuthScope: false })
        ],
        [
            "undeleteReleaseDefinition",
            () => client.undeleteReleaseDefinition({ comment: "restore" }, "proj", 11)
        ],
        [
            "updateReleaseResource",
            () =>
                client.updateReleaseResource(
                    {
                        comment: "retag",
                        keepForever: true,
                        manualEnvironments: ["Production"],
                        name: "Release-9",
                        status: ReleaseStatus.Active
                    },
                    "proj",
                    releases[0].id
                )
        ],
        ["getSummaryMailSections", () => client.getSummaryMailSections("proj", 1)]
    ];

    it.each(cases)("%s resolves", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["deleteRelease", () => client.deleteRelease("proj", 1)],
        ["deleteReleaseWithComment", () => client.deleteRelease("proj", 1, "obsolete")],
        ["undeleteRelease", () => client.undeleteRelease("proj", 1, "restore")],
        [
            "sendSummaryMail",
            () =>
                client.sendSummaryMail(
                    { sections: [MailSectionType.Details], subject: "Release summary" } as any,
                    "proj",
                    1
                )
        ]
    ];

    it.each(voidCases)("%s resolves to undefined", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("returns the seeded approval for a known step id", async () => {
        const result = await client.getApprovalHistory("proj", approvals[1].id);
        expect(result).toBe(approvals[1]);
    });

    it("fabricates an approval for an unknown step id", async () => {
        const result = await client.getApprovalHistory("proj", UNMATCHED_ID);
        expect(result.id).toBe(UNMATCHED_ID);
    });

    it("echoes each approval passed to updateReleaseApprovals", async () => {
        const first = { ...makeApproval(), id: 4321, comments: "looks good" };
        const second = { ...makeApproval(), id: 8765, comments: "shipping" };
        const result = await client.updateReleaseApprovals([first, second], "proj");
        expect(result.map(approval => approval.id)).toEqual([4321, 8765]);
        expect(result.map(approval => approval.comments)).toEqual(["looks good", "shipping"]);
    });

    it("lists every seeded definition environment reference", async () => {
        const result = await client.getDefinitionEnvironments("proj");
        expect(result).toHaveLength(definitionEnvironmentReferences.length);
        expect(result.map(reference => reference.definitionEnvironmentId)).toEqual([
            101, 102, 103
        ]);
    });

    it("builds a definition revision string from its arguments", async () => {
        await expect(client.getDefinitionRevision("proj", 11, 7)).resolves.toBe(
            "definition 11 revision 7"
        );
    });

    it("builds a release definition revision string from its arguments", async () => {
        await expect(client.getReleaseDefinitionRevision("proj", 12, 3)).resolves.toBe(
            "release definition 12 revision 3"
        );
    });

    it("returns only the revisions of a known definition", async () => {
        const result = await client.getReleaseDefinitionHistory("proj", 12);
        expect(result).toHaveLength(1);
        expect(result[0].revision).toBe(1);
    });

    it("falls back to every revision for an unknown definition", async () => {
        const result = await client.getReleaseDefinitionHistory("proj", UNMATCHED_ID);
        expect(result).toHaveLength(releaseDefinitionRevisions.length);
    });

    it("limits the summary releases to the requested count", async () => {
        const result = await client.getReleaseDefinitionSummary("proj", 11, 2);
        expect(result.releases).toHaveLength(2);
        expect(result.releases[0]).toBe(releases[0]);
        expect(result.releaseDefinition.id).toBe(11);
        expect(result.environments).toHaveLength(releaseDefinitionEnvironmentSummaries.length);
    });

    it("filters the summary environments when ids are supplied", async () => {
        const result = await client.getReleaseDefinitionSummary("proj", 11, 1, true, [102]);
        expect(result.environments).toHaveLength(1);
        expect(result.environments[0].id).toBe(102);
        expect(result.environments[0].lastReleases.map(release => release.id)).toEqual([
            1020, 1021
        ]);
    });

    it("returns only the revisions of a known release", async () => {
        const result = await client.getReleaseHistory("proj", 2002);
        expect(result).toHaveLength(1);
        expect(result[0].definitionSnapshotRevision).toBe(1);
    });

    it("falls back to every revision for an unknown release", async () => {
        const result = await client.getReleaseHistory("proj", UNMATCHED_ID);
        expect(result).toHaveLength(releaseRevisions.length);
    });

    it("builds a release revision string from its arguments", async () => {
        await expect(client.getReleaseRevision("proj", 2001, 5)).resolves.toBe(
            "release 2001 revision 5"
        );
    });

    it("returns every change when top is omitted", async () => {
        const result = await client.getReleaseChanges("proj", 2001);
        expect(result.map(change => change.id)).toEqual([
            "change-1",
            "change-2",
            "change-3"
        ]);
    });

    it("caps the changes at top", async () => {
        const result = await client.getReleaseChanges("proj", 2001, 2000, 1, "primary");
        expect(result.map(change => change.id)).toEqual(["change-1"]);
    });

    it("returns every work item ref when top is omitted", async () => {
        const result = await client.getReleaseWorkItemsRefs("proj", 2001);
        expect(result).toHaveLength(releaseWorkItemRefs.length);
    });

    it("caps the work item refs at top", async () => {
        const result = await client.getReleaseWorkItemsRefs("proj", 2001, 2000, 2, "primary");
        expect(result.map(ref => ref.id)).toEqual(["501", "502"]);
    });

    it("lists the seeded release projects", async () => {
        const result = await client.getReleaseProjects("Build", "source-1");
        expect(result.map(project => project.id)).toEqual(
            releaseProjects.map(project => project.id)
        );
    });

    it("matches deployments on the queried status", async () => {
        const result = await client.getDeploymentsForMultipleEnvironments(
            { deploymentStatus: DeploymentStatus.Succeeded } as any,
            "proj"
        );
        expect(result).toHaveLength(deployments.length);
    });

    it("returns no deployments for a status nothing was seeded with", async () => {
        const result = await client.getDeploymentsForMultipleEnvironments(
            { deploymentStatus: DeploymentStatus.Failed } as any,
            "proj"
        );
        expect(result).toEqual([]);
    });

    it("builds a deployment badge without a branch", async () => {
        await expect(client.getDeploymentBadge("proj", 11, 101)).resolves.toBe(
            "proj/11/101 succeeded"
        );
    });

    it("builds a deployment badge scoped to a branch", async () => {
        await expect(
            client.getDeploymentBadge("proj", 11, 101, "refs/heads/main")
        ).resolves.toBe("proj/11/101/refs/heads/main succeeded");
    });

    it("lists the seeded metrics", async () => {
        const result = await client.getMetrics("proj");
        expect(result).toHaveLength(metrics.length);
        expect(result.map(metric => metric.name)).toEqual([
            "TotalReleases",
            "ActiveReleases",
            "FailedDeployments"
        ]);
        expect(result[0].value).toBe(42);
    });

    it("returns the pinned release settings", async () => {
        const result = await client.getReleaseSettings("proj");
        expect(result.complianceSettings.checkForCredentialsAndOtherSecrets).toBe(true);
        expect(result.retentionSettings.daysToKeepDeletedReleases).toBe(30);
        expect(result.retentionSettings.maximumEnvironmentRetentionPolicy.releasesToKeep).toBe(
            100
        );
    });

    it("echoes the release settings sent for update", async () => {
        const result = await client.updateReleaseSettings(
            {
                complianceSettings: { checkForCredentialsAndOtherSecrets: false },
                retentionSettings: {
                    daysToKeepDeletedReleases: 7,
                    defaultEnvironmentRetentionPolicy: {
                        daysToKeep: 5,
                        releasesToKeep: 1,
                        retainBuild: false
                    },
                    maximumEnvironmentRetentionPolicy: {
                        daysToKeep: 50,
                        releasesToKeep: 10,
                        retainBuild: false
                    }
                }
            },
            "proj"
        );
        expect(result.complianceSettings.checkForCredentialsAndOtherSecrets).toBe(false);
        expect(result.retentionSettings.daysToKeepDeletedReleases).toBe(7);
    });

    it("returns the pinned project pipeline release settings", async () => {
        const result = await client.getPipelineReleaseSettings("proj");
        expect(result.enforceJobAuthScope).toBe(true);
        expect(result.publicProject).toBe(false);
    });

    it("maps the project pipeline update parameter onto the settings", async () => {
        const result = await client.updatePipelineReleaseSettings(
            { enforceJobAuthScope: false },
            "proj"
        );
        expect(result.enforceJobAuthScope).toBe(false);
        expect(result.hasManageSettingsPermission).toBe(true);
    });

    it("returns the pinned org pipeline release settings", async () => {
        const result = await client.getOrgPipelineReleaseSettings();
        expect(result.orgEnforceJobAuthScope).toBe(true);
        expect(result.hasManagePipelinePoliciesPermission).toBe(true);
    });

    it("maps the org pipeline update parameter onto the settings", async () => {
        const result = await client.updateOrgPipelineReleaseSettings({
            orgEnforceJobAuthScope: false
        });
        expect(result.orgEnforceJobAuthScope).toBe(false);
        expect(result.hasManagePipelinePoliciesPermission).toBe(true);
    });

    it("undeletes a seeded release definition", async () => {
        const seeded = releaseDefinitions[0];
        const result = await client.undeleteReleaseDefinition(
            { comment: "brought back" },
            "proj",
            seeded.id
        );
        expect(result.id).toBe(seeded.id);
        expect(result.name).toBe(seeded.name);
        expect(result.comment).toBe("brought back");
        expect(result.isDeleted).toBe(false);
    });

    it("undeletes an unknown release definition", async () => {
        const result = await client.undeleteReleaseDefinition(
            { comment: "fabricated" },
            "proj",
            UNMATCHED_ID
        );
        expect(result.id).toBe(UNMATCHED_ID);
        expect(result.comment).toBe("fabricated");
    });

    it("maps the update metadata onto a seeded release", async () => {
        const seeded = releases[1];
        const result = await client.updateReleaseResource(
            {
                comment: "patched",
                keepForever: true,
                manualEnvironments: ["Production"],
                name: "Release-42",
                status: ReleaseStatus.Abandoned
            },
            "proj",
            seeded.id
        );
        expect(result.id).toBe(seeded.id);
        expect(result.description).toBe(seeded.description);
        expect(result.comment).toBe("patched");
        expect(result.keepForever).toBe(true);
        expect(result.name).toBe("Release-42");
        expect(result.status).toBe(ReleaseStatus.Abandoned);
    });

    it("maps the update metadata onto a fabricated release", async () => {
        const result = await client.updateReleaseResource(
            {
                comment: "created",
                keepForever: false,
                manualEnvironments: [],
                name: "Release-99",
                status: ReleaseStatus.Draft
            },
            "proj",
            UNMATCHED_ID
        );
        expect(result.id).toBe(UNMATCHED_ID);
        expect(result.name).toBe("Release-99");
        expect(result.status).toBe(ReleaseStatus.Draft);
    });

    it("lists the seeded summary mail sections", async () => {
        const result = await client.getSummaryMailSections("proj", 1);
        expect(result).toHaveLength(summaryMailSections.length);
        expect(result.map(section => section.sectionType)).toEqual([
            MailSectionType.Details,
            MailSectionType.Environments,
            MailSectionType.WorkItems
        ]);
        expect(result.map(section => section.rank)).toEqual([1, 2, 3]);
    });
});
