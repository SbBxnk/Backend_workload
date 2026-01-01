const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getEvaluationAssessment,
  saveDraft,
  submitEvaluationAssessment
} = require('../controllers/performanceEvaluationAssessmentController');

router.get('/performance_evaluation_assessment/:formlist_id/:set_asses_info_id', auth, getEvaluationAssessment);
router.put('/performance_evaluation_assessment/:evaluation_assessment_id', auth, saveDraft);
router.post('/performance_evaluation_assessment/:evaluation_assessment_id/submit', auth, submitEvaluationAssessment);

module.exports = router;

