import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { WorkRestClient } from "azure-devops-extension-api/Work";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { DashboardRestClient } from "azure-devops-extension-api/Dashboard";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { ReleaseRestClient } from "azure-devops-extension-api/Release";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { TestRestClient } from "azure-devops-extension-api/Test";
import { WikiRestClient } from "azure-devops-extension-api/Wiki";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { getClient, getRegisteredMockClient } from "../azure-devops-extension-api";
import { RestClientBase } from "../azure-devops-extension-api/common/RestClientBase";
import * as sdkMock from "../azure-devops-extension-sdk";

const surface = require("../scripts/surface.js");

const REAL_CLASSES: Record<string, new (...args: any[]) => object> = {
    AccountsRestClient,
    WorkRestClient,
    BuildRestClient,
    CoreRestClient,
    DashboardRestClient,
    GitRestClient,
    PipelinesRestClient,
    ReleaseRestClient,
    TaskAgentRestClient,
    TestRestClient,
    WikiRestClient,
    WorkItemTrackingRestClient
};

const BASE_METHODS = new Set(Object.getOwnPropertyNames(RestClientBase.prototype));

const ownMethods = (cls: Function): string[] =>
    Object.getOwnPropertyNames(cls.prototype).filter(
        (name) => name !== "constructor" && !BASE_METHODS.has(name) && typeof cls.prototype[name] === "function"
    );

describe("mock surface against the real REST clients", () => {
    beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => undefined); });
    afterAll(() => { jest.restoreAllMocks(); });

    const rows = surface.report() as Array<{ area: string; real: string; implemented: string[]; phantom: string[]; missing: string[]; total: number }>;

    it("checks every registered client", () => {
        expect(rows.map((row) => row.real).sort()).toEqual(Object.keys(REAL_CLASSES).sort());
    });

    describe.each(rows)("$real", (row) => {
        const realClass = REAL_CLASSES[row.real];
        const realMethods = surface.realMethods(row.area) as Set<string>;

        it("declares no method that the real client lacks", () => {
            expect(row.phantom).toEqual([]);
            const mockClass = getRegisteredMockClient(realClass)!;
            expect(ownMethods(mockClass).filter((name) => !realMethods.has(name))).toEqual([]);
        });

        it("exposes every real method through getClient", () => {
            const client = getClient(realClass) as any;
            for (const name of realMethods) {
                expect(typeof client[name]).toBe("function");
            }
        });

        it("resolves every stubbed real method to undefined", async () => {
            const client = getClient(realClass) as any;
            for (const name of row.missing) {
                await expect(client[name]()).resolves.toBeUndefined();
            }
        });
    });
});

describe("mock surface against the real SDK", () => {
    const declarations = require("fs").readFileSync(
        require("path").join(__dirname, "..", "node_modules", "azure-devops-extension-sdk", "SDK.d.ts"),
        "utf8"
    ) as string;
    const exported = [...declarations.matchAll(/^export declare (?:function|const|enum) ([A-Za-z]+)/gm)].map((match) => match[1]);

    it("finds the real SDK declarations", () => {
        expect(exported.length).toBeGreaterThan(15);
    });

    it("mocks every function, constant and enum the real SDK exports", () => {
        const missing = exported.filter((name) => !(name in sdkMock));
        expect(missing).toEqual([]);
    });
});

describe("surface script", () => {
    it("renders a markdown table with a total row", () => {
        const table = surface.markdown(surface.report()) as string;
        expect(table).toContain("| Client | Hand-written | Stubbed | Total |");
        expect(table).toContain("| **All** |");
        expect(table).toContain("`GitRestClient`");
    });
});
