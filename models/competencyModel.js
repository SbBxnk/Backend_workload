const db = require('../config')();

const Competency = {
    getAllCompetency: (params, callback) => {
        const { 
            search = '', 
            limit = 10, 
            page = 1, 
            sort = 'competency_order', 
            order = 'asc' 
        } = params || {};
        
        const offset = (page - 1) * limit;
        
        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE competency_name LIKE '%${search}%'`;
        }
        
        // Build order clause
        const validSortFields = ['competency_id', 'competency_name', 'competency_order'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'competency_order';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_competency 
            ${searchCondition}
        `;
        
        // Get paginated data
        const dataSql = `
            SELECT 
                competency_id,
                competency_name,
                competency_order
            FROM tb_competency 
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
    
    getOneCompetency: (competency_id, callback) => {
        const sql = "SELECT * FROM tb_competency WHERE competency_id = ?";
        db.query(sql, [competency_id], callback);
    },

    addCompetency: (CompetencyDetail, callback) => {
        const sql = "INSERT INTO tb_competency SET ?";
        db.query(sql, CompetencyDetail, callback);
    },

    deleteCompetency: (competency_id, callback) => {
        const sql = "DELETE FROM tb_competency WHERE `tb_competency`.`competency_id` = ?"
        db.query(sql, [competency_id], callback)
    },

    updateCompetency: (competency_id, CompetencyDetail, callback) => {
        const { competency_name, competency_order } = CompetencyDetail;
        const sql = `UPDATE tb_competency 
                     SET competency_name = ?,
                         competency_order = ?
                     WHERE competency_id = ?`;
        db.query(sql, [competency_name, competency_order || null, competency_id], callback)
    },
}

module.exports = Competency

