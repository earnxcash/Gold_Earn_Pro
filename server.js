const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Using bcryptjs as requested
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit'); // For security
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Security Update: Only allow requests from your frontend domain (and localhost for testing)
const allowedOrigins = [
    process.env.FRONTEND_URL, // This will be your Vercel URL
    'http://localhost:3000',  // Local React (Primary)
    'http://localhost:5173'   // Local React (Backup/Vite default)
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.use(bodyParser.json());

// --- SECURITY: RATE LIMITER ---
// Prevents brute-force attacks on login/register
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://manarul:Manarul435@cluster0.dutivty.mongodb.net/earningApp?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Schemas ---
const TransactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    paymentMethod: { type: String }, // For withdrawals
    accountNumber: { type: String }  // For withdrawals
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
    joinedDate: { type: Date, default: Date.now },
    transactions: [TransactionSchema],
    
    // Referral System Logic
    referredBy: { type: String, default: null }, // Stores the code of the person who invited this user
    referralBonusPaid: { type: Boolean, default: false }, // True if the referrer has already received the 500 pts
    
    // Security & Device Locking
    deviceId: { type: String, default: null }, // Lock account to this ID

    // Limits & Tracking
    taskDate: { type: String, default: new Date().toDateString() },
    lastCheckIn: { type: Date },
    spinCount: { type: Number, default: 0 },
    spinLimit: { type: Number, default: 10 },
    mathCount: { type: Number, default: 0 },
    mathLimit: { type: Number, default: 10 },
    videoCount: { type: Number, default: 0 },
    videoLimit: { type: Number, default: 10 },
    
    // Lifetime Stats (Required for referral condition)
    lifetimeVideoCount: { type: Number, default: 0 } 
});

const User = mongoose.model('User', UserSchema);

// --- Constants ---
const REWARDS = {
    math: 20,
    video: 30,
    checkin: 50,
    refer: 500 // Bonus for the referrer
};

const VALID_SPIN_VALUES = [0, 5, 10, 15, 20, 25, 30, 40];

// --- Middleware: Verify JWT ---
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access Denied' });

    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secretKey123');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid Token' });
    }
};

// --- Routes ---

