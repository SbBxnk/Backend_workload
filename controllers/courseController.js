const Course = require('../models/courseModel');

// Helper function to generate transaction code
const generateTransactionCode = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getCourseByBranch = (req, res) => {
    const branch_id = req.params.branch_id;
    Course.getCourseByBranch(branch_id, (error, result) => {
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
        
        if (!result || result.length === 0) {
            return res.status(200).json({
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: true,
                titleMessage: "success",
                message: "ไม่พบข้อมูลหลักสูตรในสาขานี้",
                errorCode: "",
                meta: null,
                payload: []
            });
        }
        
        return res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "success",
            errorCode: "",
            meta: null,
            payload: result
        });
    });
}

const getAllCourse = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'course_id', 
        order = 'asc' 
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order
    };
    
    Course.getAllCourse(params, (error, result) => {
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

// Simple API to get all courses without pagination (for dropdowns)
const getAllCoursesSimple = (req, res) => {
    Course.getAllCoursesSimple((error, result) => {
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
        
        if (!result || result.length === 0) {
            return res.status(200).json({
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: true,
                titleMessage: "success",
                message: "success",
                errorCode: "",
                meta: {
                    limit: result.length,
                    page: 1,
                    sort: 'course_name',
                    total_rows: result.length,
                    total_pages: 1
                },
                payload: result
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
            meta: {
                limit: result.length,
                page: 1,
                sort: 'course_name',
                total_rows: result.length,
                total_pages: 1
            },
            payload: result
        });
    });
};


const getOneCourse = (req, res) => {
    const id = req.params.course_id;
    Course.getOneCourse(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลหลักสูตรนี้ในสาขาที่เกี่ยวข้อง' });
        }
        return res.send({ status: true, course_id: id, data: result[0] });
    });
};

const addCourse = (req, res) => {
    const CourseDetail = req.body;
    Course.addCourse(CourseDetail, (error, result) => {
        if (error) {
            console.log(error)
            return res.status(500).send({ status: false, error: `การเชื่อมต่อข้อมูลผิดพลาด` });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลหลักสูตรนี้ในสาขาที่เกี่ยวข้อง' });
        }
        return res.send({
            status: true,
            message: 'เพิ่ม "' + CourseDetail.course_name + '" ในสาขาที่เกี่ยวข้อง สําเร็จ',
        });
    });
};

const deleteCourse = (req, res) => {
    const id = req.params.course_id;
    Course.getOneCourse(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลหลักสูตรนี้ในสาขาที่เกี่ยวข้อง' });
        }
        Course.deleteCourse(id, (error, deleteResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่สามารถลบหลักสูตรนี้ได้' });
            }
            return res.send({
                status: true,
                message: 'ลบหลักสูตรในสาขาที่เกี่ยวข้อง สำเร็จ!',
            });
        });
    });
};

const updateCourse = (req, res) => {
    const id = req.params.course_id;
    const CourseDetail = {
        course_name: req.body.course_name,
        branch_id: req.body.branch_id
    };

    Course.getOneCourse(id, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลหลักสูตรนี้ในสาขาที่เกี่ยวข้อง' });
        }

        Course.updateCourse(id, CourseDetail, (error, updateResult) => {
            if (error) {
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลหลักสูตรนี้ในสาขาที่เกี่ยวข้อง' });
            }
            return res.send({
                status: true,
                course_id: id,
                updated_name: CourseDetail.course_name,
                message: 'แก้ไข "' + CourseDetail.course_name + '" ในสาขาที่เกี่ยวข้อง สําเร็จ',
            });
        });
    });
};

module.exports = { getCourseByBranch, getAllCourse, getAllCoursesSimple, getOneCourse, addCourse, deleteCourse, updateCourse };
