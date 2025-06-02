// ✅ 改版的 GamePage：依序點擊色塊，錯誤會晃動並扣分，正確即亮框，完成即送分
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import {
  hslToRgb,
  simulateProtanopia,
  simulateDeuteranopia,
  simulateTritanopia
} from '../utils/colorBlind';

type GamePageProps = {
  username: string;
};

// 定義 history 中每個項目的類型
interface GameHistoryItem {
  question: number;
  correct_answer: number[];
  user_answer: number[];
  time_used: number;
  score_breakdown: {
    time_bonus: number;
  };
  errors_count: number;
  score: number; // 後端回傳的每題得分
}

// 定義遊戲模式
type GameMode = 'color_sequence' | 'memory_match';

// 定義記憶遊戲的色塊狀態
interface MemoryBlock {
  id: number;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const GamePage: React.FC<GamePageProps> = ({ username }) => {
  const location = useLocation();
  const { game_id, difficulty, colorBlindType, gameMode = 'color_sequence' } = location.state || {};

  // 如果 game_id 不存在，顯示提示或導回首頁
  if (!game_id) {
    return (
      <div style={{textAlign: 'center', marginTop: '100px'}}>
        <h2>請從首頁正確開始遊戲</h2>
      </div>
    );
  }

  const [showPreview, setShowPreview] = useState(false);
  const [correctSequence, setCorrectSequence] = useState<number[]>([]);
  const [blocks, setBlocks] = useState<number[]>([]);
  const [clickedIds, setClickedIds] = useState<number[]>([]);
  const [expectedIndex, setExpectedIndex] = useState(0);
  // 將 score 改為 errorsCount
  const [errorsCount, setErrorsCount] = useState(0);
  const [hue, setHue] = useState(Math.floor(Math.random() * 360));

  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [startTime, setStartTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  // 指定 history 的類型
  const [history, setHistory] = useState<GameHistoryItem[]>([]);

  // 記憶遊戲相關狀態
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>([]);
  const [flippedBlocks, setFlippedBlocks] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [memoryScore, setMemoryScore] = useState(0);
  const [memoryAttempts, setMemoryAttempts] = useState(0);

  const count = blocks ? blocks.length : 0; // 確保 blocks 存在再取 length
  const cols = count > 0 ? Math.ceil(Math.sqrt(count)) : 1;
  const rows = count > 0 ? Math.ceil(count / cols) : 1;

  // 使用 ref 來追蹤是否已經初始化
  const isInitialized = React.useRef(false);
  // 使用 ref 來追蹤是否正在提交答案
  const isSubmitting = React.useRef(false);

  useEffect(() => {
    // 只在第一次渲染時調用
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchNextQuestion();
    }
  }, [game_id]); // 添加 game_id 作為依賴項，確保遊戲 ID 變化時能重新獲取題目

  const fetchNextQuestion = async () => {
    // 確保 game_id 有值
    if (game_id === undefined) {
        console.error("Game ID is undefined. Cannot fetch next question.");
        return;
    }
    try {
        const res = await fetch(`http://localhost:8000/next_question?game_id=${game_id}`);
        const data = await res.json();

        if (data.finished) {
            setIsFinished(true);
            // 確保 game_id 有值再呼叫 total_score
            if (game_id !== undefined) {
                const final = await fetch(`http://localhost:8000/total_score?game_id=${game_id}`);
                const scoreData = await final.json();
                setFinalScore(scoreData.total_score);
                setHistory(scoreData.history);

                // 調用 submit_score API 保存最終分數
                try {
                    const submitResponse = await fetch('http://localhost:8000/submit_score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            game_id: game_id,
                            score: scoreData.total_score,
                            username: username
                        })
                    });
                    
                    if (!submitResponse.ok) {
                        console.error('提交最終分數失敗:', await submitResponse.text());
                    } else {
                        console.log('成功提交最終分數');
                    }
                } catch (error) {
                    console.error('提交最終分數時發生錯誤:', error);
                }
            }
            return;
        }

        // 使用後端回傳的 question_number
        setQuestionNumber(data.question_number);
        setTotalQuestions(data.total_questions);

        // 更新其他狀態
        setBlocks(data.blocks);
        setHue(Math.floor(Math.random() * 360));
        setExpectedIndex(0);
        setClickedIds([]);
        // 重置錯誤次數
        setErrorsCount(0);
        setStartTime(Date.now());

