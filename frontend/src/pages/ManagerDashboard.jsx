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

  // State mới để lưu tên file tùy chỉnh
  const [customFileName, setCustomFileName] = useState('')

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
  }, [navigate])

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

  // 4. Hàm xử lý Upload File có đổi tên
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setUploadStatus('Vui lòng chọn một file!')
      return
    }

    const formData = new FormData()

    // 👇 KIỂM TRA VÀ GẮN TÊN MỚI VÀO FORM (Tự động thêm đuôi .pdf nếu thiếu)
    if (customFileName.trim() !== '') {
      const finalName = customFileName.toLowerCase().endsWith('.pdf')
        ? customFileName
        : customFileName + '.pdf'
      formData.append('customName', finalName)
    }

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
      setCustomFileName('') // Reset lại ô nhập tên
      setSelectedEmployee('') // Reset ô chọn nhân viên
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
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
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
        <h2 style={{ color: '#c0392b', margin: 0 }}>Góc Quản Lý Văn Bản </h2>
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

      {/* KHU VỰC 1: UPLOAD FILE */}
      <div
        style={{
          backgroundColor: '#fdf2e9',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#d35400', textAlign: 'center' }}>Tải lên văn bản mới</h3>
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

          {/* 👇 Ô NHẬP TÊN FILE MỚI ĐƯỢC THÊM VÀO ĐÂY 👇 */}
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
            {employees.map((emp) => (
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
              transition: '0.2s',
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

      {/* KHU VỰC 2: DANH SÁCH FILE */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#2c3e50', textAlign: 'center' }}>Danh sách văn bản trên hệ thống</h3>
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
                {/* Đã thêm cột Giao cho để khớp với dữ liệu bên dưới */}
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
                  <td style={{ padding: '10px', border: '1px solid #ecf0f1', color: '#7f8c8d' }}>
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
                        minWidth: '80px',
                        display: 'inline-block',
                      }}
                    >
                      {doc.status === 'Signed' ? 'Đã Ký ' : 'Chờ Ký '}
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
