import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { Link, useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import './ReservasClientes.css';
import '../Home.css';
import '../Cadastrar.css';

Modal.setAppElement('#root');

function ReservasClientes() {
    const navigate = useNavigate();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";
    const [mesasDisponiveis, setMesasDisponiveis] = useState([]);
    const [reservasClientes, setReservasClientes] = useState([]);
    const [filtroData, setFiltroData] = useState('');
    const [filtroHorario, setFiltroHorario] = useState('');
    const [filtroMesa, setFiltroMesa] = useState('');
    const [reservaEditando, setReservaEditando] = useState(null);
    const [formData, setFormData] = useState({

        date_reservation: '',
        time_reservation: '',
        number_people: '',
        customer_id: '',
        id_table: '',
    });
    console.log(formData)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [erroEdicao, setErroEdicao] = useState("");

    useEffect(() => {
        buscarReservasClientes();
    }, []);

    const buscarReservasClientes = async () => {
        try {
            const reservas = await invoke("buscar_reservas_clientes_command");
            setReservasClientes(reservas);
        } catch (error) {
            console.error("Erro ao buscar reservas de clientes:", error);
        }
    };
    useEffect(() => {
        const buscarMesas = async () => {

            if (!formData.date_reservation || !formData.time_reservation || !formData.number_people) return;

            const dataHora = `${formData.date_reservation}T${formData.time_reservation}`;
            try {
                const mesas = await invoke("mesas_disponiveis_para_reserva_edicao", {
                    idReservation: reservaEditando?.id_reservation,
                    dateReservation: dataHora,
                    numberPeople: parseInt(formData.number_people)
                });

                setMesasDisponiveis(mesas);
            } catch (error) {
                console.error("Erro ao buscar mesas disponíveis:", error);
            }
        };

        buscarMesas();
    }, [formData.date_reservation, formData.time_reservation, formData.number_people]);

    const filtrarReservas = () => {
        return reservasClientes.filter(reserva => {
            const dataCorreta = !filtroData || reserva.date_reservation === filtroData;
            const horarioCorreto = !filtroHorario || reserva.time_reservation === filtroHorario;
            const mesaCorreta = !filtroMesa || reserva.number_people === parseInt(filtroMesa, 10);
            return dataCorreta && horarioCorreto && mesaCorreta;
        });
    };

    const limparFiltros = () => {
        setFiltroData('');
        setFiltroHorario('');
        setFiltroMesa('');
    };

    const editarReserva = (reserva) => {
        setReservaEditando(reserva);
        setFormData({
            date_reservation: reserva.date_reservation,
            time_reservation: reserva.time_reservation,
            number_people: reserva.number_people,
            customer_id: reserva.customer_id,
            id_table: reserva.table_id,
        });
        setIsModalOpen(true);
    };

    const salvarEdicao = async () => {
        try {
            const timeCompleto = formData.time_reservation.length === 5
                ? formData.time_reservation + ":00"
                : formData.time_reservation;

            const payload = {
                id_reservation: reservaEditando.id_reservation,
                date_reservation: formData.date_reservation + "T" + timeCompleto,
                number_people: parseInt(formData.number_people, 10),
            };

            await invoke("editar_reserva_admin_command", { payload });

            buscarReservasClientes();
            setReservaEditando(null);
            setIsModalOpen(false);
            setErroEdicao("");
        } catch (error) {
            console.error("Erro ao salvar edição:", error);

            const mensagem =
                typeof error === "string"
                    ? error
                    : "Erro ao salvar edição. Tente novamente.";

            setErroEdicao(mensagem);
        }
    };
    const cancelarReserva = async (id) => {
        try {
            await invoke("cancelar_reserva_admin_command", { idReservation: id });
            buscarReservasClientes();
        } catch (error) {
            console.error("Erro ao cancelar reserva:", error);
        }
    };

    const concluirReserva = async (id) => {
        try {
            await invoke("concluir_reserva_admin_command", { idReservation: id });
            buscarReservasClientes();
        } catch (error) {
            console.error("Erro ao concluir reserva:", error);
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
                <div className="reservas-clientes-container">
                    <h1>Reservas de Clientes</h1>
                    <div className="filtros">
                        <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} placeholder="Filtrar por data" />
                        <input type="time" value={filtroHorario} onChange={(e) => setFiltroHorario(e.target.value)} placeholder="Filtrar por horário" />
                        <input type="number" value={filtroMesa} onChange={(e) => setFiltroMesa(e.target.value)} placeholder="Filtrar por mesa" />
                        <button className='edit' onClick={limparFiltros}>Limpar</button>
                    </div>
                    <table className="reservas-table">
                        <thead>
                            <tr>
                                <th>Nome do Cliente</th>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Mesa</th>
                                <th>Nº de Pessoas</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrarReservas().map(reserva => (
                                <tr key={reserva.id_reservation}>
                                    <td>{reserva.name_customer}</td>
                                    <td>{reserva.date_reservation}</td>
                                    <td>{reserva.time_reservation}</td>
                                    <td>{reserva.table_id}</td>
                                    <td>{reserva.number_people}</td>
                                    <td>{reserva.status || "Pendente"}</td>
                                    <td className="actions-cell">
                                        <button className='edit' onClick={() => editarReserva(reserva)}>Editar</button>
                                        <button className='canncel' onClick={() => cancelarReserva(reserva.id_reservation)}>Cancelar</button>
                                        {reserva.status !== "Concluída" && (
                                            <button className='conclude' onClick={() => concluirReserva(reserva.id_reservation)}>Concluir</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Modal
                        isOpen={isModalOpen}
                        onRequestClose={() => setIsModalOpen(false)}
                        contentLabel="Editar Reserva"
                        className="modal"
                        overlayClassName="overlay"
                    >
                        <h2>Editar Reserva</h2>
                        <div className="modal-content">
                            <label>Data:</label>
                            <input
                                type="date"
                                value={formData.date_reservation}
                                onChange={(e) => setFormData({ ...formData, date_reservation: e.target.value })}
                            />

                            <label>Horário:</label>
                            <input
                                type="time"
                                value={formData.time_reservation}
                                onChange={(e) => setFormData({ ...formData, time_reservation: e.target.value })}
                            />

                            <label>Nº de Pessoas:</label>
                            <input
                                type="number"
                                value={formData.number_people}
                                onChange={(e) => setFormData({ ...formData, number_people: e.target.value })}
                            />

                            <label>Mesa Disponível:</label>
                            <select
                                value={formData.id_table}
                                onChange={(e) => setFormData({ ...formData, id_table: parseInt(e.target.value) })}
                            >
                                <option value="">Selecione uma mesa</option>
                                {mesasDisponiveis.map(([id, capacidade]) => (
                                    <option key={id} value={id}>
                                        Mesa {id} - {capacidade} pessoas
                                    </option>
                                ))}
                            </select>

                            <label>Status:</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="ativa">Ativa</option>
                                <option value="cancelada">Cancelada</option>
                                <option value="concluída">Concluída</option>
                            </select>
                            <label>Número de Confirmação:</label>
                            <p>{formData.customer_id}</p>

                            <div className="modal-actions">
                                <button className='edit' onClick={salvarEdicao}>Salvar</button>
                                <button className='canncel' onClick={() => setIsModalOpen(false)}>Cancelar</button>
                            </div>
                        </div>
                        {erroEdicao && <div className="erro-reserva"><p>{erroEdicao}</p></div>}
                    </Modal>
                </div>
            </div>
        </div>
    );
}

export default ReservasClientes;
