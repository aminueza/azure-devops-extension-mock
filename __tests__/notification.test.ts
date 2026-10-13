import {
    BatchNotificationOperation,
    DefaultGroupDeliveryPreference,
    FieldValuesQuery,
    NotificationOperation,
    NotificationReasonType,
    NotificationRestClient,
    NotificationStatisticType,
    NotificationSubscriberDeliveryPreference,
    NotificationSubscriptionCreateParameters,
    NotificationSubscriptionUpdateParameters,
    SubscriptionQuery,
    SubscriptionQueryFlags,
    SubscriptionStatus,
    SubscriptionTemplateType,
    UpdateSubscripitonDiagnosticsParameters
} from "azure-devops-extension-api/Notification";
import { getClient, getRegisteredMockClient, MockNotificationRestClient } from "../azure-devops-extension-api";
import {
    COLLECTION_SCOPE,
    diagnosticLogs,
    diagnostics,
    eventTypes,
    makeEventActor,
    makeEventTransformResult,
    makeExpressionFilter,
    makeNotificationAdminSettings,
    makeNotificationDiagnosticLog,
    makeNotificationEventField,
    makeNotificationEventPublisher,
    makeNotificationEventType,
    makeNotificationReason,
    makeNotificationStatistic,
    makeNotificationSubscriber,
    makeNotificationSubscription,
    makeNotificationSubscriptionTemplate,
    makeSubscriptionChannel,
    makeSubscriptionDiagnostics,
    makeSubscriptionScope,
    makeSubscriptionTracing,
    makeVssNotificationEvent,
    reasons,
    settings,
    statistics,
    subscribers,
    subscriptions,
    templates
} from "../azure-devops-extension-api/notification/Data";
import { makeIdentityRef } from "../azure-devops-extension-api/core/Data";

const WORK_ITEM_CHANGED = "ms.vss-work.workitem-changed-event";

const tracingUpdate = (
    deliveryResults: boolean,
    deliveryTracing: boolean,
    evaluationTracing: boolean
): UpdateSubscripitonDiagnosticsParameters => ({
    deliveryResults: { enabled: deliveryResults },
    deliveryTracing: { enabled: deliveryTracing },
    evaluationTracing: { enabled: evaluationTracing }
});

