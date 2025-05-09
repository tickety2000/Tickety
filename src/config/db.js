const mongoose = require('mongoose');

const connectDB = async (uri, dbName) => {
    try {
        const options = dbName ? { dbName } : {};
        await mongoose.connect(uri, options);
        console.log(`Connected to MongoDB ${dbName ? dbName : ''}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
