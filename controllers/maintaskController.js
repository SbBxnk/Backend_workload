const Maintask = require('../models/maintaskModel');

const getAllMainTask = (req, res) => {
    const { search, page = 1, limit = 10, sort = 'task_id', order = 'asc' } = req.query;
    
    
    let sql = `
        SELECT 
            task_id,
            task_name
        FROM 
            tb_task
    `;
    
    const params = [];
    
    // Add search condition
    if (search) {
        sql += ` WHERE task_name LIKE ?`;
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
    
    
    Maintask.getAllMainTask(sql, params, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        
        // Get total count for pagination
        let countSql = `SELECT COUNT(*) as total FROM tb_task`;
        const countParams = [];
        
        if (search) {
            countSql += ` WHERE task_name LIKE ?`;
            countParams.push(`%${search}%`);
        }
        
        Maintask.getAllMainTask(countSql, countParams, (countError, countResult) => {
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

const getOneMainTask = (req, res) => {
    const id = req.params.task_id;
    Maintask.getOneMainTask(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลภาระงานหลัก' 
            });
        }
        return res.send({ 
            success: true, 
            payload: result[0] 
        });
    });
};

const addMainTask = (req, res) => {
    const MainTaskDetail = req.body;
    Maintask.addMainTask(MainTaskDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่สามารถเพิ่มภาระงานหลักได้' 
            });
        }
        return res.send({
            success: true,
            status: true,
            message: 'เพิ่ม "' + MainTaskDetail.task_name + '" ในภาระงานหลัก สำเร็จ',
        });
    });
};

const deleteMainTask = (req, res) => {
    const id = req.params.task_id;
    Maintask.getOneMainTask(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลภาระงานหลัก' 
            });
        }
        Maintask.deleteMainTask(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ 
                    success: false, 
                    error: "การเชื่อมต่อข้อมูลผิดพลาด" 
                });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ 
                    success: false, 
                    error: 'ไม่สามารถลบภาระงานหลักนี้ได้' 
                });
            }
            return res.send({
                success: true,
                status: true,
                message: 'ลบภาระงานหลัก "' + result[0].task_name + '" สำเร็จ!',
            });
        });
    });
};

const updateMainTask = (req, res) => {
    const id = req.params.task_id;
    const MainTaskDetail = { task_name: req.body.task_name };

    Maintask.getOneMainTask(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลภาระงานหลัก' 
            });
        }

        Maintask.updateMainTask(id, MainTaskDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ 
                    success: false, 
                    error: "การเชื่อมต่อข้อมูลผิดพลาด" 
                });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ 
                    success: false, 
                    error: 'ไม่พบข้อมูลภาระงานหลัก' 
                });
            }
            return res.send({
                success: true,
                status: true,
                task_id: id,
                updated_name: MainTaskDetail.task_name,
                message: 'แก้ไขภาระงานหลัก "' + MainTaskDetail.task_name + '" สำเร็จ',
            });
        });
    });
};

module.exports = { getAllMainTask, getOneMainTask, addMainTask, deleteMainTask, updateMainTask };