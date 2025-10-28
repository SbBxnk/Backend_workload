const express = require('express')
const router = express.Router()
const { getAllUserLevel,getOneUserLevel,addUserLevel,updateUserLevel,deleteUserLevel} = require('../controllers/userLevelController')
const  auth  = require('../middleware/auth');

router.get('/level',auth,getAllUserLevel) //read
router.get('/level/:level_id',auth,getOneUserLevel); // select one
router.post('/level/add',auth,addUserLevel) //create
router.put('/level/update/:level_id',auth,updateUserLevel)  //update
router.delete('/level/delete/:level_id',auth,deleteUserLevel) // delete
module.exports = router;