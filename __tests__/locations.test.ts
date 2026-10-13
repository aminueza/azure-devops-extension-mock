import {
    InheritLevel,
    LocationsRestClient,
    RelativeToSetting,
    ServiceStatus
} from "azure-devops-extension-api/Locations";
import { ConnectOptions, DeploymentFlags } from "azure-devops-extension-api/WebApi";
import { getClient, getRegisteredMockClient, MockLocationsRestClient } from "../azure-devops-extension-api";
import {
    accessMappings,
    connectionData,
    makeAccessMapping,
    makeConnectionData,
    makeIdentity,
    makeIdentityDescriptor,
    makeLocationMapping,
    makeLocationServiceData,
    makeResourceAreaInfo,
    makeServiceDefinition,
    resourceAreas,
    serviceDefinitions
} from "../azure-devops-extension-api/locations/Data";

const CORE_AREA = "79134c72-4a58-4b42-976c-04e7115f32bf";

describe("LocationsRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(LocationsRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(LocationsRestClient)).toBe(MockLocationsRestClient);
    });

    it("gets the connection data without services by default", async () => {
        const data = await client.getConnectionData();
        expect(data.authenticatedUser).toBe(connectionData.authenticatedUser);
        expect(data.instanceId).toBe(connectionData.instanceId);
        expect(data.locationServiceData.serviceDefinitions).toEqual([]);
        expect(data.locationServiceData.accessMappings).toEqual([]);
        expect(data.locationServiceData.defaultAccessMappingMoniker).toBe("PublicAccessMapping");
    });

    it("gets the connection data without services when other options are set", async () => {
        const data = await client.getConnectionData(ConnectOptions.IncludeLastUserAccess, 1, 1);
        expect(data.locationServiceData.serviceDefinitions).toEqual([]);
        expect(connectionData.locationServiceData.serviceDefinitions).toBe(serviceDefinitions);
    });

    it("gets the connection data with services when asked to", async () => {
        const data = await client.getConnectionData(ConnectOptions.IncludeServices);
        expect(data).toBe(connectionData);
        expect(data.locationServiceData.serviceDefinitions).toBe(serviceDefinitions);
        expect(data.locationServiceData.accessMappings).toBe(accessMappings);
        const combined = await client.getConnectionData(
            ConnectOptions.IncludeServices | ConnectOptions.IncludeLastUserAccess
        );
        expect(combined).toBe(connectionData);
    });

    it("gets a known resource area", async () => {
        const area = await client.getResourceArea(CORE_AREA, "enterprise", "organization", "PublicAccessMapping");
        expect(area).toBe(resourceAreas[0]);
        expect(area.name).toBe("core");
    });

    it("fabricates an unknown resource area", async () => {
        const area = await client.getResourceArea("missing-area");
        expect(area.id).toBe("missing-area");
        expect(typeof area.name).toBe("string");
        expect(typeof area.locationUrl).toBe("string");
    });

    it("gets a resource area by host", async () => {
        expect(await client.getResourceAreaByHost(resourceAreas[1].id, "host-1")).toBe(resourceAreas[1]);
        expect((await client.getResourceAreaByHost("missing-area", "host-1", "mapping")).id).toBe("missing-area");
    });

    it("gets a resource area by instance id", async () => {
        expect(await client.getResourceAreaByInstanceId(resourceAreas[2].id, "instance-1", "mapping")).toBe(
            resourceAreas[2]
        );
        expect((await client.getResourceAreaByInstanceId("missing-area", "instance-1", "mapping")).id).toBe(
            "missing-area"
        );
    });

    it("lists the resource areas", async () => {
        const areas = await client.getResourceAreas("enterprise", "organization");
        expect(areas).toBe(resourceAreas);
        expect(areas.map(a => a.name)).toEqual(["core", "git", "build", "policy"]);
    });

    it("lists the resource areas of a host", async () => {
        expect(await client.getResourceAreasByHost("host-1")).toBe(resourceAreas);
    });

    it("deletes a service definition", async () => {
        const target = serviceDefinitions[0];
        await expect(client.deleteServiceDefinition(target.serviceType, target.identifier)).resolves.toBeUndefined();
    });

    it("gets a known service definition", async () => {
        const target = serviceDefinitions[1];
        expect(await client.getServiceDefinition(target.serviceType, target.identifier, true, false)).toBe(target);
    });

    it("fabricates an unknown service definition", async () => {
        const made = await client.getServiceDefinition("missing-type", "missing-identifier");
        expect(made.serviceType).toBe("missing-type");
        expect(made.identifier).toBe("missing-identifier");
        expect(made.status).toBe(ServiceStatus.Active);
    });

    it("fabricates a service definition when only the identifier is known", async () => {
        const made = await client.getServiceDefinition("missing-type", serviceDefinitions[0].identifier);
        expect(made).not.toBe(serviceDefinitions[0]);
        expect(made.serviceType).toBe("missing-type");
    });

    it("lists every service definition", async () => {
        expect(await client.getServiceDefinitions()).toEqual(serviceDefinitions);
    });

    it("lists service definitions filtered by service type", async () => {
        const child = serviceDefinitions[3];
        expect(await client.getServiceDefinitions(child.serviceType)).toEqual([child]);
        expect(await client.getServiceDefinitions("missing-type")).toEqual([]);
    });

    it("updates service definitions", async () => {
        await expect(
            client.updateServiceDefinitions({ count: 1, value: [serviceDefinitions[0]] })
        ).resolves.toBeUndefined();
    });
});

