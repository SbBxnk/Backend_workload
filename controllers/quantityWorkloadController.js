const QuantityWorkload = require('../models/quantityWorkloadModel');

const getAllQuantityWorkload = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'quantity_workload_id', 
        order = 'asc' 
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order
    };
    
    QuantityWorkload.getAllQuantityWorkload(params, (error, result) => {
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

// Helper function to generate transaction code
const generateTransactionCode = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getOneQuantityWorkload = (req, res) => {
    const id = req.params.quantity_workload_id;
    QuantityWorkload.getOneQuantityWorkload(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลปริมาณงานนี้' });
        }
        return res.send({ status: true, quantity_workload_id: id, data: result[0] });
    });
};

const addQuantityWorkload = (req, res) => {
    const QuantityWorkloadDetail = req.body;
    QuantityWorkload.addQuantityWorkload(QuantityWorkloadDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่สามารถเพิ่มปริมาณงานได้' });
        }
        return res.send({
            status: true,
            message: 'เพิ่มปริมาณงาน "' + QuantityWorkloadDetail.quantity_workload_hours + ' ชั่วโมง" สำเร็จ',
        });
    });
};

const deleteQuantityWorkload = (req, res) => {
    const id = req.params.quantity_workload_id;
    QuantityWorkload.getOneQuantityWorkload(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลปริมาณงานนี้' });
        }
        QuantityWorkload.deleteQuantityWorkload(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่สามารถลบปริมาณงานนี้ได้' });
            }
            return res.send({
                status: true,
                message: 'ลบปริมาณงานสำเร็จ!',
            });
        });
    });
};

const updateQuantityWorkload = (req, res) => {
    const id = req.params.quantity_workload_id;
    const QuantityWorkloadDetail = { 
        quantity_workload_hours: req.body.quantity_workload_hours,
        workload_group_id: req.body.workload_group_id,
        task_id: req.body.task_id
    };

    QuantityWorkload.getOneQuantityWorkload(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลปริมาณงานนี้' });
        }

        QuantityWorkload.updateQuantityWorkload(id, QuantityWorkloadDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลปริมาณงานนี้' });
            }
            return res.send({
                status: true,
                quantity_workload_id: id,
                updated_hours: QuantityWorkloadDetail.quantity_workload_hours,
                message: 'แก้ไขปริมาณงาน "' + QuantityWorkloadDetail.quantity_workload_hours + ' ชั่วโมง" สำเร็จ',
            });
        });
    });
};

module.exports = { getAllQuantityWorkload, getOneQuantityWorkload, addQuantityWorkload, deleteQuantityWorkload, updateQuantityWorkload };
