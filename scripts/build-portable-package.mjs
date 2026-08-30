import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const packageName = "理想城Basic850-便携版";
const outputRoot = fileURLToPath(new URL("../dist/portable/", import.meta.url));
const packageRoot = join(outputRoot, packageName);
const archivePath = join(outputRoot, `${packageName}.zip`);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(packageRoot, { recursive: true });
await cp(fileURLToPath(new URL("../deploy/portable/", import.meta.url)), packageRoot, { recursive: true });
await cp(fileURLToPath(new URL("../dist/client/", import.meta.url)), join(packageRoot, "www"), { recursive: true });

// Keep the batch bootstrap BOM-free, ASCII-only and CRLF. The Chinese menu lives
// in a BOM-marked PowerShell script so cmd.exe never has to decode Chinese text.
const launcherPath = join(packageRoot, "启动英语学习教材.cmd");
const launcherText = (await readFile(launcherPath, "utf8")).replace(/^\uFEFF/, "").replace(/\r?\n/g, "\r\n");
await writeFile(launcherPath, launcherText, "utf8");

// Windows PowerShell 5.1 needs a BOM to decode Chinese UTF-8 source reliably.
for (const relativePath of ["./server/Basic850Launcher.ps1", "./server/Basic850Server.ps1", "./使用说明.txt"]) {
  const filePath = join(packageRoot, relativePath);
  const content = await readFile(filePath);
  const hasBom = content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf;
  if (!hasBom) await writeFile(filePath, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), content]));
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  };
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(entryPath)));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files.sort((left, right) => left.localeCompare(right, "zh-CN"));
}

async function createZip(sourceDirectory, zipPath) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const filePath of await listFiles(sourceDirectory)) {
    const data = await readFile(filePath);
    const compressed = deflateRawSync(data, { level: 9 });
    const fileName = `${packageName}/${relative(sourceDirectory, filePath).split(sep).join("/")}`;
    const fileNameBytes = Buffer.from(fileName, "utf8");
    const checksum = crc32(data);
    const modified = dosDateTime((await stat(filePath)).mtime);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(modified.time, 10);
    localHeader.writeUInt16LE(modified.date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(fileNameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, fileNameBytes, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(modified.time, 12);
    centralHeader.writeUInt16LE(modified.date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(fileNameBytes.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, fileNameBytes);

    offset += localHeader.length + fileNameBytes.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  const fileCount = centralParts.length / 2;
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(fileCount, 8);
  end.writeUInt16LE(fileCount, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  await writeFile(zipPath, Buffer.concat([...localParts, centralDirectory, end]));
}

await createZip(packageRoot, archivePath);

console.log(`Portable Windows package: dist/portable/${packageName}`);
console.log(`Portable Windows archive: dist/portable/${packageName}.zip`);
