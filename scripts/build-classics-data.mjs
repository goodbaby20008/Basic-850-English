import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { addDict, customPinyin, pinyin } from "pinyin-pro";

// The package's CommonJS build is used intentionally: @pinyin-pro/data 1.3.1
// currently publishes a malformed complete.mjs while complete.js is valid.
const require = createRequire(import.meta.url);
const CompleteDict = require("@pinyin-pro/data/complete");

const sourceUrl = new URL("../content/classics-source.json", import.meta.url);
const outputUrl = new URL("../public/data/classics.json", import.meta.url);
const auditUrl = new URL("../work/classics-pinyin-audit.json", import.meta.url);

const VOLUME_PATTERN = /^第([一二三四五六七八九十]+)卷\s*(.+)$/;
const SECTION_PATTERN = /^([一二三四五六七八九十百]+)、\s*(.+)$/;
const TERMINAL_PATTERN = /[。！？]$/;
const HAN_PATTERN = /\p{Script=Han}/u;

// These readings are contextual decisions for the classical passages, not
// generic character defaults. Keep phrases long enough to avoid changing an
// unrelated occurrence of the same polyphonic character.
const CLASSICAL_PINYIN_OVERRIDES = {
  "不亦说乎": "bù yì yuè hū",
  "吾日三省吾身": "wú rì sān xǐng wú shēn",
  "见不贤而自省": "jiàn bù xián ér zì xǐng",
  "知者不惑": "zhì zhě bù huò",
  "敏而好学": "mǐn ér hào xué",
  "知之好之": "zhī zhī hào zhī",
  "好之者不如乐之者": "hào zhī zhě bù rú lè zhī zhě",
  "知足常乐": "zhī zú cháng lè",
  "安贫乐道": "ān pín lè dào",
  "乐善好施": "lè shàn hào shī",
  "乐而学之": "lè ér xué zhī",
  "否极泰来": "pǐ jí tài lái",
  "处众人之所恶": "chǔ zhòng rén zhī suǒ wù",
  "舍生取义": "shě shēng qǔ yì",
  "浩然之气": "hào rán zhī qì",
  "反躬自省": "fǎn gōng zì xǐng",
  "省察克治": "xǐng chá kè zhì",
  "三人行": "sān rén xíng",
  "知行合一": "zhī xíng hé yī",
  "力行近仁": "lì xíng jìn rén",
  "笃行致远": "dǔ xíng zhì yuǎn",
  "行胜于言": "xíng shèng yú yán",
  "行成于思": "xíng chéng yú sī",
  "言顾行": "yán gù xíng",
  "行顾言": "xíng gù yán",
  "言行一致": "yán xíng yī zhì",
  "言必信": "yán bì xìn",
  "行必果": "xíng bì guǒ",
  "言忠信": "yán zhōng xìn",
  "行笃敬": "xíng dǔ jìng",
  "刚健有为": "gāng jiàn yǒu wéi",
  "有所为有所不为": "yǒu suǒ wéi yǒu suǒ bù wéi",
  "见义勇为": "jiàn yì yǒng wéi",
  "见义思为": "jiàn yì sī wéi",
  "无为而无不为": "wú wéi ér wú bù wéi",
  "为学日益": "wéi xué rì yì",
  "为道日损": "wéi dào rì sǔn",
  "天下为公": "tiān xià wéi gōng",
  "以和为贵": "yǐ hé wéi guì",
  "和为贵": "hé wéi guì",
  "天将降大任于是人也": "tiān jiāng jiàng dà rèn yú shì rén yě",
  "任重道远": "rèn zhòng dào yuǎn",
  "厚积薄发": "hòu jī bó fā",
  "静以修身": "jìng yǐ xiū shēn",
  "俭以养德": "jiǎn yǐ yǎng dé",
  "淡泊明志": "dàn bó míng zhì",
  "宁静致远": "níng jìng zhì yuǎn",
  "长幼有序": "zhǎng yòu yǒu xù",
  "教学相长": "jiào xué xiāng zhǎng",
  "相辅相成": "xiāng fǔ xiāng chéng",
  "发愤忘食": "fā fèn wàng shí",
  "乐以忘忧": "lè yǐ wàng yōu",
  "曲则全": "qū zé quán",
  "枉则直": "wǎng zé zhí",
  "洼则盈": "wā zé yíng",
  "敝则新": "bì zé xīn",
  "少则得": "shǎo zé dé",
  "多则惑": "duō zé huò",
  "为本": "wéi běn",
  "为先": "wéi xiān",
  "为功": "wéi gōng",
  "清静为天下正": "qīng jìng wéi tiān xià zhèng",
  "能为百谷王者": "néng wéi bǎi gǔ wáng zhě",
  "贱为本": "jiàn wéi běn",
  "下为基": "xià wéi jī",
  "为一体": "wéi yī tǐ",
  "万物为一": "wàn wù wéi yī",
  "人生有为": "rén shēng yǒu wéi",
  "求为可知": "qiú wéi kě zhī",
  "为高": "wéi gāo",
  "为能尽其性": "wéi néng jìn qí xìng",
  "胜为大胜": "shèng wéi dà shèng",
  "可以为师": "kě yǐ wéi shī",
  "可以为尧舜": "kě yǐ wéi yáo shùn",
  "民为贵": "mín wéi guì",
  "君为轻": "jūn wéi qīng",
  "责人薄": "zé rén bó",
  "薄发": "bó fā",
  "累土": "lěi tǔ",
  "其义自见": "qí yì zì xiàn",
  "不自见": "bù zì xiàn",
  "日有所长": "rì yǒu suǒ zhǎng",
  "尊师敬长": "zūn shī jìng zhǎng",
  "日省其身": "rì xǐng qí shēn",
  "见几而作": "jiàn jī ér zuò",
  "知几其神": "zhī jī qí shén",
  "故几于道": "gù jī yú dào",
  "天将降大任": "tiān jiāng jiàng dà rèn",
  "安时而处顺": "ān shí ér chǔ shùn",
  "哀乐不能入": "āi lè bù néng rù",
  "处逆境": "chǔ nì jìng",
  "处顺境": "chǔ shùn jìng",
  "不敢恶于人": "bù gǎn wù yú rén",
  "知之者不如好之者": "zhī zhī zhě bù rú hào zhī zhě",
  "好谋而成": "hào móu ér chéng",
  "强行者有志": "qiǎng xíng zhě yǒu zhì",
  "立身行道": "lì shēn xíng dào",
  "与人行": "yǔ rén xíng",
  "行有行规": "xíng yǒu xíng guī",
  "内外之分": "nèi wài zhī fèn",
  "塞于天地之间": "sè yú tiān dì zhī jiān",
  "父慈子孝": "fù cí zǐ xiào",
  "站得高": "zhàn de gāo",
  "看得远": "kàn de yuǎn",
  "皆中节": "jiē zhòng jié",
  "顺天应人": "shùn tiān yìng rén",
  "小知间间": "xiǎo zhī jiàn jiàn",
  "辰宿列张": "chén xiù liè zhāng",
  "众星共之": "zhòng xīng gǒng zhī",
  "与我为一": "yǔ wǒ wéi yī",
  "孝悌为仁之本": "xiào tì wéi rén zhī běn",
  "责重山岳": "zé zhòng shān yuè",
  "仁者爱人": "rén zhě ài rén",
  "爱人者": "ài rén zhě",
  "爱人之心": "ài rén zhī xīn",
  "吾十有五": "wú shí yòu wǔ",
  "是知也": "shì zhì yě",
  "夫唯": "fú wéi",
  "且夫": "qiě fú",
  "夫孝": "fú xiào",
  "夫君子": "fú jūn zǐ",
};

