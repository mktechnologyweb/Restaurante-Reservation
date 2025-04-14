import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import './Cadastrar.css';

function EditarCliente() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cliente, setCliente] = useState({
        name_customer: "",
        last_name_customer: "",
        cpf_customer: "",
        telephone_customer: "",
        email_customer: ""
    });

    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    useEffect(() => {
        async function carregarCliente() {
            try {
                const dados = await invoke("buscar_cliente_por_id", { id: parseInt(id) });
                setCliente(dados);
            } catch (error) {
                console.error("Erro ao carregar cliente:", error);
                alert("Erro ao carregar cliente.");
            }
        }

        carregarCliente();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCliente((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await invoke("editar_cliente", {
                idCliente: parseInt(id),
                cpf: cliente.cpf_customer,
                nome: cliente.name_customer,
                sobrenome: cliente.last_name_customer,
                telefone: cliente.telephone_customer,
                email: cliente.email_customer
            });
            alert("Cliente atualizado com sucesso!");
            navigate("/home");
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            alert("Erro ao atualizar cliente.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("employeeName");
        navigate("/");
    };

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
                <main className="content-right">
                    <div className="cadastro-container">
                        <h2>Editar Cliente</h2>
                        <form onSubmit={handleSubmit} className="formulario">
                            <input
                                type="text"
                                name="name_customer"
                                placeholder="Nome"
                                value={cliente.name_customer}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="last_name_customer"
                                placeholder="Sobrenome"
                                value={cliente.last_name_customer}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="cpf_customer"
                                placeholder="CPF"
                                value={cliente.cpf_customer}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="telephone_customer"
                                placeholder="Telefone"
                                value={cliente.telephone_customer}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="email"
                                name="email_customer"
                                placeholder="Email"
                                value={cliente.email_customer}
                                onChange={handleChange}
                                required
                            />
                            <button className="save" type="submit">Salvar Alterações</button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default EditarCliente;
