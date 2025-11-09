const Assessor = require('../models/set_assessorModel');
// const Form = require('../models/formModel');

// รายการรอบประเมิน_______________________________________________________________________________________________________________
const getAllRoundlist = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'date_save', 
        order = 'desc',
        year = ''
    } = req.query;
    
    // ดึง as_u_id จาก token (req.user.id) สำหรับเช็ค status เฉพาะของผู้ใช้ที่ login
    const as_u_id = req.user?.id || null;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order,
        year,
        as_u_id
    };
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.getAllRoundlist(params, (error, result) => {
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

const getOneRoundlist = (req, res) => {
    const id = req.params.round_list_id;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.getOneRoundlist(id, (error, result) => {
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
                meta: null,
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
            meta: null,
            payload: result[0]
        });
    });
}

// User API - แสดงเฉพาะรอบที่ตรงกับวันที่ปัจจุบัน
const checkround = (req, res) => {
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'date_save', 
        order = 'desc',
        year = ''
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order,
        year
    };
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.checkround(params, (error, result) => {
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
                message: "ไม่พบรอบการประเมินที่ตรงกับวันที่ปัจจุบัน",
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
}

const addRoundlist = (req, res) => {
    const roundDetail = { ...req.body };

    if (roundDetail.date_start) {
        if (roundDetail.date_start.includes('/')) {
            const [day, month, year] = roundDetail.date_start.split('/');
            roundDetail.date_start = `${year}/${month}/${day}`;
        } else if (roundDetail.date_start.includes('-')) {
            const [year, month, day] = roundDetail.date_start.split('-');
            roundDetail.date_start = `${year}/${month}/${day}`;
        }
    }

    if (roundDetail.date_end) {
        if (roundDetail.date_end.includes('/')) {
            const [day, month, year] = roundDetail.date_end.split('/');
            roundDetail.date_end = `${year}/${month}/${day}`;
        } else if (roundDetail.date_end.includes('-')) {
            const [year, month, day] = roundDetail.date_end.split('-');
            roundDetail.date_end = `${year}/${month}/${day}`;
        }
    }

    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.addRoundlist(roundDetail, (error, result) => {
        if (error) {
            return res.status(500).json({
                code: 500,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "ไม่สามารถเพิ่มข้อมูลได้",
                errorCode: "DATABASE_ERROR",
                meta: null,
                payload: []
            });
        }
        
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "เพิ่มข้อมูลสำเร็จ",
            errorCode: "",
            meta: null,
            payload: result
        });
    });
};

const deleteRoundlist = (req, res) => {
    const round_list_id = req.params.round_list_id;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.deleteRoundlist(round_list_id, (error, result) => {
        if (error) {
            return res.status(500).json({
                code: 500,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "ไม่สามารถลบข้อมูลได้",
                errorCode: "DATABASE_ERROR",
                meta: null,
                payload: []
            });
        }
        
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "ลบข้อมูลสำเร็จ",
            errorCode: "",
            meta: null,
            payload: result
        });
    });
}

const updateRoundlist = (req, res) => {
    const round_list_id = req.params.round_list_id;
    const roundDetail = { ...req.body };
    if (roundDetail.date_start) {
        if (roundDetail.date_start.includes('/')) {
            const [day, month, year] = roundDetail.date_start.split('/');
            roundDetail.date_start = `${year}/${month}/${day}`;
        } else if (roundDetail.date_start.includes('-')) {
            const [year, month, day] = roundDetail.date_start.split('-');
            roundDetail.date_start = `${year}/${month}/${day}`;
        }
    }

    if (roundDetail.date_end) {
        if (roundDetail.date_end.includes('/')) {
            const [day, month, year] = roundDetail.date_end.split('/');
            roundDetail.date_end = `${year}/${month}/${day}`;
        } else if (roundDetail.date_end.includes('-')) {
            const [year, month, day] = roundDetail.date_end.split('-');
            roundDetail.date_end = `${year}/${month}/${day}`;
        }
    }
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.updateRoundlist(round_list_id, roundDetail, (error, result) => {
        if (error) {
            return res.status(500).json({
                code: 500,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "ไม่สามารถแก้ไขข้อมูลได้",
                errorCode: "DATABASE_ERROR",
                meta: null,
                payload: []
            });
        }
        
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "แก้ไขข้อมูลสำเร็จ",
            errorCode: "",
            meta: null,
            payload: result
        });
    });
}


// รายการแต่งตั้งผู้ประเมิน_______________________________________________________________________________________________

