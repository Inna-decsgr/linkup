export function formatDate(inputDate) {
  const now = new Date();
  const date = new Date(inputDate);
  const diff = now - date; // milliseconds

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) {
    return `방금`;
  } else if (minutes < 60) {
    return `${minutes}분`
  } else if (hours < 24) {
    return `${hours}시간`;
  } else if (days === 1) {
    return '어제';
  } else if (days < 7) {
    return `${days}일`;
  } else {
    return `${weeks}주`;
  }
}
