import { fake } from "../common/fixtures";
import {
    GraphCachePolicies,
    GraphDescriptorResult,
    GraphFederatedProviderData,
    GraphGroup,
    GraphMember,
    GraphMembership,
    GraphMembershipState,
    GraphMembershipTraversal,
    GraphProviderInfo,
    GraphScope,
    GraphServicePrincipal,
    GraphStorageKeyResult,
    GraphSubject,
    GraphUser,
    MappingResult,
    ResolveDisconnectedUsersResponse
} from "azure-devops-extension-api/Graph";
import { Avatar, AvatarSize } from "azure-devops-extension-api/Profile";

export interface GraphStorageKey {
    descriptor: string;
    storageKey: string;
}

export interface GraphIdentityTranslation {
    masterId: string;
    localId: string;
}

export const makeGraphUser = (): GraphUser => {
    const mailAddress = fake.internet.email();
    return {
        descriptor: `aad.${fake.string.alphanumeric(24)}${fake.number.id()}`,
        displayName: fake.person.fullName(),
        url: fake.internet.url(),
        legacyDescriptor: "",
        origin: "aad",
        originId: fake.string.uuid(),
        subjectKind: "user",
        domain: fake.string.uuid(),
        mailAddress,
        principalName: mailAddress,
        directoryAlias: fake.internet.username(),
        isDeletedInOrigin: false,
        metadataUpdateDate: fake.date.recent(),
        metaType: "member",
        _links: {}
    };
};

export const makeGraphGroup = (): GraphGroup => {
    const displayName = fake.lorem.words(2);
    const scopeName = fake.company.name();
    return {
        descriptor: `vssgp.${fake.string.alphanumeric(24)}${fake.number.id()}`,
        displayName,
        url: fake.internet.url(),
        legacyDescriptor: "",
        origin: "vsts",
        originId: fake.string.uuid(),
        subjectKind: "group",
        domain: `vstfs:///Classification/TeamProject/${fake.string.uuid()}`,
        mailAddress: "",
        principalName: `[${scopeName}]\\${displayName}`,
        description: fake.lorem.sentence(),
        isCrossProject: false,
        isDeleted: false,
        isGlobalScope: false,
        isRestrictedVisible: false,
        localScopeId: fake.string.uuid(),
        scopeId: fake.string.uuid(),
        scopeName,
        scopeType: "TeamProject",
        securingHostId: fake.string.uuid(),
        specialType: "Generic",
        _links: {}
    };
};

export const makeGraphServicePrincipal = (): GraphServicePrincipal => {
    const applicationId = fake.string.uuid();
    return {
        descriptor: `aadsp.${fake.string.alphanumeric(24)}${fake.number.id()}`,
        displayName: `${fake.lorem.word()}-${fake.word.noun()}`,
        url: fake.internet.url(),
        legacyDescriptor: "",
        origin: "aad",
        originId: fake.string.uuid(),
        subjectKind: "servicePrincipal",
        domain: fake.string.uuid(),
        mailAddress: "",
        principalName: applicationId,
        directoryAlias: "",
        isDeletedInOrigin: false,
        metadataUpdateDate: fake.date.recent(),
        metaType: "application",
        applicationId,
        _links: {}
    };
};

export const makeGraphScope = (): GraphScope => ({
    descriptor: `scp.${fake.string.alphanumeric(24)}${fake.number.id()}`,
    displayName: fake.company.name(),
    url: fake.internet.url(),
    legacyDescriptor: "",
    origin: "vsts",
    originId: fake.string.uuid(),
    subjectKind: "scope",
    administratorDescriptor: `vssgp.${fake.string.alphanumeric(24)}${fake.number.id()}`,
    isGlobal: false,
    parentDescriptor: `scp.${fake.string.alphanumeric(24)}${fake.number.id()}`,
    scopeType: 2,
    securingHostDescriptor: `scp.${fake.string.alphanumeric(24)}${fake.number.id()}`,
    _links: {}
});

export const makeGraphMembership = (memberDescriptor: string, containerDescriptor: string): GraphMembership => ({
    memberDescriptor,
    containerDescriptor,
    _links: {}
});

