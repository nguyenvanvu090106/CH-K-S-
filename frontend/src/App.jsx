import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

// IMPORT file Register thật mà ta vừa code xong
import Register from './pages/Register'
import Login from './pages/Login'
import ManagerDashboard from './pages/ManagerDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
// Các component tạm chờ làm sau

function App() {
  return (
    <BrowserRouter>
      <div
        style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}
      >
        <h1 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
          Hệ Thống Chữ Ký Số Nội Bộ
        </h1>

        <nav
          style={{
            marginBottom: '30px',
            display: 'flex',
            gap: '20px',
            backgroundColor: '#f1f2f6',
            padding: '15px',
            borderRadius: '8px',
          }}
        >
          <Link
            to="/register"
            style={{ textDecoration: 'none', color: '#2980b9', fontWeight: 'bold' }}
          >
            Đăng Ký
          </Link>
          <Link
            to="/login"
            style={{ textDecoration: 'none', color: '#2980b9', fontWeight: 'bold' }}
          >
            Đăng Nhập
          </Link>
          <Link
            to="/manager"
            style={{ textDecoration: 'none', color: '#c0392b', fontWeight: 'bold' }}
          >
            Manager Area
          </Link>
          <Link
            to="/employee"
            style={{ textDecoration: 'none', color: '#27ae60', fontWeight: 'bold' }}
          >
            Employee Area
          </Link>
        </nav>

        <div
          style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            minHeight: '300px',
          }}
        >
          <Routes>
            <Route path="/" element={<Login />} />
            {/* Sử dụng component Register thật ở đây */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
