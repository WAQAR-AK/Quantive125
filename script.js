// Smooth Scrolling for "Start Here" button
document.querySelector('.hero-bg a[href^="#"]').addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    document.querySelector(targetId).scrollIntoView({
        behavior: 'smooth'
    });
});

// --- Parameter Selection Modal Functionality ---
const selectParametersBtn = document.getElementById('select-parameters-btn');
const parameterModal = document.getElementById('parameter-modal');
const closeModalBtn = document.getElementById('close-modal');
const parameterList = document.getElementById('parameter-list');
const totalPercentageSpan = document.getElementById('total-percentage');
const addCustomParameterBtn = document.getElementById('add-custom-parameter-btn');
const customParameterNameInput = document.getElementById('custom-parameter-name');
const customParameterListDiv = document.getElementById('custom-parameter-list');
const saveParametersBtn = document.getElementById('save-parameters-btn');

// Variable to store saved parameters
let savedParameters = [];

// Open Parameter Modal
selectParametersBtn.addEventListener('click', function() {
    parameterModal.classList.remove('hidden');
});

// Close Parameter Modal
closeModalBtn.addEventListener('click', function() {
    parameterModal.classList.add('hidden');
});

// Close Parameter Modal if clicking outside the modal content
parameterModal.addEventListener('click', function(e) {
    if (e.target === parameterModal) {
        parameterModal.classList.add('hidden');
    }
});

// Calculate and Update Total Percentage
function updateTotalPercentage() {
    let total = 0;
    document.querySelectorAll('.parameter-item').forEach(item => {
        const checkbox = item.querySelector('.parameter-checkbox');
        const percentageInput = item.querySelector('.parameter-percentage');
        const percentage = parseInt(percentageInput.value) || 0;

         // Add percentage if it's a custom parameter (no checkbox) OR if it's a predefined parameter and the checkbox is checked
         if (!checkbox || (checkbox && checkbox.checked)) {
             total += percentage;
         }
    });
    totalPercentageSpan.textContent = total;

    // Optional: Provide feedback if total exceeds 100%
    if (total > 100) {
        totalPercentageSpan.classList.add('text-red-600');
        // You might want to disable the save button here
        // saveParametersBtn.disabled = true;
    } else {
         totalPercentageSpan.classList.remove('text-red-600');
         // You might want to enable the save button here
         // saveParametersBtn.disabled = false;
    }
}

// Event listeners for percentage inputs (including dynamically added custom ones)
parameterModal.addEventListener('input', function(e) {
    if (e.target.classList.contains('parameter-percentage')) {
        updateTotalPercentage();
    }
});

 // Event listeners for checkboxes (to include/exclude percentage from total)
parameterModal.addEventListener('change', function(e) {
    if (e.target.classList.contains('parameter-checkbox')) {
        updateTotalPercentage();
    }
});


// Add Custom Parameter
addCustomParameterBtn.addEventListener('click', function() {
    const paramName = customParameterNameInput.value.trim();
    if (paramName) {
        const customParamDiv = document.createElement('div');
        customParamDiv.classList.add('parameter-item');
        // Custom parameters do not have a checkbox
        customParamDiv.innerHTML = `
            <label>${paramName}</label>
            <input type="number" class="parameter-percentage" value="0" min="0" max="100"> %
        `;
        customParameterListDiv.appendChild(customParamDiv);
        customParameterNameInput.value = ''; // Clear input
        updateTotalPercentage(); // Update total after adding
    }
});

