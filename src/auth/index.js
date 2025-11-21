const express = require('express');
const router = express.Router();
const { generateToken } = require('./token');
const { findUserByEmail, createUser, comparePassword } = require('./userService');


// POST /auth/login
router.post('/login', async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = await findUserByEmail(email);
		if (!user) {
			return res.status(401).json({ message: 'Invalid user email' });
		}
		const isPasswordValid = await comparePassword(password, user.password);
		if (isPasswordValid) {
			const token = generateToken({ id: user.id, email: user.email });
			return res.json({ token });
		}
		return res.status(401).json({ message: 'Invalid password' });
	} catch (err) {
		return res.status(500).json({ message: 'Login failed', error: err.message });
	}
});


// POST /auth/register
router.post('/register', async (req, res) => {
	const { email, password, usertype = 'user' } = req.body;
	try {
		const existing = await findUserByEmail(email);
		if (existing) {
			return res.status(409).json({ message: 'User with this email already exists' });
		}
		const user = await createUser({ email, usertype, password });
		return res.status(201).json({ message: 'User registered successfully', user: { id: user.id, email: user.email } });
	} catch (err) {
		if (err.name === 'SequelizeUniqueConstraintError') {
			return res.status(409).json({ message: 'User with this email already exists' });
		}
		if (err.name === 'SequelizeValidationError') {
			return res.status(400).json({ message: 'Validation error', error: err.message });
		}
		return res.status(500).json({ message: 'Registration failed', error: err.message });
	}
});

module.exports = router;
