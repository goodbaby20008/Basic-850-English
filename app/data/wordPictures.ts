export type WordPictureFidelity = "exact" | "approximate";

export interface WordPicture {
  wordId: string;
  emoji: string;
  /** Unicode code points, compatible with the usual Twemoji SVG filename form. */
  assetKey: string;
  /** Describes what is visibly shown, for accessibility rather than decoration. */
  altZh: string;
  /** A short learning cue; approximate entries always disclose that they are associations. */
  cueZh: string;
  fidelity: WordPictureFidelity;
}

/**
 * Converts one standard emoji grapheme to a stable, lower-case code-point key.
 * Emoji presentation selectors are omitted, matching Twemoji's usual asset names.
 */
export function emojiToAssetKey(emoji: string): string {
  return Array.from(emoji.normalize("NFC"))
    .filter((symbol) => symbol !== "\uFE0F")
    .map((symbol) => symbol.codePointAt(0)?.toString(16))
    .filter((codePoint): codePoint is string => Boolean(codePoint))
    .join("-");
}

function picture(
  wordId: string,
  emoji: string,
  altZh: string,
  cueZh: string,
  fidelity: WordPictureFidelity = "exact",
): Readonly<WordPicture> {
  return Object.freeze({
    wordId,
    emoji,
    assetKey: emojiToAssetKey(emoji),
    altZh,
    cueZh,
    fidelity,
  });
}

/**
 * Human-reviewed picture cues for the 200-word `things_picturable` group.
 *
 * Policy:
 * - Prefer one standard emoji grapheme; there are no ad-hoc multi-emoji collages.
 * - `exact` means the emoji visibly depicts the object or a clear instance of it.
 * - `approximate` is only a disclosed memory association, never a claimed definition.
 * - Words without a sufficiently clear emoji are intentionally absent.
 */
