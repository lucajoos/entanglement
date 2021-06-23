const { app, BrowserWindow } = require('electron');
const { URL } = require('./modules/constants');
const Store = require('electron-store');

const express = require('express')();
const http = require('http').createServer(express);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: [ 'GET', 'POST' ]
    }
});

const store = new Store();

let connections = {}

if (!store.get('length')) {
    store.set('length', 0);
}

let window = null;

let init = () => {
    window = new BrowserWindow({
        width: 1300,
        height: 820,
        frame: false,
        show: false,
        transparent: true,
        icon: './src/assets/icons/win/icon.ico',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    window.loadURL(URL)
        .then(() => {
            window.show();
        })
        .catch(e => {
            throw e;
        });
};

app.whenReady().then(() => {
    init();
});

app.on('activate', () => {
    if (window === null) {
        init();
    }
});

app.on('window-all-closed', e => {
    e.preventDefault();
});

io.on('connection', socket => {
    socket.on('init', object => {
        connections[socket.id] = {
            type: object?.type || null,
            player: {
                isRunning: false,
                isMuted: false
            },
            meta: {}
        };

        let stop = () => {
            //console.log(`Stopped watching ${connections[socket.id]?.meta.title} on ${connections[socket.id]?.meta.provider}`);
            console.log(connections[socket.id].meta)
        }

        if(connections[socket.id]?.type === 'extension') {
            socket.on('resolve', meta => {
                if(meta?.isResolved) {
                    connections[socket.id].meta = meta;
                    console.log(meta)

                    //console.log(`You're now watching ${meta?.title} on ${meta?.provider}`);
                } else {
                    if(connections[socket.id]?.meta?.provider) {
                        stop();
                    }

                    connections[socket.id].meta = {};
                }
            });

            socket.on('player', options => {
                if(typeof options === 'object') {
                    // console.log('Playback state changed');
                    connections[socket.id].player = Object.assign(connections[socket.id].player, options);
                    console.log(options)
                }
            });
        } else if(connections[socket.id]?.type === 'remote') {

        }

        socket.on('disconnect', () => {
            if(connections[socket.id]?.meta?.provider) {
                stop();
            }

            delete connections[socket.id];
        })
    });
});

http.listen(4001);