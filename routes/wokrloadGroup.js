const express = require('express')
const router = express.Router()
const { getAllWorkloadGroup,getOneWorkloadGroup,addWorkloadGroup,updateWorkloadGroup,deleteWorkloadGroup} = require('../controllers/workloadGroupController')
const  auth  = require('../middleware/auth');

router.get('/workload_group',auth, getAllWorkloadGroup) //read
router.get('/workload_group/:workload_group_id',auth,getOneWorkloadGroup); // select one
router.post('/workload_group/add',auth,addWorkloadGroup) //create
router.put('/workload_group/update/:workload_group_id',auth,updateWorkloadGroup)  //update
router.delete('/workload_group/delete/:workload_group_id',auth,deleteWorkloadGroup) // delete
module.exports = router;