const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getEvaluation,
  saveDraft,
  submitEvaluation,
  getAverageScores,
  getAssignedWorkloadGroup
} = require('../controllers/workloadEvaluationController');

router.get('/workload_evaluation/:formlist_id/:set_asses_info_id', auth, getEvaluation);
router.get('/workload_evaluation/formlist/:formlist_id/average', auth, getAverageScores);
router.get('/workload_evaluation/assigned_group/:as_u_id/:round_list_id', auth, getAssignedWorkloadGroup);
router.put('/workload_evaluation/:evaluation_id', auth, saveDraft);
router.post('/workload_evaluation/:evaluation_id/submit', auth, submitEvaluation);

module.exports = router;

