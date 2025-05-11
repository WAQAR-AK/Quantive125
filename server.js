// server.js
const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path'); // Needed to serve static files

// Load environment variables from .env file
dotenv.config();

const app = express();
// Use process.env.PORT on platforms like Glitch, default to 3000 for local development
const port = process.env.PORT || 3000;

// --- Configure the Gemini API ---
// Load the API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI;
let model;

if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY not found in environment variables.");
    console.error("Please ensure you have added GEMINI_API_KEY in your hosting platform's secrets/environment variables.");
    // Do NOT throw an error here, allow the server to start but the AI route will fail gracefully.
} else {
    try {
        // Initialize the GoogleGenerativeAI client
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // Choose a suitable model. 'gemini-pro' is a good general-purpose model.
        // You might explore other models depending on your needs.
        // Check model availability and capabilities in the Gemini API documentation.
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("Gemini model configured successfully.");
    } catch (e) {
        console.error(`Error configuring Gemini model: ${e.message}`);
        model = null; // Set model to null if configuration fails
    }
}


// --- Middleware ---
// Parse incoming JSON requests
app.use(express.json());
// Serve static files from the root directory (where index.html, style.css, script.js are)
// This makes your frontend files accessible when the Node.js server is running.
app.use(express.static(path.join(__dirname, '')));


// --- Routes ---

// Basic root route to serve the main HTML file
app.get('/', (req, res) => {
    // Serve the index.html file when accessing the root URL
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Endpoint to generate questions using Gemini
app.post('/generate-questions', async (req, res) => {
    // Check if the Gemini model was configured successfully
    if (!model) {
        console.error("Gemini API not configured. Cannot generate questions.");
        return res.status(503).json({ error: "AI service is not available. Please check backend configuration (API key)." }); // Service Unavailable
    }

    try {
        const { title, instructions, parameters } = req.body;

        console.log("Received data for generation:");
        console.log("Title:", title);
        console.log("Instructions:", instructions);
        console.log("Parameters:", parameters);

        // --- Prompt Construction Logic ---
        // This prompt is designed to guide Gemini to generate questions
        // based on the provided title, instructions, and parameters,
        // considering the weightage and outputting in a specific JSON format.

        const parameterListStr = parameters && parameters.length > 0
            ? parameters.map(p => `- ${p.name}: ${p.percentage}% importance`).join('\n')
            : 'No specific parameters provided. Generate general questions relevant to the title and instructions.';

        // Determine minimum number of questions. Default to 7 if not specified in instructions.
        let minQuestions = 7;
        // Use a regular expression to find a number followed by "questions" (case-insensitive)
        const match = instructions.match(/generate\s+(\d+)\s+questions/i);
        if (match && match[1]) {
            try {
                minQuestions = parseInt(match[1]);
                console.log(`Found minimum questions in instructions: ${minQuestions}`);
            } catch (e) {
                console.warn("Could not parse number of questions from instructions, defaulting to 7.", e);
                minQuestions = 7; // Fallback if parsing fails
            }
        }


        const prompt = `
        You are an AI assistant that generates questions for a form, specifically for hiring or applications.
        Generate form questions based on the following criteria and priorities:

        **Form Title:** ${title}
        **Special Instructions:** ${instructions || 'None provided.'}
        **Key Skills/Parameters and their importance weightage (Total weightage is 100%):**
        ${parameterListStr}

        Generate exactly ${minQuestions} questions, or more if needed to cover the parameters adequately.
        Ensure the number and focus of the questions are proportional to the importance weightages of the parameters provided. For example, if 'Work Experience' has a 50% weightage, approximately half of the generated questions should focus on work history, past projects, roles, etc. If a parameter has 0% weightage, generate no questions related to that parameter.

        For each question, provide a suggested answer type from the following list: 'text', 'textarea', 'number', 'email', 'date', 'file', 'radio', 'checkbox'.
        If the suggested type is 'radio' or 'checkbox', provide a reasonable list of relevant options as an array of strings.

        Format the output strictly as a JSON array of objects. Each object must have the following keys:
        - 'text': The question text (string).
        - 'type': The suggested answer type (string from the allowed list).
        - 'options': An array of strings (only required for 'radio' and 'checkbox' types). If the type is not 'radio' or 'checkbox', this key should be omitted or be an empty array.

        Example JSON format:
        [
          {
            "text": "What is your full name?",
            "type": "text"
          },
          {
            "text": "Describe your previous work experience.",
            "type": "textarea"
          },
          {
            "text": "What is your preferred contact email?",
            "type": "email"
          },
           {
            "text": "Which programming languages are you proficient in?",
            "type": "checkbox",
            "options": ["Python", "JavaScript", "Java"]
          }
        ]
        Ensure the output is valid JSON and contains only the array of question objects. Do not include any introductory or concluding text outside the JSON array.
        `;

        console.log("\nConstructed Prompt:", prompt);

        // --- Call the Gemini API ---
        // The generateContent method sends the prompt to Gemini.
        // We expect the response to contain the generated JSON string in the 'text' attribute.
        const result = await model.generateContent(prompt);
        const response = result.response;
        const generatedQuestionsJsonStr = response.text().trim(); // Use text() method and trim

        console.log("Raw AI Response Text:", generatedQuestionsJsonStr);

        // Clean up potential markdown formatting around JSON (e.g., ```json ... ```)
        let cleanedJsonStr = generatedQuestionsJsonStr;
        if (cleanedJsonStr.startsWith('```json')) {
            cleanedJsonStr = cleanedJsonStr.substring('```json'.length).trim();
        }
        if (cleanedJsonStr.endsWith('```')) {
            cleanedJsonStr = cleanedJsonStr.substring(0, cleanedJsonStr.length - '```'.length).trim();
        }
         // Also handle potential ``` without 'json'
         if (cleanedJsonStr.startsWith('```')) {
             cleanedJsonStr = cleanedJsonStr.substring('```'.length).trim();
         }


        console.log("Cleaned AI Response Text:", cleanedJsonStr);


        // Attempt to parse the JSON string
        const generatedQuestions = JSON.parse(cleanedJsonStr);

        console.log("\nGemini API Response (Parsed):", generatedQuestions);

        // Return the parsed questions as a JSON response to the frontend
        res.json(generatedQuestions);

    } catch (error) {
        console.error('Error generating questions:', error);
         // Attempt to include the raw response text in the error if available
         let rawResponseText = "N/A";
         if (error.response && typeof error.response.text === 'function') {
             try {
                rawResponseText = await error.response.text();
             } catch (e) {
                 rawResponseText = "Could not retrieve raw response text.";
             }
         } else if (error.message) {
             rawResponseText = error.message; // Sometimes the error message contains relevant info
         }

        // Return an error response to the frontend
        res.status(500).json({ error: `An error occurred during question generation: ${error.message}. Raw response: ${rawResponseText}` });
    }
});


// --- Start the server ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Access frontend at http://localhost:${port}/`);
});
