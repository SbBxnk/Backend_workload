const db = require('../config')();

const personalType = {

    getAllPersonalType: (params, callback) => {
        console.log('PersonalType Model - Received params:', params);
        
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'type_p_id', 
            order = 'asc' 
        } = params || {};
        
        console.log('PersonalType Model - Parsed params:', { search, limit, page, sort, order });
        
        const offset = (page - 1) * limit;
        
        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE type_p_name LIKE '%${search}%'`;
        }
        
        // Build order clause
        const validSortFields = ['type_p_id', 'type_p_name'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'type_p_id';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_personal_type 
            ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT 
                type_p_id,
                type_p_name
            FROM tb_personal_type 
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
                
                console.log('PersonalType Model - Final meta:', meta);
                console.log('PersonalType Model - Final data:', dataResult);
                
                callback(null, {
                    data: dataResult,
                    meta: meta
                });
            });
        });
    },

    getOnePersonalType: (type_p_id, callback) => {
        const sql = "SELECT * FROM tb_personal_type WHERE type_p_id = ?";
        db.query(sql, [type_p_id], callback);
    },

    addPersonalType: (PersonalTypeDetail, callback) => {
        const sql = "INSERT INTO tb_personal_type SET ?";
        db.query(sql, PersonalTypeDetail, callback);
    },

    deletePersonalType: (type_p_id, callback) => {
        const sql = "DELETE FROM tb_personal_type WHERE type_p_id = ?";
        db.query(sql, [type_p_id], callback);
    },

    updatePersonalType: (type_p_id, PersonalTypeDetail, callback) => {
        const { type_p_name } = PersonalTypeDetail;
        const sql = "UPDATE tb_personal_type SET type_p_name = ? WHERE type_p_id = ?";
        db.query(sql, [type_p_name, type_p_id], callback);
    },

};

module.exports = personalType;
