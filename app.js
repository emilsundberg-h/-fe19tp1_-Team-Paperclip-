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
            icon: 'template.svg',
            tooltip: 'Choose Template',
            id: 'template-buttton',
            stateSelector: 'test-clas',
            onAction: () => {
                document.querySelector('.bg-modal').style.display = 'flex';

                document.querySelector('.close').addEventListener('click', function () {
                    document.querySelector('.bg-modal').style.display = 'none';
                });


            }
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
// Helper functions
// ############

// get note date in yyyy-mm-dd
const getNoteDate = date => new Date(date).toISOString().slice(0, 10);

// get note date ISO
const getNoteDateISO = date => new Date(date).toISOString();

// parse note body
const parseNoteBodyHTML = noteBody => {
    // Create a new div element
    var temporalDivElement = document.createElement("div");
    // Set the HTML content with the providen
    temporalDivElement.innerHTML = noteBody;
    // Retrieve the text property of the element (cross-browser support)
    return temporalDivElement.textContent || temporalDivElement.innerText || "";
}
// get note title
const getNoteTitle = noteBody => {

    let rows = noteBody.split('\n');

    let noteTitle

    rows.forEach(function (row) {
        if (row.length >= 1 && !noteTitle) noteTitle = row
    })

    if (!noteTitle || noteTitle === ' ') noteTitle = 'No title...'


    return noteTitle
}

// get note preview
const getNotePreview = noteBody => {

    let rows = noteBody.split('\n');

    let notePreview;

    rows.forEach(function (row, i) {
        if (row.length >= 1 && !notePreview && rows[i + 1] !== ' ') notePreview = rows[i + 1]
    })

    if (!notePreview || notePreview === ' ') notePreview = '<i>No preview...</i>'

    return notePreview;
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

    // clear notes list
    notesList.innerHTML = "";

    // sort the array based on last updated date
    notesArray.sort((noteA, noteB) => Number(noteB.lastUpdated) - Number(noteA.lastUpdated));

    notesArray.forEach(note => {

        // get note body
        let noteBody = parseNoteBodyHTML(note.body);

        // get title
        let noteTitle = getNoteTitle(noteBody);

        // get preview
        let notePreview = getNotePreview(noteBody);

        // get date
        let noteDate = getNoteDate(note.lastUpdated);
        let noteDateISO = getNoteDateISO(note.lastUpdated);

        // get current note
        let currentNote = getCurrentNote();

        // print HTML
        notesList.innerHTML +=
            `<li class="note-list-item ${currentNote === note.id ? "note-list-item-current" : ""}" data-id="${note.id}">
            <div class="note-list-meta-container">
            
            <time datetime="${noteDateISO}" class="note-list-date">${noteDate}</time>
        
        <div class="note-list-icons">
        <i class="far fa-trash-alt"></i>    
        <i class="${note.starred ? "fas" : "far"} fa-star"></i>
        </div>
        </div>
                <h2 class="note-list-title">${noteTitle}</h2>
                <span class="note-list-preview">${notePreview}</span>
            </li>`;
    });
}

// update note in notes list
const updateNoteInNotesList = noteId => {

    // get note from local storage
    let note = readNote(noteId);

    // find list item with matching id in DOM
    const noteListItem = document.querySelector(`.notes-list > li[data-id="${note.id}"]`);

    // update date
    let noteDate = getNoteDate(note.lastUpdated);
    let noteDateISO = getNoteDateISO(note.lastUpdated);

    noteListItem.querySelector('time').textContent = noteDate;
    noteListItem.querySelector('time').setAttribute('datetime', noteDateISO);

    // update starred status
    let noteStar = noteListItem.querySelector('.fa-star');

    if (note.starred) {
        noteStar.classList.add('fas');
        noteStar.classList.remove('far');
    } else {
        noteStar.classList.add('far');
        noteStar.classList.remove('fas');
    }

    // get note body object
    let noteBody = parseNoteBodyHTML(note.body);

    // update title
    let noteTitle = getNoteTitle(noteBody);

    noteListItem.querySelector('.note-list-title').innerHTML = noteTitle;

    // update preview
    let notePreview = getNotePreview(noteBody);

    noteListItem.querySelector('.note-list-preview').innerHTML = notePreview;

    // update current note status
    let currentNote = getCurrentNote();

    if (currentNote === note.id) {
        let checkClass = document.querySelectorAll(".note-list-item")

        //Check if selected note is visible
        checkClass.forEach(function (e) {

            if (e.classList.contains("note-list-item-current")) {

                let currentNoteItem = document.querySelector('.note-list-item-current');
                currentNoteItem.classList.remove('note-list-item-current');
            }
        })
        noteListItem.classList.add('note-list-item-current');
    }
}

