const db = require('../config')();

const QuantityWorkload = {

    getAllQuantityWorkload: (params, callback) => {
        const {
            search = '',
            limit = 10,
            page = 1,
            sort = 'quantity_workload_id',
            order = 'asc'
        } = params || {};

        const offset = (page - 1) * limit;

        // Build search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE qw.quantity_workload_hours LIKE '%${search}%' 
                            OR wg.workload_group_name LIKE '%${search}%' 
                            OR t.task_name LIKE '%${search}%'`;
        }

        // Build order clause
        const validSortFields = ['quantity_workload_id', 'quantity_workload_hours', 'workload_group_name', 'task_name'];
        const validOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'quantity_workload_id';
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';

        // Get total count
        const countSql = `
            SELECT COUNT(*) as total 
            FROM tb_quantity_workload qw
            LEFT JOIN tb_workload_group wg ON qw.workload_group_id = wg.workload_group_id
            LEFT JOIN tb_task t ON qw.task_id = t.task_id
            ${searchCondition}
        `;

        // Get paginated data
        const dataSql = `
            SELECT 
                qw.quantity_workload_id,
                qw.quantity_workload_hours,
                qw.workload_group_id,
                qw.task_id,
                wg.workload_group_name,
                t.task_name
            FROM tb_quantity_workload qw
            LEFT JOIN tb_workload_group wg ON qw.workload_group_id = wg.workload_group_id
            LEFT JOIN tb_task t ON qw.task_id = t.task_id
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

    getOneQuantityWorkload: (quantity_workload_id, callback) => {
        const sql = `
            SELECT 
                qw.quantity_workload_id,
                qw.quantity_workload_hours,
                qw.workload_group_id,
                qw.task_id,
                wg.workload_group_name,
                t.task_name
            FROM tb_quantity_workload qw
            LEFT JOIN tb_workload_group wg ON qw.workload_group_id = wg.workload_group_id
            LEFT JOIN tb_task t ON qw.task_id = t.task_id
            WHERE qw.quantity_workload_id = ?
        `;
        db.query(sql, [quantity_workload_id], callback);
    },

    addQuantityWorkload: (QuantityWorkloadDetail, callback) => {
        const sql = "INSERT INTO tb_quantity_workload SET ?";
        db.query(sql, QuantityWorkloadDetail, callback);
    },

    deleteQuantityWorkload: (quantity_workload_id, callback) => {
        const sql = "DELETE FROM tb_quantity_workload WHERE quantity_workload_id = ?";
        db.query(sql, [quantity_workload_id], callback);
    },

    updateQuantityWorkload: (quantity_workload_id, QuantityWorkloadDetail, callback) => {
        const { quantity_workload_hours, workload_group_id, task_id } = QuantityWorkloadDetail;
        const sql = "UPDATE tb_quantity_workload SET quantity_workload_hours = ?, workload_group_id = ?, task_id = ? WHERE quantity_workload_id = ?";
        db.query(sql, [quantity_workload_hours, workload_group_id, task_id, quantity_workload_id], callback);
    },

    getQuantityWorkloadByGroupId: (workload_group_id, callback) => {
        const sql = `
            SELECT 
                qw.quantity_workload_id,
                qw.quantity_workload_hours,
                qw.workload_group_id,
                qw.task_id,
                wg.workload_group_name,
                t.task_name
            FROM tb_quantity_workload qw
            LEFT JOIN tb_workload_group wg ON qw.workload_group_id = wg.workload_group_id
            LEFT JOIN tb_task t ON qw.task_id = t.task_id
            WHERE qw.workload_group_id = ?
        `;
        db.query(sql, [workload_group_id], callback);
    },
};

module.exports = QuantityWorkload;
