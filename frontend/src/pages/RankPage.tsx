import React, { useEffect, useState } from 'react'; 
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

    useEffect(() => {
        const fetchTopScores = async () => {
            setLoading(true); // Start loading
            setError(null);   // Clear any previous errors

            try {
                const response = await fetch('http://localhost:8000/get_top_scores');

                if (!response.ok) {
                    // If HTTP status is not OK, try to read the error message from the response
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch top scores.');
                }

                const data = await response.json();
                console.log(data)
                // Assuming data.top_scores is an array of { rank, username, score }
                setTopPlayers(data.top_scores);
            } catch (err) {
                console.error('Error fetching top scores:', err);
                setError('Failed to load rankings. Please try again later.'); // Set a user-friendly error message
            } finally {
                setLoading(false); // Stop loading regardless of success or failure
            }
        };

        fetchTopScores();
    }, []); // Empty dependency array means this effect runs only once after the initial render

    return (
        // Container for centering and basic spacing
        <Container className="mt-5 text-center">
            {/* Title */}
            <h1 className="mb-4">排行榜</h1> {/* 排行榜 means Rankings / Leaderboard */}

            {/* Table wrapper for horizontal centering */}
            <div className="d-flex justify-content-center">
                {/* Table component with Bootstrap styling */}
                <Table striped bordered hover style={{ maxWidth: '600px' }}>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>User ID</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Map through the topPlayers data to render table rows */}
                        {topPlayers.map(player => (
                            <tr key={player.rank}> {/* Using rank as key, assuming it's unique */}
                                <td>{player.rank}</td>
                                <td>{player.username}</td>
                                <td>{player.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </Container>
    );
};

export default RankPage;