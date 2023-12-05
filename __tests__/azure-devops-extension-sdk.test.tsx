
import { IPageContext, ITeamContext } from 'azure-devops-extension-sdk';
import {
    HostType,
    applyTheme,
    getAccessToken,
    getAppToken,
    getConfiguration,
    getContributionId,
    getExtensionContext,
    getHost,
    getPageContext,
    getTeamContext,
    getUser,
    getWebContext,
    init,
    notifyLoadFailed,
    notifyLoadSucceeded,
    ready,
    register,
    resize,
    unregister
} from '../azure-devops-extension-sdk';

describe('Mock Functions Tests', () => {
    type InstanceObjects = Record<string, any>;
    const instanceObjects: InstanceObjects = {};
    console.log = jest.fn();

    beforeEach(() => {
        Object.keys(instanceObjects).forEach((key) => delete instanceObjects[key]);
        jest.clearAllMocks();
    });

    jest.useFakeTimers();

    it('should resolve init function', async () => {
        const initPromise = init({ loaded: true });
        jest.advanceTimersByTime(1000);
        await expect(initPromise).resolves.toBeUndefined();
    });

    it('should reject init function', async () => {
        const initPromise = init({ loaded: false });
        jest.advanceTimersByTime(1000);
        await expect(initPromise).rejects.toThrow();
    });


    it('should resolve ready function', async () => {
        const readyPromise = ready();
        jest.advanceTimersByTime(1000);
        await expect(readyPromise).resolves.toBeUndefined();
    });

    it('should call notifyLoadSucceeded without errors', () => {
        expect(() => notifyLoadSucceeded()).not.toThrow();
    });

    it('should resolve notifyLoadFailed function', async () => {
        const error = 'Mock error';
        const notifyLoadFailedPromise = notifyLoadFailed(error);
        jest.advanceTimersByTime(1000);
        await expect(notifyLoadFailedPromise).resolves.toBeUndefined();
    });

    it('should return mock configuration', () => {
        const config = getConfiguration();
        expect(config).toBeDefined();
        expect(config.id).toBeDefined();
        expect(config.version).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.publisherId).toBeDefined();
        expect(config.commitSha).toBeDefined();
    });

    it('should return mock configuration with custom values', () => {
        const config = getConfiguration({
            id: 'test-id',
            version: 'test-version',
            name: 'test-name',
            publisherId: 'test-publisherId',
            commitSha: 'test-commitSha'
        });
        expect(config).toBeDefined();
        expect(config.id).toBe('test-id');
        expect(config.version).toBe('test-version');
        expect(config.name).toBe('test-name');
        expect(config.publisherId).toBe('test-publisherId');
        expect(config.commitSha).toBe('test-commitSha');
    });

    it('should return mock contributionId', () => {
        const contributionId = getContributionId();
        expect(contributionId).toBeDefined();
    });

    it('should return a valid user context', () => {
        const user = getUser();

        // Check if the user object has the required properties
        expect(user).toHaveProperty('descriptor');
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('displayName');
        expect(user).toHaveProperty('imageUrl');

        expect(typeof user.descriptor).toBe('string');
        expect(typeof user.id).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(typeof user.displayName).toBe('string');
        expect(typeof user.imageUrl).toBe('string');
    });

    it('should generate a valid descriptor in the expected format', () => {
        const user = getUser();

        // Check if the descriptor matches the expected format
        const descriptorRegex = /^aad\.[A-Za-z0-9+/]+={0,2}$/;
        expect(descriptorRegex.test(user.descriptor)).toBe(true);
    });

    it('should return a valid host context', () => {
        const host = getHost();

        // Check if the host object has the required properties
        expect(host).toHaveProperty('id');
        expect(host).toHaveProperty('name');
        expect(host).toHaveProperty('serviceVersion');
        expect(host).toHaveProperty('isHosted');
        expect(host).toHaveProperty('type');

        expect(typeof host.id).toBe('string');
        expect(typeof host.name).toBe('string');
        expect(typeof host.serviceVersion).toBe('string');
        expect(typeof host.isHosted).toBe('boolean');
        expect(Object.values(HostType).includes(host.type)).toBe(true);
    });

    it('should return a valid host context with a valid host type', () => {
        const host = getHost();

        expect(Object.values(HostType).includes(host.type)).toBe(true);
    });

    it('should generate a valid slug for id and name properties', () => {
        const host = getHost();

        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        expect(slugRegex.test(host.id)).toBe(true);
        expect(slugRegex.test(host.name)).toBe(true);
    });

    it('should return a valid service version in semver format', () => {
        const host = getHost();

        // Check if the serviceVersion matches the semver format
        const semverRegex = /^\d+\.\d+\.\d+$/;
        expect(semverRegex.test(host.serviceVersion)).toBe(true);
    });

    it('should return a valid extension context object', () => {
        const extensionContext = getExtensionContext();

        expect(typeof extensionContext.id).toBe('string');
        expect(typeof extensionContext.publisherId).toBe('string');
        expect(typeof extensionContext.extensionId).toBe('string');
        expect(typeof extensionContext.version).toBe('string');
    });

    it('should return a valid team context object', () => {
        const teamContext: ITeamContext = getTeamContext();

        expect(typeof teamContext.id).toBe('string');
        expect(typeof teamContext.name).toBe('string');
    });

    it('should return a valid page context object', () => {
        const pageContext: IPageContext = getPageContext();

        expect(typeof pageContext.globalization.culture).toBe('string');
        expect(typeof pageContext.globalization.explicitTheme).toBe('string');
        expect(typeof pageContext.globalization.theme).toBe('string');
        expect(typeof pageContext.globalization.timeZoneId).toBe('string');
        expect(typeof pageContext.globalization.timezoneOffset).toBe('number');
        expect(typeof pageContext.globalization.typeAheadDisabled).toBe('boolean');

        expect(pageContext.timeZonesConfiguration.daylightSavingsAdjustments).toBeInstanceOf(Array);
    });

    it('should register an instance', () => {
        const instanceId = 'yourInstanceId';
        const instance = { someProperty: 'someValue' };

        register(instanceId, instance);

        expect(console.log).toHaveBeenCalledWith(`Registering instance: ${instanceId}`);
    });

    it('should unregister an instance', () => {
        const instanceId = 'yourInstanceId';
        instanceObjects[instanceId] = { someProperty: 'someValue' };

        unregister(instanceId);

        expect(console.log).toHaveBeenCalledWith(`Unregistering instance: ${instanceId}`);
    });

    it('should get an app token', async () => {
        const token = await getAppToken();
        expect(token).toBeTruthy();
        expect(Buffer.from(token, 'base64').toString()).toMatch(/^[\da-fA-F]{8}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{12}$/);
    });

    it('should get an access token', async () => {
        const token = await getAccessToken();
        expect(token).toBeTruthy();
        expect(Buffer.from(token, 'base64').toString()).toMatch(/^[\da-fA-F]{8}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{12}$/);
    });

    it('should resize with width and height', () => {
        const width = 100;
        const height = 200;

        resize(width, height);

        expect(console.log).toHaveBeenCalledWith(`Resizing to ${width}x${height}`);
    });

    it('should apply a theme', () => {
        const themeData = { background: 'white', text: 'black' };

        applyTheme(themeData);

        expect(console.log).toHaveBeenCalledWith(`Applying theme: ${JSON.stringify(themeData)}`);
    });

});
