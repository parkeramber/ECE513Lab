var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// This is to enable cross-origin access
app.use(function (req, res, next) {
   // Website you wish to allow to connect
   res.setHeader('Access-Control-Allow-Origin', '*');
   // Request methods you wish to allow
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
   // Request headers you wish to allow
   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
   // Set to true if you need the website to include cookies in the requests sent
   // to the API (e.g. in case you use sessions)
   res.setHeader('Access-Control-Allow-Credentials', true);
   // Pass to next layer of middleware
   next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ========== MONGODB CONNECTION ==========
mongoose.connect('mongodb://localhost:27017/airquality', {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
   console.log('Connected to MongoDB');
});

// Define Schema
const Recording = db.model("Recording", {
   zip: {type: Number},
   airQuality: {type: Number}
});
// ========== END MONGODB CONNECTION ==========

// ========== LAB ENDPOINTS (MUST BE BEFORE app.use ROUTES) ==========
// GET endpoint - /lab/status
app.get('/lab/status', async (req, res) => {
   const zip = req.query.zip;
   
   // Check if zip is provided and valid
   if (!zip || isNaN(zip)) {
      return res.status(400).json({"error": "a zip code is required."});
   }
   
   try {
      // Find all recordings for this zip code
      const recordings = await Recording.find({zip: Number(zip)});
      
      // Check if any data exists
      if (recordings.length === 0) {
         return res.status(400).json({"error": "Zip does not exist in the database."});
      }
      
      // Calculate average
      let sum = 0;
      for (let i = 0; i < recordings.length; i++) {
         sum += recordings[i].airQuality;
      }
      const average = (sum / recordings.length).toFixed(2);
      
      // Send back just the average number
      res.status(200).json(parseFloat(average));
   } catch (error) {
      res.status(500).json({"error": "Server error"});
   }
});

// POST endpoint - /lab/register
app.post('/lab/register', async (req, res) => {
   const zip = req.body.zip;
   const airQuality = req.body.airQuality;
   
   // Check if both parameters are present
   if (!zip || !airQuality) {
      return res.status(400).json({"error": "zip and airQuality are required."});
   }
   
   try {
      // Create new recording
      const newRecording = new Recording({
         zip: Number(zip),
         airQuality: Number(airQuality)
      });
      
      await newRecording.save();
      res.status(201).json({"response": "Data recorded."});
   } catch (error) {
      res.status(500).json({"error": "Server error"});
   }
});
// ========== END LAB ENDPOINTS ==========

// These MUST come AFTER the lab endpoints
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
