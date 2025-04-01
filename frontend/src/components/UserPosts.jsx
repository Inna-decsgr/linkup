import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { formatDate } from '../utils/Dateformat';
import { useNavigate } from 'react-router-dom';


export default function UserPosts({ userid }) {
  const navigate = useNavigate();
  const [allposts, setAllposts] = useState([]);
  const userprofileimage = allposts ? allposts.map(p => p.profile_image === 'default_profile.png' ? `/images/default_profile.png`
    : `http://localhost:5000/images/${p.profile_image}`) : ''
  

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${userid}`);
        const data = await res.json();
        setAllposts(data);
        console.log(`${userid}가 작성한 게시물들 조회하기`, data);
      } catch (err) {
        console.error('게시물 조회 중 오류 발생', err);
      }
    };

    fetchUserPosts();
  }, [userid])


  return (
    <div>
      {allposts && allposts.length > 0 ? (
        <div>
          {allposts.map((post) => (
            <div key={post.id}>
              <div className='flex items-center'>
                <img src={userprofileimage} alt="사용자 프로필 이미지" className='w-[50px] h-[50px] object-cover rounded-full' />
                <p>{post.userid}</p>
                <p className='pl-4'>{formatDate(post.created_at)}</p>
              </div>
              <div>
                <Swiper
                  slidesPerView={1}
                  modules={[Pagination]}
                  pagination={{clickable: true, el: '.custom-pagination'}}
                >
                  {post.images.map((img, index) => (
                  <SwiperSlide key={index}>
                    <img src={`http://localhost:5000/images/${img}`} alt={`게시한 이미지 ${index}`} />
                  </SwiperSlide>
                ))}
                </Swiper>
                <div className="custom-pagination" style={{ textAlign: 'center' }}></div>
              </div>
              <div className='flex'>
                <div>
                  <button>
                    <i className="fa-regular fa-heart"></i>
                  </button>
                  <span>1,256</span>
                </div>
                <div>
                  <button>
                    <i className="fa-regular fa-comment"></i>
                  </button>
                  <span>38</span>
                </div>
              </div>
              <div>
                <p>님 외 여러명이 좋아합니다</p>
                <div className='flex'>
                  <p>{post.userid}</p>
                  <p>{post.content}</p>
                </div>
              </div>
              <div>
                <p>(팔로우 하는 사람중에 댓글 쓴 사람의 아이디와 댓글 내용)</p>
              </div>
              <div>
                {post.tagged_users.map(((u, index) => (
                  <button key={index} onClick={() => navigate(`/profile/${u.userid}`)}>@{u.userid}</button>
                )))}
              </div>
            </div>
            
          ))}
        </div>
      ) : (
          <div>

          </div>
      )}
    </div>
  );
}

