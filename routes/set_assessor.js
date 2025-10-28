const express = require('express')
const router = express.Router()
const { getAllRoundlist,getOneRoundlist,checkround,addRoundlist,deleteRoundlist,updateRoundlist,getAllsetAssesorList,getOnesetAssesorList,addSetAssessorList,addSetAssessorListMultiple,deleteSetAssessorList,getOnesetAssesorInfo,getAssesseeBySetAssesListId,addSetAssessorInfo,addSetAssessorInfoMultiple,deleteSetAssessorInfo,getAssessorOfCurrentYear,checkIsAssessor,getAssignedExaminees,getAssessorEvaluations,getAssessorRounds,getAssesseesByRound,updateAssessorStatus,checkUserAccessToRound} = require('../controllers/set_assessorController')
const  auth  = require('../middleware/auth');

// รอบการประเมิน
router.get('/set_assessor_round',auth, getAllRoundlist,) //read - Admin API (แสดงรอบทั้งหมด)
router.get('/check_round',auth, checkround,) //read - User API (แสดงเฉพาะรอบที่ตรงกับวันที่ปัจจุบัน)
router.get('/set_assessor_round/:round_list_id',auth, getOneRoundlist,) //read
router.post('/set_assessor_round/add',auth, addRoundlist) //create
router.delete('/set_assessor_round/delete/:round_list_id',auth,deleteRoundlist) // delete
router.put('/set_assessor_round/update/:round_list_id',auth,updateRoundlist)  //update

// รายการแต่งตั้งผู้ประเมินภาระงาน
router.get('/set_assessor_list',auth, getAllsetAssesorList,) //read by ID
router.get('/set_assessor_list/:round_list_id',auth, getOnesetAssesorList,) //read
router.post('/set_assessor_list/add',auth, addSetAssessorList,) //create
router.post('/set_assessor_list/add_multiple',auth, addSetAssessorListMultiple,) //create multiple
router.delete('/set_assessor_list/delete/:set_asses_list_id',auth, deleteSetAssessorList,) //delete


// รายละเอียดผู้ประเมินภาระงาน
router.get('/set_assessor_info/:set_asses_list_id',auth, getOnesetAssesorInfo,) //read by ID
router.get('/assessee/:set_asses_list_id',auth, getAssesseeBySetAssesListId,) //read assessee by set_asses_list_id
router.post('/set_assessor_info/add',auth, addSetAssessorInfo,) //create
router.post('/set_assessor_info/add_multiple',auth, addSetAssessorInfoMultiple,) //create multiple
router.delete('/set_assessor_info/delete/:set_asses_info_id',auth, deleteSetAssessorInfo,) //delete


// รายละเอียดผู้ประเมินภาระงานในแต่ละปี
router.get('/set_assessor/:round_list_id',auth, getAssessorOfCurrentYear) //read

// เช็กว่าเป็นผู้ประเมินหรือไม่
router.get("/check_assessor/:u_id", auth, checkIsAssessor) 

// ดึงข้อมูลผู้ที่ต้องได้รับการประเมินโดยผู้ประเมินที่ระบุ
router.get("/set_assessor/assigned_examinees/:round_list_id/:ex_u_id", auth, getAssignedExaminees)

// ดึงรายการการประเมินสำหรับผู้ตรวจประเมิน
router.get("/assessor_evaluations/:ex_u_id", auth, getAssessorEvaluations)

// ดึงรอบการประเมินสำหรับผู้ตรวจประเมิน
router.get("/assessor_rounds/:ex_u_id", auth, getAssessorRounds)

// ดึงรายการผู้ใช้ที่ต้องตรวจในรอบการประเมินเฉพาะ
router.get("/assessees_by_round/:ex_u_id/round/:round_list_id", auth, getAssesseesByRound)

// อัปเดต status ใน tb_workload_formlist
router.patch("/assessor_status/:round_list_id/update/:as_u_id", updateAssessorStatus)

// ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึงรอบนี้หรือไม่
router.get("/check_user_access/:as_u_id/:round_list_id", auth, checkUserAccessToRound)

// router.get("/set_assessor/assigned_by_assessor/:round_list_id/:as_u_id", auth, getAssignedByAssessor)

module.exports = router;