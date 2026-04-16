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
const db = {
  documents: [],
  employees: [],
  keys: {},
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

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Chỉ chấp nhận file PDF!'), false)
  },
})

// ==========================================
// APIs
// ==========================================

app.get('/', (req, res) => res.send('Secure Backend is running!'))

// 1. ĐĂNG KÝ
app.post('/api/register', (req, res) => {
  const { fullName, dob, department, cccd, pin } = req.body
  if (!fullName || !cccd || !pin) return res.status(400).json({ error: 'Thiếu thông tin!' })

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
    encryptedPrivateKey: privateKey,
  }

  db.employees.push(newEmployee)
  db.keys[employeeId] = publicKey
  res.json({ message: 'Đăng ký thành công!', employee: { employeeId, fullName } })
})

// 2. UPLOAD (MANAGER)
app.post('/api/upload', checkRole('Manager'), upload.single('document'), (req, res) => {
  const { assignedTo } = req.body
  if (!req.file || !assignedTo) return res.status(400).json({ error: 'Thiếu file hoặc người ký!' })

  const newDoc = {
    id: Date.now().toString(),
    filename: req.file.originalname,
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
  const { documentId, employeeId, pin, x, y, pageNum } = req.body
  const doc = db.documents.find((d) => d.id == documentId)
  const employee = db.employees.find((e) => e.employeeId === employeeId)

  if (!doc || !employee) return res.status(404).json({ error: 'Thông tin không hợp lệ' })

  try {
    const sign = crypto.createSign('SHA256')
    sign.update(doc.originalHash)
    sign.end()
    const signature = sign.sign({ key: employee.encryptedPrivateKey, passphrase: pin }, 'base64')

    const pdfDoc = await PDFDocument.load(fs.readFileSync(doc.path))
    const pages = pdfDoc.getPages()
    const targetPage = pages[(pageNum || 1) - 1]
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const cleanName = employee.fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
    const signatureText = `Digitally Signed by: ${cleanName}\nCCCD: ${employee.cccd}\nDate: ${new Date().toLocaleString('vi-VN')}`

    targetPage.drawText(signatureText, {
      x: parseFloat(x) || 50,
      y: parseFloat(y) || 100,
      size: 10,
      font: font,
      color: rgb(0.75, 0.2, 0.2),
    })

    fs.writeFileSync(doc.path, await pdfDoc.save())
    Object.assign(doc, {
      signature,
      signerId: employeeId,
      signerName: employee.fullName,
      signerCccd: employee.cccd,
      signerDept: employee.department,
      status: 'Signed',
    })

    res.json({ message: 'Ký thành công!', document: doc })
  } catch (e) {
    res.status(401).json({ error: 'Mã PIN sai hoặc lỗi xử lý PDF!' })
  }
})

// 5. DOWNLOAD
app.get('/api/documents/:id/download', (req, res) => {
  const doc = db.documents.find((d) => d.id == req.params.id)
  if (!doc) return res.status(404).json({ error: 'Không thấy file!' })
  res.download(path.resolve(doc.path), `Signed_${doc.id}.pdf`)
})

app.get('/api/documents', (req, res) => res.json(db.documents))
app.get('/api/employees', (req, res) => res.json(db.employees))
app.post('/api/check-employee', (req, res) => {
  res.json({ success: db.employees.some((e) => e.employeeId === req.body.employeeId) })
})

app.listen(PORT, () => console.log(`[SYSTEM] Backend running on http://localhost:${PORT}`))
