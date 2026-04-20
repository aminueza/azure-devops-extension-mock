import { faker } from "@faker-js/faker";
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
    id: faker.string.uuid(),
    name,
    contributionId: `ms.vss-dashboards-web.${faker.lorem.slug()}-widget`,
    position: {
        row: faker.number.int({ min: 1, max: 4 }),
        column: faker.number.int({ min: 1, max: 4 })
    } as WidgetPosition,
    size: {
        rowSpan: faker.number.int({ min: 1, max: 3 }),
        columnSpan: faker.number.int({ min: 1, max: 3 })
    } as WidgetSize,
    settings: "{}",
    settingsVersion: { major: 1, minor: 0, patch: 0, isTest: false } as any,
    url: faker.internet.url(),
    typeId: faker.string.uuid(),
    dashboard: null as any,
    lightboxOptions: { width: 800, height: 600, resizable: false } as LightboxOptions,
    loadingImageUrl: faker.image.url(),
    eTag: faker.string.uuid(),
    isNameConfigurable: true,
    isEnabled: true,
    _links: {} as any
} as unknown as Widget);

export const makeDashboard = (name = "Overview"): Dashboard => ({
    id: faker.string.uuid(),
    name,
    description: faker.lorem.sentence(),
    position: faker.number.int({ min: 0, max: 5 }),
    refreshInterval: 0,
    ownerId: faker.string.uuid(),
    widgets: Array.from({ length: 3 }, () => makeWidget()),
    url: faker.internet.url(),
    eTag: faker.string.uuid(),
    dashboardScope: DashboardScope.Project_Team,
    groupId: faker.string.uuid(),
    _links: {} as any
} as unknown as Dashboard);

export const makeDashboardGroup = (): DashboardGroup => ({
    dashboardEntries: Array.from({ length: 2 }, () => ({
        id: faker.string.uuid(),
        name: faker.lorem.slug(),
        position: faker.number.int()
    } as unknown as Dashboard)),
    permission: 0 as any,
    teamDashboardPermission: 0 as any,
    url: faker.internet.url(),
    _links: {} as any
} as unknown as DashboardGroup);

export const dashboards: Dashboard[] = [
    makeDashboard("Overview"),
    makeDashboard("Sprint Health"),
    makeDashboard("Release Pipeline")
];
export const widgets: Widget[] = Array.from({ length: 6 }, () => makeWidget());
export const dashboardGroup: DashboardGroup = makeDashboardGroup();
