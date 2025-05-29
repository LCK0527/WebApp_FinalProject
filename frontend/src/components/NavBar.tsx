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
    const onLogout = () => {
        setIsLoggedIn(false);
        setUsername("");
        navigate('/');
    };

    return (
        <Navbar expand="lg" className="bg-body-tertiary">
            <Container>
                <Navbar.Brand
                    as={Link}
                    to={{
                        pathname: "/", // The target path
                        state: { // The state object you want to pass
                            username: username,
                            isLoggedIn: isLoggedIn
                            // You can add any other state variables here
                        }
                    }}
                >
                    Home
                </Navbar.Brand>
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link 
                            as={Link}
                            to={{
                                pathname: "/rank", 
                                state: { 
                                    username: username,
                                    isLoggedIn: isLoggedIn
                                }
                            }}
                        >
                            Rank
                        </Nav.Link>
                        {isLoggedIn ? (
                            <Button variant="light" onClick={onLogout}>
                                Log out
                            </Button>
                        ) : (
                            <>
                                <Nav.Link href="/login">Log in</Nav.Link>
                                <Nav.Link href="/newAccount">Create Account</Nav.Link>
                            </>
                        )}
                        
                        
                    </Nav>
                 </Navbar.Collapse>
            </Container>
        </Navbar>
  );
}

export default NavBarComp;