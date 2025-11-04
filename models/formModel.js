const db = require("../config")()

const WorkloadForm = {
  getTermForm: (callback) => {
    const sql = ` 
                SELECT
                    tb_task.task_id,
                    tb_task.task_name,
                    tb_workload_group.workload_group_id,
                    tb_workload_group.workload_group_name,
                    tb_quantity_workload.quantity_workload_hours
                FROM
                    tb_workload_group
                LEFT JOIN 
                    tb_quantity_workload 
                ON 
                    tb_workload_group.workload_group_id = tb_quantity_workload.workload_group_id
                LEFT JOIN 
                    tb_task 
                ON 
                    tb_task.task_id = tb_quantity_workload.task_id
                ORDER BY tb_task.task_id ASC, tb_workload_group.workload_group_id ASC`
    db.query(sql, callback)
  },

  addFormList: (WorkloadFormDetail, callback) => {
    const sql = "INSERT INTO tb_workload_formlist SET ?"
    db.query(sql, WorkloadFormDetail, callback)
  },

  addFormListBulk: (WorkloadFormDetails, callback) => {
    console.log('🔍 addFormListBulk model - Input:', JSON.stringify(WorkloadFormDetails, null, 2))
    
    if (!Array.isArray(WorkloadFormDetails) || WorkloadFormDetails.length === 0) {
      console.log('❌ Model: Empty or invalid array')
      return callback(null, { affectedRows: 0 })
    }
    
    // ใช้ INSERT IGNORE เพื่อข้าม duplicate entries
    const sql = "INSERT IGNORE INTO tb_workload_formlist (set_asses_list_id, status) VALUES ?"
    const values = WorkloadFormDetails.map(item => [item.set_asses_list_id, item.status_id])
    
    console.log('🔍 Model - SQL:', sql)
    console.log('🔍 Model - Values:', values)
    
    db.query(sql, [values], (error, result) => {
      if (error) {
        console.error('❌ Model - Database error:', error)
      } else {
        console.log('✅ Model - Success:', result)
        console.log(`📊 Inserted ${result.affectedRows} rows, ${result.warningCount} warnings`)
      }
      callback(error, result)
    })
  },

  checkGroupID: (as_u_id, round_list_id, callback) => {
    const sql = `
            SELECT
                tb_set_assessorlist.set_asses_list_id,
                tb_set_assessorlist.as_u_id,
                tb_users.u_fname,
                tb_users.u_lname,
                tb_set_assessorlist.workload_group_id,
                tb_workload_group.workload_group_name,
                tb_workload_formlist.formlist_id
            FROM
                tb_set_assessorlist
            LEFT JOIN tb_users ON tb_users.u_id = tb_set_assessorlist.as_u_id
            LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
            LEFT JOIN tb_workload_formlist ON tb_workload_formlist.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
            WHERE 
                tb_set_assessorlist.as_u_id = ?
            AND tb_set_assessorlist.round_list_id = ?
            AND tb_set_assessorlist.workload_group_id IS NOT NULL
            AND tb_set_assessorlist.workload_group_id != 0`
    db.query(sql, [as_u_id, round_list_id], callback)
  },

  getWorkloadGroupId: (as_u_id, round_list_id, callback) => {
    const sql = `
            SELECT workload_group_id 
            FROM tb_set_assessorlist 
            WHERE as_u_id = ? AND round_list_id = ?`
    db.query(sql, [as_u_id, round_list_id], callback)
  },

  getGroupDetails: (workload_group_id, callback) => {
    const sql = `
            SELECT
                tb_workload_group.workload_group_id,
                tb_workload_group.workload_group_name,
                tb_set_roundlist.round,
                tb_set_roundlist.year,
                tb_set_roundlist.round_list_id,
                tb_set_assessorlist.set_asses_list_id,
                tb_users.u_id,
                tb_status.status_id,
                tb_status.status_name,
                tb_workload_formlist.formlist_id,
                tb_users.u_fname,
                tb_users.u_lname
            FROM
                tb_workload_formlist
            LEFT JOIN tb_set_assessorlist ON tb_workload_formlist.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
            LEFT JOIN tb_set_roundlist ON tb_set_roundlist.round_list_id = tb_set_assessorlist.round_list_id
            LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
            LEFT JOIN tb_users ON tb_set_assessorlist.as_u_id = tb_users.u_id
            LEFT JOIN tb_status ON tb_status.status_id = tb_workload_formlist.status
            WHERE 
                tb_set_assessorlist.workload_group_id = ?`
    db.query(sql, [workload_group_id], callback)
  },

  selectWorkloadFormGroup: (WorkloadFormDetail, as_u_id, round_id, callback) => {
    const workload_group_id = WorkloadFormDetail
    const sql = `
            UPDATE tb_set_assessorlist AS t1
            JOIN (
                SELECT set_asses_list_id 
                FROM tb_set_assessorlist 
                WHERE as_u_id = ? AND round_list_id = ? 
                LIMIT 1
            ) AS t2 ON t1.set_asses_list_id = t2.set_asses_list_id
            SET t1.workload_group_id = ?;
        `
    db.query(sql, [as_u_id, round_id, workload_group_id], callback)
  },

  getAllFormList: (callback) => {
    const sql = `
            SELECT
                tb_workload_formlist.formlist_id,
                tb_status.status_name,
                tb_workload_group.workload_group_name,
                tb_prefix.prefix_name,
                tb_users.u_fname,
                tb_users.u_lname,
                tb_set_roundlist.round_list_name,
                tb_set_roundlist.round,
                tb_set_roundlist.year
            FROM
                tb_workload_formlist
            LEFT JOIN tb_set_assessorlist ON tb_workload_formlist.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
            LEFT JOIN tb_status ON tb_status.status_id = tb_workload_formlist.status_id
            LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
            LEFT JOIN tb_users ON tb_set_assessorlist.as_u_id = tb_users.u_id
            LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
            LEFT JOIN tb_set_roundlist ON tb_set_assessorlist.round_list_id =tb_set_roundlist.round_list_id
            `
    db.query(sql, callback)
  },

  // Updated to use tb_workload_link_info instead of link columns from tb_workload_form_info
  getAllFormInfo: (callback) => {
    const sql = `
                SELECT
                    tb_subtask.subtask_name,
                    tb_task.task_name,
                    tb_workload_form_info.as_u_id,
                    tb_users.u_fname,
                    tb_users.u_lname,
                    tb_prefix.prefix_name,
                    tb_workload_form_info.formlist_id,
                    tb_workload_form_info.form_id,
                    tb_workload_form_info.form_title,
                    tb_workload_form_info.description,
                    tb_workload_form_info.workload,
                    tb_workload_form_info.quality,
                    tb_workload_form_info.file_type,
                    tb_workload_form_info.ex_score,
                    GROUP_CONCAT(tb_workload_link_info.link_name SEPARATOR ', ') AS link_names,
                    GROUP_CONCAT(tb_workload_link_info.link_path SEPARATOR ', ') AS links
                FROM
                    tb_workload_form_info
                LEFT JOIN tb_subtask ON tb_subtask.subtask_id = tb_workload_form_info.subtask_id
                LEFT JOIN tb_task ON tb_subtask.task_id = tb_task.task_id
                LEFT JOIN tb_users ON tb_users.u_id = tb_workload_form_info.as_u_id
                LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
                LEFT JOIN tb_workload_formlist ON tb_workload_form_info.formlist_id = tb_workload_formlist.formlist_id
                LEFT JOIN tb_workload_link_info ON tb_workload_form_info.form_id = tb_workload_link_info.form_id
                GROUP BY tb_workload_form_info.form_id;
        `
    db.query(sql, callback)
  },

  // Updated to use tb_workload_link_info instead of link columns from tb_workload_form_info
  getOneFormInfo: (formlist_id, subtask_id, callback) => {
    const sql = `
            SELECT
                tb_subtask.subtask_name,
                tb_task.task_name,
                tb_workload_form_info.as_u_id,
                tb_users.u_fname,
                tb_users.u_lname,
                tb_prefix.prefix_name,
                tb_workload_form_info.formlist_id,
                tb_workload_form_info.form_title,
                tb_workload_form_info.description,
                tb_workload_form_info.workload,
                tb_workload_form_info.quality,
                tb_workload_form_info.file_type,
                tb_workload_form_info.ex_score,
                tb_workload_form_info.form_id,
                tb_workload_link_info.link_id,
                tb_workload_link_info.link_name,
                tb_workload_link_info.link_path
            FROM
                tb_workload_form_info
            LEFT JOIN tb_subtask ON tb_subtask.subtask_id = tb_workload_form_info.subtask_id
            LEFT JOIN tb_task ON tb_subtask.task_id = tb_task.task_id
            LEFT JOIN tb_users ON tb_users.u_id = tb_workload_form_info.as_u_id
            LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
            LEFT JOIN tb_workload_formlist ON tb_workload_form_info.formlist_id = tb_workload_formlist.formlist_id
            LEFT JOIN tb_workload_link_info ON tb_workload_form_info.form_id = tb_workload_link_info.form_id
            WHERE tb_workload_form_info.formlist_id = ? AND tb_workload_form_info.subtask_id = ?
            ORDER BY tb_workload_form_info.as_u_id`
    db.query(sql, [formlist_id, subtask_id], callback)
  },

  getFilesRound: (formlist_id, callback) => {
    const sql = `
            SELECT
                tb_workload_file_info.form_id AS form_id1,
                tb_workload_file_info.file_name,
                tb_workload_file_info.size,
                tb_workload_file_info.fileinfo_id,
                tb_workload_form_info.formlist_id,
                tb_workload_file_info.fileinfo_id,
                tb_workload_file_info.file_name,
                tb_workload_file_info.size
            FROM
                tb_workload_form_info
            LEFT JOIN tb_workload_formlist ON tb_workload_formlist.formlist_id = tb_workload_form_info.formlist_id
            LEFT JOIN tb_workload_file_info ON tb_workload_form_info.form_id = tb_workload_file_info.form_id
            WHERE tb_workload_form_info.formlist_id = ?
                `
    db.query(sql, [formlist_id], callback)
  },

  getFilesByFormId: (form_id, callback) => {
    const sql = `
            SELECT
                file_name,
                size,
                form_id
            FROM
                tb_workload_file_info
            WHERE
                form_id = ?`
    db.query(sql, [form_id], callback)
  },

  addFormInfo: (WorkloadFormInfoDetail, callback) => {
    const { link, link_name, ...formData } = WorkloadFormInfoDetail
    const sql = "INSERT INTO tb_workload_form_info SET ?"
    db.query(sql, formData, callback)
  },

  addLinkInfo: (linkData, callback) => {
    if (!linkData || linkData.length === 0) {
      return callback(null, { affectedRows: 0 })
    }

    const sql = "INSERT INTO tb_workload_link_info (form_id, link_name, link_path) VALUES ?"
    const values = linkData.map((link) => [link.form_id, link.link_name, link.link_path])
    db.query(sql, [values], callback)
  },

  addFileInfo: (fileData, callback) => {
    const sql = "INSERT INTO tb_workload_file_info (form_id, file_name, size) VALUES ?"
    const values = fileData.map((file) => [file.form_id, file.file_name, file.size])
    db.query(sql, [values], callback)
  },

  deleteFormInfo: (form_id, callback) => {
    const sql = "DELETE FROM tb_workload_form_info WHERE form_id = ?"
    db.query(sql, [form_id], callback)
  },

  getFormDetail: (form_id, callback) => {
    const sql = `
    SELECT
      tb_workload_file_info.fileinfo_id,
      tb_workload_file_info.file_name,
      tb_workload_file_info.size,
      tb_workload_form_info.form_id,
      tb_workload_form_info.as_u_id,
      tb_workload_form_info.formlist_id,
      tb_workload_form_info.form_title,
      tb_workload_form_info.description,
      tb_workload_form_info.workload,
      tb_workload_form_info.quality,
      tb_workload_form_info.file_type,
      tb_workload_form_info.subtask_id,
      tb_workload_form_info.ex_score,
      tb_workload_link_info.link_id,
      tb_workload_link_info.link_name,
      tb_workload_link_info.link_path
    FROM
      tb_workload_form_info
      LEFT JOIN tb_workload_file_info ON tb_workload_form_info.form_id = tb_workload_file_info.form_id
      LEFT JOIN tb_workload_link_info ON tb_workload_form_info.form_id = tb_workload_link_info.form_id
    WHERE
      tb_workload_form_info.form_id = ?`
    db.query(sql, [form_id], callback)
  },

  // เพิ่มฟังก์ชันนี้ใน WorkloadForm model
  getLinksByFormId: (form_id, callback) => {
    const sql = `
    SELECT
      link_id,
      link_name,
      link_path,
      form_id
    FROM
      tb_workload_link_info
    WHERE
      form_id = ?`
    db.query(sql, [form_id], callback)
  },

  updateFormInfo: (WorkloadFormInfoDetail, callback) => {
    const { link, link_name, ...formData } = WorkloadFormInfoDetail
    const sql = "UPDATE tb_workload_form_info SET ? WHERE form_id = ?"
    db.query(sql, [formData, formData.form_id], callback)
  },

  updateLinkInfo: (linkData, callback) => {
    const sql = "UPDATE tb_workload_link_info SET ? WHERE link_id = ?"
    db.query(sql, [linkData, linkData.link_id], callback)
  },

  deleteLinkById: (link_id, callback) => {
    const sql = "DELETE FROM tb_workload_link_info WHERE link_id = ?"
    db.query(sql, [link_id], callback)
  },
  deleteUnselectedLinks: (form_id, existingLinkIds, callback) => {
    let sql
    let params

    console.log("Delete unselected links - form_id:", form_id, "existingLinkIds:", existingLinkIds)

    // If existingLinkIds is empty, we should NOT delete all links
    if (!existingLinkIds || existingLinkIds.length === 0) {
      console.log("No existing link IDs provided, skipping deletion")
      return callback(null, { affectedRows: 0 })
    }

    sql = "DELETE FROM tb_workload_link_info WHERE form_id = ? AND link_id NOT IN (?)"
    params = [form_id, existingLinkIds]

    db.query(sql, params, callback)
  },

  deleteUnselectedFiles: (form_id, existingFileIds, callback) => {
    let sql
    let params

    console.log("Delete unselected files - form_id:", form_id, "existingFileIds:", existingFileIds)

    // If existingFileIds is empty, we should NOT delete all files
    if (!existingFileIds || existingFileIds.length === 0) {
      console.log("No existing file IDs provided, skipping deletion")
      return callback(null, { affectedRows: 0 })
    }

    sql = "DELETE FROM tb_workload_file_info WHERE form_id = ? AND fileinfo_id NOT IN (?)"
    params = [form_id, existingFileIds]

    db.query(sql, params, callback)
  },

  getFilesToDelete: (form_id, existingFileIds, callback) => {
    let sql
    let params

    console.log("Get files to delete - form_id:", form_id, "existingFileIds:", existingFileIds)

    if (existingFileIds && existingFileIds.length > 0) {
      sql = "SELECT fileinfo_id, file_name FROM tb_workload_file_info WHERE form_id = ? AND fileinfo_id NOT IN (?)"
      params = [form_id, existingFileIds]
    } else {
      sql = "SELECT fileinfo_id, file_name FROM tb_workload_file_info WHERE form_id = ?"
      params = [form_id]
    }

    db.query(sql, params, callback)
  },

  getFilesByIds: (fileIds, callback) => {
    if (!fileIds || fileIds.length === 0) {
      return callback(null, [])
    }

    const sql = "SELECT fileinfo_id, file_name, size, form_id FROM tb_workload_file_info WHERE fileinfo_id IN (?)"
    db.query(sql, [fileIds], callback)
  },

  deleteFilesByIds: (fileIds, callback) => {
    if (!fileIds || fileIds.length === 0) {
      return callback(null, { affectedRows: 0 })
    }

    console.log("Deleting files with IDs:", fileIds)
    const sql = "DELETE FROM tb_workload_file_info WHERE fileinfo_id IN (?)"
    db.query(sql, [fileIds], callback)
  },

  // เช็ค status ของ workload form
  checkWorkloadFormStatus: (as_u_id, round_list_id, callback) => {
    const sql = `
      SELECT 
        tb_workload_formlist.status,
        tb_workload_formlist.formlist_id,
        tb_set_assessorlist.as_u_id,
        tb_set_assessorlist.round_list_id
      FROM tb_workload_formlist
      LEFT JOIN tb_set_assessorlist ON tb_workload_formlist.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
      WHERE tb_set_assessorlist.as_u_id = ? AND tb_set_assessorlist.round_list_id = ?
      LIMIT 1
    `;
    db.query(sql, [as_u_id, round_list_id], callback);
  },

  // ดึงข้อมูลภาระงานตามโครงสร้าง tb_task → tb_subtask → form_info เฉพาะ user
  getWorkloadItemsByGroup: (as_u_id, round_list_id, callback) => {
    try {
      // ดึงข้อมูลแบบ JOIN เพื่อได้ task, subtask names, หลักฐาน และข้อมูลจำนวนชั่วโมงที่ต้องการ
      const sql = `
        SELECT 
          t.task_id,
          t.task_name,
          st.subtask_id,
          st.subtask_name,
          fi.form_id,
          fi.form_title,
          fi.description,
          fi.workload,
          fi.quality,
          fi.file_type,
          fi.ex_score,
          fi.as_u_id,
          fli.link_name,
          fli.link_path,
          ffi.file_name,
          ffi.fileinfo_id,
          sal.workload_group_id,
          wg.workload_group_name,
          qw.quantity_workload_hours
        FROM tb_workload_form_info fi
        LEFT JOIN tb_subtask st ON fi.subtask_id = st.subtask_id
        LEFT JOIN tb_task t ON st.task_id = t.task_id
        LEFT JOIN tb_workload_link_info fli ON fi.form_id = fli.form_id
        LEFT JOIN tb_workload_file_info ffi ON fi.form_id = ffi.form_id
        LEFT JOIN tb_workload_formlist wfl ON fi.formlist_id = wfl.formlist_id
        LEFT JOIN tb_set_assessorlist sal ON wfl.set_asses_list_id = sal.set_asses_list_id
        LEFT JOIN tb_workload_group wg ON sal.workload_group_id = wg.workload_group_id
        LEFT JOIN tb_quantity_workload qw ON t.task_id = qw.task_id AND sal.workload_group_id = qw.workload_group_id
        WHERE sal.as_u_id = ? AND sal.round_list_id = ?
        ORDER BY t.task_id, st.subtask_id, fi.form_id, ffi.fileinfo_id, fli.link_id
      `;
      console.log('Executing simple query with params:', [as_u_id, round_list_id]);
      
      // ตรวจสอบ database connection
      if (!db) {
        console.error('Database connection is null');
        return callback(new Error('Database connection is null'), null);
      }
      
      console.log('📊 Executing query with params:', { as_u_id, round_list_id });
      db.query(sql, [as_u_id, round_list_id], (error, result) => {
        if (error) {
          console.error('❌ SQL Error:', error);
          console.error('❌ SQL Query:', sql);
          console.error('❌ Parameters:', [as_u_id, round_list_id]);
          console.error('❌ Error Code:', error.code);
          console.error('❌ Error SQL State:', error.sqlState);
        } else {
          console.log('✅ Query successful, found records:', result ? result.length : 0);
          if (result && result.length > 0) {
            console.log('✅ First record:', result[0]);
          } else {
            console.log('⚠️ No records found for user:', as_u_id, 'round:', round_list_id);
          }
        }
        callback(error, result);
      });
    } catch (err) {
      console.error('Model function error:', err);
      callback(err, null);
    }
  },

  // อัปเดต status ใน tb_workload_formlist
  updateWorkloadFormStatus: (set_asses_list_id, status, callback) => {
    const sql = "UPDATE tb_workload_formlist SET status = ? WHERE set_asses_list_id = ?";
    db.query(sql, [status, set_asses_list_id], callback);
  },

  // อัปเดต status แบบ array ใน tb_workload_formlist
  updateWorkloadFormStatusBulk: (set_asses_list_ids, status, callback) => {
    if (!Array.isArray(set_asses_list_ids) || set_asses_list_ids.length === 0) {
      return callback(null, { affectedRows: 0 });
    }
    
    const sql = "UPDATE tb_workload_formlist SET status = ? WHERE set_asses_list_id IN (?)";
    db.query(sql, [status, set_asses_list_ids], callback);
  },

  // ตรวจสอบสถานะการประเมินของ assessor
  getAssessorEvaluationStatus: (set_asses_list_id, callback) => {
    const sql = `
      SELECT 
        sal.workload_group_id,
        wfl.status as form_status,
        CASE 
          WHEN wfl.status = 1 THEN 'completed'
          WHEN sal.workload_group_id IS NULL THEN 'not_started'
          WHEN sal.workload_group_id IS NOT NULL AND wfl.status = 0 THEN 'in_progress'
          WHEN EXISTS (
            SELECT 1 FROM tb_workload_form_info wfi 
            WHERE wfi.formlist_id = wfl.formlist_id 
            AND wfi.as_u_id = sal.as_u_id
          ) THEN 'in_progress'
          ELSE 'not_started'
        END as evaluation_status
      FROM tb_set_assessorlist sal
      LEFT JOIN tb_workload_formlist wfl ON sal.set_asses_list_id = wfl.set_asses_list_id
      WHERE sal.set_asses_list_id = ?
    `;
    db.query(sql, [set_asses_list_id], callback);
  },

  // ดึง set_asses_list_id จาก user_id และ round_list_id
  getSetAssessorListIdByUserAndRound: (user_id, round_list_id, callback) => {
    const sql = `
      SELECT set_asses_list_id 
      FROM tb_set_assessorlist 
      WHERE as_u_id = ? AND round_list_id = ?`;
    db.query(sql, [user_id, round_list_id], callback);
  },

  // ========== SNAPSHOT FUNCTIONS ==========
  
  // สร้าง snapshot ของฟอร์มที่ส่งแล้ว
  createFormSnapshot: (formlist_id, as_u_id, round_list_id, callback) => {
    const sql = `
      INSERT INTO snapshot_workload_form (formlist_id, as_u_id, round_list_id, status)
      VALUES (?, ?, ?, 1)`;
    db.query(sql, [formlist_id, as_u_id, round_list_id], callback);
  },

  // ลบ snapshot เก่า (ถ้ามี)
  deleteExistingSnapshot: (formlist_id, as_u_id, round_list_id, callback) => {
    const sql = `
      DELETE FROM snapshot_workload_form 
      WHERE formlist_id = ? AND as_u_id = ? AND round_list_id = ?`;
    db.query(sql, [formlist_id, as_u_id, round_list_id], callback);
  },

  // คัดลอกข้อมูลฟอร์มไปยัง snapshot
  copyFormInfoToSnapshot: (snapshot_id, formlist_id, callback) => {
    const sql = `
      INSERT INTO snapshot_workload_form_info 
      (snapshot_id, task_id, subtask_id, original_form_id, form_id, form_title, description, workload, quality, file_type, ex_score)
      SELECT 
        ?,
        st.task_id,
        wfi.subtask_id,
        wfi.form_id AS original_form_id,
        wfi.form_id AS form_id,
        wfi.form_title,
        wfi.description,
        wfi.workload,
        wfi.quality,
        wfi.file_type,
        wfi.ex_score
      FROM tb_workload_form_info wfi
      INNER JOIN tb_subtask st ON st.subtask_id = wfi.subtask_id
      WHERE wfi.formlist_id = ?`;
    db.query(sql, [snapshot_id, formlist_id], callback);
  },

  // คัดลอกข้อมูล task (พร้อม quantity) ไปยัง snapshot
  copyTasksToSnapshot: (snapshot_id, formlist_id, callback) => {
    const sql = `
      INSERT INTO snapshot_workload_task 
      (snapshot_id, task_id, task_name, quantity_workload_hours, workload_group_id, workload_group_name)
      SELECT 
        ?,
        t.task_id,
        t.task_name,
        q.quantity_workload_hours,
        wg.workload_group_id,
        wg.workload_group_name
      FROM tb_task t
      INNER JOIN tb_workload_formlist fl ON fl.formlist_id = ?
      INNER JOIN tb_set_assessorlist sal ON sal.set_asses_list_id = fl.set_asses_list_id
      LEFT JOIN tb_quantity_workload q ON q.task_id = t.task_id AND q.workload_group_id = sal.workload_group_id
      LEFT JOIN tb_workload_group wg ON wg.workload_group_id = sal.workload_group_id
      ORDER BY t.task_id`;
    db.query(sql, [snapshot_id, formlist_id], callback);
  },

  // คัดลอกข้อมูล subtask ของ task แต่ละอันไปยัง snapshot
  copySubtasksToSnapshot: (snapshot_id, callback) => {
    const sql = `
      INSERT INTO snapshot_workload_subtask 
      (snapshot_id, task_id, subtask_id, subtask_name)
      SELECT 
        ?,
        st.task_id,
        st.subtask_id,
        st.subtask_name
      FROM tb_subtask st
      INNER JOIN snapshot_workload_task swt 
        ON swt.snapshot_id = ? AND swt.task_id = st.task_id
      ORDER BY st.task_id, st.subtask_id`;
    db.query(sql, [snapshot_id, snapshot_id], callback);
  },

  // คัดลอกไฟล์ไปยัง snapshot
  copyFilesToSnapshot: (snapshot_id, callback) => {
    const sql = `
      INSERT INTO snapshot_workload_file_info 
      (snapshot_form_id, file_name, file_path, file_size, file_type)
      SELECT 
        sfs.snapshot_form_id,
        f.file_name,
        CONCAT('/files/', f.file_name) as file_path,
        f.size as file_size,
        'file' as file_type
      FROM tb_workload_file_info f
      INNER JOIN snapshot_workload_form_info sfs ON f.form_id = sfs.original_form_id
      WHERE sfs.snapshot_id = ?`;
    db.query(sql, [snapshot_id], callback);
  },

  // คัดลอกลิงก์ไปยัง snapshot
  copyLinksToSnapshot: (snapshot_id, callback) => {
    const sql = `
      INSERT INTO snapshot_workload_link_info 
      (snapshot_form_id, link_name, link_path)
      SELECT 
        sfs.snapshot_form_id,
        l.link_name,
        LEFT(l.link_path, 2000)
      FROM tb_workload_link_info l
      INNER JOIN snapshot_workload_form_info sfs ON l.form_id = sfs.original_form_id
      WHERE sfs.snapshot_id = ?`;
    db.query(sql, [snapshot_id], callback);
  },

  // ดึงข้อมูลฟอร์มจาก snapshot (สำหรับ status = 1)
  getFormInfoFromSnapshot: (formlist_id, as_u_id, callback) => {
    const sql = `
      SELECT 
        sfs.snapshot_form_id as form_id,
        sfs.subtask_id,
        sfs.form_title,
        sfs.description,
        sfs.workload,
        sfs.quality,
        sfs.file_type,
        sfs.ex_score,
        st.subtask_name,
        t.task_name,
        u.u_fname,
        u.u_lname,
        p.prefix_name,
        sfs.snapshot_id
      FROM snapshot_workload_form s
      INNER JOIN snapshot_workload_form_info sfs ON s.snapshot_id = sfs.snapshot_id
      INNER JOIN tb_subtask st ON sfs.subtask_id = st.subtask_id
      INNER JOIN tb_task t ON st.task_id = t.task_id
      INNER JOIN tb_users u ON s.as_u_id = u.u_id
      INNER JOIN tb_prefix p ON u.prefix_id = p.prefix_id
      WHERE s.formlist_id = ? AND s.as_u_id = ? AND s.status = 1
      ORDER BY sfs.snapshot_form_id`;
    db.query(sql, [formlist_id, as_u_id], callback);
  },

  // ดึงไฟล์จาก snapshot
  getFilesFromSnapshot: (snapshot_form_id, callback) => {
    const sql = `
      SELECT 
        snapshot_file_id as fileinfo_id,
        file_name,
        file_path,
        file_size,
        file_type
      FROM snapshot_workload_file_info 
      WHERE snapshot_form_id = ?`;
    db.query(sql, [snapshot_form_id], callback);
  },

  // ดึงลิงก์จาก snapshot
  getLinksFromSnapshot: (snapshot_form_id, callback) => {
    const sql = `
      SELECT 
        snapshot_link_id as link_id,
        link_name,
        link_path
      FROM snapshot_workload_link_info 
      WHERE snapshot_form_id = ?`;
    db.query(sql, [snapshot_form_id], callback);
  },

  // ตรวจสอบว่ามี snapshot หรือไม่
  checkSnapshotExists: (formlist_id, as_u_id, round_list_id, callback) => {
    const sql = `
      SELECT snapshot_id 
      FROM snapshot_workload_form 
      WHERE formlist_id = ? AND as_u_id = ? AND round_list_id = ? AND status = 1`;
    db.query(sql, [formlist_id, as_u_id, round_list_id], callback);
  },

  // ดึงข้อมูลฟอร์มทั้งหมดจาก snapshot (ไม่จำกัด subtask_id)
  getAllFormInfoFromSnapshot: (formlist_id, as_u_id, callback) => {
    const sql = `
      SELECT 
        sf.original_form_id as form_id,
        sf.subtask_id,
        st.task_id,
        st.task_name,
        sst.subtask_name,
        st.workload_group_id,
        st.workload_group_name,
        st.quantity_workload_hours,
        sf.form_title,
        sf.description,
        sf.workload,
        sf.quality,
        sf.file_type,
        sf.ex_score,
        COALESCE(GROUP_CONCAT(DISTINCT f.file_name SEPARATOR ', '), '') as files,
        COALESCE(GROUP_CONCAT(DISTINCT CONCAT(l.link_name, '|', l.link_path) SEPARATOR ', '), '') as links
      FROM snapshot_workload_form_info sf
      INNER JOIN snapshot_workload_form swf ON sf.snapshot_id = swf.snapshot_id
      INNER JOIN snapshot_workload_task st ON st.snapshot_id = sf.snapshot_id AND st.task_id = sf.task_id
      INNER JOIN snapshot_workload_subtask sst ON sst.snapshot_id = sf.snapshot_id AND sst.task_id = sf.task_id AND sst.subtask_id = sf.subtask_id
      LEFT JOIN snapshot_workload_file_info f ON f.snapshot_form_id = sf.snapshot_form_id
      LEFT JOIN snapshot_workload_link_info l ON l.snapshot_form_id = sf.snapshot_form_id
      WHERE swf.formlist_id = ? AND swf.as_u_id = ?
      GROUP BY sf.snapshot_form_id, sf.original_form_id, sf.subtask_id, st.task_id, st.task_name, sst.subtask_name, st.workload_group_id, st.workload_group_name, st.quantity_workload_hours, sf.form_title, sf.description, sf.workload, sf.quality, sf.file_type, sf.ex_score
      ORDER BY st.task_id, sf.subtask_id, sf.original_form_id`;
    db.query(sql, [formlist_id, as_u_id], callback);
  },

  // ดึง formlist_id จาก as_u_id และ round_list_id
  getFormlistId: (as_u_id, round_list_id, callback) => {
    const sql = `
      SELECT f.formlist_id, f.set_asses_list_id, f.status
      FROM tb_workload_formlist f
      INNER JOIN tb_set_assessorlist s ON f.set_asses_list_id = s.set_asses_list_id
      WHERE s.as_u_id = ? AND s.round_list_id = ?`;
    db.query(sql, [as_u_id, round_list_id], callback);
  },
}

module.exports = WorkloadForm
