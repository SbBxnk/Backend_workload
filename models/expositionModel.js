
const db = require('../config')();

const ExPosition = {

    getAllExPosition: (params, callback) => {
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'ex_position_id', 
            order = 'asc' 
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE ex_position_name LIKE '%${search}%'`;
        }
        
        // Build order clause
        const validSortFields = ['ex_position_id', 'ex_position_name'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'ex_position_id';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_ex_position 
            ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT 
                ex_position_id,
                ex_position_name
            FROM tb_ex_position 
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
    getOneExPosition: (ex_position_id, callback) => {
        const sql = "SELECT * FROM tb_ex_position WHERE ex_position_id = ?";
        db.query(sql, [ex_position_id], callback);
    },

    addExPosition: (ExPositionDetail, callback) => {
        const sql = "INSERT INTO tb_ex_position SET ?";
        db.query(sql, ExPositionDetail, callback);
    },

    deleteExPosition: (ex_position_id, callback) => {
        const sql = "DELETE FROM tb_ex_position WHERE `tb_ex_position`.`ex_position_id` = ?"
        db.query(sql, [ex_position_id], callback)
    },

    updateExPosition: (ex_position_id, ExPositionDetail, callback) => {
        const { ex_position_name } = ExPositionDetail;
        const sql = `UPDATE tb_ex_position 
                     SET ex_position_name = ?
                     WHERE ex_position_id = ?`;
        db.query(sql, [ex_position_name, ex_position_id], callback)
    },

}

module.exports = ExPosition