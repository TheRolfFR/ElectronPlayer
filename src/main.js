// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, globalShortcut, shell } = require('electron');
const fs = require('fs'),
	path = require('path'),
	Store = require('electron-store');

const headerScript = fs.readFileSync(
	path.join(__dirname, 'client-header.js'),
	'utf8'
);

// Create Global Varibles
let mainWindow; // Global Windows Object
const store = new Store();
global.services = [];

const minWidth = 800;
const minHeight = 600;

function createWindow() {
	// Create the browser window.
	let parameters = {
		minWidth: minWidth,
		minHeight: minHeight,
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
		alwaysOnTop: store.get('settings').alwaysOnTop,
		backgroundColor: '#00796B',
		toolbar: false,
		show: false
	};

	// set size
	if(store.get('settings').rememberWindowPosition) {
		if(store.get('settings.windowPosition') !== undefined) {
			parameters.x = store.get('settings.windowPosition')[0];
			parameters.y = store.get('settings.windowPosition')[1];
		}
		if(store.get('settings.windowSize') !== undefined) {
			parameters.width = store.get('settings.windowSize')[0];
			parameters.height = store.get('settings.windowSize')[1];
		}
	}

	function triggerDevTools() {
		// closes the window if opened anywhere
		if(mainWindow.webContents.isDevToolsOpened()) {
			mainWindow.webContents.closeDevTools();
		} else {
			// opens it if the window is focused
			if(mainWindow.webContents.isFocused()) {
				mainWindow.webContents.openDevTools();
			}
		}
	}

	mainWindow = new BrowserWindow(parameters);

	mainWindow.loadURL(`file://${__dirname}/player/player.html`);

	// open maybe the dev tools
	if(store.get('openDevTools'))
		mainWindow.webContents.openDevTools();

	ipcMain.once('vueReady', () => {

		// size reseter
		globalShortcut.register('Alt+R', () => {
			if(mainWindow.isFocused()) {
				const pos = mainWindow.getPosition();
				const size = mainWindow.getSize();
				const newpos = [pos[0] + Math.round(0.5*(size[0] - minWidth)), pos[1]  + Math.round(0.5*(size[1] - minHeight))];
				mainWindow.setBounds({
					x: newpos[0],
					y: newpos[1],
					width: minWidth,
					height: minHeight
				}, false);
			}
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

		// reload trigger
		globalShortcut.register('CmdOrCtrl+R', () => {
			mainWindow.webContents.send('reloadCurrentView');
		})

		// zoom trigger
		// zoom reset
		globalShortcut.register('CmdOrCtrl+num0', () => {
			if(mainWindow.isFocused())
				mainWindow.webContents.send('zoomReset');
		})
		globalShortcut.register('CmdOrCtrl+Shift+0', () => {
			if(mainWindow.isFocused())
				mainWindow.webContents.send('zoomReset');
		});
		// zoom in
		globalShortcut.register('CmdOrCtrl+numadd', () => {
			if(mainWindow.isFocused())
				mainWindow.webContents.send('zoomIn');
		})
		globalShortcut.register('CmdOrCtrl+Shift+Plus', () => {
			if(mainWindow.isFocused())
				mainWindow.webContents.send('zoomIn');
		})
		// zoom out
		globalShortcut.register('CmdOrCtrl+numsub', () => {
			if(mainWindow.isFocused())
				mainWindow.webContents.send('zoomOut');
		})
		globalShortcut.register('CmdOrCtrl+Shift+6', () => {
			if(mainWindow.isFocused())
				mainWindow.webContents.send('zoomOut');
		})

		globalShortcut.register('Alt+F', () => {
			mainWindow.webContents.send('triggerFramelessWindow');
		})

		// devtools events
		mainWindow.webContents.on('devtools-opened', () => {
			store.set('openDevTools', true);
		})
		mainWindow.webContents.on('devtools-closed', () => {
			store.set('openDevTools', false);
		})

		ipcMain.on('triggerDevTools', () => {
			triggerDevTools();
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

	ipcMain.on('getVersion', (event, arg) => {
		event.returnValue = app.getVersion();
	});

	ipcMain.on('openConfigFile', () => {
		shell.openItem(path.join(app.getPath('userData'), 'config.json'));
	})

	// open dev tools
	globalShortcut.register('CommandOrControl+Shift+I', () => {
		// because trigger doesn't work
		triggerDevTools();
	});

	mainWindow.on('move', () => {
		if(store.get('settings').rememberWindowPosition) {
			let pos = mainWindow.getPosition();
			if(mainWindow.isMaximized()) {
				pos[0] += Math.abs(pos[1]);
				pos[1] = 0;
			}
			store.set('settings.windowPosition', pos);
		}
	})

	mainWindow.on('resize', () => {
		if(store.get('settings').rememberWindowPosition) {
			store.set('settings.windowSize', mainWindow.getSize());
		}
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