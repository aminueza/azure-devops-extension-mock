import { fake } from "../common/fixtures";
import {
    AuthenticationType,
    Consumer,
    ConsumerAction,
    Event,
    EventTypeDescriptor,
    FormattedEventMessage,
    Notification,
    NotificationDetails,
    NotificationResult,
    NotificationStatus,
    NotificationSummary,
    Publisher,
    PublisherEvent,
    ResourceContainer,
    Subscription,
    SubscriptionStatus
} from "azure-devops-extension-api/ServiceHooks";
import { InputDescriptor, InputValuesQuery } from "azure-devops-extension-api/FormInput";
import { SubscriptionDiagnostics } from "azure-devops-extension-api/Notification";
import { makeIdentityRef } from "../core/Data";
import { makeSubscriptionDiagnostics } from "../notification/Data";
import { SECRET_PLACEHOLDER, makeInputDescriptor } from "../serviceEndpoint/Data";

export const RESOURCE_VERSION = "1.0";

export const makeHookInputDescriptor = (id: string, isConfidential = false): InputDescriptor => ({
    ...makeInputDescriptor(id, isConfidential),
    groupName: ""
});

export const makeEventTypeDescriptor = (publisherId = "tfs"): EventTypeDescriptor => ({
    id: fake.lorem.slug(2).replace("-", "."),
    name: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    publisherId,
    inputDescriptors: [makeHookInputDescriptor("projectId")],
    supportedResourceVersions: [RESOURCE_VERSION, "2.0"],
    url: fake.internet.url()
});

export const makePublisher = (id: string = fake.lorem.slug(2)): Publisher => ({
    id,
    name: fake.company.name(),
    description: fake.lorem.sentence(),
    inputDescriptors: [makeHookInputDescriptor("projectId")],
    serviceInstanceType: fake.string.uuid(),
    supportedEvents: [makeEventTypeDescriptor(id)],
    url: fake.internet.url(),
    _links: {}
});

export const makeConsumerAction = (consumerId: string = fake.lorem.slug(2)): ConsumerAction => ({
    id: fake.lorem.slug(2),
    consumerId,
    name: fake.lorem.words(2),
    description: fake.lorem.sentence(),
    allowResourceVersionOverride: true,
    inputDescriptors: [makeHookInputDescriptor("url")],
    supportedEventTypes: ["build.complete", "git.push", "workitem.created"],
    supportedResourceVersions: {},
    url: fake.internet.url(),
    _links: {}
});

export const makeConsumer = (id: string = fake.lorem.slug(2)): Consumer => ({
    id,
    name: fake.company.name(),
    description: fake.lorem.sentence(),
    actions: [makeConsumerAction(id)],
    authenticationType: AuthenticationType.None,
    externalConfiguration: fake.helpers.absent(),
    imageUrl: fake.image.url(),
    informationUrl: fake.internet.url(),
    inputDescriptors: [],
    url: fake.internet.url(),
    _links: {}
});

export const makeSubscription = (): Subscription => ({
    id: fake.string.uuid(),
    publisherId: "tfs",
    eventType: "build.complete",
    eventDescription: "Any completed build",
    resourceVersion: RESOURCE_VERSION,
    publisherInputs: { projectId: fake.string.uuid() },
    consumerId: "webHooks",
    consumerActionId: "httpRequest",
    actionDescription: "To host hooks.example.com",
    consumerInputs: {
        url: `https://hooks.example.com/${fake.lorem.slug(2)}`,
        basicAuthUsername: fake.internet.username(),
        basicAuthPassword: SECRET_PLACEHOLDER
    },
    status: SubscriptionStatus.Enabled,
    probationRetries: 0,
    lastProbationRetryDate: fake.helpers.absent(),
    lastSuccessfulAttemptDate: fake.date.recent(),
    createdBy: makeIdentityRef(),
    createdDate: fake.date.past(),
    modifiedBy: makeIdentityRef(),
    modifiedDate: fake.date.recent({ days: 7 }),
    subscriber: makeIdentityRef(),
    url: fake.internet.url(),
    _links: {}
});