export const makeGraphMembershipState = (): GraphMembershipState => ({
    active: true,
    _links: {}
});

export const makeGraphMembershipTraversal = (
    subjectDescriptor: string,
    traversedSubjects: string[],
    traversedSubjectIds: string[]
): GraphMembershipTraversal => ({
    subjectDescriptor,
    traversedSubjects,
    traversedSubjectIds,
    isComplete: true,
    incompletenessReason: ""
});

export const makeGraphDescriptorResult = (value: string): GraphDescriptorResult => ({
    value,
    _links: {}
});

export const makeGraphStorageKeyResult = (value: string): GraphStorageKeyResult => ({
    value,
    _links: {}
});

export const makeGraphProviderInfo = (descriptor: string): GraphProviderInfo => ({
    descriptor,
    domain: fake.string.uuid(),
    origin: "aad",
    originId: fake.string.uuid()
});

export const makeGraphFederatedProviderData = (
    subjectDescriptor: string,
    providerName: string,
    version: number
): GraphFederatedProviderData => ({
    subjectDescriptor,
    providerName,
    version,
    accessToken: fake.string.alphanumeric(40)
});

export const makeGraphCachePolicies = (): GraphCachePolicies => ({
    cacheSize: fake.number.int({ min: 100, max: 10_000 })
});

export const makeAvatar = (size: AvatarSize): Avatar => ({
    size,
    isAutoGenerated: true,
    timeStamp: fake.date.recent(),
    value: Array.from({ length: 16 }, () => fake.number.int({ min: 0, max: 255 }))
});

export const makeMappingResult = (): MappingResult => ({
    code: "Success",
    errorMessage: ""
});

export const makeResolveDisconnectedUsersResponse = (count: number): ResolveDisconnectedUsersResponse => ({
    code: "Success",
    errorMessage: "",
    mappingResults: Array.from({ length: count }, makeMappingResult)
});

export const users: GraphUser[] = fake.helpers.distinct(5, makeGraphUser, user => user.displayName);

export const groups: GraphGroup[] = [
    { ...makeGraphGroup(), displayName: "Project Administrators" },
    { ...makeGraphGroup(), displayName: "Contributors" },
    { ...makeGraphGroup(), displayName: "Readers" }
];

export const servicePrincipals: GraphServicePrincipal[] = fake.helpers.distinct(
    2,
    makeGraphServicePrincipal,
    servicePrincipal => servicePrincipal.displayName
);

export const scopes: GraphScope[] = fake.helpers
    .distinct(2, makeGraphScope, scope => scope.displayName)
    .map((scope, index) => (index === 0 ? { ...scope, scopeType: 1, isGlobal: true } : scope));

export const members: GraphMember[] = [...users, ...groups, ...servicePrincipals];

export const subjects: GraphSubject[] = [...members, ...scopes];

export const memberships: GraphMembership[] = [
    ...users.map((user, index) => makeGraphMembership(user.descriptor, groups[index % groups.length].descriptor)),
    ...servicePrincipals.map(servicePrincipal =>
        makeGraphMembership(servicePrincipal.descriptor, groups[1].descriptor)
    ),
    makeGraphMembership(groups[0].descriptor, groups[1].descriptor)
];

export const storageKeys: GraphStorageKey[] = subjects.map(subject => ({
    descriptor: subject.descriptor,
    storageKey: fake.string.uuid()
}));

export const identityTranslations: GraphIdentityTranslation[] = users.map(() => ({
    masterId: fake.string.uuid(),
    localId: fake.string.uuid()
}));

export const providerInfos: GraphProviderInfo[] = users.map(user => ({
    descriptor: user.descriptor,
    domain: user.domain,
    origin: user.origin,
    originId: user.originId
}));

export const avatars: Avatar[] = [
    makeAvatar(AvatarSize.Small),
    makeAvatar(AvatarSize.Medium),
    makeAvatar(AvatarSize.Large)
];

export const cachePolicies: GraphCachePolicies = makeGraphCachePolicies();
