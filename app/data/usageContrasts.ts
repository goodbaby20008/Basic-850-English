/**
 * 零基础学习者常用近义词与易混词辨析。
 *
 * 对象键均来自项目中经 PDF 核验的 Ogden 850 规范词表；关联词是否属于
 * 该词表由 `inBasic850` 明示。这里的词彼此“相关”，不表示可以无条件互换。
 */

export const usageContrasts: Record<
  string,
  readonly { word: string; noteZh: string; inBasic850: boolean }[]
> = {
  answer: [
    { word: "reply", noteZh: "常指对人或消息作回复；answer 还可指题目的答案或解决办法。", inBasic850: false },
    { word: "response", noteZh: "较正式，泛指对话、事件或刺激产生的回应。", inBasic850: false },
    { word: "solution", noteZh: "专指问题的解决方案，不是普通问句的回答。", inBasic850: false },
  ],
  bad: [
    { word: "poor", noteZh: "常说质量差、表现差或贫穷；bad 的负面范围更广。", inBasic850: true },
    { word: "wrong", noteZh: "强调不正确或做错；bad 也可表示糟糕、有害。", inBasic850: true },
    { word: "terrible", noteZh: "语气比 bad 强得多，表示非常糟糕。", inBasic850: false },
  ],
  beautiful: [
    { word: "pretty", noteZh: "多指外表漂亮，语气通常比 beautiful 轻。", inBasic850: false },
    { word: "good", noteZh: "泛指好；beautiful 专门突出视觉、声音或感受上的美。", inBasic850: true },
  ],
  clean: [
    { word: "clear", noteZh: "clear 是清楚、透明或无阻碍；clean 是没有污垢。", inBasic850: true },
    { word: "wash", noteZh: "wash 是用水清洗的动作；clean 可指清洁动作或洁净状态。", inBasic850: true },
    { word: "tidy", noteZh: "tidy 强调整齐有序，房间整齐却仍可能不干净。", inBasic850: false },
  ],
  clear: [
    { word: "obvious", noteZh: "obvious 是显而易见；clear 还可指表达清楚或液体透明。", inBasic850: false },
    { word: "clean", noteZh: "clean 强调无污垢，不等于意思清楚。", inBasic850: true },
    { word: "simple", noteZh: "simple 指结构不复杂；clear 指容易理解、没有歧义。", inBasic850: true },
  ],
  come: [
    { word: "go", noteZh: "come 朝说话者或参照点移动；go 从该点离开。", inBasic850: true },
    { word: "arrive", noteZh: "arrive 强调到达结果，常接 at 或 in；come 强调朝这里来。", inBasic850: false },
    { word: "bring", noteZh: "bring 是把某物带到这里；come 只说明人或事物来到。", inBasic850: false },
  ],
  desire: [
    { word: "want", noteZh: "want 最常用、最口语；desire 较正式，愿望通常也更强。", inBasic850: false },
    { word: "need", noteZh: "need 表示缺少或必要；desire 只表示想要。", inBasic850: true },
    { word: "wish", noteZh: "wish 常指难实现的愿望，也用于祝愿。", inBasic850: false },
  ],
  do: [
    { word: "make", noteZh: "do 重在执行任务；make 重在产生、制作或造成结果。", inBasic850: true },
    { word: "perform", noteZh: "较正式，指执行职责，或在舞台上表演。", inBasic850: false },
    { word: "complete", noteZh: "强调把事情做完；do 本身不保证已经完成。", inBasic850: true },
  ],
  early: [
    { word: "soon", noteZh: "early 是比预期或常规时间早；soon 是从现在起不久。", inBasic850: false },
    { word: "before", noteZh: "before 表示一个时间在另一个时间之前，不一定算早。", inBasic850: true },
    { word: "quick", noteZh: "quick 说动作速度快；early 说发生时间早。", inBasic850: true },
  ],
  false: [
    { word: "wrong", noteZh: "wrong 是不正确；false 还可指不真实、伪造或故意误导。", inBasic850: true },
    { word: "untrue", noteZh: "直接表示不真实，常用于说法；false 的用法范围更广。", inBasic850: false },
    { word: "fake", noteZh: "强调冒充真的人或物；false 不一定是仿制品。", inBasic850: false },
  ],
  food: [
    { word: "meal", noteZh: "meal 是一次饭；food 是可吃的食物总称。", inBasic850: true },
    { word: "dish", noteZh: "dish 是一道做好的菜，也可指盘子。", inBasic850: false },
    { word: "produce", noteZh: "作名词时多指农产品，尤其水果和蔬菜，只是 food 的一类。", inBasic850: true },
  ],
  free: [
    { word: "available", noteZh: "available 是可获得或有空；free 还可表示免费或不受限制。", inBasic850: false },
    { word: "loose", noteZh: "loose 是不紧、不牢；free 是能够自由行动。", inBasic850: true },
    { word: "independent", noteZh: "强调不依赖他人；free 更强调没有限制。", inBasic850: false },
  ],
  full: [
    { word: "complete", noteZh: "complete 是完整、全部完成；full 常指容器没有剩余空间。", inBasic850: true },
    { word: "filled", noteZh: "filled 表示已经装有某物；full 表示装满的状态。", inBasic850: false },
    { word: "enough", noteZh: "enough 是数量够用，不一定达到 full 的“满”。", inBasic850: true },
  ],
  get: [
    { word: "receive", noteZh: "receive 只强调收到；get 很口语，还可表示取得、到达等。", inBasic850: false },
    { word: "obtain", noteZh: "较正式，强调经过努力取得某物。", inBasic850: false },
    { word: "become", noteZh: "get 接形容词时可表示状态变化，如 get tired；become 更正式。", inBasic850: false },
  ],
  give: [
    { word: "take", noteZh: "give 是把东西交出去；take 是拿走或接受。", inBasic850: true },
    { word: "offer", noteZh: "offer 是主动提出给，对方可能尚未接受。", inBasic850: true },
    { word: "provide", noteZh: "强调按需要供应，常用于服务、信息或资源。", inBasic850: false },
  ],
  go: [
    { word: "come", noteZh: "go 离开说话者或参照点；come 朝该点移动。", inBasic850: true },
    { word: "leave", noteZh: "leave 突出离开某地；go 更泛指去或移动。", inBasic850: false },
    { word: "travel", noteZh: "强调较长距离或一段旅行；go 可用于任何去向。", inBasic850: false },
  ],
  good: [
    { word: "great", noteZh: "great 常表示非常好，语气通常比 good 强。", inBasic850: true },
    { word: "nice", noteZh: "常表示令人愉快、友善或不错，语气较温和。", inBasic850: false },
    { word: "well", noteZh: "通常作副词修饰动作；作形容词时多表示身体健康。", inBasic850: true },
  ],
  great: [
    { word: "big", noteZh: "big 主要说体积或程度大；great 还可表示杰出、非常好。", inBasic850: false },
    { word: "large", noteZh: "large 较客观、稍正式地说尺寸或数量大，不表示优秀。", inBasic850: false },
    { word: "good", noteZh: "good 是一般的好；great 语气更强。", inBasic850: true },
  ],
  happy: [
    { word: "glad", noteZh: "常指因某件具体事情而高兴，常见于 I’m glad…。", inBasic850: false },
    { word: "pleased", noteZh: "较礼貌或正式，常表示对结果满意。", inBasic850: false },
    { word: "cheerful", noteZh: "强调一个人表现得开朗、有精神。", inBasic850: false },
  ],
  hard: [
    { word: "difficult", noteZh: "只表示难；hard 还可表示坚硬或努力地。", inBasic850: false },
    { word: "firm", noteZh: "表示结实、不松软，或态度坚定，不一定很难。", inBasic850: false },
    { word: "strong", noteZh: "强调力量大或承受力强；hard 强调硬度或难度。", inBasic850: true },
  ],
  help: [
    { word: "assist", noteZh: "比 help 正式，常用于工作、服务或书面语。", inBasic850: false },
    { word: "support", noteZh: "强调持续支持、支撑或提供资源，不一定亲自解决。", inBasic850: true },
    { word: "aid", noteZh: "较正式，常用于医疗、紧急救援或机构援助。", inBasic850: false },
  ],
  high: [
    { word: "tall", noteZh: "tall 说人或竖直物体从底到顶高；high 说位置、水平或数值高。", inBasic850: true },
    { word: "up", noteZh: "up 表示向上或在上方；high 描述离地面远或数值大。", inBasic850: true },
    { word: "great", noteZh: "great 可说数量或程度很大；high 常搭配 price、level、speed。", inBasic850: true },
  ],
  house: [
    { word: "home", noteZh: "home 是生活归属的“家”；house 主要指房屋建筑。", inBasic850: false },
    { word: "building", noteZh: "泛指任何建筑；house 通常是供人居住的房子。", inBasic850: true },
    { word: "room", noteZh: "room 是建筑内部的房间，不是整栋 house。", inBasic850: true },
  ],
  important: [
    { word: "major", noteZh: "常指规模、影响或地位较大；important 强调值得重视。", inBasic850: false },
    { word: "key", noteZh: "作形容词时指对结果起关键作用，比 important 更聚焦。", inBasic850: true },
    { word: "necessary", noteZh: "表示必须具备；重要的事物不一定是必需的。", inBasic850: true },
  ],
  journey: [
    { word: "trip", noteZh: "trip 通常包含去、停留和返回；journey 更关注从一地到另一地的过程。", inBasic850: false },
    { word: "travel", noteZh: "多作不可数名词或动词，泛指旅行活动。", inBasic850: false },
    { word: "tour", noteZh: "指按路线参观多处，常带观光目的。", inBasic850: false },
  ],
  keep: [
    { word: "hold", noteZh: "hold 常指手里拿住或保持某姿势；keep 强调继续拥有或维持。", inBasic850: false },
    { word: "save", noteZh: "强调保存以备后用、节省，或使其免受危险。", inBasic850: false },
    { word: "remain", noteZh: "是不及物动词，表示继续处于某状态；keep 常需接宾语或补语。", inBasic850: false },
  ],
  kind: [
    { word: "sort", noteZh: "表示种类时与 kind 接近；sort 更口语，kind 更常见于 a kind of。", inBasic850: true },
    { word: "type", noteZh: "常用于较正式或技术性的分类。", inBasic850: false },
    { word: "nice", noteZh: "kind 作形容词是“友善的”；nice 范围更广，可指令人愉快。", inBasic850: false },
  ],
  late: [
    { word: "early", noteZh: "early 比预期或规定时间早；late 比它晚。", inBasic850: true },
    { word: "delayed", noteZh: "表示因故被推迟；late 只说明到得或发生得晚。", inBasic850: false },
    { word: "recent", noteZh: "表示最近发生的；late 不表示“最近”。", inBasic850: false },
  ],
  like: [
    { word: "love", noteZh: "love 的喜欢或感情通常更强；like 更日常、更轻。", inBasic850: true },
    { word: "enjoy", noteZh: "强调从活动或经历中得到乐趣，后面常接名词或 -ing。", inBasic850: false },
    { word: "prefer", noteZh: "表示比较之后更喜欢某一个。", inBasic850: false },
  ],
  little: [
    { word: "small", noteZh: "small 客观描述尺寸；little 也可带亲切、可爱等感情色彩。", inBasic850: true },
    { word: "few", noteZh: "few 修饰可数复数；little 表示数量少时修饰不可数名词。", inBasic850: false },
    { word: "young", noteZh: "说年龄小时通常用 young；little 多说体型小或年幼儿童。", inBasic850: true },
  ],
  long: [
    { word: "tall", noteZh: "long 说长度或时间；tall 说人或竖直物体的高度。", inBasic850: true },
    { word: "far", noteZh: "far 说两点距离远；long 说路线或物体本身长度大。", inBasic850: true },
    { word: "lengthy", noteZh: "较正式，常暗示文章、过程或等待长得令人厌烦。", inBasic850: false },
  ],
  look: [
    { word: "see", noteZh: "look 是主动把目光移向某处；see 是眼睛看见的结果。", inBasic850: true },
    { word: "watch", noteZh: "watch 是持续看会变化的事物，如电影、比赛或小孩。", inBasic850: true },
    { word: "glance", noteZh: "表示很快地看一眼。", inBasic850: false },
  ],
  love: [
    { word: "like", noteZh: "like 表示一般喜欢；love 感情或喜爱程度更强。", inBasic850: true },
    { word: "adore", noteZh: "语气很强，表示非常喜爱或崇拜，日常也可夸张使用。", inBasic850: false },
    { word: "affection", noteZh: "是名词，指温暖、稳定的喜爱之情，不直接作动词用。", inBasic850: false },
  ],
  low: [
    { word: "short", noteZh: "short 说长度、身高或时间短；low 说位置、水平、声音或数值低。", inBasic850: true },
    { word: "down", noteZh: "down 表示向下或在下方；low 描述所处位置或水平。", inBasic850: true },
    { word: "small", noteZh: "small 说尺寸或数量小；low 常说价格、温度、音量等低。", inBasic850: true },
  ],
  make: [
    { word: "do", noteZh: "make 重在创造或产生结果；do 重在执行工作、活动或任务。", inBasic850: true },
    { word: "create", noteZh: "强调创造出原本没有的东西，通常比 make 更正式。", inBasic850: false },
    { word: "build", noteZh: "强调逐步建造有结构的东西，也可用于团队、能力等。", inBasic850: false },
  ],
  near: [
    { word: "close", noteZh: "表示距离近时可与 near 接近；close 还可表示亲密或关闭。", inBasic850: false },
    { word: "next", noteZh: "next 指顺序中的下一个；next to 才表示紧挨着。", inBasic850: false },
    { word: "around", noteZh: "表示在周围或大约；near 表示离某一点不远。", inBasic850: false },
  ],
  need: [
    { word: "require", noteZh: "较正式，常指规则、任务或条件要求必须具备。", inBasic850: false },
    { word: "want", noteZh: "want 是主观想要；need 表示确实必要。", inBasic850: false },
    { word: "must", noteZh: "must 是情态动词，表达必须做；need 可直接接名词。", inBasic850: false },
  ],
  new: [
    { word: "recent", noteZh: "recent 指不久前发生或制成；new 还可指首次接触或未使用过。", inBasic850: false },
    { word: "fresh", noteZh: "常指食物新鲜、空气清新，或刚产生的想法。", inBasic850: false },
    { word: "modern", noteZh: "指属于现代风格或时代，不一定是刚买或刚做的。", inBasic850: false },
  ],
  old: [
    { word: "ancient", noteZh: "表示极其久远，多用于历史、文明或遗迹。", inBasic850: false },
    { word: "aged", noteZh: "用于人或经过陈放的物品，语气比 old 更具体或正式。", inBasic850: false },
    { word: "former", noteZh: "表示从前的身份或状态，不表示年龄大。", inBasic850: false },
  ],
  open: [
    { word: "shut", noteZh: "shut 表示关上；open 表示打开或处于开放状态。", inBasic850: true },
    { word: "unlock", noteZh: "只表示解除锁定；门解锁后仍可能没有打开。", inBasic850: false },
    { word: "start", noteZh: "营业场所 open 是开始营业；活动本身通常用 start。", inBasic850: true },
  ],
  place: [
    { word: "position", noteZh: "更强调精确位置、姿势或职位；place 范围更日常。", inBasic850: true },
    { word: "space", noteZh: "指可用空间或范围；place 常指一个具体地点。", inBasic850: true },
    { word: "put", noteZh: "put 是把某物放到某处的动作；place 作动词更谨慎、正式。", inBasic850: true },
  ],
  put: [
    { word: "place", noteZh: "作动词时比 put 正式，常暗示小心或准确地放置。", inBasic850: true },
    { word: "set", noteZh: "常指把物品放到某位置，或设定时间、规则和数值。", inBasic850: false },
    { word: "leave", noteZh: "可表示把东西留在某处；put 只说放的动作。", inBasic850: false },
  ],
  question: [
    { word: "ask", noteZh: "ask 是提出问题的动作；question 是问题本身，也可作动词表示质疑。", inBasic850: false },
    { word: "query", noteZh: "较正式，常指需要核实的疑问或数据库查询。", inBasic850: false },
    { word: "request", noteZh: "request 是请别人做事或给东西，不一定是在询问信息。", inBasic850: true },
  ],
  quick: [
    { word: "fast", noteZh: "fast 强调持续速度快；quick 常指用时短、反应快。", inBasic850: false },
    { word: "early", noteZh: "early 表示时间早，不表示动作速度快。", inBasic850: true },
    { word: "sudden", noteZh: "sudden 是突然、没有预兆，不一定完成得快。", inBasic850: true },
  ],
  request: [
    { word: "ask", noteZh: "ask 是最常用的动词；request 较正式，也可作名词。", inBasic850: false },
    { word: "demand", noteZh: "语气强，表示坚决要求；request 通常更礼貌。", inBasic850: false },
    { word: "question", noteZh: "question 要信息或答案；request 要行动或物品。", inBasic850: true },
  ],
  right: [
    { word: "correct", noteZh: "表示答案或做法正确时更精确；right 更口语，含义也更多。", inBasic850: false },
    { word: "left", noteZh: "谈方向时与 right 相反。", inBasic850: true },
    { word: "wrong", noteZh: "谈正确性时与 right 相反。", inBasic850: true },
  ],
  road: [
    { word: "street", noteZh: "street 通常在城镇内、两旁有建筑；road 更泛指连接地点的道路。", inBasic850: true },
    { word: "way", noteZh: "way 可指路线、方向或方法，不一定是铺好的道路。", inBasic850: true },
    { word: "path", noteZh: "通常比 road 窄，供人步行，也可比喻发展路径。", inBasic850: false },
  ],
  room: [
    { word: "space", noteZh: "space 是可容纳事物的空间；room 还可指有墙的房间。", inBasic850: true },
    { word: "place", noteZh: "place 是地点；room 作不可数名词时强调还有没有空位。", inBasic850: true },
    { word: "chamber", noteZh: "较正式或旧式，指特定用途的房间。", inBasic850: false },
  ],
  sad: [
    { word: "unhappy", noteZh: "泛指不开心；sad 更明确地表示悲伤。", inBasic850: false },
    { word: "sorry", noteZh: "可表示歉意，也可因坏消息而难过；不总等于 sad。", inBasic850: false },
    { word: "bad", noteZh: "bad 评价事物糟糕；sad 描述情绪，也可指令人遗憾。", inBasic850: true },
  ],
  say: [
    { word: "speak", noteZh: "speak 重在说话能力或较正式发言；say 重在说出的具体内容。", inBasic850: false },
    { word: "talk", noteZh: "talk 重在交谈过程；say 后面常直接接说出的内容。", inBasic850: true },
    { word: "tell", noteZh: "tell 常接听话的人，如 tell me；say 通常接内容。", inBasic850: false },
  ],
  see: [
    { word: "look", noteZh: "look 是主动看；see 是看见的结果，也可表示理解或会面。", inBasic850: true },
    { word: "watch", noteZh: "watch 是持续观察变化中的事物。", inBasic850: true },
    { word: "notice", noteZh: "强调留意到某个细节或变化。", inBasic850: false },
  ],
  short: [
    { word: "small", noteZh: "small 说整体尺寸或数量小；short 说长度、身高或时间短。", inBasic850: true },
    { word: "low", noteZh: "low 说位置、水平或数值低，不等于长度短。", inBasic850: true },
    { word: "brief", noteZh: "多指话语、文章或时间简短，语气较正式。", inBasic850: false },
  ],
  shut: [
    { word: "close", noteZh: "表示关上时两者接近；close 更中性，shut 有时语气更突然。", inBasic850: false },
    { word: "lock", noteZh: "lock 是上锁；门 shut 了也可能没有锁。", inBasic850: true },
    { word: "open", noteZh: "表示打开或开放，与 shut 相反。", inBasic850: true },
  ],
  simple: [
    { word: "easy", noteZh: "easy 指做起来不难；simple 指结构或步骤不复杂。", inBasic850: false },
    { word: "plain", noteZh: "plain 指朴素、无装饰，也可指表达直白。", inBasic850: false },
    { word: "clear", noteZh: "clear 指容易理解、没有歧义；复杂内容也可以讲得很清楚。", inBasic850: true },
  ],
  slow: [
    { word: "quick", noteZh: "quick 强调用时短、反应快，与 slow 相对。", inBasic850: true },
    { word: "late", noteZh: "late 表示时间晚或迟到；动作慢不一定会迟到。", inBasic850: true },
    { word: "gradual", noteZh: "表示变化逐步发生；slow 只表示速度低。", inBasic850: false },
  ],
  small: [
    { word: "little", noteZh: "little 可带感情色彩，也可表示不可数数量少；small 较客观地说尺寸小。", inBasic850: true },
    { word: "short", noteZh: "short 说长度、身高或时间短；small 说整体尺寸或数量小。", inBasic850: true },
    { word: "tiny", noteZh: "表示极小，语气比 small 强。", inBasic850: false },
  ],
  soft: [
    { word: "hard", noteZh: "说材质时与 soft 相反；hard 还可表示困难。", inBasic850: true },
    { word: "gentle", noteZh: "强调动作、性格或力量温和；soft 多说触感、声音或光线柔和。", inBasic850: false },
    { word: "quiet", noteZh: "quiet 是声音少或环境安静；soft voice 是音量柔和。", inBasic850: true },
  ],
  start: [
    { word: "begin", noteZh: "含义接近；begin 稍正式，start 更常用于机器、旅程或创业。", inBasic850: false },
    { word: "open", noteZh: "商店 open 是开门营业；活动或过程 start 是开始。", inBasic850: true },
    { word: "launch", noteZh: "常指正式推出产品、计划或发射物。", inBasic850: false },
  ],
  stop: [
    { word: "end", noteZh: "end 强调到达终点；stop 强调让动作不再继续，可能只是暂时的。", inBasic850: true },
    { word: "pause", noteZh: "表示暂时停一下，通常还会继续。", inBasic850: false },
    { word: "finish", noteZh: "强调把任务完成；stop 不一定表示已经做完。", inBasic850: false },
  ],
  street: [
    { word: "road", noteZh: "street 多在城镇内且两旁有建筑；road 可连接城镇或地区。", inBasic850: true },
    { word: "avenue", noteZh: "常指城市中较宽、规划整齐的街道，名称用法因地区而异。", inBasic850: false },
    { word: "way", noteZh: "way 可指路线或方法，范围比具体的 street 广。", inBasic850: true },
  ],
  take: [
    { word: "bring", noteZh: "bring 把东西带到这里；take 通常把东西从这里带走。", inBasic850: false },
    { word: "carry", noteZh: "强调拿着或运送的过程；take 更强调带走或选择。", inBasic850: false },
    { word: "get", noteZh: "get 强调获得；take 强调主动拿取、带走或使用。", inBasic850: true },
  ],
  talk: [
    { word: "speak", noteZh: "speak 可指说某种语言或正式发言；talk 更强调交谈。", inBasic850: false },
    { word: "chat", noteZh: "指轻松、非正式的闲聊，范围比 talk 窄。", inBasic850: false },
    { word: "say", noteZh: "say 关注说了什么；talk 关注说话或交谈的过程。", inBasic850: true },
  ],
  true: [
    { word: "correct", noteZh: "correct 强调答案或做法无误；true 强调事实真实。", inBasic850: false },
    { word: "real", noteZh: "real 强调真实存在、不是仿造；true 常修饰说法或故事。", inBasic850: false },
    { word: "right", noteZh: "right 更口语，可表示正确，也可表示方向或权利。", inBasic850: true },
  ],
  watch: [
    { word: "look", noteZh: "look 是把目光移向目标，持续时间可以很短。", inBasic850: true },
    { word: "see", noteZh: "see 强调看见的结果；watch 强调持续观察。", inBasic850: true },
    { word: "monitor", noteZh: "强调为发现变化或问题而持续监测，较正式。", inBasic850: false },
  ],
  way: [
    { word: "road", noteZh: "road 是实际道路；way 还可指路线、方向或做事方法。", inBasic850: true },
    { word: "method", noteZh: "专指有步骤的做法，通常比 way 正式。", inBasic850: false },
    { word: "direction", noteZh: "可指方向或路线指示；way 也可表示到达某处的路。", inBasic850: true },
  ],
  work: [
    { word: "job", noteZh: "job 是一份职位或具体任务；work 是工作总称，通常不可数。", inBasic850: false },
    { word: "task", noteZh: "指有明确目标的一项具体任务。", inBasic850: false },
    { word: "labour", noteZh: "强调费力的劳动，也可指劳动力；比 work 正式。", inBasic850: false },
  ],
};
