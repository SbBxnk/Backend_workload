const Performance = require('../models/performanceModel');
const WorkloadForm = require('../models/formModel');

// ดึงรายการสมรรถนะทั้งหมด
const getAllCompetencies = (req, res) => {
  Performance.getAllCompetencies((error, result) => {
    if (error) {
      console.error('Error fetching competencies:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching competencies',
        error: error.message
      });
    }
    res.json({
      success: true,
      payload: result
    });
  });
};

// ดึงรายการสมรรถนะเดียว
const getOneCompetency = (req, res) => {
  const { competency_id } = req.params;
  
  Performance.getOneCompetency(competency_id, (error, result) => {
    if (error) {
      console.error('Error fetching competency:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching competency',
        error: error.message
      });
    }
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Competency not found'
      });
    }
    
    res.json({
      success: true,
      payload: result[0]
    });
  });
};

// ดึงระดับสมรรถนะที่คาดหวังทั้งหมด
const getAllExpectedLevels = (req, res) => {
  Performance.getAllExpectedLevels((error, result) => {
    if (error) {
      console.error('Error fetching expected levels:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching expected levels',
        error: error.message
      });
    }
    res.json({
      success: true,
      payload: result
    });
  });
};

// ดึงระดับสมรรถนะที่คาดหวังตามตำแหน่ง
const getExpectedLevelsByPosition = (req, res) => {
  const { position_id } = req.params;
  
  Performance.getExpectedLevelsByPosition(position_id, (error, result) => {
    if (error) {
      console.error('Error fetching expected levels by position:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching expected levels by position',
        error: error.message
      });
    }
    res.json({
      success: true,
      payload: result
    });
  });
};

// ดึงข้อมูลการประเมินสมรรถนะตาม formlist_id
const getPerformanceEvaluation = (req, res) => {
  const { formlist_id } = req.params;
  
  Performance.getPerformanceEvaluation(formlist_id, (error, result) => {
    if (error) {
      console.error('Error fetching performance evaluation:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching performance evaluation',
        error: error.message
      });
    }
    res.json({
      success: true,
      payload: result
    });
  });
};

// ดึงข้อมูลการประเมินสมรรถนะตาม u_id และ round_list_id
const getPerformanceEvaluationByUserAndRound = (req, res) => {
  const { u_id, round_list_id } = req.params;
  
  Performance.getPerformanceEvaluationByUserAndRound(u_id, round_list_id, (error, result) => {
    if (error) {
      console.error('Error fetching performance evaluation:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching performance evaluation',
        error: error.message
      });
    }
    res.json({
      success: true,
      payload: result
    });
  });
};

// เพิ่มหรืออัปเดตข้อมูลการประเมินสมรรถนะ
const addOrUpdatePerformanceEvaluation = (req, res) => {
  const { formlist_id, u_id, round_list_id, position_id, competency_id, demonstrated_level } = req.body;
  
  // Validation
  if (!formlist_id || !u_id || !round_list_id || !position_id || !competency_id) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: formlist_id, u_id, round_list_id, position_id, competency_id'
    });
  }
  
  if (demonstrated_level !== null && demonstrated_level !== undefined) {
    if (demonstrated_level < 1 || demonstrated_level > 5) {
      return res.status(400).json({
        success: false,
        message: 'demonstrated_level must be between 1 and 5'
      });
    }
  }
  
  const evaluationData = {
    formlist_id,
    u_id,
    round_list_id,
    position_id,
    competency_id,
    demonstrated_level: demonstrated_level || null
  };
  
  Performance.addPerformanceEvaluation(evaluationData, (error, result) => {
    if (error) {
      console.error('Error adding/updating performance evaluation:', error);
      return res.status(500).json({
        success: false,
        message: 'Error adding/updating performance evaluation',
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Performance evaluation saved successfully',
      payload: {
        evaluation_id: result.insertId || result.affectedRows > 0 ? 'updated' : null
      }
    });
  });
};

// เพิ่มหรืออัปเดตข้อมูลการประเมินสมรรถนะแบบ bulk
const addOrUpdatePerformanceEvaluationBulk = (req, res) => {
  const { evaluations } = req.body;
  
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'evaluations must be a non-empty array'
    });
  }
  
  // Validation
  for (const eval of evaluations) {
    if (!eval.formlist_id || !eval.u_id || !eval.round_list_id || !eval.position_id || !eval.competency_id) {
      return res.status(400).json({
        success: false,
        message: 'Each evaluation must have formlist_id, u_id, round_list_id, position_id, and competency_id'
      });
    }
    
    // ลบการจำกัดค่า demonstrated_level - รับค่าได้ทุกตัวเลข
  }
  
  Performance.addPerformanceEvaluationBulk(evaluations, (error, result) => {
    if (error) {
      console.error('Error adding/updating performance evaluations bulk:', error);
      return res.status(500).json({
        success: false,
        message: 'Error adding/updating performance evaluations',
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Performance evaluations saved successfully',
      payload: {
        affectedRows: result.affectedRows
      }
    });
  });
};