// Save Parameters
saveParametersBtn.addEventListener('click', function() {
    const total = parseInt(totalPercentageSpan.textContent);
    if (total > 100) {
        alert('Total percentage cannot exceed 100%. Please adjust.');
        return; // Prevent saving if over 100%
    }

    savedParameters = []; // Clear previous saved parameters
    document.querySelectorAll('.parameter-item').forEach(item => {
        const checkbox = item.querySelector('.parameter-checkbox');
        const percentageInput = item.querySelector('.parameter-percentage');
        const paramName = checkbox ? checkbox.dataset.parameterName : item.querySelector('label').textContent;
        const percentage = parseInt(percentageInput.value) || 0;

         // Include if it's a custom parameter (no checkbox) OR if it's a predefined parameter and the checkbox is checked
         if (!checkbox || (checkbox && checkbox.checked)) {
             savedParameters.push({
                 name: paramName,
                 percentage: percentage
             });
         }
    });

    console.log('Saved Parameters:', savedParameters);
    alert('Parameters saved!');
    parameterModal.classList.add('hidden'); // Close modal after saving
});


// Initial calculation on load
updateTotalPercentage();


// --- Form Editor Functionality ---
const addQuestionBtn = document.getElementById('add-question-btn');
const manualQuestionsArea = document.getElementById('manual-questions-area');
const noQuestionsPlaceholder = document.getElementById('no-questions-placeholder');
const formActionButtonsDiv = document.getElementById('form-action-buttons');
const publishedFormLinksDiv = document.getElementById('published-form-links');
const publishFormBtn = document.getElementById('publish-form-btn'); // Renamed from createFormBtn
const responsesLinkBtn = document.getElementById('responses-link-btn');
const respondersLinkCopyBtn = document.getElementById('responders-link-copy-btn');
const respondersLinkOpenBtn = document.getElementById('responders-link-open-btn');
const copyFeedbackSpan = document.getElementById('copy-feedback');
const generateQuestionsBtn = document.getElementById('generate-questions-btn'); // New button
const aiSuggestedQuestionsArea = document.getElementById('ai-suggested-questions'); // AI suggestions area


// Array to hold the form questions data
let formQuestions = [];
let questionCounter = 0; // Simple counter for unique IDs

// Function to render a single editable question block
function renderQuestion(question) {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('editable-question');
    questionDiv.dataset.questionId = question.id; // Store the question ID

    questionDiv.innerHTML = `
        <div class="question-header">
            <input type="text" class="question-text-input" value="${question.text}" placeholder="Enter your question here">
            <select class="question-type-select">
                <option value="text">Text</option>
                <option value="textarea">Paragraph</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="date">Date</option>
                <option value="file">File Upload</option>
                <option value="radio">Multiple Choice</option>
                <option value="checkbox">Checkboxes</option>
            </select>
             <span class="delete-btn fas fa-times text-red-500 cursor-pointer" data-question-id="${question.id}"></span>
        </div>
        <div class="options-area">
            </div>
    `;

    // Set the selected value for the type dropdown
    questionDiv.querySelector('.question-type-select').value = question.type;

    // Add event listeners to the new elements
    const questionTextInput = questionDiv.querySelector('.question-text-input');
    const questionTypeSelect = questionDiv.querySelector('.question-type-select');
    const deleteBtn = questionDiv.querySelector('.delete-btn');

    // Update question text in data structure
    questionTextInput.addEventListener('input', (e) => {
        const questionId = questionDiv.dataset.questionId;
        const questionIndex = formQuestions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
            formQuestions[questionIndex].text = e.target.value;
        }
    });

    // Update question type in data structure and render options area
    questionTypeSelect.addEventListener('change', (e) => {
        const questionId = questionDiv.dataset.questionId;
        const questionIndex = formQuestions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
            formQuestions[questionIndex].type = e.target.value;
            // Clear existing options and re-render based on new type
            formQuestions[questionIndex].options = []; // Clear options when type changes
            renderOptionsArea(questionDiv, formQuestions[questionIndex]);
        }
    });

     // Delete question
    deleteBtn.addEventListener('click', () => {
        const questionIdToDelete = deleteBtn.dataset.questionId;
        formQuestions = formQuestions.filter(q => q.id !== questionIdToDelete);
        questionDiv.remove(); // Remove the HTML element
        updateNoQuestionsPlaceholder(); // Check if placeholder should be shown
    });

    // Initial render of options area based on type
    renderOptionsArea(questionDiv, question);

    return questionDiv;
}

