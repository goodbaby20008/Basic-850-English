/**
 * 零基础发音课程数据（英国英语为主）。
 *
 * 这里把语言学上常见的 44 个英语音位与中国英语教材常列的
 * /ts dz tr dr/ 四组辅音连缀分开建模，避免把教学口径误写成语言学定论。
 */

export type PhonemeKind =
  | "monophthong"
  | "diphthong"
  | "consonant"
  | "cluster";

export type Voicing = "voiced" | "voiceless" | "mixed";

export interface PhonemeExample {
  word: string;
  ipaUk: string;
  meaningZh: string;
  noteZh: string;
}

export interface Phoneme {
  id: string;
  symbol: string;
  kind: PhonemeKind;
  family: string;
  nameZh: string;
  mouthTip: string;
  voiceTip: string;
  voicing: Voicing;
  examples: readonly PhonemeExample[];
  noteZh?: string;
}

type RawPhoneme = Omit<Phoneme, "examples"> & {
  examples: readonly Omit<PhonemeExample, "noteZh">[];
};

const rawPhonemes = [
  {
    id: "i-long",
    symbol: "/iː/",
    kind: "monophthong",
    family: "长元音",
    nameZh: "长前元音",
    mouthTip: "嘴角向两侧微展，舌尖靠近下齿，舌前部抬高；保持口形，音要拉足。",
    voiceTip: "声带持续振动。不要在结尾滑成汉语“衣—呀”。",
    voicing: "voiced",
    examples: [
      { word: "see", ipaUk: "/siː/", meaningZh: "看见" },
      { word: "green", ipaUk: "/ɡriːn/", meaningZh: "绿色的" },
    ],
  },
  {
    id: "i-short",
    symbol: "/ɪ/",
    kind: "monophthong",
    family: "短元音",
    nameZh: "短前元音",
    mouthTip: "嘴唇放松，舌前部略抬；比 /iː/ 更松、更低、更短。",
    voiceTip: "声带振动，快速收住；不要读成完整的汉语“衣”。",
    voicing: "voiced",
    examples: [
      { word: "ship", ipaUk: "/ʃɪp/", meaningZh: "船" },
      { word: "milk", ipaUk: "/mɪlk/", meaningZh: "牛奶" },
    ],
  },
  {
    id: "e",
    symbol: "/e/",
    kind: "monophthong",
    family: "短元音",
    nameZh: "短前元音",
    mouthTip: "嘴自然张开，舌前部抬到中等高度；比 /æ/ 的开口小。",
    voiceTip: "声带振动，音短而稳；不要滑向“诶”。",
    voicing: "voiced",
    examples: [
      { word: "bed", ipaUk: "/bed/", meaningZh: "床" },
      { word: "red", ipaUk: "/red/", meaningZh: "红色的" },
    ],
  },
  {
    id: "ae",
    symbol: "/æ/",
    kind: "monophthong",
    family: "短元音",
    nameZh: "大开口前元音",
    mouthTip: "下巴明显放低，嘴角略向两侧，舌位低而靠前。",
    voiceTip: "声带振动；保持单一音色，不要读成“啊—诶”两个音。",
    voicing: "voiced",
    examples: [
      { word: "hand", ipaUk: "/hænd/", meaningZh: "手" },
      { word: "black", ipaUk: "/blæk/", meaningZh: "黑色的" },
    ],
  },
  {
    id: "uh",
    symbol: "/ʌ/",
    kind: "monophthong",
    family: "短元音",
    nameZh: "短中元音",
    mouthTip: "嘴自然张开，舌头放低并居中，嘴唇不圆。",
    voiceTip: "声带振动，短促有力；不是拖长的汉语“啊”。",
    voicing: "voiced",
    examples: [
      { word: "sun", ipaUk: "/sʌn/", meaningZh: "太阳" },
      { word: "cup", ipaUk: "/kʌp/", meaningZh: "杯子" },
    ],
  },
  {
    id: "a-long",
    symbol: "/ɑː/",
    kind: "monophthong",
    family: "长元音",
    nameZh: "长后元音",
    mouthTip: "嘴张大，舌位低且稍靠后，嘴唇放松；稳定拉长。",
    voiceTip: "声带持续振动；英式口音中不要在末尾卷舌。",
    voicing: "voiced",
    examples: [
      { word: "arm", ipaUk: "/ɑːm/", meaningZh: "手臂" },
      { word: "dark", ipaUk: "/dɑːk/", meaningZh: "黑暗的" },
    ],
  },
  {
    id: "o-short",
    symbol: "/ɒ/",
    kind: "monophthong",
    family: "短元音",
    nameZh: "短后元音",
    mouthTip: "下巴放低，舌后部较低，双唇轻轻收圆。",
    voiceTip: "声带振动，音很短；不要读成长音 /ɔː/。",
    voicing: "voiced",
    examples: [
      { word: "dog", ipaUk: "/dɒɡ/", meaningZh: "狗" },
      { word: "box", ipaUk: "/bɒks/", meaningZh: "盒子" },
    ],
  },
  {
    id: "aw-long",
    symbol: "/ɔː/",
    kind: "monophthong",
    family: "长元音",
    nameZh: "长后圆唇元音",
    mouthTip: "舌后部抬到中等高度，双唇收圆，口形保持不变。",
    voiceTip: "声带持续振动；英式口音中词尾字母 r 通常不单独发音。",
    voicing: "voiced",
    examples: [
      { word: "door", ipaUk: "/dɔː/", meaningZh: "门" },
      { word: "water", ipaUk: "/ˈwɔːtə/", meaningZh: "水" },
    ],
  },
  {
    id: "u-short",
    symbol: "/ʊ/",
    kind: "monophthong",
    family: "短元音",
    nameZh: "短后圆唇元音",
    mouthTip: "双唇轻圆但不前突，舌后部略抬；肌肉保持放松。",
    voiceTip: "声带振动，快速收住；不要拉成长 /uː/。",
    voicing: "voiced",
    examples: [
      { word: "foot", ipaUk: "/fʊt/", meaningZh: "脚" },
      { word: "book", ipaUk: "/bʊk/", meaningZh: "书" },
    ],
  },
  {
    id: "u-long",
    symbol: "/uː/",
    kind: "monophthong",
    family: "长元音",
    nameZh: "长后圆唇元音",
    mouthTip: "舌后部抬高，双唇收圆并略向前，音长而稳定。",
    voiceTip: "声带持续振动；不要在前面额外加汉语声母 w。",
    voicing: "voiced",
    examples: [
      { word: "food", ipaUk: "/fuːd/", meaningZh: "食物" },
      { word: "blue", ipaUk: "/bluː/", meaningZh: "蓝色的" },
    ],
  },
  {
    id: "er-long",
    symbol: "/ɜː/",
    kind: "monophthong",
    family: "长元音",
    nameZh: "长中元音",
    mouthTip: "舌头居中，嘴唇自然，口形几乎不动；把音稳定拉长。",
    voiceTip: "声带持续振动；英式发音不卷舌，不要读成汉语“儿”。",
    voicing: "voiced",
    examples: [
      { word: "word", ipaUk: "/wɜːd/", meaningZh: "词；话" },
      { word: "work", ipaUk: "/wɜːk/", meaningZh: "工作" },
    ],
  },
  {
    id: "schwa",
    symbol: "/ə/",
    kind: "monophthong",
    family: "弱读元音",
    nameZh: "中央弱元音",
    mouthTip: "口腔完全放松，舌头居中；只在非重读位置轻轻带过。",
    voiceTip: "声带振动，通常是英语里最轻、最短的元音。",
    voicing: "voiced",
    examples: [
      { word: "about", ipaUk: "/əˈbaʊt/", meaningZh: "关于" },
      { word: "mother", ipaUk: "/ˈmʌðə/", meaningZh: "母亲" },
    ],
  },
  {
    id: "ei",
    symbol: "/eɪ/",
    kind: "diphthong",
    family: "双元音",
    nameZh: "合口双元音",
    mouthTip: "从 /e/ 平滑滑向较松的 /ɪ/，下巴略收，嘴角稍展开。",
    voiceTip: "声带全程振动；重心在第一个音，不要拆成两拍。",
    voicing: "voiced",
    examples: [
      { word: "day", ipaUk: "/deɪ/", meaningZh: "一天" },
      { word: "name", ipaUk: "/neɪm/", meaningZh: "名字" },
    ],
  },
  {
    id: "ai",
    symbol: "/aɪ/",
    kind: "diphthong",
    family: "双元音",
    nameZh: "合口双元音",
    mouthTip: "从大开口的低元音滑向 /ɪ/，下巴明显向上收。",
    voiceTip: "声带全程振动；开头饱满，结尾轻而短。",
    voicing: "voiced",
    examples: [
      { word: "time", ipaUk: "/taɪm/", meaningZh: "时间" },
      { word: "white", ipaUk: "/waɪt/", meaningZh: "白色的" },
    ],
  },
  {
    id: "oi",
    symbol: "/ɔɪ/",
    kind: "diphthong",
    family: "双元音",
    nameZh: "合口双元音",
    mouthTip: "从圆唇的 /ɔ/ 滑向 /ɪ/，双唇由圆变展。",
    voiceTip: "声带全程振动，保持一次连续滑动。",
    voicing: "voiced",
    examples: [
      { word: "boy", ipaUk: "/bɔɪ/", meaningZh: "男孩" },
      { word: "oil", ipaUk: "/ɔɪl/", meaningZh: "油" },
    ],
  },
  {
    id: "ou",
    symbol: "/əʊ/",
    kind: "diphthong",
    family: "双元音",
    nameZh: "合口双元音",
    mouthTip: "从放松的中央位置滑向 /ʊ/，双唇逐渐收圆。",
    voiceTip: "声带全程振动；英式起点较中央，不等于汉语“欧”。",
    voicing: "voiced",
    examples: [
      { word: "go", ipaUk: "/ɡəʊ/", meaningZh: "去" },
      { word: "road", ipaUk: "/rəʊd/", meaningZh: "道路" },
    ],
  },
  {
    id: "au",
    symbol: "/aʊ/",
    kind: "diphthong",
    family: "双元音",
    nameZh: "合口双元音",
    mouthTip: "从大开口的低元音滑向 /ʊ/，双唇最后轻轻收圆。",
    voiceTip: "声带全程振动；先开后收，一拍完成。",
    voicing: "voiced",
    examples: [
      { word: "house", ipaUk: "/haʊs/", meaningZh: "房子" },
      { word: "down", ipaUk: "/daʊn/", meaningZh: "向下" },
    ],
  },
  {
    id: "ear",
    symbol: "/ɪə/",
    kind: "diphthong",
    family: "集中双元音",
    nameZh: "向中央滑动的双元音",
    mouthTip: "从短 /ɪ/ 滑向放松的 /ə/，嘴唇自然，动作要小。",
    voiceTip: "声带全程振动；英式示范中不要另加卷舌音。",
    voicing: "voiced",
    examples: [
      { word: "ear", ipaUk: "/ɪə/", meaningZh: "耳朵" },
      { word: "near", ipaUk: "/nɪə/", meaningZh: "近的" },
    ],
  },
  {
    id: "air",
    symbol: "/eə/",
    kind: "diphthong",
    family: "集中双元音",
    nameZh: "向中央滑动的双元音",
    mouthTip: "从 /e/ 附近滑向 /ə/，下巴略收，嘴唇保持自然。",
    voiceTip: "声带全程振动；英式示范不在词尾补卷舌音。",
    voicing: "voiced",
    examples: [
      { word: "air", ipaUk: "/eə/", meaningZh: "空气" },
      { word: "care", ipaUk: "/keə/", meaningZh: "关心；照料" },
    ],
  },
  {
    id: "ure",
    symbol: "/ʊə/",
    kind: "diphthong",
    family: "集中双元音",
    nameZh: "传统英式集中双元音",
    mouthTip: "从轻圆唇的 /ʊ/ 滑向 /ə/，嘴唇逐渐放松。",
    voiceTip: "声带全程振动；先听示范，再模仿，不靠汉字注音。",
    voicing: "voiced",
    examples: [
      { word: "poor", ipaUk: "/pʊə/", meaningZh: "贫穷的" },
      { word: "tour", ipaUk: "/tʊə/", meaningZh: "游览" },
    ],
    noteZh:
      "这是传统学习词典常列的音项；许多现代英国说话者会把 poor 等词读成 /ɔː/ 一类的音。能稳定辨听即可，不必强求所有口音一致。",
  },
  {
    id: "p",
    symbol: "/p/",
    kind: "consonant",
    family: "爆破音",
    nameZh: "清双唇爆破音",
    mouthTip: "双唇闭住气流后突然放开；词首重读位置通常能感到一小股送气。",
    voiceTip: "清辅音，喉咙不振动；结尾不要补“呃”。",
    voicing: "voiceless",
    examples: [
      { word: "pen", ipaUk: "/pen/", meaningZh: "钢笔" },
      { word: "map", ipaUk: "/mæp/", meaningZh: "地图" },
    ],
  },
  {
    id: "b",
    symbol: "/b/",
    kind: "consonant",
    family: "爆破音",
    nameZh: "浊双唇爆破音",
    mouthTip: "双唇闭住再放开，动作与 /p/ 相同，但送气较弱。",
    voiceTip: "浊辅音，喉咙有振动；不要读成“波”。",
    voicing: "voiced",
    examples: [
      { word: "bed", ipaUk: "/bed/", meaningZh: "床" },
      { word: "book", ipaUk: "/bʊk/", meaningZh: "书" },
    ],
  },
  {
    id: "t",
    symbol: "/t/",
    kind: "consonant",
    family: "爆破音",
    nameZh: "清齿龈爆破音",
    mouthTip: "舌尖抵上齿龈，堵住气流后迅速放开；不要把舌尖放在牙齿之间。",
    voiceTip: "清辅音，喉咙不振动；不要补成“特”。",
    voicing: "voiceless",
    examples: [
      { word: "tea", ipaUk: "/tiː/", meaningZh: "茶" },
      { word: "time", ipaUk: "/taɪm/", meaningZh: "时间" },
    ],
  },
  {
    id: "d",
    symbol: "/d/",
    kind: "consonant",
    family: "爆破音",
    nameZh: "浊齿龈爆破音",
    mouthTip: "舌尖抵上齿龈再放开，口形与 /t/ 相同。",
    voiceTip: "浊辅音，喉咙有振动；不要读成“德”。",
    voicing: "voiced",
    examples: [
      { word: "day", ipaUk: "/deɪ/", meaningZh: "一天" },
      { word: "door", ipaUk: "/dɔː/", meaningZh: "门" },
    ],
  },
  {
    id: "k",
    symbol: "/k/",
    kind: "consonant",
    family: "爆破音",
    nameZh: "清软腭爆破音",
    mouthTip: "舌后部抵住软腭，蓄气后放开；嘴唇不必用力。",
    voiceTip: "清辅音，喉咙不振动；结尾不要补“呃”。",
    voicing: "voiceless",
    examples: [
      { word: "key", ipaUk: "/kiː/", meaningZh: "钥匙" },
      { word: "back", ipaUk: "/bæk/", meaningZh: "背部；后面" },
    ],
  },
  {
    id: "g",
    symbol: "/ɡ/",
    kind: "consonant",
    family: "爆破音",
    nameZh: "浊软腭爆破音",
    mouthTip: "舌后部抵住软腭再放开，口形与 /k/ 相同。",
    voiceTip: "浊辅音，喉咙有振动；不要读成“哥”。",
    voicing: "voiced",
    examples: [
      { word: "go", ipaUk: "/ɡəʊ/", meaningZh: "去" },
      { word: "bag", ipaUk: "/bæɡ/", meaningZh: "袋子" },
    ],
  },
  {
    id: "f",
    symbol: "/f/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "清唇齿摩擦音",
    mouthTip: "上齿轻触下唇内侧，让气流从缝隙持续摩擦出去。",
    voiceTip: "清辅音，只有气流声，喉咙不振动。",
    voicing: "voiceless",
    examples: [
      { word: "fire", ipaUk: "/faɪə/", meaningZh: "火" },
      { word: "foot", ipaUk: "/fʊt/", meaningZh: "脚" },
    ],
  },
  {
    id: "v",
    symbol: "/v/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "浊唇齿摩擦音",
    mouthTip: "上齿轻触下唇，保持摩擦；不要把双唇收成 /w/。",
    voiceTip: "浊辅音，气流摩擦时喉咙持续振动。",
    voicing: "voiced",
    examples: [
      { word: "very", ipaUk: "/ˈveri/", meaningZh: "非常" },
      { word: "voice", ipaUk: "/vɔɪs/", meaningZh: "声音" },
    ],
  },
  {
    id: "theta",
    symbol: "/θ/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "清齿间摩擦音",
    mouthTip: "舌尖轻放在上下齿之间，让气流沿舌面吹出；不要咬紧舌头。",
    voiceTip: "清辅音，喉咙不振动；不能用 /s/ 或 /f/ 代替。",
    voicing: "voiceless",
    examples: [
      { word: "thing", ipaUk: "/θɪŋ/", meaningZh: "事物" },
      { word: "mouth", ipaUk: "/maʊθ/", meaningZh: "嘴" },
    ],
  },
  {
    id: "eth",
    symbol: "/ð/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "浊齿间摩擦音",
    mouthTip: "舌尖轻放在上下齿之间，保持细小缝隙和摩擦。",
    voiceTip: "浊辅音，喉咙振动；不能直接读成 /z/ 或汉语“的”。",
    voicing: "voiced",
    examples: [
      { word: "this", ipaUk: "/ðɪs/", meaningZh: "这个" },
      { word: "mother", ipaUk: "/ˈmʌðə/", meaningZh: "母亲" },
    ],
  },
  {
    id: "s",
    symbol: "/s/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "清齿龈摩擦音",
    mouthTip: "舌尖靠近上齿龈但不接触，让气流从舌中央的窄缝通过。",
    voiceTip: "清辅音，像细长的气流声，喉咙不振动。",
    voicing: "voiceless",
    examples: [
      { word: "sun", ipaUk: "/sʌn/", meaningZh: "太阳" },
      { word: "face", ipaUk: "/feɪs/", meaningZh: "脸" },
    ],
  },
  {
    id: "z",
    symbol: "/z/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "浊齿龈摩擦音",
    mouthTip: "舌位与 /s/ 相同，保持中央窄缝和连续摩擦。",
    voiceTip: "浊辅音，喉咙持续振动；可用手指轻触喉部检查。",
    voicing: "voiced",
    examples: [
      { word: "zoo", ipaUk: "/zuː/", meaningZh: "动物园" },
      { word: "nose", ipaUk: "/nəʊz/", meaningZh: "鼻子" },
    ],
  },
  {
    id: "sh",
    symbol: "/ʃ/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "清龈后摩擦音",
    mouthTip: "舌前部靠近齿龈后方，双唇略圆，让气流持续通过。",
    voiceTip: "清辅音，喉咙不振动；比 /s/ 的摩擦位置更靠后。",
    voicing: "voiceless",
    examples: [
      { word: "ship", ipaUk: "/ʃɪp/", meaningZh: "船" },
      { word: "fish", ipaUk: "/fɪʃ/", meaningZh: "鱼" },
    ],
  },
  {
    id: "zh",
    symbol: "/ʒ/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "浊龈后摩擦音",
    mouthTip: "舌位与 /ʃ/ 相同，双唇略圆，保持连续摩擦。",
    voiceTip: "浊辅音，喉咙振动；这个音在英语词首较少见。",
    voicing: "voiced",
    examples: [
      { word: "measure", ipaUk: "/ˈmeʒə/", meaningZh: "测量；尺度" },
      { word: "pleasure", ipaUk: "/ˈpleʒə/", meaningZh: "愉快" },
    ],
  },
  {
    id: "h",
    symbol: "/h/",
    kind: "consonant",
    family: "摩擦音",
    nameZh: "清声门摩擦音",
    mouthTip: "声门打开，让气流自然呼出；口形跟随后面的元音变化。",
    voiceTip: "清辅音，像轻轻呵气，喉咙不振动。",
    voicing: "voiceless",
    examples: [
      { word: "hand", ipaUk: "/hænd/", meaningZh: "手" },
      { word: "house", ipaUk: "/haʊs/", meaningZh: "房子" },
    ],
  },
  {
    id: "ch",
    symbol: "/tʃ/",
    kind: "consonant",
    family: "破擦音",
    nameZh: "清龈后破擦音",
    mouthTip: "舌前部先完全堵住气流，再在齿龈后方带摩擦地放开。",
    voiceTip: "清辅音；堵塞和摩擦是一个整体，不要拆成两个音节。",
    voicing: "voiceless",
    examples: [
      { word: "chair", ipaUk: "/tʃeə/", meaningZh: "椅子" },
      { word: "much", ipaUk: "/mʌtʃ/", meaningZh: "许多" },
    ],
  },
  {
    id: "j-affricate",
    symbol: "/dʒ/",
    kind: "consonant",
    family: "破擦音",
    nameZh: "浊龈后破擦音",
    mouthTip: "舌位与 /tʃ/ 相同，先堵住，再带摩擦地放开。",
    voiceTip: "浊辅音，喉咙振动；整个动作保持为一拍。",
    voicing: "voiced",
    examples: [
      { word: "jump", ipaUk: "/dʒʌmp/", meaningZh: "跳" },
      { word: "edge", ipaUk: "/edʒ/", meaningZh: "边缘" },
    ],
  },
  {
    id: "m",
    symbol: "/m/",
    kind: "consonant",
    family: "鼻音",
    nameZh: "双唇鼻音",
    mouthTip: "双唇闭合，软腭下降，让气流从鼻腔通过。",
    voiceTip: "浊辅音，喉咙和鼻梁都可感到轻微振动。",
    voicing: "voiced",
    examples: [
      { word: "man", ipaUk: "/mæn/", meaningZh: "男人；人" },
      { word: "room", ipaUk: "/ruːm/", meaningZh: "房间" },
    ],
  },
  {
    id: "n",
    symbol: "/n/",
    kind: "consonant",
    family: "鼻音",
    nameZh: "齿龈鼻音",
    mouthTip: "舌尖抵上齿龈，软腭下降，让气流从鼻腔通过。",
    voiceTip: "浊辅音，喉咙振动；结尾不要补元音。",
    voicing: "voiced",
    examples: [
      { word: "name", ipaUk: "/neɪm/", meaningZh: "名字" },
      { word: "sun", ipaUk: "/sʌn/", meaningZh: "太阳" },
    ],
  },
  {
    id: "ng",
    symbol: "/ŋ/",
    kind: "consonant",
    family: "鼻音",
    nameZh: "软腭鼻音",
    mouthTip: "舌后部贴近软腭，口腔通道关闭，气流从鼻腔通过。",
    voiceTip: "浊辅音；词尾 /ŋ/ 后不要自动再加一个 /ɡ/。",
    voicing: "voiced",
    examples: [
      { word: "thing", ipaUk: "/θɪŋ/", meaningZh: "事物" },
      { word: "long", ipaUk: "/lɒŋ/", meaningZh: "长的" },
    ],
  },
  {
    id: "l",
    symbol: "/l/",
    kind: "consonant",
    family: "边音",
    nameZh: "齿龈边音",
    mouthTip: "舌尖抵上齿龈，气流从舌头两侧通过；词首先练清晰的 light l。",
    voiceTip: "浊辅音，喉咙振动；舌尖位置要明确。",
    voicing: "voiced",
    examples: [
      { word: "leg", ipaUk: "/leɡ/", meaningZh: "腿" },
      { word: "light", ipaUk: "/laɪt/", meaningZh: "光；轻的" },
    ],
  },
  {
    id: "r",
    symbol: "/r/",
    kind: "consonant",
    family: "近音",
    nameZh: "齿龈后近音",
    mouthTip: "舌尖略向后抬但不碰上腭，双唇可轻圆；不要颤舌。",
    voiceTip: "浊辅音。标准英式中主要在后面紧跟元音时发出。",
    voicing: "voiced",
    examples: [
      { word: "red", ipaUk: "/red/", meaningZh: "红色的" },
      { word: "river", ipaUk: "/ˈrɪvə/", meaningZh: "河流" },
    ],
    noteZh:
      "本教材沿用英国学习词典常用的音位符号 /r/；实际常见发音接近 [ɹ]。非卷舌英式口音通常不读 car 末尾的 r。",
  },
  {
    id: "y",
    symbol: "/j/",
    kind: "consonant",
    family: "近音",
    nameZh: "硬腭近音",
    mouthTip: "舌前部靠近硬腭但不摩擦，迅速滑向后面的元音。",
    voiceTip: "浊辅音；类似 yes 开头的 y，但不要单独拖长。",
    voicing: "voiced",
    examples: [
      { word: "yes", ipaUk: "/jes/", meaningZh: "是的" },
      { word: "unit", ipaUk: "/ˈjuːnɪt/", meaningZh: "单位" },
    ],
  },
  {
    id: "w",
    symbol: "/w/",
    kind: "consonant",
    family: "近音",
    nameZh: "唇软腭近音",
    mouthTip: "双唇先收圆，舌后部抬起，再迅速滑向后面的元音。",
    voiceTip: "浊辅音；双唇不接触，也不要用上齿摩擦下唇。",
    voicing: "voiced",
    examples: [
      { word: "water", ipaUk: "/ˈwɔːtə/", meaningZh: "水" },
      { word: "white", ipaUk: "/waɪt/", meaningZh: "白色的" },
    ],
  },
  {
    id: "ts",
    symbol: "/ts/",
    kind: "cluster",
    family: "辅音连缀",
    nameZh: "清辅音连缀",
    mouthTip: "先用舌尖做 /t/ 的堵塞，放开后立刻进入 /s/；中间不加元音。",
    voiceTip: "两个部分都不振动，整体保持一拍；常见于名词复数或第三人称词尾。",
    voicing: "voiceless",
    examples: [
      { word: "cats", ipaUk: "/kæts/", meaningZh: "猫（复数）" },
      { word: "seats", ipaUk: "/siːts/", meaningZh: "座位（复数）" },
    ],
    noteZh: "本课程把 /ts/ 标为两个音位组成的连缀，不计入 44 个核心音位。",
  },
  {
    id: "dz",
    symbol: "/dz/",
    kind: "cluster",
    family: "辅音连缀",
    nameZh: "浊辅音连缀",
    mouthTip: "先做 /d/ 的堵塞，放开后立刻进入 /z/；不要在中间加“呃”。",
    voiceTip: "喉咙保持振动，整体一拍；常见于浊音后的复数或第三人称词尾。",
    voicing: "voiced",
    examples: [
      { word: "beds", ipaUk: "/bedz/", meaningZh: "床（复数）" },
      { word: "hands", ipaUk: "/hændz/", meaningZh: "手（复数）" },
    ],
    noteZh: "本课程把 /dz/ 标为两个音位组成的连缀，不计入 44 个核心音位。",
  },
  {
    id: "tr",
    symbol: "/tr/",
    kind: "cluster",
    family: "辅音连缀",
    nameZh: "清爆破音加近音",
    mouthTip: "舌尖从 /t/ 的位置迅速过渡到 /r/，舌尖不颤动，中间不加元音。",
    voiceTip: "开头的 /t/ 不振动；实际英语中常听起来带破擦色彩。",
    voicing: "mixed",
    examples: [
      { word: "tree", ipaUk: "/triː/", meaningZh: "树" },
      { word: "train", ipaUk: "/treɪn/", meaningZh: "火车" },
    ],
    noteZh: "本课程按教学需要整体练习 /tr/，但语言学分析通常把它视为 /t/ + /r/ 的连缀。",
  },
  {
    id: "dr",
    symbol: "/dr/",
    kind: "cluster",
    family: "辅音连缀",
    nameZh: "浊爆破音加近音",
    mouthTip: "舌尖从 /d/ 的位置迅速过渡到 /r/，动作连贯，中间不加元音。",
    voiceTip: "喉咙基本保持振动；实际英语中常听起来带破擦色彩。",
    voicing: "mixed",
    examples: [
      { word: "drink", ipaUk: "/drɪŋk/", meaningZh: "喝；饮料" },
      { word: "dress", ipaUk: "/dres/", meaningZh: "衣服；穿衣" },
    ],
    noteZh: "本课程按教学需要整体练习 /dr/，但语言学分析通常把它视为 /d/ + /r/ 的连缀。",
  },
] as const satisfies readonly RawPhoneme[];

