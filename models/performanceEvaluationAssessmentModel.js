const db = require('../config')();

const PerformanceEvaluationAssessment = {
  /**
   * Load evaluation assessment with detail rows for a given formlist and assessor assignment.
   */
  getEvaluationAssessmentBySetAssesInfo: (formlist_id, set_asses_info_id, callback) => {
    const sql = `
      SELECT 
        eval.evaluation_assessment_id,
        eval.formlist_id,
        eval.set_asses_info_id,
        eval.assessor_user_id,
        eval.assessee_user_id,
        eval.status,
        eval.comment,
        eval.submitted_at,
        eval.created_at,
        eval.updated_at,
        sal.round_list_id,
        sal.set_asses_list_id,
        item.assessment_item_id,
        item.competency_id,
        item.assessed_level,
        item.comment AS item_comment,
        item.created_at AS item_created_at,
        item.updated_at AS item_updated_at
      FROM tb_performance_evaluation_assessment eval
      INNER JOIN tb_set_assessorinfo sai
        ON sai.set_asses_info_id = eval.set_asses_info_id
      INNER JOIN tb_set_assessorlist sal
        ON sal.set_asses_list_id = sai.set_asses_list_id
      LEFT JOIN tb_performance_evaluation_assessment_item item 
        ON item.evaluation_assessment_id = eval.evaluation_assessment_id
      WHERE eval.formlist_id = ? AND eval.set_asses_info_id = ?;
    `;
    db.query(sql, [formlist_id, set_asses_info_id], callback);
  },

  /**
   * Fetch evaluation assessment header by ID.
   */
  getEvaluationAssessmentById: (evaluation_assessment_id, callback) => {
    const sql = `
      SELECT 
        eval.evaluation_assessment_id,
        eval.formlist_id,
        eval.set_asses_info_id,
        eval.assessor_user_id,
        eval.assessee_user_id,
        eval.status,
        eval.comment,
        eval.submitted_at,
        eval.created_at,
        eval.updated_at,
        sal.round_list_id,
        sal.set_asses_list_id
      FROM tb_performance_evaluation_assessment eval
      INNER JOIN tb_set_assessorinfo sai
        ON sai.set_asses_info_id = eval.set_asses_info_id
      INNER JOIN tb_set_assessorlist sal
        ON sal.set_asses_list_id = sai.set_asses_list_id
      WHERE evaluation_assessment_id = ?;
    `;
    db.query(sql, [evaluation_assessment_id], callback);
  },

  /**
   * Ensure draft evaluation assessment rows exist for every assessor assignment of the given formlist.
   */
  createDraftEvaluationAssessmentsForFormlist: (formlist_id, callback) => {
    const assignmentSql = `
      SELECT 
        sai.set_asses_info_id,
        sai.set_asses_list_id,
        sai.ex_u_id AS assessor_user_id,
        sal.as_u_id AS assessee_user_id
      FROM tb_workload_formlist wfl
      INNER JOIN tb_set_assessorlist sal 
        ON sal.set_asses_list_id = wfl.set_asses_list_id
      INNER JOIN tb_set_assessorinfo sai
        ON sai.set_asses_list_id = sal.set_asses_list_id
      WHERE wfl.formlist_id = ?;
    `;

    db.query(assignmentSql, [formlist_id], (error, assignments) => {
      if (error) {
        return callback(error);
      }

      if (!assignments || assignments.length === 0) {
        return callback(null, { affectedRows: 0 });
      }

      const values = assignments.map((row) => [
        formlist_id,
        row.set_asses_info_id,
        row.assessor_user_id,
        row.assessee_user_id,
        0
      ]);

      const insertSql = `
        INSERT IGNORE INTO tb_performance_evaluation_assessment
          (formlist_id, set_asses_info_id, assessor_user_id, assessee_user_id, status)
        VALUES ?
      `;

      db.query(insertSql, [values], callback);
    });
  },

  /**
   * Update draft payload and comment for an evaluation assessment.
   */
  updateEvaluationAssessmentDraft: (evaluation_assessment_id, { comment }, callback) => {
    const sql = `
      UPDATE tb_performance_evaluation_assessment
      SET 
        comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE evaluation_assessment_id = ? AND status = 0;
    `;
    db.query(sql, [comment || null, evaluation_assessment_id], callback);
  },

  /**
   * Replace evaluation assessment item rows (upsert per competency).
   */
  replaceEvaluationAssessmentItems: (evaluation_assessment_id, items, callback) => {
    if (!Array.isArray(items) || items.length === 0) {
      return callback(null, { affectedRows: 0 });
    }

    const values = items.map((item) => [
      evaluation_assessment_id,
      item.competency_id,
      item.assessed_level != null ? item.assessed_level : null,
      item.comment || null
    ]);

    const sql = `
      INSERT INTO tb_performance_evaluation_assessment_item
        (evaluation_assessment_id, competency_id, assessed_level, comment)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        assessed_level = VALUES(assessed_level),
        comment = VALUES(comment),
        updated_at = CURRENT_TIMESTAMP
    `;

    db.query(sql, [values], callback);
  },

  /**
   * Remove evaluation assessment items not in the provided competency_ids (cleanup).
   */
  deleteMissingEvaluationAssessmentItems: (evaluation_assessment_id, competencyIds, callback) => {
    if (!evaluation_assessment_id) {
      return callback(new Error('evaluation_assessment_id is required'));
    }

    if (!Array.isArray(competencyIds) || competencyIds.length === 0) {
      const sql = `
        DELETE FROM tb_performance_evaluation_assessment_item
        WHERE evaluation_assessment_id = ?;
      `;
      return db.query(sql, [evaluation_assessment_id], callback);
    }

    const sql = `
      DELETE FROM tb_performance_evaluation_assessment_item
      WHERE evaluation_assessment_id = ? AND competency_id NOT IN (?);
    `;
    db.query(sql, [evaluation_assessment_id, competencyIds], callback);
  },

  /**
   * Submit evaluation assessment (status -> 1).
   */
  submitEvaluationAssessment: (evaluation_assessment_id, callback) => {
    const sql = `
      UPDATE tb_performance_evaluation_assessment
      SET status = 1,
          submitted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE evaluation_assessment_id = ?;
    `;
    db.query(sql, [evaluation_assessment_id], callback);
  },

  /**
   * Count submitted evaluation assessments (status = 1) for a formlist.
   */
  countSubmittedEvaluationAssessments: (formlist_id, callback) => {
    const sql = `
      SELECT COUNT(*) AS submitted_count
      FROM tb_performance_evaluation_assessment
      WHERE formlist_id = ? AND status = 1;
    `;
    db.query(sql, [formlist_id], callback);
  },

  /**
   * Count assessor assignments for a formlist (same logic as workload evaluation).
   */
  countAssignmentsByFormlist: (formlist_id, callback) => {
    const sql = `
      SELECT COUNT(*) AS total_assignments
      FROM tb_workload_formlist wfl
      INNER JOIN tb_set_assessorlist sal 
        ON sal.set_asses_list_id = wfl.set_asses_list_id
      INNER JOIN tb_set_assessorinfo sai
        ON sai.set_asses_list_id = sal.set_asses_list_id
      WHERE wfl.formlist_id = ?;
    `;
    db.query(sql, [formlist_id], callback);
  },

  /**
   * Reset evaluation assessment to draft (optional utility).
   */
  resetEvaluationAssessmentToDraft: (evaluation_assessment_id, callback) => {
    const sql = `
      UPDATE tb_performance_evaluation_assessment
      SET status = 0,
          submitted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE evaluation_assessment_id = ?;
    `;
    db.query(sql, [evaluation_assessment_id], callback);
  },

  /**
   * ดึง assessed_level เฉลี่ยจากผู้ตรวจทุกคนสำหรับแต่ละ competency_id
   * สำหรับ formlist ที่ status = 2 (finalized)
   */
  getAverageAssessedLevelsByFormlist: (formlist_id, callback) => {
    const sql = `
      SELECT 
        item.competency_id,
        AVG(item.assessed_level) AS average_assessed_level,
        COUNT(DISTINCT eval.evaluation_assessment_id) AS evaluator_count
      FROM tb_performance_evaluation_assessment eval
      INNER JOIN tb_performance_evaluation_assessment_item item
        ON item.evaluation_assessment_id = eval.evaluation_assessment_id
      WHERE eval.formlist_id = ?
        AND eval.status = 1
        AND item.assessed_level IS NOT NULL
      GROUP BY item.competency_id;
    `;
    db.query(sql, [formlist_id], callback);
  }
};

module.exports = PerformanceEvaluationAssessment;

