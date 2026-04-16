import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
  const [role, setRole] = useState('Employee')
  const [employeeId, setEmployeeId] = useState('')
  const navigate = useNavigate()

  // Thêm async ở đây để dùng được await bên dưới
  const handleLogin = async (e) => {
    e.preventDefault()

    if (role === 'Manager') {
      // Logic cho Manager (tạm thời không cần check backend cho Lab này)
      localStorage.setItem('userSession', JSON.stringify({ role: 'Manager' }))
      alert('Đăng nhập thành công với quyền Manager!')
      navigate('/manager')
    } else {
      // Logic cho Employee
      if (!employeeId.trim()) {
        alert('Vui lòng nhập Mã Nhân Viên!')
        return
      }

      try {
        // GỌI API KIỂM TRA MÃ NHÂN VIÊN TẠI BACKEND
        await axios.post('http://localhost:3000/api/check-employee', {
          employeeId: employeeId.trim(),
        })

        // Nếu Backend không báo lỗi, thực hiện lưu session và chuyển trang
        localStorage.setItem(
          'userSession',
          JSON.stringify({
            role: 'Employee',
            employeeId: employeeId.trim(),
          })
        )

        alert(`Đăng nhập thành công! Chào mừng ${employeeId}`)
        navigate('/employee')
      } catch (error) {
        // Nếu mã không tồn tại (Lỗi 404 từ backend), nhảy vào đây
        alert(error.response?.data?.error || 'Mã nhân viên không tồn tại hoặc lỗi server!')
      }
    }
  }

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
      }}
    >
      <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>Đăng Nhập Hệ Thống</h2>

      <form
        onSubmit={handleLogin}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}
      >
        <div>
          <label style={{ fontWeight: 'bold' }}>Bạn là ai?</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #aaa',
            }}
          >
            <option value="Employee">Nhân Viên (Cần ký duyệt)</option>
            <option value="Manager">Quản Lý (Upload văn bản)</option>
          </select>
        </div>

        {role === 'Employee' && (
          <div>
            <label style={{ fontWeight: 'bold' }}>Mã Nhân Viên:</label>
            <input
              type="text"
              placeholder="Ví dụ: EMP_1234"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '5px',
                borderRadius: '4px',
                border: '1px solid #aaa',
              }}
              required
            />
          </div>
        )}

        <button
          type="submit"
          style={{
            padding: '12px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '10px',
          }}
        >
          Vào Hệ Thống
        </button>
      </form>
    </div>
  )
}

export default Login
