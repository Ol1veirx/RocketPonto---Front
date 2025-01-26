import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [pointRecords, setPointRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(null);
  const [userInitials, setUserInitials] = useState('');

  const baterPonto = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8081/point-record/save',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      listarPontos();

      const lastRecord = pointRecords[0];
      if (lastRecord && !lastRecord.exitDateHour) {
        setCurrentSession(new Date(lastRecord.entryDateHour));
      }
    } catch (error) {
      alert('Erro ao bater o ponto.');
    }
  };

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      const initials = username.split(' ').map((name) => name[0]).join('');
      setUserInitials(initials.toUpperCase());
    }
  }, []);

  const listarPontos = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8081/point-record/list-by-user', {
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

  return (
    <div className="full-screen-dashboard">
      <div className="dashboard-sidebar">
        <div className="logo-container">
          <div className="logo">{userInitials}</div>
        </div>
        <nav className="dashboard-menu">
          <button className="menu-item active">
            <i className="icon-clock"></i>
            Pontos
          </button>
          <button className="menu-item">
            <i className="icon-calendar"></i>
            Agenda
          </button>
          <button className="menu-item">
            <i className="icon-user"></i>
            Perfil
          </button>
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
            onClick={baterPonto}
            className="punch-button"
          >
            Bater Ponto
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
          <h2>Registros de Ponto</h2>
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

export default Dashboard;