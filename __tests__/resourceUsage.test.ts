import { ResourceUsageRestClient } from "azure-devops-extension-api/ResourceUsage";
import { getClient, getRegisteredMockClient, MockResourceUsageRestClient } from "../azure-devops-extension-api";
import { limits, makeUsage, makeUsages, projectLimits } from "../azure-devops-extension-api/resourceUsage/Data";

describe("ResourceUsageRestClient mock", () => {
    const client = getClient(ResourceUsageRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(ResourceUsageRestClient)).toBe(MockResourceUsageRestClient);
    });

    it("gets the limits of a project", async () => {
        const usage = await client.getProjectLimit("proj");
        expect(usage).toBe(projectLimits);
        expect(Object.keys(usage)).toEqual(["Teams", "AreaPaths", "IterationPaths", "Dashboards"]);
    });

    it("gets the limits of the organization", async () => {
        const usage = await client.getLimits();
        expect(usage).toBe(limits);
        expect(Object.keys(usage)).toEqual(["Projects", "WorkItemTags", "Fields", "Processes"]);
    });
});

describe("resource usage fixtures", () => {
    it("makes a usage that stays within its limit", () => {
        const usage = makeUsage();
        expect(usage.limit).toBeGreaterThanOrEqual(100);
        expect(usage.count).toBeGreaterThanOrEqual(0);
        expect(usage.count).toBeLessThanOrEqual(usage.limit);
    });

    it("makes a usage with the given limit", () => {
        const usage = makeUsage(3);
        expect(usage.limit).toBe(3);
        expect(usage.count).toBeLessThanOrEqual(3);
    });

    it("makes one usage per named limit", () => {
        expect(makeUsages({})).toEqual({});
        const usages = makeUsages({ Things: 10, Others: 20 });
        expect(Object.keys(usages)).toEqual(["Things", "Others"]);
        expect(usages.Things.limit).toBe(10);
        expect(usages.Others.limit).toBe(20);
    });

    it("seeds counts within the limits", () => {
        for (const usage of [...Object.values(limits), ...Object.values(projectLimits)]) {
            expect(usage.count).toBeLessThanOrEqual(usage.limit);
        }
        expect(limits.Projects.limit).toBe(1_000);
        expect(projectLimits.Teams.limit).toBe(5_000);
    });
});
