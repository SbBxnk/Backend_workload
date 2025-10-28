const db = require('../config')();

const userLevel = {

    getAllUserLevel: (callback) => {
        const sql = ` 
            SELECT 
                level_id,
                level_name
            FROM 
                tb_level`;
        db.query(sql, callback);
    },

    getOneUserLevel: (level_id, callback) => {
        const sql = "SELECT * FROM tb_level WHERE level_id = ?";
        db.query(sql, [level_id], callback);
    },

    addUserLevel: (UserLevelDetail, callback) => {
        const sql = "INSERT INTO tb_level SET ?";
        db.query(sql, UserLevelDetail, callback);
    },

    deleteUserLevel: (level_id, callback) => {
        const sql = "DELETE FROM tb_level WHERE level_id = ?";
        db.query(sql, [level_id], callback);
    },

    updateUserLevel: (level_id, UserLevelDetail, callback) => {
        const { level_name } = UserLevelDetail;
        const sql = "UPDATE tb_level SET level_name = ? WHERE level_id = ?";
        db.query(sql, [level_name, level_id], callback);
    },

};

module.exports = userLevel;
