// src/models/ticketCinema.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    img: { type: String, required: true },
    video: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    location: { type: String, required: true },
    seats_stander: { type: Array, required: true },
    seats_max: { type: Array, required: true },
    seats_imax: { type: Array, required: true },
    seats_gold: { type: Array, required: true },
    date: { type: Date, required: true }
}, { collection: 'TicketsCinema' });

const TicketsCinema = mongoose.model('TicketsCinema', ticketSchema);

module.exports = TicketsCinema;
