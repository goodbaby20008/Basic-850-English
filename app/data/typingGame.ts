export type TypingLanguageMode = "english" | "bilingual" | "chinese";
export type TypingContentMode = "words" | "sentences" | "mixed";
export type TypingScope = "lesson" | "learned" | "all";

export type TypingWordLike = {
  id: string;
  word: string;
  meaning_zh: string;
  example: { en: string; zh: string };
};

export type TypingPrompt = {
  id: string;
  kind: "word" | "sentence";
  word: TypingWordLike;
};

export type TypingComparison = {
  characters: { value: string; state: "correct" | "wrong" | "pending" }[];
  correct: number;
  wrong: number;
};

export function primaryChineseMeaning(meaning: string) {
  return meaning.split(/[；;]/, 1)[0]?.trim() || meaning.trim();
}

export function typingTarget(prompt: TypingPrompt, language: TypingLanguageMode) {
  if (language === "chinese") {
    return prompt.kind === "word" ? primaryChineseMeaning(prompt.word.meaning_zh) : prompt.word.example.zh;
  }
  return prompt.kind === "word" ? prompt.word.word : prompt.word.example.en;
}

export function typingHint(prompt: TypingPrompt, language: TypingLanguageMode) {
  if (language !== "bilingual") return "";
  return prompt.kind === "word" ? prompt.word.meaning_zh : prompt.word.example.zh;
}

function shuffled<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function createTypingSession(
  words: TypingWordLike[],
  content: TypingContentMode,
  count: number,
  random: () => number = Math.random,
) {
  if (!words.length || count <= 0) return [];
  const order = shuffled(words, random);
  return Array.from({ length: count }, (_, index): TypingPrompt => {
    const word = order[index % order.length];
    const kind = content === "mixed" ? (index % 2 === 0 ? "word" : "sentence") : content === "words" ? "word" : "sentence";
    return { id: `${word.id}-${kind}-${index}`, kind, word };
  });
}

export function compareTyping(target: string, typed: string): TypingComparison {
  let correct = 0;
  let wrong = 0;
  const characters = Array.from(target).map((value, index) => {
    const actual = Array.from(typed)[index];
    if (actual === undefined) return { value, state: "pending" as const };
    if (actual === value) {
      correct += 1;
      return { value, state: "correct" as const };
    }
    wrong += 1;
    return { value, state: "wrong" as const };
  });
  wrong += Math.max(0, Array.from(typed).length - characters.length);
  return { characters, correct, wrong };
}

export function calculateTypingSpeed(characterCount: number, elapsedMs: number, language: TypingLanguageMode) {
  if (characterCount <= 0 || elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  const units = language === "chinese" ? characterCount : characterCount / 5;
  return Math.max(0, Math.round(units / minutes));
}
