#!/usr/bin/env python3
"""Build the Basic English learning-card dataset.

The canonical Ogden list is the only authority for membership, spelling, order,
and categories.  Lexical fields are enriched from open sources and retain
field-level provenance.  Automatic selection is deliberately labelled as
``mixed``; any generated fallback makes the record ``draft``.

This script uses only the Python standard library.  Network responses are
cached under ``site/scripts/cache`` so a later run can be fully offline:

    python scripts/build_words.py
    python scripts/build_words.py --offline

Outputs:
    public/data/words.json
    public/data/validation-report.json
    public/data/sources.json
"""

from __future__ import annotations

import argparse
import concurrent.futures
import csv
import hashlib
import io
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SCRIPT_DIR = Path(__file__).resolve().parent
SITE_DIR = SCRIPT_DIR.parent
PROJECT_DIR = SITE_DIR.parent
CANONICAL_PATH = PROJECT_DIR / "tmp" / "pdfs" / "ogden-850-canonical.json"
OUTPUT_DIR = SITE_DIR / "public" / "data"
CACHE_DIR = SCRIPT_DIR / "cache"

DICTIONARY_CACHE = CACHE_DIR / "dictionaryapi-subset.json"
TATOEBA_CACHE = CACHE_DIR / "tatoeba-subset.json"
ECDICT_CACHE = CACHE_DIR / "ecdict-subset.json"
CMUDICT_CACHE = CACHE_DIR / "cmudict-subset.json"

DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
TATOEBA_API = "https://api.tatoeba.org/v1/sentences"
ECDICT_URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
CMUDICT_URL = "https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict"

EXPECTED_COUNTS = {
    "operations": 100,
    "things_general": 400,
    "things_picturable": 200,
    "qualities_general": 100,
    "qualities_opposites": 50,
}

BASIC_LEMMAS: set[str] = set()

CATEGORY_ZH = {
    "operations": "操作词",
    "things_general": "普通事物",
    "things_picturable": "可描绘事物",
    "qualities_general": "一般性质",
    "qualities_opposites": "相对性质",
}

# The source PDF's labels, preserved separately from reader-facing labels.
CATEGORY_EN = {
    "operations": "Operations and function words",
    "things_general": "General things",
    "things_picturable": "Picturable things",
    "qualities_general": "General qualities",
    "qualities_opposites": "Opposite qualities",
}

SOURCE_CATALOGUE = [
    {
        "id": "ogden_pdf_snapshot",
        "title": "850 Basic Words: Grouped and Listed by C. K. Ogden",
        "role": "Canonical membership, source order, category and spelling",
        "local_file": "pdfcoffee.com-850-basic-words-grouped-and-listed-by-c-k-ogden.pdf",
        "sha256": "ed4e0e7551f49dbb133a6446018dfaf787a8fb2b4cf1f9cea71e1889c7b80cc7",
        "note": "Two-page browser-generated snapshot; not represented as an original Ogden book scan.",
    },
    {
        "id": "free_dictionary_api",
        "title": "Free Dictionary API (English entries derived from Wiktionary)",
        "url": "https://dictionaryapi.dev/",
        "data_url_template": DICTIONARY_API,
        "license": "Entry responses declare CC BY-SA 3.0; individual audio files may use their own declared licence.",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "role": "English part of speech, definitions, synonyms and IPA candidates",
    },
    {
        "id": "ecdict",
        "title": "ECDICT free English-Chinese dictionary database",
        "url": "https://github.com/skywind3000/ECDICT",
        "data_url": ECDICT_URL,
        "license": "MIT",
        "license_url": "https://github.com/skywind3000/ECDICT/blob/master/LICENSE",
        "role": "Concise Chinese meanings, POS evidence and UK-oriented IPA candidates",
    },
    {
        "id": "cmudict",
        "title": "CMU Pronouncing Dictionary",
        "url": "https://github.com/cmusphinx/cmudict",
        "data_url": CMUDICT_URL,
        "license": "BSD-style CMUdict licence",
        "license_url": "https://github.com/cmusphinx/cmudict/blob/master/LICENSE",
        "role": "North American pronunciation fallback, converted deterministically from ARPAbet to IPA",
    },
    {
        "id": "tatoeba",
        "title": "Tatoeba sentence and translation corpus",
        "url": "https://tatoeba.org/",
        "data_url": "https://api.tatoeba.org/v1/sentences",
        "license": "Per-sentence licence and owner are retained; selected records currently use CC BY 2.0 FR or CC0 1.0.",
        "license_url": "https://tatoeba.org/en/terms_of_use",
        "role": "Short English examples with directly linked Mandarin Chinese translations",
    },
    {
        "id": "editorial_fallback",
        "title": "Project-authored deterministic fallback text",
        "role": "Fills required fields only when an open lexical source has no usable value",
        "license": "Project content",
        "note": "Fallbacks are never represented as sourced dictionary facts and force editorial_status=draft.",
    },
]

# Unsafe or unsuitable senses/sentences are excluded from automatic selection.
SENSITIVE_RE = re.compile(
    r"\b(?:sex|sexual|sexually|semen|ejaculat|orgasm|penis|vagina|vulgar|slang|"
    r"prostitut|porn|racial slur|offensive|obsolete|archaic)\b",
    re.IGNORECASE,
)

UNHELPFUL_DEFINITION_RE = re.compile(
    r"^(?:alternative (?:form|spelling) of|misspelling of|obsolete form of|"
    r"synonym of|a surname|a given name|initialism of|abbreviation of)",
    re.IGNORECASE,
)

POS_NAMES = {
    "n": "noun",
    "v": "verb",
    "vt": "verb",
    "vi": "verb",
    "aux": "auxiliary verb",
    "adj": "adjective",
    "adv": "adverb",
    "prep": "preposition",
    "conj": "conjunction",
    "pron": "pronoun",
    "art": "article",
    "num": "number",
    "int": "interjection",
    "det": "determiner",
}

OPERATIONS_POS: dict[str, list[str]] = {
    **{word: ["verb"] for word in "come get give go keep let make put seem take be do have say see send".split()},
    "may": ["modal verb"],
    "will": ["modal verb"],
    **{word: ["preposition", "adverb"] for word in "about across after against among at before between by down from in off on over through to under up with".split()},
    "as": ["conjunction", "preposition"],
    "for": ["preposition", "conjunction"],
    "of": ["preposition"],
    "till": ["preposition", "conjunction"],
    "than": ["conjunction", "preposition"],
    "a": ["article"],
    "the": ["article"],
    **{word: ["determiner", "pronoun"] for word in "all any much some that this".split()},
    **{word: ["determiner"] for word in "every no other such".split()},
    "little": ["determiner", "adjective"],
    "i": ["pronoun"],
    "he": ["pronoun"],
    "you": ["pronoun"],
    "who": ["pronoun"],
    **{word: ["conjunction"] for word in "and because but or if though while".split()},
    **{word: ["adverb"] for word in "how when where why again ever far forward here near now out still then there together well almost enough even not only quite so very tomorrow yesterday".split()},
    **{word: ["noun", "adverb"] for word in "north south east west".split()},
    "please": ["adverb", "interjection"],
    "yes": ["interjection"],
}

