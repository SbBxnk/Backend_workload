const db = require('../config')();

const Performance = {
  // ดึงรายการสมรรถนะทั้งหมด
  getAllCompetencies: (callback) => {
    const sql = `
      SELECT 
        competency_id,
        competency_name,
        competency_order
      FROM tb_competency
      ORDER BY competency_order ASC
    `;
    db.query(sql, callback);
  },

  // ดึงรายการสมรรถนะเดียว
  getOneCompetency: (competency_id, callback) => {
    const sql = `
      SELECT 
        competency_id,
        competency_name,
        competency_order
      FROM tb_competency
      WHERE competency_id = ?
    `;
    db.query(sql, [competency_id], callback);
  },

  // ดึงระดับสมรรถนะที่คาดหวังทั้งหมด (สำหรับทุกตำแหน่ง)
  getAllExpectedLevels: (callback) => {
    const sql = `
      SELECT 
        pt.expected_level_id,
        pt.competency_id,
        pt.position_id,
        pt.expected_level,
        c.competency_name,
        c.competency_order,
        p.position_name,
        p.position_short_name
      FROM tb_performance_term pt
      INNER JOIN tb_competency c ON pt.competency_id = c.competency_id
      INNER JOIN tb_position p ON pt.position_id = p.position_id
      ORDER BY c.competency_order ASC, p.position_id ASC
    `;
    db.query(sql, callback);
  },

  // ดึงข้อมูล performance term ทั้งหมดพร้อม pagination
  getAllPerformanceTerms: (params, callback) => {
    const { 
      search = '', 
      limit = 100, 
      page = 1, 
      sort = 'competency_order', 
      order = 'asc' 
    } = params || {};
    
    const offset = (page - 1) * limit;
    
    // Build search condition
    let searchCondition = '';
    if (search) {
      searchCondition = `WHERE c.competency_name LIKE '%${search}%' OR p.position_name LIKE '%${search}%'`;
    }
    
    // Build order clause
    const validSortFields = ['competency_order', 'competency_name', 'position_name', 'expected_level'];
    const validOrders = ['asc', 'desc'];
    const sortField = validSortFields.includes(sort) ? sort : 'competency_order';
    const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM tb_performance_term pt
      INNER JOIN tb_competency c ON pt.competency_id = c.competency_id
      INNER JOIN tb_position p ON pt.position_id = p.position_id
      ${searchCondition}
    `;
    
    // Get paginated data
    const dataSql = `
      SELECT 
        pt.expected_level_id,
        pt.competency_id,
        pt.position_id,
        pt.expected_level,
        c.competency_name,
        c.competency_order,
        p.position_name,
        p.position_short_name
      FROM tb_performance_term pt
      INNER JOIN tb_competency c ON pt.competency_id = c.competency_id
      INNER JOIN tb_position p ON pt.position_id = p.position_id
      ${searchCondition}
      ORDER BY ${sortField} ${sortOrder}, p.position_id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // Execute count query first
    db.query(countSql, (countError, countResult) => {
      if (countError) {
        return callback(countError, null);
      }
      
      const totalRows = countResult[0].total;
      const totalPages = Math.ceil(totalRows / limit);
      
      // Execute data query
      db.query(dataSql, (dataError, dataResult) => {
        if (dataError) {
          return callback(dataError, null);
        }
        
        const meta = {
          limit: parseInt(limit),
          page: parseInt(page),
          sort: sortField,
          total_rows: totalRows,
          total_pages: totalPages
        };
        
        callback(null, {
          data: dataResult,
          meta: meta
        });
      });
    });
  },

  // ดึงข้อมูล performance term ตาม ID
  getOnePerformanceTerm: (expected_level_id, callback) => {
    const sql = `
      SELECT 
        pt.expected_level_id,
        pt.competency_id,
        pt.position_id,
        pt.expected_level,
        c.competency_name,
        c.competency_order,
        p.position_name,
        p.position_short_name
      FROM tb_performance_term pt
      INNER JOIN tb_competency c ON pt.competency_id = c.competency_id
      INNER JOIN tb_position p ON pt.position_id = p.position_id
      WHERE pt.expected_level_id = ?
    `;
    db.query(sql, [expected_level_id], callback);
  },

  // ดึงระดับสมรรถนะที่คาดหวังตามตำแหน่ง
  getExpectedLevelsByPosition: (position_id, callback) => {
    const sql = `
      SELECT 
        pt.expected_level_id,
        pt.competency_id,
        pt.position_id,
        pt.expected_level,
        c.competency_name,
        c.competency_order,
        p.position_name
      FROM tb_performance_term pt
      INNER JOIN tb_competency c ON pt.competency_id = c.competency_id
      INNER JOIN tb_position p ON pt.position_id = p.position_id
      WHERE pt.position_id = ?
      ORDER BY c.competency_order ASC
    `;
    db.query(sql, [position_id], callback);
  },

  // ดึงข้อมูลการประเมินสมรรถนะตาม formlist_id
  getPerformanceEvaluation: (formlist_id, callback) => {
    const sql = `
      SELECT 
        pe.evaluation_id,
        pe.formlist_id,
        pe.u_id,
        pe.round_list_id,
        pe.position_id,
        pe.competency_id,
        pe.demonstrated_level,
        c.competency_name,
        c.competency_order,
        p.position_name
      FROM tb_performance_evaluation pe
      INNER JOIN tb_competency c ON pe.competency_id = c.competency_id
      INNER JOIN tb_position p ON pe.position_id = p.position_id
      WHERE pe.formlist_id = ?
      ORDER BY c.competency_order ASC
    `;
    db.query(sql, [formlist_id], callback);
  },

  // ดึงข้อมูลการประเมินสมรรถนะตาม u_id และ round_list_id
  getPerformanceEvaluationByUserAndRound: (u_id, round_list_id, callback) => {
    const sql = `
      SELECT 
        pe.evaluation_id,
        pe.formlist_id,
        pe.u_id,
        pe.round_list_id,
        pe.position_id,
        pe.competency_id,
        pe.demonstrated_level,
        c.competency_name,
        c.competency_order,
        p.position_name
      FROM tb_performance_evaluation pe
      INNER JOIN tb_competency c ON pe.competency_id = c.competency_id
      INNER JOIN tb_position p ON pe.position_id = p.position_id
      WHERE pe.u_id = ? AND pe.round_list_id = ?
      ORDER BY c.competency_order ASC
    `;
    db.query(sql, [u_id, round_list_id], callback);
  },

  // เพิ่มข้อมูลการประเมินสมรรถนะ
  addPerformanceEvaluation: (evaluationData, callback) => {
    const sql = `
      INSERT INTO tb_performance_evaluation 
      (formlist_id, u_id, round_list_id, position_id, competency_id, demonstrated_level)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        demonstrated_level = VALUES(demonstrated_level),
        updated_at = CURRENT_TIMESTAMP
    `;
    const values = [
      evaluationData.formlist_id,
      evaluationData.u_id,
      evaluationData.round_list_id,
      evaluationData.position_id,
      evaluationData.competency_id,
      evaluationData.demonstrated_level
    ];
    db.query(sql, values, callback);
  },

  // อัปเดตข้อมูลการประเมินสมรรถนะ
  updatePerformanceEvaluation: (evaluation_id, demonstrated_level, callback) => {
    const sql = `
      UPDATE tb_performance_evaluation
      SET demonstrated_level = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE evaluation_id = ?
    `;
    db.query(sql, [demonstrated_level, evaluation_id], callback);
  },

  // อัปเดตข้อมูลการประเมินสมรรถนะตาม formlist_id และ competency_id
  updatePerformanceEvaluationByFormAndCompetency: (formlist_id, competency_id, demonstrated_level, callback) => {
    const sql = `
      UPDATE tb_performance_evaluation
      SET demonstrated_level = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE formlist_id = ? AND competency_id = ?
    `;
    db.query(sql, [demonstrated_level, formlist_id, competency_id], callback);
  },

  // ลบข้อมูลการประเมินสมรรถนะ
  deletePerformanceEvaluation: (evaluation_id, callback) => {
    const sql = `
      DELETE FROM tb_performance_evaluation
      WHERE evaluation_id = ?
    `;
    db.query(sql, [evaluation_id], callback);
  },

  // เพิ่มข้อมูลระดับสมรรถนะที่คาดหวัง
  addExpectedLevel: (expectedLevelData, callback) => {
    const sql = `
      INSERT INTO tb_performance_term
      (competency_id, position_id, expected_level)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        expected_level = VALUES(expected_level),
        updated_at = CURRENT_TIMESTAMP
    `;
    const values = [
      expectedLevelData.competency_id,
      expectedLevelData.position_id,
      expectedLevelData.expected_level
    ];
    db.query(sql, values, callback);
  },

  // เพิ่มข้อมูล performance term ใหม่
  addPerformanceTerm: (performanceTermData, callback) => {
    const sql = `
      INSERT INTO tb_performance_term
      (competency_id, position_id, expected_level)
      VALUES (?, ?, ?)
    `;
    const values = [
      performanceTermData.competency_id,
      performanceTermData.position_id,
      performanceTermData.expected_level
    ];
    db.query(sql, values, callback);
  },

  // อัปเดตข้อมูลระดับสมรรถนะที่คาดหวัง
  updateExpectedLevel: (expected_level_id, expected_level, callback) => {
    const sql = `
      UPDATE tb_performance_term
      SET expected_level = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE expected_level_id = ?
    `;
    db.query(sql, [expected_level, expected_level_id], callback);
  },

  // อัปเดตข้อมูล performance term
  updatePerformanceTerm: (expected_level_id, performanceTermData, callback) => {
    const sql = `
      UPDATE tb_performance_term
      SET competency_id = ?,
          position_id = ?,
          expected_level = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE expected_level_id = ?
    `;
    const values = [
      performanceTermData.competency_id,
      performanceTermData.position_id,
      performanceTermData.expected_level,
      expected_level_id
    ];
    db.query(sql, values, callback);
  },

  // ลบข้อมูลระดับสมรรถนะที่คาดหวัง
  deleteExpectedLevel: (expected_level_id, callback) => {
    const sql = `
      DELETE FROM tb_performance_term
      WHERE expected_level_id = ?
    `;
    db.query(sql, [expected_level_id], callback);
  },

  // เพิ่มข้อมูลการประเมินสมรรถนะแบบ bulk (หลายรายการพร้อมกัน)
  addPerformanceEvaluationBulk: (evaluations, callback) => {
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return callback(null, { affectedRows: 0 });
    }

    const sql = `
      INSERT INTO tb_performance_evaluation
      (formlist_id, u_id, round_list_id, position_id, competency_id, demonstrated_level)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        demonstrated_level = VALUES(demonstrated_level),
        updated_at = CURRENT_TIMESTAMP
    `;

    const values = evaluations.map(eval => [
      eval.formlist_id,
      eval.u_id,
      eval.round_list_id,
      eval.position_id,
      eval.competency_id,
      eval.demonstrated_level
    ]);

    db.query(sql, [values], callback);
  },

  // ========== SNAPSHOT FUNCTIONS ==========

  // ลบ snapshot performance evaluation เก่า (ถ้ามี)
  deleteExistingPerformanceSnapshot: (formlist_id, u_id, round_list_id, callback) => {
    const sql = `
      DELETE FROM snapshot_performance_evaluation
      WHERE formlist_id = ? AND u_id = ? AND round_list_id = ?
    `;
    db.query(sql, [formlist_id, u_id, round_list_id], callback);
  },

  // สร้าง snapshot performance evaluation
  createPerformanceSnapshot: (formlist_id, u_id, round_list_id, callback) => {
    const sql = `
      INSERT INTO snapshot_performance_evaluation 
      (formlist_id, u_id, round_list_id, status)
      VALUES (?, ?, ?, 1)
    `;
    db.query(sql, [formlist_id, u_id, round_list_id], callback);
  },

  // คัดลอกข้อมูล performance evaluation ไปยัง snapshot (เก็บข้อมูลเป็น text เพื่อป้องกันการเปลี่ยนแปลง)
  copyPerformanceEvaluationToSnapshot: (snapshot_perf_id, formlist_id, callback) => {
    const sql = `
      INSERT INTO snapshot_performance_evaluation_detail
      (snapshot_perf_id, position_name, position_short_name, competency_name, competency_order, demonstrated_level, expected_level)
      SELECT 
        ?,
        p.position_name,
        p.position_short_name,
        c.competency_name,
        c.competency_order,
        pe.demonstrated_level,
        pt.expected_level
      FROM tb_performance_evaluation pe
      LEFT JOIN tb_position p ON pe.position_id = p.position_id
      LEFT JOIN tb_competency c ON pe.competency_id = c.competency_id
      LEFT JOIN tb_performance_term pt ON pe.competency_id = pt.competency_id AND pe.position_id = pt.position_id
      WHERE pe.formlist_id = ?
    `;
    db.query(sql, [snapshot_perf_id, formlist_id], callback);
  },

  // ดึงข้อมูล snapshot performance evaluation (ใช้ข้อมูล text ที่เก็บไว้ใน snapshot)
  getPerformanceSnapshot: (formlist_id, u_id, round_list_id, callback) => {
    const sql = `
      SELECT 
        spe.snapshot_perf_id,
        spe.formlist_id,
        spe.u_id,
        spe.round_list_id,
        spe.snapshot_date,
        spe.status,
        spe.date_save,
        spe.updated_at,
        sped.snapshot_perf_detail_id,
        sped.position_name,
        sped.position_short_name,
        sped.competency_name,
        sped.competency_order,
        sped.demonstrated_level,
        sped.expected_level
      FROM snapshot_performance_evaluation spe
      LEFT JOIN snapshot_performance_evaluation_detail sped ON spe.snapshot_perf_id = sped.snapshot_perf_id
      WHERE spe.formlist_id = ? 
        AND spe.u_id = ? 
        AND spe.round_list_id = ?
        AND spe.status = 1
        AND sped.competency_name IS NOT NULL
      ORDER BY COALESCE(sped.competency_order, 0) ASC
    `;
    db.query(sql, [formlist_id, u_id, round_list_id], callback);
  }
};

module.exports = Performance;

