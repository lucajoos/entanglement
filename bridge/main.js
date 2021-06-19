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
            type: object?.type || null
        };

        let ref = connections[socket.id];

        if(ref?.type === 'extension') {
            socket.on('resolve', meta => {
                ref.meta = meta;

                console.log(`You're now watching ${meta?.title} on ${meta?.provider}`)
            })
        } else if(ref?.type === 'remote') {

        }

        socket.on('disconnect', () => {
            console.log(`Stopped watching ${connections[socket.id]?.title} on ${connections[socket.id]?.provider}`);
            delete connections[socket.id];
        })
    });
});

http.listen(4001);