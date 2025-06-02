import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import React, { useState,useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

interface NavBarCompProps {
    username: string;
    isLoggedIn: boolean;
    setUsername: (username: string) => void;
    setIsLoggedIn: (isLoggedIn: boolean) => void;

}

const NavBarComp: React.FC<NavBarCompProps> = ({ username, isLoggedIn, setUsername, setIsLoggedIn }) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    const onLogout = () => {
        setIsLoggedIn(false);
        setUsername("");
        navigate('/');
        setExpanded(false);
    };

    const handleNavLinkClick = () => {
        setExpanded(false);
    };

    return (
        <Navbar
            expand="lg"
            bg="light"
            variant="light"
            className="w-100"
            style={{ backgroundColor: "#f6f6f6" }}
            expanded={expanded}
            onToggle={setExpanded}
        >
            <Container fluid>
                <Navbar.Brand as={Link} to="/" onClick={handleNavLinkClick}>Home</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/rank" onClick={handleNavLinkClick}>排行榜</Nav.Link>
                        {isLoggedIn ? (
                            <>
                                <Button variant="light" onClick={onLogout}>
                                    登出
                                </Button>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login" onClick={handleNavLinkClick}>登入</Nav.Link>
                                <Nav.Link as={Link} to="/newAccount" onClick={handleNavLinkClick}>註冊</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
  );
}

export default NavBarComp;