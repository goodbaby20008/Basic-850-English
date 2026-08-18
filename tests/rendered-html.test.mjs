import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("exports a portable static learning site", async () => {
  const html = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  assert.match(html, /Basic 850/);
  assert.match(html, /零基础英语学习教材/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
  await access(new URL("../dist/client/sw.js", import.meta.url));
  await access(new URL("../dist/client/og.png", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});

test("ships all 850 words and a complete 85-lesson map", async () => {
  const [wordText, courseText] = await Promise.all([
    readFile(new URL("../dist/client/data/words.json", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/data/course.json", import.meta.url), "utf8"),
  ]);
  const wordData = JSON.parse(wordText);
  const courseData = JSON.parse(courseText);
  assert.equal(wordData.words.length, 850);
  assert.equal(new Set(wordData.words.map((item) => item.id)).size, 850);
  assert.equal(courseData.units.length, 17);
  const lessons = courseData.units.flatMap((unit) => unit.lessons);
  assert.equal(lessons.length, 85);
  assert.ok(lessons.every((lesson) => lesson.wordIds.length === 10));
  assert.equal(new Set(lessons.flatMap((lesson) => lesson.wordIds)).size, 850);
});

test("ships the alphabet illustrations and 48 audible phoneme clips", async () => {
  const illustrationUrl = new URL("../dist/client/illustrations/alphabet/", import.meta.url);
  const audioUrl = new URL("../dist/client/audio/phonemes/", import.meta.url);
  const illustrations = (await readdir(illustrationUrl)).filter((name) => name.endsWith(".webp"));
  const clips = (await readdir(audioUrl)).filter((name) => name.endsWith(".mp3"));

  assert.equal(illustrations.length, 6);
  assert.equal(clips.length, 48);
  for (const name of [...illustrations.map((item) => [illustrationUrl, item]), ...clips.map((item) => [audioUrl, item])]) {
    const [directory, file] = name;
    assert.ok((await stat(new URL(file, directory))).size > 1_000, `${file} should contain real media data`);
  }
});

test("ships 197 local word-picture SVGs with an attribution manifest", async () => {
  const pictureUrl = new URL("../dist/client/illustrations/words/", import.meta.url);
  const pictures = (await readdir(pictureUrl)).filter((name) => name.endsWith(".svg"));
  const manifest = JSON.parse(await readFile(new URL("manifest.json", pictureUrl), "utf8"));

  assert.equal(pictures.length, 197);
  assert.equal(manifest.count, 197);
  assert.equal(new Set(manifest.assets.map((item) => item.wordId)).size, 197);
  await access(new URL("NOTICE.md", pictureUrl));
  for (const name of pictures) {
    const assetUrl = new URL(name, pictureUrl);
    assert.ok((await stat(assetUrl)).size > 100, `${name} should contain a real SVG graphic`);
    assert.match(await readFile(assetUrl, "utf8"), /<svg\b/);
  }
});

test("pre-caches the built shell while optional learning media fail independently", async () => {
  const worker = await readFile(new URL("../dist/client/sw.js", import.meta.url), "utf8");
  assert.match(worker, /cacheBuiltAppShell/);
  assert.match(worker, /Promise\.allSettled/);
  assert.match(worker, /WORD_PICTURE_MANIFEST/);
  assert.match(worker, /optional offline assets will be retried/);
});

test("keeps starter-only assets out of the final source", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  const [entry, html, packageJson] = await Promise.all([
    readFile(new URL("../app/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(entry, /codex-preview|SkeletonPreview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(html, /manifest\.webmanifest/);
  await access(new URL("public/data/course.json", root));
});
