import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import '../Home.css';
import '../Cadastrar.css';

function CadastrarUsuario() {
    const navigate = useNavigate();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    const [formData, setFormData] = useState({
        name_employee: "",
        lastname_employee: "",
        position_employee: "",
        password_employee: ""
    });
    const [mensagem, setMensagem] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await invoke("cadastrar_usuario_command", {
                nameEmployee: formData.name_employee,
                lastnameEmployee: formData.lastname_employee,
                positionEmployee: formData.position_employee,
                passwordEmployee: formData.password_employee
            });

            if (response.success) {
                setMensagem("Funcionário cadastrado com sucesso!");
                setFormData({
                    name_employee: "",
                    lastname_employee: "",
                    position_employee: "",
                    password_employee: ""
                });
            } else {
                setMensagem("Erro: " + response.message);
            }
        } catch (error) {
            console.error("Erro ao cadastrar funcionário:", error);
            setMensagem("Erro ao cadastrar funcionário. Tente novamente.");
        }
    };

    function handleLogout() {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("employeeName");
        navigate("/");
    }

    return (
        <div className="home-container">
            {/* Cabeçalho */}
            <header className="header">
                <div className="header-placeholder">
                    <img src="/logo.png" alt="Logo" className="logo" />
                </div>
                <h1 className="welcome-title">Olá, {employeeName}!</h1>
                <button className="logout-button" onClick={handleLogout}>Sair</button>
            </header>

            {/* Conteúdo principal com menu lateral */}
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

                {/* Formulário de cadastro */}
                <div className="cadastro-container">
                    <h1>Cadastrar Funcionário</h1>
                    <form className="cadastro-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <input
                                type="text"
                                name="name_employee"
                                placeholder="Nome"
                                value={formData.name_employee}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="lastname_employee"
                                placeholder="Sobrenome"
                                value={formData.lastname_employee}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <select
                                name="position_employee"
                                value={formData.position_employee}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione o Cargo</option>
                                <option value="Administrador">Administrador</option>
                                <option value="Atendente">Atendente</option>
                            </select>
                            <input
                                type="password"
                                name="password_employee"
                                placeholder="Senha"
                                value={formData.password_employee}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button type="submit">Cadastrar</button>
                    </form>
                    {mensagem && <p className="mensagem">{mensagem}</p>}
                </div>
            </div>
        </div>
    );
}

export default CadastrarUsuario;
