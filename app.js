// ############
// TinyMCE
// ############

tinymce.init({
    selector: '#note-body',
    toolbar: 'bold italic strikethrough underline h2 h3 | bullist | numlist | aligncenter | blockquote | image | link | print | wordcount | Template | emoticons | fontselect|',
    fixed_toolbar_container: '#note-toolbar',
    aligncenter: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'center' },
    toolbar_drawer: 'sliding',
    menubar: false,
    branding: false,
    inline: true,
    contextmenu: false,
    skin: 'oxide',
    plugins: 'lists image code link print textpattern wordcount emoticons',
    content_css: ['https://fonts.googleapis.com/css?family=Lato|Montserrat|Open+Sans|Oswald|Raleway|Roboto&display=swap'],
    font_formats: 'Arial=arial;Baskervville=Baskervville, serif;Helvetica=helvetica,sans-serif;Courier=courier new,courier,monospace;Montserrat=Montserrat,sans-serif;Roboto=Roboto, sans-serif;Oswald=Oswald, sans-serif;Raleway=Raleway, sans-serif;',
    setup: (editor) => {
        editor.ui.registry.addButton('Template', {
            icon: 'template',
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

                // check preferred system theme
                let theme = 'light';
                if (window.matchMedia('(prefers-color-scheme)').media !== 'not all') {
                    window.matchMedia("(prefers-color-scheme: dark)").matches ? theme = 'dark' : theme = 'light';
                }

                // create quire data object
                let quireData = {
                    notes: [],
                    currentNote: null,
                    templates: [],
                    tags: [],
                    settings: { theme }
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

                // first remove note from any tags
                if (quireData.notes[noteIndex].tags.length) {

                    quireData.notes[noteIndex].tags.forEach(tagId => {
                        quireIO.removeTag(tagId, noteId);
                    });

                    // update data with the note removed from all tags
                    quireData = this.getData();
                }

                // delete note
                quireData.notes.splice(noteIndex, 1);
                // quireData.notes[noteIndex].deleted = true; // TODO: currently note used

                // update current note
                if (quireData.currentNote === noteId) {
                    quireData.currentNote = 0;
                }

                this.updateData(quireData);
            }
        },

        // add tag
        addTag: function (tagName, noteId) {

            let noteIndex = this.getNoteIndex(noteId);

            if (tagName && noteIndex !== false) {

                let quireData = this.getData();

                tagName = tagName.toLowerCase();

                let tag;

                // if the tag does not already exist, create it
                if (!quireData.tags.some(tag => tag.name === tagName)) {

                    // corresponds to CSS classes
                    let tagColors = ['tag-blue', 'tag-red', 'tag-green', 'tag-orange'];

                    // create tag object
                    tag = {
                        id: Date.now(),
                        name: tagName,
                        color: tagColors[Math.floor(Math.random() * tagColors.length)],
                        assignedNotes: []
                    };

                    // add the tag to the global store
                    quireData.tags.push(tag);
                }

                // then we assign "tag" to the tag object (which should be the same if just created)
                tag = quireData.tags.filter(tag => tag.name === tagName)[0];

                // make sure the note isn't already assigned to the tag
                if (!tag.assignedNotes.includes(noteId)) {

                    // assign note to tag
                    tag.assignedNotes.push(noteId);

                    // assign tag to note
                    quireData.notes[noteIndex].tags.push(tag.id);

                } else {

                    console.log('tag already added to this note')
                }

                this.updateData(quireData);

                return tag.id;

            } else {
                console.log('no tag name provided or invalid note id');
            }
        },

        // get tag index
        getTagIndex: function (tagId) {

            let quireData = this.getData();

            let tagIndex = quireData.tags.findIndex(tag => tag.id === tagId);

            if (tagIndex === -1) {
                console.log('tag NOT found...');
                return false;
            } else {
                return tagIndex;
            }
        },

        // get an array of all tags for a paticular note
        getTags: function (noteId) {

            let quireData = this.getData();

            if (noteId) {
                return quireData.tags.filter(tag => tag.assignedNotes.includes(noteId));
            }
        },

        // remove tag
        removeTag: function (tagId, noteId) {

            let quireData = this.getData();

            let tagIndex = this.getTagIndex(tagId);

            let noteIndex = this.getNoteIndex(noteId);

            if (tagIndex === false) {
            } else {

                // remove the note id from the tag
                let assignedNotesArray = quireData.tags[tagIndex].assignedNotes;
                assignedNotesArray.splice(assignedNotesArray.indexOf(noteId), 1);

                // remove the tag id from the note
                let assignedTagsArray = quireData.notes[noteIndex].tags;
                assignedTagsArray.splice(assignedTagsArray.indexOf(tagId), 1);

                // if there are no longer any notes assigned to the tag, delete the tag all together
                if (assignedNotesArray.length <= 0) {
                    quireData.tags.splice(tagIndex, 1);
                }

                this.updateData(quireData);
            }
        }
    };
})();

