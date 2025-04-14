import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import '../Home.css';
import '../Cadastrar.css';
import './lista_funcionarios.css';

function ListarFuncionario() {
    const navigate = useNavigate();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    const [funcionarios, setFuncionarios] = useState([]);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        lastname: "",
        position: "",
        password: "",
    });

    useEffect(() => {
        carregarFuncionarios();
    }, []);

    const carregarFuncionarios = async () => {
        try {
            const result = await invoke("listar_usuarios");
            setFuncionarios(result); // <- Precisa ser uma lista com os campos certos
        } catch (error) {
            console.error("Erro ao carregar funcionários:", error);
        }
    };

    const iniciarEdicao = (func) => {
        setEditando(func.id_employee);
        setFormData({
            name: func.name_employee,
            lastname: func.lastname_employee,
            position: func.position_employee,
            password: "", // Campo opcional
        });
    };

    const cancelarEdicao = () => {
        setEditando(null);
        setFormData({ name: "", lastname: "", position: "", password: "" });
    };

    const salvarEdicao = async () => {
        try {
            const response = await invoke("editar_usuario_command", {
                idEmployee: editando,
                nameEmployee: formData.name,
                lastnameEmployee: formData.lastname,
                positionEmployee: formData.position,
                passwordEmployee: formData.password,
            });

            if (response.success) {
                alert("Funcionário atualizado com sucesso!");
                cancelarEdicao();
                carregarFuncionarios();
            } else {
                alert("Erro: " + response.message);
            }
        } catch (error) {
            console.error("Erro ao salvar edição:", error);
            alert("Erro ao atualizar funcionário.");
        }
    };
    const excluirFuncionario = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
            try {
                const response = await invoke("excluir_usuario_command", {
                    idEmployee: id,
                });

                if (response.success) {
                    alert("Funcionário excluído com sucesso!");
                    carregarFuncionarios();
                } else {
                    alert("Erro: " + response.message);
                }
            } catch (error) {
                console.error("Erro ao excluir funcionário:", error);
                alert("Erro ao excluir.");
            }
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
                    <h1>Funcionários</h1>
                    <button className="register"><Link className="re" to="/admin/cadastrar-usuarios">Cadastrar Funcionários</Link></button>
                    <table className="tabela-funcionarios">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Sobrenome</th>
                                <th>Cargo</th>
                                <th>Senha</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {funcionarios.map((func) => (
                                <tr key={func.id_employee}>
                                    <td>{func.id_employee}</td>
                                    <td>
                                        {editando === func.id_employee ? (
                                            <input
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                            />
                                        ) : (
                                            func.name_employee
                                        )}
                                    </td>
                                    <td>
                                        {editando === func.id_employee ? (
                                            <input
                                                value={formData.lastname}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, lastname: e.target.value })
                                                }
                                            />
                                        ) : (
                                            func.lastname_employee
                                        )}
                                    </td>
                                    <td>
                                        {editando === func.id_employee ? (
                                            <select
                                                value={formData.position}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, position: e.target.value })
                                                }
                                            >
                                                <option value="Administrador">Administrador</option>
                                                <option value="Atendente">Atendente</option>
                                            </select>
                                        ) : (
                                            func.position_employee
                                        )}
                                    </td>
                                    <td>
                                        {editando === func.id_employee ? (
                                            <input
                                                type="password"
                                                placeholder="Nova senha (opcional)"
                                                value={formData.password}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, password: e.target.value })
                                                }
                                            />
                                        ) : (
                                            "••••••" // ou "" se quiser deixar em branco
                                        )}
                                    </td>
                                    <td>
                                        {editando === func.id_employee ? (
                                            <>
                                                <button onClick={salvarEdicao}>Salvar</button>
                                                <button onClick={cancelarEdicao}>Cancelar</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => iniciarEdicao(func)}>Editar</button>
                                                <button onClick={() => excluirFuncionario(func.id_employee)}>Excluir</button>
                                            </>
                                        )}
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

export default ListarFuncionario;
