import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import UserAllPosts from './UserAllPosts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";
import PostFollowing from './PostFollowing';



export default function UserProfile({ user, isMe }) {
  const { state } = useAuth();
  // 이때 state는 로그인한 사용자, props로 전달받은 정보는 다른 사용자에 대한 정보, 팔로우 정보 표시할 때 사용
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);  // 팔로잉 여부
  const [activeSection, setActiveSection] = useState('posts');  // 컴포넌트 섹션 상태
  const [allposts, setAllposts] = useState([]);  // 사용자가 작성한 모든 게시물 보여줄 때 넘겨주는 정보를 allposts에 저장
  const [multiple, setMultiple] = useState(false);  // 해당 게시물에 게시된 이미지가 한 장인지 여러장인지 구분하는 상태
  const [bookmarkedpost, setBookmarkedPost] = useState([]);  // 사용자가 북마크한 게시물들 보여줄 때 넘겨주는 정보를 bookmarkedpost에 저장
  const profileImageUrl = user?.profile_image === 'default_profile.png'
  ? `/images/default_profile.png`
    : `http://localhost:5000/images/${user?.profile_image}`;
  
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/follow/status?follower_id=${state.user.id}&following_id=${user?.id}`
        );  
        const data = await res.json();
        console.log('팔로우 정보', data);
        setIsFollowing(data.isFollowing);
      } catch (err) {
        console.error('팔로우 상태 확인 실패', err);
      }
    };

    if (user?.id) {
      checkFollowStatus();
    }
  }, [user?.id, state.user.id]);


  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${state.user?.id}`);
        const data = await res.json();
        console.log('게시물222', data);
        // 사용자가 작성한 게시물들 가져올 때 해당 게시물에 첨부된 이미지가 한장인지 여러장인지 판단
        const hasMultipleImages = data.postResults.some(post => post.images?.length > 1);
        setMultiple(hasMultipleImages);

        // 사용자가 작성한 게시물들 가져와서 단순화한 다음 allpost에 저장
        const simplified = data.postResults.map(post => ({
          firstimage: post.images?.[0],
          postid: post.id
        }));
        setAllposts(simplified);
        console.log(`${state.user?.id}가 작성한 게시물들 조회하기`, simplified);

        // 사용자가 북마크한 게시물들 가져와서 단순화한 다음 bookmarkedpost에 저장
        const bookmarksimplified = data.bookmarkedPosts.map(post => ({
          firstimage: post.images?.[0],
          postid: post.id
        }))
        setBookmarkedPost(bookmarksimplified);
        console.log('사용자가 북마크한 게시물 단순화 결과', bookmarksimplified);
      } catch (err) {
        console.error('게시물 조회 중 오류 발생', err);
      }
    };

    fetchUserPosts();
  }, [state.user?.id, state.user?.userid]);
  

  const toggleFollow = async () => {
    const response = await fetch('http://localhost:5000/api/follow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        follower_id: state.user.id,
        following_id: user?.id
      })
    });
    const data = await response.json();
    setIsFollowing(data.following);
  }

  return (
    <div>
      <div className='flex flex-col items-center'>
        <div className='flex items-center w-[500px] '>
          <div className='pr-[40px]'>
            <img src={profileImageUrl} alt="프로필 이미지" className='w-[100px] h-[100px] object-cover rounded-full' />
          </div>
          <div>
            <PostFollowing />
          </div>
        </div>
      </div>
      <div className='w-[500px] mx-auto'>
        <p className='text-left font-medium mt-4'>@{user?.userid}</p>
        <p className='mt-1 mb-3 text-xs'>{ user?.bio }</p>
        <p>{ isFollowing}</p>
        <div className='flex gap-2'>
          {isMe ? (
            <>
              <Button text="프로필 편집" width="w-[250px]" onClick={() => {navigate('/settings')}}/>
              <Button text="프로필 공유" width="w-[250px]" />
            </>
          ): (
              <>
                <Button text={
                  isFollowing ? (
                    <> 팔로잉 중 <i className="fa-solid fa-chevron-down ml-1"></i></>
                  ) : (
                    '팔로우'
                  )
                } width="w-[250px]" onClick={toggleFollow}/>
                <Button text="메시지" width="w-[250px]" />
              </>
          )}
        </div>
      </div>
      <div className='flex w-[500px] mx-auto my-4 p-2'>
        <button className='basis-1/2' onClick={() => setActiveSection('posts')}>
          <span className={`inline-block px-3 ${activeSection === 'posts' ? 'border-b-2 border-black' : 'border-b-2 border-transparent'}`}>
            <i className="fa-solid fa-camera-retro text-xl"></i>
          </span>
        </button>
        <button className='basis-1/2' onClick={() => setActiveSection('bookmarks')}>
          <span className={`inline-block px-3 ${activeSection === 'bookmarks' ? 'border-b-2 border-black' : 'border-b-2 border-transparent'}`}>
            <i className="fa-regular fa-bookmark text-xl"></i>
          </span>
        </button>
        <button className='basis-1/2' onClick={() => setActiveSection('userinfo')}>
          <span className={`inline-block px-3 ${activeSection === 'userinfo' ? 'border-b-2 border-black' : 'border-b-2 border-transparent'}`}>
            <i className="fa-regular fa-user text-xl"></i>
          </span>
        </button>
      </div>
      <div className='w-[500px] mx-auto mt-5'>
        {activeSection === 'posts' && (
          <UserAllPosts user_id={user?.id} userid={user?.userid} post={allposts} multiple={multiple}/>
        )}
        {activeSection === 'bookmarks' && (
          <UserAllPosts user_id={user?.id} userid={user?.userid} post={bookmarkedpost} multiple={multiple}/>
        )}
        {activeSection === 'userinfo' && (
          <p>사용자 정보 컴포넌트</p>
        )}
      </div>
    </div>
  );
}

