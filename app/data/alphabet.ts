/**
 * 零基础英语字母课程数据。
 *
 * 重要边界：字母是书写符号，音标记录声音。一个字母在不同单词中
 * 可能对应不同声音，也可能与其他字母组合表示声音；这里列出的只是
 * 适合入门的常见对应关系，不是“一字母一音”的规则表。
 */

export interface AlphabetSoundValue {
  ipaUk: string;
  ipaUs: string;
  noteZh: string;
}

export interface AlphabetExample {
  word: string;
  ipaUk: string;
  ipaUs: string;
  meaningZh: string;
  soundIpa: string;
}

export interface AlphabetLetter {
  id: string;
  uppercase: string;
  lowercase: string;
  nameIpa: {
    uk: string;
    us: string;
  };
  commonSounds: readonly AlphabetSoundValue[];
  examples: readonly AlphabetExample[];
  mouthTip: string;
  writingTip: string;
  noteZh?: string;
}

const letterData = [
  {
    id: "a",
    uppercase: "A",
    lowercase: "a",
    nameIpa: { uk: "/eɪ/", us: "/eɪ/" },
    commonSounds: [
      { ipaUk: "/æ/", ipaUs: "/æ/", noteZh: "在 apple 一类单词中常见。" },
      { ipaUk: "/eɪ/", ipaUs: "/eɪ/", noteZh: "在 name 一类拼写中常见。" },
    ],
    examples: [
      { word: "apple", ipaUk: "/ˈæpəl/", ipaUs: "/ˈæpəl/", meaningZh: "苹果", soundIpa: "/æ/" },
      { word: "name", ipaUk: "/neɪm/", ipaUs: "/neɪm/", meaningZh: "名字", soundIpa: "/eɪ/" },
    ],
    mouthTip: "字母名从 /e/ 附近滑向 /ɪ/，一拍读完，不要拆成两个音节。",
    writingTip: "大写 A 先写两条斜线，再加横线；手写小写 a 可写成圆圈接右侧短竖。",
  },
  {
    id: "b",
    uppercase: "B",
    lowercase: "b",
    nameIpa: { uk: "/biː/", us: "/biː/" },
    commonSounds: [
      { ipaUk: "/b/", ipaUs: "/b/", noteZh: "常表示浊双唇音 /b/。" },
    ],
    examples: [
      { word: "book", ipaUk: "/bʊk/", ipaUs: "/bʊk/", meaningZh: "书", soundIpa: "/b/" },
    ],
    mouthTip: "双唇先闭合发 /b/，再接长音 /iː/；喉咙会振动。",
    writingTip: "大写 B 是一条竖线加上下两个圆弧；小写 b 是长竖加右下圆肚。",
  },
  {
    id: "c",
    uppercase: "C",
    lowercase: "c",
    nameIpa: { uk: "/siː/", us: "/siː/" },
    commonSounds: [
      { ipaUk: "/k/", ipaUs: "/k/", noteZh: "在 cat 等词中常见。" },
      { ipaUk: "/s/", ipaUs: "/s/", noteZh: "在 city 等词中常见，常出现在 e、i、y 前。" },
    ],
    examples: [
      { word: "cat", ipaUk: "/kæt/", ipaUs: "/kæt/", meaningZh: "猫", soundIpa: "/k/" },
      { word: "city", ipaUk: "/ˈsɪti/", ipaUs: "/ˈsɪti/", meaningZh: "城市", soundIpa: "/s/" },
    ],
    mouthTip: "字母名先发细长的 /s/，再接 /iː/；不要把开头读成汉语“西”的声母。",
    writingTip: "大写和小写都像向右开口的弧线；从上方向左绕下书写。",
  },
  {
    id: "d",
    uppercase: "D",
    lowercase: "d",
    nameIpa: { uk: "/diː/", us: "/diː/" },
    commonSounds: [
      { ipaUk: "/d/", ipaUs: "/d/", noteZh: "常表示浊齿龈音 /d/。" },
    ],
    examples: [
      { word: "dog", ipaUk: "/dɒɡ/", ipaUs: "/dɑːɡ/", meaningZh: "狗", soundIpa: "/d/" },
    ],
    mouthTip: "舌尖从上齿龈放开发 /d/，再接 /iː/；不要在中间停顿。",
    writingTip: "大写 D 是一条竖线加右侧大圆弧；小写 d 是左圆圈加右侧长竖。",
    noteZh: "小写 d 与 b 容易镜像混淆：d 的圆肚在长竖左边。",
  },
  {
    id: "e",
    uppercase: "E",
    lowercase: "e",
    nameIpa: { uk: "/iː/", us: "/iː/" },
    commonSounds: [
      { ipaUk: "/e/", ipaUs: "/e/", noteZh: "在 egg、bed 一类单词中常见。" },
      { ipaUk: "/iː/", ipaUs: "/iː/", noteZh: "在 me 一类短词中可读长音。" },
    ],
    examples: [
      { word: "egg", ipaUk: "/eɡ/", ipaUs: "/eɡ/", meaningZh: "鸡蛋", soundIpa: "/e/" },
      { word: "me", ipaUk: "/miː/", ipaUs: "/miː/", meaningZh: "我（宾格）", soundIpa: "/iː/" },
    ],
    mouthTip: "字母名是稳定的长音 /iː/：嘴角微展，声音拉足。",
    writingTip: "大写 E 是一竖加上、中、下三横；小写 e 从中间短横起笔再绕成开口圆。",
    noteZh: "词尾 e 还可能不单独发音，例如 name；它常会影响前面的元音字母。",
  },
  {
    id: "f",
    uppercase: "F",
    lowercase: "f",
    nameIpa: { uk: "/ef/", us: "/ef/" },
    commonSounds: [
      { ipaUk: "/f/", ipaUs: "/f/", noteZh: "常表示清唇齿音 /f/。" },
    ],
    examples: [
      { word: "fish", ipaUk: "/fɪʃ/", ipaUs: "/fɪʃ/", meaningZh: "鱼", soundIpa: "/f/" },
    ],
    mouthTip: "先发短 /e/，上齿再轻触下唇收在 /f/，结尾不加元音。",
    writingTip: "大写 F 是一竖加上、中两横；小写 f 用长竖弯钩穿过一条短横。",
  },
  {
    id: "g",
    uppercase: "G",
    lowercase: "g",
    nameIpa: { uk: "/dʒiː/", us: "/dʒiː/" },
    commonSounds: [
      { ipaUk: "/ɡ/", ipaUs: "/ɡ/", noteZh: "在 go 等词中常见。" },
      { ipaUk: "/dʒ/", ipaUs: "/dʒ/", noteZh: "在 general 等词中常见，常出现在 e、i、y 前，但有例外。" },
    ],
    examples: [
      { word: "go", ipaUk: "/ɡəʊ/", ipaUs: "/ɡoʊ/", meaningZh: "去", soundIpa: "/ɡ/" },
      { word: "general", ipaUk: "/ˈdʒenərəl/", ipaUs: "/ˈdʒenərəl/", meaningZh: "一般的；总体的", soundIpa: "/dʒ/" },
    ],
    mouthTip: "字母名以 /dʒ/ 开头，舌前先堵住再带摩擦放开，接 /iː/。",
    writingTip: "大写 G 先写开口圆再加内侧短横；手写小写 g 可用圆圈加向下弯钩。",
  },
  {
    id: "h",
    uppercase: "H",
    lowercase: "h",
    nameIpa: { uk: "/eɪtʃ/", us: "/eɪtʃ/" },
    commonSounds: [
      { ipaUk: "/h/", ipaUs: "/h/", noteZh: "在 hand 等词开头常表示轻轻呼出的 /h/。" },
    ],
    examples: [
      { word: "hand", ipaUk: "/hænd/", ipaUs: "/hænd/", meaningZh: "手", soundIpa: "/h/" },
    ],
    mouthTip: "先读 /eɪ/，再以 /tʃ/ 收尾；字母名开头没有 /h/。",
    writingTip: "大写 H 是两竖中间一横；小写 h 是长竖回到中部后向右拱起。",
    noteZh: "h 有时不发音，例如 hour；先学 hand 中最常见的 /h/。",
  },
  {
    id: "i",
    uppercase: "I",
    lowercase: "i",
    nameIpa: { uk: "/aɪ/", us: "/aɪ/" },
    commonSounds: [
      { ipaUk: "/ɪ/", ipaUs: "/ɪ/", noteZh: "在 ink 一类单词中常见。" },
      { ipaUk: "/aɪ/", ipaUs: "/aɪ/", noteZh: "在 time 一类拼写中常见。" },
    ],
    examples: [
      { word: "ink", ipaUk: "/ɪŋk/", ipaUs: "/ɪŋk/", meaningZh: "墨水", soundIpa: "/ɪ/" },
      { word: "time", ipaUk: "/taɪm/", ipaUs: "/taɪm/", meaningZh: "时间", soundIpa: "/aɪ/" },
    ],
    mouthTip: "从大开口的低元音滑向 /ɪ/，下巴向上收，一拍完成。",
    writingTip: "大写 I 在不同字体中可是一条竖线或带上下横；小写 i 是短竖加上方一点。",
  },
  {
    id: "j",
    uppercase: "J",
    lowercase: "j",
    nameIpa: { uk: "/dʒeɪ/", us: "/dʒeɪ/" },
    commonSounds: [
      { ipaUk: "/dʒ/", ipaUs: "/dʒ/", noteZh: "常表示浊破擦音 /dʒ/。" },
    ],
    examples: [
      { word: "jump", ipaUk: "/dʒʌmp/", ipaUs: "/dʒʌmp/", meaningZh: "跳", soundIpa: "/dʒ/" },
    ],
    mouthTip: "先发一拍 /dʒ/，再滑读 /eɪ/；喉咙保持振动。",
    writingTip: "大写 J 从上横向下写并在底部向左弯；小写 j 是向下长竖弯钩加一点。",
  },
  {
    id: "k",
    uppercase: "K",
    lowercase: "k",
    nameIpa: { uk: "/keɪ/", us: "/keɪ/" },
    commonSounds: [
      { ipaUk: "/k/", ipaUs: "/k/", noteZh: "常表示清软腭音 /k/。" },
    ],
    examples: [
      { word: "key", ipaUk: "/kiː/", ipaUs: "/kiː/", meaningZh: "钥匙", soundIpa: "/k/" },
    ],
    mouthTip: "舌后部放开发 /k/，再平滑接 /eɪ/；开头有轻微送气。",
    writingTip: "大写和小写都先写竖线，再从中部向右上、右下各写一条斜线。",
    noteZh: "k 在 know 一类单词开头可能不发音。",
  },
  {
    id: "l",
    uppercase: "L",
    lowercase: "l",
    nameIpa: { uk: "/el/", us: "/el/" },
    commonSounds: [
      { ipaUk: "/l/", ipaUs: "/l/", noteZh: "常表示齿龈边音 /l/。" },
    ],
    examples: [
      { word: "leg", ipaUk: "/leɡ/", ipaUs: "/leɡ/", meaningZh: "腿", soundIpa: "/l/" },
    ],
    mouthTip: "先发短 /e/，舌尖抵上齿龈收在 /l/；结尾不要补“呃”。",
    writingTip: "大写 L 是一竖加底横；小写 l 是一条高于其他小写字母的长竖。",
    noteZh: "小写 l、数字 1 和大写 I 在某些字体中很像，要结合字体和上下文辨认。",
  },
  {
    id: "m",
    uppercase: "M",
    lowercase: "m",
    nameIpa: { uk: "/em/", us: "/em/" },
    commonSounds: [
      { ipaUk: "/m/", ipaUs: "/m/", noteZh: "常表示双唇鼻音 /m/。" },
    ],
    examples: [
      { word: "milk", ipaUk: "/mɪlk/", ipaUs: "/mɪlk/", meaningZh: "牛奶", soundIpa: "/m/" },
    ],
    mouthTip: "先发短 /e/，再闭合双唇让气流走鼻腔，以 /m/ 收尾。",
    writingTip: "大写 M 由两竖和中间两斜线组成；小写 m 是一短竖接两个小拱。",
  },
  {
    id: "n",
    uppercase: "N",
    lowercase: "n",
    nameIpa: { uk: "/en/", us: "/en/" },
    commonSounds: [
      { ipaUk: "/n/", ipaUs: "/n/", noteZh: "常表示齿龈鼻音 /n/。" },
    ],
    examples: [
      { word: "name", ipaUk: "/neɪm/", ipaUs: "/neɪm/", meaningZh: "名字", soundIpa: "/n/" },
    ],
    mouthTip: "先发短 /e/，舌尖抵上齿龈，以鼻音 /n/ 收尾。",
    writingTip: "大写 N 是两竖加中间斜线；小写 n 是一短竖接一个小拱。",
  },
  {
    id: "o",
    uppercase: "O",
    lowercase: "o",
    nameIpa: { uk: "/əʊ/", us: "/oʊ/" },
    commonSounds: [
      { ipaUk: "/ɒ/", ipaUs: "/ɑː/", noteZh: "在英式 on 与美式 on 中常见的口音差异。" },
      { ipaUk: "/əʊ/", ipaUs: "/oʊ/", noteZh: "在 go 一类单词中常见。" },
    ],
    examples: [
      { word: "on", ipaUk: "/ɒn/", ipaUs: "/ɑːn/", meaningZh: "在……上；开启", soundIpa: "/ɒ/ ~ /ɑː/" },
      { word: "go", ipaUk: "/ɡəʊ/", ipaUs: "/ɡoʊ/", meaningZh: "去", soundIpa: "/əʊ/ ~ /oʊ/" },
    ],
    mouthTip: "英式从放松的中央位置滑向 /ʊ/；美式起点更靠后，结尾都逐渐收圆。",
    writingTip: "大写和小写都是闭合的椭圆；从上方起笔绕一圈并闭合。",
  },
  {
    id: "p",
    uppercase: "P",
    lowercase: "p",
    nameIpa: { uk: "/piː/", us: "/piː/" },
    commonSounds: [
      { ipaUk: "/p/", ipaUs: "/p/", noteZh: "常表示清双唇音 /p/。" },
    ],
    examples: [
      { word: "pen", ipaUk: "/pen/", ipaUs: "/pen/", meaningZh: "钢笔", soundIpa: "/p/" },
    ],
    mouthTip: "双唇放开发送气的 /p/，再接长音 /iː/；喉咙不振动。",
    writingTip: "大写 P 是一竖加右上圆肚；小写 p 的长竖向基线下延伸，圆肚在右上。",
    noteZh: "小写 p 与 q 容易镜像混淆：p 的长竖在左，向下伸。",
  },
  {
    id: "q",
    uppercase: "Q",
    lowercase: "q",
    nameIpa: { uk: "/kjuː/", us: "/kjuː/" },
    commonSounds: [
      { ipaUk: "/kw/", ipaUs: "/kw/", noteZh: "q 常与 u 连写为 qu，整体常表示 /kw/ 这组辅音。" },
    ],
    examples: [
      { word: "queen", ipaUk: "/kwiːn/", ipaUs: "/kwiːn/", meaningZh: "女王", soundIpa: "/kw/" },
    ],
    mouthTip: "先发 /k/，舌位快速转到 /j/，再接长 /uː/；整体一个字母名。",
    writingTip: "大写 Q 是 O 加右下短尾；小写 q 是圆圈加右侧向下长竖弯尾。",
    noteZh: "小写 q 与 p 容易镜像混淆；英语常见拼写中 q 后面通常跟 u。",
  },
  {
    id: "r",
    uppercase: "R",
    lowercase: "r",
    nameIpa: { uk: "/ɑː/", us: "/ɑr/" },
    commonSounds: [
      { ipaUk: "/r/", ipaUs: "/r/", noteZh: "在 red 等词开头常表示 /r/；不同口音对词尾 r 的处理不同。" },
    ],
    examples: [
      { word: "red", ipaUk: "/red/", ipaUs: "/red/", meaningZh: "红色的", soundIpa: "/r/" },
    ],
    mouthTip: "英式字母名通常是长 /ɑː/，不卷舌；美式末尾带清楚的 r 音。",
    writingTip: "大写 R 是 P 的右下再加一条斜腿；小写 r 是短竖接右上小肩。",
    noteZh: "本教材默认非卷舌英式示范；美式会在字母名和更多位置读出 r。",
  },
  {
    id: "s",
    uppercase: "S",
    lowercase: "s",
    nameIpa: { uk: "/es/", us: "/es/" },
    commonSounds: [
      { ipaUk: "/s/", ipaUs: "/s/", noteZh: "在 sun 等词中常见。" },
      { ipaUk: "/z/", ipaUs: "/z/", noteZh: "在 nose 等词中常见。" },
    ],
    examples: [
      { word: "sun", ipaUk: "/sʌn/", ipaUs: "/sʌn/", meaningZh: "太阳", soundIpa: "/s/" },
      { word: "nose", ipaUk: "/nəʊz/", ipaUs: "/noʊz/", meaningZh: "鼻子", soundIpa: "/z/" },
    ],
    mouthTip: "先发短 /e/，再让细气流从舌中央通过，以 /s/ 收尾。",
    writingTip: "大写和小写都沿上弧向左、下弧向右写成连续的 S 形。",
  },
  {
    id: "t",
    uppercase: "T",
    lowercase: "t",
    nameIpa: { uk: "/tiː/", us: "/tiː/" },
    commonSounds: [
      { ipaUk: "/t/", ipaUs: "/t/", noteZh: "常表示清齿龈音 /t/；连读中的实际音值会随口音和位置变化。" },
    ],
    examples: [
      { word: "tea", ipaUk: "/tiː/", ipaUs: "/tiː/", meaningZh: "茶", soundIpa: "/t/" },
    ],
    mouthTip: "舌尖从上齿龈放开发 /t/，再接 /iː/；开头通常有送气。",
    writingTip: "大写 T 是顶横加中间长竖；小写 t 是长竖加靠上的短横。",
  },
  {
    id: "u",
    uppercase: "U",
    lowercase: "u",
    nameIpa: { uk: "/juː/", us: "/juː/" },
    commonSounds: [
      { ipaUk: "/ʌ/", ipaUs: "/ʌ/", noteZh: "在 cup 一类单词中常见。" },
      { ipaUk: "/juː/", ipaUs: "/juː/", noteZh: "在 unit 一类单词中常见；这是 /j/ 加 /uː/。" },
    ],
    examples: [
      { word: "cup", ipaUk: "/kʌp/", ipaUs: "/kʌp/", meaningZh: "杯子", soundIpa: "/ʌ/" },
      { word: "unit", ipaUk: "/ˈjuːnɪt/", ipaUs: "/ˈjuːnɪt/", meaningZh: "单位", soundIpa: "/juː/" },
    ],
    mouthTip: "舌前迅速滑出 /j/，双唇再收圆发长 /uː/；不要拆成两个音节。",
    writingTip: "大写 U 从左上向下弯到底再回到右上；小写 u 是短竖下弯后上提。",
  },
  {
    id: "v",
    uppercase: "V",
    lowercase: "v",
    nameIpa: { uk: "/viː/", us: "/viː/" },
    commonSounds: [
      { ipaUk: "/v/", ipaUs: "/v/", noteZh: "常表示浊唇齿音 /v/。" },
    ],
    examples: [
      { word: "very", ipaUk: "/ˈveri/", ipaUs: "/ˈveri/", meaningZh: "非常", soundIpa: "/v/" },
    ],
    mouthTip: "上齿轻触下唇发振动的 /v/，再接 /iː/；不要读成 /w/。",
    writingTip: "大写和小写都是两条斜线在底部相接；小写尺寸更小。",
  },
  {
    id: "w",
    uppercase: "W",
    lowercase: "w",
    nameIpa: { uk: "/ˈdʌbəljuː/", us: "/ˈdʌbəljuː/" },
    commonSounds: [
      { ipaUk: "/w/", ipaUs: "/w/", noteZh: "在 water 等词开头常表示双唇收圆的 /w/。" },
    ],
    examples: [
      { word: "water", ipaUk: "/ˈwɔːtə/", ipaUs: "/ˈwɑːtər/", meaningZh: "水", soundIpa: "/w/" },
    ],
    mouthTip: "字母名重音在第一音节，读作三音节 /ˈdʌ-bəl-juː/，最后是 /juː/。",
    writingTip: "大写和小写都像两个相连的 V；连续写四条斜线，转角保持清楚。",
    noteZh: "w 在 write 一类单词开头可能不发音；字母名 double u 不等于它在单词中的 /w/。",
  },
  {
    id: "x",
    uppercase: "X",
    lowercase: "x",
    nameIpa: { uk: "/eks/", us: "/eks/" },
    commonSounds: [
      { ipaUk: "/ks/", ipaUs: "/ks/", noteZh: "在 box 等词中常见，是两个辅音连在一起。" },
      { ipaUk: "/ɡz/", ipaUs: "/ɡz/", noteZh: "在 exam 等词中常见。" },
    ],
    examples: [
      { word: "box", ipaUk: "/bɒks/", ipaUs: "/bɑːks/", meaningZh: "盒子", soundIpa: "/ks/" },
      { word: "exam", ipaUk: "/ɪɡˈzæm/", ipaUs: "/ɪɡˈzæm/", meaningZh: "考试", soundIpa: "/ɡz/" },
    ],
    mouthTip: "先发短 /e/，再连续收在 /k/ 和 /s/；中间不要加元音。",
    writingTip: "大写和小写都是两条交叉斜线；交点放在字母中部。",
  },
  {
    id: "y",
    uppercase: "Y",
    lowercase: "y",
    nameIpa: { uk: "/waɪ/", us: "/waɪ/" },
    commonSounds: [
      { ipaUk: "/j/", ipaUs: "/j/", noteZh: "在 yes 等词开头常作辅音。" },
      { ipaUk: "/aɪ/", ipaUs: "/aɪ/", noteZh: "在 my 等短词末尾常作元音；词尾还常见 /i/，如 happy。" },
    ],
    examples: [
      { word: "yes", ipaUk: "/jes/", ipaUs: "/jes/", meaningZh: "是的", soundIpa: "/j/" },
      { word: "my", ipaUk: "/maɪ/", ipaUs: "/maɪ/", meaningZh: "我的", soundIpa: "/aɪ/" },
    ],
    mouthTip: "双唇先收圆发 /w/，再从大开口滑向 /ɪ/；一拍读完 /waɪ/。",
    writingTip: "大写 Y 是两条上斜线汇合后向下；小写 y 的右斜笔向基线下延伸。",
  },
  {
    id: "z",
    uppercase: "Z",
    lowercase: "z",
    nameIpa: { uk: "/zed/", us: "/ziː/" },
    commonSounds: [
      { ipaUk: "/z/", ipaUs: "/z/", noteZh: "在 zoo 等词中常表示浊齿龈音 /z/。" },
    ],
    examples: [
      { word: "zoo", ipaUk: "/zuː/", ipaUs: "/zuː/", meaningZh: "动物园", soundIpa: "/z/" },
    ],
    mouthTip: "英式读 zed /zed/；美式读 zee /ziː/。两种字母名都正确，要跟随所选口音。",
    writingTip: "大写和小写都是上横、左下斜线、下横连成的折线。",
    noteZh: "这是26个字母中最需要明确切换的字母名：英国英语通常 zed，美国英语通常 zee。",
  },
] as const satisfies readonly AlphabetLetter[];

