import {
    AlertType,
    AlertValidationRequestStatus,
    AlertValidityStatus,
    AutofixRequestFailedReason,
    AutofixRequestStatus,
    DependencyKind,
    MetadataOperation,
    ResultType,
    SarifJobStatus,
    Severity,
    State
} from "azure-devops-extension-api/Alert";
import {
    alertInstances,
    alerts,
    alertsMetadata,
    autofixRequests,
    branches,
    CODE_TOOL,
    DEFAULT_BRANCH,
    DEPENDENCY_TOOL,
    DRAFT_STATE,
    draftAlerts,
    jobs,
    makeAlert,
    makeAlertAnalysisInstance,
    makeAlertJob,
    makeAlertMetadata,
    makeAnalysisConfiguration,
    makeAnalysisInstance,
    makeAnalysisResult,
    makeAutofixRequest,
    makeBranch,
    makeBuffer,
    makeCodeAlert,
    makeDependency,
    makeDependencyAlert,
    makeDismissal,
    makeLegalReview,
    makeLicense,
    makePhysicalLocation,
    makePipeline,
    makeRelationMetadata,
    makeRule,
    makeSarif,
    makeSarifUploadStatus,
    makeSecretAlert,
    makeTool,
    makeValidationFingerprint,
    makeValidationRequestInfo,
    makeValidityInfo,
    rules,
    SECRET_PLACEHOLDER,
    SECRET_TOOL,
    tools,
    uxFilters
} from "../azure-devops-extension-api/alert/Data";
import { advSecProjectIds, repositories } from "../azure-devops-extension-api/git/Data";

