const bcrypt = require('bcrypt'); // using bcrypt instead of bcryptjs
const jwt = require('jsonwebtoken');
const LoginRegis = require('../models/userModel');
require('dotenv').config();
const saltRounds = 10;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const upload = require('../middleware/file_upload');
const XLSX = require('xlsx');
const AuditLog = require('../models/audit_logModel');

const GetAllUser = (req, res) => {
    const params = {
        search: req.query.search || '',
        position_name: req.query.position_name || '',
        branch_name: req.query.branch_name || '',
        course_name: req.query.course_name || '',
        ex_position_name: req.query.ex_position_name || '',
        gender: req.query.gender || '',
        sort: req.query.sort || '',
        order: req.query.order || '',
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
    };


    // Get total count for pagination
    LoginRegis.GetAllUserCount(params, (countError, countResult) => {
        if (countError) {
            return res.status(500).send({ status: false, error: 'Database query failed' });
        }

        const total = countResult[0]?.total || 0;

        // Get paginated data
        LoginRegis.GetAllUser(params, (error, result) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).send({ status: false, error: 'Database query failed' });
            }

            const response = {
                code: 200,
                timestamp: new Date().toISOString(),
                transactionCode: `TXN_${Date.now()}`,
                success: true,
                titleMessage: 'Success',
                message: 'Users retrieved successfully',
                errorCode: '',
                payload: result || [],
                meta: {
                    total_rows: total,
                    page: params.page,
                    limit: params.limit,
                    total_pages: Math.ceil(total / params.limit),
                    sort: params.sort || '',
                    total: total
                }
            };

            console.log('Sending response:', response);
            res.send(response);
        });
    });
}
const GetAllExUser = (req, res) => {
    const set_asses_list_id = req.query.set_asses_list_id

    if (!set_asses_list_id) {
        return res.status(400).send({ status: false, error: "Missing set_asses_list_id parameter" })
    }

    LoginRegis.GetAllExUser(set_asses_list_id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: "Database query failed" })
        } else if (!result || result.length === 0) {
            return res.status(200).send({
                status: true,
                data: [],
                message: "ไม่พบผู้ประเมินที่สามารถเลือกได้"
            })
        }

        res.send({ status: true, data: result })
    })
}




const GetAllAsUser = (req, res) => {
    const round_list_id = req.params.round_list_id

    // Validate input parameters
    if (!round_list_id) {
        return res.status(400).send({
            status: false,
            error: "Missing required parameter: round_list_id is required",
        })
    }

    LoginRegis.GetAllAsUser(round_list_id, (error, result) => {
        if (error) {
            console.error("Database query error:", error)
            return res.status(500).send({
                status: false,
                error: "Database query failed",
            })
        }

        // Always return success with data array (empty if no results)
        res.send({
            status: true,
            data: result || [],
        })
    })
}

const GetOneUser = (req, res) => {
    const id = req.params.u_id;
    LoginRegis.GetOneUser(id, (error, result) => {
        if (error) {
            return res.status(500).send({ status: false, error: 'Database query failed' });
        }
        if (!result || result.length === 0) {
            return res.status(404).send({ status: false, error: 'User not found' });
        }

        // ส่ง response ในรูปแบบ standard format
        const response = {
            code: 200,
            timestamp: new Date().toISOString(),
            transactionCode: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            success: true,
            titleMessage: 'success',
            message: 'success',
            errorCode: '',
            payload: result[0], // ส่ง object เดียว ไม่ใช่ array
            meta: {
                limit: 1,
                page: 1,
                sort: 'u_id',
                total_pages: 1,
                total_rows: 1
            }
        };

        res.send(response);
    });
};

// Use the shared upload middleware from file_upload.js


