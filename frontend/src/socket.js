import { io } from 'socket.io-client';

// 소켓 연결 인스턴스를 생성만 하는 곳
// 연결 준비 상태만 만들어두고 연결 자체는 아직 안함 (autoConnect: false 덕분에) 
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  autoConnect: false, // 원할 때 연결
});

export default socket;
