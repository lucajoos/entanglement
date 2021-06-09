import React from 'react';
import Store from '../Store';
import { useSnapshot } from 'valtio';

const App = () => {
  const snap = useSnapshot(Store);

  return (
    <div className={'w-full h-full relative select-none'}>
      <h1>Rayn Device</h1>
    </div>
  );
};

export default App;
