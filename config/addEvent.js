// config/addEvent.js
const connection = require('../db');

function addEvent(req, res) {
    const { title, description, datetime, location, tickets } = req.body;

    const query = 'INSERT INTO events (title, description, datetime, location, tickets) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [title, description, datetime, location, tickets], (err, results) => {
        if (err) {
            console.error('Error inserting event into database:', err);
            return res.render('addEvent', { successMessage: null, errorMessage: 'Event creation failed. Please try again.' });
        }
        res.render('addEvent', { successMessage: 'Event added successfully!', errorMessage: null });
    });
}

module.exports = { addEvent };