        // 如果是記憶配對模式，初始化記憶方塊狀態
        if (gameMode === 'memory_match') {
            // 後端回傳的 data.blocks 對於記憶配對模式就是顏色 ID 的列表
            const colorIds: number[] = data.blocks; // 例如 [0, 5, 2, 0, 7, 5, 7, 2]
            const uniqueColorIds: number[] = Array.from(new Set(colorIds)); // 例如 [0, 5, 2, 7]

            // 為每個唯一的 colorId 生成一個隨機顏色
            const randomColorsMap = new Map<number, string>();
            uniqueColorIds.forEach(id => {
                // 生成隨機 HSL 顏色，調整 S 和 L 範圍使其易於區分且不過於刺眼
                const randomHue = Math.floor(Math.random() * 360);
                const randomSaturation = Math.floor(Math.random() * 30) + 70; // 70-100%
                const randomLightness = Math.floor(Math.random() * 30) + 40; // 40-70%
                randomColorsMap.set(id, `hsl(${randomHue}, ${randomSaturation}%, ${randomLightness}%)`);
            });

            const initialMemoryBlocks: MemoryBlock[] = colorIds.map((colorId: number, index: number) => ({
                id: index, // 使用索引作為唯一 ID
                // 從 randomColorsMap 中獲取對應 colorId 的隨機顏色
                color: randomColorsMap.get(colorId) || '#000', // 如果找不到，使用黑色作為備用
                isFlipped: false,
                isMatched: false,
            }));

            setMemoryBlocks(initialMemoryBlocks);
            setFlippedBlocks([]);
            setIsChecking(false);
            setMemoryScore(0); // 記憶模式的計分獨立
            setMemoryAttempts(0);
        }

    } catch (error) {
        console.error("Failed to fetch next question:", error);
        // 可以選擇在此處顯示錯誤信息給用戶
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called'); // 添加日誌
    // 防止重複提交
    if (isFinished || isSubmitting.current) {
        console.log('handleSubmit blocked by isFinished or isSubmitting. current isSubmitting:', isSubmitting.current); // 添加日誌
        return;
    }
    
    try {
      console.log('Attempting to submit answer...'); // 添加日誌
      isSubmitting.current = true;
      const timeUsed = (Date.now() - startTime) / 1000;
      
      // 顯示正確答案預覽
      // 確保 blocks 已經加載
      if (!blocks || blocks.length === 0) {
          console.error("Blocks not loaded yet. Cannot submit.");
          return;
      }
      setCorrectSequence([...blocks].sort((a, b) => a - b));
      setShowPreview(true);
      
      // 延遲1.5秒後繼續
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowPreview(false);
      
      const response = await fetch('http://localhost:8000/submit_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id,
          answer: [...blocks].sort((a, b) => a - b),
          time_used: timeUsed,
          errors_count: errorsCount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || '提交答案未知錯誤' }));
        throw new Error(errorData.message || `提交答案失敗，狀態碼: ${response.status}`);
      }
      
      console.log('Submit answer successful. Fetching next question...'); // 添加日誌
      // 等待提交答案完成後再獲取下一題
      await fetchNextQuestion();
    } catch (error) {
      console.error('提交答案時發生錯誤:', error);
    } finally {
      isSubmitting.current = false;
      console.log('handleSubmit finished. isSubmitting set to false.'); // 添加日誌
    }
  };

  const handleClick = (blockValue: number) => {
    // 如果已經點擊過這個方塊，直接返回
    if (clickedIds.includes(blockValue)) return;

    // 如果遊戲已經結束或正在提交，不處理點擊
    if (isFinished || isSubmitting.current) return;

    // 確保 blocks 已經加載且 expectedIndex 有效
    if (!blocks || expectedIndex >= blocks.length) {
        console.error("Blocks not loaded or expectedIndex is out of bounds.");
        return;
    }

    const correctId = [...blocks].sort((a, b) => a - b)[expectedIndex];
    if (blockValue === correctId) {
      // 正確的點擊
      setClickedIds((prevClicked) => {
        const newClicked = [...prevClicked, blockValue];
        // 只有在所有方塊都被點擊後才提交
        if (newClicked.length === blocks.length) {
          // 使用 setTimeout 確保狀態更新完成後再提交
          setTimeout(() => {
            handleSubmit();
          }, 0);
        }
        return newClicked;
      });
      setExpectedIndex((prev) => prev + 1);
    } else {
      // 錯誤的點擊
      // 增加錯誤次數
      setErrorsCount((prev) => prev + 1);
      const elem = document.getElementById(`block-${blockValue}`);
      if (elem) {
        elem.classList.add('shake');
        setTimeout(() => elem.classList.remove('shake'), 500);
      }
    }
  };

  // 生成記憶遊戲的色塊
  const generateMemoryBlocks = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];
    
    // 創建配對的色塊
    const blocks = [...colors, ...colors]
      .map((color, index) => ({
        id: index,
        color,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5); // 隨機排序
    
    setMemoryBlocks(blocks);
  };

  // 處理記憶遊戲的點擊
  const handleMemoryClick = (blockId: number) => {
    if (isChecking || flippedBlocks.length >= 2) return;
    
    const newBlocks = [...memoryBlocks];
    const clickedBlock = newBlocks.find(block => block.id === blockId);
    
    if (!clickedBlock || clickedBlock.isFlipped || clickedBlock.isMatched) return;
    
    clickedBlock.isFlipped = true;
    setMemoryBlocks(newBlocks);
    setFlippedBlocks([...flippedBlocks, blockId]);
    
    // 如果翻開了兩個色塊，檢查是否配對
    if (flippedBlocks.length === 1) {
      setIsChecking(true);
      const firstBlock = newBlocks.find(block => block.id === flippedBlocks[0]);
      const secondBlock = newBlocks.find(block => block.id === blockId);
      
      // 確保兩個色塊都存在
      if (firstBlock && secondBlock) {
        if (firstBlock.color === secondBlock.color) {
          // 配對成功
          firstBlock.isMatched = true;
          secondBlock.isMatched = true;
          setMemoryScore(prev => prev + 10);
        } else {
          // 配對失敗，延遲後翻回
          setTimeout(() => {
            firstBlock.isFlipped = false;
            secondBlock.isFlipped = false;
            setMemoryBlocks([...newBlocks]);
          }, 1000);
        }
      }
      
      setMemoryAttempts(prev => prev + 1);
      setFlippedBlocks([]);
      setIsChecking(false);

      // 檢查是否所有方塊都已配對成功
      const allMatched = newBlocks.every(block => block.isMatched);
      if (allMatched) {
          console.log('Memory game finished! Submitting score...');
          // 延遲一小段時間，讓最後一對翻開的動畫完成
          setTimeout(async () => {
              setIsFinished(true);
              // 確保 game_id 和 username 有值再呼叫 total_score 和 submit_score
              if (game_id !== undefined && username) {
                  // 注意：記憶配對模式目前後端沒有 total_score 和 history 的概念
                  // 這裡可以選擇直接提交 memoryScore，或者修改後端 /total_score 來支援記憶模式
                  // 為了先實現自動結束和提交，我們直接提交 memoryScore
                  
                  // 提交最終分數到 submit_score API
                  try {
                      const submitResponse = await fetch('http://localhost:8000/submit_score', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              // 記憶配對的總分就是 memoryScore
                              score: memoryScore,
                              username: username
                          })
                      });
                      
                      if (!submitResponse.ok) {
                          console.error('提交記憶遊戲最終分數失敗:', await submitResponse.text());
                      } else {
                          console.log('成功提交記憶遊戲最終分數');
                          // 提交成功後，如果需要顯示排行榜或其他信息，可以在這裡處理
                      }
                  } catch (error) {
                      console.error('提交記憶遊戲最終分數時發生錯誤:', error);
                  }
              }
          }, 1500); // 延遲 1.5 秒
      }
    }
  };

  // 在遊戲模式改變時初始化記憶遊戲
  useEffect(() => {
    if (gameMode === 'memory_match') {
      generateMemoryBlocks();
    }
  }, [gameMode]);

  // 渲染記憶遊戲的色塊
  const renderMemoryBlocks = () => {
    // 確定網格的列數
    const numBlocks = memoryBlocks.length;
    let gridCols = 4; // 預設 4 列
    if (numBlocks <= 12) { // 12個色塊以下用 3 列
        gridCols = 3;
    } else if (numBlocks > 16) { // 20個色塊用 5 列
        gridCols = 5;
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gap: '10px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {memoryBlocks.map(block => {
          // 將 HSL 顏色字串解析為 H, S, L 值
          const hslMatch = block.color.match(/hsl\((\d+), (\d+)%, (\d+)%\)/);
          let [h, s, l] = [0, 0, 0];
          if (hslMatch) {
            h = parseInt(hslMatch[1]);
            s = parseInt(hslMatch[2]);
            l = parseInt(hslMatch[3]);
          }

          // 轉換為 RGB
          let [r, g, b] = hslToRgb(h, s, l);

          // 應用色盲模擬
          if (colorBlindType === 'protanopia') {
            ({ r, g, b } = simulateProtanopia(r, g, b));
          } else if (colorBlindType === 'deuteranopia') {
            ({ r, g, b } = simulateDeuteranopia(r, g, b));
          } else if (colorBlindType === 'tritanopia') {
            ({ r, g, b } = simulateTritanopia(r, g, b));
          }

          const displayColor = `rgb(${r}, ${g}, ${b})`;

          return (
            <div
              key={block.id}
              onClick={() => handleMemoryClick(block.id)}
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: block.isFlipped || block.isMatched ? displayColor : '#ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: block.isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                boxShadow: block.isMatched ? '0 0 10px rgba(0,255,0,0.5)' : 'none'
              }}
            />
          );
        })}
      </div>
    );
  };

  // 根據遊戲模式渲染不同的遊戲界面
  const renderGameContent = () => {
    if (gameMode === 'memory_match') {
      return (
        <div className="text-center py-4">
          <h2>記憶配對遊戲</h2>
          <p>嘗試次數：{memoryAttempts}</p>
          <p>得分：{memoryScore}</p>
          {renderMemoryBlocks()}
        </div>
      );
    }

    // 原有的顏色序列遊戲
    return (
      <div className="text-center py-4">
        <h2>第 {questionNumber} / {totalQuestions} 題：請由深到淺點擊色塊</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 90px)`,
            gap: '10px',
            justifyContent: 'center'
          }}
        >
          {blocks.map((blockValue, index) => {
            // 確保 blocks 存在且 blocks.length > 1
            const t = (blocks && blocks.length > 1) ? blockValue / (blocks.length - 1) : 0.5;
            const lightness = 20 + t * 60;
            let [r, g, b] = hslToRgb(hue, 80, lightness);

            if (colorBlindType === 'protanopia') {
              ({ r, g, b } = simulateProtanopia(r, g, b));
            } else if (colorBlindType === 'deuteranopia') {
              ({ r, g, b } = simulateDeuteranopia(r, g, b));
            } else if (colorBlindType === 'tritanopia') {
              ({ r, g, b } = simulateTritanopia(r, g, b));
            }

            return (
              <div
                key={blockValue}
                id={`block-${blockValue}`}
                onClick={() => handleClick(blockValue)}
                style={{
                  width: '90px',
                  height: '90px',
                  backgroundColor: `rgb(${r}, ${g}, ${b})`,
                  border: clickedIds.includes(blockValue) ? '4px solid black' : 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              />
            );
          })}
        </div>
        {/* 修改顯示文字為錯誤次數 */}
        <p style={{ marginTop: '20px' }}>錯誤次數：{errorsCount}</p>
      </div>
    );
  };

  const PreviewOverlay = () => (
    // 確保 correctSequence 和 blocks 已經加載且長度匹配
    (!(correctSequence && blocks && correctSequence.length === blocks.length) || !showPreview) ? null : (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3>正確顏色順序</h3>
        <div style={{
          display: 'flex',
          gap: '10px',
          margin: '20px 0'
        }}>
          {correctSequence.map((value, index) => {
            // 確保 blocks.length - 1 不為 0
            const t = blocks.length > 1 ? value / (blocks.length - 1) : 0.5;
            const lightness = 20 + t * 60;
            let [r, g, b] = hslToRgb(hue, 80, lightness);

            // 應用色盲模擬
            if (colorBlindType === 'protanopia') {
              ({ r, g, b } = simulateProtanopia(r, g, b));
            } else if (colorBlindType === 'deuteranopia') {
              ({ r, g, b } = simulateDeuteranopia(r, g, b));
            } else if (colorBlindType === 'tritanopia') {
              ({ r, g, b } = simulateTritanopia(r, g, b));
            }

            return (
              <div
                key={value}
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: `rgb(${r},${g},${b})`,
                  transition: 'transform 0.3s',
                  transform: `scale(${1 + index * 0.05})`
                }}
              />
            );
          })}
        </div>
        <p style={{ color: '#666' }}></p>
      </div>
    </div>
    )
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f6f6f6',
      fontFamily: 'Arial, sans-serif',
      margin: 0,
      padding: 0
    }}>
      {/* 如果 game_id 不存在，不渲染遊戲內容 */}
      {!game_id ? null : (
        <>
          {showPreview && <PreviewOverlay />}
          {!isFinished ? renderGameContent() : (
            <div className="text-center py-5">
              <h2>🎉 遊戲結束！</h2>
              <p>你的總分是：{gameMode === 'memory_match' ? memoryScore : finalScore}</p>
              {/* 只有在顏色序列模式下顯示得分明細 */}
              {gameMode !== 'memory_match' && (
                <>
                  <h4>每題得分明細：</h4>
                  {/* 確保 history 存在且有數據才渲染表格 */}
                  {history && history.length > 0 ? (
                    <table style={{margin: '0 auto'}}>
                      <thead>
                        <tr>
                          <th>題號</th>
                          <th>錯誤次數</th>
                          <th>時間(秒)</th>
                          <th>本題得分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.question}</td>
                            <td>{item.errors_count}</td>
                            <td>{item.time_used.toFixed(2)}</td>
                            <td>{item.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>沒有得分明細數據。</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GamePage;