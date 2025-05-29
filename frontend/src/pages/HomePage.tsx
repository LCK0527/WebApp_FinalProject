import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
    const [difficulty, setDifficulty] = useState(9);
    const [colorBlindType, setColorBlindType] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');
    const navigate = useNavigate();

    const handleStartGame = async () => {
        const res = await fetch('http://localhost:8000/start_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                count: difficulty,
                mode: colorBlindType,
                total_questions: 5
            }),
        });
        const data = await res.json();
        navigate('/game', {
            state: {
                game_id: data.game_id,
                difficulty,
                colorBlindType
            }
        });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#f6f6f6',
            fontFamily: 'Arial, sans-serif',
            margin: 0,
            padding: 0
        }}>
            <h1 style={{ marginBottom: '30px' }}>🎨 Color Sort 遊戲首頁</h1>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px', fontSize: '18px' }}>選擇難度：</label>
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    style={{ padding: '8px', borderRadius: '6px' }}
                >
                    <option value={6}>6 tiles</option>
                    <option value={9}>9 tiles</option>
                    <option value={12}>12 tiles</option>
                    <option value={16}>16 tiles</option>
                    <option value={20}>20 tiles</option>
                    <option value={25}>25 tiles</option>
                </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px', fontSize: '18px' }}>色盲模式：</label>
                <select
                    value={colorBlindType}
                    onChange={(e) => setColorBlindType(e.target.value as any)}
                    style={{ padding: '8px', borderRadius: '6px' }}
                >
                    <option value="none">無</option>
                    <option value="protanopia">紅色盲（Protanopia）</option>
                    <option value="deuteranopia">綠色盲（Deuteranopia）</option>
                    <option value="tritanopia">藍色盲（Tritanopia）</option>
                </select>
            </div>

            <button
                onClick={handleStartGame}
                style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#007BFF',
                    color: '#fff',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
            >
                🚀 開始遊戲
            </button>
        </div>
    );
};

export default HomePage;
