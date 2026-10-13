import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    Avatar,
    AvatarSize,
    CreateProfileContext,
    Profile,
    ProfileAttribute,
    ProfileAttributeBase,
    ProfileRestClient
} from "azure-devops-extension-api/Profile";
import { VssJsonCollectionWrapperV } from "azure-devops-extension-api/WebApi";
import {
    makeAttributeDescriptor,
    makeAvatar,
    makeProfile,
    makeProfileAttribute,
    profileAttributes,
    profiles
} from "./Data";

const AVATAR_SIZES: { [name: string]: AvatarSize } = {
    small: AvatarSize.Small,
    medium: AvatarSize.Medium,
    large: AvatarSize.Large
};

const avatarSize = (size?: string): AvatarSize => AVATAR_SIZES[(size ?? "medium").toLowerCase()] ?? AvatarSize.Medium;

const findAttribute = (descriptor: string): ProfileAttribute => {
    const [containerName, attributeName = containerName] = descriptor.split(";");
    return (
        profileAttributes.find(
            a => a.descriptor.containerName === containerName && a.descriptor.attributeName === attributeName
        ) ?? makeProfileAttribute(makeAttributeDescriptor(containerName, attributeName))
    );
};

const findProfile = (id: string): Profile =>
    id === "me" ? profiles[0] : (profiles.find(p => p.id === id) ?? { ...makeProfile(), id });

export class MockProfileRestClient extends RestClientBase {
    public TYPE = ProfileRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    deleteProfileAttribute(_id: string, _descriptor: string): Promise<void> {
        return Promise.resolve();
    }

    getProfileAttribute(_id: string, descriptor: string): Promise<ProfileAttribute> {
        return Promise.resolve(findAttribute(descriptor));
    }

    getProfileAttributes(
        _id: string,
        partition: string,
        _modifiedSince?: string,
        _modifiedAfterRevision?: string,
        _withCoreAttributes?: boolean,
        _coreAttributes?: string
    ): Promise<ProfileAttribute[]> {
        return Promise.resolve(profileAttributes.filter(a => a.descriptor.containerName === partition));
    }

    setProfileAttribute(_container: any, _id: string, _descriptor: string): Promise<void> {
        return Promise.resolve();
    }

    setProfileAttributes(
        _attributesCollection: VssJsonCollectionWrapperV<ProfileAttributeBase<any>[]>,
        _id: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getAvatar(_id: string, size?: string, _format?: string): Promise<Avatar> {
        return Promise.resolve(makeAvatar(avatarSize(size)));
    }

    getAvatarPreview(
        _container: any,
        _id: string,
        size?: string,
        _format?: string,
        _displayName?: string
    ): Promise<Avatar> {
        return Promise.resolve(makeAvatar(avatarSize(size)));
    }

    resetAvatar(_id: string): Promise<void> {
        return Promise.resolve();
    }

    setAvatar(_container: any, _id: string): Promise<void> {
        return Promise.resolve();
    }

    createProfile(createProfileContext: CreateProfileContext, _autoCreate?: boolean): Promise<Profile> {
        return Promise.resolve(makeProfile(createProfileContext));
    }

    getProfile(
        id: string,
        _details?: boolean,
        _withAttributes?: boolean,
        _partition?: string,
        _coreAttributes?: string,
        _forceRefresh?: boolean
    ): Promise<Profile> {
        return Promise.resolve(findProfile(id));
    }

    updateProfile(_profile: Profile, _id: string): Promise<void> {
        return Promise.resolve();
    }
}
