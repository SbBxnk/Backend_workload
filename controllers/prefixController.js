const Prefix = require('../models/prefixModel');

// Helper function to generate transaction code
const generateTransactionCode = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getAllPrefix = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'prefix_id', 
        order = 'asc' 
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order
    };
    
    Prefix.getAllPrefix(params, (error, result) => {
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
}

const getOnePrefix = (req, res) => {
    const id = req.params.prefix_id;
    Prefix.getOnePrefix(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลคำนำหน้า' });
        } else {
            return res.send({
                status: true,
                prefix_id: id,
                data: result[0]
            });
        }
    });
}


const addPrefix = (req, res) => {
    const prefixDetail = req.body;
    Prefix.addPrefix(prefixDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลคำนำหน้า' });
        }
        else {
            return res.send({
                status: true,
                message: 'เพิ่มคำนำหน้า "' + prefixDetail.prefix_name + '"ในข้อมูลคำนำหน้า สําเร็จ',
            });
        }
    });
}

const deletePrefix = (req, res) => {
    const id = req.params.prefix_id;

    Prefix.getOnePrefix(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลคำนำหน้า' });
        }
        Prefix.deletePrefix(id, (error, result) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            else if (result.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลคำนำหน้า' });
            }
            else {
                res.send({
                    status: true,
                    message: 'ลบข้อมูลคำนำหน้า สำเร็จ!',
                })
            }
        });

    });
};

const updatePrefix = (req, res) => {
    const id = req.params.prefix_id;
    const prefixDetail = {
        prefix_name: req.body.prefix_name,
    };
    Prefix.getOnePrefix(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลคำนำหน้า' });
        }

    Prefix.updatePrefix(id, prefixDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลคำนำหน้า' });
        }
        else {
            return res.send({
                status: true,
                update_at: id,
                message: 'แก้ไขคำนำหน้า"' + prefixDetail.prefix_name + '"ในข้อมูลคำนำหน้า สําเร็จ'
            });
        }
    });
    });
};

module.exports = { getAllPrefix, getOnePrefix, addPrefix, deletePrefix, updatePrefix }