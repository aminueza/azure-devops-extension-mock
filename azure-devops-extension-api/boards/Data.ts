import { fake } from "../common/fixtures";
import {
    Board,
    BoardColumn,
    BoardColumnCollectionResponse,
    BoardColumnResponse,
    BoardItem,
    BoardItemResponse,
    BoardReference,
    BoardResponse,
    BoardItemCollectionResponse,
    BoardRowResponse,
    BoardRow,
    BoardRowCollectionResponse,
    BoardItemStateSync
} from "./types";

const boardColumns = Array.from({ length: 5 }, () => ({
    id: fake.string.uuid(),
    nextColumnId: fake.string.uuid(),
    url: fake.internet.url(),
    _links: {
        referenceName: fake.lorem.slug(),
        url: fake.internet.url(),
    } as any,

} as BoardColumn));

const boardItems = Array.from({ length: 5 }, () => ({
    boardId: fake.number.int(),
    columnId: fake.string.uuid(),
    nextId: fake.string.uuid(),
    rowId: fake.string.uuid(),
    sourceErrorMessages: [fake.lorem.sentence()],
    sourceRefreshRequired: fake.datatype.boolean(),
    _links: {
        referenceName: fake.lorem.slug(),
        url: fake.internet.url(),
    } as any,
} as BoardItem));

const boardRows = Array.from({ length: 5 }, () => ({
    id: fake.string.uuid(),
    nextRowId: fake.string.uuid(),
    url: fake.internet.url(),
    _links: {
        referenceName: fake.lorem.slug(),
        url: fake.internet.url(),
    } as any,
} as BoardRow));

export const boardResponse = {
    board: {
        description: fake.lorem.sentence(),
        _links: {
            referenceName: fake.lorem.slug(),
            url: fake.internet.url(),
        } as any,
    } as Board,
    eTag: [fake.string.uuid()],

} as BoardResponse;

export const boardReferences = Array.from({ length: 10 }, () => (
    {
        id: fake.number.int(),
        name: fake.lorem.word(),
        url: fake.internet.url(),
        _links: {
            referenceName: fake.lorem.slug(),
            url: fake.internet.url(),
        } as any,
    } as BoardReference));

export const boardColumnResponse = {
    column: boardColumns[0],
    eTag: [fake.string.uuid()]

} as BoardColumnResponse;

export const boardColumnCollectionResponse = {
    columns: boardColumns,
    _links: {
        referenceName: fake.lorem.slug(),
        url: fake.internet.url(),
    } as any,

} as BoardColumnCollectionResponse;

export const boardItemResponse = {
    item: boardItems[0],
    eTag: [fake.string.uuid()]
} as BoardItemResponse;

export const boardItemCollectionResponse = {
    items: boardItems,
    _links: {
        referenceName: fake.lorem.slug(),
        url: fake.internet.url(),
    } as any,
} as BoardItemCollectionResponse;

export const boardRowResponse = {
    row: boardRows[0],
    eTag: [fake.string.uuid()]
} as BoardRowResponse;

export const boardRowCollectionResponse = {
    rows: boardRows,
    _links: {
        referenceName: fake.lorem.slug(),
        url: fake.internet.url(),
    } as any,
} as BoardRowCollectionResponse;

export const boardItemStateSync = {
    id: fake.string.uuid(),
    itemType: fake.lorem.slug(),
} as BoardItemStateSync;
