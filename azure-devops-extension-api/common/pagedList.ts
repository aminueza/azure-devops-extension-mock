import { PagedList } from "azure-devops-extension-api/WebApi";

export const makePagedList = <T>(items: T[]): PagedList<T> =>
    Object.assign([...items], { continuationToken: "" });
