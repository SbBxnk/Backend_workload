const express = require('express')
const router = express.Router()
const { getAllBranch,getOneBranch,addBranch,updateBranch,deleteBranch} = require('../controllers/branchController')
const  auth  = require('../middleware/auth');

router.get('/branch',auth, getAllBranch) //read
router.get('/branch/:branch_id',auth,getOneBranch); // select one
router.post('/branch/add',auth,addBranch) //create
router.put('/branch/update/:branch_id',auth,updateBranch)  //update
router.delete('/branch/delete/:branch_id',auth,deleteBranch) // delete
module.exports = router;