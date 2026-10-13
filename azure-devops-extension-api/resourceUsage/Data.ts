import { fake } from "../common/fixtures";
import { Usage } from "azure-devops-extension-api/ResourceUsage";

export const makeUsage = (limit: number = fake.number.int({ min: 100, max: 10_000 })): Usage => ({
    count: fake.number.int({ min: 0, max: limit }),
    limit
});

export const makeUsages = (limits: { [key: string]: number }): { [key: string]: Usage } =>
    Object.fromEntries(Object.entries(limits).map(([key, limit]) => [key, makeUsage(limit)]));

export const limits: { [key: string]: Usage } = makeUsages({
    Projects: 1_000,
    WorkItemTags: 150_000,
    Fields: 8_192,
    Processes: 128
});

export const projectLimits: { [key: string]: Usage } = makeUsages({
    Teams: 5_000,
    AreaPaths: 10_000,
    IterationPaths: 10_000,
    Dashboards: 500
});
