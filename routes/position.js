const express = require('express')
const router = express.Router()
const { getAllPosition,getOnePosition,addPosition,updatePosition,deletePosition} = require('../controllers/positionController')
const  auth  = require('../middleware/auth');

router.get('/position',auth, getAllPosition) //read
router.get('/position/:position_id',auth,getOnePosition); // select one
router.post('/position/add',auth,addPosition) //create
router.put('/position/update/:position_id',auth,updatePosition)  //update
router.delete('/position/delete/:position_id',auth,deletePosition) // delete
module.exports = router;