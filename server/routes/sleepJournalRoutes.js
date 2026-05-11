const express = require('express');
const router = express.Router();
const SleepJournalModel = require('../models/SleepJournal');

// POST /api/sleep 
router.post('/', (req, res) => {
    SleepJournalModel.create(req.body)
        .then(entry => res.json(entry))
        .catch(err => res.json(err));
});

// GET /api/sleep/:userId 
router.get('/:userId', (req, res) => {
    SleepJournalModel.find({ userId: req.params.userId })
        .sort({ sleepDate: -1 })
        .then(entries => res.json(entries))
        .catch(err => res.json(err));
});

// PUT /api/sleep/:id 
router.put('/:id', (req, res) => {
    SleepJournalModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then(entry => {
            if (!entry) return res.status(404).json({ message: 'Entry not found' });
            res.json(entry);
        })
        .catch(err => res.json(err));
});

// DELETE /api/sleep/:id 
router.delete('/:id', (req, res) => {
    SleepJournalModel.findByIdAndDelete(req.params.id)
        .then(entry => {
            if (!entry) return res.status(404).json({ message: 'Entry not found' });
            res.json({ message: 'Entry deleted' });
        })
        .catch(err => res.json(err));
});

module.exports = router;
