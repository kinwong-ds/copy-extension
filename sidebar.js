// sidebar.js

const snippetInput = document.getElementById('snippet-input');
const groupInput = document.getElementById('group-input'); // New group input
const addSnippetBtn = document.getElementById('add-snippet-btn');
const snippetsList = document.getElementById('snippets-list');

const UNGROUPED_KEY = '__ungrouped__'; // Key for snippets without a group

// --- Storage Functions ---

// Function to get snippet groups from storage
async function getSnippetGroups() {
    // Structure: { "groupName": ["snippet1", "snippet2"], "__ungrouped__": ["snippet3"] }
    const result = await chrome.storage.local.get(['snippetGroups']);
    return result.snippetGroups || {}; // Return groups object or empty object
}

// Function to save snippet groups to storage
async function saveSnippetGroups(groups) {
    await chrome.storage.local.set({ snippetGroups: groups }); // Corrected: Pass the 'groups' variable
}

// --- Display Functions ---

// Function to display snippets, organized by group
async function displaySnippets() {
    const groups = await getSnippetGroups();
    snippetsList.innerHTML = ''; // Clear the current list

    const groupNames = Object.keys(groups).sort((a, b) => {
        // Keep ungrouped at the end or beginning if preferred
        if (a === UNGROUPED_KEY) return 1;
        if (b === UNGROUPED_KEY) return -1;
        return a.localeCompare(b); // Sort other groups alphabetically
    });

    if (groupNames.length === 0) {
        snippetsList.textContent = 'No snippets saved yet.';
        return;
    }

    groupNames.forEach(groupName => {
        const snippets = groups[groupName];
        if (!snippets || snippets.length === 0) {
            // Don't display empty groups (might happen after deletion)
            return;
        }

        const groupContainer = document.createElement('div');
        groupContainer.classList.add('snippet-group');

        const groupHeader = document.createElement('h3');
        groupHeader.textContent = groupName === UNGROUPED_KEY ? 'Ungrouped' : groupName;

        // Add delete button for the group (except for ungrouped)
        if (groupName !== UNGROUPED_KEY) {
            const deleteGroupBtn = document.createElement('button');
            deleteGroupBtn.classList.add('delete-group-btn');
            deleteGroupBtn.textContent = 'Delete Group';
            deleteGroupBtn.title = `Delete group "${groupName}"`;
            deleteGroupBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteGroup(groupName);
            });
            groupHeader.appendChild(deleteGroupBtn);
        }

        groupContainer.appendChild(groupHeader);

        const groupContent = document.createElement('div');
        groupContent.classList.add('snippet-group-content');

        snippets.forEach((snippetText, index) => {
            const snippetDiv = document.createElement('div');
            snippetDiv.classList.add('snippet-item');
            snippetDiv.textContent = snippetText;

            // Add click listener for copying
            snippetDiv.addEventListener('click', (event) => {
                if (event.target.classList.contains('delete-btn')) return;
                copySnippet(snippetText, snippetDiv);
            });

            // Add delete button for individual snippet
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'X';
            deleteBtn.title = 'Delete snippet';
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteSnippet(groupName, index);
            });

            snippetDiv.appendChild(deleteBtn);
            groupContent.appendChild(snippetDiv);
        });

        groupContainer.appendChild(groupContent);
        snippetsList.appendChild(groupContainer);
    });
}

// --- Action Functions ---

// Function to add a new snippet (now considers group)
async function addSnippet() {
    const text = snippetInput.value.trim();
    const groupName = groupInput.value.trim() || UNGROUPED_KEY; // Use special key if no group entered

    if (text) {
        const groups = await getSnippetGroups();

        // Ensure the group array exists
        if (!groups[groupName]) {
            groups[groupName] = [];
        }

        groups[groupName].push(text); // Add the new snippet to the correct group
        await saveSnippetGroups(groups);

        snippetInput.value = ''; // Clear the snippet input
        groupInput.value = ''; // Clear the group input
        await displaySnippets(); // Refresh the displayed list
    } else {
        console.log("Snippet input is empty.");
    }
}

// Function to copy snippet text to clipboard (no change needed here)
function copySnippet(text, element) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Snippet copied to clipboard!');
        element.classList.add('copied');
        setTimeout(() => {
            element.classList.remove('copied');
        }, 500);
    }).catch(err => {
        console.error('Failed to copy snippet: ', err);
    });
}

// Function to delete an individual snippet from a specific group
async function deleteSnippet(groupName, indexToDelete) {
    let groups = await getSnippetGroups();
    if (groups[groupName]) {
        // Remove the snippet at the specified index from the group's array
        groups[groupName] = groups[groupName].filter((_, index) => index !== indexToDelete);

        // Optional: Remove the group if it becomes empty (except ungrouped)
        if (groupName !== UNGROUPED_KEY && groups[groupName].length === 0) {
            delete groups[groupName];
        }

        await saveSnippetGroups(groups);
        await displaySnippets(); // Refresh the list
    } else {
        console.error(`Group "${groupName}" not found for deletion.`);
    }
}

// Function to delete an entire group
async function deleteGroup(groupName) {
    // Prevent deleting the special ungrouped key directly
    if (groupName === UNGROUPED_KEY) {
        console.warn("Cannot delete the 'Ungrouped' section directly. Delete individual snippets instead.");
        return;
    }

    let groups = await getSnippetGroups();
    if (groups[groupName]) {
        // Optional: Confirm before deleting a group?
        // if (!confirm(`Are you sure you want to delete the group "${groupName}" and all its snippets?`)) {
        //     return;
        // }
        delete groups[groupName]; // Remove the entire group entry
        await saveSnippetGroups(groups);
        await displaySnippets(); // Refresh the list
    } else {
        console.error(`Group "${groupName}" not found for deletion.`);
    }
}


// --- Event Listeners ---

// Add listener for the "Add Snippet" button
addSnippetBtn.addEventListener('click', addSnippet);

// Add listener for pressing Enter in the snippet textarea
snippetInput.addEventListener('keypress', (event) => {
    // Add snippet if Enter is pressed without Shift key
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent default newline insertion
        addSnippet();
    }
});

// Add listener for pressing Enter in the group input field
groupInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addSnippet(); // Add snippet when Enter is pressed in group input too
    }
});


// --- Initial Load ---

// Load and display snippets when the sidebar opens
displaySnippets();