import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    Alert,
    AlertAnalysisInstance,
    AlertBatchRequest,
    AlertListExpandOption,
    AlertMetadata,
    AlertMetadataBatchRequest,
    AlertMetadataChange,
    AlertRestClient,
    AlertStateUpdate,
    AlertType,
    AlertValidationRequestStatus,
    AutofixCallbackRequest,
    AutofixRequest,
    Branch,
    ExpandOption,
    LegalReview,
    MetadataChangeType,
    MetadataOperation,
    SarifUploadStatus,
    SearchCriteria,
    State,
    UxFilters,
    ValidationRequestInfo
} from "azure-devops-extension-api/Alert";
import { PagedList } from "azure-devops-extension-api/WebApi";
import { fake } from "../common/fixtures";
import {
    AlertJob,
    alertInstances,
    alerts,
    alertsMetadata,
    autofixRequests,
    branches,
    draftAlerts,
    jobs,
    makeAlertJob,
    makeAlertMetadata,
    makeAutofixRequest,
    makeBuffer,
    makeCodeAlert,
    makeDismissal,
    makeLegalReview,
    makeSarif,
    makeValidationRequestInfo,
    sarifUploadStatus,
    uxFilters
} from "./Data";

const findAlert = (alertId: number): Alert =>
    [...alerts, ...draftAlerts].find(a => a.alertId === alertId) ?? { ...makeCodeAlert(), alertId };

const findJob = (jobId: string): AlertJob => jobs.find(j => j.jobId === jobId) ?? { ...makeAlertJob(), jobId };

const findMetadata = (alertId: number): AlertMetadata =>
    alertsMetadata.find(m => m.alertId === alertId) ?? makeAlertMetadata(alertId);

const page = <T>(items: T[], top?: number): PagedList<T> =>
    Object.assign(items.slice(0, top ?? items.length), { continuationToken: null });

const wanted = <T>(values: T[] | undefined, value: T): boolean =>
    values === undefined || values.length === 0 || values.includes(value);

const applyState = (alert: Alert, update: AlertStateUpdate): Alert => ({
    ...alert,
    state: update.state,
    dismissal:
        update.state === State.Dismissed
            ? { ...makeDismissal(), dismissalType: update.dismissedReason, message: update.dismissedComment }
            : fake.helpers.absent()
});

const withoutSensitiveInformation = (alert: Alert): Alert => ({
    ...alert,
    validationFingerprints: alert.validationFingerprints.map(fingerprint => ({
        ...fingerprint,
        validationFingerprintJson: fake.helpers.absent()
    }))
});

const changeTypes: { [operation: number]: MetadataChangeType } = {
    [MetadataOperation.None]: MetadataChangeType.None,
    [MetadataOperation.Add]: MetadataChangeType.Created,
    [MetadataOperation.Remove]: MetadataChangeType.Deleted
};

export class MockAlertRestClient extends RestClientBase {
    public TYPE = AlertRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getAiMetadataContent(_project: string, alertId: number, _repository: string): Promise<any> {
        return Promise.resolve(makeBuffer(JSON.stringify({ alertId, title: findAlert(alertId).title })));
    }

    getSarifContent(_submissionId: number): Promise<any> {
        return Promise.resolve(makeBuffer(makeSarif(alerts)));
    }

    getJobsForAlert(
        _project: string,
        _repository: string,
        alertId: number,
        top?: number,
        _continuationToken?: string
    ): Promise<PagedList<AlertJob>> {
        return Promise.resolve(
            page(
                jobs.filter(j => j.alertIds.includes(alertId)),
                top
            )
        );
    }

    getAlert(
        _project: string,
        alertId: number,
        _repository: string,
        _ref?: string,
        _expand?: ExpandOption
    ): Promise<Alert> {
        return Promise.resolve(findAlert(alertId));
    }

    getAlerts(
        _project: string,
        _repository: string,
        top?: number,
        _orderBy?: string,
        criteria?: SearchCriteria,
        _expand?: AlertListExpandOption,
        _continuationToken?: string
    ): Promise<PagedList<Alert>> {
        const matching = alerts.filter(
            a =>
                (criteria?.alertType === undefined || a.alertType === criteria.alertType) &&
                wanted(criteria?.alertIds, a.alertId) &&
                wanted(criteria?.states, a.state) &&
                wanted(criteria?.severities, a.severity)
        );
        return Promise.resolve(page(matching, top));
    }

    getAlertSarif(
        _project: string,
        alertId: number,
        _repository: string,
        _ref?: string,
        _expand?: ExpandOption
    ): Promise<string> {
        return Promise.resolve(makeSarif([findAlert(alertId)]));
    }

    updateAlert(stateUpdate: AlertStateUpdate, _project: string, alertId: number, _repository: string): Promise<Alert> {
        return Promise.resolve(applyState(findAlert(alertId), stateUpdate));
    }

    getAlertsByIds(
        request: AlertBatchRequest,
        _project: string,
        _repository: string,
        includeSensitiveInformation?: boolean
    ): Promise<Alert[]> {
        const found = request.alertIds.map(findAlert);
        return Promise.resolve(includeSensitiveInformation === true ? found : found.map(withoutSensitiveInformation));
    }

    updateAlertsBatch(
        request: { alertStateUpdateList: Array<AlertStateUpdate & { alertId: number }>; alertType: AlertType },
        _project: string,
        _repository: string
    ): Promise<Alert[]> {
        return Promise.resolve(
            request.alertStateUpdateList.map(update => applyState(findAlert(update.alertId), update))
        );
    }