function formatDate(dateStr) {
    // ตรวจสอบว่ามีค่าว่างหรือไม่
    if (!dateStr) {
        return null;
    }

    // ถ้าเป็น string ว่าง
    if (typeof dateStr === 'string' && dateStr.trim() === '') {
        return null;
    }

    // แปลงเป็น string ถ้าไม่ใช่
    const dateString = String(dateStr).trim();

    // ตรวจสอบรูปแบบว่าเป็น YYYY-MM-DD หรือไม่
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.warn(`Invalid date format: ${dateString}. Expected format: YYYY-MM-DD`);
        return null;
    }

    // แยกส่วน year, month, day เพื่อเช็คค่าตัวเลข
    const [year, month, day] = dateString.split('-').map(Number);

    // ตรวจสอบช่วงค่าเบื้องต้น
    if (year < 1900 || year > 2100) {
        console.warn(`Invalid year range: ${year}`);
        return null;
    }
    if (month < 1 || month > 12) {
        console.warn(`Invalid month value: ${month}`);
        return null;
    }
    if (day < 1 || day > 31) {
        console.warn(`Invalid day value: ${day}`);
        return null;
    }

    // ถ้าไม่มีปัญหา ก็คืนค่ากลับเป็น YYYY-MM-DD เหมือนเดิม
    return dateString;
}
const register = (req, res) => {
    upload.single('u_img')(req, res, (err) => {
        if (err) {
            console.log("File upload error:", err);
            return res.status(500).json({ status: "error", message: "Error uploading file" });
        }

        const imageUrl = req.file ? req.file.filename : ''; // URL ของไฟล์ที่อัพโหลด

        // ตรวจสอบว่าอีเมลซ้ำหรือไม่
        LoginRegis.findUserByEmail(req.body.u_email, (err, existingUser) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ status: "error", message: "Database error" });
            }
            if (existingUser.length > 0) {
                console.log("Email already exists");
                return res.status(401).json({ status: "error", message: "Email already exists" });
            }

            // ตรวจสอบว่า ID card ซ้ำหรือไม่
            LoginRegis.findUserByIDcard(req.body.u_id_card, (err, existingUserByIdCard) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ status: "error", message: "Database error" });
                }
                if (existingUserByIdCard.length > 0) {
                    console.log("ID card already exists");
                    return res.status(401).json({ status: "error", message: "ID card already exists" });
                }

                // Hash password
                bcrypt.hash(req.body.u_pass, saltRounds, (err, hash) => {
                    if (err) {
                        console.error("Error hashing password:", err);
                        return res.status(500).json({ status: "error", message: "Error hashing password" });
                    }

                    // ตรวจสอบว่า work_start ถูกส่งมาหรือไม่
                    if (!req.body.work_start) {
                        return res.status(400).json({ status: "error", message: "Missing work_start field" });
                    }

                    // แปลง/ตรวจสอบรูปแบบวันที่ (คาดว่าเป็น YYYY-MM-DD จาก <input type='date'>)
                    let formattedDate;
                    try {
                        formattedDate = formatDate(req.body.work_start);
                    } catch (e) {
                        return res.status(400).json({ status: "error", message: e.message });
                    }


                    const UserDetail = {
                        u_email: req.body.u_email,
                        u_pass: hash,
                        level_id: req.body.level_id,
                        prefix_id: req.body.prefix_id,
                        u_fname: req.body.u_fname,
                        u_lname: req.body.u_lname,
                        u_id_card: req.body.u_id_card,
                        u_tel: req.body.u_tel,
                        position_id: req.body.position_id,
                        course_id: req.body.course_id,
                        type_p_id: req.body.type_p_id,
                        u_img: imageUrl,
                        gender: req.body.gender,
                        salary: req.body.salary,
                        age: req.body.age,
                        ex_position_id: req.body.ex_position_id,
                        work_start: formattedDate, // YYYY-MM-DD พร้อมบันทึกลง DB
                    };
                    console.log("User Detail:", UserDetail);

                    // บันทึกข้อมูลผู้ใช้ลงฐานข้อมูล
                    LoginRegis.RegisterUser(UserDetail, (err, result) => {
                        if (err) {
                            console.error("Database error:", err);
                            return res.status(500).json({ status: "error", message: "Database error" });
                        }
                        return res.json({ status: "ok", result: UserDetail });
                    });
                });
            });
        });
    });
};



