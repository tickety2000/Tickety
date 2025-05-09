// src/models/footballTicket.js
const mongoose = require('mongoose');

const footballTicketSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    img: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    homeTeam: { type: String, required: true }, 
    awayTeam: { type: String, required: true }, 
}, { collection: 'FootballTickets' });

const FootballTicket = mongoose.model('FootballTicket', footballTicketSchema);

module.exports = FootballTicket;
