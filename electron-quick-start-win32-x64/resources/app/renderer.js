/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

const { ipcRenderer } = require('electron');
const apiFormInput = document.getElementById('api-form');
const generateButton = document.getElementById('generate');
const preview = document.getElementById('preview');
const promptInput = document.getElementById('prompt');
const loader = document.getElementById('loader');
const taskCorrectRadio = document.getElementById('correct');
const taskReplyRadio = document.getElementById('reply');

// Listen for form submission
if (apiFormInput) {
    apiFormInput.addEventListener('submit', (event) => {
      event.preventDefault();
      const apiKey = document.getElementById('api-key').value;
      
      console.log('Form submitted, API Key:', apiKey);
      
      ipcRenderer.send('api-key-submitted', apiKey);
    });
  } else {
    console.log('API form does not exist');
  }

  
generateButton.addEventListener('click', async () => {
    const promptText = promptInput.value;
    const task = taskCorrectRadio.checked ? taskCorrectRadio.value : taskReplyRadio.value;
  
    loader.style.display = 'block'; // Show the loader
    preview.textContent = ''; // Optionally clear previous content
  
    try {
      const aiResponse = await ipcRenderer.invoke('generate-draft', promptText, task);
      preview.textContent = aiResponse;
    } catch (error) {
      preview.textContent = 'There was an error generating the draft.';
      console.error('Error invoking generate-draft:', error);
    } finally {
      loader.style.display = 'none'; // Hide the loader
    }
  });
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Control') {
      const timeNow = new Date().getTime();
      
      // Check if Ctrl was pressed twice within 500ms
      if (timeNow - lastCtrlPress < 500) {
        const highlightedText = window.getSelection().toString();
        
        // If there is a highlighted text, copy it to the prompt input
        if (highlightedText){
          document.getElementById('prompt').value = highlightedText;
        }
      }
  
      lastCtrlPress = timeNow;
    }
  });
  
  ipcRenderer.on('copy-text', (event, text) => {
    document.getElementById('prompt').value = text;
  });

  