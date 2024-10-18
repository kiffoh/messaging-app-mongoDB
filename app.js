var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const passport = require('passport');
require('./configuration/passportConfig');
const { Server } = require('socket.io');

// Import http and socket.io
var http = require('http');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const messageRouter = require('./routes/messages');
const groupRouter = require('./routes/groups');

var app = express();

// Create server and socket.io instance
var server = http.createServer(app);
// Initialize socket.io server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Set up basic socket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({origin: 'https://messaging-app-client-eight.vercel.app'}));
app.options('*', cors());

app.use(passport.initialize());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/messages', messageRouter(io));
app.use('/groups', groupRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


// Export app and io for use in routes/controllers
module.exports = { app, server, io };
