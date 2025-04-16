export function Imageformat(inputimage) {
  const userprofileimage = (inputimage === 'default_profile.png' || inputimage === null) ? `/images/default_profile.png`
    : `http://localhost:5000/images/${inputimage}`;
  
  return userprofileimage
}
