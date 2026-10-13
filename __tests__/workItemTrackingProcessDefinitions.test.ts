import {
    BehaviorCreateModel,
    Control,
    FieldModel,
    FieldType,
    GetWorkItemTypeExpand,
    Group,
    Page,
    PageType,
    PickListModel,
    WorkItemTrackingProcessDefinitionsRestClient,
    WorkItemTypeBehavior,
    WorkItemTypeClass,
    WorkItemTypeFieldModel2,
    WorkItemTypeModel
} from "azure-devops-extension-api/WorkItemTrackingProcessDefinitions";
import {
    getClient,
    getRegisteredMockClient,
    MockWorkItemTrackingProcessDefinitionsRestClient
} from "../azure-devops-extension-api";
import {
    behaviors,
    controls,
    fields,
    groups,
    lists,
    makeBehaviorReference,
    makeControl,
    makeField,
    makeGroup,
    makePage,
    makePickList,
    makeWorkItemType,
    makeWorkItemTypeBehavior,
    makeWorkItemTypeField,
    pages,
    states,
    workItemTypeFields,
    workItemTypes
} from "../azure-devops-extension-api/workItemTrackingProcessDefinitions/Data";

const PROCESS = "c7b8a0b4-3d1e-4c0e-9f61-0a5f6e3b2d11";
const TASK = "Microsoft.VSTS.WorkItemTypes.Task";
const TASK_BEHAVIOR = "System.TaskBacklogBehavior";

