import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    AcquisitionOptions,
    ExtensionAcquisitionRequest,
    ExtensionAuditLog,
    ExtensionAuthorization,
    ExtensionDataCollection,
    ExtensionDataCollectionQuery,
    ExtensionManagementRestClient,
    ExtensionRequestState,
    ExtensionState,
    ExtensionStateFlags,
    InstalledExtension,
    InstalledExtensionQuery,
    RequestedExtension
} from "azure-devops-extension-api/ExtensionManagement";
import type { UserExtensionPolicy } from "azure-devops-extension-api/Gallery";
import {
    ExtensionDocument,
    documents,
    extensionStates,
    installedExtensions,
    makeAcquisitionOptions,
    makeExtensionAcquisitionRequest,
    makeExtensionAuditLog,
    makeExtensionAuthorization,
    makeExtensionDocument,
    makeExtensionRequest,
    makeInstalledExtension,
    makeRequestedExtension,
    makeUserExtensionPolicy,
    requestedExtensions
} from "./Data";
import { fake } from "../common/fixtures";

const findInstalled = (publisherName: string, extensionName: string): InstalledExtension =>
    installedExtensions.find(e => e.publisherId === publisherName && e.extensionId === extensionName) ?? {
        ...makeInstalledExtension(),
        publisherId: publisherName,
        extensionId: extensionName
    };

const findRequested = (publisherName: string, extensionName: string): RequestedExtension =>
    requestedExtensions.find(r => r.publisherName === publisherName && r.extensionName === extensionName) ?? {
        ...makeRequestedExtension(),
        publisherName,
        extensionName
    };

const findDocument = (documentId: string): ExtensionDocument =>
    documents.find(d => d.id === documentId) ?? { ...makeExtensionDocument(), id: documentId };

const isDisabled = (flags: ExtensionStateFlags): boolean => (flags & ExtensionStateFlags.Disabled) !== 0;

export class MockExtensionManagementRestClient extends RestClientBase {
    public TYPE = ExtensionManagementRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getAcquisitionOptions(
        itemId: string,
        _testCommerce?: boolean,
        _isFreeOrTrialInstall?: boolean,
        _isAccountOwner?: boolean,
        _isLinked?: boolean,
        _isConnectedServer?: boolean,
        _isBuyOperationValid?: boolean
    ): Promise<AcquisitionOptions> {
        return Promise.resolve({ ...makeAcquisitionOptions(), itemId });
    }

    requestAcquisition(acquisitionRequest: ExtensionAcquisitionRequest): Promise<ExtensionAcquisitionRequest> {
        return Promise.resolve({ ...makeExtensionAcquisitionRequest(), ...acquisitionRequest });
    }

    getAuditLog(publisherName: string, extensionName: string): Promise<ExtensionAuditLog> {
        return Promise.resolve({ ...makeExtensionAuditLog(), publisherName, extensionName });
    }

    getAuthorization(
        _publisherName: string,
        _extensionName: string,
        registrationId: string
    ): Promise<ExtensionAuthorization> {
        return Promise.resolve({ ...makeExtensionAuthorization(), id: registrationId });
    }

    registerAuthorization(
        _publisherName: string,
        _extensionName: string,
        registrationId: string
    ): Promise<ExtensionAuthorization> {
        return Promise.resolve({ ...makeExtensionAuthorization(), id: registrationId });
    }

    createDocumentByName(
        doc: any,
        _publisherName: string,
        _extensionName: string,
        _scopeType: string,
        _scopeValue: string,
        _collectionName: string
    ): Promise<any> {
        return Promise.resolve({ ...makeExtensionDocument(), ...doc });
    }

