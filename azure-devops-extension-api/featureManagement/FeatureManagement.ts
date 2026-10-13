import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    ContributedFeature,
    ContributedFeatureState,
    ContributedFeatureStateQuery,
    FeatureManagementRestClient
} from "azure-devops-extension-api/FeatureManagement";
import {
    features,
    makeContributedFeature,
    makeContributedFeatureSettingScope,
    makeContributedFeatureState,
    makeContributedFeatureStateQuery
} from "./Data";

const findFeature = (featureId: string): ContributedFeature =>
    features.find(f => f.id === featureId) ?? { ...makeContributedFeature(), id: featureId };

const stateOf = (featureId: string, userScope?: string, scopeName?: string): ContributedFeatureState => ({
    ...makeContributedFeatureState(findFeature(featureId)),
    scope: makeContributedFeatureSettingScope(userScope, scopeName)
});

const setState = (
    feature: ContributedFeatureState,
    featureId: string,
    userScope: string,
    scopeName?: string,
    reason?: string
): ContributedFeatureState => {
    const current = stateOf(featureId, userScope, scopeName);
    return { ...current, ...feature, featureId, overridden: true, reason: reason ?? feature.reason ?? current.reason };
};

const queryStates = (
    query: ContributedFeatureStateQuery,
    userScope?: string,
    scopeName?: string
): ContributedFeatureStateQuery => ({
    ...makeContributedFeatureStateQuery(),
    ...query,
    featureStates: Object.fromEntries(query.featureIds.map(id => [id, stateOf(id, userScope, scopeName)]))
});

export class MockFeatureManagementRestClient extends RestClientBase {
    public TYPE = FeatureManagementRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getFeature(featureId: string): Promise<ContributedFeature> {
        return Promise.resolve(findFeature(featureId));
    }

    getFeatures(_targetContributionId?: string): Promise<ContributedFeature[]> {
        return Promise.resolve(features);
    }

    getFeatureState(featureId: string, userScope: string): Promise<ContributedFeatureState> {
        return Promise.resolve(stateOf(featureId, userScope));
    }

    setFeatureState(
        feature: ContributedFeatureState,
        featureId: string,
        userScope: string,
        reason?: string,
        _reasonCode?: string
    ): Promise<ContributedFeatureState> {
        return Promise.resolve(setState(feature, featureId, userScope, undefined, reason));
    }

    getFeatureStateForScope(
        featureId: string,
        userScope: string,
        scopeName: string,
        _scopeValue: string
    ): Promise<ContributedFeatureState> {
        return Promise.resolve(stateOf(featureId, userScope, scopeName));
    }

    setFeatureStateForScope(
        feature: ContributedFeatureState,
        featureId: string,
        userScope: string,
        scopeName: string,
        _scopeValue: string,
        reason?: string,
        _reasonCode?: string
    ): Promise<ContributedFeatureState> {
        return Promise.resolve(setState(feature, featureId, userScope, scopeName, reason));
    }

    queryFeatureStates(query: ContributedFeatureStateQuery): Promise<ContributedFeatureStateQuery> {
        return Promise.resolve(queryStates(query));
    }

    queryFeatureStatesForDefaultScope(
        query: ContributedFeatureStateQuery,
        userScope: string
    ): Promise<ContributedFeatureStateQuery> {
        return Promise.resolve(queryStates(query, userScope));
    }

    queryFeatureStatesForNamedScope(
        query: ContributedFeatureStateQuery,
        userScope: string,
        scopeName: string,
        _scopeValue: string
    ): Promise<ContributedFeatureStateQuery> {
        return Promise.resolve(queryStates(query, userScope, scopeName));
    }
}
