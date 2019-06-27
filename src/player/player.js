const { app, ipcRenderer, remote } = require('electron');
const services = require('../default-services.js');
Store = require('electron-store')

Vue.config.devtools = true;

const store = new Store();
let vue;

document.addEventListener('DOMContentLoaded', () => {
	vue = new Vue({
		el: "#content",
		data: () => ({
			items: services,
			showMenu: store.get('showMenu'),
			settings: {
				showDialog: false,
				alwaysOnTop: store.get('settings.alwaysOnTop'),
				rememberWindowPosition: store.get('settings.rememberWindowPosition'),
				defaultService: store.get("settings.defaultService") || "Menu",
				serviceValues: ["Menu", "Netflix", "YouTube", "Twitch", "Spotify", "Floatplane"]
			},
			menus: [
					{
						name: "Services",
						items: [
							{
								"name": "Menu",
								"accelerator": "CmdOrCtrl+H",
								click: function() {
									vue.activeView = -1
								}
							},
							{
								"type": "separator"
							},
							{
								"name": "Floatplane",
								click(name) {
									vue.addView(name)
								}
							},
							{
								"name": "Netflix",
								click(name) {
									vue.addView(name)
								}
							},
							{
								"name": "Spotify",
								click(name) {
									vue.addView(name)
								}
							},
							{
								"name": "Twitch",
								click(name) {
									vue.addView(name)
								}
							},
							{
								"name": "YouTube",
								click(name) {
									vue.addView(name)
								}
							}
						]
					},
					{
						type: "button",
						name: "settings"
					},
					{
						name: "Developer",
						noicons: true,
						items: [
							{
								"name": "Reload",
								"accelerator" : " Ctrl+R"
							},
							{
								"name" : "Toggle Dev Tools",
								"accelerator" : " Ctrl+Maj+I"
							},
							{
								"type" : "separator"
							},
							{
								"name" : "Actual Size",
								"accelerator" : " Ctrl+0"
							},
							{
								"name" : "Zoom in",
								"accelerator" : " Ctrl+Maj+="
							},
							{
								"name" : "Zoom out",
								"accelerator" : " Ctrl+Maj+-"
							},
							{
								"type" : "separator"
							},
							{
								"name" : "Toggle fullscreen",
								"accelerator" : " F11"
							}
						]
					},
					{
						name: "About",
						noicons: true,
						items: [
							{
								name: 'ElectronPlayer (2.0.5)',
								disabled: true
							},
							{
								name: "Created by Oscar Beaumont",
								disabled: true
							},
							{
								name: "More informations"
							},
							{
								name : "Quit ElectronPlayer",
								accelerator : "Windows+Q"
							}
						]
					}
		  ],
		  animation: undefined,
		  valid: true,
		  views: [],
		  activeView: -1,
		  webviewTop: 0,
		  title: 'ElectronPlayer',
		  loadingAnimation: false,
		  name: '',
		  nameRules: [
			v => !!v || 'Name is required',
			v => (v && v.length <= 10) || 'Name must be less than 10 characters'
		  ],
		  email: '',
		  emailRules: [
			v => !!v || 'E-mail is required',
			v => /.+@.+/.test(v) || 'E-mail must be valid'
		  ],
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
			sendMessage: (message) => {
				ipcRenderer.send(message);
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
				console.log(name);
				// mute previous webview
				if(this.activeView != -1) {
					this.$refs[this.views[this.activeView] + 'view'][0].setAudioMuted(true);
				}

				if(!this.views.includes(name)) {
					this.views.push(name);

					this.activeView = this.views.length-1;
				} else {
					this.activeView = this.views.indexOf(name);
				}

				this.$refs[this.views[this.activeView] + 'view'][0].setAudioMuted(false);
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
			}
		},
		mounted: function() {
			this.calculateWebviewTop();
			this.$vuetify.theme = {
				primary: '#00796B',
				secondary: '#004D40',
				accent: '#FF0E83',
				error: '#66336E'
			}
			this.sendMessage('vueReady');

			ipcRenderer.on('triggerMenu', () => {
				this.triggerShowMenu();
			})

			ipcRenderer.on('triggerSettings', () => {
				this.settings.showDialog = !this.settings.showDialog;
			})

			if(store.get("settings.defaultService") !== undefined && store.get("settings.defaultService") != "Menu" && this.settings.serviceValues.includes(store.get("settings.defaultService"))) {
				this.addView(store.get("settings.defaultService"));
			}
		}
	})
});