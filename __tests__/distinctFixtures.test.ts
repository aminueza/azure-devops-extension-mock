const SEEDS = 150;

const duplicates = (values: string[]): string[] => values.filter((value, index) => values.indexOf(value) !== index);

const collisions = (load: () => string[]): string[] => {
    const found: string[] = [];
    for (let index = 0; index < SEEDS; index += 1) {
        const random = jest.spyOn(Math, "random").mockReturnValue(index / SEEDS);
        jest.isolateModules(() => {
            found.push(...duplicates(load()));
        });
        random.mockRestore();
    }
    return found;
};

describe("seeded lists that are searched by name", () => {
    it("never seeds two projects with the same name", () => {
        expect(collisions(() => require("../azure-devops-extension-api/core/Data").projects.map((p: { name: string }) => p.name))).toEqual([]);
    });

    it("never seeds two teams with the same name", () => {
        expect(collisions(() => require("../azure-devops-extension-api/core/Data").teams.map((t: { name: string }) => t.name))).toEqual([]);
    });

    it("never seeds two project collections with the same name", () => {
        expect(
            collisions(() =>
                require("../azure-devops-extension-api/core/Data").projectCollections.map((c: { name: string }) => c.name)
            )
        ).toEqual([]);
    });

    it("never seeds two queries with the same path or name", () => {
        expect(
            collisions(() =>
                require("../azure-devops-extension-api/workItemTracking/Data").queries.map((q: { path: string }) => q.path)
            )
        ).toEqual([]);
        expect(
            collisions(() =>
                require("../azure-devops-extension-api/workItemTracking/Data").queries.map((q: { name: string }) => q.name)
            )
        ).toEqual([]);
    });
});
