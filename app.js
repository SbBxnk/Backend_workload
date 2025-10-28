const {readdirSync} = require('fs')
const morgan = require('morgan')
const express = require('express');
const cors = require('cors');
const bodyPaser = require('body-parser');
const app = express();
const database = require('./config')
const port = process.env.PORT || 3333;
require('dotenv').config();

database();

// Debug middleware for file uploads
app.use((req, res, next) => {
  if (req.path.includes('/workload_form/form_info/add')) {
    console.log('=== File Upload Debug ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'No body');
    console.log('Files:', req.files ? req.files.length : 'No files');
  }
  next();
});

app.use(morgan('dev'));
app.use(bodyPaser.json({ extended: true }));
app.use(bodyPaser.urlencoded({ extended: true }));
app.use(cors(
    {origin: 'http://localhost:3000'}
));

// Serve uploaded files statically
app.use('/files', express.static('uploads'));

readdirSync('./routes').map((r) => {
    try {
        const route = require('./routes/' + r);
        app.use('/api', route);
    } catch (error) {
        console.error(`Error loading route ${r}:`, error);
    }
});


app.listen(port, (error) => {
    if (error) {
        console.error(`Error starting server: ${error}`);
    } else {
        console.log(`Server is running on port ${port}`);
    }
});

module.exports = app;