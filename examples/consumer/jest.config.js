module.exports = {
    preset: "ts-jest",
    moduleNameMapper: {
        "^azure-devops-extension-sdk$": "azure-devops-extension-mock/sdk"
    },
    transform: {
        "node_modules[\\\\/]azure-devops-extension-api[\\\\/].+\\.js$":
            "azure-devops-extension-mock/jest-helpers/amd-transformer"
    },
    transformIgnorePatterns: ["node_modules/(?!azure-devops-extension-api)"],
    setupFiles: ["azure-devops-extension-mock/jest-helpers/setup-globals"]
};
