import { fake } from "../common/fixtures";
import { ArtifactScope, Favorite, FavoriteProvider } from "azure-devops-extension-api/Favorite";
import { makeIdentityRef } from "../core/Data";

export const makeArtifactScope = (): ArtifactScope => ({
    id: fake.string.uuid(),
    name: fake.lorem.words(2),
    type: "Project"
});

export const makeFavoriteProvider = (): FavoriteProvider => ({
    artifactType: `Microsoft.TeamFoundation.${fake.lorem.word()}.${fake.word.noun()}`,
    artifactUri: fake.internet.url(),
    clientServiceIdentifier: `ms.vss-favorites.${fake.lorem.slug(2)}`,
    contributionId: `ms.vss-favorites.${fake.lorem.slug(2)}`,
    iconClass: `bowtie-icon bowtie-${fake.lorem.word()}`,
    iconName: fake.lorem.word(),
    order: fake.number.int({ min: 1, max: 100 }),
    pluralName: fake.lorem.words(2),
    serviceIdentifier: fake.string.uuid(),
    serviceUri: fake.internet.url(),
    token: fake.string.alphanumeric(24)
});

export const makeFavorite = (): Favorite => ({
    id: fake.string.uuid(),
    artifactId: fake.string.uuid(),
    artifactIsDeleted: false,
    artifactName: fake.lorem.words(2),
    artifactProperties: {},
    artifactScope: makeArtifactScope(),
    artifactType: "Microsoft.TeamFoundation.Git.Repository",
    creationDate: fake.date.recent({ days: 30 }),
    owner: makeIdentityRef(),
    url: fake.internet.url(),
    _links: {}
});

export const favoriteProviders: FavoriteProvider[] = [
    { ...makeFavoriteProvider(), artifactType: "Microsoft.TeamFoundation.Git.Repository", pluralName: "Repositories" },
    { ...makeFavoriteProvider(), artifactType: "Microsoft.TeamFoundation.Build.Definition", pluralName: "Pipelines" },
    {
        ...makeFavoriteProvider(),
        artifactType: "Microsoft.TeamFoundation.Classification.TeamProject",
        pluralName: "Projects"
    }
];

export const favoriteScopes: ArtifactScope[] = [makeArtifactScope(), { ...makeArtifactScope(), type: "Collection" }];

export const favorites: Favorite[] = fake.helpers
    .distinct(
        4,
        makeFavorite,
        favorite => favorite.id,
        favorite => favorite.artifactId
    )
    .map((favorite, index) => ({
        ...favorite,
        artifactType: favoriteProviders[index % favoriteProviders.length].artifactType,
        artifactScope: favoriteScopes[index % favoriteScopes.length]
    }));
