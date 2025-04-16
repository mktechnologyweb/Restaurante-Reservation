

// Este Importe permite o gerenciaamento do estado e os efeitos do componente.
import React, { useState, useEffect } from 'react';

// Este Importe permite a navegação entre as páginas.
import { Link, useNavigate } from "react-router-dom";

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

//Importa o css
import './Home.css';

//Define o componente home
function Home() {

    //Obtem a função e navega entre as paginas
    const navigate = useNavigate();

    //Tras os dados do funcionario em localStorage
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    //Declaração e inicialização dos estados para busca dos clientes
    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [nome, setNome] = useState('');
    const [clienteEncontrado, setClienteEncontrado] = useState(false);

    //Execução na montagem do componente
    useEffect(() => {
        const clienteSalvo = localStorage.getItem("clienteSelecionado");
        if (clienteSalvo) {
            setClienteEncontrado(true);
        }
    }, []);

    //Função para buscar os clientes
    const handleBuscarCliente = async (e) => {
        e.preventDefault();

        //Lida com erros na chamada do rust
        try {

            //Busca a função no rust e envia os parametros
            const clienteDoBanco = await invoke('buscar_cliente', {
                cpf: cpf || null,
                telefone: telefone || null,
                nome: nome || null
            });


            //Verifica se o cliente foi encontrado nu rust
            if (clienteDoBanco) {


                //Armazena no localstorage
                localStorage.setItem("clienteSelecionado", JSON.stringify(clienteDoBanco));
                
                
                //Indica que foi encontrado atualizando a função
                setClienteEncontrado(true);

                try {
                    //Busca a função no rust e envia os parametros
                    const reservasDoBanco = await invoke('buscar_reservas_por_cpf', {
                        cpf: clienteDoBanco[1]
                    });


                    //Armazena as reservas
                    localStorage.setItem("reservasCliente", JSON.stringify(reservasDoBanco));
                    
                    //Manda para a pagina
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


    //Funçaõ para finalizar o atendimento limpando os dados do cliente
    const handleFinalizarAtendimento = () => {
        localStorage.removeItem("clienteSelecionado");
        localStorage.removeItem("reservasCliente");
        setClienteEncontrado(false);
        alert("Atendimento finalizado.");
        navigate("/home");
    };

     //Funçao para remover os dados do funcionario para poder deslogar
    function handleLogout() {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("employeeName");
        navigate("/");
    }

    //Retorna a estrutura do jsx
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
