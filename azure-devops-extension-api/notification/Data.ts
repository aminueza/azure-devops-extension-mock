import { fake } from "../common/fixtures";
import {
    DefaultGroupDeliveryPreference,
    EmailHtmlSubscriptionChannel,
    EventTransformResult,
    ExpressionFilter,
    INotificationDiagnosticLog,
    NotificationAdminSettings,
    NotificationDiagnosticLogMessage,
    NotificationEventField,
    NotificationEventPublisher,
    NotificationEventRole,
    NotificationEventType,
    NotificationReason,
    NotificationReasonType,
    NotificationStatistic,
    NotificationStatisticType,
    NotificationSubscriber,
    NotificationSubscriberDeliveryPreference,
    NotificationSubscription,
    NotificationSubscriptionTemplate,
    SubscriberFlags,
    SubscriptionDiagnostics,
    SubscriptionFieldType,
    SubscriptionFlags,
    SubscriptionPermissions,
    SubscriptionScope,
    SubscriptionStatus,
    SubscriptionTemplateType,
    SubscriptionTracing,
    SubscriptionUserSettings
} from "azure-devops-extension-api/Notification";
import { EventActor, VssNotificationEvent } from "azure-devops-extension-api/WebApi";
import { makeIdentityRef } from "../core/Data";

export const COLLECTION_SCOPE = "00000000-0000-0000-0000-000000000000";

export const makeSubscriptionTracing = (enabled = false): SubscriptionTracing => ({
    enabled,
    startDate: fake.date.recent({ days: 2 }),
    endDate: fake.date.future(),
    maxTracedEntries: 100,
    tracedEntries: 0
});

export const makeSubscriptionDiagnostics = (): SubscriptionDiagnostics => ({
    deliveryResults: makeSubscriptionTracing(),
    deliveryTracing: makeSubscriptionTracing(),
    evaluationTracing: makeSubscriptionTracing()
});

export const makeSubscriptionScope = (): SubscriptionScope => ({
    id: COLLECTION_SCOPE,
    name: "",
    type: "collection"
});

export const makeSubscriptionChannel = (): EmailHtmlSubscriptionChannel => ({
    type: "EmailHtml",
    address: fake.internet.exampleEmail(),
    useCustomAddress: false
});

export const makeExpressionFilter = (eventType = "ms.vss-work.workitem-changed-event"): ExpressionFilter => ({
    type: "Expression",
    eventType,
    criteria: {
        clauses: [{ fieldName: "Assigned To", index: 1, logicalOperator: "", operator: "=", value: "[Me]" }],
        groups: [],
        maxGroupLevel: 0
    }
});

export const makeSubscriptionUserSettings = (): SubscriptionUserSettings => ({
    optedOut: false
});

export const makeNotificationEventPublisher = (
    id = "ms.vss-work.work-event-publisher"
): NotificationEventPublisher => ({
    id,
    subscriptionManagementInfo: {
        serviceInstanceType: fake.string.uuid(),
        url: fake.internet.url()
    },
    url: fake.internet.url()
});

export const makeNotificationEventField = (name: string = fake.lorem.word()): NotificationEventField => ({
    id: name,
    name,
    path: `fields/${name}`,
    supportedScopes: ["collection", "project"],
    fieldType: {
        id: "String",
        operatorConstraints: [{ operator: "Under", supportedScopes: ["project"] }],
        operators: [
            { id: "=", displayName: "=" },
            { id: "<>", displayName: "<>" }
        ],
        subscriptionFieldType: SubscriptionFieldType.String,
        value: {
            dataSource: [{ data: {}, displayValue: "[Me]", value: "[Me]" }],
            endPoint: "",
            resultTemplate: ""
        }
    }
});

export const makeNotificationEventRole = (): NotificationEventRole => ({
    id: fake.lorem.slug(2),
    name: fake.lorem.words(2),
    supportsGroups: true
});

