const express = require('express')
const router = express.Router()
const {getSubtaskByTask, getAllSubtask,getOneSubtask,addSubtask,updateSubtask,deleteSubtask} = require('../controllers/subtaskController')
const  auth  = require('../middleware/auth');

router.get('/subtask/task/:task_id',auth, getSubtaskByTask) //by taks
router.get('/subtask',auth, getAllSubtask) //read
router.get('/subtask/:subtask_id',auth,getOneSubtask); // select one
router.post('/subtask/add',auth,addSubtask) //create
router.put('/subtask/update/:subtask_id',auth,updateSubtask)  //update
router.delete('/subtask/delete/:subtask_id',auth,deleteSubtask) // delete
module.exports = router;