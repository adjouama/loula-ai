// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, clipboard, ipcMain } = require('electron');
const path = require('node:path')
const Store = require('electron-store');
const store = new Store();
// store.clear();
//Check if it's the first run
if (store.get('firstRun', true)) {
  // If it's the first run, clear the store and set 'firstRun' to false
  store.clear();
  store.set('firstRun', false);
}

const { OpenAI } = require('openai');

ipcMain.on('api-key-submitted', (event, apiKey) => {
  console.log('Received API Key:', apiKey); // Add this line
  
  store.set('apiKey', apiKey);

  console.log('Stored API Key:', store.get('apiKey')); // Add this line

  // Get the current window
  let currentWindow = BrowserWindow.getFocusedWindow();

  // Close the current window
  if (currentWindow) currentWindow.close();

  createWindow()
});



function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  globalShortcut.register('Ctrl+Shift+V', () => {
    if (mainWindow) {
      const text = clipboard.readText();
      mainWindow.webContents.send('copy-text', text);
    }
  });
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

function createAPIKeyWindow() {
  const apiKeyWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  apiKeyWindow.loadFile('api-key.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  apiKey = store.get('apiKey');
  if (apiKey) {
    console.log('API key found:', apiKey);
    createWindow()
  } else {
    createAPIKeyWindow()
    console.log('No API key found');
  }
  
  

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('generate-draft', async (event, promptText, task) => {
  const openai = new OpenAI({ apiKey: store.get('apiKey')});

  let messages;
  if (task === "correct") {
    messages = [
      { "role": "system", "content": "Please initiate the text refinement protocol where you are required to correct and improve any received text inputs for accuracy in grammar, spelling, punctuation, and overall coherence. Ensure that modifications adhere to the syntactical and stylistic norms of the language in which the text is written. This includes but is not limited to English, Spanish, French, German, and Chinese. Maintain the original meaning and intention of the author while enhancing readability and clarity." },
      { "role": "user", "content": promptText }
    ];
  } else if (task === "reply") {
    messages = [
      { "role": "system", "content": "Please activate the universal response protocol, ensuring to provide a prompt, appropriate, and contextually relevant reply to any incoming messages, regardless of the format they are presented in – be it comments, emails, or simple texts. Always maintain a conversational tone, displaying human-like engagement and empathy. Your responses should reflect thoughtful consideration of the message's content while aligning with the conversational norms of a natural human interaction." },
      { "role": "user", "content": promptText }
    ];
  } else {
    // Handle unexpected task value or default case
    messages = [
      { "role": "user", "content": promptText }
    ];
  }
  console.log(messages)
  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      // model: "gpt-4-turbo-preview",
      model: "gpt-3.5-turbo",
      max_tokens: 3000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error querying OpenAI:', error);
    return '';
  }
});