// ############
// Helper functions
// ############

// get note date
const getNoteDateTitle = date => new Date(date).toUTCString();

// get note date ISO
const getNoteDateISO = date => new Date(date).toISOString();

// get note date relative
const getNoteDateRelative = date => {

    let ISODate = getNoteDateISO(date)

    return moment(ISODate).fromNow();
}

// parse note body
const parseNoteBodyHTML = noteBody => {
    // Create a new div element
    var temporalDivElement = document.createElement('div');
    // Set the HTML content with the providen
    temporalDivElement.innerHTML = noteBody;
    // Retrieve the text property of the element (cross-browser support)
    return temporalDivElement.textContent || temporalDivElement.innerText || '';
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

    //Under construction
    const isOverflown = (e) => {
        return e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
    }
    // let titleLength

    // let listPreview = document.querySelector('.note-list-item-current > a > h3')
    // if (listPreview) {
    //     if (isOverflown(listPreview) && !titleLength) {
    //         titleLength = words.length
    //         console.log(words.length)
    //     }

    // console.log(isOverflown(listPreview))
    if (notePreview.trim().length < 1 && words.length > 4) {
        noteTitle = `${words[0]} ${words[1]} ${words[2]} ${words[3]}...`;
        notePreview = `...${noteBody.substring(noteTitle.length - 2)}`;
    }
    // }

    if (!noteTitle || noteTitle === ' ') noteTitle = 'No title...';
    if (!notePreview || notePreview.trim().length < 1) notePreview = '<i>No preview...</i>';

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
    document.querySelector('#search').value = '';

    let quireData = quireIO.getData();

    let notesList = document.querySelector('.note-list');

    // clear notes list
    notesList.innerHTML = '';

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
            let noteDateTitle = getNoteDateTitle(note.lastUpdated);
            let noteDateISO = getNoteDateISO(note.lastUpdated);
            let NoteDateRelative = getNoteDateRelative(noteDateISO);

            // get tags
            let noteTagsHTML = '';

            if (note.tags.length > 0) {

                let tags = quireIO.getTags(note.id);

                tags.forEach(tag => {
                    noteTagsHTML += `<li class="tag ${tag.color}" data-tagid="${tag.id}">
                                      <span>${tag.name}</span>
                                      <button class="tag-delete-button">x</button>
                                  </li>`
                });
            }

            // render HTML
            notesList.innerHTML +=
                `<li class="note-list-item ${quireData.currentNote === note.id ? "note-list-item-current" : ""}" data-id="${note.id}">
                    <div class="note-list-meta-container">
                        <time datetime="${noteDateISO}" title="${noteDateTitle}" class="note-list-date">${NoteDateRelative}</time>
                        <div class="note-list-icons">
                            <button class="tag-button" title="Add tags"></button>
                            <button class= "delete-button" title="Delete note"></button>
                            <div class="confirm-div hide" id="confirm-${note.id}">
                            <button class="confirm-buttons confirm" title="Confirm delete">Delete</button>
                            <button class="confirm-buttons cancel" title="Cancel delete">Cancel</button>
                            </div>
                            <input type="checkbox" name="star-${note.id}" id="star-${note.id}" class="starred-checkbox" ${note.starred ? "checked" : ""}>
                            <label for="star-${note.id}" title="${note.starred ? 'Unstar note' : 'Star note'}"></label>
                        </div>
                    </div>
                    <a href="#" class="note-list-link"><h3 class="note-list-title">${noteTitle}</h3></a>
                    <span class="note-list-preview">${notePreview}</span>
                    <ul class="note-list-tags">${noteTagsHTML}</ul>
                    <div class="note-list-add-tag-container hide" id="add-tag-container-${note.id}">
                        <input class="tag-input" type="text" id="tag-input-${note.id}" placeholder="Add tag..." />
                        <span class="tag-search-text"></span>
                        <ul class="tag-search-suggestions"></ul>
                    </div>
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
    let noteDateTitle = getNoteDateTitle(note.lastUpdated);
    let noteDateISO = getNoteDateISO(note.lastUpdated);
    let NoteDateRelative = getNoteDateRelative(noteDateISO);

    noteListItem.querySelector('time').textContent = NoteDateRelative;
    noteListItem.querySelector('time').setAttribute('datetime', noteDateISO);
    noteListItem.querySelector('time').setAttribute('title', noteDateTitle);

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

    // update tags
    let tagList = noteListItem.querySelector('.note-list-tags');

    tagList.innerHTML = '';
    let noteTagsHTML = '';

    if (note.tags.length > 0) {

        let tags = quireIO.getTags(note.id);

        tags.forEach(tag => {
            noteTagsHTML += `<li class="tag ${tag.color}" data-tagid="${tag.id}">
                              <span>${tag.name}</span>
                              <button class="tag-delete-button">x</button>
                          </li>`
        });
    }

    tagList.innerHTML = noteTagsHTML;

    // update current note status
    let currentNote = quireIO.getData().currentNote;

    if (currentNote === note.id) {
        let checkClass = document.querySelectorAll('.note-list-item')

        //Check if selected note is visible
        checkClass.forEach(function (e) {

            if (e.classList.contains('note-list-item-current')) {

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

// check for data and set theme
window.addEventListener('DOMContentLoaded', e => {

    quireIO.checkData();

    let quireData = quireIO.getData();

    // set theme
    document.documentElement.setAttribute('data-theme', quireData.settings.theme);

    // set state of theme checkbox
    let themeCheckbox = document.querySelector('input[name=themeCheckbox]');
    quireData.settings.theme === 'dark' ? themeCheckbox.checked = true : themeCheckbox.checked = false;
});

// page load
window.addEventListener('load', e => {

    let quireData = quireIO.getData();

    if (quireData.currentNote === null) {

        let newNoteId = quireIO.createNote(`h1 style="text-align: center;" data-mce-style="text-align: center;">Välkommen till din anteckningsbok Quire!</h1><p><br data-mce-bogus="1"></p><p style="text-align: center;" data-mce-style="text-align: center;"><img src="quire_notebook.jpg" alt="" width="308" height="308" data-mce-src="quire_notebook.jpg" style="background-color: var(--primary-background-color); color: var(--primary-text-color); font-family: Roboto, sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';" data-mce-style="background-color: var(--primary-background-color); color: var(--primary-text-color); font-family: Roboto, sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';"><br></p><p><br></p><p>Så kul att du hittat hit. Vi hoppas att Quire från och med nu kommer vara plattformen för alla dina anteckningar. Låt oss öka chanserna för detta genom att berätta om några funktioner.</p><p><br></p><p><strong>Autospara</strong></p><p>Allting sparas automatiskt så du behöver aldrig vara orolig över att någonting försvinner.&nbsp;</p><p><br></p><p><strong>Sök</strong></p><p>Du söker genom hela innehållet och inte bara titlar. Vill du bara söka på dina stjärnmarkerade inlägg, klicka på stjärnan i sökfunktionen.</p><p><br data-mce-bogus="1"></p><p><strong>Stjärnmarkering</strong></p><p>Välj ut dina speciella anteckningar genom att klicka i stjärnan. För att visa alla stjärnmarkeringar klickar du bara på stjärnan bredvid sökfältet.</p><p><br data-mce-bogus="1"></p><p><strong>Taggar</strong></p><p>Organisera dina anteckningar med hjälp av taggar. När du skapar en ny tagg kommer förslag på dina tidigare använda taggar.&nbsp;</p><p><br></p><p><strong>Dark mode</strong></p><p>Visst är det så att när man ligger där i sängen och vrider på sig, det är då man kommer på de allra smartaste sakerna och tecknar man inte ned dem, så är det bortglömt till morgonen. Var snäll mot dig själv och dina ögon genom att slå på dark mode när du skriver ned dina saker på småtimmarna. Du hittar dark mode under inställningar i vänsterkolumnen.</p><p><br></p><p><strong>Utskrift</strong></p><p>Digitala anteckningar i all ära, men behöver du skriva ut dina anteckningar behöver du inte vara orolig över att något annat än just den valda anteckningen skrivs ut.</p><p><br></p>`);

        quireData.currentNote = newNoteId;
    }

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

notesList.addEventListener('click', e => {

    //Check if user clicked outside list
    if (e.target.tagName !== 'UL') {

        // look up id of clicked note
        let noteId = Number(e.target.closest('.note-list-item').dataset.id);

        // toggle starred status if star is pressed
        if (e.target.classList.contains('starred-checkbox')) {

            quireIO.toggleStarredStatus(noteId);


            // delete note if trash can is pressed
        } else if (e.target.classList.contains('delete-button')) {

            let quireData = quireIO.getData();

            const trashcan = e.target

            //Confirm delete
            const confirmButtons = notesList.querySelector(`#confirm-${noteId}`);

            const mouseOut = (e) => {
                confirmButtons.classList.add('hide');
                confirmButtons.classList.remove('animated');
            };
            confirmButtons.addEventListener('mouseleave', mouseOut)

            confirmButtons.classList.remove('hide');
            confirmButtons.classList.add('animated');
            trashcan.blur();

            confirmButtons.addEventListener('click', e => {
                confirmButtons.removeEventListener('mouseout', mouseOut)

                if (e.target.classList.contains('confirm')) {
                    confirmButtons.classList.add('hide');
                    confirmButtons.classList.remove('animated');
                    quireIO.deleteNote(noteId);

                    // in case user deletes the current note
                    if (noteId == quireData.currentNote) {

                        // clear the editor
                        tinyMCE.activeEditor.setContent('');
                    }


                    //Check if notelist is in search mode
                    if (document.querySelector('#search').value == '' && !searchStarred.checked) {
                        renderNotesList();
                    } else {
                        let searchStar = false;
                        let searchString = document.querySelector('#search').value;
                        if (searchStarred.checked) searchStar = true;
                        searchNotesList(searchString, searchStar);
                    }
                } else {
                    confirmButtons.classList.add('hide');
                    confirmButtons.classList.remove('animated');
                }
            })

            // add tag button is pressed
        } else if (e.target.classList.contains('tag-button')) {

            // show tag container if hidden
            const addTagContainer = notesList.querySelector(`#add-tag-container-${noteId}`);
            addTagContainer.classList.remove('hide');

            // put cursor focus on input field
            const tagInput = notesList.querySelector(`#tag-input-${noteId}`);
            tagInput.focus();


            // delete tag button is pressed
        } else if (e.target.classList.contains('tag-delete-button')) {

            let tagId = Number(e.target.closest('.tag').dataset.tagid);

            // remove tag from local storage
            quireIO.removeTag(tagId, noteId);

            // update note in DOM
            updateNoteInNotesList(noteId);


            // tag search suggestion is pressed
        } else if (e.target.closest('.tag-search-suggestion-item')) {

            let tagName = e.target.textContent;

            quireIO.addTag(tagName, noteId)

            updateNoteInNotesList(noteId)

            let tagInput = notesList.querySelector(`#tag-input-${noteId}`);
            tagInput.value = '';
            tagInput.focus();

            notesList.querySelector(`#add-tag-container-${noteId} > span`).innerText = '';
            notesList.querySelector(`#add-tag-container-${noteId} > ul`).innerHTML = '';


            // else just render the note
            // pressing the star triggers the click event twice hence the label condition
        } else if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {

            renderNote(noteId);

            updateNoteInNotesList(noteId);

            // hide menu on mobile
            document.querySelector('.menu').classList.remove('show');
        }
    }
});