export const wordPictures: Readonly<Record<string, Readonly<WordPicture>>> = Object.freeze({
  "things_picturable-001": picture("things_picturable-001", "📐", "三角尺", "联想提示：三角尺用来画角、量角，帮助记住 angle。", "approximate"),
  "things_picturable-002": picture("things_picturable-002", "🐜", "蚂蚁", "图中是蚂蚁，对应 ant。"),
  "things_picturable-003": picture("things_picturable-003", "🍎", "红苹果", "图中是苹果，对应 apple。"),
  "things_picturable-005": picture("things_picturable-005", "💪", "弯曲的手臂", "图中是手臂，对应 arm。"),
  "things_picturable-006": picture("things_picturable-006", "🪖", "军用头盔", "联想提示：军用头盔让人想到军队，只提示 army 的军队义。", "approximate"),
  "things_picturable-007": picture("things_picturable-007", "👶", "婴儿", "图中是婴儿，对应 baby。"),
  "things_picturable-008": picture("things_picturable-008", "👜", "手提包", "图中是手提包，是 bag 的一种。"),
  "things_picturable-009": picture("things_picturable-009", "⚽", "足球", "图中是球，对应 ball；这里画的是足球。"),
  "things_picturable-010": picture("things_picturable-010", "🎸", "吉他", "联想提示：吉他让人想到乐队，只提示 band 的乐队义。", "approximate"),
  "things_picturable-012": picture("things_picturable-012", "🧺", "篮子", "图中是篮子，对应 basket。"),
  "things_picturable-013": picture("things_picturable-013", "🛁", "浴缸和淋浴", "图中是在浴缸里洗澡，对应 bath。"),
  "things_picturable-014": picture("things_picturable-014", "🛏️", "床", "图中是床，对应 bed。"),
  "things_picturable-015": picture("things_picturable-015", "🐝", "蜜蜂", "图中是蜜蜂，对应 bee。"),
  "things_picturable-016": picture("things_picturable-016", "🔔", "铃铛", "图中是铃，对应 bell。"),
  "things_picturable-017": picture("things_picturable-017", "🫐", "蓝莓", "图中是蓝莓，是 berry 的一种。"),
  "things_picturable-018": picture("things_picturable-018", "🐦", "小鸟", "图中是鸟，对应 bird。"),
  "things_picturable-019": picture("things_picturable-019", "🔪", "带刀锋的小刀", "联想提示：小刀上锋利的部分是 blade；图中不是单独的刀片。", "approximate"),
  "things_picturable-021": picture("things_picturable-021", "🚤", "快艇", "图中是小船，是 boat 的一种。"),
  "things_picturable-022": picture("things_picturable-022", "🦴", "骨头", "图中是骨头，对应 bone。"),
  "things_picturable-023": picture("things_picturable-023", "📖", "打开的书", "图中是书，对应 book。"),
  "things_picturable-024": picture("things_picturable-024", "👢", "长靴", "图中是长靴，对应 boot。"),
  "things_picturable-025": picture("things_picturable-025", "🍾", "带塞子的瓶子", "图中是瓶子，对应 bottle；这里画的是饮料瓶。"),
  "things_picturable-026": picture("things_picturable-026", "📦", "纸箱", "图中是箱子，对应 box。"),
  "things_picturable-027": picture("things_picturable-027", "👦", "男孩", "图中是男孩，对应 boy。"),
  "things_picturable-028": picture("things_picturable-028", "🧠", "大脑", "图中是脑，对应 brain。"),
  "things_picturable-030": picture("things_picturable-030", "🌿", "带叶的小枝", "联想提示：带叶的小枝帮助记住 branch；图标也常被理解为香草。", "approximate"),
  "things_picturable-031": picture("things_picturable-031", "🧱", "砖块", "图中是砖块，对应 brick。"),
  "things_picturable-032": picture("things_picturable-032", "🌉", "桥", "图中是桥，对应 bridge。"),
  "things_picturable-033": picture("things_picturable-033", "🖌️", "画笔", "图中是刷子的一种，对应 brush。"),
  "things_picturable-034": picture("things_picturable-034", "🪣", "水桶", "图中是桶，对应 bucket。"),
  "things_picturable-035": picture("things_picturable-035", "💡", "灯泡", "图中是灯泡，对应 bulb。"),
  "things_picturable-036": picture("things_picturable-036", "🔘", "圆形按钮", "图中是按钮，对应 button。"),
  "things_picturable-037": picture("things_picturable-037", "🍰", "一块蛋糕", "图中是蛋糕，对应 cake。"),
  "things_picturable-038": picture("things_picturable-038", "📷", "照相机", "图中是照相机，对应 camera。"),
  "things_picturable-039": picture("things_picturable-039", "🃏", "一张纸牌", "图中是纸牌，是 card 的一种。"),
  "things_picturable-040": picture("things_picturable-040", "🛒", "手推车", "图中是手推车，是 cart 的一种。"),
  "things_picturable-042": picture("things_picturable-042", "🐈", "猫", "图中是猫，对应 cat。"),
  "things_picturable-043": picture("things_picturable-043", "⛓️", "链条", "图中是链条，对应 chain。"),
  "things_picturable-044": picture("things_picturable-044", "🧀", "奶酪", "图中是奶酪，对应 cheese。"),
  "things_picturable-047": picture("things_picturable-047", "⛪", "教堂", "图中是教堂，对应 church。"),
  "things_picturable-048": picture("things_picturable-048", "⭕", "圆圈", "图中是圆圈，对应 circle。"),
  "things_picturable-049": picture("things_picturable-049", "🕒", "三点钟的表盘", "图中是钟表，对应 clock。"),
  "things_picturable-050": picture("things_picturable-050", "☁️", "云", "图中是云，对应 cloud。"),
  "things_picturable-051": picture("things_picturable-051", "🧥", "外套", "图中是外套，对应 coat。"),
  "things_picturable-052": picture("things_picturable-052", "👔", "衬衫领口和领带", "联想提示：领带上方的衬衫领口帮助记住 collar；图标主体是领带。", "approximate"),
  "things_picturable-053": picture("things_picturable-053", "🪮", "梳子", "图中是梳子，对应 comb。"),
  "things_picturable-054": picture("things_picturable-054", "🪢", "打结的绳子", "图中是绳索，对应 cord；绳上打了一个结。"),
  "things_picturable-055": picture("things_picturable-055", "🐄", "奶牛", "图中是母牛，对应 cow。"),
  "things_picturable-056": picture("things_picturable-056", "☕", "带饮料的杯子", "图中是杯子，对应 cup。"),
  "things_picturable-058": picture("things_picturable-058", "🛋️", "带软垫的沙发", "联想提示：沙发上的软垫帮助记住 cushion；图中不是单独的垫子。", "approximate"),
  "things_picturable-059": picture("things_picturable-059", "🐕", "狗", "图中是狗，对应 dog。"),
  "things_picturable-060": picture("things_picturable-060", "🚪", "门", "图中是门，对应 door。"),
  "things_picturable-062": picture("things_picturable-062", "🗄️", "文件柜", "联想提示：文件柜由抽屉组成，帮助记住 drawer；图中不是单独的抽屉。", "approximate"),
  "things_picturable-063": picture("things_picturable-063", "👗", "连衣裙", "图中是连衣裙，是 dress 的一种。"),
  "things_picturable-064": picture("things_picturable-064", "💧", "一滴水", "图中是一滴水，对应 drop。"),
  "things_picturable-065": picture("things_picturable-065", "👂", "耳朵", "图中是耳朵，对应 ear。"),
  "things_picturable-066": picture("things_picturable-066", "🥚", "鸡蛋", "图中是蛋，对应 egg。"),
  "things_picturable-067": picture("things_picturable-067", "⚙️", "齿轮", "联想提示：齿轮让人想到机器和发动机，只帮助记住 engine；图中不是完整发动机。", "approximate"),
  "things_picturable-068": picture("things_picturable-068", "👁️", "眼睛", "图中是眼睛，对应 eye。"),
  "things_picturable-069": picture("things_picturable-069", "🙂", "人的笑脸", "图中是脸，对应 face。"),
  "things_picturable-070": picture("things_picturable-070", "🚜", "拖拉机", "联想提示：拖拉机让人想到农场，只帮助记住 farm；图中不是整个农场。", "approximate"),
  "things_picturable-071": picture("things_picturable-071", "🪶", "羽毛", "图中是羽毛，对应 feather。"),
  "things_picturable-072": picture("things_picturable-072", "☝️", "竖起的食指", "图中是一根手指，对应 finger。"),
  "things_picturable-073": picture("things_picturable-073", "🐟", "鱼", "图中是鱼，对应 fish。"),
  "things_picturable-074": picture("things_picturable-074", "🚩", "旗子", "图中是旗子，对应 flag。"),
  "things_picturable-076": picture("things_picturable-076", "🪰", "苍蝇", "图中是苍蝇，对应 fly 的名词义。"),
  "things_picturable-077": picture("things_picturable-077", "🦶", "脚", "图中是脚，对应 foot。"),
  "things_picturable-078": picture("things_picturable-078", "🍴", "餐叉和餐刀", "图中左边是叉子，对应 fork。"),
  "things_picturable-079": picture("things_picturable-079", "🐔", "鸡", "图中是鸡，是 fowl 的一种。"),
  "things_picturable-080": picture("things_picturable-080", "🖼️", "带画的相框", "图中有相框，对应 frame。"),
  "things_picturable-081": picture("things_picturable-081", "🏡", "带花园的房子", "联想提示：房屋旁的花园帮助记住 garden；图标也包含房子。", "approximate"),
  "things_picturable-082": picture("things_picturable-082", "👧", "女孩", "图中是女孩，对应 girl。"),
  "things_picturable-083": picture("things_picturable-083", "🧤", "手套", "图中是手套，对应 glove。"),
  "things_picturable-084": picture("things_picturable-084", "🐐", "山羊", "图中是山羊，对应 goat。"),
  "things_picturable-085": picture("things_picturable-085", "🔫", "手枪", "图中是枪，对应 gun；不同平台外观可能像水枪。"),
  "things_picturable-086": picture("things_picturable-086", "💇", "正在理发的人", "联想提示：理发画面突出头发，只帮助记住 hair；图中不是单独一根头发。", "approximate"),
  "things_picturable-087": picture("things_picturable-087", "🔨", "锤子", "图中是锤子，对应 hammer。"),
  "things_picturable-088": picture("things_picturable-088", "✋", "张开的手", "图中是手，对应 hand。"),
  "things_picturable-089": picture("things_picturable-089", "🎩", "礼帽", "图中是帽子，是 hat 的一种。"),
  "things_picturable-090": picture("things_picturable-090", "🗣️", "说话的人头侧影", "联想提示：侧影中的头部帮助记住 head；图标还表示说话。", "approximate"),
  "things_picturable-091": picture("things_picturable-091", "🫀", "人体心脏", "图中是心脏，对应 heart。"),
  "things_picturable-092": picture("things_picturable-092", "🪝", "钩子", "图中是钩子，对应 hook。"),
  "things_picturable-093": picture("things_picturable-093", "📯", "号角", "图中是号角，是 horn 的一种。"),
  "things_picturable-094": picture("things_picturable-094", "🐎", "马", "图中是马，对应 horse。"),
  "things_picturable-095": picture("things_picturable-095", "🏥", "带红十字标志的医院", "图中是医院，对应 hospital。"),
  "things_picturable-096": picture("things_picturable-096", "🏠", "房子", "图中是房子，对应 house。"),
  "things_picturable-097": picture("things_picturable-097", "🏝️", "有棕榈树的小岛", "图中是岛，对应 island。"),
  "things_picturable-098": picture("things_picturable-098", "💎", "宝石", "图中是宝石，对应 jewel。"),
  "things_picturable-100": picture("things_picturable-100", "🔑", "钥匙", "图中是钥匙，对应 key。"),
  "things_picturable-101": picture("things_picturable-101", "🦵", "弯曲的腿", "联想提示：图中腿的弯曲处是膝盖，帮助记住 knee；图标表示整条腿。", "approximate"),
  "things_picturable-102": picture("things_picturable-102", "🔪", "小刀", "图中是小刀，对应 knife。"),
  "things_picturable-103": picture("things_picturable-103", "🪢", "绳结", "图中是结，对应 knot。"),
  "things_picturable-104": picture("things_picturable-104", "🍃", "叶子", "图中是叶子，对应 leaf。"),
  "things_picturable-105": picture("things_picturable-105", "🦵", "腿", "图中是腿，对应 leg。"),
  "things_picturable-106": picture("things_picturable-106", "📚", "一摞书", "联想提示：许多书让人想到图书馆，只帮助记住 library；图中不是图书馆建筑。", "approximate"),
  "things_picturable-107": picture("things_picturable-107", "➖", "水平直线", "图中是一条直线，对应 line。"),
  "things_picturable-108": picture("things_picturable-108", "👄", "嘴唇", "图中是嘴唇，对应 lip。"),
  "things_picturable-109": picture("things_picturable-109", "🔒", "挂锁", "图中是锁，对应 lock。"),
  "things_picturable-110": picture("things_picturable-110", "🗺️", "折叠地图", "图中是地图，对应 map。"),
  "things_picturable-112": picture("things_picturable-112", "🐒", "猴子", "图中是猴子，对应 monkey。"),
  "things_picturable-113": picture("things_picturable-113", "🌙", "弯月", "图中是月亮，对应 moon。"),
  "things_picturable-114": picture("things_picturable-114", "👄", "嘴", "图中是嘴，对应 mouth。"),
  "things_picturable-115": picture("things_picturable-115", "💪", "用力弯曲的手臂肌肉", "图中突出肌肉，对应 muscle。"),
  "things_picturable-116": picture("things_picturable-116", "💅", "涂指甲油的手指", "联想提示：图中涂色部位是指甲，只提示 nail 的指甲义，不表示钉子。", "approximate"),
  "things_picturable-118": picture("things_picturable-118", "🪡", "缝衣针和线", "图中是针，对应 needle。"),
  "things_picturable-120": picture("things_picturable-120", "🥅", "球门网", "图中有网，对应 net；这里画的是球门网。"),
  "things_picturable-121": picture("things_picturable-121", "👃", "鼻子", "图中是鼻子，对应 nose。"),
  "things_picturable-122": picture("things_picturable-122", "🌰", "栗子", "图中是可食用坚果的一种，对应 nut 的坚果义。"),
  "things_picturable-123": picture("things_picturable-123", "🏢", "办公楼", "图中是办公楼，对应 office 的办公场所义。"),
  "things_picturable-124": picture("things_picturable-124", "🍊", "橙子", "图中是橙子，对应 orange。"),
  "things_picturable-126": picture("things_picturable-126", "📦", "包裹", "图中是包裹，对应 parcel。"),
  "things_picturable-127": picture("things_picturable-127", "🖊️", "圆珠笔", "图中是笔，对应 pen。"),
  "things_picturable-128": picture("things_picturable-128", "✏️", "铅笔", "图中是铅笔，对应 pencil。"),
  "things_picturable-129": picture("things_picturable-129", "🖼️", "一幅画", "图中是一幅画，对应 picture。"),
  "things_picturable-130": picture("things_picturable-130", "🐖", "猪", "图中是猪，对应 pig。"),
  "things_picturable-131": picture("things_picturable-131", "📌", "图钉", "图中是大头针的一种，对应 pin。"),
  "things_picturable-133": picture("things_picturable-133", "✈️", "飞机", "图中是飞机，对应 plane 的飞机义。"),
  "things_picturable-134": picture("things_picturable-134", "🍽️", "餐盘和餐具", "图中有盘子，对应 plate。"),
  "things_picturable-136": picture("things_picturable-136", "👖", "带口袋的牛仔裤", "联想提示：裤子上的口袋帮助记住 pocket；图标主体是整条裤子。", "approximate"),
  "things_picturable-137": picture("things_picturable-137", "🍲", "装着食物的锅", "图中是锅，对应 pot。"),
  "things_picturable-138": picture("things_picturable-138", "🥔", "马铃薯", "图中是马铃薯，对应 potato。"),
  "things_picturable-140": picture("things_picturable-140", "⛽", "加油泵", "图中是燃油泵，是 pump 的一种。"),
  "things_picturable-141": picture("things_picturable-141", "🛤️", "铁路轨道", "图中有钢轨，对应 rail；这里画的是铁路钢轨。"),
  "things_picturable-142": picture("things_picturable-142", "🐀", "老鼠", "图中是大鼠，对应 rat。"),
  "things_picturable-143": picture("things_picturable-143", "🧾", "收据", "图中是收据，对应 receipt。"),
  "things_picturable-144": picture("things_picturable-144", "💍", "戒指", "图中是戒指，对应 ring。"),
  "things_picturable-145": picture("things_picturable-145", "🎣", "钓鱼竿", "图中是钓鱼竿，是 rod 的一种。"),
  "things_picturable-146": picture("things_picturable-146", "🏠", "有屋顶的房子", "联想提示：房子顶部是 roof；图中画的是整座房子。", "approximate"),
  "things_picturable-148": picture("things_picturable-148", "⛵", "扬帆的小船", "联想提示：船上张开的帆帮助记住 sail；图中不是单独的帆。", "approximate"),
  "things_picturable-149": picture("things_picturable-149", "🏫", "学校建筑", "图中是学校，对应 school。"),
  "things_picturable-150": picture("things_picturable-150", "✂️", "剪刀", "图中是剪刀，对应 scissors。"),
  "things_picturable-152": picture("things_picturable-152", "🌱", "刚发芽的幼苗", "联想提示：种子发芽后长成幼苗，帮助记住 seed；图中主要是幼苗。", "approximate"),
  "things_picturable-153": picture("things_picturable-153", "🐑", "绵羊", "图中是羊，对应 sheep。"),
  "things_picturable-155": picture("things_picturable-155", "🚢", "轮船", "图中是船，对应 ship。"),
  "things_picturable-156": picture("things_picturable-156", "👕", "T恤衫", "图中是衬衫的一种，对应 shirt。"),
  "things_picturable-157": picture("things_picturable-157", "👟", "运动鞋", "图中是鞋，对应 shoe。"),
  "things_picturable-159": picture("things_picturable-159", "👗", "带裙摆的连衣裙", "联想提示：连衣裙的下半部分像 skirt；图中不是单独的半身裙。", "approximate"),
  "things_picturable-160": picture("things_picturable-160", "🐍", "蛇", "图中是蛇，对应 snake。"),
  "things_picturable-161": picture("things_picturable-161", "🧦", "短袜", "图中是袜子，对应 sock。"),
  "things_picturable-162": picture("things_picturable-162", "🪏", "铲子", "图中是铲子，对应 spade。"),
  "things_picturable-163": picture("things_picturable-163", "🧽", "海绵", "图中是海绵，对应 sponge。"),
  "things_picturable-164": picture("things_picturable-164", "🥄", "勺子", "图中是勺子，对应 spoon。"),
  "things_picturable-165": picture("things_picturable-165", "🌸", "春日花朵", "联想提示：春天常见花朵，帮助记住 spring 的春季义；图中不表示弹簧或泉水。", "approximate"),
  "things_picturable-166": picture("things_picturable-166", "⬜", "白色正方形", "图中是正方形，对应 square。"),
  "things_picturable-168": picture("things_picturable-168", "⭐", "星星", "图中是星星，对应 star。"),
  "things_picturable-169": picture("things_picturable-169", "🚉", "火车站", "图中是车站，对应 station；这里画的是火车站。"),
  "things_picturable-170": picture("things_picturable-170", "🌷", "带茎的花", "联想提示：花朵下面的茎帮助记住 stem；图中不是单独的茎。", "approximate"),
  "things_picturable-171": picture("things_picturable-171", "🏒", "冰球杆", "图中是球杆，是 stick 的一种。"),
  "things_picturable-172": picture("things_picturable-172", "🧦", "袜子", "联想提示：stocking 是较长的袜子；图中是普通短袜，只作近似提示。", "approximate"),
  "things_picturable-174": picture("things_picturable-174", "🏬", "商店", "图中是商店，对应 store。"),
  "things_picturable-175": picture("things_picturable-175", "🛣️", "道路", "联想提示：道路画面帮助记住 street；road 和 street 并不完全相同。", "approximate"),
  "things_picturable-176": picture("things_picturable-176", "☀️", "太阳", "图中是太阳，对应 sun。"),
  "things_picturable-178": picture("things_picturable-178", "🦂", "翘起尾巴的蝎子", "联想提示：蝎子后部明显的尾巴帮助记住 tail；图中不是单独的尾巴。", "approximate"),
  "things_picturable-179": picture("things_picturable-179", "🧵", "线轴", "图中是线，对应 thread。"),
  "things_picturable-181": picture("things_picturable-181", "👍", "竖起的拇指", "图中是拇指，对应 thumb。"),
  "things_picturable-182": picture("things_picturable-182", "🎫", "票券", "图中是票，对应 ticket。"),
  "things_picturable-183": picture("things_picturable-183", "🦶", "露出脚趾的脚", "联想提示：脚前端的脚趾帮助记住 toe；图标表示整只脚。", "approximate"),
  "things_picturable-184": picture("things_picturable-184", "👅", "舌头", "图中是舌头，对应 tongue。"),
  "things_picturable-185": picture("things_picturable-185", "🦷", "牙齿", "图中是牙齿，对应 tooth。"),
  "things_picturable-186": picture("things_picturable-186", "🏘️", "一组房屋", "图中是一组房屋，对应 town。"),
  "things_picturable-187": picture("things_picturable-187", "🚆", "火车", "图中是火车，对应 train。"),
  "things_picturable-189": picture("things_picturable-189", "🌳", "树", "图中是树，对应 tree。"),
  "things_picturable-190": picture("things_picturable-190", "👖", "长裤", "图中是长裤，对应 trousers。"),
  "things_picturable-191": picture("things_picturable-191", "☂️", "雨伞", "图中是伞，对应 umbrella。"),
  "things_picturable-192": picture("things_picturable-192", "🧱", "一段砖墙", "联想提示：砖块排列让人想到墙，帮助记住 wall；图标也可表示砖块。", "approximate"),
  "things_picturable-193": picture("things_picturable-193", "⌚", "手表", "图中是手表，对应 watch 的名词义。"),
  "things_picturable-194": picture("things_picturable-194", "🛞", "车轮", "图中是轮子，对应 wheel。"),
  "things_picturable-197": picture("things_picturable-197", "🪟", "窗户", "图中是窗户，对应 window。"),
  "things_picturable-198": picture("things_picturable-198", "🪽", "翅膀", "图中是翅膀，对应 wing。"),
  "things_picturable-199": picture("things_picturable-199", "🔌", "带电线的插头", "联想提示：插头后面的电线帮助记住 wire；图中主要是插头和电源线。", "approximate"),
  "things_picturable-200": picture("things_picturable-200", "🪱", "蠕虫", "图中是蠕虫，对应 worm。"),

  // A conservative second pass: concrete nouns from `things_general` with clear visuals.
  "things_general-010": picture("things_general-010", "🐾", "动物的爪印", "联想提示：爪印让人想到动物，只帮助记住 animal；图中没有画出具体动物。", "approximate"),
  "things_general-033": picture("things_general-033", "🍞", "面包", "图中是面包，对应 bread。"),
  "things_general-036": picture("things_general-036", "🏢", "建筑物", "图中是建筑物，对应 building。"),
  "things_general-040": picture("things_general-040", "🧈", "黄油", "图中是黄油，对应 butter。"),
  "things_general-044": picture("things_general-044", "🖍️", "蜡笔", "联想提示：蜡笔与粉笔都是棒状书写工具，帮助记住 chalk；图中是蜡笔，不是粉笔。", "approximate"),
  "things_general-047": picture("things_general-047", "🧣", "布制围巾", "联想提示：围巾由布料制成，帮助记住 cloth；图中是布制品，不是单独一块布。", "approximate"),
  "things_general-124": picture("things_general-124", "🌷", "花", "图中是花，对应 flower。"),
  "things_general-131": picture("things_general-131", "🍎", "作为水果的苹果", "图中苹果是 fruit 的一种。"),
  "things_general-136": picture("things_general-136", "🌱", "绿色幼苗", "联想提示：绿色幼苗帮助联想到草，记住 grass；图中不是一丛草。", "approximate"),
  "things_general-152": picture("things_general-152", "🧊", "冰块", "图中是冰，对应 ice。"),
  "things_general-158": picture("things_general-158", "🐞", "瓢虫", "图中是昆虫的一种，对应 insect。"),
  "things_general-198": picture("things_general-198", "🥩", "一块肉", "图中是肉，对应 meat。"),
  "things_general-203": picture("things_general-203", "🥛", "一杯牛奶", "图中是牛奶，对应 milk。"),
  "things_general-213": picture("things_general-213", "🏔️", "雪山", "图中是山，对应 mountain。"),
  "things_general-236": picture("things_general-236", "📄", "一张纸", "图中是纸，对应 paper。"),
  "things_general-243": picture("things_general-243", "🪴", "盆栽植物", "图中是植物，对应 plant 的植物义。"),
  "things_general-267": picture("things_general-267", "🌧️", "云下落雨", "图中是雨，对应 rain。"),
  "things_general-284": picture("things_general-284", "🍚", "一碗米饭", "图中是米饭，对应 rice。"),
  "things_general-285": picture("things_general-285", "🏞️", "有河流的风景", "联想提示：风景中的水道帮助记住 river；不同平台的图标细节可能不同。", "approximate"),
  "things_general-286": picture("things_general-286", "🛣️", "道路", "图中是道路，对应 road。"),
  "things_general-296": picture("things_general-296", "🌊", "海浪", "图中海浪代表海，对应 sea。"),
  "things_general-324": picture("things_general-324", "🧼", "肥皂", "图中是肥皂，对应 soap。"),
  "things_general-339": picture("things_general-339", "🪨", "石头", "图中是石头，对应 stone。"),
  "things_general-383": picture("things_general-383", "💧", "一滴水", "图中是水，对应 water。"),
  "things_general-394": picture("things_general-394", "🪵", "木头", "图中是木材，对应 wood。"),
  "things_general-395": picture("things_general-395", "🧶", "毛线团", "联想提示：毛线常由羊毛制成，帮助记住 wool；图中材料不一定都是羊毛。", "approximate"),
});

