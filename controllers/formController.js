const WorkloadForm = require("../models/formModel")
const path = require("path")
const fs = require("fs")

// Helper function to create ResponsePayload format
const createResponse = (success, message, data = [], errorCode = null) => {
  return {
    code: success ? 200 : 500,
    timestamp: new Date().toISOString(),
    transactionCode: `TXN_${Date.now()}`,
    success: success,
    titleMessage: success ? "สำเร็จ" : "เกิดข้อผิดพลาด",
    message: message,
    errorCode: errorCode || (success ? null : "INTERNAL_ERROR"),
    payload: Array.isArray(data) ? data : [data],
    meta: {
      limit: 100,
      page: 1,
      sort: "id",
      total_pages: 1,
      total_rows: Array.isArray(data) ? data.length : (data ? 1 : 0)
    }
  }
}

const getAllFormList = (req, res) => {
  WorkloadForm.getAllFormList((error, result) => {
    if (error) {
      return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
    }
    if (!result || result.length === 0) {
      return res.status(404).send({ status: false, error: "ไม่พบข้อมูล" })
    }
    res.send({ status: true, data: result })
  })
}

const getTermForm = (req, res) => {
  console.log("Reached getTermForm")
  WorkloadForm.getTermForm((error, result) => {
    console.log("Error:", error, "Result:", result)
    if (error) {
      return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
    }
    if (!result || result.length === 0) {
      return res.status(404).send({ status: false, error: "ไม่พบข้อมูล" })
    }
    res.send({ status: true, data: result })
  })
}

const checkGroupID = (req, res) => {
  const as_u_id = req.params.as_u_id
  const round_list_id = req.params.round_list_id
  console.log('🔍 checkGroupID called with as_u_id:', as_u_id, 'round_list_id:', round_list_id)

  WorkloadForm.checkGroupID(as_u_id, round_list_id, (error, result) => {
    console.log('🔍 checkGroupID result:', { error, result })
    if (error) {
      console.error('❌ checkGroupID error:', error)
      return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
    }
    if (result && result.length > 0) {
      console.log('✅ checkGroupID found existing data:', result)
      return res.send({ status: true, data: result })
    }

    // ถ้าไม่มีข้อมูลใน workload_formlist ให้ return null
    console.log('❌ No existing data in workload_formlist')
    return res.send({ status: true, data: [] })
  })
}

const addFormList = (req, res) => {
  const WorkloadFormDetail = req.body
  WorkloadForm.addFormList(WorkloadFormDetail, (error, result) => {
    if (error) {
      return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
    }
    res.send({ status: true, message: "เพิ่มข้อมูลสำเร็จ", data: result })
  })
}

const addFormListBulk = (req, res) => {
  const WorkloadFormDetails = req.body
  
  if (!Array.isArray(WorkloadFormDetails)) {
    console.log('❌ Not an array:', typeof WorkloadFormDetails)
    return res.status(400).json({
      status: false,
      error: "ข้อมูลต้องเป็น array"
    })
  }
  
  // ตรวจสอบว่า array ไม่ว่าง
  if (WorkloadFormDetails.length === 0) {
    return res.status(400).json({
      status: false,
      error: "ไม่พบข้อมูลสำหรับเพิ่ม"
    })
  }
  
  // ตรวจสอบข้อมูลใน array
  for (let i = 0; i < WorkloadFormDetails.length; i++) {
    const item = WorkloadFormDetails[i]
    console.log(`🔍 Item ${i}:`, { set_asses_list_id: item.set_asses_list_id, status_id: item.status_id })
    
    if (!item.set_asses_list_id || item.status_id === undefined) {
      return res.status(400).json({
        status: false,
        error: "ข้อมูลไม่ครบถ้วน: ต้องระบุ set_asses_list_id และ status_id"
      })
    }
  }
  
  WorkloadForm.addFormListBulk(WorkloadFormDetails, (error, result) => {
    if (error) {
      console.error("❌ Bulk insert error:", error)
      console.error("❌ Error details:", {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      })
      
      // ตรวจสอบว่าเป็น duplicate key error หรือไม่
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ Duplicate entry detected, but this is expected behavior')
        return res.status(200).json({
          status: true,
          message: `ข้อมูลบางส่วนอาจซ้ำกัน แต่การดำเนินการเสร็จสิ้น`,
          data: {
            affectedRows: 0,
            insertId: null
          }
        })
      }
      
      return res.status(500).json({
        status: false,
        error: "การเชื่อมต่อข้อมูลผิดพลาด"
      })
    }
    
    console.log('✅ Bulk insert successful:', result)
    res.status(200).json({
      status: true,
      message: `เพิ่มข้อมูลสำเร็จ ${result.affectedRows} รายการ`,
      data: {
        affectedRows: result.affectedRows,
        insertId: result.insertId
      }
    })
  })
}

const selectWorkloadFormGroup = (req, res) => {
  const as_u_id = req.params.as_u_id
  const { workload_group_id, round_id } = req.body

  if (!workload_group_id || !round_id) {
    return res.status(400).send({
      status: false,
      error: "กรุณาระบุ workload_group_id และ round_id",
    })
  }

  WorkloadForm.selectWorkloadFormGroup(workload_group_id, as_u_id, round_id, (error, result) => {
    if (error) {
      return res.status(500).send({
        status: false,
        error: "การเชื่อมต่อข้อมูลผิดพลาด",
      })
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({
        status: false,
        error: "ไม่พบข้อมูลที่ตรงกับ as_u_id และ round_id",
      })
    }

    res.send({
      status: true,
      message: "อัปเดตข้อมูลสำเร็จ",
      data: result,
    })
  })
}

const getAllFormInfo = (req, res) => {
  WorkloadForm.getAllFormInfo((error, result) => {
    if (error) {
      return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
    }
    if (!result || result.length === 0) {
      return res.status(404).send({ status: false, error: "ไม่พบข้อมูล" })
    }
    res.send({ status: true, data: result })
  })
}

const getOneFormInfo = (req, res) => {
  const { formlist_id, subtask_id } = req.params
  const as_u_id = req.query.as_u_id // รับ as_u_id จาก query parameter

  WorkloadForm.getOneFormInfo(formlist_id, subtask_id, (error, formResult) => {
    if (error) {
      console.error("Error fetching form info:", error)
      return res.status(500).json({ error: "Database query error" })
    }

    if (formResult.length === 0) {
      return res.status(404).json({ message: "Form info not found" })
    }

    // กรองข้อมูลตาม as_u_id ถ้ามีการระบุ
    let filteredResult = formResult
    if (as_u_id) {
      filteredResult = formResult.filter((row) => row.as_u_id == as_u_id)
      if (filteredResult.length === 0) {
        return res.status(404).json({ message: "Form info not found for specified user" })
      }
    }

    // สร้าง Map เพื่อจัดกลุ่มข้อมูลตาม form_id
    const formMap = new Map()

    // จัดกลุ่มข้อมูลฟอร์มและลิงก์
    filteredResult.forEach((row) => {
      const formId = row.form_id

      if (!formMap.has(formId)) {
        // สร้างข้อมูลฟอร์มใหม่
        const formData = { ...row, links: [], files: [] }
        delete formData.link_id
        delete formData.link_name
        delete formData.link_path
        formMap.set(formId, formData)
      }

      // เพิ่มข้อมูลลิงก์ถ้ามี
      if (row.link_id) {
        const form = formMap.get(formId)
        form.links.push({
          link_id: row.link_id,
          link_name: row.link_name,
          link_path: row.link_path,
          form_id: formId,
        })
      }
    })

    // ดึงข้อมูลไฟล์สำหรับแต่ละฟอร์ม
    Promise.all(
      Array.from(formMap.values()).map((formData) => {
        return new Promise((resolve, reject) => {
          WorkloadForm.getFilesByFormId(formData.form_id, (fileError, fileResult) => {
            if (fileError) {
              console.error("Error fetching file info:", fileError)
              reject(fileError)
              return
            }

            formData.files = fileResult || []
            resolve(formData)
          })
        })
      }),
    )
      .then((data) => {
        res.send({ status: true, data })
      })
      .catch((error) => {
        console.error("Error in processing files:", error)
        res.status(500).json({ error: "Error processing files" })
      })
  })
}

