const express = require('express');
const router = express.Router();
const { login, getMe, GetAllUser,GetAllAsUser,GetAllExUser, register,GetOneUser,updateUser,updateProfile,deleteUser,CountAllBranch,CountOneBranch,CountGroupBranch, forgotPassword, resetPassword, validateResetToken, exportUsersToExcel } = require('../controllers/userController');
const  auth  = require('../middleware/auth');

router.get('/me', auth, getMe);
router.get('/user', auth, GetAllUser);
// Export users to Excel (ต้องอยู่ก่อน /user/:u_id)
router.get('/user/export', auth, exportUsersToExcel);
// ดึงรายชื่อที่มีตำแหน่งบริหาร (สำหรับแต่งตั้งผู้ประเมิน)
router.get('/ex_user',auth, GetAllExUser);
// ดึงรายชื่อที่ไม่มีตำแหน่งบริหาร (สำหรับแต่งตั้งผู้ประเมิน)
router.get('/as_user/:round_list_id',auth, GetAllAsUser);

router.get('/user/:u_id',auth, GetOneUser);
router.patch('/user/update/:u_id',auth, updateUser);
router.delete('/user/delete/:u_id',auth, deleteUser);
router.patch('/profile/update', auth, updateProfile); // API สำหรับแก้ไขข้อมูลส่วนตัว
router.post('/user/add', register); 
router.post('/login', login); 
router.post('/forgot-password', forgotPassword);
router.post('/validate-reset-token', validateResetToken); // ตรวจสอบ token หมดอายุหน้า reset-password
router.post('/reset-password', resetPassword);
router.get('/count-branch',auth, CountAllBranch); // คนทุกสาขา
router.get('/count-branch/:branch_id',auth, CountOneBranch); //คนในสาขานั้นๆ
router.get('/count-all-branch/',auth, CountGroupBranch);

module.exports = router;
