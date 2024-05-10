// conn.js
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const dbUrl = 'mongodb+srv://dhanushdpandian:dhanush1234@cluster0.x7ptv06.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000 // 10 seconds timeout
})
  .then(() => {
    console.info('Database connection established');
  })
  .catch((err) => {
    console.error('Error connecting to database:', err);
  });