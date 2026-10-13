import {
    ContributedFeatureEnabledValue,
    ContributedFeatureState,
    ContributedFeatureStateQuery,
    FeatureManagementRestClient
} from "azure-devops-extension-api/FeatureManagement";
import { getClient, getRegisteredMockClient, MockFeatureManagementRestClient } from "../azure-devops-extension-api";
import {
    features,
    makeContributedFeature,
    makeContributedFeatureSettingScope,
    makeContributedFeatureState,
    makeContributedFeatureStateQuery
} from "../azure-devops-extension-api/featureManagement/Data";

describe("FeatureManagementRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(FeatureManagementRestClient);
    const enabled = features[0];
    const disabled = features[1];

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(FeatureManagementRestClient)).toBe(MockFeatureManagementRestClient);
    });

    it("gets a known feature", async () => {
        expect(await client.getFeature(disabled.id)).toBe(disabled);
    });

    it("fabricates an unknown feature", async () => {
        const feature = await client.getFeature("ms.missing.feature");
        expect(feature.id).toBe("ms.missing.feature");
        expect(feature.defaultState).toBe(true);
        expect(feature.scopes.length).toBe(2);
    });

    it("lists features", async () => {
        expect(await client.getFeatures()).toBe(features);
        expect(await client.getFeatures("ms.vss-web.some-target")).toBe(features);
    });

    it("gets the state of a known feature from its default", async () => {
        const on = await client.getFeatureState(enabled.id, "me");
        expect(on.featureId).toBe(enabled.id);
        expect(on.state).toBe(ContributedFeatureEnabledValue.Enabled);
        expect(on.scope).toEqual({ userScoped: true, settingScope: undefined });
        expect(on.overridden).toBe(false);
        expect(on.reason).toBeUndefined();
        const off = await client.getFeatureState(disabled.id, "host");
        expect(off.state).toBe(ContributedFeatureEnabledValue.Disabled);
        expect(off.scope.userScoped).toBe(false);
    });

    it("gets the state of an unknown feature", async () => {
        const state = await client.getFeatureState("ms.missing.feature", "host");
        expect(state.featureId).toBe("ms.missing.feature");
        expect(state.state).toBe(ContributedFeatureEnabledValue.Enabled);
    });

    it("sets a feature state with a reason", async () => {
        const posted = { state: ContributedFeatureEnabledValue.Disabled } as ContributedFeatureState;
        const state = await client.setFeatureState(posted, enabled.id, "me", "not needed", "code");
        expect(state.featureId).toBe(enabled.id);
        expect(state.state).toBe(ContributedFeatureEnabledValue.Disabled);
        expect(state.overridden).toBe(true);
        expect(state.reason).toBe("not needed");
        expect(state.scope.userScoped).toBe(true);
    });

    it("keeps the posted reason when none is passed", async () => {
        const posted: ContributedFeatureState = {
            ...makeContributedFeatureState(disabled),
            featureId: "ignored",
            state: ContributedFeatureEnabledValue.Enabled,
            reason: "posted reason"
        };
        const state = await client.setFeatureState(posted, disabled.id, "host");
        expect(state.featureId).toBe(disabled.id);
        expect(state.state).toBe(ContributedFeatureEnabledValue.Enabled);
        expect(state.reason).toBe("posted reason");
    });

    it("leaves the reason absent when there is none", async () => {
        const posted = { state: ContributedFeatureEnabledValue.Enabled } as ContributedFeatureState;
        const state = await client.setFeatureState(posted, "ms.missing.feature", "host");
        expect(state.featureId).toBe("ms.missing.feature");
        expect(state.reason).toBeUndefined();
    });

    it("gets a feature state for a named scope", async () => {
        const state = await client.getFeatureStateForScope(disabled.id, "host", "project", "project-1");
        expect(state.featureId).toBe(disabled.id);
        expect(state.state).toBe(ContributedFeatureEnabledValue.Disabled);
        expect(state.scope).toEqual({ userScoped: false, settingScope: "project" });
    });

    it("sets a feature state for a named scope", async () => {
        const posted = { state: ContributedFeatureEnabledValue.Enabled } as ContributedFeatureState;
        const state = await client.setFeatureStateForScope(posted, disabled.id, "me", "project", "project-1", "why");
        expect(state.featureId).toBe(disabled.id);
        expect(state.state).toBe(ContributedFeatureEnabledValue.Enabled);
        expect(state.scope).toEqual({ userScoped: true, settingScope: "project" });
        expect(state.reason).toBe("why");
        const plain = await client.setFeatureStateForScope(posted, disabled.id, "me", "project", "project-1");
        expect(plain.reason).toBeUndefined();
    });

    it("queries feature states", async () => {
        const query: ContributedFeatureStateQuery = {
            featureIds: [enabled.id, disabled.id, "ms.missing.feature"],
            featureStates: {},
            scopeValues: { project: "project-1" }
        };
        const result = await client.queryFeatureStates(query);
        expect(result.featureIds).toEqual(query.featureIds);
        expect(result.scopeValues).toEqual({ project: "project-1" });
        expect(Object.keys(result.featureStates)).toEqual(query.featureIds);
        expect(result.featureStates[enabled.id].state).toBe(ContributedFeatureEnabledValue.Enabled);
        expect(result.featureStates[disabled.id].state).toBe(ContributedFeatureEnabledValue.Disabled);
        expect(result.featureStates["ms.missing.feature"].featureId).toBe("ms.missing.feature");
        expect(result.featureStates[enabled.id].scope.userScoped).toBe(false);
        expect(query.featureStates).toEqual({});
    });

    it("fills a partially posted query", async () => {
        const result = await client.queryFeatureStates({ featureIds: [enabled.id] } as ContributedFeatureStateQuery);
        expect(result.scopeValues).toEqual({});
        expect(result.featureStates[enabled.id].featureId).toBe(enabled.id);
    });

    it("queries feature states for the default scope", async () => {
        const query = { ...makeContributedFeatureStateQuery(), featureIds: [enabled.id] };
        const result = await client.queryFeatureStatesForDefaultScope(query, "me");
        expect(result.featureStates[enabled.id].scope).toEqual({ userScoped: true, settingScope: undefined });
    });

    it("queries feature states for a named scope", async () => {
        const query = { ...makeContributedFeatureStateQuery(), featureIds: [disabled.id] };
        const result = await client.queryFeatureStatesForNamedScope(query, "host", "project", "project-1");
        expect(result.featureStates[disabled.id].scope).toEqual({ userScoped: false, settingScope: "project" });
    });
});

describe("feature management fixtures", () => {
    it("makes a host scope by default", () => {
        expect(makeContributedFeatureSettingScope()).toEqual({ userScoped: false, settingScope: undefined });
        expect(makeContributedFeatureSettingScope("me", "project")).toEqual({ userScoped: true, settingScope: "project" });
    });

    it("makes a state for a fresh feature", () => {
        const state = makeContributedFeatureState();
        expect(state.featureId.startsWith("ms.vss-web.")).toBe(true);
        expect(state.state).toBe(ContributedFeatureEnabledValue.Enabled);
    });

    it("makes a state that follows the feature default", () => {
        const feature = { ...makeContributedFeature(), defaultState: false };
        expect(makeContributedFeatureState(feature).state).toBe(ContributedFeatureEnabledValue.Disabled);
    });

    it("makes an empty query", () => {
        expect(makeContributedFeatureStateQuery()).toEqual({ featureIds: [], featureStates: {}, scopeValues: {} });
    });

    it("seeds unique feature ids", () => {
        expect(new Set(features.map(f => f.id)).size).toBe(features.length);
        expect(features.map(f => f.defaultState)).toEqual([true, false, true, false]);
    });
});
