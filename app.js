// ############
// local storage I/O
// ############

var fakeNotes = [{
    id: Date.now(),
    lastUpdated: 0,
    body: "gfdfgfdgfdgdfgdfgfdgdfgdfgfd",
    starred: false,
}, {
    id: Date.now(),
    lastUpdated: 0,
    body: "gfdfgfdgfdgdfgdfgfdgdfgdfgfd",
    starred: false,
}, {
    id: Date.now(),
    lastUpdated: 0,
    body: "gfdfgfdgfdgdfgdfgfdgdfgdfgfd",
    starred: false,
}, {
    id: Date.now(),
    lastUpdated: 0,
    body: "gfdfgfdgfdgdfgdfgfdgdfgdfgfd",
    starred: true,
}, {
    id: Date.now(),
    lastUpdated: 0,
    body: "gfdfgfdgfdgdfgdfgfdgdfgdfgfd",
    starred: true,
}]

// check for notes array and create it if not found
const checkForNotesArray = () => {

    if (localStorage.getItem('notes')) {
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

// set currently viewed note ID
const setCurrentNote = noteId => localStorage.setItem('currentNote', noteId);

// get currently viewed note ID
const getCurrentNote = () => Number(localStorage.getItem('currentNote'));

// create note
const createNote = (body = '', starred = false) => {

    notesArray = getNotesArray();

    let note = {
        id: Date.now(), // this doubles as the created date
        lastUpdated: 0,
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

    let noteIndex = notesArray.map(function (note) { return note.id }).indexOf(noteId);

    if (noteIndex === -1) {
        console.log('note NOT found...');
        return false;
    } else {
        return noteIndex;
    }
}

// read note 
const readNote = noteId => {

    noteIndex = getNoteIndex(noteId);

    if (noteIndex === false) {

    } else {
        return notesArray[noteIndex];
    }
}

// update note body
const updateNoteBody = (noteId, body) => {

    noteIndex = getNoteIndex(noteId);

    if (noteIndex === false) {

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

    if (noteIndex === false) {

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

    if (noteIndex === false) {

    } else {
        notesArray.splice(noteIndex, 1);
        writeToNotesArray(notesArray);
    }
}

// ############
// Event handlers
// ############

// save note
const saveNote = () => {

    let noteId = getCurrentNote();

    if (noteId) {
        let noteBody = tinyMCE.activeEditor.getContent();

        updateNoteBody(noteId, noteBody);
    }
}

// render note
const renderNote = noteId => {

    let note = readNote(noteId);

    if (note) {
        tinyMCE.activeEditor.setContent(note.body);

        // TODO - render starred status in toolbar 

        // update ID in local storage for currently viewed noted
        setCurrentNote(note.id);
    }
}

// ############
// Event listeners
// ############

const noteBody = document.querySelector('#note-body');

// save note on input
noteBody.addEventListener('input', () => saveNote());

// save note before unload
window.addEventListener('beforeunload', () => saveNote());


const navbarIcons = document.querySelector('#navbar-icons');

navbarIcons.addEventListener('click', (e) => {

    let pressedElement = e.target.id;

    if (pressedElement === 'new-note') {

        // before creating a new note... we save the existing
        saveNote();

        // then we create the new note (which returns its id)
        let newNoteId = createNote('<h1>set a title?</h1><p>starting typing... 🖋️</p>');

        // followed by rendering the new note
        renderNote(newNoteId);

        // Select the first h1
        tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);
    }

    if (pressedElement === 'browse-notes') {
        // do browse notes things
    }

    if (pressedElement === 'statistics') {
        // do statistics things
    }

    if (pressedElement === 'settings') {
        // do settings things
    }
});

const printNotes = () => {
    //let notes = getNotesArray()
    //TODO Erik
    let notes = fakeNotes
    let list = document.getElementsByClassName("menu")[0]
    list.innerHTML = ""
    notes.forEach(function (element) {
        note = element.body.substring(0, 24) + "...";
        date = new Date(element.id).toISOString().slice(0, 10)
        list.innerHTML += `<p>${date}: ${note}</p>`
    })
}