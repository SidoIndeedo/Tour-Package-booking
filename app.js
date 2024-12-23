const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes')
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const errorController = require('./controllers/errorController');

const app = express();


// 1) GLOBAL MIDDLE WARES
// Security  HTTP Headers
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60* 60* 1000,
  message: 'Too many request from this IP, please try again in an hour!'
});
app.use('/api', limiter); 

// Body Parser, reading data from the body into req.body  
app.use(express.json({limit: '10kb'}));


// Data Sanitization against NO SQL query Injection
app.use(mongoSanitize())

// Data sanitzation against XSS 
app.use(xss());

// Prevent Parameter pollution
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// Serving staitc files
app.use(express.static(`${__dirname}/public`));

// Test middlewares
app.use((req, res, x) => {
  console.log('hello from the middle ware');
  x();
})

app.use((req, res, next) => {
  req.request_Time = new Date().toISOString();
  next();
})

app.use((req, res, next)=> {
  // console.log(req.headers);
  next();
});

// ROUTE HANDLERS
app.use('/api/v1/tours', tourRouter); 
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


app.all('*', (req,res,next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
//we wrote this here because if our url doesnt go to tourRouter or userRouter then it has to come here, if we put this code on the top in file, then no matter what, this current middleware will only be executed


//this function is called handlers or controllers in the context of MVC architechture
app.use(errorController);


//START THE SERVER
module.exports = app;