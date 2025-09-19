import React from 'react';
import NoteAppHeader from './NoteAppHeader';
import NoteInput from './NoteInput';
import NoteList from './NoteList';
import { getInitialData } from '../utils/index';

class NoteApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: getInitialData(),
      search: '',
    };

    this.onDeleteHandler = this.onDeleteHandler.bind(this);
    this.onAddNoteHandler = this.onAddNoteHandler.bind(this);
    this.onArchiveHandler = this.onArchiveHandler.bind(this);
    this.onSearchHandler = this.onSearchHandler.bind(this);
  }

  onDeleteHandler(id) {
    const notes = this.state.notes.filter(note => note.id !== id);
    this.setState({ notes });
  }

  onAddNoteHandler({ title, body }) {
    this.setState((prevState) => {
      return {
        notes: [
          ...prevState.notes,
          {
            id: +new Date(),
            title,
            body,
            archived: false,
            createdAt: new Date().toISOString(),
          }
        ]
      }
    });
  }

  onArchiveHandler(id) {
    const notes = this.state.notes.map(note => {
      if (note.id === id) {
        return { ...note, archived: !note.archived };
      }
      return note;
    });
    this.setState({ notes });
  }

  onSearchHandler(keyword) {
    this.setState({ search: keyword.toLowerCase() });
  }

  render() {
    const activeNotes = this.state.notes.filter(note => 
      !note.archived && note.title.toLowerCase().includes(this.state.search)
    );
    const archivedNotes = this.state.notes.filter(note => 
      note.archived && note.title.toLowerCase().includes(this.state.search)
    );

    return (
      <div className="note-app">
        <NoteAppHeader onSearch={this.onSearchHandler} />
        <div className="note-app__body">
          <NoteInput addNote={this.onAddNoteHandler} />
          <h2>Catatan Aktif</h2>
          <NoteList notes={activeNotes} onDelete={this.onDeleteHandler} onArchive={this.onArchiveHandler} />
          <h2>Arsip</h2>
          <NoteList notes={archivedNotes} onDelete={this.onDeleteHandler} onArchive={this.onArchiveHandler} />
        </div>
      </div>
    );
  }
}

export default NoteApp;