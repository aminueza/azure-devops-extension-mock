import { ExtensionDataCollection, IDialogOptions, IDocumentOptions, IExtensionDataManager, IExtensionDataService, IGlobalDialog, IGlobalMessageBanner, IGlobalMessagesService, IHostNavigationService, IHostPageLayoutService, ILocationService, IMessageDialogOptions, IPanelOptions, IProjectInfo, IProjectPageService, IToast, TeamFoundationHostType } from "azure-devops-extension-api/Common";
import { fake } from "./fixtures";

/**
 * Mocking IProjectPageService to return
 * a random project id and name
 */
export const MockProjectPageService: IProjectPageService = {
    getProject: async (): Promise<IProjectInfo> => {
        return {
            id: fake.string.uuid(),
            name: fake.lorem.slug(),
        };
    }
}

/**
 * Mocking ILocationService to return
 * a random url
 * */
export const MockLocationService: ILocationService = {
    getResourceAreaLocation: async (resourceAreaId: string) => {
        return `https://${fake.internet.domainName()}/resource/${resourceAreaId}`;
    },

    getServiceLocation: async (serviceInstanceType?: string, hostType?: TeamFoundationHostType) => {
        return `https://${fake.internet.domainName()}/service/${serviceInstanceType || 'defaultService'}/${hostType || 'defaultHost'}`;
    },

    routeUrl: async (routeId: string, routeValues?: { [key: string]: string }, hostPath?: string) => {
        const baseHost = hostPath || `https://${fake.internet.domainName()}`;
        const routeValueString = routeValues ? Object.entries(routeValues).map(([key, value]) => `${key}=${value}`).join('&') : '';
        return `${baseHost}/route/${routeId}${routeValueString ? '?' + routeValueString : ''}`;
    }
};

/**
 * Mocking IHostPageLayoutService to log
 * the function calls
 * */
export const MockHostPageLayoutService: IHostPageLayoutService = {
    getFullScreenMode: async () => fake.datatype.boolean(),

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
    getHash: async () => `#${fake.lorem.word()}`,

    getPageNavigationElements: async () => [{
        id: fake.string.uuid(),
        name: fake.commerce.productName(),
        type: fake.helpers.arrayElement(['link', 'button']),
    }],

    getPageRoute: async () => ({
        id: fake.string.uuid(),
        routeValues: {
            key1: fake.lorem.word(),
            key2: fake.commerce.productName(),
        }
    }),

    getQueryParams: async () => ({
        param1: fake.lorem.word(),
        param2: fake.lorem.word(),
    }),

    navigate: (url: string) => {
        console.log(`Navigating to: ${url}`);
    },

    onHashChanged: (callback: (hash: string) => void) => {
        callback(`#${fake.lorem.word()}`);
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
    getValue: async <T>(key: string, documentOptions?: IDocumentOptions | undefined): Promise<T> => {
        console.log(`Getting value for key: ${key}, document options: ${JSON.stringify(documentOptions)}`);
        return fake.lorem.word() as unknown as T;
    },
    setValue: async <T>(key: string, value: T, documentOptions?: IDocumentOptions): Promise<T> => {
        console.log(`Setting value for key: ${key} to: ${value} with document options: ${JSON.stringify(documentOptions)}`);
        return value;
    },
    getDocument: async (collectionName: string, id: string, documentOptions?: IDocumentOptions) => {
        console.log(`Getting document with ID: ${id} from collection: ${collectionName} with document options: ${JSON.stringify(documentOptions)}`);
        return Promise.resolve(fake.lorem.paragraph());
    },
    getDocuments: async (collectionName: string, documentOptions?: IDocumentOptions) => {
        console.log(`Getting documents from collection: ${collectionName} with document options: ${JSON.stringify(documentOptions)}`);
        return Promise.resolve([fake.lorem.paragraph()]);
    },
    setDocument: async (content: string) => {
        console.log(`Setting document to: ${content}`);
    },
    queryCollections: async (collections: ExtensionDataCollection[]) => {
        console.log(`Querying collections: ${JSON.stringify(collections)}`);
        return collections;
    },
    queryCollectionsByName: async (collectionNames: string[]) => {
        console.log(`Querying collections by name: ${JSON.stringify(collectionNames)}`);
        return collectionNames.map(collectionName => ({
            collectionName,
            scopeType: "Default",
            scopeValue: "Current",
            documents: [fake.lorem.paragraph()]
        }));
    },
    createDocument: async (content: string) => {
        console.log(`Creating document with content: ${content}`);
        return fake.lorem.word();
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
        return Promise.resolve(MockExtensionDataManager);
    }
};
