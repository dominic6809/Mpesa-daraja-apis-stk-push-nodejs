const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mpesaRoutes = require('./routes/mpesa');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Enable CORS if needed
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        return res.status(200).json({});
    }
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', mpesaRoutes);

// Serve the payment form for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong on the server',
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the payment page at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = server; 