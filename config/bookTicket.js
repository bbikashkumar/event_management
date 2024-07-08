const connection = require('../db');

function getEventById(eventId, callback) {
    const query = 'SELECT * FROM events WHERE id = ?';
    connection.query(query, [eventId], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]);
    });
}

module.exports = { getEventById };
