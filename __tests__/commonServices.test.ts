import {
    CommonServiceIds,
    IExtensionDataManager,
    IExtensionDataService,
    IGlobalMessagesService,
    IHostNavigationService,
    IHostPageLayoutService,
    ILocationService,
    IProjectPageService
} from "azure-devops-extension-api/Common";
import { getService } from "../azure-devops-extension-api";
import { RestClientBase, RestClientRequestParams } from "../azure-devops-extension-api/common/RestClientBase";
import { WorkItemNotificationListener, instanceObjects } from "../azure-devops-extension-api/common/WorkItemNotificationListener";

let logSpy: jest.SpyInstance;

describe("MockProjectPageService", () => {
    beforeAll(() => { logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const svc = getService<IProjectPageService>(CommonServiceIds.ProjectPageService);

    it("returns a project with id and name", async () => {
        const project = await svc.getProject();
        expect(project?.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(project?.name).toEqual(expect.any(String));
    });
});

describe("MockLocationService", () => {
    beforeAll(() => { logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const svc = getService<ILocationService>(CommonServiceIds.LocationService);

    it("builds a resource area location", async () => {
        const url = await svc.getResourceAreaLocation("area-1");
        expect(url).toMatch(/^https:\/\/.+\/resource\/area-1$/);
    });

    it("builds a service location with defaults", async () => {
        const url = await svc.getServiceLocation();
        expect(url).toMatch(/\/service\/defaultService\/defaultHost$/);
    });

    it("builds a service location from explicit arguments", async () => {
        const url = await svc.getServiceLocation("svc", 4 as any);
        expect(url).toMatch(/\/service\/svc\/4$/);
    });

    it("builds a route url without route values or host path", async () => {
        const url = await svc.routeUrl("route-a");
        expect(url).toMatch(/^https:\/\/.+\/route\/route-a$/);
    });

    it("builds a route url with route values and host path", async () => {
        const url = await svc.routeUrl("route-b", { a: "1", b: "2" }, "https://host");
        expect(url).toBe("https://host/route/route-b?a=1&b=2");
    });

    it("omits the query string for empty route values", async () => {
        const url = await svc.routeUrl("route-c", {}, "https://host");
        expect(url).toBe("https://host/route/route-c");
    });
});

describe("MockHostPageLayoutService", () => {
    beforeAll(() => { logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });
    beforeEach(() => { logSpy.mockClear(); });

    const svc = getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);

    it("reports full screen mode as a boolean", async () => {
        expect(typeof await svc.getFullScreenMode()).toBe("boolean");
    });

    it("opens a custom dialog without options", () => {
        svc.openCustomDialog("dialog-id");
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("dialog-id"));
    });

    it("opens a custom dialog with options", () => {
        svc.openCustomDialog("dialog-id", { title: "T" });
        expect(logSpy).toHaveBeenCalledTimes(2);
        expect(logSpy).toHaveBeenLastCalledWith(expect.stringContaining("\"title\":\"T\""));
    });

    it("opens a message dialog without options", () => {
        svc.openMessageDialog("hello");
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("hello"));
    });

    it("opens a message dialog with options", () => {
        svc.openMessageDialog("hello", { okText: "Go" });
        expect(logSpy).toHaveBeenCalledTimes(2);
        expect(logSpy).toHaveBeenLastCalledWith(expect.stringContaining("\"okText\":\"Go\""));
    });

    it("opens a panel", () => {
        svc.openPanel("panel-id", { title: "P" } as any);
        expect(logSpy).toHaveBeenCalledTimes(2);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("panel-id"));
    });

    it("sets full screen mode", () => {
        svc.setFullScreenMode(true);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("true"));
    });
});

describe("MockHostNavigationService", () => {
    beforeAll(() => { logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });
    beforeEach(() => { logSpy.mockClear(); });

    const svc = getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);

    it("returns a hash", async () => {
        expect(await svc.getHash()).toMatch(/^#\w+$/);
    });

    it("returns navigation elements", async () => {
        const elements = await svc.getPageNavigationElements();
        expect(elements).toHaveLength(1);
        expect(["link", "button"]).toContain(elements[0].type);
    });

    it("returns a page route", async () => {
        const route = await svc.getPageRoute();
        expect(route.id).toEqual(expect.any(String));
        expect(Object.keys(route.routeValues)).toEqual(["key1", "key2"]);
    });

    it("returns query params", async () => {
        const params = await svc.getQueryParams();
        expect(Object.keys(params)).toEqual(["param1", "param2"]);
    });

    it("navigates", () => {
        svc.navigate("https://x");
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("https://x"));
    });

    it("invokes the hash changed callback", () => {
        const callback = jest.fn();
        svc.onHashChanged(callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(expect.stringMatching(/^#\w+$/));
    });

    it("opens a new window", () => {
        svc.openNewWindow("https://y", "width=1");
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("width=1"));
    });

    it("reloads", () => {
        svc.reload();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Reloading"));
    });

    it("replaces the hash", () => {
        svc.replaceHash("#new");
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("#new"));
    });

    it("sets the document title", () => {
        svc.setDocumentTitle("Title");
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Title"));
    });

    it("sets the hash", () => {
        svc.setHash("#h");
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("#h"));
    });

    it("sets query params", () => {
        svc.setQueryParams({ q: "1" });
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("\"q\":\"1\""));
    });
});

