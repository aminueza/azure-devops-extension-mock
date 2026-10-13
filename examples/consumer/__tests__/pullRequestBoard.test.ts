import { getClient } from "azure-devops-extension-api";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { getClient as getMockClient } from "azure-devops-extension-mock";
import { fake } from "azure-devops-extension-mock/fixtures";
import { loadBoard } from "../src/pullRequestBoard";

jest.mock("azure-devops-extension-api", () => ({
    ...jest.requireActual("azure-devops-extension-api"),
    getClient: jest.fn()
}));

const useMockClients = (overrides: Record<string, unknown> = {}): void => {
    (getClient as jest.Mock).mockImplementation(clientClass => getMockClient(clientClass, overrides));
};

describe("pull request board", () => {
    beforeEach(() => {
        fake.seed(1234);
        useMockClients();
    });

    it("loads the board from the mocked SDK and REST clients", async () => {
        const board = await loadBoard();
        const repositories = await getMockClient(GitRestClient).getRepositories();
        expect(board.user.length).toBeGreaterThan(0);
        expect(board.project.length).toBeGreaterThan(0);
        expect(board.pullRequests.length).toBeGreaterThan(0);
        expect(repositories.map(repository => repository.name)).toContain(board.pullRequests[0].repository);
        expect(board.completedRuns).toBeGreaterThan(0);
    });

    it("shows an empty board when the project has no repositories", async () => {
        useMockClients({ getRepositories: async () => [] });
        const board = await loadBoard();
        expect(board.pullRequests).toEqual([]);
        expect(board.completedRuns).toBeGreaterThan(0);
    });
});
