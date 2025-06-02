import React, { useEffect, useState, useRef } from 'react'; 
import { Container, Table, Alert, Spinner } from 'react-bootstrap'; // Import Container and Table components
interface PlayerScore {
    rank: number;
    username: string;
    score: number;
}
const RankPage: React.FC = () => {
    const [topPlayers, setTopPlayers] = useState<PlayerScore[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const hasFetched = useRef(false); // 添加一個 ref 來追蹤是否已抓取數據

    useEffect(() => {
        // 只有在第一次載入且尚未抓取過數據時才執行
        if (!hasFetched.current) {
            hasFetched.current = true; // 標記為已抓取
            const fetchTopScores = async () => {
                setLoading(true);
                setError(null);   // Clear any previous errors

                try {
                    const response = await fetch('http://localhost:8000/get_top_scores');

                    if (!response.ok) {
                        // If HTTP status is not OK, try to read the error message from the response
                        // 尝试读取非OK响应的JSON体，以便获取后端返回的错误信息
                        const errorData = await response.json().catch(() => ({ message: response.statusText || '未知錯誤' })); // 如果不是有效的JSON，捕獲錯誤並提供默認信息
                        throw new Error(errorData.message || `Failed to fetch top scores with status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Fetched top scores data:', data); // 打印獲取的數據方便調試
                    // 確保 data.top_scores 是陣列
                    if (data && Array.isArray(data.top_scores)) {
                        setTopPlayers(data.top_scores);
                    } else {
                        // 如果數據格式不正確，也視為錯誤
                        throw new Error('獲取到的排行榜數據格式不正確');
                    }

                } catch (err: any) { // 將錯誤類型指定為 any 或 Error 以便訪問 message
                    console.error('Error fetching top scores:', err);
                    setError(err.message || 'Failed to load rankings. Please try again later.'); // 設置一個用戶友好的錯誤信息
                } finally {
                    setLoading(false); // Stop loading regardless of success or failure
                }
            };

            fetchTopScores();
        }
    }, []); // 空依賴陣列表示只在組件掛載時執行一次

    return (
        // 使用和主頁面相同的滿版置中 flexbox 樣式
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '100vh', // 使用 minHeight 確保內容不足一屏時也能撐開
            width: '100vw',
            backgroundColor: '#f6f6f6', // 與主頁面背景色一致
            fontFamily: 'Arial, sans-serif',
            margin: 0,
            padding: '20px 0' // 添加一些垂直 padding，避免內容緊貼邊緣
        }}>
            {/* Title */}
            <h1 className="mb-4 text-center">排行榜</h1> {/* 排行榜 means Rankings / Leaderboard */}

            {loading && <Spinner animation="border" role="status" className="d-block mx-auto"><span className="visually-hidden">Loading...</span></Spinner>}
            {error && <Alert variant="danger" className="mx-auto" style={{ maxWidth: '600px' }}>{error}</Alert>}

            {/* Table wrapper for horizontal centering */}
            <div className="mt-4 mx-auto" style={{ maxWidth: '600px' }}>
                {/* Table component with Bootstrap styling */}
                {/* 只有在不載入、沒有錯誤且有數據時才顯示表格 */}
                {!loading && !error && topPlayers.length > 0 ? (
                    <Table striped bordered hover className="shadow-sm" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead>
                            <tr className="bg-primary text-white">
                                <th style={{ padding: '12px 15px' }}>排名</th>
                                <th style={{ padding: '12px 15px' }}>使用者 ID</th>
                                <th style={{ padding: '12px 15px' }}>分數</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Map through the topPlayers data to render table rows */}
                            {topPlayers.map(player => (
                                <tr key={player.rank} style={{ backgroundColor: player.rank % 2 === 0 ? '#f8f9fa' : '#e9ecef' }}> {/* 交替行顏色 */}
                                    <td style={{ padding: '10px 15px' }}>{player.rank}</td>
                                    <td style={{ padding: '10px 15px' }}>{player.username || 'N/A'}</td>
                                    <td>{player.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : !loading && !error && topPlayers.length === 0 ? (
                    // 沒有數據時顯示提示
                    <p className="text-center">目前沒有排行榜數據。</p>
                ) : null}
            </div>
        </div>
    );
};

export default RankPage;