// Function to render the options area for choice-based questions
function renderOptionsArea(questionDiv, question) {
    const optionsArea = questionDiv.querySelector('.options-area');
    optionsArea.innerHTML = ''; // Clear existing options

    if (question.type === 'radio' || question.type === 'checkbox') {
        const optionsHeader = document.createElement('h4');
        optionsHeader.classList.add('text-sm', 'font-semibold', 'mb-2');
        optionsHeader.textContent = 'Options:';
        optionsArea.appendChild(optionsHeader);

        const optionsListDiv = document.createElement('div');
        optionsListDiv.classList.add('options-list');
        optionsArea.appendChild(optionsListDiv);

        // Render existing options
        question.options.forEach((optionText, index) => {
             renderOptionItem(optionsListDiv, question.id, optionText, index);
        });


        const addOptionBtn = document.createElement('button');
        addOptionBtn.classList.add('add-option-btn');
        addOptionBtn.textContent = '+ Add Option';
        optionsArea.appendChild(addOptionBtn);

        // Add event listener for adding new options
        addOptionBtn.addEventListener('click', () => {
            const questionId = questionDiv.dataset.questionId;
            const questionIndex = formQuestions.findIndex(q => q.id === questionId);
            if (questionIndex !== -1) {
                 const newOptionText = ''; // Start with a blank option
                 formQuestions[questionIndex].options.push(newOptionText);
                 renderOptionItem(optionsListDiv, questionId, newOptionText, formQuestions[questionIndex].options.length - 1);
            }
        });
    }
     // For other types, the optionsArea remains empty
}

// Function to render a single option item (for choice-based questions)
function renderOptionItem(optionsListDiv, questionId, optionText, optionIndex) {
    const optionItemDiv = document.createElement('div');
    optionItemDiv.classList.add('option-item');
    optionItemDiv.dataset.optionIndex = optionIndex; // Store the option index

    optionItemDiv.innerHTML = `
        <input type="text" class="option-text-input" value="${optionText}" placeholder="Option text">
        <span class="delete-option-btn fas fa-times text-red-500 cursor-pointer"></span>
    `;

    optionsListDiv.appendChild(optionItemDiv);

    const optionTextInput = optionItemDiv.querySelector('.option-text-input');
    const deleteOptionBtn = optionItemDiv.querySelector('.delete-option-btn');

    // Update option text in data structure
    optionTextInput.addEventListener('input', (e) => {
        const questionIndex = formQuestions.findIndex(q => q.id === questionId);
        const optionIndex = parseInt(optionItemDiv.dataset.optionIndex);
         if (questionIndex !== -1 && formQuestions[questionIndex].options[optionIndex] !== undefined) {
             formQuestions[questionIndex].options[optionIndex] = e.target.value;
         }
    });

    // Delete option
    deleteOptionBtn.addEventListener('click', () => {
        const questionIndex = formQuestions.findIndex(q => q.id === questionId);
        const optionIndexToDelete = parseInt(optionItemDiv.dataset.optionIndex);
         if (questionIndex !== -1 && formQuestions[questionIndex].options[optionIndexToDelete] !== undefined) {
             formQuestions[questionIndex].options.splice(optionIndexToDelete, 1);
             optionItemDiv.remove(); // Remove the HTML element
             // Re-render options area to update indices (simpler than re-indexing manually)
             renderOptionsArea(manualQuestionsArea.querySelector(`.editable-question[data-question-id="${questionId}"]`), formQuestions[questionIndex]);
         }
    });
}


// Function to update the visibility of the "no questions" placeholder
function updateNoQuestionsPlaceholder() {
    if (formQuestions.length === 0) {
        noQuestionsPlaceholder.classList.remove('hidden');
    } else {
        noQuestionsPlaceholder.classList.add('hidden');
    }
}


