const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const CatchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');


const filterObj = (obj, ...alowedFields) => {
  const newObject = {};
  Object.keys(obj).forEach(el =>{
    if(alowedFields.includes(el)) newObject[el] = obj[el];
  })
  return newObject;
}

exports.getMe = (req, res, next)=>{
  req.params.id = req.user.id;
  console.log('req.params.id:', req.params.id);

  next();
}

exports.updateMe = catchAsync(async(req, res, next)=> {

  //1) Check if the client sent password data in POST request
  if(req.body.passwd || req.body.passwdConfirm){
    return next(new AppError('This route is not made for password modifications! Please fuck off!', 400));
  }

  //2) Filtered out unwanted field names form req.body that are not allowed to be changed
  const filteredBody = filterObj(req.body, 'name', 'email');
  
  //3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true});

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
});

exports.deleteMe = catchAsync(async (req, res, next)=> {
  await User.findByIdAndUpdate(req.user.id, {active: false});

  res.status(204).json({
    status: 'success',
    data: null
  });
});


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined. Please use /signup !'
  })
}


//Do not update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
