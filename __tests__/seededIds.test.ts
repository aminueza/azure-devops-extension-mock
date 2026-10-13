import * as boards from "../azure-devops-extension-api/boards/Data";
import * as build from "../azure-devops-extension-api/build/Data";
import * as contributions from "../azure-devops-extension-api/contributions/Data";
import * as core from "../azure-devops-extension-api/core/Data";
import * as dashboard from "../azure-devops-extension-api/dashboard/Data";
import * as fileContainer from "../azure-devops-extension-api/fileContainer/Data";
import * as extensionManagement from "../azure-devops-extension-api/extensionManagement/Data";
import * as featureAvailability from "../azure-devops-extension-api/featureAvailability/Data";
import * as featureManagement from "../azure-devops-extension-api/featureManagement/Data";
import * as gallery from "../azure-devops-extension-api/gallery/Data";
import * as git from "../azure-devops-extension-api/git/Data";
import * as graph from "../azure-devops-extension-api/graph/Data";
import * as operations from "../azure-devops-extension-api/operations/Data";
import * as pipelines from "../azure-devops-extension-api/pipelines/Data";
import * as policy from "../azure-devops-extension-api/policy/Data";
import * as projectAnalysis from "../azure-devops-extension-api/projectAnalysis/Data";
import * as release from "../azure-devops-extension-api/release/Data";
import * as resourceUsage from "../azure-devops-extension-api/resourceUsage/Data";
import * as serviceEndpoint from "../azure-devops-extension-api/serviceEndpoint/Data";
import * as taskAgent from "../azure-devops-extension-api/taskAgent/Data";
import * as test from "../azure-devops-extension-api/test/Data";
import * as testPlan from "../azure-devops-extension-api/testPlan/Data";
import * as testResults from "../azure-devops-extension-api/testResults/Data";
import * as tfvc from "../azure-devops-extension-api/tfvc/Data";
import * as wiki from "../azure-devops-extension-api/wiki/Data";
import * as workItemTracking from "../azure-devops-extension-api/workItemTracking/Data";
import * as workItemTrackingProcessDefinitions from "../azure-devops-extension-api/workItemTrackingProcessDefinitions/Data";
import * as workItemTrackingProcess from "../azure-devops-extension-api/workItemTrackingProcess/Data";
import { fake } from "../azure-devops-extension-api/common/fixtures";

const MODULES: Array<[string, Record<string, unknown>]> = [
    ["boards", boards],
    ["build", build],
    ["contributions", contributions],
    ["core", core],
    ["dashboard", dashboard],
    ["fileContainer", fileContainer],
    ["extensionManagement", extensionManagement],
    ["featureAvailability", featureAvailability],
    ["featureManagement", featureManagement],
    ["gallery", gallery],
    ["git", git],
    ["graph", graph],
    ["operations", operations],
    ["pipelines", pipelines],
    ["policy", policy],
    ["projectAnalysis", projectAnalysis],
    ["release", release],
    ["resourceUsage", resourceUsage],
    ["serviceEndpoint", serviceEndpoint],
    ["taskAgent", taskAgent],
    ["test", test],
    ["testPlan", testPlan],
    ["testResults", testResults],
    ["tfvc", tfvc],
    ["wiki", wiki],
    ["workItemTracking", workItemTracking],
    ["workItemTrackingProcessDefinitions", workItemTrackingProcessDefinitions]
    ["workItemTrackingProcess", workItemTrackingProcess]
];

const hasNumericId = (value: unknown): value is { id: number; rev?: number } =>
    typeof value === "object" && value !== null && typeof (value as { id?: unknown }).id === "number";

const REVISION_KEYED = new Set(["policy/configurationRevisions"]);

const keyOf = (item: { id: number; rev?: number; revision?: number }, list: string): string => {
    if (typeof item.rev === "number") {
        return `${item.id}:${item.rev}`;
    }
    return REVISION_KEYED.has(list) ? `${item.id}:${item.revision}` : String(item.id);
};

const seededLists = (): Array<[string, string[]]> => {
    const lists: Array<[string, string[]]> = [];
    for (const [area, module] of MODULES) {
        for (const [name, value] of Object.entries(module)) {
            if (!Array.isArray(value) || value.length < 2 || !value.every(hasNumericId)) {
                continue;
            }
            lists.push([`${area}/${name}`, value.map(item => keyOf(item, `${area}/${name}`))]);
        }
    }
    return lists;
};

describe("seeded fixture ids", () => {
    const lists = seededLists();

    it("finds seeded lists to check", () => {
        expect(lists.length).toBeGreaterThan(10);
    });

    it.each(lists)("%s has no duplicate lookup keys", (_name, keys) => {
        expect(new Set(keys).size).toBe(keys.length);
    });
});

describe("fixture id generator", () => {
    it("never repeats", () => {
        const ids = Array.from({ length: 500 }, () => fake.number.id());
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("keeps increasing", () => {
        const first = fake.number.id();
        const second = fake.number.id();
        expect(second).toBeGreaterThan(first);
    });

    it("is not reset by seed", () => {
        const before = fake.number.id();
        fake.seed(1234);
        expect(fake.number.id()).toBeGreaterThan(before);
    });
});
