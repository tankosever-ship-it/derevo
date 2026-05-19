const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST create relationship
router.post('/', auth, async (req, res) => {
  try {
    const { personAId, personBId, type } = req.body;
    const rel = await prisma.relationship.create({
      data: { personAId: Number(personAId), personBId: Number(personBId), type },
    });
    res.status(201).json(rel);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE relationship
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.relationship.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET all relationships (for tree building)
router.get('/', auth, async (req, res) => {
  try {
    const rels = await prisma.relationship.findMany({
      include: {
        personA: { select: { id: true, firstName: true, lastName: true, gender: true } },
        personB: { select: { id: true, firstName: true, lastName: true, gender: true } },
      },
    });
    res.json(rels);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
