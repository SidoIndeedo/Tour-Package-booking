const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');



//The functions that we will be writing here will return controllers
exports.deleteOne = Model => catchAsync(async (req, res, next) => { 
//We do not need to import any other stuff because of javascript's closure. Which means the inner function gets access to the outer varaibles too, in our case suppose we pass Tour model, so our function here will have the access of tour model without the need to import it.
  const doc  = await Model.findByIdAndDelete(req.params.id);
  if(!doc){
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: 'null'
  });

});


exports.updateOne = Model => catchAsync(async (req, res, next) => {

  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if(!doc){
    return next(new AppError('No document found with that ID', 404));
  }


  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });

});


exports.createOne = Model => catchAsync(async (req, res, next) => {

  const doc = await Model.create(req.body);
  res.status(200).json({
    status: 'success',
    request_time: req.requestTime,
    data:{
      data: doc
    }
  });

});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {

  let query =  Model.findById(req.params.id); //we did not user await here because this line returns a query object that can be futher modified. Using await here would execute the query object which would prevent further modifications, in this example 'populate'
  if(popOptions) query = query.populate(popOptions); //here we modified our query object. If we used await earlier, then this line would throw error because query is no longer a query object;
  const doc = await query;



  if(!doc){
    return next(new AppError('No document found with that id', 404))
  }

  res.status(200).json({
    status: 'success',
    data:{
      data: doc
    }
  });
});


exports.getAll = Model => catchAsync(async (req, res, next) => {
  // To allow for nested GET reviews on tour (this a small heck)
  let filter = {};
  if(req.params.tourId) filter = {tour: req.params.tourId}

  const features = new APIFeatures(Model.find(filter), req.query) //this Tour.find() is a query object 
  .filter()                                             //and req.query string that is cuming from express
  .sort()
  .limitFields()
  .pagination();

// const modelData = await features.query.explain(); //this line executes the promise
const modelData = await features.query; //this line executes the promise

//SEND RESPONSE
res.status(200).json({
  status: 'success',
  // response: tours_data.length,
  data: {
    tours: modelData
  }
  })
});

// exports.deleteTour = catchAsync(async (req, res, next) => { 
//   const tour  = await Tour.findByIdAndDelete(req.params.id);
//   if(!tour){
//     return next(new appError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: 'null'
//   });

// });