// db.js
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'event_management',
    password: 'Bikash@2000'
});

const setupDatabase = async () => {
    const filePath = path.join(__dirname, 'sql', 'setup.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
        await connection.query(sql);
        console.log('Database setup completed.');
    } catch (err) {
        console.error('Error setting up the database:', err);
    }
};

connection.connect(async (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database as id', connection.threadId);

    // // Check if the database is already set up
    // const checkQuery = 'SELECT * FROM users LIMIT 1';
    // connection.query(checkQuery, async (err, results) => {
    //     if (err || results.length === 0) {
    //         console.log('Running database setup...');
    //         await setupDatabase();
    //     }
    // });
});

module.exports = connection;
