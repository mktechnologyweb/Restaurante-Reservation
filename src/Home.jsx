import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import './Home.css';

function Home() {
    const navigate = useNavigate();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [nome, setNome] = useState('');
    const [clienteEncontrado, setClienteEncontrado] = useState(false);

    useEffect(() => {
        const clienteSalvo = localStorage.getItem("clienteSelecionado");
        if (clienteSalvo) {
            setClienteEncontrado(true);
        }
    }, []);

    const handleBuscarCliente = async (e) => {
        e.preventDefault();

        try {
            const clienteDoBanco = await invoke('buscar_cliente', {
                cpf: cpf || null,
                telefone: telefone || null,
                nome: nome || null
            });

            if (clienteDoBanco) {
                localStorage.setItem("clienteSelecionado", JSON.stringify(clienteDoBanco));
                setClienteEncontrado(true);

                try {
                    const reservasDoBanco = await invoke('buscar_reservas_por_cpf', {
                        cpf: clienteDoBanco[1]
                    });

                    localStorage.setItem("reservasCliente", JSON.stringify(reservasDoBanco));
                    navigate("/cliente-detalhes");

                } catch (error) {
                    console.error("Erro ao buscar reservas:", error);
                    alert("Erro ao buscar reservas.");
                }
            } else {
                alert("Cliente não encontrado.");
            }
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            alert("Erro ao buscar cliente.");
        }
    };

    const handleFinalizarAtendimento = () => {
        localStorage.removeItem("clienteSelecionado");
        localStorage.removeItem("reservasCliente");
        setClienteEncontrado(false);
        alert("Atendimento finalizado.");
        navigate("/home"); // Redireciona para a tela principal, se quiser
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
                        {clienteEncontrado && (
                            <>
                                <Link to="/cliente-detalhes">Dados do cliente</Link>
                                <Link onClick={handleFinalizarAtendimento}>Finalizar Atendimento</Link>
                            </>
                        )}
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
                    <div className="search-section">
                        <h1>Buscar Cliente</h1>
                        <form className="search-form" onSubmit={handleBuscarCliente}>
                            <div className="input-group">
                                <input type="text" placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                                <input type="text" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                                <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
                            <button type="submit">Buscar</button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Home;
