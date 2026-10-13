import { AccountsRestClient } from "azure-devops-extension-api/Accounts";
import { ReportingRestClient } from "azure-devops-extension-api/AdvancedSecurity.Reporting";
import { AlertRestClient } from "azure-devops-extension-api/Alert";
import { WorkRestClient } from "azure-devops-extension-api/Work";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { ContributionsRestClient } from "azure-devops-extension-api/Contributions";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { DashboardRestClient } from "azure-devops-extension-api/Dashboard";
import { FileContainerRestClient } from "azure-devops-extension-api/FileContainer";
import { ExtensionManagementRestClient } from "azure-devops-extension-api/ExtensionManagement";
import { FeatureAvailabilityRestClient } from "azure-devops-extension-api/FeatureAvailability";
import { FeatureManagementRestClient } from "azure-devops-extension-api/FeatureManagement";
import { GalleryRestClient } from "azure-devops-extension-api/Gallery";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import { OperationsRestClient } from "azure-devops-extension-api/Operations";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { PolicyRestClient } from "azure-devops-extension-api/Policy";
import { ProjectAnalysisRestClient } from "azure-devops-extension-api/ProjectAnalysis";
import { FavoriteRestClient } from "azure-devops-extension-api/Favorite";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import { LocationsRestClient } from "azure-devops-extension-api/Locations";
import { ManagementRestClient } from "azure-devops-extension-api/Management";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { PolicyRestClient } from "azure-devops-extension-api/Policy";
import { ProfileRestClient } from "azure-devops-extension-api/Profile";
import { ReleaseRestClient } from "azure-devops-extension-api/Release";
import { ResourceUsageRestClient } from "azure-devops-extension-api/ResourceUsage";
import { ServiceEndpointRestClient } from "azure-devops-extension-api/ServiceEndpoint";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { TestRestClient } from "azure-devops-extension-api/Test";
import { TestPlanRestClient } from "azure-devops-extension-api/TestPlan";
import { TestResultsRestClient } from "azure-devops-extension-api/TestResults";
import { TfvcRestClient } from "azure-devops-extension-api/Tfvc";
import { WikiRestClient } from "azure-devops-extension-api/Wiki";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { WorkItemTrackingProcessDefinitionsRestClient } from "azure-devops-extension-api/WorkItemTrackingProcessDefinitions";
import { WorkItemTrackingProcessRestClient } from "azure-devops-extension-api/WorkItemTrackingProcess";
import { getClient, getRegisteredMockClient } from "../azure-devops-extension-api";
import { RestClientBase } from "../azure-devops-extension-api/common/RestClientBase";
import * as sdkMock from "../azure-devops-extension-sdk";

const surface = require("../scripts/surface.js");

const REAL_CLASSES: Record<string, new (...args: any[]) => object> = {
    AccountsRestClient,
    ReportingRestClient,
    AlertRestClient,
    WorkRestClient,
    BuildRestClient,
    ContributionsRestClient,
    CoreRestClient,
    DashboardRestClient,
    FileContainerRestClient,
    ExtensionManagementRestClient,
    FeatureAvailabilityRestClient,
    FeatureManagementRestClient,
    GalleryRestClient,
    GitRestClient,
    GraphRestClient,
    OperationsRestClient,
    PipelinesRestClient,
    PolicyRestClient,
    ProjectAnalysisRestClient,
    FavoriteRestClient,
    GitRestClient,
    GraphRestClient,
    LocationsRestClient,
    ManagementRestClient,
    PipelinesRestClient,
    PolicyRestClient,
    ProfileRestClient,
    ReleaseRestClient,
    ResourceUsageRestClient,
    ServiceEndpointRestClient,
    TaskAgentRestClient,
    TestRestClient,
    TestPlanRestClient,
    TestResultsRestClient,
    TfvcRestClient,
    WikiRestClient,
    WorkItemTrackingRestClient,
    WorkItemTrackingProcessDefinitionsRestClient
    WorkItemTrackingProcessRestClient
};

const BASE_METHODS = new Set(Object.getOwnPropertyNames(RestClientBase.prototype));

const ownMethods = (cls: { prototype: Record<string, unknown> }): string[] =>
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

    it("matches the table published in the readme", () => {
        const readme = require("fs").readFileSync(require("path").join(__dirname, "..", "readme.md"), "utf8") as string;
        const start = readme.indexOf("| Client | Hand-written | Stubbed | Total |");
        const end = readme.indexOf("\n\n", start);
        expect(start).toBeGreaterThan(0);
        expect(readme.slice(start, end)).toBe(surface.markdown(surface.report()));
    });
});
