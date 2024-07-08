const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const { findOrCreate, findUserById } = require('./config/user'); // Import necessary functions
const connection = require('./db');
const { addEvent } = require('./config/addEvent');
const { getUpcomingEvents } = require('./config/upcomingEvents');
const { getEventById } = require('./config/bookTicket');
const { registerOrganizer } = require('./config/organizer-regd');


const FACEBOOK_APP_ID = '1030266244741997';
const FACEBOOK_APP_SECRET = '7f2463a1d6b4c3d874974e350ddef53f';

// Passport session setup
passport.serializeUser((user, done) => {
    done(null, user.id);
});


passport.deserializeUser((id, done) => {
    // Retrieve user from database based on user id stored in session
    const query = 'SELECT * FROM users WHERE id = ?';
    connection.query(query, [id], (err, results) => {
        if (err || results.length === 0) {
            return done(err, null);
        }
        const user = results[0];
        return done(null, user);
    });
});

// Route for Facebook authentication
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Callback route after Facebook authentication
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/eventhome'); // Redirect to the home page after successful authentication
    }
);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); // Redirect to login page if not authenticated
}

// Example protected route
// app.get('/eventhome', ensureAuthenticated, (req, res) => {
//     res.render('eventhome', { user: req.user }); // Access authenticated user through req.user
// });

app.get('/eventhome', (req, res) => {
    // Render the view for eventhome
    res.render('eventhome', { /* Optional: Pass any data needed for rendering */ });
});


// Use the Facebook Strategy within Passport
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: 'http://localhost:8080/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails']
}, (accessToken, refreshToken, profile, done) => {
    findOrCreate(profile, (err, user) => {
        if (err) {
            return done(err);
        }
        return done(null, user);
    });
}));

app.use(session({
    secret: 'YOUR_SESSION_SECRET',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public/css')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Something broke!' });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`App started at port ${port}`);
});

// Middleware to check if user is an organizer
function isOrganizer(req, res, next) {
    if (req.isAuthenticated() && req.user.isOrganizer) {
        return next();
    }
    res.redirect('/not-authorized');
}

// Google OAuth routes
// Replace with your Google OAuth implementation

// Facebook authentication routes
// Replace with your Facebook authentication implementation

app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.send(`<h1>Profile</h1><p>Welcome, ${req.user.displayName}</p><a href="/logout">Logout</a>`);
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Registration routes
app.get('/register', (req, res) => {
    res.render('register', { successMessage: null, errorMessage: null });
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    connection.query(query, [username, email, password], (err, results) => {
        if (err) {
            console.error('Error inserting user into database:', err);
            return res.render('register', { successMessage: null, errorMessage: 'Registration failed. Please try again.' });
        }
        res.redirect('/login?registrationSuccess=true');
    });
});

// Login routes
app.get('/login', (req, res) => {
    const registrationSuccess = req.query.registrationSuccess === 'true';
    res.render('login', { registrationSuccess, loginError: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error fetching user from database:', err);
            return res.render('login', { registrationSuccess: false, loginError: 'An error occurred. Please try again.' });
        }

        if (results.length > 0) {
            res.render('eventhome', { username: results[0].username });
        } else {
            res.render('login', { registrationSuccess: false, loginError: 'Invalid username or password. Please try again.' });
        }
    });
});

// Event management routes
app.get('/eventhome', (req, res) => {
    res.render('eventhome');
});

app.get('/bookTicket/:id', (req, res) => {
    const eventId = req.params.id;
    getEventById(eventId, (err, event) => {
        if (err || !event) {
            console.error('Error fetching event:', err);
            return res.status(404).send('Event not found');
        }
        res.render('bookTicket', { event, successMessage: null, errorMessage: null });
    });
});

