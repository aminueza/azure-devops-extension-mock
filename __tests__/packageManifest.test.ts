import * as fs from "fs";
import * as path from "path";

const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const lockfile = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const renovate = JSON.parse(fs.readFileSync(path.join(root, "renovate.json"), "utf8"));
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "node.js.yml"), "utf8");
const compat = require("../scripts/compat") as {
    PEERS: string[];
    TARGETS: string[];
    compareVersions(a: string, b: string): number;
    floorOf(range: string): string;
    peerVersions(target: string, peers?: Record<string, string>): Record<string, string>;
};

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

    it("keeps sprintf-js out of the installed tree", () => {
        const installed = Object.keys(lockfile.packages);
        expect(installed.length).toBeGreaterThan(100);
        expect(installed.filter(name => /(^|\/)node_modules\/sprintf-js$/.test(name))).toEqual([]);
        expect(lockfile.packages["node_modules/js-yaml"].version).toMatch(/^4\./);
    });

    it("stops renovate from raising the js-yaml override to a new major", () => {
        expect(manifest.overrides["@istanbuljs/load-nyc-config"]["js-yaml"]).toMatch(/^\^4\./);
        expect(renovate.packageRules).toContainEqual({
            matchPackageNames: ["js-yaml"],
            matchUpdateTypes: ["major"],
            enabled: false
        });
    });

    it("declares the peer ranges the compat check covers", () => {
        expect(manifest.peerDependencies).toEqual({
            "azure-devops-extension-api": "^5.273.0",
            "azure-devops-extension-sdk": "^4.0.2 || ^5.0.0"
        });
        expect(compat.PEERS.sort()).toEqual(Object.keys(manifest.peerDependencies).sort());
    });

    it("resolves the oldest version of a peer range", () => {
        expect(compat.floorOf("^5.273.0")).toBe("5.273.0");
        expect(compat.floorOf("^5.0.0 || ^4.0.2")).toBe("4.0.2");
        expect(compat.floorOf(">=4.10.0 || ~4.9.1")).toBe("4.9.1");
        expect(compat.compareVersions("5.273.0", "5.273.0")).toBe(0);
        expect(compat.compareVersions("5.9.0", "5.10.0")).toBeLessThan(0);
        expect(compat.compareVersions("5.273.1", "5.273.0")).toBeGreaterThan(0);
    });

    it("picks the peer versions for each compat target", () => {
        expect(compat.peerVersions("floor")).toEqual({
            "azure-devops-extension-api": "5.273.0",
            "azure-devops-extension-sdk": "4.0.2"
        });
        expect(compat.peerVersions("latest")).toEqual({
            "azure-devops-extension-api": "latest",
            "azure-devops-extension-sdk": "latest"
        });
        expect(() => compat.peerVersions("newest")).toThrow("Unknown target");
    });

    it("runs the compat check in CI for every target", () => {
        expect(workflow).toContain(`target: [${compat.TARGETS.join(", ")}]`);
        expect(workflow).toContain("npm run compat -- ${{ matrix.target }}");
        expect(manifest.scripts.compat).toBe("node scripts/compat.js");
    });

    it("tests the oldest supported node version in CI", () => {
        const oldest = `${manifest.engines.node.match(/^>=(\d+)\./)[1]}.x`;
        const versions = workflow.match(/node-version: \[(.+)\]/)![1].split(", ");
        expect(versions[0]).toBe(oldest);
        expect(workflow).toContain(`- target: floor\n            node-version: ${oldest}`);
    });

    it("keeps renovate from automerging or rewriting the mocked peers", () => {
        const rules: Array<Record<string, unknown>> = renovate.packageRules;
        const devAutomerge = rules.findIndex(rule => JSON.stringify(rule.matchDepTypes) === '["devDependencies"]');
        const peerReview = rules.findIndex(
            rule =>
                JSON.stringify(rule.matchPackageNames) ===
                '["azure-devops-extension-api","azure-devops-extension-sdk"]'
        );
        expect(devAutomerge).toBeGreaterThanOrEqual(0);
        expect(peerReview).toBeGreaterThan(devAutomerge);
        expect(rules[peerReview].automerge).toBe(false);
        expect(rules).toContainEqual({ matchDepTypes: ["peerDependencies"], enabled: false });
    });

    it("detects a test framework import when one is present", () => {
        expect(TEST_FRAMEWORK_IMPORT.test("const { expect } = require(\"@jest/globals\");")).toBe(true);
        expect(TEST_FRAMEWORK_IMPORT.test("import { vi } from \"vitest\";")).toBe(true);
        expect(TEST_FRAMEWORK_IMPORT.test("const crypto = require(\"crypto\");")).toBe(false);
    });
});
