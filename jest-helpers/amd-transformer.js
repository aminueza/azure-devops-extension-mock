// Jest transformer: wrap azure-devops-extension-api AMD modules in a CommonJS
// shim that provides a local `define` closing over the file's own require.
//
// Register in jest.config.js via:
//   transform: {
//     'node_modules[\\\\/]azure-devops-extension-api[\\\\/].+\\.js$':
//       'azure-devops-extension-mock/jest-helpers/amd-transformer',
//   },
//   transformIgnorePatterns: ['node_modules/(?!azure-devops-extension-api)'],
module.exports = {
    process(source, filename) {
        const path = require("path");
        const dir = path.dirname(filename).replace(/\\/g, "/");
        const basename = path.basename(filename);
        const wrapped = `
var __amdDir = ${JSON.stringify(dir)};
var __amdFile = ${JSON.stringify(basename)};
var __amdPath = require("path");
var define = function(deps, factory) {
    var resolved = deps.map(function (dep) {
        if (dep === "require") return require;
        if (dep === "exports") return module.exports;
        if (dep === "module") return module;
        if (dep.charAt(0) === ".") {
            var absolute = __amdPath.join(__amdDir, dep);
            if (!/\\.js$/.test(absolute)) absolute += ".js";
            return require(absolute);
        }
        return require(dep);
    });
    var result = factory.apply(null, resolved);
    if (result !== undefined) {
        module.exports = result;
    }
};
define.amd = {};
${source}`;
        return { code: wrapped };
    },
    getCacheKey(source, filename) {
        const crypto = require("crypto");
        return crypto
            .createHash("md5")
            .update("azure-devops-extension-mock/amd-transformer@1")
            .update("\0")
            .update(filename)
            .update("\0")
            .update(source)
            .digest("hex");
    },
};
