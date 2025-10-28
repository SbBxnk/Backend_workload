const WorkloadGroup = require('../models/workloadGroupModel');

const getAllWorkloadGroup = (req, res) => {
    const { search, page = 1, limit = 10, sort = 'workload_group_name', order = 'asc' } = req.query;
    
    let sql = `
        SELECT 
            workload_group_id,
            workload_group_name
        FROM 
            tb_workload_group
    `;
    
    const params = [];
    
    // Add search condition
    if (search) {
        sql += ` WHERE workload_group_name LIKE ?`;
        params.push(`%${search}%`);
    }
    
    // Add sorting
    if (sort && order) {
        sql += ` ORDER BY ${sort} ${order.toUpperCase()}`;
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    WorkloadGroup.getAllWorkloadGroup(sql, params, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        
        // Get total count for pagination
        let countSql = `SELECT COUNT(*) as total FROM tb_workload_group`;
        const countParams = [];
        
        if (search) {
            countSql += ` WHERE workload_group_name LIKE ?`;
            countParams.push(`%${search}%`);
        }
        
        WorkloadGroup.getAllWorkloadGroup(countSql, countParams, (countError, countResult) => {
            if (countError) {
                return res.status(500).send({ 
                    success: false, 
                    error: "การเชื่อมต่อข้อมูลผิดพลาด" 
                });
            }
            
            const totalRows = countResult[0]?.total || 0;
            
            res.send({ 
                success: true, 
                payload: result,
                meta: {
                    total_rows: totalRows,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalRows / limit)
                }
            });
        });
    });
};

const getOneWorkloadGroup = (req, res) => {
    const id = req.params.workload_group_id;
    WorkloadGroup.getOneWorkloadGroup(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลกลุ่มภาระงาน' 
            });
        }
        return res.send({ 
            success: true, 
            payload: result[0] 
        });
    });
};

const addWorkloadGroup = (req, res) => {
    const WorkloadGroupDetail = req.body;
    WorkloadGroup.addWorkloadGroup(WorkloadGroupDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่สามารถเพิ่มกลุ่มภาระงานได้' 
            });
        }
        return res.send({
            success: true,
            status: true,
            message: 'เพิ่ม "' + WorkloadGroupDetail.workload_group_name + '" ในกลุ่มภาระงาน สำเร็จ',
        });
    });
};

const deleteWorkloadGroup = (req, res) => {
    const id = req.params.workload_group_id;
    WorkloadGroup.getOneWorkloadGroup(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลกลุ่มภาระงาน' 
            });
        }
        WorkloadGroup.deleteWorkloadGroup(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ 
                    success: false, 
                    error: "การเชื่อมต่อข้อมูลผิดพลาด" 
                });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ 
                    success: false, 
                    error: 'ไม่สามารถลบกลุ่มภาระงานนี้ได้' 
                });
            }
            return res.send({
                success: true,
                status: true,
                message: 'ลบกลุ่มภาระงาน "' + result[0].workload_group_name + '" สำเร็จ!',
            });
        });
    });
};

const updateWorkloadGroup = (req, res) => {
    const id = req.params.workload_group_id;
    const WorkloadGroupDetail = { workload_group_name: req.body.workload_group_name };

    WorkloadGroup.getOneWorkloadGroup(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลกลุ่มภาระงาน' 
            });
        }

        WorkloadGroup.updateWorkloadGroup(id, WorkloadGroupDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ 
                    success: false, 
                    error: "การเชื่อมต่อข้อมูลผิดพลาด" 
                });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ 
                    success: false, 
                    error: 'ไม่พบข้อมูลกลุ่มภาระงาน' 
                });
            }
            return res.send({
                success: true,
                status: true,
                workload_group_id: id,
                updated_name: WorkloadGroupDetail.workload_group_name,
                message: 'แก้ไขกลุ่มภาระงาน "' + WorkloadGroupDetail.workload_group_name + '" สำเร็จ',
            });
        });
    });
};

module.exports = { getAllWorkloadGroup, getOneWorkloadGroup, addWorkloadGroup, deleteWorkloadGroup, updateWorkloadGroup };