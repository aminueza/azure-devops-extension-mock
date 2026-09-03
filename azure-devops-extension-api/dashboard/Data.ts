import { fake } from "../common/fixtures";
import {
    Dashboard,
    DashboardGroup,
    Widget,
    WidgetSize,
    WidgetPosition,
    DashboardScope,
    LightboxOptions
} from "azure-devops-extension-api/Dashboard";

export const makeWidget = (name = "Team Members"): Widget => ({
    id: fake.string.uuid(),
    name,
    contributionId: `ms.vss-dashboards-web.${fake.lorem.slug()}-widget`,
    position: {
        row: fake.number.int({ min: 1, max: 4 }),
        column: fake.number.int({ min: 1, max: 4 })
    } as WidgetPosition,
    size: {
        rowSpan: fake.number.int({ min: 1, max: 3 }),
        columnSpan: fake.number.int({ min: 1, max: 3 })
    } as WidgetSize,
    settings: "{}",
    settingsVersion: { major: 1, minor: 0, patch: 0, isTest: false } as any,
    url: fake.internet.url(),
    typeId: fake.string.uuid(),
    dashboard: null as any,
    lightboxOptions: { width: 800, height: 600, resizable: false } as LightboxOptions,
    loadingImageUrl: fake.image.url(),
    eTag: fake.string.uuid(),
    isNameConfigurable: true,
    isEnabled: true,
    _links: {} as any
} as unknown as Widget);

export const makeDashboard = (name = "Overview"): Dashboard => ({
    id: fake.string.uuid(),
    name,
    description: fake.lorem.sentence(),
    position: fake.number.int({ min: 0, max: 5 }),
    refreshInterval: 0,
    ownerId: fake.string.uuid(),
    widgets: Array.from({ length: 3 }, () => makeWidget()),
    url: fake.internet.url(),
    eTag: fake.string.uuid(),
    dashboardScope: DashboardScope.Project_Team,
    groupId: fake.string.uuid(),
    _links: {} as any
} as unknown as Dashboard);

export const makeDashboardGroup = (): DashboardGroup => ({
    dashboardEntries: Array.from({ length: 2 }, () => ({
        id: fake.string.uuid(),
        name: fake.lorem.slug(),
        position: fake.number.int()
    } as unknown as Dashboard)),
    permission: 0 as any,
    teamDashboardPermission: 0 as any,
    url: fake.internet.url(),
    _links: {} as any
} as unknown as DashboardGroup);

export const dashboards: Dashboard[] = [
    makeDashboard("Overview"),
    makeDashboard("Sprint Health"),
    makeDashboard("Release Pipeline")
];
export const widgets: Widget[] = Array.from({ length: 6 }, () => makeWidget());
export const dashboardGroup: DashboardGroup = makeDashboardGroup();
