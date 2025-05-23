import React from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
    const navigate = useNavigate()

    const handleStart = (count: number) => {
        navigate('/game', { state: { count } })  // 將難度（色塊數）傳給 GamePage
    }

    return (
        <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
            <h1>🎨 Color Sort Challenge</h1>
            <p>請依照顏色漸層順序點擊色塊，測試你的視覺敏銳度！</p>
            <p>選擇一個難度開始遊戲：</p>
            {[6, 9, 12, 16, 25].map((n) => (
                <button
                    key={n}
                    onClick={() => handleStart(n)}
                    style={{
                        margin: '0.5rem',
                        padding: '1rem 2rem',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                    }}
                >
                    {n} 色塊
                </button>
            ))}
        </div>
    )
}

export default HomePage