/**
 * noteZh 是供卡片直接显示的组合文本；原始字段仍保留，便于后续分别排版。
 */
export const phonemes: readonly Phoneme[] = rawPhonemes.map((sound) => ({
  ...sound,
  examples: sound.examples.map((example) => ({
    ...example,
    noteZh: `${example.ipaUk} · ${example.meaningZh}`,
  })),
}));

export type PhonemeId = (typeof phonemes)[number]["id"];

export interface PhoneticLesson {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  objectives: readonly string[];
  phonemeIds: readonly PhonemeId[];
  warmUp: string;
  practice: readonly string[];
  checkpoint: string;
}

const lessonData = [
  {
    id: "sound-01",
    slug: "front-vowels",
    title: "第1课｜先会看音标：/iː ɪ e æ/",
    subtitle: "从嘴巴开合认识四个前元音，不用汉字给英语注音。",
    durationMinutes: 22,
    objectives: [
      "知道音标记录的是声音，不是字母名称",
      "能用嘴形和音长区分 /iː/、/ɪ/、/e/、/æ/",
    ],
    phonemeIds: ["i-long", "i-short", "e", "ae"],
    warmUp: "照镜子，从微笑的小开口慢慢过渡到放低下巴的大开口。",
    practice: [
      "跟读三轮：see—ship，bed—bad；每轮先慢后自然。",
      "遮住音标，只看嘴形提示，说出 green、milk、red、hand。",
    ],
    checkpoint: "能连续读 see—ship—bed—hand，并让四个元音听起来不同。",
  },
  {
    id: "sound-02",
    slug: "open-back-vowels",
    title: "第2课｜开口与圆唇：/ʌ ɑː ɒ ɔː/",
    subtitle: "同样像“啊”的声音，舌位、圆唇和音长都不同。",
    durationMinutes: 22,
    objectives: ["分清短音和长音", "能观察并控制嘴唇是否收圆"],
    phonemeIds: ["uh", "a-long", "o-short", "aw-long"],
    warmUp: "手指轻放下巴，练习“小开口—大开口—轻圆唇—圆唇保持”。",
    practice: [
      "交替读 cup—dark、dog—door，长音保持两拍。",
      "把 sun、arm、box、water 各读两次，第二次只改错一个动作。",
    ],
    checkpoint: "别人随机指四个音标时，能用正确嘴形读出并举出一个词。",
  },
  {
    id: "sound-03",
    slug: "rounded-central-vowels",
    title: "第3课｜放松与弱读：/ʊ uː ɜː ə/",
    subtitle: "短圆唇、长圆唇、中央长音和英语最常见的弱读音。",
    durationMinutes: 24,
    objectives: ["区分 /ʊ/ 与 /uː/", "知道 /ə/ 通常出现在非重读音节"],
    phonemeIds: ["u-short", "u-long", "er-long", "schwa"],
    warmUp: "先让嘴唇完全放松，再轻圆、收圆；感受肌肉用力程度的变化。",
    practice: [
      "跟读 foot—food、book—blue，短音一拍，长音两拍。",
      "轻读 about 的开头和 mother 的结尾，不要把 /ə/ 读重。",
    ],
    checkpoint: "能说明并演示 /ə/ 为什么比 /ɜː/ 更轻、更短。",
  },
  {
    id: "sound-04",
    slug: "closing-diphthongs-one",
    title: "第4课｜一次滑完：/eɪ aɪ ɔɪ əʊ/",
    subtitle: "双元音不是两个分开的音节，而是一次连续的口形移动。",
    durationMinutes: 22,
    objectives: ["理解双元音的起点和终点", "能在一拍内完成四种滑动"],
    phonemeIds: ["ei", "ai", "oi", "ou"],
    warmUp: "慢慢做四次口形滑动，先不发声，再让声带持续振动。",
    practice: [
      "一拍一个词：day、time、boy、go；不要在中间停顿。",
      "读 name—white—oil—road，并说出嘴唇最后是展开还是收圆。",
    ],
    checkpoint: "能读出四个双元音，并指出每个音的主要口形变化。",
  },
  {
    id: "sound-05",
    slug: "diphthongs-two",
    title: "第5课｜向后收与向中央滑：/aʊ ɪə eə ʊə/",
    subtitle: "完成传统英式学习音标中的八个双元音。",
    durationMinutes: 24,
    objectives: ["分辨 /aʊ/ 与三个集中双元音", "接受不同英国口音可能出现的读法变化"],
    phonemeIds: ["au", "ear", "air", "ure"],
    warmUp: "从夸张口形开始，逐轮缩小动作，保持声音仍然清楚。",
    practice: [
      "跟读 house—ear—air—poor，注意末尾不要另加卷舌音。",
      "比较 near—care 与 down—tour：听清起点，再模仿整段滑动。",
    ],
    checkpoint: "能按传统英式示范读四组词，也知道 /ʊə/ 会随口音发生变化。",
  },
  {
    id: "sound-06",
    slug: "lip-alveolar-plosives",
    title: "第6课｜堵住再放开：/p b t d/",
    subtitle: "用手摸喉咙，建立清辅音与浊辅音的第一组对照。",
    durationMinutes: 22,
    objectives: ["理解爆破音的堵塞与释放", "用声带振动区分清浊成对音"],
    phonemeIds: ["p", "b", "t", "d"],
    warmUp: "一手放在喉咙，交替发 /p b/、/t d/，只比较振动，不加元音。",
    practice: [
      "在嘴前放一小片纸，读 pen—bed、tea—day，观察送气。",
      "轻读 map、bed、time、door 的末尾或开头，避免补“呃”。",
    ],
    checkpoint: "闭眼摸喉咙时，能判断自己发的是清音还是浊音。",
  },
  {
    id: "sound-07",
    slug: "back-and-lip-friction",
    title: "第7课｜舌后与唇齿：/k ɡ f v/",
    subtitle: "找到看不见的舌后动作，也把 /v/ 从 /w/ 中分出来。",
    durationMinutes: 22,
    objectives: ["控制 /k ɡ/ 的软腭爆破", "用上齿与下唇发出 /f v/"],
    phonemeIds: ["k", "g", "f", "v"],
    warmUp: "先无声做 /k/ 的释放，再让 /ɡ/ 带上喉咙振动。",
    practice: [
      "交替读 key—go、foot—voice，每组检查一次喉咙。",
      "保持上齿接触下唇，拉长 /ffff/ 和 /vvvv/，再读 fire、very。",
    ],
    checkpoint: "能在不加汉语韵母的情况下清楚读出 /k ɡ f v/。",
  },
  {
    id: "sound-08",
    slug: "dental-alveolar-fricatives",
    title: "第8课｜四个摩擦音：/θ ð s z/",
    subtitle: "舌头是否伸出、声带是否振动，决定四个音的区别。",
    durationMinutes: 25,
    objectives: ["让 /θ ð/ 的舌位可见", "按发音位置和清浊区分四个摩擦音"],
    phonemeIds: ["theta", "eth", "s", "z"],
    warmUp: "对镜把舌尖轻放齿间，连续吹气；再加上声带振动。",
    practice: [
      "读 thing—this、mouth—mother，确认舌尖确实可见。",
      "四音循环：/θ ð s z/；每个音保持一秒，不改变舌位过早。",
    ],
    checkpoint: "能解释 /θ/ 与 /s/、/ð/ 与 /z/ 的舌位差别。",
  },
  {
    id: "sound-09",
    slug: "back-fricatives",
    title: "第9课｜摩擦位置向后移：/ʃ ʒ h/",
    subtitle: "从口腔后部的摩擦到声门的轻轻呵气。",
    durationMinutes: 20,
    objectives: ["区分 /ʃ/ 与 /ʒ/ 的清浊", "让 /h/ 自然衔接后面的元音"],
    phonemeIds: ["sh", "zh", "h"],
    warmUp: "先拉长 /ʃ/，保持舌位并加声带振动变成 /ʒ/，最后轻轻呵气发 /h/。",
    practice: [
      "跟读 ship—measure—hand，注意摩擦位置和声带变化。",
      "读 fish、pleasure、house；/h/ 后直接进入元音，不单独拖长。",
    ],
    checkpoint: "能用手摸喉咙证明 /ʃ/ 与 /ʒ/ 的区别。",
  },
  {
    id: "sound-10",
    slug: "affricates",
    title: "第10课｜一个动作完成：/tʃ dʒ/",
    subtitle: "真正的两个英语破擦音：先堵塞，再带摩擦释放。",
    durationMinutes: 18,
    objectives: ["把堵塞与摩擦合成一拍", "用声带振动区分 /tʃ/ 与 /dʒ/"],
    phonemeIds: ["ch", "j-affricate"],
    warmUp: "先做一次短促的“堵—放”，再分别用无振动和有振动完成。",
    practice: [
      "交替读 chair—jump、much—edge，每个词只拍一次手。",
      "拉长摩擦尾部检查气流，但回到单词时恢复自然长度。",
    ],
    checkpoint: "能一拍读出 /tʃ/、/dʒ/，且不在后面加元音。",
  },
  {
    id: "sound-11",
    slug: "nasals",
    title: "第11课｜让气流走鼻腔：/m n ŋ/",
    subtitle: "嘴唇、舌尖、舌后三个不同的堵塞位置。",
    durationMinutes: 20,
    objectives: ["感受鼻腔共鸣", "用发音位置区分三种鼻音"],
    phonemeIds: ["m", "n", "ng"],
    warmUp: "捏住鼻子依次尝试 /m n ŋ/，感受气流被阻断，再松开重做。",
    practice: [
      "读 man—name—thing，注意堵塞位置从前向后移动。",
      "读 room—sun—long，词尾收住，不补元音；long 后不加 /ɡ/。",
    ],
    checkpoint: "能指出三个鼻音分别由嘴唇、舌尖还是舌后完成。",
  },
  {
    id: "sound-12",
    slug: "approximants-and-lateral",
    title: "第12课｜气流不断：/l r j w/",
    subtitle: "四个容易受汉语拼音影响的边音与近音。",
    durationMinutes: 24,
    objectives: ["让 /l/ 舌尖接触而 /r/ 不接触上腭", "用唇形区分 /j/ 与 /w/"],
    phonemeIds: ["l", "r", "y", "w"],
    warmUp: "慢做四个动作：舌尖接触、舌尖悬空、舌前抬高、双唇收圆。",
    practice: [
      "交替读 leg—red、yes—water，夸张关键动作后恢复自然。",
      "读 light—river—unit—white，每个词录一次，再按提示只改一个音。",
    ],
    checkpoint: "能不借助拼音说出四个音的发音部位和动作。",
  },
  {
    id: "sound-13",
    slug: "plural-clusters",
    title: "第13课｜词尾不加音：/ts dz/",
    subtitle: "把复数词尾连紧，理解它们是辅音连缀而非新增音位。",
    durationMinutes: 18,
    objectives: ["连贯读出 /ts/ 与 /dz/", "知道这两项由已学音位组合而成"],
    phonemeIds: ["ts", "dz"],
    warmUp: "先分别发 /t/+/s/、/d/+/z/，逐次缩短两者间隔，直到没有元音。",
    practice: [
      "单数到复数：cat—cats、bed—beds；只在结尾增加辅音。",
      "一拍读 seats、hands，录音检查是否出现额外的“呃”或“斯”。",
    ],
    checkpoint: "能读清 cats 与 beds，并说明每组连缀由哪两个音组成。",
  },
  {
    id: "sound-14",
    slug: "r-clusters-and-review",
    title: "第14课｜连上 /r/：/tr dr/ 与总复习",
    subtitle: "完成常说的“48音”学习框架，并回到44个核心音位的真实结构。",
    durationMinutes: 26,
    objectives: ["不加元音地连读 /tr/ 与 /dr/", "能解释44音位与中国教材常说48音的关系"],
    phonemeIds: ["tr", "dr"],
    warmUp: "从很慢的 /t/+/r/、/d/+/r/ 开始，逐渐缩短间隔，舌尖始终不颤动。",
    practice: [
      "跟读 tree—drink、train—dress，允许自然的轻微破擦感。",
      "任选两组元音和两组辅音做四行复习；每行各读两个示例词。",
      "用自己的话复述：20个元音 + 24个辅音 = 44个核心音位；再加4组教学连缀 = 48个练习项。",
    ],
    checkpoint: "能完成 /tr dr/ 跟读，并准确说明“48音”是教学口径，不是48个独立音位。",
  },
] as const satisfies readonly PhoneticLesson[];

