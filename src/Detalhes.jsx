import { Link, useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import './Home.css';
import './Detalhes.css';

function Detalhes() {
    const navigate = useNavigate();
    const location = useLocation();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";
    const reserva = location.state?.reserva;

    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("employeeName");
        navigate("/");
    };

    const handleFinalizarAtendimento = () => {
        localStorage.removeItem("clienteSelecionado");
        localStorage.removeItem("reservasCliente");
        navigate("/home");
    };

    const handleEditarReserva = () => {
        navigate('/editar-reserva', { state: { reserva: reserva } });
       
    };

    const cancelarReserva = async () => {
        try {
            const resultado = await invoke("cancelar_reserva_command", {
                idReservation: reserva.id_reservation,
            });
            if (resultado.success) {
                alert("Reserva cancelada com sucesso!");
                navigate("/reserva");
            } else {
                alert("Erro ao cancelar reserva: " + resultado.message);
            }
        } catch (error) {
            alert("Erro ao cancelar reserva. Tente novamente.");
        }
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
                        <Link to="/cliente-detalhes">Dados do cliente</Link>
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
                <div className="detalhes-container">
                    <h1>Detalhes da reserva</h1>
                    {reserva && (
                        <div className="detalhes-form">
                            <div className="form-row">
                                <label>Número de confirmação</label>
                                <input type="text" value={reserva.id_reservation} readOnly />
                            </div>
                            <div className="form-row">
                                <label>Data</label>
                                <input type="text" value={reserva.date_reservation} readOnly />
                            </div>
                            <div className="form-row">
                                <label>Horário da reserva</label>
                                <input type="text" value={reserva.time_reservation} readOnly />
                            </div>
                            <div className="form-row">
                                <label>Número de pessoas</label>
                                <input type="text" value={reserva.number_people} readOnly />
                            </div>
                            <div className="form-row">
                                <label>Número da mesa</label>
                                <input type="text" value={reserva.table_id} readOnly />
                            </div>
                            <div className="form-row">
                                <label>Nome</label>
                                <input type="text" value={reserva.name_customer} readOnly />
                            </div>
                            <div className="form-row">
                                <label>Email</label>
                                <input type="email" value={reserva.email_customer} readOnly />
                            </div>
                            <div className="form-row">
                                <label>Status</label>
                                <input type="text" value={reserva.status} readOnly />
                            </div>
                            <div className="button-row">
                                <button className="edit-button" onClick={handleEditarReserva}>Editar</button>
                                <button className="cancel-button" onClick={cancelarReserva}>Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Detalhes;
