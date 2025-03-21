import React, { useState } from 'react';

export default function Signup() {
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
        alert('회원가입 성공!');
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
      <p>회원가입</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>사용자 이름</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <label>아이디</label>
          <input
            type="text"
            name="userid"
            value={formData.userid}
            onChange={handleChange}
            required
          />
          <label>이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label>비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <label>전화번호</label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            required
          />
        </div>
        <button type='submit'>회원가입</button>
      </form>
    </div>
  );
}

