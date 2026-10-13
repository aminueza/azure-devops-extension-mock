import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    GraphRestClient,
    GraphCachePolicies,
    GraphDescriptorResult,
    GraphFederatedProviderData,
    GraphGroup,
    GraphGroupCreationContext,
    GraphMember,
    GraphMembership,
    GraphMembershipState,
    GraphMembershipTraversal,
    GraphProviderInfo,
    GraphScope,
    GraphScopeCreationContext,
    GraphServicePrincipal,
    GraphServicePrincipalCreationContext,
    GraphServicePrincipalUpdateContext,
    GraphStorageKeyResult,
    GraphSubject,
    GraphSubjectLookup,
    GraphSubjectQuery,
    GraphTraversalDirection,
    GraphUser,
    GraphUserCreationContext,
    GraphUserUpdateContext,
    IdentityMappings,
    ResolveDisconnectedUsersResponse
} from "azure-devops-extension-api/Graph";
import { Avatar, AvatarSize } from "azure-devops-extension-api/Profile";
import { JsonPatchDocument } from "azure-devops-extension-api/WebApi";
import {
    avatars,
    cachePolicies,
    groups,
    identityTranslations,
    makeAvatar,
    makeGraphDescriptorResult,
    makeGraphFederatedProviderData,
    makeGraphGroup,
    makeGraphMembership,
    makeGraphMembershipState,
    makeGraphMembershipTraversal,
    makeGraphProviderInfo,
    makeGraphScope,
    makeGraphServicePrincipal,
    makeGraphStorageKeyResult,
    makeGraphUser,
    makeResolveDisconnectedUsersResponse,
    members,
    memberships,
    providerInfos,
    scopes,
    servicePrincipals,
    storageKeys,
    subjects,
    users
} from "./Data";
import { fake } from "../common/fixtures";

const findUser = (descriptor: string): GraphUser =>
    users.find(u => u.descriptor === descriptor) ?? { ...makeGraphUser(), descriptor };

const findGroup = (descriptor: string): GraphGroup =>
    groups.find(g => g.descriptor === descriptor) ?? { ...makeGraphGroup(), descriptor };

const findServicePrincipal = (descriptor: string): GraphServicePrincipal =>
    servicePrincipals.find(s => s.descriptor === descriptor) ?? { ...makeGraphServicePrincipal(), descriptor };

const findScope = (descriptor: string): GraphScope =>
    scopes.find(s => s.descriptor === descriptor) ?? { ...makeGraphScope(), descriptor };

const findMember = (descriptor: string): GraphMember =>
    members.find(m => m.descriptor === descriptor) ?? { ...makeGraphUser(), descriptor };

const findSubject = (descriptor: string): GraphSubject =>
    subjects.find(s => s.descriptor === descriptor) ?? { ...makeGraphUser(), descriptor };

const findStorageKey = (descriptor: string): string =>
    storageKeys.find(k => k.descriptor === descriptor)?.storageKey ?? fake.string.uuid();

const findDescriptor = (storageKey: string): string =>
    storageKeys.find(k => k.storageKey === storageKey)?.descriptor ?? `aad.${fake.string.alphanumeric(24)}`;

const findMemberships = (subjectDescriptor: string, direction?: GraphTraversalDirection): GraphMembership[] =>
    direction === GraphTraversalDirection.Down
        ? memberships.filter(m => m.containerDescriptor === subjectDescriptor)
        : memberships.filter(m => m.memberDescriptor === subjectDescriptor);

const traverse = (subjectDescriptor: string, direction?: GraphTraversalDirection): GraphMembershipTraversal => {
    const traversed = findMemberships(subjectDescriptor, direction).map(m =>
        direction === GraphTraversalDirection.Down ? m.memberDescriptor : m.containerDescriptor
    );
    return makeGraphMembershipTraversal(subjectDescriptor, traversed, traversed.map(findStorageKey));
};

const patchFields = (patchDocument: JsonPatchDocument): Record<string, unknown> => {
    const fields: Record<string, unknown> = {};
    if (Array.isArray(patchDocument)) {
        for (const operation of patchDocument) {
            fields[String(operation.path).slice(1)] = operation.value;
        }
    }
    return fields;
};

