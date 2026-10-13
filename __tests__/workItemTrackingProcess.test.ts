import {
    CreateProcessModel,
    CreateProcessWorkItemTypeRequest,
    CustomizationType,
    GetBehaviorsExpand,
    GetProcessExpandLevel,
    GetWorkItemTypeExpand,
    ProcessBehaviorCreateRequest,
    WorkItemTrackingProcessRestClient
} from "azure-devops-extension-api/WorkItemTrackingProcess";
import {
    getClient,
    getRegisteredMockClient,
    MockWorkItemTrackingProcessRestClient
} from "../azure-devops-extension-api";
import {
    AGILE_PROCESS_ID,
    BASIC_PROCESS_ID,
    behaviors,
    CMMI_PROCESS_ID,
    EMPTY_PROCESS_ID,
    EPIC_BEHAVIOR,
    formLayout,
    makeProcessBehavior,
    makeProcessBehaviorField,
    makeProcessBehaviorReference,
    makeProcessInfo,
    makeProcessWorkItemType,
    makeProjectReference,
    makeWorkItemBehaviorReference,
    makeWorkItemTypeBehavior,
    ORDERED_BEHAVIOR,
    PORTFOLIO_BEHAVIOR,
    processes,
    REQUIREMENT_BEHAVIOR,
    SCRUM_PROCESS_ID,
    states,
    TASK_BEHAVIOR,
    workItemTypeBehaviors,
    workItemTypes
} from "../azure-devops-extension-api/workItemTrackingProcess/Data";

const BUG = "Microsoft.VSTS.WorkItemTypes.Bug";

describe("WorkItemTrackingProcessRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(WorkItemTrackingProcessRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(WorkItemTrackingProcessRestClient)).toBe(MockWorkItemTrackingProcessRestClient);
    });

    describe("processes", () => {
        it("creates a process echoing the posted model", async () => {
            const posted: CreateProcessModel = {
                description: "Our process",
                name: "Contoso Agile",
                parentProcessTypeId: SCRUM_PROCESS_ID,
                referenceName: "Contoso.Agile"
            };
            const created = await client.createNewProcess(posted);
            expect(created).toMatchObject(posted);
            expect(created.customizationType).toBe(CustomizationType.Inherited);
            expect(typeof created.typeId).toBe("string");
            expect(created.isEnabled).toBe(true);
            expect(created.projects).toBeUndefined();
        });

        it("fills a partially posted process from a fixture", async () => {
            const created = await client.createNewProcess({ name: "Partial" } as CreateProcessModel);
            expect(created.name).toBe("Partial");
            expect(created.parentProcessTypeId).toBe(AGILE_PROCESS_ID);
            expect(created.referenceName.startsWith("Inherited.")).toBe(true);
        });

        it("deletes a process", async () => {
            await expect(client.deleteProcessById(processes[4].typeId)).resolves.toBeUndefined();
        });

        it("edits a known process", async () => {
            const target = processes[4];
            const edited = await client.editProcess(
                { description: "Changed", isDefault: true, isEnabled: false, name: "Renamed" },
                target.typeId
            );
            expect(edited.typeId).toBe(target.typeId);
            expect(edited.name).toBe("Renamed");
            expect(edited.description).toBe("Changed");
            expect(edited.isDefault).toBe(true);
            expect(edited.isEnabled).toBe(false);
            expect(edited.referenceName).toBe(target.referenceName);
            expect(edited.projects).toBeUndefined();
            expect(target.isEnabled).toBe(true);
        });

        it("edits an unknown process", async () => {
            const edited = await client.editProcess(
                { description: "d", isDefault: false, isEnabled: true, name: "n" },
                "missing-process"
            );
            expect(edited.typeId).toBe("missing-process");
            expect(edited.name).toBe("n");
            expect(edited.customizationType).toBe(CustomizationType.Inherited);
        });

        it("lists every process without projects", async () => {
            const list = await client.getListOfProcesses();
            expect(list.map(p => p.typeId)).toEqual(processes.map(p => p.typeId));
            expect(list.slice(0, 4).map(p => p.name)).toEqual(["Agile", "Scrum", "CMMI", "Basic"]);
            expect(new Set(list.map(p => p.name)).size).toBe(list.length);
            for (const process of list) {
                expect(process.projects).toBeUndefined();
            }
        });

        it("lists every process without projects when asked for none", async () => {
            const list = await client.getListOfProcesses(GetProcessExpandLevel.None);
            expect(list.every(p => p.projects === undefined)).toBe(true);
        });

        it("lists every process with projects when asked to", async () => {
            const list = await client.getListOfProcesses(GetProcessExpandLevel.Projects);
            expect(list).toEqual(processes);
            expect(list[0].projects.length).toBe(1);
        });

        it("gets a known process", async () => {
            const process = await client.getProcessByItsId(CMMI_PROCESS_ID);
            expect(process.name).toBe("CMMI");
            expect(process.customizationType).toBe(CustomizationType.System);
            expect(process.parentProcessTypeId).toBe(EMPTY_PROCESS_ID);
            expect(process.projects).toBeUndefined();
        });

        it("gets a known process with its projects", async () => {
            expect(await client.getProcessByItsId(BASIC_PROCESS_ID, GetProcessExpandLevel.Projects)).toBe(processes[3]);
        });

        it("fabricates an unknown process", async () => {
            const process = await client.getProcessByItsId("missing-process", GetProcessExpandLevel.Projects);
            expect(process.typeId).toBe("missing-process");
            expect(process.customizationType).toBe(CustomizationType.Inherited);
            expect(typeof process.projects[0].id).toBe("string");
        });
    });

    describe("behaviors", () => {
        it("creates a behavior echoing the posted request", async () => {
            const posted: ProcessBehaviorCreateRequest = {
                color: "ff0000",
                inherits: PORTFOLIO_BEHAVIOR,
                name: "Initiatives",
                referenceName: "Custom.Initiatives"
            };
            const created = await client.createProcessBehavior(posted, AGILE_PROCESS_ID);
            expect(created.color).toBe("ff0000");
            expect(created.name).toBe("Initiatives");
            expect(created.referenceName).toBe("Custom.Initiatives");
            expect(created.inherits.behaviorRefName).toBe(PORTFOLIO_BEHAVIOR);
            expect(created.inherits.url.endsWith(PORTFOLIO_BEHAVIOR)).toBe(true);
            expect(created.customization).toBe(CustomizationType.Custom);
            expect(created.fields).toBeUndefined();
        });

        it("fills a partially posted behavior from a fixture", async () => {
            const created = await client.createProcessBehavior(
                { name: "Partial" } as ProcessBehaviorCreateRequest,
                AGILE_PROCESS_ID
            );
            expect(created.name).toBe("Partial");
            expect(created.referenceName.startsWith("Custom.")).toBe(true);
            expect(created.inherits.behaviorRefName).toBe(PORTFOLIO_BEHAVIOR);
            expect(typeof created.color).toBe("string");
        });

        it("deletes a behavior", async () => {
            await expect(client.deleteProcessBehavior(AGILE_PROCESS_ID, EPIC_BEHAVIOR)).resolves.toBeUndefined();
        });

        it("gets a known behavior without fields", async () => {
            const behavior = await client.getProcessBehavior(AGILE_PROCESS_ID, EPIC_BEHAVIOR);
            expect(behavior.name).toBe("Epics");
            expect(behavior.rank).toBe(40);
            expect(behavior.inherits.behaviorRefName).toBe(PORTFOLIO_BEHAVIOR);
            expect(behavior.fields).toBeUndefined();
        });

        it("gets a known behavior without fields when asked for none", async () => {
            const behavior = await client.getProcessBehavior(AGILE_PROCESS_ID, EPIC_BEHAVIOR, GetBehaviorsExpand.None);
            expect(behavior.fields).toBeUndefined();
        });

        it("gets a known behavior with its own fields", async () => {
            const behavior = await client.getProcessBehavior(AGILE_PROCESS_ID, EPIC_BEHAVIOR, GetBehaviorsExpand.Fields);
            expect(behavior).toEqual(behaviors[2]);
            expect(behavior.fields.map(f => f.referenceName)).toEqual([`${EPIC_BEHAVIOR}.Order`]);
        });

        it("gets a known behavior with the fields of every ancestor", async () => {
            const behavior = await client.getProcessBehavior(
                AGILE_PROCESS_ID,
                EPIC_BEHAVIOR,
                GetBehaviorsExpand.CombinedFields
            );
            expect(behavior.fields.map(f => f.referenceName)).toEqual([
                `${EPIC_BEHAVIOR}.Order`,
                `${PORTFOLIO_BEHAVIOR}.Order`,
                "Microsoft.VSTS.Common.StackRank"
            ]);
        });

        it("gets the root behavior with only its own fields combined", async () => {
            const behavior = await client.getProcessBehavior(
                AGILE_PROCESS_ID,
                ORDERED_BEHAVIOR,
                GetBehaviorsExpand.CombinedFields
            );
            expect(behavior.inherits).toBeUndefined();
            expect(behavior.fields).toEqual(behaviors[0].fields);
        });

        it("fabricates an unknown behavior", async () => {
            const behavior = await client.getProcessBehavior(AGILE_PROCESS_ID, "Custom.Missing", GetBehaviorsExpand.Fields);
            expect(behavior.referenceName).toBe("Custom.Missing");
            expect(behavior.customization).toBe(CustomizationType.Custom);
            expect(behavior.fields.length).toBe(1);
        });

        it("lists every behavior", async () => {
            const list = await client.getProcessBehaviors(AGILE_PROCESS_ID);
            expect(list.map(b => b.referenceName)).toEqual(behaviors.map(b => b.referenceName));
            expect(new Set(list.map(b => b.referenceName)).size).toBe(list.length);
            expect(list.every(b => b.fields === undefined)).toBe(true);
        });

        it("lists every behavior with fields", async () => {
            expect(await client.getProcessBehaviors(AGILE_PROCESS_ID, GetBehaviorsExpand.Fields)).toEqual(behaviors);
        });

        it("updates a known behavior", async () => {
            const target = behaviors[2];
            const updated = await client.updateProcessBehavior(
                { color: "00ff00", name: "Initiatives" },
                AGILE_PROCESS_ID,
                EPIC_BEHAVIOR
            );
            expect(updated.referenceName).toBe(EPIC_BEHAVIOR);
            expect(updated.color).toBe("00ff00");
            expect(updated.name).toBe("Initiatives");
            expect(updated.rank).toBe(target.rank);
            expect(target.name).toBe("Epics");
        });

        it("updates an unknown behavior", async () => {
            const updated = await client.updateProcessBehavior(
                { color: "00ff00", name: "Unknown" },
                AGILE_PROCESS_ID,
                "Custom.Missing"
            );
            expect(updated.referenceName).toBe("Custom.Missing");
            expect(updated.name).toBe("Unknown");
        });
    });

    describe("work item types", () => {
        it("creates a custom work item type echoing the posted request", async () => {
            const posted = {
                color: "f6546a",
                description: "A risk",
                icon: "icon_flame",
                isDisabled: false,
                name: "Risk"
            } as CreateProcessWorkItemTypeRequest;
            const created = await client.createProcessWorkItemType(posted, AGILE_PROCESS_ID);
            expect(created).toMatchObject(posted);
            expect(created.customization).toBe(CustomizationType.Custom);
            expect(created.inherits).toBeUndefined();
            expect(created.referenceName.startsWith("Custom.")).toBe(true);
            expect(created.states).toBeUndefined();
            expect(created.behaviors).toBeUndefined();
            expect(created.layout).toBeUndefined();
            expect("inheritsFrom" in created).toBe(false);
        });

        it("creates an inherited work item type", async () => {
            const created = await client.createProcessWorkItemType(
                { color: "cc293d", description: "", icon: "icon_insect", inheritsFrom: BUG, isDisabled: false, name: "Bug" },
                AGILE_PROCESS_ID
            );
            expect(created.customization).toBe(CustomizationType.Inherited);
            expect(created.inherits).toBe(BUG);
            expect(created.name).toBe("Bug");
        });

        it("deletes a work item type", async () => {
            await expect(client.deleteProcessWorkItemType(AGILE_PROCESS_ID, BUG)).resolves.toBeUndefined();
        });

        it("gets a known work item type without expanded properties", async () => {
            const type = await client.getProcessWorkItemType(AGILE_PROCESS_ID, BUG);
            expect(type.name).toBe("Bug");
            expect(type.customization).toBe(CustomizationType.System);
            expect(type.inherits).toBeUndefined();
            expect(type.states).toBeUndefined();
            expect(type.behaviors).toBeUndefined();
            expect(type.layout).toBeUndefined();
        });

        it("gets a known work item type with states", async () => {
            const type = await client.getProcessWorkItemType(AGILE_PROCESS_ID, BUG, GetWorkItemTypeExpand.States);
            expect(type.states).toBe(states);
            expect(type.behaviors).toBeUndefined();
            expect(type.layout).toBeUndefined();
        });

        it("gets a known work item type with behaviors", async () => {
            const type = await client.getProcessWorkItemType(AGILE_PROCESS_ID, BUG, GetWorkItemTypeExpand.Behaviors);
            expect(type.states).toBeUndefined();
            expect(type.behaviors).toBe(workItemTypeBehaviors);
            expect(type.layout).toBeUndefined();
        });

        it("gets a known work item type with layout", async () => {
            const type = await client.getProcessWorkItemType(AGILE_PROCESS_ID, BUG, GetWorkItemTypeExpand.Layout);
            expect(type.states).toBeUndefined();
            expect(type.behaviors).toBeUndefined();
            expect(type.layout).toBe(formLayout);
        });

        it("gets a known work item type with combined expand flags", async () => {
            const type = await client.getProcessWorkItemType(
                AGILE_PROCESS_ID,
                BUG,
                GetWorkItemTypeExpand.States | GetWorkItemTypeExpand.Behaviors | GetWorkItemTypeExpand.Layout
            );
            expect(type).toEqual(workItemTypes[0]);
        });

        it("fabricates an unknown work item type", async () => {
            const type = await client.getProcessWorkItemType(AGILE_PROCESS_ID, "Custom.Missing", GetWorkItemTypeExpand.States);
            expect(type.referenceName).toBe("Custom.Missing");
            expect(type.customization).toBe(CustomizationType.Custom);
            expect(type.states.length).toBe(states.length);
        });

        it("lists every work item type", async () => {
            const list = await client.getProcessWorkItemTypes(AGILE_PROCESS_ID);
            expect(list.map(t => t.referenceName)).toEqual(workItemTypes.map(t => t.referenceName));
            expect(list.slice(0, 5).map(t => t.name)).toEqual(["Bug", "Epic", "Feature", "Task", "User Story"]);
            expect(list[4].referenceName).toBe("Microsoft.VSTS.WorkItemTypes.UserStory");
            expect(new Set(list.map(t => t.referenceName)).size).toBe(list.length);
            expect(list.every(t => t.states === undefined)).toBe(true);
        });

        it("lists every work item type with states", async () => {
            const list = await client.getProcessWorkItemTypes(AGILE_PROCESS_ID, GetWorkItemTypeExpand.States);
            expect(list.every(t => t.states === states)).toBe(true);
        });

        it("updates a known work item type", async () => {
            const target = workItemTypes[3];
            const updated = await client.updateProcessWorkItemType(
                { color: "000000", description: "Changed", icon: "icon_star", isDisabled: true },
                AGILE_PROCESS_ID,
                target.referenceName
            );
            expect(updated.referenceName).toBe(target.referenceName);
            expect(updated.name).toBe("Task");
            expect(updated.color).toBe("000000");
            expect(updated.icon).toBe("icon_star");
            expect(updated.isDisabled).toBe(true);
            expect(updated.states).toBeUndefined();
            expect(target.isDisabled).toBe(false);
        });

        it("updates an unknown work item type", async () => {
            const updated = await client.updateProcessWorkItemType(
                { color: "000000", description: "Changed", icon: "icon_star", isDisabled: true },
                AGILE_PROCESS_ID,
                "Custom.Missing"
            );
            expect(updated.referenceName).toBe("Custom.Missing");
            expect(updated.description).toBe("Changed");
        });
    });

    describe("work item type behaviors", () => {
        it("adds a behavior echoing the posted object", async () => {
            const posted = { ...makeWorkItemTypeBehavior(EPIC_BEHAVIOR), isDefault: true };
            const added = await client.addBehaviorToWorkItemType(posted, AGILE_PROCESS_ID, BUG);
            expect(added).toEqual(posted);
            expect(added).not.toBe(posted);
        });

        it("gets a known behavior", async () => {
            const behavior = await client.getBehaviorForWorkItemType(AGILE_PROCESS_ID, BUG, REQUIREMENT_BEHAVIOR);
            expect(behavior).toBe(workItemTypeBehaviors[0]);
            expect(behavior.isDefault).toBe(true);
        });

        it("fabricates an unknown behavior", async () => {
            const behavior = await client.getBehaviorForWorkItemType(AGILE_PROCESS_ID, BUG, "Custom.Missing");
            expect(behavior.behavior.id).toBe("Custom.Missing");
            expect(behavior.isDefault).toBe(false);
            expect(behavior.url.endsWith("Custom.Missing")).toBe(true);
        });

        it("lists the behaviors", async () => {
            const list = await client.getBehaviorsForWorkItemType(AGILE_PROCESS_ID, BUG);
            expect(list).toBe(workItemTypeBehaviors);
            expect(list.map(b => b.behavior.id)).toEqual([REQUIREMENT_BEHAVIOR, TASK_BEHAVIOR]);
        });

        it("removes a behavior", async () => {
            await expect(
                client.removeBehaviorFromWorkItemType(AGILE_PROCESS_ID, BUG, TASK_BEHAVIOR)
            ).resolves.toBeUndefined();
        });

        it("updates a known behavior", async () => {
            const target = workItemTypeBehaviors[1];
            const updated = await client.updateBehaviorToWorkItemType(
                { ...target, isDefault: true },
                AGILE_PROCESS_ID,
                BUG
            );
            expect(updated.behavior).toBe(target.behavior);
            expect(updated.isDefault).toBe(true);
            expect(target.isDefault).toBe(false);
        });

        it("updates an unknown behavior", async () => {
            const posted = makeWorkItemTypeBehavior("Custom.Missing");
            const updated = await client.updateBehaviorToWorkItemType(posted, AGILE_PROCESS_ID, BUG);
            expect(updated).toEqual(posted);
        });
    });
});

