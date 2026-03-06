const WorkloadEvaluation = require('../models/workloadEvaluationModel');
const WorkloadForm = require('../models/formModel');

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

const mapEvaluationRows = (rows) => {
  if (!rows || rows.length === 0) {
    return null;
  }

  const header = rows[0];
  const items = rows
    .filter((row) => row.snapshot_form_id)
    .map((row) => ({
      evaluation_item_id: row.evaluation_item_id,
      snapshot_form_id: row.snapshot_form_id,
      score: row.score,
      comment: row.item_comment,
      created_at: row.item_created_at,
      updated_at: row.item_updated_at
    }));

  return {
    evaluation_id: header.evaluation_id,
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

const getEvaluation = (req, res) => {
  const { formlist_id, set_asses_info_id } = req.params;

  if (!formlist_id || !set_asses_info_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ formlist_id และ set_asses_info_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  WorkloadEvaluation.getEvaluationBySetAssesInfo(formlist_id, set_asses_info_id, (error, rows) => {
    if (error) {
      console.error('Error fetching evaluation:', error);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูลการประเมินได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    // ถ้ายังไม่พบ evaluation record ให้สร้าง draft evaluation อัตโนมัติ
    if (!rows || rows.length === 0) {
      // สร้าง draft evaluation สำหรับ formlist นี้ (จะสร้างสำหรับทุก assessor)
      WorkloadEvaluation.createDraftEvaluationsForFormlist(formlist_id, (createError, createResult) => {
        if (createError) {
          console.error('Error creating draft evaluations:', createError);
          return res.status(500).json(createResponse(
            false,
            'ไม่สามารถสร้างข้อมูลการประเมินได้',
            [],
            'DATABASE_ERROR'
          ));
        }

        // หลังจากสร้างแล้ว ให้ดึงข้อมูลอีกครั้ง
        WorkloadEvaluation.getEvaluationBySetAssesInfo(formlist_id, set_asses_info_id, (retryError, retryRows) => {
          if (retryError) {
            console.error('Error fetching evaluation after creation:', retryError);
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
              'EVALUATION_NOT_FOUND'
            ));
          }

          // ดำเนินการต่อเหมือนเดิม
          processEvaluationData(retryRows, formlist_id, res);
        });
      });
      return;
    }

    // ดำเนินการดึงข้อมูล snapshot และส่ง response
    processEvaluationData(rows, formlist_id, res);
  });
};

// แยก function สำหรับประมวลผลข้อมูล evaluation
const processEvaluationData = (rows, formlist_id, res) => {
  const evaluation = mapEvaluationRows(rows);
  const assesseeUserId = evaluation.assessee_user_id;

  WorkloadForm.getAllFormInfoFromSnapshot(formlist_id, assesseeUserId, (snapshotError, snapshotResult) => {
    if (snapshotError) {
      console.error('Error fetching snapshot data:', snapshotError);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูล snapshot ได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    const processedSnapshot = (snapshotResult || []).map((row) => ({
      ...row,
      files: typeof row.files === 'string' ? row.files.split(', ').map((name) => ({ file_name: name })) : row.files,
      links: typeof row.links === 'string'
        ? row.links.split(', ').map((item) => {
          const [link_name = '', link_path = ''] = item.split('|');
          return { link_name, link_path };
        })
        : row.links
    }));

    return res.status(200).json(createResponse(
      true,
      'ดึงข้อมูลการประเมินสำเร็จ',
      {
        evaluation,
        snapshot: processedSnapshot
      }
    ));
  });
};

const saveDraft = (req, res) => {
  const { evaluation_id } = req.params;
  const { comment, items } = req.body || {};

  if (!evaluation_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ evaluation_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  WorkloadEvaluation.getEvaluationById(evaluation_id, (fetchError, rows) => {
    if (fetchError) {
      console.error('Error fetching evaluation header:', fetchError);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูลการประเมินได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json(createResponse(
        false,
        'ไม่พบข้อมูลการประเมิน',
        [],
        'EVALUATION_NOT_FOUND'
      ));
    }

    const evaluation = rows[0];

    if (evaluation.status === 1) {
      return res.status(400).json(createResponse(
        false,
        'ไม่สามารถบันทึกแบบร่างได้ เนื่องจากการประเมินถูกส่งแล้ว',
        [],
        'EVALUATION_LOCKED'
      ));
    }

    WorkloadEvaluation.updateEvaluationDraft(evaluation_id, { comment }, (updateError) => {
      if (updateError) {
        console.error('Error updating evaluation draft:', updateError);
        return res.status(500).json(createResponse(
          false,
          'ไม่สามารถบันทึกแบบร่างได้',
          [],
          'DATABASE_ERROR'
        ));
      }

      const itemArray = Array.isArray(items) ? items : [];
      WorkloadEvaluation.replaceEvaluationItems(evaluation_id, itemArray, (itemError) => {
        if (itemError) {
          console.error('Error upserting evaluation items:', itemError);
          return res.status(500).json(createResponse(
            false,
            'ไม่สามารถบันทึกข้อมูลคะแนนรายข้อได้',
            [],
            'DATABASE_ERROR'
          ));
        }

        const snapshotIds = itemArray.map((item) => item.snapshot_form_id);
        WorkloadEvaluation.deleteMissingEvaluationItems(evaluation_id, snapshotIds, (deleteError) => {
          if (deleteError) {
            console.error('Error cleaning evaluation items:', deleteError);
            return res.status(500).json(createResponse(
              false,
              'ไม่สามารถลบข้อมูลที่ไม่ใช้งานได้',
              [],
              'DATABASE_ERROR'
            ));
          }

          return res.status(200).json(createResponse(
            true,
            'บันทึกแบบร่างเรียบร้อยแล้ว',
            {
              evaluation_id: Number(evaluation_id),
              updated_at: new Date().toISOString()
            }
          ));
        });
      });
    });
  });
};

const submitEvaluation = (req, res) => {
  const { evaluation_id } = req.params;

  if (!evaluation_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ evaluation_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  WorkloadEvaluation.getEvaluationById(evaluation_id, (fetchError, rows) => {
    if (fetchError) {
      console.error('Error fetching evaluation header:', fetchError);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูลการประเมินได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json(createResponse(
        false,
        'ไม่พบข้อมูลการประเมิน',
        [],
        'EVALUATION_NOT_FOUND'
      ));
    }

    const evaluation = rows[0];

    if (evaluation.status === 1) {
      return res.status(200).json(createResponse(
        true,
        'การประเมินนี้ถูกส่งไปแล้ว',
        {
          evaluation_id: Number(evaluation_id),
          submitted: true
        }
      ));
    }

    WorkloadEvaluation.fillMissingScoresFromSnapshot(evaluation_id, (fillError) => {
      if (fillError) {
        console.error('Error filling missing scores from snapshot:', fillError);
        return res.status(500).json(createResponse(
          false,
          'ไม่สามารถเติมคะแนนอัตโนมัติจากข้อมูลเดิมได้',
          [],
          'DATABASE_ERROR'
        ));
      }

      WorkloadEvaluation.submitEvaluation(evaluation_id, (submitError) => {
        if (submitError) {
          console.error('Error submitting evaluation:', submitError);
          return res.status(500).json(createResponse(
            false,
            'ไม่สามารถส่งการประเมินได้',
            [],
            'DATABASE_ERROR'
          ));
        }

        WorkloadEvaluation.countSubmittedEvaluations(evaluation.formlist_id, (countError, submittedRows) => {
          if (countError) {
            console.error('Error counting submitted evaluations:', countError);
            return res.status(500).json(createResponse(
              false,
              'ไม่สามารถตรวจสอบสถานะการส่งได้',
              [],
              'DATABASE_ERROR'
            ));
          }

          const submittedCount = submittedRows[0]?.submitted_count || 0;

          WorkloadEvaluation.countAssignmentsByFormlist(evaluation.formlist_id, (assignError, assignRows) => {
            if (assignError) {
              console.error('Error counting assignments:', assignError);
              return res.status(500).json(createResponse(
                false,
                'ไม่สามารถตรวจสอบจำนวนผู้ประเมินได้',
                [],
                'DATABASE_ERROR'
              ));
            }

            const totalAssignments = assignRows[0]?.total_assignments || 0;

            // ตรวจสอบ performance evaluation assessment (องค์ประกอบที่ 2) ด้วย
            const PerformanceEvaluationAssessment = require('../models/performanceEvaluationAssessmentModel');
            PerformanceEvaluationAssessment.countSubmittedEvaluationAssessments(evaluation.formlist_id, (perfCountError, perfCountRows) => {
              if (perfCountError) {
                console.error('Error counting submitted performance assessments:', perfCountError);
                // ไม่ return error เพราะ submit สำเร็จแล้ว แค่ finalize ไม่ได้
                const finalizeIfNeeded = (callback) => {
                  // ถ้าไม่สามารถตรวจสอบ performance assessment ได้ ให้ finalize เฉพาะ workload evaluation
                  if (totalAssignments > 0 && submittedCount >= totalAssignments) {
                    WorkloadForm.updateFormlistStatusById(
                      evaluation.formlist_id,
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
                    return res.status(500).json(createResponse(
                      false,
                      'ไม่สามารถอัปเดตสถานะฟอร์มได้',
                      [],
                      'DATABASE_ERROR'
                    ));
                  }

                  return res.status(200).json(createResponse(
                    true,
                    'ส่งการประเมินสำเร็จ',
                    {
                      evaluation_id: Number(evaluation_id),
                      submitted: true,
                      submitted_count: submittedCount,
                      total_assignments: totalAssignments,
                      form_finalized: finalized
                    }
                  ));
                });
                return;
              }

              const perfSubmittedCount = perfCountRows[0]?.submitted_count || 0;

              const finalizeIfNeeded = (callback) => {
                // Finalize ถ้าทั้งสององค์ประกอบส่งครบทุกคนแล้ว
                if (totalAssignments > 0 &&
                  submittedCount >= totalAssignments &&
                  perfSubmittedCount >= totalAssignments) {
                  WorkloadForm.updateFormlistStatusById(
                    evaluation.formlist_id,
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
                  return res.status(500).json(createResponse(
                    false,
                    'ไม่สามารถอัปเดตสถานะฟอร์มได้',
                    [],
                    'DATABASE_ERROR'
                  ));
                }

                return res.status(200).json(createResponse(
                  true,
                  'ส่งการประเมินสำเร็จ',
                  {
                    evaluation_id: Number(evaluation_id),
                    submitted: true,
                    submitted_count: submittedCount,
                    perf_submitted_count: perfSubmittedCount,
                    total_assignments: totalAssignments,
                    form_finalized: finalized
                  }
                ));
              });
            });
          });
        });
      });
    });
  });
};

const getAverageScores = (req, res) => {
  const { formlist_id } = req.params;

  if (!formlist_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ formlist_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  WorkloadEvaluation.getAverageEvaluationScoresByFormlist(formlist_id, (error, rows) => {
    if (error) {
      console.error('Error fetching average evaluation scores:', error);
      return res.status(500).json(createResponse(
        false,
        `ไม่สามารถดึงข้อมูลสรุปคะแนนได้: ${error.message || 'Unknown error'}`,
        [],
        'DATABASE_ERROR'
      ));
    }

    res.json(createResponse(true, 'ดึงข้อมูลสรุปคะแนนสำเร็จ', rows || []));
  });
};

const getAssignedWorkloadGroup = (req, res) => {
  const { as_u_id, round_list_id } = req.params;

  if (!as_u_id || !round_list_id) {
    return res.status(400).json(createResponse(
      false,
      'กรุณาระบุ as_u_id และ round_list_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  WorkloadEvaluation.getAssignedWorkloadGroup(as_u_id, round_list_id, (error, rows) => {
    if (error) {
      console.error('Error fetching assigned workload group:', error);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูลกลุ่มภาระงานได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    if (!rows || rows.length === 0) {
      return res.status(200).json(createResponse(
        true,
        'ไม่พบข้อมูลกลุ่มภาระงานสำหรับรอบนี้',
        null
      ));
    }

    res.json(createResponse(true, 'ดึงข้อมูลกลุ่มภาระงานสำเร็จ', rows[0]));
  });
};

module.exports = {
  getEvaluation,
  saveDraft,
  submitEvaluation,
  getAverageScores,
  getAssignedWorkloadGroup
};

