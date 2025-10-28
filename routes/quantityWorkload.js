const express = require('express')
const router = express.Router()
const { getAllQuantityWorkload, getOneQuantityWorkload, addQuantityWorkload, updateQuantityWorkload, deleteQuantityWorkload } = require('../controllers/quantityWorkloadController')
const auth = require('../middleware/auth');

router.get('/quantity-workload', auth, getAllQuantityWorkload) //read
router.get('/quantity-workload/:quantity_workload_id', auth, getOneQuantityWorkload); // select one
router.post('/quantity-workload/add', auth, addQuantityWorkload) //create
router.put('/quantity-workload/update/:quantity_workload_id', auth, updateQuantityWorkload)  //update
router.delete('/quantity-workload/delete/:quantity_workload_id', auth, deleteQuantityWorkload) // delete
module.exports = router;
