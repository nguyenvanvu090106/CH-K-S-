const express = require('express')
const multer = require('multer')
const crypto = require('crypto')
const fs = require('fs')
const cors = require('cors')
const path = require('path') // Đưa lên đầu 1 lần duy nhất
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3000

// ==========================================
// DATABASE IN-MEMORY
// ==========================================
// ==========================================
// DATABASE IN-MEMORY
// ==========================================
const db = {
  documents: [],
  keys: {},
  // Cấp sẵn 1 tài khoản Manager mặc định
  employees: [
    {
      employeeId: 'ADMIN_01',
      fullName: 'Quản Trị Viên',
      cccd: 'admin', // Dùng chữ 'admin' làm CCCD để dễ test
      password: 'admin', // Mật khẩu Manager
      role: 'Manager',
    },
  ],
}
// ==========================================
// HELPER FUNCTIONS
// ==========================================
const generateFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath)
  const hashSum = crypto.createHash('sha256')
  hashSum.update(fileBuffer)
  return hashSum.digest('hex')
}

const checkRole = (requiredRole) => (req, res, next) => {
  const role = req.headers['x-role']
  if (role !== requiredRole) {
    return res.status(403).json({ error: `Access Denied: Requires ${requiredRole} role` })
  }
  next()
}

// Thay thế dòng cấu hình cũ bằng cụm này:
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Thư mục lưu file
  },
  filename: function (req, file, cb) {
    // Ép font tiếng Việt chuẩn xác
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    // Gắn thời gian để không bị trùng tên file
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage: storage })
// ==========================================
// APIs
// ==========================================

app.get('/', (req, res) => res.send('Secure Backend is running!'))

// 1. ĐĂNG KÝ
app.post('/api/register', (req, res) => {
  const { fullName, dob, department, cccd, password, pin } = req.body

  if (!fullName || !cccd || !password || !pin) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin!' })
  }
  if (db.employees.some((emp) => emp.cccd === cccd)) {
    return res.status(400).json({ error: 'CCCD đã tồn tại!' })
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: pin,
    },
  })

  const employeeId = `EMP_${String(db.employees.length + 1).padStart(4, '0')}`
  const newEmployee = {
    employeeId,
    fullName,
    dob,
    department,
    cccd,
    password: password, // Lưu mật khẩu
    role: 'Employee', // Mặc định người đăng ký mới là Nhân viên
    encryptedPrivateKey: privateKey,
  }

  db.employees.push(newEmployee)
  db.keys[employeeId] = publicKey
  res.json({ message: 'Đăng ký thành công!', employee: { employeeId, fullName } })
})

// 2. UPLOAD (MANAGER)
app.post('/api/upload', checkRole('Manager'), upload.single('document'), (req, res) => {
  // Lấy thêm customName từ req.body (form data gửi lên)
  const { assignedTo, customName } = req.body
  if (!req.file || !assignedTo) return res.status(400).json({ error: 'Thiếu file hoặc người ký!' })

  // KIỂM TRA: Nếu có customName thì dùng tên đó, nếu không thì lấy tên gốc của file
  const displayName = customName ? customName : req.file.originalname

  const newDoc = {
    id: Date.now().toString(),
    filename: displayName, // <--- Thay vì tên gốc, ta lưu cái tên đã được kiểm tra này
    path: req.file.path,
    originalHash: generateFileHash(req.file.path),
    assignedTo,
    status: 'Pending Signature',
  }

  db.documents.push(newDoc)
  res.json({ message: 'Giao việc thành công', document: newDoc })
})

// 3. XEM FILE (DÙNG CHO IFRAME PREVIEW) - SỬA LỖI TẠI ĐÂY
app.get('/api/documents/:id/view', (req, res) => {
  // Dùng == thay vì === để tránh lỗi lệch kiểu dữ liệu String/Number
  const doc = db.documents.find((d) => d.id == req.params.id)
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy văn bản trong hệ thống!' })

  const absolutePath = path.resolve(doc.path)
  if (!fs.existsSync(absolutePath))
    return res.status(404).json({ error: 'File vật lý không tồn tại!' })

  res.setHeader('Content-Type', 'application/pdf')
  res.sendFile(absolutePath)
})

