import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface ColorBlock {
    id: number
    color: string
    order: number
}

type Mode = 'normal' | 'protanopia' | 'deuteranopia'

function GamePage() {
    const location = useLocation()
    const count = location.state?.count || 6

    const [blocks, setBlocks] = useState<ColorBlock[]>([])
    const [clickedIds, setClickedIds] = useState<number[]>([])
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [mode, setMode] = useState<Mode>('normal')

    const generateColorBlocks = () => {
        const baseHue = Math.random() * 360
        const step = 360 / count
        let colors: ColorBlock[] = []
        for (let i = 0; i < count; i++) {
            const hue = (baseHue + step * i) % 360
            const rgb = hslToRgb(hue, 100, 60)
            colors.push({
                id: i,
                color: rgb,
                order: i
            })
        }
        colors = [...colors].sort(() => Math.random() - 0.5)
        setBlocks(colors)
        setClickedIds([])
        setIsSubmitted(false)
        setIsCorrect(false)
    }

    useEffect(() => {
        generateColorBlocks()
    }, [])

    const hslToRgb = (h: number, s: number, l: number): string => {
        s /= 100
        l /= 100
        const k = (n: number) => (n + h / 30) % 12
        const a = s * Math.min(l, 1 - l)
        const f = (n: number) =>
            l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1)
        const r = Math.round(255 * f(0))
        const g = Math.round(255 * f(8))
        const b = Math.round(255 * f(4))
        return `rgb(${r}, ${g}, ${b})`
    }

    const parseRgb = (rgb: string): [number, number, number] => {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (!match) return [0, 0, 0]
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
    }

    const simulateColorBlindness = (r: number, g: number, b: number): [number, number, number] => {
        if (mode === 'protanopia') {
            return [
                0.56667 * r + 0.43333 * g,
                0.55833 * r + 0.44167 * g,
                b
            ]
        } else if (mode === 'deuteranopia') {
            return [
                0.625 * r + 0.375 * g,
                0.70 * r + 0.30 * g,
                b
            ]
        } else {
            return [r, g, b]
        }
    }

    const applyColorMode = (color: string): string => {
        const [r, g, b] = parseRgb(color)
        const [nr, ng, nb] = simulateColorBlindness(r, g, b)
        return `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`
    }

    const handleClick = (id: number) => {
        if (clickedIds.includes(id) || isSubmitted) return
        setClickedIds([...clickedIds, id])
    }

    const checkAnswer = () => {
        const correctOrder = [...blocks]
            .sort((a, b) => a.order - b.order)
            .map((block) => block.id)

        const correct = JSON.stringify(clickedIds) === JSON.stringify(correctOrder)
        setIsCorrect(correct)
        setIsSubmitted(true)
    }

    const cycleMode = () => {
        if (mode === 'normal') setMode('protanopia')
        else if (mode === 'protanopia') setMode('deuteranopia')
        else setMode('normal')
    }

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>色塊排序遊戲</h2>
            <p>請依照顏色漸層點擊色塊</p>

            {/* 模式顯示與切換 */}
            <button onClick={cycleMode} style={{ marginBottom: '1rem' }}>
                模式：{mode === 'normal' ? '一般視覺' : mode === 'protanopia' ? '紅色盲' : '綠色盲'}（點擊切換）
            </button>

            {/* 起點與終點提示 */}
            {blocks.length > 0 && (
                <p>
                    起點：
                    <span
                        style={{
                            background: applyColorMode(blocks.find((b) => b.order === 0)?.color || '#000'),
                            display: 'inline-block',
                            width: '40px',
                            height: '20px',
                            margin: '0 8px',
                            border: '1px solid #333'
                        }}
                    ></span>
                    →
                    終點：
                    <span
                        style={{
                            background: applyColorMode(blocks.find((b) => b.order === count - 1)?.color || '#000'),
                            display: 'inline-block',
                            width: '40px',
                            height: '20px',
                            margin: '0 8px',
                            border: '1px solid #333'
                        }}
                    ></span>
                </p>
            )}

            {/* 顯示色塊 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(count))}, 60px)`,
                gap: '12px',
                justifyContent: 'center',
                margin: '2rem 0'
            }}>
                {blocks.map((block) => (
                    <div
                        key={block.id}
                        onClick={() => handleClick(block.id)}
                        style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: applyColorMode(block.color),
                            border: clickedIds.includes(block.id) ? '4px solid black' : '2px solid #ccc',
                            cursor: 'pointer',
                            boxSizing: 'border-box'
                        }}
                    />
                ))}
            </div>

            {/* 顯示順序 */}
            <div>
                <p>你已點選順序：</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {clickedIds.map((id, index) => (
                        <span key={index}>#{id}</span>
                    ))}
                </div>
            </div>

            {/* 按鈕群 */}
            <div style={{ marginTop: '2rem' }}>
                <button onClick={generateColorBlocks} style={{ marginRight: '1rem' }}>
                    重來
                </button>
                <button onClick={checkAnswer}>
                    提交
                </button>
            </div>

            {/* 答案提示 */}
            {isSubmitted && (
                <div style={{ marginTop: '1.5rem', fontSize: '1.2rem' }}>
                    {isCorrect ? (
                        <span style={{ color: 'green' }}>✅ 恭喜你，答對了！</span>
                    ) : (
                        <span style={{ color: 'red' }}>❌ 很可惜，順序不正確，再試一次吧！</span>
                    )}
                </div>
            )}
        </div>
    )
}

export default GamePage