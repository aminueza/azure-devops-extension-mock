const g = globalThis;

if (typeof g.self === "undefined") {
    g.self = globalThis;
}
if (typeof g.fetch === "undefined") {
    g.fetch = () => Promise.reject(new Error("fetch is not available in mock tests"));
}