describe("MockGlobalMessagesService", () => {
    beforeAll(() => { logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });
    beforeEach(() => { logSpy.mockClear(); });

    const svc = getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);

    it("adds a banner", () => {
        svc.addBanner({ message: "b" } as any);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("\"message\":\"b\""));
    });

    it("adds a dialog", () => {
        svc.addDialog({ title: "d" } as any);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("\"title\":\"d\""));
    });

    it("adds a toast", () => {
        svc.addToast({ message: "t" } as any);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("\"message\":\"t\""));
    });

    it("closes the banner", () => {
        svc.closeBanner();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Closing banner"));
    });

    it("closes the dialog", () => {
        svc.closeDialog();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Closing dialog"));
    });
});

describe("MockExtensionDataService and MockExtensionDataManager", () => {
    beforeAll(() => { logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });
    beforeEach(() => { logSpy.mockClear(); });

    const svc = getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
    let manager: IExtensionDataManager;

    beforeAll(async () => {
        manager = await svc.getExtensionDataManager("ext-id", "token");
    });

    it("returns the same manager for every call", async () => {
        const again = await svc.getExtensionDataManager("ext-id", "token");
        expect(again).toBe(manager);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("ext-id"));
    });

    it("gets a value", async () => {
        const value = await manager.getValue<string>("k", { scopeType: "User" });
        expect(value).toEqual(expect.any(String));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("\"scopeType\":\"User\""));
    });

    it("echoes the value on set", async () => {
        const payload = { nested: [1, 2] };
        await expect(manager.setValue("k", payload)).resolves.toBe(payload);
    });

    it("gets a document", async () => {
        const doc = await manager.getDocument("col", "doc-1");
        expect(doc).toEqual(expect.any(String));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("doc-1"));
    });

    it("gets documents", async () => {
        const docs = await manager.getDocuments("col");
        expect(docs).toHaveLength(1);
    });

    it("sets a document", async () => {
        await expect(manager.setDocument("col", { id: "x" })).resolves.toBeUndefined();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("col"));
    });

    it("echoes collections on query", async () => {
        const collections = [{ collectionName: "c", scopeType: "Default", scopeValue: "Current", documents: [] }] as any;
        await expect(manager.queryCollections(collections)).resolves.toBe(collections);
    });

    it("maps collection names to collections", async () => {
        const result = await manager.queryCollectionsByName(["one", "two"]);
        expect(result.map(c => c.collectionName)).toEqual(["one", "two"]);
        result.forEach(c => {
            expect(c.scopeType).toBe("Default");
            expect(c.scopeValue).toBe("Current");
            expect(c.documents).toHaveLength(1);
        });
    });

    it("creates a document", async () => {
        const id = await manager.createDocument("col", { a: 1 });
        expect(id).toEqual(expect.any(String));
    });

    it("deletes a document", async () => {
        await expect(manager.deleteDocument("col", "doc-2")).resolves.toBeUndefined();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("col"));
    });

    it("updates a document", async () => {
        await expect(manager.updateDocument("col", { id: "doc-3" })).resolves.toBeUndefined();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("col"));
    });
});

describe("WorkItemNotificationListener", () => {
    beforeAll(() => { logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });
    beforeEach(() => { logSpy.mockClear(); });

    it("exposes an empty instance registry", () => {
        expect(instanceObjects).toEqual({});
    });

    it("logs on loaded", () => {
        WorkItemNotificationListener.onLoaded({ id: 1, isNew: false, isReadOnly: false } as any);
        expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^onLoaded: .*"id":1/));
    });

    it("logs on field changed", () => {
        WorkItemNotificationListener.onFieldChanged({ id: 2, changedFields: { "System.Title": "x" } } as any);
        expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^onFieldChanged: .*System\.Title/));
    });

    it("logs on saved", () => {
        WorkItemNotificationListener.onSaved({ id: 3 } as any);
        expect(logSpy).toHaveBeenCalledWith("onSaved: {\"id\":3}");
    });

    it("logs on refreshed", () => {
        WorkItemNotificationListener.onRefreshed({ id: 4 } as any);
        expect(logSpy).toHaveBeenCalledWith("onRefreshed: {\"id\":4}");
    });

    it("logs on reset", () => {
        WorkItemNotificationListener.onReset({ id: 5 } as any);
        expect(logSpy).toHaveBeenCalledWith("onReset: {\"id\":5}");
    });

    it("logs on unloaded", () => {
        WorkItemNotificationListener.onUnloaded({ id: 6 } as any);
        expect(logSpy).toHaveBeenCalledWith("onUnloaded: {\"id\":6}");
    });
});

describe("RestClientBase", () => {
    beforeAll(() => { logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const params: RestClientRequestParams = { routeTemplate: "/_apis/x", apiVersion: "7.1" };

    class ProbeClient extends RestClientBase {
        rootPath() {
            return this.getRootPath();
        }
        request() {
            return this.beginRequest<{ id?: number }>(params);
        }
        issue() {
            return this._issueRequest<{ id?: number }>("https://h/_apis/x", "7.1", params);
        }
    }

    const probe = new ProbeClient({ rootPath: "https://h/" } as any);

    it("resolves an empty root path", async () => {
        await expect(probe.rootPath()).resolves.toBe("");
    });

    it("resolves an empty object for begin request", async () => {
        await expect(probe.request()).resolves.toEqual({});
    });

    it("resolves an empty object for issue request", async () => {
        await expect(probe.issue()).resolves.toEqual({});
    });
});
