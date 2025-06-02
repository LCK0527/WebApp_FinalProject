import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedMode, setSelectedMode] = useState<'color_sequence' | 'memory_match' | null>(null);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [colorBlindType, setColorBlindType] = useState<'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('normal');

    const handleStartGame = async () => {
        if (!selectedMode) return;

        try {
            const response = await fetch('http://localhost:8000/start_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    difficulty,
                    color_blind_type: colorBlindType,
                    game_mode: selectedMode
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to start game');
            }

            const data = await response.json();
            navigate('/game', {
                state: {
                    game_id: data.game_id,
                    difficulty,
                    colorBlindType,
                    gameMode: selectedMode
                }
            });
        } catch (error) {
            console.error('Error starting game:', error);
        }
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
                <label style={{ marginRight: '10px', fontSize: '18px' }}>遊戲模式：</label>
                <Button 
                    variant={selectedMode === 'color_sequence' ? 'primary' : 'outline-primary'}
                    onClick={() => setSelectedMode('color_sequence')}
                    style={{ marginRight: '10px' }}
                >
                    顏色序列
                </Button>
                <Button 
                    variant={selectedMode === 'memory_match' ? 'primary' : 'outline-primary'}
                    onClick={() => setSelectedMode('memory_match')}
                >
                    記憶配對
                </Button>
            </div>

            {selectedMode && (
                <>
                    <div style={{
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'  // 控制 label 與 select 的間距
                    }}>
                    <label style={{ fontSize: '18px', whiteSpace: 'nowrap' }}>選擇難度：</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                        style={{
                        padding: '8px',
                        borderRadius: '6px',
                        width: '200px',
                        fontSize: '16px',
                        }}
                    >
                        <option value="easy">簡單</option>
                        <option value="medium">中等</option>
                        <option value="hard">困難</option>
                    </select>
                    </div>

                    <div style={{
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                    }}>
                    <label style={{ fontSize: '18px', whiteSpace: 'nowrap' }}>色盲模式：</label>
                    <select
                        value={colorBlindType}
                        onChange={(e) => setColorBlindType(e.target.value as any)}
                        style={{
                        padding: '8px',
                        borderRadius: '6px',
                        width: '200px',
                        fontSize: '16px',
                        }}
                    >
                        <option value="normal">無</option>
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
                </>
            )}
        </div>
    );
};

export default HomePage;
