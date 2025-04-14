import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import '../Home.css';
import '../Cadastrar.css';


function ListarClientes() {
    const navigate = useNavigate();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        try {
            const result = await invoke("listar_clientes");
            setClientes(result);
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
        }
    };

    const editarCliente = (id) => {
        navigate(`/editar_clientes/${id}`);
    };

    const excluirCliente = async (id) => {
        const confirmar = window.confirm("Tem certeza que deseja excluir este cliente?");
        if (!confirmar) return;

        try {
            await invoke("excluir_cliente", { idCliente: id });
            alert("Cliente excluído com sucesso!");
            carregarClientes();
        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
            alert("Erro ao excluir cliente.");
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
                    <img src="/logo.png" alt="Logo" className="logo" />
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
                    <h1>Clientes</h1>
                    <table className="tabela-funcionarios">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Sobrenome</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Ações</th> {/* Nova coluna */}
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((cliente) => (
                                <tr key={cliente.id_customer}>
                                    <td>{cliente.id_customer}</td>
                                    <td>{cliente.name_customer}</td>
                                    <td>{cliente.last_name_customer}</td>
                                    <td>{cliente.telephone_customer}</td>
                                    <td>{cliente.email_customer}</td>
                                    <td>
                                        <button onClick={() => editarCliente(cliente.id_customer)}>Editar</button>
                                        <button onClick={() => excluirCliente(cliente.id_customer)}>Excluir</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ListarClientes;
