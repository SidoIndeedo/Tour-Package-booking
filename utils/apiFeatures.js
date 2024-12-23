class APIFeatures {
  constructor(query, queryString){
    this.query = query;
    this.queryString = queryString;
  }

  filter(){
    const queryObj = {...this.queryString};
    const excludeFields = ['page', 'sort', 'limit', 'fields']; //we will make another function for these filters
    excludeFields.forEach(el => delete queryObj[el]); //this will delete these fields from our queryObj
    console.log(queryObj);

    //1B) Advance filtering
    let queryStr = JSON.stringify(queryObj);
    console.log(JSON.parse(queryStr));
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    console.log(JSON.parse(queryStr));

    this.query.find(JSON.parse(queryStr));
    // let query =  Tour.find(JSON.parse(queryStr));

    return this; //this will return the entire object
  }

  sort(){
    if(this.queryString.sort){
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(sortBy);
      this.query = this.query.sort(sortBy); //for example the sort = price, then mongoose will automatically sort based on price
    } else{ //in case the user does not provide and params
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields(){
    if(this.queryString.fields){
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
      // console.log(query);
    } else{
      this.query = this.query.select('-__v') //this minus sign will exclude the __v variable from sending it to the client
    }

    return this;

  }

  pagination(){

    const page  = this.queryString.page * 1 || 1; //nice trick to convert string to a number. The " || " is use to define default value
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page -1 ) * limit; 

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;