// ############
// TinyMCE
// ############

tinymce.init({
    selector: '#note-body',
    toolbar: 'bold italic strikethrough underline h2 h3 | bullist numlist blockquote image link | print',
    fixed_toolbar_container: '#note-toolbar',
    toolbar_drawer: 'sliding',
    menubar: false,
    branding: false,
    inline: true,
    skin: 'oxide-dark',
    plugins: 'lists image link print',
});

// ############
// local storage I/O
// ############

var fakeNotes = [{
    id: 1573103194910,
    lastUpdated: 0,
    body: '<p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus, vero consequatur nihil in quas voluptas inventore fugit nostrum impedit veniam hic dolore, architecto quos, exercitationem dolorem minima laudantium explicabo illo?</p>',
    starred: false,
}, {
    id: 1572199011597,
    lastUpdated: 0,
    body: '<h1>Rubrik rubrik</h1> <p>Första stycket in quas voluptas inventore fugit nostrum impedit veniam hic dolore, architecto quos, exercitationem dolorem minima laudantium explicabo illo?</p><h1>Repellendus, vero consequatur nihil</h1>',
    starred: false,
}, {
    id: 1572000011597,
    lastUpdated: 0,
    body: '<h1>Duis aute irure dolor in reprehenderit</h1> <p>In voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>',
    starred: false,
}, {
    id: 1572106271597,
    lastUpdated: 1572106271598,
    body: '<h1>Repellendus, vero consequatur</h1> <p>Nihil in quas voluptas inventore fugit nostrum impedit veniam hic dolore, architecto quos, exercitationem dolorem minima laudantium explicabo illo?</p>',
    starred: true,
}, {
    id: 1571101251597,
    lastUpdated: 0,
    body: '<h1>Lorem ipsum dolor sit amet</h1><p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>',
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

    let noteIndex = notesArray.findIndex(note => note.id === noteId);

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

// save note before unload (unessecary since we save on input)
// window.addEventListener('beforeunload', () => saveNote());


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

        // and last we select the generated h1
        tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);
    }

    if (pressedElement === 'browse-notes') {
        listNotes();
    }

    if (pressedElement === 'statistics') {
        // do statistics things
    }

    if (pressedElement === 'settings') {
        // do settings things
    }
});

const listNotes = () => {
    //let notes = getNotesArray()
    //TODO eventlistener Erik 
    let notes = fakeNotes.sort();
    let list = document.querySelector(".notes-list");
    list.innerHTML = "";

    //split string every every nth (splitLength) space to array 
    const splitMyString = (str, splitLength) => {
        var a = str.split(' '), b = [];
        while (a.length) b.push(a.splice(0, splitLength).join(' '));
        return b;
    }

    //sorts note by date (id)
    notes.sort((a, b) => Number(b.id) - Number(a.id));

    notes.forEach(note => {
        let noteBody = note.body;

        // parse body into text (based on html tags)
        let noteObject = new tinymce.html.DomParser().parse(noteBody)
        let noteHeading = noteObject.firstChild.firstChild.value
        let notePreview

        // get note heading and preview (body)
        if (noteObject.firstChild.next) {
            notePreview = noteObject.firstChild.next.firstChild.value
        } else {
            let splitHeading = splitMyString(noteHeading, 3)
            noteHeading = splitHeading[0];
            notePreview = splitHeading[1] + splitHeading[2];
        }

        // get date
        let noteDate;

        if (!note.lastUpdated) {
            noteDate = new Date(note.id).toISOString().slice(0, 10);
        } else {
            noteDate = new Date(note.lastUpdated).toISOString().slice(0, 10);
        }

        // print HTML
        list.innerHTML +=
            `<li class="note-list-item" data-id:"${note.id}">
                <span class="note-list-date">&nbsp;${noteDate}&nbsp;</span>
                <h3 class="note-list-heading">${noteHeading}</h3>
                <span class="note-list-preview">${notePreview}</span>
            </li>`;
    })
}