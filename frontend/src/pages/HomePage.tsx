import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
    const navigate = useNavigate();

    const handleStartGame = async () => {
        const res = await fetch('http://localhost:8000/start_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 3, mode: 'normal', total_questions: 5 }),
        });
        const data = await res.json();
        navigate('/game', { state: { game_id: data.game_id } });  // ✅ 只傳 game_id
    };

    return (
        <div style={{ textAlign: 'center', paddingTop: '50px' }}>
            <h1>Color Sort 遊戲首頁</h1>
            <button onClick={handleStartGame}>開始遊戲</button>
        </div>
    );
};

export default HomePage;