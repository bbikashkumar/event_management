// config/user.js
let users = [];

function findOrCreate(profile, callback) {
    let user = users.find(user => user.facebookId === profile.id);
    if (user) {
        return callback(null, user);
    }
    
    user = {
        id: users.length + 1,
        facebookId: profile.id,
        displayName: profile.displayName,
        email: profile.emails ? profile.emails[0].value : null
    };
    users.push(user);
    return callback(null, user);
}

function findUserById(id) {
    return users.find(user => user.id === id);
}

module.exports = { findOrCreate, findUserById, users };
