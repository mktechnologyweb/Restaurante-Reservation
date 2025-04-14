import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import './Home.css';
import './Cadastrar.css';

function Reserva() {
    const navigate = useNavigate();
    const location = useLocation();
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";
    const cliente = location.state?.cliente;
    const customerId = cliente ? cliente[0] : null;

    const [dataHora, setDataHora] = useState('');
    const [numeroPessoas, setNumeroPessoas] = useState('');
    const [numeroCadeiras, setNumeroCadeiras] = useState(10);
    const [opcoesNumeroPessoas, setOpcoesNumeroPessoas] = useState([]);
    const [reserva, setReserva] = useState(null);
    const [erroReserva, setErroReserva] = useState('');
    const [mesasDisponiveis, setMesasDisponiveis] = useState([]);
    const [tableId, setTableId] = useState('');

    useEffect(() => {
        const gerarOpcoesNumeroPessoas = (cadeiras) => {
            const opcoes = [];
            for (let i = 1; i <= cadeiras; i++) {
                opcoes.push(i);
            }
            setOpcoesNumeroPessoas(opcoes);
        };
        gerarOpcoesNumeroPessoas(numeroCadeiras);
    }, [numeroCadeiras]);

    const validarDataHora = () => {
        if (!dataHora.includes("T")) return false;
        const [date, time] = dataHora.split("T");
        const regexData = /^\d{4}-\d{2}-\d{2}$/;
        const regexHora = /^\d{2}:\d{2}$/;
        return regexData.test(date) && regexHora.test(time.slice(0, 5));
    };

    const buscarReserva = async () => {
        if (!dataHora || !numeroPessoas) {
            setErroReserva("Preencha todos os campos antes de buscar a reserva.");
            return;
        }

        if (!validarDataHora()) {
            setErroReserva("Formato de data/hora inválido.");
            return;
        }

        const [dateReservation, time] = dataHora.split("T");
        const timeReservation = time.slice(0, 5);

        try {
            const reservaDoBanco = await invoke("buscar_reserva_command", {
                customerId,
                dateReservation,
                timeReservation,
                numberPeople: parseInt(numeroPessoas, 10),
            });

            if (reservaDoBanco) {
                navigate('/detalhes', { state: { reserva: reservaDoBanco } });
            } else {
                setReserva(null);
                setErroReserva("Reserva não encontrada.");
                buscarMesa();
            }
        } catch (error) {
            console.error("Erro ao buscar reserva:", error);
            setErroReserva("Erro ao buscar reserva. Tente novamente.");
        }
    };

    const buscarMesa = async () => {
        if (!dataHora || !numeroPessoas) {
            alert("Preencha a data/hora e número de pessoas.");
            return;
        }

        if (!validarDataHora()) {
            alert("Formato de data/hora inválido.");
            return;
        }

        const [date, time] = dataHora.split("T");
        const horario = time.slice(0, 5);
        const pessoas = parseInt(numeroPessoas, 10);

        try {
            const cabem = await invoke("verificar_lotacao_command", {
                date,
                timeSlot: horario,
                pessoas,
            });

            if (!cabem) {
                setErroReserva("Este horário está lotado.");
                setMesasDisponiveis([]);
                return;
            }

            const mesas = await invoke("mesas_disponiveis_para_reserva", {
                dateReservation: `${date}T${horario}`,
                numberPeople: pessoas,
            });

            if (mesas && mesas.length > 0) {
                setMesasDisponiveis(mesas);
                setErroReserva("");
            } else {
                setMesasDisponiveis([]);
                setErroReserva("Nenhuma mesa disponível para esse horário.");
            }

        } catch (err) {
            console.error("Erro ao buscar mesa:", err);
            setErroReserva("Erro ao buscar mesa.");
        }
    };

    const fazerReserva = async () => {
        if (!tableId) {
            alert("Selecione uma mesa antes de reservar.");
            return;
        }
    
        if (!dataHora || !numeroPessoas) {
            alert("Preencha todos os campos antes de reservar.");
            return;
        }
    
        const [date, time] = dataHora.split("T");
        const horario = time.slice(0, 5);
        const novaReserva = parseInt(numeroPessoas, 10);
    
        try {
            const resultado = await invoke("criar_reserva_command", {
                dateReservation: date,
                timeReservation: horario,
                numberPeople: novaReserva,
                nameCustomer: cliente ? cliente[2] : '',
                telephoneCustomer: cliente ? cliente[4] : '',
                emailCustomer: cliente ? cliente[5] : '',
                customerId,
                status: "ativa",
                tableId,
            });
    
            console.log("Resultado da criação da reserva:", resultado);
    
            if (resultado.success) {
                alert("Reserva criada com sucesso!");
                navigate('/detalhes', { state: { reserva: resultado } });
            } else {
                alert("Erro ao criar reserva: " + resultado.message);
            }
    
        } catch (error) {
            console.error("Erro ao criar reserva:", error);
            alert("Erro ao criar reserva. Tente novamente.");
        }
    };

    const handleFinalizarAtendimento = () => {
        localStorage.removeItem("clienteSelecionado");
        localStorage.removeItem("reservasCliente");
        navigate("/home");
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
                <div className="cadastro-container">
                    <h1>Reservar mesa</h1>
                    <form className="cadastro-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-row">
                            <input
                                type="datetime-local"
                                value={dataHora}
                                onChange={(e) => setDataHora(e.target.value)}
                            />
                            <select value={numeroPessoas || ""} onChange={(e) => setNumeroPessoas(e.target.value)}>
                                <option value="">Selecione o número de pessoas</option>
                                {opcoesNumeroPessoas.map((opcao) => (
                                    <option key={opcao} value={opcao}>{opcao}</option>
                                ))}
                            </select>
                            <input type="text" placeholder="Nome" value={cliente ? cliente[2] : ''} readOnly />
                        </div>
                        <div className="form-row">
                            <input type="tel" placeholder="Telefone" value={cliente ? cliente[4] : ''} readOnly />
                            <input type="email" placeholder="Email" value={cliente ? cliente[5] : ''} readOnly />
                        </div>
                        <button type="button" onClick={buscarReserva}>Buscar Reserva</button>
                    </form>
                    {erroReserva && (
                        <div className="erro-reserva">
                            <p>{erroReserva}</p>
                        </div>
                    )}
                    {mesasDisponiveis.length > 0 && (
                        <div className="form-row">
                            <select value={tableId} onChange={(e) => setTableId(parseInt(e.target.value))}>
                                <option value="">Selecione uma mesa</option>
                                {mesasDisponiveis.map(({ id_tables, quantity_chairs }) => (
                                    <option key={id_tables} value={id_tables}>
                                        Mesa {id_tables} - {quantity_chairs} pessoas
                                    </option>
                                ))}
                            </select>
                            <button type="button" onClick={fazerReserva}>Criar Reserva</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Reserva;
