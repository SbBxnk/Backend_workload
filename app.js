const fs = require('fs')
const path = require('path')
const {readdirSync} = fs
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

// Serve uploaded files statically from backend/uploads for legacy files
app.use('/uploads', express.static('uploads'));

// Determine if running in Docker
const isDocker = __dirname === '/app'
console.log('App.js - Running in Docker:', isDocker, '__dirname:', __dirname)

// Serve images and files
let frontendImagesDir, frontendFilesDir, workloadUploadsDir;

if (isDocker) {
  // Use Docker mounted frontend directories
  frontendImagesDir = '/frontend/public/images';
  frontendFilesDir = '/frontend/public/files';
  workloadUploadsDir = '/frontend/public/files'; // Use files directory for workload uploads
} else {
  // Local development paths
  frontendImagesDir = path.resolve(__dirname, '../frontend/public/images');
  frontendFilesDir = path.resolve(__dirname, '../frontend/public/files');
  workloadUploadsDir = frontendImagesDir;
}

console.log('Frontend images dir:', frontendImagesDir)
console.log('Frontend files dir:', frontendFilesDir)
console.log('Workload uploads dir:', workloadUploadsDir)

// Serve workload files from the upload location
if (fs.existsSync(workloadUploadsDir)) {
  app.use('/files', express.static(workloadUploadsDir));
  console.log('Serving workload files from:', workloadUploadsDir, 'at /files');
}

if (fs.existsSync(frontendImagesDir)) {
  app.use('/images', express.static(frontendImagesDir));
  console.log('Serving images from:', frontendImagesDir, 'at /images');
}

if (fs.existsSync(frontendFilesDir)) {
  console.log('Frontend files directory exists:', frontendFilesDir);
}

const profileDir = process.env.PROFILE_UPLOAD_DIR;
if (profileDir && fs.existsSync(profileDir)) {
  app.use('/profile', express.static(profileDir));
  console.log('Serving profile images from:', profileDir, 'at /profile');
} else {
  console.log('PROFILE_UPLOAD_DIR not set or not found, /profile static route disabled');
}

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