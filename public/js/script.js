document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.querySelector('.logo-none');
    const usernameDisplay = document.getElementById('username-display');
    const userDropdown = document.getElementById('user-dropdown');
    const userName = document.getElementById('user-name');
  
    // Check if user is logged in
    const username = localStorage.getItem('username');
    if (username) {
      loginButton.style.display = 'none'; // Hide login button
      usernameDisplay.style.display = 'flex'; // Show username display
      userName.textContent = username; // Set username text
  
      // Add dropdown content
      userDropdown.innerHTML = `
        <a href="/profile">Profile</a>
        <a href="" id="logout">Logout</a>
      `;
  
      // Toggle dropdown visibility on username display click
      usernameDisplay.addEventListener('click', (event) => {
        event.stopPropagation();
        userDropdown.classList.toggle('show'); // Show/hide dropdown
      });
  
      // Close dropdown if clicked outside
      document.addEventListener('click', (event) => {
        if (!userDropdown.contains(event.target) && event.target !== usernameDisplay) {
          userDropdown.classList.remove('show'); // Hide dropdown when clicked outside
        }
      });
  
      // Logout functionality
      document.getElementById('logout')?.addEventListener('click', () => {
        localStorage.clear(); // Clear login details
        window.location.reload(); // Reload to update UI
      });
    } else {
      loginButton.style.display = 'block'; // Show login button
      usernameDisplay.style.display = 'none'; // Hide profile display
    }
  });
  
  // Frontend search functionality (no change here)
  const searchInput = document.getElementById('search-bar');
  const searchResultsContainer = document.getElementById('search-results');
  
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
  
    if (query.length < 3) {
      searchResultsContainer.innerHTML = '';
      searchResultsContainer.style.display = 'none';
      return;
    }
  
    try {
      const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
      const results = await response.json();
  
      searchResultsContainer.innerHTML = results.length
        ? results.map(ticket => `
          <a class="search-result-link" href="/ticket_detail?ticket=${ticket._id}&category=${ticket.category}">
            <div class="search-result-item">
              <div class="div-ticket-image">
                <img class="ticket-image" src="${ticket.img}" alt="${ticket.name}">
              </div>
              <div class="ticket-details">
                <strong>${ticket.name}</strong>
                <p>${ticket.description}</p>
              </div>
            </div>
          </a>
        `).join('')
        : '<p>No results found</p>';
  
      searchResultsContainer.style.display = results.length ? 'block' : 'none';
    } catch (error) {
      console.error('Error fetching search results:', error);
      searchResultsContainer.innerHTML = '<p>Error fetching results. Please try again.</p>';
      searchResultsContainer.style.display = 'none';
    }
  });
  
  // Event listener for Purchased Tickets button
  document.getElementById('PurchasedTickets').addEventListener('click', () => {
    window.location.href = '/PurchasedTickets';
  });
  