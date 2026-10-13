import {
    AadLoginPromptOption,
    OAuthConfigurationActionFilter,
    ServiceEndpoint,
    ServiceEndpointActionFilter,
    ServiceEndpointExecutionResult,
    ServiceEndpointRestClient
} from "azure-devops-extension-api/ServiceEndpoint";
import { InputMode } from "azure-devops-extension-api/FormInput";
import { getClient, MockServiceEndpointRestClient } from "../azure-devops-extension-api";
import {
    SECRET_PLACEHOLDER,
    endpointKinds,
    makeDataSourceBinding,
    makeExecutionData,
    makeServiceEndpoint,
    makeServiceEndpointProjectReference,
    serviceEndpoints
} from "../azure-devops-extension-api/serviceEndpoint/Data";

const request = {
    dataSourceDetails: {
        dataSourceName: "TestConnection",
        dataSourceUrl: "",
        headers: [],
        initialContextTemplate: "",
        parameters: {},
        requestContent: "",
        requestVerb: "GET",
        resourceUrl: "",
        resultSelector: ""
    },
    resultTransformationDetails: { callbackContextTemplate: "", callbackRequiredTemplate: "", resultTemplate: "" },
    serviceEndpointDetails: {
        authorization: { scheme: "Token", parameters: { apitoken: SECRET_PLACEHOLDER } },
        data: {},
        type: "github",
        url: "https://example.com"
    }
};

const oauthParams = {
    name: "new-oauth",
    endpointType: "github",
    url: "https://example.com/oauth",
    clientId: "client-id",
    clientSecret: SECRET_PLACEHOLDER
};

