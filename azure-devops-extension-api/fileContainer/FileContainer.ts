import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import { fake } from "../common/fixtures";
import {
    FileContainer,
    FileContainerItem,
    FileContainerRestClient
} from "azure-devops-extension-api/FileContainer";
import { VssJsonCollectionWrapperV } from "azure-devops-extension-api/WebApi";
import { containerItems, containers, makeContainerItemBlobReference, makeFileContainerItem } from "./Data";

const findItems = (containerId: number): FileContainerItem[] => {
    const known = containerItems.filter(i => i.containerId === containerId);
    return known.length > 0 ? known : [makeFileContainerItem(containerId)];
};

const isUnder = (item: FileContainerItem, itemPath?: string): boolean =>
    itemPath === undefined || item.path === itemPath || item.path.startsWith(`${itemPath}/`);

export class MockFileContainerRestClient extends RestClientBase {
    public TYPE = FileContainerRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createItems(
        items: VssJsonCollectionWrapperV<FileContainerItem[]>,
        containerId: number,
        _scope?: string
    ): Promise<FileContainerItem[]> {
        return Promise.resolve(
            items.value.map(item => ({ ...makeFileContainerItem(containerId, item.path), ...item, containerId }))
        );
    }

    deleteItem(_containerId: number, _itemPath: string, _scope?: string): Promise<void> {
        return Promise.resolve();
    }

    getContainers(scope?: string, artifactUris?: string): Promise<FileContainer[]> {
        const uris = artifactUris?.split(",");
        return Promise.resolve(
            containers.filter(
                c =>
                    (scope === undefined || c.scopeIdentifier === scope) &&
                    (uris === undefined || uris.includes(c.artifactUri))
            )
        );
    }

    getItems(
        containerId: number,
        _scope?: string,
        itemPath?: string,
        _metadata?: boolean,
        _format?: string,
        _downloadFileName?: string,
        includeDownloadTickets?: boolean,
        _isShallow?: boolean,
        _ignoreRequestedMediaType?: boolean,
        includeBlobMetadata?: boolean,
        _saveAbsolutePath?: boolean,
        _preferRedirect?: boolean
    ): Promise<FileContainerItem[]> {
        return Promise.resolve(
            findItems(containerId)
                .filter(item => isUnder(item, itemPath))
                .map(item => ({
                    ...item,
                    ticket: includeDownloadTickets === true ? fake.string.alphanumeric(32) : item.ticket,
                    blobMetadata:
                        includeBlobMetadata === true
                            ? makeContainerItemBlobReference(item.scopeIdentifier)
                            : item.blobMetadata
                }))
        );
    }
}