// Event listener for the "Add Question Manually" button
addQuestionBtn.addEventListener('click', function() {
    questionCounter++; // Increment counter for unique ID
    const newQuestion = {
        id: `q${questionCounter}`, // Simple unique ID
        text: '',
        type: 'text', // Default type
        options: [],
        required: false // Default to not required
    };
    formQuestions.push(newQuestion); // Add to data structure
    const questionElement = renderQuestion(newQuestion); // Render the HTML
    manualQuestionsArea.appendChild(questionElement); // Add to the DOM
    updateNoQuestionsPlaceholder(); // Hide placeholder
});


// --- AI Question Generation Functionality ---
generateQuestionsBtn.addEventListener('click', async function() {
    const formTitle = document.getElementById('form-title').value;
    const specialInstructions = document.getElementById('special-instructions').value;

    if (!formTitle) {
        alert('Please enter a form title before generating questions.');
        return;
    }

    if (savedParameters.length === 0) {
        alert('Please select and save parameters before generating questions.');
        return;
    }

    // Show a loading indicator (optional)
    generateQuestionsBtn.textContent = 'Generating...';
    generateQuestionsBtn.disabled = true;
    aiSuggestedQuestionsArea.innerHTML = '<p class="text-gray-600 italic">Generating questions...</p>';


    // Data to send to the backend
    const generationData = {
        title: formTitle,
        instructions: specialInstructions,
        parameters: savedParameters
    };

    try {
        // Send data to the Node.js backend endpoint
        // With the Node.js server serving static files,
        // the relative path '/generate-questions' should work
        // if the frontend is accessed via the Node.js server's URL.
        const response = await fetch('/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(generationData),
        });

        if (!response.ok) {
            // Handle HTTP errors
             const errorText = await response.text();
            throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const generatedQuestions = await response.json(); // Assuming backend returns JSON array of questions

        console.log('Generated Questions:', generatedQuestions);

        // Clear previous suggestions
        aiSuggestedQuestionsArea.innerHTML = '';

        if (generatedQuestions && generatedQuestions.length > 0) {
            generatedQuestions.forEach(suggestion => {
                // Basic validation/defaulting for AI response structure
                if (!suggestion.type) {
                    console.warn("AI suggestion missing type, defaulting to 'text':", suggestion);
                    suggestion.type = 'text';
                }
                 if ((suggestion.type === 'radio' || suggestion.type === 'checkbox') && !Array.isArray(suggestion.options)) {
                     console.warn(`AI suggestion type is ${suggestion.type} but options is not an array, defaulting to empty array:`, suggestion);
                     suggestion.options = [];
                 } else if (suggestion.type !== 'radio' && suggestion.type !== 'checkbox' && suggestion.options !== undefined) {
                     console.warn(`AI suggestion type is ${suggestion.type} but includes options, ignoring options:`, suggestion);
                     delete suggestion.options; // Remove options if type doesn't support it
                 }


                renderSuggestedQuestion(suggestion); // Render each suggested question
            });
        } else {
            aiSuggestedQuestionsArea.innerHTML = '<p class="text-gray-600 italic">No questions were generated based on your input.</p>';
        }

    } catch (error) {
        console.error('Error generating questions:', error);
        aiSuggestedQuestionsArea.innerHTML = `<p class="text-red-600 italic">Error generating questions: ${error.message}</p>`;
    } finally {
        // Reset button state
        generateQuestionsBtn.textContent = 'Generate Questions';
        generateQuestionsBtn.disabled = false;
    }
});


