import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import {
    CreateBoard,
    BoardResponse,
    BoardReference,
    UpdateBoard,
    BoardColumnResponse,
    BoardColumnCreate,
    BoardColumnCollectionResponse,
    BoardColumnUpdate,
    BoardItemResponse,
    NewBoardItem,
    BoardItemCollectionResponse,
    UpdateBoardItem,
    BoardItemBatchOperation,
    BoardRowResponse,
    BoardRowCreate,
    BoardRowCollectionResponse,
    BoardRowUpdate,
    BoardItemStateSyncCreate,
    BoardItemStateSync
} from "azure-devops-extension-api/Boards";
import {
    boardColumnCollectionResponse,
    boardColumnResponse,
    boardItemCollectionResponse,
    boardItemResponse,
    boardItemStateSync,
    boardReferences,
    boardResponse,
    boardRowCollectionResponse,
    boardRowResponse
} from "./Data";

/**
 * Mocked AccountsRestClient
 */
export class MockBoardsRestClient extends RestClientBase {
    public TYPE = 'BoardsRestClient';
    constructor(options: IVssRestClientOptions) {
        super(options);
    }

    createBoard(
        postedBoard: CreateBoard,
        project: string
    ): Promise<BoardResponse> {
        console.log(`Creating board with info: ${JSON.stringify(postedBoard)}, project: ${project}`)
        return new Promise((resolve) => resolve(boardResponse));
    }

    deleteBoard(
        project: string,
        id: number
    ): Promise<void> {
        console.log(`Deleting board with project: ${project}, id: ${id}`)
        return new Promise((resolve) => resolve());
    }

    getBoard(
        project: string,
        id: number
    ): Promise<BoardResponse> {
        console.log(`Getting board with project: ${project}, id: ${id}`)
        return new Promise((resolve) => resolve(boardResponse));
    }

    getBoards(
        project: string,
        top?: number,
        skip?: number
    ): Promise<BoardReference[]> {
        console.log(`Getting boards with project: ${project}, top: ${top}, skip: ${skip}`)
        return new Promise((resolve) => resolve(boardReferences));
    }

    updateBoard(
        updatedBoard: UpdateBoard,
        project: string,
        id: number,
        eTag: String
    ): Promise<BoardResponse> {
        console.log(`Updating board with info: ${JSON.stringify(updatedBoard)}, project: ${project}, id: ${id}, eTag: ${eTag}`)
        return new Promise((resolve) => resolve(boardResponse));
    }

    createBoardColumn(
        boardColumn: BoardColumnCreate,
        project: string,
        board: number
    ): Promise<BoardColumnResponse> {
        console.log(`Creating board column with info: ${JSON.stringify(boardColumn)}, project: ${project}, board: ${board}`)
        return new Promise((resolve) => resolve(boardColumnResponse));
    }

    deleteBoardColumn(
        project: string,
        board: number,
        id: string,
        forceRemoveItems: boolean
    ): Promise<void> {
        console.log(`Deleting board column with project: ${project}, board: ${board}, id: ${id}, forceRemoveItems: ${forceRemoveItems}`)
        return new Promise((resolve) => resolve());
    }

    getBoardColumn(
        project: string,
        board: number,
        id: string
    ): Promise<BoardColumnResponse> {
        console.log(`Getting board column with project: ${project}, board: ${board}, id: ${id}`)
        return new Promise((resolve) => resolve(boardColumnResponse));
    }

    getBoardColumns(
        project: string,
        board: number
    ): Promise<BoardColumnCollectionResponse> {
        console.log(`Getting board columns with project: ${project}, board: ${board}`)
        return new Promise((resolve) => resolve(boardColumnCollectionResponse));
    }

    updateBoardColumn(
        boardColumn: BoardColumnUpdate,
        project: string,
        board: number,
        id: string,
        eTag: String
    ): Promise<BoardColumnResponse> {
        console.log(`Updating board column with info: ${JSON.stringify(boardColumn)}, project: ${project}, board: ${board}, id: ${id}, eTag: ${eTag}`)
        return new Promise((resolve) => resolve(boardColumnResponse));
    }

