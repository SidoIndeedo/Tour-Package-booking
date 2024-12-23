const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const reviewRouter = express.Router({ mergeParams: true}); //merge Params is used to pass params from one router to another

reviewRouter.use(authController.protect)

reviewRouter
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.restrict('user'), reviewController.setTourUserIds, reviewController.createReview)
  
reviewRouter.
  route('/:id')
  .get(authController.protect, reviewController.getReview)
  .delete(authController.restrict('user', 'admin'), reviewController.deleteReview)
  .patch(authController.restrict('user', 'admin'), reviewController.updateReview)

module.exports = reviewRouter;