const getAllsetAssesorList = (req, res) => {
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.getAllsetAssesorList((error, result) => {
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
                meta: null,
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
            meta: null,
            payload: result
        });
    });
};

const getOnesetAssesorList = (req, res) => {
    const round_list_id = req.params.round_list_id;
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'date_save', 
        order = 'desc',
        ex_position_name = ''
    } = req.query;
    
    const params = {
        round_list_id,
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order,
        ex_position_name
    };
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.getOnesetAssesorList(params, (error, result) => {
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


const addSetAssessorList = (req, res) => {
    const { as_u_id, round_list_id } = req.body;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.findAsUserByID(as_u_id, round_list_id, (err, result) => {
        if (err) {
            console.error("Database error:", err);
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
        // ถ้ามีอยู่แล้วในรอบเดียวกัน ไม่อนุญาต (เฉพาะผู้รับการประเมินเท่านั้น)
        if (result.length > 0) {
            return res.status(200).json({
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "warning",
                message: "มีผู้ใช้นี้อยู่ในรายการผู้รับการประเมินของรอบนี้แล้ว",
                errorCode: "DUPLICATE_USER",
                meta: null,
                payload: []
            });
        }
        Assessor.addSetAssessorList(req.body, (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    code: 500,
                    timestamp: new Date().toISOString(),
                    transactionCode: generateTransactionCode(),
                    success: false,
                    titleMessage: "error",
                    message: "ไม่สามารถเพิ่มข้อมูลได้",
                    errorCode: "DATABASE_ERROR",
                    meta: null,
                    payload: []
                });
            }
            res.status(200).json({
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: true,
                titleMessage: "success",
                message: "เพิ่มข้อมูลสำเร็จ",
                errorCode: "",
                meta: null,
                payload: result
            });
        });
    });
};

const addSetAssessorListMultiple = (req, res) => {
    const { as_u_id, round_list_id } = req.body;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    // ตรวจสอบว่า as_u_id เป็น array หรือไม่
    if (!Array.isArray(as_u_id) || as_u_id.length === 0) {
        return res.status(400).json({
            code: 400,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: false,
            titleMessage: "error",
            message: "ข้อมูลผู้รับการประเมินไม่ถูกต้อง",
            errorCode: "INVALID_DATA",
            meta: null,
            payload: []
        });
    }
    
    let processedCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const results = [];
    
    // ฟังก์ชันสำหรับประมวลผลแต่ละรายการ
    const processItem = (userId, index) => {
        return new Promise((resolve, reject) => {
            Assessor.findAsUserByID(userId, round_list_id, (err, result) => {
                if (err) {
                    console.error("Database error:", err);
                    errorCount++;
                    resolve({ success: false, userId, error: "Database error" });
                    return;
                }
                
                // ถ้ามีอยู่แล้วในรอบเดียวกัน
                if (result.length > 0) {
                    duplicateCount++;
                    resolve({ success: false, userId, error: "User already exists", isDuplicate: true });
                    return;
                }
                
                // เพิ่มข้อมูลใหม่
                const dataToInsert = { as_u_id: userId, round_list_id };
                Assessor.addSetAssessorList(dataToInsert, (error, insertResult) => {
                    if (error) {
                        console.error("Insert error:", error);
                        errorCount++;
                        resolve({ success: false, userId, error: "Insert failed" });
                        return;
                    }
                    
                    processedCount++;
                    results.push({ success: true, userId, result: insertResult });
                    resolve({ success: true, userId, result: insertResult });
                });
            });
        });
    };
    
    // ประมวลผลทุกรายการแบบ asynchronous
    Promise.all(as_u_id.map((userId, index) => processItem(userId, index)))
        .then(() => {
            const message = `ประมวลผลเสร็จสิ้น: เพิ่มสำเร็จ ${processedCount} รายการ, ซ้ำ ${duplicateCount} รายการ, ผิดพลาด ${errorCount} รายการ`;
            
            res.status(200).json({
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: true,
                titleMessage: "success",
                message: message,
                errorCode: "",
                meta: {
                    total: as_u_id.length,
                    success: processedCount,
                    duplicate: duplicateCount,
                    error: errorCount
                },
                payload: results
            });
        })
        .catch((error) => {
            console.error("Promise error:", error);
            res.status(500).json({
                code: 500,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "เกิดข้อผิดพลาดในการประมวลผล",
                errorCode: "PROCESSING_ERROR",
                meta: null,
                payload: []
            });
        });
};