const addFormInfo = (req, res) => {
  const { as_u_id, formlist_id, subtask_id, form_title, description, workload, quality, file_type, ex_score, links } =
    req.body
  const files = req.files

  // แสดงข้อมูลที่ได้รับเพื่อการ debug
  console.log("=== addFormInfo Debug ===");
  console.log("Request body:", req.body);
  console.log("Files received:", files ? files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })) : 'No files');
  console.log("Files length:", files ? files.length : 0);
  console.log("File type:", file_type);
  console.log("Links received:", typeof links === 'string' ? JSON.parse(links) : links);
  console.log("Request headers:", req.headers);
  console.log("Content-Type:", req.headers['content-type']);

  // Validate required fields
  if (!as_u_id || !formlist_id || !subtask_id || !form_title || !workload || !quality || !file_type) {
    return res.status(400).send({
      status: false,
      error: "ข้อมูลไม่ครบถ้วน: ต้องระบุ as_u_id, formlist_id, subtask_id, form_title, workload, quality, และ file_type",
    })
  }

  // Validate file_type and related fields
  if (file_type === "external file" && (!files || files.length === 0)) {
    return res.status(400).send({ status: false, error: "ต้องอัปโหลดไฟล์สำหรับ file_type: external file" })
  }
  
  // แปลง links จาก string เป็น object ถ้าจำเป็น
  let parsedLinks = links;
  if (file_type === "link") {
    if (typeof links === 'string') {
      try {
        parsedLinks = JSON.parse(links);
      } catch (e) {
        console.error("Error parsing links JSON:", e);
        return res.status(400).send({ status: false, error: "รูปแบบลิงก์ไม่ถูกต้อง" });
      }
    }
    
    if (!parsedLinks || !Array.isArray(parsedLinks) || parsedLinks.length === 0) {
      return res.status(400).send({ status: false, error: "ต้องระบุอย่างน้อยหนึ่งลิงก์สำหรับ file_type: link" });
    }
  }
  
  if (file_type === "link" && files && files.length > 0) {
    return res.status(400).send({ status: false, error: "ไม่สามารถอัปโหลดไฟล์เมื่อ file_type เป็น link" })
  }
  if (file_type === "file in system" && (!files || files.length === 0)) {
    return res.status(400).send({ status: false, error: "ต้องอัปโหลดไฟล์สำหรับ file_type: file in system" })
  }

  // Prepare form data (without link and link_name)
  const WorkloadFormInfoDetail = {
    as_u_id: Number.parseInt(as_u_id),
    formlist_id: Number.parseInt(formlist_id),
    subtask_id: Number.parseInt(subtask_id),
    form_title,
    description: description || "",
    workload: Number.parseInt(workload),
    quality: Number.parseInt(quality),
    file_type,
    ex_score: Number.parseInt(ex_score) || 0,
  }

  // Insert form info
  WorkloadForm.addFormInfo(WorkloadFormInfoDetail, (error, result) => {
    if (error) {
      console.error("Database Error:", error)
      return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
    }

    const form_id = result.insertId
    let linksAdded = file_type !== "link"; // ถ้าไม่ใช่ประเภท link ให้ถือว่าเพิ่ม link แล้ว
    let filesAdded = file_type !== "external file" && file_type !== "file in system"; // ถ้าไม่ใช่ประเภทไฟล์ ให้ถือว่าเพิ่มไฟล์แล้ว

    // Function to handle response after all operations are complete
    const sendResponse = () => {
      if (!linksAdded || !filesAdded) {
        return // Wait for both operations to complete
      }

      // Fetch the complete form data to return
      WorkloadForm.getFormDetail(form_id, (fetchError, formResult) => {
        if (fetchError) {
          console.error("Error fetching form details:", fetchError)
          return res.status(500).send({ status: false, error: "ไม่สามารถดึงข้อมูลเพิ่มเติมได้" })
        }

        if (!formResult || formResult.length === 0) {
          console.error("No form details found for form_id:", form_id);
          return res.status(404).send({ status: false, error: "ไม่พบข้อมูลฟอร์มที่เพิ่ง่สร้าง" });
        }

        // Process the form data to create a structured response
        const formData = {
          form_id,
          as_u_id: WorkloadFormInfoDetail.as_u_id,
          formlist_id: WorkloadFormInfoDetail.formlist_id,
          form_title: WorkloadFormInfoDetail.form_title,
          description: WorkloadFormInfoDetail.description,
          workload: WorkloadFormInfoDetail.workload,
          quality: WorkloadFormInfoDetail.quality,
          file_type: WorkloadFormInfoDetail.file_type,
          ex_score: WorkloadFormInfoDetail.ex_score,
          files: [],
          links: [],
        }

        // Add file information if available
        const uniqueFileIds = new Set()
        formResult.forEach((row) => {
          if (row.fileinfo_id && !uniqueFileIds.has(row.fileinfo_id)) {
            uniqueFileIds.add(row.fileinfo_id)
            formData.files.push({
              fileinfo_id: row.fileinfo_id,
              file_name: row.file_name,
              size: row.size,
              form_id: row.form_id,
            })
          }
        })

        // Add link information if available
        const uniqueLinkIds = new Set()
        formResult.forEach((row) => {
          if (row.link_id && !uniqueLinkIds.has(row.link_id)) {
            uniqueLinkIds.add(row.link_id)
            formData.links.push({
              link_id: row.link_id,
              link_name: row.link_name,
              link_path: row.link_path,
              form_id: row.form_id,
            })
          }
        })

        res.send({ status: true, message: "เพิ่มข้อมูลสำเร็จ", data: [formData] })
      })
    }

    // Add links if file_type is "link"
    if (file_type === "link" && parsedLinks && parsedLinks.length > 0) {
      const linkData = parsedLinks.map((link) => ({
        form_id,
        link_name: link.link_name || link.link_path,
        link_path: link.link_path,
      }))

      WorkloadForm.addLinkInfo(linkData, (linkError, linkResult) => {
        if (linkError) {
          console.error("Error adding links:", linkError)
          return res.status(500).send({ status: false, error: "ไม่สามารถเพิ่มลิงก์ได้" })
        }
        console.log("Links added successfully:", linkResult);
        linksAdded = true
        sendResponse()
      })
    }

    // Add files if file_type is "external file" or "file in system"
    if ((file_type === "external file" || file_type === "file in system") && files && files.length > 0) {
      // Create directory if it doesn't exist
      const uploadDir = path.join(__dirname, "../public/files")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const fileData = []
      const filePromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          // ไฟล์ถูกบันทึกแล้วโดย multer diskStorage
          // ใช้ file.filename ที่ multer สร้างให้
          const fileName = file.filename
          const filePath = file.path

          console.log(`File saved: ${fileName} at ${filePath}`)

          fileData.push({
            form_id,
            file_name: fileName,
            size: file.size,
          })
          resolve()
        })
      })

      Promise.all(filePromises)
        .then(() => {
          if (fileData.length > 0) {
            WorkloadForm.addFileInfo(fileData, (fileError, fileResult) => {
              if (fileError) {
                console.error("Error adding file info to database:", fileError)
                return res.status(500).send({ status: false, error: "ไม่สามารถเพิ่มข้อมูลไฟล์ได้" })
              }
              console.log("Files added successfully:", fileResult);
              filesAdded = true
              sendResponse()
            })
          } else {
            console.error("No file data to add to database");
            return res.status(500).send({ status: false, error: "ไม่มีข้อมูลไฟล์ที่จะเพิ่ม" })
          }
        })
        .catch((error) => {
          console.error("Error processing files:", error)
          return res.status(500).send({ status: false, error: "ไม่สามารถประมวลผลไฟล์ได้" })
        })
    }
  })
}