// 对外拓宽为公共接口，避免 React 状态只推断出某一个字面量 id。
export const alphabetLetters: readonly AlphabetLetter[] = letterData;

export type AlphabetLetterId = (typeof letterData)[number]["id"];

export interface AlphabetLesson {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  objectives: readonly string[];
  letterIds: readonly AlphabetLetterId[];
  warmUp: string;
  tasks: {
    recognition: string;
    listening: string;
    writing: string;
  };
  checkpoint: string;
}

const lessonData = [
  {
    id: "alphabet-01",
    slug: "letters-a-to-d",
    title: "第1课｜A–D：看清大小写",
    subtitle: "先建立“字母名”和“单词里的声音”是两回事。",
    durationMinutes: 18,
    objectives: ["能按顺序说出 A、B、C、D 的字母名", "能配对四组大写与小写"],
    letterIds: ["a", "b", "c", "d"],
    warmUp: "观察 A/a、B/b、C/c、D/d：找出大小写外形相近和差别明显的各一组。",
    tasks: {
      recognition: "把八张大小写卡打乱，为 A–D 找到配对，并按字母顺序排好。",
      listening: "随机听四个字母名，先指卡片，再跟读；随后听 cat 与 city，比较同一个 c 的不同声音。",
      writing: "每个字母先描一遍，再脱离范字各写一组大写和小写；重点核对 b 与 d 的圆肚方向。",
    },
    checkpoint: "看到任意一张 A–D 大小写卡，能在两秒内说出字母名，并能指出字母名不等于例词中的固定声音。",
  },
  {
    id: "alphabet-02",
    slug: "letters-e-to-h",
    title: "第2课｜E–H：长音与收尾",
    subtitle: "练习 /iː/ 结尾的字母名，也认识 G 和 H 的特别读法。",
    durationMinutes: 18,
    objectives: ["能认读 E、F、G、H", "能听出 /iː/、/ef/、/dʒiː/、/eɪtʃ/ 的差别"],
    letterIds: ["e", "f", "g", "h"],
    warmUp: "先保持 /iː/ 两拍，再做 /f/、/dʒ/、/tʃ/ 三种辅音动作。",
    tasks: {
      recognition: "从 E–H 中找出字母名以 /iː/ 结尾的 E、G，以及结尾是辅音的 F、H。",
      listening: "听字母名举起对应卡；再听 go 与 general，判断 g 在两个词中的声音是否相同。",
      writing: "各写一行 E/e、F/f、G/g、H/h；小写 g 采用一种稳定手写法，不要求模仿所有印刷字体。",
    },
    checkpoint: "能无提示依次读 E–H，并说明 H 的字母名 /eɪtʃ/ 开头不发 /h/。",
  },
  {
    id: "alphabet-03",
    slug: "letters-i-to-l",
    title: "第3课｜I–L：四个形状，四个节奏",
    subtitle: "分清 I 与小写 l，并把 J、K 的 /eɪ/ 结尾读完整。",
    durationMinutes: 18,
    objectives: ["能认读 I、J、K、L", "能在常见字体中区分大写 I、小写 l 和数字 1"],
    letterIds: ["i", "j", "k", "l"],
    warmUp: "先连续读 /aɪ/、/eɪ/、/iː/、/e/，感受四种元音长度和滑动。",
    tasks: {
      recognition: "将 I/i、J/j、K/k、L/l 配对；在一行混合符号中圈出全部字母，不把数字 1 当成 l。",
      listening: "听 I、J、K、L 的随机顺序并复述；再听 ink 与 time，判断 i 表示的声音。",
      writing: "每组大小写各写三次；确保 i、j 有点，j 的长竖和 l 的高度位置清楚。",
    },
    checkpoint: "能看、听、写出 I–L，且能说出字母 I 的名称 /aɪ/ 不代表它在每个单词中都读 /aɪ/。",
  },
  {
    id: "alphabet-04",
    slug: "letters-m-to-q",
    title: "第4课｜M–Q：鼻音名与圆形字母",
    subtitle: "从 M、N 的鼻音收尾走到 O、P、Q，重点记住 q 常与 u 同行。",
    durationMinutes: 20,
    objectives: ["能认读 M、N、O、P、Q", "能分清 O/0 与 p/q 的外形"],
    letterIds: ["m", "n", "o", "p", "q"],
    warmUp: "手指轻放鼻翼，读 /em/、/en/；再观察 O 与数字 0、p 与 q 的方向。",
    tasks: {
      recognition: "配对 M–Q 大小写，并在混排中圈出小写 p、q；说出它们的长竖分别在哪一侧。",
      listening: "听 M–Q 后指卡；比较英式 O /əʊ/ 与美式 O /oʊ/，只求辨认，不强求口音完全相同。",
      writing: "写 M/m、N/n、O/o、P/p、Q/q；确认 o 闭合，p/q 的下伸笔与圆肚方向正确。",
    },
    checkpoint: "能按顺序读写 M–Q，并看到 queen 时知道 qu 常一起表示 /kw/。",
  },
  {
    id: "alphabet-05",
    slug: "letters-r-to-v",
    title: "第5课｜R–V：英美音与易混音",
    subtitle: "听懂英美 R 的差别，分清 S 的两种常见声音和 V 的唇齿动作。",
    durationMinutes: 20,
    objectives: ["能认读 R、S、T、U、V", "能按所选口音读 R，并区分 V 与 W 的发音动作"],
    letterIds: ["r", "s", "t", "u", "v"],
    warmUp: "一手摸喉咙：拉长 /s/ 再加振动变成 /z/；上齿轻触下唇发 /v/。",
    tasks: {
      recognition: "将 R–V 大小写配对，并从字母串中找出外形相近的 U/V。",
      listening: "分别听英式 R /ɑː/ 与美式 R /ɑr/；再听 sun、nose，判断 s 对应 /s/ 还是 /z/。",
      writing: "各写一组 R/r 到 V/v；检查大写 R 的斜腿、小写 t 的横线和 V 的尖底。",
    },
    checkpoint: "能读写 R–V，说明英式和美式 R 都是正确口音形式，并用口形区分 /v/ 与 /w/。",
  },
  {
    id: "alphabet-06",
    slug: "letters-w-to-z",
    title: "第6课｜W–Z：完成字母表",
    subtitle: "掌握较长的 W、会变角色的 Y，以及英式 zed / 美式 zee。",
    durationMinutes: 22,
    objectives: ["能认读 W、X、Y、Z", "能从 A 到 Z 完整朗读并按字母顺序整理单词"],
    letterIds: ["w", "x", "y", "z"],
    warmUp: "先把 W 分成三拍 /ˈdʌ-bəl-juː/；再交替读英式 zed 和美式 zee。",
    tasks: {
      recognition: "配对 W–Z 大小写，再把四张卡插入已经排好的 A–V 后面，完成26字母序列。",
      listening: "随机听 W、X、Y、Z 并指卡；听 box、exam，判断 x 是 /ks/ 还是 /ɡz/。",
      writing: "各写三组 W/w、X/x、Y/y、Z/z；确保 w 有两个谷、x 在中部相交、y 向下延伸。",
    },
    checkpoint: "能从 A 到 Z 完整读一遍；切到英式时读 zed，切到美式时读 zee，并说明字母与声音不是一一对应。",
  },
] as const satisfies readonly AlphabetLesson[];

