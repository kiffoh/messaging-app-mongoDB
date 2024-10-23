# **EasyMessage - Messaging App (Backend)**

**EasyMessage** is a web application for direct and group messaging, inspired by WhatsApp. This project is one of the final projects in the [Odin Project](https://www.theodinproject.com/lessons/nodejs-messaging-app). As part of the learning process, I have reinforced my knowledge on authentification, media-sharing whilst enhancing my skills in real-time server-client communication.


The backend is built using Node.js and utilises the Prisma ORM for database management. It is responsible for handling requests from the frontend (RESTful API), setting up and maintaining the database, and managing Socket.IO connections for real-time messaging.

### Core Features

- 🔐 **Secure Authentication**: JWT-based user authentication
- 💬 **Real-time Messaging**: Instant message delivery using Socket.IO
- 👥 **Group Chats**: Support for multiple users in conversations
- 📸 **Media Sharing**: Image upload and sharing capabilities
- 👤 **User Profiles**: Customisable user profiles with avatars
- 📱 **Direct Messages**: One-to-one private conversations

# Quick Start
[The website is live](https://messaging-app-client-eight.vercel.app/). Log in with the demo credentials to explore the features of the full-stack application:
- **username**: guest
- **password**: iamaguest

## Technology Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js, JWT
- **Real-time Communication**: Socket.IO
- **File Upload**: Multer, Cloudinary
- **Testing**: Jest


# **Table of Contents**
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication and Authorisation](#authentication-and-authorisation)
- [Testing](#testing)
- [Deployment](#deployment)

# **Installation**
### **Prerequisites**
Ensure the following software is installed before proceeding:
- **Node.js** (v16+ recommended)
- **PostgreSQL** (or your preferred database)

1. Clone the repository:
    ```bash
    git clone https://github.com/kiffoh/messaging-app-server.git
    cd messaging-app-server
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

This will install all necessary dependencies, including:
- **Prisma** (for ORM)
- **Express** (for server)
- **Passport.js** (for authentication)
- **jsonwebtoken** (for JWT-based authorization)
- **socket.io** (for real-time communication)
- **multer** (for file-uploads)
- **cloudinary api** (for online-storage)
- And more...

# **Environment Setup**
To set up your environment, create a `.env` file in the root directory of your project. This file should contain the following required environment variables, along with descriptions for each:

### Server Configuration
- **NODE_ENV**: Set to `development` or `production` to specify the environment.
- **SECRET_KEY**: Secret key for signing tokens
- **FRONTEND_URL**: URL for your frontend application

### Database Configuration
- **DATABASE_URL**: Connection string for your database

### Media Storage
- **CLOUDINARY_URL**: Cloudinary URL for media uploads
- **CLOUDINARY_API_KEY**: Cloudinary API key
- **CLOUDINARY_API_SECRET**: Cloudinary API secret
- **CLOUDINARY_CLOUD_NAME**: Cloudinary cloud name

### Default Assets
- **DEFAULT_PICTURE**: Default profile picture URL
- **DEFAULT_GROUP_PICTURE**: Default group picture URL

If you want to have separate environment files for production and development, you can create `.env.production` and `.env.development`. You will also need to set the `NODE_ENV` variable in the command line or use the `cross-env` package (already a dependency) for Windows users. 

### Example `.env.development` File
```bash
NODE_ENV=development
DATABASE_URL=database-url
FRONTEND_URL=api-url
SECRET_KEY='your-secret-key'
DEFAULT_PICTURE=relative/url-to-default-profile-picture
DEFAULT_GROUP_PICTURE=relative/url-to-default-group-picture
CLOUDINARY_URL=cloudinary-url
CLOUDINARY_API_KEY=cloudinary-api-key
CLOUDINARY_API_SECRET=cloudinary-api-secret
CLOUDINARY_CLOUD_NAME=cloudinary-cloud-name
```

### Notes
- Ensure that you replace the placeholder values with your actual configuration.
- Keep your `.env` file out of version control by adding it to your `.gitignore`.

# **Running the Project**

To run the development server, use the following command:
```bash
npm run dev

```
To run the production server, execute:
```bash
npm start
```

### Notes
- The cross-env package is included in the above commands. If you are using macOS or Linux, you can remove cross-env from the package.json scripts, as it is only necessary for Windows users.
- Ensure that you have all environment variables set up correctly before starting the servers.

### Debugging
To run with debug logs:
```bash
DEBUG=easymessage:* npm run dev
```

# API Documentation

This document outlines all available endpoints in the application. The API is organized into four main sections:
- Users
- Groups
- Messages

### Request Formats
- For file uploads: `multipart/form-data`
- For all other requests: `application/json`

## User Routes
### Create User
`POST /users/signup`
- **Description**: Creates a new user account
- **Request Body**:
```json
{
    "username": "johndoe",
    "password": "password123"
}
```
- **Response:**
    - **Success (201):**
    ```json
    {
        "user": {
            "id": 1,
            "username": "johndoe",
            "bio": null,
            "createdAt": "..."
        },
        "token": "jwt-token-string"
    }
    ```
    - **Error (409)** - Username exists: 
    ```json
    {
        "status": "error",
        "message": "Username already in use. Please try again with a different username"
    }
    ```
    - **Error (500)** - Server error:
    ```json
    {
        "status": "error",
        "message": "An error occurred when trying to create the user"
    }
    ```

### Login User
`POST /users/login`
- **Description:** Authenticates a user and provides a JWT token
- **Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```
- **Response:**
    - **Success (200):** 
    ```json
    {
        "token": "jwt-token-string",
        "message": "Login successful"
    }
    ```
    - **Error (400):**
    ```json
    {
        "message": "Invalid username or password."
    }
    ```

### Get User Profile
`GET /users/:userId/profile`
- **Description:** Fetches the profile information of a user by userId.
- **URL Parameters:**
    - `userId`: User's unique identifier (number)
- **Response:**
    - **Success (200):** 
    ```json
    {
        "id": 1,
        "username": "johndoe",
        "bio": "User bio",
        "photo": "photo/path",
        "createdAtDate": "23-10-2024",
        "createdAtTime": "14:30",
        "contacts": []
    }
    ```
    - **Error (404):**
    ```json
    {
        "message": "User not found"
    }
    ```
    
### Update User Profile    
`PUT /users/:userId/profile`
- **Description:** Updates the profile of a user, including uploading a profile photo.
- **Content-Type**: `multipart/form-data` for profile photo and other user details.
- **URL Parameters:**
    - `userId`: User's unique identifier (number)
- **Request Body:**
    - `username` (optional): New username
    - `bio` (optional): User biography
    - `photo` (optional): Profile photo file
- **Response:**
    - **Success (200):** Returns updated user object with contacts
    - **Error (409):** - Username exists:
    ```json
    {
        "status": "error",
        "message": "Username already in use. Please try again with a different username"
    }
    ```

### Delete User Profile
`DELETE /users/:userId/profile`
- **Description:** Deletes user account and related data
- **URL Parameters:**
    - `userId`: User's unique identifier (number)
- **Response:**
    - **Success (200):**
    ```json
    {
        "message": "User successfully deleted."
    }
    ```
    - **Error (404):** 
    ```json
    {
        "message": "User not found."
    }
    ```

### Get All Usernames
`GET /users/usernames`
- **Description:** Retrieves all usernames and basic user information
- **Response:**
    - **Success (200):**
    ```json
    [
        {
            "id": 1,
            "username": "johndoe",
            "photo": "photo/path"
        }
    ]
    ```
    - **Error (404):**
    ```json
    {
        "message": "No users found."
    }
    ```

### Update User Contacts
`PUT /users/:userId/update-contacts`
- **Description:** Updates the user's contact list.
- **URL Parameters:**
    - `userId`: User's unique identifier (number)
- **Request Body:** An array of user IDs to be added to the contact list.
```json
{
  "selectedContacts": [1, 2, 3]  // Array of user IDs
}
```
- **Response:**
    - **Success (200):** Returns updated user object with contacts
    - **Error (500):** 
    ```json
    {
        "message": "An unknown error occurred when trying to update the user's contacts."
    }
    ```

## Message Routes

### Get Messages
`GET /messages/:userId`
- **Description**: Retrieves all messages for a specific user
- **URL Parameters:**
    - `userId`: User's unique identifier (number)
- **Response:**
    - **Success (200):**
    ```json
    {
        "messages": [
            {
                "id": 1,
                "content": "Hello world!",
                "senderId": 123,
                "chatId": 456,
                "photoUrl": "photo/path",
                "createdAt": "2024-03-21T10:30:00Z",
                "updatedAt": "2024-03-21T10:30:00Z"
            }
        ]
    }
    ```
    - **Error (500):**
    ```json
    {
        "message": "An unknown error occurred when trying to retrieve messages."
    }
    ```

### Create Message
`POST /messages/:chatId`
- **Description:** Creates a new message in a specific chat
- **Content-Type**: `multipart/form-data` for message with photo
- **URL Parameters:**
    - `chatId`: Chat's unique identifier (number)
- **Request Body:**
    - `content`: Message text
    - `photoUrl` (optional): Message photo file
- **Response:**
    - **Success (201):**
    ```json
    {
        "message": {
            "id": 2,
            "content": "Hello everyone!",
            "senderId": 123,
            "chatId": 456,
            "photoUrl": "photos/message123.jpg",
            "createdAt": "2024-03-21T10:35:00Z"
        }
    }
    ```
    - **Error (500):**
    ```json
    {
        "message": "An unknown error occurred when trying to create the message."
    }
    ```

### Update Message
`PUT /messages/:chatId/:messageId`
- **Description:** Updates an existing message
- **URL Parameters:**
    - `chatId`: Chat's unique identifier (number)
    - `messageId`: Message's unique identifier (number)
- **Request Body:**
```json
{
    "content": "Updated message content"
}
```
- **Response:**
    - **Success (200):**
    ```json
    {
        "message": {
            "id": 2,
            "content": "Updated message content",
            "senderId": 123,
            "chatId": 456,
            "photoUrl": "photos/message123.jpg",
            "createdAt": "2024-03-21T10:35:00Z",
            "updatedAt": "2024-03-21T10:40:00Z"
        }
    }
    ```
    - **Error (500):**
    ```json
    {
        "message": "An unknown error occurred when trying to update the message."
    }
    ```

### Delete Message
`DELETE /messages/:chatId/:messageId`
- **Description:** Deletes a specific message
- **URL Parameters:**
    - `chatId`: Chat's unique identifier (number)
    - `messageId`: Message's unique identifier (number)
- **Response:**
    - **Success (200):**
    ```json
    {
        "message": "Message successfully deleted"
    }
    ```
    - **Error (500):**
    ```json
    {
        "message": "An unknown error occurred when trying to delete the message."
    }
    ```

## Group Routes

### Get Group Profile
`GET /groups/:groupId/profile`
- **Description:** Retrieves information about a specific group
- **URL Parameters:**
    - `groupId`: Group's unique identifier (number)
- **Response:**
    - **Success (200):**
    ```json
    {
        "id": 789,
        "name": "Project Team",
        "photo": "photos/group789.jpg",
        "bio": "Team collaboration group",
        "createdAtDate": "21-03-2024",
        "createdAtTime": "10:30",
        "members": [
            {
                "id": 123,
                "username": "john_doe"
            }
        ],
        "admins": [
            {
                "id": 123,
                "username": "john_doe"
            }
        ]
    }
    ```
    - **Error (404):**
    ```json
    {
        "message": "Group not found."
    }
    ```
    - **Error (400):**
    ```json
    {
        "message": "Invalid group ID."
    }
    ```

### Update Group Profile
`PUT /groups/:groupId/profile`
- **Description:** Updates a group's profile information
- **Content-Type**: `multipart/form-data` for group photo
- **URL Parameters:**
    - `groupId`: Group's unique identifier (number)
- **Request Body:**
    - `name` (optional): Group name
    - `bio` (optional): Group description
    - `photo` (optional): Group photo file
- **Response:**
    - **Success (200):**
    ```json
    {
        "id": 789,
        "name": "Updated Project Team",
        "photo": "photos/group789_updated.jpg",
        "bio": "Our awesome team collaboration group",
        "createdAtDate": "21-03-2024",
        "createdAtTime": "10:30"
    }
    ```
    - **Error (400)** - Validation errors:
    ```json
    {
        "status": "error",
        "errors": [
            {
                "field": "name",
                "message": "Group name is required"
            }
        ]
    }
    ```

### Delete Group
`DELETE /groups/:groupId/profile`
- **Description:** Deletes a specific group
- **URL Parameters:**
    - `groupId`: Group's unique identifier (number)
- **Headers:**
    - `user-id`: ID of the user attempting to delete (number)
- **Response:**
    - **Success (200):**
    ```json
    {
        "message": "Group successfully deleted."
    }
    ```
    - **Error (403):**
    ```json
    {
        "message": "User does not have admin privileges to delete this group."
    }
    ```
    - **Error (404):**
    ```json
    {
        "message": "Group not found."
    }
    ```

### Create Direct Message
`POST /groups/createDirectMessage`
- **Description:** Creates a new direct message group between users
- **Request Body:**
```json
{
    "members": [
        {"id": 123, "username": "john_doe"},
        {"id": 456, "username": "jane_smith"}
    ]
}
```
- **Response:**
    - **Success (201):**
    ```json
    {
        "newGroup": {
            "id": 790,
            "name": "jane_smith",
            "photo": "photos/default.jpg",
            "directMsg": true,
            "members": [
                {
                    "id": 123,
                    "username": "john_doe"
                },
                {
                    "id": 456,
                    "username": "jane_smith"
                }
            ],
            "messages": []
        }
    }
    ```
    - **Error (400):**
    ```json
    {
        "message": "Group must have at least one member."
    }
    ```

### Create Group
`POST /groups/createGroup`
- **Description:** Creates a new group chat
- **Content-Type**: `multipart/form-data` for group photo
- **Request Body:**
    - `name` (optional): Group name
    - `members`: JSON string of member objects
    - `groupPhoto` (optional): Group photo file
- **Response:**
    - **Success (201):**
    ```json
    {
        "newGroup": {
            "id": 791,
            "name": "Project Team",
            "photo": "photos/group791.jpg",
            "directMsg": false,
            "members": [
                {
                    "id": 123,
                    "username": "john_doe"
                },
                {
                    "id": 456,
                    "username": "jane_smith"
                }
            ],
            "messages": [],
            "admins": [
                {
                    "id": 123,
                    "username": "john_doe"
                }
            ]
        }
    }
    ```
    - **Error (400)** - Validation errors:
    ```json
    {
        "status": "error",
        "errors": [
            {
                "field": "members",
                "message": "Members array is required"
            }
        ]
    }
    ```

## Notes
- All routes utilise Socket.IO for real-time updates
- Dates are formatted as "DD-MM-YYYY" and times as "HH:MM" in UTC
- Photo uploads are handled through Multer
- Direct message groups automatically generate names based on participants

## Error Responses
All endpoints may return these common errors:

- **500 Internal Server Error:** When an unexpected error occurs
- **400 Bad Request:** When request validation fails

# **Database Schema**
The schema is implemented using Prisma with PostgreSQL as the database provider.

To apply the database schema migrations, run the following command:
```bash
npx prisma migrate dev
```

Alternatively, you can use the commands defined in the package.json, which allow specifying the development or production database:
```bash
"migrate:dev": "cross-env DATABASE_URL=development-url npx prisma migrate dev",
"migrate:prod": "cross-env DATABASE_URL=production-url npx prisma migrate dev",
```

### Notes
- **Environment-specific migrations**: Ensure that you set the `NODE_ENV` to either `development` or `production` before running the migration commands.
- **Windows users**: You must use `cross-env` to set environment variables, as shown in the `package.json` commands.
- **macOS/Linux users**: You can remove `cross-env` from the commands, as environment variables can be set directly in the terminal.

## Models

### User
Represents an application user with their profile information and relationships.

#### Fields
- `id` (Int): Primary key, auto-incrementing
- `username` (String): Unique identifier for the user
- `password` (String): Encrypted user password
- `bio` (String?): Optional user biography
  - Default: "Hello, I am on EasyMessage!"
- `photo` (String?): Profile picture URL
  - Default: Cloudinary-hosted default image
- `createdAt` (DateTime): Timestamp of account creation

#### Relationships
- `messages`: One-to-many relation with Message model
  - A user can send multiple messages
- `groups`: Many-to-many relation with Group model via "GroupMembers"
  - Users can be members of multiple groups
- `adminGroups`: Many-to-many relation with Group model via "GroupAdmins"
  - Users can be administrators of multiple groups
- `contacts`: Self-referential many-to-many relationship
  - Manages user's contact list
  - Bidirectional relationship through `contactedBy`

### Message
Handles the storage and management of messages within groups and direct chats.

#### Fields
- `id` (Int): Primary key, auto-incrementing
- `content` (String?): Optional message text
  - Nullable to support photo-only messages
- `photoUrl` (String?): Optional URL for attached images
- `createdAt` (DateTime): Message creation timestamp
- `updatedAt` (DateTime): Last modification timestamp
- `authorId` (Int?): Foreign key to User model
- `groupId` (Int): Foreign key to Group model

#### Relationships
- `author`: Many-to-one relation with User model
  - Nullable to handle deleted user accounts
- `group`: Many-to-one relation with Group model
  - Every message belongs to a group/chat

### Group
Manages both group chats and direct messages between users.

#### Fields
- `id` (Int): Primary key, auto-incrementing
- `name` (String?): Optional group name
- `photo` (String?): Optional group avatar URL
- `createdAt` (DateTime): Group creation timestamp
- `updatedAt` (DateTime): Last activity timestamp
- `directMsg` (Boolean): Flags whether this is a direct message chat
- `bio` (String?): Optional group description
  - Default: "We are the greatest tribe on EasyMessage."

#### Relationships
- `members`: Many-to-many relation with User model via "GroupMembers"
- `admins`: Many-to-many relation with User model via "GroupAdmins"
- `messages`: One-to-many relation with Message model

#### Indexes
- Combined index on `[updatedAt, createdAt]`
  - Optimises queries for recent activity and chat history

### Key Features
- **Direct Messages**: Implemented through the Group model with `directMsg` flag
- **Group Chats**: Full support for multi-user conversations
- **Admin Controls**: Separate tracking of group administrators
- **Contact Management**: Built-in contact list functionality
- **Media Support**: Handles both text and image messages
- **Soft Deletion**: Messages persist even if users are deleted

### Notes
- The schema supports both one-on-one and group messaging through a unified Group model
- User photos default to a Cloudinary-hosted image
- Messages can contain text, images, or both
- Groups and users maintain separate creation and update timestamps for activity tracking


# Authentication and Authorisation
The application uses JSON Web Tokens (JWT) for stateless authentication, implemented through Passport.js with a Local Strategy for credential verification. User passwords are securely hashed using bcrypt before storage.

## Authentication Implementation
- **Strategy**: Passport Local Strategy (stateless)
- **Token Type**: JSON Web Tokens (JWT)
- **Password Security**: 
    - Passwords are hashed using bcrypt
    - Passwords are never stored in plain text

### Token Structure
JWT payload includes:
- `id`: User's unique identifier
- `username`: User's username
- `bio`: User's biography
- `createdAtDate`: Formatted date of account creation
- `createdAtTime`: Formatted time of account creation
- `photo`: URL to user's profile photo

### Authentication Flow
1. **Login Process**:
  - User submits username and password
  - Credentials are validated against database
  - Upon successful validation:
    - JWT token is generated with user data
    - Token is returned to client
    - Token expires in 1 hour

2. **Token Configuration**:
- Expiration: 1 hour
- Signing algorithm: HS256
- Token must be included in Authorization header for protected routes

3. **Error Handling**:
- Invalid credentials return 400 Bad Request
- Server errors return 500 Internal Server Error
- Detailed error messages for debugging

## Security Measures
- Stateless authentication using JWT
- Password hashing with bcrypt
- Environment-based secret key configuration
- Token expiration for security
- Error logging for authentication failures

### Environment Variables Required
```env
SECRET_KEY=your_jwt_secret_key
```

### Error Responses
- Invalid Credentials:
```json
{
  "message": "Invalid username or password."
}
```
- Successful Login:
```json
{
  "token": "jwt_token_string",
  "message": "Login successful"
}
```

# Testing
This project uses [Jest](https://jestjs.io/) as the testing framework. The tests primarily focus on the functionality of group and user deletion, ensuring the correct cascading behavior for related data such as messages, and group memberships.

### Running Tests

To run the test suite, execute the following command:

```bash
npm test
```

### Group Deletion Tests
- **Test Description**: These tests verify that when a group is deleted, all associated data such as messages and message receipts are correctly removed, and users are disconnected from the group.
The following cases are covered:
- The group and its related data (messages, message receipts) should be deleted.
- Users should be disconnected from the group as members or admins.

### User Deletion Tests
- **Test Description**: These tests verify that when a user is deleted, the associated group data is updated accordingly, including checking that the user is no longer a member or admin of any group, and their direct messages (DMs) and related receipts are properly handled.
The following cases are covered:
- The user is successfully deleted.
- After deletion, the groups and DMs associated with the user reflect the removal of that user (e.g., admin status removed, members reduced).

### Notes
- **Database transactions**: The tests use Prisma's $transaction method to handle the deletion process and ensure the related data is removed safely.
- **Environment setup**: Ensure your .env.test or equivalent testing environment is properly configured before running the tests.
- **Post-test cleanup**: The afterAll() hook in the test files ensures the database connection is properly closed after the tests run.

## Deployment

### Backend Deployment
- **Platform**: Render
  - The backend code is deployed on Render. 
  - Ensure that your application is configured to use the correct environment variables.

### Database
- **Production Database**: Neon
  - The production database is hosted on Neon. Make sure to set up the database correctly and include any necessary connection strings in your environment variables.

### Environment Variables
- After deploying the application, upload the following environment variables to Render:
  - `DATABASE_URL`: The connection string for the Neon database.
  - Other variables as necessary for your application (e.g., API keys, secret keys, etc.)

### Redeployment
- To redeploy after changing environment variables or code, follow these steps:
  1. Navigate to your Render dashboard.
  2. Click on your service.
  3. Click the "Redeploy" button to apply the changes.

### Additional Notes
- Ensure you have configured any necessary CORS settings for your backend to allow communication with the frontend.
- Monitor your logs on Render for any errors that might occur after deployment.
