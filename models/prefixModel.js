const db = require('../config')();

const Prefix = {

    getAllPrefix: (params, callback) => {
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'prefix_id', 
            order = 'asc' 
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE prefix_name LIKE '%${search}%'`;
        }
        
        // Build order clause
        const validSortFields = ['prefix_id', 'prefix_name'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'prefix_id';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_prefix 
            ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT 
                prefix_id,
                prefix_name
            FROM tb_prefix 
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

    getOnePrefix: (prefix_id, callback) => {
        const sql = "SELECT * FROM tb_prefix WHERE prefix_id = ?";
        db.query(sql, [prefix_id], callback);
    },

    addPrefix: (prefixDetail, callback) => {
        const sql = "INSERT INTO tb_prefix SET ?";
        db.query(sql, prefixDetail, callback);
    },

    deletePrefix: (prefix_id, callback) => {
        const sql = "DELETE FROM tb_prefix WHERE prefix_id = ?";
        db.query(sql, [prefix_id], callback);
    },

    updatePrefix: (prefix_id, prefixDetail, callback) => {
        const { prefix_name } = prefixDetail;
        const sql = "UPDATE tb_prefix SET prefix_name = ? WHERE prefix_id = ?";
        db.query(sql, [prefix_name, prefix_id], callback);
    },

};

module.exports = Prefix;
