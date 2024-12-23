const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const msg = `Invalid ${err.path}: ${err.value}`;
  return new AppError(msg, 400);
};

const handleJWTError = () =>  new AppError('Invalid token please login again', 401); //now in arror function, we do not need to write return
// as it does it automatically

const handleJWTExpiredError = () => new AppError('Your token has expired. Please LogIn again', 401);


const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const msg = `Duplicate field value: ${value}, Please use another value`;

  return new AppError(msg, 400);
}

const handleValidationErrorDB = err => {

  const error = Object.values(err.errors).map(el => el.message)
  /*And so we're gonna basically loop over this errors object.Okay?And in JavaScript, we use Object.valuesin order to basically loop over an object.So the elements of an object.All right?So let's create a variable here called errors,which again will be an arrayof all the error messages for now,and now Object.values.And so we want the values of err.errors, all right?And now loop over them using a map.And then in each iteration,we are simply gonna return the error message, okay? */

  const msg = `Invalid input data. ${error.join('. ')}`;
  return new AppError(msg, 400);
}

const sendErrorProd = (err, res) => {
  // Operational error: send detailed message
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or unknown error: don't leak error details
    console.error('ERROR 🔥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    console.log(error.name);
    if (err.name === 'CastError') error = handleCastErrorDB(err); 
    if (err.code === 11000) error = handleDuplicateFieldsDB(err); 
    if(err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if(err.name === 'JsonWebTokenError') error = handleJWTError();
    if(err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, res); // Pass the modified error object to `sendErrorProd`
  }
};

