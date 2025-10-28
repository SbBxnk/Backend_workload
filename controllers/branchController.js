const Branch = require('../models/branchModel');

const getAllBranch = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'branch_id', 
        order = 'asc' 
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order
    };
    
    Branch.getAllBranch(params, (error, result) => {
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

const getOneBranch = (req, res) => {
    const id = req.params.branch_id;
    Branch.getOneBranch(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสาขานี้ในคณะบริหารธุรกิจและศิลปศาสตร์' });
        }
        return res.send({ status: true, branch_id: id, data: result[0] });
    });
};

const addBranch = (req, res) => {
    const BranchDetail = req.body;
    Branch.addBranch(BranchDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่สามารถเพิ่มสาขาได้' });
        }
        return res.send({
            status: true,
            message: 'เพิ่ม "' + BranchDetail.branch_name + '" ในคณะบริหารธุรกิจและศิลปศาสตร์ สําเร็จ',
        });
    });
};

const deleteBranch = (req, res) => {
    const id = req.params.branch_id;
    Branch.getOneBranch(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสาขานี้ในคณะบริหารธุรกิจและศิลปศาสตร์' });
        }
        Branch.deleteBranch(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่สามารถลบสาขานี้ได้' });
            }
            return res.send({
                status: true,
                message: 'ลบสาขาในคณะบริหารธุรกิจและศิลปศาสตร์ สำเร็จ!',
            });
        });
    });
};

const updateBranch = (req, res) => {
    const id = req.params.branch_id;
    const BranchDetail = { branch_name: req.body.branch_name };

    Branch.getOneBranch(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสาขานี้ในคณะบริหารธุรกิจและศิลปศาสตร์' });
        }

        Branch.updateBranch(id, BranchDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลสาขานี้ในคณะบริหารธุรกิจและศิลปศาสตร์' });
            }
            return res.send({
                status: true,
                branch_id: id,
                updated_name: BranchDetail.branch_name,
                message: 'แก้ไขสาขา "' + BranchDetail.branch_name + '" ในคณะบริหารธุรกิจและศิลปศาสตร์ สําเร็จ',
            });
        });
    });
};

module.exports = { getAllBranch, getOneBranch, addBranch, deleteBranch, updateBranch };
