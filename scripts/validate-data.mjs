import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const wordsData = JSON.parse(fs.readFileSync(path.join(root, "public/data/words.json"), "utf8"));
const courseData = JSON.parse(fs.readFileSync(path.join(root, "public/data/course.json"), "utf8"));
const classicsData = JSON.parse(fs.readFileSync(path.join(root, "public/data/classics.json"), "utf8"));
const errors = [];
const expectedCategories = {
  operations: 100,
  things_general: 400,
  things_picturable: 200,
  qualities_general: 100,
  qualities_opposites: 50,
};

const words = wordsData.words ?? [];
if (words.length !== 850) errors.push(`words: expected 850, got ${words.length}`);
const ids = words.map((item) => item.id);
const lemmas = words.map((item) => item.word.toLowerCase());
if (new Set(ids).size !== 850) errors.push(`word ids: expected 850 unique, got ${new Set(ids).size}`);
if (new Set(lemmas).size !== 850) errors.push(`lemmas: expected 850 unique, got ${new Set(lemmas).size}`);

for (const [category, expected] of Object.entries(expectedCategories)) {
  const actual = words.filter((item) => item.category_id === category).length;
  if (actual !== expected) errors.push(`${category}: expected ${expected}, got ${actual}`);
}

for (const item of words) {
  if (!item.meaning_zh || !item.definition_en || !item.example?.en || !item.example?.zh) {
    errors.push(`${item.id}: missing required teaching text`);
  }
  if (!item.pronunciation?.uk?.ipa || !item.pronunciation?.us?.ipa) {
    errors.push(`${item.id}: missing UK or US IPA`);
  }
  if (!Array.isArray(item.pos) || !Array.isArray(item.related)) {
    errors.push(`${item.id}: pos/related must be arrays`);
  }
  if (/\r|\n/.test(item.meaning_zh) || item.meaning_zh.length > 48) {
    errors.push(`${item.id}: Chinese core meaning is not concise`);
  }
  if (/ejaculat|orgasm|genital|sexual discharge/i.test(item.definition_en)) {
    errors.push(`${item.id}: unsuitable rare/sensitive default definition`);
  }
  if (/释义待审|undefined|null/i.test(`${item.meaning_zh} ${item.example?.zh}`)) {
    errors.push(`${item.id}: unresolved teaching placeholder`);
  }
  if (/的的|；[^。]{0,30}的。/.test(item.example?.zh ?? "")) {
    errors.push(`${item.id}: mechanically malformed Chinese example`);
  }
}

const units = courseData.units ?? [];
const lessons = units.flatMap((unit) => unit.lessons ?? []);
const mappedIds = lessons.flatMap((lesson) => lesson.wordIds ?? []);
if (units.length !== 17) errors.push(`course units: expected 17, got ${units.length}`);
if (lessons.length !== 85) errors.push(`course lessons: expected 85, got ${lessons.length}`);
if (lessons.some((lesson) => lesson.wordIds?.length !== 10)) errors.push("course: every lesson must contain 10 words");
if (mappedIds.length !== 850 || new Set(mappedIds).size !== 850) {
  errors.push(`course mapping: expected 850 placements/unique, got ${mappedIds.length}/${new Set(mappedIds).size}`);
}
const unknown = mappedIds.filter((id) => !new Set(ids).has(id));
if (unknown.length) errors.push(`course mapping: ${unknown.length} unknown ids`);

const classicVolumes = classicsData.volumes ?? [];
const classicSections = classicVolumes.flatMap((volume) => volume.sections ?? []);
const classicPrompts = classicsData.prompts ?? [];
const classicIds = classicPrompts.map((item) => item.id);
const classicMappedIds = classicSections.flatMap((section) => section.promptIds ?? []);
if (classicVolumes.length !== 10) errors.push(`classics: expected 10 volumes, got ${classicVolumes.length}`);
if (classicSections.length !== 61) errors.push(`classics: expected 61 practice sections, got ${classicSections.length}`);
if (classicPrompts.length !== 825) errors.push(`classics: expected 825 prompts, got ${classicPrompts.length}`);
if (new Set(classicIds).size !== classicPrompts.length) errors.push("classics: prompt ids must be unique");
if (classicMappedIds.length !== classicPrompts.length || new Set(classicMappedIds).size !== classicPrompts.length) {
  errors.push(`classics mapping: expected ${classicPrompts.length} placements/unique, got ${classicMappedIds.length}/${new Set(classicMappedIds).size}`);
}
for (const item of classicPrompts) {
  const hanCount = Array.from(item.text ?? "").filter((character) => /\p{Script=Han}/u.test(character)).length;
  const toneSyllables = (item.pinyinTone ?? "").split(/\s+/).filter(Boolean);
  const plainSyllables = (item.pinyinPlain ?? "").split(/\s+/).filter(Boolean);
  if (!item.text || !hanCount || !item.pinyinTone || !item.pinyinPlain) errors.push(`${item.id}: missing classics text or pinyin`);
  if (toneSyllables.length !== hanCount || plainSyllables.length !== hanCount) {
    errors.push(`${item.id}: expected ${hanCount} pinyin syllables, got ${toneSyllables.length}/${plainSyllables.length}`);
  }
  if (!/^[a-zv ]+$/.test(item.pinyinPlain ?? "")) errors.push(`${item.id}: pinyinPlain is not lowercase keyboard ASCII`);
  if (!Array.isArray(item.sourceParagraphs) || !item.sourceParagraphs.length) errors.push(`${item.id}: missing DOCX paragraph trace`);
}

const classicByText = new Map(classicPrompts.map((item) => [item.text, item]));
const expectedClassicalReadings = [
  ["知者不惑，仁者不忧，勇者不惧。", "zhì zhě bù huò rén zhě bù yōu yǒng zhě bú jù"],
  ["读书百遍，其义自见。", "dú shū bǎi biàn qí yì zì xiàn"],
  ["日省其身。", "rì xǐng qí shēn"],
  ["安时而处顺，哀乐不能入。", "ān shí ér chǔ shùn āi lè bù néng rù"],
  ["为政以德，譬如北辰，居其所，而众星共之。", "wéi zhèng yǐ dé pì rú běi chén jū qí suǒ ér zhòng xīng gǒng zhī"],
];
for (const [text, expected] of expectedClassicalReadings) {
  const item = classicByText.get(text);
  if (!item) errors.push(`classics: missing audited passage ${text}`);
  else if (item.pinyinTone !== expected) errors.push(`classics: reading drift for ${text}: ${item.pinyinTone}`);
}

if (errors.length) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 40)) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  words: words.length,
  uniqueWords: new Set(lemmas).size,
  categoryCounts: Object.fromEntries(Object.keys(expectedCategories).map((id) => [id, words.filter((item) => item.category_id === id).length])),
  units: units.length,
  lessons: lessons.length,
  mappedWordIds: mappedIds.length,
  classicVolumes: classicVolumes.length,
  classicSections: classicSections.length,
  classicPrompts: classicPrompts.length,
}, null, 2));
