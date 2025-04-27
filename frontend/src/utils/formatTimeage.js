export function formatTimeAgo(timestamp) {
  if (!timestamp) return '전송됨'; 

  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전 읽음';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전 읽음`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전 읽음`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전 읽음`;
  }
}