const updateUser = (req, res) => {
    upload.single('u_img')(req, res, (err) => {
        if (err) {
            console.error("File upload error:", err);
            return res.status(500).json({ status: "error", message: "Error uploading file" });
        }

        const id = req.params.u_id;
        const imageUrl = req.file ? req.file.filename : (req.body.u_img || null);

        LoginRegis.GetOneUser(id, (error, existingUser) => {
            if (error) {
                console.error("Database error:", error);
                return res.status(500).json({ status: "error", message: "Database error" });
            }

            if (!existingUser || existingUser.length === 0) {
                return res.status(404).json({ status: "error", message: "User not found" });
            }

            const updatedUser = {
                u_email: req.body.u_email || existingUser[0].u_email,
                level_id: req.body.level_id ? parseInt(req.body.level_id) : existingUser[0].level_id,
                prefix_id: req.body.prefix_id ? parseInt(req.body.prefix_id) : existingUser[0].prefix_id,
                u_fname: req.body.u_fname || existingUser[0].u_fname,
                u_lname: req.body.u_lname || existingUser[0].u_lname,
                u_id_card: req.body.u_id_card || existingUser[0].u_id_card,
                u_tel: req.body.u_tel || existingUser[0].u_tel,
                position_id: req.body.position_id ? parseInt(req.body.position_id) : existingUser[0].position_id,
                course_id: req.body.course_id ? parseInt(req.body.course_id) : existingUser[0].course_id,
                type_p_id: req.body.type_p_id ? parseInt(req.body.type_p_id) : existingUser[0].type_p_id,
                u_img: imageUrl || existingUser[0].u_img, // ใช้รูปเดิมหากไม่มีรูปใหม่
                gender: req.body.gender || existingUser[0].gender,
                salary: req.body.salary || existingUser[0].salary,
                age: req.body.age || existingUser[0].age,
                work_start: req.body.work_start ? formatDate(req.body.work_start) : existingUser[0].work_start,
                ex_position_id: req.body.ex_position_id ? parseInt(req.body.ex_position_id) : existingUser[0].ex_position_id
            };

            LoginRegis.UpdateUser(id, updatedUser, (updateError, result) => {
                if (updateError) {
                    console.error("Database error:", updateError);
                    return res.status(500).json({ status: "error", message: "Database error" });
                }

                return res.json({
                    code: 200,
                    timestamp: new Date().toISOString(),
                    transactionCode: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    success: true,
                    titleMessage: 'success',
                    message: 'User updated successfully',
                    errorCode: '',
                    payload: [updatedUser],
                    meta: {
                        limit: 1,
                        page: 1,
                        sort: 'u_id',
                        total_pages: 1,
                        total_rows: 1
                    }
                });
            });
        });
    });
};

