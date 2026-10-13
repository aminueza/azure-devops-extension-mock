import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    ContributionNodeQuery,
    ContributionNodeQueryResult,
    ContributionsRestClient,
    DataProviderQuery,
    DataProviderResult,
    ExtensionStateFlags,
    InstalledExtension
} from "azure-devops-extension-api/Contributions";
import {
    installedExtensions,
    makeClientContribution,
    makeClientContributionNode,
    makeClientContributionProviderDetails,
    makeContributionNodeQueryResult,
    makeDataProviderResult,
    makeInstalledExtension,
    makeResolvedDataProvider
} from "./Data";

const providerOf = (contributionId: string): string => contributionId.split(".").slice(0, 2).join(".");

const findInstalled = (publisherName: string, extensionName: string): InstalledExtension =>
    installedExtensions.find(e => e.publisherId === publisherName && e.extensionId === extensionName) ?? {
        ...makeInstalledExtension(),
        publisherId: publisherName,
        extensionId: extensionName
    };

export class MockContributionsRestClient extends RestClientBase {
    public TYPE = ContributionsRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    queryContributionNodes(query: ContributionNodeQuery): Promise<ContributionNodeQueryResult> {
        const providers = query.includeProviderDetails ? [...new Set(query.contributionIds.map(providerOf))] : [];
        return Promise.resolve({
            ...makeContributionNodeQueryResult(),
            nodes: Object.fromEntries(
                query.contributionIds.map(id => [id, makeClientContributionNode({ ...makeClientContribution(), id })])
            ),
            providerDetails: Object.fromEntries(
                providers.map(name => [name, { ...makeClientContributionProviderDetails(), name }])
            )
        });
    }

    queryDataProviders(query: DataProviderQuery, scopeName?: string, scopeValue?: string): Promise<DataProviderResult> {
        const result = makeDataProviderResult();
        return Promise.resolve({
            ...result,
            data: Object.fromEntries(query.contributionIds.map(id => [id, {}])),
            resolvedProviders: query.contributionIds.map(id => ({ ...makeResolvedDataProvider(), id })),
            scopeName: scopeName ?? result.scopeName,
            scopeValue: scopeValue ?? result.scopeValue
        });
    }

    getInstalledExtensions(
        contributionIds?: string[],
        includeDisabledApps?: boolean,
        _assetTypes?: string[]
    ): Promise<InstalledExtension[]> {
        return Promise.resolve(
            installedExtensions
                .filter(e => includeDisabledApps === true || (e.installState.flags & ExtensionStateFlags.Disabled) === 0)
                .filter(
                    e => contributionIds === undefined || e.contributions.some(c => contributionIds.includes(c.id))
                )
        );
    }

    getInstalledExtensionByName(
        publisherName: string,
        extensionName: string,
        _assetTypes?: string[]
    ): Promise<InstalledExtension> {
        return Promise.resolve(findInstalled(publisherName, extensionName));
    }
}