notesList.addEventListener('keydown', e => {

    // look up id of clicked note
    let noteId = Number(e.target.closest('.note-list-item').dataset.id);

    // add tag when input field is in focus
    if (e.keyCode === 13 && e.target.classList.contains('tag-input')) {

        // get input value
        let input = e.target.value;

        // add note to local storage
        quireIO.addTag(input, noteId);

        // update DOM with new tag
        updateNoteInNotesList(noteId);

        // reset input field
        notesList.querySelector(`#tag-input-${noteId}`).value = '';

        // reset tag suggestions
        notesList.querySelector(`#add-tag-container-${noteId} > span`).innerText = '';
        notesList.querySelector(`#add-tag-container-${noteId} > ul`).innerHTML = '';
    }

    // add tag when suggestion item is in focus
    if (e.keyCode === 13 && e.target.classList.contains('tag-search-suggestion-item')) {

        // get tag name of the pressed suggestion
        let tagName = e.target.textContent;

        // add note to local storage
        quireIO.addTag(tagName, noteId);

        // update DOM with new tag
        updateNoteInNotesList(noteId);

        // reset input field and set focus
        let tagInput = notesList.querySelector(`#tag-input-${noteId}`);

        tagInput.value = '';
        tagInput.focus();

        // reset tag suggestions
        notesList.querySelector(`#add-tag-container-${noteId} > span`).innerText = '';
        notesList.querySelector(`#add-tag-container-${noteId} > ul`).innerHTML = '';
    }

    // TODO: look into making the search suggestions list possible to navigate using arrow keys and closed using esc

});

