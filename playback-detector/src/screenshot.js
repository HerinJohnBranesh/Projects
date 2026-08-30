// import tools from node.js
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// find the screenshot folder
// go one folder up and enter into screenshots folder
const SCREENSHOTS_DIRECTORY = fileURLToPath(
  new URL("../screenshots/", import.meta.url),
);
// file types allowed 
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/**
 * Load every screenshot saved in this project's screenshots folder.
 *
 * Screenshots are sorted from oldest to newest using the time each file was
 * saved. The playback detector can use that order to compare earlier and later
 * frames.
 *
 * @returns {Promise<Array<{data: Buffer, name: string, timestamp: Date}>>}
 */
export async function loadScreenshots() {
  let entries;

  try {
    entries = await readdir(SCREENSHOTS_DIRECTORY, { withFileTypes: true });
  } catch (error) {
    throw new Error("Unable to read the screenshots folder.", { cause: error });
  }

  // make sure only image files are kept
  // remove everything except images
  // change file into usefull object {name:xxxx, path:xxxxx}
  const imagePaths = entries
    .filter(
      (entry) =>
        entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => ({ name: entry.name, path: path.join(SCREENSHOTS_DIRECTORY, entry.name) }));

  // read every image
  // get image byte/size
  // get image data like modified/saved time
  const screenshots = await Promise.all(
    imagePaths.map(async ({ name, path: imagePath }) => {
      const [data, fileStats] = await Promise.all([readFile(imagePath), stat(imagePath)]);

      // reject empty image file
      if (data.length === 0) {
        throw new Error(`Screenshot file is empty: ${name}`);
      }

      return { data, name, timestamp: fileStats.mtime };
    }),
  );

  // sort screenshot from oldest to newest
  return screenshots.sort((first, second) => first.timestamp - second.timestamp);
}
