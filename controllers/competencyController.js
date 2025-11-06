const Competency = require('../models/competencyModel');

// Helper function to generate transaction code
const generateTransactionCode = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getAllCompetency = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'competency_order', 
        order = 'asc' 
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order
    };
    
    Competency.getAllCompetency(params, (error, result) => {
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

const getOneCompetency = (req, res) => {
    const id = req.params.competency_id;
    Competency.getOneCompetency(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสมรรถนะ' });
        } else {
            return res.send({
                status: true,
                competency_id: id,
                data: result[0]
            });
        }
    });
}

const addCompetency = (req, res) => {
    const CompetencyDetail = req.body;
    Competency.addCompetency(CompetencyDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสมรรถนะ' });
        }
        else {
            return res.send({
                status: true,
                message: 'เพิ่มสมรรถนะ "' + CompetencyDetail.competency_name + '" สำเร็จ',
            });
        }
    });
}

const deleteCompetency = (req, res) => {
    const id = req.params.competency_id;

    Competency.getOneCompetency(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสมรรถนะ' });
        }
        Competency.deleteCompetency(id, (error, result) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            else if (result.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสมรรถนะ' });
            }
            else {
                res.send({
                    status: true,
                    message: 'ลบข้อมูลสมรรถนะ สำเร็จ!',
                })
            }
        });

    });
};

const updateCompetency = (req, res) => {
    const id = req.params.competency_id;
    const CompetencyDetail = {
        competency_name: req.body.competency_name,
        competency_order: req.body.competency_order,
    };
    Competency.getOneCompetency(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสมรรถนะ' });
        }

    Competency.updateCompetency(id, CompetencyDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        else if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสมรรถนะ' });
        }
        else {
            return res.send({
                status: true,
                update_at: id,
                message: 'แก้ไขข้อมูลสมรรถนะ "' + CompetencyDetail.competency_name + '" สำเร็จ'
            });
        }
    });
    });
};

module.exports = { getAllCompetency, getOneCompetency, addCompetency, deleteCompetency, updateCompetency }

