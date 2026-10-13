const snapshots = new Map<unknown[], unknown[]>();
let enabled = false;
let lastFreshId = 10_000_000;

const track = (list: unknown[]): void => {
    if (!snapshots.has(list)) {
        snapshots.set(list, [...list]);
    }
};

const reset = (): void => {
    for (const [list, original] of snapshots) {
        list.splice(0, list.length, ...original);
    }
    snapshots.clear();
};

export const stateful = {
    enable: (): void => {
        enabled = true;
    },
    disable: (): void => {
        reset();
        enabled = false;
    },
    reset,
    isEnabled: (): boolean => enabled
};

export const remember = <T>(list: T[], item: T, same?: (existing: T) => boolean): T => {
    if (enabled) {
        track(list);
        const index = same ? list.findIndex(same) : -1;
        if (index >= 0) {
            list[index] = item;
        } else {
            list.push(item);
        }
    }
    return item;
};

export const stored = <T>(list: T[], same: (existing: T) => boolean, fallback: () => T): T =>
    (enabled ? list.find(same) : undefined) ?? fallback();

export const freshId = (drawn: number): number => {
    if (!enabled) {
        return drawn;
    }
    lastFreshId += 1;
    return lastFreshId;
};

export const forget = <T>(list: T[], same: (existing: T) => boolean): void => {
    if (enabled) {
        track(list);
        for (let index = list.length - 1; index >= 0; index -= 1) {
            if (same(list[index])) {
                list.splice(index, 1);
            }
        }
    }
};