// 1. Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { name, email, phone, password, referralCode, deviceId } = req.body;

        // 1. Strict duplicate check (Email/Phone)
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            if (existingUser.phone === phone) return res.status(400).json({ error: 'Phone number already exists' });
            return res.status(400).json({ error: 'Email already exists' });
        }

        // 2. DEVICE LOCK: Check if device is already used by ANOTHER account
        // (One Account Per Device Policy)
        if (deviceId) {
            const existingDevice = await User.findOne({ deviceId });
            if (existingDevice) {
                return res.status(403).json({ error: 'This device is already registered to another account.' });
            }
        }

        // Security: Hash password with salt rounds 12
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newReferralCode = 'PRO' + Math.floor(10000 + Math.random() * 90000);

        // Check if invited by someone
        let validReferredBy = null;
        if (referralCode) {
            const referrer = await User.findOne({ referralCode: referralCode });
            if (referrer) {
                validReferredBy = referralCode;
            }
        }

        const newUser = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            referralCode: newReferralCode,
            referredBy: validReferredBy, 
            deviceId: deviceId, // Bind device
            balance: 500,
            totalEarned: 500,
            transactions: [{
                type: 'credit',
                amount: 500,
                description: 'Welcome Bonus',
                status: 'completed'
            }]
        });

        const savedUser = await newUser.save();
        
        // Security: JWT expires in 7 days
        const token = jwt.sign(
            { _id: savedUser._id }, 
            process.env.JWT_SECRET || 'secretKey123', 
            { expiresIn: '7d' }
        );
        
        res.json({ token, user: savedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 2. Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { phone, password, deviceId } = req.body;

        const user = await User.findOne({ phone });
        if (!user) return res.status(400).json({ error: 'User not found' });

        // Password Check
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Invalid password' });

        // DEVICE LOCK CHECK
        if (user.deviceId) {
            // If user has a locked device, ensure it matches current device
            if (user.deviceId !== deviceId) {
                return res.status(403).json({ error: 'Access Denied: You cannot login from a different device.' });
            }
        } else if (deviceId) {
            // If legacy user has no device ID, lock it now
            user.deviceId = deviceId;
            await user.save();
        }

        // Daily Reset Logic
        const today = new Date().toDateString();
        if (user.taskDate !== today) {
            user.taskDate = today;
            user.spinCount = 0;
            user.mathCount = 0;
            user.videoCount = 0;
            await user.save();
        }

        // Security: JWT expires in 7 days
        const token = jwt.sign(
            { _id: user._id }, 
            process.env.JWT_SECRET || 'secretKey123', 
            { expiresIn: '7d' }
        );
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// 3. Get Profile
app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const userData = user.toObject();
        userData.transactions = userData.transactions.reverse();
        res.json(userData);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// 4. Secure Task Completion
app.post('/api/tasks/complete', verifyToken, async (req, res) => {
    try {
        const { taskType, data } = req.body; 
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check Date Rotation - Reset limits if it's a new day
        const today = new Date().toDateString();
        if (user.taskDate !== today) {
            user.taskDate = today;
            user.spinCount = 0;
            user.mathCount = 0;
            user.videoCount = 0;
            // We save at the end of the request
        }

        let amount = 0;
        let description = '';

        // -- Check Limits & Assign Rewards --
        
        // Check-in
        if (taskType === 'checkin') {
            const lastCheck = user.lastCheckIn ? new Date(user.lastCheckIn).toDateString() : null;
            if (today === lastCheck) return res.status(400).json({ error: 'Already checked in today' });
            
            amount = REWARDS.checkin;
            description = 'Daily Check-in';
            user.lastCheckIn = new Date();
        }
        // Math Quiz
        else if (taskType === 'math') {
            if (user.mathCount >= user.mathLimit) return res.status(400).json({ error: 'Daily math limit reached' });
            
            amount = REWARDS.math;
            description = 'Quiz Reward';
            user.mathCount += 1;
        }
        // Video
        else if (taskType === 'video') {
            if (user.videoCount >= user.videoLimit) return res.status(400).json({ error: 'Daily video limit reached' });
            
            amount = REWARDS.video;
            description = 'Video Ad Reward';
            user.videoCount += 1;
            user.lifetimeVideoCount = (user.lifetimeVideoCount || 0) + 1; // Increment lifetime count

            // --- REFERRAL BONUS CHECK ---
            // Condition: Referee must complete 10 videos total (lifetime)
            if (user.referredBy && !user.referralBonusPaid && user.lifetimeVideoCount >= 10) {
                const referrer = await User.findOne({ referralCode: user.referredBy });
                if (referrer) {
                    referrer.balance += REWARDS.refer;
                    referrer.totalEarned += REWARDS.refer;
                    referrer.transactions.push({
                        type: 'credit',
                        amount: REWARDS.refer,
                        description: `Referral Bonus: ${user.name} watched 10 videos`,
                        status: 'completed'
                    });
                    await referrer.save();
                    
                    // Mark as paid on the referee user
                    user.referralBonusPaid = true;
                }
            }
        }
        // Spin Wheel
        else if (taskType === 'spin') {
            if (user.spinCount >= user.spinLimit) return res.status(400).json({ error: 'Daily spin limit reached' });
            
            const spinScore = data?.score || 0;
            
            if (spinScore > 50) return res.status(400).json({ error: 'Security Alert: Points exceed limit.' });
            if (!VALID_SPIN_VALUES.includes(spinScore)) return res.status(400).json({ error: 'Invalid spin value' });

            amount = spinScore;
            description = 'Lucky Spin Win';
            user.spinCount += 1;
        }
        // Referral Claim (Optional UI button)
        else if (taskType === 'refer') {
             return res.status(400).json({ error: 'Referral rewards are automatic upon friend activity.' });
        }
        else {
            return res.status(400).json({ error: 'Invalid Task Type' });
        }

        // -- Update Balance --
        if (amount > 0) {
            user.balance += amount;
            user.totalEarned += amount;
            
            user.transactions.push({
                type: 'credit',
                amount: amount,
                description: description,
                status: 'completed'
            });
        }

        await user.save();
        res.json({ success: true, balance: user.balance, earned: amount });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Task processing failed' });
    }
});

// 5. Secure Withdrawal Request
app.post('/api/withdraw', verifyToken, async (req, res) => {
    try {
        const { amount, method, account } = req.body;
        
        if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
        if (amount < 5000) return res.status(400).json({ error: 'Minimum withdraw is 5000' });

        // Atomic Check & Update: Prevents race conditions where balance drops below 0
        const user = await User.findOneAndUpdate(
            { 
                _id: req.user._id, 
                balance: { $gte: amount } // Condition: Balance must be >= amount
            },
            {
                $inc: { balance: -amount }, // Deduct balance
                $push: { 
                    transactions: {
                        type: 'debit',
                        amount: amount,
                        description: `Withdraw to ${method} (${account})`,
                        status: 'pending',
                        paymentMethod: method,
                        accountNumber: account,
                        date: new Date()
                    }
                }
            },
            { new: true } // Return the updated user document
        );

        if (!user) {
            // Check if user exists but insufficient funds
            const exists = await User.findById(req.user._id);
            if (!exists) return res.status(404).json({ error: 'User not found' });
            return res.status(400).json({ error: 'Insufficient funds. Transaction blocked.' });
        }

        res.json({ success: true, balance: user.balance });

    } catch (err) {
        console.error("Withdraw Error", err);
        res.status(500).json({ error: 'Withdrawal failed' });
    }
});

// 6. Refill Limit
app.post('/api/user/refill', verifyToken, async (req, res) => {
    try {
        const { taskType } = req.body;
        const user = await User.findById(req.user._id);
        
        if (!['spin', 'math', 'video'].includes(taskType)) {
            return res.status(400).json({ error: 'Invalid task type' });
        }

        const limitKey = `${taskType}Limit`;
        user[limitKey] = (user[limitKey] || 0) + 2; // Robust increment
        await user.save();
        
        res.json({ success: true, [limitKey]: user[limitKey] });
    } catch (err) {
        res.status(500).json({ error: 'Error refilling limit' });
    }
});

app.get('/', (req, res) => {
    res.send('Backend is Running Securely');
});
// --- SERVE FRONTEND ---
const path = require('path');

// 'dist' ফোল্ডারটিকে স্ট্যাটিক হিসেবে সেট করা (Vite বিল্ড করলে dist তৈরি হয়)
app.use(express.static(path.join(__dirname, 'dist')));

// যেকোনো রুটে গেলে যেন index.html ফাইলটি দেখায়
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