const lookup = <T>(subjectLookup: GraphSubjectLookup, find: (descriptor: string) => T): { [key: string]: T } => {
    const result: { [key: string]: T } = {};
    for (const key of subjectLookup.lookupKeys) {
        result[key.descriptor] = find(key.descriptor);
    }
    return result;
};

export class MockGraphRestClient extends RestClientBase {
    public TYPE = GraphRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    deleteAvatar(_subjectDescriptor: string): Promise<void> {
        return Promise.resolve();
    }

    getAvatar(_subjectDescriptor: string, size?: AvatarSize, _format?: string): Promise<Avatar> {
        const target = size ?? AvatarSize.Medium;
        return Promise.resolve(avatars.find(a => a.size === target) ?? makeAvatar(target));
    }

    setAvatar(_avatar: Avatar, _subjectDescriptor: string): Promise<void> {
        return Promise.resolve();
    }

    getCachePolicies(): Promise<GraphCachePolicies> {
        return Promise.resolve(cachePolicies);
    }

    getDescriptor(storageKey: string): Promise<GraphDescriptorResult> {
        return Promise.resolve(makeGraphDescriptorResult(findDescriptor(storageKey)));
    }

    getFederatedProviderData(
        subjectDescriptor: string,
        providerName: string,
        versionHint?: number
    ): Promise<GraphFederatedProviderData> {
        return Promise.resolve(makeGraphFederatedProviderData(subjectDescriptor, providerName, versionHint ?? 1));
    }

    createGroup(
        creationContext: GraphGroupCreationContext,
        _scopeDescriptor?: string,
        _groupDescriptors?: string[]
    ): Promise<GraphGroup> {
        return Promise.resolve({ ...makeGraphGroup(), ...creationContext });
    }

    deleteGroup(_groupDescriptor: string): Promise<void> {
        return Promise.resolve();
    }

    getGroup(groupDescriptor: string): Promise<GraphGroup> {
        return Promise.resolve(findGroup(groupDescriptor));
    }

    updateGroup(groupDescriptor: string, patchDocument: JsonPatchDocument): Promise<GraphGroup> {
        return Promise.resolve({
            ...findGroup(groupDescriptor),
            ...patchFields(patchDocument),
            descriptor: groupDescriptor
        });
    }

    translate(masterId?: string, localId?: string): Promise<string> {
        const found = identityTranslations.find(t => t.masterId === masterId || t.localId === localId);
        if (found === undefined) {
            return Promise.resolve(fake.string.uuid());
        }
        return Promise.resolve(found.masterId === masterId ? found.localId : found.masterId);
    }

    lookupMembers(memberLookup: GraphSubjectLookup): Promise<{ [key: string]: GraphMember }> {
        return Promise.resolve(lookup(memberLookup, findMember));
    }

    getMemberByDescriptor(memberDescriptor: string): Promise<GraphMember> {
        return Promise.resolve(findMember(memberDescriptor));
    }

    addMembership(subjectDescriptor: string, containerDescriptor: string): Promise<GraphMembership> {
        return Promise.resolve(makeGraphMembership(subjectDescriptor, containerDescriptor));
    }

    checkMembershipExistence(subjectDescriptor: string, containerDescriptor: string): Promise<boolean> {
        return Promise.resolve(
            memberships.some(
                m => m.memberDescriptor === subjectDescriptor && m.containerDescriptor === containerDescriptor
            )
        );
    }

    getMembership(subjectDescriptor: string, containerDescriptor: string): Promise<GraphMembership> {
        return Promise.resolve(
            memberships.find(
                m => m.memberDescriptor === subjectDescriptor && m.containerDescriptor === containerDescriptor
            ) ?? makeGraphMembership(subjectDescriptor, containerDescriptor)
        );
    }

    removeMembership(_subjectDescriptor: string, _containerDescriptor: string): Promise<void> {
        return Promise.resolve();
    }

    listMemberships(
        subjectDescriptor: string,
        direction?: GraphTraversalDirection,
        _depth?: number
    ): Promise<GraphMembership[]> {
        return Promise.resolve(findMemberships(subjectDescriptor, direction));
    }

    getMembershipState(_subjectDescriptor: string): Promise<GraphMembershipState> {
        return Promise.resolve(makeGraphMembershipState());
    }