describe("WorkItemTrackingProcessDefinitionsRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(WorkItemTrackingProcessDefinitionsRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(WorkItemTrackingProcessDefinitionsRestClient)).toBe(
            MockWorkItemTrackingProcessDefinitionsRestClient
        );
    });

    describe("behaviors", () => {
        it("creates a behavior from the posted model", async () => {
            const posted: BehaviorCreateModel = {
                id: "Custom.Initiatives",
                name: "Initiatives",
                color: "ff0000",
                inherits: "System.PortfolioBacklogBehavior"
            };
            const created = await client.createBehavior(posted, PROCESS);
            expect(created.id).toBe("Custom.Initiatives");
            expect(created.name).toBe("Initiatives");
            expect(created.color).toBe("ff0000");
            expect(created.inherits.id).toBe("System.PortfolioBacklogBehavior");
            expect(typeof created.inherits.url).toBe("string");
            expect(typeof created.rank).toBe("number");
            expect(created.abstract).toBe(false);
        });

        it("fills a partially posted behavior from a fixture", async () => {
            const created = await client.createBehavior({ name: "Themes" } as BehaviorCreateModel, PROCESS);
            expect(created.name).toBe("Themes");
            expect(created.id.startsWith("Custom.")).toBe(true);
            expect(created.inherits.id).toBe("System.PortfolioBacklogBehavior");
        });

        it("deletes a behavior", async () => {
            await expect(client.deleteBehavior(PROCESS, behaviors[2].id)).resolves.toBeUndefined();
        });

        it("gets a known behavior", async () => {
            expect(await client.getBehavior(PROCESS, TASK_BEHAVIOR)).toBe(behaviors[3]);
        });

        it("fabricates an unknown behavior", async () => {
            const made = await client.getBehavior(PROCESS, "Custom.Missing");
            expect(made.id).toBe("Custom.Missing");
            expect(made.url.endsWith("/behaviors/Custom.Missing")).toBe(true);
            expect(typeof made.name).toBe("string");
        });

        it("lists behaviors", async () => {
            const list = await client.getBehaviors(PROCESS);
            expect(list).toBe(behaviors);
            expect(list.map(b => b.name)).toEqual(["Ordered", "Portfolio", "Requirements", "Tasks", "Epics"]);
            expect(new Set(list.map(b => b.id)).size).toBe(list.length);
        });

        it("replaces a known behavior", async () => {
            const target = behaviors[4];
            const replaced = await client.replaceBehavior({ name: "Initiatives", color: "00ff00" }, PROCESS, target.id);
            expect(replaced).toEqual({ ...target, name: "Initiatives", color: "00ff00" });
            expect(target.name).toBe("Epics");
        });

        it("replaces an unknown behavior", async () => {
            const replaced = await client.replaceBehavior({ name: "Other", color: "0000ff" }, PROCESS, "Custom.Other");
            expect(replaced.id).toBe("Custom.Other");
            expect(replaced.name).toBe("Other");
            expect(replaced.color).toBe("0000ff");
        });
    });

    describe("controls", () => {
        it("adds a control echoing the posted object", async () => {
            const posted: Control = { ...makeControl("Custom.Severity"), label: "Severity", readOnly: true };
            const added = await client.addControlToGroup(posted, PROCESS, TASK, groups[0].id);
            expect(added).toEqual(posted);
            expect(added).not.toBe(posted);
        });

        it("fills a partially posted control from a fixture", async () => {
            const added = await client.addControlToGroup({ label: "Risk" } as Control, PROCESS, TASK, groups[0].id);
            expect(added.label).toBe("Risk");
            expect(typeof added.id).toBe("string");
            expect(added.controlType).toBe("FieldControl");
            expect(added.visible).toBe(true);
        });

        it("edits a known control", async () => {
            const target = controls[1];
            const edited = await client.editControl(
                { ...target, id: "ignored", label: "Renamed" },
                PROCESS,
                TASK,
                groups[0].id,
                target.id
            );
            expect(edited).toEqual({ ...target, label: "Renamed" });
            expect(target.label).not.toBe("Renamed");
        });

        it("edits an unknown control", async () => {
            const edited = await client.editControl(
                { visible: false } as Control,
                PROCESS,
                TASK,
                "group",
                "Custom.Unknown"
            );
            expect(edited.id).toBe("Custom.Unknown");
            expect(edited.visible).toBe(false);
            expect(typeof edited.label).toBe("string");
        });

        it("removes a control from a group", async () => {
            await expect(
                client.removeControlFromGroup(PROCESS, TASK, groups[0].id, controls[0].id)
            ).resolves.toBeUndefined();
        });

        it("sets a known control in a group", async () => {
            const target = controls[0];
            const moved = await client.setControlInGroup(
                { ...target, order: 99 },
                PROCESS,
                TASK,
                groups[1].id,
                target.id,
                groups[0].id
            );
            expect(moved).toEqual({ ...target, order: 99 });
        });

        it("sets an unknown control in a group", async () => {
            const moved = await client.setControlInGroup({ order: 3 } as Control, PROCESS, TASK, "group", "Custom.New");
            expect(moved.id).toBe("Custom.New");
            expect(moved.order).toBe(3);
            expect(moved.isContribution).toBe(false);
        });
    });

    describe("fields", () => {
        it("creates a field echoing the posted object", async () => {
            const posted: FieldModel = { ...makeField("Custom.Risk", FieldType.Integer), name: "Risk" };
            const created = await client.createField(posted, PROCESS);
            expect(created).toEqual(posted);
            expect(created).not.toBe(posted);
        });

        it("fills a partially posted field from a fixture", async () => {
            const created = await client.createField({ name: "Effort" } as FieldModel, PROCESS);
            expect(created.name).toBe("Effort");
            expect(created.id.startsWith("Custom.")).toBe(true);
            expect(created.type).toBe(FieldType.String);
        });

        it("updates a known field", async () => {
            const target = fields[2];
            const updated = await client.updateField({ id: target.id, description: "How urgent it is" }, PROCESS);
            expect(updated).toEqual({ ...target, description: "How urgent it is" });
            expect(target.description).not.toBe("How urgent it is");
        });

        it("updates an unknown field", async () => {
            const updated = await client.updateField({ id: "Custom.Missing", description: "Nothing" }, PROCESS);
            expect(updated.id).toBe("Custom.Missing");
            expect(updated.description).toBe("Nothing");
            expect(typeof updated.name).toBe("string");
        });
    });

    describe("groups", () => {
        it("adds a group echoing the posted object", async () => {
            const posted: Group = { ...makeGroup(), label: "Planning" };
            const added = await client.addGroup(posted, PROCESS, TASK, pages[0].id, "Section1");
            expect(added).toEqual(posted);
            expect(added).not.toBe(posted);
        });

        it("fills a partially posted group from a fixture", async () => {
            const added = await client.addGroup({ label: "Details" } as Group, PROCESS, TASK, pages[0].id, "Section1");
            expect(added.label).toBe("Details");
            expect(typeof added.id).toBe("string");
            expect(added.controls.length).toBe(2);
        });

        it("edits a known group", async () => {
            const target = groups[1];
            const edited = await client.editGroup(
                { ...target, id: "ignored", label: "Renamed" },
                PROCESS,
                TASK,
                pages[0].id,
                "Section1",
                target.id
            );
            expect(edited).toEqual({ ...target, label: "Renamed" });
            expect(target.label).not.toBe("Renamed");
        });

        it("edits an unknown group", async () => {
            const edited = await client.editGroup(
                { visible: false } as Group,
                PROCESS,
                TASK,
                "page",
                "Section1",
                "g-1"
            );
            expect(edited.id).toBe("g-1");
            expect(edited.visible).toBe(false);
            expect(Array.isArray(edited.controls)).toBe(true);
        });

        it("removes a group", async () => {
            await expect(
                client.removeGroup(PROCESS, TASK, pages[0].id, "Section1", groups[0].id)
            ).resolves.toBeUndefined();
        });

        it("sets a known group in a page", async () => {
            const target = groups[0];
            const moved = await client.setGroupInPage(
                { ...target, order: 7 },
                PROCESS,
                TASK,
                pages[1].id,
                "Section1",
                target.id,
                pages[0].id,
                "Section2"
            );
            expect(moved).toEqual({ ...target, order: 7 });
        });

        it("sets an unknown group in a page", async () => {
            const moved = await client.setGroupInPage(
                { order: 4 } as Group,
                PROCESS,
                TASK,
                "page",
                "Section1",
                "g-2",
                "other-page",
                "Section2"
            );
            expect(moved.id).toBe("g-2");
            expect(moved.order).toBe(4);
        });

        it("sets a known group in a section", async () => {
            const target = groups[2];
            const moved = await client.setGroupInSection(
                { ...target, order: 8 },
                PROCESS,
                TASK,
                pages[0].id,
                "Section2",
                target.id,
                "Section1"
            );
            expect(moved).toEqual({ ...target, order: 8 });
        });

        it("sets an unknown group in a section", async () => {
            const moved = await client.setGroupInSection(
                { order: 5 } as Group,
                PROCESS,
                TASK,
                "page",
                "Section2",
                "g-3",
                "Section1"
            );
            expect(moved.id).toBe("g-3");
            expect(moved.order).toBe(5);
        });
    });

    describe("layout", () => {
        it("gets the layout of a known work item type", async () => {
            const layout = await client.getFormLayout(PROCESS, TASK);
            expect(layout).toBe(workItemTypes[2].layout);
            expect(layout.pages.map(p => p.label)).toEqual(["Details", "History", "Links", "Attachments"]);
            expect(layout.systemControls.map(c => c.id)).toEqual(["System.Title", "System.State", "System.Reason"]);
        });

        it("fabricates the layout of an unknown work item type", async () => {
            const layout = await client.getFormLayout(PROCESS, "Custom.Missing");
            expect(layout.pages.length).toBe(4);
            expect(layout.extensions.length).toBe(1);
            expect(workItemTypes.map(t => t.layout)).not.toContain(layout);
        });
    });

    describe("lists", () => {
        it("lists the metadata without the items", async () => {
            const metadata = await client.getListsMetadata();
            expect(metadata.length).toBe(lists.length);
            metadata.forEach((entry, index) => {
                const { id, isSuggested, name, type, url } = lists[index];
                expect(entry).toEqual({ id, isSuggested, name, type, url });
                expect(entry).not.toHaveProperty("items");
            });
        });

        it("creates a list echoing the posted object", async () => {
            const posted: PickListModel = { ...makePickList(), name: "Severity", isSuggested: true };
            const created = await client.createList(posted);
            expect(created).toEqual(posted);
            expect(created).not.toBe(posted);
        });

        it("fills a partially posted list from a fixture", async () => {
            const created = await client.createList({ name: "Sizes" } as PickListModel);
            expect(created.name).toBe("Sizes");
            expect(typeof created.id).toBe("string");
            expect(created.items.length).toBe(3);
        });

        it("deletes a list", async () => {
            await expect(client.deleteList(lists[0].id)).resolves.toBeUndefined();
        });

        it("gets a known list", async () => {
            expect(await client.getList(lists[1].id)).toBe(lists[1]);
        });

        it("fabricates an unknown list", async () => {
            const made = await client.getList("missing-list");
            expect(made.id).toBe("missing-list");
            expect(made.type).toBe("String");
            expect(made.items.length).toBe(3);
        });

        it("updates a known list", async () => {
            const target = lists[2];
            const items = [{ id: "1", value: "Low" }];
            const updated = await client.updateList({ ...target, id: "ignored", items }, target.id);
            expect(updated).toEqual({ ...target, items });
            expect(target.items.length).toBe(3);
        });

        it("updates an unknown list", async () => {
            const updated = await client.updateList({ name: "Renamed" } as PickListModel, "missing-list");
            expect(updated.id).toBe("missing-list");
            expect(updated.name).toBe("Renamed");
        });
    });

    describe("pages", () => {
        it("adds a page echoing the posted object", async () => {
            const posted: Page = { ...makePage(), label: "Planning" };
            const added = await client.addPage(posted, PROCESS, TASK);
            expect(added).toEqual(posted);
            expect(added).not.toBe(posted);
        });

        it("fills a partially posted page from a fixture", async () => {
            const added = await client.addPage({ label: "Risks" } as Page, PROCESS, TASK);
            expect(added.label).toBe("Risks");
            expect(added.pageType).toBe(PageType.Custom);
            expect(added.sections.map(s => s.id)).toEqual(["Section1", "Section2"]);
        });

        it("edits a known page", async () => {
            const target = pages[0];
            const edited = await client.editPage({ ...target, label: "Renamed" }, PROCESS, TASK);
            expect(edited).toEqual({ ...target, label: "Renamed" });
            expect(target.label).toBe("Details");
        });

        it("edits an unknown page", async () => {
            const edited = await client.editPage({ id: "page-1", visible: false } as Page, PROCESS, TASK);
            expect(edited.id).toBe("page-1");
            expect(edited.visible).toBe(false);
            expect(edited.pageType).toBe(PageType.Custom);
        });

        it("removes a page", async () => {
            await expect(client.removePage(PROCESS, TASK, pages[0].id)).resolves.toBeUndefined();
        });
    });

    describe("states", () => {
        const input = { name: "Blocked", color: "cc293d", order: 3, stateCategory: "InProgress" };

        it("creates a state from the posted model", async () => {
            const created = await client.createStateDefinition(input, PROCESS, TASK);
            expect(created).toMatchObject(input);
            expect(typeof created.id).toBe("string");
            expect(created.hidden).toBe(false);
            expect(created.url.endsWith(`/states/${created.id}`)).toBe(true);
        });

        it("deletes a state", async () => {
            await expect(client.deleteStateDefinition(PROCESS, TASK, states[0].id)).resolves.toBeUndefined();
        });

        it("gets a known state", async () => {
            expect(await client.getStateDefinition(PROCESS, TASK, states[5].id)).toBe(states[5]);
        });

        it("fabricates an unknown state", async () => {
            const made = await client.getStateDefinition(PROCESS, TASK, "missing-state");
            expect(made.id).toBe("missing-state");
            expect(made.stateCategory).toBe("InProgress");
            expect(made.hidden).toBe(false);
        });

        it("lists the states of a known work item type", async () => {
            const list = await client.getStateDefinitions(PROCESS, TASK);
            expect(list).toBe(workItemTypes[2].states);
            expect(list.map(s => s.name)).toEqual(["New", "Active", "Resolved", "Closed"]);
            expect(list.map(s => s.order)).toEqual([1, 2, 3, 4]);
        });

        it("fabricates the states of an unknown work item type", async () => {
            const list = await client.getStateDefinitions(PROCESS, "Custom.Missing");
            expect(list.map(s => s.stateCategory)).toEqual(["Proposed", "InProgress", "Resolved", "Completed"]);
            expect(list.some(s => states.includes(s))).toBe(false);
        });

        it("hides a known state", async () => {
            const target = states[2];
            const hidden = await client.hideStateDefinition({ hidden: true }, PROCESS, TASK, target.id);
            expect(hidden).toEqual({ ...target, hidden: true });
            expect(target.hidden).toBe(false);
        });

        it("hides an unknown state", async () => {
            const hidden = await client.hideStateDefinition({ hidden: true }, PROCESS, TASK, "missing-state");
            expect(hidden.id).toBe("missing-state");
            expect(hidden.hidden).toBe(true);
        });

        it("updates a known state", async () => {
            const target = states[1];
            const updated = await client.updateStateDefinition(input, PROCESS, TASK, target.id);
            expect(updated).toEqual({ ...target, ...input });
            expect(target.name).toBe("Active");
        });

        it("updates an unknown state", async () => {
            const updated = await client.updateStateDefinition(input, PROCESS, TASK, "missing-state");
            expect(updated.id).toBe("missing-state");
            expect(updated.name).toBe("Blocked");
        });
    });

    describe("work item type behaviors", () => {
        it("adds a behavior echoing the posted object", async () => {
            const posted: WorkItemTypeBehavior = {
                ...makeWorkItemTypeBehavior(makeBehaviorReference(TASK_BEHAVIOR)),
                isDefault: true
            };
            const added = await client.addBehaviorToWorkItemType(posted, PROCESS, TASK);
            expect(added).toEqual(posted);
            expect(added).not.toBe(posted);
        });

        it("fills a partially posted behavior from a fixture", async () => {
            const added = await client.addBehaviorToWorkItemType(
                { isDefault: true } as WorkItemTypeBehavior,
                PROCESS,
                TASK
            );
            expect(added.isDefault).toBe(true);
            expect(added.isLegacyDefault).toBe(false);
            expect(typeof added.url).toBe("string");
        });

        it("gets a known behavior of a work item type", async () => {
            expect(await client.getBehaviorForWorkItemType(PROCESS, TASK, TASK_BEHAVIOR)).toBe(
                workItemTypes[2].behaviors[0]
            );
        });

        it("fabricates an unknown behavior of a work item type", async () => {
            const made = await client.getBehaviorForWorkItemType(PROCESS, TASK, "Custom.Missing");
            expect(made.behavior.id).toBe("Custom.Missing");
            expect(made.url).toBe(made.behavior.url);
            expect(made.isDefault).toBe(false);
        });

        it("lists the behaviors of a known work item type", async () => {
            const list = await client.getBehaviorsForWorkItemType(PROCESS, TASK);
            expect(list).toBe(workItemTypes[2].behaviors);
            expect(list.map(b => b.behavior.id)).toEqual([TASK_BEHAVIOR]);
        });

        it("fabricates the behaviors of an unknown work item type", async () => {
            const list = await client.getBehaviorsForWorkItemType(PROCESS, "Custom.Missing");
            expect(list.map(b => b.behavior.id)).toEqual(["System.RequirementBacklogBehavior"]);
        });

        it("removes a behavior from a work item type", async () => {
            await expect(client.removeBehaviorFromWorkItemType(PROCESS, TASK, TASK_BEHAVIOR)).resolves.toBeUndefined();
        });

        it("updates a known behavior of a work item type", async () => {
            const target = workItemTypes[2].behaviors[0];
            const updated = await client.updateBehaviorToWorkItemType(
                { ...target, isDefault: false, isLegacyDefault: true },
                PROCESS,
                TASK
            );
            expect(updated).toEqual({ ...target, isDefault: false, isLegacyDefault: true });
            expect(target.isDefault).toBe(true);
        });

        it("updates an unknown behavior of a work item type", async () => {
            const behavior = makeBehaviorReference("Custom.Missing");
            const partial = { behavior, isDefault: true } as WorkItemTypeBehavior;
            const updated = await client.updateBehaviorToWorkItemType(partial, PROCESS, TASK);
            expect(updated.behavior).toBe(behavior);
            expect(updated.isDefault).toBe(true);
            expect(updated.isLegacyDefault).toBe(false);
            expect(updated.url.endsWith("/behaviors/Custom.Missing")).toBe(true);
        });
    });

    describe("work item types", () => {
        it("creates a work item type echoing the posted object", async () => {
            const posted: WorkItemTypeModel = { ...makeWorkItemType("Custom.Ticket"), name: "Ticket" };
            const created = await client.createWorkItemType(posted, PROCESS);
            expect(created).toEqual(posted);
            expect(created).not.toBe(posted);
        });

        it("fills a partially posted work item type from a fixture", async () => {
            const created = await client.createWorkItemType(
                { name: "Risk", color: "f6546a" } as WorkItemTypeModel,
                PROCESS
            );
            expect(created.name).toBe("Risk");
            expect(created.color).toBe("f6546a");
            expect(created.id.startsWith("Custom.")).toBe(true);
            expect(created.class).toBe(WorkItemTypeClass.Custom);
            expect(created.states.length).toBe(4);
        });

        it("deletes a work item type", async () => {
            await expect(client.deleteWorkItemType(PROCESS, "Custom.Bug")).resolves.toBeUndefined();
        });

        it("gets a known work item type", async () => {
            expect(await client.getWorkItemType(PROCESS, TASK)).toBe(workItemTypes[2]);
            expect(await client.getWorkItemType(PROCESS, "Custom.Bug", GetWorkItemTypeExpand.States)).toBe(
                workItemTypes[3]
            );
        });

        it("fabricates an unknown work item type", async () => {
            const made = await client.getWorkItemType(PROCESS, "Custom.Missing");
            expect(made.id).toBe("Custom.Missing");
            expect(made.url.endsWith("/workItemTypes/Custom.Missing")).toBe(true);
            expect(made.isDisabled).toBe(false);
            expect(made.inherits).toBeUndefined();
        });

        it("lists work item types", async () => {
            const list = await client.getWorkItemTypes(PROCESS, GetWorkItemTypeExpand.Layout);
            expect(list).toBe(workItemTypes);
            expect(list.map(t => t.name)).toEqual(["Epic", "User Story", "Task", "Bug"]);
            expect(new Set(list.map(t => t.id)).size).toBe(list.length);
        });

        it("updates a known work item type", async () => {
            const target = workItemTypes[3];
            const update = { color: "000000", description: "A defect", icon: "icon_asterisk", isDisabled: true };
            const updated = await client.updateWorkItemType(update, PROCESS, target.id);
            expect(updated).toEqual({ ...target, ...update });
            expect(target.isDisabled).toBe(false);
        });

        it("updates an unknown work item type", async () => {
            const update = { color: "ffffff", description: "Nothing", icon: "icon_star", isDisabled: false };
            const updated = await client.updateWorkItemType(update, PROCESS, "Custom.Missing");
            expect(updated.id).toBe("Custom.Missing");
            expect(updated.description).toBe("Nothing");
            expect(updated.icon).toBe("icon_star");
        });
    });

    describe("work item type fields", () => {
        it("adds a field echoing the posted object", async () => {
            const posted: WorkItemTypeFieldModel2 = { ...makeWorkItemTypeField("Custom.Risk"), required: true };
            const added = await client.addFieldToWorkItemType(posted, PROCESS, TASK);
            expect(added).toEqual(posted);
            expect(added).not.toBe(posted);
        });

        it("fills a partially posted field from a fixture", async () => {
            const added = await client.addFieldToWorkItemType(
                { readOnly: true } as WorkItemTypeFieldModel2,
                PROCESS,
                TASK
            );
            expect(added.readOnly).toBe(true);
            expect(added.referenceName.startsWith("Custom.")).toBe(true);
            expect(added.type).toBe(FieldType.String);
        });

        it("gets a known field of a work item type", async () => {
            expect(await client.getWorkItemTypeField(PROCESS, TASK, "System.State")).toBe(workItemTypeFields[1]);
        });

        it("fabricates an unknown field of a work item type", async () => {
            const made = await client.getWorkItemTypeField(PROCESS, TASK, "Custom.Missing");
            expect(made.referenceName).toBe("Custom.Missing");
            expect(made.url.endsWith("/fields/Custom.Missing")).toBe(true);
            expect(made.required).toBe(false);
        });

        it("lists the fields of a work item type", async () => {
            const list = await client.getWorkItemTypeFields(PROCESS, TASK);
            expect(list).toBe(workItemTypeFields);
            expect(list.map(f => f.referenceName)).toEqual([
                "System.Title",
                "System.State",
                "Microsoft.VSTS.Common.Priority",
                "Custom.Severity"
            ]);
        });

        it("removes a field from a work item type", async () => {
            await expect(client.removeFieldFromWorkItemType(PROCESS, TASK, "System.Title")).resolves.toBeUndefined();
        });

        it("updates a known field of a work item type", async () => {
            const target = workItemTypeFields[2];
            const updated = await client.updateWorkItemTypeField(
                { ...target, defaultValue: 1, required: true },
                PROCESS,
                TASK
            );
            expect(updated).toEqual({ ...target, defaultValue: 1, required: true });
            expect(target.defaultValue).toBe(2);
        });

        it("updates an unknown field of a work item type", async () => {
            const partial = { referenceName: "Custom.Missing", required: true } as WorkItemTypeFieldModel2;
            const updated = await client.updateWorkItemTypeField(partial, PROCESS, TASK);
            expect(updated.referenceName).toBe("Custom.Missing");
            expect(updated.required).toBe(true);
            expect(typeof updated.name).toBe("string");
        });
    });
});
