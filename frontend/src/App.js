import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Home from './pages/Home';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider } from './context/AuthContext';
import '@fortawesome/fontawesome-free/css/all.min.css';
import UserSetting from './pages/UserSetting';
import SearchPage from './pages/SearchPage';
import NewPost from './pages/NewPost';
import PostDetails from './pages/PostDetails';
import ProfilePage from './pages/ProfilePage';
import UserPosts from './pages/UserPosts';
import EditPost from './pages/EditPost';
import UserFollowing from './pages/UserFollowing';
import DirectMessage from './pages/DirectMessage';
import MessageList from './pages/MessageList';
import React, { useEffect } from 'react';
import socket from './socket.js'; 



function App() {
  useEffect(() => {
    // 앱이 시작할 때 1번만 socket을 진짜 연결(connect) 해주는 부분
    // 여기서 한번 연결해두면 그 뒤에 다른 컴포넌트들도 socket을 import해서 그대로 웹 소켓 연결을 사용할 수 있음
    console.log('🔥 App useEffect 실행됨');

    socket.connect();  // "나 연결한다~?"하고 서버에 연결하겠다는 연결 요청을 보냄

    socket.on('connect', () => {
      console.log('🟢 소켓 연결됨:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ 소켓 연결 에러:', err.message);
    });

    return () => {
      socket.disconnect();
      console.log('🔌 소켓 연결 해제');
    };
  }, []);
  
  return (
    <AuthProvider>
      <div className='min-h-screen flex flex-col items-center'>
        <Router>
          <Topbar />
          <div className='flex-1 w-full max-w-screen-xl p-8'>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile/:userid/:user_id/:username" element={<ProfilePage />} />
              <Route path="/profile/:userid/:user_id/posts" element={<UserPosts />} />
              <Route path="/settings" element={<UserSetting />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/newpost" element={<NewPost />} />
              <Route path="/newpost/details" element={<PostDetails />} />
              <Route path="/dm" element={<MessageList />} />
              <Route path="/dm/:userid/:partnerid" element={<DirectMessage />} />
              <Route path="/post/details/edit" element={<EditPost />} />
              <Route path="/:userid/:user_id/:username/:followerinfo" element={<UserFollowing />} />
            </Routes>
          </div>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