// ############
// Event listeners
// ############

// note body
const noteBody = document.querySelector('#note-body');

// TODO: listening for input is not the perfect solution to detect change
// when e.g. deleting note content (crtl + a and delete/backspace)
// look into tinymce API, other event listener or maybe mutationobserver
noteBody.addEventListener('input', (e) => {

    saveNote();

    let currentNote = getCurrentNote();

    updateNoteInNotesList(currentNote);
});



// notes list
const notesList = document.querySelector('#notes-list');

notesList.addEventListener('click', (e) => {

    // look up id of clicked note
    let noteId = Number(e.target.closest("li").dataset.id);

    // toggle starred status if star is pressed
    if (e.target.classList.contains("fa-star")) {

        toggleStarredStatus(noteId);

        updateNoteInNotesList(noteId);

        // else just render the note
    } else {

        // we save and update the current note first to ensure no changes get lost.
        // This because the input event listener does not detect all changes (TODO)

        //Check if selected note is visible
        if (e.target.classList.contains("note-list-item-current")) {
            let currentNoteId = getCurrentNote();
            updateNoteInNotesList(currentNoteId);
            saveNote();
        }

        renderNote(noteId);

        updateNoteInNotesList(noteId);

        // hide menu on mobile
        document.querySelector('.menu').classList.remove('show');
    }
});

// navbar
const navbarMenu = document.querySelector('#navbar-menu');

let currentMenu;

