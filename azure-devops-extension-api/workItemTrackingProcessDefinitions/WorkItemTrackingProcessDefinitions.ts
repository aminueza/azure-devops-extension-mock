import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    BehaviorCreateModel,
    BehaviorModel,
    BehaviorReplaceModel,
    Control,
    FieldModel,
    FieldUpdate,
    FormLayout,
    GetWorkItemTypeExpand,
    Group,
    HideStateModel,
    Page,
    PickListMetadataModel,
    PickListModel,
    WorkItemStateInputModel,
    WorkItemStateResultModel,
    WorkItemTrackingProcessDefinitionsRestClient,
    WorkItemTypeBehavior,
    WorkItemTypeFieldModel2,
    WorkItemTypeModel,
    WorkItemTypeUpdateModel
} from "azure-devops-extension-api/WorkItemTrackingProcessDefinitions";
import {
    behaviors,
    controls,
    fields,
    groups,
    lists,
    makeBehavior,
    makeBehaviorReference,
    makeControl,
    makeField,
    makeGroup,
    makePage,
    makePickList,
    makePickListMetadata,
    makeWorkItemState,
    makeWorkItemType,
    makeWorkItemTypeBehavior,
    makeWorkItemTypeField,
    pages,
    states,
    workItemTypeFields,
    workItemTypes
} from "./Data";

const findBehavior = (behaviorId: string): BehaviorModel =>
    behaviors.find(b => b.id === behaviorId) ?? makeBehavior(behaviorId);

const findControl = (controlId: string): Control => controls.find(c => c.id === controlId) ?? makeControl(controlId);

const findField = (fieldId: string): FieldModel => fields.find(f => f.id === fieldId) ?? makeField(fieldId);

const findGroup = (groupId: string): Group => groups.find(g => g.id === groupId) ?? { ...makeGroup(), id: groupId };

const findList = (listId: string): PickListModel =>
    lists.find(l => l.id === listId) ?? { ...makePickList(), id: listId };

const findPage = (pageId: string): Page => pages.find(p => p.id === pageId) ?? { ...makePage(), id: pageId };

const findState = (stateId: string): WorkItemStateResultModel =>
    states.find(s => s.id === stateId) ?? { ...makeWorkItemState(), id: stateId };

const findWorkItemType = (witRefName: string): WorkItemTypeModel =>
    workItemTypes.find(t => t.id === witRefName) ?? makeWorkItemType(witRefName);

const findWorkItemTypeBehavior = (witRefName: string, behaviorRefName: string): WorkItemTypeBehavior => {
    const known = findWorkItemType(witRefName).behaviors.find(b => b.behavior.id === behaviorRefName);
    return known ?? makeWorkItemTypeBehavior(makeBehaviorReference(behaviorRefName));
};

const findWorkItemTypeField = (fieldRefName: string): WorkItemTypeFieldModel2 =>
    workItemTypeFields.find(f => f.referenceName === fieldRefName) ?? makeWorkItemTypeField(fieldRefName);

export class MockWorkItemTrackingProcessDefinitionsRestClient extends RestClientBase {
    public TYPE = WorkItemTrackingProcessDefinitionsRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createBehavior(behavior: BehaviorCreateModel, _processId: string): Promise<BehaviorModel> {
        const { inherits, ...posted } = behavior;
        return Promise.resolve({ ...makeBehavior(), ...posted, inherits: makeBehaviorReference(inherits) });
    }

    deleteBehavior(_processId: string, _behaviorId: string): Promise<void> {
        return Promise.resolve();
    }

    getBehavior(_processId: string, behaviorId: string): Promise<BehaviorModel> {
        return Promise.resolve(findBehavior(behaviorId));
    }

    getBehaviors(_processId: string): Promise<BehaviorModel[]> {
        return Promise.resolve(behaviors);
    }

    replaceBehavior(
        behaviorData: BehaviorReplaceModel,
        _processId: string,
        behaviorId: string
    ): Promise<BehaviorModel> {
        return Promise.resolve({ ...findBehavior(behaviorId), ...behaviorData });
    }

    addControlToGroup(control: Control, _processId: string, _witRefName: string, _groupId: string): Promise<Control> {
        return Promise.resolve({ ...makeControl(), ...control });
    }

