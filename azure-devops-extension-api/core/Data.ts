import { faker } from "@faker-js/faker";
import {
    Process,
    ProcessType,
    ProjectVisibility,
    TeamProject,
    TeamProjectReference,
    TeamProjectCollection,
    TeamProjectCollectionReference,
    WebApiTeam,
    WebApiTeamRef,
    WebApiTagDefinition
} from "azure-devops-extension-api/Core";
import { PagedList, IdentityRef, TeamMember } from "azure-devops-extension-api/WebApi";
import { OperationReference, OperationStatus } from "azure-devops-extension-api/Operations";

export const makeIdentityRef = (): IdentityRef => ({
    id: faker.string.uuid(),
    displayName: faker.person.fullName(),
    uniqueName: faker.internet.email(),
    descriptor: `aad.${faker.string.alphanumeric(16)}`,
    imageUrl: faker.image.avatar(),
    url: faker.internet.url(),
    directoryAlias: faker.internet.username(),
    inactive: false,
    isAadIdentity: true,
    isContainer: false,
    isDeletedInOrigin: false,
    profileUrl: faker.internet.url(),
    _links: {} as any
});

export const makeProjectReference = (): TeamProjectReference => ({
    id: faker.string.uuid(),
    abbreviation: faker.string.alpha({ length: 4 }).toUpperCase(),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    url: faker.internet.url(),
    state: "wellFormed" as any,
    revision: faker.number.int({ min: 1, max: 100 }),
    visibility: faker.helpers.arrayElement([
        ProjectVisibility.Private,
        ProjectVisibility.Public
    ]),
    lastUpdateTime: faker.date.recent(),
    defaultTeamImageUrl: faker.image.avatar()
} as TeamProjectReference);

export const makeProject = (): TeamProject => ({
    ...makeProjectReference(),
    capabilities: {
        versioncontrol: { sourceControlType: "Git" },
        processTemplate: { templateName: "Agile", templateTypeId: faker.string.uuid() }
    },
    defaultTeam: {
        id: faker.string.uuid(),
        name: `${faker.company.name()} Team`,
        url: faker.internet.url()
    } as WebApiTeamRef,
    _links: {} as any
} as unknown as TeamProject);

export const makeTeam = (): WebApiTeam => ({
    id: faker.string.uuid(),
    name: `${faker.company.name()} Team`,
    description: faker.lorem.sentence(),
    url: faker.internet.url(),
    identityUrl: faker.internet.url(),
    projectId: faker.string.uuid(),
    projectName: faker.company.name(),
    identity: makeIdentityRef()
} as unknown as WebApiTeam);

export const makeTeamMember = (): TeamMember => ({
    identity: makeIdentityRef(),
    isTeamAdmin: faker.datatype.boolean()
});

export const makeProcess = (): Process => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(["Agile", "Scrum", "CMMI", "Basic"]),
    description: faker.lorem.sentence(),
    url: faker.internet.url(),
    isDefault: faker.datatype.boolean(),
    type: ProcessType.System,
    _links: {} as any
} as unknown as Process);

export const makeOperationReference = (): OperationReference => ({
    id: faker.string.uuid(),
    pluginId: faker.string.uuid(),
    status: OperationStatus.Succeeded,
    url: faker.internet.url()
});

export const makeProjectCollectionReference = (): TeamProjectCollectionReference => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    url: faker.internet.url(),
    avatarUrl: faker.image.avatar()
} as TeamProjectCollectionReference);

export const makeTagDefinition = (): WebApiTagDefinition => ({
    id: faker.string.uuid(),
    name: faker.lorem.word(),
    url: faker.internet.url(),
    active: true
});

const projectRefs = Array.from({ length: 5 }, makeProjectReference);

export const projects: TeamProject[] = Array.from({ length: 5 }, makeProject);
export const projectReferences: PagedList<TeamProjectReference> =
    Object.assign(projectRefs, { continuationToken: "" }) as PagedList<TeamProjectReference>;
export const teams: WebApiTeam[] = Array.from({ length: 3 }, makeTeam);
export const processes: Process[] = Array.from({ length: 4 }, makeProcess);
export const teamMembers: TeamMember[] = Array.from({ length: 5 }, makeTeamMember);
export const projectCollections: TeamProjectCollection[] = Array.from({ length: 2 }, () => ({
    ...makeProjectCollectionReference(),
    description: faker.lorem.sentence()
} as unknown as TeamProjectCollection));