export const alphabetLessons: readonly AlphabetLesson[] = lessonData;

export interface AlphabetEvidence {
  model: string;
  summaryZh: string;
  principles: readonly string[];
  caveatsZh: readonly string[];
  sources: readonly {
    title: string;
    url: string;
    noteZh: string;
  }[];
}

export const alphabetEvidence = {
  model: "26个英语字母：字母名、大小写、常见字母—声音对应与基础书写",
  summaryZh:
    "课程先让学习者会认、会听字母名、会写大小写，再用简单例词建立常见声音联系。26个字母不能与英语音位一一对应；一个声音可能由一个或多个字母表示，同一字母也可能随单词和口音表示不同声音。",
  principles: [
    "字母名与字母在单词中的声音分开学习。",
    "先教高频、可迁移的对应关系，再在真实单词中逐步学习例外和字母组合。",
    "识别、听辨、书写和自测在每节短课中同时出现。",
    "英式为默认示范，美式可切换；差异明显处同时标注。",
  ],
  caveatsZh: [
    "commonSounds 只列入门阶段最常见的对应关系，不是完整拼读规则，也不能据此准确读出所有陌生词。",
    "例词使用宽式学习音标；实际发音会随地区、语速和说话人而变化。",
    "拉丁字母手写体没有全球唯一笔顺；writingTip 提供的是清晰、易辨认的初学建议，不把某一种字体写法规定为唯一正确形式。",
    "字母 Z 在英国英语中通常叫 zed /zed/，在美国英语中通常叫 zee /ziː/。",
  ],
  sources: [
    {
      title: "UK Department for Education — Letters and Sounds",
      url: "https://www.gov.uk/government/publications/letters-and-sounds",
      noteZh: "用于字母、字素、音位和拼读教学之间的基本边界，以及听说、拼读、书写结合的课程依据。",
    },
    {
      title: "British Council — Alphabet song",
      url: "https://learnenglishkids.britishcouncil.org/listen-watch/video-zone/alphabet-song",
      noteZh: "提供26个字母大小写、字母顺序和首字母例词的基础学习活动。",
    },
    {
      title: "Cambridge Dictionary — Pronunciation of Z",
      url: "https://dictionary.cambridge.org/pronunciation/english/z",
      noteZh: "明确给出英国英语 zed /zed/ 与美国英语 zee /ziː/。",
    },
    {
      title: "Cambridge Dictionary — Pronunciation",
      url: "https://dictionary.cambridge.org/pronunciation/",
      noteZh: "用于核对字母名和例词的英式、美式学习音标。",
    },
  ],
} as const satisfies AlphabetEvidence;

export const alphabetStats = {
  letterCount: alphabetLetters.length,
  lessonCount: alphabetLessons.length,
  uppercaseCount: new Set(alphabetLetters.map((letter) => letter.uppercase)).size,
  lowercaseCount: new Set(alphabetLetters.map((letter) => letter.lowercase)).size,
} as const;