    editControl(
        control: Control,
        _processId: string,
        _witRefName: string,
        _groupId: string,
        controlId: string
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

    setControlInGroup(
        control: Control,
        _processId: string,
        _witRefName: string,
        _groupId: string,
        controlId: string,
        _removeFromGroupId?: string
    ): Promise<Control> {
        return Promise.resolve({ ...findControl(controlId), ...control, id: controlId });
    }

    createField(field: FieldModel, _processId: string): Promise<FieldModel> {
        return Promise.resolve({ ...makeField(), ...field });
    }

    updateField(field: FieldUpdate, _processId: string): Promise<FieldModel> {
        return Promise.resolve({ ...findField(field.id), ...field });
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

    editGroup(
        group: Group,
        _processId: string,
        _witRefName: string,
        _pageId: string,
        _sectionId: string,
        groupId: string
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

    setGroupInPage(
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

    setGroupInSection(
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

    getFormLayout(_processId: string, witRefName: string): Promise<FormLayout> {
        return Promise.resolve(findWorkItemType(witRefName).layout);
    }

    getListsMetadata(): Promise<PickListMetadataModel[]> {
        return Promise.resolve(lists.map(makePickListMetadata));
    }

    createList(picklist: PickListModel): Promise<PickListModel> {
        return Promise.resolve({ ...makePickList(), ...picklist });
    }

    deleteList(_listId: string): Promise<void> {
        return Promise.resolve();
    }

    getList(listId: string): Promise<PickListModel> {
        return Promise.resolve(findList(listId));
    }

    updateList(picklist: PickListModel, listId: string): Promise<PickListModel> {
        return Promise.resolve({ ...findList(listId), ...picklist, id: listId });
    }

    addPage(page: Page, _processId: string, _witRefName: string): Promise<Page> {
        return Promise.resolve({ ...makePage(), ...page });
    }

    editPage(page: Page, _processId: string, _witRefName: string): Promise<Page> {
        return Promise.resolve({ ...findPage(page.id), ...page });
    }

    removePage(_processId: string, _witRefName: string, _pageId: string): Promise<void> {
        return Promise.resolve();
    }

    createStateDefinition(
        stateModel: WorkItemStateInputModel,
        _processId: string,
        _witRefName: string
    ): Promise<WorkItemStateResultModel> {
        return Promise.resolve({ ...makeWorkItemState(), ...stateModel });
    }

    deleteStateDefinition(_processId: string, _witRefName: string, _stateId: string): Promise<void> {
        return Promise.resolve();
    }

    getStateDefinition(_processId: string, _witRefName: string, stateId: string): Promise<WorkItemStateResultModel> {
        return Promise.resolve(findState(stateId));
    }

    getStateDefinitions(_processId: string, witRefName: string): Promise<WorkItemStateResultModel[]> {
        return Promise.resolve(findWorkItemType(witRefName).states);
    }

    hideStateDefinition(
        hideStateModel: HideStateModel,
        _processId: string,
        _witRefName: string,
        stateId: string
    ): Promise<WorkItemStateResultModel> {
        return Promise.resolve({ ...findState(stateId), ...hideStateModel });
    }

    updateStateDefinition(
        stateModel: WorkItemStateInputModel,
        _processId: string,
        _witRefName: string,
        stateId: string
    ): Promise<WorkItemStateResultModel> {
        return Promise.resolve({ ...findState(stateId), ...stateModel });
    }

    addBehaviorToWorkItemType(
        behavior: WorkItemTypeBehavior,
        _processId: string,
        _witRefNameForBehaviors: string
    ): Promise<WorkItemTypeBehavior> {
        return Promise.resolve({ ...makeWorkItemTypeBehavior(behavior.behavior), ...behavior });
    }

    getBehaviorForWorkItemType(
        _processId: string,
        witRefNameForBehaviors: string,
        behaviorRefName: string
    ): Promise<WorkItemTypeBehavior> {
        return Promise.resolve(findWorkItemTypeBehavior(witRefNameForBehaviors, behaviorRefName));
    }

    getBehaviorsForWorkItemType(_processId: string, witRefNameForBehaviors: string): Promise<WorkItemTypeBehavior[]> {
        return Promise.resolve(findWorkItemType(witRefNameForBehaviors).behaviors);
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
        witRefNameForBehaviors: string
    ): Promise<WorkItemTypeBehavior> {
        return Promise.resolve({
            ...findWorkItemTypeBehavior(witRefNameForBehaviors, behavior.behavior.id),
            ...behavior
        });
    }

    createWorkItemType(workItemType: WorkItemTypeModel, _processId: string): Promise<WorkItemTypeModel> {
        return Promise.resolve({ ...makeWorkItemType(), ...workItemType });
    }

    deleteWorkItemType(_processId: string, _witRefName: string): Promise<void> {
        return Promise.resolve();
    }

    getWorkItemType(
        _processId: string,
        witRefName: string,
        _expand?: GetWorkItemTypeExpand
    ): Promise<WorkItemTypeModel> {
        return Promise.resolve(findWorkItemType(witRefName));
    }

    getWorkItemTypes(_processId: string, _expand?: GetWorkItemTypeExpand): Promise<WorkItemTypeModel[]> {
        return Promise.resolve(workItemTypes);
    }

    updateWorkItemType(
        workItemTypeUpdate: WorkItemTypeUpdateModel,
        _processId: string,
        witRefName: string
    ): Promise<WorkItemTypeModel> {
        return Promise.resolve({ ...findWorkItemType(witRefName), ...workItemTypeUpdate });
    }

    addFieldToWorkItemType(
        field: WorkItemTypeFieldModel2,
        _processId: string,
        _witRefNameForFields: string
    ): Promise<WorkItemTypeFieldModel2> {
        return Promise.resolve({ ...makeWorkItemTypeField(), ...field });
    }

    getWorkItemTypeField(
        _processId: string,
        _witRefNameForFields: string,
        fieldRefName: string
    ): Promise<WorkItemTypeFieldModel2> {
        return Promise.resolve(findWorkItemTypeField(fieldRefName));
    }

    getWorkItemTypeFields(_processId: string, _witRefNameForFields: string): Promise<WorkItemTypeFieldModel2[]> {
        return Promise.resolve(workItemTypeFields);
    }

    removeFieldFromWorkItemType(
        _processId: string,
        _witRefNameForFields: string,
        _fieldRefName: string
    ): Promise<void> {
        return Promise.resolve();
    }

    updateWorkItemTypeField(
        field: WorkItemTypeFieldModel2,
        _processId: string,
        _witRefNameForFields: string
    ): Promise<WorkItemTypeFieldModel2> {
        return Promise.resolve({ ...findWorkItemTypeField(field.referenceName), ...field });
    }
}
