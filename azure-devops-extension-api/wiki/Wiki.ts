import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    WikiRestClient,
    WikiV2,
    WikiPage,
    WikiPageDetail,
    WikiPageViewStats,
    WikiPagesBatchRequest,
    WikiCreateParametersV2,
    WikiUpdateParameters
} from "azure-devops-extension-api/Wiki";
import {
    Comment,
    CommentAttachment,
    CommentCreateParameters,
    CommentExpandOptions,
    CommentList,
    CommentReaction,
    CommentReactionType,
    CommentSortOrder,
    CommentUpdateParameters
} from "azure-devops-extension-api/Comments";
import { GitVersionDescriptor, VersionControlRecursionType } from "azure-devops-extension-api/Git";
import { IdentityRef, PagedList } from "azure-devops-extension-api/WebApi";
import {
    comments,
    engagedUsers,
    makeBuffer,
    makeComment,
    makeCommentAttachment,
    makeCommentList,
    makeCommentReaction,
    makeWiki,
    makeWikiPage,
    makeWikiPageDetail,
    makeWikiPageViewStats,
    pageDetails,
    pages,
    wikis
} from "./Data";

const findWiki = (identifier: string): WikiV2 =>
    wikis.find(w => w.id === identifier || w.name === identifier) ?? { ...makeWiki(), id: identifier };

const findPage = (path?: string): WikiPage => {
    const target = path ?? "/Home";
    return pages.find(p => p.path === target) ?? makeWikiPage(target);
};

const findPageById = (id: number): WikiPage =>
    pages.find(p => p.id === id) ?? { ...makeWikiPage("/Home"), id };

const findComment = (id: number): Comment =>
    comments.find(c => c.id === id) ?? { ...makeComment(), id };

export class MockWikiRestClient extends RestClientBase {
    public TYPE = WikiRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createCommentAttachment(
        _content: any,
        _project: string,
        _wikiIdentifier: string,
        _pageId: number
    ): Promise<CommentAttachment> {
        return Promise.resolve(makeCommentAttachment());
    }

    getAttachmentContent(
        _project: string,
        _wikiIdentifier: string,
        _pageId: number,
        attachmentId: string
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(attachmentId));
    }

    addCommentReaction(
        _project: string,
        _wikiIdentifier: string,
        _pageId: number,
        commentId: number,
        type: CommentReactionType
    ): Promise<CommentReaction> {
        return Promise.resolve({ ...makeCommentReaction(commentId, type), isCurrentUserEngaged: true });
    }

    deleteCommentReaction(
        _project: string,
        _wikiIdentifier: string,
        _pageId: number,
        commentId: number,
        type: CommentReactionType
    ): Promise<CommentReaction> {
        return Promise.resolve({ ...makeCommentReaction(commentId, type), isCurrentUserEngaged: false, count: 0 });
    }

    getEngagedUsers(
        _project: string,
        _wikiIdentifier: string,
        _pageId: number,
        _commentId: number,
        _type: CommentReactionType,
        top?: number,
        skip?: number
    ): Promise<IdentityRef[]> {
        const start = skip ?? 0;
        return Promise.resolve(engagedUsers.slice(start, start + (top ?? 100)));
    }

    addComment(
        request: CommentCreateParameters,
        _project: string,
        _wikiIdentifier: string,
        _pageId: number
    ): Promise<Comment> {
        return Promise.resolve({ ...makeComment(), ...request });
    }

    deleteComment(_project: string, _wikiIdentifier: string, _pageId: number, _id: number): Promise<void> {
        return Promise.resolve();
    }

    getComment(
        _project: string,
        _wikiIdentifier: string,
        _pageId: number,
        id: number,
        _excludeDeleted?: boolean,
        _expand?: CommentExpandOptions
    ): Promise<Comment> {
        return Promise.resolve(findComment(id));
    }

    listComments(
        _project: string,
        _wikiIdentifier: string,
        _pageId: number,
        top?: number,
        _continuationToken?: string,
        _excludeDeleted?: boolean,
        _expand?: CommentExpandOptions,
        _order?: CommentSortOrder,
        _parentId?: number
    ): Promise<CommentList> {
        return Promise.resolve(makeCommentList(comments.slice(0, top ?? comments.length)));
    }

    updateComment(
        comment: CommentUpdateParameters,
        _project: string,
        _wikiIdentifier: string,
        _pageId: number,
        id: number
    ): Promise<Comment> {
        return Promise.resolve({ ...findComment(id), ...comment, id });
    }

    getPageText(
        _project: string,
        _wikiIdentifier: string,
        path?: string,
        _recursionLevel?: VersionControlRecursionType,
        _versionDescriptor?: GitVersionDescriptor,
        _includeContent?: boolean
    ): Promise<string> {
        return Promise.resolve(findPage(path).content);
    }

    getPageZip(
        _project: string,
        _wikiIdentifier: string,
        path?: string,
        _recursionLevel?: VersionControlRecursionType,
        _versionDescriptor?: GitVersionDescriptor,
        _includeContent?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(findPage(path).content));
    }

    getPageByIdText(
        _project: string,
        _wikiIdentifier: string,
        id: number,
        _recursionLevel?: VersionControlRecursionType,
        _includeContent?: boolean
    ): Promise<string> {
        return Promise.resolve(findPageById(id).content);
    }

    getPageByIdZip(
        _project: string,
        _wikiIdentifier: string,
        id: number,
        _recursionLevel?: VersionControlRecursionType,
        _includeContent?: boolean
    ): Promise<ArrayBuffer> {
        return Promise.resolve(makeBuffer(findPageById(id).content));
    }

    getPagesBatch(
        pagesBatchRequest: WikiPagesBatchRequest,
        _project: string,
        _wikiIdentifier: string,
        _versionDescriptor?: GitVersionDescriptor
    ): Promise<PagedList<WikiPageDetail>> {
        const batch: PagedList<WikiPageDetail> = Object.assign(pageDetails.slice(0, pagesBatchRequest.top), {
            continuationToken: null
        });
        return Promise.resolve(batch);
    }

    getPageData(
        _project: string,
        _wikiIdentifier: string,
        pageId: number,
        pageViewsForDays?: number
    ): Promise<WikiPageDetail> {
        const detail = pageDetails.find(d => d.id === pageId) ?? { ...makeWikiPageDetail(), id: pageId };
        return Promise.resolve({ ...detail, viewStats: detail.viewStats.slice(0, pageViewsForDays) });
    }

    createOrUpdatePageViewStats(
        _project: string,
        _wikiIdentifier: string,
        _wikiVersion: GitVersionDescriptor,
        path: string,
        _oldPath?: string
    ): Promise<WikiPageViewStats> {
        return Promise.resolve(makeWikiPageViewStats(path));
    }

    createWiki(wikiCreateParams: WikiCreateParametersV2, _project?: string): Promise<WikiV2> {
        return Promise.resolve({ ...makeWiki(), ...wikiCreateParams });
    }

    deleteWiki(wikiIdentifier: string, _project?: string): Promise<WikiV2> {
        return Promise.resolve(findWiki(wikiIdentifier));
    }

    getAllWikis(_project?: string): Promise<WikiV2[]> {
        return Promise.resolve(wikis);
    }

    getWiki(wikiIdentifier: string, _project?: string): Promise<WikiV2> {
        return Promise.resolve(findWiki(wikiIdentifier));
    }

    updateWiki(updateParameters: WikiUpdateParameters, wikiIdentifier: string, _project?: string): Promise<WikiV2> {
        return Promise.resolve({ ...findWiki(wikiIdentifier), ...updateParameters });
    }
}