const deleteSetAssessorList = (req, res) => {
    const set_asses_list_id = req.params.set_asses_list_id;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.deleteSetAssessorList(set_asses_list_id, (error, result) => {
        if (error) {
            return res.status(500).json({
                code: 500,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "ไม่สามารถลบข้อมูลได้",
                errorCode: "DATABASE_ERROR",
                meta: null,
                payload: []
            });
        }
        
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "ลบข้อมูลสำเร็จ",
            errorCode: "",
            meta: null,
            payload: result
        });
    });
}



// รายละเอียดในรายการแต่งตั้งผู้ประเมิน


const getOnesetAssesorInfo = (req, res) => {
    const set_asses_list_id = req.params.set_asses_list_id;
    const { 
        search = '', 
        limit = 10, 
        page = 1, 
        sort = 'date_save', 
        order = 'desc',
        ex_position_name = ''
    } = req.query;
    
    const params = {
        search,
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        order,
        ex_position_name
    };
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    Assessor.getOnesetAssesorInfo(set_asses_list_id, params, (error, result) => {
        if (error) {
            console.error("SQL Error:", error);
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
        
        // Always return success with data (empty array if no data)
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "success",
            errorCode: "",
            meta: result?.meta || {
                total_rows: 0,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: 0
            },
            payload: result?.data || []
        });
    });
};

// ดึงข้อมูลผู้รับการประเมินจาก set_asses_list_id
const getAssesseeBySetAssesListId = (req, res) => {
    const set_asses_list_id = req.params.set_asses_list_id;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    Assessor.getAssesseeBySetAssesListId(set_asses_list_id, (error, result) => {
        if (error) {
            console.error("SQL Error:", error);
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
            return res.status(404).json({
                code: 404,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "ไม่พบข้อมูลผู้รับการประเมิน",
                errorCode: "NOT_FOUND",
                meta: null,
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
            meta: null,
            payload: result[0]
        });
    });
};


const addSetAssessorInfo = (req, res) => {
    const { ex_u_id, set_asses_list_id } = req.body;
    const SetAssessorInfoDetail = req.body;

    // Step 1: ตรวจสอบว่า set_asses_list_id มีอยู่ใน tb_set_assessorlist หรือไม่
    Assessor.findListId(set_asses_list_id, (error, result) => {
        if (error) {
            console.error("SQL Error:", error); // เพิ่มบรรทัดนี้เพื่อ Debug
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'ไม่พบข้อมูลรายการแต่งตั้งผู้ประเมินภาระงาน' });
        }

        // Step 2: ตรวจสอบว่า ex_u_id กับ set_asses_list_id มีอยู่แล้วหรือไม่
        Assessor.findExUserByID(ex_u_id, set_asses_list_id, (error, userResults) => {
            if (error) {
                console.error("SQL Error:", error); // เพิ่มบรรทัดนี้เพื่อ Debug
                return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
            }
            if (userResults.length > 0) {
                return res.status(409).json({ message: "มีผู้ใช้ในรายละเอียดแต่งตั้งผู้ประเมินอยู่แล้ว" });
            }


            Assessor.addSetAssessorInfo(SetAssessorInfoDetail, (error, result) => {
                if (error) {
                    console.error("SQL Error:", error);
                    return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" });
                }

                res.send({ status: true, message: 'เพิ่มข้อมูลสำเร็จ', data: result });
            });
        });
    });
};

