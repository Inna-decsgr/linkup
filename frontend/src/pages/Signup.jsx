import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    userid: '',
    email: '',
    telephone: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        console.log('회원가입한 사람', data);
        alert('회원가입 성공!');
        navigate('/login')
      } else {
        alert(`회원가입 실패: ${data.message}`);
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('서버 오류! 다시 시도해주세요.')
    }
  }

  return (
    <div>
      <p className='font-bold'>회원가입</p>
      <form onSubmit={handleSubmit}>
        <div>
          <div>
            <label>사용자 이름</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className='border ml-2 rounded-sm'
              required
            />
          </div>
          <div>
            <label>아이디</label>
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
            <label>이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
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
          <div>
            <label>전화번호</label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className='border ml-2 rounded-sm'
              required
            />
          </div>
        </div>
        <button type='submit' className='border w-[500px] py-2 px-3 text-sm font-bold mt-7'>회원가입</button>
      </form>
    </div>
  );
}

