const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs')
const Tour = require('../../models/tourModel')
const User = require('../../models/userModel')
const Review = require('../../models/reviewModel')

dotenv.config({ path: '../../config.env' }); //this command will read our variables from the file and save them into node js environment variable
console.log('process.env.DATABASE');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {   
  // useUnifiedTopology: true 
}).then(con=>{
  // console.log(con.connections);  
  console.log('DB Conncected Successfuly');
})

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));
const user = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('./reviews.json', 'utf-8'));

//IMPORT DATA INTO THE DATABASE
const importData = async () =>{
  try{
    await Tour.create(tours);
    await User.create(user, { validateBeforeSave : false}); //this will turn off all the validators of the model before saving data
    await Review.create(reviews);
    console.log("Data imported successfully 🍆🍆🥵🥵")
    process.exit();
  } catch(err){
    console.log(err);
  }
}

//Delete data from the collection
const deleteData = async () =>{
  try{
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('All data deleted successfully');
    process.exit();
  } catch(err){
    console.log(err);
  }
}

if(process.argv[2]==='--import'){
  importData();
} else if (process.argv[2]=== '--delete'){
  deleteData();
}

console.log(process.argv);