const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator'); 
const bcrypt = require('bcrypt'); 
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');

const userSchema = new mongoose.Schema({
  name : {
    type: String,
    required: [true, 'User name is required'],
    unique: false
  },

  email :{
    type: String,
    required : [true, 'Your email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']  
  },

  photo :{
    type: String,
    required : false
  },

  role : {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },

  passwd: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false //this exlude from the data sent data back to client
  },

  passwdConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //This only works on save
      validator: function(el) {
        return el === this.passwd
      },

      message: 'Passwords are not same!'
    }
  },

  passwordChangedAt: {
    type: Date,
    required: false
  },
  
  passwordResetToken: { 
    type: String
  },

  passwordResetExpire: {
    type: Date
  },

  active:{
    type: Boolean,
    default: true,
    select: false
  }

});


userSchema.pre('save', async function(next){
  //Only runs if the password was actually modified
  if(!this.isModified('passwd')) return next();

  //hash password
  this.passwd = await bcrypt.hash(this.passwd, 12);
  //delete passwdConfirm field
  this.passwdConfirm = undefined;    

  // if(!this.passwordChangedAt){
  //   this.passwordChangedAt = Date.now() - 1000;
  // }
  next();
});

//this one is for the active property in schema
userSchema.pre(/^find/, function(next){
  //this points to the current query
  this.find({active: {$ne: false}});
  next();
})

userSchema.pre('save', function(next) {
  if(!this.isModified('passwd') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPasswd = async function(candidatePasswd, userPasswd){
  return await bcrypt.compare(candidatePasswd, userPasswd); //candidatePasword is comming from the client which is not hased and userPassword is the password stored in document hased
}
//this function is instance method which means it is available on all the user documents


userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){
  if(this.passwordChangedAt){
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000, 10);
    console.log(changedTimeStamp, JWTTimeStamp);
    return JWTTimeStamp < changedTimeStamp;
  }
  
  

  //False means not changed
  return false;
};

userSchema.methods.createResetPasswordToken = function() {
 const resetToken = crypto.randomBytes(32).toString('hex');

 this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
 console.log({resetToken}, this.passwordResetToken);
 
 this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

 return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;