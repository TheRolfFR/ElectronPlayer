// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, dialog, globalShortcut } = require('electron');
const fs = require('fs'),
	path = require('path'),
	Store = require('electron-store'),
	electronLocalshortcut = require('electron-localshortcut');

const headerScript = fs.readFileSync(
	path.join(__dirname, 'client-header.js'),
	'utf8'
);

// Create Global Varibles
let mainWindow; // Global Windows Object
const menu = require('./menu');
const store = new Store();
global.services = [];

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		minWidth: 800,
		minHeight: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			plugins: true,
			webviewTag: true,
			//preload: path.join(__dirname, 'client-preload.js')
		},

		// Window Styling
		transparent: (process.platform != 'win32') ? true : false,
		resizable: true,
		vibrancy: 'ultra-dark',
		frame: false,
		alwaysOnTop: store.get('settings.alwaysOnTop'),
		backgroundColor: '#00796B',
		toolbar: false,
		show: false
	});

	// set size
	//if(store.get('settings.rememberWindowPosition'))
		//mainWindow.setBounds({x : store.get('settings.windowPosition')[0], y: store.get('settings.windowPosition')[1], width: store.get('settings.windowSize')[0], height: store.get('settings.windowSize')[1]});

	mainWindow.loadURL(`file://${__dirname}/player/player.html`);

	ipcMain.once('vueReady', () => {
		setTimeout(() => {
			mainWindow.show();
		}, 500);
	});

	ipcMain.on('maximize', (event, arg) => {
		if(mainWindow.isMaximized()) {
			mainWindow.unmaximize();
		} else {
			mainWindow.maximize();
		}
	});

	ipcMain.on('minimize', () => {
		mainWindow.minimize();
	});

	// trigger menu
	if(process.platform == 'win32') {
		globalShortcut.register('Alt+M', () => {
			if(mainWindow.webContents.isFocused())
			mainWindow.webContents.send('triggerMenu');
		});
	}

	// open dev tools
	globalShortcut.register('CommandOrControl+Shift+I', () => {
		if(mainWindow.webContents.isFocused()) {
			if(mainWindow.webContents.isDevToolsOpened())
				mainWindow.webContents.closeDevTools();
			else
				mainWindow.webContents.openDevTools();
		}
	});

	mainWindow.on('move', () => {
		if(store.get('settings.rememberWindowPosition'))
			store.set('settings.windowPosition', mainWindow.getPosition());
	})

	mainWindow.on('resize', () => {
		console.info('resize');
		if(store.get('settings.rememberWindowPosition'))
			store.set('settings.windowSize', mainWindow.getSize());
	})
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.

app.on('widevine-ready', (version) => {
	console.log('Widevine ' + version + ' is ready to be used!');
	createWindow();
});
app.on('widevine-update-pending', (currentVersion, pendingVersion) => {
	console.log('Widevine ' + currentVersion + ' is ready to be upgraded to ' + pendingVersion + '!');
});
app.on('widevine-error', (error) => {
	console.log('Widevine installation encountered an error: ' + error);
	process.exit(1)
});