// ดึงข้อมูลการประเมินสมรรถนะพร้อมข้อมูลที่คาดหวัง (สำหรับแสดงฟอร์ม)
const getPerformanceEvaluationForm = (req, res) => {
  const { formlist_id } = req.params;
  const { u_id } = req.query; // u_id ของผู้ที่ถูกประเมิน
  
  if (!formlist_id) {
    return res.status(400).json({
      success: false,
      message: 'formlist_id is required'
    });
  }
  
  if (!u_id) {
    return res.status(400).json({
      success: false,
      message: 'u_id is required'
    });
  }
  
  // ดึงข้อมูล user เพื่อหา position_id
  const LoginRegis = require('../models/userModel');
  LoginRegis.GetOneUser(u_id, (userError, userResult) => {
    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: userError.message
      });
    }
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult[0];
    const position_id = user.position_id;
    
    // ดึงข้อมูลทั้งหมดพร้อมกัน
    Promise.all([
      new Promise((resolve, reject) => {
        Performance.getAllCompetencies((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        Performance.getAllExpectedLevels((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        Performance.getPerformanceEvaluation(formlist_id, (err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      })
    ]).then(([competencies, expectedLevels, evaluations]) => {
      // จัดรูปแบบข้อมูล
      const result = {
        competencies: competencies || [],
        expectedLevels: expectedLevels || [],
        evaluations: evaluations || [],
        userPositionId: position_id
      };
      
      res.json({
        success: true,
        payload: result
      });
    }).catch(error => {
      console.error('Error fetching form data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching form data',
        error: error.message
      });
    });
  });
};

// เพิ่มข้อมูลระดับสมรรถนะที่คาดหวัง
const addExpectedLevel = (req, res) => {
  const { competency_id, position_id, expected_level } = req.body;
  
  if (!competency_id || !position_id || !expected_level) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: competency_id, position_id, expected_level'
    });
  }
  
  if (expected_level < 1 || expected_level > 5) {
    return res.status(400).json({
      success: false,
      message: 'expected_level must be between 1 and 5'
    });
  }
  
  const expectedLevelData = {
    competency_id,
    position_id,
    expected_level
  };
  
  Performance.addExpectedLevel(expectedLevelData, (error, result) => {
    if (error) {
      console.error('Error adding expected level:', error);
      return res.status(500).json({
        success: false,
        message: 'Error adding expected level',
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Expected level saved successfully',
      payload: {
        expected_level_id: result.insertId
      }
    });
  });
};

// ดึงข้อมูล snapshot performance evaluation
const getPerformanceSnapshot = (req, res) => {
  const { formlist_id, u_id, round_list_id } = req.query;

  if (!formlist_id || !u_id || !round_list_id) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาระบุ formlist_id, u_id และ round_list_id'
    });
  }

  Performance.getPerformanceSnapshot(parseInt(formlist_id), parseInt(u_id), parseInt(round_list_id), (error, result) => {
    if (error) {
      console.error('Error fetching performance snapshot:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching performance snapshot',
        error: error.message
      });
    }

    if (!result || result.length === 0) {
      return res.json({
        success: true,
        payload: null,
        message: 'ไม่พบข้อมูล snapshot'
      });
    }

    // จัดรูปแบบข้อมูลให้เป็นโครงสร้างที่ใช้งานง่าย
    const snapshotData = {
      snapshot_perf_id: result[0].snapshot_perf_id,
      formlist_id: result[0].formlist_id,
      u_id: result[0].u_id,
      round_list_id: result[0].round_list_id,
      snapshot_date: result[0].snapshot_date,
      status: result[0].status,
      date_save: result[0].date_save,
      updated_at: result[0].updated_at,
      evaluations: result
        .filter(row => row.competency_name) // กรองเฉพาะแถวที่มี competency_name (ใช้ชื่อแทน ID)
        .map(row => ({
          snapshot_perf_detail_id: row.snapshot_perf_detail_id,
          // เก็บข้อมูลเป็น text เพื่อป้องกันการเปลี่ยนแปลงหลังจากส่งฟอร์ม
          position_name: row.position_name || null,
          position_short_name: row.position_short_name || null,
          competency_name: row.competency_name || null, // ใช้ข้อมูล text จาก snapshot
          competency_order: row.competency_order || null,
          demonstrated_level: row.demonstrated_level,
          expected_level: row.expected_level || null // ใช้ข้อมูลจาก snapshot
        }))
    };

    res.json({
      success: true,
      payload: snapshotData
    });
  });
};

module.exports = {
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
};

