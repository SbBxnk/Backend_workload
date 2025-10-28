const ExPosition = require('../models/expositionModel');

// Helper function to generate transaction code
const generateTransactionCode = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getAllExPosition = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'ex_position_id', 
        order = 'asc' 
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order
    };
    
    ExPosition.getAllExPosition(params, (error, result) => {
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
        
        if (!result || !result.data || result.data.length === 0) {
            return res.status(200).json({
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: true,
                titleMessage: "success",
                message: "success",
                errorCode: "",
                meta: {
                    limit: parseInt(limit),
                    page: parseInt(page),
                    sort: sort,
                    total_rows: 0,
                    total_pages: 0
                },
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
            meta: result.meta,
            payload: result.data
        });
    });
};

const getOneExPosition = (req, res) => {
    const id = req.params.ex_position_id;
    ExPosition.getOneExPosition(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งบริหาร' });
        } else {
            return res.send({
                status: true,
                ex_position_id: id,
                data: result[0]
            });
        }
    });
}


const addExPosition = (req, res) => {
    const ExPositionDetail = req.body;
    ExPosition.addExPosition(ExPositionDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งบริหาร' });
        }
        else {
            return res.send({
                status: true,
                message: 'เพิ่มตำแหน่ง "' + ExPositionDetail.ex_position_name + '"ในข้อมูลตำแหน่งบริหาร สําเร็จ',
            });
        }
    });
}

const deleteExPosition = (req, res) => {
    const id = req.params.ex_position_id;

    ExPosition.getOneExPosition(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งบริหาร' });
        }
        ExPosition.deleteExPosition(id, (error, result) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            else if (result.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งบริหาร' });
            }
            else {
                res.send({
                    status: true,
                    message: 'ลบข้อมูลตำแหน่งในข้อมูลตำแหน่งบริหาร สำเร็จ!',
                })
            }
        });

    });
};

const updateExPosition = (req, res) => {
    const id = req.params.ex_position_id;
    const ExPositionDetail = {
        ex_position_name: req.body.ex_position_name,
    };
    ExPosition.getOneExPosition(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งบริหาร' });
        }

    ExPosition.updateExPosition(id, ExPositionDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งบริหาร' });
        }
        else {
            return res.send({
                status: true,
                update_at: id,
                message: 'แก้ไขข้อมูลตำแหน่ง"' + ExPositionDetail.ex_position_name + '"ในข้อมูลตำแหน่งบริหาร สําเร็จ'
            });
        }
    });
    });
};

module.exports = { getAllExPosition, getOneExPosition, addExPosition, deleteExPosition, updateExPosition }