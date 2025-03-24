import React from 'react';
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';


export default function Navbar() {
  const { state } = useAuth();
  const profileImageUrl = state.user.profile_image === 'default_profile.png'
  ? `/images/default_profile.png`
  : `http://localhost:5000/images/${state.user.profile_image}`;

  return (
    <nav className="w-full bg-red-100 p-4 mt-auto flex justify-center">
      <div className='max-w-screen-xl w-full flex justify-around items-center'>
        <Link to="/" className="mr-4"><i className="fa-solid fa-house"></i></Link>
        <button><i className="fa-solid fa-magnifying-glass"></i></button>
        <button><i className="fa-solid fa-square-plus"></i></button>
        <button><i className="fa-solid fa-video"></i></button>
        <Link to="/profile">
          <img src={profileImageUrl} alt="프로필 이미지" className='w-[40px] h-[40px] object-cover rounded-full'/>
        </Link>
        <p></p>
      </div>
    </nav>
  );
}

