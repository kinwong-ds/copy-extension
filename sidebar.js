// sidebar.js

const snippetInput = document.getElementById('snippet-input');
const addSnippetBtn = document.getElementById('add-snippet-btn');
const snippetsList = document.getElementById('snippets-list');

// --- Storage Functions ---

// Function to get snippets from storage
async function getSnippets() {
    const result = await chrome.storage.local.get(['snippets']);
    return result.snippets || []; // Return snippets array or empty array if none exist
}

// Function to save snippets to storage
async function saveSnippets(snippets) {
    await chrome.storage.local.set({ snippets });
}

// --- Display Functions ---

// Function to display snippets in the list
async function displaySnippets() {
    const snippets = await getSnippets();
    snippetsList.innerHTML = ''; // Clear the current list

    if (snippets.length === 0) {
        snippetsList.textContent = 'No snippets saved yet.';
        return;
    }

    snippets.forEach((snippetText, index) => {
        const snippetDiv = document.createElement('div');
        snippetDiv.classList.add('snippet-item');
        snippetDiv.textContent = snippetText; // Use textContent to preserve formatting like line breaks

        // Add click listener for copying
        snippetDiv.addEventListener('click', (event) => {
            // Prevent copy if delete button was clicked
            if (event.target.classList.contains('delete-btn')) {
                return;
            }
            copySnippet(snippetText, snippetDiv);
        });

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = 'X'; // Simple 'X' for delete
        deleteBtn.title = 'Delete snippet';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the copy listener on the parent div
            deleteSnippet(index);
        });

        snippetDiv.appendChild(deleteBtn);
        snippetsList.appendChild(snippetDiv);
    });
}

// --- Action Functions ---

// Function to add a new snippet
async function addSnippet() {
    const text = snippetInput.value.trim();
    if (text) {
        const snippets = await getSnippets();
        snippets.push(text); // Add the new snippet to the end
        await saveSnippets(snippets);
        snippetInput.value = ''; // Clear the input area
        await displaySnippets(); // Refresh the displayed list
    } else {
        // Optional: Add feedback if the input is empty
        console.log("Snippet input is empty.");
    }
}

// Function to copy snippet text to clipboard
function copySnippet(text, element) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Snippet copied to clipboard!');
        // Provide visual feedback
        element.classList.add('copied');
        setTimeout(() => {
            element.classList.remove('copied');
        }, 500); // Remove feedback after 0.5 seconds
    }).catch(err => {
        console.error('Failed to copy snippet: ', err);
        // Optional: Show an error message to the user
    });
}

// Function to delete a snippet
async function deleteSnippet(indexToDelete) {
    let snippets = await getSnippets();
    // Filter out the snippet at the specified index
    snippets = snippets.filter((_, index) => index !== indexToDelete);
    await saveSnippets(snippets);
    await displaySnippets(); // Refresh the list
}


// --- Event Listeners ---

// Add listener for the "Add Snippet" button
addSnippetBtn.addEventListener('click', addSnippet);

// Add listener for pressing Enter in the textarea (optional, can be convenient)
// snippetInput.addEventListener('keypress', (event) => {
//     // Check if Enter is pressed without Shift key (for multi-line input)
//     if (event.key === 'Enter' && !event.shiftKey) {
//         event.preventDefault(); // Prevent default newline insertion
//         addSnippet();
//     }
// });

// --- Initial Load ---

// Load and display snippets when the sidebar opens
displaySnippets();