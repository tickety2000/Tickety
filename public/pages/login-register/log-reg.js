const cardSwitch = document.getElementById('reg-log');

// cardSwitch.checked = window.location.href.includes('/register');

// cardSwitch.addEventListener('change', () => {
//     setTimeout(() => {
//         window.location.href = cardSwitch.checked ? '/register' : '/login';
//     }, 500);
// });

// Login Script
const loginForm = document.getElementById('loginForm');
const loginErrorMessage = document.getElementById('login-error-message');

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('logemail').value; // Updated ID
    const password = document.getElementById('logpass').value; // Updated ID

    if (!email || !password) {
        loginErrorMessage.textContent = 'Please fill in all fields.';
        return;
    } else if (password.length < 6) {
        loginErrorMessage.textContent = 'Password must be at least 6 characters.';
        return;
    }

    try {
        const response = await fetch('users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Login successful!');
            // Store user ID and username in local storage
            localStorage.setItem('userId', data.userId); // Capture user ID from server response
            localStorage.setItem('username', data.username); // Store username

            // Correctly store the token from server response
            localStorage.setItem('token', data.token); // Use token from the response

            // Redirect after a short delay
            setTimeout(() => window.location.href = "/", 300);
        } else {
            loginErrorMessage.textContent = data.message || 'Login failed.';
        }
    } catch (error) {
        console.error('Error:', error);
        loginErrorMessage.textContent = 'An error occurred. Please try again later.';
    }
});


// Registration Script
const registrationForm = document.getElementById('registrationForm');
const registerErrorMessage = document.getElementById('register-error-message');

registrationForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!username || !email || !password) {
        registerErrorMessage.textContent = 'Please fill in all fields.';
        return;
    }else if (password.length < 6) {
        registerErrorMessage.textContent = 'Password must be at least 6 characters.';
        return;
    }

    try {
        const response = await fetch('users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            registrationForm.reset();
            setTimeout(() => document.getElementById("reg-log").checked = false, 300);
        } else {
            registerErrorMessage.textContent = data.message || 'Registration failed.';
        }
    } catch (error) {
        console.error('Error:', error);
        registerErrorMessage.textContent = 'An error occurred. Please try again later.';
    }
});
