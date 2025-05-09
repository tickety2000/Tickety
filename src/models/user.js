// src/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long']
        },
        phone: {
            type: String,
            default: null
        },
        age: {
            type: Number,
            default: null
        },
        role: {
            type: String,
            enum: ['student', 'employed', 'unEmployed'],
            default: 'unEmployed'
        },
        nationalID: {
            type: String,
            default: null,
            unique: false
        },
        purchasedTickets: {
            type: [{
                seatNumber: { type: String },
                selectedType: { type: String },
                ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
                date: { type: Date },
                category: { type: String }
            }],
            default: []
        },
        verificationToken: { 
            type: String, 
            default: null 
        },
        emailVerified: { 
            type: Boolean, 
            default: false
        },
        tokenExpiresAt: {
            type: Date,
            default: null
        }
    },
    {
        collection: 'Account', 
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
