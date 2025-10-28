const db = require('../config')();

const Subtask = {

    getAllSubtask: (sql, params, callback) => {
        db.query(sql, params, callback);
    },

    getSubtaskByTask: (task_id, sort = 'subtask_id', order = 'asc', callback) => {
        const sql = `
          SELECT 
            subtask_id,
            subtask_name,
            task_name
          FROM 
            tb_subtask
          LEFT JOIN tb_task ON tb_subtask.task_id = tb_task.task_id
          WHERE tb_subtask.task_id = ?
          ORDER BY ${sort} ${order.toUpperCase()}`;  // เพิ่มการเรียงลำดับ
        db.query(sql, [task_id], callback);
    },

    getOneSubtask: (subtask_id, callback) => {
        const sql = "SELECT * FROM tb_subtask WHERE subtask_id = ?";
        db.query(sql, [subtask_id], callback);
    },

    addSubtask: (SubtaskDetail, callback) => {
        const sql = "INSERT INTO tb_subtask SET ?";
        db.query(sql, SubtaskDetail, callback);
    },

    deleteSubtask: (subtask_id, callback) => {
        const sql = "DELETE FROM tb_subtask WHERE subtask_id = ?";
        db.query(sql, [subtask_id], callback);
    },

    updateSubtask: (subtask_id, SubtaskDetail, callback) => {
        const { subtask_name, task_id } = SubtaskDetail;
        const sql = "UPDATE tb_subtask SET subtask_name = ? , task_id = ? WHERE subtask_id = ?";
        db.query(sql, [subtask_name, task_id, subtask_id], callback);
    },

};

module.exports = Subtask;
