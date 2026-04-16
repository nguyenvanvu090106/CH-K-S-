import React, { useState } from 'react'
import axios from 'axios'

const Register = () => {
  // Thêm trường 'pin' vào state
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    department: '',
    cccd: '',
    pin: '',
  })

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    // Validate cơ bản ở frontend
    if (formData.pin.length !== 6 || isNaN(formData.pin)) {
      setError('Mã PIN phải là 6 chữ số!')
      return
    }

    try {
      const response = await axios.post('http://localhost:3000/api/register', formData)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi kết nối đến server')
    }
  }

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '40px auto',
        padding: '30px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      }}
    >
      <h2 style={{ textAlign: 'center', color: '#2980b9' }}>Đăng Ký Danh Tính Số</h2>

      {error && (
        <div
          style={{
            color: 'white',
            backgroundColor: '#e74c3c',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {result ? (
        <div
          style={{
            backgroundColor: '#d4edda',
            padding: '20px',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ color: '#155724' }}>🎉 {result.message}</h3>
          <div
            style={{
              margin: '20px 0',
              padding: '15px',
              backgroundColor: '#fff',
              border: '2px dashed #28a745',
              borderRadius: '8px',
            }}
          >
            <p style={{ fontSize: '18px', margin: '5px 0' }}>Mã Nhân Viên của bạn:</p>
            <strong style={{ fontSize: '24px', color: '#d35400' }}>
              {result.employee.employeeId}
            </strong>
          </div>
          <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
            ⚠️ Hãy nhớ kỹ mã PIN 6 số của bạn để sử dụng khi Ký duyệt văn bản!
          </p>
          <button
            onClick={() => {
              setResult(null)
              setFormData({ fullName: '', dob: '', department: '', cccd: '', pin: '' })
            }}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              cursor: 'pointer',
              backgroundColor: '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            Đăng ký người khác
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <div>
            <label style={{ fontWeight: 'bold' }}>Họ và tên: </label>
            <input
              type="text"
              name="fullName"
              required
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '5px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
              onChange={handleChange}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>Ngày sinh: </label>
              <input
                type="text"
                name="dob"
                placeholder="DD/MM/YYYY"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
                onChange={handleChange}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>Căn cước công dân: </label>
              <input
                type="text"
                name="cccd"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>Phòng ban / Bộ phận: </label>
            <input
              type="text"
              name="department"
              required
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '5px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
              onChange={handleChange}
            />
          </div>

          {/* KHU VỰC NHẬP MÃ PIN BẢO MẬT */}
          <div
            style={{
              backgroundColor: '#fdf2e9',
              padding: '15px',
              borderRadius: '5px',
              border: '1px solid #e67e22',
            }}
          >
            <label style={{ fontWeight: 'bold', color: '#d35400' }}>
              Thiết lập mã PIN (6 số) để khóa Private Key:{' '}
            </label>
            <input
              type="password"
              name="pin"
              maxLength="6"
              placeholder="Ví dụ: 123456"
              required
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '5px',
                borderRadius: '4px',
                border: '1px solid #d35400',
                fontSize: '20px',
                letterSpacing: '5px',
                textAlign: 'center',
              }}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px',
              backgroundColor: '#2980b9',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Đăng Ký Cloud HSM
          </button>
        </form>
      )}
    </div>
  )
}

export default Register
