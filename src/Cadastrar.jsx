import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import './Home.css';
import './Cadastrar.css';

function Cadastrar() {
    const navigate = useNavigate();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || ""; // Obtém a posição do funcionário
    const [cpf, setCpf] = useState('');
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const result = await invoke('cadastrar_cliente', { cpf, nome, sobrenome, telefone, email });
            if (result.success) {
                alert(result.message);
                setCpf('');
                setNome('');
                setSobrenome('');
                setTelefone('');
                setEmail('');
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            alert("Erro ao cadastrar cliente. Verifique o console para mais detalhes.");
        }
    };

    function handleLogout() {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("employeeName");
        navigate("/");
    }

    return (
        <div className="home-container">
            <header className="header">
                <div className="header-placeholder">
                    <img src="logo.png" alt="Logo" className="logo" />
                </div>
                <h1 className="welcome-title">Olá, {employeeName}!</h1>
                <button className="logout-button" onClick={handleLogout}>Sair</button>
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

                <div className="cadastro-container">
                    <h1>Cadastrar Cliente</h1>
                    <form className="cadastro-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <input type="text" placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                            <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                            <input type="text" placeholder="Sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
                        </div>
                        <div className="form-row">
                            <input type="text" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <button type="submit">Cadastrar</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Cadastrar;