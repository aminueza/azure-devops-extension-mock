import { fake } from "../common/fixtures";
import { FeatureFlag } from "azure-devops-extension-api/FeatureAvailability";

export const makeFeatureFlag = (): FeatureFlag => {
    const name = `${fake.lorem.word()}.${fake.lorem.word()}.${fake.lorem.word()}`;
    return {
        name,
        description: fake.lorem.sentence(),
        effectiveState: "On",
        explicitState: "On",
        uri: `${fake.internet.url()}/_apis/FeatureFlags/${name}`
    };
};

const seededFlags: FeatureFlag[] = fake.helpers.distinct(4, makeFeatureFlag, item => item.name);

export const featureFlags: FeatureFlag[] = [
    seededFlags[0],
    { ...seededFlags[1], effectiveState: "Off", explicitState: "Off" },
    { ...seededFlags[2], effectiveState: "On", explicitState: "Undefined" },
    { ...seededFlags[3], effectiveState: "Off", explicitState: "Undefined" }
];
