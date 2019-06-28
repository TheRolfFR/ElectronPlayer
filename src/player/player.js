const { app, ipcRenderer, remote, shell } = require('electron');
const services = require('../default-services.js');
const menu = require('./menu');
Store = require('electron-store')

Vue.config.devtools = true;

const store = new Store();
let vue;

document.addEventListener('DOMContentLoaded', () => {
	vue = new Vue({
		el: "#content",
		data: () => ({
			frameless : store.get('frameless'),
			items: services,
			showMenu: store.get('showMenu'),
			settings: {
				showDialog: false,
				alwaysOnTop: store.get('settings.alwaysOnTop'),
				rememberWindowPosition: store.get('settings.rememberWindowPosition'),
				defaultService: store.get("settings.defaultService") || "Menu",
				serviceValues: ["Menu", "Netflix", "YouTube", "Twitch", "Spotify", "Floatplane"]
			},
			menus: menu(ipcRenderer.sendSync('getVersion')),
			animation: undefined,
			valid: true,
			views: [],
			activeView: -1,
			webviewTop: 0,
			title: 'ElectronPlayer',
			loadingAnimation: false,
			name: '',
			select: null,
			checkbox: false
		}),
		watch: {
			'settings.alwaysOnTop': function(newValue, oldValue) {
				store.set('settings.alwaysOnTop', newValue);
				remote.getCurrentWindow().setAlwaysOnTop(newValue);
			},
			'settings.rememberWindowPosition': function(newValue, oldValue) {
				store.set('settings.rememberWindowPosition', newValue);
			},
			'settings.defaultService': function(newValue, oldValue) {
				store.set("settings.defaultService", newValue);
			},
			'showMenu': function(newValue, oldValue) {
				store.set('showMenu', newValue);
			}
		},
		computed: {
			calculatedTop() {
			}
		},
		methods: {
			validate: () => {
				if (this.$refs.form.validate()) {
					this.snackbar = true
				}
			},
			reset: () => {
				this.$refs.form.reset()
			},
			resetValidation: () => {
				this.$refs.form.resetValidation()
			},
			sendMessage: (message, option = null) => {
				ipcRenderer.send(message, option);
			},
			close: () => {
				remote.getCurrentWindow().close();
			},
			triggerShowMenu() {
				if(process.platform == 'win32') {
					this.showMenu = !this.showMenu;
					Vue.nextTick(() => {
						setTimeout(() => {
							this.calculateWebviewTop();
						}, 200);
					});
				}
			},
			getItem(name) {
				let result = undefined;
				let i = 0;
				while(i < this.items.length && result === undefined) {
					if(this.items[i].name == name) {
						result = this.items[i];
					}
					i++;
				}
				
				return result;
			},
			showView(item) {
				if(this.animation === undefined) {
					const bounds = this.$refs[item.name][0].$el.getBoundingClientRect();
					this.animation = {
						item: item,
						top: bounds.top,
						left: bounds.left,
						width: bounds.width,
						height: bounds.height,
						loadAnimation: false,
						loadCircle: false
					};

					setTimeout(() => {
						this.animation.loadAnimation = true;
						setTimeout(() => {
							this.animation.loadCircle = true;
							setTimeout(() => {
								this.animation = undefined;
								this.addView(item.name);
							}, 350);
						}, 200);
					}, 10);
				}
			},
			addView(name) {
				// mute previous webview
				if(this.activeView != -1) {
					this.getCurrentView().setAudioMuted(true);
				}

				// show menu
				if(name == -1) {
					this.activeView = -1;
					return;
				}

				if(!this.views.includes(name)) {
					this.views.push(name);

					this.activeView = this.views.length-1;
				} else {
					this.activeView = this.views.indexOf(name);
					this.getCurrentView().setAudioMuted(false);
				}
			},
			getCurrentView() {
				if(this.activeView != -1 && this.$refs[this.views[this.activeView] + 'view'] !== undefined)
					return this.$refs[this.views[this.activeView] + 'view'][0];
				else
					return null;
			},
			calculateWebviewTop() {
				let value = 0;
				if(!remote.getCurrentWindow().isFullScreen()) {
					value += this.$refs.systembar.$el.getBoundingClientRect().height;
					if(this.showMenu) {
						value += this.$refs.menu.$el.getBoundingClientRect().height;
					}
				}
				this.webviewTop = value + 'px !important';
			},
			acceleratorName(accelerator) {
				if(process.platform == 'darwin') {
					if(accelerator.indexOf("CmdOrCtrl") != -1)
						return accelerator.replace("CmdOrCtrl", "Cmd")
					if(accelerator.indexOf("CommandOrCtrl") != -1)
						return accelerator.replace("CommandOrCtrl", "Cmd")
					
					return accelerator
				} else {
					if(accelerator.indexOf("CmdOrCtrl") != -1)
					return accelerator.replace("CmdOrCtrl", "Ctrl")
					if(accelerator.indexOf("CommandOrCtrl") != -1)
					return accelerator.replace("CommandOrCtrl", "Ctrl")

					return accelerator
				}
			},
			zoomReset() {
				if(this.activeView != -1) {
					this.getCurrentView().setZoomLevel(1);
				}
			},
			zoomIn() {
				if(this.activeView != -1) {
					this.getCurrentView().setZoomLevel(this.getCurrentView().getZoomLevel() + 1);
				}
			},
			zoomOut() {
				if(this.activeView != -1) {
					this.getCurrentView().setZoomLevel(this.getCurrentView().getZoomLevel() - 1);
				}
			},
			reloadCurrentView() {
				if(this.activeView != -1) {
					this.getCurrentView().reload();
				}
			},
			triggerSettings() {
				this.settings.showDialog = !this.settings.showDialog;
			},
			triggerFramelessWindow() {
				this.frameless = !this.frameless;
				
				store.set('frameless', this.frameless);
				
				Vue.nextTick(() => {
					setTimeout(() => {
						this.calculateWebviewTop();
					}, 200);
				});
			}
		},
		mounted: function() {
			this.calculateWebviewTop();
			this.$vuetify.theme = {
				primary: '#00796B',
				secondary: '#004D40',
				accent: '#00796B',
				error: '#66336E'
			}
			this.sendMessage('vueReady');

			ipcRenderer.on('triggerMenu', () => {
				this.triggerShowMenu();
			})

			ipcRenderer.on('triggerSettings', () => {
				this.triggerSettings();
			})

			ipcRenderer.on('reloadCurrentView', () => {
				this.reloadCurrentView();
			})

			// zoom
			ipcRenderer.on('zoomReset', () => {
				this.zoomReset();
			})
			ipcRenderer.on('zoomIn', () => {
				this.zoomIn();
			})
			ipcRenderer.on('zoomOut', () => {
				this.zoomOut();
			})

			ipcRenderer.on('addView', (event, args) => {
				if(args.length > 0) {
					this.addView(args[0]);
				}
			})

			ipcRenderer.on('triggerFramelessWindow', () => {
				this.triggerFramelessWindow();
			})

			if(store.get("settings.defaultService") !== undefined && store.get("settings.defaultService") != "Menu" && this.settings.serviceValues.includes(store.get("settings.defaultService"))) {
				this.addView(store.get("settings.defaultService"));
			}
		}
	})
});