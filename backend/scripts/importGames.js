import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "../config/database.js";
import Game from "../models/game.js";
import cloudinary from "../config/cloudinary.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_FOLDER = path.join(__dirname, "../../database");

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function importGames() {
  await connectDB();

  const folders = fs
    .readdirSync(DATABASE_FOLDER, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let imported = 0, skipped = 0, errors = 0;

  for (const name of folders) {
    try {
      const gameDir = path.join(DATABASE_FOLDER, name);
      const linkFile = path.join(gameDir, "link.txt");

      if (!fs.existsSync(linkFile)) {
        skipped++;
        continue;
      }

      if (await Game.findOne({ name })) {
        skipped++;
        continue;
      }

      const link = fs.readFileSync(linkFile, "utf-8").trim();

      const tagsFile = path.join(gameDir, "tags.txt");
      const tags = fs.existsSync(tagsFile)
        ? fs.readFileSync(tagsFile, "utf-8")
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // Upload header image
      let headerImageUrl = null;
      const headerPath = path.join(gameDir, "header.jpg");
      if (fs.existsSync(headerPath)) {
        const result = await cloudinary.uploader.upload(headerPath, {
          folder: "gamestore/header",
        });
        headerImageUrl = result.secure_url;
      }

      // Upload other images
      const images = [];
      for (let i = 1; i <= 10; i++) {
        const imgPath = path.join(gameDir, `${i}.jpg`);
        if (fs.existsSync(imgPath)) {
          const result = await cloudinary.uploader.upload(imgPath, {
            folder: "gamestore/images",
          });
          images.push(result.secure_url);
        }
      }

      const game = new Game({
        name,
        slug: slugify(name),
        link,
        headerImage: headerImageUrl,
        images,
        tags,
      });

      await game.save();
      imported++;
    } catch (err) {
      console.error("Error importing", name, err);
      errors++;
    }
  }

  console.log({ imported, skipped, errors, total: folders.length });
  process.exit(0);
}

importGames();