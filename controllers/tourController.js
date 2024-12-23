/* eslint-disable prefer-object-spread */
/* eslint-disable no-else-return */
/* eslint-disable camelcase */


const { stat } = require('fs/promises');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next)=>{
  req.query.limit= '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();

}



// const tours_data = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// exports.checkId = (req, res, next, val) => {
//   console.log(`The ID is ${val}`);
// 
  // if (val < 0 || val > tours_data.length) {
  //   return res.status(404).json({
  //     status: 'error',
  //     message: 'invalid id'
  //   })
  // }
  // next();
// }

// exports.checkBody = ((req, res, next) => {
//   if (!req.body.name) {
//     return res.status(404).json({
//       status: 'error name',
//       message: 'no name found'
//     })
//   }
//   else if (!req.body.price) {
//     return res.status(404).json({
//       status: 'error price',
//       message: 'no price found'
//     })
//   }
// })


 
    //BUILDING QUERY
    // 1A) Filtering
    // const tours_data = await Tour.find() //this will just get all tours
    // const queryObj = {...req.query};
    // const excludeFields = ['page', 'sort', 'limit', 'fields']; //we will make another function for these filters
    // excludeFields.forEach(el => delete queryObj[el]); //this will delete these fields from our queryObj
    // console.log(queryObj);

    
    
    // 1B) Advance filtering
    
    //converting object to a string
    // let queryStr = JSON.stringify(queryObj);
    // console.log(JSON.parse(queryStr));
    
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); //using \b to only match the exact words because we dont want to replace the word okgte, only gte without any other string around it.
    //We use the g flag because the words can happen multiple times. Without g it will only replace the first one
    // console.log(JSON.parse(queryStr));
    
    // let query =  Tour.find(JSON.parse(queryStr)); //this will take query attributes and search them but we want to add some additional filters later so we do it with different method. ALSO THIS TOUR.FIND(QUERYOBJ) will return a query to which we can do some additional querires using mongoose methods like where, equals, gte etc. Also this returns a promise
    
    // 2) Liimting fields
    // if(req.query.fields){
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    //   // console.log(query);
    // } else{
    //   query = query.select('-__v') //this minus sign will exclude the __v variable from sending it to the client
    // }

    // 3) SORT
    // if(req.query.sort){
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   console.log(sortBy);
    //   query = query.sort(sortBy); //for example the sort = price, then mongoose will automatically sort based on price
    // } else{ //in case the user does not provide and params
    //   query = query.sort('-createdAt');
    // }
    

    // 4) Pagination
    // const page  = req.query.page * 1 || 1; //nice trick to convert string to a number. The " || " is use to define default value
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page -1 ) * limit; 

    // query = query.skip(skip).limit(limit);

    // if(req.query.page){
    //   const numOfTours = await Tour.countDocuments();
    //   if(skip>=numOfTours){
    //     throw new Error("This page does not exist");
    //   }
    // }
    
    //EXECUTE QUERY

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {path: 'review'});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);     

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   // const id = req.params.id;
//   // const findTour = tours_data.find(el => el.id === id);
//   // console.log(!findTour);
//   // if (!findTour) {
//   //   return res.status(404).json({
//   //     status: 'error',
//   //     message: 'invalid id'
//   //   })
//   // }
 
//   const tour  = await Tour.findByIdAndDelete(req.params.id);
//   if(!tour){
//     return next(new appError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: 'null'
//   });

// });


exports.getTourStats = catchAsync(async (req, res, next) => {

    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: '4.5' } }
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 }, //for each of the document that will go through pipeline, it will add 1 to numTours
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: { avgPrice: 1 } //1 here means ascending
      }
      // {
      //   $match: { _id: { $ne: 'EASY' } } //excluding the ones which has EASY id
      // }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
 
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
 
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      {
        $unwind : '$startDates'
      },

      {
        $match : {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte : new Date(`${year}-12-31`)
          }
        }
      },

      {
        $group : {
          _id : {$month: '$startDates'},
          numTourStats: {$sum : 1},
          tours: {$push: '$name' }
        }
      },
      
      {
        $addFields: {month : '$_id'} //this will just send variable
      },
      
      {
        $project : {
          _id: 0 //this will do not send the _id variable
        }
      },

      {
        $sort : { numTourStats : -1 } //here -1 means sort in descending
      },

      {
        $limit: 12 //it basically limits the number of output
      }

    ]);




    res.status(200).json({
      status: 'success',
      data : {
        plan
      }
    })

 
});