module.exports = (version) => {
    return [{
        label: "Services",
        submenu: [
            {
                label: "Menu",
                accelerator: "CmdOrCtrl+H",
                click: function() {
                    commandToPlayer("addView", -1);
                }
            },
            {
                type: "separator"
            },
            {
                label: "Floatplane",
                click() {
                    commandToPlayer("addView", "Floatplane")
                }
            },
            {
                label: "Netflix",
                click() {
                    commandToPlayer("addView", "Netflix")
                }
            },
            {
                label: "Spotify",
                click() {
                    commandToPlayer("addView", "Spotify")
                }
            },
            {
                label: "Twitch",
                click() {
                    commandToPlayer("addView", "Twitch")
                }
            },
            {
                label: "YouTube",
                click() {
                    commandToPlayer("addView", "YouTube")
                }
            }
        ]
    },
    {
        type: "button",
        label: "Settings",
        click: function() {
            commandToPlayer("triggerSettings");
        }
    },
    {
        label: "Developer",
        noicons: true,
        submenu: [
            {
                label: "Reload",
                accelerator : " Ctrl+R",
                click: function() {
                    vue.reloadCurrentView();
                }
            },
            {
                label : "Toggle Dev Tools",
                accelerator : "CmdOrCtrl+Maj+I",
                click: function() {
                    commandToMain("triggerDevTools");
                }
            },
            {
                type: "separator"
            },
            {
                label: "Actual Size",
                accelerator : " Ctrl+0",
                click: function() {
                    vue.zoomReset();
                }
            },
            {
                label: "Zoom in",
                accelerator : " Ctrl+Maj+=",
                click: function() {
                    vue.zoomIn();
                }
            },
            {
                label: "Zoom out",
                accelerator : " Ctrl+Maj+-",
                click: function() {
                    vue.zoomOut();
                }
            },
            {
                "type" : "separator"
            },
            {
                label: "Toggle fullscreen",
                accelerator : " F11"
            }
        ]
    },
    {
        label: "About",
        noicons: true,
        submenu: [
            {
                label: 'ElectronPlayer (' + version + ')',
                disabled: true
            },
            {
                label: "Created by Oscar Beaumont",
                disabled: true
            },
            {
                label: "More informations",
                click: function() {
                    shell.openExternal('https://github.com/oscartbeaumont/ElectronPlayer');
                }
            },
            {
                label : "Quit ElectronPlayer",
                accelerator : "Windows+Q"
            }
        ]
    }];

    function commandToPlayer(command, option) {
        try {
            if(vue !== undefined) {
                vue[command](option);
            }
            else if(mainWindow !== undefined) {
                mainWindow.webContents.send(command, option);
            }
        } catch (error) {
            
        }
    }

    function commandToMain(command, option) {
        try {
            if(vue !== undefined) {
                vue.sendMessage(command, option);
            } else {
                global[command](option);
            }
        } catch (error) {
            
        }
    }
}