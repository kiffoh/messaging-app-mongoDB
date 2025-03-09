require('dotenv').config();

const {db} = require('../configuration/connectToMongoDB');
const { ObjectId, ReturnDocument } = require('mongodb'); 

const bcrypt = require('bcrypt')
const passport = require('passport');
const jwt = require('jsonwebtoken');

function formatDateTime (isoString) {
    const date = new Date(isoString);

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getUTCFullYear();

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    const formattedDate = `${day}-${month}-${year}`;
    const formattedTime = `${hours}:${minutes}`;

    return {
        date: formattedDate,
        time: formattedTime
    };
}


async function fetchContactsData(user) {
    if (user.contacts.length > 0) {
        // Get the information about the contacts
        const contactsDocs = await db().collection('users').find({
            _id : {$in : user.contacts}
        }).toArray();

        // Transform contact so that the contact id is a string instead of an objectId
        const contacts = contactsDocs.map(contact => {
            const formattedContact = {
                ...contact,
                id: contact._id.toString()
            }
            delete formattedContact._id;
            return formattedContact
        })

        return contacts;
    } else {
        return [];
    }
}

async function createUser(req, res) {
    try {
        const {username, password} = req.body;
        
        // Check for existing user
        const existingUser = await db().collection('users').findOne({username});
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Username already in user. Please try again with a different username.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const createdAt = new Date();

        const result = await db().collection('users').insertOne({
            username,
            password: hashedPassword,
            createdAt,
            bio: "Hello, I am on EasyMessage!",
            photo: "https://res.cloudinary.com/dmaq0peyx/image/upload/v1725813381/o3aadn8b9aww4wuzethd.svg",
            contacts: []
        })

        const user = {
            id: result.insertedId.toString(),
            username,
            createdAt,
            bio: "Hello, I am on EasyMessage!",
            photo: "https://res.cloudinary.com/dmaq0peyx/image/upload/v1725813381/o3aadn8b9aww4wuzethd.svg",
            contacts: []
        } 

        // Edit createdAt to desired format
        const formattedDateTime = formatDateTime(createdAt);
        
        // Create JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                bio: user.bio, 
                createdAtDate: formattedDateTime.date, 
                createdAtTime: formattedDateTime.time, 
                photo: user.photo 
            },
            process.env.SECRET_KEY, // Use your secret key from environment variables
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        return res.status(201).json({ user, token }); // Return both user and token
    } catch (error) {       
        // Handle bcrypt errors
        if (error.name === 'HashError') {
            return res.status(500).json({ 
                status: 'error',
                message: 'Error processing password' 
            });
        }

        // General error case
        return res.status(500).json({ 
            status: 'error',
            message: 'An error occurred when trying to create the user',
            error
        });
    }
}

function logIn(req, res, next) {
    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err) {
            console.error('Authentication error:', err);  // Log authentication errors
            return next(err);
        }

        if (!user) {
            return res.status(400).json({message: 'Invalid username or password.'})
        }

        // Edit createdAt to desired format
        const formattedDateTime = formatDateTime(user.createdAt);

        // Authenticate user
        const token = jwt.sign(
            { id: user.id, username: user.username, bio: user.bio, createdAtDate: formattedDateTime.date, createdAtTime: formattedDateTime.time, photo: user.photo },
            process.env.SECRET_KEY,
            {expiresIn: '1hr'}
        )
    
        // Send the token to the client
        return res.status(200).json({ token, message: 'Login successful' });
    })(req, res, next);
}

async function getUser(req, res) {
    const {userId} = req.params;

    try {
        const objectID = ObjectId.createFromHexString(userId)
        const user = await db().collection('users').findOne({ _id: objectID});
        
        if (!user) return res.status(404).json({message: 'User not found.'})

        const contacts = await fetchContactsData(user);

        // Turn user.id from an object to a string
        user.id = user._id.toString();
        delete user._id;

         // Format createdAt to desired format
         const formattedDateTime = formatDateTime(user.createdAt);

         // Create a new user object with formatted date and time
         const newUser = {
             ...user,
             contacts,
             createdAtDate: formattedDateTime.date,
             createdAtTime: formattedDateTime.time
         };
         return res.json(newUser); 
    } catch (error) {
        return res.status(500).json({message: 'An unknown error occurred when trying to getUser data.', error})
    }
}

