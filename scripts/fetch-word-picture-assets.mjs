import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataFile = resolve(projectRoot, "app/data/wordPictures.ts");
const outputDirectory = resolve(projectRoot, "public/illustrations/words");

async function loadPictures() {
  const source = await readFile(dataFile, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const encoded = Buffer.from(compiled, "utf8").toString("base64");
  const module = await import(`data:text/javascript;base64,${encoded}`);
  const value = module.wordPictures;
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    return Object.entries(value).map(([wordId, item]) => ({ ...item, wordId }));
  }
  throw new Error("wordPictures must be an array or record");
}

function emojiCodePoints(emoji, keepVariationSelectors) {
  return Array.from(emoji)
    .map((character) => character.codePointAt(0))
    .filter((value) => keepVariationSelectors || value !== 0xfe0f)
    .map((value) => value.toString(16))
    .join("-");
}

async function fetchSvg(emoji) {
  const candidates = [...new Set([
    emojiCodePoints(emoji, true),
    emojiCodePoints(emoji, false),
  ])];
  for (const codePoint of candidates) {
    const source = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@v17.0.2/assets/svg/${codePoint}.svg`;
    const response = await fetch(source, { headers: { "user-agent": "Basic850-learning-material-builder" } });
    if (!response.ok) continue;
    const svg = await response.text();
    if (!svg.includes("<svg")) continue;
    return { codePoint, source, svg };
  }
  throw new Error(`No Twemoji SVG found for ${emoji} (${candidates.join(", ")})`);
}

const pictures = await loadPictures();
await mkdir(outputDirectory, { recursive: true });

const uniqueEmoji = [...new Set(pictures.map((item) => item.emoji))];
const assetByEmoji = new Map();
for (let index = 0; index < uniqueEmoji.length; index += 8) {
  const batch = uniqueEmoji.slice(index, index + 8);
  const results = await Promise.all(batch.map(async (emoji) => [emoji, await fetchSvg(emoji)]));
  results.forEach(([emoji, asset]) => assetByEmoji.set(emoji, asset));
}

const manifest = [];
for (const picture of pictures) {
  if (!/^[a-z0-9_-]+$/i.test(picture.wordId)) throw new Error(`Unsafe word id: ${picture.wordId}`);
  const asset = assetByEmoji.get(picture.emoji);
  const filename = `${picture.wordId}.svg`;
  await writeFile(resolve(outputDirectory, filename), asset.svg, "utf8");
  manifest.push({
    wordId: picture.wordId,
    emoji: picture.emoji,
    filename,
    upstreamCodePoint: asset.codePoint,
    upstreamSource: asset.source,
  });
}

await writeFile(
  resolve(outputDirectory, "manifest.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), count: manifest.length, assets: manifest }, null, 2)}\n`,
  "utf8",
);

process.stdout.write(`Downloaded ${manifest.length} local word-picture SVGs from ${uniqueEmoji.length} unique Twemoji graphics.\n`);
