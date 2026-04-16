import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

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
  const [signPos, setSignPos] = useState({ x: 350, y: 100 })

  // THÊM DÒNG NÀY: State lưu vị trí của Ô vuông màu đỏ trên Bản đồ Mini (Hệ tọa độ màn hình)
  const [boxPos, setBoxPos] = useState({ x: 180, y: 300 })

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
          pageNum: 1, // Tạm thời mặc định ký trang 1
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

      {/* KHUNG XEM TRƯỚC VÀ CHỌN VỊ TRÍ KÝ PDF */}
      {previewDoc && (
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            border: '2px solid #34495e',
            borderRadius: '8px',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          <button
            onClick={() => setPreviewDoc(null)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '10px',
              cursor: 'pointer',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
            }}
          >
            ✖ Đóng
          </button>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Đang xem: {previewDoc.filename}</h3>
          {/* Hiển thị PDF bằng Iframe */}
          <iframe
            src={`http://localhost:3000/api/documents/${previewDoc.id}/view?t=${new Date().getTime()}`}
            width="100%"
            height="500px"
            style={{ border: '1px solid #ccc', borderRadius: '4px' }}
            title="PDF Preview"
          />
          {/* Bảng điều khiển chọn tọa độ */}
          {/* BẢNG ĐIỀU KHIỂN CHỌN TỌA ĐỘ BẰNG BẢN ĐỒ MINI */}
          <div
            style={{
              marginTop: '15px',
              padding: '20px',
              backgroundColor: '#fdf2e9',
              borderRadius: '8px',
              border: '1px dashed #e67e22',
              display: 'flex',
              gap: '30px',
              alignItems: 'center',
            }}
          >
            {/* CỘT TRÁI: Hướng dẫn và Nút Ký */}
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#d35400' }}>
                📍 Tùy chỉnh vị trí đóng dấu:
              </h4>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                Khung hiển thị PDF (ở trên) không cho phép bắt sự kiện click. <br />
                Vui lòng <b>Click vào Bản đồ trang A4 thu nhỏ</b> ở bên cạnh để di chuyển ô vuông
                chữ ký đến đúng vị trí bạn muốn.
              </p>
              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#fff',
                  borderLeft: '4px solid #27ae60',
                  marginTop: '15px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#27ae60', fontWeight: 'bold' }}>
                  Tọa độ sẽ gửi lên Server: X = {Math.round(signPos.x)} | Y ={' '}
                  {Math.round(signPos.y)}
                </span>
              </div>
            </div>

            {/* CỘT PHẢI: BẢN ĐỒ A4 MINI ĐỂ CLICK */}
            <div
              onClick={(e) => {
                // 1. Tính toán tọa độ click chuột trên cái khung bản đồ này
                const rect = e.currentTarget.getBoundingClientRect()
                let clickX = e.clientX - rect.left
                let clickY = e.clientY - rect.top

                // 2. Chặn không cho ô vuông bị tràn ra ngoài viền bản đồ
                if (clickX > 180) clickX = 180 // 280 (chiều rộng) - 100 (độ rộng ô vuông)
                if (clickY > 346) clickY = 346 // 396 (chiều cao) - 50 (độ cao ô vuông)

                // 3. Cập nhật vị trí UI của ô vuông
                setBoxPos({ x: clickX, y: clickY })

                // 4. QUY ĐỔI TOÁN HỌC SANG HỆ TỌA ĐỘ CỦA BẢN PDF THẬT
                // Khổ A4 thật là 595 x 842. Bản đồ là 280 x 396 => Tỷ lệ là ~ 2.125
                const scale = 595 / 280
                const pdfX = clickX * scale
                // QUAN TRỌNG: Backend pdf-lib tính gốc tọa độ Y từ DƯỚI LÊN, nên ta phải trừ ngược lại
                const pdfY = 842 - clickY * scale - 50

                setSignPos({ x: pdfX, y: pdfY })
              }}
              style={{
                width: '280px',
                height: '396px',
                backgroundColor: 'white',
                border: '2px solid #bdc3c7',
                position: 'relative',
                cursor: 'crosshair',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '5px',
                  left: '10px',
                  color: '#bdc3c7',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Mô phỏng Trang A4
              </div>

              {/* Ô VUÔNG ĐỎ ĐẠI DIỆN CHO CON DẤU CHỮ KÝ */}
              <div
                style={{
                  position: 'absolute',
                  left: `${boxPos.x}px`,
                  top: `${boxPos.y}px`,
                  width: '100px',
                  height: '50px',
                  border: '2px dashed #e74c3c',
                  backgroundColor: 'rgba(231, 76, 60, 0.15)',
                  pointerEvents: 'none', // Giúp click xuyên qua ô vuông xuống bản đồ
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c0392b',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  transition: 'all 0.1s ease-out', // Hiệu ứng lướt mượt mà
                }}
              >
                Khu vực <br /> Chữ ký
              </div>
            </div>
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
