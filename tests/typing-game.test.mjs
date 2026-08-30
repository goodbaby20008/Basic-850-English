import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const sourceUrl = new URL("../app/data/typingGame.ts", import.meta.url);

async function loadTypingModule() {
  const source = await readFile(sourceUrl, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, isolatedModules: true },
    fileName: "typingGame.ts",
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.deepEqual(errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")), []);
  const encoded = Buffer.from(result.outputText, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

const sampleWords = [
  { id: "w-1", word: "simple", meaning_zh: "简单的；朴素的", example: { en: "Keep the plan simple.", zh: "让这个计划保持简单。" } },
  { id: "w-2", word: "river", meaning_zh: "河流", example: { en: "The river is clear.", zh: "这条河很清澈。" } },
];

test("language modes select the exact English or Chinese typing target", async () => {
  const { typingHint, typingTarget } = await loadTypingModule();
  const wordPrompt = { id: "w", kind: "word", word: sampleWords[0] };
  const sentencePrompt = { id: "s", kind: "sentence", word: sampleWords[0] };

  assert.equal(typingTarget(wordPrompt, "english"), "simple");
  assert.equal(typingTarget(wordPrompt, "bilingual"), "simple");
  assert.equal(typingHint(wordPrompt, "bilingual"), "简单的；朴素的");
  assert.equal(typingTarget(wordPrompt, "chinese"), "简单的");
  assert.equal(typingTarget(sentencePrompt, "chinese"), "让这个计划保持简单。");
  assert.equal(typingHint(sentencePrompt, "english"), "");
});

test("mixed sessions alternate words and sentences and fill the requested length", async () => {
  const { createTypingSession } = await loadTypingModule();
  const prompts = createTypingSession(sampleWords, "mixed", 5, () => 0.5);
  assert.equal(prompts.length, 5);
  assert.deepEqual(prompts.map((prompt) => prompt.kind), ["word", "sentence", "word", "sentence", "word"]);
  assert.ok(prompts.every((prompt) => sampleWords.some((word) => word.id === prompt.word.id)));
  assert.equal(new Set(prompts.map((prompt) => prompt.id)).size, 5);
});

test("classics sessions use keyboard-friendly pinyin while retaining Chinese hints", async () => {
  const { classicsTypingHint, classicsTypingTarget, createClassicsTypingSession } = await loadTypingModule();
  const classic = {
    id: "classic-1",
    text: "学而时习之，不亦说乎。",
    pinyinTone: "xué ér shí xí zhī bú yì yuè hū",
    pinyinPlain: "xue er shi xi zhi bu yi yue hu",
  };
  const prompts = createClassicsTypingSession([classic], 2, () => 0.5);

  assert.equal(prompts.length, 2);
  assert.notEqual(prompts[0].sessionId, prompts[1].sessionId);
  assert.equal(classicsTypingTarget(prompts[0], "english"), classic.pinyinPlain);
  assert.equal(classicsTypingTarget(prompts[0], "bilingual"), classic.pinyinPlain);
  assert.equal(classicsTypingTarget(prompts[0], "chinese"), classic.text);
  assert.equal(classicsTypingHint(prompts[0], "bilingual"), classic.text);
  assert.equal(classicsTypingHint(prompts[0], "english"), "");
});

test("comparison marks characters and counts overflow as errors", async () => {
  const { compareTyping } = await loadTypingModule();
  const result = compareTyping("cat", "cot!");
  assert.deepEqual(result.characters.map((character) => character.state), ["correct", "wrong", "correct"]);
  assert.equal(result.correct, 2);
  assert.equal(result.wrong, 2);
});

test("speed uses standard five-character English words and Chinese characters per minute", async () => {
  const { calculateTypingSpeed } = await loadTypingModule();
  assert.equal(calculateTypingSpeed(50, 60_000, "english"), 10);
  assert.equal(calculateTypingSpeed(50, 60_000, "bilingual"), 10);
  assert.equal(calculateTypingSpeed(50, 60_000, "chinese"), 50);
  assert.equal(calculateTypingSpeed(0, 60_000, "english"), 0);
});

test("typing view restores input focus for every prompt and supports automatic reading", async () => {
  const source = await readFile(new URL("../app/LearningApp.tsx", import.meta.url), "utf8");
  assert.match(source, /autoRead: true/);
  assert.match(source, /input\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /\[index, locked, status\]/);
  assert.match(source, /speakRef\.current\(currentSpeech\)/);
  assert.match(source, /role="switch" aria-checked=\{settings\.autoRead\}/);
  assert.match(source, /aria-busy=\{locked\}/);
  assert.match(source, /中华经典/);
  assert.match(source, /speakChineseRef\.current\(currentSpeech\)/);
  assert.match(source, /在这里输入无声调拼音/);
  assert.doesNotMatch(source, /disabled=\{locked\} spellCheck/);
});
