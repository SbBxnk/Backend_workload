const express = require('express');
const router = express.Router();
const { getSidebar } = require('../controllers/sidebarController');
const auth = require('../middleware/auth');

router.get('/sidebar', auth, getSidebar);

module.exports = router;