notesList.addEventListener('input', e => {

    let quireData = quireIO.getData();

    if (quireData.tags.length) {

        let noteId = Number(e.target.closest('.note-list-item').dataset.id);

        let noteIndex = quireIO.getNoteIndex(noteId);

        // clear tag suggestions in DOM
        let searchSuggestionsContainer = notesList.querySelector(`#add-tag-container-${noteId} > .tag-search-suggestions`);
        searchSuggestionsContainer.innerHTML = '';

        // filter existing tags based on search input and whats already assigned to the note
        let searchInput = e.target.value;
        let tagSearchResultsArray = quireData.tags.filter(tag => tag.name.includes(searchInput.toLowerCase()) && !(quireData.notes[noteIndex].tags.includes(tag.id)));

        // list tag suggestions in DOM
        tagSearchResultsArray.forEach(tag => {
            searchSuggestionsContainer.innerHTML += `<li tabindex="0" class="tag-search-suggestion-item" data-tagid="${tag.id}"><span class="tag ${tag.color}">${tag.name}</span></li>`;
        })

        if (!tagSearchResultsArray.length) {
            searchSuggestionsContainer.previousElementSibling.innerText = 'no tags found... press enter to add';
        } else {
            searchSuggestionsContainer.previousElementSibling.innerText = 'pick from existing tags...';
        }
    }
});

