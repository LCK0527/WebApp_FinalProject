import { Form, Button, Alert } from 'react-bootstrap';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
    username: string;
    setUsername: (username: string) => void;
    isLoggedIn: boolean; // Will be used if Login needs to know current status
    setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const Login:React.FC<LoginPageProps> = ({ username, setUsername, isLoggedIn, setIsLoggedIn}) => {
    const navigate = useNavigate();
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


    const handleLoginAttempt = async (event: React.FormEvent) => {
      event.preventDefault(); // Prevent the default browser form submission (page reload)

      setError(null); // Clear any previous error messages
      setLoading(true); // Set loading state to true to disable button/inputs

      try {
        const response = await fetch('http://localhost:8000/log_in', {
          method: 'POST', // Matches @app.post() in FastAPI
          headers: {
            'Content-Type': 'application/json', // Important: tell the server we're sending JSON
          },
          // Send the username and password in the request body as JSON
          // The keys 'username' and 'password_hash' must match your FastAPI's LoginRequest Pydantic model
          body: JSON.stringify({
            username: username,
            password_hash: password, // Frontend sends 'password', backend expects 'password_hash'
          }),
        });

        // Check if the HTTP response status is OK (e.g., 200)
        if (!response.ok) {
          // If the HTTP status is not OK (e.g., 400, 401, 500), try to read the error message
          const errorData = await response.json();
          const errorMessage = errorData.message || 'An unexpected error occurred during login.';
          setError(errorMessage);
          console.error('Login HTTP error:', response.status, errorMessage);
          return; // Exit the function if HTTP response is not OK
        }

        // Parse the JSON response from the backend
        const data = await response.json(); // Data will be like { success: true, user_name: "..." } or { success: false, message: "..." }

        // Check the 'success' field in the JSON data from the backend
        if (data.success) {
          // Login was successful!
          console.log('Login successful:', data.user_name);
          setUsername(data.user_name);
          setIsLoggedIn(true);
          navigate('/'); 
        } else {
          // Login failed based on backend's logic (e.g., invalid credentials)
          const errorMessage = data.message || 'Invalid username or password.';
          setError(errorMessage);
          console.error('Login failed:', errorMessage);
        }
      } catch (err) {
        // Catch network errors (e.g., server not running, no internet) or other unexpected errors
        console.error('Network error or unexpected error:', err);
        setError('Could not connect to the server. Please try again.');
      } finally {
        setLoading(false); // Always stop loading, regardless of success or failure
      }
    };

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
            padding: '20px 0' 
        }}>
        <h2 className="mb-4 text-center">Login</h2>
        <div style={{ maxWidth: '350px' }}>
        {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
                {error}
            </Alert>
        )}
        <Form onSubmit={handleLoginAttempt}>
            <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)} 
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              Login
            </Button>
        </Form>
        </div>
    </div>
  );
};

export default Login;