# These 100 source-list function words need examples that demonstrate the word,
# not generic noun/adjective templates.  They are project-authored and therefore
# marked as editorial fallback if Tatoeba has no usable bilingual pair.
OPERATION_EXAMPLES: dict[str, tuple[str, str]] = {
    "come": ("Please come here.", "请到这里来。"),
    "get": ("I get a new book.", "我得到一本新书。"),
    "give": ("Please give me some water.", "请给我一些水。"),
    "go": ("We go to school.", "我们去学校。"),
    "keep": ("Keep the door open.", "让门保持开着。"),
    "let": ("Let me help you.", "让我来帮你。"),
    "make": ("We make bread at home.", "我们在家做面包。"),
    "put": ("Put the cup here.", "把杯子放在这里。"),
    "seem": ("You seem very happy.", "你看起来很开心。"),
    "take": ("Take this book with you.", "把这本书带上。"),
    "be": ("Be kind to others.", "要善待他人。"),
    "do": ("I do my work now.", "我现在做我的工作。"),
    "have": ("We have enough time.", "我们有足够的时间。"),
    "say": ("Please say your name.", "请说出你的名字。"),
    "see": ("I can see the moon.", "我能看见月亮。"),
    "send": ("Please send me the picture.", "请把图片发给我。"),
    "may": ("It may rain today.", "今天可能会下雨。"),
    "will": ("I will help you.", "我会帮助你。"),
    "about": ("This book is about animals.", "这本书是关于动物的。"),
    "across": ("We walked across the road.", "我们走过了马路。"),
    "after": ("We play after school.", "我们放学后玩。"),
    "against": ("The chair is against the wall.", "椅子靠着墙。"),
    "among": ("She sat among her friends.", "她坐在朋友们中间。"),
    "at": ("Meet me at the door.", "在门口和我见面。"),
    "before": ("Wash your hands before dinner.", "晚饭前要洗手。"),
    "between": ("The ball is between the boxes.", "球在两个盒子之间。"),
    "by": ("The lamp is by the bed.", "灯在床边。"),
    "down": ("Please sit down.", "请坐下。"),
    "from": ("This letter is from my friend.", "这封信来自我的朋友。"),
    "in": ("The keys are in my bag.", "钥匙在我的包里。"),
    "off": ("Please turn the light off.", "请把灯关掉。"),
    "on": ("The book is on the table.", "书在桌上。"),
    "over": ("The bird flew over the house.", "鸟从房子上方飞过。"),
    "through": ("Light came through the window.", "光从窗户照了进来。"),
    "to": ("I walk to school.", "我步行去学校。"),
    "under": ("The cat is under the chair.", "猫在椅子下面。"),
    "up": ("Please stand up.", "请站起来。"),
    "with": ("I live with my family.", "我和家人住在一起。"),
    "as": ("Use this box as a table.", "把这个箱子当作桌子用。"),
    "for": ("This gift is for you.", "这份礼物是给你的。"),
    "of": ("I need a cup of water.", "我需要一杯水。"),
    "till": ("Wait here till noon.", "在这里等到中午。"),
    "than": ("My bag is bigger than yours.", "我的包比你的大。"),
    "a": ("I can see a bird.", "我能看见一只鸟。"),
    "the": ("Please close the door.", "请把门关上。"),
    "all": ("All the children are here.", "所有孩子都在这里。"),
    "any": ("Do you have any questions?", "你有任何问题吗？"),
    "every": ("I read every day.", "我每天都读书。"),
    "little": ("We have little time.", "我们的时间不多。"),
    "much": ("We do not have much water.", "我们的水不多。"),
    "no": ("There is no milk left.", "没有牛奶了。"),
    "other": ("Where is the other shoe?", "另一只鞋在哪里？"),
    "some": ("I need some help.", "我需要一些帮助。"),
    "such": ("I have never seen such a view.", "我从未见过这样的景色。"),
    "that": ("That house is very old.", "那座房子很旧。"),
    "this": ("This book is mine.", "这本书是我的。"),
    "i": ("I am ready.", "我准备好了。"),
    "he": ("He is my brother.", "他是我的兄弟。"),
    "you": ("You are very kind.", "你很友善。"),
    "who": ("Who is at the door?", "谁在门口？"),
    "and": ("Tom and I are friends.", "汤姆和我是朋友。"),
    "because": ("I stayed home because it rained.", "因为下雨，我待在家里。"),
    "but": ("It is small but strong.", "它很小，但很结实。"),
    "or": ("Would you like tea or water?", "你想喝茶还是水？"),
    "if": ("Call me if you need help.", "如果你需要帮助，就给我打电话。"),
    "though": ("Though tired, she kept working.", "虽然累了，她仍继续工作。"),
    "while": ("Please wait while I cook.", "我做饭时请等一下。"),
    "how": ("How do you feel today?", "你今天感觉怎么样？"),
    "when": ("When will you come home?", "你什么时候回家？"),
    "where": ("Where is my book?", "我的书在哪里？"),
    "why": ("Why are you sad?", "你为什么难过？"),
    "again": ("Please say it again.", "请再说一遍。"),
    "ever": ("Have you ever seen snow?", "你见过雪吗？"),
    "far": ("The station is not far.", "车站不远。"),
    "forward": ("Please move forward.", "请向前走。"),
    "here": ("Your book is here.", "你的书在这里。"),
    "near": ("The school is near my home.", "学校在我家附近。"),
    "now": ("We can start now.", "我们现在可以开始了。"),
    "out": ("The children are playing out there.", "孩子们正在外面玩。"),
    "still": ("She is still asleep.", "她还在睡觉。"),
    "then": ("Finish your work, then rest.", "做完工作，然后休息。"),
    "there": ("Your bag is over there.", "你的包在那边。"),
    "together": ("Let us learn together.", "让我们一起学习。"),
    "well": ("You did very well.", "你做得很好。"),
    "almost": ("The work is almost finished.", "工作快完成了。"),
    "enough": ("We have enough food.", "我们有足够的食物。"),
    "even": ("Even a child can do it.", "连孩子也能做到。"),
    "not": ("I am not tired.", "我不累。"),
    "only": ("I have only one question.", "我只有一个问题。"),
    "quite": ("The room is quite warm.", "房间相当暖和。"),
    "so": ("The water is so cold.", "水太冷了。"),
    "very": ("This book is very good.", "这本书很好。"),
    "tomorrow": ("We will meet tomorrow.", "我们明天见。"),
    "yesterday": ("It rained yesterday.", "昨天下雨了。"),
    "north": ("They live north of the city.", "他们住在城北。"),
    "south": ("The birds fly south in winter.", "这些鸟冬天向南飞。"),
    "east": ("The sun rises in the east.", "太阳从东方升起。"),
    "west": ("The sun sets in the west.", "太阳从西方落下。"),
    "please": ("Please open the window.", "请打开窗户。"),
    "yes": ("Yes, I understand.", "是的，我明白。"),
}


def _parse_content_overrides(raw: str) -> dict[str, dict[str, str]]:
    output: dict[str, dict[str, str]] = {}
    for line in raw.strip().splitlines():
        word, meaning_zh, definition_en = line.split("\t", 2)
        output[word] = {"meaning_zh": meaning_zh, "definition_en": definition_en}
    return output