    addBoardItem(
        item: NewBoardItem,
        project: string,
        board: number
    ): Promise<BoardItemResponse> {
        console.log(`Adding board item with info: ${JSON.stringify(item)}, project: ${project}, board: ${board}`)
        return new Promise((resolve) => resolve(boardItemResponse));
    }

    getBoardItem(
        project: string,
        board: number,
        id: string
    ): Promise<BoardItemResponse> {
        console.log(`Getting board item with project: ${project}, board: ${board}, id: ${id}`)
        return new Promise((resolve) => resolve(boardItemResponse));
    }

    getBoardItems(
        project: string,
        board: number
    ): Promise<BoardItemCollectionResponse> {
        console.log(`Getting board items with project: ${project}, board: ${board}`)
        return new Promise((resolve) => resolve(boardItemCollectionResponse));
    }

    removeBoardItem(
        project: string,
        board: number,
        id: string
    ): Promise<void> {
        console.log(`Removing board item with project: ${project}, board: ${board}, id: ${id}`)
        return new Promise((resolve) => resolve());
    }

    updateBoardItem(
        updateItemDef: UpdateBoardItem,
        project: string,
        board: number,
        id: string,
        eTag: String
    ): Promise<BoardItemResponse> {
        console.log(`Updating board item with info: ${JSON.stringify(updateItemDef)}, project: ${project}, board: ${board}, id: ${id}, eTag: ${eTag}`)
        return new Promise((resolve) => resolve(boardItemResponse));
    }

    updateBoardItems(
        batchRequest: BoardItemBatchOperation,
        project: string,
        board: number
    ): Promise<BoardItemCollectionResponse> {
        console.log(`Updating board items with info: ${JSON.stringify(batchRequest)}, project: ${project}, board: ${board}`)
        return new Promise((resolve) => resolve(boardItemCollectionResponse));
    }

    createBoardRow(
        boardRow: BoardRowCreate,
        project: string,
        board: number
    ): Promise<BoardRowResponse> {
        console.log(`Creating board row with info: ${JSON.stringify(boardRow)}, project: ${project}, board: ${board}`)
        return new Promise((resolve) => resolve(boardRowResponse));
    }

    deleteBoardRow(
        project: string,
        board: number,
        id: string,
        forceRemoveItems: boolean
    ): Promise<void> {
        console.log(`Deleting board row with project: ${project}, board: ${board}, id: ${id}, forceRemoveItems: ${forceRemoveItems}`)
        return new Promise((resolve) => resolve());
    }

    getBoardRow(
        project: string,
        board: number,
        id: string
    ): Promise<BoardRowResponse> {
        console.log(`Getting board row with project: ${project}, board: ${board}, id: ${id}`)
        return new Promise((resolve) => resolve(boardRowResponse));
    }

    getBoardRows(
        project: string,
        board: number
    ): Promise<BoardRowCollectionResponse> {
        console.log(`Getting board rows with project: ${project}, board: ${board}`)
        return new Promise((resolve) => resolve(boardRowCollectionResponse));
    }

    updateBoardRow(
        boardRow: BoardRowUpdate,
        project: string,
        board: number,
        id: string,
        eTag: String
    ): Promise<BoardRowResponse> {
        console.log(`Updating board row with info: ${JSON.stringify(boardRow)}, project: ${project}, board: ${board}, id: ${id}, eTag: ${eTag}`)
        return new Promise((resolve) => resolve(boardRowResponse));
    }

    createBoardSyncAction(
        boardSync: BoardItemStateSyncCreate,
        project: string,
        board: number,
        column: string
    ): Promise<BoardItemStateSync> {
        console.log(`Creating board sync action with info: ${JSON.stringify(boardSync)}, project: ${project}, board: ${board}, column: ${column}`)
        return new Promise((resolve) => resolve(boardItemStateSync));
    }


}