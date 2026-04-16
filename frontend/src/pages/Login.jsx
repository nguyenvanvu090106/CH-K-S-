import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
const Login = () => {
  const navigate = useNavigate()
  const [cccd, setCccd] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Employee') // Mặc định là nhân viên
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post('http://localhost:3000/api/login', {
        cccd,
        password,
        role,
      })

      localStorage.setItem('userSession', JSON.stringify(res.data.session))

      // Gọi thông báo THÀNH CÔNG (Màu xanh lá)
      toast.success(`Đăng nhập thành công! Xin chào ${res.data.session.fullName}`)

      if (res.data.session.role === 'Manager') {
        navigate('/manager')
      } else {
        navigate('/employee')
      }
    } catch (err) {
      // Gọi thông báo LỖI (Màu đỏ)
      toast.error(err.response?.data?.error || 'Lỗi kết nối đến máy chủ')
    }
  }

  return (
    // Box bọc ngoài full màn hình, canh giữa mọi thứ
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
      }}
    >
      {/* Khung Đăng Nhập */}
      <div
        style={{
          width: '600px',
          // minHeight: '600px',
          backgroundColor: 'white',
          padding: '50px 60px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#165a9d', marginBottom: '30px' }}>
          Hệ Thống Ký Số Nội Bộ
        </h2>

        <form onSubmit={handleLogin}>
          {/* Cụm Nút Chọn Vai Trò */}
          <div
            style={{
              display: 'flex',
              marginBottom: '20px',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #ddd',
            }}
          >
            <button
              type="button"
              onClick={() => setRole('Employee')}
              style={{
                flex: 1,
                minHeight: '80px',
                padding: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                backgroundColor: role === 'Employee' ? '#2ecc71' : '#f8f9fa',
                color: role === 'Employee' ? 'white' : '#7f8c8d',
              }}
            >
              👤 Nhân Viên
            </button>
            <button
              type="button"
              onClick={() => setRole('Manager')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                backgroundColor: role === 'Manager' ? '#e74c3c' : '#f8f9fa',
                color: role === 'Manager' ? 'white' : '#7f8c8d',
              }}
            >
              👑 Quản Lý
            </button>
          </div>

          {/* Ô Nhập Liệu */}
          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#34495e',
                fontWeight: 'bold',
              }}
            >
              Số CCCD:
            </label>
            <input
              type="text"
              value={cccd}
              onChange={(e) => setCccd(e.target.value)}
              placeholder="Nhập CCCD của bạn"
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '12px',
                border: '1px solid #bdc3c7',
                borderRadius: '10px',
                boxSizing: 'border-box',
                outline: 'none',
                fontSize: '25px' /* Tăng lên 20px hoặc 22px cho vừa mắt */,
                fontWeight: '500',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#34495e',
                fontWeight: 'bold',
              }}
            >
              Mật khẩu:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '12px',
                border: '1px solid #bdc3c7',
                borderRadius: '6px',
                boxSizing: 'border-box',
                outline: 'none',
                fontSize: '30px',
                fontWeight: '500',
              }}
              required
            />
          </div>

          {error && (
            <p
              style={{
                color: '#e74c3c',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              minHeight: '70px',
              padding: '14px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            VÀO HỆ THỐNG
          </button>
        </form>

        {/* Nút chuyển qua Đăng ký */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #ecf0f1',
          }}
        >
          <span style={{ color: '#7f8c8d', fontSize: '25px' }}>Chưa có tài khoản? </span>
          <span
            onClick={() => navigate('/register')}
            style={{
              color: '#2980b9',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '25px',
            }}
          >
            Đăng ký ngay
          </span>
        </div>
      </div>
    </div>
  )
}

export default Login
