import { fake, seed } from "../azure-devops-extension-api/common/fixtures";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const SHA = /^[0-9a-f]{40}$/;
const URL = /^https:\/\/[a-z]+\.[a-z]+\/[a-z]+-[a-z]+$/;
const EMAIL = /^[a-z]+\.[a-z]+@[a-z]+\.[a-z]+$/;

const repeat = <T>(count: number, produce: () => T): T[] => Array.from({ length: count }, produce);

describe("fixtures seed", () => {
    it("produces the same sequence for the same seed", () => {
        seed(42);
        const first = repeat(5, () => fake.number.int());
        seed(42);
        const second = repeat(5, () => fake.number.int());
        expect(second).toEqual(first);
    });

    it("produces a different sequence for a different seed", () => {
        fake.seed(1);
        const first = repeat(5, () => fake.number.int());
        fake.seed(2);
        const second = repeat(5, () => fake.number.int());
        expect(second).not.toEqual(first);
    });
});

describe("fixtures number", () => {
    it("stays inside the default range", () => {
        repeat(200, () => fake.number.int()).forEach(value => {
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1_000_000);
        });
    });

    it("honours min and max inclusively", () => {
        const values = repeat(300, () => fake.number.int({ min: 1, max: 3 }));
        expect(new Set(values)).toEqual(new Set([1, 2, 3]));
    });

    it("accepts a partial range", () => {
        repeat(50, () => fake.number.int({ min: 999_990 })).forEach(value => expect(value).toBeGreaterThanOrEqual(999_990));
        repeat(50, () => fake.number.int({ max: 1 })).forEach(value => expect(value).toBeLessThanOrEqual(1));
    });
});

describe("fixtures string", () => {
    it("generates version 4 uuids", () => {
        repeat(50, fake.string.uuid).forEach(value => expect(value).toMatch(UUID));
    });

    it("generates alphanumeric strings of the requested length", () => {
        expect(fake.string.alphanumeric()).toMatch(/^[A-Za-z0-9]{10}$/);
        expect(fake.string.alphanumeric(16)).toMatch(/^[A-Za-z0-9]{16}$/);
    });

    it("generates alphabetic strings of the requested length", () => {
        expect(fake.string.alpha()).toMatch(/^[A-Za-z]{10}$/);
        expect(fake.string.alpha({ length: 4 })).toMatch(/^[A-Za-z]{4}$/);
    });
});

describe("fixtures lorem", () => {
    it("returns a lowercase word", () => {
        expect(fake.lorem.word()).toMatch(/^[a-z]+$/);
    });

    it("joins words with spaces", () => {
        expect(fake.lorem.words().split(" ")).toHaveLength(3);
        expect(fake.lorem.words(5).split(" ")).toHaveLength(5);
    });

    it("joins slugs with dashes", () => {
        expect(fake.lorem.slug()).toMatch(SLUG);
        expect(fake.lorem.slug(2).split("-")).toHaveLength(2);
    });

    it("builds capitalised sentences ending with a period", () => {
        const value = fake.lorem.sentence();
        expect(value).toMatch(/^[A-Z][a-z]+(?: [a-z]+)*\.$/);
        expect(fake.lorem.sentence(4).split(" ")).toHaveLength(4);
    });

    it("builds paragraphs from sentences", () => {
        expect(fake.lorem.paragraph().split(". ")).toHaveLength(3);
        expect(fake.lorem.paragraph(2).split(". ")).toHaveLength(2);
    });

    it("separates paragraphs with newlines", () => {
        expect(fake.lorem.paragraphs().split("\n")).toHaveLength(3);
        expect(fake.lorem.paragraphs(2).split("\n")).toHaveLength(2);
    });
});

describe("fixtures people and companies", () => {
    it("returns names", () => {
        expect(fake.person.firstName()).toMatch(/^[A-Z][a-z]+$/);
        expect(fake.person.lastName()).toMatch(/^[A-Z][a-z]+$/);
        expect(fake.person.fullName()).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    });

    it("returns a noun", () => {
        expect(fake.word.noun()).toMatch(/^[a-z]+$/);
    });

    it("returns a company name with a suffix", () => {
        expect(fake.company.name()).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    });

    it("returns a three part product name", () => {
        expect(fake.commerce.productName().split(" ")).toHaveLength(3);
    });
});

