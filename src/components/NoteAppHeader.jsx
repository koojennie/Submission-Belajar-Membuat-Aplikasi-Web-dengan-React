import React from 'react';

function NoteAppHeader({ onSearch }) {
  function onSearchChangeEventHandler(event) {
    onSearch(event.target.value);
  }

  return (
    <div className="note-app__header">
      <h1>Notes</h1>
      <div className="note-search">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input type="search" placeholder="Cari catatan ..." onChange={onSearchChangeEventHandler} />
      </div>
    </div>
  );
}

export default NoteAppHeader;