# The operations column is unusually polyfunctional.  Dictionary order is not
# a safe proxy for a beginner sense (for example, GET may begin with a sports
# noun and WILL with a lexical verb).  These short teaching glosses were checked
# one by one against the role of each word in the operations list.  They remain
# project-authored editorial content, so affected records are labelled draft.
OPERATION_CONTENT = _parse_content_overrides(
    """
come	来；到达	To move towards a person or place.
get	得到；获得；变得	To receive or obtain something; also, to become.
give	给；给予	To cause someone to receive something.
go	去；走	To move or travel to another place.
keep	保持；保存	To continue to have something or stay in a condition.
let	让；允许	To allow someone to do something.
make	制作；使	To create or produce something; also, to cause a result.
put	放；安置	To move something into a particular place or position.
seem	似乎；看起来	To appear to be a certain way.
take	拿；带走；花费	To carry or move something from one place; also, to require time.
be	是；存在	To say what someone or something is, or that it exists.
do	做；进行	To perform an action, activity, or piece of work.
have	有；拥有	To own, hold, or experience something.
say	说；表达	To express something in words.
see	看见；明白	To notice with your eyes; also, to understand.
send	发送；寄	To cause a message or object to go to someone or somewhere.
may	可能；可以	A modal verb used for possibility or permission.
will	将要；会	A modal verb used to talk about the future or willingness.
about	关于；大约	On the subject of something; also, approximately.
across	穿过；在对面	From one side to the other side.
after	在……之后	Later than a time or event.
against	反对；靠着	Opposing something, or touching and supported by it.
among	在……之中	In the middle of a group of people or things.
at	在；向	Used for a particular place, time, point, or direction.
before	在……之前	Earlier than a time or event.
between	在……之间	In the space or time separating two or more things.
by	在旁边；由；通过	Near something, or through the action or means of something.
down	向下	Towards a lower place or position.
from	从；来自	Used for a starting point, source, or origin.
in	在……里面	Inside a place, area, or period of time.
off	离开；关闭	Away from a place or surface; also, not operating.
on	在……上；开启	Touching or supported by a surface; also, operating.
over	在……上方；越过	Above something, or from one side to the other.
through	穿过；通过	From one side or end of something to the other.
to	到；向	Used for a direction, destination, or receiver.
under	在……下面	Below something or covered by it.
up	向上	Towards a higher place or position.
with	和；带有；用	Together with, having, or using something.
as	作为；像；当……时	Used to show a role, comparison, manner, or time.
for	为了；给；持续	Intended for someone, a purpose, or a period of time.
of	……的	Used to show a connection, part, amount, or belonging.
till	直到	Up to a particular time.
than	比	Used when comparing two people, things, or amounts.
a	一个	An article used before one non-specific singular countable noun.
the	这；那；该	An article used before a particular or already known noun.
all	所有；全部	The whole number or amount of people or things.
any	任何；一些	One or some, without saying exactly which or how much.
every	每个	Each member of a complete group.
little	少量的；小的	A small amount, or small in size.
much	许多	A large amount of something that is not counted separately.
no	没有；不	Not any; used to make a negative statement.
other	其他的；另一个	Different from, or additional to, the one mentioned.
some	一些	An amount or number that is not stated exactly.
such	这样的	Of the kind just mentioned or shown.
that	那个；那	Used to point to a person or thing farther away, or to introduce a clause.
this	这个；这	Used to point to a person or thing that is near.
i	我	The pronoun a speaker uses for themself.
he	他	A pronoun used for a male person already mentioned.
you	你；你们	The pronoun used for the person or people being addressed.
who	谁	A pronoun used to ask which person.
and	和；并且	Used to join words, phrases, or ideas.
because	因为	Used to give the reason for something.
but	但是	Used to introduce a contrasting idea.
or	或者	Used to show a choice or another possibility.
if	如果；是否	Used to introduce a condition or an uncertain possibility.
though	虽然；不过	Used to introduce an idea that contrasts with another.
while	当……时；然而	During the time that something happens; also, used for contrast.
how	怎样	Used to ask or explain the way something happens.
when	什么时候；当……时	Used to ask or say at what time something happens.
where	哪里	Used to ask or say in what place something is.
why	为什么	Used to ask or explain the reason for something.
again	再；又	One more time.
ever	曾经；任何时候	At any time.
far	远	At or to a great distance.
forward	向前	Towards the front or a later point.
here	这里	In or at the place of the speaker.
near	附近；接近	At a short distance from someone or something.
now	现在	At the present time.
out	向外；在外	Away from the inside of a place or thing.
still	仍然；静止地	Continuing up to the present time; also, without movement.
then	然后；那时	At the time mentioned, or next after something.
there	那里	In, at, or to a place that is not here.
together	一起	With one another or in one group.
well	好；很好地	In a good or satisfactory way.
almost	几乎	Very nearly, but not completely.
enough	足够	As much or as many as needed.
even	甚至	Used to include something surprising or unexpected.
not	不	Used to make a word, phrase, or sentence negative.
only	只；仅仅	No more than; no one or nothing except.
quite	相当；完全	To a fairly large degree, or completely in some uses.
so	如此；所以	To a stated degree or in this way; also, for that reason.
very	很；非常	To a high degree.
tomorrow	明天	The day after today.
yesterday	昨天	The day before today.
north	北；向北	The direction opposite south.
south	南；向南	The direction opposite north.
east	东；向东	The direction where the sun rises.
west	西；向西	The direction where the sun sets.
please	请	Used to make a request polite.
yes	是；对	Used to agree or give a positive answer.
"""
)

# Explicit beginner senses for words whose common meanings are easily displaced
# by a short technical, sporting, sexual, grammatical, or historical gloss.
HIGH_RISK_CONTENT = _parse_content_overrides(
    """
lead	铅；领先；领导	A soft, heavy metal; the word can also mean a position in front.
record	记录；档案；唱片	Stored information about something that happened.
mine	矿；矿井；地雷	A place where minerals are taken from the ground.
match	火柴；比赛	A small stick used to make a flame.
plane	飞机；平面	A vehicle with wings that flies through the air.
spring	春天；弹簧；泉	The season between winter and summer.
light	光；灯	The energy that lets us see things.
plant	植物；工厂	A living thing that usually grows in soil.
interest	兴趣；利息	A feeling of wanting to know or learn about something.
order	顺序；命令；订单	An instruction telling someone what to do.
point	点；要点；位置	An exact place or the main idea being discussed.
sex	性别	The biological category of being male or female.
right	正确的；右边的	Correct, true, or suitable.
good	好的；优良的	Having qualities that are wanted, useful, or kind.
present	现在的；在场的	Existing or happening now, or being in a place.
past	过去的	Belonging to a time before now.
left	左边的	On the side opposite right.
last	最后的；上一个	Coming after all others, or most recent.
orange	橙子；橙色	A round citrus fruit with orange-coloured skin.
fly	苍蝇	A small flying insect with two wings.
watch	手表	A small clock worn on the wrist.
train	火车	A line of railway vehicles that travel together.
letter	信；字母	A written message sent to someone.
note	笔记；便条	A short written record or message.
current	水流；电流	A steady movement of water, air, or electricity.
scale	刻度；比例；秤	A set of marks used for measuring, or a device for weighing.
porter	搬运工；门卫	A person whose job is carrying bags or goods.
polish	抛光；上光剂	A substance used to make a surface smooth and shiny.
produce	农产品	Food grown on farms, especially fruit and vegetables.
organ	器官；风琴	A part of the body that has a particular job.
capital	首都；资本	The main city of a country or region.
bank	银行；河岸	A business that keeps and lends money.
bat	球棒；蝙蝠	A piece of wood used to hit a ball in some games.
case	情况；盒；案件	A particular situation or example.
date	日期；约会	A particular day of a month or year.
mean	意思是；平均的	To express or represent an idea.
act	行为；行动	Something that a person does.
base	底部；基础	The lowest supporting part of something.
mass	大量；质量	A large amount or quantity of something.
rest	休息；剩余部分	A period when you stop working in order to relax.
run	跑；奔跑	An act or period of running.
vessel	容器；船	A container used to hold liquid; also, a large boat.
band	带；乐队	A long, narrow strip used to hold or mark something.
board	木板；板	A long, flat piece of wood or other hard material.
branch	树枝；分支	A part of a tree that grows out from its trunk.
brush	刷子	A tool with many short hairs or wires, used for cleaning or painting.
bulb	灯泡；球茎	The glass part of an electric light that produces light.
church	教堂	A building where Christians meet for worship.
knot	结	A fastening made by tying rope, string, or similar material.
line	线；直线	A long, thin mark on a surface.
nail	钉子；指甲	A thin pointed piece of metal used to join things.
pen	钢笔；笔	A tool that uses ink for writing or drawing.
receipt	收据	A paper or electronic record showing that money was received.
ring	戒指；环	A small circular piece of jewellery worn on a finger.
sponge	海绵	A soft material with many holes, used for washing or cleaning.
stamp	邮票；印章	A small piece of paper placed on a letter to pay for delivery.
whistle	哨子	A small object that makes a high sound when air is blown through it.
acid	酸的	Having a sour taste or containing acid.
material	物质的；材料的	Related to physical things rather than ideas.
bent	弯曲的	Not straight; curved or folded.
dear	昂贵的；亲爱的	Costing a lot of money; also, loved greatly.
female	雌性的；女性的	Describing a girl, woman, or female animal.
male	雄性的；男性的	Describing a boy, man, or male animal.
bird	鸟	An animal with feathers, wings, and a beak.
chest	胸部；箱子	The front part of the upper body, between the neck and stomach.
clear	清楚的；透明的	Easy to understand, see, or hear.
account	账户；说明；账目	A record of money kept by a bank; also, a description of an event.
addition	增加；加法	Something added; also, the act of adding numbers or things.
humour	幽默；幽默感	The quality of being funny or able to see what is funny.
metal	金属	A hard material such as iron, gold, or copper.
parcel	包裹	Something wrapped in paper and sent or carried.
angle	角；角度	The space between two lines or surfaces that meet.
knee	膝盖	The joint in the middle of the leg.
screw	螺丝；螺钉	A thin metal fastener with a spiral edge.
relation	关系；联系	A connection between people, things, or ideas.
system	系统；体系	A group of connected parts that work together.
same	相同的；同样的	Not different; exactly like another.
food	食物	Something that people or animals eat.
flame	火焰	A hot, bright stream of burning gas from a fire.
join	接合处；连接	A place or line where two things are connected.
regret	遗憾；后悔	A sad feeling about something that happened or something you did.
shake	摇动；震动	A quick movement from side to side or up and down.
fowl	家禽；禽鸟	A bird kept for meat or eggs, such as a chicken.
flat	平坦的	Level and smooth, without raised or lowered parts.
free	自由的；免费的	Able to act without control; also, costing no money.
hanging	悬挂的	Supported from above and not touching the ground.
open	开着的；开放的	Not closed or blocked.
red	红色的	Having the colour of blood or a ripe tomato.
waiting	等候的	Staying until someone comes or something happens.
green	绿色的	Having the colour of grass or leaves.
copper	铜	A reddish-brown metal used especially in electrical wire.
cough	咳嗽	A sudden push of air from the throat, often because you are ill.
growth	生长；增长	The process of becoming larger or developing.
iron	铁；熨斗	A strong metal used for tools and buildings.
silver	银	A shiny white-grey metal used for jewellery and coins.
theory	理论；学说	An idea or set of ideas that explains how or why something happens.
tin	锡；罐头	A soft, silver-coloured metal often used to protect other metals.
water	水	The clear liquid that people, animals, and plants need to live.
ant	蚂蚁	A small insect that lives in a large, organized group.
egg	蛋；卵	A round object laid by a bird, with a young animal or food inside.
worm	蠕虫；虫	A small, long, soft animal with no legs.
"""
)