addDict(CompleteDict);
customPinyin(CLASSICAL_PINYIN_OVERRIDES, { multiple: "replace", polyphonic: "replace" });

function chineseNumberToInt(value) {
  const digits = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (value === "十") return 10;
  if (value.startsWith("十")) return 10 + (digits[value.at(-1)] ?? 0);
  if (value.endsWith("十")) return (digits[value[0]] ?? 0) * 10;
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (digits[tens] ?? 0) * 10 + (digits[ones] ?? 0);
  }
  return digits[value] ?? 0;
}

function asciiPinyin(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[üǖǘǚǜ]/g, "v")
    .toLowerCase();
}

function pinyinFor(text) {
  const records = pinyin(text, {
    type: "all",
    nonZh: "removed",
    segmentit: 2,
    toneSandhi: true,
  });
  const syllables = records.filter((item) => item.isZh).map((item) => item.result || item.pinyin);
  const candidates = records
    .filter((item) => item.isZh && item.polyphonic.length > 1)
    .map((item) => ({
      character: item.origin,
      selected: item.result || item.pinyin,
      readings: item.polyphonic,
    }));
  return {
    tone: syllables.join(" "),
    plain: syllables.map(asciiPinyin).join(" "),
    candidates,
  };
}

function parseSource(source) {
  const volumes = [];
  const promptDrafts = [];
  let volume = null;
  let section = null;
  let fragments = [];
  let sourceParagraphs = [];

  const ensureSection = () => {
    if (section) return section;
    if (!volume) throw new Error("Body text appeared before a volume heading");
    section = {
      id: `${volume.id}-general`,
      order: 1,
      title: "本卷经典",
      promptIds: [],
    };
    volume.sections.push(section);
    return section;
  };

  const flush = () => {
    if (!fragments.length) return;
    const activeSection = ensureSection();
    promptDrafts.push({
      volume,
      section: activeSection,
      text: fragments.join(""),
      sourceParagraphs: [...sourceParagraphs],
    });
    fragments = [];
    sourceParagraphs = [];
  };

  for (const paragraph of source.paragraphs) {
    if (paragraph.text === source.title) continue;
    if (/^主题[：:]/.test(paragraph.text)) continue;
    if (!HAN_PATTERN.test(paragraph.text)) continue;
    const volumeMatch = paragraph.text.match(VOLUME_PATTERN);
    if (volumeMatch) {
      flush();
      const order = chineseNumberToInt(volumeMatch[1]);
      volume = {
        id: `classic-volume-${String(order).padStart(2, "0")}`,
        order,
        title: paragraph.text,
        name: volumeMatch[2],
        sections: [],
      };
      volumes.push(volume);
      section = null;
      continue;
    }
    const sectionMatch = paragraph.text.match(SECTION_PATTERN);
    if (sectionMatch) {
      flush();
      if (!volume) throw new Error(`Section before volume at paragraph ${paragraph.index}`);
      const order = chineseNumberToInt(sectionMatch[1]);
      section = {
        id: `${volume.id}-section-${String(order).padStart(2, "0")}`,
        order,
        title: sectionMatch[2],
        promptIds: [],
      };
      volume.sections.push(section);
      continue;
    }
    if (!volume) continue;
    fragments.push(paragraph.text);
    sourceParagraphs.push(paragraph.index);
    if (TERMINAL_PATTERN.test(paragraph.text)) flush();
  }
  flush();
  return { volumes, promptDrafts };
}

