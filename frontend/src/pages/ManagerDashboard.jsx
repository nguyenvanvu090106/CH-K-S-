import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
const ManagerDashboard = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')

  // 1. Kiểm tra quyền truy cập ngay khi vừa vào trang
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('userSession'))
    if (!session || session.role !== 'Manager') {
      toast.warning('Bạn không có quyền truy cập trang này!')
      navigate('/login')
    } else {
      fetchDocuments() // Nếu đúng Manager thì tải danh sách file
    }
    fetchEmployees() // Lấy danh sách nhân viên khi vào trang
    fetchDocuments()
  }, [])

  // 2. Hàm lấy danh sách file từ Backend
  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/documents')
      setDocuments(response.data)
    } catch (error) {
      console.error('Lỗi khi tải danh sách:', error)
    }
  }
  const fetchEmployees = async () => {
    const res = await axios.get('http://localhost:3000/api/employees')
    setEmployees(res.data)
  }
  // 3. Hàm bắt sự kiện khi chọn file
  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  // 4. Hàm xử lý Upload File (Giống hệt nãy giờ bạn test trên Postman)
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setUploadStatus('Vui lòng chọn một file!')
      return
    }

    const formData = new FormData()
    formData.append('document', file) // 'document' là Key bắt buộc
    formData.append('assignedTo', selectedEmployee)
    try {
      setUploadStatus('Đang tải lên...')
      await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-role': 'Manager', // Header RBAC quan trọng nhất
        },
      })

      setUploadStatus('✅ Tải file lên thành công!')
      setFile(null) // Reset lại ô chọn file
      fetchDocuments() // Cập nhật lại danh sách bên dưới
    } catch (error) {
      setUploadStatus('❌ Lỗi tải lên: ' + (error.response?.data?.error || 'Server error'))
    }
  }

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('userSession')
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #c0392b',
          paddingBottom: '10px',
        }}
      >
        <h2 style={{ color: '#c0392b' }}>Góc Quản Lý Văn Bản 📂</h2>
        <button
          onClick={handleLogout}
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

      {/* KHU VỰC 1: UPLOAD FILE */}
      <div
        style={{
          backgroundColor: '#fdf2e9',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
        }}
      >
        <h3>Tải lên văn bản mới</h3>
        <form
          onSubmit={handleUpload}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <input
            type="file"
            onChange={handleFileChange}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px dashed #d35400',
              backgroundColor: '#fff',
            }}
          />
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px' }}
            required
          >
            <option value="">-- Chọn nhân viên ký --</option>
            {employees.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.fullName} ({emp.employeeId})
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: '12px 20px',
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
        {uploadStatus && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{uploadStatus}</p>}
      </div>

      {/* KHU VỰC 2: DANH SÁCH FILE */}
      <div style={{ marginTop: '30px' }}>
        <h3>Danh sách văn bản trên hệ thống</h3>
        {documents.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>Chưa có văn bản nào.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#ecf0f1', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #bdc3c7' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #bdc3c7' }}>Tên File</th>
                <th style={{ padding: '10px', border: '1px solid #bdc3c7' }}>Trạng Thái</th>
                <th style={{ padding: '10px', border: '1px solid #bdc3c7' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.id}</td>
                  <td>
                    <strong>{doc.filename}</strong>
                  </td>
                  <td>{doc.assignedTo}</td>
                  <td>
                    <span
                      className={`status-badge ${doc.status === 'Signed' ? 'status-signed' : 'status-pending'}`}
                    >
                      {doc.status === 'Signed' ? 'Đã Ký ✅' : 'Chờ Ký ⏳'}
                    </span>
                  </td>
                  {/* ĐOẠN CODE HIỆN NÚT TẢI VỀ NẰM Ở ĐÂY 👇 */}
                  <td>
                    {doc.status === 'Signed' ? (
                      <a
                        href={`http://localhost:3000/api/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration: 'none',
                          color: 'white',
                          backgroundColor: '#27ae60',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        📥 Tải bản có dấu
                      </a>
                    ) : (
                      <span style={{ color: '#95a5a6', fontSize: '12px' }}>Chưa có bản ký</span>
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

export default ManagerDashboard
