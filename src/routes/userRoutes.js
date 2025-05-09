const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const User = require('../models/user');
const router = express.Router();
require('dotenv').config();

const TicketCinema = require('../models/ticketCinema');    // Cinema ticket model
const TicketBus = require('../models/ticketBus');          // Bus ticket model
const TicketConcert = require('../models/ticketConcert'); // Concert ticket model
const TicketPlane = require('../models/ticketPlane');     // Plane ticket model
const TicketTrain = require('../models/ticketTrain');     // Train ticket model
const TicketFootball = require('../models/ticketFootball'); // Football ticket model




// Middleware for JWT authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token missing' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Set up email transporter using Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    debug: true,
});

// Register endpoint
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Check if all required fields are provided
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    try {
        // Check if the user already exists by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create a new user object, including the verification token
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            verificationToken, // Store the token for later verification
            purchasedTickets: []
        });

        // Send a verification email with the token link
        const verificationLink = `${process.env.BASE_URL}/users/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Please verify your email address',
            html: `<p>Click the link below to verify your email address and complete your registration:</p>
                    <a href="${verificationLink}">${verificationLink}</a>`
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        // Save the new user to the database
        await newUser.save();

        res.json({ message: 'Registration successful. Please check your email for verification.' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    try {
        // Find the user with the token
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired token' });
        }

        // Update user to set email as verified and clear the token
        user.verificationToken = undefined;
        user.emailVerified = true; // You may want to add an 'emailVerified' field in your schema
        await user.save();

        // res.json({ message: 'Email verified successfully. You can now log in.' });
        res.redirect('/login');
    } catch (error) {
        console.error('Error during email verification:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if the user is verified
        if (!user.emailVerified) {
            return res.status(400).json({ message: 'Account not verified. Please check your email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id.toString(), username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, username: user.username, userId: user._id, message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch user data
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId).select('username email age role nationalID phone');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            username: user.username,
            email: user.email,
            age: user.age,
            role: user.role,
            nationalID: user.nationalID,
            phone: user.phone
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Update user data
router.post('/updateProfile', authenticateToken, async (req, res) => {
    const userId = req.user.userId; // Extract `userId` from the authenticated JWT token
    const { username, email, phone, age, role, nationalID } = req.body; // Include all fields being updated

    // Validate required fields
    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }

    try {
        // Prepare updated fields dynamically to allow optional updates
        const updatedFields = { username, email };
        if (phone) updatedFields.phone = phone;
        if (age) updatedFields.age = age;
        if (role) updatedFields.role = role;
        if (nationalID) updatedFields.nationalID = nationalID;

        // Update the user in the database
        const result = await User.updateOne(
            { _id: userId }, // No need for `new ObjectId()` if `userId` is already an ObjectId
            { $set: updatedFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:userId/PurchasedTickets', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ tickets: user.purchasedTickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/save-seat', async (req, res) => {
    const { seatDetails, userId, category } = req.body; // Get category here too

    if (!seatDetails || seatDetails.length === 0) {
      return res.status(400).json({ message: 'No seat details provided' });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.purchasedTickets = user.purchasedTickets || [];
      
      // Ensure the category is included when saving each ticket
      seatDetails.forEach(seat => {
        seat.category = category;  // Add category here if it's missing from the seat object
        user.purchasedTickets.push(seat);
      });

      await user.save();
      res.status(200).json({ message: 'Seats saved successfully' });
    } catch (error) {
      console.error('Error saving seats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.get('/:userId/findById', async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.emailVerified) {
        return res.status(400).json({ message: 'Account not verified. Please check your email.' });
      }

      res.json({ findById: true, user });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Route to handle form submission
router.post('/send-email', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: `New Message from ${name}`,
        text: `Message from ${name} (${email}):\n\n "Thanks for your message. We will get back to you soon."`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Failed to send email.' });
        }
        res.status(200).json({ message: 'Email sent successfully!' });
    });

    const mailOptions2 = {
        from: process.env.EMAIL,
        to: "tofa201714@gmail.com",
        subject: `New Message from ${name}`,
        text: `Message from ${name} (${email}):\n\n ${message}`,
    };

    transporter.sendMail(mailOptions2, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Failed to send email.' });
        }
        res.status(200).json({ message: 'Email sent successfully!' });
    });

    const mailOptions3 = {
        from: process.env.EMAIL,
        to: "kirolosmourice814@gmail.com",
        subject: `New Message from ${name}`,
        text: `Message from ${name} (${email}):\n\n ${message}`,
    };

    transporter.sendMail(mailOptions3, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Failed to send email.' });
        }
        res.status(200).json({ message: 'Email sent successfully!' });
    });
});

router.post('/cancel', async (req, res) => {
    const { ticketId, userId, ticketType, seatsToCancel = [], seatFilter, quantityToCancel = 0 } = req.body;

    console.log('Received cancel request:', { ticketId, userId, ticketType, seatsToCancel, seatFilter, quantityToCancel });

    if (!ticketId || !userId || !ticketType) {
        return res.status(400).json({ message: 'Ticket ID, User ID, and Ticket Type are required' });
    }

    try {
        // Determine the correct ticket model based on the ticketType
        let TicketModel;

        switch (ticketType) {
            case 'bus':
                TicketModel = TicketBus;
                break;
            case 'cinema':
                TicketModel = TicketCinema;
                break;
            case 'concert':
                TicketModel = TicketConcert;
                break;
            case 'football':
                TicketModel = TicketFootball;
                break;
            case 'plane':
                TicketModel = TicketPlane;
                break;
            case 'train':
                TicketModel = TicketTrain;
                break;
            default:
                console.error('Invalid ticket type:', ticketType);
                return res.status(400).json({ message: 'Invalid ticket type' });
        }

        // Find the ticket in the database
        const ticket = await TicketModel.findById(ticketId);
        if (!ticket) {
            console.error('Ticket not found:', ticketId);
            return res.status(404).json({ message: 'Ticket not found' });
        }

        console.log('Ticket found:', ticket);

        // Handle seat cancellation for cinema tickets
        if (ticketType === 'cinema' && seatsToCancel.length > 0) {
            const seatArrayKey = `seats_${seatFilter}`;
            if (!ticket[seatArrayKey]) {
                console.error('Invalid seat filter or no seats available:', seatFilter);
                return res.status(400).json({ message: 'Invalid seat filter or no seats available' });
            }

            // Cancel seats only in the correct array based on seatFilter
            seatsToCancel.forEach(seat => {
                const index = ticket[seatArrayKey].indexOf(seat);
                if (index !== -1) {
                    ticket[seatArrayKey].splice(index, 1); // Remove the seat
                    ticket.amount += 1; // Restore ticket availability
                }
            });
        } else if (quantityToCancel > 0) {
            // For non-cinema tickets, adjust quantity
            if (quantityToCancel > ticket.amount) {
                console.error('Cancel quantity exceeds available tickets:', quantityToCancel, ticket.amount);
                return res.status(400).json({ message: 'Cannot cancel more than the purchased amount' });
            }
            ticket.amount += quantityToCancel; // Adjust ticket quantity for non-cinema tickets
        }

        // Save the ticket after modifications
        await ticket.save();

        // Find the user and update their purchased tickets
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found:', user);
        
        // Remove only the canceled tickets or seats from the user's purchasedTickets
        let numberOfTicketsCanceled = quantityToCancel;

        user.purchasedTickets = user.purchasedTickets.filter(userTicket => {
            const matchByTicketId = userTicket.ticketId.toString() === ticketId;
            if (matchByTicketId) {
                if (seatsToCancel.length > 0 && ticketType === 'cinema') {
                    return !seatsToCancel.includes(userTicket.seatNumber) || userTicket.selectedType !== seatFilter;
                } else if (numberOfTicketsCanceled > 0) {
                    if (userTicket.selectedType === seatFilter && userTicket.category === ticketType) {
                        numberOfTicketsCanceled--;
                        return false; // Exclude the canceled ticket
                    }
                }
            }
            return true;
        });
        

        // Save the updated user document
        await user.save();

        console.log('Ticket(s) canceled successfully');
        res.status(200).json({ message: 'Ticket canceled successfully' });
    } catch (error) {
        console.error('Error in canceling ticket:', error);
        res.status(500).json({ message: 'Server error while canceling ticket', error: error.message });
    }
});

// Send Reset Password Email
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }

        // Generate a secure verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.tokenExpiresAt = Date.now() + 3600000; // Token valid for 1 hour
        await user.save();

        const resetLink = `${process.env.BASE_URL}/reset-password/${verificationToken}`;

        // Set up Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS // Your email password
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email.`
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Reset link sent to your email' });
    } catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find the user with the token
        const user = await User.findOne({
            verificationToken: token,
            tokenExpiresAt: { $gt: Date.now() } // Ensure the token is still valid
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password and clear the token
        user.password = hashedPassword;
        user.verificationToken = null;
        user.tokenExpiresAt = null;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in reset-password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;