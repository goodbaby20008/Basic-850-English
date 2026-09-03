"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { alphabetEvidence, alphabetLessons, alphabetLetters } from "./data/alphabet";
import { phonemes, phoneticLessons, phoneticsEvidence } from "./data/phonetics";
import { usageContrasts } from "./data/usageContrasts";
import { wordPictures, wordPictureStats } from "./data/wordPictures";
import {
  calculateTypingSpeed,
  classicsTypingHint,
  classicsTypingTarget,
  compareTyping,
  createClassicsTypingSession,
  createTypingSession,
  typingHint,
  typingTarget,
  type ClassicsPrompt,
  type ClassicsRecord,
  type TypingContentMode,
  type TypingLanguageMode,
  type TypingPrompt,
  type TypingScope,
} from "./data/typingGame";

type View = "home" | "sounds" | "course" | "typing" | "library" | "review" | "about";
type FoundationTab = "letters" | "sounds";
type Accent = "uk" | "us";
type Grade = "again" | "hard" | "good" | "easy";
type TypingSource = "basic850" | "classics";
type FontScale = "compact" | "balanced" | "large";
type SpeechCheckStatus = "idle" | "checking" | "ready" | "missing" | "unavailable" | "error";

type RelatedWord = { word: string; relation: string };
type WordRecord = {
  id: string;
  order: number;
  category_id: string;
  category_order: number;
  category_label_en: string;
  category_label_zh: string;
  word: string;
  source_form: string;
  pos: string[];
  pronunciation: {
    uk: { ipa: string; source: string; status: string };
    us: { ipa: string; source: string; status: string };
  };
  meaning_zh: string;
  definition_en: string;
  example: { en: string; zh: string };
  related: RelatedWord[];
  editorial_status: "verified" | "mixed" | "draft";
};

type Lesson = {
  id: string;
  order: number;
  globalOrder: number;
  titleZh: string;
  goal: string;
  pronunciationFocus: string;
  sentenceFrame: string;
  wordIds: string[];
};

type Unit = {
  id: string;
  order: number;
  titleZh: string;
  goal: string;
  lessons: Lesson[];
};

type ClassicsSection = {
  id: string;
  order: number;
  title: string;
  promptIds: string[];
};

type ClassicsVolume = {
  id: string;
  order: number;
  title: string;
  name: string;
  sections: ClassicsSection[];
};

type WordProgress = {
  seen: boolean;
  stage: number;
  dueAt: string;
  correctDates: string[];
  modes: string[];
  usedInContext: boolean;
  attempts: number;
};

type ProgressState = {
  version: 1;
  words: Record<string, WordProgress>;
  completedAlphabetLessons: string[];
  completedSoundLessons: string[];
};

const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  words: {},
  completedAlphabetLessons: [],
  completedSoundLessons: [],
};

const STORAGE_KEY = "basic850-progress-v1";
const ACCENT_KEY = "basic850-accent";
const FONT_SCALE_KEY = "basic850-font-scale";
const TYPING_STORAGE_KEY = "basic850-typing-v1";
const INTERVALS = [0, 1, 3, 7, 14, 30, 60];

type TypingSettings = {
  source: TypingSource;
  language: TypingLanguageMode;
  content: TypingContentMode;
  scope: TypingScope;
  count: 10 | 20 | 50;
  autoRead: boolean;
  classicsVolume: string;
  bestAccuracy: number;
  bestSpeed: number;
};

const DEFAULT_TYPING_SETTINGS: TypingSettings = {
  source: "basic850",
  language: "bilingual",
  content: "mixed",
  scope: "lesson",
  count: 10,
  autoRead: true,
  classicsVolume: "classic-volume-01",
  bestAccuracy: 0,
  bestSpeed: 0,
};

function readTypingSettings(): TypingSettings {
  if (typeof window === "undefined") return DEFAULT_TYPING_SETTINGS;
  try {
    const saved = JSON.parse(window.localStorage.getItem(TYPING_STORAGE_KEY) ?? "null") as Partial<TypingSettings> | null;
    if (!saved) return DEFAULT_TYPING_SETTINGS;
    return {
      source: ["basic850", "classics"].includes(saved.source ?? "") ? saved.source as TypingSource : DEFAULT_TYPING_SETTINGS.source,
      language: ["english", "bilingual", "chinese"].includes(saved.language ?? "") ? saved.language as TypingLanguageMode : DEFAULT_TYPING_SETTINGS.language,
      content: ["words", "sentences", "mixed"].includes(saved.content ?? "") ? saved.content as TypingContentMode : DEFAULT_TYPING_SETTINGS.content,
      scope: ["lesson", "learned", "all"].includes(saved.scope ?? "") ? saved.scope as TypingScope : DEFAULT_TYPING_SETTINGS.scope,
      count: [10, 20, 50].includes(saved.count ?? 0) ? saved.count as 10 | 20 | 50 : DEFAULT_TYPING_SETTINGS.count,
      autoRead: typeof saved.autoRead === "boolean" ? saved.autoRead : DEFAULT_TYPING_SETTINGS.autoRead,
      classicsVolume: typeof saved.classicsVolume === "string" && saved.classicsVolume ? saved.classicsVolume : DEFAULT_TYPING_SETTINGS.classicsVolume,
      bestAccuracy: Number.isFinite(saved.bestAccuracy) ? Math.max(0, Number(saved.bestAccuracy)) : 0,
      bestSpeed: Number.isFinite(saved.bestSpeed) ? Math.max(0, Number(saved.bestSpeed)) : 0,
    };
  } catch {
    return DEFAULT_TYPING_SETTINGS;
  }
}

const CATEGORY_META: Record<string, { label: string; short: string; tone: string; count: number }> = {
  operations: { label: "操作及功能词", short: "Operations", tone: "indigo", count: 100 },
  things_general: { label: "普通事物", short: "General things", tone: "amber", count: 400 },
  things_picturable: { label: "可描绘事物", short: "Picturable", tone: "teal", count: 200 },
  qualities_general: { label: "普通性质", short: "Qualities", tone: "coral", count: 100 },
  qualities_opposites: { label: "反向性质词", short: "Opposites", tone: "plum", count: 50 },
};

const NAV_ITEMS: { id: View; zh: string; en: string }[] = [
  { id: "home", zh: "今日", en: "Today" },
  { id: "sounds", zh: "入门", en: "Basics" },
  { id: "course", zh: "课程", en: "Course" },
  { id: "typing", zh: "键盘", en: "Typing" },
  { id: "library", zh: "词库", en: "Words" },
  { id: "review", zh: "复习", en: "Review" },
  { id: "about", zh: "说明", en: "About" },
];

const MOBILE_NAV_IDS: View[] = ["home", "sounds", "course", "typing", "library", "review", "about"];

const ALPHABET_STORY_ART = [
  { ids: ["a", "b", "c", "d", "e"], src: "/illustrations/alphabet/alphabet-01-a-e.webp", alt: "苹果、球、猫、狗和鸟巢里的鸡蛋", caption: "A-E · apple, ball, cat, dog, egg" },
  { ids: ["f", "g", "h", "i", "j"], src: "/illustrations/alphabet/alphabet-02-f-j.webp", alt: "鱼、礼物、帽子、瓢虫和果汁", caption: "F-J · fish, gift, hat, insect, juice" },
  { ids: ["k", "l", "m", "n", "o"], src: "/illustrations/alphabet/alphabet-03-k-o.webp", alt: "风筝、台灯、月亮、鸟巢和橙子", caption: "K-O · kite, lamp, moon, nest, orange" },
  { ids: ["p", "q", "r", "s", "t"], src: "/illustrations/alphabet/alphabet-04-p-t.webp", alt: "钢笔、女王、兔子、太阳和大树", caption: "P-T · pen, queen, rabbit, sun, tree" },
  { ids: ["u", "v", "w"], src: "/illustrations/alphabet/alphabet-05-u-w.webp", alt: "雨伞、小货车和鲸鱼", caption: "U-W · umbrella, van, whale" },
  { ids: ["x", "y", "z"], src: "/illustrations/alphabet/alphabet-06-x-z.webp", alt: "木琴、溜溜球和斑马", caption: "X-Z · xylophone, yo-yo, zebra" },
] as const;

const LETTER_PICTURES: Record<string, string> = {
  a: "🍎", b: "📚", c: "🐱", d: "🐶", e: "🥚", f: "🐟", g: "🎁", h: "👒", i: "🖋️", j: "🧃",
  k: "🪁", l: "💡", m: "🌙", n: "🪺", o: "🍊", p: "🖊️", q: "👑", r: "🐇", s: "☀️", t: "🌳",
  u: "☂️", v: "🚐", w: "🐋", x: "🎼", y: "🪀", z: "🦓",
};

const LETTER_NAME_SPEECH: Record<string, string> = {
  a: "ay", b: "bee", c: "see", d: "dee", e: "ee", f: "eff", g: "gee", h: "aitch", i: "eye",
  j: "jay", k: "kay", l: "el", m: "em", n: "en", o: "oh", p: "pee", q: "cue", r: "ar",
  s: "ess", t: "tee", u: "you", v: "vee", w: "double u", x: "ex", y: "why",
};

function normalizeProgress(value: unknown): ProgressState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ProgressState>;
  if (candidate.version !== 1 || !candidate.words || typeof candidate.words !== "object") return null;
  return {
    version: 1,
    words: candidate.words,
    completedAlphabetLessons: Array.isArray(candidate.completedAlphabetLessons) ? candidate.completedAlphabetLessons : [],
    completedSoundLessons: Array.isArray(candidate.completedSoundLessons) ? candidate.completedSoundLessons : [],
  };
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addDays(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function categoryMeta(id: string) {
  return CATEGORY_META[id] ?? CATEGORY_META.things_general;
}

const MODAL_FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function useModalAccessibility(dialogRef: React.RefObject<HTMLElement | null>, close: () => void) {
  const closeRef = useRef(close);

  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = () => Array.from(dialog.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE))
      .filter((element) => element.tabIndex >= 0 && element.getAttribute("aria-hidden") !== "true");
    const focusFrame = window.requestAnimationFrame(() => (focusableElements()[0] ?? dialog).focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const elements = focusableElements();
      if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [dialogRef]);
}

function WordPicture({ wordId, variant = "full" }: { wordId: string; variant?: "full" | "compact" | "thumb" }) {
  const picture = wordPictures[wordId];
  if (!picture) return null;
  const label = picture.fidelity === "exact" ? "词义图解" : "联想图 · 只帮助记忆";
  return (
    <figure className={`word-picture word-picture--${variant} ${picture.fidelity}`} data-picture-fidelity={picture.fidelity}>
      <div className="word-picture-media">
        <span aria-hidden="true">{picture.emoji}</span>
        <img
          src={`/illustrations/words/${picture.wordId}.svg`}
          alt={picture.altZh}
          width="160"
          height="160"
          loading={variant === "thumb" ? "lazy" : undefined}
          decoding="async"
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      </div>
      <figcaption><span>{label}</span><strong>{picture.cueZh}</strong></figcaption>
    </figure>
  );
}

function uniqueDays(days: string[]) {
  return new Set(days).size;
}

function isStable(item?: WordProgress) {
  return Boolean(item && item.stage >= 4 && uniqueDays(item.correctDates) >= 3);
}

function readInitialView(): View {
  if (typeof window === "undefined") return "home";
  const value = window.location.hash.replace("#", "") as View;
  return NAV_ITEMS.some((item) => item.id === value) ? value : "home";
}

