const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('./models/User');
const DailyJournalModel = require('./models/DailyJournal');
const SleepJournalModel = require('./models/SleepJournal');
const WorkoutJournalModel = require('./models/WorkoutJournal');
const PersonalGrowthModel = require('./models/PersonalGrowth');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connection established'))
    .catch(err => console.log(err));

// ── JWT Middleware ────────────────────────────────────────────
// This function runs before any protected route.
// It checks the Authorization header for a valid token.
// If valid, it attaches the userId to req so routes can use it.
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({status: 'No token provided'});
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({status: 'Invalid or expired token'});
        req.userId = decoded.userId;
        next();
    });
}

// ── Auth (public — no token needed) ──────────────────────────
app.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await UserModel.findOne({email});
        if (!user) return res.json({status: 'No account found for this email'});
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.json({status: 'Incorrect password'});
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
        res.json({status: 'Successful login', token, userId: user._id, name: user.name});
    } catch (err) {
        res.status(500).json({status: 'Server error', error: err.message});
    }
})

app.post('/signup', async (req, res) => {
    try {
        const {name, email, password} = req.body;
        const existing = await UserModel.findOne({email});
        if (existing) return res.json({status: 'Email already in use'});
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await UserModel.create({name, email, passwordHash});
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
        res.json({status: 'Success', token, userId: user._id, name: user.name});
    } catch (err) {
        res.status(500).json({status: 'Server error', error: err.message});
    }
})

// ── User Profile (protected) ──────────────────────────────────
app.get('/user/:userId', verifyToken, (req, res) => {
    UserModel.findById(req.params.userId)
    .then(user => res.json(user))
    .catch(err => res.json(err))
})

app.put('/user/:userId', verifyToken, (req, res) => {
    UserModel.findByIdAndUpdate(req.params.userId, req.body, {new: true})
    .then(user => res.json(user))
    .catch(err => res.json(err))
})

// ── Daily Journal (protected) ─────────────────────────────────
app.post('/journal', verifyToken, (req, res) => {
    DailyJournalModel.create({...req.body, userId: req.userId})
    .then(entry => res.json(entry))
    .catch(err => res.json(err))
})

app.get('/journal/:userId', verifyToken, (req, res) => {
    DailyJournalModel.find({userId: req.params.userId})
    .sort({date: -1})
    .then(entries => res.json(entries))
    .catch(err => res.json(err))
})

// ── Sleep Journal (protected) ─────────────────────────────────
app.post('/sleep', verifyToken, (req, res) => {
    SleepJournalModel.create({...req.body, userId: req.userId})
    .then(entry => res.json(entry))
    .catch(err => res.json(err))
})

app.get('/sleep/:userId', verifyToken, (req, res) => {
    SleepJournalModel.find({userId: req.params.userId})
    .sort({date: -1})
    .then(entries => res.json(entries))
    .catch(err => res.json(err))
})

// ── Workout Journal (protected) ───────────────────────────────
app.post('/workout', verifyToken, (req, res) => {
    WorkoutJournalModel.create({...req.body, userId: req.userId})
    .then(entry => res.json(entry))
    .catch(err => res.json(err))
})

app.get('/workout/:userId', verifyToken, (req, res) => {
    WorkoutJournalModel.find({userId: req.params.userId})
    .sort({date: -1})
    .then(entries => res.json(entries))
    .catch(err => res.json(err))
})

// ── Personal Growth (protected) ───────────────────────────────
app.post('/growth', verifyToken, (req, res) => {
    PersonalGrowthModel.create({...req.body, userId: req.userId})
    .then(entry => res.json(entry))
    .catch(err => res.json(err))
})

app.get('/growth/:userId', verifyToken, (req, res) => {
    PersonalGrowthModel.find({userId: req.params.userId})
    .sort({date: -1})
    .then(entries => res.json(entries))
    .catch(err => res.json(err))
})

// ── Stats (protected) ─────────────────────────────────────────
app.get('/stats/:userId', verifyToken, async (req, res) => {
    const {userId} = req.params;
    try {
        const [journal, sleep, workout, growth] = await Promise.all([
            DailyJournalModel.countDocuments({userId}),
            SleepJournalModel.countDocuments({userId}),
            WorkoutJournalModel.countDocuments({userId}),
            PersonalGrowthModel.countDocuments({userId}),
        ]);
        res.json({journal, sleep, workout, growth});
    } catch (err) {
        res.json(err);
    }
})

// ── Recent entries for Home graphs (protected) ────────────────
app.get('/recent/:userId', verifyToken, async (req, res) => {
    const {userId} = req.params;
    try {
        const [journal, sleep, workout] = await Promise.all([
            DailyJournalModel.find({userId}).sort({date: -1}).limit(7),
            SleepJournalModel.find({userId}).sort({date: -1}).limit(7),
            WorkoutJournalModel.find({userId}).sort({date: -1}).limit(7),
        ]);
        res.json({journal, sleep, workout});
    } catch (err) {
        res.json(err);
    }
})

// ─────────────────────────────────────────────────────────────
app.listen(port, () => {
    console.log('Server running on port: ' + port);
});