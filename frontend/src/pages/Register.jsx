import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    cccd: '',
    department: '',
    password: '', // <-- ĐÃ THÊM TRƯỜNG PASSWORD Ở ĐÂY
    pin: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // 1. Kiểm tra CCCD: Trừ chữ 'admin', còn lại phải đúng 12 chữ số
    const cccdRegex = /^\d{12}$/
    if (formData.cccd !== 'admin' && !cccdRegex.test(formData.cccd)) {
      setError('❌ Số CCCD không hợp lệ! Vui lòng nhập đúng 12 chữ số.')
      return
    }

    // 2. Kiểm tra Mật khẩu: Phải từ 6 ký tự trở lên
    if (formData.password.length < 6) {
      setError('❌ Mật khẩu quá ngắn! Phải có ít nhất 6 ký tự.')
      return
    }

    // 3. Kiểm tra Mã PIN: Phải đúng 6 chữ số (Dùng regex chuẩn hơn isNaN)
    const pinRegex = /^\d{6}$/
    if (!pinRegex.test(formData.pin)) {
      setError('❌ Mã PIN ký số phải bao gồm đúng 6 chữ số!')
      return
    }
    // 4. KIỂM TRA TUỔI: Phải từ 18 tuổi trở lên
    if (!formData.dob) {
      setError('❌ Vui lòng chọn ngày sinh!')
      return
    }
    const birthDate = new Date(formData.dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    // Nếu chưa tới tháng sinh trong năm nay, hoặc đang ở tháng sinh nhưng chưa tới ngày sinh thì trừ đi 1 tuổi
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 18) {
      setError('❌ Người lao động phải đủ 18 tuổi trở lên!')
      return
    }
    try {
      // Nếu qua được hết 3 chốt chặn trên thì mới gọi API
      const res = await axios.post('http://localhost:3000/api/register', formData)

      setSuccess('✅ Đăng ký thành công! Hệ thống đang chuyển hướng...')

      // Xóa form sau khi đăng ký thành công
      setFormData({ fullName: '', dob: '', cccd: '', department: '', password: '', pin: '' })

      // Tự động chuyển về trang Đăng nhập sau 2 giây
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError('❌ ' + (err.response?.data?.error || 'Lỗi kết nối máy chủ!'))
    }
  }

  return (
    <div
      style={{
        minHeight: '90vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '600px',
          backgroundColor: 'white',
          padding: '30px 40px',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#2980b9', marginBottom: '20px' }}>
          Đăng Ký Danh Tính Số
        </h2>

        {error && (
          <div
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'center',
              marginBottom: '15px',
              fontWeight: 'bold',
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'center',
              marginBottom: '15px',
              fontWeight: 'bold',
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#34495e',
                fontWeight: 'bold',
                fontSize: '25px',
              }}
            >
              Họ và tên:
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              style={{ ...inputStyle, fontSize: '30px', fontWeight: '500' }}
              placeholder="VD: Nguyễn Văn Vũ"
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#34495e',
                  fontWeight: 'bold',
                  fontSize: '25px',
                }}
              >
                Ngày sinh:
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                style={{ ...inputStyle, fontSize: '28px', fontWeight: '500' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#34495e',
                  fontWeight: 'bold',
                  fontSize: '25px',
                }}
              >
                Số CCCD:
              </label>
              <input
                type="text"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                required
                style={{ ...inputStyle, fontSize: '30px', fontWeight: '500' }}
                placeholder="VD: 123456789012"
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#34495e',
                fontWeight: 'bold',
                fontSize: '25px',
              }}
            >
              Phòng ban / Bộ phận:
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              style={{ ...inputStyle, fontSize: '30px', fontWeight: '500' }}
              placeholder="VD: IT, Nhân sự..."
            />
          </div>

          {/* Ô NHẬP MẬT KHẨU ĐĂNG NHẬP MỚI THÊM */}
          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#34495e',
                fontWeight: 'bold',
                fontSize: '25px',
              }}
            >
              Mật khẩu đăng nhập Web:
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ ...inputStyle, fontSize: '30px', fontWeight: '500', minHeight: '60px' }}
              placeholder="Dùng để đăng nhập hệ thống"
            />
          </div>

          <div
            style={{
              backgroundColor: '#fdf2e9',
              padding: '15px',
              borderRadius: '6px',
              border: '1px solid #e67e22',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '25px',
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#d35400',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Thiết lập mã PIN KÝ SỐ (6 số):
            </label>
            <input
              type="password"
              name="pin"
              value={formData.pin}
              onChange={handleChange}
              maxLength="6"
              required
              style={{ ...inputStyle, textAlign: 'center', fontSize: '30px', letterSpacing: '5px' }}
              placeholder="••••••"
            />
            <p
              style={{
                margin: '5px 0 0 0',
                fontSize: '12px',
                color: '#7f8c8d',
                textAlign: 'center',
              }}
            >
              Mã PIN này dùng để mở khóa Private Key khi bạn ký văn bản.
            </p>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '12px',
              backgroundColor: '#2980b9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ĐĂNG KÝ
          </button>
        </form>

        {/* NÚT QUAY LẠI TRANG ĐĂNG NHẬP */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #ecf0f1',
          }}
        >
          <span style={{ color: '#7f8c8d', fontSize: '25px' }}>Đã có tài khoản? </span>
          <span
            onClick={() => navigate('/login')}
            style={{
              color: '#27ae60',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '25px',
            }}
          >
            Đăng nhập ngay
          </span>
        </div>
      </div>
    </div>
  )
}

// Style chung cho các ô input
const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #bdc3c7',
  borderRadius: '4px',
  boxSizing: 'border-box',
  outline: 'none',
}

export default Register
