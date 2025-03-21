import React from 'react';



export default function Topbar() {
  return (
    <header className='w-full bg-red-100 p-4 flex justify-center'>
      <div className='max-w-screen-xl w-full flex justify-between'>
        <p>(비공개 계정일 경우 자물쇠 아이콘) 사용자 아이디</p>
        <div className='flex space-x-4'>
          <button>새 게시글 작성 아이콘</button>
          <button>설정 아이콘</button>
        </div>
    </div>
    </header>
  );
}

