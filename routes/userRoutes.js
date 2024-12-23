const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');


const userRouter = express.Router();


userRouter.post('/signup', authController.signUp);
userRouter.post('/login', authController.login);
userRouter.patch('/updateMyPassword/',authController.protect, authController.updatePassword);


//The line below means -> userRouter is kind of a mini app just like our app variable in app.js, so we can also implement a middleware. Now we know that the middleware runs in sequence, so after this 18th line, if you wanna access let's say updateMe, then the code will go through line number 18th and then later on
userRouter.use(authController.protect);

userRouter.get('/me', userController.getMe, userController.getUser)
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);
userRouter.patch('/updateMe', userController.updateMe);
userRouter.delete('/deleteMe', userController.deleteMe);


//Now you know what the line below does 😉
userRouter.use(authController.restrict('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser)



userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)



module.exports = userRouter;