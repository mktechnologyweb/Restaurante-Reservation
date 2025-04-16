// Este Importe permite o gerenciaamento do estado e os efeitos do componente.
import React, { useState, useEffect } from 'react';

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

// Este Importe permite a navegação entre as páginas.
import { Link, useNavigate } from "react-router-dom";

// Este Importa o modal.
import Modal from 'react-modal';

//Importa o css
import './ReservasClientes.css';
import '../Home.css';
import '../Cadastrar.css';

//Elemento raiz para o modal
Modal.setAppElement('#root');

//Define o componente 
function ReservasClientes() {
      //Obtem a função e navega entre as paginas
    const navigate = useNavigate();

     //Recupera os dados do usuario
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";

    //Declara a inicialização dos dados 
    const [mesasDisponiveis, setMesasDisponiveis] = useState([]);
    const [reservasClientes, setReservasClientes] = useState([]);
    const [filtroData, setFiltroData] = useState('');
    const [filtroHorario, setFiltroHorario] = useState('');
    const [filtroMesa, setFiltroMesa] = useState('');
    const [reservaEditando, setReservaEditando] = useState(null);

    //Declara a inicialização do estado do formulario de edição 
    const [formData, setFormData] = useState({

        date_reservation: '',
        time_reservation: '',
        number_people: '',
        customer_id: '',
        id_table: '',
    });
    //Estado do modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    //Estado para erros na edição
    const [erroEdicao, setErroEdicao] = useState("");

    //Busca as reservas e monta o estado
    useEffect(() => {
        buscarReservasClientes();
    }, []);

    //Função para buscara lista
    const buscarReservasClientes = async () => {
        //Lida com os erros no rust
        try {
            //Busca a função no rust 
            const reservas = await invoke("buscar_reservas_clientes_command");
            setReservasClientes(reservas);
        } catch (error) {
            console.error("Erro ao buscar reservas de clientes:", error);
        }
    };
    //Busca as mesas e monta o estado quando os dados n de pessoas, hora, data, mudam
    useEffect(() => {
        const buscarMesas = async () => {
            //Se algum campo estiver vazio não faz a busca
            if (!formData.date_reservation || !formData.time_reservation || !formData.number_people) return;

            const dataHora = `${formData.date_reservation}T${formData.time_reservation}`;
            //Lida com os erros no rust
            try {
                 //Busca a função no rust 
                const mesas = await invoke("mesas_disponiveis_para_reserva_edicao", {
                    idReservation: reservaEditando?.id_reservation,
                    dateReservation: dataHora,
                    numberPeople: parseInt(formData.number_people)
                });
                
                //atualiza o estado para mesas disponiveis
                setMesasDisponiveis(mesas);
            } catch (error) {
                console.error("Erro ao buscar mesas disponíveis:", error);
            }
        };

        buscarMesas();
    }, [formData.date_reservation, formData.time_reservation, formData.number_people]);

    //Filtra as mesas com base no filtro
    const filtrarReservas = () => {
        return reservasClientes.filter(reserva => {
            //Verifica se os dados correspondem
            const dataCorreta = !filtroData || reserva.date_reservation === filtroData;
            const horarioCorreto = !filtroHorario || reserva.time_reservation === filtroHorario;
            const mesaCorreta = !filtroMesa || reserva.number_people === parseInt(filtroMesa, 10);
            //Se as condições forem verdadeiras retorna 
            return dataCorreta && horarioCorreto && mesaCorreta;
        });
    };
    //Limpa os filtros
    const limparFiltros = () => {
        setFiltroData('');
        setFiltroHorario('');
        setFiltroMesa('');
    };

    //Função que prepara o preenchimento da reserva
    const editarReserva = (reserva) => {
        setReservaEditando(reserva);
        setFormData({
            date_reservation: reserva.date_reservation,
            time_reservation: reserva.time_reservation,
            number_people: reserva.number_people,
            customer_id: reserva.customer_id,
            id_table: reserva.table_id,
        });
        //abre o modal de edição
        setIsModalOpen(true);
    };

    //Salva a edição
    const salvarEdicao = async () => {
        
        try {

            //Formata o horario
            const timeCompleto = formData.time_reservation.length === 5
                ? formData.time_reservation + ":00"
                : formData.time_reservation;

            const payload = {
                id_reservation: reservaEditando.id_reservation,
                date_reservation: formData.date_reservation + "T" + timeCompleto,
                number_people: parseInt(formData.number_people, 10),
            };

            //Busca a função no rust    
            await invoke("editar_reserva_admin_command", { payload });

            //Atualiza a lista de reservas 
            buscarReservasClientes();

            //Limpa a reserva
            setReservaEditando(null);

            //Fecha modal
            setIsModalOpen(false);

            //Limpa erros
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

    //Cancela a reserva
    const cancelarReserva = async (id) => {

        
        //Lida com os erros no rust
        try {
            //Busca a função no rust 
            await invoke("cancelar_reserva_admin_command", { idReservation: id });

            //Atualiza alista apos o cancelamento
            buscarReservasClientes();
        } catch (error) {
            console.error("Erro ao cancelar reserva:", error);
        }
    };

    
    //Conclui a reserva
    const concluirReserva = async (id) => {
        
        //Lida com os erros no rust
        try {
            //Busca a função no rust 
            await invoke("concluir_reserva_admin_command", { idReservation: id });
            //Atualiza alista
            buscarReservasClientes();
        } catch (error) {
            console.error("Erro ao concluir reserva:", error);
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
