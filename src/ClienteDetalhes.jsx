import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import "./ClienteDetalhes.css";

function ClienteDetalhes() {
    const location = useLocation();
    const navigate = useNavigate();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    // Recupera cliente e reservas do location ou do localStorage
    const clienteState = location.state?.cliente || JSON.parse(localStorage.getItem("clienteSelecionado"));
    const reservasState = location.state?.reservas || JSON.parse(localStorage.getItem("reservasCliente"));

    const [cliente] = useState(clienteState);
    const [reservas] = useState(reservasState || []);
    const [mostrarModal2, setMostrarModal2] = useState(false);
    const [formData, setFormData] = useState(() => {
        if (cliente) {
            return {
                id: cliente[0],
                cpf: cliente[1],
                nome: cliente[2],
                sobrenome: cliente[3] || "",
                telefone: cliente[4],
                email: cliente[5],
            };
        }
        return null;
    });

    if (!cliente || !formData) {
        return <div>Carregando dados do cliente...</div>;
    }

    function handleLogout() {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("employeeName");
        navigate("/");
    }

    const handleEditar = () => {
        setMostrarModal2(true);
    };

    const handleFecharModal = () => {
        setMostrarModal2(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSalvar = async () => {
        try {
            const response = await invoke("editar_cliente", {
                idCliente: formData.id,
                cpf: formData.cpf,
                nome: formData.nome,
                sobrenome: formData.sobrenome,
                telefone: formData.telefone,
                email: formData.email,
            });

            if (response.success) {
                alert("Cliente atualizado com sucesso!");
                setMostrarModal2(false);

                // Atualiza localStorage
                const clienteAtualizado = [
                    formData.id,
                    formData.cpf,
                    formData.nome,
                    formData.sobrenome,
                    formData.telefone,
                    formData.email,
                ];
                localStorage.setItem("clienteSelecionado", JSON.stringify(clienteAtualizado));
            } else {
                alert("Erro: " + response.message);
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao atualizar cliente.");
        }
    };

    const handleExcluir = async () => {
        const confirmacao = confirm("Tem certeza que deseja excluir este cliente?");
        if (!confirmacao) return;

        try {
            const response = await invoke("excluir_cliente", {
                idCliente: formData.id,
            });

            if (response.success) {
                alert("Cliente excluído com sucesso!");
                localStorage.removeItem("clienteSelecionado");
                localStorage.removeItem("reservasCliente");
                navigate("/home");
            } else {
                alert("Erro: " + response.message);
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir cliente.");
        }
    };

    const handleFinalizarAtendimento = () => {
        localStorage.removeItem("clienteSelecionado");
        localStorage.removeItem("reservasCliente");
        navigate("/home");
    };
    const handleDetalhes = (reserva) => {
        
        navigate("/detalhes", { state: { reserva } });
    };

    const handleFazerReserva = () => {
        navigate("/reserva", { state: { cliente } });
    };

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
                        <Link onClick={handleFinalizarAtendimento}>Finalizar Atendimento</Link>
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
               
                    <div className="client-details-container">
                 
                    <h1>Dados do Cliente</h1>
                        
                    
                        <div className="data-grid">
                            <div className="data-item"><span className="data-label">Nome:</span><span className="data-value">{cliente[2]}</span></div>
                            <div className="data-item"><span className="data-label">CPF:</span><span className="data-value">{cliente[1]}</span></div>
                            <div className="data-item"><span className="data-label">Telefone:</span><span className="data-value">{cliente[4]}</span></div>
                            <div className="data-item"><span className="data-label">Email:</span><span className="data-value">{cliente[5]}</span></div>
                             <button className="edit-button" onClick={handleEditar}>Editar dados do cliente</button>
                        </div>

                        {reservas && reservas.length > 0 ? (
                            <div className="reservas-section">
                              
                                <ol>
                                <p>Cliente possui reservas:</p><br />
                                    {reservas.map((reserva) => (
                                        <li key={reserva[0]}>
                                            <button class="btn-details" onClick={() => handleDetalhes(reserva)}>
                                                Reserva {reserva[0]}
                                            </button>
                                        </li>
                                    ))}
                              </ol>
                              <br />
                            </div>
                        ) : (
                            <p>Cliente não possui reservas.</p>
                        )}

                        <div className="button-group">
                            <button className="reserve-button" onClick={handleFazerReserva}>Fazer nova Reserva</button>
                          </div>
                    </div>
                </main>
            </div>

            {mostrarModal2 && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Editar Cliente</h3>
                        <input name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome" />
                        <input name="sobrenome" value={formData.sobrenome} onChange={handleChange} placeholder="Sobrenome" />
                        <input name="cpf" value={formData.cpf} onChange={handleChange} placeholder="CPF" />
                        <input name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telefone" />
                        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                        <div className="modal-buttons">
                            <button className="save" onClick={handleSalvar}>Salvar</button>
                            <button className="cancel" onClick={handleFecharModal}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClienteDetalhes;
