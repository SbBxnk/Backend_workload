const ADMIN_MENUS = [
    {
        title: 'หน้าหลัก',
        items: [
            { id: 1, label: 'แดชบอร์ด', icon: 'LayoutDashboard', href: '/admin' },
            { id: 2, label: 'บันทึกการตรวจสอบ', icon: 'ShieldCheck', href: '/admin/audit-logs' },
            { id: 3, label: 'ข้อมูลส่วนตัว', icon: 'User', href: '/admin/profile' },
        ],
    },
    {
        title: 'บุคลากร',
        items: [
            { id: 1, label: 'รายชื่อบุคลากร', icon: 'BookUser', href: '/admin/personal-list' },
        ],
    },
    {
        title: 'ข้อมูลรอบการประเมินภาระงาน',
        items: [
            { id: 1, label: 'กำหนดรอบการประเมิน', icon: 'CalendarClock', href: '/admin/set-assessor' },
        ],
    },
    {
        title: 'จัดการแบบประเมินภาระงาน',
        items: [
            { id: 1, label: 'กลุ่มภาระงาน', icon: 'CheckSquare', href: '/admin/workload-group' },
            { id: 2, label: 'ภาระงานหลัก', icon: 'LayoutList', href: '/admin/main-task' },
            { id: 3, label: 'ภาระงานย่อย', icon: 'Logs', href: '/admin/sub-task' },
            { id: 4, label: 'รายการสมรรถนะ', icon: 'BicepsFlexed', href: '/admin/competency' },
            { id: 5, label: 'เกณฑ์จำนวนภาระงาน', icon: 'NotepadText', href: '/admin/workload-quantity' },
            { id: 6, label: 'เกณฑ์สมรรถนะ', icon: 'Sheet', href: '/admin/performance-term' },
        ],
    },
    {
        title: 'ข้อมูลมาสเตอร์',
        items: [
            { id: 1, label: 'คำนำหน้า', icon: 'CircleHelp', href: '/admin/prefix' },
            { id: 2, label: 'ตำแหน่งวิชาการ', icon: 'Armchair', href: '/admin/position' },
            { id: 3, label: 'ตำแหน่งบริหาร', icon: 'Sofa', href: '/admin/ex-position' },
            { id: 4, label: 'สาขา', icon: 'GraduationCap', href: '/admin/branch' },
            { id: 5, label: 'หลักสูตร', icon: 'LibraryBig', href: '/admin/course' },
            { id: 6, label: 'ประเภทบุคลากร', icon: 'UserPen', href: '/admin/personal-type' },
        ],
    },
];

const USER_MENUS = [
    {
        title: 'หน้าหลัก',
        items: [
            { id: 1, label: 'แดชบอร์ด', icon: 'LayoutDashboard', href: '/user' },
            { id: 2, label: 'ข้อมูลส่วนตัว', icon: 'User', href: '/user/profile' },
            { id: 3, label: 'ฟอร์มประเมินภาระงาน', icon: 'NotepadText', href: '/user/workload_round' },
            { id: 4, label: 'ประวัติการประเมิน', icon: 'ChartColumn', href: '/user/workload_form_history' },
        ],
    },
];

const ASSESSOR_MENUS = [
    {
        title: 'หน้าหลัก',
        items: [
            { id: 1, label: 'แดชบอร์ด', icon: 'LayoutDashboard', href: '/user' },
            { id: 2, label: 'ข้อมูลส่วนตัว', icon: 'User', href: '/user/profile' },
            { id: 3, label: 'ฟอร์มประเมินภาระงาน', icon: 'NotepadText', href: '/user/workload_round' },
            { id: 4, label: 'ประวัติการประเมิน', icon: 'ChartColumn', href: '/user/workload_form_history' },
        ],
    },
    {
        title: 'การประเมิน',
        items: [
            { id: 1, label: 'ตรวจประเมินภาระงาน', icon: 'ClipboardCheck', href: '/user/assessment' },
        ],
    },
];

const MENU_BY_ROLE = {
    'ผู้ดูแลระบบ': ADMIN_MENUS,
    'ผู้ใช้งานทั่วไป': USER_MENUS,
    'ผู้ประเมิน': ASSESSOR_MENUS,
};

const getSidebar = (req, res) => {
    const levelName = req.user.level_name;
    const menus = MENU_BY_ROLE[levelName] || USER_MENUS;
    const isAdmin = levelName === 'ผู้ดูแลระบบ';

    res.json({
        code: 200,
        success: true,
        payload: {
            menus,
            isAdmin,
        },
    });
};

module.exports = { getSidebar };
