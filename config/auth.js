// config/auth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const connection = require('../db');

passport.use(new GoogleStrategy({
    clientID: 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: '/auth/google/callback'
},
(accessToken, refreshToken, profile, done) => {
    const query = 'SELECT * FROM users WHERE google_id = ?';
    connection.query(query, [profile.id], (err, results) => {
        if (err) return done(err);
        if (results.length > 0) {
            return done(null, results[0]);
        } else {
            const insertQuery = 'INSERT INTO users (google_id, username, email) VALUES (?, ?, ?)';
            connection.query(insertQuery, [profile.id, profile.displayName, profile.emails[0].value], (err, results) => {
                if (err) return done(err);
                return done(null, { id: results.insertId, google_id: profile.id, username: profile.displayName, email: profile.emails[0].value });
            });
        }
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    connection.query(query, [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]);
    });
});

module.exports = passport;
