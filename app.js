// ############
// local storage I/O
// ############

// check for notes array and create it if not found
const checkForNotesArray = () => {

    if(localStorage.getItem('notes')) {
        console.log('yay! found notes array');
    } else {
        notesArray = [];
        localStorage.setItem('notes', JSON.stringify(notesArray));
        localStorage.getItem('notes') ? console.log('notes array created') : console.log('oh no.. something went wrong creating notes array...'); 
    }
}

// init notes array check on page load
checkForNotesArray();

// get notes array
const getNotesArray = () => JSON.parse(localStorage.getItem('notes'));

// write to notes array
const writeToNotesArray = (notesArray) => localStorage.setItem('notes', JSON.stringify(notesArray));

// create note
const createNote = (title = '', body = '', starred = false) => {

    notesArray = getNotesArray();

    let note = {
        id: Date.now(), // this doubles as the created date
        lastUpdated: 0,
        title,
        body,
        starred,
    }
    
    notesArray.push(note);

    writeToNotesArray(notesArray);

    return note.id;
}

// get array index of a note
const getNoteIndex = noteId => {

    notesArray = getNotesArray();

     let noteIndex = notesArray.map(function(note) {return note.id}).indexOf(noteId);

     if(noteIndex === -1) {
         console.log('note NOT found...');
         return false;
     } else {
         return noteIndex;
     }
}

// read note 
const readNote = noteId => {

    noteIndex = getNoteIndex(noteId);

    if(noteIndex === false) {

    } else {
        return notesArray[noteIndex];
    }
}

// update note title
const updateNoteTitle = (noteId, title) => {

    noteIndex = getNoteIndex(noteId);

    if(noteIndex === false) {

    } else {

        let note = notesArray[noteIndex];

        note.title = title;
        note.lastUpdated = Date.now();
    
        notesArray[noteIndex] = note;
    
        writeToNotesArray(notesArray);
    }
}

// update note body
const updateNoteBody = (noteId, body) => {

    noteIndex = getNoteIndex(noteId);

    if(noteIndex === false) {

    } else {

        let note = notesArray[noteIndex];

        note.body = body;
        note.lastUpdated = Date.now();
    
        notesArray[noteIndex] = note;
    
        writeToNotesArray(notesArray);
    }
}


// toggle starred status
const toggleStarredStatus = noteId => {
    
    noteIndex = getNoteIndex(noteId);

    if(noteIndex === false) {

    } else {

        let note = notesArray[noteIndex];

        note.starred = !note.starred;
        note.lastUpdated = Date.now();

        notesArray[noteIndex] = note;

        writeToNotesArray(notesArray);
    }
}

// delete note
const deleteNote = (noteId) => {

    noteIndex = getNoteIndex(noteId);

    if(noteIndex === false) {

    } else {
        notesArray.splice(noteIndex, 1);
        writeToNotesArray(notesArray);
    }
}

// ############
// 
// ############
