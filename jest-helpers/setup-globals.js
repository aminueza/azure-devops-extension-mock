// Shim browser globals that azure-devops-extension-api's transitive deps
// (whatwg-fetch) expect, so the package loads under a node test environment.
//
// Register in jest.config.js via:
//   setupFiles: ['azure-devops-extension-mock/jest-helpers/setup-globals'],
const g = globalThis;

if (typeof g.self === "undefined") {
    g.self = globalThis;
}
if (typeof g.fetch === "undefined") {
    g.fetch = () => Promise.reject(new Error("fetch is not available in mock tests"));
}