describe("work item tracking process fixtures", () => {
    it("makes a project reference", () => {
        const project = makeProjectReference();
        expect(project.url.endsWith(project.id)).toBe(true);
        expect(typeof project.name).toBe("string");
    });

    it("makes an inherited process", () => {
        const process = makeProcessInfo();
        expect(process.customizationType).toBe(CustomizationType.Inherited);
        expect(process.parentProcessTypeId).toBe(AGILE_PROCESS_ID);
        expect(process.isDefault).toBe(false);
    });

    it("seeds one default process", () => {
        expect(processes.filter(p => p.isDefault).map(p => p.typeId)).toEqual([AGILE_PROCESS_ID]);
        expect(new Set(processes.map(p => p.typeId)).size).toBe(processes.length);
    });

    it("makes a behavior field named after its reference name", () => {
        expect(makeProcessBehaviorField("Custom.Effort").name).toBe("Effort");
        expect(makeProcessBehaviorField().referenceName.startsWith("Custom.")).toBe(true);
    });

    it("makes a behavior reference", () => {
        const reference = makeProcessBehaviorReference(TASK_BEHAVIOR);
        expect(reference.behaviorRefName).toBe(TASK_BEHAVIOR);
        expect(reference.url.endsWith(TASK_BEHAVIOR)).toBe(true);
    });

    it("makes a custom behavior under the portfolio behavior", () => {
        const behavior = makeProcessBehavior();
        expect(behavior.inherits.behaviorRefName).toBe(PORTFOLIO_BEHAVIOR);
        expect(behavior.url.endsWith(behavior.referenceName)).toBe(true);
    });

    it("seeds behaviors whose parents are seeded", () => {
        const names = new Set(behaviors.map(b => b.referenceName));
        const children = behaviors.filter(b => b.referenceName !== ORDERED_BEHAVIOR);
        expect(children.every(b => names.has(b.inherits.behaviorRefName))).toBe(true);
    });

    it("makes a work item behavior reference", () => {
        expect(makeWorkItemBehaviorReference().id).toBe(REQUIREMENT_BEHAVIOR);
        expect(makeWorkItemBehaviorReference(TASK_BEHAVIOR).id).toBe(TASK_BEHAVIOR);
    });

    it("makes a work item type behavior", () => {
        const behavior = makeWorkItemTypeBehavior();
        expect(behavior.behavior.id).toBe(REQUIREMENT_BEHAVIOR);
        expect(behavior.url).toBe(behavior.behavior.url);
        expect(behavior.isLegacyDefault).toBe(false);
    });

    it("makes a custom work item type", () => {
        const type = makeProcessWorkItemType();
        expect(type.referenceName).toBe(`Custom.${type.name.replace(" ", "")}`);
        expect(type.inherits).toBeUndefined();
        expect(type.layout).toBe(formLayout);
        expect(type.url.endsWith(type.referenceName)).toBe(true);
    });
});
