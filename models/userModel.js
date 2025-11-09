const db = require('../config')();;

const LoginRegis = {
    GetAllUser: (params, callback) => {
        let sql = `SELECT 
                    u_id, gender, prefix_name, u_fname, u_lname, age, salary, u_email, level_name, u_id_card, u_tel, position_name, ex_position_name, branch_name, course_name, type_p_name, u_img, work_start, 
                    tb_users.date_save
                FROM tb_users 
                LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
                LEFT JOIN tb_level ON tb_users.level_id = tb_level.level_id
                LEFT JOIN tb_ex_position ON tb_users.ex_position_id = tb_ex_position.ex_position_id
                LEFT JOIN tb_position ON tb_users.position_id = tb_position.position_id
                LEFT JOIN tb_personal_type ON tb_users.type_p_id = tb_personal_type.type_p_id
                LEFT JOIN tb_course ON tb_users.course_id = tb_course.course_id
                LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
                WHERE tb_users.level_id != 2`;
        
        const conditions = [];
        const values = [];
        
        // Search by name, branch, course, id card, email
        if (params.search) {
            conditions.push(`(
                CONCAT(tb_prefix.prefix_name, tb_users.u_fname, ' ', tb_users.u_lname) LIKE ? OR 
                tb_users.u_fname LIKE ? OR 
                tb_users.u_lname LIKE ? OR
                tb_branch.branch_name LIKE ? OR
                tb_course.course_name LIKE ? OR
                tb_users.u_id_card LIKE ? OR
                tb_users.u_email LIKE ?
            )`);
            const searchTerm = `%${params.search}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Filter by position
        if (params.position_name) {
            conditions.push(`tb_position.position_name = ?`);
            values.push(params.position_name);
        }
        
        // Filter by branch
        if (params.branch_name) {
            conditions.push(`tb_branch.branch_name = ?`);
            values.push(params.branch_name);
        }
        
        // Filter by course
        if (params.course_name) {
            conditions.push(`tb_course.course_name = ?`);
            values.push(params.course_name);
        }
        
        // Filter by ex_position (administrative position)
        if (params.ex_position_name) {
            conditions.push(`tb_ex_position.ex_position_name = ?`);
            values.push(params.ex_position_name);
        }
        
        // Filter by gender
        if (params.gender) {
            conditions.push(`tb_users.gender = ?`);
            values.push(params.gender);
        }
        
        // Filter by level
        if (params.level_name) {
            conditions.push(`tb_level.level_name = ?`);
            values.push(params.level_name);
        }
        
        if (conditions.length > 0) {
            sql += ` AND ${conditions.join(' AND ')}`;
        }
        
        // Add sorting
        if (params.sort && params.order) {
            const validSortFields = ['u_fname', 'u_lname', 'position_name', 'ex_position_name', 'branch_name', 'course_name', 'level_name', 'u_email', 'u_tel', 'age', 'salary'];
            if (validSortFields.includes(params.sort)) {
                sql += ` ORDER BY ${params.sort} ${params.order.toUpperCase()}`;
            }
        } else {
            sql += ` ORDER BY tb_users.u_fname ASC`;
        }
        
        // Add pagination
        if (params.limit && params.page) {
            const offset = (params.page - 1) * params.limit;
            sql += ` LIMIT ${params.limit} OFFSET ${offset}`;
        }
        
        db.query(sql, values, callback);
    },

    // Get all users for export (without pagination)
    GetAllUserForExport: (params, callback) => {
        let sql = `SELECT 
                    u_id, gender, prefix_name, u_fname, u_lname, age, salary, u_email, level_name, u_id_card, u_tel, position_name, ex_position_name, branch_name, course_name, type_p_name, u_img, work_start, 
                    tb_users.date_save
                FROM tb_users 
                LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
                LEFT JOIN tb_level ON tb_users.level_id = tb_level.level_id
                LEFT JOIN tb_ex_position ON tb_users.ex_position_id = tb_ex_position.ex_position_id
                LEFT JOIN tb_position ON tb_users.position_id = tb_position.position_id
                LEFT JOIN tb_personal_type ON tb_users.type_p_id = tb_personal_type.type_p_id
                LEFT JOIN tb_course ON tb_users.course_id = tb_course.course_id
                LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
                WHERE tb_users.level_id != 2`;
        
        const conditions = [];
        const values = [];
        
        // Search by name, branch, course, id card, email
        if (params.search) {
            conditions.push(`(
                CONCAT(tb_prefix.prefix_name, tb_users.u_fname, ' ', tb_users.u_lname) LIKE ? OR 
                tb_users.u_fname LIKE ? OR 
                tb_users.u_lname LIKE ? OR
                tb_branch.branch_name LIKE ? OR
                tb_course.course_name LIKE ? OR
                tb_users.u_id_card LIKE ? OR
                tb_users.u_email LIKE ?
            )`);
            const searchTerm = `%${params.search}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Filter by position
        if (params.position_name) {
            conditions.push(`tb_position.position_name = ?`);
            values.push(params.position_name);
        }
        
        // Filter by branch
        if (params.branch_name) {
            conditions.push(`tb_branch.branch_name = ?`);
            values.push(params.branch_name);
        }
        
        // Filter by course
        if (params.course_name) {
            conditions.push(`tb_course.course_name = ?`);
            values.push(params.course_name);
        }
        
        // Filter by ex_position (administrative position)
        if (params.ex_position_name) {
            conditions.push(`tb_ex_position.ex_position_name = ?`);
            values.push(params.ex_position_name);
        }
        
        // Filter by gender
        if (params.gender) {
            conditions.push(`tb_users.gender = ?`);
            values.push(params.gender);
        }
        
        // Filter by level
        if (params.level_name) {
            conditions.push(`tb_level.level_name = ?`);
            values.push(params.level_name);
        }
        
        if (conditions.length > 0) {
            sql += ` AND ${conditions.join(' AND ')}`;
        }
        
        // Add sorting
        if (params.sort && params.order) {
            const validSortFields = ['u_fname', 'u_lname', 'position_name', 'ex_position_name', 'branch_name', 'course_name', 'level_name', 'u_email', 'u_tel', 'age', 'salary'];
            if (validSortFields.includes(params.sort)) {
                sql += ` ORDER BY ${params.sort} ${params.order.toUpperCase()}`;
            }
        } else {
            sql += ` ORDER BY tb_users.u_fname ASC`;
        }
        
        // No pagination for export
        db.query(sql, values, callback);
    },

    // Get total count for pagination
    GetAllUserCount: (params, callback) => {
        let sql = `SELECT COUNT(*) as total
                FROM tb_users 
                LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
                LEFT JOIN tb_level ON tb_users.level_id = tb_level.level_id
                LEFT JOIN tb_ex_position ON tb_users.ex_position_id = tb_ex_position.ex_position_id
                LEFT JOIN tb_position ON tb_users.position_id = tb_position.position_id
                LEFT JOIN tb_personal_type ON tb_users.type_p_id = tb_personal_type.type_p_id
                LEFT JOIN tb_course ON tb_users.course_id = tb_course.course_id
                LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
                WHERE tb_users.level_id != 2`;
        
        const conditions = [];
        const values = [];
        
        // Search by name, branch, course, id card, email
        if (params.search) {
            conditions.push(`(
                CONCAT(tb_prefix.prefix_name, tb_users.u_fname, ' ', tb_users.u_lname) LIKE ? OR 
                tb_users.u_fname LIKE ? OR 
                tb_users.u_lname LIKE ? OR
                tb_branch.branch_name LIKE ? OR
                tb_course.course_name LIKE ? OR
                tb_users.u_id_card LIKE ? OR
                tb_users.u_email LIKE ?
            )`);
            const searchTerm = `%${params.search}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Filter by position
        if (params.position_name) {
            conditions.push(`tb_position.position_name = ?`);
            values.push(params.position_name);
        }
        
        // Filter by branch
        if (params.branch_name) {
            conditions.push(`tb_branch.branch_name = ?`);
            values.push(params.branch_name);
        }
        
        // Filter by course
        if (params.course_name) {
            conditions.push(`tb_course.course_name = ?`);
            values.push(params.course_name);
        }
        
        // Filter by ex_position (administrative position)
        if (params.ex_position_name) {
            conditions.push(`tb_ex_position.ex_position_name = ?`);
            values.push(params.ex_position_name);
        }
        
        // Filter by gender
        if (params.gender) {
            conditions.push(`tb_users.gender = ?`);
            values.push(params.gender);
        }
        
        if (conditions.length > 0) {
            sql += ` AND ${conditions.join(' AND ')}`;
        }
        
        db.query(sql, values, callback);
    },


    // ดึงรายชื่อที่มีตำแหน่งบริหาร (สำหรับแต่งตั้งผู้ประเมิน)
    GetAllExUser: (set_asses_list_id, callback) => {
        const sql = `SELECT 
                    u.u_id, u.gender, p.prefix_name, u.u_fname, u.u_lname, u.age, u.salary, 
                    u.u_email, l.level_name, u.u_id_card, u.u_tel, pos.position_name, 
                    ex.ex_position_name, b.branch_name, c.course_name, pt.type_p_name, 
                    u.u_img, u.work_start, u.date_save
                FROM tb_users u
                LEFT JOIN tb_prefix p ON u.prefix_id = p.prefix_id
                LEFT JOIN tb_level l ON u.level_id = l.level_id
                LEFT JOIN tb_ex_position ex ON u.ex_position_id = ex.ex_position_id
                LEFT JOIN tb_position pos ON u.position_id = pos.position_id
                LEFT JOIN tb_personal_type pt ON u.type_p_id = pt.type_p_id
                LEFT JOIN tb_course c ON u.course_id = c.course_id
                LEFT JOIN tb_branch b ON c.branch_id = b.branch_id
                WHERE u.ex_position_id NOT IN (0, 1)
                AND u.ex_position_id IS NOT NULL
                AND u.u_id NOT IN (
                    SELECT ex_u_id 
                    FROM tb_set_assessorinfo 
                    WHERE set_asses_list_id = ?
                )
                AND u.u_id NOT IN (
                    SELECT as_u_id 
                    FROM tb_set_assessorlist 
                    WHERE set_asses_list_id = ?
                )`
        db.query(sql, [set_asses_list_id, set_asses_list_id], callback)
    },


    // ดึงรายชื่อที่ไม่มีตำแหน่งบริหาร (สำหรับแต่งตั้งผู้ประเมิน)
    GetAllAsUser: (round_list_id, callback) => {
        const sql = `
         SELECT 
              u.u_id, 
              u.gender,
              p.prefix_name, 
              u.u_fname, 
              u.u_lname,
              u.age, 
              u.salary,
              u.u_email, 
              l.level_name, 
              u.u_id_card, 
              u.u_tel, 
              pos.position_name, 
              ex.ex_position_name, 
              b.branch_name,
              c.course_name, 
              pt.type_p_name,
              u.u_img,
              u.work_start, 
              u.date_save
          FROM tb_users u
          LEFT JOIN tb_prefix p ON u.prefix_id = p.prefix_id
          LEFT JOIN tb_level l ON u.level_id = l.level_id
          LEFT JOIN tb_ex_position ex ON u.ex_position_id = ex.ex_position_id
          LEFT JOIN tb_position pos ON u.position_id = pos.position_id
          LEFT JOIN tb_personal_type pt ON u.type_p_id = pt.type_p_id
          LEFT JOIN tb_course c ON u.course_id = c.course_id
          LEFT JOIN tb_branch b ON c.branch_id = b.branch_id
          WHERE u.level_id != 2
          AND u.u_id NOT IN (
              SELECT as_u_id
              FROM tb_set_assessorlist
              WHERE round_list_id = ?
          )
      `
        db.query(sql, [round_list_id], callback)
    },



    GetOneUser: (u_id, callback) => {
        const sql = `SELECT 
                        u_id, gender,prefix_name, u_fname, u_lname,age, salary,u_email, level_name, u_id_card, u_tel, position_name, ex_position_name, branch_name,course_name, type_p_name,u_img, tb_users.date_save ,work_start
                    FROM tb_users 
                    LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
                    LEFT JOIN tb_level ON tb_users.level_id = tb_level.level_id
                    LEFT JOIN tb_ex_position ON tb_users.ex_position_id = tb_ex_position.ex_position_id
                    LEFT JOIN tb_position ON tb_users.position_id = tb_position.position_id
                    LEFT JOIN tb_personal_type ON tb_users.type_p_id = tb_personal_type.type_p_id
                    LEFT JOIN tb_course ON tb_users.course_id = tb_course.course_id
                    LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
                    WHERE u_id = ?`;
        db.query(sql, [u_id], callback);
    },

    RegisterUser: (UserDetail, callback) => {
        const sql = "INSERT INTO tb_users SET ?";
        db.query(sql, UserDetail, callback);
    },

    findUserByEmail: (u_email, callback) => {
        const sql = "SELECT u_id, u_fname, u_lname FROM tb_users WHERE u_email = ?";
        db.query(sql, [u_email], callback);
    },
    findUserByIDcard: (u_id_card, callback) => {
        const sql = "SELECT u_id FROM tb_users WHERE u_id_card = ?";
        db.query(sql, [u_id_card], callback);
    },

    UpdateUser: (u_id, userDetails, callback) => {
        const { u_email, u_fname, u_lname, u_id_card, u_tel, prefix_id, level_id, position_id, ex_position_id, course_id, type_p_id, u_img, gender, age, salary, work_start } = userDetails;
        
        const sql = `UPDATE tb_users 
                        SET u_email = ?,
                            u_fname = ?,
                            u_lname = ?, 
                            u_id_card = ?, 
                            u_tel = ?,
                            prefix_id = ?,
                            level_id = ?,
                            position_id = ?,
                            ex_position_id = ?,
                            course_id = ?,
                            type_p_id = ?,
                            u_img = ?,
                            gender = ?,
                            age = ?,
                            salary = ?,
                            work_start = ?
                     WHERE u_id = ?`;
        
        const values = [u_email, u_fname, u_lname, u_id_card, u_tel, prefix_id, level_id, position_id, ex_position_id, course_id, type_p_id, u_img, gender, age, salary, work_start, u_id];
        
        db.query(sql, values, callback);
    },

    // Update User Profile (ไม่รวม u_pass)
    UpdateUserProfile: (u_id, userDetails, callback) => {
        const { u_email, u_fname, u_lname, u_id_card, u_tel, prefix_id, level_id, position_id, ex_position_id, course_id, type_p_id, u_img, gender, age, salary, work_start } = userDetails;
        const sql = `UPDATE tb_users 
                        SET u_email = ?,
                            u_fname = ?,
                            u_lname = ?, 
                            u_id_card = ?, 
                            u_tel = ?,
                            prefix_id = ?,
                            level_id = ?,
                            position_id = ?,
                            ex_position_id = ?,
                            course_id = ?,
                            type_p_id = ?,
                            u_img = ?,
                            gender = ?,
                            age = ?,
                            salary = ?,
                            work_start = ?
                     WHERE u_id = ?`;
        db.query(sql, [u_email, u_fname, u_lname, u_id_card, u_tel, prefix_id, level_id, position_id, ex_position_id, course_id, type_p_id, u_img, gender, age, salary, work_start, u_id], callback)
    },

    LoginUser: (u_email, callback) => {
        const sql = `
            SELECT
                tb_users.u_id,
                tb_users.u_email, 
                tb_users.u_pass, 
                tb_level.level_name,
                tb_level.level_id,
                tb_prefix.prefix_name,
                tb_prefix.prefix_id,
                tb_users.u_fname, 
                tb_users.u_lname, 
                tb_users.u_id_card, 
                tb_users.u_tel, 
                tb_position.position_name,
                tb_position.position_id,
                tb_ex_position.ex_position_name,
                tb_ex_position.ex_position_id,
                tb_course.course_name,
                tb_course.course_id,
                tb_branch.branch_name,
                tb_branch.branch_id,
                tb_personal_type.type_p_name,
                tb_personal_type.type_p_id,
                tb_users.u_img,
                tb_users.gender,
                tb_users.salary,
                tb_users.age,
                tb_users.work_start
            FROM tb_users
            LEFT JOIN tb_prefix ON tb_users.prefix_id = tb_prefix.prefix_id
            LEFT JOIN tb_level ON tb_users.level_id = tb_level.level_id
            LEFT JOIN tb_position ON tb_users.position_id = tb_position.position_id
            LEFT JOIN tb_ex_position ON tb_users.ex_position_id = tb_ex_position.ex_position_id
            LEFT JOIN tb_course ON tb_users.course_id = tb_course.course_id
            LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
            LEFT JOIN tb_personal_type ON tb_users.type_p_id = tb_personal_type.type_p_id
            WHERE tb_users.u_email = ?`;
        db.query(sql, [u_email], callback);
    },
    CountAllBranch: (callback) => {
        const sql = `SELECT COUNT(*) AS total
                         FROM tb_users u
                         LEFT JOIN tb_course c ON u.course_id = c.course_id 
                         LEFT JOIN tb_branch b ON c.branch_id = b.branch_id`;
        db.query(sql, callback);
    },
    CountOneBranch: (branch_id, callback) => {
        const sql = `SELECT branch_name,COUNT(*) AS total
                         FROM tb_users u
                         LEFT JOIN tb_course c ON u.course_id = c.course_id 
                         LEFT JOIN tb_branch b ON c.branch_id = b.branch_id
                         WHERE b.branch_id = ?`;
        db.query(sql, [branch_id], callback);
    },
    CountGroupBranch: (callback) => {
        const sql = `SELECT b.branch_name, 
                     IFNULL(COUNT(u.u_id), 0) AS total
                     FROM tb_branch b
                     LEFT JOIN tb_course c ON c.branch_id = b.branch_id
                     LEFT JOIN tb_users u ON u.course_id = c.course_id
                     GROUP BY b.branch_id, b.branch_name;`;
        db.query(sql, callback);
    },

    // Reset Password Functions
    saveResetToken: (u_email, resetToken, resetTokenExpiry, callback) => {
        const sql = "UPDATE tb_users SET resetToken = ?, resetTokenExpiry = ? WHERE u_email = ?";
        db.query(sql, [resetToken, resetTokenExpiry, u_email], callback);
    },

    findUserByResetToken: (token, callback) => {
        const sql = "SELECT * FROM tb_users WHERE resetToken = ? AND resetTokenExpiry > ?";
        db.query(sql, [token, Date.now()], callback);
    },

    updatePassword: (u_id, hashedPassword, callback) => {
        const sql = "UPDATE tb_users SET u_pass = ? WHERE u_id = ?";
        db.query(sql, [hashedPassword, u_id], callback);
    },

    clearResetToken: (u_id, callback) => {
        const sql = "UPDATE tb_users SET resetToken = NULL, resetTokenExpiry = NULL WHERE u_id = ?";
        db.query(sql, [u_id], callback);
    },

    DeleteUser: (u_id, callback) => {
        const sql = "DELETE FROM tb_users WHERE u_id = ?";
        db.query(sql, [u_id], callback);
    },

};

module.exports = LoginRegis;
