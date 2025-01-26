import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Import the CSS file

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8081/auth/login', { username, password });
      localStorage.setItem('token', response.data);
      localStorage.setItem('username', username);
      console.log(response.data);
      navigate('/dashboard');
    } catch (error) {
      alert('Login falhou.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        {/* Add your preferred image URL here */}
      </div>
      <div className="login-right">
        <div className="login-container">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;