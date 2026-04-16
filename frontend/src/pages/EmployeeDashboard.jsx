import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Document, Page, pdfjs } from 'react-pdf'

// Cấu hình Worker siêu việt để React có thể đọc hiểu dữ liệu nhị phân của PDF (Không có dòng này là lỗi liền nhé)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const EmployeeDashboard = () => {
  const navigate = useNavigate()
  const [myDocs, setMyDocs] = useState([])
  const [employeeId, setEmployeeId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)

  // State lưu tọa độ X, Y (Mặc định góc dưới bên phải)
  // const [signPos, setSignPos] = useState({ x: 350, y: 100 })
  const [statusMsg, setStatusMsg] = useState('')
  const [pin, setPin] = useState('') // State lưu mã PIN
  // State lưu tọa độ gửi cho Backend (Hệ tọa độ PDF)
  const [numPages, setNumPages] = useState(null) // Quản lý tổng số trang của PDF

  // Sửa lại state lưu tọa độ để ghi nhớ cả Trang mà bạn đang click vào
  const [signPos, setSignPos] = useState({ x: 50, y: 100, pageNum: 1 })
  const [boxPos, setBoxPos] = useState(null) // Ban đầu ẩn ô vuông đi
  // THÊM ĐOẠN NÀY VÀO DƯỚI CÁC USESTATE
  // Khóa đường link PDF lại, chỉ tải lại khi đổi sang xem file khác
  const pdfUrl = useMemo(() => {
    if (!previewDoc) return null
    return `http://localhost:3000/api/documents/${previewDoc.id}/view?t=${new Date().getTime()}`
  }, [previewDoc]) // Chỉ thay đổi khi previewDoc thay đổi
  // 1. Kiểm tra session và lấy danh sách file được giao
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('userSession'))
    if (!session || session.role !== 'Employee') {
      navigate('/login')
    } else {
      setEmployeeId(session.employeeId)
      fetchMyDocs(session.employeeId)
    }
  }, [navigate])

  const fetchMyDocs = async (id) => {
    try {
      const res = await axios.get('http://localhost:3000/api/documents')
      const filtered = res.data.filter((doc) => doc.assignedTo === id)
      setMyDocs(filtered)
    } catch (error) {
      console.error('Lỗi khi tải danh sách:', error)
    }
  }

  // 2. Hàm xem trước nội dung file
  // Xóa hàm handlePreview cũ đi và thay bằng hàm này:
  const handlePreview = (id) => {
    const doc = myDocs.find((d) => d.id === id)
    setPreviewDoc(doc)
  }
  // 3. Hàm thực hiện Ký số
  const handleSign = async (doc) => {
    if (pin.length !== 6) {
      alert('Vui lòng nhập đúng mã PIN 6 số!')
      return
    }

    try {
      setStatusMsg('Đang xác thực mã PIN và ký văn bản...')

      // Gửi mã PIN lên server để thực hiện ký
      await axios.post(
        'http://localhost:3000/api/sign',
        {
          documentId: doc.id,
          employeeId: employeeId,
          pin: pin, // <--- Gửi PIN lên
          x: signPos.x, // Gửi tọa độ X
          y: signPos.y, // Gửi tọa độ Y
          pageNum: signPos.pageNum, // <--- SỬA CHỖ NÀY ĐỂ KÝ ĐÚNG TRANG
        },
        { headers: { 'x-role': 'Employee' } }
      )

      alert('Ký văn bản thành công!')
      setPin('') // Reset mã PIN
      setPreviewDoc(null)
      fetchMyDocs(employeeId)
      setStatusMsg('')
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi hệ thống')
      setStatusMsg('')
    }

    // 4. Hàm xác thực tính toàn vẹn
    const handleVerify = async (docId) => {
      try {
        const res = await axios.post('http://localhost:3000/api/verify', { documentId: docId })
        alert(res.data.message)
      } catch (error) {
        alert(error.response?.data?.message || 'Cảnh báo: File bị thay đổi!')
      }
    }
  }
  // Hàm phụ: Định dạng ngày tháng
  const formatDate = (date) => new Date(date).toLocaleString('vi-VN')

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '2px solid #27ae60',
          paddingBottom: '10px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ color: '#27ae60' }}>Hộp Thư Văn Bản Của Bạn (ID: {employeeId}) 📩</h2>
        <button
          onClick={() => {
            localStorage.removeItem('userSession')
            navigate('/login')
          }}
          style={{
            padding: '8px 15px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Đăng Xuất
        </button>
      </div>

      {/* Ô NHẬP MÃ PIN BẢO MẬT (THAY THẾ CHO PRIVATE KEY) */}
      <div
        style={{
          backgroundColor: '#f4fbf7',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #27ae60',
          marginBottom: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        }}
      >
        <label
          style={{
            fontWeight: 'bold',
            display: 'block',
            marginBottom: '15px',
            color: '#16a085',
            fontSize: '16px',
          }}
        >
          🔐 NHẬP MÃ PIN TÀI KHOẢN ĐỂ KÝ DUYỆT:
        </label>
        <input
          type="password"
          maxLength="6"
          placeholder="******"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            width: '200px',
            fontSize: '28px',
            fontFamily: 'monospace',
            textAlign: 'center',
            letterSpacing: '10px',
            padding: '10px',
            border: '2px solid #27ae60',
            borderRadius: '6px',
            outline: 'none',
            backgroundColor: '#fff',
          }}
        />
        {statusMsg && (
          <p style={{ color: '#2980b9', fontWeight: 'bold', marginTop: '15px' }}>{statusMsg}</p>
        )}
        <p style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '15px', fontStyle: 'italic' }}>
          * Private Key của bạn được lưu trữ mã hóa trên Server. Mã PIN này dùng để mở khóa.
        </p>
      </div>

      {/* KHUNG KÝ SỐ TRỰC TIẾP TRÊN PDF (HỖ TRỢ NHIỀU TRANG & CHỐNG TRÀN LỀ) */}
      {previewDoc && (
        <div
          style={{
            backgroundColor: '#ecf0f1',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
          }}
        >
          {/* HEADER CỦA KHUNG XEM TRƯỚC */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
            }}
          >
            {/* CỘT TRÁI: TIÊU ĐỀ */}
            <div>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>Đang xử lý: {previewDoc.filename}</h3>
              <p
                style={{
                  margin: '5px 0 0 0',
                  color: '#e67e22',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                👉 Cuộn để xem hết các trang. CLICK vào vị trí bất kỳ để đặt con dấu!
              </p>
            </div>

            {/* CỘT PHẢI: CÁC NÚT THAO TÁC */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* CHỈ HIỆN NÚT "KÝ NGAY" NẾU FILE CHƯA KÝ */}
              {previewDoc.status !== 'Signed' && (
                <button
                  onClick={() => handleSign(previewDoc)}
                  style={{
                    backgroundColor: '#2980b9',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  🖋️ Ký Ngay
                </button>
              )}

              <button
                onClick={() => {
                  setPreviewDoc(null)
                  setBoxPos(null)
                }}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                ✖ Đóng
              </button>
            </div>
          </div>

          {/* VÙNG CUỘN ĐỂ HIỂN THỊ NHIỀU TRANG */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#525659',
              padding: '20px',
              borderRadius: '4px',
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            <Document
              file={pdfUrl} // <--- Đã dùng biến pdfUrl ở đây để chống giật
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div style={{ color: 'white' }}>Đang tải tài liệu PDF... ⏳</div>}
            >
              {/* Lặp qua tất cả các trang để hiển thị */}
              {Array.from(new Array(numPages), (el, index) => {
                const pageIndex = index + 1
                return (
                  <div
                    key={`page_${pageIndex}`}
                    // Nếu ký rồi thì đổi chuột thành dấu Cấm (not-allowed), chưa ký thì hình chữ thập (crosshair)
                    style={{
                      position: 'relative',
                      marginBottom: '20px',
                      cursor: previewDoc.status === 'Signed' ? 'not-allowed' : 'crosshair',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    }}
                    // 👇 ĐÂY CHÍNH LÀ ONCLICK CHÚNG TA CẦN BẮT 👇
                    onClick={(e) => {
                      // 1. Nếu file đã Ký (Signed) thì return luôn, không làm gì cả!
                      if (previewDoc.status === 'Signed') return

                      const rect = e.currentTarget.getBoundingClientRect()
                      const clickX = e.clientX - rect.left
                      let clickY = e.clientY - rect.top

                      // THUẬT TOÁN CHỐNG RỚT LỀ DƯỚI:
                      if (clickY > rect.height - 70) {
                        clickY = rect.height - 70
                      }

                      // Lưu vị trí hiển thị ô vuông lên màn hình
                      setBoxPos({ x: clickX, y: clickY, pageNum: pageIndex })

                      // Quy đổi hệ tọa độ cho Backend
                      const pdfY = rect.height - clickY
                      setSignPos({ x: clickX, y: pdfY, pageNum: pageIndex })
                    }}
                  >
                    <Page
                      pageNumber={pageIndex}
                      width={600}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />

                    {/* CHỈ HIỆN Ô VUÔNG NẾU: ĐÚNG TRANG ĐÓ + FILE CHƯA KÝ */}
                    {boxPos && boxPos.pageNum === pageIndex && previewDoc.status !== 'Signed' && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${boxPos.x}px`,
                          top: `${boxPos.y}px`,
                          width: '180px',
                          height: '60px',
                          border: '2px dashed #e74c3c',
                          backgroundColor: 'rgba(231, 76, 60, 0.15)',
                          pointerEvents: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          paddingLeft: '5px',
                          boxSizing: 'border-box',
                          transition: 'all 0.1s ease-out',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#c0392b', fontWeight: 'bold' }}>
                          Khu vực ký số ✅
                        </span>
                        <span style={{ fontSize: '10px', color: '#c0392b' }}>Tọa độ an toàn</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </Document>
          </div>
        </div>
      )}

      {/* BẢNG DANH SÁCH FILE */}
      <div style={{ marginTop: '20px' }}>
        <h3>Danh sách văn bản được giao</h3>
        {myDocs.length === 0 ? (
          <p>Bạn chưa có văn bản nào.</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#2ecc71', color: 'white' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Tên File</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Trạng Thái / Chữ Ký</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {myDocs.map((doc) => (
                <tr key={doc.id} style={{ textAlign: 'center' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <strong>{doc.filename}</strong>
                    <br />
                    <small style={{ color: '#7f8c8d' }}>ID: {doc.id}</small>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {doc.status === 'Signed' ? (
                      /* HIỂN THỊ CON DẤU CHỮ KÝ SỐ */
                      <div
                        style={{
                          border: '2px solid #27ae60',
                          padding: '8px',
                          borderRadius: '5px',
                          backgroundColor: '#f4fbf7',
                          textAlign: 'left',
                          fontSize: '11px',
                          color: '#c0392b',
                          fontWeight: 'bold',
                          width: '200px',
                          margin: '0 auto',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            color: '#27ae60',
                            fontSize: '12px',
                            borderBottom: '1px solid #27ae60',
                            marginBottom: '5px',
                          }}
                        >
                          Signature Valid ✅
                        </div>
                        <div>Ký bởi: {doc.signerName}</div>
                        <div>CCCD: {doc.signerCccd}</div>
                        <div>Bộ phận: {doc.signerDept}</div>
                        <div>Ký ngày: {formatDate(new Date())}</div>
                        <div
                          style={{
                            position: 'absolute',
                            right: '5px',
                            bottom: '2px',
                            fontSize: '25px',
                            opacity: '0.1',
                            color: '#27ae60',
                          }}
                        >
                          ✔️
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#f39c12', fontWeight: 'bold' }}>
                        🟡 Pending Signature
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <button
                      onClick={() => handlePreview(doc.id)}
                      style={{ marginRight: '5px', cursor: 'pointer' }}
                    >
                      👁️ Xem
                    </button>

                    {doc.status !== 'Signed' ? (
                      <button
                        onClick={() => handleSign(doc)}
                        style={{
                          backgroundColor: '#2980b9',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        🖋️ Ký Ngay
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleVerify(doc.id)}
                          style={{
                            backgroundColor: '#f1c40f',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '5px',
                          }}
                        >
                          🛡️ Verify
                        </button>
                        <a
                          href={`http://localhost:3000/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            textDecoration: 'none',
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            display: 'inline-block',
                          }}
                        >
                          📥 Tải về
                        </a>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default EmployeeDashboard
