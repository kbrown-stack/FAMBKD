// This is my application entry point.

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');




// To initiazile Express 

const app = express();
const PORT = process.env.PORT || 9000

// To connect to my Mongo DB 

connectDB();


// Implementing the middlewares







// To start application

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})