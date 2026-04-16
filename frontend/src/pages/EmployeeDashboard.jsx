import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Document, Page, pdfjs } from 'react-pdf'
import { toast } from 'react-toastify'
// Cấu hình Worker siêu việt để React có thể đọc hiểu dữ liệu nhị phân của PDF (Không có dòng này là lỗi liền nhé)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const EmployeeDashboard = () => {
  const navigate = useNavigate()
  const [myDocs, setMyDocs] = useState([])
  const [employeeId, setEmployeeId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)
  const [showPinModal, setShowPinModal] = useState(false) // Quản lý ẩn/hiện hộp nhập PIN
  // State quản lý Hồ sơ
  const [profile, setProfile] = useState({ fullName: '', dob: '', department: '' })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
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

  // 1. Kiểm tra session, lấy danh sách file được giao VÀ lấy thông tin Profile
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('userSession'))

    if (!session || session.role !== 'Employee') {
      navigate('/login')
    } else {
      // 1. Lưu lại ID nhân viên
      setEmployeeId(session.employeeId)

      // 2. Lấy danh sách file cần ký
      fetchMyDocs(session.employeeId)

      // 3. THÊM MỚI: Lấy thông tin cá nhân từ Backend đổ vào Profile
      // 3. Lấy thông tin cá nhân từ Backend đổ vào Profile
      axios
        .get(`http://localhost:3000/api/employee/${session.employeeId}`)
        .then((res) => {
          // Thêm cái này để đảm bảo dù data rỗng nó vẫn không bị lỗi
          if (res.data) {
            setProfile({
              fullName: res.data.fullName || '',
              dob: res.data.dob || '',
              department: res.data.department || '',
            })
          }
        })
        .catch((err) => console.error('Lỗi lấy thông tin cá nhân:', err))
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
      toast.error('Vui lòng nhập đúng mã PIN 6 số!')
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
          percentX: signPos.percentX, // <-- SỬA DÒNG NÀY
          percentY: signPos.percentY,
          pageNum: signPos.pageNum, // <--- SỬA CHỖ NÀY ĐỂ KÝ ĐÚNG TRANG
        },
        { headers: { 'x-role': 'Employee' } }
      )

      toast.success('Ký văn bản thành công!')
      setPin('') // Reset mã PIN
      setPreviewDoc(null)
      fetchMyDocs(employeeId)
      setStatusMsg('')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi hệ thống')
      setStatusMsg('')
    }
  }
  const handleSaveProfile = async () => {
    try {
      await axios.post('http://localhost:3000/api/update-profile', {
        employeeId: employeeId,
        ...profile,
      })
      toast.success('Cập nhật thông tin thành công!')
      setIsEditingProfile(false)
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật!')
    }
  }
  // 4. Hàm xác thực tính toàn vẹn
  const handleVerify = async (docId) => {
    try {
      const res = await axios.post('http://localhost:3000/api/verify', { documentId: docId })
      toast.success(res.data.message)
    } catch (error) {
      toast.warning(error.response?.data?.message || 'Cảnh báo: File bị thay đổi!')
    }
  }

  // Hàm phụ: Định dạng ngày tháng
  const formatDate = (date) => new Date(date).toLocaleString('vi-VN')

  return (
    // Tăng chiều rộng tổng thể lên 1200px để đủ chỗ cho 2 bảng nằm ngang
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
      }}
    >
      {/* ================= 1. HEADER ================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '2px solid #27ae60',
          paddingBottom: '10px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ marginTop: '20px', color: '#27ae60' }}>
          Hộp Thư Văn Bản Của Bạn (ID: {employeeId})
        </h2>
        <button
          onClick={() => {
            localStorage.removeItem('userSession')
            navigate('/login')
          }}
          style={{
            marginTop: '20px',
            padding: '8px 15px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Đăng Xuất
        </button>
      </div>

      {/* ================= 2. KHU VỰC SONG SONG (HỒ SƠ & DANH SÁCH) ================= */}
      {/* Dùng Flexbox để chia 2 cột, ép chiều cao cố định 450px */}
      <div style={{ display: 'flex', gap: '25px', marginBottom: '30px', height: '450px' }}>
        {/* --- CỘT TRÁI: HỒ SƠ CÁ NHÂN (Xếp dọc) --- */}
        <div
          style={{
            flex: '0 0 350px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            borderTop: '4px solid #3498db',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #ecf0f1',
              paddingBottom: '10px',
            }}
          >
            <h3 style={{ margin: 0, color: '#2c3e50' }}>👤 Hồ Sơ</h3>
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                style={{
                  minWidth: '90px' /* 👈 Ép chiều rộng tối thiểu bằng nhau */,
                  textAlign: 'center' /* 👈 Căn giữa icon và chữ */,
                  minHeight: '40px' /* 👈 Đảm bảo nút có chiều cao tối thiểu */,
                  boxSizing: 'border-box' /* 👈 Đảm bảo padding không làm méo nút */,
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                Sửa
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  style={{
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProfile}
                  style={{
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }}
                >
                  Lưu
                </button>
              </div>
            )}
          </div>

          {/* Các ô nhập liệu xếp dọc */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#7f8c8d' }}>
                Họ và Tên:
              </label>
              <input
                type="text"
                value={profile?.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                disabled={!isEditingProfile}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #bdc3c7',
                  backgroundColor: isEditingProfile ? '#fff' : '#f9f9f9',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#7f8c8d' }}>
                Ngày Sinh:
              </label>
              <input
                type="date"
                value={profile?.dob || ''}
                onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                disabled={!isEditingProfile}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #bdc3c7',
                  backgroundColor: isEditingProfile ? '#fff' : '#f9f9f9',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#7f8c8d' }}>
                Bộ Phận:
              </label>
              <input
                type="text"
                value={profile?.department || ''}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                disabled={!isEditingProfile}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #bdc3c7',
                  backgroundColor: isEditingProfile ? '#fff' : '#f9f9f9',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: DANH SÁCH VĂN BẢN (Có thanh cuộn) --- */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            borderTop: '4px solid #2ecc71',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: '15px',
              color: '#2c3e50',
              borderBottom: '1px solid #ecf0f1',
              paddingBottom: '10px',
            }}
          >
            Danh sách văn bản được giao
          </h3>

          {/* Khu vực cuộn nếu danh sách quá dài */}
          <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '5px' }}>
            {myDocs.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '50px' }}>
                Bạn chưa có văn bản nào cần xử lý.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead
                  style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}
                >
                  <tr>
                    <th
                      style={{
                        padding: '12px',
                        borderBottom: '2px solid #ddd',
                        textAlign: 'left',
                        color: '#34495e',
                      }}
                    >
                      Tên File
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        borderBottom: '2px solid #ddd',
                        textAlign: 'center',
                        color: '#34495e',
                      }}
                    >
                      Trạng Thái
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        borderBottom: '2px solid #ddd',
                        textAlign: 'center',
                        color: '#34495e',
                      }}
                    >
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      style={{ transition: '0.2s' }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f8ff')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '15px 12px', borderBottom: '1px solid #eee' }}>
                        <strong style={{ color: '#2980b9' }}>{doc.filename}</strong>
                        <br />
                        <small style={{ color: '#95a5a6' }}>ID: {doc.id}</small>
                      </td>
                      <td
                        style={{
                          padding: '15px 12px',
                          borderBottom: '1px solid #eee',
                          textAlign: 'center',
                        }}
                      >
                        {doc.status === 'Signed' ? (
                          <span
                            style={{
                              backgroundColor: '#e8f8f5',
                              color: '#27ae60',
                              padding: '5px 10px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: 'bold',
                            }}
                          >
                            Đã Ký
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#fef5e7',
                              color: '#f39c12',
                              padding: '5px 10px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: 'bold',
                            }}
                          >
                            Chờ Ký
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '15px 12px',
                          borderBottom: '1px solid #eee',
                          textAlign: 'center',
                        }}
                      >
                        <button
                          onClick={() => handlePreview(doc.id)}
                          style={{
                            minWidth: '60px' /* 👈 Ép chiều rộng tối thiểu bằng nhau */,
                            minHeight: '40px' /* 👈 Đảm bảo nút có chiều cao tối thiểu */,
                            textAlign: 'center' /* 👈 Căn giữa icon và chữ */,
                            boxSizing: 'border-box' /* 👈 Đảm bảo padding không làm méo nút */,
                            backgroundColor: '#ecf0f1',
                            color: '#2c3e50',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginRight: '5px',
                            transition: '0.2s',
                            fontSize: '13px',
                          }}
                        >
                          Xem
                        </button>

                        {doc.status !== 'Signed' ? (
                          <button
                            onClick={() => handlePreview(doc.id)}
                            style={{
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                            }}
                          >
                            Tới chỗ Ký
                          </button>
                        ) : (
                          <>
                            <a
                              href={`http://localhost:3000/api/documents/${doc.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                minWidth: '60px' /* 👈 Ép chiều rộng tối thiểu bằng nhau */,
                                minHeight: '40px' /* 👈 Đảm bảo nút có chiều cao tối thiểu */,
                                textAlign: 'center' /* 👈 Căn giữa icon và chữ */,
                                boxSizing: 'border-box' /* 👈 Đảm bảo padding không làm méo nút */,
                                textDecoration: 'none',
                                backgroundColor: '#2ecc71',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                fontSize: '13px',
                                fontWeight: 'bold',
                              }}
                            >
                              Tải về
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
      </div>

      {/* ================= 3. KHU VỰC XEM PDF (NẰM Ở DƯỚI CÙNG) ================= */}
      {previewDoc && (
        <div
          style={{
            backgroundColor: '#ecf0f1',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.5s',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
            }}
          >
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
            <div style={{ display: 'flex', gap: '10px' }}>
              {previewDoc.status !== 'Signed' && (
                <button
                  onClick={() => {
                    if (!boxPos) {
                      toast.warning('Vui lòng click vào trang giấy để chọn vị trí đóng dấu trước!')
                      return
                    }
                    setShowPinModal(true)
                  }}
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
              maxHeight: '700px',
              overflowY: 'auto',
            }}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div style={{ color: 'white' }}>Đang tải tài liệu PDF... ⏳</div>}
            >
              {Array.from(new Array(numPages), (el, index) => {
                const pageIndex = index + 1
                return (
                  <div
                    key={`page_${pageIndex}`}
                    style={{
                      position: 'relative',
                      marginBottom: '20px',
                      cursor: previewDoc.status === 'Signed' ? 'not-allowed' : 'crosshair',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    }}
                    onClick={(e) => {
                      if (previewDoc.status === 'Signed') return

                      const rect = e.currentTarget.getBoundingClientRect()
                      const clickX = e.clientX - rect.left
                      let clickY = e.clientY - rect.top

                      // 1. Lưu boxPos để vẽ ô xem trước trên Web (giữ nguyên logic cũ)
                      let boxY = clickY
                      if (boxY > rect.height - 70) boxY = rect.height - 70
                      setBoxPos({ x: clickX, y: boxY, pageNum: pageIndex })

                      // 2. Tính TỈ LỆ PHẦN TRĂM (0.0 đến 1.0) gửi về Backend
                      const percentX = clickX / rect.width
                      const percentY = clickY / rect.height

                      setSignPos({ percentX: percentX, percentY: percentY, pageNum: pageIndex })
                    }}
                  >
                    <Page
                      pageNumber={pageIndex}
                      width={700}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
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

      {/* ================= 4. MODAL NHẬP PIN ================= */}
      {showPinModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '350px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🔒 Xác Thực Chữ Ký</h3>
            <p style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '20px' }}>
              Vui lòng nhập mã PIN 6 số để mở khóa Private Key và đóng dấu lên văn bản.
            </p>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength="6"
              placeholder="••••••"
              autoFocus
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '10px',
                borderRadius: '8px',
                border: '2px solid #3498db',
                boxSizing: 'border-box',
                marginBottom: '20px',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowPinModal(false)
                  setPin('')
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => {
                  setShowPinModal(false)
                  handleSign(previewDoc)
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ✅ Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeDashboard
