import React, { useEffect, useState } from 'react';
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
  const fetchAllComments = async () => {
    const res = await fetch(`http://localhost:5000/api/posts/comments/${post.id}`)
    const data = await res.json();
    console.log('모든 댓글 조회', data);
    setAllComments(data.comments);
  }

  useEffect(() => {
    fetchAllComments();
  }, [])

  return (
    <div>
      <div className='w-[400px] bg-red-100'>
        <p className='text-center pt-3'>댓글</p>
        {allcomments && allcomments.map((comment) => {
          return (
            <div key={comment.id} className='flex items-center py-3'>
              <img src={comment.profile_image === 'default_profile.png' ? `/images/default_profile.png`: `http://localhost:5000/images/${comment.profile_image}`} alt="사용자 프로필 이미지" className='w-[35px] h-[35px] object-cover rounded-full' />
              <div className='text-sm pl-2'>
                <div className='flex items-center'>
                  <p>{comment.userid}</p>
                  <p className='text-xs pl-1 text-gray-500'>{formatDate(comment.created_at)}</p>
                </div>
                <p>{comment.content}</p>
              </div>
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

