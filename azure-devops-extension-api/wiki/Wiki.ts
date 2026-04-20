import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    WikiRestClient,
    WikiV2,
    WikiPage,
    WikiPageResponse,
    WikiPageDetail,
    WikiCreateParametersV2,
    WikiUpdateParameters
} from "azure-devops-extension-api/Wiki";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { makeWiki, makeWikiPage, makeWikiPageDetail, pageDetails, pages, wikis } from "./Data";

/**
 * Mocked WikiRestClient — wiki metadata and page content.
 */
export class MockWikiRestClient extends RestClientBase {
    public TYPE = WikiRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getAllWikis(_project?: string): Promise<WikiV2[]> {
        return Promise.resolve(wikis);
    }

    getWiki(wikiIdentifier: string, _project?: string): Promise<WikiV2> {
        const found = wikis.find(w => w.id === wikiIdentifier || w.name === wikiIdentifier);
        return Promise.resolve(found ?? makeWiki(wikiIdentifier));
    }

    createWiki(
        wikiCreateParams: WikiCreateParametersV2,
        _project?: string
    ): Promise<WikiV2> {
        return Promise.resolve({
            ...makeWiki(),
            name: wikiCreateParams.name,
            projectId: wikiCreateParams.projectId,
            repositoryId: wikiCreateParams.repositoryId,
            mappedPath: wikiCreateParams.mappedPath,
            type: wikiCreateParams.type
        });
    }

    updateWiki(
        updateParameters: WikiUpdateParameters,
        wikiIdentifier: string,
        _project?: string
    ): Promise<WikiV2> {
        return Promise.resolve({
            ...makeWiki(),
            id: wikiIdentifier,
            versions: updateParameters.versions ?? [{ version: "wikiMain" } as any]
        });
    }

    deleteWiki(_wikiIdentifier: string, _project?: string): Promise<WikiV2> {
        return Promise.resolve(makeWiki());
    }

    getPagesBatch(
        _pagesBatchRequest: any,
        _project: string,
        _wikiIdentifier: string
    ): Promise<PagedList<WikiPageDetail>> {
        return Promise.resolve(
            Object.assign([...pageDetails], { continuationToken: "" }) as unknown as PagedList<WikiPageDetail>
        );
    }

    getPageData(
        _project: string,
        _wikiIdentifier: string,
        pageId: number
    ): Promise<WikiPageDetail> {
        return Promise.resolve({ ...makeWikiPageDetail(pageId), id: pageId });
    }

    getPage(
        _project: string,
        _wikiIdentifier: string,
        path?: string
    ): Promise<WikiPageResponse> {
        const found = path ? pages.find(p => p.path === path) : pages[0];
        const page = found ?? makeWikiPage(path ?? "/Home");
        return Promise.resolve({
            page,
            eTag: [`"${page.id}"`]
        } as WikiPageResponse);
    }

    getPageText(
        _project: string,
        _wikiIdentifier: string,
        path?: string
    ): Promise<string> {
        const found = path ? pages.find(p => p.path === path) : pages[0];
        return Promise.resolve(found?.content ?? makeWikiPage(path ?? "/Home").content ?? "");
    }

    createOrUpdatePage(
        parameters: any,
        _project: string,
        _wikiIdentifier: string,
        path: string,
        _version: string
    ): Promise<WikiPageResponse> {
        const page = { ...makeWikiPage(path), content: parameters?.content };
        return Promise.resolve({ page, eTag: [`"${page.id}"`] } as WikiPageResponse);
    }

    deletePage(_project: string, _wikiIdentifier: string, path: string): Promise<WikiPageResponse> {
        const page = makeWikiPage(path);
        return Promise.resolve({ page, eTag: [`"${page.id}"`] } as WikiPageResponse);
    }
}