const addSetAssessorInfoMultiple = (req, res) => {
    const { ex_u_id, set_asses_list_id } = req.body;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    // ตรวจสอบว่า ex_u_id เป็น array หรือไม่
    if (!Array.isArray(ex_u_id) || ex_u_id.length === 0) {
        return res.status(400).json({
            code: 400,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: false,
            titleMessage: "error",
            message: "ข้อมูลผู้ประเมินไม่ถูกต้อง",
            errorCode: "INVALID_DATA",
            meta: null,
            payload: []
        });
    }
    
    // Step 1: ตรวจสอบว่า set_asses_list_id มีอยู่ใน tb_set_assessorlist หรือไม่
    Assessor.findListId(set_asses_list_id, (error, result) => {
        if (error) {
            console.error("SQL Error:", error);
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
            return res.status(404).json({
                code: 404,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "ไม่พบข้อมูลรายการแต่งตั้งผู้ประเมินภาระงาน",
                errorCode: "NOT_FOUND",
                meta: null,
                payload: []
            });
        }

        let processedCount = 0;
        let errorCount = 0;
        let duplicateCount = 0;
        const results = [];
        
        // ฟังก์ชันสำหรับประมวลผลแต่ละรายการ
        const processItem = (userId, index) => {
            return new Promise((resolve, reject) => {
                Assessor.findExUserByID(userId, set_asses_list_id, (err, userResults) => {
                    if (err) {
                        console.error("Database error:", err);
                        errorCount++;
                        resolve({ success: false, userId, error: "Database error" });
                        return;
                    }
                    
                    // ถ้ามีอยู่แล้วในรายละเอียดแต่งตั้งผู้ประเมิน
                    if (userResults.length > 0) {
                        duplicateCount++;
                        resolve({ success: false, userId, error: "User already exists", isDuplicate: true });
                        return;
                    }
                    
                    // เพิ่มข้อมูลใหม่
                    const dataToInsert = { ex_u_id: userId, set_asses_list_id };
                    Assessor.addSetAssessorInfo(dataToInsert, (error, insertResult) => {
                        if (error) {
                            console.error("Insert error:", error);
                            errorCount++;
                            resolve({ success: false, userId, error: "Insert failed" });
                            return;
                        }
                        
                        processedCount++;
                        results.push({ success: true, userId, result: insertResult });
                        resolve({ success: true, userId, result: insertResult });
                    });
                });
            });
        };
        
        // ประมวลผลทุกรายการแบบ asynchronous
        Promise.all(ex_u_id.map((userId, index) => processItem(userId, index)))
            .then(() => {
                const message = `ประมวลผลเสร็จสิ้น: เพิ่มสำเร็จ ${processedCount} รายการ, ซ้ำ ${duplicateCount} รายการ, ผิดพลาด ${errorCount} รายการ`;
                
                res.status(200).json({
                    code: 200,
                    timestamp: new Date().toISOString(),
                    transactionCode: generateTransactionCode(),
                    success: true,
                    titleMessage: "success",
                    message: message,
                    errorCode: "",
                    meta: {
                        total: ex_u_id.length,
                        success: processedCount,
                        duplicate: duplicateCount,
                        error: errorCount
                    },
                    payload: results
                });
            })
            .catch((error) => {
                console.error("Promise error:", error);
                res.status(500).json({
                    code: 500,
                    timestamp: new Date().toISOString(),
                    transactionCode: generateTransactionCode(),
                    success: false,
                    titleMessage: "error",
                    message: "เกิดข้อผิดพลาดในการประมวลผล",
                    errorCode: "PROCESSING_ERROR",
                    meta: null,
                    payload: []
                });
            });
    });
};


const deleteSetAssessorInfo = (req, res) => {
    const set_asses_info_id = req.params.set_asses_info_id;
    Assessor.deleteSetAssessorInfo(set_asses_info_id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: 'ไม่สามารถลบข้อมูลได้' });
        }
        res.send({ status: true, message: 'ลบข้อมูลสําเร็จ', data: result });
    });
}


const getAssessorOfCurrentYear = (req, res) => {
    const round_list_id = req.params.round_list_id;

    Assessor.getAssessorOfCurrentYear(round_list_id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: 'ไม่สามารถลบข้อมูลได้' });
        }
        res.send({ status: true, message: 'ลบข้อมูลสําเร็จ', data: result });
    });
}

// const checkExId = (req, res) => {
//   const { ex_u_id, set_asses_list_id } = req.body
//   Assessor.checkExId(ex_u_id, set_asses_list_id, (error, result) => {
//     if (error) {
//       return res.status(500).send({ status: false, error: "ไม่สามารถลบข้อมูลได้" })
//     }
//     res.send({ status: true, message: "ลบข้อมูลสําเร็จ", data: result })
//   })
// }

const checkIsAssessor = (req, res) => {
    const u_id = req.params.u_id
    
    console.log('🔍 Backend - checkIsAssessor called for user ID:', u_id)

    Assessor.checkExId(u_id, (error, result) => {
        if (error) {
            console.error('❌ Backend - Database error in checkIsAssessor:', error)
            return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
        }

        console.log('📊 Backend - checkExId result:', result)

        if (!result || result.length === 0) {
            console.log('❌ Backend - User is not assessor, no records found')
            return res.status(200).send({
                status: false,
                message: "ผู้ใช้นี้ไม่ได้เป็นผู้ประเมินในรอบปัจจุบัน",
            })
        }

        // ส่งข้อมูล assessor_id และ round_list_id กลับไป
        const assessorData = result[0]
        console.log('✅ Backend - User is assessor, data:', assessorData)
        
        return res.status(200).send({
            status: true,
            message: "ผู้ใช้นี้เป็นผู้ประเมินในรอบปัจจุบัน",
            data: {
                assessor_id: assessorData.set_asses_list_id,
                round_list_id: assessorData.round_list_id
            }
        })
    })
}