// Update Profile API - สำหรับแก้ไขข้อมูลส่วนตัวของผู้ใช้ที่ล็อกอินอยู่
const updateProfile = (req, res) => {
    upload.single('u_img')(req, res, (err) => {
        if (err) {
            console.error("File upload error:", err);
            return res.status(500).json({
                success: false,
                message: "Error uploading file"
            });
        }

        // ใช้ user ID จาก JWT token (ที่ผ่าน middleware auth)
        const userId = req.user.id;

        console.log('Update Profile Debug:');
        console.log('User ID:', userId);
        console.log('File uploaded:', req.file ? req.file.filename : 'No file');
        console.log('File path:', req.file ? req.file.path : 'No file path');
        console.log('Upload folder: using shared middleware');
        console.log('Body keys:', Object.keys(req.body));
        console.log('Body values:', req.body);
        console.log('Content-Type:', req.headers['content-type']);

        // ตรวจสอบว่าผู้ใช้มีอยู่จริง
        LoginRegis.GetOneUser(userId, (error, existingUser) => {
            if (error) {
                console.error("Database error:", error);
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (!existingUser || existingUser.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // เตรียมข้อมูลสำหรับอัปเดต - รับข้อมูลจาก FormData
            // จัดการรูปภาพ: ถ้ามีไฟล์ใหม่ใช้ไฟล์ใหม่ ถ้าไม่มีใช้รูปเดิม
            const imageUrl = req.file ? req.file.filename : existingUser[0].u_img;

            const updatedUser = {
                u_email: req.body.u_email || existingUser[0].u_email,
                u_fname: req.body.u_fname || existingUser[0].u_fname,
                u_lname: req.body.u_lname || existingUser[0].u_lname,
                u_id_card: req.body.u_id_card || existingUser[0].u_id_card,
                u_tel: req.body.u_tel || existingUser[0].u_tel, // เบอร์ติดต่อ
                prefix_id: parseInt(req.body.prefix_id) || existingUser[0].prefix_id,
                level_id: parseInt(req.body.level_id) || existingUser[0].level_id,
                position_id: parseInt(req.body.position_id) || existingUser[0].position_id,
                ex_position_id: parseInt(req.body.ex_position_id) || existingUser[0].ex_position_id,
                course_id: parseInt(req.body.course_id) || existingUser[0].course_id,
                type_p_id: parseInt(req.body.type_p_id) || existingUser[0].type_p_id,
                branch_id: parseInt(req.body.branch_id) || existingUser[0].branch_id,
                u_img: imageUrl, // รูปโปรไฟล์
                gender: req.body.gender || existingUser[0].gender,
                age: parseInt(req.body.age) || existingUser[0].age,
                salary: parseFloat(req.body.salary) || existingUser[0].salary,
                work_start: req.body.work_start ? formatDate(req.body.work_start) : existingUser[0].work_start
            };



            console.log('Updated User Data:', updatedUser);
            console.log('Work start date processing:');
            console.log('Original work_start:', req.body.work_start);
            console.log('Processed work_start:', updatedUser.work_start);

            // อัปเดตข้อมูลในฐานข้อมูล (ไม่รวม u_pass)
            LoginRegis.UpdateUserProfile(userId, updatedUser, (updateError, result) => {
                if (updateError) {
                    console.error("Database error:", updateError);
                    return res.status(500).json({
                        success: false,
                        message: "Database error: " + updateError.message
                    });
                }

                console.log('Update result:', result);

                // ส่งข้อมูลที่อัปเดตแล้วกลับไป
                return res.json({
                    success: true,
                    message: "Profile updated successfully",
                    payload: [updatedUser]
                });
            });
        });
    });
};

const login = (req, res) => {
    LoginRegis.LoginUser(req.body.u_email, (err, user) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ status: "error", message: "Database error" });
        }

        if (user.length === 0) {
            return res.status(401).json({ status: "error", message: "Email not found" });
        }

        bcrypt.compare(req.body.u_pass, user[0].u_pass, (err, isLogin) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).json({ status: "error", message: "Error comparing passwords" });
            }

            if (isLogin) {
                const secret_token = process.env.TOKEN;
                const token = jwt.sign(
                    {
                        id: user[0].u_id,
                        level_name: user[0].level_name,
                    },
                    secret_token,
                    { expiresIn: '23h' }
                );
                // บันทึก Audit Log สำหรับการเข้าสู่ระบบ
                AuditLog.addLog({
                    u_id: user[0].u_id,
                    action: `User ${user[0].u_fname} ${user[0].u_lname} (ID: ${user[0].u_id}) logged in successful.`,
                    method: 'POST',
                    endpoint: '/api/login',
                    payload: JSON.stringify({ email: user[0].u_email }), // ไม่บันทึกรหัสผ่าน
                    ip_address: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('User-Agent')
                }, (err) => {
                    if (err) console.error("Error logging login action:", err);
                });

                return res.json({
                    status: "ok",
                    message: "Login successful",
                    token: token,
                });
            } else {
                return res.status(401).json({ status: "error", message: "Incorrect password" });
            }
        });
    });
};

const CountAllBranch = (req, res) => {
    LoginRegis.CountAllBranch((err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ status: "error", message: "Database error" });
        }
        return res.json({ status: "ok", message: "Count all branches", data: result });
    });
};

const CountOneBranch = (req, res) => {
    const id = req.params.branch_id;
    LoginRegis.CountOneBranch(id, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ status: "error", message: "Database error" });
        }
        return res.json({ status: "ok", message: "Count one branch", data: result });
    });
};

