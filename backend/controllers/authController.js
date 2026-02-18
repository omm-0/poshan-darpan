const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password',
            });
        }

        // Find user by username (includes password)
        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check password
        const isMatch = await User.matchPassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if role matches
        if (role && user.role !== role) {
            return res.status(401).json({
                success: false,
                message: 'Selected role does not match your account',
            });
        }

        // Populate school data
        let schoolData = null;
        if (user.schoolId) {
            const School = require('../models/School');
            schoolData = await School.findById(user.schoolId);
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                designation: user.designation,
                schoolId: schoolData,
                district: user.district,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findByIdPopulated(req.user._id);
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                designation: user.designation,
                schoolId: user.schoolId,
                district: user.district,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

module.exports = { login, getMe };
