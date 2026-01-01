const PerformanceEvaluationAssessment = require('../models/performanceEvaluationAssessmentModel');
const Performance = require('../models/performanceModel');
const WorkloadForm = require('../models/formModel');
const WorkloadEvaluation = require('../models/workloadEvaluationModel');

const createResponse = (success, message, data = [], errorCode = null) => ({
  code: success ? 200 : 500,
  timestamp: new Date().toISOString(),
  transactionCode: `TXN_${Date.now()}`,
  success,
  titleMessage: success ? 'สำเร็จ' : 'เกิดข้อผิดพลาด',
  message,
  errorCode: errorCode || (success ? null : 'INTERNAL_ERROR'),
  payload: Array.isArray(data) || data === null ? data : [data],
  meta: {
    limit: Array.isArray(data) ? data.length : data ? 1 : 0,
    page: 1,
    sort: '',
    total_pages: 1,
    total_rows: Array.isArray(data) ? data.length : data ? 1 : 0
  }
});

const mapEvaluationAssessmentRows = (rows) => {
  if (!rows || rows.length === 0) {
    return null;
  }

  const header = rows[0];
  const items = rows
    .filter((row) => row.competency_id)
    .map((row) => ({
      assessment_item_id: row.assessment_item_id,
      competency_id: row.competency_id,
      assessed_level: row.assessed_level,
      comment: row.item_comment,
      created_at: row.item_created_at,
      updated_at: row.item_updated_at
    }));

  return {
    evaluation_assessment_id: header.evaluation_assessment_id,
    formlist_id: header.formlist_id,
    set_asses_info_id: header.set_asses_info_id,
    assessor_user_id: header.assessor_user_id,
    assessee_user_id: header.assessee_user_id,
    status: header.status,
    comment: header.comment,
    submitted_at: header.submitted_at,
    created_at: header.created_at,
    updated_at: header.updated_at,
    round_list_id: header.round_list_id,
    set_asses_list_id: header.set_asses_list_id,
    items
  };
};

const getEvaluationAssessment = (req, res) => {
  const { formlist_id, set_asses_info_id } = req.params;

  if (!formlist_id || !set_asses_info_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ formlist_id และ set_asses_info_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  PerformanceEvaluationAssessment.getEvaluationAssessmentBySetAssesInfo(formlist_id, set_asses_info_id, (error, rows) => {
    if (error) {
      console.error('Error fetching evaluation assessment:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      return res.status(500).json(createResponse(
        false,
        `ไม่สามารถดึงข้อมูลการประเมินได้: ${error.message || 'Unknown error'}`,
        [],
        'DATABASE_ERROR'
      ));
    }

    // ถ้ายังไม่พบ evaluation assessment record ให้สร้าง draft evaluation assessment อัตโนมัติ
    if (!rows || rows.length === 0) {
      // สร้าง draft evaluation assessment สำหรับ formlist นี้ (จะสร้างสำหรับทุก assessor)
      PerformanceEvaluationAssessment.createDraftEvaluationAssessmentsForFormlist(formlist_id, (createError, createResult) => {
        if (createError) {
      console.error('Error creating draft evaluation assessments:', createError);
      console.error('Create error details:', {
        message: createError.message,
        code: createError.code,
        sqlState: createError.sqlState,
        sqlMessage: createError.sqlMessage
      });
      return res.status(500).json(createResponse(
        false,
        `ไม่สามารถสร้างข้อมูลการประเมินได้: ${createError.message || 'Unknown error'}. กรุณาตรวจสอบว่าตาราง tb_performance_evaluation_assessment ถูกสร้างแล้วหรือยัง`,
        [],
        'DATABASE_ERROR'
      ));
        }

        // หลังจากสร้างแล้ว ให้ดึงข้อมูลอีกครั้ง
        PerformanceEvaluationAssessment.getEvaluationAssessmentBySetAssesInfo(formlist_id, set_asses_info_id, (retryError, retryRows) => {
          if (retryError) {
            console.error('Error fetching evaluation assessment after creation:', retryError);
            return res.status(500).json(createResponse(
              false,
              'ไม่สามารถดึงข้อมูลการประเมินได้',
              [],
              'DATABASE_ERROR'
            ));
          }

          if (!retryRows || retryRows.length === 0) {
            return res.status(404).json(createResponse(
              false,
              'ไม่พบข้อมูลการประเมินสำหรับผู้ประเมินนี้',
              [],
              'EVALUATION_ASSESSMENT_NOT_FOUND'
            ));
          }

          // ดำเนินการต่อเหมือนเดิม
          processEvaluationAssessmentData(retryRows, formlist_id, res);
        });
      });
      return;
    }

    // ดำเนินการดึงข้อมูล performance evaluation (demonstrated_level) และส่ง response
    processEvaluationAssessmentData(rows, formlist_id, res);
  });
};

