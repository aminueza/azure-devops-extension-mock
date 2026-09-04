import { fake } from "../common/fixtures";
import {
    Process,
    ProcessType,
    ProjectInfo,
    ProjectProperty,
    ProjectVisibility,
    Proxy,
    TeamProject,
    TeamProjectReference,
    TeamProjectCollection,
    TeamProjectCollectionReference,
    WebApiConnectedService,
    WebApiConnectedServiceDetails,
    WebApiTeam,
    WebApiTeamRef,
    WebApiTagDefinition
} from "azure-devops-extension-api/Core";
import { IdentityRef, TeamMember } from "azure-devops-extension-api/WebApi";
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

export const makeProjectCollection = (): TeamProjectCollection => ({
    ...makeProjectCollectionReference(),
    description: fake.lorem.sentence(),
    state: "Started",
    _links: {} as any
} as unknown as TeamProjectCollection);

export const makeTagDefinition = (): WebApiTagDefinition => ({
    id: fake.string.uuid(),
    name: fake.lorem.word(),
    url: fake.internet.url(),
    active: true
});

export const makeConnectedService = (): WebApiConnectedService => ({
    id: fake.string.uuid(),
    url: fake.internet.url(),
    authenticatedBy: makeIdentityRef(),
    description: fake.lorem.sentence(),
    friendlyName: fake.lorem.slug(),
    kind: fake.helpers.arrayElement(["Custom", "AzureSubscription", "Chef", "Generic"]),
    project: makeProjectReference(),
    serviceUri: fake.internet.url()
});

export const makeConnectedServiceDetails = (
    service: WebApiConnectedService = makeConnectedService()
): WebApiConnectedServiceDetails => ({
    id: service.id,
    url: service.url,
    connectedServiceMetaData: service,
    credentialsXml: `<credentials token="${fake.string.alphanumeric(24)}" />`,
    endPoint: service.serviceUri
});

export const makeProjectProperty = (name = `System.${fake.lorem.word()}`): ProjectProperty => ({
    name,
    value: fake.lorem.word()
});

export const makeProjectInfo = (): ProjectInfo => {
    const reference = makeProjectReference();
    return {
        abbreviation: reference.abbreviation,
        description: reference.description,
        id: reference.id,
        lastUpdateTime: reference.lastUpdateTime,
        name: reference.name,
        revision: reference.revision,
        state: reference.state,
        visibility: reference.visibility,
        properties: Array.from({ length: 2 }, () => makeProjectProperty()),
        uri: `vstfs:///Classification/TeamProject/${reference.id}`,
        version: fake.number.int({ min: 1, max: 20 })
    };
};

export const makeProxy = (): Proxy => ({
    authorization: {
        authorizationUrl: fake.internet.url(),
        clientId: fake.string.uuid(),
        identity: { identifier: fake.string.uuid(), identityType: "System.Identity" },
        publicKey: { exponent: [1, 0, 1], modulus: [] }
    },
    description: fake.lorem.sentence(),
    friendlyName: fake.lorem.slug(),
    globalDefault: fake.datatype.boolean(),
    site: fake.internet.domainName(),
    siteDefault: fake.datatype.boolean(),
    url: fake.internet.url()
});

export const projects: TeamProject[] = Array.from({ length: 5 }, makeProject);
export const teams: WebApiTeam[] = Array.from({ length: 3 }, makeTeam);
export const readableTeams: WebApiTeam[] = Array.from({ length: 2 }, makeTeam);
export const processes: Process[] = Array.from({ length: 4 }, makeProcess);
export const teamMembers: TeamMember[] = Array.from({ length: 5 }, makeTeamMember);
export const projectCollections: TeamProjectCollection[] = Array.from({ length: 2 }, makeProjectCollection);
export const identityMru: IdentityRef[] = Array.from({ length: 3 }, makeIdentityRef);
export const connectedServices: WebApiConnectedService[] = Array.from({ length: 4 }, makeConnectedService);
export const projectHistory: ProjectInfo[] = Array.from({ length: 5 }, (_, index) => ({
    ...makeProjectInfo(),
    revision: index + 1
}));
export const projectProperties: ProjectProperty[] = [
    makeProjectProperty("System.ProcessTemplateType"),
    makeProjectProperty("System.SourceControlGitEnabled"),
    makeProjectProperty("System.CurrentProcessTemplateId")
];
export const proxies: Proxy[] = Array.from({ length: 2 }, makeProxy);