export const makeNotificationEventType = (): NotificationEventType => {
    const fields = [makeNotificationEventField("Assigned To"), makeNotificationEventField("State")];
    return {
        id: `ms.vss-${fake.lorem.word()}.${fake.lorem.slug(2)}-event`,
        name: fake.lorem.words(3),
        category: { id: fake.lorem.word(), name: fake.lorem.words(2) },
        color: fake.color.rgb(),
        customSubscriptionsAllowed: true,
        eventPublisher: makeNotificationEventPublisher(),
        fields: Object.fromEntries(fields.map(field => [field.id, field])),
        hasInitiator: true,
        icon: "bowtie-icon bowtie-work-item",
        roles: [makeNotificationEventRole()],
        supportedScopes: ["collection", "project"],
        url: fake.internet.url()
    };
};

export const makeNotificationSubscription = (
    diagnostics: SubscriptionDiagnostics = makeSubscriptionDiagnostics()
): NotificationSubscription => ({
    id: String(fake.number.id()),
    description: fake.lorem.sentence(),
    adminSettings: { blockUserOptOut: false },
    channel: makeSubscriptionChannel(),
    diagnostics,
    extendedProperties: {},
    filter: makeExpressionFilter(),
    flags: SubscriptionFlags.None,
    lastModifiedBy: makeIdentityRef(),
    modifiedDate: fake.date.recent(),
    permissions: SubscriptionPermissions.View | SubscriptionPermissions.Edit | SubscriptionPermissions.Delete,
    scope: makeSubscriptionScope(),
    status: SubscriptionStatus.Enabled,
    statusMessage: "",
    subscriber: makeIdentityRef(),
    url: fake.internet.url(),
    userSettings: makeSubscriptionUserSettings(),
    _links: {}
});

export const makeNotificationSubscriber = (): NotificationSubscriber => ({
    id: fake.string.uuid(),
    deliveryPreference: NotificationSubscriberDeliveryPreference.PreferredEmailAddress,
    flags:
        SubscriberFlags.IsUser |
        SubscriberFlags.DeliveryPreferencesEditable |
        SubscriberFlags.SupportsPreferredEmailAddressDelivery,
    preferredEmailAddress: fake.internet.exampleEmail()
});

export const makeNotificationAdminSettings = (): NotificationAdminSettings => ({
    defaultGroupDeliveryPreference: DefaultGroupDeliveryPreference.EachMember
});

export const makeNotificationDiagnosticLogMessage = (): NotificationDiagnosticLogMessage => ({
    level: 0,
    message: fake.lorem.sentence(),
    time: "00:00:00.0150000"
});

export const makeNotificationDiagnosticLog = (source: string = fake.string.uuid()): INotificationDiagnosticLog => ({
    id: fake.string.uuid(),
    activityId: fake.string.uuid(),
    description: fake.lorem.sentence(),
    logType: "EventProcessingLog",
    messages: [makeNotificationDiagnosticLogMessage()],
    properties: {},
    source,
    startTime: fake.date.recent({ days: 2 }),
    endTime: fake.date.recent()
});

export const makeNotificationStatistic = (
    type: NotificationStatisticType = NotificationStatisticType.Notifications
): NotificationStatistic => ({
    date: fake.date.recent({ days: 7 }),
    hitCount: fake.number.int({ min: 1, max: 500 }),
    path: fake.lorem.slug(2),
    type,
    user: makeIdentityRef()
});

export const makeNotificationSubscriptionTemplate = (
    eventType: NotificationEventType = makeNotificationEventType()
): NotificationSubscriptionTemplate => ({
    id: `ms.vss-${fake.lorem.word()}.${fake.lorem.slug(2)}-subscription`,
    description: fake.lorem.sentence(),
    filter: makeExpressionFilter(eventType.id),
    notificationEventInformation: eventType,
    type: SubscriptionTemplateType.Both
});

export const makeNotificationReason = (
    notificationReasonType: NotificationReasonType = NotificationReasonType.Personal
): NotificationReason => ({
    notificationReasonType,
    targetIdentities: [makeIdentityRef()]
});

