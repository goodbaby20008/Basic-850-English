import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const alphabetSourceUrl = new URL("../app/data/alphabet.ts", import.meta.url);

async function loadAlphabetModule() {
  const source = await readFile(alphabetSourceUrl, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      isolatedModules: true,
    },
    fileName: "alphabet.ts",
    reportDiagnostics: true,
  });

  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(
    errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
    [],
    "alphabet.ts should transpile without syntax errors",
  );

  const encoded = Buffer.from(`${result.outputText}\n//# sourceURL=alphabet.ts`, "utf8").toString(
    "base64",
  );
  return import(`data:text/javascript;base64,${encoded}`);
}

function assertNonEmptyText(value, label) {
  assert.equal(typeof value, "string", `${label} should be a string`);
  assert.ok(value.trim().length > 0, `${label} should not be empty`);
}

test("alphabet data contains every letter from A to Z exactly once", async () => {
  const { alphabetLetters } = await loadAlphabetModule();
  assert.ok(Array.isArray(alphabetLetters), "alphabetLetters should be an array");
  assert.equal(alphabetLetters.length, 26);

  const expectedUppercase = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  const expectedLowercase = [..."abcdefghijklmnopqrstuvwxyz"];
  const uppercase = alphabetLetters.map((letter) => letter.uppercase);
  const lowercase = alphabetLetters.map((letter) => letter.lowercase);
  const ids = alphabetLetters.map((letter) => letter.id);

  assert.deepEqual(uppercase, expectedUppercase, "letters should be ordered A-Z");
  assert.deepEqual(lowercase, expectedLowercase, "lowercase forms should be ordered a-z");
  assert.equal(new Set(uppercase).size, 26, "uppercase letters should be unique");
  assert.equal(new Set(lowercase).size, 26, "lowercase letters should be unique");
  assert.equal(new Set(ids).size, 26, "letter IDs should be unique");
  ids.forEach((id, index) => assert.equal(id, expectedUppercase[index].toLowerCase()));
});

test("every letter has UK and US names, useful sound notes, and complete examples", async () => {
  const { alphabetLetters } = await loadAlphabetModule();

  for (const letter of alphabetLetters) {
    const label = `letter ${letter.uppercase}`;
    assertNonEmptyText(letter.nameIpa?.uk, `${label} UK name IPA`);
    assertNonEmptyText(letter.nameIpa?.us, `${label} US name IPA`);
    assertNonEmptyText(letter.mouthTip, `${label} mouth tip`);
    assertNonEmptyText(letter.writingTip, `${label} writing tip`);

    assert.ok(Array.isArray(letter.commonSounds), `${label} commonSounds should be an array`);
    assert.ok(letter.commonSounds.length > 0, `${label} should explain at least one common sound`);
    for (const [index, sound] of letter.commonSounds.entries()) {
      assertNonEmptyText(sound.ipaUk, `${label} sound ${index + 1} UK IPA`);
      assertNonEmptyText(sound.noteZh, `${label} sound ${index + 1} Chinese note`);
      if (sound.ipaUs !== undefined) {
        assertNonEmptyText(sound.ipaUs, `${label} sound ${index + 1} US IPA`);
      }
    }

    assert.ok(Array.isArray(letter.examples), `${label} examples should be an array`);
    assert.ok(letter.examples.length > 0, `${label} should have at least one example word`);
    for (const [index, example] of letter.examples.entries()) {
      const exampleLabel = `${label} example ${index + 1}`;
      assertNonEmptyText(example.word, `${exampleLabel} word`);
      assertNonEmptyText(example.ipaUk, `${exampleLabel} UK IPA`);
      assertNonEmptyText(example.meaningZh, `${exampleLabel} Chinese meaning`);
      assertNonEmptyText(example.soundIpa, `${exampleLabel} target sound`);
    }
  }

  const z = alphabetLetters.find((letter) => letter.uppercase === "Z");
  assert.equal(z?.nameIpa.uk, "/zed/", "British Z should be taught as zed");
  assert.equal(z?.nameIpa.us, "/ziː/", "American Z should be taught as zee");
});

test("six lessons cover all 26 letters exactly once and contain executable tasks", async () => {
  const { alphabetLetters, alphabetLessons } = await loadAlphabetModule();
  assert.ok(Array.isArray(alphabetLessons), "alphabetLessons should be an array");
  assert.equal(alphabetLessons.length, 6);

  const lessonIds = alphabetLessons.map((lesson) => lesson.id);
  const lessonSlugs = alphabetLessons.map((lesson) => lesson.slug);
  assert.equal(new Set(lessonIds).size, 6, "lesson IDs should be unique");
  assert.equal(new Set(lessonSlugs).size, 6, "lesson slugs should be unique");

  const knownLetterIds = new Set(alphabetLetters.map((letter) => letter.id));
  const coveredLetterIds = [];
  for (const [index, lesson] of alphabetLessons.entries()) {
    const label = `lesson ${index + 1}`;
    assertNonEmptyText(lesson.id, `${label} id`);
    assertNonEmptyText(lesson.slug, `${label} slug`);
    assertNonEmptyText(lesson.title, `${label} title`);
    assertNonEmptyText(lesson.subtitle, `${label} subtitle`);
    assert.ok(
      Number.isInteger(lesson.durationMinutes) && lesson.durationMinutes > 0,
      `${label} durationMinutes should be a positive integer`,
    );
    assert.ok(Array.isArray(lesson.objectives) && lesson.objectives.length > 0);
    lesson.objectives.forEach((objective, objectiveIndex) =>
      assertNonEmptyText(objective, `${label} objective ${objectiveIndex + 1}`),
    );
    assertNonEmptyText(lesson.warmUp, `${label} warm-up`);
    assertNonEmptyText(lesson.checkpoint, `${label} checkpoint`);

    assert.ok(Array.isArray(lesson.letterIds) && lesson.letterIds.length > 0);
    assert.equal(
      new Set(lesson.letterIds).size,
      lesson.letterIds.length,
      `${label} should not repeat a letter`,
    );
    for (const letterId of lesson.letterIds) {
      assert.ok(knownLetterIds.has(letterId), `${label} refers to unknown letter ID: ${letterId}`);
      coveredLetterIds.push(letterId);
    }

    for (const taskName of ["recognition", "listening", "writing"]) {
      assertNonEmptyText(lesson.tasks?.[taskName], `${label} ${taskName} task`);
    }
  }

  assert.equal(coveredLetterIds.length, 26, "the lesson sequence should contain 26 letter slots");
  assert.equal(
    new Set(coveredLetterIds).size,
    26,
    "the six lessons should cover each letter exactly once",
  );
  assert.deepEqual(
    new Set(coveredLetterIds),
    knownLetterIds,
    "lesson coverage should match the complete alphabet",
  );
});

test("letter-name playback uses pronunciation-only prompts", async () => {
  const source = await readFile(new URL("../app/LearningApp.tsx", import.meta.url), "utf8");
  assert.match(source, /a: "ay", b: "bee", c: "see"/);
  assert.match(source, /w: "double u", x: "ex", y: "why"/);
  assert.match(source, /speak\(LETTER_NAME_SPEECH\[id\]/);
  assert.doesNotMatch(source, /else speak\(uppercase\)/);
});