describe("ServiceEndpointRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(ServiceEndpointRestClient);

    const seeded = (): Promise<ServiceEndpoint[]> => client.getServiceEndpoints("proj");

    it("is registered and exported", () => {
        expect(new MockServiceEndpointRestClient({}).TYPE).toBe(ServiceEndpointRestClient);
    });

    it("gets azure management groups", async () => {
        const result = await client.getAzureManagementGroups();
        expect(result.errorMessage).toBe("");
        expect(result.value.length).toBe(2);
        expect(new Set(result.value.map(g => g.name)).size).toBe(2);
        for (const group of result.value) {
            expect(group.id.endsWith(`/${group.name}`)).toBe(true);
            expect(typeof group.displayName).toBe("string");
            expect(typeof group.tenantId).toBe("string");
        }
    });

    it("gets azure subscriptions in the mock tenant", async () => {
        const result = await client.getAzureSubscriptions();
        const tenantId = await client.getVstsAadTenantId();
        expect(result.errorMessage).toBe("");
        expect(result.value.length).toBe(3);
        for (const subscription of result.value) {
            expect(typeof subscription.subscriptionId).toBe("string");
            expect(typeof subscription.displayName).toBe("string");
            expect(typeof subscription.subscriptionTenantName).toBe("string");
            expect(subscription.subscriptionTenantId).toBe(tenantId);
        }
    });

    it("executes a service endpoint request", async () => {
        const result = await client.executeServiceEndpointRequest(request, "proj", "endpoint-id");
        expect(result.statusCode).toBe("OK");
        expect(result.errorMessage).toBe("");
        expect(result.callbackRequired).toBe(false);
        expect(result.callbackContextParameters).toEqual({});
        expect(typeof result.activityId).toBe("string");
        expect(result.result).toEqual(await client.queryServiceEndpoint(makeDataSourceBinding(), "proj"));
    });

    it("queries a service endpoint", async () => {
        const values = await client.queryServiceEndpoint(makeDataSourceBinding(), "proj");
        expect(values.length).toBe(3);
        for (const value of values) {
            expect(typeof value).toBe("string");
        }
    });

    it("creates a service endpoint echoing the posted object", async () => {
        const posted = { ...makeServiceEndpoint(), id: "new-id", name: "new-connection", type: "generic" };
        const created = await client.createServiceEndpoint(posted);
        expect(created).toEqual(posted);
    });

    it("fills the fields a partial create leaves out", async () => {
        const created = await client.createServiceEndpoint({ name: "partial-connection" } as ServiceEndpoint);
        expect(created.name).toBe("partial-connection");
        expect(typeof created.id).toBe("string");
        expect(created.isReady).toBe(true);
        expect(created.createdBy.displayName).toEqual(expect.any(String));
    });

    it("deletes a service endpoint", async () => {
        await expect(client.deleteServiceEndpoint("endpoint-id", ["proj-id"], true)).resolves.toBeUndefined();
    });

    it("gets service endpoints by type and owner", async () => {
        const [first] = await seeded();
        const found = await client.getServiceEndpointsByTypeAndOwner(first.type, first.owner);
        expect(found).toContain(first);
        for (const endpoint of found) {
            expect(endpoint.type).toBe(first.type);
            expect(endpoint.owner).toBe(first.owner);
        }
        expect(await client.getServiceEndpointsByTypeAndOwner(first.type, "nobody")).toEqual([]);
        expect(await client.getServiceEndpointsByTypeAndOwner("unknown-type", first.owner)).toEqual([]);
    });

    it("shares a service endpoint", async () => {
        await expect(
            client.shareServiceEndpoint([makeServiceEndpointProjectReference("shared")], "endpoint-id")
        ).resolves.toBeUndefined();
    });

    it("updates a known service endpoint", async () => {
        const [first] = await seeded();
        const updated = await client.updateServiceEndpoint(
            { description: "edited", id: "ignored" } as ServiceEndpoint,
            first.id,
            "refreshauthentication"
        );
        expect(updated.id).toBe(first.id);
        expect(updated.name).toBe(first.name);
        expect(updated.description).toBe("edited");
    });

    it("updates an unknown service endpoint", async () => {
        const updated = await client.updateServiceEndpoint({ name: "renamed" } as ServiceEndpoint, "missing-id");
        expect(updated.id).toBe("missing-id");
        expect(updated.name).toBe("renamed");
        expect(typeof updated.type).toBe("string");
    });

    it("updates several service endpoints", async () => {
        const updated = await client.updateServiceEndpoints([
            { id: "a", name: "first" } as ServiceEndpoint,
            { id: "b", name: "second" } as ServiceEndpoint
        ]);
        expect(updated.map(e => e.id)).toEqual(["a", "b"]);
        expect(updated.map(e => e.name)).toEqual(["first", "second"]);
        for (const endpoint of updated) {
            expect(typeof endpoint.url).toBe("string");
        }
    });

    it("gets the details of a known service endpoint", async () => {
        const [first] = await seeded();
        const details = await client.getServiceEndpointDetails("proj", first.id, ServiceEndpointActionFilter.Use, false);
        expect(details).toBe(first);
    });

    it("fabricates the details of an unknown service endpoint", async () => {
        const details = await client.getServiceEndpointDetails("proj", "missing-id");
        expect(details.id).toBe("missing-id");
        expect(details.name.endsWith("-connection")).toBe(true);
        expect(endpointKinds.map(k => k.name)).toContain(details.type);
    });

    it("lists the seeded service endpoints", async () => {
        const all = await seeded();
        expect(all).toEqual(serviceEndpoints);
        expect(all.length).toBe(5);
        expect(new Set(all.map(e => e.name)).size).toBe(5);
        expect(new Set(all.map(e => e.id)).size).toBe(5);
        for (const endpoint of all) {
            expect(endpoint.creationDate).toBeInstanceOf(Date);
            expect(endpoint.modificationDate).toBeInstanceOf(Date);
            expect(endpoint.serviceEndpointProjectReferences[0].name).toBe(endpoint.name);
            expect(Object.values(endpoint.authorization.parameters)).toEqual([SECRET_PLACEHOLDER]);
        }
    });

    it("filters service endpoints by type", async () => {
        const [first] = await seeded();
        const found = await client.getServiceEndpoints("proj", first.type);
        expect(found).toContain(first);
        expect(found.every(e => e.type === first.type)).toBe(true);
        expect(await client.getServiceEndpoints("proj", "unknown-type")).toEqual([]);
    });

    it("filters service endpoints by authorization scheme", async () => {
        const [first] = await seeded();
        const scheme = first.authorization.scheme;
        const found = await client.getServiceEndpoints("proj", undefined, [scheme]);
        expect(found).toContain(first);
        expect(found.every(e => e.authorization.scheme === scheme)).toBe(true);
        expect(await client.getServiceEndpoints("proj", undefined, ["Unknown"])).toEqual([]);
    });

    it("filters service endpoints by id", async () => {
        const [first, second] = await seeded();
        const found = await client.getServiceEndpoints("proj", undefined, undefined, [second.id, "missing-id"]);
        expect(found).toEqual([second]);
        expect(found).not.toContain(first);
    });

    it("filters service endpoints by owner", async () => {
        const all = await seeded();
        const found = await client.getServiceEndpoints(
            "proj",
            undefined,
            undefined,
            undefined,
            "library",
            true,
            true,
            ServiceEndpointActionFilter.Manage
        );
        expect(found).toEqual(all);
        expect(await client.getServiceEndpoints("proj", undefined, undefined, undefined, "nobody")).toEqual([]);
    });

    it("gets service endpoints by name, fabricating the unknown ones", async () => {
        const [first] = await seeded();
        const found = await client.getServiceEndpointsByNames("proj", [first.name, "missing-connection"]);
        expect(found.length).toBe(2);
        expect(found[0]).toBe(first);
        expect(found[1].name).toBe("missing-connection");
        expect(typeof found[1].id).toBe("string");
    });

    it("filters service endpoints found by name", async () => {
        const [first] = await seeded();
        const scheme = first.authorization.scheme;
        expect(
            await client.getServiceEndpointsByNames("proj", [first.name], first.type, [scheme], first.owner, false, false)
        ).toEqual([first]);
        expect(await client.getServiceEndpointsByNames("proj", [first.name], "unknown-type")).toEqual([]);
        expect(await client.getServiceEndpointsByNames("proj", [first.name], first.type, ["Unknown"])).toEqual([]);
        expect(await client.getServiceEndpointsByNames("proj", [first.name], first.type, [scheme], "nobody")).toEqual([]);
    });

    it("gets service endpoints with refreshed authentication", async () => {
        const [first] = await seeded();
        const found = await client.getServiceEndpointsWithRefreshedAuthentication(
            [{ endpointId: first.id, scope: [1], tokenValidityInMinutes: 5 }],
            "proj",
            [first.id, "missing-id"]
        );
        expect(found.length).toBe(2);
        expect(found[0]).toBe(first);
        expect(found[1].id).toBe("missing-id");
    });

    it("gets every execution record for an endpoint", async () => {
        const records = await client.getServiceEndpointExecutionRecords("proj", "endpoint-id");
        expect(records.length).toBe(5);
        expect(records.continuationToken).toBeNull();
        expect(new Set(records.map(r => r.data.id)).size).toBe(5);
        for (const record of records) {
            expect(record.endpointId).toBe("endpoint-id");
            expect(record.data.result).toBe(ServiceEndpointExecutionResult.Succeeded);
            expect(record.data.startTime).toBeInstanceOf(Date);
            expect(record.data.finishTime).toBeInstanceOf(Date);
            expect(typeof record.data.definition.name).toBe("string");
            expect(typeof record.data.owner.id).toBe("number");
        }
    });

    it("gets execution records limited by top", async () => {
        const all = await client.getServiceEndpointExecutionRecords("proj", "endpoint-id");
        const records = await client.getServiceEndpointExecutionRecords("proj", "endpoint-id", 2, 0);
        expect(records.length).toBe(2);
        expect(records.map(r => r.data)).toEqual(all.slice(0, 2).map(r => r.data));
    });

    it("adds execution records for every endpoint id", async () => {
        const data = makeExecutionData();
        const records = await client.addServiceEndpointExecutionRecords({ data, endpointIds: ["a", "b"] }, "proj");
        expect(records).toEqual([
            { endpointId: "a", data },
            { endpointId: "b", data }
        ]);
    });

    it("creates an oauth configuration echoing the parameters", async () => {
        const created = await client.createOAuthConfiguration(oauthParams);
        expect(created).toMatchObject(oauthParams);
        expect(typeof created.id).toBe("string");
        expect(created.createdOn).toBeInstanceOf(Date);
        expect(typeof created.createdBy.displayName).toBe("string");
    });

    it("lists oauth configurations", async () => {
        const configurations = await client.getOAuthConfigurations();
        expect(configurations.length).toBe(3);
        expect(new Set(configurations.map(c => c.name)).size).toBe(3);
        for (const configuration of configurations) {
            expect(configuration.clientSecret).toBe(SECRET_PLACEHOLDER);
            expect(configuration.modifiedOn).toBeInstanceOf(Date);
        }
    });

    it("filters oauth configurations by endpoint type", async () => {
        const configurations = await client.getOAuthConfigurations("bitbucket", OAuthConfigurationActionFilter.Use);
        expect(configurations.map(c => c.name)).toEqual(["bitbucket-oauth"]);
        expect(await client.getOAuthConfigurations("unknown-type")).toEqual([]);
    });

    it("gets a known oauth configuration", async () => {
        const [first] = await client.getOAuthConfigurations();
        expect(await client.getOAuthConfiguration(first.id)).toBe(first);
    });

    it("fabricates an unknown oauth configuration", async () => {
        const configuration = await client.getOAuthConfiguration("missing-id");
        expect(configuration.id).toBe("missing-id");
        expect(configuration.name.endsWith("-oauth")).toBe(true);
        expect(configuration.clientSecret).toBe(SECRET_PLACEHOLDER);
    });

    it("deletes an oauth configuration", async () => {
        const [first] = await client.getOAuthConfigurations();
        expect(await client.deleteOAuthConfiguration(first.id)).toBe(first);
        expect((await client.deleteOAuthConfiguration("missing-id")).id).toBe("missing-id");
    });

    it("updates an oauth configuration echoing the parameters", async () => {
        const [first] = await client.getOAuthConfigurations();
        const updated = await client.updateOAuthConfiguration(oauthParams, first.id);
        expect(updated).toMatchObject(oauthParams);
        expect(updated.id).toBe(first.id);
        expect(updated.createdBy).toBe(first.createdBy);
    });

    it("queries the projects an endpoint is shared with", async () => {
        const [first] = await seeded();
        const projects = await client.querySharedProjects(first.id, "proj");
        expect(projects).toEqual(first.serviceEndpointProjectReferences.map(r => r.projectReference));
        expect(projects.length).toBe(1);
        expect(typeof projects[0].id).toBe("string");
        expect(typeof projects[0].name).toBe("string");
    });

    it("shares an endpoint with a project", async () => {
        await expect(client.shareEndpointWithProject("endpoint-id", "from", "with")).resolves.toBeUndefined();
    });

    it("lists service endpoint types", async () => {
        const types = await client.getServiceEndpointTypes();
        expect(types.map(t => t.name)).toEqual(["azurerm", "github", "dockerregistry", "generic"]);
        for (const type of types) {
            const [scheme] = type.authenticationSchemes;
            expect(typeof type.displayName).toBe("string");
            expect(type.dataSources[0].name).toBe("TestConnection");
            expect(type.inputDescriptors[0].inputMode).toBe(InputMode.TextBox);
            expect(type.inputDescriptors[0].isConfidential).toBe(false);
            expect(scheme.inputDescriptors[0].inputMode).toBe(InputMode.PasswordBox);
            expect(scheme.inputDescriptors[0].isConfidential).toBe(true);
            expect(scheme.clientCertificates[0].value).toBe(SECRET_PLACEHOLDER);
            expect(scheme.dataSourceBindings[0].requestVerb).toBe("GET");
            expect(type.dependencyData[0].map[0].value[0].key).toBe("environmentUrl");
            expect(typeof type.endpointUrl.value).toBe("string");
            expect(typeof type.helpLink.url).toBe("string");
        }
    });

    it("filters service endpoint types by type and scheme", async () => {
        expect((await client.getServiceEndpointTypes("github")).map(t => t.name)).toEqual(["github"]);
        expect((await client.getServiceEndpointTypes(undefined, "UsernamePassword")).map(t => t.name)).toEqual([
            "dockerregistry",
            "generic"
        ]);
        expect((await client.getServiceEndpointTypes("generic", "UsernamePassword")).map(t => t.name)).toEqual([
            "generic"
        ]);
        expect(await client.getServiceEndpointTypes("github", "UsernamePassword")).toEqual([]);
        expect(await client.getServiceEndpointTypes("unknown-type")).toEqual([]);
    });

    it("gets filtered service endpoint types", async () => {
        const types = await client.getFilteredServiceEndpointTypes(["azurerm", "generic", "unknown-type"]);
        expect(types.map(t => t.name)).toEqual(["azurerm", "generic"]);
        expect(await client.getFilteredServiceEndpointTypes([])).toEqual([]);
    });

    it("creates an aad oauth request url", async () => {
        const url = await client.createAadOAuthRequest(
            "tenant-id",
            "https://example.com/callback?x=1",
            AadLoginPromptOption.SelectAccount,
            "payload",
            true
        );
        expect(url).toBe(
            "https://login.example.com/tenant-id/oauth2/authorize?redirect_uri=https%3A%2F%2Fexample.com%2Fcallback%3Fx%3D1"
        );
    });

    it("gets the aad tenant id", async () => {
        const tenantId = await client.getVstsAadTenantId();
        expect(tenantId).toMatch(/^[0-9a-f-]{36}$/);
        expect(await client.getVstsAadTenantId()).toBe(tenantId);
    });
});
