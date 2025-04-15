import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { formatDate } from '../utils/Dateformat';
import PostLike from '../components/PostLike';
import PostComments from './PostComments';
import PostBookmark from './PostBookmark';


export default function DisplayPost({ post, fetchFollowersPost }) {
  const navigate = useNavigate();
  const [showsetting, setShowSetting] = useState(false);
  const [showcomments, setShowComments] = useState(false);
  const [postdelete, setPostDelete] = useState(false);
  const [showlikecount, setShowLikeCount] = useState(() => {
    const status = localStorage.getItem('showlikecount');
    return status === 'true';  // 문자열로 저장되기 때문에 비교 필수!
  });
  const settingRef = useRef(null);
  const commentRef = useRef(null);
  const userprofileimage = (post.profile_image === 'default_profile.png' || post.profile_image === null) ? `/images/default_profile.png`
    : `http://localhost:5000/images/${post.profile_image}`;
  
  const handleRemove = async (postid) => {
    console.log('삭제할 포스트 아이디', postid);
    const res = await fetch(`http://localhost:5000/api/posts/delete/${post.id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    console.log('포스트 삭제', data);
    fetchFollowersPost();
  }

  const paginationRef = useRef(null);  // bullet이 붙을 DOM 위치를 가리킴
  const swiperRef = useRef(null);   // Swiper 인스턴스를 위한 별도 ref

  const handleShowLikeCount = () => {
    setShowLikeCount((prev) => {
      localStorage.setItem('showlikecount', !prev);
      return !prev;
    });
  }

  useEffect(() => {
    // useEffect로 DOM이 준비된 뒤에 bullet 직접 수동으로 붙이기
    if (
      paginationRef.current &&
      swiperRef.current &&
      swiperRef.current.params.pagination &&
      typeof swiperRef.current.params.pagination !== 'boolean'
    ) {
      swiperRef.current.params.pagination.el = paginationRef.current;
      swiperRef.current.pagination.init();  // bullet 초기화
      swiperRef.current.pagination.render();  // bullet DOM 생성
      swiperRef.current.pagination.update(); // bullet 위치 및 상태 업데이트
      swiperRef.current.update();  // 전체 swiper 다시 렌더링(중)
    }
  }, [post.images]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      setTimeout(() => {
        if (settingRef.current && !settingRef.current.contains(e.target)) {
          setShowSetting(false);  // 바깥 영역 클릭 시 닫기
        }
        if (commentRef.current && !commentRef.current.contains(e.target)) {
          if (showcomments) {
            setShowComments(false);
          }
        }
      }, 0)
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showcomments]);
  // showcomments는 리액트의 상태값(state)이고, 지금 useEffect 안에서는 최초 렌더링 당시의 showcomments 값만 바라보고 있기 때문에 이 이후에 값이 바뀌어도 무시되면서 관련 기능들이 동작하지 않을 수 있음. 리액트가 항상 초기값(false)만 기억하고 있어서 나중에 true로 바뀌어도 useEffect안의 showcomments는 반응을 하지 못해서 닫히는 기능이 동작을 안함
  // showcomments를 의존성 배열에 추가해주면 showcomments 상태 값이 바뀔 때마다 useEffect를 다시 실행하게 되고 최신 상태값을 기준으로 외부 클릭 감지를 해주기 때문에 잘 동작할 것


  return (
    <div>
      <div key={post.id}>
        <div className='flex justify-between items-center relative'>
          <div className='flex items-center cursor-pointer' onClick={() => navigate(`/profile/${post.userid}/${post.user_id}/${post.username}`)}>
            <img src={userprofileimage} alt="사용자 프로필 이미지" className='w-[50px] h-[50px] object-cover rounded-full' />
            <p>{post.userid}</p>
            <p className='pl-4'>{formatDate(post.created_at)}</p>
          </div>
          <div className='relative' ref={settingRef}>
            <button onClick={() => {setShowSetting(true)}}>
              <i className="fa-solid fa-gear"></i>
            </button>
          </div>
          {showsetting && (
            <div className='absolute top-[50px] right-[-20px] bg-red-100 z-10 p-4 text-center text-sm'>
              <div>
                <button onClick={handleShowLikeCount}>
                  <i className="fa-solid fa-heart-crack"></i>
                  <span>{showlikecount ? '좋아요 수 숨기기' : '좋아요 수 보이기'}</span>
                </button>
              </div>
              <div>
                <button>
                  <i className="fa-solid fa-ban"></i>
                  <span>공유 횟수 숨기기</span>
                </button>
              </div>
              <div>
                <button onClick={() => navigate('/post/details/edit', {state: {post}})}>
                  <i className="fa-solid fa-pen"></i>
                  <span>수정</span>
                </button>
              </div>
              <div>
                <button onClick={() => setPostDelete(true)}>
                  <i className="fa-solid fa-trash"></i>
                  <span>삭제</span>
                </button>
              </div>
            </div>
          )}
          </div>
        <div>
          <Swiper
            slidesPerView={1}
            modules={[Pagination]}
            pagination={{
              clickable: true,
              el: null,  // 초기에는 DOM이 없는 시점에서 swiper를 실행하니까 pagination.el = paginationRef.current 하면 오류가 남. 그래서 먼저 null로 두고 나중에 수동 연결해주기
              type: 'bullets',
            }}
            onSwiper={(swiper) => { // swiper가 처음 실행될 때 내부 기능 전체를 이 ref에 담아두기
              swiperRef.current = swiper
            }}
          >
          {post.images.map((img, index) => (
            <SwiperSlide key={index}>
              <img src={`http://localhost:5000/images/${img}`} alt={`게시한 이미지 ${index}`} />
            </SwiperSlide>
          ))}
          <div ref={paginationRef} style={{ textAlign: 'center' }} />
          </Swiper>
        </div>
        <div className='flex justify-between'>
          <div className='flex'>
            <div>
              {showlikecount}
              <PostLike postid={post.id} showlikecount={showlikecount} />
            </div>
            <div>
              <button onClick={(e) => { e.stopPropagation();  setShowComments(prev => !prev) }}>
                <i className="fa-regular fa-comment"></i>
              </button>
              <span>{post.commentCount}</span>
            </div>
            {showcomments && (
              <div ref={commentRef}>
                <PostComments post={post} fetchFollowersPost={fetchFollowersPost} />
              </div>
            )}
          </div>
          <div>
            <PostBookmark post={post} />
          </div>
        </div>
        {post.likedByFollowers && (
          <div className='flex items-center'>
            <img src={post.firstLikedUser.profile_image === 'default_profile.png' ? `/images/default_profile.png` : `http://localhost:5000/images/${post.firstLikedUser.profile_image}`} alt="사용자 프로필 이미지" className='w-[20px] h-[20px] object-cover rounded-full' />
            <p className='text-sm pl-1'>{post.firstLikedUser.userid}님 외 여러명이 좋아합니다</p>
          </div>
        )}
        <div className='flex'>
          <p>{post.userid}</p>
          <p>{post.content}</p>
        </div>
        <div>
          {post.firstComment && (
            <div className='flex items-center'>
              <p className='font-semibold'>{post.firstComment.userid}</p>
              <p className='text-sm pl-1'>{post.firstComment.content}</p>
            </div>
          )}
        </div>
        <div>
          {post.tagged_users.map(((u, index) => (
            <button key={index} onClick={() => navigate(`/profile/${u.userid}`)}>@{u.userid}</button>
          )))}
        </div>
        {postdelete && (
          <div className='bg-red-100 p-2 text-xs w-[300px]'>
            <p>게시물을 삭제하시겠어요?</p>
            <p>계정 설정에서 30일 이내에 이 게시물을 복원할 수 있습니다. 이후에는 게시물이 영구적으로 삭제되며, 이 게시물
              의 전체 또는 일부가 사용된 릴스, 게시물 및 스토리도 모두 삭제됩니다. 게시물을 복원하면 해당 콘텐츠도 복원됩니다.
            </p>
            <button onClick={() => handleRemove(post.id)}>삭제</button>
            <button onClick={() => setPostDelete(false)}>취소</button>
          </div>
        )}
      </div>
    </div>
  );
}

