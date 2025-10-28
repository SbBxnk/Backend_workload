const PersonalType = require('../models/persernalTypeModel');

const getAllPersonalType = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'type_p_id', 
        order = 'asc' 
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order
    };
    
    PersonalType.getAllPersonalType(params, (error, result) => {
        console.log('PersonalType Controller Debug:');
        console.log('Params:', params);
        console.log('Error:', error);
        console.log('Result:', result);
        console.log('Result.meta:', result?.meta);
        
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
        
        // ใช้ meta data จาก model
        const metaData = result.meta || {
            limit: parseInt(limit),
            page: parseInt(page),
            sort: sort,
            total_rows: result.data ? result.data.length : 0,
            total_pages: result.data ? Math.ceil(result.data.length / limit) : 0
        };
        
        console.log('PersonalType Controller - Using meta from model:', metaData);
        
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "success",
            errorCode: "",
            meta: metaData,
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

const getOnePersonalType = (req, res) => {
    const id = req.params.type_p_id;
    PersonalType.getOnePersonalType(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลประเภทบุคลากรนี้' });
        }
        return res.send({ status: true, type_p_id: id, data: result[0] });
    });
};

const addPersonalType = (req, res) => {
    const PersonalTypeDetail = req.body;
    PersonalType.addPersonalType(PersonalTypeDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่สามารถเพิ่มประเภทบุคลากรได้' });
        }
        return res.send({
            status: true,
            message: 'เพิ่ม "' + PersonalTypeDetail.type_p_name + '" สำเร็จ',
        });
    });
};

const deletePersonalType = (req, res) => {
    const id = req.params.type_p_id;
    PersonalType.getOnePersonalType(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลประเภทบุคลากรนี้' });
        }
        PersonalType.deletePersonalType(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่สามารถลบประเภทบุคลากรนี้ได้' });
            }
            return res.send({
                status: true,
                message: 'ลบประเภทบุคลากร สำเร็จ!',
            });
        });
    });
};

const updatePersonalType = (req, res) => {
    const id = req.params.type_p_id;
    const PersonalTypeDetail = { type_p_name: req.body.type_p_name };

    PersonalType.getOnePersonalType(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลประเภทบุคลากรนี้' });
        }

        PersonalType.updatePersonalType(id, PersonalTypeDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลประเภทบุคลากรนี้' });
            }
            return res.send({
                status: true,
                type_p_id: id,
                updated_name: PersonalTypeDetail.type_p_name,
                message: 'แก้ไขประเภทบุคลากร "' + PersonalTypeDetail.type_p_name + '" สำเร็จ',
            });
        });
    });
};

module.exports = { getAllPersonalType, getOnePersonalType, addPersonalType, deletePersonalType, updatePersonalType };