describe("NotificationRestClient mock", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(NotificationRestClient);

    it("is registered for the real client", () => {
        expect(getRegisteredMockClient(NotificationRestClient)).toBe(MockNotificationRestClient);
    });

    it("performs a batch operation", async () => {
        const operation: BatchNotificationOperation = {
            notificationOperation: NotificationOperation.SuspendUnprocessed,
            notificationQueryConditions: []
        };
        await expect(client.performBatchNotificationOperations(operation)).resolves.toBeUndefined();
    });

    it("lists the logs of a source", async () => {
        const logs = await client.listLogs("source-1");
        expect(logs.map(log => log.id)).toEqual(diagnosticLogs.map(log => log.id));
        for (const log of logs) {
            expect(log.source).toBe("source-1");
        }
        expect(diagnosticLogs.every(log => log.source !== "source-1")).toBe(true);
    });

    it("lists a known log entry", async () => {
        const target = diagnosticLogs[1];
        const logs = await client.listLogs("source-1", target.id, new Date(0), new Date());
        expect(logs).toEqual([{ ...target, source: "source-1" }]);
    });

    it("fabricates an unknown log entry", async () => {
        const logs = await client.listLogs("source-1", "missing-entry");
        expect(logs.length).toBe(1);
        expect(logs[0].id).toBe("missing-entry");
        expect(logs[0].source).toBe("source-1");
        expect(logs[0].startTime).toBeInstanceOf(Date);
    });

    it("gets the diagnostics of a known subscription", async () => {
        expect(await client.getSubscriptionDiagnostics(subscriptions[1].id)).toBe(diagnostics[1]);
    });

    it("fabricates the diagnostics of an unknown subscription", async () => {
        const made = await client.getSubscriptionDiagnostics("missing-subscription");
        expect(made.deliveryResults.enabled).toBe(false);
        expect(made.deliveryTracing.enabled).toBe(false);
        expect(made.evaluationTracing.enabled).toBe(false);
        expect(diagnostics).not.toContain(made);
    });

    it("updates the diagnostics of a known subscription", async () => {
        const target = subscriptions[0];
        const updated = await client.updateSubscriptionDiagnostics(tracingUpdate(true, false, true), target.id);
        expect(updated.deliveryResults.enabled).toBe(true);
        expect(updated.deliveryTracing.enabled).toBe(false);
        expect(updated.evaluationTracing.enabled).toBe(true);
        expect(updated.deliveryResults.startDate).toBe(target.diagnostics.deliveryResults.startDate);
        expect(target.diagnostics.deliveryResults.enabled).toBe(false);
    });

    it("updates the diagnostics of an unknown subscription", async () => {
        const updated = await client.updateSubscriptionDiagnostics(tracingUpdate(false, true, false), "missing");
        expect(updated.deliveryTracing.enabled).toBe(true);
        expect(updated.deliveryTracing.maxTracedEntries).toBe(100);
    });

    it("publishes an event echoing the posted object", async () => {
        const posted = { ...makeVssNotificationEvent(), eventType: "custom.event", data: { answer: 42 } };
        const published = await client.publishEvent(posted);
        expect(published).toEqual(posted);
        expect(published).not.toBe(posted);
    });

    it("transforms an event", async () => {
        const result = await client.transformEvent({
            eventPayload: "{\"id\":1}",
            eventType: WORK_ITEM_CHANGED,
            systemInputs: { locale: "en-US" }
        });
        expect(result.content).toBe("{\"id\":1}");
        expect(result.systemInputs).toEqual({ locale: "en-US" });
        expect(result.data).toEqual({});
    });

    it("queries the fields of a known event type", async () => {
        const query: FieldValuesQuery = { currentValues: {}, inputValues: [], resource: {}, scope: COLLECTION_SCOPE };
        const fields = await client.queryEventTypes(query, WORK_ITEM_CHANGED);
        expect(fields.map(field => field.name)).toEqual(["Assigned To", "State"]);
        expect(fields).toEqual(Object.values(eventTypes[0].fields));
    });

    it("queries the fields of an unknown event type", async () => {
        const query: FieldValuesQuery = { currentValues: {}, inputValues: [], resource: {}, scope: COLLECTION_SCOPE };
        const fields = await client.queryEventTypes(query, "missing-event");
        expect(fields.length).toBe(2);
    });

    it("gets a known event type", async () => {
        expect(await client.getEventType(WORK_ITEM_CHANGED)).toBe(eventTypes[0]);
    });

    it("fabricates an unknown event type", async () => {
        const made = await client.getEventType("missing-event");
        expect(made.id).toBe("missing-event");
        expect(typeof made.name).toBe("string");
        expect(made.roles.length).toBe(1);
    });

    it("lists every event type", async () => {
        const types = await client.listEventTypes();
        expect(types).toEqual(eventTypes);
        expect(new Set(types.map(t => t.id)).size).toBe(3);
    });

    it("lists the event types of a publisher", async () => {
        const types = await client.listEventTypes("ms.vss-code.git-event-publisher");
        expect(types).toEqual([eventTypes[1]]);
        expect(await client.listEventTypes("missing-publisher")).toEqual([]);
    });

    it("gets the reason of a notification", async () => {
        expect(await client.getNotificationReasons(0)).toBe(reasons[0]);
        expect(await client.getNotificationReasons(4)).toBe(reasons[1]);
        expect(await client.getNotificationReasons(-2)).toBe(reasons[2]);
    });

    it("lists notification reasons", async () => {
        expect(await client.listNotificationReasons()).toBe(reasons);
        expect(await client.listNotificationReasons(5)).toEqual([reasons[2]]);
    });

    it("gets the settings", async () => {
        const current = await client.getSettings();
        expect(current).toBe(settings);
        expect(current.defaultGroupDeliveryPreference).toBe(DefaultGroupDeliveryPreference.EachMember);
    });

    it("updates the settings", async () => {
        const updated = await client.updateSettings({
            defaultGroupDeliveryPreference: DefaultGroupDeliveryPreference.NoDelivery
        });
        expect(updated.defaultGroupDeliveryPreference).toBe(DefaultGroupDeliveryPreference.NoDelivery);
        expect(settings.defaultGroupDeliveryPreference).toBe(DefaultGroupDeliveryPreference.EachMember);
    });

    it("gets a known subscriber", async () => {
        expect(await client.getSubscriber(subscribers[2].id)).toBe(subscribers[2]);
    });

    it("fabricates an unknown subscriber", async () => {
        const made = await client.getSubscriber("missing-subscriber");
        expect(made.id).toBe("missing-subscriber");
        expect(made.preferredEmailAddress.endsWith("@example.com")).toBe(true);
    });

    it("updates a known subscriber", async () => {
        const target = subscribers[0];
        const updated = await client.updateSubscriber(
            {
                deliveryPreference: NotificationSubscriberDeliveryPreference.NoDelivery,
                preferredEmailAddress: "someone@example.com"
            },
            target.id
        );
        expect(updated.id).toBe(target.id);
        expect(updated.flags).toBe(target.flags);
        expect(updated.deliveryPreference).toBe(NotificationSubscriberDeliveryPreference.NoDelivery);
        expect(updated.preferredEmailAddress).toBe("someone@example.com");
        expect(target.deliveryPreference).toBe(NotificationSubscriberDeliveryPreference.PreferredEmailAddress);
    });

    it("updates an unknown subscriber", async () => {
        const updated = await client.updateSubscriber(
            {
                deliveryPreference: NotificationSubscriberDeliveryPreference.UseDefault,
                preferredEmailAddress: "other@example.com"
            },
            "missing-subscriber"
        );
        expect(updated.id).toBe("missing-subscriber");
        expect(updated.deliveryPreference).toBe(NotificationSubscriberDeliveryPreference.UseDefault);
    });

    it("queries every subscription when there are no conditions", async () => {
        const query: SubscriptionQuery = { conditions: [], queryFlags: SubscriptionQueryFlags.None };
        expect(await client.querySubscriptions(query)).toEqual(subscriptions);
        expect(await client.querySubscriptions({} as SubscriptionQuery)).toEqual(subscriptions);
    });

    it("queries subscriptions by id and by subscriber", async () => {
        const base = { filter: makeExpressionFilter(), flags: 0, scope: COLLECTION_SCOPE };
        const query: SubscriptionQuery = {
            conditions: [
                { ...base, subscriptionId: subscriptions[0].id, subscriberId: "nobody" },
                { ...base, subscriptionId: "nothing", subscriberId: subscribers[2].id }
            ],
            queryFlags: SubscriptionQueryFlags.IncludeFilterDetails
        };
        expect(await client.querySubscriptions(query)).toEqual([subscriptions[0], subscriptions[2]]);
    });

    it("queries no subscription when no condition matches", async () => {
        const query: SubscriptionQuery = {
            conditions: [
                {
                    filter: makeExpressionFilter(),
                    flags: 0,
                    scope: COLLECTION_SCOPE,
                    subscriptionId: "nothing",
                    subscriberId: "nobody"
                }
            ],
            queryFlags: SubscriptionQueryFlags.None
        };
        expect(await client.querySubscriptions(query)).toEqual([]);
    });

    it("creates a subscription echoing the posted parameters", async () => {
        const posted: NotificationSubscriptionCreateParameters = {
            channel: makeSubscriptionChannel(),
            description: "Tell me about builds",
            filter: makeExpressionFilter("ms.vss-build.build-completed-event"),
            scope: makeSubscriptionScope(),
            subscriber: makeIdentityRef()
        };
        const created = await client.createSubscription(posted);
        expect(created).toMatchObject(posted);
        expect(created.status).toBe(SubscriptionStatus.Enabled);
        expect(typeof created.id).toBe("string");
        expect(created.modifiedDate).toBeInstanceOf(Date);
        expect(subscriptions.map(s => s.id)).not.toContain(created.id);
    });

    it("deletes a subscription", async () => {
        await expect(client.deleteSubscription(subscriptions[0].id)).resolves.toBeUndefined();
    });

    it("gets a known subscription", async () => {
        const found = await client.getSubscription(subscriptions[1].id, SubscriptionQueryFlags.IncludeFilterDetails);
        expect(found).toBe(subscriptions[1]);
    });

    it("fabricates an unknown subscription", async () => {
        const made = await client.getSubscription("missing-subscription");
        expect(made.id).toBe("missing-subscription");
        expect(made.channel.type).toBe("EmailHtml");
        expect(made.filter.eventType).toBe(WORK_ITEM_CHANGED);
        expect(made._links).toEqual({});
    });

    it("lists every subscription", async () => {
        const list = await client.listSubscriptions();
        expect(list).toEqual(subscriptions);
        expect(new Set(list.map(s => s.id)).size).toBe(3);
    });

    it("lists the subscriptions of a subscriber", async () => {
        expect(await client.listSubscriptions(subscribers[1].id)).toEqual([subscriptions[1]]);
        expect(await client.listSubscriptions("nobody")).toEqual([]);
    });

    it("lists subscriptions by id", async () => {
        const ids = [subscriptions[2].id, subscriptions[0].id, "nothing"];
        expect(await client.listSubscriptions(undefined, ids, SubscriptionQueryFlags.None)).toEqual([
            subscriptions[0],
            subscriptions[2]
        ]);
        expect(await client.listSubscriptions(subscribers[1].id, ids)).toEqual([]);
    });

    it("updates a known subscription", async () => {
        const target = subscriptions[0];
        const parameters: NotificationSubscriptionUpdateParameters = {
            adminSettings: { blockUserOptOut: true },
            channel: target.channel,
            description: "Renamed",
            filter: target.filter,
            scope: target.scope,
            status: SubscriptionStatus.Disabled,
            statusMessage: "Paused",
            userSettings: { optedOut: true }
        };
        const updated = await client.updateSubscription(parameters, target.id);
        expect(updated).toMatchObject(parameters);
        expect(updated.id).toBe(target.id);
        expect(updated.subscriber).toBe(target.subscriber);
        expect(target.status).toBe(SubscriptionStatus.Enabled);
    });

    it("updates an unknown subscription", async () => {
        const updated = await client.updateSubscription(
            { description: "Only this" } as NotificationSubscriptionUpdateParameters,
            "missing-subscription"
        );
        expect(updated.id).toBe("missing-subscription");
        expect(updated.description).toBe("Only this");
        expect(updated.status).toBe(SubscriptionStatus.Enabled);
    });

    it("lists the subscription templates", async () => {
        const list = await client.getSubscriptionTemplates();
        expect(list).toBe(templates);
        expect(list.map(t => t.notificationEventInformation)).toEqual(eventTypes);
    });

    it("publishes a token event filling the missing fields", async () => {
        const published = await client.publishTokenEvent({ eventType: "custom.event" } as never);
        expect(published.eventType).toBe("custom.event");
        expect(published.actors[0].role).toBe("initiator");
        expect(published.sourceEventCreatedTime).toBeInstanceOf(Date);
    });

    it("updates the user settings of a subscription", async () => {
        const posted = { optedOut: true };
        const updated = await client.updateSubscriptionUserSettings(posted, subscriptions[0].id, subscribers[0].id);
        expect(updated).toEqual(posted);
        expect(updated).not.toBe(posted);
        expect(subscriptions[0].userSettings.optedOut).toBe(false);
    });
});

