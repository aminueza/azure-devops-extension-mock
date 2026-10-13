import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import { Operation, OperationsRestClient, OperationStatus } from "azure-devops-extension-api/Operations";
import { makeOperation, operations } from "./Data";

const matches = (operation: Operation, operationId: string, pluginId?: string): boolean =>
    operation.id === operationId && (pluginId === undefined || operation.pluginId === pluginId);

const findOperation = (operationId: string, pluginId?: string): Operation =>
    operations.find(o => matches(o, operationId, pluginId)) ?? makeOperation(OperationStatus.Succeeded, operationId, pluginId);

export class MockOperationsRestClient extends RestClientBase {
    public TYPE = OperationsRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getOperation(operationId: string, pluginId?: string): Promise<Operation> {
        return Promise.resolve(findOperation(operationId, pluginId));
    }
}
