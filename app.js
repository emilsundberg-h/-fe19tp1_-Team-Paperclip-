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
    contextmenu: false,
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

const quireIO = (function () {

    return {

        // check for quire object or create it if not found
        checkData: function () {
            if (localStorage.getItem('quireData')) {
                console.log('yay! found quire object');
            } else {
                let quireData = {
                    notes: [],
                    currentNote: null,
                    templates: [],
                    tags: [],
                    settings: { theme: 'light' }
                };

                localStorage.setItem('quireData', JSON.stringify(quireData));
                localStorage.getItem('quireData')
                    ? console.log('hiya! quire object created')
                    : console.log('oh no.. something went wrong creating quire object');
            }
        },

        // get quire object
        getData: function () {
            return JSON.parse(localStorage.getItem('quireData'));
        },

        // write to quire object
        updateData: function (quireData) {
            localStorage.setItem('quireData', JSON.stringify(quireData));
        },

        // create note
        createNote: function (body = '', starred = false, tags = []) {
            let quireData = this.getData();

            let note = {
                id: Date.now(), // this doubles as the created date
                lastUpdated: Date.now(), // same as created initially, used to sort notes
                body,
                starred,
                deleted: false, // TODO: currently not used
                tags
            };

            quireData.notes.push(note);

            this.updateData(quireData);

            return note.id;
        },

        // get array index of a note
        getNoteIndex: function (noteId) {
            let quireData = this.getData();

            let noteIndex = quireData.notes.findIndex(note => note.id === noteId);

            if (noteIndex === -1) {
                console.log('note NOT found...');
                return false;
            } else {
                return noteIndex;
            }
        },

        // read note
        readNote: function (noteId) {
            let quireData = this.getData();

            let noteIndex = this.getNoteIndex(noteId);

            if (noteIndex === false) {
            } else {
                return quireData.notes[noteIndex];
            }
        },

        // update note body
        updateNoteBody: function (noteId, body) {
            let quireData = this.getData();

            let noteIndex = this.getNoteIndex(noteId);

            if (noteIndex === false) {
            } else {
                let note = quireData.notes[noteIndex];

                note.body = body;
                note.lastUpdated = Date.now();

                this.updateData(quireData);
            }
        },

        // toggle starred status
        toggleStarredStatus: function (noteId) {
            let quireData = this.getData();

            let noteIndex = this.getNoteIndex(noteId);

            if (noteIndex === false) {
            } else {
                let note = quireData.notes[noteIndex];

                note.starred = !note.starred;
                //note.lastUpdated = Date.now();

                this.updateData(quireData);
            }
        },

        // delete note
        deleteNote: function (noteId) {
            let quireData = this.getData();

            let noteIndex = this.getNoteIndex(noteId);

            if (noteIndex === false) {
            } else {
                quireData.notes.splice(noteIndex, 1);
                // quireData.notes[noteIndex].deleted = true; // TODO: currently note used

                if (quireData.currentNote === noteId) {
                    quireData.currentNote = 0;
                }

                this.updateData(quireData);
            }
        },

        // add tag
        addTag: function (tagName, noteId = 0) {
            let quireData = this.getData();

            let tag;

            // if the tag does not exist, then we create it
            if (!quireData.tags.some(tag => tag.name === tagName)) {

                // corresponds to CSS classes
                let tagColors = ['tag-blue', 'tag-red', 'tag-green', 'tag-orange'];

                // create tag object
                tag = {
                    id: Date.now(),
                    name: tagName,
                    color: tagColors[Math.floor(Math.random() * tagColors.length)]
                };

                // add the tag to the global store
                quireData.tags.push(tag);

            } else {
                // if the tag already exists then we assign the object to "tag"
                tag = quireData.tags.filter(tag => tag.name === tagName)[0];
            }

            // if noteId is provided then we add the tag to the paticular note
            if (noteId) {

                let noteIndex = this.getNoteIndex(noteId);

                if (noteIndex) {
                    quireData.notes[noteIndex].tags.push(tag);
                }
            }

            this.updateData(quireData);
        },

        // remove tag
        removeTag: function () {

            // TODO: create method
            console.log('I do nothing at the moment :/');
        }
    };
})();

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

// get note preview
const getNotePreview = noteBody => {

    let rows = noteBody.split('\n');
    let words = noteBody.split(' ');

    let notePreview = '';
    let noteTitle = '';
    let arrNotePreview = [];

    rows.forEach(function (row, i) {
        if (noteTitle.trim().length < 1) {
            noteTitle = row;
        } else if (notePreview.trim().length < 1)
            notePreview = row;
    })

    if (notePreview.trim().length < 1 && words.length > 4) {
        noteTitle = `${words[0]} ${words[1]} ${words[2]} ${words[3]}...`;
        notePreview = `...${noteBody.substring(noteTitle.length - 2)}`;
    }

    if (!noteTitle || noteTitle === ' ') noteTitle = 'No title...';
    if (!notePreview || notePreview.length < 1) notePreview = '<i>No preview...</i>';

    arrNotePreview.push(noteTitle, notePreview);
    return arrNotePreview;
}

