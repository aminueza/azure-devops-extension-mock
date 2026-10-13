import { Control, Group, Page, PageType, WorkItemTrackingProcessRestClient } from "azure-devops-extension-api/WorkItemTrackingProcess";
import { getClient } from "../azure-devops-extension-api";
import {
    AGILE_PROCESS_ID,
    controls,
    formLayout,
    groups,
    makeContributionControl,
    makeContributionGroup,
    makeContributionPage,
    makeControl,
    makeExtension,
    makeFormLayout,
    makeGroup,
    makeHtmlControl,
    makePage,
    makeSection,
    makeSystemControls,
    makeWitContribution,
    pages,
    systemControls
} from "../azure-devops-extension-api/workItemTrackingProcess/Data";

const BUG = "Microsoft.VSTS.WorkItemTypes.Bug";
const PRIORITY = "Microsoft.VSTS.Common.Priority";

describe("WorkItemTrackingProcessRestClient mock layout", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(WorkItemTrackingProcessRestClient);
    const details = pages[0];
    const planning = groups[1];

    describe("controls", () => {
        it("creates a control echoing the posted object", async () => {
            const posted = { ...makeControl("Custom.Effort"), label: "Effort", readOnly: true };
            const created = await client.createControlInGroup(posted, AGILE_PROCESS_ID, BUG, planning.id);
            expect(created).toEqual(posted);
            expect(created).not.toBe(posted);
        });

        it("fills a partially posted control from a fixture", async () => {
            const created = await client.createControlInGroup(
                { label: "Partial" } as Control,
                AGILE_PROCESS_ID,
                BUG,
                planning.id
            );
            expect(created.label).toBe("Partial");
            expect(created.id.startsWith("Custom.")).toBe(true);
            expect(created.controlType).toBe("FieldControl");
            expect(created.visible).toBe(true);
        });

        it("moves a known control", async () => {
            const target = controls.find(c => c.id === PRIORITY)!;
            const moved = await client.moveControlToGroup(
                { ...target, id: "ignored", order: 99 },
                AGILE_PROCESS_ID,
                BUG,
                groups[2].id,
                PRIORITY,
                planning.id
            );
            expect(moved.id).toBe(PRIORITY);
            expect(moved.order).toBe(99);
            expect(moved.label).toBe("Priority");
            expect(target.order).not.toBe(99);
        });

        it("moves an unknown control", async () => {
            const moved = await client.moveControlToGroup(
                { visible: false } as Control,
                AGILE_PROCESS_ID,
                BUG,
                planning.id,
                "Custom.Missing"
            );
            expect(moved.id).toBe("Custom.Missing");
            expect(moved.visible).toBe(false);
            expect(typeof moved.label).toBe("string");
        });

        it("removes a control", async () => {
            await expect(
                client.removeControlFromGroup(AGILE_PROCESS_ID, BUG, planning.id, PRIORITY)
            ).resolves.toBeUndefined();
        });

        it("updates a known control", async () => {
            const updated = await client.updateControl(
                { label: "Importance" } as Control,
                AGILE_PROCESS_ID,
                BUG,
                planning.id,
                PRIORITY
            );
            expect(updated.id).toBe(PRIORITY);
            expect(updated.label).toBe("Importance");
            expect(updated.inherited).toBe(true);
        });

        it("updates an unknown control", async () => {
            const updated = await client.updateControl(
                { label: "Unknown" } as Control,
                AGILE_PROCESS_ID,
                BUG,
                planning.id,
                "Custom.Missing"
            );
            expect(updated.id).toBe("Custom.Missing");
            expect(updated.label).toBe("Unknown");
            expect(updated.inherited).toBe(false);
        });
    });

    describe("groups", () => {
        it("adds a group echoing the posted object", async () => {
            const posted = { ...makeGroup([]), label: "Risk" };
            const added = await client.addGroup(posted, AGILE_PROCESS_ID, BUG, details.id, "Section2");
            expect(added).toEqual(posted);
            expect(added).not.toBe(posted);
        });

        it("fills a partially posted group from a fixture", async () => {
            const added = await client.addGroup({ label: "Partial" } as Group, AGILE_PROCESS_ID, BUG, details.id, "Section2");
            expect(added.label).toBe("Partial");
            expect(typeof added.id).toBe("string");
            expect(added.controls.length).toBe(2);
        });

        it("moves a known group to another page", async () => {
            const moved = await client.moveGroupToPage(
                { order: 7 } as Group,
                AGILE_PROCESS_ID,
                BUG,
                pages[1].id,
                "Section1",
                planning.id,
                details.id,
                "Section2"
            );
            expect(moved.id).toBe(planning.id);
            expect(moved.order).toBe(7);
            expect(moved.label).toBe("Planning");
            expect(moved.controls).toBe(planning.controls);
        });

        it("moves an unknown group to another page", async () => {
            const moved = await client.moveGroupToPage(
                { order: 7 } as Group,
                AGILE_PROCESS_ID,
                BUG,
                pages[1].id,
                "Section1",
                "missing-group",
                details.id,
                "Section2"
            );
            expect(moved.id).toBe("missing-group");
            expect(moved.order).toBe(7);
        });

        it("moves a known group to another section", async () => {
            const moved = await client.moveGroupToSection(
                { order: 3 } as Group,
                AGILE_PROCESS_ID,
                BUG,
                details.id,
                "Section3",
                planning.id,
                "Section2"
            );
            expect(moved.id).toBe(planning.id);
            expect(moved.order).toBe(3);
            expect(moved.label).toBe("Planning");
        });

        it("moves an unknown group to another section", async () => {
            const moved = await client.moveGroupToSection(
                { order: 3 } as Group,
                AGILE_PROCESS_ID,
                BUG,
                details.id,
                "Section3",
                "missing-group",
                "Section2"
            );
            expect(moved.id).toBe("missing-group");
            expect(typeof moved.label).toBe("string");
        });

        it("removes a group", async () => {
            await expect(
                client.removeGroup(AGILE_PROCESS_ID, BUG, details.id, "Section2", planning.id)
            ).resolves.toBeUndefined();
        });

        it("updates a known group", async () => {
            const updated = await client.updateGroup(
                { ...planning, id: "ignored", label: "Plan", visible: false },
                AGILE_PROCESS_ID,
                BUG,
                details.id,
                "Section2",
                planning.id
            );
            expect(updated.id).toBe(planning.id);
            expect(updated.label).toBe("Plan");
            expect(updated.visible).toBe(false);
            expect(planning.label).toBe("Planning");
        });

        it("updates an unknown group", async () => {
            const updated = await client.updateGroup(
                { label: "Unknown" } as Group,
                AGILE_PROCESS_ID,
                BUG,
                details.id,
                "Section2",
                "missing-group"
            );
            expect(updated.id).toBe("missing-group");
            expect(updated.label).toBe("Unknown");
        });
    });

    describe("pages", () => {
        it("adds a page echoing the posted object", async () => {
            const posted = { ...makePage([]), label: "Risks" };
            const added = await client.addPage(posted, AGILE_PROCESS_ID, BUG);
            expect(added).toEqual(posted);
            expect(added).not.toBe(posted);
        });

        it("fills a partially posted page from a fixture", async () => {
            const added = await client.addPage({ label: "Partial" } as Page, AGILE_PROCESS_ID, BUG);
            expect(added.label).toBe("Partial");
            expect(added.pageType).toBe(PageType.Custom);
            expect(added.sections.map(s => s.id)).toEqual(["Section1", "Section2", "Section3", "Section4"]);
        });

        it("removes a page", async () => {
            await expect(client.removePage(AGILE_PROCESS_ID, BUG, details.id)).resolves.toBeUndefined();
        });

        it("updates a known page", async () => {
            const posted = { id: details.id, label: "Overview" } as Page;
            const updated = await client.updatePage(posted, AGILE_PROCESS_ID, BUG);
            expect(updated.id).toBe(details.id);
            expect(updated.label).toBe("Overview");
            expect(updated.sections).toBe(details.sections);
            expect(details.label).toBe("Details");
        });

        it("updates an unknown page", async () => {
            const updated = await client.updatePage({ id: "missing-page", visible: false } as Page, AGILE_PROCESS_ID, BUG);
            expect(updated.id).toBe("missing-page");
            expect(updated.visible).toBe(false);
            expect(updated.pageType).toBe(PageType.Custom);
        });
    });

    describe("form layout", () => {
        it("gets the layout", async () => {
            const layout = await client.getFormLayout(AGILE_PROCESS_ID, BUG);
            expect(layout).toBe(formLayout);
            expect(layout.pages.map(p => p.label)).toEqual(["Details", "History", "Links", "Attachments"]);
            expect(layout.pages.map(p => p.pageType)).toEqual([
                PageType.Custom,
                PageType.History,
                PageType.Links,
                PageType.Attachments
            ]);
            expect(layout.extensions.length).toBe(1);
        });
    });

    describe("system controls", () => {
        it("deletes a system control and returns the remaining ones", async () => {
            const remaining = await client.deleteSystemControl(AGILE_PROCESS_ID, BUG, "System.Reason");
            expect(remaining.map(c => c.id)).toEqual([
                "System.Title",
                "System.AssignedTo",
                "System.State",
                "System.AreaPath",
                "System.IterationPath"
            ]);
            expect(systemControls.length).toBe(6);
        });

        it("returns every system control when deleting an unknown one", async () => {
            expect(await client.deleteSystemControl(AGILE_PROCESS_ID, BUG, "System.Missing")).toEqual(systemControls);
        });

        it("gets the system controls", async () => {
            const list = await client.getSystemControls(AGILE_PROCESS_ID, BUG);
            expect(list).toBe(systemControls);
            expect(list).toBe(formLayout.systemControls);
        });

        it("updates a known system control", async () => {
            const updated = await client.updateSystemControl(
                { visible: false } as Control,
                AGILE_PROCESS_ID,
                BUG,
                "System.Reason"
            );
            expect(updated.id).toBe("System.Reason");
            expect(updated.label).toBe("Reason");
            expect(updated.visible).toBe(false);
            expect(systemControls[3].visible).toBe(true);
        });

        it("updates an unknown system control", async () => {
            const updated = await client.updateSystemControl(
                { label: "Unknown" } as Control,
                AGILE_PROCESS_ID,
                BUG,
                "System.Missing"
            );
            expect(updated.id).toBe("System.Missing");
            expect(updated.label).toBe("Unknown");
        });
    });
});

