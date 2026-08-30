import assert from "node:assert/strict";
import { readdir, rm, utimes, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadScreenshots } from "../src/screenshot.js";

const screenshotsDirectory = fileURLToPath(
  new URL("../screenshots/", import.meta.url),
);

test("loadScreenshots returns image files from oldest to newest", async (t) => {
  const testPrefix = "test-screenshot-";
  const olderName = `${testPrefix}older.png`;
  const newerName = `${testPrefix}newer.jpg`;
  const textName = `${testPrefix}notes.txt`;
  const olderPath = path.join(screenshotsDirectory, olderName);
  const newerPath = path.join(screenshotsDirectory, newerName);
  const textPath = path.join(screenshotsDirectory, textName);

  t.after(async () => {
    await Promise.all([rm(olderPath, { force: true }), rm(newerPath, { force: true }), rm(textPath, { force: true })]);
  });

  await Promise.all([
    writeFile(olderPath, "older screenshot"),
    writeFile(newerPath, "newer screenshot"),
    writeFile(textPath, "not an image"),
  ]);
  await Promise.all([
    utimes(olderPath, new Date("2026-01-01T00:00:00Z"), new Date("2026-01-01T00:00:00Z")),
    utimes(newerPath, new Date("2026-01-01T00:00:05Z"), new Date("2026-01-01T00:00:05Z")),
  ]);

  const screenshots = await loadScreenshots();
  const names = screenshots.map((screenshot) => screenshot.name);

  assert.ok(names.indexOf(olderName) < names.indexOf(newerName));
  assert.equal(screenshots.find((screenshot) => screenshot.name === olderName).data.toString(), "older screenshot");
  assert.equal(screenshots.find((screenshot) => screenshot.name === newerName).data.toString(), "newer screenshot");
  assert.ok(!names.includes(textName));
});

test("loadScreenshots rejects empty image files", async (t) => {
  const name = "test-screenshot-empty.png";
  const imagePath = path.join(screenshotsDirectory, name);
  t.after(() => rm(imagePath, { force: true }));
  await writeFile(imagePath, "");

  await assert.rejects(loadScreenshots(), /Screenshot file is empty: test-screenshot-empty.png/);
});

test("the screenshots folder is available", async () => {
  const entries = await readdir(screenshotsDirectory);
  assert.ok(entries.includes(".gitkeep"));
});
