const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator'); 
// const User = require('./userModel')



const tourSchema = new mongoose.Schema({ //this tourSchema is a schema just like a blueprint of something
  name: {
    type: String,
    required: [true, 'A tour name is required!'],
    trim: true,
    unique: true,
    maxlength : [40, 'A tour name must have less or equal than 40 characters'],
    minlength : [10, 'A tour must have more than or equal to 10']
    // validate: [validator.isAlpha, 'A tour name must only contains character']
  },    

  slug : String,

  rating: {
    type: Number,
    default: 4,
    min: [1, 'Minimum 1.0 rating reuired'],
    max : [5, 'Maximum 5.0 rating is allowed']

  },
  price: {
    type: Number,
    required: [true, 'The price must be mentioned!']
  },
  duration: {
    type: Number,
    required : [true, 'Duration is required']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'Max group size is required']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    trim: true,
    enum : { //enum is only for strings
     values:  ['easy', 'medium', 'difficult'],
     message: 'Difficulty is either easy, medium or hard'
    }
  },
  ratingsAverage: {
    type: Number,
    min : [1, 'Minimum ratings is 1.0'],
    max : [5, 'Maximum ratings is 5.0'],
  },
  ratingsQauntity: {
    type: Number,
    default: 0
  },
  priceDiscount: {
    type: Number,
    validate : {
      validator : function(val) {
        return val<this.price;  //if the value is less than the price of the current document passed which we accessed throught this method.
        //this keyword will only point to the current document when we are creating a new document. It wont work on updation
      },

      message: 'Discount price {VALUE} should be below the regular price', // So here this {VALUE} is some keyword in which our argument `VAL` is passed
    }
    
    
  },

  summary:{
    type: String,
    trim: true,
    required: [true, 'It must have a summary']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have cover images']
  },
  images: [String],

  createdAt: {
    type: Date,
    default: Date.now(), //this func usually gives time in milliseconds but mongoose will conver it into today's date
    select: false //now it will automatically exclude this field from giving to client
  },
  startDates: [Date],
  
  secretTour:{
    type: Boolean,
    default : false
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      required: true,
    },
    address: String,
    description: String,
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: String,
      description: String,
      day: Number,
    },
  ],

  // guides: Array
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ],


}, {
  toJSON: { virtuals: true}, //this means each time the data is actually outputted as JSON, we want virtuals to be true to make it the part of output
  toObject : { virtuals: true } //So basically when data gets outputed as object, we want virtual variables to be in the output
});

// tourSchema.index({price: 1}); //Note that after saving this code and executing a search will store an index on the database. So even after we comment this line of code, we still have to manually remove the index form the database
tourSchema.index({price: 1, ratingsAverage: -1}) ;
tourSchema.index({slug : 1})

tourSchema.virtual('durationWeeks').get(function() { //using normal instead of arrow phunction because it does not have this keyword
  return this.duration / 7; //this is how we will calculate weeks to days
});

//Virtual populate
tourSchema.virtual('review', {
  ref: 'review',
  foreignField: 'tour',
  localField: '_id'
})


//DOCUMENT MIDDLEWARE 
// runs before the .save() and .create() but not on insert many. Only on save and create, this 'pre' middlewear function will be activated
//WE CAN HAVE MULTIPLE MIDDLEWARES (PRE AND POST)
tourSchema.pre('save', function(next){
  this.slug = slugify(this.name, {lower : true});
  next(); //calling the next middleware function
});

// tourSchema.pre('save', async function(next){
//   const guidesPromises = this.guides.map(async id => await User.findById(id))
//   this.guides = await Promise.all(guidesPromises);
//   next();
// }); //this code only works when creating new documents, not when updating it

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
// }) //we have the finished document here as 'doc'
  

//QUERY MIDDLE WARE
tourSchema.pre(/^find/, function(next){ //we are really going to process a query
  //so this /^find/ will make it execute this same thing for all the function like fineOne, findAll etc..
//this keyword here is a query object
this.find({secretTour : {$ne : true} });

// console.log('am ME running?');
this.start = Date.now();
next();
})

tourSchema.pre(/^find/, function(next){
  this.populate({
    path: 'guides',
    select: 'name role -_id'
  })
  // console.log('am i running?');
  next();
})
// tourSchema.pre(/^find/, function(next) {
//   this.populate({
//     path: 'guides',
//     select: 'name role -_id' // Correct key is 'select', not 'selected'
//   });
//   next();
// });


tourSchema.post('/^find/', function(docs, next){
  console.log(`Query took ${Date.now() - this.start} milliseconds`)
  // console.log(docs);
  next();
});


//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next){
  // console.log(this.pipeline()); //this will point at current aggregation object
  this.pipeline().unshift( { $match: {secretTour : {$ne: true}}} ); //here unshift adds in the beginning of an array, in the pipeline mehtod, we have the aggregated array that we wrote in tourController.JS (Tour.aggreagate()); Now we just added another filter to the array object
  next();

  //We can have as many as match stages as we want
})


const Tour = mongoose.model('Tour', tourSchema); //Now this tour is our model which was made out of a schema

module.exports = Tour;