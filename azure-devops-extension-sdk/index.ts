import {
  IHostContext,
  IUserContext,
  IExtensionInitOptions,
  ContextIdentifier,
  IExtensionContext,
  ITeamContext,
  IPageContext,
} from "azure-devops-extension-sdk/SDK";
import { fake } from "../azure-devops-extension-api/common/fixtures";
import { instanceObjects } from "../azure-devops-extension-api/common/WorkItemNotificationListener";
import { getService as getMockService } from "../azure-devops-extension-api";

export const sdkVersion = 4.2;

export const getService = async <T>(contributionId: string): Promise<T> =>
  getMockService<T>(contributionId);

/**
 * Mocking SDK's HostType enum
 */
export enum HostType {
  Unknown = 0,
  Deployment = 1,
  Enterprise = 2,
  Organization = 4,
}

/**
 * Mocking SDK's init function to return
 * resolve(successful execution/init) to activate the .then block
 */
export const init = (options?: IExtensionInitOptions): Promise<void> => {
  return new Promise((resolve, reject) =>
    options?.loaded ?
      setTimeout(() => resolve(), 1000) :
      reject(new Error('Initialization failed because "loaded" is not set to true.'))
  )
}

/**
 * Mocking SDK.ready() to return
 * resolve(successful execution/init) to activate the .then block
 * timeout to simulate a long running operation
  */
export const ready = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
};

/**
 * Mocking SDK.notifyLoadSucceeded does nothing
 */
export const notifyLoadSucceeded = () => { };

/**
 * Mocking SDK.notifyLoadFailed does nothing
 * timeout to simulate a long running operation
 * */
export const notifyLoadFailed = (_: Error | string): Promise<void> => {
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
};

/**
 * Mocking SDK.getConfiguration(), will return fix witInput parameters for all controls
 * except for 'RepositoryId' which can be overwritten within the unit test.
 */
export const getConfiguration = (params?: { [key: string]: any }) => {
  return params
    ? params
    : {
      id: fake.string.uuid(),
      version: fake.system.semver(),
      name: fake.lorem.slug(),
      publisherId: fake.lorem.slug(),
      commitSha: fake.git.commitSha(),
    };
};

/**
 * Mocking SDK.getContributionId returns some Id
 */
export function getContributionId() {
  return fake.lorem.slug();
}

/**
 * Mocking SDK.getUser() and provide fixed values
 */
export const getUser = (): IUserContext => {
  return {
    descriptor: "aad." + Buffer.from(fake.word.noun()).toString("base64"),
    id: fake.string.uuid(),
    name: fake.internet.exampleEmail(),
    displayName: fake.person.firstName() + " " + fake.person.lastName(),
    imageUrl: fake.image.avatar(),
  };
};

/**
 * Mocking SDK.getHost() and provide random values
 */
export const getHost = (): IHostContext => {
  return {
    id: fake.lorem.slug(),
    name: fake.lorem.slug(),
    serviceVersion: fake.system.semver(),
    isHosted: fake.datatype.boolean(),
    type: fake.helpers.arrayElement([
      HostType.Unknown,
      HostType.Deployment,
      HostType.Enterprise,
      HostType.Organization,
    ]),
  };
};

/**
 * Mocking SDK.getExtensionContext() and provide random values
 * */
export const getExtensionContext = (): IExtensionContext => {
  return {
    id: fake.lorem.slug(),
    publisherId: fake.lorem.slug(),
    extensionId: fake.lorem.slug(),
    version: fake.system.semver(),
  };
};

/**
 * Gets information about the team that the page is targeting
 */
export const getTeamContext = (): ITeamContext => {
  return {
    id: fake.string.uuid(),
    name: fake.lorem.slug(),
  };
};

/**
 * Get the context about the host page
 */
export const getPageContext = (): IPageContext => {
  return {
    webContext: getWebContext(),
    timeZonesConfiguration: {
      daylightSavingsAdjustments: [
        {
          offset: fake.number.int(),
          start: fake.date.recent(),
        },
      ],
    },
    globalization: {
      culture: fake.lorem.slug(),
      explicitTheme: fake.lorem.slug(),
      theme: fake.lorem.slug(),
      timeZoneId: fake.lorem.slug(),
      timezoneOffset: fake.number.int(),
      typeAheadDisabled: fake.datatype.boolean(),
    },
  };
};

/**
 * Get the context about the host page
 * */
export const getWebContext = () => {
  return {
    project: {
      id: fake.string.uuid(),
      name: fake.lorem.slug(),
    } as ContextIdentifier,
    team: getTeamContext(),
  };
};

/**
 * Mocking SDK.register()
 * Assign the callback methods (parameter instance) passed from the controls to the spy
 */
export const register = <T = any>(instanceId: string, instance: T) => {
  instanceObjects[instanceId] = instance;
  console.log("Registering instance: " + instanceId);
};

/**
* Mocking SDK.unregister()
* Assign the callback methods (parameter instance) passed from the controls to the spy
* */
export const unregister = (instanceId: string) => {
  delete instanceObjects[instanceId];
  console.log("Unregistering instance: " + instanceId);
};

/**
 * Mocking SDK.notifyLoadSucceeded does nothing
 * */
export const getAppToken = (): Promise<string> =>
  new Promise<string>((resolve) =>
    resolve(Buffer.from(fake.string.uuid()).toString("base64"))
  );
/**
 * Mocking SDK.notifyLoadSucceeded does nothing
 * */
export const getAccessToken = (): Promise<string> =>
  new Promise<string>((resolve) =>
    resolve(Buffer.from(fake.string.uuid()).toString("base64"))
  );

/**
 * Mocking SDK.notifyLoadSucceeded does nothing
 * */
export const resize = (width?: number, height?: number) => {
  console.log(`Resizing to ${width}x${height}`);
};

/**
 * Mocking SDK.notifyLoadSucceeded does nothing
 * */
export const applyTheme = (themeData: { [varName: string]: string }) => {
  console.log(`Applying theme: ${JSON.stringify(themeData)}`);
};

let nestedAppAuthEnabled = false;

export const enableNestedAppAuth = (): Promise<void> => {
  nestedAppAuthEnabled = true;
  console.log("Enabling nested app auth");
  return Promise.resolve();
};

export const disableNestedAppAuth = (): void => {
  nestedAppAuthEnabled = false;
  console.log("Disabling nested app auth");
};

export const isNestedAppAuthEnabled = (): boolean => nestedAppAuthEnabled;
