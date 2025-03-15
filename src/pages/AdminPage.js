import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './Dashboard.css';
import './AdminPage.css';
import { useNavigate } from 'react-router-dom';
import config from '../config/api';

const AdminPage = () => {
  const [pointRecords, setPointRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');

  // Variáveis para paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

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
  };

  const listarPontos = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrlProduction}/point-record/get-all-point-records`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          size: pageSize
        }
      });

      // Atualiza os registros e informações de paginação
      setPointRecords(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);

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
  }, [currentPage, pageSize]); // Executa quando a página ou tamanho da página mudar

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodeToken = jwtDecode(token);
      if(decodeToken.roles && decodeToken.roles.includes('ROLE_ADMIN')) {
        setUserRole('ROLE_ADMIN');
      }
    }
  }, []);

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleRecordPoints = () => {
    navigate('/dashboard');
  };

  // Funções para controlar a paginação
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value));
    setCurrentPage(0); // Volta para a primeira página quando mudar o tamanho
  };

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

  // Função para verificar se o registro é do dia corrente
  const isToday = (date) => {
    const today = new Date();
    return (
      today.getDate() === new Date(date).getDate() &&
      today.getMonth() === new Date(date).getMonth() &&
      today.getFullYear() === new Date(date).getFullYear()
    );
  };

  // Função para agrupar os registros por dia
  const groupByDate = (records) => {
    const todayRecords = [];
    const pastRecords = [];

    records.forEach(record => {
      if (isToday(record.entryDateHour)) {
        todayRecords.push(record);
      } else {
        pastRecords.push(record);
      }
    });

    return { todayRecords, pastRecords };
  };

  const { todayRecords, pastRecords } = groupByDate(pointRecords);

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

          <button onClick={logout} className="punch-button">
            Sair
          </button>
        </header>

        <section className="records-section">
          <h2>Registros de Ponto dos Colaboradores</h2>

          {/* Controles de paginação */}
          <div className="pagination-controls">
            <div className="page-size-selector">
              <label htmlFor="pageSize">Itens por página:</label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="pagination-info">
              Mostrando {pointRecords.length > 0 ? currentPage * pageSize + 1 : 0} - {Math.min((currentPage + 1) * pageSize, totalElements)} de {totalElements} registros
            </div>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : pointRecords.length > 0 ? (
            <>
              {/* Registros de Hoje */}
              {todayRecords.length > 0 && (
                <div className="point-records-today">
                  <h3>Hoje</h3>
                  <div className="point-records-grid">
                    {todayRecords.map((record, index) => (
                      <div key={index} className={`point-record ${record.pointRecordStatus === "COMPLETED" ? 'completed' : 'in-progress'}`}>
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
                          {record.description && (
                            <div className="detail-justification">
                              <strong>Descrição:</strong>
                              <p>{record.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registros de Outros Dias */}
              {pastRecords.length > 0 && (
                <div className="point-records-other-days">
                  <h3>Outros Dias</h3>
                  <div className="point-records-grid">
                    {pastRecords.map((record, index) => (
                      <div key={index} className={`point-record ${record.pointRecordStatus === "COMPLETED" ? 'completed' : 'in-progress'}`}>
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
                          {record.description && (
                            <div className="detail-justification">
                              <strong>Justificativa:</strong>
                              <p>{record.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controles de navegação entre páginas */}
              <div className="pagination-navigation">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                  className="pagination-button"
                >
                  &laquo; Primeira
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="pagination-button"
                >
                  &lt; Anterior
                </button>

                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`pagination-page ${currentPage === i ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  )).slice(
                    Math.max(0, currentPage - 2),
                    Math.min(totalPages, currentPage + 3)
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="pagination-button"
                >
                  Próxima &gt;
                </button>
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  className="pagination-button"
                >
                  Última &raquo;
                </button>
              </div>
            </>
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