describe("notification fixtures", () => {
    it("makes tracing that is off unless asked", () => {
        expect(makeSubscriptionTracing().enabled).toBe(false);
        expect(makeSubscriptionTracing(true).enabled).toBe(true);
        expect(Object.keys(makeSubscriptionDiagnostics()).sort()).toEqual([
            "deliveryResults",
            "deliveryTracing",
            "evaluationTracing"
        ]);
    });

    it("makes a collection scope", () => {
        expect(makeSubscriptionScope()).toEqual({ id: COLLECTION_SCOPE, name: "", type: "collection" });
    });

    it("makes an expression filter for the given event type", () => {
        expect(makeExpressionFilter().eventType).toBe(WORK_ITEM_CHANGED);
        expect(makeExpressionFilter("custom.event").eventType).toBe("custom.event");
        expect(makeExpressionFilter().criteria.clauses.length).toBe(1);
    });

    it("makes an event publisher with the given id", () => {
        expect(makeNotificationEventPublisher().id).toBe("ms.vss-work.work-event-publisher");
        expect(makeNotificationEventPublisher("custom").id).toBe("custom");
    });

    it("makes an event field keyed by its name", () => {
        const named = makeNotificationEventField("Priority");
        expect(named.id).toBe("Priority");
        expect(named.path).toBe("fields/Priority");
        const random = makeNotificationEventField();
        expect(random.id).toBe(random.name);
    });

    it("makes an event type whose fields are keyed by id", () => {
        const type = makeNotificationEventType();
        for (const [key, field] of Object.entries(type.fields)) {
            expect(field.id).toBe(key);
        }
    });

    it("makes a subscription with the given diagnostics", () => {
        const own = makeSubscriptionDiagnostics();
        expect(makeNotificationSubscription(own).diagnostics).toBe(own);
        expect(makeNotificationSubscription().diagnostics).not.toBe(own);
    });

    it("makes a subscriber, settings and a reason", () => {
        expect(makeNotificationSubscriber().deliveryPreference).toBe(
            NotificationSubscriberDeliveryPreference.PreferredEmailAddress
        );
        expect(makeNotificationAdminSettings()).toEqual(settings);
        expect(makeNotificationReason().notificationReasonType).toBe(NotificationReasonType.Personal);
        expect(makeNotificationReason(NotificationReasonType.Follows).targetIdentities.length).toBe(1);
    });

    it("makes a diagnostic log for the given source", () => {
        expect(makeNotificationDiagnosticLog("job-1").source).toBe("job-1");
        expect(typeof makeNotificationDiagnosticLog().source).toBe("string");
    });

    it("makes a statistic of the given type", () => {
        expect(makeNotificationStatistic().type).toBe(NotificationStatisticType.Notifications);
        expect(makeNotificationStatistic(NotificationStatisticType.Events).type).toBe(NotificationStatisticType.Events);
    });

    it("makes a template for the given event type", () => {
        const template = makeNotificationSubscriptionTemplate(eventTypes[1]);
        expect(template.notificationEventInformation).toBe(eventTypes[1]);
        expect(template.filter.eventType).toBe(eventTypes[1].id);
        expect(template.type).toBe(SubscriptionTemplateType.Both);
        const other = makeNotificationSubscriptionTemplate();
        expect(other.filter.eventType).toBe(other.notificationEventInformation.id);
    });

    it("makes an actor with the given role", () => {
        expect(makeEventActor().role).toBe("initiator");
        expect(makeEventActor("reviewer").role).toBe("reviewer");
    });

    it("makes a transform result", () => {
        const result = makeEventTransformResult();
        expect(typeof result.content).toBe("string");
        expect(result.systemInputs).toEqual({});
    });

    it("seeds subscriptions tied to the seeded subscribers, event types and diagnostics", () => {
        expect(subscriptions.map(s => s.subscriber.id)).toEqual(subscribers.map(s => s.id));
        expect(subscriptions.map(s => s.filter.eventType)).toEqual(eventTypes.map(t => t.id));
        expect(subscriptions.map(s => s.diagnostics)).toEqual(diagnostics);
        expect(new Set(subscriptions.map(s => s.id)).size).toBe(subscriptions.length);
    });

    it("seeds statistics, logs and templates with unique keys", () => {
        expect(statistics.length).toBe(3);
        expect(statistics[2].path).toBe(subscriptions[0].id);
        expect(new Set(diagnosticLogs.map(log => log.id)).size).toBe(diagnosticLogs.length);
        expect(new Set(templates.map(t => t.id)).size).toBe(templates.length);
        expect(new Set(eventTypes.map(t => t.id)).size).toBe(eventTypes.length);
    });
});
