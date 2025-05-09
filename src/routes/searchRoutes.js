// src/routes/searchRoutes.js
const express = require('express');
const router = express.Router();

const TicketsCinema = require('../models/ticketCinema');        // Cinema ticket model
const TicketsBus = require('../models/ticketBus');              // Bus ticket model
const TicketsConcert = require('../models/ticketConcert');      // Concert ticket model
const TicketsPlane = require('../models/ticketPlane');          // Plane ticket model
const TicketsTrain = require('../models/ticketTrain');          // Train ticket model
const TicketsFootball = require('../models/ticketFootball');    // Football ticket model

// Function to search across all categories
const searchAllCategories = async (query) => {
    const searchQuery = {
        $or: [
            { name: { $regex: query, $options: 'i' } },         // Case-insensitive match for name
            { description: { $regex: query, $options: 'i' } },  // Case-insensitive match for description
            { location: { $regex: query, $options: 'i' } },      // Case-insensitive match for location
        ]
    };

    // Search in all ticket categories in parallel
    const results = await Promise.all([
        TicketsCinema.find(searchQuery),
        TicketsBus.find(searchQuery),
        TicketsConcert.find(searchQuery),
        TicketsPlane.find(searchQuery),
        TicketsTrain.find(searchQuery),
        TicketsFootball.find(searchQuery)
    ]);

    // Add category field to each result and combine all results into one array
    const combinedResults = [
        ...results[0].map(ticket => ({ ...ticket.toObject(), category: 'cinema' })),
        ...results[1].map(ticket => ({ ...ticket.toObject(), category: 'bus' })),
        ...results[2].map(ticket => ({ ...ticket.toObject(), category: 'concert' })),
        ...results[3].map(ticket => ({ ...ticket.toObject(), category: 'plane' })),
        ...results[4].map(ticket => ({ ...ticket.toObject(), category: 'train' })),
        ...results[5].map(ticket => ({ ...ticket.toObject(), category: 'football' }))
    ];

    return combinedResults;
};

// Search endpoint
router.get('/', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Search across all categories
        const searchResults = await searchAllCategories(query);

        res.status(200).json(searchResults);
    } catch (error) {
        console.error('Error performing search:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