describe("work item tracking process layout fixtures", () => {
    it("makes a contribution", () => {
        const contribution = makeWitContribution();
        expect(contribution.inputs).toEqual({});
        expect(contribution.showOnDeletedWorkItem).toBe(false);
        expect(contribution.height).toBeGreaterThanOrEqual(50);
    });

    it("makes a field control without a contribution or a height", () => {
        const control = makeControl();
        expect(control.id.startsWith("Custom.")).toBe(true);
        expect(control.isContribution).toBe(false);
        expect(control.contribution).toBeUndefined();
        expect(control.height).toBeUndefined();
    });

    it("makes a control with the given id", () => {
        expect(makeControl("Custom.Effort").id).toBe("Custom.Effort");
    });

    it("makes an html control with a height", () => {
        expect(makeHtmlControl().id.startsWith("Custom.")).toBe(true);
        const control = makeHtmlControl("System.Description");
        expect(control.id).toBe("System.Description");
        expect(control.controlType).toBe("HtmlFieldControl");
        expect(control.height).toBeGreaterThanOrEqual(100);
    });

    it("makes a contribution control", () => {
        const control = makeContributionControl();
        expect(control.isContribution).toBe(true);
        expect(control.height).toBe(control.contribution.height);
    });

    it("makes a group", () => {
        const group = makeGroup();
        expect(group.controls.length).toBe(2);
        expect(group.contribution).toBeUndefined();
        expect(group.height).toBeUndefined();
        const control = makeControl();
        expect(makeGroup([control]).controls).toEqual([control]);
    });

    it("makes a contribution group without controls", () => {
        const group = makeContributionGroup();
        expect(group.isContribution).toBe(true);
        expect(group.controls).toEqual([]);
        expect(group.height).toBe(group.contribution.height);
    });

    it("makes a section", () => {
        const section = makeSection();
        expect(section.id).toBe("Section1");
        expect(section.groups.length).toBe(1);
        expect(makeSection("Section4", [])).toEqual({ groups: [], id: "Section4", overridden: false });
    });

    it("makes a page with four sections", () => {
        const page = makePage();
        expect(page.sections.map(s => s.groups.length)).toEqual([1, 1, 0, 0]);
        expect(page.contribution).toBeUndefined();
        expect(page.locked).toBe(false);
    });

    it("makes a contribution page without sections", () => {
        const page = makeContributionPage();
        expect(page.isContribution).toBe(true);
        expect(page.sections).toEqual([]);
        expect(typeof page.contribution.contributionId).toBe("string");
    });

    it("makes an extension", () => {
        expect(makeExtension().id).toContain(".");
    });

    it("makes the system controls", () => {
        const made = makeSystemControls();
        expect(made.map(c => c.order)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(made.every(c => c.inherited)).toBe(true);
    });

    it("makes a layout whose nodes have unique ids", () => {
        const layout = makeFormLayout();
        const madeGroups = layout.pages.flatMap(p => p.sections.flatMap(s => s.groups));
        const madeControls = madeGroups.flatMap(g => g.controls);
        expect(new Set(layout.pages.map(p => p.id)).size).toBe(layout.pages.length);
        expect(new Set(madeGroups.map(g => g.id)).size).toBe(madeGroups.length);
        expect(new Set(madeControls.map(c => c.id)).size).toBe(madeControls.length);
        expect(layout.pages.slice(1).every(p => p.locked && p.inherited)).toBe(true);
    });

    it("seeds flattened lookups over the layout", () => {
        expect(pages).toBe(formLayout.pages);
        expect(groups.length).toBe(8);
        expect(controls.length).toBe(9);
        expect(new Set(groups.map(g => g.id)).size).toBe(groups.length);
        expect(new Set(controls.map(c => c.id)).size).toBe(controls.length);
        expect(groups.filter(g => g.isContribution).length).toBe(1);
        expect(controls.filter(c => c.isContribution).length).toBe(1);
        expect(controls[0].controlType).toBe("HtmlFieldControl");
    });
});
