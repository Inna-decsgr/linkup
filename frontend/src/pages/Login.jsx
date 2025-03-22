import { useAuth } from '../context/AuthContext';
import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";


export default function Login() {
  const { dispatch } = useAuth();
  const [formData, setFormData] = useState({
    userid: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      dispatch({ type: 'LOGIN', payload: data.user });  // context로 사용자 정보 전역 관리
      localStorage.setItem('user', JSON.stringify(data.user));  // 새로고침해도 저장되도록 로컬스토리지에도 저장
      alert('로그인 성공!');
      console.log('로그인한 사용자 정보', data);
      console.log('로컬스토리지에도 잘 저장되었는지 확인', localStorage.getItem('user'));
      navigate('/');
    } else {
      alert(data.message || '로그인 실패')
    }
  }

  return (
    <div>
      <p>로그인</p>
      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <label>사용자</label>
            <input
              type="text"
              name="userid"
              value={formData.userid}
              onChange={handleChange}
              className='border ml-2 rounded-sm'
              required
            />
          </div>
          <div>
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className='border ml-2 rounded-sm'
              required
            />
          </div>
          <button type='submit'>로그인</button>
        </form>
      </div>
      <div>
        <p>아직 계정이 없으신가요?</p>
        <Link to="/signup"><button>회원가입</button></Link>
      </div>
    </div>
  );
}