HIGH_RISK_EXAMPLES: dict[str, tuple[str, str]] = {
    "lead": ("This pipe is made of lead.", "这根管子是铅制的。"),
    "record": ("Please keep a record of your work.", "请把你的工作记录下来。"),
    "mine": ("The miners work in the mine.", "矿工们在矿井里工作。"),
    "match": ("She lit the candle with a match.", "她用火柴点燃了蜡烛。"),
    "plane": ("The plane is in the sky.", "飞机在天空中。"),
    "spring": ("Flowers grow in spring.", "花在春天生长。"),
    "light": ("Please turn on the light.", "请把灯打开。"),
    "plant": ("This plant needs water.", "这株植物需要水。"),
    "interest": ("She has an interest in music.", "她对音乐感兴趣。"),
    "order": ("Please put the cards in order.", "请把卡片按顺序放好。"),
    "point": ("This is an important point.", "这是一个重要的要点。"),
    "sex": ("The form asks for age and sex.", "表格要求填写年龄和性别。"),
    "right": ("Your answer is right.", "你的答案是正确的。"),
    "good": ("This is a good idea.", "这是一个好主意。"),
    "present": ("The present situation is clear.", "目前的情况很清楚。"),
    "past": ("We learn from past mistakes.", "我们从过去的错误中学习。"),
    "left": ("Raise your left hand.", "举起你的左手。"),
    "last": ("This is the last page.", "这是最后一页。"),
    "orange": ("I ate an orange.", "我吃了一个橙子。"),
    "fly": ("A fly is on the window.", "窗户上有一只苍蝇。"),
    "watch": ("My watch says ten o'clock.", "我的手表显示十点。"),
    "train": ("The train arrives at noon.", "火车中午到达。"),
    "letter": ("I wrote a letter to my friend.", "我给朋友写了一封信。"),
    "note": ("She left a note on the table.", "她在桌上留了一张便条。"),
    "current": ("The river has a strong current.", "这条河的水流很急。"),
    "scale": ("Check your weight on the scale.", "在秤上量一下你的体重。"),
    "porter": ("The porter carried our bags.", "搬运工帮我们拿了行李。"),
    "polish": ("Use polish on your shoes.", "给你的鞋擦上光剂。"),
    "produce": ("The market sells fresh produce.", "市场出售新鲜农产品。"),
    "act": ("Helping her was a kind act.", "帮助她是一种善意的行为。"),
    "base": ("The lamp has a heavy base.", "这盏灯有一个很重的底座。"),
    "mass": ("A mass of clouds filled the sky.", "大片云布满了天空。"),
    "rest": ("You need a short rest.", "你需要短暂休息一下。"),
    "run": ("We went for a short run.", "我们去跑了一小会儿。"),
    "vessel": ("This vessel holds water.", "这个容器装水。"),
    "band": ("A red band goes around the box.", "盒子外绕着一条红带。"),
    "board": ("The shelf is made from one board.", "这个架子由一块木板制成。"),
    "branch": ("A bird sat on the branch.", "一只鸟停在树枝上。"),
    "brush": ("Use this brush to clean the floor.", "用这把刷子清洁地板。"),
    "bulb": ("The bulb gives a warm light.", "灯泡发出温暖的光。"),
    "church": ("The old church is near the river.", "那座老教堂在河边。"),
    "knot": ("Tie a knot in the rope.", "在绳子上打一个结。"),
    "line": ("Draw a straight line.", "画一条直线。"),
    "nail": ("Use a nail to fix the board.", "用钉子固定木板。"),
    "pen": ("Write your name with a pen.", "用笔写下你的名字。"),
    "receipt": ("Please keep the receipt.", "请保留收据。"),
    "ring": ("She wears a ring on her finger.", "她的手指上戴着一枚戒指。"),
    "sponge": ("Clean the cup with a sponge.", "用海绵清洗杯子。"),
    "stamp": ("Put a stamp on the letter.", "在信上贴一张邮票。"),
    "whistle": ("The coach blew a whistle.", "教练吹响了哨子。"),
    "acid": ("This fruit has an acid taste.", "这种水果有酸味。"),
    "material": ("We all have material needs.", "我们都有物质需求。"),
    "bent": ("The wire is bent.", "这根金属丝弯了。"),
    "dear": ("That coat is too dear for me.", "那件外套对我来说太贵了。"),
    "female": ("The female bird is brown.", "这只雌鸟是棕色的。"),
    "male": ("The male bird has a red head.", "这只雄鸟有红色的头。"),
    "bird": ("A bird is singing in the tree.", "一只鸟正在树上鸣叫。"),
    "chest": ("He held the book against his chest.", "他把书抱在胸前。"),
    "clear": ("Your answer is clear.", "你的回答很清楚。"),
    "account": ("I checked my bank account.", "我查看了我的银行账户。"),
    "addition": ("The new room is a useful addition.", "新房间是一个实用的新增部分。"),
    "humour": ("Her humour made us laugh.", "她的幽默逗笑了我们。"),
    "metal": ("This box is made of metal.", "这个盒子是金属制的。"),
    "parcel": ("A parcel arrived this morning.", "今天早上有一个包裹到了。"),
    "angle": ("These two lines meet at an angle.", "这两条线相交成一个角。"),
    "knee": ("He hurt his knee.", "他伤了膝盖。"),
    "screw": ("Turn the screw slowly.", "慢慢拧动螺丝。"),
    "relation": ("There is a clear relation between the two ideas.", "这两个想法之间有明显联系。"),
    "system": ("The system has three parts.", "这个系统有三个部分。"),
    "same": ("We have the same idea.", "我们有相同的想法。"),
    "food": ("We need food and water.", "我们需要食物和水。"),
    "flame": ("The candle has a small flame.", "蜡烛上有一小簇火焰。"),
    "join": ("The join between the two boards is strong.", "两块木板的接合处很牢固。"),
    "regret": ("I feel regret about my mistake.", "我为自己的错误感到后悔。"),
    "shake": ("The table gave a sudden shake.", "桌子突然晃动了一下。"),
    "fowl": ("The farmer keeps fowl for eggs.", "农场主饲养家禽取蛋。"),
    "flat": ("The road is flat here.", "这里的路很平坦。"),
    "free": ("This lesson is free.", "这节课是免费的。"),
    "hanging": ("A lamp is hanging above the table.", "一盏灯悬挂在桌子上方。"),
    "open": ("The window is open.", "窗户开着。"),
    "red": ("The apple is red.", "这个苹果是红色的。"),
    "waiting": ("Two people are waiting outside.", "两个人正在外面等候。"),
    "green": ("The leaves are green.", "叶子是绿色的。"),
    "copper": ("This wire is made of copper.", "这根电线是铜制的。"),
    "cough": ("He has a bad cough.", "他咳嗽得很厉害。"),
    "growth": ("The plant shows healthy growth.", "这株植物长势良好。"),
    "iron": ("The gate is made of iron.", "这扇门是铁制的。"),
    "silver": ("The ring is made of silver.", "这枚戒指是银制的。"),
    "theory": ("Her theory explains the change.", "她的理论解释了这一变化。"),
    "tin": ("The box is covered with tin.", "这个盒子表面覆有锡。"),
    "water": ("Please drink some water.", "请喝点水。"),
    "ant": ("An ant is carrying food.", "一只蚂蚁正在搬运食物。"),
    "egg": ("She cooked an egg.", "她煮了一个鸡蛋。"),
    "worm": ("A worm moved through the soil.", "一条虫子在土里爬动。"),
}

