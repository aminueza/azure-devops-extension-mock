import { IVssRestClientOptions } from "azure-devops-extension-api/Common";
import { RestClientBase } from "../common/RestClientBase";
import {
    Consumer,
    ConsumerAction,
    EventTypeDescriptor,
    Notification,
    NotificationResult,
    NotificationStatus,
    NotificationsQuery,
    Publisher,
    PublisherEvent,
    PublishersQuery,
    ServiceHooksRestClient,
    Subscription,
    SubscriptionsQuery
} from "azure-devops-extension-api/ServiceHooks";
import { InputValuesQuery } from "azure-devops-extension-api/FormInput";
import {
    SubscriptionDiagnostics,
    UpdateSubscripitonDiagnosticsParameters
} from "azure-devops-extension-api/Notification";
import { makeSubscriptionDiagnostics } from "../notification/Data";
import {
    consumers,
    diagnostics,
    makeConsumer,
    makeConsumerAction,
    makeEventTypeDescriptor,
    makeInputValuesQuery,
    makeNotification,
    makeNotificationSummary,
    makePublisher,
    makePublisherEvent,
    makeSubscription,
    notifications,
    publishers,
    subscriptions
} from "./Data";

const findPublisher = (publisherId: string): Publisher =>
    publishers.find(p => p.id === publisherId) ?? makePublisher(publisherId);

const findConsumer = (consumerId: string): Consumer =>
    consumers.find(c => c.id === consumerId) ?? makeConsumer(consumerId);

const findSubscription = (subscriptionId: string): Subscription =>
    subscriptions.find(s => s.id === subscriptionId) ?? { ...makeSubscription(), id: subscriptionId };

const findDiagnostics = (subscriptionId: string): SubscriptionDiagnostics =>
    diagnostics.get(subscriptionId) ?? makeSubscriptionDiagnostics();

const findNotifications = (subscriptionId: string): Notification[] => {
    const known = notifications.filter(n => n.subscriptionId === subscriptionId);
    return known.length > 0 ? known : notifications.map(n => ({ ...n, subscriptionId }));
};

const matchSubscriptions = (
    publisherId?: string,
    eventType?: string,
    consumerId?: string,
    consumerActionId?: string
): Subscription[] =>
    subscriptions.filter(
        s =>
            (publisherId === undefined || s.publisherId === publisherId) &&
            (eventType === undefined || s.eventType === eventType) &&
            (consumerId === undefined || s.consumerId === consumerId) &&
            (consumerActionId === undefined || s.consumerActionId === consumerActionId)
    );

export class MockServiceHooksRestClient extends RestClientBase {
    public TYPE = ServiceHooksRestClient;
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    getConsumerAction(consumerId: string, consumerActionId: string, _publisherId?: string): Promise<ConsumerAction> {
        return Promise.resolve(
            findConsumer(consumerId).actions.find(a => a.id === consumerActionId) ?? {
                ...makeConsumerAction(consumerId),
                id: consumerActionId
            }
        );
    }

    listConsumerActions(consumerId: string, _publisherId?: string): Promise<ConsumerAction[]> {
        return Promise.resolve(findConsumer(consumerId).actions);
    }

    getConsumer(consumerId: string, _publisherId?: string): Promise<Consumer> {
        return Promise.resolve(findConsumer(consumerId));
    }

    listConsumers(_publisherId?: string): Promise<Consumer[]> {
        return Promise.resolve(consumers);
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

    getEventType(publisherId: string, eventTypeId: string): Promise<EventTypeDescriptor> {
        return Promise.resolve(
            findPublisher(publisherId).supportedEvents.find(e => e.id === eventTypeId) ?? {
                ...makeEventTypeDescriptor(publisherId),
                id: eventTypeId
            }
        );
    }

    listEventTypes(publisherId: string): Promise<EventTypeDescriptor[]> {
        return Promise.resolve(findPublisher(publisherId).supportedEvents);
    }

    publishExternalEvent(publisherId: string, _channelId?: string): Promise<PublisherEvent[]> {
        return Promise.resolve(matchSubscriptions(publisherId).map(makePublisherEvent));
    }

    getNotification(subscriptionId: string, notificationId: number): Promise<Notification> {
        return Promise.resolve(
            notifications.find(n => n.id === notificationId && n.subscriptionId === subscriptionId) ?? {
                ...makeNotification(findSubscription(subscriptionId)),
                id: notificationId
            }
        );
    }

    getNotifications(
        subscriptionId: string,
        maxResults?: number,
        status?: NotificationStatus,
        result?: NotificationResult
    ): Promise<Notification[]> {
        return Promise.resolve(
            findNotifications(subscriptionId)
                .filter(n => (status === undefined || n.status === status) && (result === undefined || n.result === result))
                .slice(0, maxResults)
        );
    }

    queryNotifications(query: NotificationsQuery): Promise<NotificationsQuery> {
        const ids = query.subscriptionIds ?? [];
        const matching = notifications.filter(n => ids.length === 0 || ids.includes(n.subscriptionId));
        const matchedIds = [...new Set(matching.map(n => n.subscriptionId))];
        return Promise.resolve({
            ...query,
            associatedSubscriptions: subscriptions.filter(s => matchedIds.includes(s.id)),
            results: query.includeDetails === false ? [] : matching,
            summary: matchedIds.map(id => makeNotificationSummary(id, matching))
        });
    }

    queryInputValues(inputValuesQuery: InputValuesQuery, _publisherId: string): Promise<InputValuesQuery> {
        return Promise.resolve({ ...makeInputValuesQuery(), ...inputValuesQuery });
    }

    getPublisher(publisherId: string): Promise<Publisher> {
        return Promise.resolve(findPublisher(publisherId));
    }

    listPublishers(): Promise<Publisher[]> {
        return Promise.resolve(publishers);
    }

    queryPublishers(query: PublishersQuery): Promise<PublishersQuery> {
        const ids = query.publisherIds ?? [];
        return Promise.resolve({
            ...query,
            results: publishers.filter(p => ids.length === 0 || ids.includes(p.id))
        });
    }

    createSubscription(subscription: Subscription): Promise<Subscription> {
        return Promise.resolve({ ...makeSubscription(), ...subscription });
    }

    deleteSubscription(_subscriptionId: string): Promise<void> {
        return Promise.resolve();
    }

    getSubscription(subscriptionId: string): Promise<Subscription> {
        return Promise.resolve(findSubscription(subscriptionId));
    }

    listSubscriptions(
        publisherId?: string,
        eventType?: string,
        consumerId?: string,
        consumerActionId?: string
    ): Promise<Subscription[]> {
        return Promise.resolve(matchSubscriptions(publisherId, eventType, consumerId, consumerActionId));
    }

    replaceSubscription(subscription: Subscription, subscriptionId?: string): Promise<Subscription> {
        const id = subscriptionId ?? subscription.id;
        return Promise.resolve({ ...findSubscription(id), ...subscription, id });
    }

    createSubscriptionsQuery(query: SubscriptionsQuery): Promise<SubscriptionsQuery> {
        return Promise.resolve({
            ...query,
            results: matchSubscriptions(query.publisherId, query.eventType, query.consumerId, query.consumerActionId)
        });
    }

    createTestNotification(testNotification: Notification, _useRealData?: boolean): Promise<Notification> {
        return Promise.resolve({ ...makeNotification(), ...testNotification });
    }
}
