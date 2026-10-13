import { fake } from "../common/fixtures";
import {
    ContributedFeature,
    ContributedFeatureEnabledValue,
    ContributedFeatureSettingScope,
    ContributedFeatureState,
    ContributedFeatureStateQuery
} from "azure-devops-extension-api/FeatureManagement";

export const makeContributedFeatureSettingScope = (
    userScope: string = "host",
    settingScope: string = fake.helpers.absent()
): ContributedFeatureSettingScope => ({
    userScoped: userScope === "me",
    settingScope
});

export const makeContributedFeature = (): ContributedFeature => ({
    id: `ms.vss-web.${fake.lorem.slug(3)}`,
    name: fake.lorem.words(3),
    description: fake.lorem.sentence(),
    defaultState: true,
    defaultValueRules: [],
    overrideRules: [],
    featureProperties: {},
    featureStateChangedListeners: [],
    includeAsClaim: false,
    order: fake.number.int({ min: 1, max: 100 }),
    scopes: [makeContributedFeatureSettingScope("me"), makeContributedFeatureSettingScope("host")],
    serviceInstanceType: fake.string.uuid(),
    tags: [],
    _links: {}
});

export const makeContributedFeatureState = (
    feature: ContributedFeature = makeContributedFeature()
): ContributedFeatureState => ({
    featureId: feature.id,
    state: feature.defaultState ? ContributedFeatureEnabledValue.Enabled : ContributedFeatureEnabledValue.Disabled,
    scope: makeContributedFeatureSettingScope(),
    overridden: false,
    reason: fake.helpers.absent()
});

export const makeContributedFeatureStateQuery = (): ContributedFeatureStateQuery => ({
    featureIds: [],
    featureStates: {},
    scopeValues: {}
});

const seededFeatures: ContributedFeature[] = fake.helpers.distinct(4, makeContributedFeature, item => item.id);

export const features: ContributedFeature[] = [
    seededFeatures[0],
    { ...seededFeatures[1], defaultState: false },
    { ...seededFeatures[2], tags: ["preview"] },
    { ...seededFeatures[3], defaultState: false, includeAsClaim: true }
];
