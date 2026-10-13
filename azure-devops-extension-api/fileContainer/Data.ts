import { fake } from "../common/fixtures";
import {
    BlobCompressionType,
    ContainerItemBlobReference,
    ContainerItemStatus,
    ContainerItemType,
    ContainerOptions,
    FileContainer,
    FileContainerItem
} from "azure-devops-extension-api/FileContainer";

const ROOT_FOLDER = "drop";
const UTF8_CODE_PAGE = 65_001;

const bytes = (length: number): number[] => Array.from({ length }, () => fake.number.int({ min: 0, max: 255 }));

export const makeFileContainer = (): FileContainer => {
    const id = fake.number.id();
    const location = `${fake.internet.url()}/_apis/resources/Containers/${id}`;
    return {
        id,
        name: fake.lorem.slug(2),
        description: fake.lorem.sentence(),
        artifactUri: `vstfs:///Build/Build/${fake.number.id()}`,
        contentLocation: location,
        itemLocation: location,
        createdBy: fake.string.uuid(),
        dateCreated: fake.date.recent(),
        locatorPath: "",
        options: ContainerOptions.None,
        scopeIdentifier: fake.string.uuid(),
        securityToken: fake.string.uuid(),
        signingKeyId: fake.string.uuid(),
        size: fake.number.int({ min: 1_000, max: 5_000_000 })
    };
};

export const makeContainerItemBlobReference = (
    scopeIdentifier: string = fake.string.uuid()
): ContainerItemBlobReference => ({
    artifactHash: fake.git.commitSha(),
    artifactId: fake.number.id(),
    compressionType: BlobCompressionType.GZip,
    scopeIdentifier,
    sessionId: fake.string.uuid()
});

export const makeFileContainerItem = (
    containerId: number = fake.number.id(),
    path = `${ROOT_FOLDER}/${fake.system.fileName()}`,
    scopeIdentifier: string = fake.string.uuid()
): FileContainerItem => {
    const location = `${fake.internet.url()}/_apis/resources/Containers/${containerId}?itemPath=${path}`;
    const createdBy = fake.string.uuid();
    const dateCreated = fake.date.recent({ days: 2 });
    return {
        containerId,
        path,
        itemType: ContainerItemType.File,
        status: ContainerItemStatus.Created,
        scopeIdentifier,
        artifactId: fake.number.id(),
        blobMetadata: fake.helpers.absent(),
        ticket: fake.helpers.absent(),
        contentId: bytes(16),
        contentLocation: location,
        itemLocation: location,
        createdBy,
        lastModifiedBy: createdBy,
        dateCreated,
        dateLastModified: dateCreated,
        fileEncoding: UTF8_CODE_PAGE,
        fileHash: bytes(16),
        fileId: fake.number.id(),
        fileLength: fake.number.int({ min: 1, max: 1_000_000 }),
        fileType: 1
    };
};

export const makeFileContainerFolder = (
    containerId: number = fake.number.id(),
    path = ROOT_FOLDER,
    scopeIdentifier: string = fake.string.uuid()
): FileContainerItem => ({
    ...makeFileContainerItem(containerId, path, scopeIdentifier),
    itemType: ContainerItemType.Folder,
    contentId: [],
    fileEncoding: 0,
    fileHash: fake.helpers.absent(),
    fileId: 0,
    fileLength: 0,
    fileType: 0
});

export const makeFileContainerItems = ({ id, scopeIdentifier }: FileContainer, files = 3): FileContainerItem[] => [
    makeFileContainerFolder(id, ROOT_FOLDER, scopeIdentifier),
    ...fake.helpers.distinct(
        files,
        () => makeFileContainerItem(id, `${ROOT_FOLDER}/${fake.system.fileName()}`, scopeIdentifier),
        item => item.path
    )
];

export const containers: FileContainer[] = Array.from({ length: 3 }, makeFileContainer);

export const containerItems: FileContainerItem[] = containers.flatMap(container => makeFileContainerItems(container));
