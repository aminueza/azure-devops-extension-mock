import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    FeatureAvailabilityRestClient,
    FeatureFlag,
    FeatureFlagPatch
} from "azure-devops-extension-api/FeatureAvailability";
import { featureFlags, makeFeatureFlag } from "./Data";

const findFlag = (name: string): FeatureFlag =>
    featureFlags.find(f => f.name === name) ?? { ...makeFeatureFlag(), name };

export class MockFeatureAvailabilityRestClient extends RestClientBase {
    public TYPE = FeatureAvailabilityRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getAllFeatureFlags(_userEmail?: string): Promise<FeatureFlag[]> {
        return Promise.resolve(featureFlags);
    }

    getFeatureFlagByName(name: string, _checkFeatureExists?: boolean): Promise<FeatureFlag> {
        return Promise.resolve(findFlag(name));
    }

    getFeatureFlagByNameAndUserEmail(
        name: string,
        _userEmail: string,
        _checkFeatureExists?: boolean
    ): Promise<FeatureFlag> {
        return Promise.resolve(findFlag(name));
    }

    getFeatureFlagByNameAndUserId(name: string, _userId: string, _checkFeatureExists?: boolean): Promise<FeatureFlag> {
        return Promise.resolve(findFlag(name));
    }

    updateFeatureFlag(
        state: FeatureFlagPatch,
        name: string,
        _userEmail?: string,
        _checkFeatureExists?: boolean,
        _setAtApplicationLevelAlso?: boolean
    ): Promise<FeatureFlag> {
        return Promise.resolve({ ...findFlag(name), explicitState: state.state, effectiveState: state.state });
    }
}
