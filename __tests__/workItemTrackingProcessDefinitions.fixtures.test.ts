import { FieldType, PageType, WorkItemTypeClass } from "azure-devops-extension-api/WorkItemTrackingProcessDefinitions";
import {
    behaviors,
    controls,
    fields,
    groups,
    lists,
    makeBehavior,
    makeBehaviorReference,
    makeContributionControl,
    makeControl,
    makeExtension,
    makeField,
    makeFormLayout,
    makeGroup,
    makePage,
    makePickList,
    makePickListItem,
    makePickListMetadata,
    makeSection,
    makeWitContribution,
    makeWorkItemState,
    makeWorkItemStates,
    makeWorkItemType,
    makeWorkItemTypeBehavior,
    makeWorkItemTypeField,
    pages,
    states,
    workItemTypeBehaviors,
    workItemTypeFields,
    workItemTypes
} from "../azure-devops-extension-api/workItemTrackingProcessDefinitions/Data";

const unique = (values: string[]): boolean => new Set(values).size === values.length;

describe("work item tracking process definitions fixtures", () => {
    it("makes a behavior reference for the given or the default behavior", () => {
        expect(makeBehaviorReference("Custom.Themes").id).toBe("Custom.Themes");
        expect(makeBehaviorReference("Custom.Themes").url.endsWith("/behaviors/Custom.Themes")).toBe(true);
        expect(makeBehaviorReference().id).toBe("System.PortfolioBacklogBehavior");
    });

    it("makes a behavior with the given or a generated id", () => {
        const behavior = makeBehavior("Custom.Themes", "System.OrderedBehavior");
        expect(behavior.id).toBe("Custom.Themes");
        expect(behavior.inherits.id).toBe("System.OrderedBehavior");
        expect(behavior.color).toMatch(/^[0-9a-f]{6}$/);
        const generated = makeBehavior();
        expect(generated.id).toMatch(/^Custom\.[A-Za-z]{10}$/);
        expect(generated.inherits.id).toBe("System.PortfolioBacklogBehavior");
    });

    it("makes a field control without a contribution", () => {
        const control = makeControl("System.Title");
        expect(control.id).toBe("System.Title");
        expect(control.isContribution).toBe(false);
        expect(control.contribution).toBeUndefined();
        expect(typeof makeControl().id).toBe("string");
    });

    it("makes a contribution control", () => {
        const control = makeContributionControl("contributed");
        expect(control.id).toBe("contributed");
        expect(control.isContribution).toBe(true);
        expect(control.height).toBe(control.contribution.height);
        expect(control.contribution.inputs).toEqual({ FieldName: "System.Title" });
        expect(typeof makeContributionControl().id).toBe("string");
    });

    it("makes a contribution", () => {
        const contribution = makeWitContribution();
        expect(contribution.contributionId.endsWith("-control")).toBe(true);
        expect(contribution.showOnDeletedWorkItem).toBe(false);
    });

    it("makes a group with the given or two generated controls", () => {
        const control = makeControl();
        expect(makeGroup([control]).controls).toEqual([control]);
        const group = makeGroup();
        expect(group.controls.length).toBe(2);
        expect(group.contribution).toBeUndefined();
    });

    it("makes a section with the given or a generated group", () => {
        const group = makeGroup();
        expect(makeSection("Section3", [group])).toEqual({ id: "Section3", groups: [group], overridden: false });
        const section = makeSection();
        expect(section.id).toBe("Section1");
        expect(section.groups.length).toBe(1);
    });

    it("makes an unlocked custom page with two sections", () => {
        const page = makePage();
        expect(page.pageType).toBe(PageType.Custom);
        expect(page.locked).toBe(false);
        expect(page.sections.map(s => s.groups.length)).toEqual([2, 1]);
        expect(page.sections[0].groups[1].controls[1].isContribution).toBe(true);
    });

    it("makes a locked system page with one section", () => {
        const page = makePage(PageType.History);
        expect(page.pageType).toBe(PageType.History);
        expect(page.locked).toBe(true);
        expect(page.sections.length).toBe(1);
        expect(page.sections[0].groups[0].controls.length).toBe(1);
    });

    it("makes an extension", () => {
        expect(makeExtension().id).toMatch(/^[a-z]+\.[a-z]+-[a-z]+$/);
    });

    it("makes a layout with one page of each type", () => {
        const layout = makeFormLayout();
        expect(layout.pages.map(p => p.pageType)).toEqual([
            PageType.Custom,
            PageType.History,
            PageType.Links,
            PageType.Attachments
        ]);
        expect(layout.systemControls.length).toBe(3);
    });

    it("makes a pick list with distinct item values", () => {
        const list = makePickList();
        expect(list.url.endsWith(`/lists/${list.id}`)).toBe(true);
        expect(unique(list.items.map(i => i.value))).toBe(true);
        expect(typeof makePickListItem().id).toBe("string");
    });

    it("makes pick list metadata without the items", () => {
        const list = makePickList();
        const metadata = makePickListMetadata(list);
        expect(metadata).toEqual({
            id: list.id,
            isSuggested: list.isSuggested,
            name: list.name,
            type: list.type,
            url: list.url
        });
    });

    it("makes a field with the given or generated id and type", () => {
        const field = makeField("Custom.Risk", FieldType.Integer);
        expect(field.id).toBe("Custom.Risk");
        expect(field.type).toBe(FieldType.Integer);
        expect(field.pickList).toBeUndefined();
        const generated = makeField();
        expect(generated.id.startsWith("Custom.")).toBe(true);
        expect(generated.type).toBe(FieldType.String);
    });

    it("makes a state with the given or generated values", () => {
        const state = makeWorkItemState("Blocked", "InProgress", "cc293d");
        expect(state.name).toBe("Blocked");
        expect(state.color).toBe("cc293d");
        const generated = makeWorkItemState();
        expect(generated.stateCategory).toBe("InProgress");
        expect(generated.color).toMatch(/^[0-9a-f]{6}$/);
    });

    it("makes one state per category in order", () => {
        const made = makeWorkItemStates();
        expect(made.map(s => s.name)).toEqual(["New", "Active", "Resolved", "Closed"]);
        expect(made.map(s => s.order)).toEqual([1, 2, 3, 4]);
        expect(unique(made.map(s => s.id))).toBe(true);
    });

    it("makes a work item type behavior for the given or the default behavior", () => {
        const reference = makeBehaviorReference("System.TaskBacklogBehavior");
        expect(makeWorkItemTypeBehavior(reference)).toEqual({
            behavior: reference,
            isDefault: false,
            isLegacyDefault: false,
            url: reference.url
        });
        expect(makeWorkItemTypeBehavior().behavior.id).toBe("System.PortfolioBacklogBehavior");
    });

    it("makes a work item type field with the given or generated name and type", () => {
        const field = makeWorkItemTypeField("Custom.Risk", FieldType.Boolean);
        expect(field.referenceName).toBe("Custom.Risk");
        expect(field.type).toBe(FieldType.Boolean);
        expect(field.defaultValue).toBeNull();
        expect(field.pickList).toBeUndefined();
        const generated = makeWorkItemTypeField();
        expect(generated.referenceName.startsWith("Custom.")).toBe(true);
        expect(generated.type).toBe(FieldType.String);
    });

    it("makes a custom work item type with the given or generated id and behavior", () => {
        const type = makeWorkItemType("Custom.Ticket", "System.TaskBacklogBehavior");
        expect(type.id).toBe("Custom.Ticket");
        expect(type.class).toBe(WorkItemTypeClass.Custom);
        expect(type.behaviors.map(b => b.behavior.id)).toEqual(["System.TaskBacklogBehavior"]);
        expect(type.behaviors[0].isDefault).toBe(true);
        expect(type.inherits).toBeUndefined();
        const generated = makeWorkItemType();
        expect(generated.id.startsWith("Custom.")).toBe(true);
        expect(generated.behaviors[0].behavior.id).toBe("System.RequirementBacklogBehavior");
    });

    it("seeds a behavior tree with an abstract root", () => {
        expect(behaviors[0].id).toBe("System.OrderedBehavior");
        expect(behaviors[0].abstract).toBe(true);
        expect(behaviors[0].inherits).toBeUndefined();
        expect(behaviors.slice(1, 4).map(b => b.inherits.id)).toEqual(Array(3).fill("System.OrderedBehavior"));
        expect(behaviors[4].inherits.id).toBe("System.PortfolioBacklogBehavior");
    });

    it("seeds lists with distinct ids and names", () => {
        expect(lists.length).toBe(3);
        expect(unique(lists.map(l => l.id))).toBe(true);
        expect(unique(lists.map(l => l.name))).toBe(true);
    });

    it("seeds fields with a pick list only on the pick list field", () => {
        expect(unique(fields.map(f => f.id))).toBe(true);
        expect(fields.filter(f => f.pickList !== undefined).map(f => f.id)).toEqual(["Custom.Severity"]);
        expect(fields[3].pickList).toEqual(makePickListMetadata(lists[0]));
        expect(workItemTypeFields[3].pickList).toEqual(makePickListMetadata(lists[0]));
        expect(unique(workItemTypeFields.map(f => f.referenceName))).toBe(true);
    });

    it("seeds work item types where only the derived one inherits", () => {
        expect(unique(workItemTypes.map(t => t.id))).toBe(true);
        expect(workItemTypes.map(t => t.class)).toEqual([
            WorkItemTypeClass.System,
            WorkItemTypeClass.System,
            WorkItemTypeClass.System,
            WorkItemTypeClass.Derived
        ]);
        expect(workItemTypes.map(t => t.inherits)).toEqual([
            undefined,
            undefined,
            undefined,
            "Microsoft.VSTS.WorkItemTypes.Bug"
        ]);
    });

    it("seeds work item type behaviors that exist in the behavior list", () => {
        expect(workItemTypeBehaviors.length).toBe(workItemTypes.length);
        for (const entry of workItemTypeBehaviors) {
            expect(behaviors.map(b => b.id)).toContain(entry.behavior.id);
        }
    });

    it("flattens the seeded layouts into lookup lists with unique ids", () => {
        expect(states.length).toBe(workItemTypes.length * 4);
        expect(pages.length).toBe(workItemTypes.length * 4);
        expect(groups.length).toBe(workItemTypes.length * 6);
        expect(controls.length).toBe(workItemTypes.length * 9);
        expect(unique(states.map(s => s.id))).toBe(true);
        expect(unique(pages.map(p => p.id))).toBe(true);
        expect(unique(groups.map(g => g.id))).toBe(true);
        expect(unique(controls.map(c => c.id))).toBe(true);
    });
});
