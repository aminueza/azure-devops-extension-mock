import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import { fake } from "../common/fixtures";
import {
    AddProcessWorkItemTypeFieldRequest,
    Control,
    CreateProcessModel,
    CreateProcessRuleRequest,
    CreateProcessWorkItemTypeRequest,
    CustomizationType,
    FormLayout,
    GetBehaviorsExpand,
    GetProcessExpandLevel,
    GetWorkItemTypeExpand,
    Group,
    HideStateModel,
    Page,
    PickList,
    PickListMetadata,
    ProcessBehavior,
    ProcessBehaviorCreateRequest,
    ProcessBehaviorField,
    ProcessBehaviorUpdateRequest,
    ProcessInfo,
    ProcessRule,
    ProcessWorkItemType,
    ProcessWorkItemTypeField,
    ProcessWorkItemTypeFieldsExpandLevel,
    UpdateProcessModel,
    UpdateProcessRuleRequest,
    UpdateProcessWorkItemTypeFieldRequest,
    UpdateProcessWorkItemTypeRequest,
    WorkItemStateInputModel,
    WorkItemStateResultModel,
    WorkItemTrackingProcessRestClient,
    WorkItemTypeBehavior
} from "azure-devops-extension-api/WorkItemTrackingProcess";
import {
    behaviors,
    controls,
    fields,
    formLayout,
    groups,
    lists,
    makeControl,
    makeGroup,
    makePage,
    makePickList,
    makePickListMetadata,
    makeProcessBehavior,
    makeProcessBehaviorReference,
    makeProcessInfo,
    makeProcessRule,
    makeProcessWorkItemType,
    makeProcessWorkItemTypeField,
    makeWorkItemStateResultModel,
    makeWorkItemTypeBehavior,
    pages,
    processes,
    rules,
    states,
    systemControls,
    workItemTypeBehaviors,
    workItemTypes
} from "./Data";

const findProcess = (typeId: string): ProcessInfo =>
    processes.find(p => p.typeId === typeId) ?? { ...makeProcessInfo(), typeId };

const expandProcess = (process: ProcessInfo, expand?: GetProcessExpandLevel): ProcessInfo =>
    expand === GetProcessExpandLevel.Projects ? process : { ...process, projects: fake.helpers.absent() };

const findBehavior = (referenceName: string): ProcessBehavior =>
    behaviors.find(b => b.referenceName === referenceName) ?? { ...makeProcessBehavior(), referenceName };

const combinedFields = (behavior: ProcessBehavior): ProcessBehaviorField[] => {
    const parent = behaviors.find(b => b.referenceName === behavior.inherits?.behaviorRefName);
    return parent === undefined ? behavior.fields : [...behavior.fields, ...combinedFields(parent)];
};

const behaviorFields = (behavior: ProcessBehavior, expand?: GetBehaviorsExpand): ProcessBehaviorField[] => {
    if (expand === GetBehaviorsExpand.Fields) {
        return behavior.fields;
    }
    return expand === GetBehaviorsExpand.CombinedFields ? combinedFields(behavior) : fake.helpers.absent();
};

const expandBehavior = (behavior: ProcessBehavior, expand?: GetBehaviorsExpand): ProcessBehavior => ({
    ...behavior,
    fields: behaviorFields(behavior, expand)
});

const findWorkItemType = (referenceName: string): ProcessWorkItemType =>
    workItemTypes.find(t => t.referenceName === referenceName) ?? { ...makeProcessWorkItemType(), referenceName };

const expandWorkItemType = (
    type: ProcessWorkItemType,
    expand: GetWorkItemTypeExpand = GetWorkItemTypeExpand.None
): ProcessWorkItemType => ({
    ...type,
    states: (expand & GetWorkItemTypeExpand.States) === 0 ? fake.helpers.absent() : type.states,
    behaviors: (expand & GetWorkItemTypeExpand.Behaviors) === 0 ? fake.helpers.absent() : type.behaviors,
    layout: (expand & GetWorkItemTypeExpand.Layout) === 0 ? fake.helpers.absent() : type.layout
});

const findField = (referenceName: string): ProcessWorkItemTypeField =>
    fields.find(f => f.referenceName === referenceName) ?? { ...makeProcessWorkItemTypeField(), referenceName };

const withoutAllowedValues = (field: ProcessWorkItemTypeField): ProcessWorkItemTypeField => ({
    ...field,
    allowedValues: fake.helpers.absent()
});

const findWorkItemTypeBehavior = (behaviorRefName: string): WorkItemTypeBehavior =>
    workItemTypeBehaviors.find(b => b.behavior.id === behaviorRefName) ?? makeWorkItemTypeBehavior(behaviorRefName);

