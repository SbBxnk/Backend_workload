const db = require('../config')();

const Course = {

    getAllCourse: (params, callback) => {
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'course_id', 
            order = 'asc' 
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE course_name LIKE '%${search}%' OR branch_name LIKE '%${search}%'`;
        }
        
        // Build order clause
        const validSortFields = ['course_id', 'course_name', 'branch_name'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'course_id';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_course
            LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
            ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT 
                course_id,
                course_name,
                branch_name,
                tb_course.branch_id
            FROM tb_course
            LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
            ${searchCondition}
            ORDER BY ${sortField} ${sortOrder}
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

    getCourseByBranch: (branch_id, callback) => {
        const sql = `
          SELECT 
            course_id,
            course_name,
            branch_name
          FROM 
            tb_course
          LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
          WHERE tb_course.branch_id = ?`;  // กรองตาม branch_id 
        db.query(sql, [branch_id], callback);
    },

    getOneCourse: (course_id, callback) => {
        const sql = "SELECT * FROM tb_course WHERE course_id = ?";
        db.query(sql, [course_id], callback);
    },

    addCourse: (CourseDetail, callback) => {
        const sql = "INSERT INTO tb_course SET ?";
        db.query(sql, CourseDetail, callback);
    },

    deleteCourse: (course_id, callback) => {
        const sql = "DELETE FROM tb_course WHERE course_id = ?";
        db.query(sql, [course_id], callback);
    },

    updateCourse: (course_id, CourseDetail, callback) => {
        const { course_name, branch_id } = CourseDetail;
        const sql = "UPDATE tb_course SET course_name = ? , branch_id = ? WHERE course_id = ?";
        db.query(sql, [course_name, branch_id, course_id], callback);
    },

    getAllCoursesSimple: (callback) => {
        const sql = `
            SELECT 
                course_id,
                course_name,
                branch_name,
                tb_course.branch_id
            FROM tb_course
            LEFT JOIN tb_branch ON tb_course.branch_id = tb_branch.branch_id
            ORDER BY course_name ASC
        `;
        db.query(sql, callback);
    }

};

module.exports = Course;
