const express = require('express')
const router = express.Router()
const {getCourseByBranch, getAllCourse, getAllCoursesSimple, getOneCourse,addCourse,updateCourse,deleteCourse} = require('../controllers/courseController')
const  auth  = require('../middleware/auth');

router.get('/course/branch/:branch_id',auth, getCourseByBranch) //by branch
router.get('/course',auth, getAllCourse) //read with pagination
router.get('/course/simple',auth, getAllCoursesSimple) //simple list for dropdowns
router.get('/course/:course_id',auth,getOneCourse); // select one
router.post('/course/add',auth,addCourse) //create
router.put('/course/update/:course_id',auth,updateCourse)  //update
router.delete('/course/delete/:course_id',auth,deleteCourse) // delete
module.exports = router;