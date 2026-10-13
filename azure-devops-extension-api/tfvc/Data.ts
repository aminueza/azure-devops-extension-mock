import { fake } from "../common/fixtures";
import {
    AssociatedWorkItem,
    CheckinNote,
    FileContentMetadata,
    ItemContentType,
    TfvcBranch,
    TfvcBranchRef,
    TfvcChange,
    TfvcChangeset,
    TfvcChangesetRef,
    TfvcItem,
    TfvcLabel,
    TfvcLabelRef,
    TfvcPolicyOverrideInfo,
    TfvcShelveset,
    TfvcShelvesetRef,
    TfvcStatistics,
    VersionControlChangeType
} from "azure-devops-extension-api/Tfvc";
import { makeIdentityRef } from "../core/Data";

const ROOT_PATH = "$/Project";
const MAIN_PATH = `${ROOT_PATH}/Main`;
const FILE_PATHS = [`${MAIN_PATH}/readme.md`, `${MAIN_PATH}/src/app.ts`, `${MAIN_PATH}/src/config.json`];

const fileNameOf = (path: string): string => path.slice(path.lastIndexOf("/") + 1);

const extensionOf = (path: string): string => {
    const fileName = fileNameOf(path);
    return fileName.slice(fileName.lastIndexOf(".") + 1);
};

export const makeBranchRef = (path: string): TfvcBranchRef => ({
    path,
    createdDate: fake.date.past(),
    description: fake.lorem.sentence(),
    isDeleted: false,
    owner: makeIdentityRef(),
    url: fake.internet.url(),
    _links: {}
});

export const makeBranch = (path: string): TfvcBranch => ({
    ...makeBranchRef(path),
    children: [],
    mappings: [{ depth: "Full", serverItem: path, type: "Map" }],
    parent: { path: path.slice(0, path.lastIndexOf("/")) },
    relatedBranches: []
});

export const makeFileContentMetadata = (path: string): FileContentMetadata => ({
    contentType: "text/plain",
    encoding: 65001,
    extension: extensionOf(path),
    fileName: fileNameOf(path),
    isBinary: false,
    isImage: false,
    vsLink: fake.internet.url()
});

export const makeItem = (path: string): TfvcItem => ({
    path,
    content: `${path}\n${fake.lorem.sentence()}`,
    contentMetadata: makeFileContentMetadata(path),
    isFolder: !fileNameOf(path).includes("."),
    isSymLink: false,
    url: fake.internet.url(),
    changeDate: fake.date.recent(),
    deletionId: 0,
    encoding: 65001,
    hashValue: fake.string.alphanumeric(24),
    isBranch: false,
    isPendingChange: false,
    size: fake.number.int({ min: 1, max: 100_000 }),
    version: fake.number.id(),
    _links: {}
});

export const makeChange = (path: string): TfvcChange => ({
    changeType: VersionControlChangeType.Edit,
    item: makeItem(path),
    newContent: { content: fake.lorem.sentence(), contentType: ItemContentType.RawText },
    sourceServerItem: path,
    url: fake.internet.url(),
    mergeSources: [],
    pendingVersion: 0
});

export const makeCheckinNote = (): CheckinNote => ({
    name: "Code Reviewer",
    value: fake.person.fullName()
});

export const makeAssociatedWorkItem = (): AssociatedWorkItem => ({
    assignedTo: fake.person.fullName(),
    id: fake.number.id(),
    state: fake.helpers.arrayElement(["New", "Active", "Resolved", "Closed"]),
    title: fake.lorem.sentence(),
    url: fake.internet.url(),
    webUrl: fake.internet.url(),
    workItemType: fake.helpers.arrayElement(["Bug", "Task", "User Story"])
});

export const makePolicyOverride = (): TfvcPolicyOverrideInfo => ({
    comment: "",
    policyFailures: []
});

