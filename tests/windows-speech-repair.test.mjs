import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const packageRoot = new URL("../dist/portable/%E7%90%86%E6%83%B3%E5%9F%8EBasic850-%E4%BE%BF%E6%90%BA%E7%89%88/", import.meta.url);
const repairCmdUrl = new URL("./%E4%BF%AE%E5%A4%8D%E8%8B%B1%E8%AF%AD%E5%8F%91%E9%9F%B3.cmd", packageRoot);
const repairPsUrl = new URL("./server/FixEnglishSpeech.ps1", packageRoot);

function run(executable, argumentsList) {
  return spawnSync(executable, argumentsList, { encoding: "utf8", timeout: 20_000, windowsHide: true });
}

test("English speech repair package keeps cmd ASCII-safe and PowerShell UTF-8 BOM-safe", async () => {
  const [cmd, script] = await Promise.all([readFile(repairCmdUrl), readFile(repairPsUrl)]);
  assert.notDeepEqual([...cmd.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.ok([...cmd].every((byte) => byte <= 0x7f), "repair cmd must remain ASCII-only");
  assert.doesNotMatch(cmd.toString("utf8"), /(?<!\r)\n/, "repair cmd should use CRLF line endings");
  assert.deepEqual([...script.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.match(script.toString("utf8"), /Language\.TextToSpeech~~~en-GB~0\.0\.1\.0/);
  assert.match(script.toString("utf8"), /Language\.TextToSpeech~~~en-US~0\.0\.1\.0/);
});

test("English speech repair self-test works in cmd, Windows PowerShell 5.1, and PowerShell 7", { skip: process.platform !== "win32" }, () => {
  const repairCmdPath = fileURLToPath(repairCmdUrl);
  const repairPsPath = fileURLToPath(repairPsUrl);
  const windowsPowerShell = `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
  const cmdLaunch = run(windowsPowerShell, [
    "-NoLogo",
    "-NoProfile",
    "-Command",
    "& { param([string]$p) $x = Start-Process -FilePath $p -ArgumentList '--self-test' -Wait -PassThru; exit $x.ExitCode }",
    repairCmdPath,
  ]);
  assert.equal(cmdLaunch.error, undefined, cmdLaunch.error?.message);
  assert.equal(cmdLaunch.status, 0, `${cmdLaunch.stdout}\n${cmdLaunch.stderr}`);

  const executions = [
    run(windowsPowerShell, ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", repairPsPath, "-SelfTest"]),
    run("pwsh.exe", ["-NoLogo", "-NoProfile", "-File", repairPsPath, "-SelfTest"]),
  ];

  for (const result of executions) {
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(`${result.stdout}\n${result.stderr}`, /BASIC850_SPEECH_REPAIR_SELFTEST_OK/);
  }
});
