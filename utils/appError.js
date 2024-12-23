class appError extends Error{
  constructor(message, statusCode){
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor) //this means the current object this.constructor means the appError class itself
  }
}

module.exports = appError;    