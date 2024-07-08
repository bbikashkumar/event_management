// Event Management/config/upcomingEvents.js
const connection = require('../db');

function getUpcomingEvents(params, callback) {
    let query = 'SELECT * FROM events WHERE datetime > NOW()';
    const queryParams = [];

    if (params.keyword) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        queryParams.push(`%${params.keyword}%`, `%${params.keyword}%`);
    }

    if (params.location) {
        query += ' AND location LIKE ?';
        queryParams.push(`%${params.location}%`);
    }

    if (params.date) {
        query += ' AND DATE(datetime) = ?';
        queryParams.push(params.date);
    }

    // if (params.category) {
    //     query += ' AND category LIKE ?';
    //     queryParams.push(`%${params.category}%`);
    // }

    query += ' ORDER BY datetime ASC';

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching events:', err);
            return callback(err);
        }
        console.log('Fetched events:', results); // Log the results for debugging
        callback(null, results);
    });
}

module.exports = { getUpcomingEvents };