export const makeEventActor = (role = "initiator"): EventActor => ({
    id: fake.string.uuid(),
    role
});

export const makeVssNotificationEvent = (): VssNotificationEvent => ({
    actors: [makeEventActor()],
    artifactUris: [`vstfs:///WorkItemTracking/WorkItem/${fake.number.id()}`],
    data: {},
    eventType: "ms.vss-work.workitem-changed-event",
    expiresIn: "3.00:00:00",
    itemId: String(fake.number.id()),
    processDelay: "00:00:00",
    scopes: [makeSubscriptionScope()],
    sourceEventCreatedTime: fake.date.recent()
});

export const makeEventTransformResult = (): EventTransformResult => ({
    content: fake.lorem.paragraph(),
    data: {},
    systemInputs: {}
});

export const eventTypes: NotificationEventType[] = [
    {
        ...makeNotificationEventType(),
        id: "ms.vss-work.workitem-changed-event",
        name: "Work item changed"
    },
    {
        ...makeNotificationEventType(),
        id: "ms.vss-code.git-pullrequest-event",
        name: "Pull request",
        eventPublisher: makeNotificationEventPublisher("ms.vss-code.git-event-publisher")
    },
    {
        ...makeNotificationEventType(),
        id: "ms.vss-build.build-completed-event",
        name: "Build completed",
        eventPublisher: makeNotificationEventPublisher("ms.vss-build.build-event-publisher")
    }
];

export const diagnostics: SubscriptionDiagnostics[] = [
    makeSubscriptionDiagnostics(),
    { ...makeSubscriptionDiagnostics(), deliveryTracing: makeSubscriptionTracing(true) },
    makeSubscriptionDiagnostics()
];

export const subscribers: NotificationSubscriber[] = [
    makeNotificationSubscriber(),
    makeNotificationSubscriber(),
    {
        ...makeNotificationSubscriber(),
        deliveryPreference: NotificationSubscriberDeliveryPreference.EachMember,
        flags: SubscriberFlags.IsTeam | SubscriberFlags.IsGroup | SubscriberFlags.SupportsEachMemberDelivery
    }
];

export const subscriptions: NotificationSubscription[] = [
    {
        ...makeNotificationSubscription(diagnostics[0]),
        filter: makeExpressionFilter(eventTypes[0].id),
        subscriber: { ...makeIdentityRef(), id: subscribers[0].id }
    },
    {
        ...makeNotificationSubscription(diagnostics[1]),
        filter: makeExpressionFilter(eventTypes[1].id),
        subscriber: { ...makeIdentityRef(), id: subscribers[1].id }
    },
    {
        ...makeNotificationSubscription(diagnostics[2]),
        filter: makeExpressionFilter(eventTypes[2].id),
        flags: SubscriptionFlags.GroupSubscription | SubscriptionFlags.TeamSubscription,
        status: SubscriptionStatus.DisabledByAdmin,
        statusMessage: "Disabled by an administrator",
        subscriber: { ...makeIdentityRef(), id: subscribers[2].id, isContainer: true }
    }
];

export const settings: NotificationAdminSettings = makeNotificationAdminSettings();

export const diagnosticLogs: INotificationDiagnosticLog[] = [
    makeNotificationDiagnosticLog(),
    { ...makeNotificationDiagnosticLog(), logType: "NotificationDeliveryLog" },
    makeNotificationDiagnosticLog()
];

export const statistics: NotificationStatistic[] = [
    makeNotificationStatistic(NotificationStatisticType.Events),
    makeNotificationStatistic(NotificationStatisticType.Notifications),
    { ...makeNotificationStatistic(NotificationStatisticType.NotificationBySubscription), path: subscriptions[0].id }
];

export const templates: NotificationSubscriptionTemplate[] = eventTypes.map(makeNotificationSubscriptionTemplate);

export const reasons: NotificationReason[] = [
    makeNotificationReason(NotificationReasonType.Personal),
    makeNotificationReason(NotificationReasonType.DirectMember),
    makeNotificationReason(NotificationReasonType.Follows)
];
