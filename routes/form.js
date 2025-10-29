const express = require("express")
const router = express.Router()
const {
  getTermForm,
  getAllFormList,
  addFormList,
  addFormListBulk,
  checkGroupID,
  selectWorkloadFormGroup,
  getAllFormInfo,
  getOneFormInfo,
  addFormInfo,
  getFilesRound,
  deleteFormInfo,
  getFormDetail,
  updateFormInfo,
  checkWorkloadFormStatus,
  getWorkloadItemsByGroup,
  updateWorkloadFormStatus,
  updateWorkloadFormStatusBulk,
  getAssessorEvaluationStatus,
  submitWorkloadForm,
  submitFormWithSnapshot,
  getFormInfoWithSnapshot,
  getFormlistId,
} = require("../controllers/formController")
const auth = require("../middleware/auth")
const upload = require("../middleware/file_upload")

// แสดงเกณฑ์ในการประเมินของแต่ละกลุ่มภาระงาน
router.get("/workload_form/terms", getTermForm)
// แสดงฟอร์มประเมินทั้งหมด
router.get("/workload_form/form", auth, getAllFormList)
// เช็กว่ารอบนั้นผู้ประเมินได้เลือกกลุ่มภาระงานไปหรือยัง หากเลือกไปแล้วจะไม่แสดงหน้าเลือกกลุ่มภาระงานอีกต่อไปในรอบนั้น
router.get("/workload_form/check_workload_group/:as_u_id/:round_list_id", auth, checkGroupID)
// เมื่อสร้าง ผู้ประเมินแล้วจะสร้างฟอร์มประเมินของผู้นั้นอัตโนมัติ
router.post("/workload_form/add", auth, addFormList)
// เพิ่มฟอร์มประเมินหลายรายการพร้อมกัน
router.post("/workload_form/add_bulk", auth, addFormListBulk)
// เมื่อเลือกกลุ่มภาระงานจะไปอัปเดต workload_group_id ใน tb_workload_formlist
router.patch("/workload_form/update/:as_u_id", auth, selectWorkloadFormGroup)
// router.delete('/branch/delete/:branch_id',auth,deleteBranch)

// แสดงรายละเอียดฟอร์มประเมินทั้งหมด
router.get("/workload_form/form_info", auth, getAllFormInfo)

// แสดงรายละเอียดภาระงานในแต่ละข้อ
router.get("/workload_form/form_info/:formlist_id/:subtask_id", auth, getOneFormInfo)
// ลบรายละเอียดภาระงานในแต่ละข้อ
router.delete("/workload_form/form_info/:form_id", auth, deleteFormInfo)

// // เพิ่มรายละเอียดภาระงานในแต่ละข้อ
router.post("/workload_form/form_info/add", auth, upload.array("files", 10), addFormInfo)

router.get("/workload_form/form_info_detail/:form_id", auth, getFormDetail)
// อัปเดตรายละเอียดภาระงาน
router.put("/workload_form/form_info/update", auth, upload.array("files", 10), updateFormInfo)

router.get("/workload_form/file_info/:formlist_id", auth, getFilesRound)

// เช็ค status ของ workload form
router.get("/workload_form/status/:as_u_id/:round_list_id", auth, checkWorkloadFormStatus)

// ดึงข้อมูลภาระงานตามโครงสร้าง task → subtask → form_info
router.get("/workload_form/items/:as_u_id/:round_list_id", auth, getWorkloadItemsByGroup)

// อัปเดต status ของ workload form
router.patch("/workload_form/status/:set_asses_list_id", auth, updateWorkloadFormStatus)

// อัปเดต status แบบ bulk ของ workload form
router.patch("/workload_form/status_bulk", auth, updateWorkloadFormStatusBulk)


// ดึงสถานะการประเมินของ assessor
router.get("/workload_form/evaluation_status/:set_asses_list_id", auth, getAssessorEvaluationStatus)

// ส่งฟอร์มการประเมินภาระงาน
router.patch("/workload_form/submit/:user_id/:round_list_id", auth, submitWorkloadForm)

// ========== SNAPSHOT ROUTES ==========
// ส่งฟอร์มและสร้าง snapshot
router.post("/workload_form/submit_with_snapshot", auth, submitFormWithSnapshot)

// ดึงข้อมูลฟอร์มจาก snapshot หรือตารางหลัก
router.get("/workload_form/form_info_with_snapshot/:formlist_id/:subtask_id", auth, getFormInfoWithSnapshot)

// ดึง formlist_id จาก as_u_id และ round_list_id
router.get("/workload_form/get_formlist_id/:as_u_id/:round_list_id", auth, getFormlistId)

module.exports = router
