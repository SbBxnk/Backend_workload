const express = require('express')
const router = express.Router()
const { getAllExPosition,getOneExPosition,addExPosition,updateExPosition,deleteExPosition} = require('../controllers/expositionController')
const  auth  = require('../middleware/auth');

router.get('/ex_position',auth, getAllExPosition) //read
router.get('/ex_position/:ex_position_id',auth,getOneExPosition); // select one
router.post('/ex_position/add',auth,addExPosition) //create
router.put('/ex_position/update/:ex_position_id',auth,updateExPosition)  //update
router.delete('/ex_position/delete/:ex_position_id',auth,deleteExPosition) // delete
module.exports = router;