// hide tag suggestions container when notes list is no longer in focus
// TODO: maybe exessive, consider cleaner solution?
document.addEventListener('focusin', e => {
    let addTagContainers = notesList.querySelectorAll('.note-list-add-tag-container');

    if (!e.target.closest('.note-list')) {

        addTagContainers.forEach(container => {
            container.classList.add('hide');
        });

    }
});

//Q
const logoQDiv = document.querySelector('.navbar-logo')

const getDadJoke = async () => {

    //Get the joke from API
    const response = await fetch('https://icanhazdadjoke.com', { headers: { 'Accept': 'application/json' } });
    const myJson = await response.json();

    //Show the joke in DOM
    document.querySelector('#scroll').style.display = 'flex'
    document.querySelector('#scroll').innerHTML = `<p>${JSON.stringify(myJson.joke)}</p>`;

    //Calculate scroll speed based on joke length
    let scrollSpeed = Math.round(JSON.stringify(myJson.joke).length / 10);
    document.querySelector('.scroll > p').style.animation =
        `marquee ${(scrollSpeed > 7) ? scrollSpeed - 1 : scrollSpeed}s linear infinite`;
}

logoQDiv.addEventListener("click", (e) => {

    let logoQ = document.querySelector('#logoQ')
    let scrollMessage = document.querySelector('#scroll')

    //Rotate Q
    logoQ.classList.toggle('rotated')

    //Get and scroll the joke
    getDadJoke();

    const unrotate = () => {
        scrollMessage.removeEventListener("mouseleave", unrotate);

        //Unrotate Q
        logoQ.classList.toggle('rotated');

        //Reset scroll message
        scrollMessage.innerHTML = "";
        scrollMessage.style.display = 'none';
    }

    //Listen if user leaves the Q 
    scrollMessage.addEventListener("mouseleave", unrotate);
})


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

            // TODO: implement statistcs

            // Display a dad joke during the meantime
            const getDadJoke = async () => {
                const response = await fetch('https://icanhazdadjoke.com', { headers: { 'Accept': 'application/json' } });
                const myJson = await response.json();
                console.log(JSON.stringify(myJson));

                document.querySelector('#dad-joke').textContent = JSON.stringify(myJson.joke);
            }

            getDadJoke();

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

            break
        }
    }

    // update current menu
    currentMenu = pressedMenu;
});