ARPABET_TO_IPA = {
    "AA": "ɑ", "AE": "æ", "AH": "ʌ", "AO": "ɔ", "AW": "aʊ", "AY": "aɪ",
    "B": "b", "CH": "tʃ", "D": "d", "DH": "ð", "EH": "ɛ", "ER": "ɝ",
    "EY": "eɪ", "F": "f", "G": "ɡ", "HH": "h", "IH": "ɪ", "IY": "i",
    "JH": "dʒ", "K": "k", "L": "l", "M": "m", "N": "n", "NG": "ŋ",
    "OW": "oʊ", "OY": "ɔɪ", "P": "p", "R": "ɹ", "S": "s", "SH": "ʃ",
    "T": "t", "TH": "θ", "UH": "ʊ", "UW": "u", "V": "v", "W": "w",
    "Y": "j", "Z": "z", "ZH": "ʒ",
}


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    path.write_text(payload, encoding="utf-8")


def request_bytes(url: str, timeout: int = 90, attempts: int = 4) -> bytes:
    headers = {
        "User-Agent": "Basic-English-Learning-Materials/1.0 (offline dataset builder)",
        "Accept": "application/json,text/plain,*/*",
    }
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(0.6 * (2**attempt))
    raise RuntimeError(f"Unable to retrieve {url}: {last_error}")


def request_json(url: str, timeout: int = 45) -> Any:
    try:
        return json.loads(request_bytes(url, timeout=timeout).decode("utf-8"))
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def fetch_dictionary_entry(word: str) -> tuple[str, Any]:
    url = DICTIONARY_API.format(word=urllib.parse.quote(word))
    try:
        return word, request_json(url)
    except Exception as error:  # recorded; one source failure must not abort the 850-word build
        return word, {"_error": str(error)}


def fetch_tatoeba_entry(word: str) -> tuple[str, Any]:
    params = [
        ("lang", "eng"),
        ("q", word),
        ("word_count", "3-12"),
        ("is_unapproved", "no"),
        ("trans:lang", "cmn"),
        ("trans:is_direct", "yes"),
        ("trans:is_unapproved", "no"),
        ("sort", "words"),
        ("limit", "30"),
        ("showtrans", "matching"),
    ]
    url = TATOEBA_API + "?" + urllib.parse.urlencode(params)
    try:
        return word, request_json(url)
    except Exception as error:
        return word, {"_error": str(error)}


def fetch_parallel(
    words: list[str],
    cache_path: Path,
    fetcher: Any,
    workers: int,
    offline: bool,
    label: str,
) -> dict[str, Any]:
    cache: dict[str, Any] = read_json(cache_path, {})
    missing = [word for word in words if word not in cache or "_error" in (cache.get(word) or {})]
    if offline:
        print(f"{label}: offline; {len(cache)} cached, {len(missing)} missing", flush=True)
        return cache
    print(f"{label}: {len(cache)} cached, fetching {len(missing)}", flush=True)
    if not missing:
        return cache
    completed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetcher, word): word for word in missing}
        for future in concurrent.futures.as_completed(futures):
            word, value = future.result()
            cache[word] = value
            completed += 1
            if completed % 50 == 0 or completed == len(missing):
                write_json(cache_path, cache)
                print(f"{label}: fetched {completed}/{len(missing)}", flush=True)
    write_json(cache_path, cache)
    return cache