// ############
// Event handlers
// ############

// save note
const saveNote = () => {

    let noteId = quireIO.getData().currentNote;

    if (noteId) {
        let noteBody = tinyMCE.activeEditor.getContent();

        quireIO.updateNoteBody(noteId, noteBody);
    }
}

// render note
const renderNote = noteId => {

    let note = quireIO.readNote(noteId);

    if (note) {
        tinyMCE.activeEditor.setContent(note.body);

        // update ID in local storage for currently viewed noted
        let quireData = quireIO.getData();
        quireData.currentNote = note.id;
        quireIO.updateData(quireData);
    }
}

// render notes list
const renderNotesList = () => {

    //reset search function
    document.querySelector('#starred-search').checked = false;
    document.querySelector('#search').value = "";

    let quireData = quireIO.getData();

    let notesList = document.querySelector(".note-list");

    // clear notes list
    notesList.innerHTML = "";

    if (!quireData.notes.length) {
        notesList.innerHTML = '<div class="note-list-no-results"><i>No notes found... create one to get started!</></div>';

    } else {
        // sort the array based on last updated date
        quireData.notes.sort((noteA, noteB) => Number(noteB.lastUpdated) - Number(noteA.lastUpdated));

        quireData.notes.forEach(note => {

            // get note body
            let noteBody = parseNoteBodyHTML(note.body);

            // get title
            let noteTitle = getNotePreview(noteBody)[0];

            // get preview
            let notePreview = getNotePreview(noteBody)[1];

            // get date
            let noteDate = getNoteDate(note.lastUpdated);
            let noteDateISO = getNoteDateISO(note.lastUpdated);

            // print HTML
            notesList.innerHTML +=
                `<li class="note-list-item ${quireData.currentNote === note.id ? "note-list-item-current" : ""}" data-id="${note.id}">
                    <div class="note-list-meta-container">
                        <time datetime="${noteDateISO}" class="note-list-date">${noteDate}</time>
                        <div class="note-list-icons">
                            <button class= "delete-button" title="Delete note"></button>
                            <input type="checkbox" name="star-${note.id}" id="star-${note.id}" class="starred-checkbox" ${note.starred ? "checked" : ""}>
                            <label for="star-${note.id}" title="${note.starred ? 'Unstar note' : 'Star note'}"></label>
                        </div>
                    </div>
                </div>
                <a href="#" class="note-list-link"><h3 class="note-list-title">${noteTitle}</h3></a>
                <span class="note-list-preview">${notePreview}</span>
            </li>`;
        });
    }
}

