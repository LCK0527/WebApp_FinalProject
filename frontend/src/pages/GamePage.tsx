import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface GameData {
    game_id: number;
    question_number: number;
    total_questions: number;
    blocks: number[];
    mode: string;
}

const GamePage: React.FC = () => {
    const location = useLocation();
    const initialData = location.state as { game_id: number };
    const difficulty = location.state?.difficulty || 9;
    const colorBlindMode = location.state?.colorBlindMode || false;

    const [blocks, setBlocks] = useState<number[]>([]);
    const [clickedIds, setClickedIds] = useState<number[]>([]);
    const [gameId, setGameId] = useState<number | null>(null);
    const [hue, setHue] = useState<number>(Math.floor(Math.random() * 360));

    const count = blocks.length;
    const cols  = count > 0 ? Math.ceil(Math.sqrt(count)) : 1;
    const rows  = count > 0 ? Math.ceil(count / cols) : 1;


    // 初始設定
    useEffect(() => {
        setGameId(initialData.game_id);
    }, []);
    const [questionNumber, setQuestionNumber] = useState<number>(1);
    const [totalQuestions, setTotalQuestions] = useState<number>(1);
    const [startTime, setStartTime] = useState<number>(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [result, setResult] = useState<{ correct: boolean; score: number; answer: number[] } | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [finalScore, setFinalScore] = useState<number | null>(null);

    const fetchNextQuestion = () => {
        fetch(`http://localhost:8000/next_question?game_id=${gameId}`)
            .then(res => res.json())
            .then((data: GameData | { finished: boolean }) => {
                if ('finished' in data && data.finished) {
                    setIsFinished(true);
                    fetch(`http://localhost:8000/total_score?game_id=${gameId}`)
                        .then(res => res.json())
                        .then(scoreData => {
                            setFinalScore(scoreData.total_score);
                        });
                    return;
                }

                const questionData = data as GameData;
                setHue(Math.floor(Math.random() * 360));
                setBlocks(questionData.blocks);
                setQuestionNumber(questionData.question_number);
                setTotalQuestions(questionData.total_questions);
                setClickedIds([]);
                setIsSubmitted(false);
                setResult(null);
                setStartTime(Date.now());
            });
    };

    useEffect(() => {
        if (gameId) fetchNextQuestion();  // 加入保護條件
    }, [gameId]);

    const handleClick = (id: number) => {
        if (isSubmitted || clickedIds.includes(id)) return;
        setClickedIds([...clickedIds, id]);
    };

    const handleSubmit = () => {
        const timeUsed = (Date.now() - startTime) / 1000;
        fetch('http://localhost:8000/submit_answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: gameId, answer: clickedIds, time_used: timeUsed }),
        })
            .then(res => res.json())
            .then(data => {
                setResult(data);
                setIsSubmitted(true);
            });
    };

    const handleNext = () => {
        fetchNextQuestion();
    };

    return (
        <div style={{ textAlign: 'center' }}>
            {!isFinished ? (
                <>
                    <h2>第 {questionNumber} / {totalQuestions} 題：請依序點擊色塊</h2>
                    {/* 以 grid 方式排列，依照 cols × rows 動態設定 */}
                    <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols}, 90px)`,
                        gridTemplateRows: `repeat(${rows}, 90px)`,
                        gap: '10px',
                        justifyContent: 'center',
                        margin: 'auto'
                    }}
                    >
                    {blocks.map((_, index) => {
                        const t = index / (blocks.length - 1);

                        if (colorBlindMode) {
                        // 色盲模式：固定藍色系，依序用亮度漸層
                        const hueCB = 240;
                        const lightness = 30 + t * 50;  // 30% → 80%
                        return (
                            <div
                            key={index}
                            onClick={() => handleClick(blocks[index])}
                            style={{
                                width: '90px',
                                height: '90px',
                                boxSizing: 'border-box',
                                backgroundColor: `hsl(${hueCB}, 80%, ${lightness}%)`,
                                cursor: 'pointer',
                                border: clickedIds.includes(blocks[index]) ? '4px solid black' : 'none',
                            }}
                            />
                        );
                        } else {
                        // 一般模式：隨機 hue，依序用更大亮度範圍漸層
                        const lightness = 20 + t * 60;  // 20% → 80%
                        return (
                            <div
                            key={index}
                            onClick={() => handleClick(blocks[index])}
                            style={{
                                width: '90px',
                                height: '90px',
                                boxSizing: 'border-box',
                                backgroundColor: `hsl(${hue}, 80%, ${lightness}%)`,
                                cursor: 'pointer',
                                border: clickedIds.includes(blocks[index]) ? '4px solid black' : 'none',
                            }}
                            />
                        );
                        }
                    })}
                    </div>

                    {!isSubmitted ? (
                        <button onClick={handleSubmit} disabled={clickedIds.length === 0} style={{ marginTop: '20px' }}>
                            提交答案
                        </button>
                    ) : (
                        <>
                            <div style={{ marginTop: '20px' }}>
                                <p>是否正確：{result?.correct ? '✅ 正確' : '❌ 錯誤'}</p>
                                <p>得分：{result?.score}</p>
                                <p>正確答案順序：{result?.answer.join(', ')}</p>
                            </div>
                            <button onClick={handleNext} style={{ marginTop: '10px' }}>
                                下一題
                            </button>
                        </>
                    )}
                </>
            ) : (
                <div style={{ marginTop: '100px' }}>
                    <h2>🎉 遊戲結束！</h2>
                    <p>你的總分是：{finalScore} 分</p>
                </div>
            )}
        </div>
    );
};

export default GamePage;