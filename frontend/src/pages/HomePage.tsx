import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
    const [difficulty, setDifficulty] = useState(9);
    const [colorBlindMode, setColorBlindMode] = useState(false);
    const navigate = useNavigate();

    const handleStartGame = async () => {
        const res = await fetch('http://localhost:8000/start_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                count: difficulty,                          // ✅ 改這裡
                mode: colorBlindMode ? 'colorblind' : 'normal',       // ✅ 改這裡
                total_questions: 5
            }),
        });
        const data = await res.json();
        navigate('/game', {
            state: {
                game_id: data.game_id,
                difficulty,
                colorBlindMode
            }
        });
    };

    return (
        <div style={{ textAlign: 'center', paddingTop: '50px' }}>
            <h1>Color Sort 遊戲首頁</h1>

            <div>
                <label>Choose Difficulty:</label>
                <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                    <option value={6}>6 tiles</option>
                    <option value={9}>9 tiles</option>
                    <option value={12}>12 tiles</option>
                    <option value={16}>16 tiles</option>
                    <option value={20}>20 tiles</option>
                    <option value={25}>25 tiles</option>
                </select>
            </div>

            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={colorBlindMode}
                        onChange={(e) => setColorBlindMode(e.target.checked)}
                    />
                    Color Blind Mode
                </label>
            </div>

            <button onClick={handleStartGame}>
                Start Game
            </button>
        </div>
    );
};

export default HomePage;
