import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    PolicyConfiguration,
    PolicyEvaluationRecord,
    PolicyEvaluationStatus,
    PolicyRestClient,
    PolicyType
} from "azure-devops-extension-api/Policy";
import { PagedList } from "azure-devops-extension-api/WebApi";
import {
    configurationRevisions,
    configurations,
    evaluations,
    makePolicyConfiguration,
    makePolicyConfigurationRevisions,
    makePolicyEvaluationRecord,
    makePolicyType,
    policyTypes
} from "./Data";

const findType = (typeId: string): PolicyType =>
    policyTypes.find(t => t.id === typeId) ?? { ...makePolicyType(), id: typeId };

const findConfiguration = (configurationId: number): PolicyConfiguration =>
    configurations.find(c => c.id === configurationId) ?? { ...makePolicyConfiguration(), id: configurationId };

const findRevisions = (configurationId: number): PolicyConfiguration[] => {
    const known = configurationRevisions.filter(r => r.id === configurationId);
    return known.length > 0 ? known : makePolicyConfigurationRevisions(findConfiguration(configurationId));
};

const findEvaluation = (evaluationId: string): PolicyEvaluationRecord =>
    evaluations.find(e => e.evaluationId === evaluationId) ?? { ...makePolicyEvaluationRecord(), evaluationId };

export class MockPolicyRestClient extends RestClientBase {
    public TYPE = PolicyRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createPolicyConfiguration(configuration: PolicyConfiguration, _project: string): Promise<PolicyConfiguration> {
        return Promise.resolve({ ...makePolicyConfiguration(), ...configuration });
    }

    deletePolicyConfiguration(_project: string, _configurationId: number): Promise<void> {
        return Promise.resolve();
    }

    getPolicyConfiguration(_project: string, configurationId: number): Promise<PolicyConfiguration> {
        return Promise.resolve(findConfiguration(configurationId));
    }

    getPolicyConfigurations(
        _project: string,
        _scope?: string,
        policyType?: string
    ): Promise<PagedList<PolicyConfiguration>> {
        const matching = configurations.filter(c => policyType === undefined || c.type.id === policyType);
        const paged: PagedList<PolicyConfiguration> = Object.assign(matching, { continuationToken: null });
        return Promise.resolve(paged);
    }

    updatePolicyConfiguration(
        configuration: PolicyConfiguration,
        _project: string,
        configurationId: number
    ): Promise<PolicyConfiguration> {
        return Promise.resolve({ ...findConfiguration(configurationId), ...configuration, id: configurationId });
    }

    getPolicyEvaluation(_project: string, evaluationId: string): Promise<PolicyEvaluationRecord> {
        return Promise.resolve(findEvaluation(evaluationId));
    }

    requeuePolicyEvaluation(_project: string, evaluationId: string): Promise<PolicyEvaluationRecord> {
        return Promise.resolve({ ...findEvaluation(evaluationId), status: PolicyEvaluationStatus.Queued });
    }

    getPolicyEvaluations(
        _project: string,
        artifactId: string,
        includeNotApplicable?: boolean,
        top?: number,
        skip?: number
    ): Promise<PolicyEvaluationRecord[]> {
        const start = skip ?? 0;
        return Promise.resolve(
            evaluations
                .filter(e => includeNotApplicable === true || e.status !== PolicyEvaluationStatus.NotApplicable)
                .slice(start, start + (top ?? 100))
                .map(e => ({ ...e, artifactId }))
        );
    }

    getPolicyConfigurationRevision(
        _project: string,
        configurationId: number,
        revisionId: number
    ): Promise<PolicyConfiguration> {
        return Promise.resolve(
            findRevisions(configurationId).find(r => r.revision === revisionId) ?? {
                ...findConfiguration(configurationId),
                revision: revisionId
            }
        );
    }

    getPolicyConfigurationRevisions(
        _project: string,
        configurationId: number,
        top?: number,
        skip?: number
    ): Promise<PolicyConfiguration[]> {
        const start = skip ?? 0;
        return Promise.resolve(findRevisions(configurationId).slice(start, start + (top ?? 100)));
    }

    getPolicyType(_project: string, typeId: string): Promise<PolicyType> {
        return Promise.resolve(findType(typeId));
    }

    getPolicyTypes(_project: string): Promise<PolicyType[]> {
        return Promise.resolve(policyTypes);
    }
}
