import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    ConnectionData,
    LocationsRestClient,
    ResourceAreaInfo,
    ServiceDefinition
} from "azure-devops-extension-api/Locations";
import { ConnectOptions, VssJsonCollectionWrapperV } from "azure-devops-extension-api/WebApi";
import { connectionData, makeResourceAreaInfo, makeServiceDefinition, resourceAreas, serviceDefinitions } from "./Data";

const findResourceArea = (areaId: string): ResourceAreaInfo =>
    resourceAreas.find(a => a.id === areaId) ?? { ...makeResourceAreaInfo(), id: areaId };

const withServices = (connectOptions?: ConnectOptions): boolean =>
    ((connectOptions ?? ConnectOptions.None) & ConnectOptions.IncludeServices) !== 0;

export class MockLocationsRestClient extends RestClientBase {
    public TYPE = LocationsRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getConnectionData(
        connectOptions?: ConnectOptions,
        _lastChangeId?: number,
        _lastChangeId64?: number
    ): Promise<ConnectionData> {
        return Promise.resolve(
            withServices(connectOptions)
                ? connectionData
                : {
                      ...connectionData,
                      locationServiceData: {
                          ...connectionData.locationServiceData,
                          accessMappings: [],
                          serviceDefinitions: []
                      }
                  }
        );
    }

    getResourceArea(
        areaId: string,
        _enterpriseName?: string,
        _organizationName?: string,
        _accessMapping?: string
    ): Promise<ResourceAreaInfo> {
        return Promise.resolve(findResourceArea(areaId));
    }

    getResourceAreaByHost(areaId: string, _hostId: string, _accessMapping?: string): Promise<ResourceAreaInfo> {
        return Promise.resolve(findResourceArea(areaId));
    }

    getResourceAreaByInstanceId(
        areaId: string,
        _instanceId: string,
        _accessMapping: string
    ): Promise<ResourceAreaInfo> {
        return Promise.resolve(findResourceArea(areaId));
    }

    getResourceAreas(_enterpriseName?: string, _organizationName?: string): Promise<ResourceAreaInfo[]> {
        return Promise.resolve(resourceAreas);
    }

    getResourceAreasByHost(_hostId: string): Promise<ResourceAreaInfo[]> {
        return Promise.resolve(resourceAreas);
    }

    deleteServiceDefinition(_serviceType: string, _identifier: string): Promise<void> {
        return Promise.resolve();
    }

    getServiceDefinition(
        serviceType: string,
        identifier: string,
        _allowFaultIn?: boolean,
        _previewFaultIn?: boolean
    ): Promise<ServiceDefinition> {
        return Promise.resolve(
            serviceDefinitions.find(d => d.serviceType === serviceType && d.identifier === identifier) ?? {
                ...makeServiceDefinition(),
                serviceType,
                identifier
            }
        );
    }

    getServiceDefinitions(serviceType?: string): Promise<ServiceDefinition[]> {
        return Promise.resolve(
            serviceDefinitions.filter(d => serviceType === undefined || d.serviceType === serviceType)
        );
    }

    updateServiceDefinitions(_serviceDefinitions: VssJsonCollectionWrapperV<ServiceDefinition[]>): Promise<void> {
        return Promise.resolve();
    }
}
