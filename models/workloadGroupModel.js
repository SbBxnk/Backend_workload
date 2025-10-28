const db = require('../config')();

const WorkloadGroup = {

    getAllWorkloadGroup: (sql, params, callback) => {
        db.query(sql, params, callback);
    },

    getOneWorkloadGroup: (workload_group_id, callback) => {
        const sql = "SELECT * FROM tb_workload_group WHERE workload_group_id = ?";
        db.query(sql, [workload_group_id], callback);
    },

    addWorkloadGroup: (WorkloadGroupDetail, callback) => {
        const sql = "INSERT INTO tb_workload_group SET ?";
        db.query(sql, WorkloadGroupDetail, callback);
    },

    deleteWorkloadGroup: (workload_group_id, callback) => {
        const sql = "DELETE FROM tb_workload_group WHERE workload_group_id = ?";
        db.query(sql, [workload_group_id], callback);
    },

    updateWorkloadGroup: (workload_group_id, WorkloadGroupDetail, callback) => {
        const { workload_group_name } = WorkloadGroupDetail;
        const sql = "UPDATE tb_workload_group SET workload_group_name = ? WHERE workload_group_id = ?";
        db.query(sql, [workload_group_name, workload_group_id], callback);
    },

};

module.exports = WorkloadGroup;
