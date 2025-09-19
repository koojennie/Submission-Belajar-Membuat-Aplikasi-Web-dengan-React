import React from 'react';
import NoteItem from './NoteItem';

function NoteList({ notes, onDelete, onArchive }) {
  if (notes.length === 0) {
    return (
      <div className="notes-list__empty">
        <img className="notes-list__empty-image" src="/tidak-ada-catatan.svg"/>
        <p className="notes-list__empty-message">Tidak ada catatan</p>
      </div>
    )
  }

  return (
    <div className="notes-list">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          id={note.id}
          title={note.title}
          date={note.createdAt}
          body={note.body}
          archived={note.archived}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}

export default NoteList;