"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { phonemes, phoneticLessons, phoneticsEvidence } from "./data/phonetics";
import { usageContrasts } from "./data/usageContrasts";

type View = "home" | "sounds" | "course" | "library" | "review" | "about";
type Accent = "uk" | "us";
type Grade = "again" | "hard" | "good" | "easy";

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
  completedSoundLessons: string[];
};

const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  words: {},
  completedSoundLessons: [],
};

const STORAGE_KEY = "basic850-progress-v1";
const ACCENT_KEY = "basic850-accent";
const INTERVALS = [0, 1, 3, 7, 14, 30, 60];

const CATEGORY_META: Record<string, { label: string; short: string; tone: string; count: number }> = {
  operations: { label: "操作及功能词", short: "Operations", tone: "indigo", count: 100 },
  things_general: { label: "普通事物", short: "General things", tone: "amber", count: 400 },
  things_picturable: { label: "可描绘事物", short: "Picturable", tone: "teal", count: 200 },
  qualities_general: { label: "普通性质", short: "Qualities", tone: "coral", count: 100 },
  qualities_opposites: { label: "反向性质词", short: "Opposites", tone: "plum", count: 50 },
};

const NAV_ITEMS: { id: View; zh: string; en: string }[] = [
  { id: "home", zh: "今日", en: "Today" },
  { id: "sounds", zh: "音标", en: "Sounds" },
  { id: "course", zh: "课程", en: "Course" },
  { id: "library", zh: "词库", en: "Words" },
  { id: "review", zh: "复习", en: "Review" },
  { id: "about", zh: "说明", en: "About" },
];

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
  const [dataError, setDataError] = useState("");
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [progressReady, setProgressReady] = useState(false);
  const [accent, setAccent] = useState<Accent>("uk");
  const [activeWord, setActiveWord] = useState<WordRecord | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [toast, setToast] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [clock, setClock] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);

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
    ])
      .then(([wordData, courseData]) => {
        setWords(wordData.words as WordRecord[]);
        setUnits(courseData.units as Unit[]);
      })
      .catch((error: Error) => setDataError(error.message));
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ProgressState;
          if (parsed.version === 1 && parsed.words) setProgress(parsed);
        }
        const savedAccent = window.localStorage.getItem(ACCENT_KEY);
        if (savedAccent === "uk" || savedAccent === "us") setAccent(savedAccent);
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, progressReady]);

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
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeAccent(next: Accent) {
    setAccent(next);
    window.localStorage.setItem(ACCENT_KEY, next);
  }

  function speak(text: string, nextAccent = accent) {
    if (!("speechSynthesis" in window)) {
      setToast("当前浏览器不支持合成语音。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const wanted = nextAccent === "uk" ? "en-GB" : "en-US";
    utterance.lang = wanted;
    utterance.rate = 0.78;
    const voice = voices.find((item) => item.lang.toLowerCase() === wanted.toLowerCase())
      ?? voices.find((item) => item.lang.toLowerCase().startsWith(wanted.toLowerCase().slice(0, 2)));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
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

  function startLesson(lesson: Lesson) {
    setActiveLesson(lesson);
    const firstUnseen = lesson.wordIds.findIndex((id) => !progress.words[id]?.seen);
    setLessonIndex(firstUnseen >= 0 ? firstUnseen : 0);
  }

  function completeSoundLesson(id: string) {
    setProgress((current) => ({
      ...current,
      completedSoundLessons: Array.from(new Set([...current.completedSoundLessons, id])),
    }));
    setToast("这节音标课已记入本机进度。");
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
        const parsed = JSON.parse(text) as ProgressState;
        if (parsed.version !== 1 || !parsed.words || !Array.isArray(parsed.completedSoundLessons)) {
          throw new Error("版本或结构不正确");
        }
        setProgress(parsed);
        setToast("进度备份已导入。");
      })
      .catch(() => setToast("无法导入：请选择本站导出的有效进度文件。"));
    event.target.value = "";
  }

  return (
    <div className="learning-shell">
      <header className="app-header">
        <button className="brand app-brand" type="button" onClick={() => navigate("home")}>
          <span className="brand-mark">B</span>
          <span><strong>Basic 850</strong><small>English from the roots</small></span>
        </button>
        <nav className="app-nav" aria-label="学习栏目">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} type="button" onClick={() => navigate(item.id)}>
              <span>{item.zh}</span><small>{item.en}</small>
            </button>
          ))}
        </nav>
        <div className="header-tools">
          <div className="accent-switch" aria-label="发音口音">
            <button type="button" className={accent === "uk" ? "active" : ""} onClick={() => changeAccent("uk")}>UK</button>
            <button type="button" className={accent === "us" ? "active" : ""} onClick={() => changeAccent("us")}>US</button>
          </div>
          <span className="local-status"><i /> 本机保存</span>
        </div>
      </header>

      {dataError ? <div className="data-alert" role="alert">{dataError}。请确认已运行数据生成步骤。</div> : null}

      <div className="app-stage">
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
            openWord={setActiveWord}
          />
        )}
        {view === "sounds" && (
          <SoundsView completed={progress.completedSoundLessons} speak={speak} accent={accent} complete={completeSoundLesson} />
        )}
        {view === "course" && (
          <CourseView units={units} progress={progress.words} startLesson={startLesson} wordMap={wordMap} />
        )}
        {view === "library" && (
          <LibraryView words={words} progress={progress.words} accent={accent} speak={speak} openWord={setActiveWord} />
        )}
        {view === "review" && (
          <ReviewView words={words} dueWords={dueWords} progress={progress.words} accent={accent} speak={speak} grade={gradeWord} exportProgress={exportProgress} importRef={importRef} />
        )}
        {view === "about" && <AboutView />}
      </div>

      <footer className="app-footer">
        <p><strong>Basic 850</strong> · 一套可离线使用、进度留在本机的零基础英语教材</p>
        <div>
          <button type="button" onClick={exportProgress}>导出进度</button>
          <button type="button" onClick={() => importRef.current?.click()}>导入进度</button>
          <input ref={importRef} className="sr-only" type="file" accept="application/json" onChange={importProgress} />
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="移动端学习栏目">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <button key={item.id} className={view === item.id ? "active" : ""} type="button" onClick={() => navigate(item.id)}>
            <span>{item.zh}</span><small>{item.en}</small>
          </button>
        ))}
      </nav>

      {activeWord ? (
        <WordDrawer word={activeWord} accent={accent} speak={speak} close={() => setActiveWord(null)} grade={gradeWord} progress={progress.words[activeWord.id]} />
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
              setActiveLesson(null);
              setToast("本课10词已完成首次接触；它们会按间隔进入复习。");
            }
          }}
          previous={() => setLessonIndex((value) => Math.max(0, value - 1))}
          close={() => setActiveLesson(null)}
        />
      ) : null}
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
  openWord: (word: WordRecord) => void;
}) {
  const lessonWords = nextLesson?.wordIds.map((id) => wordMap.get(id)).filter(Boolean) as WordRecord[] | undefined;
  const featured = lessonWords?.[0] ?? words[0];
  const percent = Math.round((stableCount / 850) * 100);
  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-copy">
          <p className="eyebrow">START SMALL · GO DEEP</p>
          <h1>不是认识850个词。<span>是学会用它们。</span></h1>
          <p>先听清声音，再理解意义，最后主动说出来。每天20–30分钟，不补欠账，也不把“看过”算成“学会”。</p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={() => nextLesson && startLesson(nextLesson)} disabled={!nextLesson}>
              {seenCount ? "继续下一课" : "开始第1课"}<span>→</span>
            </button>
            <button className="button secondary" type="button" onClick={() => navigate("sounds")}>先从音标开始</button>
          </div>
          <div className="course-facts">
            <span><strong>14</strong> 节音标先修</span>
            <span><strong>85</strong> 节词汇主课</span>
            <span><strong>本机</strong> 保存进度</span>
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

function SoundsView({ completed, speak, accent, complete }: { completed: string[]; speak: (text: string) => void; accent: Accent; complete: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState(phoneticLessons[0]?.id ?? "");
  const lesson = phoneticLessons.find((item) => item.id === selectedId) ?? phoneticLessons[0];
  const lessonSounds = lesson ? lesson.phonemeIds.map((id) => phonemes.find((sound) => sound.id === id)).filter(Boolean) : [];
  return (
    <section className="content-view sounds-view">
      <div className="view-intro"><p className="eyebrow">SOUND FIRST · 音标先修</p><h1>先听见差别，才说得清楚。</h1><p>14节课建立“听音—辨音—看音标—模仿”的能力。当前使用{accent === "uk" ? "英式" : "美式"}合成发音；无需背完音标表，第一天就能开始词汇课。</p></div>
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
                  <div><button type="button" onClick={() => speak(sound.examples[0]?.word ?? sound.symbol)} aria-label={`播放 ${sound.symbol} 示例`}><strong>{sound.symbol}</strong><span>▶</span></button><small>{sound.nameZh}</small></div>
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
      <div className="evidence-note"><strong>为什么不是简单写“48个音标”？</strong><p>{phoneticsEvidence.summaryZh}</p></div>
    </section>
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
        {shown.map((word) => <article key={word.id} className={`library-word ${categoryMeta(word.category_id).tone}`}><div><span>{String(word.order).padStart(3, "0")}</span><button type="button" onClick={() => speak(word.word)} aria-label={`播放 ${word.word}`}>▶</button></div><button className="word-open" type="button" onClick={() => openWord(word)}><strong lang="en">{word.word}</strong><small>{word.pronunciation[accent].ipa}</small><p>{word.meaning_zh}</p></button><footer><span>{categoryMeta(word.category_id).label}</span><i className={isStable(progress[word.id]) ? "stable" : progress[word.id]?.seen ? "learning" : ""}>{isStable(progress[word.id]) ? "稳定" : progress[word.id]?.seen ? "学习中" : "未开始"}</i></footer></article>)}
      </div>
      {shown.length < filtered.length ? <button className="load-more" type="button" onClick={() => setPage((value) => value + 1)}>再显示 {Math.min(pageSize, filtered.length - shown.length)} 个词</button> : null}
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
          {word ? <><div className="review-card-top"><span>{index + 1} / {queue.length}</span><span>{categoryMeta(word.category_id).label}</span></div><button className="review-audio" type="button" onClick={() => speak(word.word)}>▶ <span>听发音</span></button><h2 lang="en">{word.word}</h2><p className="large-ipa">{word.pronunciation[accent].ipa}</p>{revealed ? <div className="answer-panel"><strong>{word.meaning_zh}</strong><p lang="en">{word.definition_en}</p><blockquote lang="en">{word.example.en}<span>{word.example.zh}</span></blockquote></div> : <button className="reveal-button" type="button" onClick={() => setRevealed(true)}>想好后显示答案</button>}{revealed ? <div className="grade-row"><button type="button" onClick={() => answer("again")}><strong>忘了</strong><span>10分钟后</span></button><button type="button" onClick={() => answer("hard")}><strong>困难</strong><span>缩短间隔</span></button><button type="button" onClick={() => answer("good")}><strong>记得</strong><span>进入下一级</span></button><button type="button" onClick={() => answer("easy")}><strong>很熟</strong><span>可跳一级</span></button></div> : null}</> : <div className="empty-state"><h2>还没有复习词</h2><p>完成第一节10词课后，它们会按间隔进入这里。</p></div>}
        </article>
        <aside className="review-sidebar"><h2>本机进度</h2><div className="review-stat"><span>已见</span><strong>{Object.values(progress).filter((item) => item.seen).length}</strong></div><div className="review-stat"><span>稳定记住</span><strong>{Object.values(progress).filter(isStable).length}</strong></div><div className="review-stat"><span>今日到期</span><strong>{dueWords.length}</strong></div><p>进度不会上传。换浏览器或清除数据前，请先导出备份。</p><button type="button" onClick={exportProgress}>导出 JSON 备份</button><button type="button" onClick={() => importRef.current?.click()}>导入进度</button></aside>
      </div>
    </section>
  );
}

function AboutView() {
  return (
    <section className="content-view about-view">
      <div className="view-intro"><p className="eyebrow">FACTS · INFERENCE · BOUNDARIES</p><h1>关于这850词，也关于我们不该夸大的事。</h1><p>这套教材尊重 Ogden 的核心词表，但不会把历史故事、产品主张或自动生成内容伪装成已经证实的事实。</p></div>
      <div className="about-grid">
        <article><span className="about-index">01</span><h2>可以确认的历史</h2><p>1930年，英国语言学者与语义学者 C. K. Ogden 出版了 Basic English 方案，试图用受控词汇与规则承担大量日常交流。核心表由100个操作及功能词、600个事物词和150个性质词组成。</p><p>丘吉尔后来公开支持研究与推广这套方案；H. G. Wells 也把它写入对未来世界语言的想象。</p></article>
        <article><span className="about-index">02</span><h2>需要纠正的流行说法</h2><p>最后一栏是50个“反向性质词”，不是50对词，也不能说“学一个等于学两个”。Wells 的《The Shape of Things to Come》也不是《世界大战》的续集。</p><p>奥威尔确实接触并讨论过 Basic English；学界常将 Newspeak 看作对受控语言与政治宣传的回应之一，但它不是唯一且经作者确认的灵感来源。</p></article>
        <article><span className="about-index">03</span><h2>这份词表的真实身份</h2><p>项目中的 PDF 不是 Ogden 1930年原著扫描件，而是2015年打印的福岛大学网页词表。它能可靠确认850词及五类排布，但不能证明每个词的现代频率，也不包含音标、释义、例句或音频。</p><p>网站将“原始词表层”和“现代教学增补层”分开保存，并为自动初编内容标记校订状态。</p></article>
        <article><span className="about-index">04</span><h2>学习目标的边界</h2><p>850词是课程骨架，不是“学完即达到A2”的证书。CEFR 衡量的是学习者能完成的语言任务和控制能力，不是单纯词数。</p><p>本教材的诚实目标是：帮助零基础学习者建立早期 A1–A2 所需的听、说、读、写基础，并在熟悉场景中主动使用核心词。</p></article>
      </div>
      <div className="source-panel"><h2>主要依据</h2><a href="https://www.mpi.nl/publications/item2366945/basic-english-general-introduction-rules-and-grammar" target="_blank" rel="noreferrer">Max Planck Institute：Ogden 1930年书目记录 ↗</a><a href="https://winstonchurchill.org/resources/speeches/1941-1945-war-leader/the-gift-of-a-common-tongue/" target="_blank" rel="noreferrer">Churchill 1943年哈佛演讲全文 ↗</a><a href="https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions" target="_blank" rel="noreferrer">Council of Europe：CEFR Companion Volume ↗</a><a href="https://learnenglish.britishcouncil.org/apps/learnenglish-sounds-right" target="_blank" rel="noreferrer">British Council：Sounds Right 音位表 ↗</a></div>
    </section>
  );
}

function WordDrawer({ word, accent, speak, close, grade, progress }: { word: WordRecord; accent: Accent; speak: (text: string) => void; close: () => void; grade: (id: string, value: Grade) => void; progress?: WordProgress }) {
  const contrasts = usageContrasts[word.word] ?? [];

  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <aside className="word-drawer" role="dialog" aria-modal="true" aria-label={`${word.word} 完整词卡`}>
        <div className="drawer-head"><span className={`category-tag ${categoryMeta(word.category_id).tone}`}>{categoryMeta(word.category_id).label}</span><button type="button" onClick={close} aria-label="关闭词卡">×</button></div>
        <p className="word-source">OGDEN {String(word.order).padStart(3, "0")} / 850 · {word.editorial_status === "verified" ? "已核验" : word.editorial_status === "mixed" ? "部分核验" : "教学初编"}</p>
        <div className="drawer-title"><div><h2 lang="en">{word.word}</h2><p>{word.meaning_zh}</p></div><button type="button" onClick={() => speak(word.word)}>{accent.toUpperCase()}<span>▶</span></button></div>
        <p className="drawer-ipa">{word.pronunciation[accent].ipa} <small>{word.pos.join(" · ")}</small></p>
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
  if (!word) return null;
  const choose = (value: Grade) => { grade(word.id, value); next(); };
  return <div className="overlay lesson-overlay"><section className="lesson-player" role="dialog" aria-modal="true" aria-label={`${lesson.titleZh} 学习`}><header><div><span>LESSON {String(lesson.globalOrder).padStart(2, "0")} · {index + 1}/10</span><h2>{lesson.titleZh}</h2></div><button type="button" onClick={close} aria-label="退出本课">退出 ×</button></header><div className="lesson-progress-line"><i style={{ width: `${(index + 1) * 10}%` }} /></div><div className="player-body"><div className="player-category"><span className={`category-tag ${categoryMeta(word.category_id).tone}`}>{categoryMeta(word.category_id).label}</span><small>{progress[word.id]?.seen ? "复习词" : "新词"}</small></div><button className="player-audio" type="button" onClick={() => speak(word.word)}><span>▶</span><small>听 {accent.toUpperCase()} 发音</small></button><h1 lang="en">{word.word}</h1><p className="player-ipa">{word.pronunciation[accent].ipa}</p>{revealed ? <div className="player-answer"><h3>{word.meaning_zh}</h3><p lang="en">{word.definition_en}</p><blockquote lang="en">{word.example.en}<span>{word.example.zh}</span></blockquote><button type="button" onClick={() => speak(word.example.en)}>播放例句 ▶</button></div> : <button className="reveal-button" type="button" onClick={() => setRevealed(true)}>我想好了，显示词义</button>}</div><footer>{revealed ? <div className="grade-row"><button type="button" onClick={() => choose("again")}><strong>忘了</strong><span>10分钟后</span></button><button type="button" onClick={() => choose("hard")}><strong>困难</strong><span>缩短间隔</span></button><button type="button" onClick={() => choose("good")}><strong>记得</strong><span>进入下一级</span></button><button type="button" onClick={() => choose("easy")}><strong>很熟</strong><span>可跳一级</span></button></div> : <><button type="button" onClick={previous} disabled={index === 0}>← 上一个</button><button type="button" onClick={() => { grade(word.id, "good"); next(); }}>先看下一个 →</button></>}</footer></section></div>;
}
