const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const include = {
  media: true,
  relationshipsAsA: { include: { personB: { select: { id: true, firstName: true, lastName: true, gender: true } } } },
  relationshipsAsB: { include: { personA: { select: { id: true, firstName: true, lastName: true, gender: true } } } },
};

// GET all persons
router.get('/', auth, async (req, res) => {
  try {
    const { archival } = req.query;
    const persons = await prisma.person.findMany({
      where: archival !== undefined ? { isArchival: archival === 'true' } : {},
      include: { media: { where: { type: 'PHOTO' }, take: 1 } },
      orderBy: { lastName: 'asc' },
    });
    res.json(persons);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET one person
router.get('/:id', auth, async (req, res) => {
  try {
    const person = await prisma.person.findUnique({
      where: { id: Number(req.params.id) },
      include,
    });
    if (!person) return res.status(404).json({ error: 'Не знайдено' });
    res.json(person);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create person
router.post('/', auth, async (req, res) => {
  try {
    const person = await prisma.person.create({ data: req.body });
    res.status(201).json(person);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT update person
router.put('/:id', auth, async (req, res) => {
  try {
    const person = await prisma.person.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(person);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE person
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.person.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET unique family lines (for archive filter)
router.get('/meta/family-lines', auth, async (req, res) => {
  try {
    const result = await prisma.person.findMany({
      where: { isArchival: true, familyLine: { not: null } },
      select: { familyLine: true },
      distinct: ['familyLine'],
    });
    res.json(result.map(r => r.familyLine));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
