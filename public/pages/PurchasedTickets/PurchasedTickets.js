document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const customDropdown = document.getElementById('custom-dropdown');
    const optionsContainer = document.getElementById('options-container');
    const selectedOption = document.getElementById('selected-option');

    // Check if user is logged in
    if (!userId) {
        console.log('User not logged in. Redirecting to login...');
        alert('User not logged in. Redirecting to login...');
        window.location.href = '/login';
        return;
    }

    // Function to fetch and render purchased tickets based on selected category
    const fetchPurchasedTickets = (category = 'all') => {
        console.log(`Fetching purchased tickets for category: ${category}`);
        fetch(`/users/${userId}/PurchasedTickets`, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch purchased tickets: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Purchased Tickets:', data);

            const ticketsContainer = document.getElementById('purchasedTickets');
            ticketsContainer.innerHTML = '';

            if (!data.tickets || data.tickets.length === 0) {
                ticketsContainer.innerHTML = '<p>No tickets purchased yet.</p>';
                console.log('No tickets purchased yet.');
                return;
            }

            // Filter tickets by selected category
            const selectedCategory = category.toLowerCase();
            const filteredTickets = data.tickets.filter(ticket => {
                return selectedCategory === 'all' || ticket.category.toLowerCase() === selectedCategory;
            });

            // Group tickets by ticketId and selectedType
            const groupedTickets = filteredTickets.reduce((acc, ticket) => {
                const groupKey = `${ticket.ticketId}_${ticket.selectedType}`;
                if (!acc[groupKey]) {
                    acc[groupKey] = {
                        ticketId: ticket.ticketId,
                        selectedType: ticket.selectedType,
                        date: ticket.date,
                        seatNumbers: [ticket.seatNumber],
                        quantity: 1,
                        category: ticket.category
                    };
                } else {
                    acc[groupKey].seatNumbers.push(ticket.seatNumber);
                    acc[groupKey].quantity += 1;
                }
                return acc;
            }, {});

            console.log('Grouped Tickets:', groupedTickets);

            // Fetch ticket details for each group
            const ticketDetailsPromises = Object.values(groupedTickets).map(groupedTicket => {
                const category = groupedTicket.category;
                console.log(`Fetching details for ticket ID: ${groupedTicket.ticketId}, Category: ${category}`);
                return fetch(`/tickets/${category}/${groupedTicket.ticketId}`)
                    .then(res => res.json())
                    .then(ticketData => {
                        // Adjust price based on selectedType
                        let adjustedPrice = ticketData.price; 
                        const priceAdjustment = 50;

                        if (groupedTicket.selectedType === 'firstClass' || groupedTicket.selectedType === 'firstLevel') {
                            adjustedPrice = ticketData.price + (2 * priceAdjustment);
                        } else if (groupedTicket.selectedType === 'secondClass' || groupedTicket.selectedType === 'secondLevel') {
                            adjustedPrice = ticketData.price + priceAdjustment;
                        } else if (groupedTicket.selectedType === 'vip') {
                            adjustedPrice = ticketData.price + (3 * priceAdjustment);
                        }

                        return {
                            ...groupedTicket,
                            ...ticketData,
                            price: adjustedPrice
                        };
                    });
            });

            Promise.all(ticketDetailsPromises)
                .then(tickets => {
                    console.log('Tickets with details:', tickets);
                    tickets.forEach(ticket => {
                        console.log('Rendering Ticket:', ticket);

                        const ticketDiv = document.createElement('div');
                        ticketDiv.classList.add('ticket');
                        ticketDiv.setAttribute('data-ticket-id', ticket.ticketId);
                        ticketDiv.innerHTML = `
                        <a href="/ticket_detail?category=${ticket.category}&ticket=${ticket.ticketId}" style="text-decoration: none;">
                            <div class="ticket-wrap">
                                <div class="Purchasedticket-image">
                                    <img src="${ticket.img}" alt="Ticket Image" />
                                </div>
                                <div class="ticket-details">
                                    <h3 class="ticket-title">${ticket.name}</h3>
                                    <div class="ticket-info">
                                        <p><i class="fas fa-calendar-alt"></i> <span class="info-title">Date:</span> ${new Date(ticket.date).toLocaleString()}</p>
                                        <p><i class="fas fa-tags"></i> <span class="info-title">Type:</span> ${ticket.selectedType}</p>
                                        ${ticket.category === 'cinema' ? ` 
                                            <p><i class="fas fa-chair"></i> <span class="info-title">Seats:</span> ${ticket.seatNumbers.join(', ')}</p>
                                        ` : '' }
                                        <p><i class="fas fa-cogs"></i> <span class="info-title">Quantity:</span> ${ticket.quantity}</p>
                                        <p><i class="fas fa-certificate"></i> <span class="info-title">Category:</span> ${(ticket.category).charAt(0).toUpperCase() + (ticket.category).slice(1)}</p>
                                        <p><i class="fas fa-dollar-sign"></i> <span class="info-title">Price:</span> <span class="ticket-price-box">EGP ${ticket.price}</span></p>
                                        <!-- Cancel Button -->
                                        <button class="cancel-button" data-ticket-id="${ticket.ticketId}" data-category="${ticket.category}" data-selected-type="${ticket.selectedType}" data-seat-numbers="${ticket.seatNumbers.join(', ')}">
                                            Cancel Booking
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </a>
                        `;
                        ticketsContainer.appendChild(ticketDiv);
                    });
                })
                .catch(error => {
                    console.error('Failed to fetch ticket details:', error);
                    ticketsContainer.innerHTML = '<p>Error loading tickets. Please try again later.</p>';
                });
        })
        .catch(error => {
            console.error('Error fetching purchased tickets:', error);
            alert('Unable to load purchased tickets. Please try again later.');
        });
    };

    // Fetch tickets initially with 'all' category
    fetchPurchasedTickets('all');

    // Add event listener to the category filter (Custom Dropdown)
    customDropdown.addEventListener('click', (e) => {
        e.stopPropagation();  // Prevent click event from bubbling up and closing the dropdown
        e.preventDefault();   // Prevent page refresh or other default action
        optionsContainer.classList.toggle('open');  // Toggle visibility of options
    });

    // Handle category selection in custom dropdown
    optionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('option')) {
            // Set the selected category text
            selectedOption.textContent = e.target.textContent;
            const selectedCategory = e.target.textContent.toLowerCase(); // Get selected category text

            console.log(`Category selected: ${selectedCategory}`);

            // Fetch tickets with the selected category
            fetchPurchasedTickets(selectedCategory);

            // Close the dropdown after selection using a delay
            setTimeout(() => {
                optionsContainer.classList.remove('open');  // This hides the dropdown menu after an option is clicked
            }, 100); // Delay to allow the selection to register before closing
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!customDropdown.contains(e.target) && !optionsContainer.contains(e.target)) {
            optionsContainer.classList.remove('open');  // Close dropdown if click is outside
        }
    });