const getFilesRound = (req, res) => {
  const formlist_id = req.params.formlist_id
  WorkloadForm.getFilesRound(formlist_id, (error, result) => {
    if (error) {
      return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
    }
    if (!result || result.length === 0) {
      return res.status(404).send({ status: false, error: "ไม่พบข้อมูล" })
    }

    const filesWithUrls = result.map((file) => ({
      ...file,
      url: `/images/${file.file_name}`,
    }))

    res.send({ status: true, data: filesWithUrls })
  })
}

const deleteFormInfo = (req, res) => {
  const form_id = req.params.form_id

  // ก่อนลบข้อมูลในฐานข้อมูล ให้ดึงข้อมูลไฟล์ที่เกี่ยวข้องก่อน
  WorkloadForm.getFilesByFormId(form_id, (fileError, files) => {
    if (fileError) {
      console.error("Error fetching files for deletion:", fileError)
      return res.status(500).send({ status: false, error: "ไม่สามารถดึงข้อมูลไฟล์ได้" })
    }

    // ลบข้อมูลในฐานข้อมูล
    WorkloadForm.deleteFormInfo(form_id, (error, result) => {
      if (error) {
        return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
      }
      if (!result || result.affectedRows === 0) {
        return res.status(404).send({ status: false, error: "ไม่พบข้อมูล" })
      }

      // หากมีไฟล์ที่เกี่ยวข้อง ให้ลบไฟล์ออกจากเซิร์ฟเวอร์
      if (files && files.length > 0) {
        const uploadDir = path.resolve(__dirname, "../../Frontwokrload/public/files")

        // ลบไฟล์แต่ละไฟล์
        files.forEach((file) => {
          const filePath = path.join(uploadDir, file.file_name)

          // ตรวจสอบว่าไฟล์มีอยู่จริงก่อนลบ
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath)
              console.log(`ลบไฟล์สำเร็จ: ${filePath}`)
            } catch (unlinkError) {
              console.error(`ไม่สามารถลบไฟล์ ${filePath}:`, unlinkError)
              // ไม่ return error เพราะเราต้องการให้ API ตอบกลับว่าลบข้อมูลสำเร็จ แม้จะลบไฟล์ไม่สำเร็จ
            }
          } else {
            console.warn(`ไม่พบไฟล์ที่จะลบ: ${filePath}`)
          }
        })
      }

      res.send({ status: true, message: "ลบข้อมูลสําเร็จ" })
    })
  })
}

// แก้ไขฟังก์ชัน getFormDetail ในส่วน controller เพื่อรองรับรูปแบบข้อมูลใหม่
const getFormDetail = (req, res) => {
  const form_id = req.params.form_id
  const as_u_id = req.query.as_u_id // รับ as_u_id จาก query parameter

  WorkloadForm.getFormDetail(form_id, (error, formResult) => {
    if (error) {
      console.error("Error fetching form detail:", error)
      return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
    }

    if (!formResult || formResult.length === 0) {
      return res.status(404).send({ status: false, error: "ไม่พบข้อมูล" })
    }

    // กรองข้อมูลตาม as_u_id ถ้ามีการระบุ
    let filteredResult = formResult
    if (as_u_id) {
      filteredResult = formResult.filter((row) => row.as_u_id == as_u_id)
      if (filteredResult.length === 0) {
        return res.status(404).send({ status: false, error: "ไม่พบข้อมูลสำหรับผู้ใช้ที่ระบุ" })
      }
    }

    // สร้างโครงสร้างข้อมูลใหม่โดยแยกข้อมูลฟอร์ม, ไฟล์ และลิงก์
    const formData = {
      form_id: filteredResult[0].form_id,
      as_u_id: filteredResult[0].as_u_id,
      formlist_id: filteredResult[0].formlist_id,
      form_title: filteredResult[0].form_title,
      description: filteredResult[0].description,
      workload: filteredResult[0].workload,
      quality: filteredResult[0].quality,
      file_type: filteredResult[0].file_type,
      subtask_id: filteredResult[0].subtask_id,
      ex_score: filteredResult[0].ex_score,
      files: [],
      links: [],
    }

    // เพิ่มข้อมูลไฟล์เข้าไปในผลลัพธ์ (ไม่ซ้ำกัน)
    const uniqueFileIds = new Set()
    filteredResult.forEach((row) => {
      if (row.fileinfo_id && !uniqueFileIds.has(row.fileinfo_id)) {
        uniqueFileIds.add(row.fileinfo_id)
        formData.files.push({
          fileinfo_id: row.fileinfo_id,
          file_name: row.file_name,
          size: row.size,
          form_id: row.form_id,
          url: `/images/${row.file_name}`,
        })
      }
    })

    // เพิ่มข้อมูลลิงก์เข้าไปในผลลัพธ์ (ไม่ซ้ำกัน)
    const uniqueLinkIds = new Set()
    filteredResult.forEach((row) => {
      if (row.link_id && !uniqueLinkIds.has(row.link_id)) {
        uniqueLinkIds.add(row.link_id)
        formData.links.push({
          link_id: row.link_id,
          link_name: row.link_name,
          link_path: row.link_path,
          form_id: row.form_id,
        })
      }
    })

    res.send({ status: true, data: formData })
  })
}

// แก้ไขฟังก์ชัน updateFormInfo เพื่อให้แสดง log เมื่อมีการอัปโหลดรูปภาพ
const checkWorkloadFormStatus = (req, res) => {
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

  WorkloadForm.checkWorkloadFormStatus(as_u_id, round_list_id, (error, result) => {
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
        message: "ไม่พบข้อมูลสถานะ - ยังไม่ได้สร้างข้อมูล workload form",
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

    res.status(200).json({
      code: 200,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: true,
      titleMessage: "สำเร็จ",
      message: "ดึงข้อมูลสถานะสำเร็จ",
      errorCode: null,
      payload: [result[0]],
      meta: {
        limit: 1,
        page: 1,
        sort: "",
        total_pages: 1,
        total_rows: 1
      }
    });
  });
};

