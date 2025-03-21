import React from 'react';
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="w-full bg-red-100 p-4 mt-auto flex justify-center">
      <div className='max-w-screen-lg w-full flex justify-around'>
        <Link to="/" className="mr-4">home</Link>
        <button>돋보기(검색)</button>
        <button>새 게시글 작성</button>
        <button>영상 아이콘</button>
        <Link to="/profile">프로필</Link>
        <p></p>
      </div>
    </nav>
  );
}