// update note in notes list
const updateNoteInNotesList = noteId => {

    // get note from local storage
    let note = quireIO.readNote(noteId);

    // find list item with matching id in DOM
    const noteListItem = document.querySelector(`.note-list > li[data-id="${note.id}"]`);

    // update date
    let noteDate = getNoteDate(note.lastUpdated);
    let noteDateISO = getNoteDateISO(note.lastUpdated);

    noteListItem.querySelector('time').textContent = noteDate;
    noteListItem.querySelector('time').setAttribute('datetime', noteDateISO);

    // update starred status
    let noteStar = noteListItem.querySelector('.starred-checkbox');
    note.starred ? noteStar.checked = true : noteStar.checked = false;

    // get note body object
    let noteBody = parseNoteBodyHTML(note.body);

    // update title
    let noteTitle = getNotePreview(noteBody)[0];

    noteListItem.querySelector('.note-list-title').innerHTML = noteTitle;

    // update preview
    let notePreview = getNotePreview(noteBody)[1];

    noteListItem.querySelector('.note-list-preview').innerHTML = notePreview;

    // update current note status
    let currentNote = quireIO.getData().currentNote;

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

// set theme
window.addEventListener('DOMContentLoaded', e => {

    quireIO.checkData();

    let quireData = quireIO.getData();

    document.documentElement.setAttribute('data-theme', quireData.settings.theme);
})

// page load
window.addEventListener('load', e => {

    let quireData = quireIO.getData();

    renderNote(quireData.currentNote);

    renderNotesList();
});

// note body
const noteBody = document.querySelector('#note-body');

noteBody.addEventListener('keyup', e => {

    saveNote();

    let currentNote = quireIO.getData().currentNote;

    updateNoteInNotesList(currentNote);
});

// notes list
const notesList = document.querySelector('.note-list');

notesList.addEventListener('click', (e) => {

    //Check if user clicked outside list
    if (e.target.tagName !== 'UL') {

        // look up id of clicked note
        let noteId = Number(e.target.closest("li").dataset.id);

        // toggle starred status if star is pressed
        if (e.target.classList.contains('starred-checkbox')) {

            quireIO.toggleStarredStatus(noteId);

            // delete note if trash can is pressed
        } else if (e.target.classList.contains("delete-button")) {

            let quireData = quireIO.getData();

            // TODO: add user validation prior to deleting

            // in case user deletes the current note
            if (noteId == quireData.currentNote) {

                // clear the editor
                tinyMCE.activeEditor.setContent('');
            }

            quireIO.deleteNote(noteId);

            //Check if notelist is in search mode
            if (document.querySelector('#search').value == "" && !searchStarred.checked) {
                renderNotesList();
            } else {
                let searchStar = false;
                let searchString = document.querySelector('#search').value;
                if (searchStarred.checked) searchStar = true;
                searchNotesList(searchString, searchStar);
            }

            // else just render the note
            // pressing the star triggers the click event twice hence the label condition
        } else if (e.target.tagName !== 'LABEL') {

            renderNote(noteId);

            updateNoteInNotesList(noteId);

            // hide menu on mobile
            document.querySelector('.menu').classList.remove('show');
        }
    }
});

// navbar
const navbarMenu = document.querySelector('#navbar-menu');

let currentMenu;

navbarMenu.addEventListener('click', (e) => {

    let pressedMenu = e.target.id;

    switch (pressedMenu) {

        case 'new-note': {

            // then we create the new note (which returns its id)
            let newNoteId = quireIO.createNote('<h1>title...</h1>');

            // followed by rendering the new note
            renderNote(newNoteId);

            // we then select the generated h1
            tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('h1')[0]);

            // render notes lists
            renderNotesList();

            // hide menu on mobile
            document.querySelector('.menu').classList.remove('show');

            // show notes lists
            document.querySelector('.note-list-container').classList.remove('hide');

            // hide other submenus
            document.querySelector('.settings-container').classList.add('hide');
            document.querySelector('.statistics-container').classList.add('hide');

            // change menu title
            document.querySelector("#menu-title").innerText = "Browse notes";

            break
        }

        case 'browse-notes': {

            // toggle menu in mobile
            if (currentMenu === 'browse-notes') {
                document.querySelector('.menu').classList.toggle('show');
            } else {
                document.querySelector('.menu').classList.add('show');
            }

            // show notes lists
            document.querySelector('.note-list-container').classList.remove('hide');

            // hide other submenus
            document.querySelector('.settings-container').classList.add('hide');
            document.querySelector('.statistics-container').classList.add('hide');

            // change menu title
            document.querySelector("#menu-title").innerText = "Browse notes";

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
            document.querySelector('.note-list-container').classList.add('hide');

            // change menu title
            document.querySelector("#menu-title").innerText = "Statistics";

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
            document.querySelector('.note-list-container').classList.add('hide');

            // change menu title
            document.querySelector("#menu-title").innerText = "Settings";

            break
        }
    }

    // update current menu
    currentMenu = pressedMenu;
});

// dark mode
const themeCheckbox = document.querySelector('input[name=theme]');

themeCheckbox.addEventListener('change', function (e) {

    let quireData = quireIO.getData();

    if (this.checked) {
        trans();
        document.documentElement.setAttribute('data-theme', 'dark');
        quireData.settings.theme = 'dark';
    } else {
        trans();
        document.documentElement.setAttribute('data-theme', 'light');
        quireData.settings.theme = 'light';
    }

    quireIO.updateData(quireData);
})

let trans = () => {
    document.documentElement.classList.add('transition');
    window.setTimeout(() => {
        document.documentElement.classList.remove('transition')
    }, 1000)
}

// template
const templateContent = document.querySelector('.templateContent');