const CountGroupBranch = (req, res) => {
    LoginRegis.CountGroupBranch((err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ status: "error", message: "Database error" });
        }
        return res.json({ status: "ok", message: "Count group branches", data: result });
    });
};

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // ต้องเป็น App Password ไม่ใช่รหัสผ่านปกติ
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Send reset password email
const sendResetEmail = async (email, resetToken, userName = '') => {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"ระบบสนับสนุนการประเมินภาระงานบุคลากรสายวิชาการ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ลำปาง" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'รีเซ็ตรหัสผ่าน - ระบบสนับสนุนการประเมินภาระงานบุคลากรสายวิชาการ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ลำปาง',
        attachments: [
            {
                filename: 'busi.png',
                path: './images/busi.png',
                cid: 'logo'
            }
        ],
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header with logo -->
                <div style="text-align: center; padding: 20px 0; background-color: #f8f9fa; border-top: 3px solid #2E4497;">
                    <img src="cid:logo" alt="RMUTL Logo" style="width: 60px; height: 60px; margin-bottom: 10px;">
                </div>
                
                <!-- Main content area -->
                <div style="padding: 40px 30px; background-color: #ffffff; border-left: 2px solid #e9ecef; border-right: 2px solid #e9ecef;">
                    <h1 style="color: #2d3436; text-align: center; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">รีเซ็ตรหัสผ่าน</h1>
                    
                    <p style="color: #636e72; font-size: 16px; margin: 20px 0;">สวัสดีคุณ ${userName || 'ผู้ใช้'}</p>
                    
                    <p style="color: #636e72; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                         คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณาคลิกปุ่มด้านล่างเพื่อรีเซ็ตรหัสผ่าน
                    </p>
                    
                    <!-- Reset button -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #6c5ce7; color: white; padding: 7px 20px; 
                                  text-decoration: none; border-radius: 8px; display: inline-block;
                                  font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(108, 92, 231, 0.3);">
                            เปลี่ยนรหัสผ่าน
                        </a>
                    </div>
                    
                    <!-- Fallback link -->
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #636e72; font-size: 14px; margin: 10px 0;">
                            ถ้าปุ่มด้านล่างไม่ทำงาน กรุณาคัดลอกและวางลิงก์ด้านล่างในเบราว์เซอร์ของคุณ:
                        </p>
                        <a href="${resetUrl}" style="color: #6c5ce7; text-decoration: underline; font-size: 14px; word-break: break-all;">
                            ${resetUrl}
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-bottom: 3px solid #6c5ce7;">
                    <p style="color: #636e72; font-size: 14px; margin: 0;">
                        <strong>ระบบสนับสนุนการประเมินภาระงานบุคลากรสายวิชาการ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ลำปาง</strong>
                    </p>
                    <p style="color: #95a5a6; font-size: 12px; margin: 10px 0 0 0;">
                        ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง
                    </p>
                </div>
            </div>
        `
    };

    try {
        // Test transporter connection
        await transporter.verify();
        console.log('Email transporter verified successfully');

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Reset email sent successfully to:', email);
        console.log('Message ID:', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('Error sending reset email:', error);
        console.error('Error details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });
        throw error;
    }
};

// Forgot password controller
const forgotPassword = async (req, res) => {
    const { u_email } = req.body;



    try {
        // 1. ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
        LoginRegis.findUserByEmail(u_email, (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    status: false,
                    message: 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล'
                });
            }

            if (!user || user.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'ไม่พบอีเมลในระบบ'
                });
            }

            // Debug: ตรวจสอบข้อมูลผู้ใช้
            console.log('User data from database:', user[0]);
            console.log('u_fname:', user[0].u_fname);
            console.log('u_lname:', user[0].u_lname);

            // 2. สร้าง reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 ชั่วโมง

            // 3. บันทึก reset token ลงฐานข้อมูล
            LoginRegis.saveResetToken(u_email, resetToken, resetTokenExpiry, (saveErr) => {
                if (saveErr) {
                    console.error('Error saving reset token:', saveErr);
                    return res.status(500).json({
                        status: false,
                        message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
                    });
                }

                // 4. ส่งอีเมล
                const userName = user[0].u_fname ? `${user[0].u_fname} ${user[0].u_lname || ''}`.trim() : '';
                console.log('Generated userName:', userName);
                sendResetEmail(u_email, resetToken, userName)
                    .then(() => {
                        res.json({
                            status: true,
                            message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว'
                        });
                    })
                    .catch((emailErr) => {
                        console.error('Error sending email:', emailErr);
                        res.status(500).json({
                            status: false,
                            message: 'เกิดข้อผิดพลาดในการส่งอีเมล'
                        });
                    });
            });
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            status: false,
            message: 'เกิดข้อผิดพลาดในระบบ'
        });
    }
};

// Reset password controller
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // 1. ตรวจสอบ token
        LoginRegis.findUserByResetToken(token, (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    status: false,
                    message: 'เกิดข้อผิดพลาดในการตรวจสอบ token'
                });
            }

            if (!user || user.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: 'Token ไม่ถูกต้องหรือหมดอายุ'
                });
            }

            // 2. Hash รหัสผ่านใหม่
            bcrypt.hash(newPassword, saltRounds, (hashErr, hashedPassword) => {
                if (hashErr) {
                    console.error('Error hashing password:', hashErr);
                    return res.status(500).json({
                        status: false,
                        message: 'เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน'
                    });
                }

                // 3. อัปเดตรหัสผ่าน
                LoginRegis.updatePassword(user[0].u_id, hashedPassword, (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating password:', updateErr);
                        return res.status(500).json({
                            status: false,
                            message: 'เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน'
                        });
                    }

                    // 4. ลบ reset token
                    LoginRegis.clearResetToken(user[0].u_id, (clearErr) => {
                        if (clearErr) {
                            console.error('Error clearing reset token:', clearErr);
                        }

                        res.json({
                            status: true,
                            message: 'รีเซ็ตรหัสผ่านสำเร็จ'
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: false,
            message: 'เกิดข้อผิดพลาดในระบบ'
        });
    }
};

// Validate reset token controller
const validateResetToken = async (req, res) => {
    const { token } = req.body;

    try {
        // ตรวจสอบ token
        LoginRegis.findUserByResetToken(token, (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    status: false,
                    message: 'เกิดข้อผิดพลาดในการตรวจสอบ token'
                });
            }

            if (!user || user.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: 'Token ไม่ถูกต้องหรือหมดอายุ'
                });
            }

            // ตรวจสอบว่า token หมดอายุหรือไม่
            const now = Date.now();
            if (user[0].reset_token_expiry && now > user[0].reset_token_expiry) {
                return res.status(400).json({
                    status: false,
                    message: 'Token หมดอายุแล้ว กรุณาขอลิงก์ใหม่'
                });
            }

            // Token ถูกต้องและยังไม่หมดอายุ
            return res.json({
                status: true,
                message: 'Token ถูกต้อง'
            });
        });
    } catch (error) {
        console.error('Validate reset token error:', error);
        res.status(500).json({
            status: false,
            message: 'เกิดข้อผิดพลาดในระบบ'
        });
    }
};


// Export users to Excel
const exportUsersToExcel = (req, res) => {
    console.log('Export API called with params:', req.query);

    const params = {
        search: req.query.search || '',
        position_name: req.query.position_name || '',
        branch_name: req.query.branch_name || '',
        course_name: req.query.course_name || '',
        ex_position_name: req.query.ex_position_name || '',
        gender: req.query.gender || '',
        sort: req.query.sort || '',
        order: req.query.order || ''
    };

    // Log active filters
    const activeFilters = Object.entries(params)
        .filter(([key, value]) => value && value !== '')
        .map(([key, value]) => `${key}: ${value}`);

    if (activeFilters.length > 0) {
        console.log('Active filters for export:', activeFilters);
    } else {
        console.log('No filters applied - exporting all users');
    }

    console.log('Processed params:', params);

    // Get all users data (without pagination for export)
    LoginRegis.GetAllUserForExport(params, (error, result) => {
        if (error) {
            console.error('Database error in export:', error);
            return res.status(500).send({ status: false, error: 'Database query failed' });
        }

        console.log('Database query result count:', result ? result.length : 0);

        if (!result || result.length === 0) {
            console.log('No data found for export');
            console.log('Query params used:', params);
            return res.status(404).send({ status: false, error: 'No data found to export' });
        }

        try {
            console.log('Starting Excel creation...');

            // Prepare data for Excel
            const excelData = result.map((user, index) => ({
                'ลำดับ': index + 1,
                'คำนำหน้า': user.prefix_name || '',
                'ชื่อ': user.u_fname || '',
                'นามสกุล': user.u_lname || '',
                'อีเมล': user.u_email,
                'รหัสประจำตัวมหาลัย': user.u_id_card || '',
                'เบอร์โทรศัพท์': user.u_tel || '',
                'เพศ': user.gender || '',
                'อายุ': user.age || '',
                'เงินเดือน': user.salary || '',
                'วันที่เริ่มงาน': user.work_start || '',
                'ตำแหน่ง': user.position_name || '',
                'ตำแหน่งบริหาร': user.ex_position_name || '',
                'หลักสูตร': user.course_name || '',
                'สาขา': user.branch_name || '',
                'ประเภทบุคลากร': user.type_p_name || ''
            }));

            console.log('Excel data prepared, rows:', excelData.length);

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Set column widths
            const columnWidths = [
                { wch: 8 },   // ลำดับ
                { wch: 25 },  // อีเมล
                { wch: 15 },  // คำนำหน้า
                { wch: 15 },  // ชื่อ
                { wch: 20 },  // นามสกุล
                { wch: 18 },  // เลขบัตรประชาชน
                { wch: 15 },  // เบอร์โทรศัพท์
                { wch: 8 },   // เพศ
                { wch: 8 },   // อายุ
                { wch: 12 },  // เงินเดือน
                { wch: 15 },  // วันที่เริ่มงาน
                { wch: 20 },  // ตำแหน่ง
                { wch: 20 },  // ตำแหน่งบริหาร
                { wch: 20 },  // หลักสูตร
                { wch: 20 },  // สาขา
                { wch: 20 }   // ประเภทบุคลากร
            ];
            worksheet['!cols'] = columnWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อผู้ใช้');

            console.log('Workbook created, generating buffer...');

            // Generate Excel file buffer
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            console.log('Excel buffer generated, size:', excelBuffer.length);

            // Set response headers for file download
            const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', excelBuffer.length);

            console.log('Sending Excel file...');

            // Send the Excel file
            res.send(excelBuffer);

            console.log('Excel file sent successfully');

        } catch (error) {
            console.error('Error creating Excel file:', error);
            console.error('Error stack:', error.stack);
            return res.status(500).send({ status: false, error: 'Error creating Excel file: ' + error.message });
        }
    });
};

const deleteUser = (req, res) => {
    const id = req.params.u_id;

    LoginRegis.DeleteUser(id, (error, result) => {
        if (error) {
            console.error("Database error:", error);
            return res.status(500).json({
                status: "error",
                message: "Database error"
            });
        }

        return res.json({
            status: "ok",
            message: "User deleted successfully"
        });
    });
};

const getMe = (req, res) => {
    const userId = req.user.id;
    LoginRegis.GetOneUser(userId, (error, result) => {
        if (error) {
            return res.status(500).json({ status: false, error: 'Database query failed' });
        }
        if (!result || result.length === 0) {
            return res.status(404).json({ status: false, error: 'User not found' });
        }
        res.json({
            code: 200,
            success: true,
            payload: result[0],
        });
    });
};

module.exports = {
    register,
    login,
    getMe,
    GetAllUser,
    GetAllExUser,
    GetAllAsUser,
    GetOneUser,
    updateUser,
    updateProfile,
    deleteUser,
    CountAllBranch,
    CountOneBranch,
    CountGroupBranch,
    forgotPassword,
    validateResetToken,
    resetPassword,
    exportUsersToExcel
};
