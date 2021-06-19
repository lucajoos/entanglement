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
    socket.on('hello', data => {
        console.log(data);
    });
});

http.listen(4001);