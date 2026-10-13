import {
    Concern,
    ConcernCategory,
    GalleryRestClient,
    QnAItemStatus,
    Question,
    Response,
    Review,
    ReviewFilterOptions,
    ReviewPatch,
    ReviewPatchOperation
} from "azure-devops-extension-api/Gallery";
import { getClient } from "../azure-devops-extension-api";
import {
    makeConcern,
    makeQuestion,
    makeResponse,
    makeReview,
    questions,
    reviews,
    reviewSummary
} from "../azure-devops-extension-api/gallery/Data";

const DAY_MS = 86_400_000;
const daysAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

describe("GalleryRestClient mock: questions and reviews", () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    const client = getClient(GalleryRestClient);

    it("lists the questions of an extension", async () => {
        const result = await client.getQuestions("pub", "ext");
        expect(result.questions).toEqual(questions);
        expect(result.hasMoreQuestions).toBe(false);
        expect(result.questions.map(q => q.responses.length)).toEqual([2, 1, 0, 1]);
    });

    it("pages the questions", async () => {
        const first = await client.getQuestions("pub", "ext", 2);
        expect(first.questions).toEqual(questions.slice(0, 2));
        expect(first.hasMoreQuestions).toBe(true);
        const second = await client.getQuestions("pub", "ext", 2, 2);
        expect(second.questions).toEqual(questions.slice(2, 4));
        expect(second.hasMoreQuestions).toBe(false);
    });

    it("lists the questions updated after a date", async () => {
        const result = await client.getQuestions("pub", "ext", undefined, undefined, daysAgo(2.5));
        expect(result.questions).toEqual(questions.slice(0, 2));
        expect(result.hasMoreQuestions).toBe(false);
    });

    it("reports a question echoing the posted concern", async () => {
        const posted: Concern = { ...makeConcern(), category: ConcernCategory.Spam, text: "spam" };
        const reported = await client.reportQuestion(posted, "pub", "ext", questions[0].id);
        expect(reported).toEqual(posted);
        expect(reported).not.toBe(posted);
        const partial = await client.reportQuestion({ text: "abusive" } as Concern, "pub", "ext", questions[0].id);
        expect(partial.text).toBe("abusive");
        expect(partial.category).toBe(ConcernCategory.General);
        expect(typeof partial.id).toBe("number");
    });

    it("creates a question echoing the posted object", async () => {
        const posted: Question = { ...makeQuestion(), text: "How?" };
        const created = await client.createQuestion(posted, "pub", "ext");
        expect(created).toEqual(posted);
        expect(created).not.toBe(posted);
        const partial = await client.createQuestion({ text: "Why?" } as Question, "pub", "ext");
        expect(partial.text).toBe("Why?");
        expect(partial.responses).toEqual([]);
        expect(partial.status).toBe(QnAItemStatus.UserEditable);
        expect(typeof partial.user.displayName).toBe("string");
    });

    it("deletes a question and a response", async () => {
        await expect(client.deleteQuestion("pub", "ext", questions[0].id)).resolves.toBeUndefined();
        await expect(
            client.deleteResponse("pub", "ext", questions[0].id, questions[0].responses[0].id)
        ).resolves.toBeUndefined();
    });

    it("updates a known question", async () => {
        const target = questions[0];
        const updated = await client.updateQuestion({ ...target, id: 1, text: "Edited" }, "pub", "ext", target.id);
        expect(updated.id).toBe(target.id);
        expect(updated.text).toBe("Edited");
        expect(updated.responses).toBe(target.responses);
        expect(target.text).not.toBe("Edited");
    });

    it("updates an unknown question", async () => {
        const updated = await client.updateQuestion({ text: "Edited" } as Question, "pub", "ext", 999_999);
        expect(updated.id).toBe(999_999);
        expect(updated.text).toBe("Edited");
        expect(updated.createdDate).toBeInstanceOf(Date);
    });

    it("creates a response echoing the posted object", async () => {
        const posted: Response = { ...makeResponse(), text: "Like this." };
        const created = await client.createResponse(posted, "pub", "ext", questions[0].id);
        expect(created).toEqual(posted);
        expect(created).not.toBe(posted);
        const partial = await client.createResponse({ text: "Answer" } as Response, "pub", "ext", questions[0].id);
        expect(partial.text).toBe("Answer");
        expect(partial.status).toBe(QnAItemStatus.PublisherCreated);
    });

    it("updates a known response", async () => {
        const question = questions[0];
        const target = question.responses[1];
        const updated = await client.updateResponse({ ...target, id: 1, text: "Edited" }, "pub", "ext", question.id, target.id);
        expect(updated.id).toBe(target.id);
        expect(updated.text).toBe("Edited");
        expect(updated.user).toBe(target.user);
    });

    it("updates an unknown response", async () => {
        const ofKnown = await client.updateResponse({ text: "A" } as Response, "pub", "ext", questions[0].id, 888_888);
        expect(ofKnown.id).toBe(888_888);
        expect(ofKnown.text).toBe("A");
        const ofUnknown = await client.updateResponse({ text: "B" } as Response, "pub", "ext", 777_777, 666_666);
        expect(ofUnknown.id).toBe(666_666);
        expect(ofUnknown.updatedDate).toBeInstanceOf(Date);
    });

    it("lists the first reviews of an extension", async () => {
        const result = await client.getReviews("pub", "ext");
        expect(result.reviews).toEqual(reviews.slice(0, 5));
        expect(result.hasMoreReviews).toBe(true);
        expect(result.totalReviewCount).toBe(6);
    });

    it("lists reviews up to a count", async () => {
        const result = await client.getReviews("pub", "ext", 10, ReviewFilterOptions.None);
        expect(result.reviews).toEqual(reviews);
        expect(result.hasMoreReviews).toBe(false);
    });

    it("filters out empty reviews and empty user names", async () => {
        const withText = await client.getReviews("pub", "ext", 10, ReviewFilterOptions.FilterEmptyReviews);
        expect(withText.totalReviewCount).toBe(5);
        expect(withText.reviews.every(r => r.text !== "")).toBe(true);
        const withNames = await client.getReviews("pub", "ext", 10, ReviewFilterOptions.FilterEmptyUserNames);
        expect(withNames.totalReviewCount).toBe(5);
        expect(withNames.reviews.every(r => r.userDisplayName !== "")).toBe(true);
        const both = await client.getReviews(
            "pub",
            "ext",
            10,
            ReviewFilterOptions.FilterEmptyReviews | ReviewFilterOptions.FilterEmptyUserNames
        );
        expect(both.reviews).toEqual([reviews[0], reviews[1], reviews[4], reviews[5]]);
    });

    it("lists the reviews between two dates", async () => {
        const older = await client.getReviews("pub", "ext", 10, undefined, daysAgo(2.5));
        expect(older.reviews).toEqual(reviews.slice(2));
        const newer = await client.getReviews("pub", "ext", 10, undefined, undefined, daysAgo(2.5));
        expect(newer.reviews).toEqual(reviews.slice(0, 2));
        const between = await client.getReviews("pub", "ext", 10, undefined, daysAgo(1.5), daysAgo(4.5));
        expect(between.reviews).toEqual(reviews.slice(1, 4));
        expect(between.totalReviewCount).toBe(3);
    });

    it("summarizes the reviews", async () => {
        const summary = await client.getReviewsSummary("pub", "ext");
        expect(summary).toEqual(reviewSummary);
        expect(summary.ratingCount).toBe(6);
        expect(summary.averageRating).toBe(3.5);
        expect(summary.ratingSplit.map(s => s.ratingCount)).toEqual([1, 1, 0, 2, 2]);
    });

    it("summarizes the reviews between two dates", async () => {
        const summary = await client.getReviewsSummary("pub", "ext", daysAgo(0.5), daysAgo(2.5));
        expect(summary.ratingCount).toBe(2);
        expect(summary.averageRating).toBe(4.5);
        const none = await client.getReviewsSummary("pub", "ext", daysAgo(30));
        expect(none.ratingCount).toBe(0);
        expect(none.averageRating).toBe(0);
    });

    it("creates a review echoing the posted object", async () => {
        const posted: Review = { ...makeReview(3), text: "Fine" };
        const created = await client.createReview(posted, "pub", "ext");
        expect(created).toEqual(posted);
        expect(created).not.toBe(posted);
        const partial = await client.createReview({ rating: 5 } as Review, "pub", "ext");
        expect(partial.rating).toBe(5);
        expect(typeof partial.id).toBe("number");
        expect(partial.isDeleted).toBe(false);
        expect(partial.reply).toBeUndefined();
        expect(partial.adminReply).toBeUndefined();
    });

    it("deletes a review", async () => {
        await expect(client.deleteReview("pub", "ext", reviews[0].id)).resolves.toBeUndefined();
    });

    it("updates a known review", async () => {
        const target = reviews[1];
        const patch: ReviewPatch = {
            operation: ReviewPatchOperation.UpdateReview,
            reportedConcern: {
                category: ConcernCategory.General,
                concernText: "",
                reviewId: target.id,
                submittedDate: new Date(),
                userId: target.userId
            },
            reviewItem: { ...target, id: 1, rating: 1 }
        };
        const updated = await client.updateReview(patch, "pub", "ext", target.id);
        expect(updated.operation).toBe(ReviewPatchOperation.UpdateReview);
        expect(updated.reportedConcern).toBe(patch.reportedConcern);
        expect(updated.reviewItem.id).toBe(target.id);
        expect(updated.reviewItem.rating).toBe(1);
        expect(updated.reviewItem.userId).toBe(target.userId);
        expect(target.rating).toBe(4);
    });

    it("updates an unknown review", async () => {
        const patch = { operation: ReviewPatchOperation.FlagReview } as ReviewPatch;
        const updated = await client.updateReview(patch, "pub", "ext", 555_555);
        expect(updated.operation).toBe(ReviewPatchOperation.FlagReview);
        expect(updated.reviewItem.id).toBe(555_555);
        expect(typeof updated.reviewItem.title).toBe("string");
    });
});
