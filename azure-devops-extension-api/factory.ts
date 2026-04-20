import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import { IVssRestClientOptions } from "azure-devops-extension-api";

type Class<T = unknown> = new (...args: any[]) => T;

export type MockOverrides<T> = Partial<{
    [K in keyof T]: T[K] extends (...args: infer A) => infer R
        ? (...args: A) => R
        : T[K];
}>;

const registry = new Map<Class, Class<RestClientBase>>();

export function registerMockClient<T extends RestClientBase>(
    real: Class<T>,
    mock: Class<T>
): void {
    registry.set(real, mock);
}

export function getRegisteredMockClient<T extends RestClientBase>(
    real: Class<T>
): Class<T> | undefined {
    return registry.get(real) as Class<T> | undefined;
}

/**
 * Auto-mocks any RestClient by wrapping it in a Proxy. Every method becomes a
 * stub that returns `Promise.resolve(undefined)` unless an override is provided.
 *
 * Useful for clients we don't ship hand-written fixtures for, or for unit tests
 * that want to pin specific method responses.
 */
export function mockClient<T extends RestClientBase>(
    clientClass: Class<T>,
    overrides: MockOverrides<T> = {},
    options: IVssRestClientOptions = {} as IVssRestClientOptions
): T {
    const registered = getRegisteredMockClient(clientClass);
    const base: any = registered
        ? new registered(options)
        : new clientClass(options);

    return new Proxy(base, {
        get(target, prop, receiver) {
            if (prop in overrides) {
                return (overrides as any)[prop];
            }
            const value = Reflect.get(target, prop, receiver);
            if (typeof value === "function") {
                return value.bind(target);
            }
            if (value !== undefined) {
                return value;
            }
            return (..._args: unknown[]) => Promise.resolve(undefined);
        }
    }) as T;
}