navbarMenu.addEventListener('click', (e) => {

    let pressedMenu = e.target.id;

    switch (pressedMenu) {

        case 'new-note': {
            document.querySelector('#search').value = ""
            // then we create the new note (which returns its id)
            let newNoteId = createNote('<h1>title...</h1>');

            // followed by rendering the new note
            renderNote(newNoteId);

            // we then select the generated h1
            tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);

            // render notes lists
            renderNotesList();

            // hide menu on mobile
            document.querySelector('.menu').classList.remove('show');

            // 
            document.querySelector("#nav-title").innerText = "Browse notes";
            document.querySelector(".search-toolbar").style.display = "flex";

            break
        }

        case 'browse-notes': {
            document.querySelector('#search').value = ""
            // toggle menu in mobile
            if (currentMenu === 'browse-notes') {
                document.querySelector('.menu').classList.toggle('show');
            } else {
                document.querySelector('.menu').classList.add('show');
            }

            // show notes lists
            document.querySelector('.notes-list').classList.remove('hide');

            // hide other submenus
            document.querySelector('.settings-container').classList.add('hide');
            document.querySelector('.statistics-container').classList.add('hide');

            //
            document.querySelector("#nav-title").innerText = "Browse notes";
            document.querySelector(".search-toolbar").style.display = "flex";

            // render notes list
            renderNotesList();

            break
        }

        case 'statistics': {

            // toggle menu in mobile
            if (currentMenu === 'statistics') {
                document.querySelector('.menu').classList.toggle('show');
            } else {
                document.querySelector('.menu').classList.add('show');
            }

            // show statistics
            document.querySelector('.statistics-container').classList.remove('hide');

            // hide other submenus
            document.querySelector('.settings-container').classList.add('hide');
            document.querySelector('.notes-list').classList.add('hide');

            //
            document.querySelector("#nav-title").innerText = "Statistics";
            document.querySelector(".search-toolbar").style.display = "none";

            break
        }

        case 'settings': {

            // toggle menu in mobile
            if (currentMenu === 'settings') {
                document.querySelector('.menu').classList.toggle('show');
            } else {
                document.querySelector('.menu').classList.add('show');
            }

            // show settings
            document.querySelector('.settings-container').classList.remove('hide');

            // hide other submenus
            document.querySelector('.statistics-container').classList.add('hide');
            document.querySelector('.notes-list').classList.add('hide');

            //
            document.querySelector("#nav-title").innerText = "Settings";
            document.querySelector(".search-toolbar").style.display = "none";

            break
        }
    }

    // update current menu
    currentMenu = pressedMenu;
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
const templateContent = document.querySelector('.templateContent');


templateContent.addEventListener('click', (e) => {

    let pressedElement = e.target.id;

    if (pressedElement === 'temp1') {

        // then we create the new note (which returns its id)
        let newNoteId = createNote('<h1>Lever</h1>\n<p>Start typing... 🖋️</p>');

        // followed by rendering the new note
        renderNote(newNoteId);

        // we then select the generated h1
        tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);

        // re-render the notes list
        renderNotesList();
        document.querySelector('.bg-modal').style.display = 'none';
    }

    else if (pressedElement === 'temp2') {

        // then we create the new note (which returns its id)
        let newNoteId = createNote('<h1>feel alive @<img src="https://internetifokus.se/wp-content/uploads/2015/06/KYH-logo.png" alt="Bildresultat för kyh logo" style="background-color: var(--primary-background-color); color: var(--primary-text-color); font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;;"></h1><p><span id="_mce_caret" data-mce-bogus="1" data-mce-type="format-caret"><em>bra mall!﻿</em></span></p>');
        // followed by rendering the new note
        renderNote(newNoteId);

        // we then select the generated h1
        tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);

        // re-render the notes list
        renderNotesList();
        document.querySelector('.bg-modal').style.display = 'none';
    }

    else if (pressedElement === 'temp3') {

        // then we create the new note (which returns its id)
        let newNoteId = createNote('<h1>Im alive!</h1>\n<p>Start typing... 🖋️</p>');

        // followed by rendering the new note
        renderNote(newNoteId);

        // we then select the generated h1
        tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);

        // re-render the notes list
        renderNotesList();
        document.querySelector('.bg-modal').style.display = 'none';
    }

    else if (pressedElement === 'temp4') {

        // then we create the new note (which returns its id)
        let newNoteId = createNote('<h1>Sweet</h1>\n<p>Start typing... 🖋️</p>');

        // followed by rendering the new note
        renderNote(newNoteId);

        // we then select the generated h1
        tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);

        // re-render the notes list
        renderNotesList();
        document.querySelector('.bg-modal').style.display = 'none';
    }
})

const searchInput = document.querySelector('#search');

searchInput.addEventListener('keyup', function (string) {
    const notesArrray = getNotesArray()
    notesArray.sort((noteA, noteB) => Number(noteB.lastUpdated) - Number(noteA.lastUpdated));

    let notesList = document.querySelector(".notes-list");
    let searchString = ""
    searchString += string.target.value
    console.log(`Search string: ${searchString}`)
    notesList.innerHTML = ""

    notesArray.forEach(function (note) {
        let noteBody = parseNoteBodyHTML(note.body);
        // get title
        let noteTitle = getNoteTitle(noteBody);

        // get preview
        let notePreview = getNotePreview(noteBody);

        // get date
        let noteDate = getNoteDate(note.lastUpdated);
        let noteDateISO = getNoteDateISO(note.lastUpdated);

        // get current note
        let currentNote = getCurrentNote();

        if (noteBody.toLowerCase().includes(searchString.toLowerCase())) {
            console.log(`Found note: ${note.id}`);
            notesList.innerHTML +=
                `<li class="note-list-item ${currentNote === note.id ? "note-list-item-current" : ""}" data-id="${note.id}">
                <div class="note-list-meta-container">
            
                    <time datetime="${noteDateISO}" class="note-list-date">${noteDate}</time>
                
                <div class="note-list-icons">
                <i class="far fa-trash-alt"></i>    
                <i class="${note.starred ? "fas" : "far"} fa-star"></i>
                </div>
                </div>
                <h2 class="note-list-title">${noteTitle}</h2>
                <span class="note-list-preview">${notePreview}</span>
            </li>`;
        }
    })
})