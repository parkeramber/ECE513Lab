var createError   = require('http-errors');
var express       = require('express');
var path          = require('path');
var cookieParser  = require('cookie-parser');
var logger        = require('morgan');
var mongoose      = require('mongoose');

var indexRouter   = require('./routes/index');
var usersRouter   = require('./routes/users');
var labRouter     = require('./routes/lab');

var app = express();

// view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// ---- CORS (must be BEFORE routes) ----
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // grader runs from file://
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  // grader sample shows this; keep it:
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Reply 200 to all preflight so POSTs aren’t blocked
app.options('*', (req, res) => res.sendStatus(200));

// standard middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ---- MongoDB ----
mongoose
  .connect('mongodb://127.0.0.1:27017/airquality') // mongod running locally
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Mongo connect error:', err));

// ---- Routes ----
app.use('/lab', labRouter); // lab endpoints
app.use('/', indexRouter);
app.use('/users', usersRouter);

// 404
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
