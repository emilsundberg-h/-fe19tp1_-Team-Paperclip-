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