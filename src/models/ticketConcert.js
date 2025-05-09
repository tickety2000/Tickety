// src/models/ticketConcert.js
const mongoose = require('mongoose');

const concertTicketSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    img: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    location: { type: String, required: true },  
    date: { type: Date, required: true },       
    artist: { type: String, required: true },   
    ticketType: { type: String, required: true }, 
}, { collection: 'TicketsConcert' });

const ConcertTicket = mongoose.model('ConcertTicket', concertTicketSchema);

module.exports = ConcertTicket;
