import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const ManagerDashboard = () => {
  const navigate = useNavigate()

  // State điều hướng Tab (Mặc định mở tab Văn bản)
  const [activeTab, setActiveTab] = useState('documents') // 'documents' hoặc 'employees'

  // States của Tab Văn Bản
  const [file, setFile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [customFileName, setCustomFileName] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')

  // States của Tab Nhân Sự
  const [employees, setEmployees] = useState([])
  const [filterDept, setFilterDept] = useState('')

  // States cho Popup Chi tiết (MỚI THÊM)
  const [showModal, setShowModal] = useState(false)
  const [docDetails, setDocDetails] = useState(null)

  // 1. Kiểm tra quyền truy cập ngay khi vừa vào trang
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('userSession'))
    if (!session || (session.role !== 'Manager' && session.role !== 'SuperAdmin')) {
      toast.warning('Bạn không có quyền truy cập trang này!')
      navigate('/login')
    } else {
      fetchDocuments()
      fetchEmployees()
    }
  }, [navigate])

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/documents')
      setDocuments(response.data)
    } catch (error) {
      console.error('Lỗi khi tải danh sách:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/employees', {
        headers: { 'x-role': 'SuperAdmin' },
      })
      setEmployees(res.data)
    } catch (error) {
      const res = await axios.get('http://localhost:3000/api/employees')
      setEmployees(res.data)
    }
  }

  // ==================== LOGIC TAB VĂN BẢN ====================
  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setUploadStatus('Vui lòng chọn một file!')
      return
    }

    const formData = new FormData()
    if (customFileName.trim() !== '') {
      const finalName = customFileName.toLowerCase().endsWith('.pdf')
        ? customFileName
        : customFileName + '.pdf'
      formData.append('customName', finalName)
    }

    formData.append('document', file)
    formData.append('assignedTo', selectedEmployee)

    try {
      setUploadStatus('Đang tải lên...')
      await axios.post('http://localhost:3000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-role': 'SuperAdmin' },
      })

      setUploadStatus('✅ Tải file lên thành công!')
      setFile(null)
      setCustomFileName('')
      setSelectedEmployee('')
      fetchDocuments()
    } catch (error) {
      setUploadStatus('❌ Lỗi tải lên: ' + (error.response?.data?.error || 'Server error'))
    }
  }

  // Hàm xem chi tiết Mã băm & Khóa (MỚI THÊM)
  const handleViewDetails = async (id) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/documents/${id}/details`)
      setDocDetails(res.data)
      setShowModal(true)
    } catch (error) {
      toast.error('Lỗi khi lấy thông tin chi tiết!')
    }
  }

  // ==================== LOGIC TAB NHÂN SỰ ====================
  const handleAction = async (employeeId, action) => {
    if (action === 'Delete') {
      if (!window.confirm('Bạn có chắc chắn muốn XÓA vĩnh viễn nhân viên này?')) return
    }
    try {
      const res = await axios.post(
        'http://localhost:3000/api/admin/update-employee',
        { employeeId, action },
        { headers: { 'x-role': 'SuperAdmin' } }
      )
      toast.success(res.data.message)
      fetchEmployees()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi thao tác!')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userSession')
    navigate('/login')
  }

  // Hỗ trợ hiển thị dữ liệu
  const uniqueDepts = [...new Set(employees.map((emp) => emp.department).filter(Boolean))]
  const filteredEmployees = employees.filter((emp) => {
    if (emp.role === 'SuperAdmin') return false
    if (filterDept && emp.department !== filterDept) return false
    return true
  })
  const activeEmployees = employees.filter(
    (emp) => emp.status !== 'Pending' && emp.role !== 'SuperAdmin' && emp.role !== 'Manager'
  )

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: '15px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#c0392b' : '#ecf0f1',
    color: isActive ? 'white' : '#7f8c8d',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    transition: '0.3s',
  })

  return (
    <div
      style={{
        maxWidth: '1000px',
        minWidth: '950px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #c0392b',
          paddingBottom: '10px',
          marginTop: '20px',
        }}
      >
        <h2 style={{ color: '#c0392b', margin: 0 }}>Góc Quản Lý Cấp Cao 👑</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 15px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            minWidth: '150px',
          }}
        >
          Đăng Xuất
        </button>
      </div>

      {/* KHU VỰC CHUYỂN TAB */}
      <div style={{ display: 'flex', marginTop: '20px', gap: '5px' }}>
        <button
          style={tabStyle(activeTab === 'documents')}
          onClick={() => setActiveTab('documents')}
        >
          📂 Quản Lý Văn Bản
        </button>
        <button
          style={tabStyle(activeTab === 'employees')}
          onClick={() => setActiveTab('employees')}
        >
          👥 Quản Lý Nhân Sự
        </button>
      </div>

      {/* ==================== HIỂN THỊ TAB VĂN BẢN ==================== */}
      {activeTab === 'documents' && (
        <div
          style={{
            border: '2px solid #c0392b',
            borderTop: 'none',
            padding: '20px',
            borderRadius: '0 0 8px 8px',
            backgroundColor: '#fff',
          }}
        >
          {/* UPLOAD FILE */}
          <div
            style={{
              backgroundColor: '#fdf2e9',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#d35400', textAlign: 'center' }}>
              Tải lên văn bản mới
            </h3>
            <form
              onSubmit={handleUpload}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                style={{
                  padding: '10px',
                  border: '1px dashed #d35400',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                placeholder="Đổi tên file (VD: HopDong.pdf)"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                style={{
                  padding: '11px',
                  borderRadius: '4px',
                  border: '1px solid #bdc3c7',
                  outline: 'none',
                  width: '220px',
                }}
              />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                style={{
                  padding: '11px',
                  borderRadius: '4px',
                  border: '1px solid #bdc3c7',
                  cursor: 'pointer',
                }}
                required
              >
                <option value="">-- Chọn nhân viên ký --</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName} ({emp.employeeId})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                style={{
                  padding: '12px 25px',
                  backgroundColor: '#d35400',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Upload
              </button>
            </form>
            {uploadStatus && (
              <p
                style={{
                  marginTop: '15px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: uploadStatus.includes('❌') ? '#c0392b' : '#27ae60',
                }}
              >
                {uploadStatus}
              </p>
            )}
          </div>

          {/* DANH SÁCH FILE */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ color: '#2c3e50', textAlign: 'center' }}>
              Danh sách văn bản trên hệ thống
            </h3>
            {documents.length === 0 ? (
              <p style={{ color: '#7f8c8d', fontStyle: 'italic', textAlign: 'center' }}>
                Chưa có văn bản nào.
              </p>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '10px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#ecf0f1', textAlign: 'center' }}>
                    <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                      ID
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                      Tên File
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                      Giao cho
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                      Trạng Thái
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ textAlign: 'center' }}>
                      <td
                        style={{ padding: '10px', border: '1px solid #ecf0f1', color: '#7f8c8d' }}
                      >
                        {doc.id}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ecf0f1' }}>
                        <strong style={{ color: '#2980b9' }}>{doc.filename}</strong>
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          border: '1px solid #ecf0f1',
                          color: '#8e44ad',
                          fontWeight: 'bold',
                        }}
                      >
                        {doc.assignedTo}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ecf0f1' }}>
                        <span
                          style={{
                            backgroundColor: doc.status === 'Signed' ? '#eff5f1' : '#fef5e7',
                            color: doc.status === 'Signed' ? '#27ae60' : '#f39c12',
                            padding: '5px 10px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            display: 'inline-block',
                          }}
                        >
                          {doc.status === 'Signed' ? 'Đã Ký' : 'Chờ Ký'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ecf0f1' }}>
                        {doc.status === 'Signed' ? (
                          <a
                            href={`http://localhost:3000/api/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              textDecoration: 'none',
                              color: 'white',
                              backgroundColor: '#27ae60',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              display: 'inline-block',
                            }}
                          >
                            Tải bản đã ký
                          </a>
                        ) : (
                          <span style={{ color: '#bdc3c7', fontSize: '13px', fontStyle: 'italic' }}>
                            Chưa có bản ký
                          </span>
                        )}

                        {/* NÚT XEM CHI TIẾT (MỚI THÊM) */}
                        <button
                          onClick={() => handleViewDetails(doc.id)}
                          style={{
                            marginLeft: '10px',
                            backgroundColor: '#2c3e50',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          🔍 Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================== HIỂN THỊ TAB NHÂN SỰ ==================== */}
      {activeTab === 'employees' && (
        <div
          style={{
            border: '2px solid #c0392b',
            borderTop: 'none',
            padding: '20px',
            borderRadius: '0 0 8px 8px',
            backgroundColor: '#fff',
          }}
        >
          {/* BỘ LỌC */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              backgroundColor: '#ecf0f1',
              padding: '15px',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: 0, color: '#2c3e50' }}>Danh Sách Nhân Viên</h3>
            <div>
              <label style={{ fontWeight: 'bold', marginRight: '10px', color: '#34495e' }}>
                Lọc phòng ban:
              </label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }}
              >
                <option value="">Tất cả</option>
                {uniqueDepts.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BẢNG NHÂN SỰ */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#ecf0f1', textAlign: 'center' }}>
                <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                  Mã NV
                </th>
                <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                  Họ và Tên
                </th>
                <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                  Phòng Ban
                </th>
                <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                  Trạng Thái
                </th>
                <th style={{ padding: '12px', border: '1px solid #bdc3c7', color: '#34495e' }}>
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.employeeId} style={{ textAlign: 'center' }}>
                  <td style={{ padding: '10px', border: '1px solid #ecf0f1', color: '#7f8c8d' }}>
                    {emp.employeeId}
                  </td>
                  <td
                    style={{
                      padding: '10px',
                      border: '1px solid #ecf0f1',
                      fontWeight: 'bold',
                      color: '#2980b9',
                    }}
                  >
                    {emp.fullName} {emp.role === 'SuperAdmin' || emp.role === 'Manager' ? '👑' : ''}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ecf0f1' }}>
                    {emp.department || 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ecf0f1' }}>
                    {emp.status === 'Pending' ? (
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
                        Chờ Duyệt
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: '#eff5f1',
                          color: '#27ae60',
                          padding: '5px 10px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                        }}
                      >
                        Hoạt Động
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ecf0f1' }}>
                    {emp.role !== 'SuperAdmin' && emp.role !== 'Manager' && (
                      <>
                        {emp.status === 'Pending' && (
                          <button
                            onClick={() => handleAction(emp.employeeId, 'Approve')}
                            style={{
                              backgroundColor: '#2ecc71',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              marginRight: '5px',
                            }}
                          >
                            ✅ Duyệt
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(emp.employeeId, 'Delete')}
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== POPUP CHI TIẾT MÃ BĂM (MỚI THÊM) ==================== */}
      {showModal && docDetails && (
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
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '10px',
              width: '700px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              style={{
                color: '#2c3e50',
                marginTop: 0,
                borderBottom: '2px solid #ecf0f1',
                paddingBottom: '10px',
              }}
            >
              🔍 Chi Tiết Xác Thực Ký Số
            </h2>

            <p>
              <strong>Tên File:</strong>{' '}
              <span style={{ color: '#2980b9' }}>{docDetails.filename}</span>
            </p>
            <p>
              <strong>Trạng Thái:</strong>{' '}
              {docDetails.status === 'Signed' ? '✅ Đã Ký' : '⏳ Chưa Ký'}
            </p>

            <div style={{ marginTop: '15px' }}>
              <strong style={{ color: '#d35400' }}>1. Mã Băm File Gốc (Lúc mới tải lên):</strong>
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  wordBreak: 'break-all',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  border: '1px solid #ddd',
                  marginTop: '5px',
                }}
              >
                {docDetails.originalHash}
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <strong style={{ color: '#27ae60' }}>
                2. Mã Băm Hiện Tại (File đang lưu trên Server):
              </strong>
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  wordBreak: 'break-all',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  border: '1px solid #ddd',
                  marginTop: '5px',
                }}
              >
                {docDetails.currentHash}
              </div>
              {docDetails.status === 'Signed' && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    fontStyle: 'italic',
                    margin: '5px 0',
                  }}
                >
                  *Lưu ý: Mã băm thay đổi do file PDF đã được ghi đè con dấu chữ ký vào hệ thống.
                </p>
              )}
            </div>

            <div style={{ marginTop: '15px' }}>
              <strong style={{ color: '#8e44ad' }}>3. Public Key Của Người Ký:</strong>
              <textarea
                readOnly
                value={docDetails.publicKey}
                style={{
                  width: '100%',
                  height: '100px',
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid #ddd',
                  marginTop: '5px',
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerDashboard
