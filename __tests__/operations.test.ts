import { OperationsRestClient, OperationStatus } from "azure-devops-extension-api/Operations";
import { getClient, getRegisteredMockClient, MockOperationsRestClient } from "../azure-devops-extension-api";
import { makeOperation, operations } from "../azure-devops-extension-api/operations/Data";

describe("OperationsRestClient mock", () => {
    const client = getClient(OperationsRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(OperationsRestClient)).toBe(MockOperationsRestClient);
    });

    it("gets a known operation", async () => {
        expect(await client.getOperation(operations[1].id)).toBe(operations[1]);
    });

    it("gets a known operation of the given plugin", async () => {
        const target = operations[3];
        expect(await client.getOperation(target.id, target.pluginId)).toBe(target);
    });

    it("fabricates an operation known under another plugin", async () => {
        const target = operations[0];
        const made = await client.getOperation(target.id, "other-plugin");
        expect(made).not.toBe(target);
        expect(made.id).toBe(target.id);
        expect(made.pluginId).toBe("other-plugin");
    });

    it("fabricates an unknown operation", async () => {
        const made = await client.getOperation("missing-operation");
        expect(made.id).toBe("missing-operation");
        expect(typeof made.pluginId).toBe("string");
        expect(made.status).toBe(OperationStatus.Succeeded);
        expect(made.url.endsWith("/_apis/operations/missing-operation")).toBe(true);
        expect(made.resultUrl.resultUrl).toBe(`${made.url}/result`);
    });

    it("fabricates an unknown operation of the given plugin", async () => {
        const made = await client.getOperation("missing-operation", "plugin-1");
        expect(made.id).toBe("missing-operation");
        expect(made.pluginId).toBe("plugin-1");
    });
});

describe("operations fixtures", () => {
    it("makes a succeeded operation by default", () => {
        const operation = makeOperation();
        expect(operation.status).toBe(OperationStatus.Succeeded);
        expect(typeof operation.resultMessage).toBe("string");
        expect(operation.detailedMessage).toBeUndefined();
        expect(operation.resultUrl).toEqual({ resultUrl: `${operation.url}/result` });
        expect(operation._links).toEqual({});
    });

    it("makes a failed operation with its messages and no result", () => {
        const operation = makeOperation(OperationStatus.Failed);
        expect(typeof operation.resultMessage).toBe("string");
        expect(typeof operation.detailedMessage).toBe("string");
        expect(operation.resultUrl).toBeUndefined();
    });

    it.each([OperationStatus.NotSet, OperationStatus.Queued, OperationStatus.InProgress, OperationStatus.Cancelled])(
        "makes an operation in status %s without messages or result",
        status => {
            const operation = makeOperation(status);
            expect(operation.status).toBe(status);
            expect(operation.resultMessage).toBeUndefined();
            expect(operation.detailedMessage).toBeUndefined();
            expect(operation.resultUrl).toBeUndefined();
        }
    );

    it("makes an operation with the given ids", () => {
        const operation = makeOperation(OperationStatus.Queued, "op-1", "plugin-1");
        expect(operation.id).toBe("op-1");
        expect(operation.pluginId).toBe("plugin-1");
        expect(operation.url.endsWith("/op-1")).toBe(true);
    });

    it("seeds one operation per status with unique ids", () => {
        expect(operations.map(o => o.status)).toEqual([
            OperationStatus.Succeeded,
            OperationStatus.InProgress,
            OperationStatus.Queued,
            OperationStatus.Failed,
            OperationStatus.Cancelled
        ]);
        expect(new Set(operations.map(o => o.id)).size).toBe(operations.length);
    });
});
