const express = require('express')
const router = express.Router()
const { getAllMainTask,getOneMainTask,addMainTask,updateMainTask,deleteMainTask} = require('../controllers/maintaskController')
const  auth  = require('../middleware/auth');

router.get('/maintask',auth, getAllMainTask) //read
router.get('/maintask/:task_id',auth,getOneMainTask); // select one
router.post('/maintask/add',auth,addMainTask) //create
router.put('/maintask/update/:task_id',auth,updateMainTask)  //update
router.delete('/maintask/delete/:task_id',auth,deleteMainTask) // delete
module.exports = router;