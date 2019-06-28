module.exports = (version) => {
    return [{
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
                "accelerator" : " Ctrl+R",
                "click": function() {
                    mainWindow.webContents.send('reloadCurrentView');
                }
            },
            {
                "name" : "Toggle Dev Tools",
                "accelerator" : " Ctrl+Maj+I",
                "click": function() {
                    remote.getCurrentWindow().triggerDevTools();
                }
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
                name: 'ElectronPlayer (' + version + ')',
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
    }];
}