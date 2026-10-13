import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    Favorite,
    FavoriteCreateParameters,
    FavoriteProvider,
    FavoriteRestClient
} from "azure-devops-extension-api/Favorite";
import { favoriteProviders, favorites, makeFavorite } from "./Data";

const findFavorite = (favoriteId: string): Favorite =>
    favorites.find(f => f.id === favoriteId) ?? { ...makeFavorite(), id: favoriteId };

const fabricateForArtifact = (artifactType: string, artifactId: string, artifactScopeType: string): Favorite => {
    const made = makeFavorite();
    return { ...made, artifactType, artifactId, artifactScope: { ...made.artifactScope, type: artifactScopeType } };
};

const filterFavorites = (artifactType?: string, artifactScopeType?: string, artifactScopeId?: string): Favorite[] =>
    favorites.filter(
        f =>
            (artifactType === undefined || f.artifactType === artifactType) &&
            (artifactScopeType === undefined || f.artifactScope.type === artifactScopeType) &&
            (artifactScopeId === undefined || f.artifactScope.id === artifactScopeId)
    );

export class MockFavoriteRestClient extends RestClientBase {
    public TYPE = FavoriteRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getFavoriteProviders(_faultInMissingHost?: boolean): Promise<FavoriteProvider[]> {
        return Promise.resolve(favoriteProviders);
    }

    createFavorite(favorite: FavoriteCreateParameters): Promise<Favorite> {
        return Promise.resolve({ ...makeFavorite(), ...favorite });
    }

    createFavoriteOfOwner(
        favorite: FavoriteCreateParameters,
        _ownerScopeType: string,
        _ownerScopeId: string
    ): Promise<Favorite> {
        return Promise.resolve({ ...makeFavorite(), ...favorite });
    }

    deleteFavoriteById(
        _favoriteId: string,
        _artifactType: string,
        _artifactScopeType: string,
        _artifactScopeId?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    deleteFavoriteOfOwnerById(
        _favoriteId: string,
        _ownerScopeType: string,
        _ownerScopeId: string,
        _artifactType: string,
        _artifactScopeType: string,
        _artifactScopeId?: string
    ): Promise<void> {
        return Promise.resolve();
    }

    getFavoriteByArtifact(
        artifactType: string,
        artifactId: string,
        artifactScopeType: string,
        _artifactScopeId?: string,
        _includeExtendedDetails?: boolean
    ): Promise<Favorite> {
        return Promise.resolve(
            favorites.find(f => f.artifactType === artifactType && f.artifactId === artifactId) ??
                fabricateForArtifact(artifactType, artifactId, artifactScopeType)
        );
    }

    getFavoriteById(
        favoriteId: string,
        _artifactScopeType: string,
        _artifactType: string,
        _artifactScopeId?: string,
        _includeExtendedDetails?: boolean
    ): Promise<Favorite> {
        return Promise.resolve(findFavorite(favoriteId));
    }

    getFavoriteOfOwnerById(
        favoriteId: string,
        _ownerScopeType: string,
        _ownerScopeId: string,
        _artifactScopeType: string,
        _artifactType: string,
        _artifactScopeId?: string,
        _includeExtendedDetails?: boolean
    ): Promise<Favorite> {
        return Promise.resolve(findFavorite(favoriteId));
    }

    getFavorites(
        artifactType?: string,
        artifactScopeType?: string,
        artifactScopeId?: string,
        _includeExtendedDetails?: boolean
    ): Promise<Favorite[]> {
        return Promise.resolve(filterFavorites(artifactType, artifactScopeType, artifactScopeId));
    }

    getFavoritesOfOwner(
        _ownerScopeType: string,
        _ownerScopeId: string,
        artifactType?: string,
        artifactScopeType?: string,
        artifactScopeId?: string,
        _includeExtendedDetails?: boolean
    ): Promise<Favorite[]> {
        return Promise.resolve(filterFavorites(artifactType, artifactScopeType, artifactScopeId));
    }
}
