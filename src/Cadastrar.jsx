
// Este Importe permite o gerenciaamento do estado do componente.
import { useState } from 'react';

// Este Importe permite a navegação entre as páginas.
import { Link, useNavigate } from "react-router-dom";

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

//Importa o css
import './Home.css';
import './Cadastrar.css';

//Define o componente 
function Cadastrar() {

    //Obtem a função e navega entre as paginas
    const navigate = useNavigate();

    //Recupera os dados do usuario
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    //Declara a inicialização dos dados 
    const [cpf, setCpf] = useState('');
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');

    //Função para enviar o formulário
    const handleSubmit = async (e) => {
        e.preventDefault();

        //Lida com os erros no rust
        try {

            //Busca a função no rust e envia os parametros para atualizar
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