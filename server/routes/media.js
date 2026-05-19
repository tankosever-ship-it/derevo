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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

// POST upload file for a person
router.post('/upload/:personId', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });

    const isPhoto = /jpeg|jpg|png|gif|webp/.test(path.extname(req.file.originalname).toLowerCase());
    const media = await prisma.media.create({
      data: {
        filename: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        type: isPhoto ? 'PHOTO' : 'DOCUMENT',
        caption: req.body.caption || null,
        personId: Number(req.params.personId),
      },
    });
    res.status(201).json(media);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE media
router.delete('/:id', auth, async (req, res) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: Number(req.params.id) } });
    if (!media) return res.status(404).json({ error: 'Не знайдено' });

    const filePath = path.join(__dirname, '..', media.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.media.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
