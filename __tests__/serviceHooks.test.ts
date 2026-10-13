import {
    Notification,
    NotificationResult,
    NotificationsQuery,
    NotificationStatus,
    PublishersQuery,
    ServiceHooksRestClient,
    Subscription,
    SubscriptionsQuery,
    SubscriptionStatus
} from "azure-devops-extension-api/ServiceHooks";
import { InputMode, InputValuesQuery } from "azure-devops-extension-api/FormInput";
import { getClient, getRegisteredMockClient, MockServiceHooksRestClient } from "../azure-devops-extension-api";
import {
    consumers,
    diagnostics,
    eventTypes,
    makeConsumer,
    makeConsumerAction,
    makeEvent,
    makeEventTypeDescriptor,
    makeFailedNotification,
    makeHookInputDescriptor,
    makeInputValuesQuery,
    makeNotification,
    makeNotificationDetails,
    makeNotificationSummary,
    makePublisher,
    makePublisherEvent,
    makeQueuedNotification,
    makeSubscription,
    notifications,
    publishers,
    subscriptions
} from "../azure-devops-extension-api/serviceHooks/Data";

const SECRET_KEYS = /password|token|key|secret/i;

describe("ServiceHooksRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(ServiceHooksRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(ServiceHooksRestClient)).toBe(MockServiceHooksRestClient);
    });

    it("gets a known consumer action", async () => {
        const action = await client.getConsumerAction("webHooks", "httpRequest", "tfs");
        expect(action).toBe(consumers[0].actions[0]);
        expect(action.inputDescriptors.map(d => d.id)).toEqual([
            "url",
            "basicAuthUsername",
            "basicAuthPassword",
            "httpHeaders"
        ]);
    });

    it("fabricates an unknown action of a known consumer", async () => {
        const action = await client.getConsumerAction("slack", "missing-action");
        expect(action.id).toBe("missing-action");
        expect(action.consumerId).toBe("slack");
    });

    it("fabricates an action of an unknown consumer", async () => {
        const action = await client.getConsumerAction("missing-consumer", "missing-action");
        expect(action.id).toBe("missing-action");
        expect(action.consumerId).toBe("missing-consumer");
    });

    it("lists the actions of a known consumer", async () => {
        expect(await client.listConsumerActions("slack", "tfs")).toBe(consumers[1].actions);
    });

    it("fabricates the actions of an unknown consumer", async () => {
        const actions = await client.listConsumerActions("missing-consumer");
        expect(actions.length).toBe(1);
        expect(actions[0].consumerId).toBe("missing-consumer");
    });

    it("gets a known consumer", async () => {
        expect(await client.getConsumer("azureStorageQueue", "tfs")).toBe(consumers[2]);
    });

    it("fabricates an unknown consumer", async () => {
        const made = await client.getConsumer("missing-consumer");
        expect(made.id).toBe("missing-consumer");
        expect(typeof made.name).toBe("string");
        expect(made._links).toEqual({});
    });

    it("lists consumers", async () => {
        const list = await client.listConsumers("tfs");
        expect(list).toBe(consumers);
        expect(list.map(c => c.id)).toEqual(["webHooks", "slack", "azureStorageQueue"]);
    });

    it("gets the diagnostics of a known subscription", async () => {
        const found = await client.getSubscriptionDiagnostics(subscriptions[0].id);
        expect(found).toBe(diagnostics.get(subscriptions[0].id));
    });

    it("fabricates the diagnostics of an unknown subscription", async () => {
        const made = await client.getSubscriptionDiagnostics("missing-subscription");
        expect(made.deliveryTracing.enabled).toBe(false);
        expect([...diagnostics.values()]).not.toContain(made);
    });

    it("updates the diagnostics of a known subscription", async () => {
        const target = subscriptions[1].id;
        const updated = await client.updateSubscriptionDiagnostics(
            {
                deliveryResults: { enabled: true },
                deliveryTracing: { enabled: true },
                evaluationTracing: { enabled: false }
            },
            target
        );
        expect(updated.deliveryResults.enabled).toBe(true);
        expect(updated.deliveryTracing.enabled).toBe(true);
        expect(updated.evaluationTracing.enabled).toBe(false);
        expect(updated.deliveryResults.endDate).toBe(diagnostics.get(target)!.deliveryResults.endDate);
        expect(diagnostics.get(target)!.deliveryResults.enabled).toBe(false);
    });

    it("updates the diagnostics of an unknown subscription", async () => {
        const updated = await client.updateSubscriptionDiagnostics(
            {
                deliveryResults: { enabled: false },
                deliveryTracing: { enabled: false },
                evaluationTracing: { enabled: true }
            },
            "missing-subscription"
        );
        expect(updated.evaluationTracing.enabled).toBe(true);
        expect(updated.evaluationTracing.maxTracedEntries).toBe(100);
    });

    it("gets a known event type", async () => {
        const type = await client.getEventType("tfs", "git.push");
        expect(type).toBe(eventTypes[1]);
        expect(type.name).toBe("Code pushed");
    });

    it("fabricates an unknown event type of a known publisher", async () => {
        const type = await client.getEventType("tfs", "missing.event");
        expect(type.id).toBe("missing.event");
        expect(type.publisherId).toBe("tfs");
    });

    it("fabricates an event type of an unknown publisher", async () => {
        const type = await client.getEventType("missing-publisher", "missing.event");
        expect(type.id).toBe("missing.event");
        expect(type.publisherId).toBe("missing-publisher");
    });

    it("lists the event types of a known publisher", async () => {
        const types = await client.listEventTypes("tfs");
        expect(types).toBe(eventTypes);
        expect(types.map(t => t.id)).toEqual(["build.complete", "git.push", "workitem.created"]);
    });

    it("fabricates the event types of an unknown publisher", async () => {
        const types = await client.listEventTypes("missing-publisher");
        expect(types.length).toBe(1);
        expect(types[0].publisherId).toBe("missing-publisher");
    });

    it("publishes an external event to the subscriptions of the publisher", async () => {
        const events = await client.publishExternalEvent("tfs", "channel-1");
        expect(events.map(e => e.subscription)).toEqual(subscriptions);
        for (const published of events) {
            expect(published.event.publisherId).toBe("tfs");
            expect(published.event.eventType).toBe(published.subscription.eventType);
        }
        expect(await client.publishExternalEvent("missing-publisher")).toEqual([]);
    });

    it("gets a known notification", async () => {
        const target = notifications[1];
        expect(await client.getNotification(target.subscriptionId, target.id)).toBe(target);
    });

    it("fabricates an unknown notification of a known subscription", async () => {
        const target = subscriptions[1];
        const made = await client.getNotification(target.id, 999_999);
        expect(made.id).toBe(999_999);
        expect(made.subscriptionId).toBe(target.id);
        expect(made.details.eventType).toBe("git.push");
        expect(made.details.consumerId).toBe("slack");
    });

    it("fabricates a notification of an unknown subscription", async () => {
        const made = await client.getNotification("missing-subscription", notifications[0].id);
        expect(made.id).toBe(notifications[0].id);
        expect(made.subscriptionId).toBe("missing-subscription");
        expect(made).not.toBe(notifications[0]);
    });

    it("lists the notifications of a known subscription", async () => {
        const list = await client.getNotifications(subscriptions[0].id);
        expect(list).toEqual([notifications[0], notifications[1]]);
    });

    it("lists the seeded notifications for an unknown subscription", async () => {
        const list = await client.getNotifications("missing-subscription");
        expect(list.map(n => n.id)).toEqual(notifications.map(n => n.id));
        for (const notification of list) {
            expect(notification.subscriptionId).toBe("missing-subscription");
        }
    });

    it("lists notifications filtered by status, result and count", async () => {
        const id = "missing-subscription";
        const queued = await client.getNotifications(id, undefined, NotificationStatus.Queued);
        expect(queued.map(n => n.id)).toEqual([notifications[3].id]);
        const failed = await client.getNotifications(id, undefined, undefined, NotificationResult.Failed);
        expect(failed.map(n => n.id)).toEqual([notifications[1].id]);
        const succeeded = await client.getNotifications(
            id,
            1,
            NotificationStatus.Completed,
            NotificationResult.Succeeded
        );
        expect(succeeded.map(n => n.id)).toEqual([notifications[0].id]);
        expect(await client.getNotifications(id, 5, NotificationStatus.Queued, NotificationResult.Failed)).toEqual([]);
    });

    it("queries every notification", async () => {
        const result = await client.queryNotifications({ maxResults: 10 } as NotificationsQuery);
        expect(result.maxResults).toBe(10);
        expect(result.results).toEqual(notifications);
        expect(result.associatedSubscriptions).toEqual(subscriptions);
        expect(result.summary).toEqual([
            {
                subscriptionId: subscriptions[0].id,
                results: [
                    { result: NotificationResult.Succeeded, notificationCount: 1 },
                    { result: NotificationResult.Failed, notificationCount: 1 }
                ]
            },
            {
                subscriptionId: subscriptions[1].id,
                results: [{ result: NotificationResult.Succeeded, notificationCount: 1 }]
            },
            {
                subscriptionId: subscriptions[2].id,
                results: [{ result: NotificationResult.Pending, notificationCount: 1 }]
            }
        ]);
    });

    it("queries the notifications of the given subscriptions", async () => {
        const query = { subscriptionIds: [subscriptions[0].id, "nothing"], includeDetails: true } as NotificationsQuery;
        const result = await client.queryNotifications(query);
        expect(result.subscriptionIds).toBe(query.subscriptionIds);
        expect(result.results).toEqual([notifications[0], notifications[1]]);
        expect(result.associatedSubscriptions).toEqual([subscriptions[0]]);
        expect(result.summary.map(s => s.subscriptionId)).toEqual([subscriptions[0].id]);
    });

    it("queries only the summary when details are not wanted", async () => {
        const result = await client.queryNotifications({ subscriptionIds: [], includeDetails: false } as never);
        expect(result.results).toEqual([]);
        expect(result.summary.length).toBe(3);
    });

    it("queries input values echoing the posted query", async () => {
        const posted: InputValuesQuery = { ...makeInputValuesQuery(), currentValues: { projectId: "p-1" } };
        const result = await client.queryInputValues(posted, "tfs");
        expect(result).toEqual(posted);
        expect(result).not.toBe(posted);
    });

    it("fills the input values of a partial query", async () => {
        const result = await client.queryInputValues({ currentValues: { projectId: "p-1" } } as never, "tfs");
        expect(result.currentValues).toEqual({ projectId: "p-1" });
        expect(result.inputValues[0].inputId).toBe("repository");
        expect(result.inputValues[0].possibleValues.length).toBe(2);
    });

    it("gets a known publisher", async () => {
        const publisher = await client.getPublisher("tfs");
        expect(publisher).toBe(publishers[0]);
        expect(publisher.supportedEvents).toBe(eventTypes);
    });

    it("fabricates an unknown publisher", async () => {
        const made = await client.getPublisher("missing-publisher");
        expect(made.id).toBe("missing-publisher");
        expect(made.supportedEvents[0].publisherId).toBe("missing-publisher");
    });

    it("lists publishers", async () => {
        const list = await client.listPublishers();
        expect(list).toBe(publishers);
        expect(list.map(p => p.id)).toEqual(["tfs", "rm", "pipelines"]);
    });

    it("queries every publisher", async () => {
        const result = await client.queryPublishers({ publisherInputs: { projectId: "p-1" } } as never);
        expect(result.publisherInputs).toEqual({ projectId: "p-1" });
        expect(result.results).toEqual(publishers);
        const empty: PublishersQuery = { publisherIds: [], publisherInputs: {}, results: [] };
        expect((await client.queryPublishers(empty)).results).toEqual(publishers);
    });

    it("queries the given publishers", async () => {
        const query: PublishersQuery = { publisherIds: ["rm", "nothing"], publisherInputs: {}, results: [] };
        const result = await client.queryPublishers(query);
        expect(result.publisherIds).toEqual(["rm", "nothing"]);
        expect(result.results).toEqual([publishers[1]]);
    });

    it("creates a subscription echoing the posted object", async () => {
        const posted: Subscription = { ...makeSubscription(), eventType: "git.push" };
        const created = await client.createSubscription(posted);
        expect(created).toEqual(posted);
        expect(created).not.toBe(posted);
    });

    it("fills a partially posted subscription from a fixture", async () => {
        const created = await client.createSubscription({ consumerId: "slack" } as Subscription);
        expect(created.consumerId).toBe("slack");
        expect(typeof created.id).toBe("string");
        expect(created.status).toBe(SubscriptionStatus.Enabled);
        expect(created.createdDate).toBeInstanceOf(Date);
    });

    it("deletes a subscription", async () => {
        await expect(client.deleteSubscription(subscriptions[0].id)).resolves.toBeUndefined();
    });

    it("gets a known subscription", async () => {
        expect(await client.getSubscription(subscriptions[2].id)).toBe(subscriptions[2]);
    });

    it("fabricates an unknown subscription", async () => {
        const made = await client.getSubscription("missing-subscription");
        expect(made.id).toBe("missing-subscription");
        expect(made.publisherId).toBe("tfs");
        expect(made.consumerInputs.basicAuthPassword).toBe("***");
    });

    it("lists every subscription", async () => {
        const list = await client.listSubscriptions();
        expect(list).toEqual(subscriptions);
        expect(new Set(list.map(s => s.id)).size).toBe(3);
    });

    it.each<[string, (string | undefined)[], number[]]>([
        ["publisher", ["tfs"], [0, 1, 2]],
        ["another publisher", ["rm"], []],
        ["event type", [undefined, "git.push"], [1]],
        ["consumer", [undefined, undefined, "azureStorageQueue"], [2]],
        ["consumer action", [undefined, undefined, undefined, "httpRequest"], [0]],
        ["everything", ["tfs", "build.complete", "webHooks", "httpRequest"], [0]],
        ["a combination nothing has", ["tfs", "git.push", "webHooks", "httpRequest"], []]
    ])("lists subscriptions filtered by %s", async (_name, filters, expected) => {
        const list = await client.listSubscriptions(...filters);
        expect(list).toEqual(expected.map(index => subscriptions[index]));
    });

    it("replaces a known subscription", async () => {
        const target = subscriptions[1];
        const replaced = await client.replaceSubscription(
            { ...target, id: "ignored", status: SubscriptionStatus.DisabledByUser },
            target.id
        );
        expect(replaced.id).toBe(target.id);
        expect(replaced.status).toBe(SubscriptionStatus.DisabledByUser);
        expect(replaced.createdBy).toBe(target.createdBy);
        expect(target.status).toBe(SubscriptionStatus.Enabled);
    });

    it("replaces a subscription identified by the posted object", async () => {
        const target = subscriptions[0];
        const replaced = await client.replaceSubscription({ id: target.id, eventType: "git.push" } as Subscription);
        expect(replaced.id).toBe(target.id);
        expect(replaced.eventType).toBe("git.push");
        expect(replaced.consumerInputs).toBe(target.consumerInputs);
    });

    it("replaces an unknown subscription", async () => {
        const replaced = await client.replaceSubscription({ eventType: "git.push" } as Subscription, "missing");
        expect(replaced.id).toBe("missing");
        expect(replaced.eventType).toBe("git.push");
        expect(typeof replaced.url).toBe("string");
    });

    it("queries every subscription", async () => {
        const result = await client.createSubscriptionsQuery({ subscriberId: "someone" } as SubscriptionsQuery);
        expect(result.subscriberId).toBe("someone");
        expect(result.results).toEqual(subscriptions);
    });

    it("queries subscriptions by publisher, event, consumer and action", async () => {
        const query = {
            publisherId: "tfs",
            eventType: "workitem.created",
            consumerId: "azureStorageQueue",
            consumerActionId: "enqueue"
        } as SubscriptionsQuery;
        const result = await client.createSubscriptionsQuery(query);
        expect(result.consumerId).toBe("azureStorageQueue");
        expect(result.results).toEqual([subscriptions[2]]);
        const none = await client.createSubscriptionsQuery({ ...query, consumerActionId: "httpRequest" });
        expect(none.results).toEqual([]);
    });

    it("creates a test notification echoing the posted object", async () => {
        const posted: Notification = makeNotification(subscriptions[0]);
        const created = await client.createTestNotification(posted, true);
        expect(created).toEqual(posted);
        expect(created).not.toBe(posted);
    });

    it("fills a partially posted test notification from a fixture", async () => {
        const created = await client.createTestNotification({ subscriptionId: "sub-1" } as Notification);
        expect(created.subscriptionId).toBe("sub-1");
        expect(typeof created.id).toBe("number");
        expect(created.status).toBe(NotificationStatus.Completed);
        expect(created.details.event.id).toBe(created.eventId);
    });
});

