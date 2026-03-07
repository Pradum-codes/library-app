import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const seedAfter = args.has("--seed");

// Load env from .env.local first, then .env
dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

if (!cloudName || (!uploadPreset && (!apiKey || !apiSecret))) {
  console.error(
    "Missing Cloudinary credentials. Provide CLOUDINARY_CLOUD_NAME and either CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET."
  );
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const dataPath = path.join(rootDir, "data", "site-data.json");

const genreFiles = [
  { file: "fantasy.html", slug: "fantasy" },
  { file: "life-values.html", slug: "life-values" },
  { file: "action-and-adventure.html", slug: "action-and-adventure" },
  { file: "mystery-and-investigation.html", slug: "mystery-and-investigation" },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .trim();
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function extractBetween(html, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(regex);
  return match ? cleanText(match[1].replace(/<[^>]*>/g, "")) : "";
}

function extractAll(html, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const values = [];
  let match = regex.exec(html);
  while (match) {
    values.push(cleanText(match[1].replace(/<[^>]*>/g, "")));
    match = regex.exec(html);
  }
  return values;
}

function extractBookBlocks(html) {
  const blocks = html.split('<div class="book">');
  return blocks.slice(1).map((block) => block.split("</div>")[0]);
}

function extractGenreBoxes(html) {
  const blocks = html.split('<div class="box">');
  return blocks.slice(1).map((block) => block.split("</div>")[0]);
}

function resolveLocalPath(src) {
  if (!src) return null;
  return path.join(rootDir, src);
}

async function fileExists(filePath) {
  if (!filePath) return false;
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function uploadImage(localPath, publicId) {
  if (dryRun) {
    return { secure_url: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}` };
  }

  const options = {
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
  };

  if (uploadPreset) {
    options.upload_preset = uploadPreset;
  }

  const result = await cloudinary.uploader.upload(localPath, options);
  return result;
}

async function main() {
  const raw = await fs.readFile(dataPath, "utf8");
  const data = JSON.parse(raw);

  const bookMap = new Map();
  const duplicates = [];
  const missingFiles = [];

  for (const { file, slug } of genreFiles) {
    const html = await fs.readFile(path.join(rootDir, file), "utf8");
    const blocks = extractBookBlocks(html);

    for (const block of blocks) {
      const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);
      const src = imgMatch ? imgMatch[1].trim() : "";
      const title = extractBetween(block, "h2");
      const paragraphs = extractAll(block, "p");
      let author = "";
      let description = "";

      if (paragraphs.length > 0) {
        const authorText = paragraphs[0];
        if (authorText.toLowerCase().startsWith("author:")) {
          author = authorText.replace(/^author:\s*/i, "").trim();
          description = paragraphs[1] || "";
        } else {
          description = paragraphs[0] || "";
        }
      }

      const lessons = extractAll(block, "li");

      if (!title) continue;
      const key = `${slug}::${title.toLowerCase()}`;
      if (bookMap.has(key)) {
        duplicates.push({ slug, title, src });
        continue;
      }

      const localPath = resolveLocalPath(src);
      if (src && !(await fileExists(localPath))) {
        missingFiles.push({ slug, title, src });
      }

      bookMap.set(key, {
        genre: slug,
        title,
        author,
        description,
        lessons: lessons.length ? lessons : undefined,
        localPath,
      });
    }
  }

  const indexHtml = await fs.readFile(path.join(rootDir, "index.html"), "utf8");
  const genreBoxes = extractGenreBoxes(indexHtml);
  const genreImageBySlug = new Map();

  for (const box of genreBoxes) {
    const imgMatch = box.match(/<img[^>]*src="([^"]+)"/i);
    const src = imgMatch ? imgMatch[1].trim() : "";
    const linkMatch = box.match(/<a[^>]*href="([^"]+)"/i);
    const href = linkMatch ? linkMatch[1].trim() : "";
    const slug = href.replace(".html", "");

    if (!slug || !src) continue;
    const localPath = resolveLocalPath(src);
    if (src && !(await fileExists(localPath))) {
      missingFiles.push({ slug, title: "Genre image", src });
    }
    genreImageBySlug.set(slug, { localPath, src });
  }

  const updatedBooks = [];
  const updatedGenres = [];

  for (const book of data.books) {
    const key = `${book.genre}::${book.title.toLowerCase()}`;
    const entry = bookMap.get(key);

    if (entry) {
      book.author = book.author || entry.author;
      book.description = book.description || entry.description;
      if (!book.lessons && entry.lessons) {
        book.lessons = entry.lessons;
      }
      if (entry.localPath && (await fileExists(entry.localPath))) {
        const publicId = `booknest/${book.genre}/${slugify(book.title)}`;
        const result = await uploadImage(entry.localPath, publicId);
        book.image = result.secure_url;
        updatedBooks.push(book.id);
      }
    }
  }

  // Add missing books from HTML that are not yet in JSON
  for (const [key, entry] of bookMap.entries()) {
    const alreadyExists = data.books.some(
      (book) => `${book.genre}::${book.title.toLowerCase()}` === key
    );
    if (alreadyExists) continue;

    const id = `${entry.genre}-${slugify(entry.title)}`;
    let image = "";
    if (entry.localPath && (await fileExists(entry.localPath))) {
      const publicId = `booknest/${entry.genre}/${slugify(entry.title)}`;
      const result = await uploadImage(entry.localPath, publicId);
      image = result.secure_url;
    }

    data.books.push({
      id,
      genre: entry.genre,
      title: entry.title,
      author: entry.author,
      description: entry.description,
      lessons: entry.lessons,
      image,
    });
    updatedBooks.push(id);
  }

  for (const genre of data.genres) {
    const entry = genreImageBySlug.get(genre.slug);
    if (entry && entry.localPath && (await fileExists(entry.localPath))) {
      const publicId = `booknest/genres/${genre.slug}`;
      const result = await uploadImage(entry.localPath, publicId);
      genre.image = result.secure_url;
      updatedGenres.push(genre.slug);
    }
  }

  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));

  console.log("Upload complete.");
  console.log(`Updated books: ${updatedBooks.length}`);
  console.log(`Updated genres: ${updatedGenres.length}`);

  if (duplicates.length) {
    console.log("Duplicate titles skipped:");
    duplicates.forEach((item) => console.log(`- ${item.slug}: ${item.title}`));
  }

  if (missingFiles.length) {
    console.log("Missing local files:");
    missingFiles.forEach((item) =>
      console.log(`- ${item.slug} | ${item.title} | ${item.src}`)
    );
  }

  if (seedAfter) {
    const { execSync } = await import("child_process");
    execSync("npm run seed", { stdio: "inherit" });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