// Function to render a single AI suggested question
function renderSuggestedQuestion(suggestion) {
    const suggestionDiv = document.createElement('div');
    suggestionDiv.classList.add('ai-suggested-question');
    // Store suggestion data for easy access when accepting
    suggestionDiv.dataset.questionText = suggestion.text;
    suggestionDiv.dataset.questionType = suggestion.type;
    // Assuming options might be returned for choice types
    if (suggestion.options) {
         suggestionDiv.dataset.questionOptions = JSON.stringify(suggestion.options);
    }


    suggestionDiv.innerHTML = `
        <div class="question-text">${suggestion.text}</div>
        <div class="question-type-label">(${suggestion.type})</div>
        <div class="action-buttons">
            <button class="accept-btn">Accept</button>
            <button class="reject-btn">Reject</button>
        </div>
    `;

    const acceptBtn = suggestionDiv.querySelector('.accept-btn');
    const rejectBtn = suggestionDiv.querySelector('.reject-btn');

    // Event listener for Accept button
    acceptBtn.addEventListener('click', () => {
        // Add the accepted question to the main formQuestions array
        questionCounter++; // Ensure unique ID
        const acceptedQuestion = {
            id: `q${questionCounter}`,
            text: suggestionDiv.dataset.questionText,
            type: suggestionDiv.dataset.questionType,
            options: suggestionDiv.dataset.questionOptions ? JSON.parse(suggestionDiv.dataset.questionOptions) : [],
            required: false // Default to not required
        };
        formQuestions.push(acceptedQuestion);
        const questionElement = renderQuestion(acceptedQuestion); // Render in editor area
        manualQuestionsArea.appendChild(questionElement);
        updateNoQuestionsPlaceholder(); // Hide placeholder if needed

        // Remove the suggestion from the AI suggestions area
        suggestionDiv.remove();
         if (aiSuggestedQuestionsArea.children.length === 0) {
             aiSuggestedQuestionsArea.innerHTML = '<p class="text-gray-600 italic">No AI suggestions available.</p>';
         }
    });

    // Event listener for Reject button
    rejectBtn.addEventListener('click', () => {
        // Simply remove the suggestion from the AI suggestions area
        suggestionDiv.remove();
         if (aiSuggestedQuestionsArea.children.length === 0) {
             aiSuggestedQuestionsArea.innerHTML = '<p class="text-gray-600 italic">No AI suggestions available.</p>';
         }
    });

    aiSuggestedQuestionsArea.appendChild(suggestionDiv);
     // Remove the initial italic placeholder if suggestions are added
     const initialPlaceholder = aiSuggestedQuestionsArea.querySelector('p.italic');
     if (initialPlaceholder) {
         initialPlaceholder.remove();
     }
}


// --- Form Preview Modal Functionality ---
const previewFormBtn = document.getElementById('preview-form-btn');
const previewModal = document.getElementById('preview-modal');
const closePreviewModalBtn = document.getElementById('close-preview-modal');
const formPreviewContent = document.getElementById('form-preview-content');
const previewFormTitleDiv = document.getElementById('preview-form-title');
const previewFormDescriptionDiv = document.getElementById('preview-form-description');
const previewFormQuestionsDiv = document.getElementById('preview-form-questions');

// Open Preview Modal
previewFormBtn.addEventListener('click', function() {
    buildFormPreview(); // Build the preview content before showing
    previewModal.classList.remove('hidden');
});

// Close Preview Modal
closePreviewModalBtn.addEventListener('click', function() {
    previewModal.classList.add('hidden');
});

// Close Preview Modal if clicking outside the modal content
previewModal.addEventListener('click', function(e) {
    if (e.target === previewModal) {
        previewModal.classList.add('hidden');
    }
});

