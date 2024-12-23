const mongoose = require('mongoose');

//review text
//ratings
//createdAt time
// ref to the tour it belongs to
// ref to the user who wrote this review

const reviewSchema = new mongoose.Schema({
  review:{
    type: String,
    required: [true, 'Review cannot be empty'],
    // trim: true
  },

  rating:{
    type: Number,
    required: [true, 'Please give the ratings!'],
    min: 1,
    max: 5
  },
  
  createdAt:{
    type: Date,
    default: Date.now()
  },

  tour:{
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour']
  },

  user:{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user']
  },

},
{
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});


reviewSchema.pre(/^find/, function(next){ 
  this.populate({
    path: 'user',
    select: 'name photo -_id'
  }).populate({
    path: 'tour',
    select: 'name'
  });
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // });
 
  next();
})

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: {tour : tourId}
    },
    {
      $group : {
        _id: '$tour',
        nRating: { $sum: 1},
        avgRating: {$avg : '$rating'}
      }
    }
  ]);
  console.log(stats);
}

const review = mongoose.model('review', reviewSchema);

module.exports = review;