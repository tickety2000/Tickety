async function fetchTicketDetails(ticketId) {
  try {
    const category = new URLSearchParams(window.location.search).get('category');
    const response = await fetch(`tickets/${category}/${ticketId}`);
    const ticket = await response.json();

    const ticketDetailWrapper = document.querySelector('#ticket-detail');
    let ticketContent = '';

if (category === 'cinema') {
  ticketContent = `
    <div class="cinema-category">
      <div class="movie-item">
        <div class="movie-image-container">
          <img src="${ticket.img}" alt="${ticket.name}" class="movie-image" />
          <div class="play-pause-btn" onclick="toggleVideo('movieTrailer1')">
            <img src="../../images/play-icon.png" alt="Play" id="playBtn1" />
          </div>
        </div>
        <div class="movie-trailer" id="movieTrailer1">
          <!-- Embedded YouTube Trailer -->
          <iframe 
            src="${ticket.video}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen>
          </iframe>
        </div>
      </div>
    </div>`;
} else {
  ticketContent = `<img src="${ticket.img}" alt="${ticket.name} photo">`;
}

ticketDetailWrapper.innerHTML = `
  <div class="ticket-info">
    ${ticketContent}
    <div class="ticket-details">
      <h3 class="ticket-name">${ticket.name}</h3>
      <p class="price">Price: EGP ${ticket.price.toFixed(2)}</p>
      <p class="availability">${ticket.amount > 0 ? 'In Stock' : 'Out of Stock'}</p>
      <p class="description"><strong>Description:</strong> ${ticket.description}</p>
      ${
        ['plane', 'bus', 'train'].includes(category)
          ? `
            <p class="location"><strong>Start Location:</strong> ${ticket.startLocation || 'Not specified'}</p>
            <p class="location"><strong>Destination:</strong> ${ticket.destination || 'Not specified'}</p>
          `
          : `
            <p class="location"><strong>Location:</strong> ${ticket.location || 'Not specified'}</p>
          `
      }
      <p class="type"><strong>Ticket Type:</strong> ${ticket.ticketType}</p>
    </div>
  </div>`;



  } catch (error) {
    console.error('Error fetching ticket details:', error);
    ticketDetailWrapper.innerHTML = '<p>Error loading ticket details. Please try again later.</p>';
  }
}