const getAssignedExaminees = (req, res) => {
    const { round_list_id, ex_u_id } = req.params
    Assessor.getAssignedExaminees(round_list_id, ex_u_id, (error, result) => {
        if (error) {
            console.error("Database Error:", error)
            return res.status(500).send({
                status: false,
                error: "การเชื่อมต่อข้อมูลผิดพลาด",
            })
        }

        if (!result || result.length === 0) {
            return res.status(404).send({
                status: false,
                error: "ไม่พบข้อมูลการมอบหมายการประเมิน",
            })
        }

        res.send({
            status: true,
            data: result,
        })
    })
}

// ดึงรายการการประเมินสำหรับผู้ประเมิน
const getAssessorEvaluations = (req, res) => {
    const ex_u_id = req.params.ex_u_id;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.getAssessorEvaluations(ex_u_id, (error, result) => {
        if (error) {
            console.error("Database Error:", error);
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
                message: "ไม่พบรายการการประเมิน",
                errorCode: "",
                meta: null,
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
            meta: null,
            payload: result
        });
    });
}

// ดึงรอบการประเมินสำหรับผู้ประเมิน
const getAssessorRounds = (req, res) => {
    const ex_u_id = req.params.ex_u_id;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.getAssessorRounds(ex_u_id, (error, result) => {
        if (error) {
            console.error("Database Error:", error);
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
                message: "ไม่พบรอบการประเมิน",
                errorCode: "",
                meta: null,
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
            meta: null,
            payload: result
        });
    });
}

// ดึงรายการผู้ใช้ที่ต้องตรวจในรอบการประเมินเฉพาะ
const getAssesseesByRound = (req, res) => {
    const { ex_u_id, round_list_id } = req.params;
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    Assessor.getAssesseesByRound(ex_u_id, round_list_id, (error, result) => {
        if (error) {
            console.error("Database Error:", error);
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
                message: "ไม่พบรายการผู้ใช้ในรอบนี้",
                errorCode: "",
                meta: null,
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
            meta: null,
            payload: result
        });
    });
}

// อัปเดต status ใน tb_workload_formlist
const updateAssessorStatus = (req, res) => {
    const round_list_id = parseInt(req.params.round_list_id);
    const as_u_id = parseInt(req.params.as_u_id);
    
    // Generate transaction code
    const generateTransactionCode = () => {
        return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    // ตรวจสอบว่ามีการส่งพารามิเตอร์ที่จำเป็นมาหรือไม่
    if (!round_list_id || !as_u_id || isNaN(round_list_id) || isNaN(as_u_id)) {
        return res.status(400).json({
            code: 400,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: false,
            titleMessage: "error",
            message: "กรุณาระบุ round_list_id และ as_u_id",
            errorCode: "MISSING_PARAMETERS",
            payload: [],
            meta: {
                limit: 0,
                page: 1,
                sort: "",
                total_pages: 0,
                total_rows: 0
            }
        });
    }
    
    Assessor.updateAssessorStatus(round_list_id, as_u_id, (error, result) => {
        
        if (error) {
            console.error("Database Error:", error);
            return res.status(500).json({
                code: 500,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "การเชื่อมต่อข้อมูลผิดพลาด",
                errorCode: "DATABASE_ERROR",
                payload: [],
                meta: {
                    limit: 0,
                    page: 1,
                    sort: "",
                    total_pages: 0,
                    total_rows: 0
                }
            });
        }
        
        if (!result || result.affectedRows === 0) {
            return res.status(404).json({
                code: 404,
                timestamp: new Date().toISOString(),
                transactionCode: generateTransactionCode(),
                success: false,
                titleMessage: "error",
                message: "ไม่พบข้อมูลที่ต้องการอัปเดต",
                errorCode: "NOT_FOUND",
                payload: [],
                meta: {
                    limit: 0,
                    page: 1,
                    sort: "",
                    total_pages: 0,
                    total_rows: 0
                }
            });
        }
        
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: generateTransactionCode(),
            success: true,
            titleMessage: "success",
            message: "อัปเดตสถานะสำเร็จ",
            errorCode: "",
            payload: [result],
            meta: {
                limit: 0,
                page: 1,
                sort: "",
                total_pages: 1,
                total_rows: 1
            }
        });
    });
};