    deleteDocumentByName(
        _publisherName: string,
        _extensionName: string,
        _scopeType: string,
        _scopeValue: string,
        _collectionName: string,
        _documentId: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getDocumentByName(
        _publisherName: string,
        _extensionName: string,
        _scopeType: string,
        _scopeValue: string,
        _collectionName: string,
        documentId: string
    ): Promise<any> {
        return Promise.resolve(findDocument(documentId));
    }

    getDocumentsByName(
        _publisherName: string,
        _extensionName: string,
        _scopeType: string,
        _scopeValue: string,
        _collectionName: string
    ): Promise<any[]> {
        return Promise.resolve(documents);
    }

    setDocumentByName(
        doc: any,
        _publisherName: string,
        _extensionName: string,
        _scopeType: string,
        _scopeValue: string,
        _collectionName: string
    ): Promise<any> {
        return Promise.resolve({ ...makeExtensionDocument(), ...doc });
    }

    updateDocumentByName(
        doc: any,
        _publisherName: string,
        _extensionName: string,
        _scopeType: string,
        _scopeValue: string,
        _collectionName: string
    ): Promise<any> {
        return Promise.resolve({ ...makeExtensionDocument(), ...doc });
    }

    queryCollectionsByName(
        collectionQuery: ExtensionDataCollectionQuery,
        _publisherName: string,
        _extensionName: string
    ): Promise<ExtensionDataCollection[]> {
        return Promise.resolve(collectionQuery.collections.map(collection => ({ ...collection, documents })));
    }

    getStates(
        includeDisabled?: boolean,
        _includeErrors?: boolean,
        includeInstallationIssues?: boolean,
        _forceRefresh?: boolean
    ): Promise<ExtensionState[]> {
        return Promise.resolve(
            extensionStates
                .filter(s => includeDisabled !== false || !isDisabled(s.flags))
                .map(s => (includeInstallationIssues === true ? s : { ...s, installationIssues: [] }))
        );
    }

    queryExtensions(query: InstalledExtensionQuery): Promise<InstalledExtension[]> {
        return Promise.resolve(query.monikers.map(m => findInstalled(m.publisherName, m.extensionName)));
    }

    getInstalledExtensions(
        includeDisabledExtensions?: boolean,
        _includeErrors?: boolean,
        _assetTypes?: string[],
        includeInstallationIssues?: boolean
    ): Promise<InstalledExtension[]> {
        return Promise.resolve(
            installedExtensions
                .filter(e => includeDisabledExtensions !== false || !isDisabled(e.installState.flags))
                .map(e =>
                    includeInstallationIssues === true
                        ? e
                        : { ...e, installState: { ...e.installState, installationIssues: [] } }
                )
        );
    }

    updateInstalledExtension(extension: InstalledExtension): Promise<InstalledExtension> {
        return Promise.resolve({ ...findInstalled(extension.publisherId, extension.extensionId), ...extension });
    }

    getInstalledExtensionByName(
        publisherName: string,
        extensionName: string,
        _assetTypes?: string[]
    ): Promise<InstalledExtension> {
        return Promise.resolve(findInstalled(publisherName, extensionName));
    }

    installExtensionByName(publisherName: string, extensionName: string, version?: string): Promise<InstalledExtension> {
        const extension = findInstalled(publisherName, extensionName);
        return Promise.resolve({ ...extension, version: version ?? extension.version });
    }

    uninstallExtensionByName(
        _publisherName: string,
        _extensionName: string,
        _reason?: string,
        _reasonCode?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getPolicies(userId: string): Promise<UserExtensionPolicy> {
        return Promise.resolve({ ...makeUserExtensionPolicy(), userId });
    }

    resolveRequest(
        _rejectMessage: string,
        _publisherName: string,
        _extensionName: string,
        _requesterId: string,
        _state: ExtensionRequestState
    ): Promise<number> {
        return Promise.resolve(1);
    }

    getRequests(): Promise<RequestedExtension[]> {
        return Promise.resolve(requestedExtensions);
    }

    resolveAllRequests(
        _rejectMessage: string,
        publisherName: string,
        extensionName: string,
        _state: ExtensionRequestState
    ): Promise<number> {
        return Promise.resolve(findRequested(publisherName, extensionName).requestCount);
    }

    deleteRequest(_publisherName: string, _extensionName: string): Promise<void> {
        return Promise.resolve();
    }

    requestExtension(publisherName: string, extensionName: string, requestMessage: string): Promise<RequestedExtension> {
        const requested = findRequested(publisherName, extensionName);
        return Promise.resolve({
            ...requested,
            extensionRequests: [{ ...makeExtensionRequest(), requestMessage }],
            requestCount: 1
        });
    }

    getToken(): Promise<string> {
        return Promise.resolve(fake.string.alphanumeric(64));
    }
}
