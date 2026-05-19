const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

// GET all clans
router.get('/', async (req, res) => {
  try {
    const clans = await prisma.familyClan.findMany({
      include: { documents: true },
      orderBy: { name: 'asc' },
    });
    res.json(clans);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET single clan
router.get('/:id', async (req, res) => {
  try {
    const clan = await prisma.familyClan.findUnique({
      where: { id: Number(req.params.id) },
      include: { documents: true },
    });
    if (!clan) return res.status(404).json({ error: 'Не знайдено' });
    res.json(clan);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create clan
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, origin, period } = req.body;
    if (!name) return res.status(400).json({ error: 'Назва роду обов\'язкова' });
    const clan = await prisma.familyClan.create({
      data: { name, description, origin, period },
    });
    res.status(201).json(clan);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Рід з такою назвою вже існує' });
    res.status(500).json({ error: e.message });
  }
});

// PUT update clan
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, origin, period } = req.body;
    const clan = await prisma.familyClan.update({
      where: { id: Number(req.params.id) },
      data: { name, description, origin, period },
    });
    res.json(clan);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE clan
router.delete('/:id', auth, async (req, res) => {
  try {
    const clan = await prisma.familyClan.findUnique({
      where: { id: Number(req.params.id) },
      include: { documents: true },
    });
    if (!clan) return res.status(404).json({ error: 'Не знайдено' });

    for (const doc of clan.documents) {
      const filePath = path.join(__dirname, '..', doc.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.familyClan.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST upload document for clan
router.post('/:id/documents', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });
    const doc = await prisma.clanDocument.create({
      data: {
        filename: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        caption: req.body.caption || null,
        clanId: Number(req.params.id),
      },
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE document
router.delete('/documents/:docId', auth, async (req, res) => {
  try {
    const doc = await prisma.clanDocument.findUnique({ where: { id: Number(req.params.docId) } });
    if (!doc) return res.status(404).json({ error: 'Не знайдено' });
    const filePath = path.join(__dirname, '..', doc.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.clanDocument.delete({ where: { id: Number(req.params.docId) } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
