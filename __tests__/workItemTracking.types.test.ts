import {
    WorkItemTrackingRestClient,
    ProvisioningActionType,
    QueryOption,
    ReportingRevisionsExpand,
    TemplateType,
    WorkItemErrorPolicy,
    WorkItemExpand,
    WorkItemTypeFieldsExpandLevel
} from "azure-devops-extension-api/WorkItemTracking";
import { getClient } from "../azure-devops-extension-api";
import {
    relationTypes,
    revisions,
    stateColors,
    typeFields,
    workArtifactLinkTypes,
    workItemIcons,
    workItemTypes
} from "../azure-devops-extension-api/workItemTracking/Data";

describe("WorkItemTrackingRestClient types, icons and reporting", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const client = getClient(WorkItemTrackingRestClient);
    const updateModel = {
        actionType: ProvisioningActionType.Import,
        methodology: "Agile",
        template: "<WITD />",
        templateType: TemplateType.WorkItemType
    };
    const batchRequest = {
        $expand: WorkItemExpand.All,
        asOf: new Date("2024-01-01T00:00:00.000Z"),
        errorPolicy: WorkItemErrorPolicy.Omit,
        fields: ["System.Title"],
        ids: [11, 12, 13]
    };
    const revisionsFilter = {
        fields: ["System.Title"],
        includeDeleted: false,
        includeIdentityRef: true,
        includeLatestOnly: false,
        includeTagRef: true,
        types: ["Bug"]
    };
    const mailBody = {
        fields: ["System.Title"],
        ids: [1, 2],
        message: {
            body: "<p>hello</p>",
            cc: { emailAddresses: [], tfIds: [] },
            inReplyTo: "",
            messageId: "m1",
            replyTo: { emailAddresses: [], tfIds: [] },
            subject: "Report",
            to: { emailAddresses: ["dev@contoso.com"], tfIds: [] }
        },
        persistenceId: "p1",
        projectId: "proj",
        sortFields: ["System.Id"],
        tempQueryId: "q1",
        wiql: "SELECT [System.Id] FROM WorkItems"
    } as any;

    const valueCases: Array<[string, () => Promise<unknown>]> = [
        ["exportWorkItemTypeDefinition", () => client.exportWorkItemTypeDefinition("proj", "Bug", true)],
        ["updateWorkItemTypeDefinition", () => client.updateWorkItemTypeDefinition(updateModel, "proj")],
        ["getWorkItemTypeCategory", () => client.getWorkItemTypeCategory("proj", "Bug Category")],
        ["getWorkItemTypeColors", () => client.getWorkItemTypeColors(["proj", "other"])],
        ["getWorkItemTypeColorAndIcons", () => client.getWorkItemTypeColorAndIcons(["proj", "other"])],
        ["getWorkItemTypeFieldsWithReferences", () => client.getWorkItemTypeFieldsWithReferences("proj", "Bug", WorkItemTypeFieldsExpandLevel.All)],
        ["getWorkItemTypeFieldWithReferences", () => client.getWorkItemTypeFieldWithReferences("proj", "Bug", "System.Title", WorkItemTypeFieldsExpandLevel.All)],
        ["getWorkItemTypeStates", () => client.getWorkItemTypeStates("proj", "Bug")],
        ["getWorkItemIconJson", () => client.getWorkItemIconJson(workItemIcons[0].id, "ff0000", 1)],
        ["getWorkItemIconSvg", () => client.getWorkItemIconSvg("icon_bug", "ff0000", 1)],
        ["getWorkItemIconXaml", () => client.getWorkItemIconXaml("icon_bug", "ff0000", 1)],
        ["getWorkItemIcons", () => client.getWorkItemIcons()],
        ["getWorkItemNextStatesOnCheckinAction", () => client.getWorkItemNextStatesOnCheckinAction([1, 2], "resolve")],
        ["getWorkItemStateColors", () => client.getWorkItemStateColors(["proj", "other"])],
        ["getWorkItemsBatch", () => client.getWorkItemsBatch(batchRequest, "proj")],
        ["getRelationType", () => client.getRelationType(relationTypes[0].referenceName)],
        ["getRelationTypes", () => client.getRelationTypes()],
        ["getWorkArtifactLinkTypes", () => client.getWorkArtifactLinkTypes()],
        ["queryWorkItemsForArtifactUris", () => client.queryWorkItemsForArtifactUris({ artifactUris: ["vstfs:///Git/Commit/1", "vstfs:///Build/Build/2"] }, "proj")],
        ["getReportingLinksByLinkType", () => client.getReportingLinksByLinkType("proj", [relationTypes[0].referenceName], ["Bug"], "token-1", new Date("2024-01-01T00:00:00.000Z"))],
        ["readReportingRevisionsGet", () => client.readReportingRevisionsGet("proj", ["System.Title"], ["Bug"], "token-1", new Date("2024-01-01T00:00:00.000Z"), true, false, true, false, ReportingRevisionsExpand.Fields, false, 2)],
        ["readReportingRevisionsPost", () => client.readReportingRevisionsPost(revisionsFilter, "proj", "token-1", new Date("2024-01-01T00:00:00.000Z"), ReportingRevisionsExpand.Fields)],
        ["getAccountMyWorkData", () => client.getAccountMyWorkData(QueryOption.Doing)],
        ["getRecentActivityData", () => client.getRecentActivityData()],
        ["getRecentMentions", () => client.getRecentMentions()]
    ];

    const voidCases: Array<[string, () => Promise<void>]> = [
        ["sendMail", () => client.sendMail(mailBody, "proj")]
    ];

    it.each(valueCases)("%s resolves a value", async (_name, call) => {
        await expect(call()).resolves.toBeDefined();
    });

    it.each(voidCases)("%s resolves void", async (_name, call) => {
        await expect(call()).resolves.toBeUndefined();
    });

    it("exports a type definition from the given arguments", async () => {
        const template = await client.exportWorkItemTypeDefinition("proj", "Task", true);
        expect(template.template).toBe('<WITD type="Task" globalLists="true" />');
    });

    it("exports a type definition with defaults", async () => {
        const template = await client.exportWorkItemTypeDefinition();
        expect(template.template).toBe('<WITD type="Bug" globalLists="false" />');
    });

    it("echoes the update model into provisioning events", async () => {
        const result = await client.updateWorkItemTypeDefinition(updateModel, "proj");
        expect(result.provisioningImportEvents).toEqual([
            `actionType:${ProvisioningActionType.Import}`,
            `templateType:${TemplateType.WorkItemType}`,
            "methodology:Agile"
        ]);
    });

    it("finds a category by name", async () => {
        const category = await client.getWorkItemTypeCategory("proj", "Bug Category");
        expect(category.referenceName).toBe("Microsoft.VSTS.WorkItemTypes.BugCategory");
    });

    it("finds a category by reference name", async () => {
        const category = await client.getWorkItemTypeCategory("proj", "Microsoft.VSTS.WorkItemTypes.TaskCategory");
        expect(category.name).toBe("Task Category");
    });

    it("fabricates an unknown category", async () => {
        const category = await client.getWorkItemTypeCategory("proj", "Nope");
        expect(category.name).toBe("Nope");
        expect(category.referenceName).toBe("Microsoft.VSTS.WorkItemTypes.NopeCategory");
        expect(category.defaultWorkItemType.name).toBe("Bug");
        expect(category.workItemTypes).toHaveLength(1);
    });

    it("returns one colour entry per project", async () => {
        const colors = await client.getWorkItemTypeColors(["alpha", "beta"]);
        expect(colors.map(entry => entry.key)).toEqual(["alpha", "beta"]);
        expect(colors[0].value.map(v => v.workItemTypeName)).toEqual(workItemTypes.map(t => t.name));
    });

    it("returns one colour and icon entry per project", async () => {
        const colors = await client.getWorkItemTypeColorAndIcons(["alpha"]);
        expect(colors).toHaveLength(1);
        expect(colors[0].key).toBe("alpha");
        expect(colors[0].value.map(v => v.workItemTypeName)).toEqual(workItemTypes.map(t => t.name));
        expect(colors[0].value[0].icon).toBe("icon_bug");
    });

    it("strips allowed and dependent fields when expand is none", async () => {
        const result = await client.getWorkItemTypeFieldsWithReferences("proj", "Bug", WorkItemTypeFieldsExpandLevel.None);
        expect(result).toHaveLength(typeFields.length);
        expect(result.every(f => f.allowedValues.length === 0 && f.dependentFields.length === 0)).toBe(true);
    });

    it("keeps allowed values when expand is omitted", async () => {
        const result = await client.getWorkItemTypeFieldsWithReferences("proj", "Bug");
        expect(result).toEqual(typeFields);
        expect(result[0].allowedValues.length).toBeGreaterThan(0);
    });

    it("finds a type field by reference name", async () => {
        const field = await client.getWorkItemTypeFieldWithReferences("proj", "Bug", "System.Title");
        expect(field.referenceName).toBe("System.Title");
    });

    it("finds a type field by name", async () => {
        const field = await client.getWorkItemTypeFieldWithReferences("proj", "Bug", "State");
        expect(field.referenceName).toBe("System.State");
    });

    it("fabricates an unknown type field", async () => {
        const field = await client.getWorkItemTypeFieldWithReferences("proj", "Bug", "Custom.Nope", WorkItemTypeFieldsExpandLevel.None);
        expect(field.referenceName).toBe("Custom.Nope");
        expect(field.name).toBe("Nope");
        expect(field.allowedValues.length).toBeGreaterThan(0);
    });

    it("returns the seeded state colours", async () => {
        await expect(client.getWorkItemTypeStates("proj", "Bug")).resolves.toEqual(stateColors);
    });

    it("finds a known icon", async () => {
        const icon = await client.getWorkItemIconJson(workItemIcons[1].id);
        expect(icon).toEqual(workItemIcons[1]);
    });

    it("fabricates an unknown icon", async () => {
        const icon = await client.getWorkItemIconJson("icon_missing");
        expect(icon.id).toBe("icon_missing");
        expect(icon.url).toEqual(expect.any(String));
    });

    it("renders svg with the given colour", async () => {
        await expect(client.getWorkItemIconSvg("icon_bug", "ff0000", 2)).resolves.toBe(
            '<svg role="img" data-icon="icon_bug" fill="ff0000"><title>icon_bug</title></svg>'
        );
    });

    it("renders svg with the default colour", async () => {
        await expect(client.getWorkItemIconSvg("icon_bug")).resolves.toBe(
            '<svg role="img" data-icon="icon_bug" fill="000000"><title>icon_bug</title></svg>'
        );
    });

    it("renders xaml with the given colour", async () => {
        await expect(client.getWorkItemIconXaml("icon_bug", "00ff00", 2)).resolves.toBe(
            '<Canvas Tag="icon_bug"><Path Fill="00ff00" Data="M0,0 L16,16 Z" /></Canvas>'
        );
    });

    it("renders xaml with the default colour", async () => {
        await expect(client.getWorkItemIconXaml("icon_bug")).resolves.toBe(
            '<Canvas Tag="icon_bug"><Path Fill="000000" Data="M0,0 L16,16 Z" /></Canvas>'
        );
    });

    it("returns the seeded icon list", async () => {
        await expect(client.getWorkItemIcons()).resolves.toEqual(workItemIcons);
    });

    it("names the given checkin action", async () => {
        const next = await client.getWorkItemNextStatesOnCheckinAction([5, 6], "resolve");
        expect(next.map(n => n.id)).toEqual([5, 6]);
        expect(next[0].message).toBe("Next state on resolve");
    });

    it("names the default checkin action", async () => {
        const next = await client.getWorkItemNextStatesOnCheckinAction([7]);
        expect(next[0].message).toBe("Next state on checkin");
    });

    it("returns state colours per project", async () => {
        const colors = await client.getWorkItemStateColors(["alpha", "beta"]);
        expect(colors.map(c => c.projectName)).toEqual(["alpha", "beta"]);
        expect(colors[0].workItemTypeStateColors.map(c => c.workItemTypeName)).toEqual(
            workItemTypes.map(t => t.name)
        );
        expect(colors[0].workItemTypeStateColors[0].stateColors.map(s => s.name)).toEqual(
            stateColors.map(s => s.name)
        );
    });

    it("returns one work item per requested id in a batch", async () => {
        const items = await client.getWorkItemsBatch(batchRequest, "proj");
        expect(items.map(item => item.id)).toEqual(batchRequest.ids);
    });

    it("finds a relation type by reference name", async () => {
        const relation = await client.getRelationType(relationTypes[0].referenceName);
        expect(relation).toEqual(relationTypes[0]);
    });

    it("finds a relation type by name", async () => {
        const relation = await client.getRelationType("Related");
        expect(relation.referenceName).toBe("System.LinkTypes.Related");
    });

    it("fabricates an unknown relation type", async () => {
        const relation = await client.getRelationType("Custom.LinkTypes.Blocks");
        expect(relation.referenceName).toBe("Custom.LinkTypes.Blocks");
        expect(relation.name).toBe("Blocks");
    });

    it("returns the seeded relation and artifact link types", async () => {
        await expect(client.getRelationTypes()).resolves.toEqual(relationTypes);
        await expect(client.getWorkArtifactLinkTypes()).resolves.toEqual(workArtifactLinkTypes);
    });

    it("maps every requested artifact uri to a work item reference", async () => {
        const uris = ["vstfs:///Git/Commit/1", "vstfs:///Build/Build/2"];
        const result = await client.queryWorkItemsForArtifactUris({ artifactUris: uris }, "proj");
        expect(Object.keys(result.artifactUrisQueryResult)).toEqual(uris);
        expect(result.artifactUrisQueryResult[uris[0]]).toHaveLength(1);
    });

    it("returns an empty artifact query result for no uris", async () => {
        const result = await client.queryWorkItemsForArtifactUris({ artifactUris: [] });
        expect(result.artifactUrisQueryResult).toEqual({});
    });

    it("returns every relation when link types are omitted", async () => {
        const batch = await client.getReportingLinksByLinkType();
        expect(batch.values.map(v => v.rel)).toEqual(relationTypes.map(t => t.referenceName));
        expect(batch.continuationToken).toBe("links-1");
        expect(batch.isLastBatch).toBe(true);
    });

    it("filters relations by link type", async () => {
        const batch = await client.getReportingLinksByLinkType(
            "proj",
            [relationTypes[0].referenceName],
            ["Bug"],
            "links-99",
            new Date("2024-01-01T00:00:00.000Z")
        );
        expect(batch.values.map(v => v.rel)).toEqual([relationTypes[0].referenceName]);
        expect(batch.continuationToken).toBe("links-99");
    });

    it("returns every revision by default", async () => {
        const batch = await client.readReportingRevisionsGet();
        expect(batch.values).toHaveLength(revisions.length);
        expect(batch.isLastBatch).toBe(true);
        expect(batch.continuationToken).toBe("revisions-1");
    });

    it("returns only the latest revision when asked", async () => {
        const batch = await client.readReportingRevisionsGet(
            "proj", ["System.Title"], ["Bug"], undefined, undefined,
            true, false, true, true, ReportingRevisionsExpand.Fields, false
        );
        expect(batch.values).toHaveLength(1);
        expect(batch.values[0].rev).toBe(revisions[revisions.length - 1].rev);
        expect(batch.isLastBatch).toBe(true);
    });

    it("pages revisions with a max page size", async () => {
        const batch = await client.readReportingRevisionsGet(
            "proj", undefined, undefined, "revisions-7", undefined,
            undefined, undefined, undefined, false, undefined, undefined, 2
        );
        expect(batch.values).toHaveLength(2);
        expect(batch.isLastBatch).toBe(false);
        expect(batch.continuationToken).toBe("revisions-7");
    });

    it("forwards the post filter to the get implementation", async () => {
        const batch = await client.readReportingRevisionsPost(
            { ...revisionsFilter, includeLatestOnly: true },
            "proj",
            "revisions-post",
            new Date("2024-01-01T00:00:00.000Z"),
            ReportingRevisionsExpand.Fields
        );
        expect(batch.values).toHaveLength(1);
        expect(batch.continuationToken).toBe("revisions-post");
    });

    it("returns all my work items by default", async () => {
        const result = await client.getAccountMyWorkData();
        expect(result.querySizeLimitExceeded).toBe(false);
        expect(result.workItemDetails.map(item => item.id)).toEqual([30_001, 30_002, 30_003]);
    });

    it("returns only closed work items for the done option", async () => {
        const result = await client.getAccountMyWorkData(QueryOption.Done);
        expect(result.workItemDetails.map(item => item.id)).toEqual([30_002]);
    });

    it("returns the seeded recent activity and mentions", async () => {
        const activity = await client.getRecentActivityData();
        const mentions = await client.getRecentMentions();
        expect(activity.map(a => a.id)).toEqual([31_001, 31_002, 31_003]);
        expect(mentions.map(m => m.id)).toEqual([32_001, 32_002]);
    });
});