// Function to build the form preview content based on formQuestions data
function buildFormPreview() {
    // Clear previous preview content (except the title/description containers)
    previewFormQuestionsDiv.innerHTML = '';

    // Get form title and special instructions
    const formTitle = document.getElementById('form-title').value || 'Untitled Form';
    const specialInstructions = document.getElementById('special-instructions').value || '';

    // Update preview title and description
    previewFormTitleDiv.textContent = formTitle;
    previewFormDescriptionDiv.textContent = specialInstructions;

    // Iterate through the formQuestions array and build preview HTML
    formQuestions.forEach((question, index) => { // Added index for unique preview delete button ID
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('preview-question');
        questionDiv.dataset.previewQuestionIndex = index; // Store index for deletion

        const label = document.createElement('label');
        label.textContent = question.text;
        questionDiv.appendChild(label);

        // Add input/options based on question type
        if (question.type === 'text') {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Your answer';
            input.disabled = true; // Disable input in preview
            questionDiv.appendChild(input);
        } else if (question.type === 'textarea') {
            const textarea = document.createElement('textarea');
            textarea.rows = 3;
            textarea.placeholder = 'Your answer';
             textarea.disabled = true; // Disable textarea in preview
            questionDiv.appendChild(textarea);
        } else if (question.type === 'number') {
             const input = document.createElement('input');
            input.type = 'number';
            input.placeholder = 'Enter a number';
             input.disabled = true; // Disable input in preview
            questionDiv.appendChild(input);
        } else if (question.type === 'email') {
             const input = document.createElement('input');
            input.type = 'email';
            input.placeholder = 'Your email';
             input.disabled = true; // Disable input in preview
            questionDiv.appendChild(input);
        } else if (question.type === 'date') {
             const input = document.createElement('input');
            input.type = 'date';
             input.disabled = true; // Disable input in preview
            questionDiv.appendChild(input);
        } else if (question.type === 'file') {
             const input = document.createElement('input');
            input.type = 'file';
             input.disabled = true; // Disable input in preview
            questionDiv.appendChild(input);
        }
        else if ((question.type === 'radio' || question.type === 'checkbox') && question.options && question.options.length > 0) {
            const optionsDiv = document.createElement('div');
            optionsDiv.classList.add('options');
            question.options.forEach(optionText => {
                const optionLabel = document.createElement('label');
                const optionInput = document.createElement('input');
                optionInput.type = question.type; // Use radio or checkbox type
                optionInput.name = 'preview-question-' + question.id; // Group radio buttons by question ID in preview
                 optionInput.disabled = true; // Disable input in preview
                optionLabel.appendChild(optionInput);
                optionLabel.appendChild(document.createTextNode(optionText));
                optionsDiv.appendChild(optionLabel);
            });
             questionDiv.appendChild(optionsDiv);
        }

        // Add delete button to preview question
        const deletePreviewBtn = document.createElement('span');
        deletePreviewBtn.classList.add('delete-preview-btn', 'fas', 'fa-times');
        deletePreviewBtn.dataset.previewQuestionIndex = index; // Store index for deletion
        deletePreviewBtn.title = 'Remove from preview';
        questionDiv.appendChild(deletePreviewBtn);

        // Add event listener for deleting from preview
        deletePreviewBtn.addEventListener('click', (e) => {
            const indexToDelete = parseInt(e.target.dataset.previewQuestionIndex);
            // Remove the question from the preview display only
            e.target.closest('.preview-question').remove();
            // Note: This does NOT remove it from the formQuestions array
            console.log(`Question at index ${indexToDelete} removed from preview.`);
            // You might want to re-index the preview questions visually after deletion
            // if you plan to allow multiple preview deletions without closing the modal.
            // For simplicity here, we just remove the element.
        });


        previewFormQuestionsDiv.appendChild(questionDiv);
    });
}


 // --- Form Publishing Functionality ---
