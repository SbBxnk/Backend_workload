const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getEvaluation,
  saveDraft,
  submitEvaluation
} = require('../controllers/workloadEvaluationController');

router.get('/workload_evaluation/:formlist_id/:set_asses_info_id', auth, getEvaluation);
router.put('/workload_evaluation/:evaluation_id', auth, saveDraft);
router.post('/workload_evaluation/:evaluation_id/submit', auth, submitEvaluation);

module.exports = router;