const getWorkloadItemsByGroup = (req, res) => {
  const { as_u_id, round_list_id } = req.params;
  
  console.log('API called with params:', { as_u_id, round_list_id });
  
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

  WorkloadForm.getWorkloadItemsByGroup(as_u_id, round_list_id, (error, result) => {
    if (error) {
      console.error('Database Error:', error);
      console.error('Error details:', error.sql || error.message);
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

    console.log('Raw result from database:', result);
    console.log('Number of records:', result ? result.length : 0);

    // จัดกลุ่มข้อมูลตามโครงสร้าง task → subtask → form_info
    const groupedData = {};
    
    if (result && result.length > 0) {
      result.forEach(row => {
        const taskId = row.task_id;
        const subtaskId = row.subtask_id;
        const formId = row.form_id;
        
        // สร้าง task ถ้ายังไม่มี
        if (!groupedData[taskId]) {
          groupedData[taskId] = {
            task_id: row.task_id,
            task_name: row.task_name || `ภาระงาน ${taskId}`,
            workload_group_id: row.workload_group_id,
            workload_group_name: row.workload_group_name,
            quantity_workload_hours: row.quantity_workload_hours,
            subtasks: {}
          };
        }
        
        // สร้าง subtask ถ้ายังไม่มี
        if (!groupedData[taskId].subtasks[subtaskId]) {
          groupedData[taskId].subtasks[subtaskId] = {
            subtask_id: row.subtask_id,
            subtask_name: row.subtask_name || `ภาระงานย่อย ${subtaskId}`,
            form_infos: []
          };
        }
        
        // หา form_info ที่มีอยู่แล้ว
        let existingForm = groupedData[taskId].subtasks[subtaskId].form_infos.find(
          form => form.form_id === formId
        );
        
        // ถ้ายังไม่มี form_info นี้ ให้สร้างใหม่
        if (!existingForm) {
          existingForm = {
            form_id: row.form_id,
            form_title: row.form_title,
            description: row.description,
            workload: row.workload,
            quality: row.quality,
            file_type: row.file_type,
            ex_score: row.ex_score,
            evidence: row.file_type === 'link' ? row.link_name : row.file_name,
            link_name: row.link_name,
            link_path: row.link_path,
            files: [],  // Array สำหรับเก็บหลายไฟล์
            links: []   // Array สำหรับเก็บหลาย link
          };
          groupedData[taskId].subtasks[subtaskId].form_infos.push(existingForm);
        }
        
        // เพิ่มไฟล์หรือ link ถ้ามี
        if (row.file_name && row.fileinfo_id) {
          // ตรวจสอบว่าไฟล์นี้มีอยู่แล้วหรือไม่
          const existingFile = existingForm.files.find(file => file.fileinfo_id === row.fileinfo_id);
          if (!existingFile) {
            existingForm.files.push({
              fileinfo_id: row.fileinfo_id,
              file_name: row.file_name
            });
          }
        }
        
        if (row.link_name && row.link_path) {
          // ตรวจสอบว่า link นี้มีอยู่แล้วหรือไม่
          const existingLink = existingForm.links.find(link => link.link_path === row.link_path);
          if (!existingLink) {
            existingForm.links.push({
              link_name: row.link_name,
              link_path: row.link_path
            });
          }
        }
      });
    }

    const finalData = Object.values(groupedData);

    res.status(200).json({
      code: 200,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: true,
      titleMessage: "สำเร็จ",
      message: "ดึงข้อมูลภาระงานสำเร็จ",
      errorCode: null,
      payload: finalData,
      meta: {
        limit: finalData.length,
        page: 1,
        sort: "",
        total_pages: 1,
        total_rows: finalData.length
      }
    });
  });
};

const updateFormInfo = (req, res) => {
  const {
    form_id,
    form_title,
    description,
    workload,
    quality,
    file_type,
    ex_score,
    links,
    existing_links,
    links_to_delete,
  } = req.body
  const files = req.files
  const existingFiles = req.body.existing_files
  const filesToDelete = req.body.files_to_delete

  if (!form_id || !form_title || !workload || !quality || !file_type) {
    return res.status(400).send({
      status: false,
      error: "ข้อมูลไม่ครบถ้วน: ต้องระบุ form_id, form_title, workload, quality, และ file_type",
    })
  }

  // Validate file_type and related fields
  if (file_type === "link" && (!links || links.length === 0) && (!existing_links || existing_links.length === 0)) {
    return res.status(400).send({
      status: false,
      error: "ต้องมีอย่างน้อยหนึ่งลิงก์สำหรับ file_type: link",
    })
  }

  // ตรวจสอบว่ามีไฟล์ใหม่หรือไม่
  const hasNewFiles = files && files.length > 0

  // ตรวจสอบและแสดงข้อมูลไฟล์ที่อัปโหลด
  if (hasNewFiles) {
    console.log(
      "Files being uploaded:",
      files.map((file) => ({
        name: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        isImage: /^image\//.test(file.mimetype),
      })),
    )
  }

  // ตรวจสอบเงื่อนไขสำหรับ file_type
  if (file_type === "external file" && !hasNewFiles) {
    // ถ้าเป็น external file แต่ไม่มีไฟล์ใหม่ ให้ตรวจสอบว่ามีไฟล์เก่าหรือไม่
    WorkloadForm.getFilesByFormId(form_id, (fileError, existingDbFiles) => {
      if (fileError) {
        return res.status(500).send({ status: false, error: "ไม่สามารถตรวจสอบไฟล์เดิมได้" })
      }

      // ถ้าไม่มีไฟล์เก่าและไม่มีไฟล์ใหม่ ให้แจ้งเตือน
      if (!existingDbFiles || existingDbFiles.length === 0) {
        return res.status(400).send({
          status: false,
          error: "ต้องมีไฟล์อย่างน้อย 1 ไฟล์สำหรับ file_type: external file",
        })
      }

      // ถ้ามีไฟล์เก่า ให้ดำเนินการต่อ
      continueUpdate()
    })
  } else {
    // กรณีอื่นๆ ให้ดำเนินการต่อได้เลย
    continueUpdate()
  }

  function continueUpdate() {
    const formData = {
      form_id: Number.parseInt(form_id),
      form_title,
      description: description || "",
      workload: Number.parseInt(workload),
      quality: Number.parseInt(quality),
      file_type,
      ex_score: Number.parseInt(ex_score) || 0,
    }

    WorkloadForm.updateFormInfo(formData, (error, result) => {
      if (error) {
        return res.status(500).send({ status: false, error: "การเชื่อมต่อข้อมูลผิดพลาด" })
      }

      // เตรียมตัวแปรเก็บรายการไฟล์และลิงก์ที่ถูกลบ
      let deletedFiles = []
      let deletedLinks = []
      let operationsCompleted = 0
      const totalOperations = 5 // File deletion, link deletion, file addition, link addition, and form update

      // Function to check if all operations are complete and send response
      const checkOperationsComplete = () => {
        operationsCompleted++
        if (operationsCompleted >= totalOperations) {
          getUpdatedFormData()
        }
      }

      // 1. ลบไฟล์ที่ระบุใน filesToDelete โดยตรง
      const deleteSpecifiedFiles = () => {
        // แปลงเป็น array ถ้าเป็น string เดียว
        const fileIdsToDelete = Array.isArray(filesToDelete) ? filesToDelete : filesToDelete ? [filesToDelete] : []

        if (fileIdsToDelete.length > 0) {
          console.log("Files explicitly marked for deletion:", fileIdsToDelete)

          // ดึงข้อมูลไฟล์ที่จะลบ
          WorkloadForm.getFilesByIds(fileIdsToDelete, (fileError, filesToRemove) => {
            if (fileError) {
              console.error("Error fetching files to delete:", fileError)
              checkOperationsComplete()
              return
            }

            if (!filesToRemove || filesToRemove.length === 0) {
              console.log("No files found to delete with IDs:", fileIdsToDelete)
              checkOperationsComplete()
              return
            }

            // เก็บข้อมูลไฟล์ที่จะลบเพื่อส่งกลับให้ client
            deletedFiles = filesToRemove.map((file) => ({
              fileinfo_id: file.fileinfo_id,
              file_name: file.file_name,
            }))

            console.log("Files to be deleted:", deletedFiles)

            // ลบไฟล์จากระบบไฟล์
            const uploadDir = path.resolve(__dirname, "../../Frontwokrload/public/files")

            filesToRemove.forEach((file) => {
              const filePath = path.join(uploadDir, file.file_name)
              if (fs.existsSync(filePath)) {
                try {
                  fs.unlinkSync(filePath)
                  console.log(`ลบไฟล์สำเร็จ: ${filePath}`)
                } catch (unlinkError) {
                  console.error(`ไม่สามารถลบไฟล์ ${filePath}:`, unlinkError)
                }
              }
            })

            // ลบข้อมูลไฟล์จากฐานข้อมูล
            WorkloadForm.deleteFilesByIds(fileIdsToDelete, (deleteError) => {
              if (deleteError) {
                console.error("Error deleting files from database:", deleteError)
              } else {
                console.log("Successfully deleted files with IDs:", fileIdsToDelete)
              }
              checkOperationsComplete()
            })
          })
        } else {
          checkOperationsComplete()
        }
      }

      // 2. ลบลิงก์ที่ระบุใน links_to_delete โดยตรง
      const deleteSpecifiedLinks = () => {
        // แปลงเป็น array ถ้าเป็น string เดียว
        const linkIdsToDelete = Array.isArray(links_to_delete)
          ? links_to_delete
          : links_to_delete
            ? [links_to_delete]
            : []

        if (linkIdsToDelete.length > 0) {
          console.log("Links explicitly marked for deletion:", linkIdsToDelete)

          // ดึงข้อมูลลิงก์ที่จะลบ
          WorkloadForm.getLinksByFormId(form_id, (linkError, allLinks) => {
            if (linkError) {
              console.error("Error fetching links:", linkError)
              checkOperationsComplete()
              return
            }

            const linksToRemove = allLinks.filter((link) => linkIdsToDelete.includes(String(link.link_id)))

            if (linksToRemove.length === 0) {
              console.log("No links found to delete with IDs:", linkIdsToDelete)
              checkOperationsComplete()
              return
            }

            // เก็บข้อมูลลิงก์ที่จะลบเพื่อส่งกลับให้ client
            deletedLinks = linksToRemove.map((link) => ({
              link_id: link.link_id,
              link_name: link.link_name,
              link_path: link.link_path,
            }))

            console.log("Links to be deleted:", deletedLinks)

            // ลบลิงก์ทีละรายการ
            let deletedCount = 0
            linksToRemove.forEach((link) => {
              WorkloadForm.deleteLinkById(link.link_id, (deleteError) => {
                deletedCount++
                if (deleteError) {
                  console.error(`Error deleting link ID ${link.link_id}:`, deleteError)
                } else {
                  console.log(`Successfully deleted link ID: ${link.link_id}`)
                }

                if (deletedCount === linksToRemove.length) {
                  checkOperationsComplete()
                }
              })
            })
          })
        } else {
          checkOperationsComplete()
        }
      }

      // 3. ลบไฟล์ที่ไม่ได้เลือกเก็บไว้
      const deleteUnselectedFiles = () => {
        // แปลงเป็น array ถ้าเป็น string เดียว
        const existingFileIds = Array.isArray(existingFiles) ? existingFiles : existingFiles ? [existingFiles] : []

        // Add this after parsing the parameters
        console.log("Parsed existing files:", existingFileIds)
        console.log("Raw existing files from request:", req.body.existing_files)
        console.log("Type of existing_files:", typeof req.body.existing_files)

        if (file_type === "external file" || file_type === "file in system") {
          if (existingFileIds.length > 0 || !hasNewFiles) {
            WorkloadForm.deleteUnselectedFiles(form_id, existingFileIds, (deleteError) => {
              if (deleteError) {
                console.error("Error deleting unselected files:", deleteError)
              } else {
                console.log("Successfully deleted unselected files")
              }
              checkOperationsComplete()
            })
          } else {
            console.log("Skipping file deletion because no existing files were specified and new files are being added")
            checkOperationsComplete()
          }
        } else {
          checkOperationsComplete()
        }
      }

      // 4. ลบลิงก์ที่ไม่ได้เลือกเก็บไว้
      const deleteUnselectedLinks = () => {
        // แปลงเป็น array ถ้าเป็น string เดียว
        const existingLinkIds = Array.isArray(existing_links) ? existing_links : existing_links ? [existing_links] : []

        if (file_type === "link") {
          if (existingLinkIds.length > 0) {
            WorkloadForm.deleteUnselectedLinks(form_id, existingLinkIds, (deleteError) => {
              if (deleteError) {
                console.error("Error deleting unselected links:", deleteError)
              } else {
                console.log("Successfully deleted unselected links")
              }
              checkOperationsComplete()
            })
          } else {
            console.log("Skipping link deletion because no existing links were specified")
            checkOperationsComplete()
          }
        } else {
          checkOperationsComplete()
        }
      }

      // 5. เพิ่มไฟล์และลิงก์ใหม่
      const addNewFilesAndLinks = () => {
        let subOperationsCompleted = 0
        const totalSubOperations = 2 // File addition and link addition

        const checkSubOperationsComplete = () => {
          subOperationsCompleted++
          if (subOperationsCompleted >= totalSubOperations) {
            checkOperationsComplete()
          }
        }

        // เพิ่มไฟล์ใหม่เข้าไป (ถ้ามี)
        if (files && files.length > 0 && (file_type === "external file" || file_type === "file in system")) {
          const fileData = files.map((file) => ({
            form_id: Number.parseInt(form_id),
            file_name: file.filename,
            size: file.size,
          }))

          WorkloadForm.addFileInfo(fileData, (fileError) => {
            if (fileError) {
              console.error("Error adding new files:", fileError)
            } else {
              console.log("Successfully added new files")
            }
            checkSubOperationsComplete()
          })
        } else {
          checkSubOperationsComplete()
        }

        // เพิ่มลิงก์ใหม่เข้าไป (ถ้ามี)
        if (links && links.length > 0) {
          // Parse links if it's a string
          const linksArray = typeof links === "string" ? JSON.parse(links) : links

          // Filter out links that already have link_id (they are existing links)
          const newLinks = linksArray.filter((link) => !link.link_id)

          if (newLinks.length > 0) {
            // Prepare link data for insertion
            const linkData = newLinks.map((link) => ({
              form_id: Number.parseInt(form_id),
              link_name: link.link_name || link.link_path,
              link_path: link.link_path,
            }))

            WorkloadForm.addLinkInfo(linkData, (linkError) => {
              if (linkError) {
                console.error("Error adding new links:", linkError)
              } else {
                console.log("Successfully added new links")
              }
              checkSubOperationsComplete()
            })
          } else {
            checkSubOperationsComplete()
          }
        } else {
          checkSubOperationsComplete()
        }
      }

      // เริ่มกระบวนการอัปเดตข้อมูล
      deleteSpecifiedFiles()
      deleteSpecifiedLinks()
      deleteUnselectedFiles()
      deleteUnselectedLinks()
      addNewFilesAndLinks()

      function getUpdatedFormData() {
        WorkloadForm.getFormDetail(form_id, (getError, formResult) => {
          if (getError || !formResult || formResult.length === 0) {
            return res.status(500).send({
              status: true,
              message: "อัปเดตข้อมูลสำเร็จ แต่ไม่สามารถดึงข้อมูลที่อัปเดตได้",
            })
          }

          // จัดรูปแบบข้อมูลที่จะส่งกลับ
          const updatedForm = {
            form_id: formResult[0].form_id,
            as_u_id: formResult[0].as_u_id,
            formlist_id: formResult[0].formlist_id,
            form_title: formResult[0].form_title,
            description: formResult[0].description,
            workload: formResult[0].workload,
            quality: formResult[0].quality,
            file_type: formResult[0].file_type,
            subtask_id: formResult[0].subtask_id,
            ex_score: formResult[0].ex_score,
            files: [],
            links: [],
          }

          // เพิ่มข้อมูลไฟล์เข้าไปในผลลัพธ์ (ไม่ซ้ำกัน)
          const uniqueFileIds = new Set()
          formResult.forEach((row) => {
            if (row.fileinfo_id && !uniqueFileIds.has(row.fileinfo_id)) {
              uniqueFileIds.add(row.fileinfo_id)
              updatedForm.files.push({
                fileinfo_id: row.fileinfo_id,
                file_name: row.file_name,
                size: row.size,
                form_id: row.form_id,
                url: `/images/${row.file_name}`,
              })
            }
          })

          // เพิ่มข้อมูลลิงก์เข้าไปในผลลัพธ์ (ไม่ซ้ำกัน)
          const uniqueLinkIds = new Set()
          formResult.forEach((row) => {
            if (row.link_id && !uniqueLinkIds.has(row.link_id)) {
              uniqueLinkIds.add(row.link_id)
              updatedForm.links.push({
                link_id: row.link_id,
                link_name: row.link_name,
                link_path: row.link_path,
                form_id: row.form_id,
              })
            }
          })

          res.send({
            status: true,
            message: "อัปเดตข้อมูลสำเร็จ",
            data: updatedForm,
            deletedFiles: deletedFiles,
            deletedLinks: deletedLinks,
          })
        })
      }
    })
  }
}

// อัปเดต status ของ workload form
const updateWorkloadFormStatus = (req, res) => {
  const { set_asses_list_id } = req.params;
  const { status } = req.body;

  if (!set_asses_list_id || status === undefined) {
    return res.status(400).json({
      code: 400,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: false,
      titleMessage: "เกิดข้อผิดพลาด",
      message: "กรุณาระบุ set_asses_list_id และ status",
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

  WorkloadForm.updateWorkloadFormStatus(set_asses_list_id, status, (error, result) => {
    if (error) {
      console.error('Error updating workload form status:', error);
      return res.status(500).json({
        code: 500,
        timestamp: new Date().toISOString(),
        transactionCode: `TXN_${Date.now()}`,
        success: false,
        titleMessage: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถอัปเดตสถานะได้",
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

    res.json({
      code: 200,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: true,
      titleMessage: "สำเร็จ",
      message: "อัปเดตสถานะสำเร็จ",
      payload: [{ set_asses_list_id: parseInt(set_asses_list_id), status: status }],
      meta: {
        limit: 0,
        page: 1,
        sort: "",
        total_pages: 0,
        total_rows: 1
      }
    });
  });
};

// อัปเดต status แบบ bulk ของ workload form
const updateWorkloadFormStatusBulk = (req, res) => {
  const { set_asses_list_ids, status } = req.body;

  if (!Array.isArray(set_asses_list_ids) || set_asses_list_ids.length === 0 || status === undefined) {
    return res.status(400).json({
      code: 400,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: false,
      titleMessage: "เกิดข้อผิดพลาด",
      message: "กรุณาระบุ set_asses_list_ids (array) และ status",
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

  WorkloadForm.updateWorkloadFormStatusBulk(set_asses_list_ids, status, (error, result) => {
    if (error) {
      console.error('Error updating workload form status bulk:', error);
      return res.status(500).json({
        code: 500,
        timestamp: new Date().toISOString(),
        transactionCode: `TXN_${Date.now()}`,
        success: false,
        titleMessage: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถอัปเดตสถานะแบบ bulk ได้",
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

    res.json({
      code: 200,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: true,
      titleMessage: "สำเร็จ",
      message: `อัปเดตสถานะสำเร็จ ${result.affectedRows} รายการ`,
      payload: [{ 
        set_asses_list_ids: set_asses_list_ids, 
        status: status,
        affected_rows: result.affectedRows
      }],
      meta: {
        limit: 0,
        page: 1,
        sort: "",
        total_pages: 0,
        total_rows: result.affectedRows
      }
    });
  });
};

// ดึงสถานะการประเมินของ assessor
const getAssessorEvaluationStatus = (req, res) => {
  const { set_asses_list_id } = req.params;

  if (!set_asses_list_id) {
    return res.status(400).json({
      code: 400,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: false,
      titleMessage: "เกิดข้อผิดพลาด",
      message: "กรุณาระบุ set_asses_list_id",
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

  WorkloadForm.getAssessorEvaluationStatus(set_asses_list_id, (error, result) => {
    if (error) {
      console.error('Error getting assessor evaluation status:', error);
      return res.status(500).json({
        code: 500,
        timestamp: new Date().toISOString(),
        transactionCode: `TXN_${Date.now()}`,
        success: false,
        titleMessage: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถดึงข้อมูลสถานะการประเมินได้",
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

    const statusData = result && result.length > 0 ? result[0] : { 
      workload_group_id: null, 
      form_status: 0, 
      evaluation_status: 'not_started' 
    };

    res.json({
      code: 200,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: true,
      titleMessage: "สำเร็จ",
      message: "ดึงข้อมูลสถานะการประเมินสำเร็จ",
      payload: [{ 
        set_asses_list_id: parseInt(set_asses_list_id), 
        workload_group_id: statusData.workload_group_id,
        form_status: statusData.form_status,
        evaluation_status: statusData.evaluation_status
      }],
      meta: {
        limit: 0,
        page: 1,
        sort: "",
        total_pages: 0,
        total_rows: 1
      }
    });
  });
};

// ส่งฟอร์มการประเมินภาระงานโดยใช้ user_id และ round_list_id
const submitWorkloadForm = (req, res) => {
  const { user_id, round_list_id } = req.params;
  
  if (!user_id || !round_list_id) {
    return res.status(400).json({
      code: 400,
      timestamp: new Date().toISOString(),
      transactionCode: `TXN_${Date.now()}`,
      success: false,
      titleMessage: "เกิดข้อผิดพลาด",
      message: "กรุณาระบุ user_id และ round_list_id",
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

  // ดึง set_asses_list_id จาก user_id และ round_list_id
  WorkloadForm.getSetAssessorListIdByUserAndRound(user_id, round_list_id, (error, result) => {
    if (error) {
      console.error('Error getting set_asses_list_id:', error);
      return res.status(500).json({
        code: 500,
        timestamp: new Date().toISOString(),
        transactionCode: `TXN_${Date.now()}`,
        success: false,
        titleMessage: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถดึงข้อมูลผู้ประเมินได้",
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
      return res.status(404).json({
        code: 404,
        timestamp: new Date().toISOString(),
        transactionCode: `TXN_${Date.now()}`,
        success: false,
        titleMessage: "ไม่พบข้อมูล",
        message: "ไม่พบข้อมูลผู้ประเมินสำหรับผู้ใช้และรอบการประเมินนี้",
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

    const set_asses_list_id = result[0].set_asses_list_id;

    // อัปเดต status เป็น 1
    WorkloadForm.updateWorkloadFormStatus(set_asses_list_id, 1, (updateError, updateResult) => {
      if (updateError) {
        console.error('Error updating form status:', updateError);
        return res.status(500).json({
          code: 500,
          timestamp: new Date().toISOString(),
          transactionCode: `TXN_${Date.now()}`,
          success: false,
          titleMessage: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถส่งฟอร์มการประเมินได้",
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

      res.json({
        code: 200,
        timestamp: new Date().toISOString(),
        transactionCode: `TXN_${Date.now()}`,
        success: true,
        titleMessage: "สำเร็จ",
        message: "ส่งฟอร์มการประเมินภาระงานสำเร็จ",
        payload: [{ 
          user_id: parseInt(user_id),
          round_list_id: parseInt(round_list_id),
          set_asses_list_id: set_asses_list_id,
          status: 1
        }],
        meta: {
          limit: 0,
          page: 1,
          sort: "",
          total_pages: 0,
          total_rows: 1
        }
      });
    });
  });
};

// ========== SNAPSHOT FUNCTIONS ==========

// ส่งฟอร์มและสร้าง snapshot
const submitFormWithSnapshot = (req, res) => {
  const { formlist_id, as_u_id, round_list_id } = req.body;

  console.log('Request body:', req.body);
  console.log('formlist_id:', formlist_id, typeof formlist_id);
  console.log('as_u_id:', as_u_id, typeof as_u_id);
  console.log('round_list_id:', round_list_id, typeof round_list_id);

  if (!formlist_id || !as_u_id || !round_list_id) {
    return res.status(400).json(createResponse(
      false,
      "กรุณาระบุ formlist_id, as_u_id และ round_list_id",
      [],
      "MISSING_PARAMETERS"
    ));
  }

  // เริ่ม transaction
  const createSnapshot = () => {
    return new Promise((resolve, reject) => {
      // 1. ลบ snapshot เก่า (ถ้ามี)
      WorkloadForm.deleteExistingSnapshot(formlist_id, as_u_id, round_list_id, (deleteError) => {
        if (deleteError) {
          console.error('Error deleting existing snapshot:', deleteError);
          reject(deleteError);
          return;
        }

        // 2. สร้าง snapshot ใหม่
        WorkloadForm.createFormSnapshot(formlist_id, as_u_id, round_list_id, (createError, createResult) => {
          if (createError) {
            console.error('Error creating snapshot:', createError);
            reject(createError);
            return;
          }

          const snapshotId = createResult.insertId;
          console.log('Created snapshot with ID:', snapshotId);

          // 3. คัดลอก Task (พร้อม quantity) ไป snapshot
          WorkloadForm.copyTasksToSnapshot(snapshotId, formlist_id, (copyTaskError) => {
            if (copyTaskError) {
              console.error('Error copying tasks to snapshot:', copyTaskError);
              reject(copyTaskError);
              return;
            }

            // 4. คัดลอก Subtask ไป snapshot
            WorkloadForm.copySubtasksToSnapshot(snapshotId, (copySubtaskError) => {
              if (copySubtaskError) {
                console.error('Error copying subtasks to snapshot:', copySubtaskError);
                reject(copySubtaskError);
                return;
              }

              // 5. คัดลอก Form Info (ผูกกับ task/subtask)
              WorkloadForm.copyFormInfoToSnapshot(snapshotId, formlist_id, (copyFormError) => {
                if (copyFormError) {
                  console.error('Error copying form info:', copyFormError);
                  reject(copyFormError);
                  return;
                }

                // 6. คัดลอกไฟล์
                WorkloadForm.copyFilesToSnapshot((filesError) => {
                  if (filesError) {
                    console.error('Error copying files:', filesError);
                    reject(filesError);
                    return;
                  }

                  // 7. คัดลอกลิงก์
                  WorkloadForm.copyLinksToSnapshot((linksError) => {
                    if (linksError) {
                      console.error('Error copying links:', linksError);
                      reject(linksError);
                      return;
                    }

                    resolve(snapshotId);
                  });
                });
              });
            });
          });
        });
      });
    });
  };

  // ดำเนินการสร้าง snapshot
  createSnapshot()
    .then((snapshotId) => {
      // อัปเดต status ใน tb_workload_formlist
      WorkloadForm.updateWorkloadFormStatus(formlist_id, 1, (statusError, statusResult) => {
        if (statusError) {
          console.error('Error updating form status:', statusError);
        return res.status(500).json(createResponse(
          false,
          "ไม่สามารถอัปเดตสถานะฟอร์มได้",
          [],
          "DATABASE_ERROR"
        ));
        }

        return res.status(200).json(createResponse(
          true,
          "ส่งฟอร์มและสร้าง snapshot สำเร็จ",
          {
            snapshot_id: snapshotId,
            formlist_id: formlist_id,
            status: 1
          }
        ));
      });
    })
    .catch((error) => {
      console.error('Error in submitFormWithSnapshot:', error);
      return res.status(500).json(createResponse(
        false,
        "ไม่สามารถส่งฟอร์มได้",
        [],
        "SNAPSHOT_ERROR"
      ));
    });
};

// ดึงข้อมูลฟอร์มจาก snapshot หรือตารางหลัก
const getFormInfoWithSnapshot = (req, res) => {
  const { formlist_id, subtask_id } = req.params;
  const as_u_id = req.query.as_u_id;
  const round_list_id = req.query.round_list_id;

  if (!formlist_id || !subtask_id || !as_u_id || !round_list_id) {
    return res.status(400).json(createResponse(
      false,
      "กรุณาระบุ formlist_id, subtask_id, as_u_id และ round_list_id",
      [],
      "MISSING_PARAMETERS"
    ));
  }

  // ตรวจสอบว่ามี snapshot หรือไม่
  WorkloadForm.checkSnapshotExists(formlist_id, as_u_id, round_list_id, (checkError, checkResult) => {
    if (checkError) {
      console.error('Error checking snapshot:', checkError);
      return res.status(500).json(createResponse(
        false,
        "ไม่สามารถตรวจสอบ snapshot ได้",
        [],
        "DATABASE_ERROR"
      ));
    }

    // ถ้ามี snapshot ให้ดึงจาก snapshot
    if (checkResult && checkResult.length > 0) {
      console.log('Loading from snapshot for formlist_id:', formlist_id);
      
        // ดึงข้อมูล snapshot ทั้งหมดสำหรับ formlist_id นี้ (ไม่จำกัดแค่ subtask_id เดียว)
        WorkloadForm.getAllFormInfoFromSnapshot(formlist_id, as_u_id, (snapshotError, snapshotResult) => {
          if (snapshotError) {
            console.error('Error fetching from snapshot:', snapshotError);
            return res.status(500).json(createResponse(
              false,
              "ไม่สามารถดึงข้อมูลจาก snapshot ได้",
              [],
              "DATABASE_ERROR"
            ));
          }

          // ดึงไฟล์และลิงก์สำหรับแต่ละฟอร์ม
          const processSnapshotData = async () => {
            const processedData = [];
            
            for (const form of snapshotResult) {
              const formData = { ...form, files: [], links: [] };
              
              // ดึงไฟล์
              await new Promise((resolve) => {
                WorkloadForm.getFilesFromSnapshot(form.form_id, (fileError, files) => {
                  if (!fileError && files) {
                    formData.files = files;
                  }
                  resolve();
                });
              });
              
              // ดึงลิงก์
              await new Promise((resolve) => {
                WorkloadForm.getLinksFromSnapshot(form.form_id, (linkError, links) => {
                  if (!linkError && links) {
                    formData.links = links;
                  }
                  resolve();
                });
              });
              
              processedData.push(formData);
            }
            
            return processedData;
          };

          processSnapshotData().then((processedData) => {
            return res.status(200).json(createResponse(
              true,
              "ดึงข้อมูลจาก snapshot สำเร็จ",
              processedData
            ));
          });
        });
    } else {
      // ถ้าไม่มี snapshot ให้ดึงจากตารางหลัก
      console.log('Loading from main tables for formlist_id:', formlist_id);
      
      WorkloadForm.getOneFormInfo(formlist_id, subtask_id, (error, formResult) => {
        if (error) {
          console.error("Error fetching form info:", error);
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

        if (formResult.length === 0) {
          return res.status(404).json({
            code: 404,
            timestamp: new Date().toISOString(),
            transactionCode: `TXN_${Date.now()}`,
            success: false,
            titleMessage: "ไม่พบข้อมูล",
            message: "Form info not found",
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

        // กรองข้อมูลตาม as_u_id ถ้ามีการระบุ
        let filteredResult = formResult;
        if (as_u_id) {
          filteredResult = formResult.filter((row) => row.as_u_id == as_u_id);
          if (filteredResult.length === 0) {
            return res.status(404).json({
              code: 404,
              timestamp: new Date().toISOString(),
              transactionCode: `TXN_${Date.now()}`,
              success: false,
              titleMessage: "ไม่พบข้อมูล",
              message: "Form info not found for specified user",
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
        }

        // สร้าง Map เพื่อจัดกลุ่มข้อมูลตาม form_id
        const formMap = new Map();

        // จัดกลุ่มข้อมูลฟอร์มและลิงก์
        filteredResult.forEach((row) => {
          const formId = row.form_id;

          if (!formMap.has(formId)) {
            // สร้างข้อมูลฟอร์มใหม่
            const formData = { ...row, links: [], files: [] };
            delete formData.link_id;
            delete formData.link_name;
            delete formData.link_path;
            formMap.set(formId, formData);
          }

          // เพิ่มข้อมูลลิงก์ถ้ามี
          if (row.link_id && row.link_name && row.link_path) {
            const form = formMap.get(formId);
            form.links.push({
              link_id: row.link_id,
              link_name: row.link_name,
              link_path: row.link_path,
              form_id: formId,
            });
          }
        });

        // ดึงข้อมูลไฟล์สำหรับแต่ละฟอร์ม
        Promise.all(
          Array.from(formMap.values()).map((formData) => {
            return new Promise((resolve, reject) => {
              WorkloadForm.getFilesByFormId(formData.form_id, (fileError, fileResult) => {
                if (fileError) {
                  console.error("Error fetching file info:", fileError);
                  reject(fileError);
                  return;
                }

                formData.files = fileResult || [];
                resolve(formData);
              });
            });
          }),
        )
          .then((data) => {
            return res.status(200).json(createResponse(
              true,
              "ดึงข้อมูลจากตารางหลักสำเร็จ",
              data
            ));
          })
          .catch((error) => {
            console.error("Error in processing files:", error);
            return res.status(500).json(createResponse(
              false,
              "Error processing files",
              [],
              "PROCESSING_ERROR"
            ));
          });
      });
    }
  });
};

// ดึง formlist_id จาก as_u_id และ round_list_id
const getFormlistId = (req, res) => {
  console.log('=== getFormlistId function called ===');
  const { as_u_id, round_list_id } = req.params;

  console.log('getFormlistId - as_u_id:', as_u_id, 'round_list_id:', round_list_id);

  if (!as_u_id || !round_list_id) {
    return res.status(400).json(createResponse(
      false, 
      'Missing required parameters: as_u_id and round_list_id',
      [],
      'MISSING_PARAMETERS'
    ));
  }

  WorkloadForm.getFormlistId(as_u_id, round_list_id, (error, result) => {
    if (error) {
      console.error('Error getting formlist_id:', error);
      return res.status(500).json(createResponse(
        false,
        'ไม่สามารถดึงข้อมูล formlist_id ได้',
        [],
        'DATABASE_ERROR'
      ));
    }

    if (!result || result.length === 0) {
      return res.status(404).json(createResponse(
        false,
        'ไม่พบข้อมูลฟอร์มสำหรับผู้ใช้และรอบนี้',
        [],
        'FORM_NOT_FOUND'
      ));
    }

    res.json(createResponse(
      true,
      'ดึงข้อมูล formlist_id สำเร็จ',
      result[0]
    ));
    console.log('getFormlistId - sending response:', result[0]);
  });
};

module.exports = {
  getAllFormList,
  getTermForm,
  addFormList,
  addFormListBulk,
  checkGroupID,
  selectWorkloadFormGroup,
  getAllFormInfo,
  getOneFormInfo,
  addFormInfo,
  getFilesRound,
  deleteFormInfo,
  getFormDetail,
  updateFormInfo,
  checkWorkloadFormStatus,
  getWorkloadItemsByGroup,
  updateWorkloadFormStatus,
  updateWorkloadFormStatusBulk,
  getAssessorEvaluationStatus,
  submitWorkloadForm,
  submitFormWithSnapshot,
  getFormInfoWithSnapshot,
  getFormlistId,
}