// Renamed from createFormBtn
publishFormBtn.addEventListener('click', function() {
    const formTitle = document.getElementById('form-title').value;
    const specialInstructions = document.getElementById('special-instructions').value;

    if (!formTitle) {
        alert('Please enter a form title before publishing.');
        return;
    }
    if (formQuestions.length === 0) {
         alert('Please add at least one question before publishing.');
         return;
    }


    const formStructure = {
        title: formTitle,
        instructions: specialInstructions,
        questions: formQuestions, // Use the actual form questions data
        createdAt: firebase.database.ServerValue.TIMESTAMP // Add a timestamp
    };

    console.log('Form Structure to Publish:', formStructure);
    alert('Attempting to publish form...');


    // --- Firebase Saving Logic (Client-side - INSECURE for production) ---
    // WARNING: Storing credentials directly in frontend code is INSECURE for production.
    // This is for demonstration purposes only.
    const database = firebase.database();
    const formsRef = database.ref('forms');

    // Use push() to generate a unique key (form ID)
    formsRef.push(formStructure)
        .then((snapshot) => {
            const formId = snapshot.key; // Get the unique key generated by push()
            console.log('Form published successfully with ID:', formId);
            alert('Form published successfully!');

            // Construct the links (assuming your responder and results pages use query parameters)
            // Replace with your actual domain and page names
            const currentDomain = window.location.origin; // Gets http://localhost:port or your domain
            // Using a simple query parameter for now. In a real app, consider clean URLs.
            const responderLink = `${currentDomain}/form.html?formId=${formId}`; // Assuming you'll create form.html
            const responsesLink = `${currentDomain}/results.html?formId=${formId}`; // Assuming you'll create results.html

            // Update the links and show the published links section
            responsesLinkBtn.href = responsesLink;
            responsesLinkBtn.target = '_blank'; // Open in new tab

            respondersLinkCopyBtn.dataset.linkToCopy = responderLink; // Store link for copying
            respondersLinkOpenBtn.dataset.linkToOpen = responderLink; // Store link for opening
            respondersLinkOpenBtn.href = responderLink; // Set href for opening
            respondersLinkOpenBtn.target = '_blank'; // Open in new tab


            // Hide action buttons and show published links
            formActionButtonsDiv.classList.add('hidden');
            publishedFormLinksDiv.classList.remove('hidden');

        })
        .catch((error) => {
            console.error('Firebase publish error:', error);
            alert('Failed to publish form. Check console for details.');
        });

});

// --- Copy Responder Link Functionality ---
respondersLinkCopyBtn.addEventListener('click', function() {
    const linkToCopy = this.dataset.linkToCopy;
    if (linkToCopy) {
        navigator.clipboard.writeText(linkToCopy).then(() => {
            console.log('Responder link copied:', linkToCopy);
            copyFeedbackSpan.textContent = 'Link copied!';
            copyFeedbackSpan.classList.remove('hidden');
            // Hide feedback after a short delay
            setTimeout(() => {
                copyFeedbackSpan.classList.add('hidden');
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            copyFeedbackSpan.textContent = 'Failed to copy link.';
             copyFeedbackSpan.classList.remove('hidden');
            copyFeedbackSpan.classList.add('text-red-600'); // Indicate error
             setTimeout(() => {
                copyFeedbackSpan.classList.add('hidden');
                 copyFeedbackSpan.classList.remove('text-red-600');
            }, 3000);
        });
    }
});


// --- Firebase Initialization Placeholder ---
// WARNING: Storing credentials directly in frontend code is INSECURE for production.
// Replace with your actual Firebase configuration.
// For production, load this config securely (e.g., from environment variables
// on your backend, or use Firebase Hosting environment config).
// DO NOT hardcode sensitive keys here in a production app.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your actual API Key
    authDomain: "YOUR_AUTH_DOMAIN", // Replace with your actual Auth Domain
    databaseURL: "YOUR_DATABASE_URL", // Replace with your actual Database URL
    projectId: "YOUR_PROJECT_ID", // Replace with your actual Project ID
    storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your actual Storage Bucket
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual Messaging Sender ID
    appId: "YOUR_APP_ID" // Replace with your actual App ID
};

// Initialize Firebase (only if it hasn't been initialized already)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized (using placeholder config).");
} else {
    firebase.app(); // if already initialized, use that app
    console.log("Firebase already initialized.");
}

// You can now get a reference to the database (if using client-side SDK)
// const database = firebase.database();
// console.log("Firebase Database reference obtained.");

