import { useCallback, useEffect, useState } from 'react';
import Store from '../Store';
import { useSnapshot } from 'valtio';

const { ipcRenderer } = require('electron');

const App = () => {
    return (
        <div>
            Rayn Bridge
        </div>
    );
};

export default App;