export const makeChangesetRef = (): TfvcChangesetRef => ({
    changesetId: fake.number.id(),
    author: makeIdentityRef(),
    checkedInBy: makeIdentityRef(),
    comment: fake.git.commitMessage(),
    commentTruncated: false,
    createdDate: fake.date.recent({ days: 30 }),
    url: fake.internet.url(),
    _links: {}
});

export const makeChangeset = (): TfvcChangeset => ({
    ...makeChangesetRef(),
    accountId: fake.string.uuid(),
    changes: FILE_PATHS.map(makeChange),
    checkinNotes: [makeCheckinNote()],
    collectionId: fake.string.uuid(),
    hasMoreChanges: false,
    policyOverride: makePolicyOverride(),
    teamProjectIds: [fake.string.uuid()],
    workItems: [makeAssociatedWorkItem()]
});

export const makeLabelRef = (): TfvcLabelRef => ({
    id: fake.number.id(),
    name: `label-${fake.lorem.slug(2)}`,
    description: fake.lorem.sentence(),
    labelScope: ROOT_PATH,
    modifiedDate: fake.date.recent({ days: 30 }),
    owner: makeIdentityRef(),
    url: fake.internet.url(),
    _links: {}
});

export const makeLabel = (): TfvcLabel => ({
    ...makeLabelRef(),
    items: FILE_PATHS.map(makeItem)
});

export const makeShelvesetRef = (name: string): TfvcShelvesetRef => {
    const owner = makeIdentityRef();
    return {
        id: `${name};${owner.id}`,
        name,
        comment: fake.lorem.sentence(),
        commentTruncated: false,
        createdDate: fake.date.recent({ days: 30 }),
        owner,
        url: fake.internet.url(),
        _links: {}
    };
};

export const makeShelveset = (name: string): TfvcShelveset => ({
    ...makeShelvesetRef(name),
    changes: FILE_PATHS.map(makeChange),
    notes: [makeCheckinNote()],
    policyOverride: makePolicyOverride(),
    workItems: [makeAssociatedWorkItem()]
});

export const makeStatistics = (changesetId: number, fileCountTotal: number): TfvcStatistics => ({
    changesetId,
    fileCountTotal
});

export const makeBuffer = (text: string): ArrayBuffer => {
    const encoded = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(buffer).set(encoded);
    return buffer;
};

const devBranch: TfvcBranch = { ...makeBranch(`${ROOT_PATH}/Dev`), parent: { path: MAIN_PATH } };
const releaseBranch: TfvcBranch = { ...makeBranch(`${ROOT_PATH}/Release`), parent: { path: MAIN_PATH } };

export const branches: TfvcBranch[] = [
    {
        ...makeBranch(MAIN_PATH),
        children: [devBranch, releaseBranch],
        relatedBranches: [{ path: devBranch.path }, { path: releaseBranch.path }]
    },
    devBranch,
    releaseBranch,
    { ...makeBranch(`${ROOT_PATH}/Archive`), isDeleted: true }
];

export const items: TfvcItem[] = [
    makeItem(ROOT_PATH),
    { ...makeItem(MAIN_PATH), isBranch: true },
    makeItem(`${MAIN_PATH}/src`),
    ...FILE_PATHS.map(makeItem)
];

export const changes: TfvcChange[] = FILE_PATHS.map(makeChange);

export const workItems: AssociatedWorkItem[] = Array.from({ length: 3 }, makeAssociatedWorkItem);

export const changesets: TfvcChangeset[] = Array.from({ length: 5 }, makeChangeset);

export const labels: TfvcLabel[] = [
    { ...makeLabel(), name: "v1.0" },
    { ...makeLabel(), name: "v1.1" },
    { ...makeLabel(), name: "v2.0" }
];

export const shelvesets: TfvcShelveset[] = [
    makeShelveset("wip-login"),
    makeShelveset("hotfix-build"),
    makeShelveset("review-refactor")
];

export const statistics: TfvcStatistics = makeStatistics(
    changesets[changesets.length - 1].changesetId,
    items.filter(i => !i.isFolder).length
);