// dark mode
const trans = () => {
    document.documentElement.classList.add('transition');
    window.setTimeout(() => document.documentElement.classList.remove('transition'), 1000)
}

const themeCheckbox = document.querySelector('input[name=themeCheckbox]');

themeCheckbox.addEventListener('change', e => {

    let quireData = quireIO.getData();

    if (themeCheckbox.checked) {
        trans();
        document.documentElement.setAttribute('data-theme', 'dark');
        quireData.settings.theme = 'dark';
    } else {
        trans();
        document.documentElement.setAttribute('data-theme', 'light');
        quireData.settings.theme = 'light';
    }

    quireIO.updateData(quireData);
});

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

searchInput.addEventListener('search', () => {
    if (searchStarred.checked || !searchInput.value == '') {
        searchString = searchInput.value;
        searchNotesList(searchString, searchStarred.checked);
    } else {
        renderNotesList();
    }
})

searchInput.addEventListener('keyup', (string) => {

    let searchString = '';
    let searchStar = searchStarred.checked;

    searchString += string.target.value;

    searchNotesList(searchString, searchStar);
})

searchStarred.addEventListener('click', (e) => {

    let searchString = searchInput.value;
    let searchStar = searchStarred.checked;

    searchNotesList(searchString, searchStar);
})

const checkSearchWords = (searchIn, arrSearchString) => {

    let result = true
    arrSearchString.forEach((searchWord, i) => {
        if (searchWord === arrSearchString[i + 1] && i < arrSearchString.length) searchWord += ' ' + arrSearchString[i + 1];
        if (!searchIn.toLowerCase().includes(searchWord.trim())) result = false;
    })
    return result;
}

