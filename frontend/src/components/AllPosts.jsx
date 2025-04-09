import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DisplayPost from './DisplayPost';

export default function AllPosts() {
  const { state } = useAuth();
  const [posts, setPosts] = useState([]);
  const userid = state.user?.id;

  const fetchFollowersPost = useCallback(async () => {
    // useCallback은 함수를 기억해서 불필요하게 새로 만들어지지 않도록 해주는 리액트 훅
    // 리액트는 컴포넌트가 리렌더링되면 그 안에 있는 함수들도 새로 만들어진다고 생각함. 그래서 렌더링 될 때마다 완전 새로운 함수들이 만들어지는데
    // 근데 그 함수가 props로 자식에게 전달되거나 얽혀있을 때 이 "새로 만들어진 함수" 때문에 불필요한 실행이나 렌더링이 생길 수 있음
    // 그래서 해당 함수를 useCallback으로 한번 감싸주게 되면 리렌더링이 되더라고 그 함수는 계속 동일한 참조값을 유지할 수 있음
    // 자식 컴포넌트에 함수 넘길 때(자식이 리렌더링 안되도록 하기 위해), useEffect의 의존성에 함수가 들어갈 때(무한 호출을 방지하기 위해), 함수가 자주 렌더링될 때 퍼포먼스 최적화를 위해(불필요한 함수 재생성 방지) 사용할 수 있음

    // useMemo와 useCallback의 차이점
    // useMemo는 값을 기억하고 useCallback은 함수를 기억함
    // useMemo는 계산 비용이 큰 연산을 최적화하고 싶을 때 사용하고 useCallback은 자식 컴포넌트에 함수를 props로 넘길 때 무한 렌더링 방지 등을 위함
    // useMemo의 결과는 어떤 값(숫자, 배열, 객체 등)을 나타내고 useCallback의 결과 타입은 함수 형태이다 그리고 둘 다 의존성 배열에 사용할 수 있음
    // useMemo는 값 계산이 무거워서 "이건 굳이 매번 다시 계산할 필요가 없겠는데?" 싶을 때 쓰면 좋음!
    try {
      const res = await fetch(`http://localhost:5000/api/users/followers/posts/${userid}`);
      const data = await res.json();
      console.log('팔로워들 게시물 조회', data.postResults);
      setPosts(data.postResults);
    } catch (error) {
      console.error('서버 에러', error);
    }
  }, [userid]);

  useEffect(() => {
    fetchFollowersPost();
  }, [fetchFollowersPost])


  return (
    <div>
      {posts && posts.map((post) => {
        return (
          <div key={post.id}>
            <DisplayPost post={post} fetchFollowersPost={fetchFollowersPost} />
          </div>
        )
      })}
    </div>
  );
}

