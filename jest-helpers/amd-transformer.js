const crypto = require("crypto");

const CACHE_SALT = "azure-devops-extension-mock/amd-transformer@2";
const DEFINE_PATTERN = /^define\(\s*(\[[^\]]*\])\s*,/m;

const LOCAL_BINDINGS = {
    require: "require",
    exports: "exports",
    module: "module"
};

const toModuleId = (dependency) => {
    if (!dependency.startsWith(".") || dependency.endsWith(".js")) {
        return dependency;
    }
    return `${dependency}.js`;
};

const toExpression = (dependency) =>
    LOCAL_BINDINGS[dependency] ?? `require(${JSON.stringify(toModuleId(dependency))})`;

const readDependencies = (source) => {
    const match = DEFINE_PATTERN.exec(source);
    if (!match) {
        return undefined;
    }
    const dependencies = JSON.parse(match[1]);
    if (!dependencies.every((dependency) => typeof dependency === "string")) {
        throw new Error("amd-transformer: define() dependencies must be string literals");
    }
    return dependencies;
};

const wrap = (source, dependencies) => `var __amdDependencies = [${dependencies.map(toExpression).join(", ")}];
var define = function (_ids, factory) {
    var result = factory.apply(null, __amdDependencies);
    if (result !== undefined) {
        module.exports = result;
    }
};
define.amd = {};
${source}`;

module.exports = {
    process(source) {
        const dependencies = readDependencies(source);
        return { code: dependencies === undefined ? source : wrap(source, dependencies) };
    },
    getCacheKey(source, filename) {
        return crypto
            .createHash("sha256")
            .update(CACHE_SALT)
            .update("\0")
            .update(filename)
            .update("\0")
            .update(source)
            .digest("hex");
    }
};
