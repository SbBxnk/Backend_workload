const { deleteRoundlist } = require('../controllers/set_assessorController');

const db = require('../config')();

const Assessor = {
    // รรอบประเมิน
    getAllRoundlist: (params, callback) => {
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'date_save', 
            order = 'desc',
            year = ''
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        let searchCondition = '';
        const conditions = [];
        
        // Admin API - แสดงรอบทั้งหมด (ไม่มีเงื่อนไข date_start)
        
        if (search) {
            conditions.push(`(round_list_name LIKE '%${search}%' OR year LIKE '%${search}%')`);
        }
        
        if (year) {
            conditions.push(`year = '${year}'`);
        }
        
        searchCondition = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const validSortFields = ['round_list_id', 'round_list_name', 'date_start', 'date_end', 'date_save', 'year', 'round'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'date_save';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';
        
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_set_roundlist 
            ${searchCondition}
        `;
        
        const dataSql = `
            SELECT
                round_list_id,
                round_list_name,
                date_start,
                date_end,
                round,
                date_save,
                year,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM tb_workload_formlist wfl
                        LEFT JOIN tb_set_assessorlist sal ON wfl.set_asses_list_id = sal.set_asses_list_id
                        WHERE sal.round_list_id = tb_set_roundlist.round_list_id 
                        AND wfl.status = 1
                    ) THEN 1
                    ELSE 0
                END as has_completed_forms
            FROM tb_set_roundlist
            ${searchCondition}
            ORDER BY year DESC, round DESC, ${sortField} ${sortOrder}
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
    getOneRoundlist: (round_list_id, callback) => {
        const sql = `
            SELECT
                round_list_id,
                round_list_name,
                date_start,
                date_end,
                round,
                date_save,
                year
            FROM 
                tb_set_roundlist
            WHERE round_list_id = ?`;
        db.query(sql, [round_list_id], callback);
    },

    // User API - แสดงเฉพาะรอบที่ตรงกับวันที่ปัจจุบัน
    checkround: (params, callback) => {
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'date_save', 
            order = 'desc',
            year = ''
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        let searchCondition = '';
        const conditions = [];
        
        // User API - แสดงเฉพาะรอบที่เริ่มต้นแล้ว (date_start <= CURDATE())
        conditions.push(`date_start <= CURDATE()`);
        
        if (search) {
            conditions.push(`(round_list_name LIKE '%${search}%' OR year LIKE '%${search}%')`);
        }
        
        if (year) {
            conditions.push(`year = '${year}'`);
        }
        
        searchCondition = `WHERE ${conditions.join(' AND ')}`;
        
        const validSortFields = ['round_list_id', 'round_list_name', 'date_start', 'date_end', 'date_save', 'year', 'round'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'date_save';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';
        
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_set_roundlist 
            ${searchCondition}
        `;
        
        const dataSql = `
            SELECT
                round_list_id,
                round_list_name,
                date_start,
                date_end,
                round,
                date_save,
                year,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM tb_workload_formlist wfl
                        LEFT JOIN tb_set_assessorlist sal ON wfl.set_asses_list_id = sal.set_asses_list_id
                        WHERE sal.round_list_id = tb_set_roundlist.round_list_id 
                        AND wfl.status = 1
                    ) THEN 1
                    ELSE 0
                END as has_completed_forms
            FROM tb_set_roundlist
            ${searchCondition}
            ORDER BY year DESC, round DESC, ${sortField} ${sortOrder}
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

    addRoundlist: (roundDetail, callback) => {
        const sql = "INSERT INTO tb_set_roundlist SET ?";
        db.query(sql, roundDetail, callback);
    },

    deleteRoundlist: (round_list_id, callback) => {
        const sql = "DELETE FROM tb_set_roundlist WHERE round_list_id = ?";
        db.query(sql, [round_list_id], callback);
    },

    updateRoundlist: (round_list_id, roundDetail, callback) => {
        const { round_list_name, date_start, date_end, round, year } = roundDetail;
        const sql = `UPDATE 
                        tb_set_roundlist
                    SET 
                        round_list_name = ?,
                        date_start = ?,
                        date_end = ?,
                        round = ?,
                        year = ?
                    WHERE round_list_id = ?`;
        db.query(sql, [round_list_name, date_start, date_end, round, year, round_list_id], callback);
    },


    // รายละเอียดในรายการรอบประเมิน
    getAllsetAssesorList: (callback) => {
        const sql = `SELECT * FROM tb_set_assessorlist
        `;
        db.query(sql, callback);
    },

    getOnesetAssesorList: (params, callback) => {
        const { 
            round_list_id,
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'date_save', 
            order = 'desc',
            ex_position_name = ''
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        // Build search condition
        let searchCondition = '';
        const conditions = [`tb_set_assessorlist.round_list_id = ?`];
        
        if (search) {
            conditions.push(`(
                tb_users.u_fname LIKE '%${search}%' OR 
                tb_users.u_lname LIKE '%${search}%' OR 
                tb_users.u_id_card LIKE '%${search}%' OR
                tb_prefix.prefix_name LIKE '%${search}%' OR
                tb_ex_position.ex_position_name LIKE '%${search}%' OR
                tb_workload_group.workload_group_name LIKE '%${search}%'
            )`);
        }
        
        if (ex_position_name) {
            conditions.push(`tb_ex_position.ex_position_name = '${ex_position_name}'`);
        }
        
        if (conditions.length > 0) {
            searchCondition = `WHERE ${conditions.join(' AND ')}`;
        }
        
        // Build order clause
        const validSortFields = ['set_asses_list_id', 'as_u_id', 'u_fname', 'u_lname', 'ex_position_name', 'workload_group_name', 'date_save'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'date_save';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_set_assessorlist
            LEFT JOIN tb_users ON tb_set_assessorlist.as_u_id = tb_users.u_id
            LEFT JOIN tb_set_roundlist ON tb_set_assessorlist.round_list_id = tb_set_roundlist.round_list_id
            LEFT JOIN tb_prefix ON tb_prefix.prefix_id = tb_users.prefix_id
            LEFT JOIN tb_ex_position ON tb_ex_position.ex_position_id = tb_users.ex_position_id
            LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
            ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT 
                set_asses_list_id,
                tb_set_assessorlist.round_list_id,
                tb_set_assessorlist.as_u_id,
                tb_prefix.prefix_name,
                tb_users.u_fname,
                tb_users.u_lname,
                tb_users.u_img,
                tb_users.u_id_card,
                tb_ex_position.ex_position_name,
                tb_set_assessorlist.workload_group_id,
                tb_workload_group.workload_group_name,
                tb_set_assessorlist.date_save
            FROM 
                tb_set_assessorlist
            LEFT JOIN tb_users ON tb_set_assessorlist.as_u_id = tb_users.u_id
            LEFT JOIN tb_set_roundlist ON tb_set_assessorlist.round_list_id = tb_set_roundlist.round_list_id
            LEFT JOIN tb_prefix ON tb_prefix.prefix_id = tb_users.prefix_id
            LEFT JOIN tb_ex_position ON tb_ex_position.ex_position_id = tb_users.ex_position_id
            LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
            ${searchCondition}
            ORDER BY ${sortField} ${sortOrder}
            LIMIT ? OFFSET ?
        `;
        
        // Execute count query first
        db.query(countSql, [round_list_id], (error, countResult) => {
            if (error) {
                return callback(error, null);
            }
            
            const totalRows = countResult[0].total;
            const totalPages = Math.ceil(totalRows / limit);
            
            // Execute data query
            db.query(dataSql, [round_list_id, limit, offset], (error, dataResult) => {
                if (error) {
                    return callback(error, null);
                }
                
                const result = {
                    data: dataResult,
                    meta: {
                        limit: parseInt(limit),
                        page: parseInt(page),
                        sort: sort,
                        total_rows: totalRows,
                        total_pages: totalPages
                    }
                };
                
                callback(null, result);
            });
        });
    },
    //     SELECT
    //     tb_users.u_lname,
    //     tb_users.u_fname,
    //     tb_prefix.prefix_name,
    //     tb_set_roundlist.round_list_name,
    //     tb_workload_group.workload_group_name
    //   FROM
    //     tb_set_assessorlist
    //     LEFT JOIN tb_users ON tb_set_assessorlist.as_u_id = tb_users.u_id
    //     LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
    //     LEFT JOIN tb_set_roundlist ON tb_set_roundlist.round_list_id =
    //         tb_set_assessorlist.round_list_id
    //     LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id =
    //         tb_workload_group.workload_group_id

    addSetAssessorList: (SetAssessorListDetail, callback) => {
        const sql = "INSERT INTO tb_set_assessorlist SET ?";
        db.query(sql, SetAssessorListDetail, callback);
    },

    findAsUserByID: (as_u_id, round_list_id, callback) => {
        const sql = "SELECT * FROM tb_set_assessorlist WHERE as_u_id = ? AND round_list_id = ?";
        db.query(sql, [as_u_id, round_list_id], callback);
    },

    deleteSetAssessorList: (as_u_id, callback) => {
        const sql = "DELETE FROM tb_set_assessorlist WHERE set_asses_list_id = ?";
        db.query(sql, [as_u_id], callback);
    },

    // รายละเอียดในรายการผู้ตรวจประเมิน

    getOnesetAssesorInfo: (set_asses_list_id, params, callback) => {
        const { search = '', limit = 10, page = 1, sort = 'date_save', order = 'desc', ex_position_name = '' } = params;
        
        // Build search condition
        let searchCondition = '';
        const conditions = [];
        
        if (search.trim()) {
            conditions.push(`(
                tb_prefix.prefix_name LIKE ? OR 
                tb_users.u_fname LIKE ? OR 
                tb_users.u_lname LIKE ? OR 
                tb_users.u_id_card LIKE ? OR 
                tb_ex_position.ex_position_name LIKE ?
            )`);
        }
        
        if (ex_position_name.trim()) {
            conditions.push(`tb_ex_position.ex_position_name = ?`);
        }
        
        if (conditions.length > 0) {
            searchCondition = `AND ${conditions.join(' AND ')}`;
        }
        
        // Build order clause
        const validSortFields = ['set_asses_info_id', 'ex_u_id', 'u_fname', 'u_lname', 'ex_position_name', 'date_save'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'date_save';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_set_assessorinfo
            LEFT JOIN tb_users ON tb_set_assessorinfo.ex_u_id = tb_users.u_id
            LEFT JOIN tb_prefix ON tb_prefix.prefix_id = tb_users.prefix_id
            LEFT JOIN tb_ex_position ON tb_ex_position.ex_position_id = tb_users.ex_position_id
            LEFT JOIN tb_set_assessorlist ON tb_set_assessorinfo.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
            WHERE tb_set_assessorinfo.set_asses_list_id = ? ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT
                tb_set_assessorlist.set_asses_list_id,
                tb_set_assessorinfo.set_asses_info_id,
                tb_set_assessorinfo.ex_u_id,
                tb_prefix.prefix_name,
                tb_users.u_fname,
                tb_users.u_img,
                tb_users.u_lname,
                tb_users.u_id_card,
                tb_ex_position.ex_position_name,
                tb_set_assessorinfo.date_save
            FROM 
                tb_set_assessorinfo
            LEFT JOIN tb_users ON tb_set_assessorinfo.ex_u_id = tb_users.u_id
            LEFT JOIN tb_prefix ON tb_prefix.prefix_id = tb_users.prefix_id
            LEFT JOIN tb_ex_position ON tb_ex_position.ex_position_id = tb_users.ex_position_id
            LEFT JOIN tb_set_assessorlist ON tb_set_assessorinfo.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
            WHERE tb_set_assessorinfo.set_asses_list_id = ? ${searchCondition}
            ORDER BY ${sortField} ${sortOrder}
            LIMIT ? OFFSET ?
        `;
        
        const offset = (page - 1) * limit;
        const searchPattern = `%${search}%`;
        
        // Execute count query
        const countParams = [set_asses_list_id];
        if (search.trim()) {
            countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }
        if (ex_position_name.trim()) {
            countParams.push(ex_position_name);
        }
        
        db.query(countSql, countParams, (error, countResult) => {
            if (error) {
                return callback(error, null);
            }
            
            const total = countResult[0].total;
            
            // Execute data query
            const dataParams = [set_asses_list_id];
            if (search.trim()) {
                dataParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
            }
            if (ex_position_name.trim()) {
                dataParams.push(ex_position_name);
            }
            dataParams.push(limit, offset);
            
            db.query(dataSql, dataParams, (error, result) => {
                if (error) {
                    return callback(error, null);
                }
                
                callback(null, {
                    data: result,
                    meta: {
                        total_rows: total,
                        page: page,
                        limit: limit,
                        total_pages: Math.ceil(total / limit)
                    }
                });
            });
        });
    },

    addSetAssessorInfo: (SetAssessorInfoDetail, callback) => {
        const sql = "INSERT INTO tb_set_assessorinfo SET ?";
        db.query(sql, SetAssessorInfoDetail, callback);
    },
    deleteSetAssessorInfo: (set_asses_info_id, callback) => {
        const sql = "DELETE FROM tb_set_assessorinfo WHERE set_asses_info_id = ?";
        db.query(sql, [set_asses_info_id], callback);
    },


    findExUserByID: (ex_u_id, set_asses_list_id, callback) => {
        const sql = "SELECT * FROM tb_set_assessorinfo WHERE ex_u_id = ? AND set_asses_list_id = ?";
        db.query(sql, [ex_u_id, set_asses_list_id], callback);
    },
    findListId: (set_asses_list_id, callback) => {
        const sql = "SELECT * FROM tb_set_assessorlist WHERE set_asses_list_id = ?";
        db.query(sql, [set_asses_list_id], callback);
    },

    // ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึงรอบนี้หรือไม่
    checkUserAccessToRound: (as_u_id, round_list_id, callback) => {
        const sql = `
            SELECT 
                tb_set_assessorlist.set_asses_list_id,
                tb_set_assessorlist.as_u_id,
                tb_set_assessorlist.round_list_id,
                tb_set_assessorinfo.ex_u_id
            FROM tb_set_assessorlist
            LEFT JOIN tb_set_assessorinfo ON tb_set_assessorlist.set_asses_list_id = tb_set_assessorinfo.set_asses_list_id
            WHERE tb_set_assessorlist.as_u_id = ? AND tb_set_assessorlist.round_list_id = ?
        `;
        db.query(sql, [as_u_id, round_list_id], callback);
    },



    // findExIdAssessorList: (set_asses_list_id, callback) => {
    //     const sql = "SELECT ex_u_id FROM tb_set_assessorlist WHERE set_asses_list_id = ?";
    //     db.query(sql, [set_asses_list_id], callback);
    // },

    getAssessorOfCurrentYear: (round_list_id, callback) => {
        const sql = `
                SELECT
                    tb_set_assessorlist.round_list_id,
                    tb_set_assessorinfo.set_asses_list_id,
                    tb_set_assessorinfo.ex_u_id,
                    tb_users.u_fname AS as_u_fname,
                    tb_users.u_lname As as_u_lname,
                    tb_set_assessorlist.as_u_id,
                    tb_users1.u_fname AS ex_u_fname,
                    tb_users1.u_lname AS ex_u_lname,
                    tb_prefix.prefix_name,
                    tb_set_roundlist.round_list_name,
                    tb_set_roundlist.round,
                    tb_set_roundlist.year,
                    tb_set_roundlist.date_start,
                    tb_set_roundlist.date_end
               
                FROM
                    tb_set_roundlist
                LEFT JOIN tb_set_assessorlist ON tb_set_roundlist.round_list_id = tb_set_assessorlist.round_list_id
                LEFT JOIN tb_set_assessorinfo ON tb_set_assessorlist.set_asses_list_id = tb_set_assessorinfo.set_asses_list_id
                LEFT JOIN tb_users ON tb_set_assessorinfo.ex_u_id = tb_users.u_id
                LEFT JOIN tb_prefix ON tb_prefix.prefix_id = tb_users.prefix_id
                LEFT JOIN tb_users tb_users1 ON tb_users1.u_id = tb_set_assessorlist.as_u_id 
                AND tb_users1.prefix_id = tb_prefix.prefix_id
                WHERE tb_set_assessorlist.round_list_id = ?
              `
        db.query(sql, [round_list_id], callback)
    },
    checkExId: (ex_u_id, callback) => {
        const sql = `SELECT 
                        tb_set_assessorinfo.set_asses_info_id,
                        tb_set_assessorinfo.set_asses_list_id,
                        tb_set_assessorlist.round_list_id,
                        tb_set_assessorlist.as_u_id,
                        tb_set_roundlist.date_start,
                        tb_set_roundlist.date_end
                    FROM tb_set_assessorinfo
                    LEFT JOIN tb_set_assessorlist ON tb_set_assessorinfo.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
                    LEFT JOIN tb_set_roundlist ON tb_set_assessorlist.round_list_id = tb_set_roundlist.round_list_id
                    WHERE tb_set_assessorinfo.ex_u_id = ?
                    AND tb_set_roundlist.date_start <= CURDATE()
                    AND tb_set_roundlist.date_end >= CURDATE()`
        
        console.log('🔍 Backend Model - checkExId SQL:', sql)
        console.log('🔍 Backend Model - checkExId parameters:', [ex_u_id])
        
        db.query(sql, [ex_u_id], (error, result) => {
            if (error) {
                console.error('❌ Backend Model - SQL error:', error)
            } else {
                console.log('📊 Backend Model - SQL result:', result)
            }
            callback(error, result)
        })
    },
    getAssignedExaminees: (round_list_id, ex_u_id, callback) => {
        const sql = `
                    SELECT
                        assessor.u_id AS assessor_id,
                        assessor_prefix.prefix_name AS assessor_prefix_name,
                        assessor.u_fname AS assessor_fname,
                        assessor.u_lname AS assessor_lname,
                        assessor.u_id_card AS assessor_id_card,
                        assessor.u_img AS assessor_img,
                        assessor_position.position_name AS assessor_position_name,
                        tb_workload_group.workload_group_name,

                        examinee.u_id AS examinee_id,
                        examinee_prefix.prefix_name AS examinee_prefix_name,
                        examinee.u_fname AS examinee_fname,
                        examinee.u_lname AS examinee_lname,
                        examinee.u_id_card AS examinee_id_card,
                        examinee.u_img AS examinee_img,
                        examinee_position.position_name AS examinee_position_name,

                        tb_set_roundlist.round_list_id,
                        tb_set_roundlist.round_list_name,
                        tb_set_roundlist.round,
                        tb_set_roundlist.year,
                        tb_set_roundlist.date_start,
                        tb_set_roundlist.date_end,
                        tb_set_assessorinfo.set_asses_list_id

                    FROM tb_set_roundlist
                    LEFT JOIN tb_set_assessorlist ON tb_set_roundlist.round_list_id = tb_set_assessorlist.round_list_id
                    LEFT JOIN tb_set_assessorinfo ON tb_set_assessorlist.set_asses_list_id = tb_set_assessorinfo.set_asses_list_id
                    LEFT JOIN tb_users AS assessor ON tb_set_assessorlist.as_u_id = assessor.u_id
                    LEFT JOIN tb_users AS examinee ON tb_set_assessorinfo.ex_u_id = examinee.u_id
                    LEFT JOIN tb_prefix AS assessor_prefix ON assessor.prefix_id = assessor_prefix.prefix_id
                    LEFT JOIN tb_prefix AS examinee_prefix ON examinee.prefix_id = examinee_prefix.prefix_id
                    LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
                    LEFT JOIN tb_position AS assessor_position ON assessor.position_id = assessor_position.position_id
                    LEFT JOIN tb_position AS examinee_position ON examinee.position_id = examinee_position.position_id
                    WHERE tb_set_roundlist.round_list_id = ? AND tb_set_assessorinfo.ex_u_id = ?;
                    `
        db.query(sql, [round_list_id, ex_u_id], callback)
    },

    // ดึงข้อมูลผู้ถูกประเมินจาก set_asses_list_id
    getAssesseeBySetAssesListId: (set_asses_list_id, callback) => {
        const sql = `
            SELECT 
                tb_set_assessorlist.set_asses_list_id,
                tb_set_assessorlist.as_u_id,
                tb_prefix.prefix_name,
                tb_users.u_fname,
                tb_users.u_lname,
                tb_users.u_img,
                tb_users.u_id_card,
                tb_ex_position.ex_position_name,
                tb_set_assessorlist.workload_group_id,
                tb_workload_group.workload_group_name,
                tb_set_assessorlist.date_save
            FROM 
                tb_set_assessorlist
            LEFT JOIN tb_users ON tb_set_assessorlist.as_u_id = tb_users.u_id
            LEFT JOIN tb_prefix ON tb_prefix.prefix_id = tb_users.prefix_id
            LEFT JOIN tb_ex_position ON tb_ex_position.ex_position_id = tb_users.ex_position_id
            LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
            WHERE tb_set_assessorlist.set_asses_list_id = ?`;
        db.query(sql, [set_asses_list_id], callback);
    },

    // ดึงรายการการประเมินสำหรับผู้ตรวจประเมิน (ex_u_id)
    getAssessorEvaluations: (ex_u_id, callback) => {
        const sql = `
            SELECT 
                tb_set_assessorinfo.set_asses_info_id,
                tb_set_assessorinfo.set_asses_list_id,
                tb_set_assessorinfo.ex_u_id,
                tb_set_assessorlist.as_u_id,
                tb_set_assessorlist.round_list_id,
                tb_set_roundlist.round_list_name,
                tb_set_roundlist.round,
                tb_set_roundlist.year,
                tb_set_roundlist.date_start,
                tb_set_roundlist.date_end,
                tb_prefix.prefix_name,
                tb_users.u_fname,
                tb_users.u_lname,
                tb_users.u_img,
                tb_users.u_id_card,
                tb_ex_position.ex_position_name,
                tb_workload_group.workload_group_name,
                tb_set_assessorinfo.date_save
            FROM 
                tb_set_assessorinfo
            LEFT JOIN tb_set_assessorlist ON tb_set_assessorinfo.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
            LEFT JOIN tb_set_roundlist ON tb_set_assessorlist.round_list_id = tb_set_roundlist.round_list_id
            LEFT JOIN tb_users ON tb_set_assessorlist.as_u_id = tb_users.u_id
            LEFT JOIN tb_prefix ON tb_prefix.prefix_id = tb_users.prefix_id
            LEFT JOIN tb_ex_position ON tb_ex_position.ex_position_id = tb_users.ex_position_id
            LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
            WHERE tb_set_assessorinfo.ex_u_id = ?
            AND tb_set_roundlist.date_start <= CURDATE()
            AND tb_set_roundlist.date_end >= CURDATE()
            ORDER BY tb_set_roundlist.year DESC, tb_set_roundlist.round DESC`;
        db.query(sql, [ex_u_id], callback);
    },

    // ดึงรอบการประเมินสำหรับผู้ตรวจประเมิน (ex_u_id)
    getAssessorRounds: (ex_u_id, callback) => {
        const sql = `
            SELECT DISTINCT
                tb_set_roundlist.round_list_id,
                tb_set_roundlist.round_list_name,
                tb_set_roundlist.round,
                tb_set_roundlist.year,
                tb_set_roundlist.date_start,
                tb_set_roundlist.date_end,
                COUNT(tb_set_assessorinfo.set_asses_info_id) as total_assessees
            FROM 
                tb_set_assessorinfo
            LEFT JOIN tb_set_assessorlist ON tb_set_assessorinfo.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
            LEFT JOIN tb_set_roundlist ON tb_set_assessorlist.round_list_id = tb_set_roundlist.round_list_id
            WHERE tb_set_assessorinfo.ex_u_id = ?
            AND tb_set_roundlist.date_start <= CURDATE()
            AND tb_set_roundlist.date_end >= CURDATE()
            GROUP BY tb_set_roundlist.round_list_id, tb_set_roundlist.round_list_name, tb_set_roundlist.round, tb_set_roundlist.year, tb_set_roundlist.date_start, tb_set_roundlist.date_end
            ORDER BY tb_set_roundlist.year DESC, tb_set_roundlist.round DESC`;
        db.query(sql, [ex_u_id], callback);
    },

    // ดึงรายการผู้ใช้ที่ต้องตรวจในรอบการประเมินเฉพาะ
    getAssesseesByRound: (ex_u_id, round_list_id, callback) => {
        const sql = `
            SELECT 
                tb_set_assessorinfo.set_asses_info_id,
                tb_set_assessorinfo.set_asses_list_id,
                tb_set_assessorinfo.ex_u_id,
                tb_set_assessorlist.as_u_id,
                tb_set_assessorlist.round_list_id,
                tb_set_roundlist.round_list_name,
                tb_set_roundlist.round,
                tb_set_roundlist.year,
                tb_set_roundlist.date_start,
                tb_set_roundlist.date_end,
                tb_prefix.prefix_name,
                tb_users.u_fname,
                tb_users.u_lname,
                tb_users.u_img,
                tb_users.u_id_card,
                tb_ex_position.ex_position_name,
                tb_workload_group.workload_group_name,
                tb_set_assessorinfo.date_save
            FROM 
                tb_set_assessorinfo
            LEFT JOIN tb_set_assessorlist ON tb_set_assessorinfo.set_asses_list_id = tb_set_assessorlist.set_asses_list_id
            LEFT JOIN tb_set_roundlist ON tb_set_assessorlist.round_list_id = tb_set_roundlist.round_list_id
            LEFT JOIN tb_users ON tb_set_assessorlist.as_u_id = tb_users.u_id
            LEFT JOIN tb_prefix ON tb_prefix.prefix_id = tb_users.prefix_id
            LEFT JOIN tb_ex_position ON tb_ex_position.ex_position_id = tb_users.ex_position_id
            LEFT JOIN tb_workload_group ON tb_set_assessorlist.workload_group_id = tb_workload_group.workload_group_id
            WHERE tb_set_assessorinfo.ex_u_id = ?
            AND tb_set_assessorlist.round_list_id = ?
            ORDER BY tb_users.u_fname, tb_users.u_lname`;
        db.query(sql, [ex_u_id, round_list_id], callback);
    },

    // อัปเดต status ใน tb_workload_formlist ผ่าน tb_set_assessorlist
    updateAssessorStatus: (round_list_id, as_u_id, callback) => {
        // ตรวจสอบข้อมูลก่อนอัปเดต
        const checkSql = `
            SELECT 
                tb_set_assessorlist.set_asses_list_id,
                tb_set_assessorlist.round_list_id,
                tb_set_assessorlist.as_u_id,
                tb_workload_formlist.formlist_id,
                tb_workload_formlist.status
            FROM tb_set_assessorlist 
            LEFT JOIN tb_workload_formlist ON tb_set_assessorlist.set_asses_list_id = tb_workload_formlist.set_asses_list_id
            WHERE tb_set_assessorlist.round_list_id = ? AND tb_set_assessorlist.as_u_id = ?`;
        
        db.query(checkSql, [round_list_id, as_u_id], (checkError, checkResult) => {
            if (checkError) {
                return callback(checkError, null);
            }
            
            if (!checkResult || checkResult.length === 0) {
                return callback(null, { affectedRows: 0, message: "No data found" });
            }
            
            // อัปเดตข้อมูลใน tb_workload_formlist
            const updateSql = `
                UPDATE tb_workload_formlist 
                SET status = 1 
                WHERE set_asses_list_id IN (
                    SELECT set_asses_list_id 
                    FROM tb_set_assessorlist 
                    WHERE round_list_id = ? AND as_u_id = ?
                )`;
            
            db.query(updateSql, [round_list_id, as_u_id], (error, result) => {
                callback(error, result);
            });
        });
    },

};

module.exports = Assessor;
