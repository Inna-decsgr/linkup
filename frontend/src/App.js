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



function App() {
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
