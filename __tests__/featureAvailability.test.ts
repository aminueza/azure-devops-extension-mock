import { FeatureAvailabilityRestClient } from "azure-devops-extension-api/FeatureAvailability";
import { getClient, getRegisteredMockClient, MockFeatureAvailabilityRestClient } from "../azure-devops-extension-api";
import { featureFlags, makeFeatureFlag } from "../azure-devops-extension-api/featureAvailability/Data";

describe("FeatureAvailabilityRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(FeatureAvailabilityRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(FeatureAvailabilityRestClient)).toBe(MockFeatureAvailabilityRestClient);
    });

    it("lists every feature flag", async () => {
        const flags = await client.getAllFeatureFlags();
        expect(flags).toBe(featureFlags);
        expect(flags.length).toBe(4);
        expect(await client.getAllFeatureFlags("someone@example.com")).toBe(featureFlags);
    });

    it("gets a known flag by name", async () => {
        expect(await client.getFeatureFlagByName(featureFlags[1].name)).toBe(featureFlags[1]);
        expect(await client.getFeatureFlagByName(featureFlags[2].name, true)).toBe(featureFlags[2]);
    });

    it("fabricates an unknown flag by name", async () => {
        const flag = await client.getFeatureFlagByName("Missing.Feature.Flag");
        expect(flag.name).toBe("Missing.Feature.Flag");
        expect(flag.effectiveState).toBe("On");
        expect(typeof flag.description).toBe("string");
    });

    it("gets a flag by name and user email", async () => {
        expect(await client.getFeatureFlagByNameAndUserEmail(featureFlags[0].name, "someone@example.com")).toBe(
            featureFlags[0]
        );
        const made = await client.getFeatureFlagByNameAndUserEmail("Missing.By.Email", "someone@example.com", false);
        expect(made.name).toBe("Missing.By.Email");
    });

    it("gets a flag by name and user id", async () => {
        expect(await client.getFeatureFlagByNameAndUserId(featureFlags[3].name, "user-1")).toBe(featureFlags[3]);
        const made = await client.getFeatureFlagByNameAndUserId("Missing.By.Id", "user-1", true);
        expect(made.name).toBe("Missing.By.Id");
    });

    it("updates a known flag", async () => {
        const target = featureFlags[1];
        const updated = await client.updateFeatureFlag({ state: "On" }, target.name);
        expect(updated).toEqual({ ...target, explicitState: "On", effectiveState: "On" });
        expect(target.explicitState).toBe("Off");
    });

    it("updates an unknown flag", async () => {
        const updated = await client.updateFeatureFlag(
            { state: "Off" },
            "Missing.Updated",
            "a@example.com",
            true,
            true
        );
        expect(updated.name).toBe("Missing.Updated");
        expect(updated.explicitState).toBe("Off");
        expect(updated.effectiveState).toBe("Off");
    });
});

describe("feature availability fixtures", () => {
    it("makes a flag whose uri ends in its name", () => {
        const flag = makeFeatureFlag();
        expect(flag.uri.endsWith(`/_apis/FeatureFlags/${flag.name}`)).toBe(true);
        expect(flag.explicitState).toBe("On");
    });

    it("seeds unique flag names", () => {
        expect(new Set(featureFlags.map(f => f.name)).size).toBe(featureFlags.length);
    });

    it("seeds flags in each state", () => {
        expect(featureFlags.map(f => `${f.explicitState}/${f.effectiveState}`)).toEqual([
            "On/On",
            "Off/Off",
            "Undefined/On",
            "Undefined/Off"
        ]);
    });
});
