const personalType = require('../models/persernalTypeModel');

// Helper function to generate transaction code
const generateTransactionCode = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

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
    
    personalType.getAllPersonalType(params, (error, result) => {
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
    
const getOnePersonalType = (req, res) => {
    const id = req.params.type_p_id;
    personalType.getOnePersonalType(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลประเภทบุคลากร' });
        }
        return res.send({ status: true, type_p_id: id, data: result[0] });
    });
};

const addPersonalType = (req, res) => {
    const PersonalTypeDetail = req.body;
    personalType.addPersonalType(PersonalTypeDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่สามารถเพิ่มสาขาได้' });
        }
        return res.send({
            status: true,
            message: 'เพิ่ม "' + PersonalTypeDetail.type_p_name + '" ในข้อมูลประเภมบุคลากร สําเร็จ',
        });
    });
};

const deletePersonalType = (req, res) => {
    const id = req.params.type_p_id;
    personalType.getOnePersonalType(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลประเภทบุคลากร' });
        }
        personalType.deletePersonalType(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่สามารถลบประเภทบุคลากรได้' });
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

    personalType.getOnePersonalType(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลประเภทบุคลากร' });
        }

        personalType.updatePersonalType(id, PersonalTypeDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลประเภทบุคลากร' });
            }
            return res.send({
                status: true,
                type_p_id: id,
                updated_name: PersonalTypeDetail.type_p_name,
                message: 'แก้ไขประเภทบุคลากร "' + PersonalTypeDetail.type_p_name + '" ในประเภทบุคลากร สําเร็จ',
            });
        });
    });
};

module.exports = { getAllPersonalType, getOnePersonalType, addPersonalType, deletePersonalType, updatePersonalType };
