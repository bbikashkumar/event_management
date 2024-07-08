const connection = require('../db');

function registerOrganizer(req, res) {
    const { organizerId, email, password } = req.body;

    // Check if organizerId already exists in the organization table
    const checkQuery = 'SELECT * FROM organization WHERE organization_id = ?';
    connection.query(checkQuery, [organizerId], (err, results) => {
        if (err) {
            console.error('Error checking organizer existence:', err);
            return res.render('organizer-regd', { successMessage: null, errorMessage: 'Registration failed. Please try again.' });
        }

        if (results.length > 0) {
            // Organizer ID already exists, handle accordingly
            return res.render('organizer-regd', { successMessage: null, errorMessage: 'Organizer ID already registered.' });
        }

        // If organizerId does not exist, proceed with registration
        const insertQuery = 'INSERT INTO organization (organization_id, email, password) VALUES (?, ?, ?)';
        connection.query(insertQuery, [organizerId, email, password], (insertErr, insertResults) => {
            if (insertErr) {
                console.error('Error inserting organizer into database:', insertErr);
                return res.render('organizer-regd', { successMessage: null, errorMessage: 'Registration failed. Please try again.' });
            }
            res.redirect('/login?registrationSuccess=true');
        });
    });
}

module.exports = { registerOrganizer };