// Widen the exported array to the public interface so React state infers `string`,
// not only the literal id of the first lesson.
export const phoneticLessons: readonly PhoneticLesson[] = lessonData;

export interface PhoneticsEvidence {
  model: string;
  notation: string;
  summaryZh: string;
  coreBreakdown: {
    monophthongs: number;
    diphthongs: number;
    consonants: number;
    totalPhonemes: number;
  };
  teachingExtension: {
    clusters: readonly string[];
    totalPracticeItems: number;
  };
  explanationZh: string;
  caveatsZh: readonly string[];
  sources: readonly {
    title: string;
    url: string;
    noteZh: string;
  }[];
}

export const phoneticsEvidence = {
  model: "英国英语学习用音位表：44个核心音位 + 4组常见教学连缀",
  notation:
    "示例采用英国学习词典常用的宽式音位标注；/r/ 是词典音位符号，实际常见音值接近 [ɹ]。",
  summaryZh:
    "本课程以20个元音和24个辅音构成的44个核心音位为主，再单列 /ts/、/dz/、/tr/、/dr/ 四组常见教学连缀。因此页面共有48个练习项，但不声称英语有48个公认的独立音位。",
  coreBreakdown: {
    monophthongs: 12,
    diphthongs: 8,
    consonants: 24,
    totalPhonemes: 44,
  },
  teachingExtension: {
    clusters: ["/ts/", "/dz/", "/tr/", "/dr/"],
    totalPracticeItems: 48,
  },
  explanationZh:
    "英语教学常用的英国英语框架包含20个元音和24个辅音，共44个核心音位。中国部分教材所说的“48个音标”，通常是在这44项之外又把 /ts/、/dz/、/tr/、/dr/ 四组辅音组合单列练习。本课程保留这四项的教学价值，但明确标为辅音连缀，不把它们冒充四个公认的独立音位。",
  caveatsZh: [
    "英语没有脱离口音而唯一不变的音位总表；“44”是常用教学概括，不是所有英语变体的硬性定律。",
    "现代英国口音中 /ɪə/、/eə/、尤其 /ʊə/ 的实现和合并情况会变化；课程先教会查词典、辨听和可理解表达。",
    "/tr/、/dr/ 在实际语流里常带破擦色彩，但通常仍分析为两个音位组成的复杂声母；/ts/、/dz/ 也常跨越词干与语法词尾。",
  ],
  sources: [
    {
      title: "British Council — LearnEnglish Sounds Right",
      url: "https://learnenglishkids.britishcouncil.org/apps/sounds-right",
      noteZh: "英国文化教育协会的英国英语发音表说明及示例词练习方法。",
    },
    {
      title: "British Council — Learning English through sharing rhymes",
      url: "https://learnenglishkids.britishcouncil.org/parents/helping-your-child/learning-english-through-sharing-rhymes",
      noteZh: "明确使用英语26个字母与44个声音的常见教学表述。",
    },
    {
      title: "UCL — Phonetic symbols, keyboards and transcription",
      url: "https://www.phon.ucl.ac.uk/resource/phonetics.php/home/wells/on-line.htm",
      noteZh: "John Wells 汇总的RP及相近口音标准音位符号集。",
    },
    {
      title: "Cambridge Journal of Linguistics — All TRs are not created equal",
      url: "https://www.cambridge.org/core/journals/journal-of-linguistics/article/all-trs-are-not-created-equal-l1-and-l2-perception-of-english-cluster-affrication/B6A0AE0A159E7C00D77251E6D798FFA3",
      noteZh: "说明英语 /tr/、/dr/ 是会发生破擦化的辅音连缀，支持本课程的边界标注。",
    },
  ],
} as const satisfies PhoneticsEvidence;

export const phoneticsStats = {
  lessonCount: phoneticLessons.length,
  corePhonemeCount: phonemes.filter((item) => item.kind !== "cluster").length,
  teachingClusterCount: phonemes.filter((item) => item.kind === "cluster").length,
  totalPracticeItemCount: phonemes.length,
} as const;
