import React from 'react';

export default function Button({text, width, onClick}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`border border-gray-300 font-bold text-xs py-2 rounded-md ${width}`}
    >
      {text}
    </button>
  );
}