describe("alert fixtures", () => {
    it("matches the draft state of the installed release", () => {
        expect(DRAFT_STATE).toBe(State.Draft);
    });

    it("makes a buffer holding the text", () => {
        expect(new TextDecoder().decode(makeBuffer("sarif"))).toBe("sarif");
    });

    it("makes a tool with the given name and rules", () => {
        const rule = makeRule();
        expect(makeTool("Custom", [rule])).toMatchObject({ name: "Custom", rules: [rule], isDeterministic: true });
        const tool = makeTool();
        expect(tool.name).toBe(CODE_TOOL);
        expect(tool.rules.length).toBe(1);
        expect(tool.rules[0].tags).toEqual(["security"]);
    });

    it("makes the small building blocks", () => {
        expect(makeLicense().name).toBe("MIT");
        expect(typeof makeDependency().dependencyId).toBe("number");
        expect(makeDependency().license).toEqual(makeLicense());
        expect(typeof makePipeline().adoPipelineId).toBe("number");
        expect(makePhysicalLocation().versionControl.commitHash).toHaveLength(40);
        expect(typeof makeDismissal().stateChangedByIdentity.id).toBe("string");
        expect(makeValidityInfo().validityStatus).toBe(AlertValidityStatus.Active);
    });

    it("makes a branch with the given or a fabricated name", () => {
        expect(makeBranch("refs/heads/x").name).toBe("refs/heads/x");
        const branch = makeBranch();
        expect(branch.name.startsWith("refs/heads/")).toBe(true);
        expect(branch.deletedDate).toBeUndefined();
    });

    it("makes relation metadata of the given type", () => {
        expect(makeRelationMetadata().rel).toBe("WorkItem");
        const relation = makeRelationMetadata("pullRequest");
        expect(relation.rel).toBe("pullRequest");
        expect(relation.url.startsWith("vstfs:///pullRequest/pullRequest/")).toBe(true);
    });

    it("never puts a real secret in a fingerprint", () => {
        expect(makeValidationFingerprint().validationFingerprintJson).toBe(SECRET_PLACEHOLDER);
        expect(SECRET_PLACEHOLDER).toBe("***");
    });

    it("makes an open code alert by default", () => {
        const alert = makeAlert();
        expect(alert.alertType).toBe(AlertType.Code);
        expect(alert.state).toBe(State.Active);
        expect(alert.gitRef).toBe(DEFAULT_BRANCH);
        expect(alert.projectId).toBe(advSecProjectIds[0]);
        expect(alert.repositoryId).toBe(repositories[0].id);
        expect(alert.tools[0].name).toBe(CODE_TOOL);
        expect(alert.dismissal).toBeUndefined();
        expect(alert.fixedDate).toBeUndefined();
        expect(alert.aiMetadataBlobReference).toBeUndefined();
        expect(alert.isDevDependency).toBeUndefined();
        expect(alert.validityDetails).toBeUndefined();
        expect(alert.epssScore).toBeUndefined();
        expect(alert.epssPercentile).toBeUndefined();
    });

    it("makes an alert of the given type and tool", () => {
        const tool = makeTool("Custom");
        const alert = makeAlert(AlertType.License, tool);
        expect(alert.alertType).toBe(AlertType.License);
        expect(alert.tools).toEqual([tool]);
    });

    it("makes a dependency alert", () => {
        const alert = makeDependencyAlert();
        expect(alert.alertType).toBe(AlertType.Dependency);
        expect(alert.tools[0].name).toBe(DEPENDENCY_TOOL);
        expect(alert.isDevDependency).toBe(false);
        expect(alert.epssScore).toBeGreaterThan(0);
        expect(alert.epssScore).toBeLessThan(1);
        expect(alert.epssPercentile).toBeGreaterThan(0);
        expect(alert.epssPercentile).toBeLessThan(1);
        expect(alert.logicalLocations[0].kind).toBe(DependencyKind.VulnerableDependency);
        expect(alert.truncatedSecret).toBeUndefined();
        expect(makeDependencyAlert(tools[0]).tools[0]).toBe(tools[0]);
    });

    it("makes a secret alert with placeholders only", () => {
        const alert = makeSecretAlert();
        expect(alert.alertType).toBe(AlertType.Secret);
        expect(alert.tools[0].name).toBe(SECRET_TOOL);
        expect(alert.truncatedSecret).toBe(SECRET_PLACEHOLDER);
        expect(alert.validationFingerprints[0].validationFingerprintJson).toBe(SECRET_PLACEHOLDER);
        expect(alert.validityDetails.validityStatus).toBe(AlertValidityStatus.Active);
        expect(makeSecretAlert(tools[1]).tools[0]).toBe(tools[1]);
    });

    it("makes a code alert", () => {
        const alert = makeCodeAlert();
        expect(alert.alertType).toBe(AlertType.Code);
        expect(alert.isAutoFixable).toBe(true);
        expect(alert.severity).toBe(Severity.Error);
        expect(makeCodeAlert(tools[2]).tools[0]).toBe(tools[2]);
    });

    it("makes an analysis configuration of the given type", () => {
        expect(makeAnalysisConfiguration().alertType).toBe(AlertType.Code);
        const configuration = makeAnalysisConfiguration(AlertType.Dependency);
        expect(configuration.alertType).toBe(AlertType.Dependency);
        expect(configuration.analysisConfigurationDetails.gitRef).toBe(DEFAULT_BRANCH);
    });

    it("makes an analysis result in the given state", () => {
        const result = makeAnalysisResult();
        expect(result.state).toBe(State.Active);
        expect(result.fixedInstanceId).toBeUndefined();
        expect(result.result.resultType).toBe(ResultType.VersionControl);
        expect(result.result.dependencyResult).toBeUndefined();
        expect(result.result.versionControlResult.resultId).toBe(result.result.resultId);
        expect(
            result.result.versionControlResult.versionControlSnippet.versionControlFilePath.versionControlFilePathId
        ).toBe(result.result.versionControlResult.versionControlSnippet.versionControlFilePathId);
        expect(makeAnalysisResult(State.Dismissed).state).toBe(State.Dismissed);
    });

    it("makes analysis instances for a configuration", () => {
        const configuration = makeAnalysisConfiguration();
        expect(makeAnalysisInstance(configuration).configuration).toBe(configuration);
        expect(makeAnalysisInstance().results.length).toBe(1);
        const instance = makeAlertAnalysisInstance(configuration);
        expect(instance.analysisConfiguration).toBe(configuration);
        expect(instance.recentAnalysisInstance).toBe(instance.lastSeen);
        expect(instance.firstSeen.configuration).toBe(configuration);
        expect(instance.fixedIn).toBeUndefined();
        expect(makeAlertAnalysisInstance().state).toBe(State.Active);
    });

    it("makes a pending autofix request without a failure reason", () => {
        const request = makeAutofixRequest();
        expect(request.status).toBe(AutofixRequestStatus.Pending);
        expect(request.failedReason).toBe(AutofixRequestFailedReason.None);
    });

    it("makes a job for the given alerts", () => {
        expect(makeAlertJob().alertIds).toEqual([]);
        const job = makeAlertJob([1, 2]);
        expect(job.alertIds).toEqual([1, 2]);
        expect(job.branchRef).toBe(DEFAULT_BRANCH);
        expect(job.lastUpdatedDate).toBeInstanceOf(Date);
    });

    it("makes a legal review", () => {
        expect(makeLegalReview().state).toBe("Active");
    });

    it("makes alert metadata from relations", () => {
        const relation = makeRelationMetadata("pullRequest");
        expect(makeAlertMetadata(5, [relation])).toEqual({
            alertId: 5,
            metadata: [{ op: MetadataOperation.Add, value: relation }]
        });
        const made = makeAlertMetadata();
        expect(typeof made.alertId).toBe("number");
        expect(made.metadata.length).toBe(1);
        expect(makeAlertMetadata(6).alertId).toBe(6);
    });

    it("makes a SARIF upload status", () => {
        expect(makeSarifUploadStatus().processingStatus).toBe(SarifJobStatus.Completed);
        expect(makeSarifUploadStatus(SarifJobStatus.Failed).processingStatus).toBe(SarifJobStatus.Failed);
    });

    it("makes validation request info from validity details", () => {
        const validity = { ...makeValidityInfo(), validityStatus: AlertValidityStatus.Inactive };
        expect(makeValidationRequestInfo(validity)).toEqual({
            ...validity,
            alertValidationRequestStatus: AlertValidationRequestStatus.Completed
        });
        expect(makeValidationRequestInfo().validityStatus).toBe(AlertValidityStatus.Active);
    });

    it("makes a SARIF document with one result per alert", () => {
        const sarif = JSON.parse(makeSarif([alerts[0], alerts[3]]));
        expect(sarif.runs[0].tool.driver.name).toBe(CODE_TOOL);
        expect(sarif.runs[0].results.length).toBe(2);
        expect(JSON.parse(makeSarif([])).runs[0].results).toEqual([]);
    });

    it("seeds distinct rules shared by the tools", () => {
        expect(new Set(rules.map(r => r.opaqueId)).size).toBe(4);
        expect(tools.map(t => t.name)).toEqual([DEPENDENCY_TOOL, SECRET_TOOL, CODE_TOOL]);
        expect(tools.flatMap(t => t.rules)).toEqual(rules);
    });

    it("seeds alerts of the dependency, secret and code kinds", () => {
        expect(alerts.map(a => a.state)).toEqual([
            State.Active,
            State.Dismissed,
            State.Active,
            State.Active,
            State.Fixed
        ]);
        expect(alerts[1].dismissal).toBeDefined();
        expect(alerts[4].fixedDate).toBeInstanceOf(Date);
        expect(alerts[3].relations.length).toBe(1);
        const ids = [...alerts, ...draftAlerts].map(a => a.alertId);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("seeds no secret other than the placeholder", () => {
        for (const alert of [...alerts, ...draftAlerts]) {
            expect([undefined, SECRET_PLACEHOLDER]).toContain(alert.truncatedSecret);
            for (const fingerprint of alert.validationFingerprints) {
                expect(fingerprint.validationFingerprintJson).toBe(SECRET_PLACEHOLDER);
            }
        }
    });

    it("seeds the other lists", () => {
        expect(draftAlerts.length).toBe(2);
        expect(alertInstances.length).toBe(2);
        expect(alertInstances[1].analysisConfiguration.alertType).toBe(AlertType.Dependency);
        expect(new Set(autofixRequests.map(r => r.requestId)).size).toBe(2);
        expect(new Set(jobs.map(j => j.jobId)).size).toBe(3);
        expect(alertsMetadata.map(m => m.alertId)).toEqual(alerts.map(a => a.alertId));
        expect(new Set(branches.map(b => b.name)).size).toBe(4);
        expect(uxFilters.branches).toBe(branches);
        expect(uxFilters.rules).toBe(rules);
        expect(uxFilters.packages.length).toBe(2);
    });
});
