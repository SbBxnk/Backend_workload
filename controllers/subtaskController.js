const Subtask = require('../models/subtaskModel');

const getAllSubtask = (req, res) => {
    const { search, page = 1, limit = 10, sort = 'subtask_name', order = 'asc' } = req.query;
    
    let sql = `
        SELECT 
            subtask_id,
            subtask_name,
            tb_subtask.task_id,
            task_name
        FROM 
            tb_subtask
        LEFT JOIN tb_task ON tb_subtask.task_id = tb_task.task_id
    `;
    
    const params = [];
    
    // Add search condition
    if (search) {
        sql += ` WHERE subtask_name LIKE ? OR task_name LIKE ?`;
        params.push(`%${search}%`, `%${search}%`);
    }
    
    // Add sorting
    if (sort && order) {
        sql += ` ORDER BY ${sort} ${order.toUpperCase()}`;
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    Subtask.getAllSubtask(sql, params, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        
        // Get total count for pagination
        let countSql = `
            SELECT COUNT(*) as total 
            FROM tb_subtask 
            LEFT JOIN tb_task ON tb_subtask.task_id = tb_task.task_id
        `;
        const countParams = [];
        
        if (search) {
            countSql += ` WHERE subtask_name LIKE ? OR task_name LIKE ?`;
            countParams.push(`%${search}%`, `%${search}%`);
        }
        
        Subtask.getAllSubtask(countSql, countParams, (countError, countResult) => {
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

const getSubtaskByTask = (req, res) => {
    const task_id = req.params.task_id;
    const { sort = 'subtask_id', order = 'asc' } = req.query;
    
    
    Subtask.getSubtaskByTask(task_id, sort, order, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        
        
        return res.send({ 
            success: true, 
            payload: result 
        });
    });
};

const getOneSubtask = (req, res) => {
    const id = req.params.subtask_id;
    Subtask.getOneSubtask(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลภาระงานย่อย' 
            });
        }
        return res.send({ 
            success: true, 
            payload: result[0] 
        });
    });
};

const addSubtask = (req, res) => {
    const SubtaskDetail = req.body;
    Subtask.addSubtask(SubtaskDetail, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่สามารถเพิ่มภาระงานย่อยได้' 
            });
        }
        return res.send({
            success: true,
            status: true,
            message: 'เพิ่ม "' + SubtaskDetail.subtask_name + '" ในภาระงานย่อย สำเร็จ',
        });
    });
};

const deleteSubtask = (req, res) => {
    const id = req.params.subtask_id;
    Subtask.getOneSubtask(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลภาระงานย่อย' 
            });
        }
        Subtask.deleteSubtask(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ 
                    success: false, 
                    error: "การเชื่อมต่อข้อมูลผิดพลาด" 
                });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ 
                    success: false, 
                    error: 'ไม่สามารถลบภาระงานย่อยนี้ได้' 
                });
            }
            return res.send({
                success: true,
                status: true,
                message: 'ลบภาระงานย่อย "' + result[0].subtask_name + '" สำเร็จ!',
            });
        });
    });
};

const updateSubtask = (req, res) => {
    const id = req.params.subtask_id;
    const SubtaskDetail = { 
        subtask_name: req.body.subtask_name,
        task_id: req.body.task_id 
    };

    Subtask.getOneSubtask(id, (error, result) => {
        if (error) {
            return res.status(500).send({ 
                success: false, 
                error: "การเชื่อมต่อข้อมูลผิดพลาด" 
            });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ 
                success: false, 
                error: 'ไม่พบข้อมูลภาระงานย่อย' 
            });
        }

        Subtask.updateSubtask(id, SubtaskDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ 
                    success: false, 
                    error: "การเชื่อมต่อข้อมูลผิดพลาด" 
                });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ 
                    success: false, 
                    error: 'ไม่พบข้อมูลภาระงานย่อย' 
                });
            }
            return res.send({
                success: true,
                status: true,
                subtask_id: id,
                updated_name: SubtaskDetail.subtask_name,
                message: 'แก้ไขภาระงานย่อย "' + SubtaskDetail.subtask_name + '" สำเร็จ',
            });
        });
    });
};

module.exports = { getAllSubtask, getSubtaskByTask, getOneSubtask, addSubtask, deleteSubtask, updateSubtask };