describe("locations fixtures", () => {
    it("makes an identity without a social descriptor", () => {
        const identity = makeIdentity();
        expect(identity.socialDescriptor).toBeUndefined();
        expect(identity.isActive).toBe(true);
        expect(identity.isContainer).toBe(false);
        expect(identity.members).toEqual([]);
        expect(identity.descriptor.identityType).toBe(makeIdentityDescriptor().identityType);
    });

    it("makes an access mapping", () => {
        const mapping = makeAccessMapping();
        expect(typeof mapping.moniker).toBe("string");
        expect(mapping.virtualDirectory).toBe("");
    });

    it("makes a location mapping for the given moniker or a random one", () => {
        expect(makeLocationMapping("PublicAccessMapping").accessMappingMoniker).toBe("PublicAccessMapping");
        expect(typeof makeLocationMapping().accessMappingMoniker).toBe("string");
    });

    it("makes a top level service definition without a parent", () => {
        const definition = makeServiceDefinition();
        expect(definition.parentIdentifier).toBeUndefined();
        expect(definition.parentServiceType).toBeUndefined();
        expect(definition.inheritLevel).toBe(InheritLevel.None);
        expect(definition.relativeToSetting).toBe(RelativeToSetting.Context);
        expect(definition.locationMappings.length).toBe(1);
    });

    it("makes a resource area", () => {
        expect(typeof makeResourceAreaInfo().id).toBe("string");
    });

    it("makes location service data over the seeded lists", () => {
        const data = makeLocationServiceData();
        expect(data.accessMappings).toBe(accessMappings);
        expect(data.serviceDefinitions).toBe(serviceDefinitions);
    });

    it("makes connection data for the given user or a random one", () => {
        const user = makeIdentity();
        const data = makeConnectionData(user);
        expect(data.authenticatedUser).toBe(user);
        expect(data.authorizedUser).toBe(user);
        expect(data.deploymentType).toBe(DeploymentFlags.Hosted);
        expect(data.lastUserAccess).toBeInstanceOf(Date);
        expect(typeof makeConnectionData().authenticatedUser.id).toBe("string");
    });

    it("seeds service definitions with unique lookup keys", () => {
        const keys = serviceDefinitions.map(d => `${d.serviceType}/${d.identifier}`);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("seeds a location mapping per access mapping on the top level definitions", () => {
        for (const definition of serviceDefinitions.slice(0, 3)) {
            expect(definition.locationMappings.map(m => m.accessMappingMoniker)).toEqual(
                accessMappings.map(m => m.moniker)
            );
        }
    });

    it("seeds a child definition that points at the first one", () => {
        const child = serviceDefinitions[3];
        expect(child.parentIdentifier).toBe(serviceDefinitions[0].identifier);
        expect(child.parentServiceType).toBe(serviceDefinitions[0].serviceType);
        expect(child.inheritLevel).toBe(InheritLevel.Account);
    });

    it("seeds resource areas with unique ids", () => {
        expect(new Set(resourceAreas.map(a => a.id)).size).toBe(resourceAreas.length);
    });
});
