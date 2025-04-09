import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/Dateformat';


export default function PostComments({ post }) {
  const { state } = useAuth();
  const [comment, setComment] = useState('');
  const [allcomments, setAllComments] = useState([]);
  const userprofileimage = state.user?.profile_image === 'default_profile.png' ? `/images/default_profile.png`
    : `http://localhost:5000/images/${state.user?.profile_image}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('포스트 아이디', post.id);
    console.log('댓글 작성하는 사람 아이디', state.user?.id);
    console.log('댓글 내용', comment);
    const res = await fetch('http://localhost:5000/api/posts/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postid: post.id,
        userid: state.user?.id,
        comment: comment
      }),
    })
    const data = await res.json();
    console.log('댓글 정보', data);
    fetchAllComments();
    setComment('');
  }
  const handleComment = (e) => {
    setComment(e.target.value);
  }
  const fetchAllComments = useCallback(async () => {
    const res = await fetch(`http://localhost:5000/api/posts/comments/${post.id}`)
    const data = await res.json();
    console.log('모든 댓글 조회', data);
    setAllComments(data.comments);
  }, [post.id])  // useCallback은 함수가 의존하는 값(post.id)이 바뀌면 그에 따라 함수도 새로 생성되도록 해주기 때문에 의존성 배열 꼭 추가해주기

  useEffect(() => {
    fetchAllComments();
  }, [fetchAllComments])  // fetchAllComments 함수가 컴포넌트 내부에 정의되어 있기 때문에 리액트는 이 함수가 재생성될 수 있다고 봄. 그래서 의존성 배열에 넣어야함. 하지만 거의 대부분 이 함수가 매번 바뀌지는 않기 때문 무조건 의존성에 넣을 필요는 없지만 경고가 발생할 수는 있음.

  return (
    <div>
      <div className='w-[400px] bg-red-100'>
        <p className='text-center pt-3'>댓글</p>
        {allcomments && allcomments.map((comment) => {
          return (
            <div key={comment.id} className='flex justify-between items-center'>
              <div className='flex items-center py-3'>
                <img src={comment.profile_image === 'default_profile.png' ? `/images/default_profile.png`: `http://localhost:5000/images/${comment.profile_image}`} alt="사용자 프로필 이미지" className='w-[35px] h-[35px] object-cover rounded-full' />
                <div className='text-sm pl-2'>
                  <div className='flex items-center'>
                    <p>{comment.userid}</p>
                    <p className='text-xs pl-1 text-gray-500'>{formatDate(comment.created_at)}</p>
                  </div>
                  <p>{comment.content}</p>
                </div>
              </div>
              {state.user?.id === comment.user_id && (
                <div>
                  <button className='border border-black py-1 px-2 text-xs'>수정</button>
                </div>
              )}
            </div>
          )
        })}
        <form onSubmit={handleSubmit} className='flex'>
          <div>
            <img src={userprofileimage} alt="사용자 프로필 이미지" className='w-[40px] h-[40px] object-cover rounded-full'/>
          </div>
          <input
            type="text"
            name='comment'
            value={comment}
            placeholder={`${post.userid}님에게 댓글 추가...`}
            onChange={handleComment}
            className='border w-full text-sm pl-3'
          />
        </form>
      </div>
    </div>
  );
}