describe("fixtures internet", () => {
    it("returns a domain with a known tld", () => {
        expect(fake.internet.domainName()).toMatch(/^[a-z]+\.(com|io|dev|net|org|app)$/);
    });

    it("returns an https url", () => {
        expect(fake.internet.url()).toMatch(URL);
    });

    it("returns lowercase emails", () => {
        expect(fake.internet.email()).toMatch(EMAIL);
        expect(fake.internet.exampleEmail()).toMatch(/^[a-z]+\.[a-z]+@example\.com$/);
    });

    it("returns a lowercase username with a numeric suffix", () => {
        expect(fake.internet.username()).toMatch(/^[a-z]+_[a-z]+\d{1,3}$/);
    });
});

describe("fixtures dates", () => {
    const now = Date.now();

    it("returns recent dates inside the span", () => {
        const value = fake.date.recent().getTime();
        expect(value).toBeLessThanOrEqual(now + 1000);
        expect(value).toBeGreaterThanOrEqual(now - 86_400_000);
        expect(fake.date.recent({ days: 10 }).getTime()).toBeGreaterThanOrEqual(now - 10 * 86_400_000);
    });

    it("returns past dates inside the span", () => {
        const value = fake.date.past().getTime();
        expect(value).toBeLessThanOrEqual(now + 1000);
        expect(value).toBeGreaterThanOrEqual(now - 365 * 86_400_000);
        expect(fake.date.past({ years: 2 }).getTime()).toBeGreaterThanOrEqual(now - 2 * 365 * 86_400_000);
    });

    it("returns future dates inside the span", () => {
        const value = fake.date.future().getTime();
        expect(value).toBeGreaterThanOrEqual(now - 1000);
        expect(value).toBeLessThanOrEqual(now + 365 * 86_400_000 + 1000);
        expect(fake.date.future({ years: 2 }).getTime()).toBeLessThanOrEqual(now + 2 * 365 * 86_400_000 + 1000);
    });
});

describe("fixtures helpers", () => {
    it("returns both boolean values over many draws", () => {
        expect(new Set(repeat(200, fake.datatype.boolean))).toEqual(new Set([true, false]));
    });

    it("picks elements only from the given array", () => {
        const values = ["a", "b", "c"] as const;
        repeat(50, () => fake.helpers.arrayElement(values)).forEach(value => expect(values).toContain(value));
        expect(fake.helpers.arrayElement([7])).toBe(7);
    });
});

describe("fixtures git, system, image and color", () => {
    it("returns a 40 character sha", () => {
        expect(fake.git.commitSha()).toMatch(SHA);
    });

    it("returns a verb noun commit message", () => {
        expect(fake.git.commitMessage()).toMatch(/^[a-z]+ [a-z]+$/);
    });

    it("returns a dashed branch name", () => {
        expect(fake.git.branch()).toMatch(/^[a-z]+-[a-z]+$/);
    });

    it("returns semver strings", () => {
        expect(fake.system.semver()).toMatch(SEMVER);
    });

    it("returns file names with an extension", () => {
        expect(fake.system.fileName()).toMatch(/^[a-z]+\.[a-z]+$/);
    });

    it("returns image urls", () => {
        expect(fake.image.avatar()).toMatch(/^https:\/\/avatars\.example\.com\/[0-9a-f-]{36}\.png$/);
        expect(fake.image.url()).toMatch(/^https:\/\/images\.example\.com\/\d+\/\d+$/);
    });

    it("returns hex colors", () => {
        expect(fake.color.rgb()).toMatch(/^#[0-9a-f]{6}$/);
        expect(fake.color.rgb({ format: "hex" })).toMatch(/^#[0-9a-f]{6}$/);
    });
});
