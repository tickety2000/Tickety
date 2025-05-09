const express = require('express');
const router = express.Router();
const User = require('../models/user'); 

const TicketsCinema = require('../models/ticketCinema');    // Cinema ticket model
const TicketsBus = require('../models/ticketBus');          // Bus ticket model
const TicketsConcert = require('../models/ticketConcert');   // Concert ticket model
const TicketsPlane = require('../models/ticketPlane');       // Plane ticket model
const TicketsTrain = require('../models/ticketTrain');       // Train ticket model
const TicketsFootball = require('../models/ticketFootball'); // Football ticket model


// Function to determine the model based on the category
const getModelByCategory = (category) => {
    if (category === 'cinema') {
        return TicketsCinema;
    } else if (category === 'bus') {
        return TicketsBus;
    } else if (category === 'concert') {
        return TicketsConcert;
    } else if (category === 'plane') {
        return TicketsPlane;
    } else if (category === 'train') {
        return TicketsTrain;
    } else if (category === 'football') {
        return TicketsFootball;
    }
    return null;
};

// Fetch tickets based on the category and optional price range
router.get('/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { minPrice, maxPrice } = req.query;

        const Model = getModelByCategory(category);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const query = {};
        if (minPrice) {
            query.price = { ...query.price, $gte: Number(minPrice) };
        }
        if (maxPrice) {
            query.price = { ...query.price, $lte: Number(maxPrice) };
        }

        const tickets = await Model.find(query);
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch a specific ticket by ID and category
router.get('/:category/:id', async (req, res) => {
    try {
        const { category, id } = req.params;

        const Model = getModelByCategory(category);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const ticket = await Model.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch unique ticket locations by category
router.get('/:category/locations', async (req, res) => {
    try {
        const { category } = req.params;

        const Model = getModelByCategory(category);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const locations = await Model.distinct('location');
        res.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch unique ticket types by category
router.get('/:category/ticket-types', async (req, res) => {
    try {
        const { category } = req.params;

        const Model = getModelByCategory(category);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const ticketTypes = await Model.distinct('ticketType');
        res.json(ticketTypes);
    } catch (error) {
        console.error('Error fetching ticket types:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Endpoint to handle seat booking for both categories
router.post('/:category/save-seat', async (req, res) => {
    try {
        const { category } = req.params;
        const { seatNumbers, ticketId, selectedType } = req.body;

        const Model = getModelByCategory(category);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const ticket = await Model.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const SeatData =
            selectedType === 'stander'
                ? ticket.seats_stander
                : selectedType === 'max'
                ? ticket.seats_max
                : selectedType === 'imax'
                ? ticket.seats_imax
                : selectedType === 'gold'
                ? ticket.seats_gold
                : [];

        if (!Array.isArray(seatNumbers)) {
            return res.status(400).json({ message: 'seatNumbers should be an array' });
        }

        const alreadyBookedSeats = seatNumbers.filter(seat => SeatData.includes(seat));

        if (alreadyBookedSeats.length > 0) {
            return res.status(400).json({ message: `Seats ${alreadyBookedSeats.join(', ')} already booked` });
        }

        SeatData.push(...seatNumbers);
        ticket.amount = ticket.amount - seatNumbers.length;

        await ticket.save();

        res.status(200).json({ message: 'Seats booked successfully', seatNumbers });
    } catch (error) {
        console.error('Error saving seat:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch all seats for a specific ticket by category
router.get('/:category/seats/:ticketId', async (req, res) => {
    const { category, ticketId } = req.params;

    try {
        const Model = getModelByCategory(category);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const ticket = await Model.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const mapSeats = (seats) => seats.map(seat => ({
            seatNumber: seat,
            status: 'sold',
        }));

        const seatData_stander = mapSeats(ticket.seats_stander || []);
        const seatData_max = mapSeats(ticket.seats_max || []);
        const seatData_imax = mapSeats(ticket.seats_imax || []);
        const seatData_gold = mapSeats(ticket.seats_gold || []);

        res.status(200).json({ seatData_stander, seatData_max, seatData_imax, seatData_gold });
    } catch (error) {
        console.error('Error fetching seats:', error);
        res.status(500).json({ message: 'Error fetching seats' });
    }
});

module.exports = router;
