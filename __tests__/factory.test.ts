import { CommonServiceIds } from "azure-devops-extension-api/Common";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { OperationsRestClient } from "azure-devops-extension-api/Operations";
import { TestRestClient } from "azure-devops-extension-api/Test";
import * as api from "../azure-devops-extension-api";
import { RestClientBase } from "../azure-devops-extension-api/common/RestClientBase";

const {
    getClient,
    getService,
    mockClient,
    registerMockClient,
    getRegisteredMockClient,
    registerMockService
} = api;

class CustomRealClient extends RestClientBase {
    ping(): Promise<string> {
        return Promise.resolve("real");
    }
}

class CustomMockClient extends RestClientBase {
    public TYPE = CustomRealClient;
    ping(): Promise<string> {
        return Promise.resolve("mock");
    }
}

describe("getClient", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    it("returns a fresh registered instance per call", () => {
        const a = getClient(TestRestClient);
        const b = getClient(TestRestClient);
        expect(a).not.toBe(b);
        expect((a as any).TYPE).toBe(TestRestClient);
    });

    it("routes through mockClient when overrides are given for a registered class", async () => {
        const client = getClient(TestRestClient, {
            getTestRuns: async () => [{ id: 1, name: "only" } as any]
        });
        const runs = await client.getTestRuns("proj");
        expect(runs).toEqual([{ id: 1, name: "only" }]);
        const run = await client.getTestRunById("proj", 5);
        expect(run.id).toBe(5);
    });

    it("auto-stubs unknown members of an unregistered class", async () => {
        const client = getClient(OperationsRestClient);
        expect(client).toBeInstanceOf(OperationsRestClient);
        await expect((client as any).notDefinedOnRealClient("op-id")).resolves.toBeUndefined();
    });

    it("stubs real methods of an unregistered class so no request is issued", async () => {
        const client = getClient(OperationsRestClient);
        expect(typeof client.getOperation).toBe("function");
        await expect(client.getOperation("op-id")).resolves.toBeUndefined();
    });
});

describe("mockClient", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    it("resolves unknown methods to undefined on an unregistered class", async () => {
        expect(getRegisteredMockClient(OperationsRestClient)).toBeUndefined();
        const client = mockClient(OperationsRestClient);
        await expect((client as any).somethingMissing(1, 2)).resolves.toBeUndefined();
    });

    it("prefers overrides over real methods on an unregistered class", async () => {
        const client = mockClient(OperationsRestClient, {
            getOperation: async () => ({ id: "fixed" } as any)
        });
        const op = await client.getOperation("any");
        expect(op.id).toBe("fixed");
    });

    it("returns defined non-function properties untouched", () => {
        const registered = mockClient(GitRestClient, { getRepositories: async () => [] });
        expect((registered as any)._rootPath).toBe("");
        const options = { rootPath: "https://h/" } as any;
        const unregistered = mockClient(OperationsRestClient, {}, options);
        expect((unregistered as any)._options).toBe(options);
    });

    it("keeps the TYPE identity of the registered mock", () => {
        const client = mockClient(GitRestClient);
        expect((client as any).TYPE).toBe(GitRestClient);
        const overridden = mockClient(GitRestClient, { getRepositories: async () => [] });
        expect((overridden as any).TYPE).toBe(GitRestClient);
    });

    it("binds registered methods to the underlying instance", async () => {
        const client = mockClient(TestRestClient);
        const detached = client.getTestRuns;
        const runs = await detached("proj");
        expect(runs.length).toBeGreaterThan(0);
    });

    it("falls back to a resolved undefined for unknown members of a registered class", async () => {
        const client = mockClient(TestRestClient);
        await expect((client as any).notThere()).resolves.toBeUndefined();
    });
});

describe("registry", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    it("registers and resolves a custom mock class", async () => {
        expect(getRegisteredMockClient(CustomRealClient)).toBeUndefined();
        registerMockClient(CustomRealClient, CustomMockClient as any);
        expect(getRegisteredMockClient(CustomRealClient)).toBe(CustomMockClient);
        const client = getClient(CustomRealClient);
        expect(client).toBeInstanceOf(CustomMockClient);
        await expect(client.ping()).resolves.toBe("mock");
    });

    it("registers a custom service and returns it from getService", () => {
        const service = { hello: () => "world" };
        registerMockService("custom.service", service);
        expect(getService<typeof service>("custom.service")).toBe(service);
        expect(getService("custom.service").hello()).toBe("world");
    });

    it("throws for an unknown service id", () => {
        expect(() => getService("nobody.registered.this")).toThrow(/Unknown service id for mock: nobody\.registered\.this/);
    });

    it("still resolves the built-in services", () => {
        expect(getService(CommonServiceIds.LocationService)).toBe(api.MockLocationService);
        expect(getService(CommonServiceIds.ExtensionDataService)).toBe(api.MockExtensionDataService);
    });
});

describe("index re-exports", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    it("exposes every mock client class", () => {
        const classes = [
            api.MockAccountsRestClient,
            api.MockBoardsRestClient,
            api.MockBuildRestClient,
            api.MockCoreRestClient,
            api.MockDashboardRestClient,
            api.MockGitRestClient,
            api.MockPipelinesRestClient,
            api.MockReleaseRestClient,
            api.MockTaskAgentRestClient,
            api.MockTestRestClient,
            api.MockWikiRestClient,
            api.MockWorkItemTrackingRestClient
        ];
        classes.forEach(cls => {
            expect(typeof cls).toBe("function");
            expect(new (cls as any)({})).toBeInstanceOf(RestClientBase);
        });
    });

    it("exposes every mock service object", () => {
        const services = [
            api.MockExtensionDataService,
            api.MockGlobalMessagesService,
            api.MockHostNavigationService,
            api.MockHostPageLayoutService,
            api.MockLocationService,
            api.MockProjectPageService
        ];
        services.forEach(svc => {
            expect(svc).toBeDefined();
            expect(typeof svc).toBe("object");
        });
    });

    it("exposes the factory functions", () => {
        expect(typeof api.getClient).toBe("function");
        expect(typeof api.getService).toBe("function");
        expect(typeof api.mockClient).toBe("function");
        expect(typeof api.registerMockClient).toBe("function");
        expect(typeof api.getRegisteredMockClient).toBe("function");
        expect(typeof api.registerMockService).toBe("function");
    });
});
