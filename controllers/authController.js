const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/userModel');
const CatchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = id =>{
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res)=> {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 *60 * 1000),
    httpOnly : true
  };

  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true
  user.passwd = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    } 
  });
}

exports.signUp = CatchAsync(async(req, res, next) => {
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   passwd: req.body.passwd,
  //   passwdConfirm: req.body.passwdConfirm,
  //   role: req.body.role
  // });

  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);

  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });
});

exports.login =catchAsync(async(req, res, next) => {
  const {email, passwd} = req.body;

  //now to check if email and password actually exist in request body
  if(!email || !passwd){
    return  next(new AppError('Please provide email and password', 400));
  }

  // check is the user exists and password is correct
  const user = await User.findOne({email}).select('+passwd');
  if(!user || !(await user.correctPasswd(passwd, user.passwd /*now this will be either true or false*/))){ 
    return next(new AppError('Incorrect email or password', 401));
  }

  //if everything okay, then send JSON web token back to client
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // console.log(token);
  // res.status(200).json({
  //   status: 'success', 
  //   token
  // })
});

exports.protect = catchAsync(async(req, res, next)=> {
  //1) Getting the token and check if it is there
  let token;  
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
      token = req.headers.authorization.split(' ')[1];
    }

  // console.log(token);

  if(!token){
    return next(new AppError('You are not logged in! Please Log in to get access', 401))
  }

  //2) Verification of Token
  //so bascially seeing if the token payload has not been manipulated by some third party
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);


  //3) Check if the user still exists
  const freshUser = await User.findById(decoded.id);
  if(!freshUser){
    return next(new AppError('The user belonging to the token does no longer exists'));
  }

  // console.log("hello??");
  //4) Check if the user changed password after the JWT token was issued
  if(freshUser.changedPasswordAfter(decoded.iat)){
    return next(new AppError("User recently changed password. Please login again!"), 401);
  }
    // console.log("hello?");


    
    //This piece of code might be useful in future, also by writing the below lines, we dynamically create a user property of request object
    req.user = freshUser;  //this code is really important is we can update the user who logged in and then pass that user properties to
    //next middlewear which in our case is restrict
    console.log(req.user);
    //Grant access to protected route
  next();
}); 

exports.restrict = (...roles) => {
  return (req, res, next) => {
    //roles is an array of the passed arguments
    if(!roles.includes(req.user.role)){
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  }

}

  exports.forgotPassword = catchAsync(async(req, res , next)=>{
    //1) Get user based on POSTED email
    const user = await User.findOne({email: req.body.email});
    if(!user){
      return next(new AppError('There is no user with that email address.', 404));
    }

    //2) Generate the random reset token
    const resetToken = user.createResetPasswordToken();
    await user.save({validateBeforeSave: false});
    
    //3)Send it to the user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password then please ignore this email!`;

    try{
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10mins only)',
        message
      });
    
      res.status(200).json({
        status: 'success',
        message: 'Token sent to the email'
      })
    } catch(err){
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save({validateBeforeSave: false});
      console.log(err);

      return next(new AppError('There was an error sending the email. Try again later'), 500)

    }
  });

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user= await User.findOne({passwordResetToken: hashedToken, passwordResetExpire: {$gt: Date.now() }});
  

  //2) If token has not expired, and if there is user, then set the new password
  if(!user){
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.passwd = req.body.passwd;
  user.passwdConfirm = req.body.passwdConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  //3) update changedPasswordAt property for the user

  //4) Log the user in, send JWT
  createSendToken(user, 200, res);
  
  // const token = signToken(user._id);

  // res.status(200).json({
  //   satus: 'success',
  //   token
  // });

});

exports.updatePassword = catchAsync(async(req, res, next) =>{
  //1) Get user from collection
  const user = await User.findById(req.user.id).select('+passwd');

  //2)Check if the posted password is correct
  if(!(await user.correctPasswd(req.body.passwordCurrent, user.passwd))){
    return next(new AppError('The current password is incorrect!', 401));
  }

  //3) If so, then update the password
  user.passwd = req.body.passwd;
  user.passwdConfirm = req.body.passwdConfirm;
  await user.save();

  //4) Log the user in, send JWT
  createSendToken(user, 200, res);
})