// Route to handle booking confirmation
app.post('/bookTicket', (req, res) => {
    const { name, email, phone, tickets, eventId } = req.body;

    const query = `
        INSERT INTO ticket_bookings (name, email, phoneNo, no_of_tickets, event_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(query, [name, email, phone, tickets, eventId], (err, results) => {
        if (err) {
            console.error('Error booking ticket:', err.stack);
            res.render('bookTicket', {
                event: { id: eventId, title: "Event Title" },
                errorMessage: 'Booking failed. Please try again.',
                successMessage: null
            });
            return;
        }
        res.render('bookTicket', {
            event: { id: eventId, title: "Event Title" },
            successMessage: 'Booking successful!',
            errorMessage: null
        });
    });
});

app.get('/addEvent', (req, res) => {
    res.render('addEvent', { successMessage: null, errorMessage: null });
});

app.post('/addEvent', addEvent);

app.get('/upcomingEvents', (req, res) => {
    const { keyword, location, date, category } = req.query;
    const searchParams = { keyword, location, date, category };

    getUpcomingEvents(searchParams, (err, events) => {
        if (err) {
            console.error('Error fetching upcoming events:', err);
            return res.status(500).render('error', { message: 'Failed to load upcoming events' });
        }
        res.render('upcomingEvents', { events, searchParams });
    });
});

// Organizer registration routes
app.get('/organizer-regd', (req, res) => {
    res.render('organizer-regd', { message: null });
});

app.post('/register-organization', (req, res) => {
    const { organizerId, email, password } = req.body;

    // Example query to insert organizer into database
    const insertOrganizationQuery = 'INSERT INTO organization (organization_id, email, password) VALUES (?, ?, ?)';
    connection.query(insertOrganizationQuery, [organizerId, email, password], (err, results) => {
        if (err) {
            console.error('Error registering organization:', err);
            return res.render('organizer-regd', { message: 'Organization ID is already exist.' });
        }
        res.render('organizer-regd', { message: 'Organization registered successfully!' });
    });
});

app.get('/Organization-login', (req, res) => {
    res.render('Organization-login', { message: null });
});



// app.post('/Customize-Event', (req, res) => {
//     const eventId = req.query.eventId; // Retrieve event ID from query parameters
//     res.render('Customize-Event', { eventId });
// });



app.get('/organizerLogin', (req, res) => {
    const eventId = req.query.eventId;
    const organizerId = req.query.organizerId;
    res.render('organizerLogin', { eventId, organizerId });
});

// app.get('/Customize-Event', (req, res) => {
//     res.render('Customize-Event', { message: null });
// });

// app.post('/Customize-Event', (req, res) => {
//     const { organizerUsername, organizerPassword } = req.body;

//     const query = 'SELECT * FROM organizers WHERE username = ? AND password = ?';
//     connection.query(query, [organizerUsername, organizerPassword], (err, results) => {
//         if (err) {
//             console.error('Error fetching organizer from database:', err);
//             return res.render('organizer-login', { loginError: 'An error occurred. Please try again.' });
//         }

//         if (results.length > 0) {
//             const organizerId = results[0].id; // Assuming 'id' is the identifier for the organizer
//             res.redirect(`/customize-event/${organizerId}`); // Redirect to customize event page with organizer id
//         } else {
//             res.render('organizer-login', { loginError: 'Invalid username or password. Please try again.' });
//         }
//     });
// });

// GET request to handle Customize-Event
app.get('/Customize-Event', (req, res) => {
    const { organizerUsername, organizerPassword, eventId } = req.query;

    // Query to validate organizer credentials (assuming you have a table named organizers)
    const query = 'SELECT * FROM organization WHERE organization_id = ? AND password = ?';
    connection.query(query, [organizerUsername, organizerPassword], (err, results) => {
        if (err) {
            console.error('Error fetching organizer from database:', err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            // Valid organizer, redirect to Customize-Event page
            res.redirect(`/customize-event/${eventId}`);
        } else {
            // Invalid credentials, redirect to login or display error
            res.status(401).send('Invalid username or password');
        }
    });
});


// app.get('/customize-event/:id', isOrganizer, (req, res) => {
//     const eventId = req.params.id; // Extract event ID from URL parameter

//     // Query to fetch event details from the database
//     const query = 'SELECT * FROM events WHERE id = ?';
//     connection.query(query, [eventId], (err, results) => {
//         if (err) {
//             console.error('Error fetching event:', err);
//             return res.status(500).send('Error fetching event');
//         }

//         if (results.length === 0) {
//             return res.status(404).send('Event not found');
//         }

//         const event = results[0]; // Assuming results contain the event details

//         // Render Customize-Event.ejs with the event data
//         res.render('Customize-Event', { event });
//     });
// });

// Error handling middleware
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Something broke!' });
});

// Not authorized route
app.get('/not-authorized', (req, res) => {
    res.render('not-authorized');
});



// app.get('/login-organization', (req, res) => {
//     res.render('Organization-login', { message: null });
// });
app.post('/login-organization', (req, res) => {
    const { organizationId, password } = req.body;

    const query = 'SELECT * FROM organization WHERE organization_id = ? AND password = ?';
    connection.query(query, [organizationId, password], (err, results) => {
        if (err) {
            console.error('Error fetching organizer from database:', err);
            return res.render('Organization-login', { message: 'An error occurred. Please try again.' });
        }

        if (results.length > 0) {
            // Assuming you have a function to get upcoming events and render them
            getUpcomingEvents({}, (err, events) => {
                if (err) {
                    console.error('Error fetching upcoming events:', err);
                    return res.status(500).render('error', { message: 'Failed to load upcoming events' });
                }
                res.render('upcomingEvents', { events, searchParams: {} });
            });
        } else {
            res.render('Organization-login', { message: 'Invalid Organization ID or password. Please try again.' });
        }
    });
});


app.get('/login-organizer', (req, res) => {
    res.render('login-organizer', { eventId: req.query.eventId });
});
app.post('/login-organizer', (req, res) => {
    const { organizerUsername, organizerPassword, eventId } = req.body;

    const query = 'SELECT * FROM organizers WHERE username = ? AND password = ?';
    connection.query(query, [organizerUsername, organizerPassword], (err, results) => {
        if (err) {
            console.error('Error fetching organizer from database:', err);
            return res.render('login-organizer', { eventId, message: 'An error occurred. Please try again.' });
        }

        if (results.length > 0) {
            res.redirect(`/customize-event/${eventId}`);
        } else {
            res.render('login-organizer', { eventId, message: 'Invalid username or password. Please try again.' });
        }
    });
});

app.get('/customize-event/:eventId', (req, res) => {
    const eventId = req.params.eventId;

    // Query to fetch event details from the database
    const query = 'SELECT * FROM events WHERE id = ?';
    connection.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('Error fetching event:', err);
            return res.status(500).send('Error fetching event');
        }

        if (results.length === 0) {
            return res.status(404).send('Event not found');
        }

        const event = results[0];
        // Assuming you want to pass a success message as well
        const successMessage = ''; // Replace with appropriate message

        res.render('Customize-Event', { event, successMessage });
    });
});


// POST route to handle updating event
app.post('/update-event', (req, res) => {
    const { id, title, description, date, location } = req.body;

    // Update query to update event in database
    const updateQuery = 'UPDATE events SET title = ?, description = ?, datetime = ?, location = ? WHERE id = ?';
    const formattedDate = new Date(date); // Assuming date is in YYYY-MM-DD format

    connection.query(updateQuery, [title, description, formattedDate, location, id], (err, results) => {
        if (err) {
            console.error('Error updating event:', err);
            return res.status(500).send('Error updating event');
        }

        console.log('Event updated successfully');
        // Render Customize-Event page with success message
        res.render('Customize-Event', { event: { id, title, description, datetime: formattedDate, location }, successMessage: 'Event updated successfully' });
    });
});

// Assuming you have initialized Express and set up your database connection

// Route to render the attendee-list.ejs page
app.get('/attendee-list/:eventId', (req, res) => {
    const eventId = req.params.eventId;

    // Query to fetch attendees for a specific event ID
    const query = 'SELECT * FROM ticket_bookings WHERE event_id = ?';
    connection.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('Error fetching attendees:', err);
            return res.status(500).send('Error fetching attendees');
        }
        
        // Render the attendee-list.ejs page with fetched attendees data
        res.render('attendee-list', { attendees: results });
    });
});


module.exports = app;