const findPage = (pageId: string): Page => pages.find(p => p.id === pageId) ?? { ...makePage(), id: pageId };

const findGroup = (groupId: string): Group => groups.find(g => g.id === groupId) ?? { ...makeGroup(), id: groupId };

const findControl = (controlId: string): Control => controls.find(c => c.id === controlId) ?? makeControl(controlId);

const findSystemControl = (controlId: string): Control =>
    systemControls.find(c => c.id === controlId) ?? makeControl(controlId);

const findList = (listId: string): PickList => lists.find(l => l.id === listId) ?? { ...makePickList(), id: listId };

const findRule = (ruleId: string): ProcessRule => rules.find(r => r.id === ruleId) ?? { ...makeProcessRule(), id: ruleId };

const findState = (stateId: string): WorkItemStateResultModel =>
    states.find(s => s.id === stateId) ?? { ...makeWorkItemStateResultModel(), id: stateId };

export class MockWorkItemTrackingProcessRestClient extends RestClientBase {
    public TYPE = WorkItemTrackingProcessRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createProcessBehavior(behavior: ProcessBehaviorCreateRequest, _processId: string): Promise<ProcessBehavior> {
        const { inherits, ...posted } = behavior;
        const fixture = makeProcessBehavior();
        return Promise.resolve({
            ...fixture,
            ...posted,
            fields: fake.helpers.absent(),
            inherits: inherits ? makeProcessBehaviorReference(inherits) : fixture.inherits
        });
    }

    deleteProcessBehavior(_processId: string, _behaviorRefName: string): Promise<void> {
        return Promise.resolve();
    }

    getProcessBehavior(
        _processId: string,
        behaviorRefName: string,
        expand?: GetBehaviorsExpand
    ): Promise<ProcessBehavior> {
        return Promise.resolve(expandBehavior(findBehavior(behaviorRefName), expand));
    }

    getProcessBehaviors(_processId: string, expand?: GetBehaviorsExpand): Promise<ProcessBehavior[]> {
        return Promise.resolve(behaviors.map(b => expandBehavior(b, expand)));
    }

    updateProcessBehavior(
        behaviorData: ProcessBehaviorUpdateRequest,
        _processId: string,
        behaviorRefName: string
    ): Promise<ProcessBehavior> {
        return Promise.resolve({
            ...expandBehavior(findBehavior(behaviorRefName)),
            ...behaviorData,
            referenceName: behaviorRefName
        });
    }

    createControlInGroup(control: Control, _processId: string, _witRefName: string, _groupId: string): Promise<Control> {
        return Promise.resolve({ ...makeControl(), ...control });
    }

    moveControlToGroup(
        control: Control,
        _processId: string,
        _witRefName: string,
        _groupId: string,
        controlId: string,
        _removeFromGroupId?: string
    ): Promise<Control> {
        return Promise.resolve({ ...findControl(controlId), ...control, id: controlId });
    }

    removeControlFromGroup(
        _processId: string,
        _witRefName: string,
        _groupId: string,
        _controlId: string
    ): Promise<void> {
        return Promise.resolve();
    }

    updateControl(
        control: Control,
        _processId: string,
        _witRefName: string,
        _groupId: string,
        controlId: string
    ): Promise<Control> {
        return Promise.resolve({ ...findControl(controlId), ...control, id: controlId });
    }

    addFieldToWorkItemType(
        field: AddProcessWorkItemTypeFieldRequest,
        _processId: string,
        _witRefName: string
    ): Promise<ProcessWorkItemTypeField> {
        return Promise.resolve({ ...findField(field.referenceName), ...field });
    }

    getAllWorkItemTypeFields(_processId: string, _witRefName: string): Promise<ProcessWorkItemTypeField[]> {
        return Promise.resolve(fields.map(withoutAllowedValues));
    }

    getWorkItemTypeField(
        _processId: string,
        _witRefName: string,
        fieldRefName: string,
        expand?: ProcessWorkItemTypeFieldsExpandLevel
    ): Promise<ProcessWorkItemTypeField> {
        const field = findField(fieldRefName);
        return Promise.resolve(
            expand === ProcessWorkItemTypeFieldsExpandLevel.AllowedValues ||
                expand === ProcessWorkItemTypeFieldsExpandLevel.All
                ? field
                : withoutAllowedValues(field)
        );
    }

    removeWorkItemTypeField(_processId: string, _witRefName: string, _fieldRefName: string): Promise<void> {
        return Promise.resolve();
    }

    updateWorkItemTypeField(
        field: UpdateProcessWorkItemTypeFieldRequest,
        _processId: string,
        _witRefName: string,
        fieldRefName: string
    ): Promise<ProcessWorkItemTypeField> {
        return Promise.resolve({ ...findField(fieldRefName), ...field, referenceName: fieldRefName });
    }

