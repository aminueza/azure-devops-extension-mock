import {
    AddProcessWorkItemTypeFieldRequest,
    CreateProcessRuleRequest,
    CustomizationType,
    FieldType,
    PickList,
    ProcessWorkItemTypeFieldsExpandLevel,
    RuleActionType,
    RuleConditionType,
    WorkItemStateInputModel,
    WorkItemTrackingProcessRestClient
} from "azure-devops-extension-api/WorkItemTrackingProcess";
import { getClient } from "../azure-devops-extension-api";
import {
    AGILE_PROCESS_ID,
    fields,
    lists,
    makePickList,
    makePickListMetadata,
    makeProcessRule,
    makeProcessWorkItemTypeField,
    makeRuleAction,
    makeRuleCondition,
    makeWorkItemStateResultModel,
    rules,
    states
} from "../azure-devops-extension-api/workItemTrackingProcess/Data";

const BUG = "Microsoft.VSTS.WorkItemTypes.Bug";
const PRIORITY = "Microsoft.VSTS.Common.Priority";

describe("WorkItemTrackingProcessRestClient mock fields, lists, rules and states", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(WorkItemTrackingProcessRestClient);

    describe("fields", () => {
        it("adds a known field echoing the posted request", async () => {
            const posted: AddProcessWorkItemTypeFieldRequest = {
                allowedValues: ["1", "2"],
                allowGroups: false,
                defaultValue: "1",
                readOnly: true,
                referenceName: PRIORITY,
                required: true
            };
            const added = await client.addFieldToWorkItemType(posted, AGILE_PROCESS_ID, BUG);
            expect(added).toMatchObject(posted);
            expect(added.name).toBe("Priority");
            expect(added.type).toBe(FieldType.Integer);
            expect(fields[3].readOnly).toBe(false);
        });

        it("adds an unknown field", async () => {
            const added = await client.addFieldToWorkItemType(
                { referenceName: "Custom.Missing", required: true } as AddProcessWorkItemTypeFieldRequest,
                AGILE_PROCESS_ID,
                BUG
            );
            expect(added.referenceName).toBe("Custom.Missing");
            expect(added.required).toBe(true);
            expect(added.customization).toBe(CustomizationType.Custom);
            expect(added.allowedValues).toEqual([]);
        });

        it("lists every field without allowed values", async () => {
            const list = await client.getAllWorkItemTypeFields(AGILE_PROCESS_ID, BUG);
            expect(list.map(f => f.referenceName)).toEqual(fields.map(f => f.referenceName));
            expect(new Set(list.map(f => f.referenceName)).size).toBe(list.length);
            expect(list.every(f => f.allowedValues === undefined)).toBe(true);
            expect(fields[3].allowedValues).toEqual([1, 2, 3, 4]);
        });

        it("gets a known field without allowed values", async () => {
            const field = await client.getWorkItemTypeField(AGILE_PROCESS_ID, BUG, PRIORITY);
            expect(field.name).toBe("Priority");
            expect(field.defaultValue).toBe(2);
            expect(field.allowedValues).toBeUndefined();
        });

        it("gets a known field without allowed values when asked for none", async () => {
            const field = await client.getWorkItemTypeField(
                AGILE_PROCESS_ID,
                BUG,
                PRIORITY,
                ProcessWorkItemTypeFieldsExpandLevel.None
            );
            expect(field.allowedValues).toBeUndefined();
        });

        it("gets a known field with allowed values", async () => {
            const field = await client.getWorkItemTypeField(
                AGILE_PROCESS_ID,
                BUG,
                PRIORITY,
                ProcessWorkItemTypeFieldsExpandLevel.AllowedValues
            );
            expect(field).toBe(fields[3]);
            expect(field.allowedValues).toEqual([1, 2, 3, 4]);
        });

        it("gets a known field fully expanded", async () => {
            const field = await client.getWorkItemTypeField(
                AGILE_PROCESS_ID,
                BUG,
                fields[4].referenceName,
                ProcessWorkItemTypeFieldsExpandLevel.All
            );
            expect(field).toBe(fields[4]);
            expect(field.type).toBe(FieldType.PicklistString);
            expect(field.allowedValues).toEqual(["Low", "Medium", "High"]);
        });

        it("fabricates an unknown field", async () => {
            const field = await client.getWorkItemTypeField(
                AGILE_PROCESS_ID,
                BUG,
                "Custom.Missing",
                ProcessWorkItemTypeFieldsExpandLevel.All
            );
            expect(field.referenceName).toBe("Custom.Missing");
            expect(field.type).toBe(FieldType.String);
            expect(field.allowedValues).toEqual([]);
        });

        it("removes a field", async () => {
            await expect(client.removeWorkItemTypeField(AGILE_PROCESS_ID, BUG, PRIORITY)).resolves.toBeUndefined();
        });

        it("updates a known field", async () => {
            const updated = await client.updateWorkItemTypeField(
                { allowedValues: [], allowGroups: false, defaultValue: 4, readOnly: false, required: true },
                AGILE_PROCESS_ID,
                BUG,
                PRIORITY
            );
            expect(updated.referenceName).toBe(PRIORITY);
            expect(updated.name).toBe("Priority");
            expect(updated.defaultValue).toBe(4);
            expect(updated.required).toBe(true);
            expect(fields[3].defaultValue).toBe(2);
        });

        it("updates an unknown field", async () => {
            const updated = await client.updateWorkItemTypeField(
                { allowedValues: [], allowGroups: true, defaultValue: null, readOnly: true, required: false },
                AGILE_PROCESS_ID,
                BUG,
                "Custom.Missing"
            );
            expect(updated.referenceName).toBe("Custom.Missing");
            expect(updated.allowGroups).toBe(true);
            expect(updated.readOnly).toBe(true);
        });
    });

    describe("lists", () => {
        it("creates a list echoing the posted object", async () => {
            const posted = { ...makePickList(), items: ["Red", "Green"], name: "Colours" };
            const created = await client.createList(posted);
            expect(created).toEqual(posted);
            expect(created).not.toBe(posted);
        });

        it("fills a partially posted list from a fixture", async () => {
            const created = await client.createList({ items: ["1", "2"], type: "Integer" } as PickList);
            expect(created.items).toEqual(["1", "2"]);
            expect(created.type).toBe("Integer");
            expect(typeof created.id).toBe("string");
            expect(created.url.endsWith(created.id)).toBe(true);
        });

        it("deletes a list", async () => {
            await expect(client.deleteList(lists[0].id)).resolves.toBeUndefined();
        });

        it("gets a known list", async () => {
            expect(await client.getList(lists[1].id)).toBe(lists[1]);
        });

        it("fabricates an unknown list", async () => {
            const list = await client.getList("missing-list");
            expect(list.id).toBe("missing-list");
            expect(list.items.length).toBe(3);
            expect(list.type).toBe("String");
        });

        it("lists the metadata without the items", async () => {
            const metadata = await client.getListsMetadata();
            expect(metadata.map(m => m.id)).toEqual(lists.map(l => l.id));
            expect(new Set(metadata.map(m => m.name)).size).toBe(3);
            for (const entry of metadata) {
                expect("items" in entry).toBe(false);
            }
        });

        it("updates a known list", async () => {
            const target = lists[2];
            const updated = await client.updateList({ ...target, id: "ignored", items: ["Only"] }, target.id);
            expect(updated.id).toBe(target.id);
            expect(updated.items).toEqual(["Only"]);
            expect(updated.name).toBe(target.name);
            expect(target.items.length).toBe(3);
        });

        it("updates an unknown list", async () => {
            const updated = await client.updateList({ name: "Unknown" } as PickList, "missing-list");
            expect(updated.id).toBe("missing-list");
            expect(updated.name).toBe("Unknown");
        });
    });

    describe("rules", () => {
        const request: CreateProcessRuleRequest = {
            actions: [{ actionType: RuleActionType.MakeReadOnly, targetField: "System.Title", value: "" }],
            conditions: [{ conditionType: RuleConditionType.WhenNot, field: "System.State", value: "New" }],
            isDisabled: true,
            name: "Lock the title"
        };

        it("adds a rule echoing the posted request", async () => {
            const added = await client.addProcessWorkItemTypeRule(request, AGILE_PROCESS_ID, BUG);
            expect(added).toMatchObject(request);
            expect(added.customizationType).toBe(CustomizationType.Custom);
            expect(added.url.endsWith(added.id)).toBe(true);
        });

        it("deletes a rule", async () => {
            await expect(
                client.deleteProcessWorkItemTypeRule(AGILE_PROCESS_ID, BUG, rules[1].id)
            ).resolves.toBeUndefined();
        });

        it("gets a known rule", async () => {
            expect(await client.getProcessWorkItemTypeRule(AGILE_PROCESS_ID, BUG, rules[2].id)).toBe(rules[2]);
        });

        it("fabricates an unknown rule", async () => {
            const rule = await client.getProcessWorkItemTypeRule(AGILE_PROCESS_ID, BUG, "missing-rule");
            expect(rule.id).toBe("missing-rule");
            expect(rule.actions).toEqual([makeRuleAction()]);
            expect(rule.conditions).toEqual([makeRuleCondition()]);
        });

        it("lists the rules", async () => {
            const list = await client.getProcessWorkItemTypeRules(AGILE_PROCESS_ID, BUG);
            expect(list).toBe(rules);
            expect(list.map(r => r.customizationType)).toEqual([
                CustomizationType.System,
                CustomizationType.Custom,
                CustomizationType.Custom
            ]);
            expect(list.map(r => r.isDisabled)).toEqual([false, false, true]);
            expect(new Set(list.map(r => r.id)).size).toBe(3);
        });

        it("updates a known rule", async () => {
            const target = rules[1];
            const updated = await client.updateProcessWorkItemTypeRule(
                { ...request, id: "ignored" },
                AGILE_PROCESS_ID,
                BUG,
                target.id
            );
            expect(updated.id).toBe(target.id);
            expect(updated.name).toBe("Lock the title");
            expect(updated.url).toBe(target.url);
            expect(target.isDisabled).toBe(false);
        });

        it("updates an unknown rule", async () => {
            const updated = await client.updateProcessWorkItemTypeRule(
                { ...request, id: "ignored" },
                AGILE_PROCESS_ID,
                BUG,
                "missing-rule"
            );
            expect(updated.id).toBe("missing-rule");
            expect(updated.actions).toBe(request.actions);
        });
    });

    describe("states", () => {
        const model: WorkItemStateInputModel = { color: "007acc", name: "In Review", order: 3, stateCategory: "InProgress" };

        it("creates a state echoing the posted model", async () => {
            const created = await client.createStateDefinition(model, AGILE_PROCESS_ID, BUG);
            expect(created).toMatchObject(model);
            expect(created.customizationType).toBe(CustomizationType.Custom);
            expect(created.hidden).toBe(false);
            expect(created.url.endsWith(created.id)).toBe(true);
        });

        it("deletes a state", async () => {
            await expect(client.deleteStateDefinition(AGILE_PROCESS_ID, BUG, states[0].id)).resolves.toBeUndefined();
        });

        it("gets a known state", async () => {
            expect(await client.getStateDefinition(AGILE_PROCESS_ID, BUG, states[1].id)).toBe(states[1]);
        });

        it("fabricates an unknown state", async () => {
            const state = await client.getStateDefinition(AGILE_PROCESS_ID, BUG, "missing-state");
            expect(state.id).toBe("missing-state");
            expect(state.stateCategory).toBe("InProgress");
        });

        it("lists the states", async () => {
            const list = await client.getStateDefinitions(AGILE_PROCESS_ID, BUG);
            expect(list).toBe(states);
            expect(list.map(s => s.name)).toEqual(["New", "Active", "Resolved", "Closed", "Removed"]);
            expect(list.map(s => s.stateCategory)).toEqual(["Proposed", "InProgress", "Resolved", "Completed", "Removed"]);
            expect(list.map(s => s.hidden)).toEqual([false, false, false, false, true]);
            expect(new Set(list.map(s => s.id)).size).toBe(5);
        });

        it("hides a known state", async () => {
            const target = states[2];
            const hidden = await client.hideStateDefinition({ hidden: true }, AGILE_PROCESS_ID, BUG, target.id);
            expect(hidden.id).toBe(target.id);
            expect(hidden.name).toBe("Resolved");
            expect(hidden.hidden).toBe(true);
            expect(target.hidden).toBe(false);
        });

        it("shows an unknown state", async () => {
            const shown = await client.hideStateDefinition({ hidden: false }, AGILE_PROCESS_ID, BUG, "missing-state");
            expect(shown.id).toBe("missing-state");
            expect(shown.hidden).toBe(false);
        });

        it("updates a known state", async () => {
            const target = states[1];
            const updated = await client.updateStateDefinition(model, AGILE_PROCESS_ID, BUG, target.id);
            expect(updated.id).toBe(target.id);
            expect(updated.name).toBe("In Review");
            expect(updated.customizationType).toBe(CustomizationType.System);
            expect(target.name).toBe("Active");
        });

        it("updates an unknown state", async () => {
            const updated = await client.updateStateDefinition(model, AGILE_PROCESS_ID, BUG, "missing-state");
            expect(updated.id).toBe("missing-state");
            expect(updated.color).toBe("007acc");
        });
    });
});

