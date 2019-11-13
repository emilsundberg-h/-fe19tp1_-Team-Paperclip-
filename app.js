// ############
// TinyMCE
// ############

tinymce.init({
    selector: '#note-body',
    toolbar: 'bold italic strikethrough underline h2 h3 | bullist numlist blockquote image link print wordcount Template |',
    fixed_toolbar_container: '#note-toolbar',
    toolbar_drawer: 'sliding',
    menubar: false,
    branding: false,
    inline: true,
    skin: 'oxide-dark',
    plugins: 'lists image code link print textpattern wordcount',
    
    setup: (editor) => {
        editor.ui.registry.addButton('Template', {
           icon:'template.svg',
           tooltip:'template Note',
           id:'template-buttton',
           stateSelector:'test-clas',
          onAction: () => alert('Button clicked!')
        });
      },
    //file picker image
    image_title: true,
    // enable automatic uploads of images represented by blob or data URIs
    automatic_uploads: true,
    // add custom filepicker only to Image dialog
    file_picker_types: 'image',
    file_picker_callback: function (cb, value, meta) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');

        input.onchange = function () {
            var file = this.files[0];
            var reader = new FileReader();

            reader.onload = function () {
                var id = 'blobid' + (new Date()).getTime();
                var blobCache = tinymce.activeEditor.editorUpload.blobCache;
                var base64 = reader.result.split(',')[1];
                var blobInfo = blobCache.create(id, file, base64);
                blobCache.add(blobInfo);

                // call the callback and populate the Title field with the file name
                cb(blobInfo.blobUri(), { title: file.name });
            };
            reader.readAsDataURL(file);
        };

        input.click();
    }
});

// ############
// local storage I/O
// ############

// check for notes array and create it if not found
const checkForNotesArray = () => {

    if (localStorage.getItem('notes')) {
        console.log('yay! found notes array');
    } else {
        let notesArray = [];
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

    let notesArray = getNotesArray();

    let note = {
        id: Date.now(), // this doubles as the created date
        lastUpdated: Date.now(), // same as created initially, used to sort notes 
        body,
        starred,
    }

    notesArray.push(note);

    writeToNotesArray(notesArray);

    return note.id;
}

// get array index of a note
const getNoteIndex = noteId => {

    notesArray = getNotesArray(); // not using "let" somehow makes this a global variable

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

    let noteIndex = getNoteIndex(noteId);

    if (noteIndex === false) {

    } else {
        return notesArray[noteIndex];
    }
}

// update note body
const updateNoteBody = (noteId, body) => {

    let noteIndex = getNoteIndex(noteId);

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
    
    let noteIndex = getNoteIndex(noteId);

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

    let noteIndex = getNoteIndex(noteId);

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

        // update ID in local storage for currently viewed noted
        setCurrentNote(note.id);
    }
}

// render notes list
const renderNotesList = () => {

    let notesArray = getNotesArray();

    let notesList = document.querySelector(".notes-list");
    notesList.innerHTML = "";

    //split string every every nth (splitLength) space to array 
    const splitMyString = (str, splitLength) => {
        var a = str.split(' '), b = [];
        while (a.length) b.push(a.splice(0, splitLength).join(' '));
        return b;
    }

    // sort the array based on last updated date
    notesArray.sort((a, b) => Number(b.lastUpdated) - Number(a.lastUpdated));

    notesArray.forEach(note => {
        let noteBody = note.body;
        let noteHeading = '';
        let notePreview = '';

        // parse body into text (based on html tags)
        let noteObject = new tinymce.html.DomParser().parse(noteBody);

        if (noteObject.firstChild.firstChild.value !== " ") {
            noteHeading = noteObject.firstChild.firstChild.value
        } else if (noteObject.firstChild.next) {
            noteHeading = noteObject.firstChild.next.firstChild.value
        } else {
            noteHeading = "Empty"
        }

        // get note heading and preview (body)
        if (noteObject.firstChild.next && noteHeading !== noteObject.firstChild.next.firstChild.value) {
            notePreview = noteObject.firstChild.next.firstChild.value
        } else {
            let splitHeading = splitMyString(noteHeading, 3)
            noteHeading = splitHeading[0];
            for (i = 1; i < splitHeading.length; i++) {
                notePreview += splitHeading[i];
            }
        }
        
        // set preview text to a deafult if not found
        if (notePreview === "") {
            notePreview = `<i>nothing to preview...</i>`
        }

        // get date
        let noteDate = new Date(note.lastUpdated).toISOString().slice(0, 10);
        let noteDateISO = new Date(note.lastUpdated).toISOString();

        // print HTML
        notesList.innerHTML +=
        `<li class="note-list-item" data-id="${note.id}">
            <div class="note-list-meta-container">
                <time datetime="${noteDateISO}" class="note-list-date">${noteDate}</time>
                <i class="${note.starred ? "fas" : "far"} fa-star"></i>
            </div>
            <h2 class="note-list-heading">${noteHeading}</h2>
            <span class="note-list-preview">${notePreview}</span>
        </li>`; 
    });
}

// ############
// Event listeners
// ############

// note body
const noteBody = document.querySelector('#note-body');

noteBody.addEventListener('input', () => saveNote());

// notes list
const notesList = document.querySelector('#notes-list');

notesList.addEventListener('click', (e) => {

    // look up id of clicked note
    let noteId = Number(e.target.closest("li").dataset.id)

    // toggle starred status if star is pressed
    if (e.target.classList.contains("fa-star")) {
        
       toggleStarredStatus(noteId);

       renderNotesList();

    // else just render the note
    } else {

        renderNote(noteId);

        renderNotesList();
    }
});

// navbar
const navbarIcons = document.querySelector('#navbar-icons');

navbarIcons.addEventListener('click', (e) => {

    let pressedElement = e.target.id;

    if (pressedElement === 'new-note') {

        // then we create the new note (which returns its id)
        let newNoteId = createNote('<h1>set a title?</h1><p>starting typing... 🖋️</p>');

        // followed by rendering the new note
        renderNote(newNoteId);

        // we then select the generated h1
        tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);

        // re-render the notes list
        renderNotesList();
    }

    if (pressedElement === 'browse-notes') {
        renderNotesList();
    }

    if (pressedElement === 'statistics') {
        // do statistics things
    }

    if (pressedElement === 'settings') {
        // do settings things
    }
});

// load note content on page load
window.addEventListener('load', (e) => {

    let noteId = getCurrentNote();

    renderNote(noteId);

    renderNotesList();
});

// ############
// 
// ############

var checkbox = document.querySelector('input[name=theme]');

checkbox.addEventListener('change', function () {
    if (this.checked) {
        trans()
        document.documentElement.setAttribute('data-theme', 'dark')
    } else {
        trans()
        document.documentElement.setAttribute('data-theme', 'light')
    }
})

let trans = () => {
    document.documentElement.classList.add('transition');
    window.setTimeout(() => {
        document.documentElement.classList.remove('transition')
    }, 1000)
}
