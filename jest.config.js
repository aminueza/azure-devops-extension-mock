module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '^azure-devops-extension-sdk$': '<rootDir>/azure-devops-extension-sdk',
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
};
