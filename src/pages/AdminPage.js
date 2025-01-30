import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const [pointRecords, setPointRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(null);
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      const initials = username.split(' ').map((name) => name[0]).join('');
      setUserInitials(initials.toUpperCase());
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  }

  const listarPontos = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8081/point-record/get-all-point-records', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPointRecords(response.data);

      const lastRecord = response.data[0];
      if (lastRecord && !lastRecord.exitDateHour) {
        setCurrentSession(new Date(lastRecord.entryDateHour));
      }

      setIsLoading(false);
    } catch (error) {
      alert('Erro ao buscar a situação do ponto.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    listarPontos();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentSession) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now - currentSession) / 1000); // Duration in seconds
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        setSessionDuration(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentSession]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodeToken = jwtDecode(token);
      if(decodeToken.roles && decodeToken.roles.includes('ROLE_ADMIN')) {
        setUserRole('ROLE_ADMIN');
      }
    }
  }, [])

  const handleAdminClick = () => {
    navigate('/admin');
  }

  const handleRecordPoints = () => {
    navigate('/dashboard');
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  console.log(userRole)
  return (
    <div className="full-screen-dashboard">
      <div className="dashboard-sidebar">
        <div className="logo-container">
          <div className="logo">{userInitials}</div>
        </div>
        <nav className="dashboard-menu">
          <button className="menu-item active" onClick={handleRecordPoints}>
            <i className="icon-clock"></i>
            Meus Pontos
          </button>
          <button className="menu-item">
            <i className="icon-calendar"></i>
            Agenda
          </button>
          <button className="menu-item">
            <i className="icon-user"></i>
            Perfil
          </button>
          {userRole === 'ROLE_ADMIN' && (
            <button className="menu-item" onClick={handleAdminClick}>
              <i className="icon-settings"></i>
              Área do Admin
            </button>
          )}
        </nav>
      </div>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-time">
            <h1>{currentTime.toLocaleString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}</h1>
            <p>{currentTime.toLocaleTimeString('pt-BR')}</p>
          </div>

          <button
            onClick={logout}
            className="punch-button"
          >
            Sair
          </button>
        </header>

        {currentSession && (
          <div className="session-tracker">
            <div className="session-info">
              <h3>Sessão Atual</h3>
              <p>Início: {formatDate(currentSession)}</p>
              <div className="duration-display">
                <span className="duration-label">Duração:</span>
                <span className="duration-value">{sessionDuration}</span>
              </div>
            </div>
          </div>
        )}

        <section className="records-section">
          <h2>Registros de Ponto dos Colaboradores</h2>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : pointRecords.length > 0 ? (
            <div className="point-records-grid">
              {pointRecords.map((record, index) => (
                <div
                  key={index}
                  className={`point-record ${record.pointRecordStatus === "COMPLETED" ? 'completed' : 'in-progress'}`}
                >
                  <div className="record-header">
                    <span className="status-indicator"></span>
                    <span className="status-text">
                      {record.pointRecordStatus === "COMPLETED" ? "Concluído" : "Em progresso"}
                    </span>
                  </div>
                  <div className="record-details">
                    <div className="detail-entry">
                      <strong>Colaborador:</strong>
                      <p>{record.nameUser}</p>
                    </div>
                    <div className="detail-entry">
                      <strong>Entrada:</strong>
                      <p>{formatDate(record.entryDateHour)}</p>
                    </div>
                    {record.exitDateHour && (
                      <div className="detail-exit">
                        <strong>Saída:</strong>
                        <p>{formatDate(record.exitDateHour)}</p>
                      </div>
                    )}
                    {record.justification && (
                      <div className="detail-justification">
                        <strong>Justificativa:</strong>
                        <p>{record.justification}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhum registro de ponto encontrado</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPage;