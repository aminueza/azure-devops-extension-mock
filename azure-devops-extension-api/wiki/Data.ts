import { fake } from "../common/fixtures";
import {
    WikiV2,
    WikiType,
    WikiPageDetail,
    WikiPage
} from "azure-devops-extension-api/Wiki";

export const makeWiki = (name = "Project.wiki"): WikiV2 => ({
    id: fake.string.uuid(),
    name,
    type: WikiType.ProjectWiki,
    url: fake.internet.url(),
    projectId: fake.string.uuid(),
    repositoryId: fake.string.uuid(),
    mappedPath: "/",
    remoteUrl: fake.internet.url(),
    versions: [{ version: "wikiMain" } as any],
    properties: {},
    _links: {} as any
} as unknown as WikiV2);

export const makeWikiPage = (path = "/Home"): WikiPage => ({
    id: fake.number.int({ min: 1, max: 10_000 }),
    path,
    url: fake.internet.url(),
    gitItemPath: `${path}.md`,
    isParentPage: path === "/Home",
    order: 0,
    content: `# ${path.split("/").pop()}\n\n${fake.lorem.paragraphs(2)}`,
    remoteUrl: fake.internet.url(),
    subPages: [],
    _links: {} as any
} as unknown as WikiPage);

export const makeWikiPageDetail = (id?: number): WikiPageDetail => ({
    id: id ?? fake.number.int(),
    path: `/${fake.lorem.slug()}`,
    viewStats: [
        { day: fake.date.recent(), count: fake.number.int({ min: 1, max: 500 }) } as any
    ]
} as unknown as WikiPageDetail);

export const wikis: WikiV2[] = [makeWiki("Project.wiki"), makeWiki("Code.wiki")];
export const pages: WikiPage[] = [
    makeWikiPage("/Home"),
    makeWikiPage("/Getting-Started"),
    makeWikiPage("/FAQ"),
    makeWikiPage("/API/Overview")
];
export const pageDetails: WikiPageDetail[] = Array.from({ length: 3 }, () => makeWikiPageDetail());
