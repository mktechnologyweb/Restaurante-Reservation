import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import './d.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
function Dashboard() {
  const navigate = useNavigate();
  const employeeName = localStorage.getItem("employeeName") || "Usuário";
  const employeePosition = localStorage.getItem("employeePosition") || "";

  const [stats, setStats] = useState({
    reservas_dia: 0,
    reservas_semana: 0,
    reservas_mes: 0,
    horario_popular: "Sem dados",
    mesa_popular: "Sem dados",
    capacidade_total: 0,
    capacidade_ocupada: 0,
  });

  useEffect(() => {
    invoke("buscar_estatisticas_dashboard")
      .then(setStats)
      .catch(console.error);
  }, []);

  const dadosGrafico = [
    { nome: "Hoje", total: stats.reservas_dia },
    { nome: "Semana", total: stats.reservas_semana },
    { nome: "Mês", total: stats.reservas_mes },
  ];

  return (
    <div className="home-container">
      <header className="header">
        <div className="header-placeholder">
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>
        <h1 className="welcome-title">Olá, {employeeName}!</h1>
        <button className="logout-button" onClick={() => {
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("employeeName");
          navigate("/");
        }}>Sair</button>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <nav className="navigation">
            {employeePosition === "Administrador" && (
              <>
                <Link to="/admin/dashboard">Daschboard</Link>
              </>
            )}
            <Link to="/home">Buscar Clientes</Link>
            <Link to="/cadastrar">Cadastrar</Link>
            <Link to="/cliente-detalhes">Dados do cliente</Link>
           

            {employeePosition === "Administrador" && (
              <>
                <Link to="/admin/lista_clientes">Lista de clientes</Link>
                <Link to="/admin/reservas-clientes">Lista de reservas</Link>
                <Link to="/admin/lista_funcionarios">Lista de Funcionários</Link>
                <Link to="/admin/configuracoes">Configurações</Link>

              </>
            )}
          </nav>
        </aside>

        <main className="content-right">
          <h1>Estatísticas do Sistema</h1>

          <div className="info-cards">
            <p><strong>Horário Mais Movimentado:</strong> {stats.horario_popular}</p>
            <p><strong>Mesa Mais Reservada:</strong> {stats.mesa_popular}</p>
            <p><strong>Capacidade Ocupada:</strong> {stats.capacidade_ocupada} / {stats.capacidade_total}</p>
          </div>

          <h2 style={{ marginTop: "2rem" }}>Reservas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#528891" />
            </BarChart>
          </ResponsiveContainer>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;