// Handle Cancel Button Click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cancel-button')) {
        e.preventDefault(); // Prevent any unwanted link navigation
        const ticketId = e.target.getAttribute('data-ticket-id');
        const category = e.target.getAttribute('data-category');
        const selectedType = e.target.getAttribute('data-selected-type');
        const seatNumbers = e.target.getAttribute('data-seat-numbers').split(', ');

        console.log(`Cancel button clicked for ticketId: ${ticketId}, category: ${category}, selectedType: ${selectedType}, seatNumbers: ${seatNumbers}`);

        // Open the cancel modal
        openCancelModal(ticketId, category, selectedType, seatNumbers);
    }
});

const openCancelModal = (ticketId, category, selectedType, seatNumbers) => {
    const modal = document.createElement('div');
    modal.id = 'cancel-modal';
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Cancel Ticket</h2>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Category:</strong> ${category.charAt(0).toUpperCase() + category.slice(1)}</p>
            <p><strong>Type:</strong> ${selectedType}</p>

            ${category === 'cinema' ? ` 
                <p><strong>Seats to cancel:</strong> ${seatNumbers.join(', ')}</p>
                <label for="seatsToCancel">Enter seat numbers to cancel (comma-separated):</label>
                <input type="text" id="seatsToCancel" placeholder="e.g., A1, A2">
            ` : ` 
                <label for="quantityToCancel">Enter the quantity of tickets to cancel:</label>
                <input type="number" id="quantityToCancel" value="1" min="1" max="${seatNumbers.length}">
            `}

            <button id="cancel-confirm" data-ticket-id="${ticketId}" data-category="${category}">Confirm Cancel</button>
            <button id="cancel-close">Close</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Handle Confirm Cancel Button Click
    document.getElementById('cancel-confirm').addEventListener('click', () => {
        // Only process seatsToCancel if it's not empty
        const seatsToCancel = document.getElementById('seatsToCancel') ? document.getElementById('seatsToCancel').value.split(',').map(seat => seat.trim()).filter(seat => seat !== "") : [];
        const quantityToCancel = document.getElementById('quantityToCancel') ? parseInt(document.getElementById('quantityToCancel').value) : 1;

        console.log(`Confirm cancel for ticketId: ${ticketId}, seats: ${seatsToCancel.length ? seatsToCancel : seatNumbers}, quantity: ${quantityToCancel}`);
        
        cancelTicket(ticketId, category, seatsToCancel.length ? seatsToCancel : seatNumbers, seatFilter= selectedType, quantityToCancel);
    });

    // Close modal
    document.getElementById('cancel-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
};


const cancelTicket = (ticketId, category, seatsToCancel, seatFilter, quantityToCancel) => {
    console.log(`Canceling ticket with ID: ${ticketId}, seats: ${seatsToCancel}, quantity: ${quantityToCancel}`);
    
    // Ensure seatsToCancel is an empty array for non-cinema tickets
    if (category !== 'cinema' && !seatsToCancel) {
        seatsToCancel = [];  // Ensure empty array for non-cinema tickets
        seatFilter = null;   // Ensure null for non-cinema tickets
    }

    fetch('/users/cancel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ticketId,
            userId: localStorage.getItem('userId'),  // Correct userId
            ticketType: category,  // Correct category
            seatsToCancel,         // Pass empty array for non-cinema tickets
            seatFilter,      // Pass null for non-cinema tickets
            quantityToCancel,      // Use quantityToCancel for non-cinema tickets
        }),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Ticket canceled successfully: ${ticketId}`);
            alert('Ticket canceled successfully');
            removeTicketFromUI(ticketId, seatsToCancel); // Remove the canceled ticket from the UI
            document.body.removeChild(document.getElementById('cancel-modal')); // Close the modal
            window.location.reload();
        } else {
            throw new Error('Cancelation failed');
        }
    })
    .catch(error => {
        console.error('Error canceling ticket:', error);
        alert('Failed to cancel ticket');
    });
};


const removeTicketFromUI = (ticketId, seatsToCancel) => {
    const ticketDiv = document.querySelector(`[data-ticket-id="${ticketId}"]`);
    if (ticketDiv) {
        if (seatsToCancel.length > 0) {
            seatsToCancel.forEach(seat => {
                console.log(`Seat ${seat} canceled`);
                // Update UI for specific seats here, e.g., mark them as available
                // You can implement a visual cue for this if needed
            });
        } else {
            // If no specific seats were canceled, just remove the whole ticket div
            ticketDiv.remove();
        }
    }
};



});