def fetch_ecdict_subset(words: list[str], offline: bool) -> dict[str, Any]:
    cache: dict[str, Any] = read_json(ECDICT_CACHE, {})
    missing = set(words).difference(cache)
    if not missing or offline:
        print(f"ECDICT: {len(cache)} cached, {len(missing)} missing", flush=True)
        return cache

    print("ECDICT: streaming the open CSV and keeping only the 850 target rows", flush=True)
    # Do not materialise the roughly 65 MB upstream CSV.  Besides keeping this
    # pipeline bounded, breaking once every target has been seen avoids treating
    # a late connection close as loss of one of our selected rows.
    request = urllib.request.Request(
        ECDICT_URL,
        headers={"User-Agent": "Basic-English-Learning-Materials/1.0", "Accept": "text/csv,*/*"},
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        stream = io.TextIOWrapper(response, encoding="utf-8-sig", errors="replace", newline="")
        reader = csv.DictReader(stream)
        for row in reader:
            key = (row.get("word") or "").strip().casefold()
            if key in missing:
                cache[key] = {
                    "word": row.get("word", ""),
                    "phonetic": row.get("phonetic", ""),
                    "definition": row.get("definition", ""),
                    "translation": row.get("translation", ""),
                    "pos": row.get("pos", ""),
                }
                missing.remove(key)
                if not missing:
                    break
    write_json(ECDICT_CACHE, cache)
    print(f"ECDICT: retained {len(cache)} rows; {len(missing)} target words not found", flush=True)
    return cache


def fetch_cmudict_subset(words: list[str], offline: bool) -> dict[str, Any]:
    cache: dict[str, Any] = read_json(CMUDICT_CACHE, {})
    missing = set(words).difference(cache)
    if not missing or offline:
        print(f"CMUdict: {len(cache)} cached, {len(missing)} missing", flush=True)
        return cache
    print("CMUdict: retrieving pronunciation dictionary", flush=True)
    text = request_bytes(CMUDICT_URL, timeout=120).decode("utf-8", errors="replace")
    for line in text.splitlines():
        if not line or line.startswith(";;;"):
            continue
        try:
            head, phones = line.split(" ", 1)
        except ValueError:
            continue
        base = re.sub(r"\(\d+\)$", "", head).casefold()
        if base in missing and base not in cache:
            cache[base] = phones.strip().split()
    write_json(CMUDICT_CACHE, cache)
    print(f"CMUdict: retained {len(cache)} pronunciations", flush=True)
    return cache


def strip_ipa(value: str) -> str:
    value = unicodedata.normalize("NFC", value or "").strip()
    return value.strip("/[] ")


def arpabet_to_ipa(phones: Iterable[str]) -> str:
    pieces: list[str] = []
    for phone in phones:
        match = re.fullmatch(r"([A-Z]+)([012])?", phone)
        if not match:
            continue
        base, stress = match.groups()
        ipa = ARPABET_TO_IPA.get(base, "")
        if not ipa:
            continue
        if stress == "1":
            ipa = "ˈ" + ipa
        elif stress == "2":
            ipa = "ˌ" + ipa
        elif base == "AH" and stress == "0":
            ipa = "ə"
        elif base == "ER" and stress == "0":
            ipa = "ɚ"
        pieces.append(ipa)
    return "".join(pieces)


def dictionary_entries(raw: Any, word: str) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    exact = [item for item in raw if str(item.get("word", "")).casefold() == word.casefold()]
    return exact or [item for item in raw if isinstance(item, dict)]


def select_pronunciations(
    word: str,
    dictionary_raw: Any,
    ecdict_row: dict[str, Any],
    cmu_phones: list[str] | None,
) -> tuple[dict[str, Any], bool]:
    candidates: list[tuple[str, str, str]] = []
    for entry in dictionary_entries(dictionary_raw, word):
        for item in entry.get("phonetics", []) or []:
            ipa = strip_ipa(str(item.get("text") or ""))
            if not ipa:
                continue
            audio = str(item.get("audio") or "").lower()
            region = "generic"
            if re.search(r"(?:-|/)(?:uk|gb)(?:-|\.|/)", audio):
                region = "uk"
            elif re.search(r"(?:-|/)(?:us)(?:-|\.|/)", audio):
                region = "us"
            elif "ɚ" in ipa or "ɝ" in ipa or ipa.endswith("r"):
                region = "us"
            elif "ə" in ipa and not ipa.endswith("r"):
                region = "uk"
            candidates.append((region, ipa, "free_dictionary_api"))
        top = strip_ipa(str(entry.get("phonetic") or ""))
        if top:
            candidates.append(("generic", top, "free_dictionary_api"))

    ecdict_ipa = strip_ipa(str(ecdict_row.get("phonetic") or ""))
    cmu_ipa = arpabet_to_ipa(cmu_phones or [])

    def first(region: str) -> tuple[str, str] | None:
        for candidate_region, ipa, source in candidates:
            if candidate_region == region:
                return ipa, source
        return None

    generic = first("generic")
    uk = first("uk")
    us = first("us")
    generated = False

    if not uk and ecdict_ipa:
        uk = (ecdict_ipa, "ecdict")
    if not uk and generic:
        uk = generic
    if not us and cmu_ipa:
        us = (cmu_ipa, "cmudict")
    if not us and generic:
        us = generic
    if not us and uk:
        us = uk
        generated = True
    if not uk and us:
        uk = us
        generated = True

    if not uk:
        uk = (word, "editorial_fallback")
        generated = True
    if not us:
        us = (word, "editorial_fallback")
        generated = True

    def pack(value: tuple[str, str], approximate: bool = False) -> dict[str, str]:
        ipa, source = value
        status = "generated" if source == "editorial_fallback" or approximate else "source_backed"
        return {"ipa": f"/{ipa}/", "source": source, "status": status}

    return {
        "uk": pack(uk, generated and uk == us and uk[1] != "editorial_fallback"),
        "us": pack(us, generated and uk == us and us[1] != "editorial_fallback"),
    }, generated


def parse_ecdict_pos(raw: str) -> list[str]:
    results: list[str] = []
    for key in re.findall(r"(?:^|/)([a-z]+)(?::\d+)?", raw or ""):
        name = POS_NAMES.get(key)
        if name and name not in results:
            results.append(name)
    return results


def preferred_pos(entry: dict[str, Any]) -> list[str]:
    category = entry["category_id"]
    word = entry["lemma"]
    if category == "operations":
        return OPERATIONS_POS.get(word, ["adverb"])
    if category.startswith("things_"):
        return ["noun"]
    return ["adjective"]


def select_pos(entry: dict[str, Any], ecdict_row: dict[str, Any], dictionary_raw: Any) -> list[str]:
    preferred = preferred_pos(entry)
    evidence = parse_ecdict_pos(str(ecdict_row.get("pos") or ""))
    for item in dictionary_entries(dictionary_raw, entry["lemma"]):
        for meaning in item.get("meanings", []) or []:
            pos = str(meaning.get("partOfSpeech") or "").strip().lower()
            if pos and pos not in evidence:
                evidence.append(pos)
    ordered: list[str] = []
    for pos in preferred + evidence:
        if pos and pos not in ordered:
            ordered.append(pos)
    return ordered[:3]


def normalize_definition(text: str) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    text = re.sub(r"^\([^)]{1,30}\)\s*", "", text)
    if text and text[-1] not in ".?!":
        text += "."
    return text


def definition_score(definition: str, index: int) -> tuple[int, int, int]:
    text = definition.strip()
    penalty = index * 2
    if len(text) < 18:
        penalty += 12
    if len(text) > 150:
        penalty += (len(text) - 150) // 4 + 15
    penalty += text.count(";") * 5 + text.count("(") * 3
    if UNHELPFUL_DEFINITION_RE.search(text):
        penalty += 100
    if SENSITIVE_RE.search(text):
        penalty += 200
    if re.search(r"\b(?:botany|zoology|chemistry|heraldry|nautical|joinery|law)\b", text, re.I):
        penalty += 20
    return penalty, abs(len(text) - 70), index


def select_definition(
    word: str,
    preferred: list[str],
    dictionary_raw: Any,
    ecdict_row: dict[str, Any],
) -> tuple[str, str, dict[str, Any] | None, bool]:
    meanings: list[dict[str, Any]] = []
    for entry in dictionary_entries(dictionary_raw, word):
        meanings.extend(entry.get("meanings", []) or [])
    target = {item.replace("modal verb", "verb").replace("auxiliary verb", "verb") for item in preferred}
    target.add(preferred[0].split()[0])
    candidates: list[tuple[tuple[int, int, int], str, dict[str, Any]]] = []
    index = 0
    for meaning in meanings:
        pos = str(meaning.get("partOfSpeech") or "").lower()
        if target and pos not in target:
            continue
        for definition in meaning.get("definitions", []) or []:
            text = str(definition.get("definition") or "").strip()
            if SENSITIVE_RE.search(text) or UNHELPFUL_DEFINITION_RE.search(text):
                continue
            normalized = normalize_definition(text)
            if normalized:
                candidates.append((definition_score(normalized, index), normalized, {"meaning": meaning, "definition": definition}))
                index += 1
    if not candidates:
        for meaning in meanings:
            for definition in meaning.get("definitions", []) or []:
                text = str(definition.get("definition") or "").strip()
                if SENSITIVE_RE.search(text) or UNHELPFUL_DEFINITION_RE.search(text):
                    continue
                normalized = normalize_definition(text)
                if normalized:
                    candidates.append((definition_score(normalized, index), normalized, {"meaning": meaning, "definition": definition}))
                    index += 1
    usable = [item for item in candidates if item[0][0] < 100]
    related_context = min(usable[:4], key=lambda item: item[0])[2] if usable else None

    raw_definition = str(ecdict_row.get("definition") or "").replace("\\n", "\n")
    ecdict_lines = [line.strip() for line in raw_definition.splitlines() if line.strip()]
    prefix_by_pos = {
        "noun": ("n.",), "verb": ("v.", "vt.", "vi."), "modal verb": ("v.", "aux."),
        "adjective": ("a.", "adj."), "adverb": ("ad.", "adv."),
        "preposition": ("prep.",), "conjunction": ("conj.",), "pronoun": ("pron.",),
        "determiner": ("det.", "a.", "pron."), "article": ("art.",),
    }
    wanted_prefixes = prefix_by_pos.get(preferred[0] if preferred else "", ())
    def has_wanted_prefix(line: str) -> bool:
        lowered = line.lower()
        return any(
            lowered.startswith(prefix) or lowered.startswith(prefix.rstrip(".") + " ")
            for prefix in wanted_prefixes
        )
    ecdict_candidates = [
        line for line in ecdict_lines
        if not wanted_prefixes or has_wanted_prefix(line)
    ]
    if ecdict_candidates:
        # ECDICT follows a WordNet-style frequency order.  For these very common
        # words, its first POS-matched sense is safer than choosing the shortest
        # gloss (which tends to surface slang or specialist senses).
        text = ecdict_candidates[0]
        text = re.sub(r"^(?:n|v|vt|vi|aux|a|adj|ad|adv|prep|conj|pron|det|art)(?:\.|\s)\s*", "", text, flags=re.I)
        text = normalize_definition(text)
        if text:
            text = text[0].upper() + text[1:]
        return text, "ecdict", related_context, False

    if usable:
        _, text, context = min(usable[:4], key=lambda item: item[0])
        return text, "free_dictionary_api", context, False

    pos = preferred[0] if preferred else "word"
    return f"A basic English {pos}; its exact sense depends on the sentence.", "editorial_fallback", None, True


def clean_chinese_segment(text: str) -> str:
    text = re.sub(r"\[[^\]]+\]", "", text)
    text = re.sub(r"\([^)]{0,50}\)", "", text)
    text = re.sub(r"（[^）]{0,50}）", "", text)
    text = re.sub(r"\s+", "", text)
    return text.strip("；;，,。 ")


def select_chinese_meaning(raw: str, preferred: list[str], word: str) -> tuple[str, str, bool]:
    raw = (raw or "").replace("\\n", "\n")
    lines = [line.strip() for line in raw.splitlines() if line.strip() and not line.startswith("[")]
    preferred_prefixes = {
        "noun": ("n.",), "verb": ("v.", "vt.", "vi."), "modal verb": ("aux.", "v."),
        "adjective": ("a.", "adj."), "adverb": ("ad.", "adv."), "preposition": ("prep.",),
        "conjunction": ("conj.",), "pronoun": ("pron.",), "determiner": ("det.", "adj.", "pron."),
        "article": ("art.",), "interjection": ("int.",),
    }
    prefixes = preferred_prefixes.get(preferred[0] if preferred else "", ())
    chosen = next((line for line in lines if line.lower().startswith(prefixes)), None) if prefixes else None
    chosen = chosen or (lines[0] if lines else "")
    chosen = re.sub(r"^(?:n|v|vt|vi|aux|a|adj|ad|adv|prep|conj|pron|det|art|int)\.\s*", "", chosen, flags=re.I)
    pieces: list[str] = []
    for piece in re.split(r"[；;，,]", chosen):
        cleaned = clean_chinese_segment(piece)
        if cleaned and cleaned not in pieces:
            pieces.append(cleaned)
        if len(pieces) == 3 or sum(map(len, pieces)) >= 24:
            break
    if pieces:
        return "；".join(pieces), "ecdict", False
    return f"{word}（释义待审）", "editorial_fallback", True


def select_related(context: dict[str, Any] | None, word: str) -> list[dict[str, str]]:
    if not context:
        return []
    meaning = context.get("meaning", {})
    definition = context.get("definition", {})
    candidates = list(definition.get("synonyms", []) or []) + list(meaning.get("synonyms", []) or [])
    output: list[dict[str, str]] = []
    seen = {word.casefold()}
    for candidate in candidates:
        value = re.sub(r"\s+", " ", str(candidate)).strip().lower()
        if not value or value.casefold() in seen or len(value) > 24 or not re.fullmatch(r"[a-z][a-z '-]*", value):
            continue
        # Keep related words inside the same audited 850-word learning universe.
        # This intentionally drops obscure thesaurus items such as "onefold".
        if BASIC_LEMMAS and value.casefold() not in BASIC_LEMMAS:
            continue
        if SENSITIVE_RE.search(value):
            continue
        output.append({"word": value, "relation": "synonym"})
        seen.add(value.casefold())
        if len(output) == 3:
            break
    return output


def contains_exact_word(sentence: str, word: str) -> bool:
    return bool(re.search(rf"(?<![A-Za-z]){re.escape(word)}(?![A-Za-z])", sentence, re.I))


def sentence_score(item: dict[str, Any], translation: dict[str, Any], word: str) -> tuple[int, int, int]:
    text = str(item.get("text") or "")
    zh = str(translation.get("text") or "")
    words = re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text)
    penalty = abs(len(words) - 6) * 2
    if translation.get("script") != "Hans":
        penalty += 25
    if item.get("owner") is None:
        penalty += 4
    if translation.get("owner") is None:
        penalty += 4
    if item.get("license") == "CC0 1.0":
        penalty -= 1
    if "," in text or ";" in text or ":" in text:
        penalty += 4
    if text.count(word) > 1:
        penalty += 2
    # Avoid auto-selecting sentences with likely proper names beyond sentence-initial capitalization.
    middle = " ".join(text.split()[1:])
    penalty += len(re.findall(r"\b[A-Z][a-z]+\b", middle)) * 5
    if len(zh) > 30:
        penalty += len(zh) - 30
    if SENSITIVE_RE.search(text) or SENSITIVE_RE.search(zh):
        penalty += 200
    return penalty, abs(len(words) - 6), int(item.get("id") or 0)


