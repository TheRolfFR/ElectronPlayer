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
	let parameters = {
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
	};

	// set size
	if(store.get('settings.rememberWindowPosition')) {
		if(store.get('settings.windowPosition') !== undefined) {
			parameters.x = store.get('settings.windowPosition')[0];
			parameters.y = store.get('settings.windowPosition')[1];
		}
		if(store.get('settings.windowSize') !== undefined) {
			parameters.width = store.get('settings.windowSize')[0];
			parameters.height = store.get('settings.windowSize')[1];
		}
	}

	mainWindow = new BrowserWindow(parameters);

	mainWindow.loadURL(`file://${__dirname}/player/player.html`);

	ipcMain.once('vueReady', () => {

		// size reseter
		globalShortcut.register('Alt+R', () => {
			if(mainWindow.isFocused())
				mainWindow.setSize(800, 600, true);
		});

		// because local shortcut doesn't work in webviews
		// trigger menu
		if(process.platform == 'win32') {
			globalShortcut.register('Alt+M', () => {
				if(mainWindow.webContents.isFocused())
					mainWindow.webContents.send('triggerMenu');
			});
		}

		// settings trigerer
		globalShortcut.register('Alt+S', () => {
			if(mainWindow.isFocused()) {
				mainWindow.webContents.send('triggerSettings');
			}
		})

		// open maybe the dev tools
		if(store.get('openDevTools'))
			mainWindow.webContents.openDevTools();

		// devtools events
		mainWindow.webContents.on('devtools-opened', () => {
			store.set('openDevTools', true);
		})
		mainWindow.webContents.on('devtools-closed', () => {
			store.set('openDevTools', false);
		})

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

	// open dev tools
	globalShortcut.register('CommandOrControl+Shift+I', () => {
		// because trigger doesn't work

		// closes the window if opened anywhere
		if(mainWindow.webContents.isDevToolsOpened()) {
			mainWindow.webContents.closeDevTools();
		} else {
			// opens it if the window is focused
			if(mainWindow.webContents.isFocused()) {
				mainWindow.webContents.openDevTools();
			}
		}
	});

	mainWindow.on('move', () => {
		// corrects [-8, -8] when maximised
		store.set('settings.windowPosition', ((mainWindow.isMaximized()) ? ([0, 0]) : mainWindow.getPosition()));
	})

	mainWindow.on('resize', () => {
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