    queryAlerts(
        criteria: { metadataTypeFilters: { [key: string]: boolean } },
        _project: string,
        _repository: string,
        top?: number,
        _orderBy?: string,
        _expand?: AlertListExpandOption,
        _continuationToken?: string
    ): Promise<PagedList<Alert>> {
        const filters = Object.entries(criteria.metadataTypeFilters);
        const matching = alerts.filter(a =>
            filters.every(([type, linked]) => a.relations.some(r => r.rel === type) === linked)
        );
        return Promise.resolve(page(matching, top));
    }

    getBranches(
        _project: string,
        _repository: string,
        _alertType: AlertType,
        _continuationToken?: string,
        branchNameContains?: string,
        top?: number,
        includePullRequestBranches?: boolean
    ): Promise<Branch[]> {
        const matching = branches.filter(
            b =>
                (includePullRequestBranches === true || !b.name.startsWith("refs/pull/")) &&
                b.name.includes(branchNameContains ?? "")
        );
        return Promise.resolve(matching.slice(0, top ?? matching.length));
    }

    getUxFilters(_project: string, _repository: string, _alertType: AlertType): Promise<UxFilters> {
        return Promise.resolve(uxFilters);
    }

    createAutofixRequest(
        _project: string,
        _alertId: number,
        _repository: string,
        _ref?: string
    ): Promise<AutofixRequest> {
        return Promise.resolve(makeAutofixRequest());
    }

    getAutofixRequestsByAlertId(
        _project: string,
        _alertId: number,
        _repository: string,
        _ref?: string
    ): Promise<AutofixRequest[]> {
        return Promise.resolve(autofixRequests);
    }

    autofixCallback(
        _callbackRequest: AutofixCallbackRequest,
        _project: string,
        _repository: string,
        _alertId?: number
    ): Promise<void> {
        return Promise.resolve();
    }

    getDraftAlerts(
        _project: string,
        _repository: string,
        top?: number,
        _orderBy?: string,
        _continuationToken?: string
    ): Promise<PagedList<Alert>> {
        return Promise.resolve(page(draftAlerts, top));
    }

    uploadSarifToGitHub(
        _content: string,
        _project: string,
        hostname: string,
        owner: string,
        repo: string
    ): Promise<string> {
        return Promise.resolve(`https://${hostname}/${owner}/${repo}/code-scanning/analyses/${fake.number.id()}`);
    }

    getAlertInstances(
        _project: string,
        _alertId: number,
        _repository: string,
        _ref?: string
    ): Promise<AlertAnalysisInstance[]> {
        return Promise.resolve(alertInstances);
    }

    createJob(body: any, _project: string, _repository: string): Promise<AlertJob> {
        return Promise.resolve({ ...makeAlertJob(), ...body });
    }

    getJob(_project: string, _repository: string, jobId: string): Promise<AlertJob> {
        return Promise.resolve(findJob(jobId));
    }

    updateJob(patch: any, _project: string, _repository: string, jobId: string): Promise<AlertJob> {
        return Promise.resolve({ ...findJob(jobId), ...patch, jobId });
    }

    createLegalReview(_project: string, _repository: string, _alertId: number, _ref?: string): Promise<LegalReview> {
        return Promise.resolve(makeLegalReview());
    }

    updateAlertsMetadata(
        posted: AlertMetadata[],
        _project: string,
        _repository: string
    ): Promise<AlertMetadataChange[]> {
        return Promise.resolve(
            posted.flatMap(({ alertId, metadata }) =>
                metadata.map(({ op, value }) => ({ alertId, metadataChange: { changeType: changeTypes[op], value } }))
            )
        );
    }

    getAlertMetadata(_project: string, alertId: number, _repository: string): Promise<AlertMetadata> {
        return Promise.resolve(findMetadata(alertId));
    }

    getAlertMetadataBatch(
        alertMetadataBatchRequest: AlertMetadataBatchRequest,
        _project: string,
        _repository: string
    ): Promise<AlertMetadata[]> {
        return Promise.resolve(alertMetadataBatchRequest.alertIds.map(findMetadata));
    }

    getOrgLevelAlertsByIds(alertIds: number[]): Promise<Alert[]> {
        return Promise.resolve(alertIds.map(findAlert));
    }

    deleteAllPipelineAnalyses(_project: string, _repository: string): Promise<void> {
        return Promise.resolve();
    }

    deletePipelineAnalysis(_project: string, _repository: string, _adoPipelineId: number): Promise<void> {
        return Promise.resolve();
    }

    exportSarif(_project: string, _repository: string, alertIds: number[], _branchName?: string): Promise<any> {
        return Promise.resolve(makeBuffer(makeSarif(alertIds.map(findAlert))));
    }

    uploadSarif(_content: string, _project: string, _repository: string, _notificationFlag?: string): Promise<number> {
        return Promise.resolve(fake.number.id());
    }

    getSarif(_sarifId: number): Promise<SarifUploadStatus> {
        return Promise.resolve(sarifUploadStatus);
    }

    uploadOrgSarif(_content: string): Promise<number> {
        return Promise.resolve(fake.number.id());
    }

    getValidityData(_project: string, _repository: string, alertId: number): Promise<ValidationRequestInfo> {
        return Promise.resolve(makeValidationRequestInfo(findAlert(alertId).validityDetails));
    }

    initiateValidation(_project: string, _repository: string, _alertId: number): Promise<AlertValidationRequestStatus> {
        return Promise.resolve(AlertValidationRequestStatus.Created);
    }
}