// แยก function สำหรับประมวลผลข้อมูล evaluation assessment
const processEvaluationAssessmentData = (rows, formlist_id, res) => {
  const evaluationAssessment = mapEvaluationAssessmentRows(rows);
  const assesseeUserId = evaluationAssessment.assessee_user_id;
  const roundListId = evaluationAssessment.round_list_id;

  // ดึงข้อมูล user เพื่อหา position_id
  const LoginRegis = require('../models/userModel');
  const db = require('../config')();
  
  // Query position_id และ position_name โดยตรงจาก tb_users และ tb_position
  const getUserSql = `
    SELECT 
      u.position_id,
      p.position_name
    FROM tb_users u
    LEFT JOIN tb_position p ON u.position_id = p.position_id
    WHERE u.u_id = ?
  `;
  db.query(getUserSql, [assesseeUserId], (userError, userResult) => {
    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    if (!userResult || userResult.length === 0) {
      return res.status(404).json(createResponse(
        false,
        'ไม่พบข้อมูลผู้ใช้',
        [],
        'USER_NOT_FOUND'
      ));
    }

    const user = userResult[0];
    const position_id = user.position_id;
    const position_name = user.position_name || '';

    // ดึงข้อมูลทั้งหมดพร้อมกัน
    Promise.all([
      new Promise((resolve, reject) => {
        Performance.getAllCompetencies((err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      }),
      new Promise((resolve, reject) => {
        Performance.getExpectedLevelsByPosition(position_id, (err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      }),
      new Promise((resolve, reject) => {
        Performance.getPerformanceEvaluationByUserAndRound(assesseeUserId, roundListId, (err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      })
    ]).then(([competencies, expectedLevels, evaluations]) => {
      // สร้าง map ของ competency_id -> demonstrated_level
      const demonstratedLevelMap = new Map();
      if (evaluations && Array.isArray(evaluations)) {
        evaluations.forEach((perf) => {
          if (perf.competency_id && perf.formlist_id === parseInt(formlist_id)) {
            demonstratedLevelMap.set(perf.competency_id, perf.demonstrated_level);
          }
        });
      }

      // สร้าง map ของ competency_id -> expected_level
      const expectedLevelMap = new Map();
      if (expectedLevels && Array.isArray(expectedLevels)) {
        expectedLevels.forEach((el) => {
          if (el.competency_id) {
            expectedLevelMap.set(el.competency_id, el.expected_level);
          }
        });
      }

      // สร้าง map ของ competency_id -> competency info
      const competencyMap = new Map();
      if (competencies && Array.isArray(competencies)) {
        competencies.forEach((comp) => {
          if (comp.competency_id) {
            competencyMap.set(comp.competency_id, {
              competency_id: comp.competency_id,
              competency_name: comp.competency_name,
              competency_order: comp.competency_order,
              position_name: position_name,
              expected_level: expectedLevelMap.get(comp.competency_id) || null
            });
          }
        });
      }

      // รวมข้อมูล assessment items กับ competency info และ demonstrated_level
      const assessmentItems = (evaluationAssessment.items || []).map((item) => {
        const competencyInfo = competencyMap.get(item.competency_id) || {};
        return {
          ...item,
          competency_name: competencyInfo.competency_name || '',
          competency_order: competencyInfo.competency_order || 0,
          position_name: competencyInfo.position_name || '',
          expected_level: competencyInfo.expected_level || null,
          demonstrated_level: demonstratedLevelMap.get(item.competency_id) || null
        };
      });

      // เพิ่ม competencies ที่ยังไม่มีใน assessment items
      competencyMap.forEach((compInfo, competencyId) => {
        const existingItem = assessmentItems.find(item => item.competency_id === competencyId);
        if (!existingItem) {
          assessmentItems.push({
            assessment_item_id: null,
            competency_id: competencyId,
            assessed_level: null,
            comment: null,
            competency_name: compInfo.competency_name || '',
            competency_order: compInfo.competency_order || 0,
            position_name: compInfo.position_name || '',
            expected_level: compInfo.expected_level || null,
            demonstrated_level: demonstratedLevelMap.get(competencyId) || null
          });
        }
      });

      // เรียงตาม competency_order
      assessmentItems.sort((a, b) => (a.competency_order || 0) - (b.competency_order || 0));

      const response = {
        evaluation_assessment: {
          evaluation_assessment_id: evaluationAssessment.evaluation_assessment_id,
          formlist_id: evaluationAssessment.formlist_id,
          set_asses_info_id: evaluationAssessment.set_asses_info_id,
          assessor_user_id: evaluationAssessment.assessor_user_id,
          assessee_user_id: evaluationAssessment.assessee_user_id,
          status: evaluationAssessment.status,
          comment: evaluationAssessment.comment,
          submitted_at: evaluationAssessment.submitted_at,
          created_at: evaluationAssessment.created_at,
          updated_at: evaluationAssessment.updated_at,
          round_list_id: evaluationAssessment.round_list_id,
          set_asses_list_id: evaluationAssessment.set_asses_list_id
        },
        items: assessmentItems
      };

      res.json(createResponse(true, 'ดึงข้อมูลการประเมินสำเร็จ', response));
    }).catch(error => {
      console.error('Error fetching form data:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json(createResponse(
        false,
        `ไม่สามารถดึงข้อมูลฟอร์มได้: ${error.message || 'Unknown error'}`,
        [],
        'DATABASE_ERROR'
      ));
    });
  });
};

const saveDraft = (req, res) => {
  const { evaluation_assessment_id } = req.params;
  const { comment, items } = req.body;

  if (!evaluation_assessment_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ evaluation_assessment_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  // ตรวจสอบว่า evaluation assessment มีอยู่จริง
  PerformanceEvaluationAssessment.getEvaluationAssessmentById(evaluation_assessment_id, (error, result) => {
    if (error) {
      console.error('Error fetching evaluation assessment:', error);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูลการประเมินได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    if (!result || result.length === 0) {
      return res.status(404).json(createResponse(
        false,
        'ไม่พบข้อมูลการประเมิน',
        [],
        'EVALUATION_ASSESSMENT_NOT_FOUND'
      ));
    }

    const evaluation = result[0];

    // ตรวจสอบว่า status = 0 (แบบร่าง) เท่านั้น
    if (evaluation.status !== 0) {
      return res.status(400).json(createResponse(
        false,
        'ไม่สามารถแก้ไขการประเมินที่ส่งแล้วได้',
        [],
        'EVALUATION_ASSESSMENT_ALREADY_SUBMITTED'
      ));
    }

    // อัปเดต comment
    PerformanceEvaluationAssessment.updateEvaluationAssessmentDraft(
      evaluation_assessment_id,
      { comment },
      (updateError) => {
        if (updateError) {
          console.error('Error updating evaluation assessment draft:', updateError);
          return res.status(500).json(createResponse(
            false,
            'ไม่สามารถบันทึกข้อมูลการประเมินได้',
            [],
            'DATABASE_ERROR'
          ));
        }

        // อัปเดต items
        if (Array.isArray(items) && items.length > 0) {
          // ดึง competency_ids จาก items
          const competencyIds = items.map((item) => item.competency_id).filter(Boolean);

          // ลบ items ที่ไม่มีในรายการใหม่
          PerformanceEvaluationAssessment.deleteMissingEvaluationAssessmentItems(
            evaluation_assessment_id,
            competencyIds,
            (deleteError) => {
              if (deleteError) {
                console.error('Error deleting missing items:', deleteError);
                // ไม่ return error เพราะอาจจะไม่มี items ที่ต้องลบ
              }

              // เพิ่ม/อัปเดต items
              PerformanceEvaluationAssessment.replaceEvaluationAssessmentItems(
                evaluation_assessment_id,
                items,
                (replaceError) => {
                  if (replaceError) {
                    console.error('Error replacing items:', replaceError);
                    return res.status(500).json(createResponse(
                      false,
                      'ไม่สามารถบันทึกข้อมูลรายการได้',
                      [],
                      'DATABASE_ERROR'
                    ));
                  }

                  res.json(createResponse(true, 'บันทึกแบบร่างสำเร็จ', null));
                }
              );
            }
          );
        } else {
          res.json(createResponse(true, 'บันทึกแบบร่างสำเร็จ', null));
        }
      }
    );
  });
};

const submitEvaluationAssessment = (req, res) => {
  const { evaluation_assessment_id } = req.params;

  if (!evaluation_assessment_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ evaluation_assessment_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  // ตรวจสอบว่า evaluation assessment มีอยู่จริง
  PerformanceEvaluationAssessment.getEvaluationAssessmentById(evaluation_assessment_id, (error, result) => {
    if (error) {
      console.error('Error fetching evaluation assessment:', error);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูลการประเมินได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    if (!result || result.length === 0) {
      return res.status(404).json(createResponse(
        false,
        'ไม่พบข้อมูลการประเมิน',
        [],
        'EVALUATION_ASSESSMENT_NOT_FOUND'
      ));
    }

    const evaluation = result[0];

    // ตรวจสอบว่า status = 0 (แบบร่าง) เท่านั้น
    if (evaluation.status !== 0) {
      return res.status(400).json(createResponse(
        false,
        'การประเมินนี้ถูกส่งไปก่อนหน้านี้แล้ว',
        [],
        'EVALUATION_ASSESSMENT_ALREADY_SUBMITTED'
      ));
    }

    // Submit evaluation assessment
    PerformanceEvaluationAssessment.submitEvaluationAssessment(evaluation_assessment_id, (submitError) => {
      if (submitError) {
        console.error('Error submitting evaluation assessment:', submitError);
        return res.status(500).json(createResponse(
          false,
          'ไม่สามารถส่งการประเมินได้',
          [],
          'DATABASE_ERROR'
        ));
      }

      // ตรวจสอบว่าควร finalize formlist หรือไม่ (status = 2)
      // ต้องตรวจสอบทั้งสององค์ประกอบ: workload evaluation และ performance evaluation assessment
      const formlist_id = evaluation.formlist_id;

      // ตรวจสอบ performance evaluation assessment (องค์ประกอบที่ 2)
      PerformanceEvaluationAssessment.countSubmittedEvaluationAssessments(formlist_id, (perfCountError, perfCountRows) => {
        if (perfCountError) {
          console.error('Error counting submitted performance assessments:', perfCountError);
          // ไม่ return error เพราะ submit สำเร็จแล้ว แค่ finalize ไม่ได้
          return res.json(createResponse(true, 'ส่งการประเมินสำเร็จ', null));
        }

        const perfSubmittedCount = perfCountRows[0]?.submitted_count || 0;

        // ตรวจสอบ workload evaluation (องค์ประกอบที่ 1)
        WorkloadEvaluation.countSubmittedEvaluations(formlist_id, (workloadCountError, workloadCountRows) => {
          if (workloadCountError) {
            console.error('Error counting submitted workload evaluations:', workloadCountError);
            // ไม่ return error เพราะ submit สำเร็จแล้ว แค่ finalize ไม่ได้
            return res.json(createResponse(true, 'ส่งการประเมินสำเร็จ', null));
          }

          const workloadSubmittedCount = workloadCountRows[0]?.submitted_count || 0;

          // ตรวจสอบจำนวนผู้ประเมินทั้งหมด
          PerformanceEvaluationAssessment.countAssignmentsByFormlist(formlist_id, (assignError, assignRows) => {
            if (assignError) {
              console.error('Error counting assignments:', assignError);
              // ไม่ return error เพราะ submit สำเร็จแล้ว แค่ finalize ไม่ได้
              return res.json(createResponse(true, 'ส่งการประเมินสำเร็จ', null));
            }

            const totalAssignments = assignRows[0]?.total_assignments || 0;

            // Finalize ถ้าทั้งสององค์ประกอบส่งครบทุกคนแล้ว
            const finalizeIfNeeded = (callback) => {
              if (totalAssignments > 0 && 
                  perfSubmittedCount >= totalAssignments && 
                  workloadSubmittedCount >= totalAssignments) {
                WorkloadForm.updateFormlistStatusById(
                  formlist_id,
                  2,
                  { touchFinalizedAt: true },
                  (updateError) => {
                    if (updateError) {
                      console.error('Error updating formlist status to finalized:', updateError);
                      return callback(updateError);
                    }
                    callback(null, true);
                  }
                );
              } else {
                callback(null, false);
              }
            };

            finalizeIfNeeded((finalizeError, finalized) => {
              if (finalizeError) {
                // ไม่ return error เพราะ submit สำเร็จแล้ว แค่ finalize ไม่ได้
                console.error('Error finalizing formlist:', finalizeError);
              }

              return res.json(createResponse(true, 'ส่งการประเมินสำเร็จ', {
                evaluation_assessment_id: Number(evaluation_assessment_id),
                submitted: true,
                perf_submitted_count: perfSubmittedCount,
                workload_submitted_count: workloadSubmittedCount,
                total_assignments: totalAssignments,
                form_finalized: finalized
              }));
            });
          });
        });
      });
    });
  });
};

const getAverageAssessedLevels = (req, res) => {
  const { formlist_id } = req.params;

  if (!formlist_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ formlist_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  PerformanceEvaluationAssessment.getAverageAssessedLevelsByFormlist(formlist_id, (error, rows) => {
    if (error) {
      console.error('Error fetching average assessed levels:', error);
      return res.status(500).json(createResponse(
        false,
        `ไม่สามารถดึงข้อมูลเฉลี่ยระดับสมรรถนะได้: ${error.message || 'Unknown error'}`,
        [],
        'DATABASE_ERROR'
      ));
    }

    res.json(createResponse(true, 'ดึงข้อมูลเฉลี่ยระดับสมรรถนะสำเร็จ', rows || []));
  });
};

module.exports = {
  getEvaluationAssessment,
  saveDraft,
  submitEvaluationAssessment,
  getAverageAssessedLevels
};