    addGroup(
        group: Group,
        _processId: string,
        _witRefName: string,
        _pageId: string,
        _sectionId: string
    ): Promise<Group> {
        return Promise.resolve({ ...makeGroup(), ...group });
    }

    moveGroupToPage(
        group: Group,
        _processId: string,
        _witRefName: string,
        _pageId: string,
        _sectionId: string,
        groupId: string,
        _removeFromPageId: string,
        _removeFromSectionId: string
    ): Promise<Group> {
        return Promise.resolve({ ...findGroup(groupId), ...group, id: groupId });
    }

    moveGroupToSection(
        group: Group,
        _processId: string,
        _witRefName: string,
        _pageId: string,
        _sectionId: string,
        groupId: string,
        _removeFromSectionId: string
    ): Promise<Group> {
        return Promise.resolve({ ...findGroup(groupId), ...group, id: groupId });
    }

    removeGroup(
        _processId: string,
        _witRefName: string,
        _pageId: string,
        _sectionId: string,
        _groupId: string
    ): Promise<void> {
        return Promise.resolve();
    }

    updateGroup(
        group: Group,
        _processId: string,
        _witRefName: string,
        _pageId: string,
        _sectionId: string,
        groupId: string
    ): Promise<Group> {
        return Promise.resolve({ ...findGroup(groupId), ...group, id: groupId });
    }

    getFormLayout(_processId: string, _witRefName: string): Promise<FormLayout> {
        return Promise.resolve(formLayout);
    }

    createList(picklist: PickList): Promise<PickList> {
        return Promise.resolve({ ...makePickList(), ...picklist });
    }

    deleteList(_listId: string): Promise<void> {
        return Promise.resolve();
    }

    getList(listId: string): Promise<PickList> {
        return Promise.resolve(findList(listId));
    }

    getListsMetadata(): Promise<PickListMetadata[]> {
        return Promise.resolve(lists.map(makePickListMetadata));
    }

    updateList(picklist: PickList, listId: string): Promise<PickList> {
        return Promise.resolve({ ...findList(listId), ...picklist, id: listId });
    }

    addPage(page: Page, _processId: string, _witRefName: string): Promise<Page> {
        return Promise.resolve({ ...makePage(), ...page });
    }

    removePage(_processId: string, _witRefName: string, _pageId: string): Promise<void> {
        return Promise.resolve();
    }

    updatePage(page: Page, _processId: string, _witRefName: string): Promise<Page> {
        return Promise.resolve({ ...findPage(page.id), ...page });
    }

    createNewProcess(createRequest: CreateProcessModel): Promise<ProcessInfo> {
        return Promise.resolve({
            ...expandProcess(makeProcessInfo()),
            ...createRequest,
            customizationType: CustomizationType.Inherited
        });
    }

    deleteProcessById(_processTypeId: string): Promise<void> {
        return Promise.resolve();
    }

    editProcess(updateRequest: UpdateProcessModel, processTypeId: string): Promise<ProcessInfo> {
        return Promise.resolve({
            ...expandProcess(findProcess(processTypeId)),
            ...updateRequest,
            typeId: processTypeId
        });
    }

    getListOfProcesses(expand?: GetProcessExpandLevel): Promise<ProcessInfo[]> {
        return Promise.resolve(processes.map(p => expandProcess(p, expand)));
    }

    getProcessByItsId(processTypeId: string, expand?: GetProcessExpandLevel): Promise<ProcessInfo> {
        return Promise.resolve(expandProcess(findProcess(processTypeId), expand));
    }

    addProcessWorkItemTypeRule(
        processRuleCreate: CreateProcessRuleRequest,
        _processId: string,
        _witRefName: string
    ): Promise<ProcessRule> {
        return Promise.resolve({
            ...makeProcessRule(),
            ...processRuleCreate,
            customizationType: CustomizationType.Custom
        });
    }

    deleteProcessWorkItemTypeRule(_processId: string, _witRefName: string, _ruleId: string): Promise<void> {
        return Promise.resolve();
    }

    getProcessWorkItemTypeRule(_processId: string, _witRefName: string, ruleId: string): Promise<ProcessRule> {
        return Promise.resolve(findRule(ruleId));
    }

    getProcessWorkItemTypeRules(_processId: string, _witRefName: string): Promise<ProcessRule[]> {
        return Promise.resolve(rules);
    }

    updateProcessWorkItemTypeRule(
        processRule: UpdateProcessRuleRequest,
        _processId: string,
        _witRefName: string,
        ruleId: string
    ): Promise<ProcessRule> {
        return Promise.resolve({ ...findRule(ruleId), ...processRule, id: ruleId });
    }

