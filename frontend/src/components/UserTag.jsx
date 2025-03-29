import React from 'react';
import UserSearch from './UserSearch';

export default function UserTag({ cancel, onSelectedUser }) {

  return (
    <div>
      태그할 사용자 찾을 컴포넌트
      <div>
        <UserSearch cancel={cancel} istag={true} onSelectUser={onSelectedUser} />
      </div>
    </div>
  );
}

