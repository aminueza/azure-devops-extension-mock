module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '^azure-devops-extension-sdk$': '<rootDir>/azure-devops-extension-sdk',
        '^azure-devops-extension-api/Common/Context$': '<rootDir>/node_modules/azure-devops-extension-api/Common/Context.d.ts',
        '^azure-devops-extension-api/Common/RestClientBase$': '<rootDir>/node_modules/azure-devops-extension-api/Common/RestClientBase.d.ts',
        '^azure-devops-extension-sdk/SDK$': '<rootDir>/node_modules/azure-devops-extension-sdk/SDK.d.ts',
    },
    transform: {
        '\\.tsx?$': 'ts-jest',
        'node_modules[\\\\/]azure-devops-extension-api[\\\\/].+\\.js$':
            '<rootDir>/jest-helpers/amd-transformer.js',
    },
    transformIgnorePatterns: [
        'node_modules/(?!azure-devops-extension-api)',
    ],
    setupFiles: ['<rootDir>/jest-helpers/setup-globals.js'],
    collectCoverageFrom: [
        'azure-devops-extension-api/**/*.ts',
        'azure-devops-extension-sdk/**/*.ts',
        '!**/*.d.ts',
    ],
    coverageThreshold: {
        global: {
            statements: 90,
            branches: 90,
            functions: 90,
            lines: 90,
        },
    },
};