def select_tatoeba_example(raw: Any, word: str) -> tuple[dict[str, str], list[str], bool] | None:
    if not isinstance(raw, dict):
        return None
    candidates: list[tuple[tuple[int, int, int], dict[str, Any], dict[str, Any]]] = []
    for item in raw.get("data", []) or []:
        sentence = str(item.get("text") or "").strip()
        if not sentence or item.get("is_unapproved") or not contains_exact_word(sentence, word):
            continue
        if SENSITIVE_RE.search(sentence):
            continue
        for translation in item.get("translations", []) or []:
            if translation.get("lang") != "cmn" or translation.get("is_unapproved"):
                continue
            zh = str(translation.get("text") or "").strip()
            if not zh:
                continue
            candidates.append((sentence_score(item, translation, word), item, translation))
    if not candidates:
        return None
    _, item, translation = min(candidates, key=lambda value: value[0])
    source_tokens = [f"tatoeba:{item['id']}", f"tatoeba:{translation['id']}"]
    return {"en": item["text"], "zh": translation["text"]}, source_tokens, False


def generated_example(entry: dict[str, Any], meaning_zh: str) -> dict[str, str]:
    word = entry["lemma"]
    category = entry["category_id"]
    core_zh = meaning_zh.split("；", 1)[0].strip()
    if category == "operations" and word in OPERATION_EXAMPLES:
        en, zh = OPERATION_EXAMPLES[word]
        return {"en": en, "zh": zh}
    if word in HIGH_RISK_EXAMPLES:
        en, zh = HIGH_RISK_EXAMPLES[word]
        return {"en": en, "zh": zh}
    if category == "things_picturable":
        return {"en": f"I can see the {word}.", "zh": f"我能看到{core_zh}。"}
    if category == "things_general":
        return {"en": f"We talked about the {word}.", "zh": f"我们谈到了{core_zh}。"}
    core_zh = re.sub(r"的$", "", core_zh)
    return {"en": f"It is {word}.", "zh": f"它是{core_zh}的。"}


def build_word(
    entry: dict[str, Any],
    dictionary_raw: Any,
    tatoeba_raw: Any,
    ecdict_row: dict[str, Any],
    cmu_phones: list[str] | None,
) -> dict[str, Any]:
    word = entry["lemma"]
    pos = select_pos(entry, ecdict_row, dictionary_raw)
    teaching_pos = preferred_pos(entry)
    content_override = OPERATION_CONTENT.get(word) or HIGH_RISK_CONTENT.get(word)
    pronunciation, pronunciation_generated = select_pronunciations(word, dictionary_raw, ecdict_row, cmu_phones)
    if content_override:
        meaning_zh = content_override["meaning_zh"]
        meaning_source = "editorial_fallback"
        meaning_generated = True
        definition_en = content_override["definition_en"]
        definition_source = "editorial_fallback"
        definition_context = None
        definition_generated = True
    else:
        meaning_zh, meaning_source, meaning_generated = select_chinese_meaning(
            str(ecdict_row.get("translation") or ""), teaching_pos, word
        )
        definition_en, definition_source, definition_context, definition_generated = select_definition(
            word, teaching_pos, dictionary_raw, ecdict_row
        )
    related = select_related(definition_context, word)
    example_result = select_tatoeba_example(tatoeba_raw, word)
    if example_result:
        example, example_sources, example_generated = example_result
    else:
        example = generated_example(entry, meaning_zh)
        example_sources = ["editorial_fallback"]
        example_generated = True

    generated_any = pronunciation_generated or meaning_generated or definition_generated or example_generated
    lexical_sources = sorted(
        {
            pronunciation["uk"]["source"],
            pronunciation["us"]["source"],
            meaning_source,
            definition_source,
            *example_sources,
        }
        - {"editorial_fallback"}
    )
    editorial_sources = ["editorial_fallback"] if generated_any else []
    return {
        "id": entry["id"],
        "order": entry["global_source_order"],
        "category_id": entry["category_id"],
        "category_order": entry["category_order"],
        "category_label_en": CATEGORY_EN[entry["category_id"]],
        "category_label_zh": CATEGORY_ZH[entry["category_id"]],
        "word": word,
        "source_form": entry["source_form"],
        "pos": pos,
        "pronunciation": pronunciation,
        "meaning_zh": meaning_zh,
        "definition_en": definition_en,
        "example": example,
        "related": related,
        "editorial_status": "draft" if generated_any else "mixed",
        "sources": {
            "canonical": "ogden_pdf_snapshot",
            "lexical": lexical_sources,
            "editorial": editorial_sources,
            "fields": {
                "pronunciation_uk": pronunciation["uk"]["source"],
                "pronunciation_us": pronunciation["us"]["source"],
                "meaning_zh": meaning_source,
                "definition_en": definition_source,
                "example": example_sources,
                "related": "free_dictionary_api" if related else None,
            },
        },
    }


