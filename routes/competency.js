const express = require('express')
const router = express.Router()
const { getAllCompetency, getOneCompetency, addCompetency, updateCompetency, deleteCompetency } = require('../controllers/competencyController')
const auth = require('../middleware/auth');

router.get('/competency', auth, getAllCompetency) //read
router.get('/competency/:competency_id', auth, getOneCompetency); // select one
router.post('/competency/add', auth, addCompetency) //create
router.put('/competency/update/:competency_id', auth, updateCompetency)  //update
router.delete('/competency/delete/:competency_id', auth, deleteCompetency) // delete
module.exports = router;

