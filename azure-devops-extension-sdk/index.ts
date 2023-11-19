import {
  IHostContext,
  IUserContext,
  HostType,
  IExtensionInitOptions,
  ContextIdentifier,
  ITeamContext,
  IExtensionContext,
  IPageContext,
} from "azure-devops-extension-sdk";
import { faker } from "@faker-js/faker";
import { instanceObjects } from "../azure-devops-extension-api/common/WorkItemNotificationListener";

/**
 * Mocking SDK's init function to return
 * resolve(successful execution/init) to activate the .then block
 */
export const init = (options?: IExtensionInitOptions): Promise<void> => {
  return new Promise((resolve) =>
    options?.loaded ? setTimeout(() => resolve(), 1000) : resolve()
  );
};

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
      id: faker.string.uuid(),
      version: faker.system.semver(),
      name: faker.lorem.slug(),
      publisherId: faker.lorem.slug(),
      commitSha: faker.git.commitSha(),
    };
};

/**
 * Mocking SDK.getContributionId returns some Id
 */
export function getContributionId() {
  return faker.lorem.slug();
}

/**
 * Mocking SDK.getUser() and provide fixed values
 */
export const getUser = (): IUserContext => {
  return {
    descriptor: "aad." + Buffer.from(faker.word.noun()).toString("base64"),
    id: faker.string.uuid(),
    name: faker.internet.exampleEmail(),
    displayName: faker.person.firstName() + " " + faker.person.lastName(),
    imageUrl: faker.image.avatar(),
  };
};

/**
 * Mocking SDK.getHost() and provide random values
 */
export const getHost = (): IHostContext => {
  return {
    id: faker.lorem.slug(),
    name: faker.lorem.slug(),
    serviceVersion: faker.system.semver(),
    isHosted: faker.datatype.boolean(),
    type: faker.helpers.arrayElement([
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
    id: faker.lorem.slug(),
    publisherId: faker.lorem.slug(),
    extensionId: faker.lorem.slug(),
    version: faker.system.semver(),
  };
};

/**
 * Gets information about the team that the page is targeting
 */
export const getTeamContext = (): ITeamContext => {
  return {
    id: faker.string.uuid(),
    name: faker.lorem.slug(),
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
          offset: faker.number.int(),
          start: faker.date.recent(),
        },
      ],
    },
    globalization: {
      culture: faker.lorem.slug(),
      explicitTheme: faker.lorem.slug(),
      theme: faker.lorem.slug(),
      timeZoneId: faker.lorem.slug(),
      timezoneOffset: faker.number.int(),
      typeAheadDisabled: faker.datatype.boolean(),
    },
  };
};

/**
 * Get the context about the host page
 * */
export const getWebContext = () => {
  return {
    project: {
      id: faker.string.uuid(),
      name: faker.lorem.slug(),
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
export const getAppToken = () =>
  new Promise((resolve) =>
    resolve(Buffer.from(faker.string.uuid()).toString("base64"))
  );

/**
 * Mocking SDK.notifyLoadSucceeded does nothing
 * */
export const getAccessToken = () =>
  new Promise((resolve) =>
    resolve(Buffer.from(faker.string.uuid()).toString("base64"))
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
