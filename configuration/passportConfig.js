const { db } = require('./connectToMongoDB');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

async function validatePassword(user, password) {
    return await bcrypt.compare(password, user.password);
}

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, async (username, password, done) => {
    try {
        const user = await db().collection('users').findOne({
            username
        });

        if (!user) {
            return done(null, false, {message: 'Incorrect username.'})
        }

        const isValidPw = await validatePassword(user, password);
        if (!isValidPw) {
            return done(null, false, {message: 'Incorrect password.'})
        }

        // Refactor user.id to the user object for frontend interactions
        user.id = user._id.toString();
        delete user._id;

        return done(null, user)
    } catch (err) {
        return done(err);
    }
}));

module.exports = passport;