document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const responseMessage = document.getElementById('responseMessage');

    if (!name || !email || !message) {
        responseMessage.textContent = 'Please fill out all fields.';
        responseMessage.className = 'error';
        responseMessage.style.display = 'block';
        return;
    }

    // Send form data to the server
    fetch('users/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to send message.');
            }
            return response.json();
        })
        .then((data) => {
            responseMessage.textContent = data.message;
            responseMessage.className = 'success';
            responseMessage.style.display = 'block';

            // Reset form fields
            document.getElementById('contactForm').reset();
        })
        .catch((error) => {
            console.error('Error:', error);
            responseMessage.textContent = 'Failed to send the message. Please try again later.';
            responseMessage.className = 'error';
            responseMessage.style.display = 'block';
        });
});