const searchNotesList = (searchString = '', searchStar = false) => {

    let quireData = quireIO.getData();

    quireData.notes.sort((noteA, noteB) => Number(noteB.lastUpdated) - Number(noteA.lastUpdated));

    let notesList = document.querySelector('.note-list');
    notesList.innerHTML = '';
    let arrSearchString = [];

    if (searchString.includes(' ')) {
        arrSearchString.push(...searchString.trim().toLowerCase().split(' '));
    } else {
        arrSearchString.push(searchString.trim().toLowerCase());
    }

    quireData.notes.forEach(note => {

        let noteBody = parseNoteBodyHTML(note.body);

        // Check for separate search words

        // get title
        let noteTitle = getNotePreview(noteBody)[0];

        // get preview
        let notePreview = getNotePreview(noteBody)[1];

        // get date
        let noteDateTitle = getNoteDateTitle(note.lastUpdated);
        let noteDateISO = getNoteDateISO(note.lastUpdated);
        let NoteDateRelative = getNoteDateRelative(noteDateISO);

        // get tags
        let noteTagsHTML = '';
        let noteTagsList = '';

        if (note.tags.length > 0) {

            let tags = quireIO.getTags(note.id);

            tags.forEach(tag => {
                noteTagsHTML += `<li class="tag ${tag.color}" data-tagid="${tag.id}">
                                  <span>${tag.name}</span>
                                  <button class="tag-delete-button">x</button>
                              </li>`;
                noteTagsList += tag.name;
            });
        }

        let checkTags = checkSearchWords(noteTagsList, arrSearchString);
        let checkSearchString = checkSearchWords(noteBody, arrSearchString);

        if ((checkSearchString && (note.starred == true || note.starred == searchStar))
            || (checkTags && (note.starred == true || note.starred == searchStar))) {
            notesList.innerHTML +=
                `<li class="note-list-item ${quireData.currentNote === note.id ? "note-list-item-current" : ""}" data-id="${note.id}">
                    <div class="note-list-meta-container">
                        <time datetime="${noteDateISO}" title="${noteDateTitle}" class="note-list-date">${NoteDateRelative}</time>
                        <div class="note-list-icons">
                            <button class="tag-button" title="Add tags"></button>
                            <button class= "delete-button" title="Delete note"></button>
                            <div class="confirm-div hide" id="confirm-${note.id}">
                            <button class="confirm-buttons confirm" title="Confirm delete">Delete</button>
                            <button class="confirm-buttons cancel" title="Cancel delete">Cancel</button>
                            </div>
                            <input type="checkbox" name="star-${note.id}" id="star-${note.id}" class="starred-checkbox" ${note.starred ? "checked" : ""}>
                            <label for="star-${note.id}" title="${note.starred ? 'Unstar note' : 'Star note'}"></label>
                        </div>
                    </div>
                    <a href="#" class="note-list-link"><h3 class="note-list-title">${noteTitle}</h3></a>
                    <span class="note-list-preview">${notePreview}</span>
                    <ul class="note-list-tags">${noteTagsHTML}</ul>
                    <div class="note-list-add-tag-container hide" id="add-tag-container-${note.id}">
                        <input class="tag-input" type="text" id="tag-input-${note.id}" placeholder="Add tag..." />
                        <span class="tag-search-text"></span>
                        <ul class="tag-search-suggestions"></ul>
                    </div>
                  </li>`;
        }
    })

    if (notesList.innerHTML == '') {
        notesList.innerHTML =
            `<div class="note-list-no-results"><i>No ${(searchStar) ? "starred" : ""} notes 
        ${(searchString) ? 'with ' + '"' + searchString + '"' : ""} found.</i ></div>`;
    }
}