def validate(canonical: dict[str, Any], words: list[dict[str, Any]]) -> dict[str, Any]:
    category_counts = Counter(item["category_id"] for item in words)
    ids = [item["id"] for item in words]
    lemmas = [item["word"].casefold() for item in words]
    orders = [item["order"] for item in words]
    required_paths = {
        "word": lambda item: item.get("word"),
        "pos": lambda item: item.get("pos"),
        "uk_ipa": lambda item: item.get("pronunciation", {}).get("uk", {}).get("ipa"),
        "us_ipa": lambda item: item.get("pronunciation", {}).get("us", {}).get("ipa"),
        "meaning_zh": lambda item: item.get("meaning_zh"),
        "definition_en": lambda item: item.get("definition_en"),
        "example_en": lambda item: item.get("example", {}).get("en"),
        "example_zh": lambda item: item.get("example", {}).get("zh"),
    }
    completeness = {
        name: sum(1 for item in words if getter(item)) for name, getter in required_paths.items()
    }
    status_counts = Counter(item["editorial_status"] for item in words)
    source_field_counts: dict[str, Counter[str]] = {
        "uk_ipa": Counter(), "us_ipa": Counter(), "meaning_zh": Counter(),
        "definition_en": Counter(), "example": Counter(),
    }
    draft_ids: list[str] = []
    for item in words:
        field_sources = item["sources"]["fields"]
        source_field_counts["uk_ipa"][field_sources["pronunciation_uk"]] += 1
        source_field_counts["us_ipa"][field_sources["pronunciation_us"]] += 1
        source_field_counts["meaning_zh"][field_sources["meaning_zh"]] += 1
        source_field_counts["definition_en"][field_sources["definition_en"]] += 1
        example_source = field_sources["example"][0].split(":", 1)[0]
        source_field_counts["example"][example_source] += 1
        if item["editorial_status"] == "draft":
            draft_ids.append(item["id"])

    checks = {
        "total_is_850": len(words) == 850,
        "unique_ids_is_850": len(set(ids)) == 850,
        "unique_lemmas_is_850": len(set(lemmas)) == 850,
        "orders_are_1_through_850": orders == list(range(1, 851)),
        "category_counts_match": dict(category_counts) == EXPECTED_COUNTS,
        "source_order_preserved": [item["word"] for item in words]
        == [item["lemma"] for item in canonical["entries"]],
        "all_required_fields_present": all(count == 850 for count in completeness.values()),
        "related_terms_bounded_0_to_3": all(0 <= len(item["related"]) <= 3 for item in words),
        "source_spelling_preserved": all(
            item["word"] == source["lemma"] and item["source_form"] == source["source_form"]
            for item, source in zip(words, canonical["entries"], strict=True)
        ),
        "definitions_are_concise": all(len(item["definition_en"]) <= 160 for item in words),
        "no_placeholder_definitions": all(
            not item["definition_en"].startswith("A basic English") for item in words
        ),
    }
    return {
        "schema_version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "passed": all(checks.values()),
        "scope_note": "A passing report verifies structure, count, order and required-field presence. It is not a claim that automated lexical choices have completed human editorial review.",
        "checks": checks,
        "counts": {
            "total": len(words),
            "unique_ids": len(set(ids)),
            "unique_lemmas": len(set(lemmas)),
            "categories": dict(category_counts),
            "editorial_status": dict(status_counts),
        },
        "required_field_coverage": completeness,
        "source_coverage": {name: dict(values) for name, values in source_field_counts.items()},
        "draft_record_count": len(draft_ids),
        "draft_record_ids": draft_ids,
        "warnings": [
            "All records labelled mixed were assembled automatically from cited open sources and still need pedagogical review.",
            "Records labelled draft contain at least one deterministic editorial fallback.",
            "IPA entries can have multiple valid pronunciations; this dataset stores one UK and one US learning form.",
            "Chinese meanings are compacted automatically from ECDICT and may omit secondary senses.",
            "Tatoeba examples retain sentence IDs, owners and per-sentence licences through source tokens and the cache.",
        ],
    }


def source_coverage(words: list[dict[str, Any]]) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for item in words:
        for source in item["sources"]["lexical"]:
            counts[source.split(":", 1)[0]] += 1
        for source in item["sources"]["editorial"]:
            counts[source] += 1
    return dict(counts)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use only cached source subsets")
    parser.add_argument("--skip-dictionary-fetch", action="store_true", help="Do not refresh missing dictionary entries")
    parser.add_argument("--skip-tatoeba-fetch", action="store_true", help="Do not fetch missing bilingual examples")
    parser.add_argument("--dictionary-workers", type=int, default=12)
    parser.add_argument("--tatoeba-workers", type=int, default=6)
    args = parser.parse_args()

    canonical = read_json(CANONICAL_PATH, None)
    if not canonical:
        raise FileNotFoundError(f"Canonical input not found: {CANONICAL_PATH}")
    entries = canonical.get("entries", [])
    if len(entries) != 850:
        raise ValueError(f"Canonical list must contain 850 entries; got {len(entries)}")
    words = [entry["lemma"] for entry in entries]
    if len(set(words)) != 850:
        raise ValueError("Canonical lemmas are not unique")
    BASIC_LEMMAS.clear()
    BASIC_LEMMAS.update(word.casefold() for word in words)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    dictionary = fetch_parallel(
        words, DICTIONARY_CACHE, fetch_dictionary_entry,
        max(1, args.dictionary_workers), args.offline or args.skip_dictionary_fetch, "Dictionary API",
    )
    ecdict = fetch_ecdict_subset(words, args.offline)
    cmudict = fetch_cmudict_subset(words, args.offline)
    tatoeba = fetch_parallel(
        words, TATOEBA_CACHE, fetch_tatoeba_entry,
        max(1, args.tatoeba_workers), args.offline or args.skip_tatoeba_fetch, "Tatoeba",
    )

    records = [
        build_word(
            entry,
            dictionary.get(entry["lemma"]),
            tatoeba.get(entry["lemma"]),
            ecdict.get(entry["lemma"], {}),
            cmudict.get(entry["lemma"]),
        )
        for entry in entries
    ]
    report = validate(canonical, records)

    status_counts = Counter(record["editorial_status"] for record in records)
    dataset = {
        "meta": {
            "schema_version": "1.0.0",
            "generated_at": report["generated_at"],
            "canonical_source": "ogden_pdf_snapshot",
            "lexical_sources": [source["id"] for source in SOURCE_CATALOGUE[1:]],
            "total_entries": len(records),
            "category_counts": EXPECTED_COUNTS,
            "coverage": {
                "required_fields_complete": report["checks"]["all_required_fields_present"],
                "editorial_status": dict(status_counts),
                "source_usage_by_record": source_coverage(records),
            },
            "editorial_policy": (
                "Canonical membership/order/category/spelling come only from the audited PDF extraction. "
                "Lexical fields are selected automatically from cited open sources. 'mixed' means source-backed "
                "but not yet human-reviewed; 'draft' means at least one clearly marked project fallback was used."
            ),
            "validation_report": "/data/validation-report.json",
            "source_catalogue": "/data/sources.json",
        },
        "words": records,
    }
    write_json(OUTPUT_DIR / "words.json", dataset)
    write_json(OUTPUT_DIR / "validation-report.json", report)
    write_json(
        OUTPUT_DIR / "sources.json",
        {
            "generated_at": report["generated_at"],
            "sources": SOURCE_CATALOGUE,
            "attribution_note": (
                "For Tatoeba-backed examples, tokens in each word's sources.lexical identify both the English "
                "sentence and Mandarin translation. Full owner/licence fields are retained in the local source cache."
            ),
            "excluded_reference": {
                "url": "https://github.com/HANXU2018/BASIC-ENGLISH-VOCABULARY",
                "reason": "Reference repository had no detected licence, so its vocabulary-table content was not copied into this dataset.",
            },
        },
    )
    print(json.dumps({
        "output": str(OUTPUT_DIR / "words.json"),
        "passed": report["passed"],
        "counts": report["counts"],
        "source_coverage": report["source_coverage"],
    }, ensure_ascii=False, indent=2), flush=True)
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
