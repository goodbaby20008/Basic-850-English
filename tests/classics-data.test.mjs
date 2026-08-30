import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataUrl = new URL("../public/data/classics.json", import.meta.url);

test("classics data preserves the ten-volume source structure and keyboard pinyin", async () => {
  const data = JSON.parse(await readFile(dataUrl, "utf8"));
  assert.equal(data.sourceFile, "中华智慧启蒙经典诵读1.docx");
  assert.equal(data.volumes.length, 10);
  assert.equal(data.stats.sections, 61);
  assert.equal(data.prompts.length, 825);
  assert.ok(data.prompts.every((item) => item.text && item.pinyinTone && /^[a-zv ]+$/.test(item.pinyinPlain)));
  assert.ok(data.prompts.every((item) => Array.isArray(item.sourceParagraphs) && item.sourceParagraphs.length));
});

test("audited classical polyphones keep their contextual readings", async () => {
  const data = JSON.parse(await readFile(dataUrl, "utf8"));
  const byText = new Map(data.prompts.map((item) => [item.text, item.pinyinTone]));
  assert.equal(byText.get("读书百遍，其义自见。"), "dú shū bǎi biàn qí yì zì xiàn");
  assert.equal(byText.get("日省其身。"), "rì xǐng qí shēn");
  assert.equal(byText.get("安时而处顺，哀乐不能入。"), "ān shí ér chǔ shùn āi lè bù néng rù");
  assert.equal(byText.get("仁者爱人。"), "rén zhě ài rén");
  assert.equal(byText.get("孝悌为仁之本。"), "xiào tì wéi rén zhī běn");
  assert.equal(byText.get("为政以德，譬如北辰，居其所，而众星共之。"), "wéi zhèng yǐ dé pì rú běi chén jū qí suǒ ér zhòng xīng gǒng zhī");
});
