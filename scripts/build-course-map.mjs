import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(scriptDir, "../../tmp/pdfs/ogden-850-canonical.json");
const outputPath = path.resolve(scriptDir, "../public/data/course.json");

const lesson = (titleZh, goal, pronunciationFocus, sentenceFrame, words) => ({
  titleZh,
  goal,
  pronunciationFocus,
  sentenceFrame,
  lemmas: words.trim().split(/\s+/),
});

const unit = (titleZh, goal, lessons) => ({ titleZh, goal, lessons });

// The sequence is deliberately curated by communicative theme, not copied from
// Ogden's columns or alphabetized. Lemmas are resolved to their canonical IDs
// below so source spelling, category, and identity remain authoritative.
const blueprint = [
  unit("开口：我、你与身边的东西", "先用最小句子指认自己、他人和随身物品。", [
    lesson("你好，我是……", "会介绍自己并指认一个人。", "/iː/ 与 /ɪ/：拉长和短促", "I am ___. This is a ___.", "i you be this that yes name person boy girl"),
    lesson("一本书、一些东西", "会用冠词和数量词说出拥有的物品。", "/æ/ 与 /e/：张口大小", "I have a ___. I have some ___.", "a the have some any no book pen pencil bag"),
    lesson("看见并说出来", "会看、说并礼貌提出简单请求。", "/s/ 与 /z/：清浊摩擦", "He sees ___. Please say ___.", "he who see say do please eye face hand head"),
    lesson("来、去、拿、给", "会用六个核心动词表达身边动作。", "/k/ 与 /g/：后舌爆破", "Come to the ___. Give me the ___.", "come go get give take make house door road town"),
    lesson("把东西放好", "会表达放置、保留、允许和将要做的事。", "/p/ 与 /b/：送气和浊音", "Put the ___ here. I will ___.", "put keep let send will may cup water food bread"),
  ]),
  unit("看见空间：这里到那里", "借助真实物品理解位置、方向和时间关系。", [
    lesson("桌上、盒里、墙边", "会说物品在什么位置。", "/t/ 与 /d/：舌尖爆破", "The ___ is in/on/under the ___.", "at in on under over by table box floor wall"),
    lesson("从学校到家", "会表达起点、终点、陪同和用途。", "/f/ 与 /v/：唇齿摩擦", "I go from ___ to ___ with ___.", "from to with for of about school friend family work"),
    lesson("上、下、穿过", "会描述移动的路径。", "/θ/ 与 /ð/：舌尖轻触齿间", "Go through/across the ___.", "up down off out through across bridge river street train"),
    lesson("之前、之后、之间", "会按先后和相对位置组织信息。", "/b/ 与 /p/ 词尾辨听", "___ comes before/after ___.", "before after between among against till day night morning hour"),
    lesson("这里、那里与方向", "会用近远和方位词找地点。", "/h/：自然呼气起音", "The ___ is near/far from here.", "here there near far north south map island sea land"),
  ]),
  unit("连接意思：时间、数量与提问", "把短词连成有时间、原因、比较和数量的完整意思。", [
    lesson("昨天、现在、明天", "会说事情发生的时间并询问什么时候。", "/n/ 与 /ŋ/：鼻音位置", "When? Now/then/tomorrow.", "now then yesterday tomorrow when again ever still week year"),
    lesson("因为、但是、如果", "会连接两个简单分句。", "/r/ 与 /l/：舌位对比", "___, but ___. ___ because ___.", "and but or because if though while so question answer"),
    lesson("怎么、哪里、为什么", "会提出三类基础问题并作比较。", "/w/ 与 /j/：滑音", "How/Where/Why is ___?", "how where why as than such other every example reason"),
    lesson("一点、很多、足够", "会表达大致数量和程度。", "/m/：双唇鼻音", "There is a little/much ___.", "little much all enough almost quite very only amount number"),
    lesson("不，但仍向前", "会否定、评价状态并说方向。", "句子重音：重读信息词", "It does not seem ___. Go forward ___.", "not even together well forward seem east west direction way"),
  ]),
  unit("认识身体：感受与健康", "从身体部位进入感官、健康和求医表达。", [
    lesson("四肢与关节", "会指出常见外部身体部位。", "/ɑː/ 与 /ʌ/：后元音开口", "This is my ___. My ___ is here.", "arm chest chin ear finger foot hair knee leg neck"),
    lesson("头部与身体内部", "会说重要器官和面部部位。", "/ɜː/ 与 /ə/：重读与弱读", "The ___ is in the body.", "baby bone brain heart lip mouth muscle nerve nose tooth"),
    lesson("身体、呼吸与感觉", "会描述触觉和身体基本状态。", "/θ/ 词首与词尾", "I feel it with my ___.", "skin stomach throat thumb toe tongue body blood breath sense"),
    lesson("症状与就医", "会说常见症状、疼痛和医院。", "/k/ 词尾：清晰收音", "I have a ___. My ___ hurts.", "hospital birth cough disease digestion hearing pain sneeze touch wound"),
    lesson("健康还是不舒服", "会用状态词说明清醒、疲劳和健康。", "多音节词重音", "I am awake/tired. I feel ___.", "sleep awake conscious healthy ill living medical tired dead physical"),
  ]),
  unit("走进家里：房间与日常用品", "在卧室、厨房和清洁场景中练习可执行指令。", [
    lesson("卧室与浴室", "会说房间中的家具和舒适感。", "/ʃ/ 与 /tʃ/：摩擦和塞擦", "The ___ is by the ___.", "bed bath basin curtain cushion drawer shelf window room comfort"),
    lesson("厨房里的十样东西", "会辨认并请求常用厨具。", "/ʊ/ 与 /uː/：圆唇长短", "Please give me the ___.", "bottle bucket fork kettle knife oven plate pot spoon tray"),
    lesson("门锁、灯和屋顶", "会说明家庭装置的位置和用途。", "/eɪ/：字母名中的双元音", "The ___ is for the ___.", "basket bell brush bulb drain frame key lock pump roof"),
    lesson("火、光、空气与清洁", "会描述家中环境并给出简单安全提醒。", "/aɪ/：滑向高前元音", "Keep the ___ clean. There is ___.", "sponge match air building cover dust fire heat light smoke"),
    lesson("开着还是关着", "会用成对性质词描述家庭状态。", "对比重音：clean, not dirty", "The ___ is open/shut and warm/cold.", "soap wash clean dirty open shut warm cold full hollow"),
  ]),
  unit("穿戴与外观：颜色、材料和形状", "学会说穿什么、由什么制成以及看起来怎样。", [
    lesson("从靴子到裤子", "会说十种基础衣物。", "/s/ 后的辅音连缀", "I have a ___ and a ___.", "boot coat collar dress shirt shoe skirt sock stocking trousers"),
    lesson("配件与随身物", "会说配件并描述它们放在哪里。", "/ŋ/：-ing 与单词词尾", "My ___ is in the pocket.", "button comb glove hat jewel pocket ring thread umbrella watch"),
    lesson("布料从哪里来", "会说常见材料与制成形式。", "/l/ 的清晰音与暗音", "It is made of ___.", "canvas cloth cotton iron leather linen silk wool design form"),
    lesson("看外观、做细节", "会描述大小、标记、装饰和做工。", "/ɔː/ 与 /ɒ/：圆唇开口", "Look at the colour/size of ___.", "colour fold look mark ornament polish size stitch part quality"),
    lesson("颜色与好看", "会用颜色和亮度描述物品。", "形容词重音与并列节奏", "It is bright ___ and ___.", "beautiful black blue brown bright green grey red white yellow"),
  ]),
  unit("吃饭与农场：食物从哪里来", "从动物、作物到餐桌，完成点餐和口味表达。", [
    lesson("农场里的动物", "会辨认农场和身边常见动物。", "/æ/：动物词中的短元音", "There is a ___ on the farm.", "farm cow goat horse pig sheep cat dog rat monkey"),
    lesson("水果、蛋与主食", "会辨认十种可见食物。", "/ɒ/ 与 /ɔː/：英式圆唇音", "I would like some ___.", "apple berry cake cheese egg fish fowl nut orange potato"),
    lesson("一顿饭的基本食材", "会说吃喝和一餐中的基本食物。", "/iː/ 与 /ɪ/ 复习", "We eat/drink ___ at the meal.", "produce butter drink oil fruit grain meal meat milk rice"),
    lesson("烹饪、味道与生长", "会说烹饪动作、味道和植物。", "/s/ 与 /z/ 词尾复数", "Cook the ___. It tastes ___.", "animal bite cook grass jelly plant salt soup sugar taste"),
    lesson("冷热、酸甜与干湿", "会用性质词说明食物口感和生长条件。", "并列词组的节奏", "The ___ is sweet/bitter and hot/cold.", "liquid wine acid bitter boiling dry fat fertile natural sweet"),
  ]),
  unit("观察自然：天地、天气与生命", "用可见景物连接天气、季节和生命变化。", [
    lesson("天空与天气", "会描述天空中的物体和基本天气。", "/aʊ/：cloud 的双元音", "There is ___ in the sky.", "cloud moon star sun sky weather wind rain snow thunder"),
    lesson("一棵植物的各部分", "会从根到枝描述植物。", "/iː/：tree, seed, leaf", "The ___ grows from the ___.", "branch garden leaf root seed stem tree flower growth wood"),
    lesson("小动物怎样生活", "会描述昆虫、鸟和小动物的身体。", "/b/ 与 /v/：bee 与 vee", "The ___ has a wing/tail.", "ant bee bird feather fly snake tail wing worm field"),
    lesson("大地、山与季节", "会描述土地、水汽、岩石和夏季。", "/aɪ/：ice 与 high", "There is ___ on the mountain.", "drop earth flame ice mist mountain sand shade stone summer"),
    lesson("高低、深浅与动静", "会用对比性质词描述自然。", "对比语调与词尾清晰度", "It is high/low, quiet/violent.", "winter deep high low wet young old quiet violent flat"),
  ]),
  unit("动手制作：工具、材料与形状", "认识形状、连接件、工具和基础制作动作。", [
    lesson("线、圆与方", "会辨认基础形状和构件。", "/eə/ 与 /ɑː/：square, arch", "Make a line/circle/square on the ___.", "angle arch ball band circle line square board brick stick"),
    lesson("切开并连接", "会说连接和固定小零件。", "/aɪ/：wire, line", "Join the ___ with a ___.", "blade chain cord hook knot nail needle pin screw wire"),
    lesson("手工具", "会辨认常见工具并说简单用途。", "辅音连缀：sp-, sk-, pl-", "Use the ___ to ___.", "hammer horn net pipe plough rod scissors spade whip whistle"),
    lesson("机器如何运动", "会描述抬、拉、推和机械部件。", "/br/ 与 /spr/ 辅音群", "Push/pull the ___. The ___ turns.", "brake spring wheel brass copper grip join lift pull push"),
    lesson("材料的硬、直与弯", "会比较金属和物体的物理状态。", "词尾 /t/ 与 /d/", "The metal is hard, bent and solid.", "crack metal steel tin bent cut hard sharp solid strong"),
  ]),
  unit("走进城镇：出行、地点与公共生活", "能问路、乘车、找公共地点并说明行程。", [
    lesson("从小船到车站", "会说交通工具、线路和票。", "/eɪ/：train, plane, station", "I go by ___. My ticket is for ___.", "boat cart carriage engine plane rail sail ship station ticket"),
    lesson("城镇里的公共地点", "会问公共地点在哪里。", "/ə/：多音节词的弱读", "Where is the ___? It is in the ___.", "church library office prison store place country harbour market porter"),
    lesson("公共信息与记录", "会辨认标志、证件和图像记录。", "/ɑː/：card, army", "Show me the ___.", "army camera card clock flag gun parcel picture receipt stamp"),
    lesson("旅途中的位置与视角", "会描述旅途、方向和座位位置。", "复合句中的信息重音", "My seat is at the front/back.", "back driving flight front guide journey middle position seat side"),
    lesson("安全、时间与左右", "会给出时间、方向和安全提醒。", "升降调：确认与提醒", "Turn left/right. Be ready and safe.", "top transport view early late left right safe waiting public"),
  ]),
  unit("家庭与关系：人与情感", "从家庭成员进入感受、关系、照顾和相互尊重。", [
    lesson("我的家人", "会介绍核心家庭成员并说性别。", "/ð/：mother, brother 的齿间音", "This is my mother/brother/sister.", "brother daughter father mother sister son man woman male female"),
    lesson("关心与支持", "会说关系、爱、帮助和责任。", "/ʌ/：love 与 support", "I care for ___. We help/support ___.", "relation love care help support respect kiss married kind responsible"),
    lesson("喜欢、害怕与希望", "会表达八种常见情绪和态度。", "情感词的句子重音", "I feel ___. I hope/desire ___.", "fear hate hope desire feeling pleasure regret surprise happy sad"),
    lesson("表情与内心", "会通过行为、笑哭和信念描述一个人。", "/h/：hate, hope, harmony", "The person laughs/cries because ___.", "behaviour belief cry disgust harmony humour laugh shame smile self"),
    lesson("相处中的边界", "会说依赖、平等、好坏和私人边界。", "对比语调：good or bad", "Be kind, not cruel. This is private.", "sex trouble angry dependent equal good like private bad cruel"),
  ]),
  unit("每日生活：动作、休息与娱乐", "用动作链描述一天中开始、进行、意外和结束。", [
    lesson("开始移动", "会按顺序说开始、走、跑和转向。", "/kw/：quick 的辅音群", "Start here, then move/turn/walk ___.", "act attempt start step move motion turn walk run quick"),
    lesson("跳、踢、滚、游", "会描述九种身体动作并说明能力。", "动词词尾清晰收音", "I am able to jump/swim ___.", "jump kick roll rub shake stretch swim blow fall able"),
    lesson("意外发生了", "会描述破损、摔滑和突然停止。", "/br/：broken, burst", "The stop is sudden. The ___ is broken.", "burn burst crush fight slip smash stop broken sudden ready"),
    lesson("玩耍、休息和时间", "会说娱乐、声音、节奏和时间单位。", "列举时的节奏与停顿", "We play/rest for a minute.", "amusement play rest rhythm sound noise trick event minute month"),
    lesson("动作的状态", "会说明动作是否完整、规律、松紧和快慢。", "句尾降调：陈述完成", "It is complete, but a little slow.", "bit twist free frequent hanging regular slow loose tight complete"),
  ]),
  unit("学习与表达：语言、阅读与艺术", "把听说读写、记忆、故事和艺术连成学习闭环。", [
    lesson("课堂与语言", "会说课堂行为和学习目标。", "/dʒ/：education, language", "Pay attention. Learn the word ___.", "attention chalk education learning teaching knowledge language word clear important"),
    lesson("读与写", "会说阅读、书写和页面记录。", "/r/：read, write 的起音", "Read the page and write a note.", "letter list note page paper print reading writing simple common"),
    lesson("事实、历史与故事", "会区分事实记录、历史和虚构故事。", "/f/：fact, fiction, false", "The record is true/false. The story is ___.", "fiction history prose story verse news record discovery true false"),
    lesson("画画、音乐与声音", "会说八种艺术表达媒介。", "/ɔɪ/ 与 /aɪ/：voice, write", "Make a special picture/song with ___.", "art ink instrument music paint song voice copy special strange"),
    lesson("想法与记忆", "会表达经验、想法、记忆和判断。", "意群：先想，再说", "I think/talk about ___.", "experience idea memory mind talk thought new normal wise foolish"),
  ]),
  unit("工作与交易：金钱、市场与组织", "理解交易、企业、组织流程和不确定结果。", [
    lesson("钱、价格与价值", "会说账户、借贷、付款和价格。", "/aɪ/：price 与 /ɔɪ/：coin 类比", "The price/payment is ___.", "account credit debt money payment price profit value cheap dear"),
    lesson("公司里的人", "会说企业中的人、会议和委员会。", "/ɜː/：work 词族的核心音", "The manager/owner meets the committee.", "business company industry manager owner secretary meeting committee chief poor"),
    lesson("广告、竞争与协议", "会描述提出交易、达成协议和可能结果。", "多音节词主重音", "The offer is possible/probable.", "advertisement competition exchange offer trade agreement approval reward possible probable"),
    lesson("组织如何运转", "会按顺序说组织、分配、增长和流程。", "/ʃ/：operation, organization", "First, the organization starts the process.", "operation order organization distribution increase development expansion process first last"),
    lesson("专业、财产与差异", "会说专业服务、保险、财产和限制。", "对比重音：same or different", "The two things are the same/different.", "expert insurance interest property limit machine certain second different same"),
  ]),
  unit("规则与社会：法律、政府与冲突", "理解公共规则、决策、风险以及战争与和平。", [
    lesson("政府与规则", "会说国家、政府、法律和代表。", "/ɡ/：government, general", "The government makes a law/rule.", "government nation society authority representative tax law rule political general"),
    lesson("讨论与决定", "会提出请求、参与讨论并说明决定。", "/ʒ/ 与 /ʃ/：decision, discussion", "The group discusses the request and makes a decision.", "group discussion argument decision request statement sign control necessary serious"),
    lesson("犯罪、危险与后果", "会说危险、损害、惩罚和损失。", "/dʒ/：judge, danger", "The crime causes damage/loss.", "crime judge punishment servant poison danger damage loss wrong dark"),
    lesson("战争与和平", "会描述攻击、力量、抗议以及和平。", "/p/ 与 /f/：peace, force", "The protest is against war and for peace.", "attack destruction force power lead protest war peace military great"),
    lesson("历史、信仰与未来", "会把过去、现在、未来与社会状态连接起来。", "时间对比中的重音", "In the past/present/future, ___.", "death religion condition shock past present future secret feeble loud"),
  ]),
  unit("思考与判断：事实、原因与测量", "用比较、证据、测量和分类做出清楚判断。", [
    lesson("数与量", "会说加法、单位、重量和测量尺度。", "/ʒ/：measure 的中间音", "Measure the mass/weight in this unit.", "addition balance degree level mass measure rate scale unit weight"),
    lesson("范围与形状", "会描述底边、距离、边缘、长宽和高低。", "/aʊ/：round 与 /aɪ/：wide", "The distance is long/short; the range is wide/narrow.", "base distance edge point range long round tall wide narrow"),
    lesson("比较与分类", "会按类别比较、分开和选择。", "形容词对比重音", "Compare, divide, sort and select the things.", "comparison division selection sort thing separate opposite small short thin"),
    lesson("原因、结果与证据", "会用观察和测试检查一个说法。", "/ɔː/：cause 与 /æ/：fact", "The test/observation shows the cause and effect.", "cause effect fact observation test doubt error chance straight rough"),
    lesson("观点与目的", "会说明调整、细节、观点、目的和趋势。", "长句意群与停顿", "In my opinion, the purpose is ___.", "adjustment attraction detail end opinion purpose tendency connection smooth thick"),
  ]),
  unit("变化与系统：科学、材料与未来", "用科学语言描述材料、能量、系统和随时间发生的变化。", [
    lesson("身边的材料", "会辨认八种材料并说物质与化学性质。", "/k/：coal, cork, chemical", "The material/substance is made of ___.", "coal cork glass gold silver wax powder substance material chemical"),
    lesson("电流、光线与波", "会描述曲线、斜坡、蒸汽和波的运动。", "/eɪ/：wave, ray, space", "The electric current/wave moves in a curve.", "current curve hole ray slope steam wave space electric parallel"),
    lesson("装置、发明与理论", "会把装置、反应、用途与科学理论连接起来。", "多音节科学词重音", "The automatic apparatus has a use in science.", "apparatus invention science theory reaction impulse vessel use automatic complex"),
    lesson("系统怎样变化", "会按时间和阶段描述结构、系统与变化。", "/tʃ/：change, structure", "The system changes with time at each stage.", "change existence stage structure suggestion system time fixed elastic mixed"),
    lesson("观察细小差异", "会说材料、环境和生命中的细微性质与需求。", "词尾辅音群：-st, -ft", "The soft/delicate thing is sticky, but we need ___.", "insect mine need paste smell waste sticky stiff delicate soft"),
  ]),
];

