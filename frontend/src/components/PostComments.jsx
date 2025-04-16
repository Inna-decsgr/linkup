import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/Dateformat';
import { Imageformat } from '../utils/Imageformat';


export default function PostComments({ post, fetchFollowersPost }) {
  const { state } = useAuth();
  const [comment, setComment] = useState('');  // 새로 작성하는 댓글
  const [allcomments, setAllComments] = useState([]);  // 모든 댓글
  const [editCommentId, setEditCommentId] = useState(null);  // 편집할 댓글 아이디
  const [editContent, setEditContent] = useState({});  // 수정된 댓글 내용

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

  const editComment = async (commentid) => {
    console.log('수정된 내용', editContent);

    const res = await fetch(`http://localhost:5000/api/posts/comments/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commentid,
        content: editContent[commentid],
      }),
    });

    const data = await res.json();
    console.log('댓글 변경 완료', data);

    setEditCommentId(null);
    fetchAllComments();
    fetchFollowersPost();
  }

  const handleChange = (e, commentid) => {
    const newValue = e.target.value
    setEditContent((prev) => {
      console.log('이전 값', prev);
      return {
        ...prev,
        [commentid]: newValue
      }
    })
    console.log(newValue);
  }

  const handleRemove = async (commentid) => {
    console.log('삭제하려는 댓글 아이디', commentid);
    const res = await fetch(`http://localhost:5000/api/posts/comments/delete/${commentid}`, {
      method: 'DELETE'
    })
    const data = await res.json();
    console.log('댓글 삭제 완료', data);
    fetchAllComments();
    fetchFollowersPost();
  }

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
                <img src={Imageformat(comment.profile_image)} alt="사용자 프로필 이미지" className='w-[35px] h-[35px] object-cover rounded-full' />
                <div className='text-sm pl-2'>
                  <div className='flex items-center'>
                    <p>{comment.userid}</p>
                    <p className='text-xs pl-1 text-gray-500'>{formatDate(comment.created_at)}</p>
                  </div>
                  {editCommentId === comment.id ? (
                    // 수정하려는 댓글 아이디랑 해당 댓글 아이디가 같다면 편집창 보여주기
                    <div>
                      <input
                        type="text"
                        value={editContent[comment.id] ?? comment.content}
                        className='border text-sm py-1 px-2'
                        onChange={(e) => handleChange(e, comment.id)}
                      />
                    </div>
                  ): (
                    <p>{comment.content}</p>
                  )}
                </div>
              </div>
              {state.user?.id === comment.user_id && (
                <div>
                  <button
                    className='border border-black py-1 px-2 text-xs'
                    onClick={() => {
                      if (editCommentId === comment.id) {
                        // 수정하려는 댓글 아이디랑 해당 댓글의 아이디가 같다면 (=완료 버튼 클릭하면 댓글 수정하고 저장하는 로직 실행)
                        editComment(comment.id)
                      } else {
                        // 수정 버튼 누르면 수정하려는 댓글 아이디를 해당 댓글 아이디로 설정(같으니까 편집창 보여주게 됨)
                        setEditCommentId(comment.id)
                      }
                    }}
                  >
                    {editCommentId === comment.id ? '완료' : '수정'}
                  </button>
                  <button onClick={() => handleRemove(comment.id)} className='border border-black py-1 px-2 text-xs ml-2'>삭제</button>
                </div>
              )}
            </div>
          )
        })}
        <form onSubmit={handleSubmit} className='flex'>
          <div>
            <img src={Imageformat(state.user?.profile_image)} alt="사용자 프로필 이미지" className='w-[40px] h-[40px] object-cover rounded-full'/>
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

