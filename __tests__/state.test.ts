import { forget, remember, stateful } from "../azure-devops-extension-api/common/state";
import * as api from "../azure-devops-extension-api";

describe("stateful mode", () => {
    afterEach(() => stateful.disable());

    it("is off by default and leaves lists alone", () => {
        const list = [{ id: 1 }];
        expect(stateful.isEnabled()).toBe(false);
        const item = { id: 2 };
        expect(remember(list, item)).toBe(item);
        forget(list, existing => existing.id === 1);
        expect(list).toEqual([{ id: 1 }]);
    });

    it("adds, replaces and removes items once enabled", () => {
        const list = [{ id: 1, name: "one" }];
        stateful.enable();
        expect(stateful.isEnabled()).toBe(true);
        remember(list, { id: 2, name: "two" });
        expect(list.map(item => item.id)).toEqual([1, 2]);
        remember(list, { id: 1, name: "uno" }, existing => existing.id === 1);
        expect(list).toEqual([
            { id: 1, name: "uno" },
            { id: 2, name: "two" }
        ]);
        remember(list, { id: 3, name: "three" }, existing => existing.id === 3);
        expect(list.length).toBe(3);
        forget(list, existing => existing.id === 2 || existing.id === 3);
        expect(list).toEqual([{ id: 1, name: "uno" }]);
    });

    it("restores every touched list on reset and keeps the same array", () => {
        const first = [{ id: 1 }];
        const second = Object.assign([{ id: 5 }], { continuationToken: "token" });
        stateful.enable();
        remember(first, { id: 2 });
        remember(first, { id: 3 });
        forget(second, existing => existing.id === 5);
        expect(first.length).toBe(3);
        expect(second.length).toBe(0);
        stateful.reset();
        expect(first).toEqual([{ id: 1 }]);
        expect(second.map(item => item.id)).toEqual([5]);
        expect(second.continuationToken).toBe("token");
        expect(stateful.isEnabled()).toBe(true);
        remember(first, { id: 9 });
        expect(first.length).toBe(2);
    });

    it("restores the lists and turns off on disable", () => {
        const list = [{ id: 1 }];
        stateful.enable();
        remember(list, { id: 2 });
        stateful.disable();
        expect(list).toEqual([{ id: 1 }]);
        expect(stateful.isEnabled()).toBe(false);
        remember(list, { id: 3 });
        expect(list).toEqual([{ id: 1 }]);
    });

    it("is exported from the package root", () => {
        expect(api.stateful).toBe(stateful);
    });
});