const canonical = JSON.parse(await readFile(sourcePath, "utf8"));
const entries = canonical.entries;
const byLemma = new Map(entries.map((entry) => [entry.lemma, entry]));

const flattened = blueprint.flatMap((item) => item.lessons.flatMap((itemLesson) => itemLesson.lemmas));
const unknown = flattened.filter((lemma) => !byLemma.has(lemma));
const seen = new Set();
const duplicates = flattened.filter((lemma) => seen.has(lemma) || !seen.add(lemma));
const unused = entries.filter((entry) => !seen.has(entry.lemma));

if (blueprint.length !== 17 || blueprint.some((item) => item.lessons.length !== 5)) {
  console.error(`Draft status: ${blueprint.length}/17 units; ${blueprint.reduce((sum, item) => sum + item.lessons.length, 0)}/85 lessons.`);
  if (unknown.length) console.error(`Unknown lemmas: ${[...new Set(unknown)].join(" ")}`);
  if (duplicates.length) console.error(`Duplicate lemmas: ${[...new Set(duplicates)].join(" ")}`);
  console.error(`Unused canonical lemmas (${unused.length}):`);
  console.error(unused.map((entry) => entry.lemma).join(" "));
  process.exit(1);
}

const errors = [];
if (unknown.length) errors.push(`Unknown lemmas: ${[...new Set(unknown)].join(", ")}`);
if (duplicates.length) errors.push(`Duplicate lemmas: ${[...new Set(duplicates)].join(", ")}`);
if (flattened.length !== 850) errors.push(`Expected 850 placements; received ${flattened.length}`);
if (seen.size !== 850) errors.push(`Expected 850 unique lemmas; received ${seen.size}`);
if (unused.length) errors.push(`Unused canonical lemmas: ${unused.map((entry) => entry.lemma).join(", ")}`);

