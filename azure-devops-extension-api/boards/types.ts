/**
 * Local type definitions for Board API that were removed in azure-devops-extension-api v5
 */

export type BoardType = "taskboard" | "backlog" | "iterationboard";
export type BoardRowType = "user" | "team" | "iteration";

export interface CreateBoard {
    name: string;
    type: BoardType;
    color?: string;
}

export interface BoardResponse {
    board: Board;
    eTag?: string[];
}

export interface BoardReference {
    id: number;
    name: string;
    url: string;
    _links?: any;
}

export interface UpdateBoard {
    name?: string;
    type?: BoardType;
    color?: string;
}

export interface BoardColumnResponse {
    column: BoardColumn;
    eTag?: string[];
}

export type BoardColumnType = "state" | "effort" | "custom";

export interface BoardColumnCreate {
    name: string;
    columnType: BoardColumnType;
    width?: number;
}

export interface BoardColumnCollectionResponse {
    columns: BoardColumn[];
    _links?: any;
}

export interface BoardColumnUpdate {
    name?: string;
    width?: number;
}

export interface BoardItemResponse {
    item: BoardItem;
    eTag?: string[];
}

export interface NewBoardItem {
    rowId: string;
    columnId: string;
    fields: { [key: string]: any };
}

export interface BoardItemCollectionResponse {
    items: BoardItem[];
    _links?: any;
}

export interface UpdateBoardItem {
    state?: string;
    rowId?: string;
    columnId?: string;
    fields: { [key: string]: any };
}

export interface BoardItemBatchOperation {
    operations: BoardItemUpdateOperation[];
}

export interface BoardItemUpdateOperation {
    id: string;
    state?: string;
    rowId?: string;
    columnId?: string;
    fields: { [key: string]: any };
}

export interface BoardRowResponse {
    row: BoardRow;
    eTag?: string[];
}

export interface BoardRowCreate {
    name: string;
    type: BoardRowType;
    color?: string;
}

export interface BoardRowCollectionResponse {
    rows: BoardRow[];
    _links?: any;
}

export interface BoardRowUpdate {
    name?: string;
    color?: string;
}

export interface BoardItemStateSyncCreate {
    state: string;
    columnId: string;
}

export interface BoardItemStateSync {
    id: string;
    itemType: string;
}

// Additional types used in Data.ts
export interface Board {
    description?: string;
    _links?: any;
}

export interface BoardColumn {
    id: string;
    nextColumnId?: string;
    url: string;
    _links?: any;
}

export interface BoardItem {
    boardId: number;
    columnId: string;
    nextId?: string;
    rowId: string;
    sourceErrorMessages?: string[];
    sourceRefreshRequired?: boolean;
    _links?: any;
}

export interface BoardRow {
    id: string;
    nextRowId?: string;
    url: string;
    _links?: any;
}
