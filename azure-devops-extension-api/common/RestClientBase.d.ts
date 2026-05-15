import { IVssRestClientOptions } from "azure-devops-extension-api/Common";

export interface RestClientRequestParams {
    routeTemplate: string;
    apiVersion: string;
    routeValues?: { [key: string]: any };
    body?: any;
    queryParams?: { [key: string]: any };
    method?: string;
    httpResponseType?: string;
    customHeaders?: { [headerName: string]: any };
    returnRawResponse?: boolean;
    isRawData?: boolean;
    command?: string;
}

export declare class RestClientBase {
    private _options;
    private _rootPath;
    constructor(options: IVssRestClientOptions);
    protected getRootPath(): Promise<string>;
    protected beginRequest<T>(requestParams: RestClientRequestParams): Promise<T>;
    protected _issueRequest<T>(requestUrl: string, apiVersion: string, requestParams: RestClientRequestParams): Promise<T>;
}
