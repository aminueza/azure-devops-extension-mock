import { faker } from "@faker-js/faker";
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
} from "azure-devops-extension-api/Boards";

const boardColumns = Array.from({ length: 5 }, () => ({
    id: faker.string.uuid(),
    nextColumnId: faker.string.uuid(),
    url: faker.internet.url(),
    _links: {
        referenceName: faker.lorem.slug(),
        url: faker.internet.url(),
    } as any,

} as BoardColumn));

const boardItems = Array.from({ length: 5 }, () => ({
    boardId: faker.number.int(),
    columnId: faker.string.uuid(),
    nextId: faker.string.uuid(),
    rowId: faker.string.uuid(),
    sourceErrorMessages: [faker.lorem.sentence()],
    sourceRefreshRequired: faker.datatype.boolean(),
    _links: {
        referenceName: faker.lorem.slug(),
        url: faker.internet.url(),
    } as any,
} as BoardItem));

const boardRows = Array.from({ length: 5 }, () => ({
    id: faker.string.uuid(),
    nextRowId: faker.string.uuid(),
    url: faker.internet.url(),
    _links: {
        referenceName: faker.lorem.slug(),
        url: faker.internet.url(),
    } as any,
} as BoardRow));

export const boardResponse = {
    board: {
        description: faker.lorem.sentence(),
        _links: {
            referenceName: faker.lorem.slug(),
            url: faker.internet.url(),
        } as any,
    } as Board,
    eTag: [faker.string.uuid()],

} as BoardResponse;

export const boardReferences = Array.from({ length: 10 }, () => (
    {
        id: faker.number.int(),
        name: faker.lorem.word(),
        url: faker.internet.url(),
        _links: {
            referenceName: faker.lorem.slug(),
            url: faker.internet.url(),
        } as any,
    } as BoardReference));

export const boardColumnResponse = {
    column: boardColumns[0],
    eTag: [faker.string.uuid()]

} as BoardColumnResponse;

export const boardColumnCollectionResponse = {
    columns: boardColumns,
    _links: {
        referenceName: faker.lorem.slug(),
        url: faker.internet.url(),
    } as any,

} as BoardColumnCollectionResponse;

export const boardItemResponse = {
    item: boardItems[0],
    eTag: [faker.string.uuid()]
} as BoardItemResponse;

export const boardItemCollectionResponse = {
    items: boardItems,
    _links: {
        referenceName: faker.lorem.slug(),
        url: faker.internet.url(),
    } as any,
} as BoardItemCollectionResponse;

export const boardRowResponse = {
    row: boardRows[0],
    eTag: [faker.string.uuid()]
} as BoardRowResponse;

export const boardRowCollectionResponse = {
    rows: boardRows,
    _links: {
        referenceName: faker.lorem.slug(),
        url: faker.internet.url(),
    } as any,
} as BoardRowCollectionResponse;

export const boardItemStateSync = {
    id: faker.string.uuid(),
    itemType: faker.lorem.slug(),
} as BoardItemStateSync;


// Array.from({ length: 10 }, () => (
//     {
//         column: boardColumns[0],
//         eTag: [faker.string.uuid()]

//     } as BoardColumnResponse));