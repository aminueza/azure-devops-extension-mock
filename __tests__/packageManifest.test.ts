import * as fs from "fs";
import * as path from "path";

const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const SHIPPED_SOURCE_DIRECTORIES = ["azure-devops-extension-api", "azure-devops-extension-sdk", "jest-helpers"];
const TEST_FRAMEWORK_IMPORT = /(?:require\(|from\s+|import\()\s*["'](?:jest|@jest\/[^"']+|vitest|mocha)["']/;

const sourceFiles = (directory: string): string[] =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return sourceFiles(entryPath);
        }
        return /\.(ts|js)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [entryPath] : [];
    });

describe("package manifest", () => {
    it("has no runtime dependencies", () => {
        expect(manifest.dependencies ?? {}).toEqual({});
    });

    it("peers only on the azure devops packages it mocks", () => {
        expect(Object.keys(manifest.peerDependencies).sort()).toEqual([
            "azure-devops-extension-api",
            "azure-devops-extension-sdk"
        ]);
        expect(manifest.peerDependenciesMeta).toBeUndefined();
    });

    it("ships source that never imports a test framework", () => {
        const files = SHIPPED_SOURCE_DIRECTORIES.flatMap(directory => sourceFiles(path.join(root, directory)));
        expect(files.length).toBeGreaterThan(20);
        const offenders = files.filter(file => TEST_FRAMEWORK_IMPORT.test(fs.readFileSync(file, "utf8")));
        expect(offenders).toEqual([]);
    });

    it("detects a test framework import when one is present", () => {
        expect(TEST_FRAMEWORK_IMPORT.test("const { expect } = require(\"@jest/globals\");")).toBe(true);
        expect(TEST_FRAMEWORK_IMPORT.test("import { vi } from \"vitest\";")).toBe(true);
        expect(TEST_FRAMEWORK_IMPORT.test("const crypto = require(\"crypto\");")).toBe(false);
    });
});
