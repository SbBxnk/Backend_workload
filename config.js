const mysql = require('mysql2');
require('dotenv').config();

const connectDB = () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true, // รอให้มี connection ว่างใน pool
        connectionLimit: 10,     // จำนวน connection สูงสุดใน pool
        queueLimit: 0,           // ไม่จำกัดคิวสำหรับรอ connection (0 = ไม่จำกัด)
        keepAliveInitialDelay: 10000, // ส่ง ping ทุก 10 วินาทีเพื่อรักษา connection
        enableKeepAlive: true    // เปิดใช้งาน keep-alive เพื่อป้องกัน timeout
    });

    // ตรวจสอบการเชื่อมต่อครั้งแรก
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return;
        }
        console.log('Connected to database successfully!');
        connection.release(); // คืน connection กลับไปที่ pool
    });

    // จัดการ error ของ pool เช่น reconnection
    pool.on('error', (err) => {
        console.error('Database pool error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Attempting to reconnect...');
            // การ reconnect จะถูกจัดการโดย pool อัตโนมัติ
        } else {
            throw err;
        }
    });

    return pool;
};

module.exports = connectDB;