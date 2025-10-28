const express = require('express')
const router = express.Router()
const {getAllPrefix,getOnePrefix,addPrefix,updatePrefix,deletePrefix} = require('../controllers/prefixController')
const  auth  = require('../middleware/auth');

router.get('/prefix',auth,getAllPrefix) //read
router.get('/prefix/:prefix_id',auth,getOnePrefix); // select one
router.post('/prefix/add',auth,addPrefix) //create
router.put('/prefix/update/:prefix_id',auth,updatePrefix)  //update
router.delete('/prefix/delete/:prefix_id',auth,deletePrefix) // delete
module.exports = router;