export default function LearningApp() {
  const [view, setView] = useState<View>("home");
  const [words, setWords] = useState<WordRecord[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [classics, setClassics] = useState<ClassicsRecord[]>([]);
  const [classicVolumes, setClassicVolumes] = useState<ClassicsVolume[]>([]);
  const [dataError, setDataError] = useState("");
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [progressReady, setProgressReady] = useState(false);
  const [foundationTab, setFoundationTab] = useState<FoundationTab>("letters");
  const [accent, setAccent] = useState<Accent>("uk");
  const [fontScale, setFontScale] = useState<FontScale>("balanced");
  const [activeWord, setActiveWord] = useState<WordRecord | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [toast, setToast] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [soundHelpOpen, setSoundHelpOpen] = useState(false);
  const [speechCheckStatus, setSpeechCheckStatus] = useState<SpeechCheckStatus>("idle");
  const [speechCheckMessage, setSpeechCheckMessage] = useState("");
  const [clock, setClock] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const clipRef = useRef<HTMLAudioElement | null>(null);
  const wordReturnFocusRef = useRef<HTMLElement | null>(null);
  const lessonReturnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleHash = () => setView(readInitialView());
    const firstSync = window.setTimeout(handleHash, 0);
    window.addEventListener("hashchange", handleHash);
    return () => {
      window.clearTimeout(firstSync);
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/data/words.json").then((response) => {
        if (!response.ok) throw new Error("850词数据未能载入");
        return response.json() as Promise<{ words: WordRecord[] }>;
      }),
      fetch("/data/course.json").then((response) => {
        if (!response.ok) throw new Error("课程地图未能载入");
        return response.json() as Promise<{ units: Unit[] }>;
      }),
      fetch("/data/classics.json").then((response) => {
        if (!response.ok) throw new Error("中华经典拼音数据未能载入");
        return response.json() as Promise<{ volumes: ClassicsVolume[]; prompts: ClassicsRecord[] }>;
      }),
    ])
      .then(([wordData, courseData, classicsData]) => {
        setWords(wordData.words as WordRecord[]);
        setUnits(courseData.units as Unit[]);
        setClassics(classicsData.prompts);
        setClassicVolumes(classicsData.volumes);
      })
      .catch((error: Error) => setDataError(error.message));
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = normalizeProgress(JSON.parse(saved));
          if (parsed) setProgress(parsed);
        }
        const savedAccent = window.localStorage.getItem(ACCENT_KEY);
        if (savedAccent === "uk" || savedAccent === "us") setAccent(savedAccent);
        const savedFontScale = window.localStorage.getItem(FONT_SCALE_KEY);
        if (savedFontScale === "compact" || savedFontScale === "balanced" || savedFontScale === "large") setFontScale(savedFontScale);
      } catch {
        setToast("本机进度读取失败，已从空白进度开始。可稍后导入备份。");
      } finally {
        setProgressReady(true);
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    const tick = () => setClock(Date.now());
    const firstTick = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!progressReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      const timer = window.setTimeout(() => setToast("本机进度写入失败；请检查浏览器隐私或存储设置，并及时导出备份。"), 0);
      return () => window.clearTimeout(timer);
    }
  }, [progress, progressReady]);

  useEffect(() => () => {
    clipRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const syncVoices = () => setVoices(window.speechSynthesis.getVoices());
    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
        setToast("离线功能暂未安装成功；在线学习不受影响，请确认服务器已启用 HTTPS 后再刷新。");
      });
      return;
    }

    // Never let a previously installed production worker cache Vite's HMR
    // client during local development.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => void registration.unregister());
    });
    if ("caches" in window) {
      window.caches.keys().then((keys) => {
        keys.filter((key) => key.startsWith("basic850-")).forEach((key) => void window.caches.delete(key));
      });
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const wordMap = useMemo(() => new Map(words.map((word) => [word.id, word])), [words]);
  const lessons = useMemo(() => units.flatMap((unit) => unit.lessons), [units]);
  const dueWords = useMemo(() => {
    return words.filter((word) => {
      const item = progress.words[word.id];
      return item?.seen && clock > 0 && new Date(item.dueAt).getTime() <= clock;
    });
  }, [words, progress.words, clock]);
  const seenCount = useMemo(() => Object.values(progress.words).filter((item) => item.seen).length, [progress.words]);
  const stableCount = useMemo(() => Object.values(progress.words).filter(isStable).length, [progress.words]);
  const activeCount = Math.max(0, seenCount - stableCount);
  const nextLesson = useMemo(
    () => lessons.find((lesson) => !lesson.wordIds.every((id) => progress.words[id]?.seen)) ?? lessons.at(-1),
    [lessons, progress.words],
  );

  function navigate(next: View) {
    window.location.hash = next;
    setView(next);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      mainRef.current?.focus({ preventScroll: true });
    });
  }

  function openFoundation(tab: FoundationTab) {
    setFoundationTab(tab);
    navigate("sounds");
  }

  function changeAccent(next: Accent) {
    setAccent(next);
    window.localStorage.setItem(ACCENT_KEY, next);
  }

  function changeFontScale(next: FontScale) {
    setFontScale(next);
    window.localStorage.setItem(FONT_SCALE_KEY, next);
  }

  function selectEnglishVoice(available: SpeechSynthesisVoice[], nextAccent: Accent) {
    const wanted = nextAccent === "uk" ? "en-GB" : "en-US";
    return available.find((item) => item.lang.toLowerCase() === wanted.toLowerCase())
      ?? available.find((item) => item.lang.toLowerCase().startsWith(wanted.toLowerCase().slice(0, 2)));
  }

  function showMissingEnglishVoice() {
    const message = "未检测到可用的英语系统语音。音标单音能播放，是因为它使用网站自带 MP3；字母、单词和例句需要 Windows 英语语音。请点“声音检测”查看修复方法。";
    setToast(message);
    setSpeechCheckStatus("missing");
    setSpeechCheckMessage(message);
  }

  async function waitForVoices() {
    if (!("speechSynthesis" in window)) return [] as SpeechSynthesisVoice[];
    const first = window.speechSynthesis.getVoices();
    if (first.length) return first;
    return new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const finish = () => {
        window.clearTimeout(timeout);
        window.speechSynthesis.removeEventListener("voiceschanged", finish);
        resolve(window.speechSynthesis.getVoices());
      };
      const timeout = window.setTimeout(finish, 1200);
      window.speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
    });
  }

  async function runSoundCheck() {
    setSoundHelpOpen(true);
    setSpeechCheckStatus("checking");
    setSpeechCheckMessage("正在检查浏览器和 Windows 提供的英语语音…");
    if (!("speechSynthesis" in window)) {
      const message = "此浏览器没有提供合成语音接口。请用最新版 Chrome 或 Edge 打开网站，再重新检测。";
      setSpeechCheckStatus("unavailable");
      setSpeechCheckMessage(message);
      return;
    }

    const available = await waitForVoices();
    setVoices(available);
    const voice = selectEnglishVoice(available, accent);
    if (!voice) {
      const message = "没有检测到英语系统语音。请运行便携版根目录的“修复英语发音.cmd”，完成后彻底关闭并重新打开 Chrome，再回来检测。";
      setSpeechCheckStatus("missing");
      setSpeechCheckMessage(message);
      return;
    }

    clipRef.current?.pause();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Basic 850 sound check.");
    utterance.lang = accent === "uk" ? "en-GB" : "en-US";
    utterance.voice = voice;
    utterance.rate = 0.78;
    utterance.onerror = () => {
      setSpeechCheckStatus("error");
      setSpeechCheckMessage("浏览器找到了英语语音，但播放请求失败。请关闭并重新打开 Chrome；若仍失败，请在 Windows 设置中安装英语“文本转语音”后再试。");
    };
    utterance.onstart = () => {
      setSpeechCheckStatus("ready");
      setSpeechCheckMessage(`已检测到英语语音“${voice.name}”，并已播放测试句。若仍听不到，请检查 Chrome 标签页是否静音、Windows 音量合成器和当前输出设备。`);
    };
    window.speechSynthesis.speak(utterance);
  }

  function speak(text: string, nextAccent = accent) {
    if (!("speechSynthesis" in window)) {
      setToast("当前浏览器不支持合成语音。请点“声音检测”查看可用浏览器和修复方法。");
      return;
    }
    const available = window.speechSynthesis.getVoices();
    const voice = selectEnglishVoice(available, nextAccent);
    if (!voice) {
      showMissingEnglishVoice();
      return;
    }
    clipRef.current?.pause();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const wanted = nextAccent === "uk" ? "en-GB" : "en-US";
    utterance.lang = wanted;
    utterance.rate = 0.78;
    utterance.voice = voice;
    utterance.onerror = () => setToast("英语语音播放失败。请点“声音检测”查看修复方法。");
    window.speechSynthesis.speak(utterance);
  }

  function speakChinese(text: string) {
    if (!("speechSynthesis" in window)) {
      setToast("当前浏览器不支持合成语音。");
      return;
    }
    clipRef.current?.pause();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.74;
    const voice = voices.find((item) => item.lang.toLowerCase() === "zh-cn")
      ?? voices.find((item) => item.lang.toLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function playPhoneme(id: string, symbol: string) {
    window.speechSynthesis?.cancel();
    clipRef.current?.pause();
    const audio = new Audio(`/audio/phonemes/${id}.mp3`);
    clipRef.current = audio;
    audio.play().catch(() => {
      setToast(`暂时不能播放 ${symbol} 的单音；你仍可点下方示例词跟读。`);
    });
  }

  function gradeWord(id: string, grade: Grade, mode = "card") {
    setProgress((current) => {
      const old = current.words[id] ?? {
        seen: false,
        stage: 0,
        dueAt: new Date().toISOString(),
        correctDates: [],
        modes: [],
        usedInContext: false,
        attempts: 0,
      };
      let nextStage = old.stage;
      let waitDays = 0;
      const correct = grade === "good" || grade === "easy";
      if (grade === "again") {
        nextStage = 0;
      } else if (grade === "hard") {
        nextStage = Math.max(0, old.stage);
        waitDays = Math.max(1, Math.floor((INTERVALS[nextStage] || 1) / 2));
      } else if (grade === "good") {
        nextStage = Math.min(INTERVALS.length - 1, old.stage + 1);
        waitDays = INTERVALS[nextStage];
      } else {
        nextStage = Math.min(INTERVALS.length - 1, old.stage + 2);
        waitDays = INTERVALS[nextStage];
      }
      const dueAt = grade === "again" ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : addDays(waitDays);
      const updated: WordProgress = {
        ...old,
        seen: true,
        stage: nextStage,
        dueAt,
        attempts: old.attempts + 1,
        correctDates: correct ? Array.from(new Set([...old.correctDates, dateKey()])) : old.correctDates,
        modes: Array.from(new Set([...old.modes, mode])),
      };
      return { ...current, words: { ...current.words, [id]: updated } };
    });
  }

  function rememberFocus(ref: React.MutableRefObject<HTMLElement | null>) {
    ref.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function restoreFocus(ref: React.MutableRefObject<HTMLElement | null>) {
    const target = ref.current;
    ref.current = null;
    window.setTimeout(() => {
      if (target?.isConnected) target.focus();
      else mainRef.current?.focus();
    }, 0);
  }

  function openWord(word: WordRecord) {
    rememberFocus(wordReturnFocusRef);
    setActiveWord(word);
  }

  function closeWord() {
    setActiveWord(null);
    restoreFocus(wordReturnFocusRef);
  }

  function startLesson(lesson: Lesson) {
    rememberFocus(lessonReturnFocusRef);
    setActiveLesson(lesson);
    const firstUnseen = lesson.wordIds.findIndex((id) => !progress.words[id]?.seen);
    setLessonIndex(firstUnseen >= 0 ? firstUnseen : 0);
  }

  function closeLesson() {
    setActiveLesson(null);
    restoreFocus(lessonReturnFocusRef);
  }

  function completeSoundLesson(id: string) {
    setProgress((current) => ({
      ...current,
      completedSoundLessons: Array.from(new Set([...current.completedSoundLessons, id])),
    }));
    setToast("这节音标课已记入本机进度。");
  }

  function completeAlphabetLesson(id: string) {
    setProgress((current) => ({
      ...current,
      completedAlphabetLessons: Array.from(new Set([...current.completedAlphabetLessons, id])),
    }));
    setToast("这节字母课已记入本机进度。");
  }

  function exportProgress() {
    const payload = JSON.stringify({ ...progress, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `basic850-progress-${dateKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("进度备份已导出。");
  }

  function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text()
      .then((text) => {
        const parsed = normalizeProgress(JSON.parse(text));
        if (!parsed) {
          throw new Error("版本或结构不正确");
        }
        setProgress(parsed);
        setToast("进度备份已导入。");
      })
      .catch(() => setToast("无法导入：请选择本站导出的有效进度文件。"));
    event.target.value = "";
  }

  return (
    <div className={`learning-shell font-scale-${fontScale}`}>
      <header className="app-header">
        <button className="brand app-brand" type="button" onClick={() => navigate("home")}>
          <img className="ideal-city-logo" src="/branding/ideal-city-club-logo.png" alt="理想城俱乐部" />
          <span><strong>Basic 850</strong><small>English from the roots</small></span>
        </button>
        <nav className="app-nav" aria-label="学习栏目">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => navigate(item.id)}>
              <span>{item.zh}</span><small>{item.en}</small>
            </button>
          ))}
        </nav>
        <div className="header-tools">
          <div className="font-size-switch" role="group" aria-label="页面字号">
            <button type="button" aria-label="缩小字号" aria-pressed={fontScale === "compact"} className={fontScale === "compact" ? "active" : ""} onClick={() => changeFontScale("compact")}>A−</button>
            <button type="button" aria-label="恢复协调字号" aria-pressed={fontScale === "balanced"} className={fontScale === "balanced" ? "active" : ""} onClick={() => changeFontScale("balanced")}>A</button>
            <button type="button" aria-label="放大字号" aria-pressed={fontScale === "large"} className={fontScale === "large" ? "active" : ""} onClick={() => changeFontScale("large")}>A+</button>
          </div>
          <div className="accent-switch" role="group" aria-label="发音口音">
            <button type="button" aria-pressed={accent === "uk"} className={accent === "uk" ? "active" : ""} onClick={() => changeAccent("uk")}>UK</button>
            <button type="button" aria-pressed={accent === "us"} className={accent === "us" ? "active" : ""} onClick={() => changeAccent("us")}>US</button>
          </div>
          <button className="sound-check-button" type="button" onClick={() => void runSoundCheck()}>声音检测</button>
          <span className="local-status"><i /> 本机保存</span>
        </div>
      </header>

      {dataError ? <div className="data-alert" role="alert">{dataError}。请确认已运行数据生成步骤。</div> : null}

      <main ref={mainRef} className="app-stage" tabIndex={-1}>
        {view === "home" && (
          <HomeView
            words={words}
            wordMap={wordMap}
            nextLesson={nextLesson}
            progress={progress}
            dueCount={dueWords.length}
            seenCount={seenCount}
            activeCount={activeCount}
            stableCount={stableCount}
            accent={accent}
            speak={speak}
            startLesson={startLesson}
            navigate={navigate}
            openFoundation={openFoundation}
            openWord={openWord}
          />
        )}
        {view === "sounds" && (
          <FoundationView
            tab={foundationTab}
            setTab={setFoundationTab}
            completedAlphabetLessons={progress.completedAlphabetLessons}
            completedSoundLessons={progress.completedSoundLessons}
            speak={speak}
            playPhoneme={playPhoneme}
            accent={accent}
            completeAlphabet={completeAlphabetLesson}
            completeSound={completeSoundLesson}
          />
        )}
        {view === "course" && (
          <CourseView units={units} progress={progress.words} startLesson={startLesson} wordMap={wordMap} />
        )}
        {view === "typing" && (
          <TypingView
            words={words}
            classics={classics}
            classicVolumes={classicVolumes}
            wordMap={wordMap}
            nextLesson={nextLesson}
            progress={progress.words}
            accent={accent}
            speak={speak}
            speakChinese={speakChinese}
          />
        )}
        {view === "library" && (
          <LibraryView words={words} progress={progress.words} accent={accent} speak={speak} openWord={openWord} />
        )}
        {view === "review" && (
          <ReviewView words={words} dueWords={dueWords} progress={progress.words} accent={accent} speak={speak} grade={gradeWord} exportProgress={exportProgress} importRef={importRef} />
        )}
        {view === "about" && <AboutView openSoundCheck={() => void runSoundCheck()} />}
      </main>

      <footer className="app-footer">
        <div className="app-footer-credit">
          <p><strong>理想城：一次链接一生同行。</strong>追求理想、追求智慧，让世界因我更美好！</p>
          <p>【愿景】 实现共同智慧共同富裕</p>
          <p>【使命】 为了人人的智慧，为了人人的理想</p>
          <p>【价值观】爱国 敬业 诚信 友善；开放 分享 成长 有爱</p>
          <p className="app-footer-contact"><strong>同频请联系<a href="mailto:lx.city@qq.com">lx.city@qq.com</a>.<br />理想城二师兄出品.</strong></p>
          <small><strong>Basic 850</strong> · 一套可离线使用、进度留在本机的零基础英语教材</small>
        </div>
        <figure className="app-footer-wechat">
          <img
            src="/branding/ideal-city-wechat-qr.jpg"
            alt="理想城俱乐部微信公众号二维码"
            width="242"
            height="280"
            loading="lazy"
          />
          <figcaption><strong>关注理想城俱乐部</strong><span>微信扫一扫</span></figcaption>
        </figure>
        <div className="app-footer-actions">
          <button type="button" onClick={() => navigate("about")}>教材说明</button>
          <button type="button" onClick={exportProgress}>导出进度</button>
          <button type="button" onClick={() => importRef.current?.click()}>导入进度</button>
          <input ref={importRef} className="sr-only" type="file" accept="application/json" onChange={importProgress} />
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="移动端学习栏目">
        {MOBILE_NAV_IDS.map((id) => NAV_ITEMS.find((item) => item.id === id)).filter(Boolean).map((item) => item ? (
          <button key={item.id} className={view === item.id ? "active" : ""} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => navigate(item.id)}>
            <span>{item.zh}</span><small>{item.en}</small>
          </button>
        ) : null)}
      </nav>

      {activeWord ? (
        <WordDrawer word={activeWord} accent={accent} speak={speak} close={closeWord} grade={gradeWord} progress={progress.words[activeWord.id]} />
      ) : null}
      {activeLesson ? (
        <LessonPlayer
          key={`${activeLesson.id}-${lessonIndex}`}
          lesson={activeLesson}
          index={lessonIndex}
          wordMap={wordMap}
          accent={accent}
          progress={progress.words}
          speak={speak}
          grade={(id, value) => gradeWord(id, value, "lesson")}
          next={() => {
            if (lessonIndex < activeLesson.wordIds.length - 1) setLessonIndex((value) => value + 1);
            else {
              closeLesson();
              setToast("本课10词已完成首次接触；它们会按间隔进入复习。");
            }
          }}
          previous={() => setLessonIndex((value) => Math.max(0, value - 1))}
          close={closeLesson}
        />
      ) : null}
      {soundHelpOpen ? <SoundHelpDialog status={speechCheckStatus} message={speechCheckMessage} close={() => setSoundHelpOpen(false)} check={() => void runSoundCheck()} /> : null}
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}

function HomeView({
  words,
  wordMap,
  nextLesson,
  progress,
  dueCount,
  seenCount,
  activeCount,
  stableCount,
  accent,
  speak,
  startLesson,
  navigate,
  openFoundation,
  openWord,
}: {
  words: WordRecord[];
  wordMap: Map<string, WordRecord>;
  nextLesson?: Lesson;
  progress: ProgressState;
  dueCount: number;
  seenCount: number;
  activeCount: number;
  stableCount: number;
  accent: Accent;
  speak: (text: string) => void;
  startLesson: (lesson: Lesson) => void;
  navigate: (view: View) => void;
  openFoundation: (tab: FoundationTab) => void;
  openWord: (word: WordRecord) => void;
}) {
  const lessonWords = nextLesson?.wordIds.map((id) => wordMap.get(id)).filter(Boolean) as WordRecord[] | undefined;
  const featured = lessonWords?.[0] ?? words[0];
  const percent = Math.round((stableCount / 850) * 100);
  const alphabetComplete = progress.completedAlphabetLessons.length >= alphabetLessons.length;
  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-copy">
          <p className="eyebrow">START SMALL · GO DEEP</p>
          <h1>不是认识850个词。<span>是学会用它们。</span></h1>
          <p>先认识字母，再听清声音，然后理解意义并主动说出来。每天20–30分钟，不补欠账，也不把“看过”算成“学会”。</p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={() => alphabetComplete ? (nextLesson && startLesson(nextLesson)) : openFoundation("letters")} disabled={alphabetComplete && !nextLesson}>
              {alphabetComplete ? (seenCount ? "继续下一课" : "开始词汇第1课") : "从字母 A 开始"}<span>→</span>
            </button>
            <button className="button secondary" type="button" onClick={() => alphabetComplete ? openFoundation("sounds") : (nextLesson && startLesson(nextLesson))} disabled={!alphabetComplete && !nextLesson}>
              {alphabetComplete ? "练习音标" : "直接进入词汇课"}
            </button>
          </div>
          <div className="course-facts">
            <span><strong>6</strong> 节字母入门</span>
            <span><strong>14</strong> 节音标先修</span>
            <span><strong>85</strong> 节词汇主课</span>
          </div>
        </div>
        <aside className="progress-card">
          <div className="progress-ring" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{stableCount}</strong><span>/ 850</span></div>
          </div>
          <h2>稳定记住</h2>
          <p>至少在3个日期正确提取，且复习间隔达到14天。</p>
          <div className="metric-row">
            <span><strong>{seenCount}</strong> 已见</span>
            <span><strong>{activeCount}</strong> 学习中</span>
            <span><strong>{dueCount}</strong> 今日到期</span>
          </div>
        </aside>
      </section>

      <section className="learning-path" aria-label="零基础学习路径">
        <button type="button" onClick={() => openFoundation("letters")}>
          <span>01</span><div><strong>字母 Alphabet</strong><small>{progress.completedAlphabetLessons.length} / 6 课完成</small></div><i>→</i>
        </button>
        <button type="button" onClick={() => openFoundation("sounds")}>
          <span>02</span><div><strong>音标 Sounds</strong><small>{progress.completedSoundLessons.length} / 14 课完成</small></div><i>→</i>
        </button>
        <button type="button" onClick={() => navigate("course")}>
          <span>03</span><div><strong>核心词 Basic 850</strong><small>{seenCount} / 850 词已见</small></div><i>→</i>
        </button>
        <button type="button" onClick={() => navigate("typing")}>
          <span>04</span><div><strong>键盘练习 Typing</strong><small>单词与例句 · 三种语言模式</small></div><i>→</i>
        </button>
      </section>

      <section className="today-layout">
        <article className="next-lesson-card">
          <div className="section-heading">
            <div><p className="eyebrow">NEXT LESSON · 下一课</p><h2>{nextLesson?.titleZh ?? "课程正在载入"}</h2></div>
            <span className="lesson-badge">{nextLesson ? `第 ${nextLesson.globalOrder} / 85 课` : "—"}</span>
          </div>
          <p>{nextLesson?.goal ?? "正在准备850词课程地图。"}</p>
          <div className="lesson-word-strip">
            {lessonWords?.map((word) => (
              <button key={word.id} type="button" className={progress.words[word.id]?.seen ? "seen" : ""} onClick={() => openWord(word)}>
                <strong lang="en">{word.word}</strong><span>{word.meaning_zh}</span>
              </button>
            ))}
          </div>
          <div className="frame-line"><span>本课句型</span><strong lang="en">{nextLesson?.sentenceFrame ?? "—"}</strong></div>
          <button className="wide-action" type="button" disabled={!nextLesson} onClick={() => nextLesson && startLesson(nextLesson)}>进入10词学习 <span>→</span></button>
        </article>

        <article className="featured-word-card">
          {featured ? (
            <>
              <div className="word-card-top"><span className={`category-tag ${categoryMeta(featured.category_id).tone}`}>{categoryMeta(featured.category_id).label}</span><button type="button" onClick={() => speak(featured.word)}>{accent.toUpperCase()} · ▶</button></div>
              <small>WORD {String(featured.order).padStart(3, "0")} / 850</small>
              <h2 lang="en">{featured.word}</h2>
              <p className="large-ipa">{featured.pronunciation[accent].ipa}</p>
              <p className="large-meaning">{featured.meaning_zh}</p>
              <WordPicture wordId={featured.id} variant="compact" />
              <div className="simple-definition"><span>SIMPLE ENGLISH</span><p lang="en">{featured.definition_en}</p></div>
              <button className="text-link" type="button" onClick={() => openWord(featured)}>打开完整词卡 <span>→</span></button>
            </>
          ) : <p>词卡正在载入…</p>}
        </article>
      </section>

      <section className="category-overview">
        <div className="section-heading wide-heading"><div><p className="eyebrow">THE LANGUAGE SKELETON</p><h2>850词的五个区域</h2></div><p>原始分类只说明词表结构，不等于现代词性；教学课程会跨类别按场景重排。</p></div>
        <div className="category-grid">
          {Object.entries(CATEGORY_META).map(([id, item]) => {
            const learned = words.filter((word) => word.category_id === id && progress.words[word.id]?.seen).length;
            return <button key={id} type="button" className={`category-tile ${item.tone}`} onClick={() => navigate("library")}>
              <span className="category-number">{item.count}</span><h3>{item.short}</h3><p>{item.label}</p><div><i style={{ width: `${Math.round((learned / item.count) * 100)}%` }} /></div><small>{learned} 已见</small>
            </button>;
          })}
        </div>
      </section>
    </>
  );
}

function FoundationView({
  tab,
  setTab,
  completedAlphabetLessons,
  completedSoundLessons,
  speak,
  playPhoneme,
  accent,
  completeAlphabet,
  completeSound,
}: {
  tab: FoundationTab;
  setTab: (tab: FoundationTab) => void;
  completedAlphabetLessons: string[];
  completedSoundLessons: string[];
  speak: (text: string) => void;
  playPhoneme: (id: string, symbol: string) => void;
  accent: Accent;
  completeAlphabet: (id: string) => void;
  completeSound: (id: string) => void;
}) {
  return (
    <section className="content-view foundation-view">
      <div className="foundation-tabs" role="tablist" aria-label="英语入门课程">
        <button id="foundation-tab-letters" role="tab" type="button" aria-selected={tab === "letters"} aria-controls="foundation-panel-letters" className={tab === "letters" ? "active" : ""} onClick={() => setTab("letters")}>
          <span>01</span><div><strong>英语字母</strong><small>Alphabet · 6课</small></div><i>{completedAlphabetLessons.length}/6</i>
        </button>
        <button id="foundation-tab-sounds" role="tab" type="button" aria-selected={tab === "sounds"} aria-controls="foundation-panel-sounds" className={tab === "sounds" ? "active" : ""} onClick={() => setTab("sounds")}>
          <span>02</span><div><strong>英语音标</strong><small>Sounds · 14课</small></div><i>{completedSoundLessons.length}/14</i>
        </button>
      </div>
      {tab === "letters" ? (
        <div id="foundation-panel-letters" role="tabpanel" aria-labelledby="foundation-tab-letters">
          <AlphabetView completed={completedAlphabetLessons} speak={speak} accent={accent} complete={completeAlphabet} />
        </div>
      ) : (
        <div id="foundation-panel-sounds" role="tabpanel" aria-labelledby="foundation-tab-sounds">
          <SoundsView completed={completedSoundLessons} speak={speak} playPhoneme={playPhoneme} accent={accent} complete={completeSound} />
        </div>
      )}
    </section>
  );
}

function AlphabetView({ completed, speak, accent, complete }: { completed: string[]; speak: (text: string) => void; accent: Accent; complete: (id: string) => void }) {
  const [selectedLessonId, setSelectedLessonId] = useState(alphabetLessons[0]?.id ?? "");
  const [selectedLetterId, setSelectedLetterId] = useState<string>(alphabetLessons[0]?.letterIds[0] ?? "a");
  const lesson = alphabetLessons.find((item) => item.id === selectedLessonId) ?? alphabetLessons[0];
  const lessonLetters = lesson ? lesson.letterIds.map((id) => alphabetLetters.find((letter) => letter.id === id)).filter(Boolean) : [];
  const selectedLetter = alphabetLetters.find((letter) => letter.id === selectedLetterId) ?? lessonLetters[0];
  const storyArt = ALPHABET_STORY_ART.find((item) => selectedLetter && (item.ids as readonly string[]).includes(selectedLetter.id)) ?? ALPHABET_STORY_ART[0];

  function chooseLesson(id: string, firstLetterId: string) {
    setSelectedLessonId(id);
    setSelectedLetterId(firstLetterId);
  }

  function sayLetterName(id: string, uppercase: string) {
    if (id === "z") speak(accent === "uk" ? "zed" : "zee");
    else speak(LETTER_NAME_SPEECH[id] ?? uppercase.toLowerCase());
  }

  return (
    <div className="alphabet-view">
      <div className="view-intro"><p className="eyebrow">LETTERS FIRST · 字母入门</p><h1>先认字母，再把声音放进单词。</h1><p>6节短课学会26个大小写、字母名、基础书写和常见音值。字母不是音标：一个字母可能有多个声音，一个声音也可能由多个字母组成。</p></div>
      <div className="sound-course-layout">
        <aside className="lesson-rail" aria-label="字母课目录">
          {alphabetLessons.map((item, index) => (
            <button key={item.id} type="button" className={item.id === lesson?.id ? "active" : ""} onClick={() => chooseLesson(item.id, item.letterIds[0])}>
              <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{completed.includes(item.id) ? "已完成" : item.subtitle}</small></div>
            </button>
          ))}
        </aside>
        {lesson ? (
          <article className="sound-lesson-panel alphabet-lesson-panel">
            <div className="lesson-panel-head"><div><span>ALPHABET {String(alphabetLessons.indexOf(lesson) + 1).padStart(2, "0")} · {lesson.durationMinutes} MIN</span><h2>{lesson.title}</h2><p>{lesson.subtitle}</p></div><span className={completed.includes(lesson.id) ? "completion checked" : "completion"}>{completed.includes(lesson.id) ? "已完成" : "未完成"}</span></div>
            <div className="objective-box"><strong>学完能做到</strong><ul>{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <p className="warm-up"><span>开口热身</span>{lesson.warmUp}</p>

            <figure className="alphabet-story-art">
              <img src={storyArt.src} alt={storyArt.alt} width="960" height="720" />
              <figcaption><span>看图找词</span><strong lang="en">{storyArt.caption}</strong></figcaption>
            </figure>

            <div className="letter-grid" aria-label={`${lesson.title} 字母卡`}>
              {lessonLetters.map((letter) => letter ? (
                <button key={letter.id} type="button" aria-pressed={selectedLetter?.id === letter.id} className={selectedLetter?.id === letter.id ? "active" : ""} onClick={() => setSelectedLetterId(letter.id)}>
                  <span className="letter-picture" aria-hidden="true">{LETTER_PICTURES[letter.id]}</span>
                  <span className="letter-pair"><strong>{letter.uppercase}</strong><small>{letter.lowercase}</small></span>
                  <span className="letter-name">{letter.nameIpa[accent]}</span>
                </button>
              ) : null)}
            </div>

            {selectedLetter ? (
              <section className="letter-detail" aria-live="polite">
                <div className="letter-detail-head">
                  <div><span className="letter-picture large" aria-hidden="true">{LETTER_PICTURES[selectedLetter.id]}</span><strong>{selectedLetter.uppercase}<small>{selectedLetter.lowercase}</small></strong></div>
                  <div><span>字母名 · {accent.toUpperCase()}</span><p>{selectedLetter.nameIpa[accent]}</p></div>
                  <button type="button" onClick={() => sayLetterName(selectedLetter.id, selectedLetter.uppercase)} aria-label={`播放字母 ${selectedLetter.uppercase} 的名称`}>▶ <span>听字母名</span></button>
                </div>
                <div className="letter-sounds"><strong>单词中常见的声音</strong><div>{selectedLetter.commonSounds.map((sound) => <span key={`${sound.ipaUk}-${sound.noteZh}`}><b>{accent === "uk" ? sound.ipaUk : sound.ipaUs}</b><small>{sound.noteZh}</small></span>)}</div></div>
                <div className="letter-examples"><strong>看图读例词</strong><div>{selectedLetter.examples.map((example) => <button type="button" key={example.word} onClick={() => speak(example.word)}><span lang="en">{example.word}</span><small>{example.meaningZh} · {accent === "uk" ? example.ipaUk : example.ipaUs}</small><i>▶</i></button>)}</div></div>
                <div className="letter-tips"><p><strong>怎么读</strong>{selectedLetter.mouthTip}</p><p><strong>怎么写</strong>{selectedLetter.writingTip}</p>{selectedLetter.noteZh ? <p><strong>特别提醒</strong>{selectedLetter.noteZh}</p> : null}</div>
              </section>
            ) : null}

            <div className="practice-box alphabet-practice"><div><span>PRACTICE</span><h3>这一课怎么练</h3></div><ol><li>{lesson.tasks.recognition}</li><li>{lesson.tasks.listening}</li><li>{lesson.tasks.writing}</li></ol><p><strong>离场检查：</strong>{lesson.checkpoint}</p></div>
            <button className="wide-action" type="button" onClick={() => complete(lesson.id)}>{completed.includes(lesson.id) ? "已完成，再练一次" : "完成本课"}<span>→</span></button>
          </article>
        ) : null}
      </div>
      <div className="evidence-note"><strong>为什么不把字母当成26个固定音？</strong><p>{alphabetEvidence.summaryZh}</p></div>
    </div>
  );
}

function SoundsView({ completed, speak, playPhoneme, accent, complete }: { completed: string[]; speak: (text: string) => void; playPhoneme: (id: string, symbol: string) => void; accent: Accent; complete: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState(phoneticLessons[0]?.id ?? "");
  const lesson = phoneticLessons.find((item) => item.id === selectedId) ?? phoneticLessons[0];
  const lessonSounds = lesson ? lesson.phonemeIds.map((id) => phonemes.find((sound) => sound.id === id)).filter(Boolean) : [];
  return (
    <div className="sounds-view">
      <div className="view-intro"><p className="eyebrow">SOUND FIRST · 音标先修</p><h1>先听见差别，才说得清楚。</h1><p>14节课建立“听音—辨音—看音标—模仿”的能力。“单音”键播放内置的独立教学示范；下方例词使用{accent === "uk" ? "英式" : "美式"}合成发音。</p></div>
      <div className="sound-course-layout">
        <aside className="lesson-rail" aria-label="音标课目录">
          {phoneticLessons.map((item, index) => (
            <button key={item.id} type="button" className={item.id === lesson?.id ? "active" : ""} onClick={() => setSelectedId(item.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{completed.includes(item.id) ? "已完成" : item.subtitle}</small></div>
            </button>
          ))}
        </aside>
        {lesson ? (
          <article className="sound-lesson-panel">
            <div className="lesson-panel-head"><div><span>LESSON {String(phoneticLessons.indexOf(lesson) + 1).padStart(2, "0")}</span><h2>{lesson.title}</h2><p>{lesson.subtitle}</p></div><span className={completed.includes(lesson.id) ? "completion checked" : "completion"}>{completed.includes(lesson.id) ? "已完成" : "未完成"}</span></div>
            <div className="objective-box"><strong>学完能做到</strong><ul>{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <p className="warm-up"><span>开口热身</span>{lesson.warmUp}</p>
            <div className="phoneme-grid">
              {lessonSounds.map((sound) => sound ? (
                <article key={sound.id} className="phoneme-card">
                  <div><button className="phoneme-play" type="button" onClick={() => playPhoneme(sound.id, sound.symbol)} aria-label={`播放音位 ${sound.symbol} 的独立发音`}><strong>{sound.symbol}</strong><span>▶</span><em>单音</em></button><small>{sound.nameZh}</small></div>
                  <p>{sound.mouthTip}</p><p className="voice-tip">{sound.voiceTip}</p>
                  <div className="sound-examples">{sound.examples.slice(0, 3).map((example) => <button type="button" key={example.word} onClick={() => speak(example.word)}><span lang="en">{example.word}</span><small>{example.noteZh}</small></button>)}</div>
                </article>
              ) : null)}
            </div>
            <div className="practice-box"><div><span>PRACTICE</span><h3>这一课怎么练</h3></div><ol>{lesson.practice.map((item) => <li key={item}>{item}</li>)}</ol><p><strong>离场检查：</strong>{lesson.checkpoint}</p></div>
            <button className="wide-action" type="button" onClick={() => complete(lesson.id)}>{completed.includes(lesson.id) ? "已完成，再练一次" : "完成本课"}<span>→</span></button>
          </article>
        ) : null}
      </div>
      <div className="evidence-note"><strong>为什么不是简单写“48个音标”？</strong><p>{phoneticsEvidence.summaryZh} 单音素材为本地合成的宽式教学参照，不代表所有英语口音只有一种实现。</p></div>
    </div>
  );
}

function CourseView({ units, progress, startLesson, wordMap }: { units: Unit[]; progress: Record<string, WordProgress>; startLesson: (lesson: Lesson) => void; wordMap: Map<string, WordRecord> }) {
  return (
    <section className="content-view course-view">
      <div className="view-intro"><p className="eyebrow">17 UNITS · 85 LESSONS</p><h1>按场景学习，不按字母表硬背。</h1><p>每周5节新词课，另外2天只复习。85课不是必须连续完成的85天。</p></div>
      <div className="unit-stack">
        {units.map((unit, unitIndex) => {
          const unitIds = unit.lessons.flatMap((lesson) => lesson.wordIds);
          const done = unitIds.filter((id) => progress[id]?.seen).length;
          return (
            <details key={unit.id} className="unit-block" open={unitIndex === 0}>
              <summary><span className="unit-index">UNIT {String(unit.order).padStart(2, "0")}</span><div><h2>{unit.titleZh}</h2><p>{unit.goal}</p></div><div className="unit-progress"><strong>{done}</strong><span>/ 50</span><i style={{ width: `${done * 2}%` }} /></div></summary>
              <div className="lesson-list">
                {unit.lessons.map((lesson) => {
                  const seen = lesson.wordIds.filter((id) => progress[id]?.seen).length;
                  return <article key={lesson.id} className="lesson-row"><span>{String(lesson.globalOrder).padStart(2, "0")}</span><div className="lesson-row-copy"><h3>{lesson.titleZh}</h3><p>{lesson.goal}</p><div>{lesson.wordIds.slice(0, 5).map((id) => <small key={id}>{wordMap.get(id)?.word ?? id}</small>)}</div></div><div className="lesson-row-action"><small>{seen}/10 已见</small><button type="button" onClick={() => startLesson(lesson)}>{seen === 10 ? "复习" : seen ? "继续" : "开始"} →</button></div></article>;
                })}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function LibraryView({ words, progress, accent, speak, openWord }: { words: WordRecord[]; progress: Record<string, WordProgress>; accent: Accent; speak: (text: string) => void; openWord: (word: WordRecord) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 36;
  const filtered = useMemo(() => words.filter((word) => {
    const matchesQuery = !query || word.word.includes(query.toLowerCase()) || word.meaning_zh.includes(query);
    return matchesQuery && (category === "all" || word.category_id === category);
  }), [words, query, category]);
  const shown = filtered.slice(0, page * pageSize);
  return (
    <section className="content-view library-view">
      <div className="view-intro library-intro"><div><p className="eyebrow">THE COMPLETE 850</p><h1>完整词库</h1><p>严格保留原始850词身份；现代释义、例句和相近表达属于单独的教学增补层。</p></div><label className="search-box"><span>搜索</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="输入英文或中文…" /></label></div>
      <div className="filter-tabs">
        <button type="button" className={category === "all" ? "active" : ""} onClick={() => { setCategory("all"); setPage(1); }}>全部 <span>850</span></button>
        {Object.entries(CATEGORY_META).map(([id, item]) => <button type="button" key={id} className={category === id ? "active" : ""} onClick={() => { setCategory(id); setPage(1); }}>{item.label} <span>{item.count}</span></button>)}
      </div>
      <p className="result-count">找到 {filtered.length} 个词 · {accent === "uk" ? "英式音标与发音" : "美式音标与发音"}</p>
      <div className="word-library-grid">
        {shown.map((word) => (
          <article key={word.id} className={`library-word ${categoryMeta(word.category_id).tone}`}>
            <div><span>{String(word.order).padStart(3, "0")}</span><button type="button" onClick={() => speak(word.word)} aria-label={`播放 ${word.word}`}>▶</button></div>
            <WordPicture wordId={word.id} variant="thumb" />
            <button className="word-open" type="button" onClick={() => openWord(word)}><strong lang="en">{word.word}</strong><small>{word.pronunciation[accent].ipa}</small><p>{word.meaning_zh}</p></button>
            <footer><span>{categoryMeta(word.category_id).label}</span><i className={isStable(progress[word.id]) ? "stable" : progress[word.id]?.seen ? "learning" : ""}>{isStable(progress[word.id]) ? "稳定" : progress[word.id]?.seen ? "学习中" : "未开始"}</i></footer>
          </article>
        ))}
      </div>
      {shown.length < filtered.length ? <button className="load-more" type="button" onClick={() => setPage((value) => value + 1)}>再显示 {Math.min(pageSize, filtered.length - shown.length)} 个词</button> : null}
    </section>
  );
}

type PracticePrompt = TypingPrompt | ClassicsPrompt;

function isClassicsPrompt(prompt: PracticePrompt): prompt is ClassicsPrompt {
  return "pinyinPlain" in prompt;
}

function TypingView({
  words,
  classics,
  classicVolumes,
  wordMap,
  nextLesson,
  progress,
  accent,
  speak,
  speakChinese,
}: {
  words: WordRecord[];
  classics: ClassicsRecord[];
  classicVolumes: ClassicsVolume[];
  wordMap: Map<string, WordRecord>;
  nextLesson?: Lesson;
  progress: Record<string, WordProgress>;
  accent: Accent;
  speak: (text: string) => void;
  speakChinese: (text: string) => void;
}) {
  const [settings, setSettings] = useState<TypingSettings>(readTypingSettings);
  const [status, setStatus] = useState<"setup" | "running" | "complete">("setup");
  const [queue, setQueue] = useState<PracticePrompt[]>([]);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [finishedAt, setFinishedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [completedCharacters, setCompletedCharacters] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const composingRef = useRef(false);
  const transitionRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speakRef = useRef(speak);
  const speakChineseRef = useRef(speakChinese);

  const basicPool = useMemo(() => {
    if (settings.scope === "all") return words;
    if (settings.scope === "learned") return words.filter((word) => progress[word.id]?.seen);
    return nextLesson?.wordIds.map((id) => wordMap.get(id)).filter(Boolean) as WordRecord[] ?? [];
  }, [nextLesson, progress, settings.scope, wordMap, words]);
  const classicsPool = useMemo(
    () => settings.classicsVolume === "all" ? classics : classics.filter((item) => item.volumeId === settings.classicsVolume),
    [classics, settings.classicsVolume],
  );
  const poolSize = settings.source === "classics" ? classicsPool.length : basicPool.length;
  const selectedClassicVolume = classicVolumes.find((volume) => volume.id === settings.classicsVolume);

  const current = queue[index];
  const currentIsClassics = Boolean(current && isClassicsPrompt(current));
  const target = current ? (isClassicsPrompt(current) ? classicsTypingTarget(current, settings.language) : typingTarget(current, settings.language)) : "";
  const hint = current ? (isClassicsPrompt(current) ? classicsTypingHint(current, settings.language) : typingHint(current, settings.language)) : "";
  const pinyinGuide = current && isClassicsPrompt(current) && settings.language !== "chinese" ? current.pinyinTone : "";
  const comparison = useMemo(() => compareTyping(target, typed), [target, typed]);
  const accuracy = totalKeystrokes ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
  const measuredElapsed = status === "complete" ? Math.max(1, finishedAt - startedAt) : Math.max(1, elapsedMs);
  const speed = calculateTypingSpeed(completedCharacters + (status === "running" ? comparison.correct : 0), measuredElapsed, settings.language);
  const speedUnit = settings.language === "chinese" ? "字/分" : "WPM";
  const currentSpeech = current ? (isClassicsPrompt(current) ? current.text : current.kind === "word" ? current.word.word : current.word.example.en) : "";

  useEffect(() => {
    speakRef.current = speak;
    speakChineseRef.current = speakChinese;
  }, [speak, speakChinese]);

  useEffect(() => {
    window.localStorage.setItem(TYPING_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (status !== "running") return;
    const update = () => setElapsedMs(Date.now() - startedAt);
    update();
    const timer = window.setInterval(update, 500);
    return () => window.clearInterval(timer);
  }, [startedAt, status]);

  useEffect(() => {
    if (status !== "running" || locked) return;
    const frame = window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [index, locked, status]);

  useEffect(() => {
    if (status !== "running" || !settings.autoRead || !currentSpeech) return;
    const timer = window.setTimeout(() => {
      if (currentIsClassics) speakChineseRef.current(currentSpeech);
      else speakRef.current(currentSpeech);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [currentIsClassics, currentSpeech, settings.autoRead, status]);

  useEffect(() => () => {
    if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
  }, []);

  useEffect(() => {
    if (status !== "complete") return;
    const timer = window.setTimeout(() => {
      setSettings((currentSettings) => {
        const next = {
          ...currentSettings,
          bestAccuracy: Math.max(currentSettings.bestAccuracy, accuracy),
          bestSpeed: Math.max(currentSettings.bestSpeed, speed),
        };
        return next.bestAccuracy === currentSettings.bestAccuracy && next.bestSpeed === currentSettings.bestSpeed ? currentSettings : next;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [accuracy, speed, status]);

  function updateSetting<K extends keyof Pick<TypingSettings, "source" | "language" | "content" | "scope" | "count" | "autoRead" | "classicsVolume">>(key: K, value: TypingSettings[K]) {
    setSettings((currentSettings) => ({ ...currentSettings, [key]: value }));
  }

  function returnFocusToInput() {
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  function playCurrentSpeech() {
    if (!currentSpeech) return;
    if (currentIsClassics) speakChineseRef.current(currentSpeech);
    else speakRef.current(currentSpeech);
    returnFocusToInput();
  }

  function toggleAutoRead() {
    updateSetting("autoRead", !settings.autoRead);
    returnFocusToInput();
  }

  function startSession() {
    const prompts: PracticePrompt[] = settings.source === "classics"
      ? createClassicsTypingSession(classicsPool, settings.count)
      : createTypingSession(basicPool, settings.content, settings.count);
    if (!prompts.length) return;
    if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
    const now = Date.now();
    setQueue(prompts);
    setIndex(0);
    setTyped("");
    setStartedAt(now);
    setFinishedAt(0);
    setElapsedMs(1);
    setCorrectKeystrokes(0);
    setTotalKeystrokes(0);
    setCompletedCharacters(0);
    setCompletedCount(0);
    setStreak(0);
    setBestStreak(0);
    lockedRef.current = false;
    setLocked(false);
    setStatus("running");
  }

  function finishSession() {
    setFinishedAt(Date.now());
    setStatus("complete");
    lockedRef.current = false;
    setLocked(false);
    window.speechSynthesis?.cancel();
  }

  function advance(success: boolean) {
    if (!current || lockedRef.current) return;
    lockedRef.current = true;
    if (success) {
      setCompletedCharacters((value) => value + Array.from(target).length);
      setCompletedCount((value) => value + 1);
      setStreak((value) => {
        const next = value + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setStreak(0);
    }
    setLocked(true);
    transitionRef.current = window.setTimeout(() => {
      if (index + 1 >= queue.length) {
        finishSession();
        return;
      }
      setIndex((value) => value + 1);
      setTyped("");
      lockedRef.current = false;
      setLocked(false);
    }, success ? 620 : 0);
  }

  function handleTyping(nextValue: string) {
    if (!current || locked) return;
    const previousCharacters = Array.from(typed);
    const nextCharacters = Array.from(nextValue);
    const targetCharacters = Array.from(target);
    if (nextCharacters.length > previousCharacters.length) {
      let newlyCorrect = 0;
      const start = previousCharacters.length;
      for (let position = start; position < nextCharacters.length; position += 1) {
        if (nextCharacters[position] === targetCharacters[position]) newlyCorrect += 1;
      }
      setCorrectKeystrokes((value) => value + newlyCorrect);
      setTotalKeystrokes((value) => value + nextCharacters.length - start);
    }
    setTyped(nextValue);
    if (!composingRef.current && nextValue === target) advance(true);
  }

  function handleCompositionEnd(value: string) {
    composingRef.current = false;
    if (value === target) advance(true);
  }

  const sourceOptions: { id: TypingSource; label: string; note: string }[] = [
    { id: "basic850", label: "Basic 850", note: "英语单词与例句" },
    { id: "classics", label: "中华经典", note: "中文原文与拼音" },
  ];
  const languageOptions: { id: TypingLanguageMode; label: string; note: string }[] = settings.source === "classics" ? [
    { id: "english", label: "纯拼音", note: "输入无声调字母" },
    { id: "bilingual", label: "拼音＋中文", note: "输入拼音，显示原文" },
    { id: "chinese", label: "纯中文", note: "使用中文输入法" },
  ] : [
    { id: "english", label: "纯英文", note: "英文显示与输入" },
    { id: "bilingual", label: "中英结合", note: "输入英文，显示中文" },
    { id: "chinese", label: "纯中文", note: "使用中文输入法" },
  ];
  const contentOptions: { id: TypingContentMode; label: string }[] = [
    { id: "words", label: "只练单词" },
    { id: "sentences", label: "只练例句" },
    { id: "mixed", label: "单词 + 例句" },
  ];
  const scopeOptions: { id: TypingScope; label: string; count: number }[] = [
    { id: "lesson", label: "当前10词课", count: nextLesson?.wordIds.length ?? 0 },
    { id: "learned", label: "学过的词", count: words.filter((word) => progress[word.id]?.seen).length },
    { id: "all", label: "完整850词", count: words.length },
  ];

  return (
    <section className="content-view typing-view">
      <div className="view-intro typing-intro">
        <div><p className="eyebrow">TYPE · SEE · REMEMBER</p><h1>把英语与经典打进手指记忆。</h1><p>可练 Basic 850 单词与例句，也可练《中华智慧启蒙·经典诵读》的中文和拼音。系统逐字标出正误，不会改动英语词卡的复习等级。</p></div>
        <div className="typing-best"><span>本机最佳</span><strong>{Math.round(settings.bestAccuracy)}%</strong><small>{settings.bestSpeed} {settings.language === "chinese" ? "字/分" : "WPM"}</small></div>
      </div>

      {status === "setup" ? (
        <div className="typing-setup-layout">
          <div className="typing-settings">
            <fieldset><legend>1 · 练习教材</legend><div className="typing-option-grid two">{sourceOptions.map((option) => <button key={option.id} type="button" className={settings.source === option.id ? "active" : ""} onClick={() => updateSetting("source", option.id)}><strong>{option.label}</strong><span>{option.note}</span></button>)}</div></fieldset>
            <fieldset><legend>2 · 语言模式</legend><div className="typing-option-grid three">{languageOptions.map((option) => <button key={option.id} type="button" className={settings.language === option.id ? "active" : ""} onClick={() => updateSetting("language", option.id)}><strong>{option.label}</strong><span>{option.note}</span></button>)}</div></fieldset>
            {settings.source === "basic850" ? <>
              <fieldset><legend>3 · 练习内容</legend><div className="typing-option-grid three">{contentOptions.map((option) => <button key={option.id} type="button" className={settings.content === option.id ? "active" : ""} onClick={() => updateSetting("content", option.id)}>{option.label}</button>)}</div></fieldset>
              <fieldset><legend>4 · 词汇范围</legend><div className="typing-option-grid three">{scopeOptions.map((option) => <button key={option.id} type="button" className={settings.scope === option.id ? "active" : ""} onClick={() => updateSetting("scope", option.id)}><strong>{option.label}</strong><span>{option.count} 词可用</span></button>)}</div></fieldset>
            </> : (
              <fieldset><legend>3 · 经典卷目</legend><label className="typing-select"><span>选择练习范围</span><select value={settings.classicsVolume} onChange={(event) => updateSetting("classicsVolume", event.target.value)}><option value="all">全部十卷</option>{classicVolumes.map((volume) => <option key={volume.id} value={volume.id}>{volume.title}</option>)}</select><small>{selectedClassicVolume ? `${selectedClassicVolume.sections.length} 个小节` : `${classicVolumes.length} 卷`} · {classicsPool.length} 条句段可用</small></label></fieldset>
            )}
            <fieldset><legend>{settings.source === "basic850" ? "5" : "4"} · 朗读设置</legend><button className={`typing-auto-read ${settings.autoRead ? "active" : ""}`} type="button" role="switch" aria-checked={settings.autoRead} onClick={() => updateSetting("autoRead", !settings.autoRead)}><span><strong>自动朗读{settings.source === "classics" ? "中文原文" : "英文"}</strong><small>每个新{settings.source === "classics" ? "句段" : "单词或例句"}出现时播放一次</small></span><i>{settings.autoRead ? "已开启" : "已关闭"}</i></button></fieldset>
            <fieldset><legend>{settings.source === "basic850" ? "6" : "5"} · 本轮题数</legend><div className="typing-option-grid counts">{([10, 20, 50] as const).map((count) => <button key={count} type="button" className={settings.count === count ? "active" : ""} onClick={() => updateSetting("count", count)}>{count} 题</button>)}</div></fieldset>
            <button className="typing-start" type="button" onClick={startSession} disabled={!poolSize}>开始键盘练习 <span>→</span></button>
            {!poolSize ? <p className="typing-empty-note">这个范围还没有可用内容。请更换范围，或确认数据文件已完整复制。</p> : null}
          </div>
          <aside className="typing-guide"><span className="keyboard-art" aria-hidden="true">A S D F&nbsp;&nbsp; J K L ;</span><h2>怎么练最有效？</h2><ol>{settings.source === "classics" ? <><li>先看带声调拼音，再输入普通字母。</li><li>输入拼音时不用声调，ü 统一键入 v。</li><li>纯中文模式请切换系统中文输入法。</li><li>听一遍原文，再跟读一遍。</li></> : <><li>先求准确，再求速度。</li><li>英文句首大写、空格和标点都要照着输入。</li><li>纯中文模式请切换系统中文输入法。</li><li>听一遍英文，再跟读一遍。</li></>}</ol></aside>
        </div>
      ) : status === "running" && current ? (
        <div className="typing-session">
          <div className="typing-live-stats"><span><small>进度</small><strong>{index + 1} / {queue.length}</strong></span><span><small>准确率</small><strong>{accuracy}%</strong></span><span><small>速度</small><strong>{speed} {speedUnit}</strong></span><span><small>连续完成</small><strong>{streak}</strong></span></div>
          <div className="typing-progress-line"><i style={{ width: `${((index + (locked ? 1 : 0)) / queue.length) * 100}%` }} /></div>
          <article className={`typing-card ${locked ? "is-correct" : ""}`}>
            <div className="typing-card-meta"><span>{isClassicsPrompt(current) ? `CLASSIC · ${current.volumeTitle} · ${current.sectionTitle}` : current.kind === "word" ? "WORD · 单词" : "SENTENCE · 例句"}</span><div className="typing-card-actions"><button type="button" onClick={playCurrentSpeech}>▶ {isClassicsPrompt(current) ? "播放中文" : `播放英语 · ${accent.toUpperCase()}`}</button><button className={`typing-mini-toggle ${settings.autoRead ? "active" : ""}`} type="button" role="switch" aria-checked={settings.autoRead} onClick={toggleAutoRead}>自动朗读 {settings.autoRead ? "开" : "关"}</button></div></div>
            <div className="typing-card-body">
              {!isClassicsPrompt(current) ? <WordPicture wordId={current.word.id} variant="compact" /> : null}
              {pinyinGuide ? <p className="typing-pinyin-guide"><span>带声调参考</span>{pinyinGuide}</p> : null}
              {hint ? <p className="typing-hint">{hint}</p> : null}
              <p className={`typing-target ${settings.language === "chinese" ? "chinese" : ""} ${currentIsClassics && settings.language !== "chinese" ? "pinyin" : ""}`} lang={settings.language === "chinese" ? "zh-CN" : "en"} aria-label={`输入目标：${target}`}>
                {comparison.characters.map((character, characterIndex) => <span key={`${characterIndex}-${character.value}`} className={`typing-char ${character.state} ${characterIndex === Array.from(typed).length ? "current" : ""}`}>{character.value === " " ? "\u00a0" : character.value}</span>)}
              </p>
              <label className="typing-input-label"><span>{settings.language === "chinese" ? "在这里输入中文" : currentIsClassics ? "在这里输入无声调拼音（ü 用 v）" : "Type here · 在这里输入"}</span><textarea ref={inputRef} lang={settings.language === "chinese" ? "zh-CN" : "en"} rows={isClassicsPrompt(current) || (!isClassicsPrompt(current) && current.kind === "sentence") ? 3 : 1} value={typed} aria-busy={locked} spellCheck={false} autoCapitalize="off" autoCorrect="off" onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={(event) => handleCompositionEnd(event.currentTarget.value)} onChange={(event) => handleTyping(event.currentTarget.value)} placeholder={settings.language === "chinese" ? "切换中文输入法后开始…" : currentIsClassics ? "例如：xue er shi xi zhi" : "Start typing…"} /></label>
              <div className="typing-feedback" aria-live="polite"><span className={comparison.wrong ? "has-error" : ""}>{comparison.wrong ? `有 ${comparison.wrong} 个字符不一致，请退格修改。` : locked ? "完全正确！准备下一题…" : "逐字输入，红色字符需要修正。"}</span><button type="button" onClick={() => advance(false)} disabled={locked}>跳过此题</button></div>
            </div>
          </article>
          <button className="typing-end" type="button" onClick={finishSession}>结束本轮并查看结果</button>
        </div>
      ) : (
        <div className="typing-result">
          <p className="eyebrow">SESSION COMPLETE · 本轮完成</p><h2>{completedCount === queue.length ? "练习完成，手指又熟了一点。" : "本轮已结束，结果已保存在本机。"}</h2>
          <div><span><small>完成</small><strong>{completedCount} / {queue.length}</strong></span><span><small>准确率</small><strong>{accuracy}%</strong></span><span><small>速度</small><strong>{speed} {speedUnit}</strong></span><span><small>最长连续</small><strong>{bestStreak}</strong></span></div>
          <p>速度只用于观察自己的变化：英文和拼音按每5个字符折算1词，中文按每分钟字符数计算。先保持准确，再慢慢加速。</p>
          <div className="typing-result-actions"><button className="button primary" type="button" onClick={startSession}>再练一轮 <span>→</span></button><button className="button secondary" type="button" onClick={() => setStatus("setup")}>调整练习设置</button></div>
        </div>
      )}
    </section>
  );
}

function ReviewView({ words, dueWords, progress, accent, speak, grade, exportProgress, importRef }: { words: WordRecord[]; dueWords: WordRecord[]; progress: Record<string, WordProgress>; accent: Accent; speak: (text: string) => void; grade: (id: string, grade: Grade, mode?: string) => void; exportProgress: () => void; importRef: React.RefObject<HTMLInputElement | null> }) {
  const queue = dueWords.length ? dueWords : words.filter((word) => progress[word.id]?.seen).slice(0, 10);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const word = queue[index % Math.max(1, queue.length)];
  function answer(value: Grade) {
    if (!word) return;
    grade(word.id, value, "active-recall");
    setRevealed(false);
    setIndex((current) => current + 1);
  }
  return (
    <section className="content-view review-view">
      <div className="view-intro"><p className="eyebrow">ACTIVE RECALL · 主动提取</p><h1>把答案从脑中拿出来。</h1><p>“翻过卡片”不算学会。今天到期 {dueWords.length} 个词，系统会平滑恢复，不会一次堆满欠账。</p></div>
      <div className="review-layout">
        <article className="review-card">
          {word ? (
            <>
              <div className="review-card-top"><span>{index + 1} / {queue.length}</span><span>{categoryMeta(word.category_id).label}</span></div>
              <button className="review-audio" type="button" onClick={() => speak(word.word)}>▶ <span>听发音</span></button>
              <h2 lang="en">{word.word}</h2>
              <p className="large-ipa">{word.pronunciation[accent].ipa}</p>
              {revealed ? (
                <div className="answer-panel">
                  <WordPicture wordId={word.id} variant="compact" />
                  <strong>{word.meaning_zh}</strong>
                  <p lang="en">{word.definition_en}</p>
                  <blockquote lang="en">{word.example.en}<span>{word.example.zh}</span></blockquote>
                </div>
              ) : <button className="reveal-button" type="button" onClick={() => setRevealed(true)}>想好后显示答案</button>}
              {revealed ? (
                <div className="grade-row">
                  <button type="button" onClick={() => answer("again")}><strong>忘了</strong><span>10分钟后</span></button>
                  <button type="button" onClick={() => answer("hard")}><strong>困难</strong><span>缩短间隔</span></button>
                  <button type="button" onClick={() => answer("good")}><strong>记得</strong><span>进入下一级</span></button>
                  <button type="button" onClick={() => answer("easy")}><strong>很熟</strong><span>可跳一级</span></button>
                </div>
              ) : null}
            </>
          ) : <div className="empty-state"><h2>还没有复习词</h2><p>完成第一节10词课后，它们会按间隔进入这里。</p></div>}
        </article>
        <aside className="review-sidebar"><h2>本机进度</h2><div className="review-stat"><span>已见</span><strong>{Object.values(progress).filter((item) => item.seen).length}</strong></div><div className="review-stat"><span>稳定记住</span><strong>{Object.values(progress).filter(isStable).length}</strong></div><div className="review-stat"><span>今日到期</span><strong>{dueWords.length}</strong></div><p>进度不会上传。换浏览器或清除数据前，请先导出备份。</p><button type="button" onClick={exportProgress}>导出 JSON 备份</button><button type="button" onClick={() => importRef.current?.click()}>导入进度</button></aside>
      </div>
    </section>
  );
}

function AboutView({ openSoundCheck }: { openSoundCheck: () => void }) {
  return (
    <section className="content-view about-view">
      <div className="view-intro"><p className="eyebrow">WHY BASIC 850 · 项目缘起</p><h1>从850个词，重新把英语学深一点。</h1><p>这不只是一份词表，也是一场关于学习方法的实验：先把根扎稳，再让表达自然生长。</p></div>

      <article className="about-story">
        <p className="about-story-kicker">先讲一个你可能从未听说过的人。</p>
        <h2>C. K. Ogden 与一场“只留下语言骨架”的实验</h2>
        <p>1930年，英国语言学者、语义学者 C. K. Ogden 提出 Basic English。他追问的是一个近乎偏执的问题：如果只保留最核心的词汇和规则，英语还能不能承担日常交流？他的方案给出了一个醒目的答案——<strong>850个词</strong>。</p>
        <p>这850词不是现代考试的高频词排名，而是一套经过设计的受控英语词表。Ogden 把它们组织成五个区域，让少量词通过组合承担尽可能多的表达任务：</p>
        <div className="about-category-list" aria-label="Basic English 五类词汇">
          <div><strong>100</strong><span>操作及功能词</span><small>Operations · 让句子运转的基础词</small></div>
          <div><strong>400</strong><span>普通事物</span><small>General things · 广泛使用的事物词</small></div>
          <div><strong>200</strong><span>可描绘事物</span><small>Picturable things · door、fire、river 等</small></div>
          <div><strong>100</strong><span>普通性质</span><small>Qualities · clear、simple 等</small></div>
          <div><strong>50</strong><span>反向性质词</span><small>Opposite qualities · 补足性质表达</small></div>
        </div>
        <p>这套方案很快超出了语言学的小圈子。丘吉尔在1943年的哈佛演讲中公开倡议研究和推广 Basic English，希望它帮助更多人共享一种交流工具；H. G. Wells 在《The Shape of Things to Come》中，把它写进对未来共同语言的想象。乔治·奥威尔对 Basic English 的态度则经历过变化；研究者常把《1984》的 Newspeak 视为对受控语言和政治宣传的警惕之一，但不能把它说成唯一且由作者亲自确认的灵感来源。</p>

        <section>
          <h3>对今天的学习者，它真正有价值的地方是“先深，再广”</h3>
          <p>许多人学英语，长期被厚词汇书和考试大纲推着走：背了忘，忘了再背，认识很多中文释义，却很少把词真正用进句子。Basic 850 提供了另一条路——先掌握一组能反复组合的核心材料，再逐步扩展。</p>
          <p>真正的“学会”不只是看到英文能想起中文，还包括听得出、读得准、拼得对、能放进句子，也知道相近词在不同语境里为什么不能随意互换。<strong>根扎得够深，枝才能生得够远。</strong></p>
        </section>

        <section>
          <h3>于是，我和 AI 一起把一份黑白词表做成了这套教材</h3>
          <p>项目里的 PDF 只提供了850词的骨架，信息简洁，排版也带着上个世纪的样子。我想做的，是把这副骨架变成零基础学习者今天真的能用、孩子也愿意打开的学习工具。</p>
          <p>现在，每个词都有中文释义、简单英文定义、双语例句、英美音标和点读功能；五类词使用不同颜色，适合形象理解的词配有本地插图。对容易混淆的常用词，词卡还会解释近义词和易混词的使用差别；不适合硬凑的内容则宁可留白。</p>
          <p>网站还从26个英文字母和基础音标开始，加入分课学习、间隔复习、单词与例句键盘练习，以及《中华智慧启蒙·经典诵读》的中文和拼音练习。无需注册，学习进度只保存在当前浏览器，也可以随时导出备份。</p>
          <p>这件事确实花了不少时间，也花了不少 Token。准确地说，是我提出方向、持续做出取舍和校正，再让 AI 参与资料整理、内容生成与网站开发。AI 能让执行更快，却替代不了“为什么要做、为谁而做、哪些地方不能将就”的判断。</p>
        </section>

        <blockquote>如果你学了很多年英语，却仍然觉得自己“会认、不会用”，也许这850个词，正是一个值得重新开始的起点。</blockquote>
      </article>

      <section className="ideal-city-section" aria-labelledby="ideal-city-title">
        <p className="eyebrow">IDEAL CITY · 理想城理念</p>
        <h2 id="ideal-city-title">一次链接一生同行。</h2>
        <p className="ideal-city-intro">追求理想、追求智慧，让世界因我更美好！</p>
        <p className="ideal-city-definition"><strong>【理想城】</strong>是激发每个人追求理想、智慧的集体所有制大学校、大家庭。倡导每个人共同自学成为全面发展的通识人才。包含学习、生活、工作、娱乐、创业的线上到线下的学校大家庭。</p>
        <dl className="ideal-city-profile">
          <div><dt>愿景</dt><dd>实现共同智慧共同富裕</dd></div>
          <div><dt>使命</dt><dd>为了人人的智慧，为了人人的理想</dd></div>
          <div><dt>价值观</dt><dd>爱国 · 敬业 · 诚信 · 友善<br />开放 · 分享 · 成长 · 有爱</dd></div>
        </dl>
      </section>

      <section className="sound-help-inline" aria-labelledby="sound-help-title">
        <div>
          <p className="eyebrow">SOUND · 声音支持</p>
          <h2 id="sound-help-title">音标有声，字母和单词没声音？</h2>
          <p>音标“单音”是网站自带的 MP3；字母、单词和例句使用 Windows 与浏览器提供的英语合成语音。两者是不同来源。</p>
        </div>
        <button type="button" onClick={openSoundCheck}>运行声音检测</button>
      </section>

      <div className="about-facts-heading"><p className="eyebrow">FACTS · INFERENCE · BOUNDARIES</p><h2>事实与边界</h2><p>尊重 Ogden 的核心词表，也不把历史故事、产品主张或自动生成内容伪装成已经证实的事实。</p></div>
      <div className="about-grid">
        <article><span className="about-index">01</span><h2>可以确认的历史</h2><p>1930年，英国语言学者与语义学者 C. K. Ogden 出版了 Basic English 方案，试图用受控词汇与规则承担大量日常交流。核心表由100个操作及功能词、600个事物词和150个性质词组成。</p><p>丘吉尔后来公开支持研究与推广这套方案；H. G. Wells 也把它写入对未来世界语言的想象。</p></article>
        <article><span className="about-index">02</span><h2>需要纠正的流行说法</h2><p>最后一栏是50个“反向性质词”，不是50对词，也不能说“学一个等于学两个”。Wells 的《The Shape of Things to Come》也不是《世界大战》的续集。</p><p>奥威尔确实接触并讨论过 Basic English；学界常将 Newspeak 看作对受控语言与政治宣传的回应之一，但它不是唯一且经作者确认的灵感来源。</p></article>
        <article><span className="about-index">03</span><h2>这份词表的真实身份</h2><p>项目中的 PDF 不是 Ogden 1930年原著扫描件，而是2015年打印的福岛大学网页词表。它能可靠确认850词及五类排布，但不能证明每个词的现代频率，也不包含字母课、音标、释义、例句或音频。</p><p>网站将“原始词表层”和“现代教学增补层”分开保存。字母课程、儿童插图、独立合成单音与词卡内容都属于现代教学层，不冒充 Ogden 原作。</p><p>首批为 {wordPictureStats.totalMappedCount} 个适合看图理解的词加入本地配图；精确图标为“词义图解”，只能帮助联想的图会明确标成“联想图”。没有可靠图形对应的词宁可留白。</p></article>
        <article><span className="about-index">04</span><h2>学习目标的边界</h2><p>850词是课程骨架，不是“学完即达到A2”的证书。CEFR 衡量的是学习者能完成的语言任务和控制能力，不是单纯词数。</p><p>本教材的诚实目标是：从26个字母起步，帮助零基础学习者建立早期 A1–A2 所需的听、说、读、写基础，并在熟悉场景中主动使用核心词。</p><p>键盘练习复用现代教学层中的例句；照着目标打字有助于熟悉拼写，但不等于已经能主动回忆，因此不会直接提高词卡复习等级。</p></article>
      </div>
      <div className="source-panel"><h2>主要依据</h2><a href="https://www.mpi.nl/publications/item2366945/basic-english-general-introduction-rules-and-grammar" target="_blank" rel="noreferrer">Max Planck Institute：Ogden 1930年书目记录 ↗</a><a href="https://winstonchurchill.org/resources/speeches/1941-1945-war-leader/the-gift-of-a-common-tongue/" target="_blank" rel="noreferrer">Churchill 1943年哈佛演讲全文 ↗</a><a href="https://www.telelib.com/authors/W/WellsHerbertGeorge/prose/thingstocome/thingstocome50.html" target="_blank" rel="noreferrer">H. G. Wells：《The Shape of Things to Come》相关章节 ↗</a><a href="https://www.thebritishacademy.ac.uk/blog/how-language-fake-news-echoes-20th-century-propaganda/" target="_blank" rel="noreferrer">British Academy：Orwell 对 Basic English 的态度变化 ↗</a><a href="https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions" target="_blank" rel="noreferrer">Council of Europe：CEFR Companion Volume ↗</a><a href="https://learnenglish.britishcouncil.org/apps/learnenglish-sounds-right" target="_blank" rel="noreferrer">British Council：Sounds Right 音位表 ↗</a><a href="https://github.com/espeak-ng/espeak-ng" target="_blank" rel="noreferrer">eSpeak NG：独立合成单音的可复现生成器 ↗</a><a href="https://github.com/jdecked/twemoji/tree/v17.0.2" target="_blank" rel="noreferrer">Twemoji：词卡配图（CC BY 4.0）↗</a></div>
    </section>
  );
}

function SoundHelpDialog({ status, message, close, check }: { status: SpeechCheckStatus; message: string; close: () => void; check: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  useModalAccessibility(dialogRef, close);
  const title = status === "ready" ? "英语语音已检测到" : status === "checking" ? "正在检测声音" : "英语语音检测与修复";

  return (
    <div className="overlay sound-help-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section ref={dialogRef} className="sound-help-dialog" role="dialog" aria-modal="true" aria-labelledby="sound-help-dialog-title" tabIndex={-1}>
        <header>
          <div><span>VOICE CHECK · WINDOWS / CHROME</span><h2 id="sound-help-dialog-title">{title}</h2></div>
          <button type="button" onClick={close} aria-label="关闭声音检测">×</button>
        </header>
        <div className={`sound-check-result ${status}`} role="status" aria-live="polite">
          <strong>{status === "checking" ? "检查中" : status === "ready" ? "可以播放" : status === "missing" ? "缺少英语语音" : status === "unavailable" ? "浏览器不支持" : status === "error" ? "播放失败" : "尚未检测"}</strong>
          <p>{message || "点击下方按钮，检测当前浏览器能否调用英语语音。"}</p>
          <button type="button" onClick={check} disabled={status === "checking"}>{status === "checking" ? "正在检测…" : "重新检测并播放"}</button>
        </div>
        <div className="sound-help-steps">
          <h3>自助修复（Windows 10 / 11）</h3>
          <ol>
            <li>若使用便携版，双击根目录的 <strong>修复英语发音.cmd</strong>，在 Windows 的管理员确认框中选择“是”。</li>
            <li>脚本只补充英语（英国、美国）的基础组件和“文本转语音”，不会更改 Windows 显示语言；下载过程需要可用网络与 Windows Update。</li>
            <li>完成后彻底关闭再打开 Chrome，回到这里点“重新检测并播放”。</li>
          </ol>
          <p className="sound-help-note"><strong>脚本失败或电脑受单位策略管理：</strong>打开 Windows“设置 → 时间和语言 → 语言和区域”，添加“英语（英国）”或“英语（美国）”，在语言选项中安装“文本转语音”。</p>
          <p className="sound-help-note"><strong>已检测到语音仍听不到：</strong>检查 Chrome 标签页是否静音、Windows 音量合成器中 Chrome 的音量，以及耳机/扬声器是否为当前输出设备。</p>
          <p className="sound-help-boundary">本检测能确认浏览器是否找到英语语音并已发出播放请求，不能直接读取您的扬声器实际是否出声。</p>
        </div>
      </section>
    </div>
  );
}

function WordDrawer({ word, accent, speak, close, grade, progress }: { word: WordRecord; accent: Accent; speak: (text: string) => void; close: () => void; grade: (id: string, value: Grade) => void; progress?: WordProgress }) {
  const contrasts = usageContrasts[word.word] ?? [];
  const dialogRef = useRef<HTMLElement>(null);
  useModalAccessibility(dialogRef, close);

  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <aside ref={dialogRef} className="word-drawer" role="dialog" aria-modal="true" aria-label={`${word.word} 完整词卡`} tabIndex={-1}>
        <div className="drawer-head"><span className={`category-tag ${categoryMeta(word.category_id).tone}`}>{categoryMeta(word.category_id).label}</span><button type="button" onClick={close} aria-label="关闭词卡">×</button></div>
        <p className="word-source">OGDEN {String(word.order).padStart(3, "0")} / 850 · {word.editorial_status === "verified" ? "已核验" : word.editorial_status === "mixed" ? "部分核验" : "教学初编"}</p>
        <div className="drawer-title"><div><h2 lang="en">{word.word}</h2><p>{word.meaning_zh}</p></div><button type="button" onClick={() => speak(word.word)}>{accent.toUpperCase()}<span>▶</span></button></div>
        <p className="drawer-ipa">{word.pronunciation[accent].ipa} <small>{word.pos.join(" · ")}</small></p>
        <WordPicture wordId={word.id} />
        <section><span className="field-label">SIMPLE ENGLISH</span><p lang="en" className="drawer-definition">{word.definition_en}</p></section>
        <section><div className="field-label with-action">IN A SENTENCE <button type="button" onClick={() => speak(word.example.en)}>播放例句 ▶</button></div><blockquote lang="en">{word.example.en}<span>{word.example.zh}</span></blockquote></section>
        <section>
          <span className="field-label">相近词与易混词辨析</span>
          {contrasts.length ? (
            <div className="contrast-list">
              {contrasts.map((item) => (
                <article key={`${item.word}-${item.noteZh}`}>
                  <div><strong lang="en">{item.word}</strong><span>{item.inBasic850 ? "850词内" : "扩展词"}</span></div>
                  <p>{item.noteZh}</p>
                </article>
              ))}
            </div>
          ) : word.related.length ? (
            <div className="related-list">{word.related.map((item) => <span key={`${item.word}-${item.relation}`}><strong lang="en">{item.word}</strong><small>{item.relation}</small></span>)}</div>
          ) : (
            <p className="muted-copy">这个词没有适合零基础阶段硬凑的近义词。</p>
          )}
        </section>
        <section className="source-status"><strong>内容状态</strong><p>词形与分类来自850词底稿；音标、释义、定义、例句和辨析属于现代教学层。标为“教学初编”的内容仍需后续人工校订。</p></section>
        <div className="drawer-grades"><span>{progress?.seen ? `当前复习级别 ${progress.stage}/6` : "这张卡记得怎样？"}</span><div><button type="button" onClick={() => grade(word.id, "again")}>忘了</button><button type="button" onClick={() => grade(word.id, "hard")}>困难</button><button type="button" onClick={() => grade(word.id, "good")}>记得</button><button type="button" onClick={() => grade(word.id, "easy")}>很熟</button></div></div>
      </aside>
    </div>
  );
}

function LessonPlayer({ lesson, index, wordMap, accent, progress, speak, grade, next, previous, close }: { lesson: Lesson; index: number; wordMap: Map<string, WordRecord>; accent: Accent; progress: Record<string, WordProgress>; speak: (text: string) => void; grade: (id: string, value: Grade) => void; next: () => void; previous: () => void; close: () => void }) {
  const word = wordMap.get(lesson.wordIds[index]);
  const [revealed, setRevealed] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  useModalAccessibility(dialogRef, close);
  if (!word) return null;
  const choose = (value: Grade) => { grade(word.id, value); next(); };
  return (
    <div className="overlay lesson-overlay">
      <section ref={dialogRef} className="lesson-player" role="dialog" aria-modal="true" aria-label={`${lesson.titleZh} 学习`} tabIndex={-1}>
        <header><div><span>LESSON {String(lesson.globalOrder).padStart(2, "0")} · {index + 1}/10</span><h2>{lesson.titleZh}</h2></div><button type="button" onClick={close} aria-label="退出本课">退出 ×</button></header>
        <div className="lesson-progress-line"><i style={{ width: `${(index + 1) * 10}%` }} /></div>
        <div className="player-body">
          <div className="player-category"><span className={`category-tag ${categoryMeta(word.category_id).tone}`}>{categoryMeta(word.category_id).label}</span><small>{progress[word.id]?.seen ? "复习词" : "新词"}</small></div>
          <button className="player-audio" type="button" onClick={() => speak(word.word)}><span>▶</span><small>听 {accent.toUpperCase()} 发音</small></button>
          <h1 lang="en">{word.word}</h1>
          <p className="player-ipa">{word.pronunciation[accent].ipa}</p>
          <WordPicture wordId={word.id} variant="compact" />
          {revealed ? (
            <div className="player-answer">
              <h3>{word.meaning_zh}</h3><p lang="en">{word.definition_en}</p>
              <blockquote lang="en">{word.example.en}<span>{word.example.zh}</span></blockquote>
              <button type="button" onClick={() => speak(word.example.en)}>播放例句 ▶</button>
            </div>
          ) : <button className="reveal-button" type="button" onClick={() => setRevealed(true)}>我想好了，显示词义</button>}
        </div>
        <footer>
          {revealed ? (
            <div className="grade-row">
              <button type="button" onClick={() => choose("again")}><strong>忘了</strong><span>10分钟后</span></button>
              <button type="button" onClick={() => choose("hard")}><strong>困难</strong><span>缩短间隔</span></button>
              <button type="button" onClick={() => choose("good")}><strong>记得</strong><span>进入下一级</span></button>
              <button type="button" onClick={() => choose("easy")}><strong>很熟</strong><span>可跳一级</span></button>
            </div>
          ) : <><button type="button" onClick={previous} disabled={index === 0}>← 上一个</button><button type="button" onClick={() => { grade(word.id, "good"); next(); }}>先看下一个 →</button></>}
        </footer>
      </section>
    </div>
  );
}
