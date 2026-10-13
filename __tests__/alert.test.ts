import {
    AlertBatchStateUpdateRequest,
    AlertMetadata,
    AlertMetadataErrorPolicy,
    AlertRestClient,
    AlertStateUpdate,
    AlertType,
    AlertValidationRequestStatus,
    AlertValidityStatus,
    AutofixCallbackRequest,
    AutofixCallbackStatus,
    AutofixRequestStatus,
    DismissalType,
    MetadataChangeType,
    MetadataOperation,
    SarifJobStatus,
    SearchCriteria,
    Severity,
    State
} from "azure-devops-extension-api/Alert";
import { getClient, getRegisteredMockClient, MockAlertRestClient } from "../azure-devops-extension-api";
import {
    alertInstances,
    alerts,
    alertsMetadata,
    autofixRequests,
    branches,
    draftAlerts,
    jobs,
    makeRelationMetadata,
    SECRET_PLACEHOLDER,
    sarifUploadStatus,
    uxFilters
} from "../azure-devops-extension-api/alert/Data";

const decode = (buffer: ArrayBuffer): any => JSON.parse(new TextDecoder().decode(buffer));

const criteria = (partial: Partial<SearchCriteria>): SearchCriteria => partial as SearchCriteria;

describe("AlertRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(AlertRestClient);
    const [dependency, dismissed, secret, code, fixed] = alerts;

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(AlertRestClient)).toBe(MockAlertRestClient);
    });

    it("downloads the AI metadata of an alert", async () => {
        const content = decode(await client.getAiMetadataContent("proj", code.alertId, "repo"));
        expect(content).toEqual({ alertId: code.alertId, title: code.title });
    });

    it("downloads the SARIF of a submission", async () => {
        const sarif = decode(await client.getSarifContent(7));
        expect(sarif.version).toBe("2.1.0");
        expect(sarif.runs[0].results.map((r: any) => r.properties.alertId)).toEqual(alerts.map(a => a.alertId));
    });

    it("lists the jobs of an alert", async () => {
        const list = await client.getJobsForAlert("proj", "repo", code.alertId);
        expect([...list]).toEqual([jobs[0], jobs[1]]);
        expect(list.continuationToken).toBeNull();
    });

    it("limits the jobs of an alert with top", async () => {
        const list = await client.getJobsForAlert("proj", "repo", fixed.alertId, 1, "token");
        expect([...list]).toEqual([jobs[1]]);
    });

    it("lists no job for an alert without jobs", async () => {
        const list = await client.getJobsForAlert("proj", "repo", 999_999);
        expect(list.length).toBe(0);
        expect(list.continuationToken).toBeNull();
    });

    it("gets a known alert", async () => {
        expect(await client.getAlert("proj", secret.alertId, "repo")).toBe(secret);
    });

    it("gets a known draft alert", async () => {
        expect(await client.getAlert("proj", draftAlerts[0].alertId, "repo", "refs/heads/main")).toBe(draftAlerts[0]);
    });

    it("fabricates an unknown alert", async () => {
        const made = await client.getAlert("proj", 999_999, "repo");
        expect(made.alertId).toBe(999_999);
        expect(made.alertType).toBe(AlertType.Code);
        expect(made.state).toBe(State.Active);
        expect(made.dismissal).toBeUndefined();
        expect(made.truncatedSecret).toBeUndefined();
    });

    it("lists every alert", async () => {
        const list = await client.getAlerts("proj", "repo");
        expect([...list]).toEqual(alerts);
        expect(list.continuationToken).toBeNull();
        expect(new Set(list.map(a => a.alertId)).size).toBe(5);
        expect(list.map(a => a.alertType)).toEqual([
            AlertType.Dependency,
            AlertType.Dependency,
            AlertType.Secret,
            AlertType.Code,
            AlertType.Code
        ]);
    });

    it("limits the alerts with top", async () => {
        const list = await client.getAlerts("proj", "repo", 2);
        expect([...list]).toEqual([dependency, dismissed]);
    });

    it("lists every alert for empty criteria", async () => {
        const list = await client.getAlerts("proj", "repo", undefined, "id", criteria({ states: [], severities: [] }));
        expect(list.length).toBe(5);
    });

    it("filters the alerts by type", async () => {
        const list = await client.getAlerts(
            "proj",
            "repo",
            undefined,
            undefined,
            criteria({ alertType: AlertType.Code })
        );
        expect([...list]).toEqual([code, fixed]);
    });

    it("filters the alerts by id", async () => {
        const list = await client.getAlerts(
            "proj",
            "repo",
            undefined,
            undefined,
            criteria({ alertIds: [secret.alertId, fixed.alertId] })
        );
        expect([...list]).toEqual([secret, fixed]);
    });

    it("filters the alerts by state", async () => {
        const list = await client.getAlerts(
            "proj",
            "repo",
            undefined,
            undefined,
            criteria({ states: [State.Dismissed, State.Fixed] })
        );
        expect([...list]).toEqual([dismissed, fixed]);
    });

    it("filters the alerts by severity", async () => {
        const list = await client.getAlerts(
            "proj",
            "repo",
            undefined,
            undefined,
            criteria({ alertType: AlertType.Dependency, severities: [Severity.Critical] })
        );
        expect([...list]).toEqual([dependency]);
    });

    it("gets the SARIF of a single alert", async () => {
        const sarif = JSON.parse(await client.getAlertSarif("proj", code.alertId, "repo"));
        expect(sarif.runs[0].results).toEqual([
            {
                ruleId: code.tools[0].rules[0].opaqueId,
                message: { text: code.title },
                properties: { alertId: code.alertId }
            }
        ]);
    });

    it("dismisses a known alert", async () => {
        const update: AlertStateUpdate = {
            state: State.Dismissed,
            dismissedReason: DismissalType.FalsePositive,
            dismissedComment: "not reachable"
        };
        const updated = await client.updateAlert(update, "proj", dependency.alertId, "repo");
        expect(updated.alertId).toBe(dependency.alertId);
        expect(updated.state).toBe(State.Dismissed);
        expect(updated.dismissal.dismissalType).toBe(DismissalType.FalsePositive);
        expect(updated.dismissal.message).toBe("not reachable");
        expect(typeof updated.dismissal.stateChangedByIdentity.displayName).toBe("string");
        expect(updated.title).toBe(dependency.title);
        expect(dependency.state).toBe(State.Active);
    });

    it("reactivates a dismissed alert", async () => {
        const update = { state: State.Active } as AlertStateUpdate;
        const updated = await client.updateAlert(update, "proj", dismissed.alertId, "repo");
        expect(updated.state).toBe(State.Active);
        expect(updated.dismissal).toBeUndefined();
        expect(dismissed.state).toBe(State.Dismissed);
        expect(dismissed.dismissal).toBeDefined();
    });

    it("updates an unknown alert", async () => {
        const updated = await client.updateAlert({ state: State.Active } as AlertStateUpdate, "proj", 888_888, "repo");
        expect(updated.alertId).toBe(888_888);
        expect(updated.state).toBe(State.Active);
    });

    it("gets alerts by id without sensitive information", async () => {
        const found = await client.getAlertsByIds(
            { alertIds: [secret.alertId, code.alertId, 777_777], alertType: AlertType.Unknown },
            "proj",
            "repo"
        );
        expect(found.map(a => a.alertId)).toEqual([secret.alertId, code.alertId, 777_777]);
        expect(found[0].validationFingerprints.length).toBe(1);
        expect(found[0].validationFingerprints[0].validationFingerprintJson).toBeUndefined();
        expect(found[0].validationFingerprints[0].validationFingerprintHash).toBe(
            secret.validationFingerprints[0].validationFingerprintHash
        );
        expect(found[0].truncatedSecret).toBe(SECRET_PLACEHOLDER);
        expect(found[1].validationFingerprints).toEqual([]);
    });

    it("leaves out sensitive information when asked to", async () => {
        const found = await client.getAlertsByIds(
            { alertIds: [secret.alertId], alertType: AlertType.Secret },
            "proj",
            "repo",
            false
        );
        expect(found[0].validationFingerprints[0].validationFingerprintJson).toBeUndefined();
    });

    it("gets alerts by id with placeholder sensitive information", async () => {
        const found = await client.getAlertsByIds(
            { alertIds: [secret.alertId], alertType: AlertType.Secret },
            "proj",
            "repo",
            true
        );
        expect(found).toEqual([secret]);
        expect(found[0].validationFingerprints[0].validationFingerprintJson).toBe(SECRET_PLACEHOLDER);
    });

    it("updates alert states in a batch", async () => {
        const request: AlertBatchStateUpdateRequest = {
            alertType: AlertType.Code,
            alertStateUpdateList: [
                {
                    alertId: draftAlerts[0].alertId,
                    state: State.Active,
                    dismissedReason: DismissalType.Unknown,
                    dismissedComment: ""
                },
                {
                    alertId: 666_666,
                    state: State.Dismissed,
                    dismissedReason: DismissalType.FalsePositive,
                    dismissedComment: "Dismissed by AI scan validation"
                }
            ]
        };
        const updated = await client.updateAlertsBatch(request, "proj", "repo");
        expect(updated.map(a => a.alertId)).toEqual([draftAlerts[0].alertId, 666_666]);
        expect(updated[0].state).toBe(State.Active);
        expect(updated[0].dismissal).toBeUndefined();
        expect(updated[1].state).toBe(State.Dismissed);
        expect(updated[1].dismissal.message).toBe("Dismissed by AI scan validation");
        expect(draftAlerts[0].state).toBe(State.Draft);
    });

    it("queries the alerts linked to a metadata type", async () => {
        const list = await client.queryAlerts({ metadataTypeFilters: { WorkItem: true } }, "proj", "repo");
        expect([...list]).toEqual([code]);
        expect(list.continuationToken).toBeNull();
    });

    it("queries the alerts not linked to a metadata type", async () => {
        const list = await client.queryAlerts({ metadataTypeFilters: { WorkItem: false } }, "proj", "repo", 2, "id");
        expect([...list]).toEqual([dependency, dismissed]);
    });

    it("queries every alert without metadata filters", async () => {
        const list = await client.queryAlerts({ metadataTypeFilters: {} }, "proj", "repo");
        expect([...list]).toEqual(alerts);
    });

    it("lists the branches without pull request refs", async () => {
        const list = await client.getBranches("proj", "repo", AlertType.Code);
        expect(list).toEqual(branches.slice(0, 3));
        expect(list.map(b => b.name)).toEqual(["refs/heads/main", "refs/heads/develop", "refs/heads/release/1.0"]);
        expect(list[0].deletedDate).toBeUndefined();
    });

    it("leaves out pull request branches when asked to", async () => {
        const list = await client.getBranches("proj", "repo", AlertType.Code, undefined, undefined, undefined, false);
        expect(list.length).toBe(3);
    });

    it("includes pull request branches when asked to", async () => {
        const list = await client.getBranches("proj", "repo", AlertType.Code, undefined, undefined, undefined, true);
        expect(list).toEqual(branches);
        expect(new Set(list.map(b => b.branchId)).size).toBe(4);
    });

    it("filters the branches by name and top", async () => {
        expect(await client.getBranches("proj", "repo", AlertType.Code, undefined, "release")).toEqual([branches[2]]);
        expect(await client.getBranches("proj", "repo", AlertType.Code, "token", "refs/heads", 2)).toEqual(
            branches.slice(0, 2)
        );
        expect(await client.getBranches("proj", "repo", AlertType.Code, undefined, "missing")).toEqual([]);
    });

    it("gets the UX filters", async () => {
        const filters = await client.getUxFilters("proj", "repo", AlertType.Secret);
        expect(filters).toBe(uxFilters);
        expect(filters.progressPercentage).toBe(100);
        expect(filters.tools.length).toBe(3);
    });

    it("creates a pending autofix request", async () => {
        const request = await client.createAutofixRequest("proj", code.alertId, "repo", "refs/heads/main");
        expect(request.status).toBe(AutofixRequestStatus.Pending);
        expect(typeof request.requestId).toBe("number");
        expect(request.pullRequestId).toBeUndefined();
        expect(request.createdDate).toBeInstanceOf(Date);
        expect(autofixRequests.map(r => r.requestId)).not.toContain(request.requestId);
    });

    it("lists the autofix requests of an alert", async () => {
        const list = await client.getAutofixRequestsByAlertId("proj", code.alertId, "repo", "refs/heads/main");
        expect(list).toBe(autofixRequests);
        expect(list.map(r => r.status)).toEqual([AutofixRequestStatus.Done, AutofixRequestStatus.Pending]);
        expect(typeof list[0].pullRequestId).toBe("number");
    });

    it("accepts an autofix callback", async () => {
        const callback: AutofixCallbackRequest = {
            errorDetails: "",
            pipelinePlanId: "plan",
            pullRequestId: 12,
            requestId: autofixRequests[1].requestId,
            status: AutofixCallbackStatus.Done,
            tokenUsage: 0
        };
        await expect(client.autofixCallback(callback, "proj", "repo")).resolves.toBeUndefined();
    });

    it("lists the draft alerts", async () => {
        const list = await client.getDraftAlerts("proj", "repo");
        expect([...list]).toEqual(draftAlerts);
        expect(list.continuationToken).toBeNull();
        for (const alert of list) {
            expect(alert.state).toBe(State.Draft);
        }
    });

    it("limits the draft alerts with top", async () => {
        const list = await client.getDraftAlerts("proj", "repo", 1, "id", "token");
        expect([...list]).toEqual([draftAlerts[0]]);
    });

    it("uploads a SARIF to GitHub", async () => {
        const url = await client.uploadSarifToGitHub("{}", "proj", "github.example.com", "owner", "repo");
        expect(url).toMatch(/^https:\/\/github\.example\.com\/owner\/repo\/code-scanning\/analyses\/\d+$/);
    });

    it("lists the analysis instances of an alert", async () => {
        const list = await client.getAlertInstances("proj", code.alertId, "repo", "refs/heads/main");
        expect(list).toBe(alertInstances);
        expect(list.length).toBe(2);
    });

    it("creates a job echoing the posted object", async () => {
        const created = await client.createJob({ provider: "custom", alertIds: [1, 2] }, "proj", "repo");
        expect(created.provider).toBe("custom");
        expect(created.alertIds).toEqual([1, 2]);
        expect(typeof created.jobId).toBe("string");
        expect(created.revision).toBe(1);
        expect(created.createdDate).toBeInstanceOf(Date);
    });

    it("gets a known job", async () => {
        expect(await client.getJob("proj", "repo", jobs[1].jobId)).toBe(jobs[1]);
    });

    it("fabricates an unknown job", async () => {
        const made = await client.getJob("proj", "repo", "missing-job");
        expect(made.jobId).toBe("missing-job");
        expect(made.alertIds).toEqual([]);
        expect(made.artifacts.length).toBe(1);
    });

    it("updates a known job", async () => {
        const updated = await client.updateJob({ jobState: "failed", jobId: "ignored" }, "proj", "repo", jobs[1].jobId);
        expect(updated.jobId).toBe(jobs[1].jobId);
        expect(updated.jobState).toBe("failed");
        expect(updated.alertIds).toBe(jobs[1].alertIds);
        expect(jobs[1].jobState).toBe("running");
    });

    it("updates an unknown job", async () => {
        const updated = await client.updateJob({ revision: 4 }, "proj", "repo", "missing-job");
        expect(updated.jobId).toBe("missing-job");
        expect(updated.revision).toBe(4);
    });

    it("creates a legal review", async () => {
        const review = await client.createLegalReview("proj", "repo", dependency.alertId, "refs/heads/main");
        expect(typeof review.id).toBe("number");
        expect(review.state).toBe("Active");
        expect(review.webUrl.endsWith(`/_workitems/edit/${review.id}`)).toBe(true);
    });

    it("reports the change of every posted metadata operation", async () => {
        const added = makeRelationMetadata("pullRequest");
        const removed = makeRelationMetadata();
        const untouched = makeRelationMetadata();
        const posted: AlertMetadata[] = [
            {
                alertId: code.alertId,
                metadata: [
                    { op: MetadataOperation.Add, value: added },
                    { op: MetadataOperation.Remove, value: removed }
                ]
            },
            { alertId: fixed.alertId, metadata: [{ op: MetadataOperation.None, value: untouched }] }
        ];
        expect(await client.updateAlertsMetadata(posted, "proj", "repo")).toEqual([
            { alertId: code.alertId, metadataChange: { changeType: MetadataChangeType.Created, value: added } },
            { alertId: code.alertId, metadataChange: { changeType: MetadataChangeType.Deleted, value: removed } },
            { alertId: fixed.alertId, metadataChange: { changeType: MetadataChangeType.None, value: untouched } }
        ]);
    });

    it("gets the metadata of a known alert", async () => {
        const metadata = await client.getAlertMetadata("proj", code.alertId, "repo");
        expect(metadata).toBe(alertsMetadata[3]);
        expect(metadata.metadata).toEqual([{ op: MetadataOperation.Add, value: code.relations[0] }]);
    });

    it("fabricates the metadata of an unknown alert", async () => {
        const metadata = await client.getAlertMetadata("proj", 555_555, "repo");
        expect(metadata.alertId).toBe(555_555);
        expect(metadata.metadata.length).toBe(1);
        expect(metadata.metadata[0].value.rel).toBe("WorkItem");
    });

    it("gets the metadata of a batch of alerts", async () => {
        const list = await client.getAlertMetadataBatch(
            { alertIds: [dependency.alertId, 444_444], errorPolicy: AlertMetadataErrorPolicy.Omit },
            "proj",
            "repo"
        );
        expect(list[0]).toBe(alertsMetadata[0]);
        expect(list[0].metadata).toEqual([]);
        expect(list[1].alertId).toBe(444_444);
    });

    it("gets org level alerts by id", async () => {
        const found = await client.getOrgLevelAlertsByIds([fixed.alertId, 333_333]);
        expect(found[0]).toBe(fixed);
        expect(found[1].alertId).toBe(333_333);
    });

    it("deletes the pipeline analyses", async () => {
        await expect(client.deleteAllPipelineAnalyses("proj", "repo")).resolves.toBeUndefined();
        await expect(client.deletePipelineAnalysis("proj", "repo", 12)).resolves.toBeUndefined();
    });

    it("exports the SARIF of the requested alerts", async () => {
        const sarif = decode(
            await client.exportSarif("proj", "repo", [code.alertId, fixed.alertId], "refs/heads/main")
        );
        expect(sarif.runs[0].results.map((r: any) => r.properties.alertId)).toEqual([code.alertId, fixed.alertId]);
    });

    it("uploads a SARIF and returns a new id each time", async () => {
        const first = await client.uploadSarif("{}", "proj", "repo");
        const second = await client.uploadSarif("{}", "proj", "repo", "true");
        const third = await client.uploadOrgSarif("{}");
        expect(new Set([first, second, third]).size).toBe(3);
        expect(typeof first).toBe("number");
    });

    it("gets the status of a SARIF upload", async () => {
        const status = await client.getSarif(12);
        expect(status).toBe(sarifUploadStatus);
        expect(status.processingStatus).toBe(SarifJobStatus.Completed);
        expect(status.errors).toEqual([]);
    });

    it("gets the validity data of a secret alert", async () => {
        const validity = await client.getValidityData("proj", "repo", secret.alertId);
        expect(validity).toEqual({
            ...secret.validityDetails,
            alertValidationRequestStatus: AlertValidationRequestStatus.Completed
        });
    });

    it("fabricates the validity data of an alert without any", async () => {
        const validity = await client.getValidityData("proj", "repo", code.alertId);
        expect(validity.validityStatus).toBe(AlertValidityStatus.Active);
        expect(validity.validityLastCheckedDate).toBeInstanceOf(Date);
        expect(validity.alertValidationRequestStatus).toBe(AlertValidationRequestStatus.Completed);
    });

    it("initiates a validation", async () => {
        expect(await client.initiateValidation("proj", "repo", secret.alertId)).toBe(
            AlertValidationRequestStatus.Created
        );
    });
});