describe("work item tracking process field, list, rule and state fixtures", () => {
    it("makes a custom field", () => {
        const field = makeProcessWorkItemTypeField();
        expect(field.referenceName).toBe(`Custom.${field.name.replace(" ", "")}`);
        expect(field.url.endsWith(field.referenceName)).toBe(true);
        expect(field.defaultValue).toBeNull();
    });

    it("seeds system and custom fields", () => {
        expect(fields.map(f => f.customization)).toEqual([
            CustomizationType.System,
            CustomizationType.System,
            CustomizationType.System,
            CustomizationType.System,
            CustomizationType.Custom,
            CustomizationType.Custom
        ]);
        expect(fields[2].type).toBe(FieldType.Identity);
        expect(fields[2].allowGroups).toBe(true);
    });

    it("makes list metadata without the items", () => {
        const list = makePickList();
        const { items, ...metadata } = list;
        expect(items.length).toBe(3);
        expect(makePickListMetadata(list)).toEqual(metadata);
    });

    it("makes a rule", () => {
        const rule = makeProcessRule();
        expect(rule.actions[0].actionType).toBe(RuleActionType.MakeRequired);
        expect(rule.conditions[0].conditionType).toBe(RuleConditionType.When);
        expect(rule.isDisabled).toBe(false);
    });

    it("makes a state", () => {
        const state = makeWorkItemStateResultModel();
        expect(state.customizationType).toBe(CustomizationType.Custom);
        expect(state.color).toMatch(/^[0-9a-f]{6}$/);
        expect(state.order).toBeGreaterThanOrEqual(1);
    });
});
