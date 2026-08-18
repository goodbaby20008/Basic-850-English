import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const picturesSourceUrl = new URL("../app/data/wordPictures.ts", import.meta.url);
const wordsDataUrl = new URL("../public/data/words.json", import.meta.url);

function assertNonEmptyText(value, label) {
  assert.equal(typeof value, "string", `${label} should be a string`);
  assert.ok(value.trim().length > 0, `${label} should not be empty`);
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    (typeof ts.isSatisfiesExpression === "function" && ts.isSatisfiesExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function getStaticPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function findDuplicateRecordKeys(source) {
  const sourceFile = ts.createSourceFile(
    "wordPictures.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declaredKeys = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "wordPictures") {
      const initializer = node.initializer ? unwrapExpression(node.initializer) : undefined;
      if (initializer && ts.isObjectLiteralExpression(initializer)) {
        for (const property of initializer.properties) {
          if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) {
            const key = getStaticPropertyName(property.name);
            if (key !== undefined) declaredKeys.push(key);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  const seen = new Set();
  return declaredKeys.filter((key) => {
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
}

async function loadPictureData() {
  const [source, wordsText] = await Promise.all([
    readFile(picturesSourceUrl, "utf8"),
    readFile(wordsDataUrl, "utf8"),
  ]);
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      isolatedModules: true,
    },
    fileName: "wordPictures.ts",
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(
    errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
    [],
    "wordPictures.ts should transpile without syntax errors",
  );

  const encoded = Buffer.from(
    `${result.outputText}\n//# sourceURL=wordPictures.ts`,
    "utf8",
  ).toString("base64");
  const module = await import(`data:text/javascript;base64,${encoded}`);
  const wordsData = JSON.parse(wordsText);
  assert.ok(Array.isArray(wordsData.words), "words.json should contain a words array");
  assert.ok(module.wordPictures, "wordPictures.ts should export wordPictures");

  return { source, pictures: module.wordPictures, words: wordsData.words };
}

function normalizePictureEntries(pictures) {
  if (Array.isArray(pictures)) {
    return pictures.map((picture, index) => {
      assert.ok(picture && typeof picture === "object", `picture ${index + 1} should be an object`);
      const key = picture.wordId;
      assertNonEmptyText(key, `picture ${index + 1} wordId`);
      return { key, picture };
    });
  }

  assert.ok(
    pictures && typeof pictures === "object",
    "wordPictures should be a keyed object or an array",
  );
  return Object.entries(pictures).map(([key, picture]) => ({ key, picture }));
}

test("word-picture keys are unique and refer to real Basic 850 entries", async (t) => {
  const { source, pictures, words } = await loadPictureData();
  const entries = normalizePictureEntries(pictures);
  const knownIds = new Set(words.map((item) => item.id));
  const knownWords = new Set(words.map((item) => item.word));
  const seen = new Set();

  assert.ok(entries.length > 0, "wordPictures should contain at least one useful mapping");
  for (const { key, picture } of entries) {
    assert.ok(!seen.has(key), `wordPictures should not map ${key} more than once`);
    seen.add(key);
    assert.ok(
      knownIds.has(key) || knownWords.has(key),
      `wordPictures contains an unknown words.json key: ${key}`,
    );
    assert.equal(picture.wordId, key, `${key} should repeat its record key as wordId`);
  }

  assert.deepEqual(
    findDuplicateRecordKeys(source),
    [],
    "the wordPictures object literal should not declare the same key twice",
  );

  const picturableIds = new Set(
    words.filter((item) => item.category_id === "things_picturable").map((item) => item.id),
  );
  const picturableWords = new Set(
    words.filter((item) => item.category_id === "things_picturable").map((item) => item.word),
  );
  const picturableCovered = entries.filter(
    ({ key }) => picturableIds.has(key) || picturableWords.has(key),
  ).length;
  t.diagnostic(
    `word-picture coverage: ${entries.length}/${words.length} total; ${picturableCovered}/${picturableIds.size} picturable words`,
  );
});

test("every word picture has a real pictogram and an honest fidelity cue", async () => {
  const { pictures } = await loadPictureData();
  const entries = normalizePictureEntries(pictures);
  const emojiPattern = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[#*0-9]\uFE0F?\u20E3)/u;
  const placeholderPattern = /^(?:[a-z]+|tbd|todo|n\/?a|none|null|emoji|icon|image|picture|pic)$/i;

  for (const { key, picture } of entries) {
    assert.ok(picture && typeof picture === "object", `${key} picture should be an object`);
    assertNonEmptyText(picture.emoji, `${key} emoji`);
    assert.ok(
      emojiPattern.test(picture.emoji),
      `${key} emoji should contain a pictographic emoji, not an English-letter or text placeholder`,
    );
    assert.ok(
      !placeholderPattern.test(picture.emoji.trim()),
      `${key} emoji should not be a plain-text placeholder`,
    );
    assertNonEmptyText(picture.altZh, `${key} altZh`);
    assertNonEmptyText(picture.cueZh, `${key} cueZh`);
    assert.ok(
      picture.fidelity === "exact" || picture.fidelity === "approximate",
      `${key} fidelity should be exact or approximate`,
    );
    if (picture.fidelity === "approximate") {
      assert.match(
        picture.cueZh,
        /(?:联想|借图|示意)/,
        `${key} approximate cueZh should clearly label the image as an association or illustration`,
      );
    }
  }
});
