import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    BatchNotificationOperation,
    EventTransformRequest,
    EventTransformResult,
    FieldValuesQuery,
    INotificationDiagnosticLog,
    NotificationAdminSettings,
    NotificationAdminSettingsUpdateParameters,
    NotificationEventField,
    NotificationEventType,
    NotificationReason,
    NotificationRestClient,
    NotificationSubscriber,
    NotificationSubscriberUpdateParameters,
    NotificationSubscription,
    NotificationSubscriptionCreateParameters,
    NotificationSubscriptionTemplate,
    NotificationSubscriptionUpdateParameters,
    SubscriptionDiagnostics,
    SubscriptionQuery,
    SubscriptionQueryFlags,
    SubscriptionUserSettings,
    UpdateSubscripitonDiagnosticsParameters
} from "azure-devops-extension-api/Notification";
import { VssNotificationEvent } from "azure-devops-extension-api/WebApi";
import {
    diagnosticLogs,
    eventTypes,
    makeEventTransformResult,
    makeNotificationDiagnosticLog,
    makeNotificationEventType,
    makeNotificationSubscriber,
    makeNotificationSubscription,
    makeSubscriptionDiagnostics,
    makeVssNotificationEvent,
    reasons,
    settings,
    subscribers,
    subscriptions,
    templates
} from "./Data";

const findSubscription = (subscriptionId: string): NotificationSubscription =>
    subscriptions.find(s => s.id === subscriptionId) ?? { ...makeNotificationSubscription(), id: subscriptionId };

const findDiagnostics = (subscriptionId: string): SubscriptionDiagnostics =>
    subscriptions.find(s => s.id === subscriptionId)?.diagnostics ?? makeSubscriptionDiagnostics();

const findEventType = (eventType: string): NotificationEventType =>
    eventTypes.find(t => t.id === eventType) ?? { ...makeNotificationEventType(), id: eventType };

const findSubscriber = (subscriberId: string): NotificationSubscriber =>
    subscribers.find(s => s.id === subscriberId) ?? { ...makeNotificationSubscriber(), id: subscriberId };

export class MockNotificationRestClient extends RestClientBase {
    public TYPE = NotificationRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    performBatchNotificationOperations(_operation: BatchNotificationOperation): Promise<void> {
        return Promise.resolve();
    }

    listLogs(
        source: string,
        entryId?: string,
        _startTime?: Date,
        _endTime?: Date
    ): Promise<INotificationDiagnosticLog[]> {
        if (entryId === undefined) {
            return Promise.resolve(diagnosticLogs.map(log => ({ ...log, source })));
        }
        const found = diagnosticLogs.find(log => log.id === entryId) ?? makeNotificationDiagnosticLog();
        return Promise.resolve([{ ...found, id: entryId, source }]);
    }

    getSubscriptionDiagnostics(subscriptionId: string): Promise<SubscriptionDiagnostics> {
        return Promise.resolve(findDiagnostics(subscriptionId));
    }

    updateSubscriptionDiagnostics(
        updateParameters: UpdateSubscripitonDiagnosticsParameters,
        subscriptionId: string
    ): Promise<SubscriptionDiagnostics> {
        const current = findDiagnostics(subscriptionId);
        return Promise.resolve({
            deliveryResults: { ...current.deliveryResults, ...updateParameters.deliveryResults },
            deliveryTracing: { ...current.deliveryTracing, ...updateParameters.deliveryTracing },
            evaluationTracing: { ...current.evaluationTracing, ...updateParameters.evaluationTracing }
        });
    }

    publishEvent(notificationEvent: VssNotificationEvent): Promise<VssNotificationEvent> {
        return Promise.resolve({ ...makeVssNotificationEvent(), ...notificationEvent });
    }

    transformEvent(transformRequest: EventTransformRequest): Promise<EventTransformResult> {
        return Promise.resolve({
            ...makeEventTransformResult(),
            content: transformRequest.eventPayload,
            systemInputs: { ...transformRequest.systemInputs }
        });
    }

