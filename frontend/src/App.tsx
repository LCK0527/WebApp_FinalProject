import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import NavBarComp from './components/NavBar';
import Login from './pages/LoginPage';
import RankPage from './pages/RankPage';
import CreateAccount from './pages/CreateAccountPage';
import React, { useState } from 'react';

function App() {
  const [username, setUsername] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  return (
    <BrowserRouter>
      <NavBarComp username={username} isLoggedIn={isLoggedIn} setUsername={setUsername} setIsLoggedIn={setIsLoggedIn}/>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage username={username}/>} />
        <Route path="/login" element={<Login username={username} setUsername={setUsername} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}/>} />
        <Route path="/newAccount" element={<CreateAccount username={username} setUsername={setUsername} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}/>} />
        <Route path="/rank" element={<RankPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
