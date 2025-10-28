const db = require('../config')();

const Branch = {

    getAllBranch: (params, callback) => {
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'branch_id', 
            order = 'asc' 
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE branch_name LIKE '%${search}%'`;
        }
        
        // Build order clause
        const validSortFields = ['branch_id', 'branch_name'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'branch_id';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_branch 
            ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT 
                branch_id,
                branch_name
            FROM tb_branch 
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

    getOneBranch: (branch_id, callback) => {
        const sql = "SELECT * FROM tb_branch WHERE branch_id = ?";
        db.query(sql, [branch_id], callback);
    },

    addBranch: (BranchDetail, callback) => {
        const sql = "INSERT INTO tb_branch SET ?";
        db.query(sql, BranchDetail, callback);
    },

    deleteBranch: (branch_id, callback) => {
        const sql = "DELETE FROM tb_branch WHERE branch_id = ?";
        db.query(sql, [branch_id], callback);
    },

    updateBranch: (branch_id, BranchDetail, callback) => {
        const { branch_name } = BranchDetail;
        const sql = "UPDATE tb_branch SET branch_name = ? WHERE branch_id = ?";
        db.query(sql, [branch_name, branch_id], callback);
    },

};

module.exports = Branch;
