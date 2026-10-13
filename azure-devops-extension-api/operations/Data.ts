import { fake } from "../common/fixtures";
import { Operation, OperationStatus } from "azure-devops-extension-api/Operations";

export const makeOperation = (
    status: OperationStatus = OperationStatus.Succeeded,
    id: string = fake.string.uuid(),
    pluginId: string = fake.string.uuid()
): Operation => {
    const url = `${fake.internet.url()}/_apis/operations/${id}`;
    return {
        id,
        pluginId,
        status,
        url,
        resultMessage:
            status === OperationStatus.Succeeded || status === OperationStatus.Failed
                ? fake.lorem.sentence()
                : fake.helpers.absent(),
        detailedMessage: status === OperationStatus.Failed ? fake.lorem.paragraph() : fake.helpers.absent(),
        resultUrl: status === OperationStatus.Succeeded ? { resultUrl: `${url}/result` } : fake.helpers.absent(),
        _links: {}
    };
};

export const operations: Operation[] = [
    makeOperation(OperationStatus.Succeeded),
    makeOperation(OperationStatus.InProgress),
    makeOperation(OperationStatus.Queued),
    makeOperation(OperationStatus.Failed),
    makeOperation(OperationStatus.Cancelled)
];