export const makeFormattedEventMessage = (): FormattedEventMessage => {
    const text = fake.lorem.sentence();
    return { text, html: `<p>${text}</p>`, markdown: text };
};

export const makeResourceContainer = (): ResourceContainer => {
    const baseUrl = `https://dev.example.com/${fake.lorem.slug(1)}/`;
    return { id: fake.string.uuid(), name: fake.lorem.word(), baseUrl, url: baseUrl };
};

export const makeEvent = (publisherId = "tfs", eventType = "build.complete"): Event => ({
    id: fake.string.uuid(),
    publisherId,
    eventType,
    createdDate: fake.date.recent(),
    message: makeFormattedEventMessage(),
    detailedMessage: makeFormattedEventMessage(),
    resource: {},
    resourceContainers: {
        collection: makeResourceContainer(),
        account: makeResourceContainer(),
        project: makeResourceContainer()
    },
    resourceVersion: RESOURCE_VERSION,
    sessionToken: fake.helpers.absent()
});

export const makeNotificationDetails = (subscription: Subscription = makeSubscription()): NotificationDetails => ({
    publisherId: subscription.publisherId,
    eventType: subscription.eventType,
    consumerId: subscription.consumerId,
    consumerActionId: subscription.consumerActionId,
    publisherInputs: { ...subscription.publisherInputs },
    consumerInputs: { ...subscription.consumerInputs },
    event: makeEvent(subscription.publisherId, subscription.eventType),
    queuedDate: fake.date.recent({ days: 2 }),
    dequeuedDate: fake.date.recent({ days: 2 }),
    processedDate: fake.date.recent(),
    completedDate: fake.date.recent(),
    nextRetryTime: fake.helpers.absent(),
    errorMessage: fake.helpers.absent(),
    errorDetail: fake.helpers.absent(),
    request: "Method: POST\nURI: https://hooks.example.com/\nHTTP Version: 1.1",
    response: "Status Code: 200\nReason Phrase: OK\nHTTP Version: 1.1",
    requestAttempts: 1,
    requestDuration: 0.42,
    retryCount: 0
});

export const makeNotification = (subscription: Subscription = makeSubscription()): Notification => {
    const details = makeNotificationDetails(subscription);
    return {
        id: fake.number.id(),
        subscriptionId: subscription.id,
        subscriberId: subscription.subscriber.id,
        eventId: details.event.id,
        status: NotificationStatus.Completed,
        result: NotificationResult.Succeeded,
        createdDate: fake.date.recent({ days: 2 }),
        modifiedDate: fake.date.recent(),
        details
    };
};

export const makeFailedNotification = (subscription: Subscription = makeSubscription()): Notification => {
    const notification = makeNotification(subscription);
    return {
        ...notification,
        result: NotificationResult.Failed,
        details: {
            ...notification.details,
            errorMessage: "Internal Server Error (500)",
            errorDetail: "The remote server returned an error: (500) Internal Server Error.",
            response: "Status Code: 500\nReason Phrase: Internal Server Error\nHTTP Version: 1.1"
        }
    };
};

export const makeQueuedNotification = (subscription: Subscription = makeSubscription()): Notification => {
    const notification = makeNotification(subscription);
    return {
        ...notification,
        status: NotificationStatus.Queued,
        result: NotificationResult.Pending,
        details: {
            ...notification.details,
            dequeuedDate: fake.helpers.absent(),
            processedDate: fake.helpers.absent(),
            completedDate: fake.helpers.absent(),
            request: fake.helpers.absent(),
            response: fake.helpers.absent(),
            requestAttempts: 0,
            requestDuration: 0
        }
    };
};

export const makeNotificationSummary = (subscriptionId: string, list: Notification[]): NotificationSummary => {
    const own = list.filter(n => n.subscriptionId === subscriptionId);
    return {
        subscriptionId,
        results: [...new Set(own.map(n => n.result))].map(result => ({
            result,
            notificationCount: own.filter(n => n.result === result).length
        }))
    };
};