describe("service hooks fixtures", () => {
    it("makes input descriptors that mark confidential inputs", () => {
        expect(makeHookInputDescriptor("url").isConfidential).toBe(false);
        expect(makeHookInputDescriptor("url").inputMode).toBe(InputMode.TextBox);
        expect(makeHookInputDescriptor("secret", true).isConfidential).toBe(true);
        expect(makeHookInputDescriptor("secret", true).inputMode).toBe(InputMode.PasswordBox);
        expect(makeHookInputDescriptor("url").groupName).toBe("");
    });

    it("makes event types, publishers, consumers and actions tied to the given ids", () => {
        expect(makeEventTypeDescriptor().publisherId).toBe("tfs");
        expect(makeEventTypeDescriptor("rm").publisherId).toBe("rm");
        expect(makePublisher("custom").supportedEvents[0].publisherId).toBe("custom");
        const publisher = makePublisher();
        expect(publisher.supportedEvents[0].publisherId).toBe(publisher.id);
        expect(makeConsumer("custom").actions[0].consumerId).toBe("custom");
        const consumer = makeConsumer();
        expect(consumer.actions[0].consumerId).toBe(consumer.id);
        expect(makeConsumerAction("custom").consumerId).toBe("custom");
        expect(typeof makeConsumerAction().consumerId).toBe("string");
    });

    it("makes an event for the given publisher and type", () => {
        expect(makeEvent().publisherId).toBe("tfs");
        expect(makeEvent().eventType).toBe("build.complete");
        const event = makeEvent("rm", "release.created");
        expect(event.publisherId).toBe("rm");
        expect(event.eventType).toBe("release.created");
        expect(Object.keys(event.resourceContainers)).toEqual(["collection", "account", "project"]);
        expect(event.message.html).toBe(`<p>${event.message.text}</p>`);
        expect(event.sessionToken).toBeUndefined();
    });

    it("makes notification details from the subscription", () => {
        const details = makeNotificationDetails(subscriptions[1]);
        expect(details.consumerId).toBe("slack");
        expect(details.consumerInputs).toEqual(subscriptions[1].consumerInputs);
        expect(details.consumerInputs).not.toBe(subscriptions[1].consumerInputs);
        expect(details.errorMessage).toBeUndefined();
        expect(details.nextRetryTime).toBeUndefined();
        expect(makeNotificationDetails().publisherId).toBe("tfs");
    });

    it("makes succeeded, failed and queued notifications", () => {
        const succeeded = makeNotification();
        expect(succeeded.result).toBe(NotificationResult.Succeeded);
        expect(succeeded.details.completedDate).toBeInstanceOf(Date);
        const failed = makeFailedNotification();
        expect(failed.result).toBe(NotificationResult.Failed);
        expect(failed.details.errorMessage).toBe("Internal Server Error (500)");
        expect(makeFailedNotification(subscriptions[0]).subscriptionId).toBe(subscriptions[0].id);
        const queued = makeQueuedNotification();
        expect(queued.status).toBe(NotificationStatus.Queued);
        expect(queued.result).toBe(NotificationResult.Pending);
        expect(queued.details.completedDate).toBeUndefined();
        expect(queued.details.queuedDate).toBeInstanceOf(Date);
        expect(makeQueuedNotification(subscriptions[0]).subscriberId).toBe(subscriptions[0].subscriber.id);
    });

    it("summarizes the notifications of one subscription", () => {
        expect(makeNotificationSummary(subscriptions[0].id, notifications).results).toEqual([
            { result: NotificationResult.Succeeded, notificationCount: 1 },
            { result: NotificationResult.Failed, notificationCount: 1 }
        ]);
        expect(makeNotificationSummary("nothing", notifications)).toEqual({ subscriptionId: "nothing", results: [] });
    });

    it("makes a publisher event for the given subscription", () => {
        const published = makePublisherEvent(subscriptions[2]);
        expect(published.subscription).toBe(subscriptions[2]);
        expect(published.event.eventType).toBe("workitem.created");
        expect(makePublisherEvent().event.eventType).toBe("build.complete");
    });

    it("seeds subscriptions that point at seeded publishers, events, consumers and actions", () => {
        for (const subscription of subscriptions) {
            const publisher = publishers.find(p => p.id === subscription.publisherId)!;
            expect(publisher.supportedEvents.map(e => e.id)).toContain(subscription.eventType);
            const consumer = consumers.find(c => c.id === subscription.consumerId)!;
            const action = consumer.actions.find(a => a.id === subscription.consumerActionId)!;
            expect(action.inputDescriptors.map(d => d.id)).toEqual(
                expect.arrayContaining(Object.keys(subscription.consumerInputs))
            );
        }
        expect(new Set(subscriptions.map(s => s.id)).size).toBe(subscriptions.length);
    });

    it("seeds notifications with details for seeded subscriptions", () => {
        const ids = subscriptions.map(s => s.id);
        for (const notification of notifications) {
            expect(ids).toContain(notification.subscriptionId);
            expect(notification.details.event.id).toBe(notification.eventId);
        }
        expect(new Set(notifications.map(n => n.id)).size).toBe(notifications.length);
        expect([...diagnostics.keys()]).toEqual(ids);
    });

    it("masks every confidential consumer input", () => {
        const confidential = new Set(
            consumers.flatMap(c =>
                c.actions.flatMap(a => a.inputDescriptors.filter(d => d.isConfidential).map(d => d.id))
            )
        );
        expect([...confidential].sort()).toEqual(["accountKey", "basicAuthPassword", "url"]);
        const inputs = [
            ...subscriptions.map(s => [s.consumerId, s.consumerInputs] as const),
            ...notifications.map(n => [n.details.consumerId, n.details.consumerInputs] as const)
        ];
        for (const [consumerId, values] of inputs) {
            const consumer = consumers.find(c => c.id === consumerId)!;
            const secret = consumer.actions.flatMap(a =>
                a.inputDescriptors.filter(d => d.isConfidential).map(d => d.id)
            );
            for (const [key, value] of Object.entries(values)) {
                if (secret.includes(key) || SECRET_KEYS.test(key)) {
                    expect(value).toBe("***");
                }
            }
        }
    });
});