    lookupMembershipTraversals(
        membershipTraversalLookup: GraphSubjectLookup,
        direction?: GraphTraversalDirection,
        _depth?: number
    ): Promise<{ [key: string]: GraphMembershipTraversal }> {
        return Promise.resolve(lookup(membershipTraversalLookup, descriptor => traverse(descriptor, direction)));
    }

    traverseMemberships(
        subjectDescriptor: string,
        direction?: GraphTraversalDirection,
        _depth?: number
    ): Promise<GraphMembershipTraversal> {
        return Promise.resolve(traverse(subjectDescriptor, direction));
    }

    getProviderInfo(userDescriptor: string): Promise<GraphProviderInfo> {
        return Promise.resolve(
            providerInfos.find(p => p.descriptor === userDescriptor) ?? makeGraphProviderInfo(userDescriptor)
        );
    }

    requestAccess(_jsondocument: unknown): Promise<void> {
        return Promise.resolve();
    }

    resolve(mappings: IdentityMappings): Promise<ResolveDisconnectedUsersResponse> {
        return Promise.resolve(makeResolveDisconnectedUsersResponse(mappings.mappings.length));
    }

    createScope(creationContext: GraphScopeCreationContext, _scopeDescriptor?: string): Promise<GraphScope> {
        return Promise.resolve({
            ...makeGraphScope(),
            ...creationContext,
            displayName: creationContext.name
        });
    }

    deleteScope(_scopeDescriptor: string): Promise<void> {
        return Promise.resolve();
    }

    getScope(scopeDescriptor: string): Promise<GraphScope> {
        return Promise.resolve(findScope(scopeDescriptor));
    }

    updateScope(_scopeDescriptor: string, _patchDocument: JsonPatchDocument): Promise<void> {
        return Promise.resolve();
    }

    createServicePrincipal(
        creationContext: GraphServicePrincipalCreationContext,
        _groupDescriptors?: string[]
    ): Promise<GraphServicePrincipal> {
        return Promise.resolve({ ...makeGraphServicePrincipal(), ...creationContext });
    }

    deleteServicePrincipal(_servicePrincipalDescriptor: string): Promise<void> {
        return Promise.resolve();
    }

    getServicePrincipal(servicePrincipalDescriptor: string): Promise<GraphServicePrincipal> {
        return Promise.resolve(findServicePrincipal(servicePrincipalDescriptor));
    }

    updateServicePrincipal(
        updateContext: GraphServicePrincipalUpdateContext,
        servicePrincipalDescriptor: string
    ): Promise<GraphServicePrincipal> {
        return Promise.resolve({ ...findServicePrincipal(servicePrincipalDescriptor), ...updateContext });
    }

    getStorageKey(subjectDescriptor: string): Promise<GraphStorageKeyResult> {
        return Promise.resolve(makeGraphStorageKeyResult(findStorageKey(subjectDescriptor)));
    }

    lookupSubjects(subjectLookup: GraphSubjectLookup): Promise<{ [key: string]: GraphSubject }> {
        return Promise.resolve(lookup(subjectLookup, findSubject));
    }

    querySubjects(subjectQuery: GraphSubjectQuery): Promise<GraphSubject[]> {
        const kinds = subjectQuery.subjectKind.map(kind => kind.toLowerCase());
        const query = subjectQuery.query.toLowerCase();
        return Promise.resolve(
            subjects.filter(
                s =>
                    (kinds.length === 0 || kinds.includes(s.subjectKind.toLowerCase())) &&
                    s.displayName.toLowerCase().includes(query)
            )
        );
    }

    getSubject(subjectDescriptor: string): Promise<GraphSubject> {
        return Promise.resolve(findSubject(subjectDescriptor));
    }

    createUser(creationContext: GraphUserCreationContext, _groupDescriptors?: string[]): Promise<GraphUser> {
        return Promise.resolve({ ...makeGraphUser(), ...creationContext });
    }

    deleteUser(_userDescriptor: string): Promise<void> {
        return Promise.resolve();
    }

    getUser(userDescriptor: string): Promise<GraphUser> {
        return Promise.resolve(findUser(userDescriptor));
    }

    updateUser(updateContext: GraphUserUpdateContext, userDescriptor: string): Promise<GraphUser> {
        return Promise.resolve({ ...findUser(userDescriptor), ...updateContext });
    }
}
