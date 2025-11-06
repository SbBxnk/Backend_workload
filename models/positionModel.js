
const db = require('../config')();

const Position = {

    getAllPosition: (params, callback) => {
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'position_id', 
            order = 'asc' 
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE position_name LIKE '%${search}%'`;
        }
        
        // Build order clause
        const validSortFields = ['position_id', 'position_name'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'position_id';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_position 
            ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT 
                position_id,
                position_name,
                position_short_name
            FROM tb_position 
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
    getOnePosition: (position_id, callback) => {
        const sql = "SELECT * FROM tb_position WHERE position_id = ?";
        db.query(sql, [position_id], callback);
    },

    addPosition: (PositionDetail, callback) => {
        const sql = "INSERT INTO tb_position SET ?";
        db.query(sql, PositionDetail, callback);
    },

    deletePosition: (position_id, callback) => {
        const sql = "DELETE FROM tb_position WHERE `tb_position`.`position_id` = ?"
        db.query(sql, [position_id], callback)
    },

    updatePosition: (position_id, PositionDetail, callback) => {
        const { position_name, position_short_name } = PositionDetail;
        const sql = `UPDATE tb_position 
                     SET position_name = ?,
                         position_short_name = ?
                     WHERE position_id = ?`;
        db.query(sql, [position_name, position_short_name || null, position_id], callback)
    },

}

module.exports = Position