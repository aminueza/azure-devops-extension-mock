import * as boards from "../azure-devops-extension-api/boards/Data";
import * as build from "../azure-devops-extension-api/build/Data";
import * as core from "../azure-devops-extension-api/core/Data";
import * as dashboard from "../azure-devops-extension-api/dashboard/Data";
import * as git from "../azure-devops-extension-api/git/Data";
import * as pipelines from "../azure-devops-extension-api/pipelines/Data";
import * as release from "../azure-devops-extension-api/release/Data";
import * as taskAgent from "../azure-devops-extension-api/taskAgent/Data";
import * as test from "../azure-devops-extension-api/test/Data";
import * as wiki from "../azure-devops-extension-api/wiki/Data";
import * as workItemTracking from "../azure-devops-extension-api/workItemTracking/Data";
import { fake } from "../azure-devops-extension-api/common/fixtures";

const MODULES: Array<[string, Record<string, unknown>]> = [
    ["boards", boards],
    ["build", build],
    ["core", core],
    ["dashboard", dashboard],
    ["git", git],
    ["pipelines", pipelines],
    ["release", release],
    ["taskAgent", taskAgent],
    ["test", test],
    ["wiki", wiki],
    ["workItemTracking", workItemTracking]
];

const hasNumericId = (value: unknown): value is { id: number; rev?: number } =>
    typeof value === "object" && value !== null && typeof (value as { id?: unknown }).id === "number";

const keyOf = (item: { id: number; rev?: number }): string =>
    typeof item.rev === "number" ? `${item.id}:${item.rev}` : String(item.id);

const seededLists = (): Array<[string, string[]]> => {
    const lists: Array<[string, string[]]> = [];
    for (const [area, module] of MODULES) {
        for (const [name, value] of Object.entries(module)) {
            if (!Array.isArray(value) || value.length < 2 || !value.every(hasNumericId)) {
                continue;
            }
            lists.push([`${area}/${name}`, value.map(keyOf)]);
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