const source = JSON.parse(await readFile(sourceUrl, "utf8"));
const { volumes, promptDrafts } = parseSource(source);
const auditEntries = [];
const prompts = promptDrafts.map((draft, index) => {
  const id = `classic-${String(index + 1).padStart(4, "0")}`;
  const converted = pinyinFor(draft.text);
  const overrideMatches = Object.keys(CLASSICAL_PINYIN_OVERRIDES).filter((phrase) => draft.text.includes(phrase));
  draft.section.promptIds.push(id);
  if (converted.candidates.length) {
    auditEntries.push({
      id,
      text: draft.text,
      pinyinTone: converted.tone,
      sourceParagraphs: draft.sourceParagraphs,
      overrideMatches,
      candidates: converted.candidates,
    });
  }
  return {
    id,
    order: index + 1,
    volumeId: draft.volume.id,
    volumeOrder: draft.volume.order,
    volumeTitle: draft.volume.title,
    sectionId: draft.section.id,
    sectionOrder: draft.section.order,
    sectionTitle: draft.section.title,
    text: draft.text,
    pinyinTone: converted.tone,
    pinyinPlain: converted.plain,
    sourceParagraphs: draft.sourceParagraphs,
    pinyinReview: overrideMatches.length ? "context-reviewed" : "dictionary-generated",
  };
});

const hanCount = prompts.reduce((sum, prompt) => sum + Array.from(prompt.text).filter((character) => HAN_PATTERN.test(character)).length, 0);
const output = {
  schemaVersion: 1,
  title: source.title,
  sourceFile: source.sourceFile,
  pinyinMethod: "pinyin-pro complete dictionary, contextual phrase overrides, and polyphonic audit",
  inputConvention: "Tone marks are displayed; typing uses lowercase ASCII and v for ü.",
  stats: {
    volumes: volumes.length,
    sections: volumes.reduce((sum, item) => sum + item.sections.length, 0),
    prompts: prompts.length,
    hanCharacters: hanCount,
    contextualOverrides: Object.keys(CLASSICAL_PINYIN_OVERRIDES).length,
    promptsWithPolyphonicCandidates: auditEntries.length,
  },
  volumes,
  prompts,
};

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await mkdir(new URL("../work/", import.meta.url), { recursive: true });
await writeFile(outputUrl, `${JSON.stringify(output, null, 2)}\n`, "utf8");
await writeFile(auditUrl, `${JSON.stringify({ generatedFrom: source.sourceFile, entries: auditEntries }, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ ok: true, output: outputUrl.pathname, audit: auditUrl.pathname, ...output.stats }, null, 2));