// const getAssignedByAssessor = (req, res) => {
//   const { round_list_id, as_u_id } = req.params

//   // ตรวจสอบว่ามีการส่งพารามิเตอร์ที่จำเป็นมาหรือไม่
//   if (!round_list_id || !as_u_id) {
//     return res.status(400).send({
//       status: false,
//       error: "กรุณาระบุ round_list_id และ as_u_id",
//     })
//   }

//   WorkloadForm.getAssignedByAssessor(round_list_id, as_u_id, (error, result) => {
//     if (error) {
//       console.error("Database Error:", error)
//       return res.status(500).send({
//         status: false,
//         error: "การเชื่อมต่อข้อมูลผิดพลาด",
//       })
//     }

//     if (!result || result.length === 0) {
//       return res.status(404).send({
//         status: false,
//         error: "ไม่พบข้อมูลการมอบหมายการประเมิน",
//       })
//     }

//     res.send({
//       status: true,
//       data: result,
//     })
//   })
// }

// ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึงรอบนี้หรือไม่
const checkUserAccessToRound = (req, res) => {
    const { as_u_id, round_list_id } = req.params;
    
    if (!as_u_id || !round_list_id) {
        return res.status(400).json({
            code: 400,
            timestamp: new Date().toISOString(),
            transactionCode: `TXN_${Date.now()}`,
            success: false,
            titleMessage: "เกิดข้อผิดพลาด",
            message: "กรุณาระบุ as_u_id และ round_list_id",
            errorCode: "MISSING_PARAMETERS",
            payload: [],
            meta: {
                limit: 0,
                page: 1,
                sort: "",
                total_pages: 0,
                total_rows: 0
            }
        });
    }
    
    Assessor.checkUserAccessToRound(as_u_id, round_list_id, (error, result) => {
        if (error) {
            return res.status(500).json({
                code: 500,
                timestamp: new Date().toISOString(),
                transactionCode: `TXN_${Date.now()}`,
                success: false,
                titleMessage: "เกิดข้อผิดพลาด",
                message: "การเชื่อมต่อข้อมูลผิดพลาด",
                errorCode: "DATABASE_ERROR",
                payload: [],
                meta: {
                    limit: 0,
                    page: 1,
                    sort: "",
                    total_pages: 0,
                    total_rows: 0
                }
            });
        }
        
        if (!result || result.length === 0) {
            return res.status(200).json({
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: `TXN_${Date.now()}`,
                success: true,
                titleMessage: "สำเร็จ",
                message: "ไม่พบข้อมูล - ผู้ใช้ไม่มีสิทธิ์เข้าถึงรอบนี้",
                errorCode: null,
                payload: null,
                meta: {
                    limit: 0,
                    page: 1,
                    sort: "",
                    total_pages: 0,
                    total_rows: 0
                }
            });
        }
        
        // ตรวจสอบว่ามี ex_u_id หรือไม่
        const hasExaminee = result.some(record => record.ex_u_id !== null);
        
        res.status(200).json({
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: `TXN_${Date.now()}`,
            success: true,
            titleMessage: "สำเร็จ",
            message: hasExaminee ? "ผู้ใช้มีสิทธิ์เข้าถึงรอบนี้" : "ผู้ใช้ไม่มีผู้รับการประเมินในรอบนี้",
            errorCode: null,
            payload: hasExaminee ? result : null,
            meta: {
                limit: result.length,
                page: 1,
                sort: "",
                total_pages: 1,
                total_rows: result.length
            }
        });
    });
};

module.exports = {
    getAllRoundlist,
    getOneRoundlist,
    checkround,
    addRoundlist,
    deleteRoundlist,
    updateRoundlist,
    getAllsetAssesorList,
    getOnesetAssesorList,
    addSetAssessorList,
    addSetAssessorListMultiple,
    deleteSetAssessorList,
    getOnesetAssesorInfo,
    getAssesseeBySetAssesListId,
    addSetAssessorInfo,
    addSetAssessorInfoMultiple,
    deleteSetAssessorInfo,
    getAssessorOfCurrentYear,
    checkIsAssessor,
    getAssignedExaminees,
    getAssessorEvaluations,
    getAssessorRounds,
    getAssesseesByRound,
    updateAssessorStatus,
    checkUserAccessToRound,
}
