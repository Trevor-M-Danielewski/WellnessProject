const express = require('express');
const router = express.Router();
const DailyJournalModel = require('../models/DailyJournal');
 
// POST /api/journal
router.post('/', (req, res) => {
    DailyJournalModel.create(req.body)
        .then(entry => res.json(entry))
        .catch(err => res.json(err));
});
 
// GET /api/journal/:userId
router.get('/:userId', (req, res) => {
    DailyJournalModel.find({ userId: req.params.userId })
        .sort({ date: -1 })
        .then(entries => res.json(entries))
        .catch(err => res.json(err));
});
 
// PUT /api/journal/:id
router.put('/:id', (req, res) => {
    DailyJournalModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then(entry => {
            if (!entry) return res.status(404).json({ message: 'Entry not found' });
            res.json(entry);
        })
        .catch(err => res.json(err));
});
 
// DELETE /api/journal/:id
router.delete('/:id', (req, res) => {
    DailyJournalModel.findByIdAndDelete(req.params.id)
        .then(entry => {
            if (!entry) return res.status(404).json({ message: 'Entry not found' });
            res.json({ message: 'Entry deleted' });
        })
        .catch(err => res.json(err));
});
 
module.exports = router;
 