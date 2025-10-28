const UserLevel = require('../models/userLevelModel');

// Helper function to generate transaction code
const generateTransactionCode = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getAllUserLevel = (req, res) => {
    UserLevel.getAllUserLevel((error, result) => {
        if (error) {
            return res.status(500).json({
                code: 500,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "การเชื่อมต่อข้อมูลผิดพลาด",
                errorCode: "DATABASE_ERROR",
                meta: null,
                payload: []
            });
        }
        if (!result || result.length === 0) {
            return res.status(200).json({
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: true,
                titleMessage: "success",
                message: "success",
                errorCode: "",
                meta: null,
                payload: []
            });
        }
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "success",
            errorCode: "",
            meta: null,
            payload: result
        });
    });
};

const getOneUserLevel = (req, res) => {
    const id = req.params.level_id;
    UserLevel.getOneUserLevel(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสถานะผู้ใช้งาน' });
        }
        return res.send({ status: true, level_id: id, data: result[0] });
    });
};

const addUserLevel = (req, res) => {
    const UserLevelDetail = req.body;
    UserLevel.addUserLevel(UserLevelDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่สามารถเพิ่มสถานะผู้ใช้งานได้' });
        }
        return res.send({
            status: true,
            message: 'เพิ่ม "' + UserLevelDetail.level_name + '" ในสถานะผู้ใช้งาน สําเร็จ',
        });
    });
};

const deleteUserLevel = (req, res) => {
    const id = req.params.level_id;
    UserLevel.getOneUserLevel(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสถานะผู้ใช้งาน' });
        }
        UserLevel.deleteUserLevel(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่สามารถลบสถานะผู้ใช้งานได้' });
            }
            return res.send({
                status: true,
                message: 'ลบสถานะผู้ใช้งาน สำเร็จ!',
            });
        });
    });
};

const updateUserLevel = (req, res) => {
    const id = req.params.level_id;
    const UserLevelDetail = { level_name: req.body.level_name };

    UserLevel.getOneUserLevel(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสถานะผู้ใช้งาน' });
        }

        UserLevel.updateUserLevel(id, UserLevelDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสถานะผู้ใช้งาน' });
            }
            return res.send({
                status: true,
                level_id: id,
                updated_name: UserLevelDetail.level_name,
                message: 'แก้ไขสถานะผู้ใช้งาน: "' + UserLevelDetail.level_name + '" ในสถานะผู้ใช้งาน สําเร็จ',
            });
        });
    });
};

module.exports = { getAllUserLevel, getOneUserLevel, addUserLevel, deleteUserLevel, updateUserLevel };