// Cinema Ticket Function
async function ticketCinema(ticketId, userId) {
  try {
    document.getElementById('cinemaSeats').innerHTML = `
      <div class="movie-container">
        <label>Select a type:</label>
        <select id="movie">
          <option value="stander">Stander</option>
          <option value="max">Max</option>
          <option value="imax">IMax</option>
          <option value="gold">Gold</option>
        </select>
      </div>
      <ul class="showcase">
        <li><div class="seat"></div><small>Available</small></li>
        <li><div class="seat selected"></div><small>Selected</small></li>
        <li><div class="seat sold"></div><small>Sold</small></li>
      </ul>
      <div class="container">
        <div class="screen"></div>
        ${['A', 'B', 'C', 'D', 'E', 'F']
          .map(
            row =>
              `<div class="row">
                ${Array.from({ length: 8 }, (_, i) => `<div class="seat" data-seat-number="${row}${i + 1}"></div>`).join('')}
              </div>`
          )
          .join('')}
      </div>
      <p class="text">You have selected <span id="count">0</span> seat(s) for a total of EGP.<span id="total">0</span></p>
      <button class="ButtonLogin" id="book-button">Book</button>
    `;

    const count = document.getElementById('count');
    const total = document.getElementById('total');
    const movieSelect = document.getElementById('movie');
    let selected = [];

    // Function to calculate prices dynamically
    const calculatePrice = (basePrice, type) => {
      const increments = { stander: 0, max: 50, imax: 100, gold: 150 };
      return basePrice + (increments[type] || 0);
    };

    // Fetch initial ticket details to get the base price
    const baseResponse = await fetch(`tickets/cinema/${ticketId}`);
    const ticket = await baseResponse.json();
    const basePrice = ticket.price;

    // Update the dropdown prices dynamically
    movieSelect.innerHTML = `
      <option value="${calculatePrice(basePrice, 'stander')}" data-value="stander">Stander - EGP ${calculatePrice(basePrice, 'stander')}</option>
      <option value="${calculatePrice(basePrice, 'max')}" data-value="max">Max - EGP ${calculatePrice(basePrice, 'max')}</option>
      <option value="${calculatePrice(basePrice, 'imax')}" data-value="imax">IMax - EGP ${calculatePrice(basePrice, 'imax')}</option>
      <option value="${calculatePrice(basePrice, 'gold')}" data-value="gold">Gold - EGP ${calculatePrice(basePrice, 'gold')}</option>
    `;

    // Function to fetch seat availability
    async function fetchSeatAvailability(ticketId, movieType) {
      try {
        const response = await fetch(`tickets/cinema/seats/${ticketId}`);
        const data = await response.json();

        const seatData =
          movieType === 'stander'
            ? data.seatData_stander
            : movieType === 'max'
            ? data.seatData_max
            : movieType === 'imax'
            ? data.seatData_imax
            : movieType === 'gold'
            ? data.seatData_gold
            : [];

        // Update seat status in the DOM
        document.querySelectorAll('.row .seat.sold').forEach(seat => seat.classList.remove('sold'));
        document.querySelectorAll('.row .seat.selected').forEach(seat => seat.classList.remove('selected'));
        seatData.forEach(seat => {
          const seatElement = document.querySelector(`[data-seat-number="${seat.seatNumber}"]`);
          if (seatElement && seat.status === 'sold') {
            seatElement.classList.add('sold');
          }
        });
      } catch (error) {
        console.error('Error fetching seat availability:', error);
      }
    }

    // Fetch initial seat availability
    await fetchSeatAvailability(ticketId, movieSelect.options[movieSelect.selectedIndex].getAttribute('data-value'));

    // Handle seat selection
    document.querySelectorAll('.seat').forEach(seat => {
      seat.addEventListener('click', e => {
        const seatElement = e.target;
        if (seatElement.classList.contains('sold')) return;

        if (seatElement.classList.contains('selected')) {
          seatElement.classList.remove('selected');
          selected = selected.filter(item => item !== seatElement.dataset.seatNumber);
        } else {
          seatElement.classList.add('selected');
          selected.push(seatElement.dataset.seatNumber);
        }

        count.innerText = selected.length;
        total.innerText = selected.length * +movieSelect.value || 0;
      });
    });

    // Update seat availability on movie type change
    movieSelect.addEventListener('change', async () => {
      selected = [];
      count.innerText = 0;
      total.innerText = 0;
      await fetchSeatAvailability(ticketId, movieSelect.options[movieSelect.selectedIndex].getAttribute('data-value'));
    });

    // Booking seats
    document.getElementById('book-button').addEventListener('click', async () => {
      if (selected.length === 0) {
        alert('Please select at least one seat.');
        return;
      }

      const userId = localStorage.getItem('userId');

      if (!userId) {
        alert('User not logged in. Please log in.');
        return;
      }
  
      const userResponse = await fetch(`/users/${userId}/findById`, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.message || 'User validation failed.');
      }
  
      const user = await userResponse.json();
      if (!user || !user.findById) {
        alert('User not found. Please log in again.');
        return;
      }

      // Confirmation dialog
      const confirmBooking = confirm('Are you sure you want to book the selected seats?');
      if (!confirmBooking) {
        return;
      }

      try {
        const selectedType = movieSelect.options[movieSelect.selectedIndex].getAttribute('data-value');
        const seatDetails = selected.map(seatNumber => ({
          seatNumber,
          selectedType,
          ticketId,
          date: new Date(),
        }));

        // Save seat booking
        await fetch(`tickets/cinema/save-seat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ seatNumbers: selected, ticketId, selectedType }),
        });

        await fetch(`users/save-seat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ seatDetails, userId, category: "cinema" }),
        });

        alert('Seats booked successfully!');
        selected = [];
        count.innerText = 0;
        total.innerText = 0;

        // Refresh seat availability
        await fetchSeatAvailability(ticketId, selectedType);
      } catch (error) {
        console.error('Error booking seats:', error);
        alert('An error occurred while booking. Please try again.');
      }
    });
  } catch (error) {
    console.error('Error initializing cinema ticketing:', error);
  }
}
async function ticketTransport(ticketId, userId, category) {
  const bookingContainer = document.getElementById('ticket-detail');
  if (!bookingContainer) {
    console.error('Booking container not found.');
    return;
  }

  // Fetch the base price for the ticket
  const baseResponse = await fetch(`tickets/${category}/${ticketId}`);
  const ticket = await baseResponse.json();

  let basePrice = ticket.price;  // Standard/3rd Class/Level 3 price

  // Define seat options and price adjustments based on category
  let seatOptions = [];
  let priceAdjustment = 50;

  if (category === 'football') {
    seatOptions = [
      { value: 'firstLevel', label: `First Level - EGP ${basePrice + 2 * priceAdjustment}` },
      { value: 'secondLevel', label: `Second Level - EGP ${basePrice + priceAdjustment}` },
      { value: 'thirdLevel', label: `Third Level - EGP ${basePrice}` },
      { value: 'vip', label: `VIP - EGP ${basePrice + 3 * priceAdjustment}` }
    ];
  } else if (['train', 'bus', 'plane'].includes(category)) {
    seatOptions = [
      { value: 'firstClass', label: `First Class - EGP ${basePrice + 2 * priceAdjustment}` },
      { value: 'secondClass', label: `Second Class - EGP ${basePrice + priceAdjustment}` },
      { value: 'thirdClass', label: `Third Class - EGP ${basePrice}` }
    ];
  } else if (category === 'concert') {
    seatOptions = [
      { value: 'vip', label: `VIP - EGP ${basePrice + 2 * priceAdjustment}` },
      { value: 'standard', label: `Standard - EGP ${basePrice}` },
      { value: 'gold', label: `Gold - EGP ${basePrice + priceAdjustment}` }
    ];
  }

  // Add dropdown and booking button
  bookingContainer.innerHTML += `
    <div id="booking-container">
      <label for="seat-class">Select Seat Class:</label>
      <select id="seat-class">
        ${seatOptions.map(option => `
          <option value="${option.value}">${option.label}</option>
        `).join('')}
      </select>
      <div id="ticket-quantity-container">
        <button id="decrease" class="quantity-btn">-</button>
        <span id="ticket-quantity">1</span>
        <button id="increase" class="quantity-btn">+</button>
      </div>
      <button id="book-ticket-button">Book Ticket</button>
    </div>
    
    <!-- Professional note about seat selection -->
    <div id="seat-selection-note">
      <span class="warning-icon">&#9888;</span>
      <span class="note-text">
        <strong>Note:</strong> Please note that seat selection will be finalized at the venue (station, concert hall, or airport). You will be able to choose your specific seat when you arrive at the location. Thank you for your understanding!
      </span>
    </div>
  `;

  // Handle the "+" and "-" buttons to change the ticket quantity
  let ticketQuantity = 1; // Default value

  document.getElementById('increase').addEventListener('click', () => {
    ticketQuantity++;
    document.getElementById('ticket-quantity').textContent = ticketQuantity;
  });

  document.getElementById('decrease').addEventListener('click', () => {
    if (ticketQuantity > 1) {
      ticketQuantity--;
      document.getElementById('ticket-quantity').textContent = ticketQuantity;
    }
  });

  // Book ticket button event
  document.getElementById('book-ticket-button').addEventListener('click', async () => {
    const selectedClass = document.getElementById('seat-class').value;

    if (!userId) {
      alert('User not logged in. Please log in.');
      return;
    }

    const confirmBooking = confirm(`Are you sure you want to book ${ticketQuantity} ${selectedClass} ticket(s)?`);
    if (!confirmBooking) return;

    try {
      // Create an array of ticket objects based on the selected quantity
      const ticketDetails = Array(ticketQuantity).fill().map(() => ({
        seatNumber: null, // No seat number for transport categories (bus, train, plane, concert)
        selectedType: selectedClass,
        ticketId,
        date: new Date(),
        category
      }));

      await fetch('users/save-seat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seatDetails: ticketDetails, userId, category }),
      });

      alert('Tickets booked successfully!');
    } catch (error) {
      console.error('Error booking ticket:', error);
      alert('An error occurred while booking. Please try again.');
    }
  });
}

