const express = require('express');
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');


const tourRouter = express.Router();

// tourRouter.param('id', tourController.checkId)

// tourRouter.route('/:tourId/reviews')
//   .post(authController.protect, authController.restrict('user'), reviewController.createReview)

tourRouter.use('/:tourId/reviews', reviewRouter)

tourRouter
  .route('/top-t-cheap')
  .get(tourController.aliasTopTours ,tourController.getAllTours)

tourRouter
  .route('/tour-stats')
  .get(tourController.getTourStats)

tourRouter
  .route('/monthly-plan/:year')
  .get(authController.protect, authController.restrict('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan)



tourRouter
  .route('/')
  .get(tourController.getAllTours) 
  .post(authController.protect, authController.restrict('admin', 'lead-guide'), tourController.createTour)

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.restrict('admin', 'lead-guide'), tourController.updateTour)
  .delete(authController.protect, authController.restrict('admin', 'lead-guide'),  tourController.deleteTour)



module.exports = tourRouter;