// 4. KÝ SỐ (EMPLOYEE)
app.post('/api/sign', checkRole('Employee'), async (req, res) => {
  const { documentId, employeeId, pin, percentX, percentY, pageNum } = req.body
  const doc = db.documents.find((d) => d.id == documentId)
  const employee = db.employees.find((e) => e.employeeId === employeeId)

  if (!doc || !employee) return res.status(404).json({ error: 'Thông tin không hợp lệ' })

  try {
    // 1. KÝ NHỊ PHÂN (BẢN CHẤT BẢO MẬT BÊN TRONG)
    const sign = crypto.createSign('SHA256')
    sign.update(doc.originalHash)
    sign.end()
    // Dùng mã PIN để mở khóa Private Key
    const signature = sign.sign({ key: employee.encryptedPrivateKey, passphrase: pin }, 'base64')

    // 2. MỞ FILE PDF LÊN ĐỂ VẼ DẤU
    const pdfDoc = await PDFDocument.load(fs.readFileSync(doc.path))
    const pages = pdfDoc.getPages()
    const page = pages[pageNum - 1] // Lấy đúng trang Web gửi lên
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // 3. TÍNH TOÁN TỌA ĐỘ PHẦN TRĂM (CHỐNG LỆCH & CHỐNG VĂNG LỀ)
    const { width, height } = page.getSize()
    let actualX = percentX * width
    let actualY = (1 - percentY) * height // Lật trục Y lại cho đúng chuẩn PDF

    const boxWidth = 200 // Chiều rộng con dấu
    const boxHeight = 75 // Chiều cao con dấu

    // Ép tọa độ safeX, safeY không cho lọt ra ngoài mép giấy
    const safeX = Math.min(Math.max(actualX, 10), width - boxWidth - 10)
    const safeY = Math.min(Math.max(actualY - boxHeight, 10), height - boxHeight - 10)

    // 4. CHUẨN BỊ CHỮ KHÔNG DẤU (TRÁNH LỖI FONT PDF)
    const cleanName = employee.fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')

    const cleanDept = employee.department
      ? employee.department
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
      : 'N/A'

    // 5. BẮT ĐẦU VẼ CON DẤU VÀO TỌA ĐỘ (safeX, safeY)

    // 5.1 Vẽ Khung nền mờ, viền đỏ nét đứt
    page.drawRectangle({
      x: safeX,
      y: safeY,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0.8, 0.2, 0.2),
      borderWidth: 1.5,
      borderDashArray: [4, 4],
      color: rgb(0.98, 0.94, 0.94),
    })

    // 5.2 Vẽ dòng chữ Signature Valid màu xanh lá
    page.drawText('Signature Valid [V]', {
      x: safeX + 10,
      y: safeY + boxHeight - 18,
      size: 11,
      font: font,
      color: rgb(0.15, 0.68, 0.37),
    })

    // 5.3 Vẽ thông tin chi tiết (Người ký, CCCD, Bộ phận, Ngày giờ)
    const detailText = `Signed by: ${cleanName}\nCCCD: ${employee.cccd}\nDept: ${cleanDept}\nDate: ${new Date().toLocaleString('vi-VN')}`
    page.drawText(detailText, {
      x: safeX + 10,
      y: safeY + boxHeight - 35,
      size: 9,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 12, // Cách dòng cho đẹp
    })

    // 6. LƯU LẠI VÀ CẬP NHẬT DATABASE
    fs.writeFileSync(doc.path, await pdfDoc.save())

    Object.assign(doc, {
      signature,
      signerId: employeeId,
      signerName: employee.fullName, // Database vẫn lưu có dấu để hiển thị Web cho đẹp
      signerCccd: employee.cccd,
      signerDept: employee.department,
      status: 'Signed',
    })

    res.json({ message: 'Ký thành công!', document: doc })
  } catch (e) {
    console.error('LỖI KÝ SỐ:', e) // Sẽ in lỗi đỏ lòm ra Terminal nếu bị trục trặc
    res.status(401).json({ error: 'Mã PIN sai hoặc lỗi xử lý PDF!' })
  }
})

// 5. DOWNLOAD
app.get('/api/documents/:id/download', (req, res) => {
  const doc = db.documents.find((d) => d.id == req.params.id)

  if (!doc) return res.status(404).json({ error: 'Không thấy file!' })

  // Tạo tên file mới: Nếu đã ký thì ghép chữ "signed_" với tên gốc, chưa ký thì giữ nguyên tên gốc
  const downloadName = doc.status === 'Signed' ? `signed_${doc.filename}` : doc.filename

  // Trả file về cho trình duyệt với cái tên mới
  res.download(path.resolve(doc.path), downloadName, (err) => {
    if (err) console.error('Lỗi khi tải file:', err)
  })
})

app.get('/api/documents', (req, res) => res.json(db.documents))
app.get('/api/employees', (req, res) => res.json(db.employees))
// ==========================================
// API: Kiểm tra mã nhân viên (Chuẩn bảo mật)
// ==========================================
app.post('/api/check-employee', (req, res) => {
  const { employeeId } = req.body

  // Tìm xem mã NV có trong Database không
  const exists = db.employees.some((e) => e.employeeId === employeeId)

  if (exists) {
    // CÓ TỒN TẠI -> Trả về 200 OK
    res.json({ success: true, message: 'Đăng nhập thành công' })
  } else {
    // KHÔNG TỒN TẠI -> Ép trả về lỗi 404 (Not Found) để Frontend chặn lại
    res.status(404).json({ error: 'Mã nhân viên không tồn tại trong hệ thống!' })
  }
})
// ==========================================
// API: ĐĂNG NHẬP HỆ THỐNG
// ==========================================
app.post('/api/login', (req, res) => {
  const { cccd, password, role } = req.body

  // Kiểm tra khớp 3 điều kiện: CCCD, Password và Role
  const user = db.employees.find(
    (e) => e.cccd === cccd && e.password === password && e.role === role
  )

  if (user) {
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      session: {
        employeeId: user.employeeId,
        fullName: user.fullName,
        role: user.role,
      },
    })
  } else {
    res.status(401).json({ error: 'Sai CCCD, Mật khẩu hoặc Chọn sai Vai trò!' })
  }
})
// ==========================================
// API: LẤY VÀ CẬP NHẬT THÔNG TIN NHÂN VIÊN
// ==========================================

// 1. Lấy thông tin hiện tại
app.get('/api/employee/:id', (req, res) => {
  const user = db.employees.find((e) => e.employeeId === req.params.id)
  if (user) {
    res.json(user)
  } else {
    res.status(404).json({ error: 'Không tìm thấy nhân viên' })
  }
})

// 2. Cập nhật thông tin
app.post('/api/update-profile', (req, res) => {
  const { employeeId, fullName, dob, department } = req.body
  const user = db.employees.find((e) => e.employeeId === employeeId)

  if (user) {
    user.fullName = fullName
    user.dob = dob
    user.department = department
    res.json({ success: true, message: 'Cập nhật hồ sơ thành công!' })
  } else {
    res.status(404).json({ error: 'Lỗi cập nhật!' })
  }
})
app.listen(PORT, () => console.log(`[SYSTEM] Backend running on http://localhost:${PORT}`))
