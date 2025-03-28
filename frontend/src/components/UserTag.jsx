import React

  from 'react';
import UserSearch from './UserSearch';

export default function UserTag({ cancel }) {
  return (
    <div>
      태그할 사용자 찾을 컴포넌트
      <div>
        <UserSearch cancel={cancel} istag={true} />
      </div>
    </div>
  );
}

