import { fake } from "../common/fixtures";
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
    id: fake.string.uuid(),
    displayName: fake.person.fullName(),
    uniqueName: fake.internet.email(),
    descriptor: `aad.${fake.string.alphanumeric(16)}`,
    imageUrl: fake.image.avatar(),
    url: fake.internet.url(),
    directoryAlias: fake.internet.username(),
    inactive: false,
    isAadIdentity: true,
    isContainer: false,
    isDeletedInOrigin: false,
    profileUrl: fake.internet.url(),
    _links: {} as any
});

export const makeProjectReference = (): TeamProjectReference => ({
    id: fake.string.uuid(),
    abbreviation: fake.string.alpha({ length: 4 }).toUpperCase(),
    name: fake.company.name(),
    description: fake.lorem.sentence(),
    url: fake.internet.url(),
    state: "wellFormed" as any,
    revision: fake.number.int({ min: 1, max: 100 }),
    visibility: fake.helpers.arrayElement([
        ProjectVisibility.Private,
        ProjectVisibility.Public
    ]),
    lastUpdateTime: fake.date.recent(),
    defaultTeamImageUrl: fake.image.avatar()
} as TeamProjectReference);

export const makeProject = (): TeamProject => ({
    ...makeProjectReference(),
    capabilities: {
        versioncontrol: { sourceControlType: "Git" },
        processTemplate: { templateName: "Agile", templateTypeId: fake.string.uuid() }
    },
    defaultTeam: {
        id: fake.string.uuid(),
        name: `${fake.company.name()} Team`,
        url: fake.internet.url()
    } as WebApiTeamRef,
    _links: {} as any
} as unknown as TeamProject);

export const makeTeam = (): WebApiTeam => ({
    id: fake.string.uuid(),
    name: `${fake.company.name()} Team`,
    description: fake.lorem.sentence(),
    url: fake.internet.url(),
    identityUrl: fake.internet.url(),
    projectId: fake.string.uuid(),
    projectName: fake.company.name(),
    identity: makeIdentityRef()
} as unknown as WebApiTeam);

export const makeTeamMember = (): TeamMember => ({
    identity: makeIdentityRef(),
    isTeamAdmin: fake.datatype.boolean()
});

export const makeProcess = (): Process => ({
    id: fake.string.uuid(),
    name: fake.helpers.arrayElement(["Agile", "Scrum", "CMMI", "Basic"]),
    description: fake.lorem.sentence(),
    url: fake.internet.url(),
    isDefault: fake.datatype.boolean(),
    type: ProcessType.System,
    _links: {} as any
} as unknown as Process);

export const makeOperationReference = (): OperationReference => ({
    id: fake.string.uuid(),
    pluginId: fake.string.uuid(),
    status: OperationStatus.Succeeded,
    url: fake.internet.url()
});

export const makeProjectCollectionReference = (): TeamProjectCollectionReference => ({
    id: fake.string.uuid(),
    name: fake.company.name(),
    url: fake.internet.url(),
    avatarUrl: fake.image.avatar()
} as TeamProjectCollectionReference);

export const makeTagDefinition = (): WebApiTagDefinition => ({
    id: fake.string.uuid(),
    name: fake.lorem.word(),
    url: fake.internet.url(),
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
    description: fake.lorem.sentence()
} as unknown as TeamProjectCollection));