templateContent.addEventListener('click', (e) => {

    let pressedElement = e.target.id;

    if (pressedElement === 'temp1') {

        // then we create the new note (which returns its id)
        let newNoteId = quireIO.createNote('<h1>Välkommen till din anteckningsbok Quire!</h1><p></p><br></p><blockquote><p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<img src="quire_notebook.jpg" alt="" width="362" height="362"></p></blockquote><p><br></p><p>Så kul att du hittat hit. Vi hoppas att Quire från och med nu kommer vara plattformen för alla dina anteckningar. Låt oss öka chanserna för detta genom att berätta om några funktioner.</p><p><br></p><p><strong>Autospara</strong></p><p>Allting sparas automatiskt så du behöver aldrig vara orolig över att någonting försvinner.&nbsp;</p><p><br></p><p><strong>Sök</strong></p><p>Du söker genom hela innehållet och inte bara titlar. Vill du bara söka på dina stjärnmarkerade inlägg, klicka på stjärnan i sökfunktionen.</p><p><br></p><p><strong>Dark mode</strong></p><p>Visst är det så att när man ligger där i sängen och vrider på sig, det är då man kommer på de allra smartaste sakerna och tecknar man inte ned dem som är det börtglömt till morgonen. Var snäll mot dig själv och dina ögon genom att slå på dark mode när du skriver ned dina saker på småtimmarna. Du hittar dark mode under inställningar i vänsterkollumnen.</p><p><br></p><p><strong>Stjärnmarkering</strong></p><p>Välj ut dina speciella anteckningar genom att klicka i stjärnan. För att visa alla stjärnmarkeringar klickar du bara på stjärnan bredvid sökfältet.</p><p><br></p><p><strong>Mallar</strong></p><p>Behöver du ett snyggt CV eller en att-göra-lista? Längst upp till höger i verktygslistan finns det färdiga mallar för ändåmålet. Om du vill komma åt den här anteckningen igen, så hittar du den i mallar.</p><p><br></p><p><strong>Utskrift</strong></p><p>Digitala anteckningar i all ära, men beöhver du skriva ut dina anteckningar behöver du inte vara orolig över att något annat än just den valda anteckningen skrivs ut.</p><p><br></p>');

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
        let newNoteId = quireIO.createNote('<h1>feel alive @<img src="https://internetifokus.se/wp-content/uploads/2015/06/KYH-logo.png" alt="Bildresultat för kyh logo" style="background-color: var(--primary-background-color); color: var(--primary-text-color); font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;;"></h1><p><span id="_mce_caret" data-mce-bogus="1" data-mce-type="format-caret"><em>bra mall!﻿</em></span></p>');
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
        let newNoteId = quireIO.createNote('<h1>Im alive!</h1>\n<p>Start typing... 🖋️</p>');

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
        let newNoteId = quireIO.createNote('<h1>Sweet</h1>\n<p>Start typing... 🖋️</p>');

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
const searchStarred = document.querySelector('#starred-search');

searchInput.addEventListener('search', function () {
    if (searchStarred.checked || !searchInput.value == '') {
        searchString = searchInput.value
        searchNotesList(searchString, searchStarred.checked);
    } else {
        renderNotesList();
    }
})

searchInput.addEventListener('keyup', function (string) {

    let searchString = '';
    let searchStar = searchStarred.checked;

    searchString += string.target.value;

    searchNotesList(searchString, searchStar);
})

searchStarred.addEventListener('click', function (e) {

    let searchString = searchInput.value;
    let searchStar = searchStarred.checked;

    searchNotesList(searchString, searchStar);
})

const searchNotesList = (searchString = '', searchStar = false) => {

    let quireData = quireIO.getData();

    quireData.notes.sort((noteA, noteB) => Number(noteB.lastUpdated) - Number(noteA.lastUpdated));

    let notesList = document.querySelector('.note-list');
    notesList.innerHTML = '';

    quireData.notes.forEach(note => {
        let noteBody = parseNoteBodyHTML(note.body);

        // get title
        let noteTitle = getNotePreview(noteBody)[0];

        // get preview
        let notePreview = getNotePreview(noteBody)[1];

        // get date
        let noteDate = getNoteDate(note.lastUpdated);
        let noteDateISO = getNoteDateISO(note.lastUpdated);

        if (noteBody.toLowerCase().includes(searchString.toLowerCase())
            && (note.starred == true || note.starred == searchStar)) {

            notesList.innerHTML +=
                `<li class="note-list-item ${quireData.currentNote === note.id ? "note-list-item-current" : ""}" data-id="${note.id}">
                    <div class="note-list-meta-container">
                        <time datetime="${noteDateISO}" class="note-list-date">${noteDate}</time>
                        <div class="note-list-icons">
                            <button class= "delete-button" title="Delete note"></button>
                            <input type="checkbox" name="star-${note.id}" id="star-${note.id}" class="starred-checkbox" ${note.starred ? "checked" : ""}>
                            <label for="star-${note.id}" title="${note.starred ? 'Unstar note' : 'Star note'}"></label>
                        </div>
                    </div>
                    <a href="#" class="note-list-link"><h3 class="note-list-title">${noteTitle}</h3></a>
                    <span class="note-list-preview">${notePreview}</span>
                </li>`;
        }
    })
    if (notesList.innerHTML == '') {
        notesList.innerHTML =
            `<div class="note-list-no-results"><i>No ${(searchStar) ? "starred" : ""} notes 
        ${(searchString) ? 'with ' + '"' + searchString + '"' : ""} found.</i ></div>`;
    }
}