const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getEvaluationAssessment,
  saveDraft,
  submitEvaluationAssessment,
  getAverageAssessedLevels
} = require('../controllers/performanceEvaluationAssessmentController');

// ต้องใส่ route ที่เจาะจงกว่า (average) ก่อน route ที่มี parameter
router.get('/performance_evaluation_assessment/average/:formlist_id', auth, getAverageAssessedLevels);
router.get('/performance_evaluation_assessment/:formlist_id/:set_asses_info_id', auth, getEvaluationAssessment);
router.put('/performance_evaluation_assessment/:evaluation_assessment_id', auth, saveDraft);
router.post('/performance_evaluation_assessment/:evaluation_assessment_id/submit', auth, submitEvaluationAssessment);

module.exports = router;