blueprint.forEach((item, unitIndex) => {
  item.lessons.forEach((itemLesson, lessonIndex) => {
    if (itemLesson.lemmas.length !== 10) {
      errors.push(`unit-${String(unitIndex + 1).padStart(2, "0")} lesson ${lessonIndex + 1} has ${itemLesson.lemmas.length} words`);
    }
  });
});

if (errors.length) {
  throw new Error(`Course map validation failed:\n- ${errors.join("\n- ")}`);
}

const units = blueprint.map((item, unitIndex) => ({
  id: `unit-${String(unitIndex + 1).padStart(2, "0")}`,
  order: unitIndex + 1,
  titleZh: item.titleZh,
  goal: item.goal,
  lessons: item.lessons.map((itemLesson, lessonIndex) => {
    const globalOrder = unitIndex * 5 + lessonIndex + 1;
    return {
      id: `lesson-${String(unitIndex + 1).padStart(2, "0")}-${String(lessonIndex + 1).padStart(2, "0")}`,
      order: lessonIndex + 1,
      globalOrder,
      titleZh: itemLesson.titleZh,
      goal: itemLesson.goal,
      pronunciationFocus: itemLesson.pronunciationFocus,
      sentenceFrame: itemLesson.sentenceFrame,
      wordIds: itemLesson.lemmas.map((lemma) => byLemma.get(lemma).id),
    };
  }),
}));

const course = {
  meta: {
    titleZh: "Basic English 850 零基础课程地图",
    version: "1.0.0",
    source: canonical.meta.title,
    sequencing: "17 个主题单元；先操作词与可见事物，后关系、判断与抽象概念；非字母序、非原表列序。",
    unitCount: 17,
    lessonCount: 85,
    wordsPerLesson: 10,
    totalWordIds: 850,
  },
  units,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(course, null, 2)}\n`, "utf8");

const categoryCounts = Object.fromEntries(
  canonical.categories.map((category) => [
    category.id,
    flattened.filter((lemma) => byLemma.get(lemma).category_id === category.id).length,
  ]),
);

console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
console.log(JSON.stringify({ units: units.length, lessons: units.flatMap((item) => item.lessons).length, placements: flattened.length, unique: seen.size, categoryCounts }, null, 2));
