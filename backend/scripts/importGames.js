import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "../config/database.js";
import Game from "../models/game.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder chứa dữ liệu game
const DATABASE_FOLDER = path.join(__dirname, "../../database");

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function importGames() {
  await connectDB();

  const folders = fs
    .readdirSync(DATABASE_FOLDER, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let imported = 0,
    skipped = 0,
    errors = 0;

  for (const name of folders) {
    try {
      const gameDir = path.join(DATABASE_FOLDER, name);
      const linkFile = path.join(gameDir, "link.txt");

      if (!fs.existsSync(linkFile)) {
        skipped++;
        continue;
      }

      // Check trùng
      if (await Game.findOne({ name })) {
        skipped++;
        continue;
      }

      // Read link
      const link = fs.readFileSync(linkFile, "utf-8").trim();

      // Read tags
      const tagsFile = path.join(gameDir, "tags.txt");
      const tags = fs.existsSync(tagsFile)
        ? fs
            .readFileSync(tagsFile, "utf-8")
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // Read images (1.jpg → 10.jpg)
      const images = [];
      for (let i = 1; i <= 10; i++) {
        if (fs.existsSync(path.join(gameDir, `${i}.jpg`))) {
          images.push(path.join(name, `${i}.jpg`));
        }
      }

      const game = new Game({
        name,
        slug: slugify(name),
        link,
        headerImage: path.join(name, "header.jpg"),
        images,
        tags,
      });

      await game.save();
      imported++;
    } catch (err) {
      errors++;
    }
  }

  console.log({
    imported,
    skipped,
    errors,
    total: folders.length,
  });

  process.exit(0);
}

importGames();
