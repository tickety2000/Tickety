// src/run.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db'); 
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Connect to MongoDB for Users
connectDB(process.env.MONGO_URI, 'TicketyDB');

// Routes
app.use('/search', searchRoutes);
app.use('/tickets', ticketRoutes);
app.use('/users', userRoutes);



// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'public', 'index.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'public', 'pages', 'profile', 'profile.html'));
});

app.get('/PurchasedTickets', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'public', 'pages', 'PurchasedTickets', 'PurchasedTickets.html'));
});

app.get('/ticket_detail', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'public', 'pages', 'seat', 'ticket_detail.html'));
});

[
    '/login',
    '/register'
].forEach(route => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, '../', 'public', 'pages', 'login-register', 'log-reg.html'));
    });
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'public', 'pages', 'forgot-password', 'forgot-password.html'));
});

app.get('/reset-password/:token', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'public', 'pages', 'forgot-password', 'reset-password.html'));
});

[
    '/concert',
    '/cinema',
    '/bus',
    '/football',
    '/plane',
    '/train'
].forEach(route => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, '../', 'public', 'pages', 'filter', 'filter.html'));
    });
});

app.get('/contactUs', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'public', 'pages', 'contactUs', 'contactUs.html'));
});

// Start server
const port = parseInt(process.env.PORT, 10) || 3000;

const startServer = (currentPort) => {
    const server = app.listen(currentPort, () => {
        console.log(`✅ Server is running on port ${currentPort}`);
        console.log(`🔗 Open http://localhost:${currentPort}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  Port ${currentPort} is in use. Retrying on port ${currentPort + 1}...`);
            startServer(currentPort + 1);
        } else {
            console.error(`❌ Failed to start server: ${err.message}`);
            process.exit(1);
        }
    });
};

// Start the server
startServer(port);