    createStateDefinition(
        stateModel: WorkItemStateInputModel,
        _processId: string,
        _witRefName: string
    ): Promise<WorkItemStateResultModel> {
        return Promise.resolve({
            ...makeWorkItemStateResultModel(),
            ...stateModel,
            customizationType: CustomizationType.Custom
        });
    }

    deleteStateDefinition(_processId: string, _witRefName: string, _stateId: string): Promise<void> {
        return Promise.resolve();
    }

    getStateDefinition(_processId: string, _witRefName: string, stateId: string): Promise<WorkItemStateResultModel> {
        return Promise.resolve(findState(stateId));
    }

    getStateDefinitions(_processId: string, _witRefName: string): Promise<WorkItemStateResultModel[]> {
        return Promise.resolve(states);
    }

    hideStateDefinition(
        hideStateModel: HideStateModel,
        _processId: string,
        _witRefName: string,
        stateId: string
    ): Promise<WorkItemStateResultModel> {
        return Promise.resolve({ ...findState(stateId), hidden: hideStateModel.hidden });
    }

    updateStateDefinition(
        stateModel: WorkItemStateInputModel,
        _processId: string,
        _witRefName: string,
        stateId: string
    ): Promise<WorkItemStateResultModel> {
        return Promise.resolve({ ...findState(stateId), ...stateModel, id: stateId });
    }

    deleteSystemControl(_processId: string, _witRefName: string, controlId: string): Promise<Control[]> {
        return Promise.resolve(systemControls.filter(c => c.id !== controlId));
    }

    getSystemControls(_processId: string, _witRefName: string): Promise<Control[]> {
        return Promise.resolve(systemControls);
    }

    updateSystemControl(
        control: Control,
        _processId: string,
        _witRefName: string,
        controlId: string
    ): Promise<Control> {
        return Promise.resolve({ ...findSystemControl(controlId), ...control, id: controlId });
    }

    createProcessWorkItemType(
        workItemType: CreateProcessWorkItemTypeRequest,
        _processId: string
    ): Promise<ProcessWorkItemType> {
        const { inheritsFrom, ...posted } = workItemType;
        return Promise.resolve({
            ...expandWorkItemType(makeProcessWorkItemType()),
            ...posted,
            customization: inheritsFrom ? CustomizationType.Inherited : CustomizationType.Custom,
            inherits: inheritsFrom
        });
    }

    deleteProcessWorkItemType(_processId: string, _witRefName: string): Promise<void> {
        return Promise.resolve();
    }

    getProcessWorkItemType(
        _processId: string,
        witRefName: string,
        expand?: GetWorkItemTypeExpand
    ): Promise<ProcessWorkItemType> {
        return Promise.resolve(expandWorkItemType(findWorkItemType(witRefName), expand));
    }

    getProcessWorkItemTypes(_processId: string, expand?: GetWorkItemTypeExpand): Promise<ProcessWorkItemType[]> {
        return Promise.resolve(workItemTypes.map(t => expandWorkItemType(t, expand)));
    }

    updateProcessWorkItemType(
        workItemTypeUpdate: UpdateProcessWorkItemTypeRequest,
        _processId: string,
        witRefName: string
    ): Promise<ProcessWorkItemType> {
        return Promise.resolve({
            ...expandWorkItemType(findWorkItemType(witRefName)),
            ...workItemTypeUpdate,
            referenceName: witRefName
        });
    }

    addBehaviorToWorkItemType(
        behavior: WorkItemTypeBehavior,
        _processId: string,
        _witRefNameForBehaviors: string
    ): Promise<WorkItemTypeBehavior> {
        return Promise.resolve({ ...makeWorkItemTypeBehavior(), ...behavior });
    }

    getBehaviorForWorkItemType(
        _processId: string,
        _witRefNameForBehaviors: string,
        behaviorRefName: string
    ): Promise<WorkItemTypeBehavior> {
        return Promise.resolve(findWorkItemTypeBehavior(behaviorRefName));
    }

    getBehaviorsForWorkItemType(_processId: string, _witRefNameForBehaviors: string): Promise<WorkItemTypeBehavior[]> {
        return Promise.resolve(workItemTypeBehaviors);
    }

    removeBehaviorFromWorkItemType(
        _processId: string,
        _witRefNameForBehaviors: string,
        _behaviorRefName: string
    ): Promise<void> {
        return Promise.resolve();
    }

    updateBehaviorToWorkItemType(
        behavior: WorkItemTypeBehavior,
        _processId: string,
        _witRefNameForBehaviors: string
    ): Promise<WorkItemTypeBehavior> {
        return Promise.resolve({ ...findWorkItemTypeBehavior(behavior.behavior.id), ...behavior });
    }
}
