import { faker } from "@faker-js/faker";
import {
    WikiV2,
    WikiType,
    WikiPageDetail,
    WikiPage
} from "azure-devops-extension-api/Wiki";

export const makeWiki = (name = "Project.wiki"): WikiV2 => ({
    id: faker.string.uuid(),
    name,
    type: WikiType.ProjectWiki,
    url: faker.internet.url(),
    projectId: faker.string.uuid(),
    repositoryId: faker.string.uuid(),
    mappedPath: "/",
    remoteUrl: faker.internet.url(),
    versions: [{ version: "wikiMain" } as any],
    properties: {},
    _links: {} as any
} as unknown as WikiV2);

export const makeWikiPage = (path = "/Home"): WikiPage => ({
    id: faker.number.int({ min: 1, max: 10_000 }),
    path,
    url: faker.internet.url(),
    gitItemPath: `${path}.md`,
    isParentPage: path === "/Home",
    order: 0,
    content: `# ${path.split("/").pop()}\n\n${faker.lorem.paragraphs(2)}`,
    remoteUrl: faker.internet.url(),
    subPages: [],
    _links: {} as any
} as unknown as WikiPage);

export const makeWikiPageDetail = (id?: number): WikiPageDetail => ({
    id: id ?? faker.number.int(),
    path: `/${faker.lorem.slug()}`,
    viewStats: [
        { day: faker.date.recent(), count: faker.number.int({ min: 1, max: 500 }) } as any
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