// Function to toggle play/pause and show trailer
function toggleVideo(trailerId) {
  var movieItem = document.getElementById(trailerId).closest('.movie-item');
  var iframe = movieItem.querySelector('iframe');
  var playButton = movieItem.querySelector('.play-pause-btn img');

  // Toggle active state
  movieItem.classList.toggle('active');

  // Check if the movie trailer is active
  if (movieItem.classList.contains('active')) {
      // Play video
      var player = new YT.Player(iframe, {
          events: {
              'onReady': function(event) {
                  event.target.playVideo();
              }
          }
      });
      playButton.src = "pause-icon.png"; // Change to Pause icon
  } else {
      // Pause video
      var player = new YT.Player(iframe);
      player.pauseVideo();
      playButton.src = "play-icon.png"; // Change to Play icon
  }
}



window.onload = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const ticketId = new URLSearchParams(window.location.search).get('ticket');
    const category = new URLSearchParams(window.location.search).get('category');

    if (!category || !ticketId) {
      alert('Category or Ticket ID not found in URL.');
      return;
    }

    await fetchTicketDetails(ticketId);

    if (category === 'cinema') {
      await ticketCinema(ticketId, userId);
    } else if (['train', 'bus', 'plane'].includes(category)) {
      await ticketTransport(ticketId, userId, category);
    } else if (category === 'concert') {
      await ticketTransport(ticketId, userId, category); // Reuse the same ticketTransport function for concert
    }
    else if (category === 'football') {
      await ticketTransport(ticketId, userId, category); // Reuse the same ticketTransport function for concert
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }
};