    queryEventTypes(_inputValuesQuery: FieldValuesQuery, eventType: string): Promise<NotificationEventField[]> {
        return Promise.resolve(Object.values(findEventType(eventType).fields));
    }

    getEventType(eventType: string): Promise<NotificationEventType> {
        return Promise.resolve(findEventType(eventType));
    }

    listEventTypes(publisherId?: string): Promise<NotificationEventType[]> {
        return Promise.resolve(
            eventTypes.filter(t => publisherId === undefined || t.eventPublisher.id === publisherId)
        );
    }

    getNotificationReasons(notificationId: number): Promise<NotificationReason> {
        return Promise.resolve(reasons[Math.abs(notificationId) % reasons.length]);
    }

    listNotificationReasons(notificationIds?: number): Promise<NotificationReason[]> {
        return Promise.resolve(
            notificationIds === undefined ? reasons : [reasons[Math.abs(notificationIds) % reasons.length]]
        );
    }

    getSettings(): Promise<NotificationAdminSettings> {
        return Promise.resolve(settings);
    }

    updateSettings(updateParameters: NotificationAdminSettingsUpdateParameters): Promise<NotificationAdminSettings> {
        return Promise.resolve({ ...settings, ...updateParameters });
    }

    getSubscriber(subscriberId: string): Promise<NotificationSubscriber> {
        return Promise.resolve(findSubscriber(subscriberId));
    }

    updateSubscriber(
        updateParameters: NotificationSubscriberUpdateParameters,
        subscriberId: string
    ): Promise<NotificationSubscriber> {
        return Promise.resolve({ ...findSubscriber(subscriberId), ...updateParameters, id: subscriberId });
    }

    querySubscriptions(subscriptionQuery: SubscriptionQuery): Promise<NotificationSubscription[]> {
        const conditions = subscriptionQuery.conditions ?? [];
        return Promise.resolve(
            subscriptions.filter(
                s =>
                    conditions.length === 0 ||
                    conditions.some(c => c.subscriptionId === s.id || c.subscriberId === s.subscriber.id)
            )
        );
    }

    createSubscription(createParameters: NotificationSubscriptionCreateParameters): Promise<NotificationSubscription> {
        return Promise.resolve({ ...makeNotificationSubscription(), ...createParameters });
    }

    deleteSubscription(_subscriptionId: string): Promise<void> {
        return Promise.resolve();
    }

    getSubscription(subscriptionId: string, _queryFlags?: SubscriptionQueryFlags): Promise<NotificationSubscription> {
        return Promise.resolve(findSubscription(subscriptionId));
    }

    listSubscriptions(
        targetId?: string,
        ids?: string[],
        _queryFlags?: SubscriptionQueryFlags
    ): Promise<NotificationSubscription[]> {
        return Promise.resolve(
            subscriptions.filter(
                s =>
                    (targetId === undefined || s.subscriber.id === targetId) &&
                    (ids === undefined || ids.includes(s.id))
            )
        );
    }

    updateSubscription(
        updateParameters: NotificationSubscriptionUpdateParameters,
        subscriptionId: string
    ): Promise<NotificationSubscription> {
        return Promise.resolve({ ...findSubscription(subscriptionId), ...updateParameters, id: subscriptionId });
    }

    getSubscriptionTemplates(): Promise<NotificationSubscriptionTemplate[]> {
        return Promise.resolve(templates);
    }

    publishTokenEvent(notificationEvent: VssNotificationEvent): Promise<VssNotificationEvent> {
        return Promise.resolve({ ...makeVssNotificationEvent(), ...notificationEvent });
    }

    updateSubscriptionUserSettings(
        userSettings: SubscriptionUserSettings,
        _subscriptionId: string,
        _userId: string
    ): Promise<SubscriptionUserSettings> {
        return Promise.resolve({ ...userSettings });
    }
}