async function getAllUsernames(req, res) {
    try {
        const users = await db().collection('users').find({}).project({
            username: 1,
            photo: 1
        }).toArray();

        /*
        const users = await db().collection('users').find(
            {},
            {username: 1, photo: 1}
        ).toArray();
        */

        if (users.length === 0) return res.status(404).json({message: 'No users found.'})

        // Format the usernames to the correct id attribute (string and named 'id' vs object and named '_id')
        const updatedUsers = users.map(user => {
            userId = user._id.toString();
            delete user._id;

            return {
                ...user,
                id: userId,
                photo: user.photo || process.env.DEFAULT_PICTURE
            }
        })

        return res.json(updatedUsers)
    } catch (err) {
        console.log(err)
        return res.status(500).json({message: 'An unknown error occurred when trying to getAllUsernames.'})
    }
}

async function updateUser(req, res) {
    const {userId} = req.params;
    const {username, bio} = req.body;
    const photo = req.file ? req.file.path : undefined;

    try {
        const objectID = ObjectId.createFromHexString(userId);

        const updateData = {};
        if (username !== undefined) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;
        if (photo !== undefined) updateData.photo = photo;

        const updatedUser = await db().collection('users').findOneAndUpdate(
            {_id: objectID},
            { $set: updateData},
            { returnDocument: 'after'}
        )

        if (!updatedUser) {
            return res.status(404).json({message: 'User not found'});
        }

        // Format user's id to string and correct name ('id')
        updatedUser.id = updatedUser._id.toString();
        delete updatedUser._id;

        const contacts = await fetchContactsData(updatedUser);

        // Format createdAt to desired format
        const formattedDateTime = formatDateTime(updatedUser.createdAt);

        // Create a new user object with formatted date and time
        const updatedUserFormatted = {
            ...updatedUser,
            contacts,
            createdAtDate: formattedDateTime.date,
            createdAtTime: formattedDateTime.time
        };

        res.status(200).json(updatedUserFormatted);

    } catch (error) {
        console.error("Error updating user profile:", error);

        // Handle specific error cases
        if (error.code === 11000) {
            return res.status(409).json({ 
                status: 'error',
                message: 'Username already in use. Please try again with a different username' 
            });
        }

        // General error case
        return res.status(500).json({ 
            status: 'error',
            message: 'An error occurred when trying to update the user' 
        });
    }
}

async function updateUserContacts(req, res) {
    const {userId} = req.params;
    const {selectedContacts} = req.body;

    try {
        const objectID = ObjectId.createFromHexString(userId);
        const contactObjectIds = selectedContacts.map(contactId => ObjectId.createFromHexString(contactId));

        const currentTime = new Date();

        // Updates user array and does not add duplicates with $addToSet
        const updatedUser =  await db().collection('users').findOneAndUpdate(
            {_id: objectID},
            { $addToSet: {contacts: {$each : contactObjectIds}} },
            {returnDocument: 'after'}
        )

        if (!updatedUser) {
            return res.status(404).json({message: 'User not found'});
        }

        // Manipulate userId to desired format
        updatedUser.id = updatedUser._id.toString();
        delete updatedUser._id;

        const contacts = await fetchContactsData(updatedUser)

        // Format createdAt to desired format
        const formattedDateTime = formatDateTime(updatedUser.createdAt);

        // Create a new user object with formatted date and time
        const updatedUserFormatted = {
            ...updatedUser,
            contacts,
            createdAtDate: formattedDateTime.date,
            createdAtTime: formattedDateTime.time
        };

        res.status(200).json(updatedUserFormatted);

    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "An unknown error occurred when trying to update the user's contacts."})
    }
}

async function deleteUser(req, res) {
    const {userId} = req.params;
    try {
        const objectID = ObjectId.createFromHexString(userId);

        const user = await db().collection('users').findOne({  _id: objectID });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Perform the delete
        const result = await db().collection('users').deleteOne({
            _id: objectID
        })

        if (result.deletedCount === 1) {
            return res.status(200).json({ message: 'User successfully deleted.' });
        } else {
            return res.status(500).json({ message: 'Failed to delete user.'})
        }


    } catch (err) {
        console.error(err); // Log the error for debugging

        if (err instanceof TypeError || err.message.includes('hex string')) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        return res.status(500).json({message: 'An unknown error occurred when trying to delete the user.'})
    }
}

module.exports = {
    createUser,
    logIn,
    getUser,
    getAllUsernames,
    updateUser,
    deleteUser,
    updateUserContacts
}