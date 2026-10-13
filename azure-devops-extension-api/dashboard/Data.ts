import { fake } from "../common/fixtures";
import {
    Dashboard,
    DashboardGroup,
    GroupMemberPermission,
    TeamDashboardPermission,
    Widget,
    WidgetMetadata,
    WidgetScope,
    DashboardScope
} from "azure-devops-extension-api/Dashboard";

const makeDashboardWithoutWidgets = (name: string): Dashboard => ({
    id: fake.string.uuid(),
    name,
    description: fake.lorem.sentence(),
    position: fake.number.int({ min: 0, max: 5 }),
    refreshInterval: 0,
    ownerId: fake.string.uuid(),
    widgets: [],
    url: fake.internet.url(),
    eTag: fake.string.uuid(),
    dashboardScope: DashboardScope.Project_Team,
    groupId: fake.string.uuid(),
    globalParametersConfig: "",
    lastAccessedDate: fake.date.recent(),
    modifiedBy: fake.string.uuid(),
    modifiedDate: fake.date.recent(),
    _links: {}
});

export const makeWidget = (name = "Team Members"): Widget => {
    const contributionId = `ms.vss-dashboards-web.${fake.lorem.slug()}-widget`;
    return {
        id: fake.string.uuid(),
        name,
        contributionId,
        allowedSizes: [
            { rowSpan: 1, columnSpan: 1 },
            { rowSpan: 2, columnSpan: 2 }
        ],
        areSettingsBlockedForUser: false,
        artifactId: "",
        configurationContributionId: `${contributionId}-configuration`,
        configurationContributionRelativeId: `${contributionId}-configuration`,
        contentUri: fake.internet.url(),
        position: {
            row: fake.number.int({ min: 1, max: 4 }),
            column: fake.number.int({ min: 1, max: 4 })
        },
        size: {
            rowSpan: fake.number.int({ min: 1, max: 3 }),
            columnSpan: fake.number.int({ min: 1, max: 3 })
        },
        settings: "{}",
        settingsVersion: { major: 1, minor: 0, patch: 0 },
        url: fake.internet.url(),
        typeId: fake.string.uuid(),
        dashboard: makeDashboardWithoutWidgets("Overview"),
        lightboxOptions: { width: 800, height: 600, resizable: false },
        loadingImageUrl: fake.image.url(),
        eTag: fake.string.uuid(),
        isNameConfigurable: true,
        isEnabled: true,
        _links: {}
    };
};

export const makeDashboard = (name = "Overview"): Dashboard => ({
    ...makeDashboardWithoutWidgets(name),
    widgets: Array.from({ length: 3 }, () => makeWidget())
});

export const makeDashboardGroup = (): DashboardGroup => ({
    dashboardEntries: Array.from({ length: 2 }, () => ({
        ...makeDashboardWithoutWidgets(fake.lorem.slug()),
        position: fake.number.int()
    })),
    permission: GroupMemberPermission.None,
    teamDashboardPermission: TeamDashboardPermission.None,
    url: fake.internet.url(),
    _links: {}
});

export const makeWidgetMetadata = (
    contributionId = `ms.vss-dashboards-web.${fake.lorem.slug()}-widget`
): WidgetMetadata => ({
    allowedSizes: [
        { rowSpan: 1, columnSpan: 1 },
        { rowSpan: 2, columnSpan: 2 }
    ],
    analyticsServiceRequired: false,
    catalogIconUrl: fake.image.url(),
    catalogInfoUrl: fake.internet.url(),
    configurationContributionId: `${contributionId}-configuration`,
    configurationContributionRelativeId: `${contributionId}-configuration`,
    configurationRequired: fake.datatype.boolean(),
    contentUri: fake.internet.url(),
    contributionId,
    defaultSettings: "{}",
    description: fake.lorem.sentence(),
    isEnabled: true,
    isNameConfigurable: true,
    isVisibleFromCatalog: true,
    keywords: [fake.lorem.word()],
    lightboxOptions: { width: 800, height: 600, resizable: false },
    loadingImageUrl: fake.image.url(),
    name: fake.lorem.words(2),
    publisherName: fake.company.name(),
    supportedScopes: [WidgetScope.Project_Team, WidgetScope.Collection_User],
    tags: [fake.lorem.word()],
    targets: [fake.lorem.word()],
    typeId: fake.string.uuid()
});

export const dashboards: Dashboard[] = [
    makeDashboard("Overview"),
    makeDashboard("Sprint Health"),
    makeDashboard("Release Pipeline")
];
export const widgets: Widget[] = Array.from({ length: 6 }, () => makeWidget());
export const dashboardGroup: DashboardGroup = makeDashboardGroup();
export const widgetTypes: WidgetMetadata[] = [
    ...Array.from({ length: 3 }, () => makeWidgetMetadata()),
    { ...makeWidgetMetadata(), supportedScopes: [WidgetScope.Project_Team] }
];
