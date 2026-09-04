import { fake } from "../common/fixtures";
import {
    WikiV2,
    WikiType,
    WikiPage,
    WikiPageDetail,
    WikiPageStat,
    WikiPageViewStats
} from "azure-devops-extension-api/Wiki";
import {
    Comment,
    CommentAttachment,
    CommentList,
    CommentReaction,
    CommentReactionType,
    CommentState
} from "azure-devops-extension-api/Comments";
import { GitVersionDescriptor, GitVersionOptions, GitVersionType } from "azure-devops-extension-api/Git";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef } from "../core/Data";

export const makeVersionDescriptor = (): GitVersionDescriptor => ({
    version: "wikiMain",
    versionOptions: GitVersionOptions.None,
    versionType: GitVersionType.Branch
});

export const makeWiki = (): WikiV2 => ({
    id: fake.string.uuid(),
    name: `${fake.lorem.word()}.wiki`,
    type: WikiType.ProjectWiki,
    url: fake.internet.url(),
    remoteUrl: fake.internet.url(),
    projectId: fake.string.uuid(),
    repositoryId: fake.string.uuid(),
    mappedPath: "/",
    isDisabled: false,
    versions: [makeVersionDescriptor()],
    properties: {}
});

export const makeWikiPage = (path: string): WikiPage => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
    path,
    url: fake.internet.url(),
    remoteUrl: fake.internet.url(),
    gitItemPath: `${path}.md`,
    isNonConformant: false,
    isParentPage: false,
    order: 0,
    content: `# ${path.split("/").pop()}\n\n${fake.lorem.paragraph()}`,
    subPages: []
});

export const makeWikiPageStat = (): WikiPageStat => ({
    day: fake.date.recent({ days: 7 }),
    count: fake.number.int({ min: 1, max: 500 })
});

export const makeWikiPageDetail = (): WikiPageDetail => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
    path: `/${fake.lorem.slug()}`,
    viewStats: Array.from({ length: 7 }, makeWikiPageStat)
});

export const makeWikiPageViewStats = (path: string): WikiPageViewStats => ({
    path,
    count: fake.number.int({ min: 1, max: 500 }),
    lastViewedTime: fake.date.recent()
});

export const makeCommentList = (items: Comment[]): CommentList => ({
    comments: items,
    continuationToken: "",
    count: items.length,
    nextPage: "",
    totalCount: items.length,
    url: fake.internet.url()
});

export const makeCommentReaction = (commentId: number, type: CommentReactionType): CommentReaction => ({
    commentId,
    type,
    count: fake.number.int({ min: 1, max: 20 }),
    isCurrentUserEngaged: fake.datatype.boolean(),
    url: fake.internet.url()
});

export const makeComment = (): Comment => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
    artifactId: fake.string.uuid(),
    parentId: 0,
    text: fake.lorem.sentence(),
    renderedText: `<p>${fake.lorem.sentence()}</p>`,
    state: CommentState.Active,
    version: 1,
    isDeleted: false,
    createdBy: makeIdentityRef(),
    createdDate: fake.date.recent(),
    modifiedBy: makeIdentityRef(),
    modifiedDate: fake.date.recent(),
    mentions: [],
    reactions: [],
    replies: makeCommentList([]),
    url: fake.internet.url()
});

export const makeCommentAttachment = (): CommentAttachment => ({
    id: fake.string.uuid(),
    createdBy: makeIdentityRef(),
    createdDate: fake.date.recent(),
    url: fake.internet.url()
});

export const makeBuffer = (text: string): ArrayBuffer => {
    const encoded = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(buffer).set(encoded);
    return buffer;
};

export const wikis: WikiV2[] = [
    { ...makeWiki(), name: "Project.wiki" },
    { ...makeWiki(), name: "Code.wiki", type: WikiType.CodeWiki, mappedPath: "/docs" }
];

export const pages: WikiPage[] = [
    { ...makeWikiPage("/Home"), isParentPage: true },
    makeWikiPage("/Getting-Started"),
    makeWikiPage("/FAQ"),
    makeWikiPage("/API/Overview")
];

export const pageDetails: WikiPageDetail[] = pages.map(p => ({ ...makeWikiPageDetail(), id: p.id, path: p.path }));

export const comments: Comment[] = Array.from({ length: 3 }, makeComment);

export const engagedUsers: IdentityRef[] = Array.from({ length: 5 }, makeIdentityRef);
