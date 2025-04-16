
// Este Importe permite o gerenciaamento do estado e os efeitos do componente.
import React, { useEffect, useState } from "react";

// Este Importe permite a navegação entre as páginas e acessa os parâmetros dinâmicos da URL
import { useParams, useNavigate, Link } from "react-router-dom";

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

//Importa o css
import './Cadastrar.css';

//Define o componente 
function EditarCliente() {

    //Obtem o objeto na rota atual
    const { id } = useParams();

    //Obtem a função e navega entre as paginas
    const navigate = useNavigate();

     // Definição do estado inicial para edição
    const [cliente, setCliente] = useState({
        name_customer: "",
        last_name_customer: "",
        cpf_customer: "",
        telephone_customer: "",
        email_customer: ""
    });

     //Recupera os dados do usuario
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    //Carregar os dados do cliente e monta o componente.
    useEffect(() => {

        //Função para carregar o cliente
        async function carregarCliente() {

            //Lida com erros na chamada do rust
            try {
                //Busca a função no rust com id
                const dados = await invoke("buscar_cliente_por_id", { id: parseInt(id) });
                setCliente(dados);
            } catch (error) {
                console.error("Erro ao carregar cliente:", error);
                alert("Erro ao carregar cliente.");
            }
        }

        carregarCliente();
    }, [id]);

    // Função para atualizar o estado cliente quando o formulário mudar.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCliente((prev) => ({ ...prev, [name]: value }));
    };
    // Função para enviar o formulário de edição.
    const handleSubmit = async (e) => {
        e.preventDefault();

         //Lida com erros na chamada do rust
        try {
            //Busca a função no rust e envia os parametros
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

    //Funçao para remover os dados do funcionario para poder deslogar
    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("employeeName");
        navigate("/");
    };

    //Retorna a estrutura do jsx
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
