import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const outputRoot = new URL("../dist/portable/", import.meta.url);
const packageRoot = new URL("./Basic850-%E4%BE%BF%E6%90%BA%E7%89%88/", outputRoot);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(packageRoot, { recursive: true });
await cp(new URL("../deploy/portable/", import.meta.url), packageRoot, { recursive: true });
await cp(new URL("../dist/client/", import.meta.url), new URL("./www/", packageRoot), { recursive: true });

// Keep the batch bootstrap BOM-free, ASCII-only and CRLF. The Chinese menu lives
// in a BOM-marked PowerShell script so cmd.exe never has to decode Chinese text.
const launcherUrl = new URL("./启动英语学习教材.cmd", packageRoot);
const launcherText = (await readFile(launcherUrl, "utf8")).replace(/^\uFEFF/, "").replace(/\r?\n/g, "\r\n");
await writeFile(launcherUrl, launcherText, "utf8");

// Windows PowerShell 5.1 needs a BOM to decode Chinese UTF-8 source reliably.
for (const relativePath of ["./server/Basic850Launcher.ps1", "./server/Basic850Server.ps1", "./使用说明.txt"]) {
  const fileUrl = new URL(relativePath, packageRoot);
  const content = await readFile(fileUrl);
  const hasBom = content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf;
  if (!hasBom) await writeFile(fileUrl, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), content]));
}

console.log("Portable Windows package: dist/portable/Basic850-便携版");
