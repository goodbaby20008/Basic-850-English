import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const packageRoot = new URL("../dist/portable/Basic850-%E4%BE%BF%E6%90%BA%E7%89%88/", import.meta.url);

test("build emits one-click Windows launcher with a complete static site", async () => {
  const launcherUrl = new URL("./%E5%90%AF%E5%8A%A8%E8%8B%B1%E8%AF%AD%E5%AD%A6%E4%B9%A0%E6%95%99%E6%9D%90.cmd", packageRoot);
  const serverUrl = new URL("./server/Basic850Server.ps1", packageRoot);
  const guideUrl = new URL("./%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E.txt", packageRoot);
  const siteIndexUrl = new URL("./www/index.html", packageRoot);
  const wordsUrl = new URL("./www/data/words.json", packageRoot);
  const classicsUrl = new URL("./www/data/classics.json", packageRoot);

  await Promise.all([launcherUrl, serverUrl, guideUrl, siteIndexUrl, wordsUrl, classicsUrl].map((url) => access(url)));
  const [launcher, server, guide, html, wordsStat] = await Promise.all([
    readFile(launcherUrl, "utf8"),
    readFile(serverUrl, "utf8"),
    readFile(guideUrl, "utf8"),
    readFile(siteIndexUrl, "utf8"),
    stat(wordsUrl),
  ]);

  assert.match(launcher, /choice \/C 1234/i);
  assert.match(launcher, /-Mode local/);
  assert.match(launcher, /-Mode lan/);
  assert.doesNotMatch(launcher, /\b(?:node|npm|python)\b/i);
  assert.match(server, /TcpListener/);
  assert.match(server, /IPAddress\]::Loopback/);
  assert.match(server, /IPAddress\]::Any/);
  assert.match(server, /Start-Process \$localUrl/);
  assert.match(guide, /不需要安装 Node\.js、Python、Nginx/);
  assert.match(html, /Basic 850/);
  assert.ok(wordsStat.size > 1_000_000, "the complete 850-word dataset should be packaged");
});

test("Windows launcher is BOM-free while PowerShell-facing UTF-8 files carry a BOM", async () => {
  const launcher = await readFile(new URL("./%E5%90%AF%E5%8A%A8%E8%8B%B1%E8%AF%AD%E5%AD%A6%E4%B9%A0%E6%95%99%E6%9D%90.cmd", packageRoot));
  assert.notDeepEqual([...launcher.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(launcher.subarray(0, 9).toString("ascii"), "@echo off");
  assert.doesNotMatch(launcher.toString("utf8"), /(?<!\r)\n/, "batch file should use CRLF line endings");

  const bomFiles = [
    new URL("./server/Basic850Server.ps1", packageRoot),
    new URL("./%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E.txt", packageRoot),
  ];
  for (const file of bomFiles) {
    const bytes = await readFile(file);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  }
});
