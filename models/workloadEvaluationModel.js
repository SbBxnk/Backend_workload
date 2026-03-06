const db = require('../config')();

const WorkloadEvaluation = {
  /**
   * Load evaluation with detail rows for a given formlist and assessor assignment.
   */
  getEvaluationBySetAssesInfo: (formlist_id, set_asses_info_id, callback) => {
    const sql = `
      SELECT 
        eval.evaluation_id,
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
        item.evaluation_item_id,
        item.snapshot_form_id,
        item.score,
        item.comment AS item_comment,
        item.created_at AS item_created_at,
        item.updated_at AS item_updated_at
      FROM tb_workload_form_evaluation eval
      INNER JOIN tb_set_assessorinfo sai
        ON sai.set_asses_info_id = eval.set_asses_info_id
      INNER JOIN tb_set_assessorlist sal
        ON sal.set_asses_list_id = sai.set_asses_list_id
      LEFT JOIN tb_workload_form_evaluation_item item 
        ON item.evaluation_id = eval.evaluation_id
      WHERE eval.formlist_id = ? AND eval.set_asses_info_id = ?;
    `;
    db.query(sql, [formlist_id, set_asses_info_id], callback);
  },

  /**
   * Fetch evaluation header by ID.
   */
  getEvaluationById: (evaluation_id, callback) => {
    const sql = `
      SELECT 
        eval.evaluation_id,
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
      FROM tb_workload_form_evaluation eval
      INNER JOIN tb_set_assessorinfo sai
        ON sai.set_asses_info_id = eval.set_asses_info_id
      INNER JOIN tb_set_assessorlist sal
        ON sal.set_asses_list_id = sai.set_asses_list_id
      WHERE evaluation_id = ?;
    `;
    db.query(sql, [evaluation_id], callback);
  },

  /**
   * Ensure draft evaluation rows exist for every assessor assignment of the given formlist.
   */
  createDraftEvaluationsForFormlist: (formlist_id, callback) => {
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
        INSERT IGNORE INTO tb_workload_form_evaluation
          (formlist_id, set_asses_info_id, assessor_user_id, assessee_user_id, status)
        VALUES ?
      `;

      db.query(insertSql, [values], callback);
    });
  },

  /**
   * Update draft payload and comment for an evaluation.
   */
  updateEvaluationDraft: (evaluation_id, { comment }, callback) => {
    const sql = `
      UPDATE tb_workload_form_evaluation
      SET 
        comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE evaluation_id = ? AND status = 0;
    `;
    db.query(sql, [comment || null, evaluation_id], callback);
  },

  /**
   * Replace evaluation item rows (upsert per snapshot form).
   */
  replaceEvaluationItems: (evaluation_id, items, callback) => {
    if (!Array.isArray(items) || items.length === 0) {
      return callback(null, { affectedRows: 0 });
    }

    const values = items.map((item) => [
      evaluation_id,
      item.snapshot_form_id,
      item.score != null ? item.score : null,
      item.comment || null
    ]);

    const sql = `
      INSERT INTO tb_workload_form_evaluation_item
        (evaluation_id, snapshot_form_id, score, comment)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        score = VALUES(score),
        comment = VALUES(comment),
        updated_at = CURRENT_TIMESTAMP
    `;

    db.query(sql, [values], callback);
  },

  /**
   * Backfill missing scores from snapshot (workload * quality) when evaluator leaves them blank.
   */
  fillMissingScoresFromSnapshot: (evaluation_id, callback) => {
    const sql = `
      UPDATE tb_workload_form_evaluation_item item
      INNER JOIN snapshot_workload_form_info snapshot
        ON snapshot.snapshot_form_id = item.snapshot_form_id
      SET item.score = COALESCE(snapshot.workload, 0) * COALESCE(snapshot.quality, 0)
      WHERE item.evaluation_id = ? AND item.score IS NULL;
    `;
    db.query(sql, [evaluation_id], callback);
  },

  /**
   * Remove evaluation items not in the provided snapshot_form_ids (cleanup).
   */
  deleteMissingEvaluationItems: (evaluation_id, snapshotFormIds, callback) => {
    if (!evaluation_id) {
      return callback(new Error('evaluation_id is required'));
    }

    if (!Array.isArray(snapshotFormIds) || snapshotFormIds.length === 0) {
      const sql = `
        DELETE FROM tb_workload_form_evaluation_item
        WHERE evaluation_id = ?;
      `;
      return db.query(sql, [evaluation_id], callback);
    }

    const sql = `
      DELETE FROM tb_workload_form_evaluation_item
      WHERE evaluation_id = ? AND snapshot_form_id NOT IN (?);
    `;
    db.query(sql, [evaluation_id, snapshotFormIds], callback);
  },

  /**
   * Submit evaluation (status -> 1).
   */
  submitEvaluation: (evaluation_id, callback) => {
    const sql = `
      UPDATE tb_workload_form_evaluation
      SET status = 1,
          submitted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE evaluation_id = ?;
    `;
    db.query(sql, [evaluation_id], callback);
  },

  /**
   * Count evaluator assignments for a formlist.
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
   * Count submitted evaluations (status = 1) for a formlist.
   */
  countSubmittedEvaluations: (formlist_id, callback) => {
    const sql = `
      SELECT COUNT(*) AS submitted_count
      FROM tb_workload_form_evaluation
      WHERE formlist_id = ? AND status = 1;
    `;
    db.query(sql, [formlist_id], callback);
  },

  /**
   * Reset evaluation to draft (optional utility).
   */
  resetEvaluationToDraft: (evaluation_id, callback) => {
    const sql = `
      UPDATE tb_workload_form_evaluation
      SET status = 0,
          submitted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE evaluation_id = ?;
    `;
    db.query(sql, [evaluation_id], callback);
  },

  /**
   * ดึง evaluation scores เฉลี่ยจากผู้ตรวจทุกคนสำหรับแต่ละ snapshot_form_id
   * สำหรับ formlist ที่ status = 2 (finalized)
   */
  getAverageEvaluationScoresByFormlist: (formlist_id, callback) => {
    const sql = `
      SELECT 
        item.snapshot_form_id,
        AVG(item.score) AS average_score,
        COUNT(DISTINCT eval.evaluation_id) AS evaluator_count
      FROM tb_workload_form_evaluation eval
      INNER JOIN tb_workload_form_evaluation_item item
        ON item.evaluation_id = eval.evaluation_id
      WHERE eval.formlist_id = ?
        AND eval.status = 1
        AND item.score IS NOT NULL
      GROUP BY item.snapshot_form_id;
    `;
    db.query(sql, [formlist_id], callback);
  },

  /**
   * Fetch assigned workload group info for a specific user and round.
   */
  getAssignedWorkloadGroup: (as_u_id, round_list_id, callback) => {
    const sql = `
      SELECT 
        sal.workload_group_id,
        wg.workload_group_name
      FROM tb_set_assessorlist sal
      LEFT JOIN tb_workload_group wg ON wg.workload_group_id = sal.workload_group_id
      WHERE sal.as_u_id = ? AND sal.round_list_id = ?;
    `;
    db.query(sql, [as_u_id, round_list_id], callback);
  }
};

module.exports = WorkloadEvaluation;

