export interface IntRange {
    min?: number;
    max?: number;
}

export interface DateSpan {
    days?: number;
    years?: number;
}

const WORDS = [
    "alpha", "beta", "gamma", "delta", "omega", "sigma", "theta", "kappa", "lambda", "zeta",
    "amber", "azure", "cobalt", "coral", "crimson", "ivory", "jade", "onyx", "pearl", "ruby",
    "anchor", "beacon", "bridge", "canyon", "cloud", "compass", "engine", "falcon", "forest", "harbor",
    "island", "lantern", "meadow", "mirror", "nebula", "orbit", "pixel", "prism", "quartz", "river",
    "rocket", "saddle", "signal", "summit", "tunnel", "vector", "vertex", "voyage", "willow", "zenith"
];

const NOUNS = [
    "pipeline", "release", "artifact", "branch", "commit", "widget", "dashboard", "backlog", "sprint", "board",
    "repository", "workflow", "agent", "pool", "queue", "variable", "secret", "token", "policy", "wiki"
];

const VERBS = [
    "add", "fix", "update", "remove", "refactor", "rename", "merge", "bump", "revert", "improve",
    "document", "test", "optimize", "extract", "inline", "split", "clean", "migrate", "enable", "disable"
];

const FIRST_NAMES = [
    "Amanda", "Bruno", "Camila", "Diego", "Elena", "Felipe", "Gabriela", "Hugo", "Isabela", "Joao",
    "Karina", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro", "Quinn", "Rafael", "Sofia", "Thiago"
];

const LAST_NAMES = [
    "Souza", "Silva", "Santos", "Oliveira", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima",
    "Araujo", "Fernandes", "Carvalho", "Gomes", "Martins", "Rocha", "Ribeiro", "Alves", "Monteiro", "Mendes"
];

const COMPANY_SUFFIXES = ["Labs", "Group", "Systems", "Holdings", "Partners", "Networks", "Software", "Industries"];
const TLDS = ["com", "io", "dev", "net", "org", "app"];
const EXTENSIONS = ["txt", "md", "json", "yml", "log", "zip", "csv", "png"];
const ADJECTIVES = ["Sleek", "Rustic", "Modern", "Compact", "Ergonomic", "Handcrafted", "Refined", "Intelligent"];
const MATERIALS = ["Steel", "Wooden", "Granite", "Cotton", "Rubber", "Plastic", "Concrete", "Bronze"];
const PRODUCTS = ["Chair", "Keyboard", "Table", "Lamp", "Bottle", "Sensor", "Cabinet", "Speaker"];
const HEX = "0123456789abcdef";
const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHANUMERIC = `${ALPHA}0123456789`;

const DAY_MS = 86_400_000;
const YEAR_MS = 365 * DAY_MS;

let state = 0;

const random = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
};

export const seed = (value: number): void => {
    state = value >>> 0;
};

seed(Math.floor(Math.random() * 4_294_967_296));

const int = ({ min = 0, max = 1_000_000 }: IntRange = {}): number =>
    min + Math.floor(random() * (max - min + 1));

const arrayElement = <T>(values: readonly T[]): T => values[int({ min: 0, max: values.length - 1 })];

const chars = (alphabet: string, length: number): string =>
    Array.from({ length }, () => alphabet[int({ min: 0, max: alphabet.length - 1 })]).join("");

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const word = (): string => arrayElement(WORDS);
const words = (count = 3): string => Array.from({ length: count }, word).join(" ");
const slug = (count = 3): string => Array.from({ length: count }, word).join("-");
const sentence = (count = int({ min: 3, max: 10 })): string => `${capitalize(words(count))}.`;
const paragraph = (count = 3): string => Array.from({ length: count }, () => sentence()).join(" ");
const paragraphs = (count = 3): string => Array.from({ length: count }, () => paragraph()).join("\n");

const firstName = (): string => arrayElement(FIRST_NAMES);
const lastName = (): string => arrayElement(LAST_NAMES);
const fullName = (): string => `${firstName()} ${lastName()}`;

const domainName = (): string => `${word()}.${arrayElement(TLDS)}`;
const url = (): string => `https://${domainName()}/${slug(2)}`;
const email = (): string => `${firstName()}.${lastName()}@${domainName()}`.toLowerCase();
const exampleEmail = (): string => `${firstName()}.${lastName()}@example.com`.toLowerCase();
const username = (): string => `${firstName()}_${lastName()}${int({ min: 1, max: 999 })}`.toLowerCase();

const uuid = (): string => {
    const hex = chars(HEX, 32).split("");
    hex[12] = "4";
    hex[16] = HEX[int({ min: 8, max: 11 })];
    const value = hex.join("");
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
};

const recent = ({ days = 1 }: DateSpan = {}): Date => new Date(Date.now() - random() * days * DAY_MS);
const past = ({ years = 1 }: DateSpan = {}): Date => new Date(Date.now() - random() * years * YEAR_MS);
const future = ({ years = 1 }: DateSpan = {}): Date => new Date(Date.now() + random() * years * YEAR_MS);

export const fake = {
    seed,
    number: { int },
    string: {
        uuid,
        alphanumeric: (length = 10): string => chars(ALPHANUMERIC, length),
        alpha: ({ length = 10 }: { length?: number } = {}): string => chars(ALPHA, length)
    },
    lorem: { word, words, slug, sentence, paragraph, paragraphs },
    word: { noun: (): string => arrayElement(NOUNS) },
    person: { firstName, lastName, fullName },
    internet: { domainName, url, email, exampleEmail, username },
    company: { name: (): string => `${lastName()} ${arrayElement(COMPANY_SUFFIXES)}` },
    commerce: { productName: (): string => `${arrayElement(ADJECTIVES)} ${arrayElement(MATERIALS)} ${arrayElement(PRODUCTS)}` },
    date: { recent, past, future },
    datatype: { boolean: (): boolean => random() < 0.5 },
    helpers: { arrayElement },
    git: {
        commitSha: (): string => chars(HEX, 40),
        commitMessage: (): string => `${arrayElement(VERBS)} ${arrayElement(NOUNS)}`,
        branch: (): string => `${arrayElement(NOUNS)}-${arrayElement(VERBS)}`
    },
    system: {
        semver: (): string => `${int({ min: 0, max: 9 })}.${int({ min: 0, max: 20 })}.${int({ min: 0, max: 99 })}`,
        fileName: (): string => `${word()}.${arrayElement(EXTENSIONS)}`
    },
    image: {
        avatar: (): string => `https://avatars.example.com/${uuid()}.png`,
        url: (): string => `https://images.example.com/${int({ min: 100, max: 1920 })}/${int({ min: 100, max: 1080 })}`
    },
    color: { rgb: (_options: { format?: string } = {}): string => `#${chars(HEX, 6)}` }
};
