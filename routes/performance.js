const express = require('express');
const router = express.Router();
const {
  getAllCompetencies,
  getOneCompetency,
  getAllExpectedLevels,
  getExpectedLevelsByPosition,
  getPerformanceEvaluation,
  getPerformanceEvaluationByUserAndRound,
  addOrUpdatePerformanceEvaluation,
  addOrUpdatePerformanceEvaluationBulk,
  getPerformanceEvaluationForm,
  addExpectedLevel,
  getPerformanceSnapshot
} = require('../controllers/performanceController');
const  auth  = require('../middleware/auth');

// Routes สำหรับรายการสมรรถนะ
router.get('/performance/competencies', auth, getAllCompetencies);
router.get('/performance/competencies/:competency_id', auth, getOneCompetency);

// Routes สำหรับระดับสมรรถนะที่คาดหวัง
router.get('/performance/expected-levels', auth, getAllExpectedLevels);
router.get('/performance/expected-levels/position/:position_id', auth, getExpectedLevelsByPosition);

// Routes สำหรับการประเมินสมรรถนะ
router.get('/performance/evaluation/formlist/:formlist_id', auth, getPerformanceEvaluationForm);
router.get('/performance/evaluation/formlist/:formlist_id/data', auth, getPerformanceEvaluation);
router.get('/performance/evaluation/user/:u_id/round/:round_list_id', auth, getPerformanceEvaluationByUserAndRound);
router.post('/performance/evaluation', auth, addOrUpdatePerformanceEvaluation);
router.post('/performance/evaluation/bulk', auth, addOrUpdatePerformanceEvaluationBulk);

// Routes สำหรับจัดการระดับสมรรถนะที่คาดหวัง (สำหรับ admin)
router.post('/performance/expected-level', auth, addExpectedLevel);

// Routes สำหรับ snapshot performance evaluation
router.get('/performance/snapshot', auth, getPerformanceSnapshot);

module.exports = router;