export const makePublisherEvent = (subscription: Subscription = makeSubscription()): PublisherEvent => ({
    event: makeEvent(subscription.publisherId, subscription.eventType),
    subscription,
    diagnostics: {},
    isFilteredEvent: false,
    notificationData: {},
    otherResourceVersions: [],
    publisherInputFilters: []
});

export const makeInputValuesQuery = (): InputValuesQuery => ({
    currentValues: { projectId: fake.string.uuid() },
    inputValues: [
        {
            inputId: "repository",
            defaultValue: "",
            error: fake.helpers.absent(),
            isDisabled: false,
            isLimitedToPossibleValues: true,
            isReadOnly: false,
            possibleValues: [
                { data: {}, displayValue: "[Any]", value: "" },
                { data: {}, displayValue: fake.lorem.slug(2), value: fake.string.uuid() }
            ]
        }
    ],
    resource: {}
});

const EVENTS: { id: string; name: string }[] = [
    { id: "build.complete", name: "Build completed" },
    { id: "git.push", name: "Code pushed" },
    { id: "workitem.created", name: "Work item created" }
];

export const eventTypes: EventTypeDescriptor[] = EVENTS.map(event => ({ ...makeEventTypeDescriptor("tfs"), ...event }));

export const publishers: Publisher[] = [
    { ...makePublisher("tfs"), name: "Azure DevOps", supportedEvents: eventTypes },
    { ...makePublisher("rm"), name: "Release Management" },
    { ...makePublisher("pipelines"), name: "Pipelines" }
];

const consumerAction = (
    consumerId: string,
    id: string,
    name: string,
    inputDescriptors: InputDescriptor[]
): ConsumerAction => ({ ...makeConsumerAction(consumerId), id, name, inputDescriptors });

export const consumers: Consumer[] = [
    {
        ...makeConsumer("webHooks"),
        name: "Web Hooks",
        actions: [
            consumerAction("webHooks", "httpRequest", "Post via HTTP", [
                makeHookInputDescriptor("url"),
                makeHookInputDescriptor("basicAuthUsername"),
                makeHookInputDescriptor("basicAuthPassword", true),
                makeHookInputDescriptor("httpHeaders")
            ])
        ]
    },
    {
        ...makeConsumer("slack"),
        name: "Slack",
        actions: [
            consumerAction("slack", "postMessageToChannel", "Post a message to a channel", [
                makeHookInputDescriptor("url", true)
            ])
        ]
    },
    {
        ...makeConsumer("azureStorageQueue"),
        name: "Azure Storage",
        actions: [
            consumerAction("azureStorageQueue", "enqueue", "Insert a message in a Storage Queue", [
                makeHookInputDescriptor("accountName"),
                makeHookInputDescriptor("accountKey", true),
                makeHookInputDescriptor("queueName")
            ])
        ]
    }
];

export const subscriptions: Subscription[] = [
    makeSubscription(),
    {
        ...makeSubscription(),
        eventType: "git.push",
        eventDescription: "Any push",
        consumerId: "slack",
        consumerActionId: "postMessageToChannel",
        actionDescription: "To a Slack channel",
        consumerInputs: { url: SECRET_PLACEHOLDER }
    },
    {
        ...makeSubscription(),
        eventType: "workitem.created",
        eventDescription: "Any work item created",
        consumerId: "azureStorageQueue",
        consumerActionId: "enqueue",
        actionDescription: "To an Azure Storage queue",
        consumerInputs: {
            accountName: fake.lorem.word(),
            accountKey: SECRET_PLACEHOLDER,
            queueName: fake.lorem.slug(2)
        }
    }
];

export const notifications: Notification[] = [
    makeNotification(subscriptions[0]),
    makeFailedNotification(subscriptions[0]),
    makeNotification(subscriptions[1]),
    makeQueuedNotification(subscriptions[2])
];

export const diagnostics: Map<string, SubscriptionDiagnostics> = new Map(
    subscriptions.map(subscription => [subscription.id, makeSubscriptionDiagnostics()])
);
