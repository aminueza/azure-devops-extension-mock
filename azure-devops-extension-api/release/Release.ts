import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    ReleaseRestClient,
    Release,
    ReleaseDefinition,
    ReleaseEnvironment,
    Deployment,
    ReleaseApproval,
    ReleaseEnvironmentUpdateMetadata,
    ReleaseStartMetadata
} from "azure-devops-extension-api/Release";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    approvals,
    approvalsPage,
    deployments,
    deploymentsPage,
    makeApproval,
    makeDeployment,
    makeEnvironment,
    makeRelease,
    makeReleaseDefinition,
    releaseDefinitions,
    releaseDefinitionsPage,
    releases
} from "./Data";

/**
 * Mocked ReleaseRestClient — release definitions, releases, deployments, approvals.
 */
export class MockReleaseRestClient extends RestClientBase {
    public TYPE = ReleaseRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    // Release Definitions
    getReleaseDefinitions(_project: string): Promise<PagedList<ReleaseDefinition>> {
        return Promise.resolve(releaseDefinitionsPage);
    }

    getReleaseDefinition(_project: string, definitionId: number): Promise<ReleaseDefinition> {
        const found = releaseDefinitions.find(d => d.id === definitionId);
        return Promise.resolve(found ?? { ...makeReleaseDefinition(), id: definitionId });
    }

    createReleaseDefinition(
        releaseDefinition: ReleaseDefinition,
        _project: string
    ): Promise<ReleaseDefinition> {
        return Promise.resolve({ ...makeReleaseDefinition(), ...releaseDefinition });
    }

    updateReleaseDefinition(
        releaseDefinition: ReleaseDefinition,
        _project: string
    ): Promise<ReleaseDefinition> {
        return Promise.resolve({ ...makeReleaseDefinition(), ...releaseDefinition });
    }

    deleteReleaseDefinition(_project: string, _definitionId: number): Promise<void> {
        return Promise.resolve();
    }

    // Releases
    getReleases(_project?: string): Promise<PagedList<Release>> {
        return Promise.resolve(
            Object.assign([...releases], { continuationToken: "" }) as unknown as PagedList<Release>
        );
    }

    getRelease(_project: string, releaseId: number): Promise<Release> {
        const found = releases.find(r => r.id === releaseId);
        return Promise.resolve(found ?? { ...makeRelease(), id: releaseId });
    }

    createRelease(releaseStartMetadata: ReleaseStartMetadata, _project: string): Promise<Release> {
        const release = makeRelease();
        return Promise.resolve({
            ...release,
            description: releaseStartMetadata.description ?? release.description,
            releaseDefinition: {
                ...release.releaseDefinition,
                id: releaseStartMetadata.definitionId ?? release.releaseDefinition.id
            }
        });
    }

    updateRelease(release: Release, _project: string, releaseId: number): Promise<Release> {
        return Promise.resolve({ ...makeRelease(), ...release, id: releaseId });
    }

    // Environments
    getReleaseEnvironment(
        _project: string,
        _releaseId: number,
        environmentId: number
    ): Promise<ReleaseEnvironment> {
        return Promise.resolve({ ...makeEnvironment(), id: environmentId });
    }

    updateReleaseEnvironment(
        _environmentUpdateData: ReleaseEnvironmentUpdateMetadata,
        _project: string,
        _releaseId: number,
        environmentId: number
    ): Promise<ReleaseEnvironment> {
        return Promise.resolve({ ...makeEnvironment(), id: environmentId });
    }

    // Deployments
    getDeployments(_project: string): Promise<PagedList<Deployment>> {
        return Promise.resolve(deploymentsPage);
    }

    // Approvals
    getApprovals(_project: string): Promise<PagedList<ReleaseApproval>> {
        return Promise.resolve(approvalsPage);
    }

    getApproval(_project: string, approvalId: number): Promise<ReleaseApproval> {
        const found = approvals.find(a => a.id === approvalId);
        return Promise.resolve(found ?? { ...makeApproval(), id: approvalId });
    }

    updateReleaseApproval(
        approval: ReleaseApproval,
        _project: string,
        approvalId: number
    ): Promise<ReleaseApproval> {
        return Promise.resolve({ ...makeApproval(), ...approval, id: approvalId });
    }
}
