import { ExtensionDataCollection, IDialogOptions, IDocumentOptions, IExtensionDataManager, IExtensionDataService, IGlobalDialog, IGlobalMessageBanner, IGlobalMessagesService, IHostNavigationService, IHostPageLayoutService, ILocationService, IMessageDialogOptions, IPanelOptions, IProjectInfo, IProjectPageService, IToast, TeamFoundationHostType } from "azure-devops-extension-api/Common";
import { faker } from "@faker-js/faker";

/**
 * Mocking IProjectPageService to return
 * a random project id and name
 */
export const MockProjectPageService: IProjectPageService = {
    getProject: async (): Promise<IProjectInfo> => {
        return {
            id: faker.string.uuid(),
            name: faker.lorem.slug(),
        };
    }
}

/**
 * Mocking ILocationService to return
 * a random url
 * */
export const MockLocationService: ILocationService = {
    getResourceAreaLocation: async (resourceAreaId: string) => {
        return `https://${faker.internet.domainName()}/resource/${resourceAreaId}`;
    },

    getServiceLocation: async (serviceInstanceType?: string, hostType?: TeamFoundationHostType) => {
        return `https://${faker.internet.domainName()}/service/${serviceInstanceType || 'defaultService'}/${hostType || 'defaultHost'}`;
    },

    routeUrl: async (routeId: string, routeValues?: { [key: string]: string }, hostPath?: string) => {
        const baseHost = hostPath || `https://${faker.internet.domainName()}`;
        const routeValueString = routeValues ? Object.entries(routeValues).map(([key, value]) => `${key}=${value}`).join('&') : '';
        return `${baseHost}/route/${routeId}${routeValueString ? '?' + routeValueString : ''}`;
    }
};

/**
 * Mocking IHostPageLayoutService to log
 * the function calls
 * */
export const MockHostPageLayoutService: IHostPageLayoutService = {
    getFullScreenMode: async () => faker.datatype.boolean(),

    openCustomDialog: <TResult>(contentContributionId: string, options?: IDialogOptions<TResult>) => {
        console.log(`Opening custom dialog with ID: ${contentContributionId}`);
        if (options) {
            console.log(`Dialog options: ${JSON.stringify(options)}`);
        }
    },

    openMessageDialog: (message: string, options?: IMessageDialogOptions) => {
        console.log(`Opening message dialog with message: ${message}`);
        if (options) {
            console.log(`Message dialog options: ${JSON.stringify(options)}`);
        }
    },

    openPanel: <TResult>(contentContributionId: string, options: IPanelOptions<TResult>) => {
        console.log(`Opening panel with ID: ${contentContributionId}`);
        console.log(`Panel options: ${JSON.stringify(options)}`);
    },

    setFullScreenMode: (fullScreenMode: boolean) => {
        console.log(`Setting full screen mode: ${fullScreenMode}`);
    }
};

/**
 * Mocking IHostNavigationService to log
 * the function calls
 * */
export const MockHostNavigationService: IHostNavigationService = {
    getHash: async () => `#${faker.lorem.word()}`,

    getPageNavigationElements: async () => [{
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        type: faker.helpers.arrayElement(['link', 'button']),
    }],

    getPageRoute: async () => ({
        id: faker.string.uuid(),
        routeValues: {
            key1: faker.lorem.word(),
            key2: faker.commerce.productName(),
        }
    }),

    getQueryParams: async () => ({
        param1: faker.lorem.word(),
        param2: faker.lorem.word(),
    }),

    navigate: (url: string) => {
        console.log(`Navigating to: ${url}`);
    },

    onHashChanged: (callback: (hash: string) => void) => {
        callback(`#${faker.lorem.word()}`);
    },

    openNewWindow: (url: string, features: string) => {
        console.log(`Opening a new window with URL: ${url} and features: ${features}`);
    },

    reload: () => {
        console.log(`Reloading parent frame.`);
    },

    replaceHash: (hash: string) => {
        console.log(`Replacing current hash with: ${hash}`);
    },

    setDocumentTitle: (title: string) => {
        console.log(`Setting document title to: ${title}`);
    },

    setHash: (hash: string) => {
        console.log(`Setting hash to: ${hash}`);
    },

    setQueryParams: (parameters: { [key: string]: string; }) => {
        console.log(`Setting query parameters to: ${JSON.stringify(parameters)}`);
    }
}

/**
 * Mocking IGlobalMessagesService to log
 * the function calls
 * */
export const MockGlobalMessagesService: IGlobalMessagesService = {
    addBanner(banner: IGlobalMessageBanner) {
        console.log(`Adding banner: ${JSON.stringify(banner)}`);
    },

    addDialog(dialog: IGlobalDialog) {
        console.log(`Adding dialog: ${JSON.stringify(dialog)}`);
    },

    addToast(toast: IToast) {
        console.log(`Adding toast: ${JSON.stringify(toast)}`);
    },

    closeBanner() {
        console.log(`Closing banner.`);
    },

    closeDialog() {
        console.log(`Closing dialog.`);
    }
};

export const MockExtensionDataManager: IExtensionDataManager = {
    getValue: async (key: string, documentOptions?: IDocumentOptions | undefined) => {
        console.log(`Getting value for key: ${key}, document options: ${JSON.stringify(documentOptions)}`);
        return new Promise(() => faker.lorem.word());
    },
    setValue: async (key: string, value: any, documentOptions?: IDocumentOptions) => {
        console.log(`Setting value for key: ${key} to: ${value} with document options: ${JSON.stringify(documentOptions)}`);
        return new Promise(() => faker.lorem.word());
    },
    getDocument: async (collectionName: string, id: string, documentOptions?: IDocumentOptions) => {
        console.log(`Getting document with ID: ${id} from collection: ${collectionName} with document options: ${JSON.stringify(documentOptions)}`);
        return new Promise(() => faker.lorem.paragraph());
    },
    getDocuments: async (collectionName: string, documentOptions?: IDocumentOptions) => {
        console.log(`Getting documents from collection: ${collectionName} with document options: ${JSON.stringify(documentOptions)}`);
        return new Promise(() => [faker.lorem.paragraph()]);
    },
    setDocument: async (content: string) => {
        console.log(`Setting document to: ${content}`);
    },
    queryCollections: async (collections: ExtensionDataCollection[]) => {
        console.log(`Querying collections: ${JSON.stringify(collections)}`);
        return new Promise(() => [faker.lorem.paragraph()]);
    },
    queryCollectionsByName: async (collectionNames: string[]) => {
        console.log(`Querying collections by name: ${JSON.stringify(collectionNames)}`);
        return new Promise(() => [faker.lorem.paragraph()]);
    },
    createDocument: async (content: string) => {
        console.log(`Creating document with content: ${content}`);
        return faker.lorem.word();
    },
    deleteDocument: async (documentId: string) => {
        console.log(`Deleting document with ID: ${documentId}`);
    },
    updateDocument: async (documentId: string, content: string) => {
        console.log(`Updating document with ID: ${documentId} to: ${content}`);
    },
};

export const MockExtensionDataService: IExtensionDataService = {
    getExtensionDataManager(extensionId: string, accessToken: string) {
        console.log(`Getting extension data manager for extension ID: ${extensionId} and access token: ${accessToken}`);
        return new Promise(() => MockExtensionDataManager);
    }
};
