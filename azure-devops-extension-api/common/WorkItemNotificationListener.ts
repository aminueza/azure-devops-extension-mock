import { IWorkItemChangedArgs, IWorkItemFieldChangedArgs, IWorkItemLoadedArgs, IWorkItemNotificationListener } from "azure-devops-extension-api/WorkItemTracking";

export const instanceObjects: any = {};

export const WorkItemNotificationListener: IWorkItemNotificationListener = {
    onLoaded: function (workItemLoadedArgs: IWorkItemLoadedArgs): void {
        console.log(`onLoaded: ${JSON.stringify(workItemLoadedArgs)}`);
    },
    onFieldChanged: function (fieldChangedArgs: IWorkItemFieldChangedArgs): void {
        console.log(`onFieldChanged: ${JSON.stringify(fieldChangedArgs)}`);
    },
    onSaved: function (savedEventArgs: IWorkItemChangedArgs): void {
        console.log(`onSaved: ${JSON.stringify(savedEventArgs)}`);
    },
    onRefreshed: function (refreshEventArgs: IWorkItemChangedArgs): void {
        console.log(`onRefreshed: ${JSON.stringify(refreshEventArgs)}`);
    },
    onReset: function (undoEventArgs: IWorkItemChangedArgs): void {
        console.log(`onReset: ${JSON.stringify(undoEventArgs)}`);
    },
    onUnloaded: function (unloadedEventArgs: IWorkItemChangedArgs): void {
        console.log(`onUnloaded: ${JSON.stringify(unloadedEventArgs)}`);
    }
};
