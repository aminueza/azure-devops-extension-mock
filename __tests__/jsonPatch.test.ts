import { patchOperations } from "../azure-devops-extension-api/common/jsonPatch";

describe("patchOperations", () => {
    it("returns the operations of a patch document", () => {
        const document = [{ op: "add", path: "/fields/System.Title", value: "Title" }];
        expect(patchOperations(document)).toBe(document);
    });

    it("returns no operations for anything that is not a list", () => {
        expect(patchOperations(undefined)).toEqual([]);
        expect(patchOperations(null)).toEqual([]);
        expect(patchOperations({ op: "add" })).toEqual([]);
        expect(patchOperations("text")).toEqual([]);
    });
});
