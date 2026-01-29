import express from "express";
import Game from "../models/game.js";

const router = express.Router();

// GET /api/games - Lấy tất cả games
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      tag,
      featured,
      search,
      sort = "-createdAt",
    } = req.query;

    // Build query
    const query = {};

    if (tag) {
      query.tags = tag;
    }

    if (featured === "true") {
      query.featured = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const games = await Game.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Game.countDocuments(query);

    res.json({
      success: true,
      data: games,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/games/:id - Lấy game theo ID
router.get("/:id", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.json({
      success: true,
      data: game,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/games/slug/:slug - Lấy game theo slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.json({
      success: true,
      data: game,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/games/tags/all - Lấy tất cả tags unique
router.get("/tags/all", async (req, res) => {
  try {
    const tags = await Game.distinct("tags");
    res.json({
      success: true,
      data: tags.sort(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/games - Tạo game mới
router.post("/", async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();

    res.status(201).json({
      success: true,
      data: game,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// PUT /api/games/:id - Cập nhật game
router.put("/:id", async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.json({
      success: true,
      data: game,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE /api/games/:id - Xóa game
router.delete("/:id", async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.json({
      success: true,
      message: "Game deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
