// src/models/ticketTrain.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    img: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    startLocation: { type: String, required: true },  
    destination: { type: String, required: true },  
    date: { type: Date, required: true },         
}, { collection: 'TicketsTrain' });

const TicketsTrain = mongoose.model('TicketsTrain', ticketSchema);

module.exports = TicketsTrain;
