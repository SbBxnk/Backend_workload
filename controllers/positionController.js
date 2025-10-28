const Position = require('../models/positionModel');

// Helper function to generate transaction code
const generateTransactionCode = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getAllPosition = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'position_id', 
        order = 'asc' 
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order
    };
    
    Position.getAllPosition(params, (error, result) => {
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

const getOnePosition = (req, res) => {
    const id = req.params.position_id;
    Position.getOnePosition(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งวิชากร' });
        } else {
            return res.send({
                status: true,
                position_id: id,
                data: result[0]
            });
        }
    });
}


const addPosition = (req, res) => {
    const PositionDetail = req.body;
    Position.addPosition(PositionDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งวิชากร' });
        }
        else {
            return res.send({
                status: true,
                message: 'เพิ่มตำแหน่ง "' + PositionDetail.position_name + '"ในข้อมูลตำแหน่งวิชาการ สําเร็จ',
            });
        }
    });
}

const deletePosition = (req, res) => {
    const id = req.params.position_id;

    Position.getOnePosition(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งวิชากร' });
        }
        Position.deletePosition(id, (error, result) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            else if (result.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งวิชากร' });
            }
            else {
                res.send({
                    status: true,
                    message: 'ลบข้อมูลตำแหน่งในข้อมูลตำแหน่งวิชาการ สำเร็จ!',
                })
            }
        });

    });
};

const updatePosition = (req, res) => {
    const id = req.params.position_id;
    const PositionDetail = {
        position_name: req.body.position_name,
    };
    Position.getOnePosition(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งวิชากร' });
        }

    Position.updatePosition(id, PositionDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลตำแหน่งวิชากร' });
        }
        else {
            return res.send({
                status: true,
                update_at: id,
                message: 'แก้ไขข้อมูลตำแหน่ง"' + PositionDetail.position_name + '"ในข้อมูลตำแหน่งวิชาการ สําเร็จ'
            });
        }
    });
    });
};

module.exports = { getAllPosition, getOnePosition, addPosition, deletePosition, updatePosition }