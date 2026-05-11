const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// The number of times bcrypt scrambles the password before storing it
// Higher = more secure but slower
const SALT_ROUNDS = 10;

// POST /api/users/signup
// Create a new user account
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, profilePicture } = req.body;

        // Check if an account with this email already exists to prevent duplicates
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already in use' });

        // Hash the plain text password before storing it in the database
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create the user document with the hashed password 
        const user = new User({ username, email, passwordHash, profilePicture });
        await user.save();

        // Return the new user's ID and username 
        res.status(201).json({ status: 'Success', userId: user._id, username: user.username });
    } catch (err) {
        res.status(500).json({ message: 'Error creating user', error: err });
    }
});

// POST /api/users/login
// Authenticates users
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Look up the user by email
        const user = await User.findOne({ email });
        if (!user) return res.json({ status: 'No account found for this email' });

        // Compare the plain text password against the stored hash 
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.json({ status: 'Incorrect password' });

        // Successful login 
        res.json({ status: 'Successful login', userId: user._id, username: user.username });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
});

// GET /api/users/test
// Returns all users in the database
router.get('/test', async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id
// Returns a single user by their MongoDB _id.
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user', error: err });
    }
});

// Put /api/users/:id
// Updates a user's profile
router.put('/:id', async (req, res) => {
    try {
        // If the user is changing their password, hash the new one before saving
        if (req.body.password) {
            req.body.passwordHash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
            delete req.body.password; // Remove plain text password so it never reaches the database
        }

        //  return the updated document instead of the old one
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error updating user', error: err });
    }
});
// Delete /api/users/:id
//  removes a user account from the database by their MongoDB _id.
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user', error: err });
    }
});

module.exports = router;