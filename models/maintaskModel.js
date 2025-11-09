
const db = require('../config')();

const Maintask = {

    getAllMainTask: (sql, params, callback) => {
        db.query(sql, params, callback);
    },

    getOneMainTask: (task_id, callback) => {
        const sql = "SELECT * FROM tb_task WHERE task_id = ?";
        db.query(sql, [task_id], callback);
    },

    addMainTask: (MainTaskDetail, callback) => {
        const sql = "INSERT INTO tb_task SET ?";
        db.query(sql, MainTaskDetail, callback);
    },

    deleteMainTask: (task_id, callback) => {
        const sql = "DELETE FROM tb_task WHERE `tb_task`.`task_id` = ?"
        db.query(sql, [task_id], callback)
    },

    updateMainTask: (task_id, MainTaskDetail, callback) => {
        const { task_name } = MainTaskDetail;
        const sql = `UPDATE tb_task 
                     SET task_name = ?
                     WHERE task_id = ?`;
        db.query(sql, [task_name, task_id], callback);
    },
    //ดึงหรือแสดงไฟล์มาอ่านก่อน
    getFilesByIds: (fileIds, callback) => {
        const sql = "SELECT flieinfo_id, file_name, size, form_id FROM tb_workload_file_info WHERE flieinfo_id IN (?)"
        db.query(sql, [fileIds], callback)
    },

    // ฟังก์ชันสำหรับลบไฟล์ตาม ID
    deleteFilesByIds: (fileIds, callback) => {
        const sql = "DELETE FROM tb_workload_file_info WHERE flieinfo_id IN (?)"
        db.query(sql, [fileIds], callback)
    },
}

module.exports = Maintask