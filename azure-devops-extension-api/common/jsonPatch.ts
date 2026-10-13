export interface PatchOperation {
    op?: unknown;
    path?: unknown;
    value?: unknown;
}

export const patchOperations = (document: unknown): PatchOperation[] => (Array.isArray(document) ? document : []);
