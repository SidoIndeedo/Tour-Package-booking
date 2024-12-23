const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('Unhandled Exception! 🔥 Shutting down!');
  console.log(err.name, err.message, err, err.stack);
  process.exit(1);
});


const app = require('./app')

dotenv.config({ path: './config.env' }); //this command will read our variables from the file and save them into node js environment variable

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {   
  // useUnifiedTopology: true 
}).then(con=>{
  // console.log(con.connections);  
  console.log('DB Conncected Successfuly');
})

console.log(process.env.NODE_ENV);



const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`listening on port: ${port}...`);
}) 
//

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection! 🔥 Shutting down!', err);
  server.close(() => {
    process.exit(1);
  });
});