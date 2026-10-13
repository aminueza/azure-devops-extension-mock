import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import { ResourceUsageRestClient, Usage } from "azure-devops-extension-api/ResourceUsage";
import { limits, projectLimits } from "./Data";

export class MockResourceUsageRestClient extends RestClientBase {
    public TYPE = ResourceUsageRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getProjectLimit(_project: string): Promise<{ [key: string]: Usage }> {
        return Promise.resolve(projectLimits);
    }

    getLimits(): Promise<{ [key: string]: Usage }> {
        return Promise.resolve(limits);
    }
}
