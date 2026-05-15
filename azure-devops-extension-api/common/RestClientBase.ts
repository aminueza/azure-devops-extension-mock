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

export class RestClientBase {
    private _options: IVssRestClientOptions;
    private _rootPath: string;

    constructor(options: IVssRestClientOptions) {
        this._options = options;
        this._rootPath = "";
    }

    protected getRootPath(): Promise<string> {
        return Promise.resolve(this._rootPath);
    }

    protected beginRequest<T>(requestParams: RestClientRequestParams): Promise<T> {
        return Promise.resolve({} as T);
    }

    protected _issueRequest<T>(
        requestUrl: string,
        apiVersion: string,
        requestParams: RestClientRequestParams
    ): Promise<T> {
        return Promise.resolve({} as T);
    }
}
