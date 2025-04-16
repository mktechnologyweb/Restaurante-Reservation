
// Este Importe permite a navegação entre as páginas e as informaçoes da url atual.
import { Link, useNavigate, useLocation } from "react-router-dom";

// Este Importe permite o gerenciaamento do estado e os efeitos do componente.
import { useState, useEffect } from "react";

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

//Importa o css
import "./Home.css";
import "./Cadastrar.css";

//Define o componente 
function EditarReserva() {
     //Obtem a função e navega entre as paginas
    const navigate = useNavigate();

    //Pega o objeto location para acessar o estado passado entre as paginas durante a navegação
    const location = useLocation();

    //Recupera o estado passado
    const reserva = location.state?.reserva;

    //Recupera os dados do usuario
    const employeeName = localStorage.getItem("employeeName") || "Usuário";
    const employeePosition = localStorage.getItem("employeePosition") || "";
    //Declara a inicialização dos dados 
    const [dataHora, setDataHora] = useState(reserva?.date_reservation ? `${reserva.date_reservation}T${reserva.time_reservation}` : "");
    const [numeroPessoas, setNumeroPessoas] = useState(reserva?.number_people || "");
    const [nameCustomer, setNameCustomer] = useState(reserva?.name_customer || "");
    const [telephoneCustomer, setTelephoneCustomer] = useState(reserva?.telephone_customer || "");
    const [emailCustomer, setEmailCustomer] = useState(reserva?.email_customer || "");
    const [table_id, setTableId] = useState(reserva?.table_id || "");
    const [status, setStatus] = useState(reserva?.status || "ativa");
    const [erroEdicao, setErroEdicao] = useState("");
    const [mesasDisponiveis, setMesasDisponiveis] = useState([]);


    //Busca mesas disponiveis quando data, hora e numero de pessoas mudam
    useEffect(() => {
        const buscarMesas = async () => {
            //Formata data e hora para o esperado pelo rust
            const dataFormatada = dataHora.length > 16 ? dataHora.slice(0, 16) : dataHora;
            
            //Verifica se os campos estão vazios
            if (!dataHora || !numeroPessoas) return;

            //Lida com erros na chamada do rust
            try {
                 //Busca a função no rust e envia os parametros
                const mesas = await invoke("mesas_disponiveis_para_reserva_edicao", {
                    idReservation: reserva.id_reservation,
                    dateReservation: dataFormatada,
                    numberPeople: parseInt(numeroPessoas)
                });

                //Atualiza o estado se mesas disponiveis
                setMesasDisponiveis(mesas);
            } catch (error) {
                console.error("Erro ao buscar mesas disponíveis:", error);
            }
        };

        //Aqui sera chamado a função buscarMesas
        buscarMesas();
    }, [dataHora, numeroPessoas]);

    //Função para editar os dados
    const editarReserva = async () => {

        try {
             //Formata data e hora para o esperado pelo rust
            const dataFormatada = dataHora.length > 16 ? dataHora.slice(0, 16) : dataHora;
            console.log("Enviando para backend:", {
                id_reservation: reserva.id_reservation,
                date_reservation: dataFormatada,
                number_people: parseInt(numeroPessoas, 10),
                name_customer: nameCustomer,
                telephone_customer: telephoneCustomer,
                email_customer: emailCustomer,
                status: status,
                tableId: table_id,
            });
             //Busca a função no rust e envia os parametros para atualizar
            const resultado = await invoke("editar_reserva_command", {

                idReservation: reserva.id_reservation,
                dateReservation: dataFormatada,
                numberPeople: parseInt(numeroPessoas, 10),
                nameCustomer: nameCustomer,
                telephoneCustomer: telephoneCustomer,
                emailCustomer: emailCustomer,
                status: status,
                tableId: table_id

            });

            if (resultado.success) {
                alert("Reserva atualizada com sucesso!");

                const reservaAtualizada = {
                    ...reserva,
                    date_reservation: dataFormatada.split("T")[0],
                    time_reservation: dataFormatada.split("T")[1],
                    number_people: numeroPessoas,
                    name_customer: nameCustomer,
                    telephone_customer: telephoneCustomer,
                    email_customer: emailCustomer,
                    status: status,
                    tableId: table_id
                };

                //Recupera os dados do cliente selecionado
                const clienteSelecionado = JSON.parse(localStorage.getItem("clienteSelecionado"));
                //Busca pelo cpf
                const cpf = clienteSelecionado?.[1];
                console.log(clienteSelecionado)
                //Se existir busca as reservas atualizadas
                if (cpf) {
                     //Busca a função no rust 
                    const reservasAtualizadas = await invoke("buscar_reservas_por_cpf", { cpf });
                    //Atualiza localStorage
                    localStorage.setItem("reservasCliente", JSON.stringify(reservasAtualizadas));
                }

               //Vai para a pagina enviando os dados atualizados
                navigate("/detalhes", { state: { reserva: reservaAtualizada } });
            } else {
                setErroEdicao("Erro ao atualizar reserva: " + resultado.message);
            }
        } catch (error) {
            setErroEdicao("Erro ao atualizar reserva. Tente novamente.");
        }
    };

    //Funçaõ para finalizar o atendimento limpando os dados do cliente
    const handleFinalizarAtendimento = () => {
        localStorage.removeItem("clienteSelecionado");
        localStorage.removeItem("reservasCliente");
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
                    <h1>Editar Reserva</h1>
                    <form className="cadastro-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-row">
                            <input
                                type="datetime-local"
                                value={dataHora}
                                onChange={(e) => setDataHora(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Número de Pessoas"
                                value={numeroPessoas}
                                onChange={(e) => setNumeroPessoas(e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <input
                                type="text"
                                placeholder="Nome"
                                value={nameCustomer}
                                onChange={(e) => setNameCustomer(e.target.value)}
                            />
                            <input
                                type="tel"
                                placeholder="Telefone"
                                value={telephoneCustomer}
                                onChange={(e) => setTelephoneCustomer(e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <input
                                type="email"
                                placeholder="Email"
                                value={emailCustomer}
                                onChange={(e) => setEmailCustomer(e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <select value={table_id} onChange={(e) => setTableId(parseInt(e.target.value))}>
                                <option value="">Selecione uma mesa</option>
                                {mesasDisponiveis.map(([id, capacidade]) => (
                                    <option key={id} value={id}>
                                        Mesa {id} - {capacidade} pessoas
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="ativa">Ativa</option>
                                <option value="cancelada">Cancelada</option>
                                <option value="concluída">Concluída</option>
                            </select>
                        </div>
                        <button type="button" onClick={editarReserva}>Salvar Alterações</button>
                    </form>
                    {erroEdicao && <div className="erro-reserva"><p>{erroEdicao}</p></div>}
                </div>
            </div>
        </div>
    );
}

export default EditarReserva;
