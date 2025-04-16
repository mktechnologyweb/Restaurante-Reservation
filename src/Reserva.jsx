// Este Importe permite a navegação entre as páginas.
import { Link, useNavigate, useLocation } from "react-router-dom";

// Este Importe permite o gerenciaamento do estado e os efeitos do componente.
import { useState, useEffect } from 'react';

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

//Importa o css
import './Home.css';
import './Cadastrar.css';


//Função para cadastrar reserva
function Reserva() {


    //Função para navegar entre as paginas
    const navigate = useNavigate();


    //Acessa o estado passado na navegação
    const location = useLocation();

    //Busca o nome do funionario no localStorage 
    const employeeName = localStorage.getItem("employeeName") || "Usuário";

    //Busca a posição do funionario no localStorage 
    const employeePosition = localStorage.getItem("employeePosition") || "";

    //Recupera os dados do clientes passados durante o estado da navegação
    const cliente = location.state?.cliente;

    //Pega o Id do cliente caso exista
    const customerId = cliente ? cliente[0] : null;

    //Declaração e inicialização dos estados
    const [dataHora, setDataHora] = useState('');
    const [numeroPessoas, setNumeroPessoas] = useState('');
    const [numeroCadeiras, setNumeroCadeiras] = useState(10);
    const [opcoesNumeroPessoas, setOpcoesNumeroPessoas] = useState([]);
    const [reserva, setReserva] = useState(null);
    const [erroReserva, setErroReserva] = useState('');
    const [mesasDisponiveis, setMesasDisponiveis] = useState([]);
    const [tableId, setTableId] = useState('');

    // execução do Hook useEffect quando o componente é montado
    useEffect(() => {

        //Função para gerar o numero de cadeiras
        const gerarOpcoesNumeroPessoas = (cadeiras) => {
            const opcoes = [];

            //Cria um aray de 1 para o numero de cadeiras
            for (let i = 1; i <= cadeiras; i++) {
                opcoes.push(i);
            }
            setOpcoesNumeroPessoas(opcoes);
        };
        //Atualiza o estado gerado com as opçoes
        gerarOpcoesNumeroPessoas(numeroCadeiras);
    }, [numeroCadeiras]);

    //Função para validar a string data e hora
    const validarDataHora = () => {

        //busca se a string tem o caractere T que separa data e hora
        if (!dataHora.includes("T")) return false;

        //Separa a string rm data e hora
        const [date, time] = dataHora.split("T");
        //Expreçoes regulares que validam o formato (AAAA-MM-DD) e da hora (HH:MM).
        const regexData = /^\d{4}-\d{2}-\d{2}$/;
        const regexHora = /^\d{2}:\d{2}$/;

        //Se verdadeiro retorna os dados 
        return regexData.test(date) && regexHora.test(time.slice(0, 5));
    };

    //Função para buscar reservas
    const buscarReserva = async () => {

          //Verifica se os campos foram preenchidos
        if (!dataHora || !numeroPessoas) {
            setErroReserva("Preencha todos os campos antes de buscar a reserva.");
            return;
        }


        //Verifica o formato da data e hora
        if (!validarDataHora()) {
            setErroReserva("Formato de data/hora inválido.");
            return;
        }

        //Extrai data e hora da string
        const [dateReservation, time] = dataHora.split("T");
        const timeReservation = time.slice(0, 5);
        //Lida com erros na chamada do rust
        try {
            //Busca a função no rust
            const reservaDoBanco = await invoke("buscar_reserva_command", {
                customerId,
                dateReservation,
                timeReservation,
                numberPeople: parseInt(numeroPessoas, 10),
            });
            
            //Verifica se reserva foi encontrada no banco e manda para a pagina de detalhes caso tenha
            if (reservaDoBanco) {
                navigate('/detalhes', { state: { reserva: reservaDoBanco } });
            } else {

                //Se não encontrar vai liberar fazer a reserva
                setReserva(null);
                setErroReserva("Reserva não encontrada.");
                buscarMesa();
            }
        } catch (error) {
            console.error("Erro ao buscar reserva:", error);
            setErroReserva("Erro ao buscar reserva. Tente novamente.");
        }
    };

    //Funçaõ ára buscar as mesas
    const buscarMesa = async () => {

        //Verifica se os campos foram preenchidos
        if (!dataHora || !numeroPessoas) {
            alert("Preencha a data/hora e número de pessoas.");
            return;
        }

        //Valida o formato da data e hora
        if (!validarDataHora()) {
            alert("Formato de data/hora inválido.");
            return;
        }
        //Extrai para string
        const [date, time] = dataHora.split("T");
        const horario = time.slice(0, 5);
        const pessoas = parseInt(numeroPessoas, 10);

        //Lida com erros na busca da função do rust
        try {

             //Busca a função no rust
            const cabem = await invoke("verificar_lotacao_command", {
                date,
                timeSlot: horario,
                pessoas,
            });

            //Se estiver cheio mostra a mensagem
            if (!cabem) {
                setErroReserva("Este horário está lotado.");
                setMesasDisponiveis([]);
                return;
            }

            // se não busca no rust
            const mesas = await invoke("mesas_disponiveis_para_reserva", {
                dateReservation: `${date}T${horario}`,
                numberPeople: pessoas,
            });

            //Lista as mesas caso sejam encontradas
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

    //Função para fazer a reserva
    const fazerReserva = async () => {

        //Verifica se houve a seleção da mesa
        if (!tableId) {
            alert("Selecione uma mesa antes de reservar.");
            return;
        }

        //Verifica se não esta vizio
        if (!dataHora || !numeroPessoas) {
            alert("Preencha todos os campos antes de reservar.");
            return;
        }

        //extrai data e hora da string
        const [date, time] = dataHora.split("T");
        const horario = time.slice(0, 5);
        const novaReserva = parseInt(numeroPessoas, 10);


        //Lida com erros na busca da função do rust
        try {


             //Busca a função no rust
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

            //Verifica se foi criado com sucesso no rust
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

    //Funçaõ para finalizar o atendimento limpando os dados do cliente
    const handleFinalizarAtendimento = () => {
        localStorage.removeItem("clienteSelecionado");
        localStorage.removeItem("reservasCliente");
        navigate("/home");
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