const PICTURABLE_WORD_COUNT = 200;
const mappedPictures = Object.values(wordPictures);
const mappedPicturablePictures = mappedPictures.filter(({ wordId }) =>
  wordId.startsWith("things_picturable-"),
);
const mappedGeneralPictures = mappedPictures.filter(({ wordId }) => wordId.startsWith("things_general-"));

/** Word IDs intentionally left without a picture rather than assigning a misleading icon. */
export const unmappedPicturableWordIds = Object.freeze(
  Array.from(
    { length: PICTURABLE_WORD_COUNT },
    (_, index) => `things_picturable-${String(index + 1).padStart(3, "0")}`,
  ).filter((wordId) => !(wordId in wordPictures)),
);

export const wordPictureStats = Object.freeze({
  scopeCategoryId: "things_picturable",
  scopeWordCount: PICTURABLE_WORD_COUNT,
  mappedCount: mappedPicturablePictures.length,
  exactCount: mappedPicturablePictures.filter(({ fidelity }) => fidelity === "exact").length,
  approximateCount: mappedPicturablePictures.filter(({ fidelity }) => fidelity === "approximate").length,
  omittedCount: unmappedPicturableWordIds.length,
  coveragePercent: Number(((mappedPicturablePictures.length / PICTURABLE_WORD_COUNT) * 100).toFixed(1)),
  additionalGeneralCount: mappedGeneralPictures.length,
  totalMappedCount: mappedPictures.length,
  totalExactCount: mappedPictures.filter(({ fidelity }) => fidelity === "exact").length,
  totalApproximateCount: mappedPictures.filter(({ fidelity }) => fidelity === "approximate").length,
});
