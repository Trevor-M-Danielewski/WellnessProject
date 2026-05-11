const mongoose = require('mongoose');

const WorkoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    date: String,
    types: [String],
    duration: Number,
    intensity: {
        label: String,
        emoji: String
    },
    notes: String
});

const WorkoutModel = mongoose.model('workouts', WorkoutSchema);

module.exports = WorkoutModel;