const express = require('express')
const router = express.Router()
const { getAllPersonalType,getOnePersonalType,addPersonalType,updatePersonalType,deletePersonalType} = require('../controllers/persernalTypeController')
const  auth  = require('../middleware/auth');


router.get('/personalType',auth, getAllPersonalType) //read
router.get('/personalType/:type_p_id',auth,getOnePersonalType); // select one
router.post('/personalType/add',auth,addPersonalType) //create
router.put('/personalType/update/:type_p_id',auth,updatePersonalType)  //update
router.delete('/personalType/delete/:type_p_id',auth,deletePersonalType) // delete
module.exports = router;