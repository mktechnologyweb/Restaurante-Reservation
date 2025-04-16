
// Este Importe permite o gerenciaamento do estado e os efeitos do componente.
import { useState, useEffect } from "react";

// Este Importe permite a navegação entre as páginas.
import { Link, useNavigate } from "react-router-dom";

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

//Importa o css
import "../Home.css";
import "../Cadastrar.css";
import "./Mesa.css";

//Define o componente 
function Configuracoes() {

   //Obtem a função e navega entre as paginas
  const navigate = useNavigate();

  //Recupera os dados do usuario
  const employeeName = localStorage.getItem("employeeName") || "Usuário";
  const employeePosition = localStorage.getItem("employeePosition") || "";

  //Declara a inicialização dos dados 
  const [mesas, setMesas] = useState([]);
  const [tipoMesa, setTipoMesa] = useState("");
  const [cadeirasMesa, setCadeirasMesa] = useState(0);
  const [editandoMesaId, setEditandoMesaId] = useState(null);

  //Declara a inicialização dos dados 
  const [horarios, setHorarios] = useState([]);
  const [horarioEditando, setHorarioEditando] = useState(null);
  const [horaAbertura, setHoraAbertura] = useState("");
  const [horaFechamento, setHoraFechamento] = useState("");

  const [novoDia, setNovoDia] = useState("");
  const [novoHorarioAbertura, setNovoHorarioAbertura] = useState("");
  const [novoHorarioFechamento, setNovoHorarioFechamento] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [mesasPerPage] = useState(5);

  const [mostrarMesas, setMostrarMesas] = useState(false);
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [mostrarCapacidade, setMostrarCapacidade] = useState(false);

  const [capacidadeTotal, setCapacidadeTotal] = useState(0);
  const [novaCapacidade, setNovaCapacidade] = useState(0);
  const [capacidadeOcupada, setCapacidadeOcupada] = useState(0);

  //Busca e onta os daddos 
  useEffect(() => {
    //chamada das funções
    buscarMesas();
    buscarHorarios();
    buscarCapacidade();
    buscarCapacidadeOcupada();
  }, []);

  //Função para buscar as mesas
  async function buscarMesas() {

     //Lida com os erros no rust
    try {
      //Busca a função no rust 
      const resultado = await invoke("listar_mesas");
      setMesas(resultado);
    } catch (error) {
      console.error("Erro ao buscar mesas:", error);
    }
  }

  //Função para buscar os horarios
  async function buscarHorarios() {

     //Lida com os erros no rust
    try {

       //Busca a função no rust 
      const resultado = await invoke("listar_horarios");
      setHorarios(resultado);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    }
  }

  //Função para buscar a capacidade
  async function buscarCapacidade() {

      //Lida com os erros no rust
    try {
      //Busca a função no rust 
      const resultado = await invoke("obter_capacidade_total");
      setCapacidadeTotal(resultado);
    } catch (error) {
      console.error("Erro ao obter capacidade total:", error);
    }
  }

  //Função para buscar se esta ocupada a capacidade
  async function buscarCapacidadeOcupada() {

    //Lida com os erros no rust
    try {

      //Busca a função no rust 
      const resultado = await invoke("obter_capacidade_ocupada");
      setCapacidadeOcupada(resultado);
    } catch (error) {
      console.error("Erro ao obter capacidade ocupada:", error);
    }
  }

  //Função para enviar os dados
  async function handleSubmit(e) {
    e.preventDefault();
    //Lida com os erros no rust
    try {
      if (editandoMesaId) {

        //Busca a função no rust 
        await invoke("editar_mesa", {
          id: editandoMesaId,
          tipo: tipoMesa,
          cadeiras: cadeirasMesa,
        });
      } else {

        //Busca a função no rust 
        await invoke("cadastrar_mesa", {
          tipo: tipoMesa,
          cadeiras: cadeirasMesa,
        });
      }
      setTipoMesa("");
      setCadeirasMesa(0);
      setEditandoMesaId(null);
      buscarMesas();
    } catch (error) {
      console.error("Erro ao salvar mesa:", error);
    }
  }

  //Inicia a edição
  function iniciarEdicao(mesa) {

    //Informa o estado com o valor a ser eidtado
    setTipoMesa(mesa.tipo_tables);

    //Informa o estado com a quantidade a ser eidtado
    setCadeirasMesa(mesa.quantity_chairs);

    //Informa o estado do id a ser eidtado
    setEditandoMesaId(mesa.id_tables);
  }

  //Função para excluir a mesa
  async function excluirMesa(id) {

    //Pergunta se vai mesmo excluir
    if (!window.confirm("Deseja excluir esta mesa?")) return;

    //Lida com os erros no rust
    try {

      //Busca a função no rust 
      await invoke("excluir_mesa", { id });
      buscarMesas();
    } catch (error) {
      console.error("Erro ao excluir mesa:", error);
    }
  }

    //Função para cadastrar horario
  async function cadastrarHorario() {
     //Lida com os erros no rust
    try {
        //Busca a função no rust 
      await invoke("cadastrar_horario", {
        dayOfWeek: novoDia,
        openingTime: novoHorarioAbertura,
        closingTime: novoHorarioFechamento,
      });
      setNovoDia("");
      setNovoHorarioAbertura("");
      setNovoHorarioFechamento("");
      buscarHorarios();
    } catch (error) {
      console.error("Erro ao cadastrar horário:", error);
    }
  }

  //Função para edição
  function iniciarEdicaoHorario(horario) {
    //Define os estados
    setHorarioEditando(horario.day_of_week);
    setHoraAbertura(horario.opening_time);
    setHoraFechamento(horario.closing_time);
  }

  //Função para salvar 
  async function salvarHorarioEditado() {

     //Lida com os erros no rust
    try {

       //Busca a função no rust 
      await invoke("editar_horario", {
        dayOfWeek: horarioEditando,
        openingTime: horaAbertura,
        closingTime: horaFechamento,
      });
      setHorarioEditando(null);
      setHoraAbertura("");
      setHoraFechamento("");
      buscarHorarios();
    } catch (error) {
      console.error("Erro ao editar horário:", error);
    }
  }
 //Função para excluir horario 
  async function excluirHorario(dayOfWeek) {
    if (!window.confirm("Deseja excluir este horário?")) return;

    //Lida com os erros no rust
    try {

      //Busca a função no rust 
      await invoke("excluir_horario", { dayOfWeek });
      buscarHorarios();
    } catch (error) {
      console.error("Erro ao excluir horário:", error);
    }
  }
  //Função para atualizar
  async function atualizarCapacidade() {

    //Lida com os erros no rust
    try {

      //Busca a função no rust 
      await invoke("atualizar_capacidade_total", { novaCapacidade });
      setNovaCapacidade(0);
      buscarCapacidade();
    } catch (error) {
      console.error("Erro ao atualizar capacidade:", error);
    }
  }

  //Funçao para remover os dados do funcionario para poder deslogar
  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  //É feito o calculo do índice da última mesa na página atual.
  const indexOfLastMesa = currentPage * mesasPerPage;

  //É feito o calculo do índice da primeira mesa na página atual
  const indexOfFirstMesa = indexOfLastMesa - mesasPerPage;

  //Aqui Cria um novo array contendo apenas as mesas da página atual
  const currentMesas = mesas.slice(indexOfFirstMesa, indexOfLastMesa);

  ///É feito o calculo do número total de páginas necessárias para exibir todas as mesas
  const totalPages = Math.ceil(mesas.length / mesasPerPage);

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

        <main className="content-area">
          <div className="content-grid">
          
            <button className="toggle-section" onClick={() => setMostrarMesas(!mostrarMesas)}>
              {mostrarMesas ? "⯆ Ocultar Gerenciar Mesas" : "⯈ Gerenciar Mesas"}
            </button>
            {mostrarMesas && (
              <div className="mesas-section">
                <h2>Gerenciar Mesas</h2>
                <form onSubmit={handleSubmit} className="mesa-form">
                  <select value={tipoMesa} onChange={(e) => setTipoMesa(e.target.value)} required>
                    <option disabled value="">Selecione o tipo da mesa</option>
                    <option value="2 pessoas">2 pessoas</option>
                    <option value="4 pessoas">4 pessoas</option>
                    <option value="Festa (5+ pessoas)">Festa (5+ pessoas)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Quantidade de cadeiras"
                    value={cadeirasMesa}
                    onChange={(e) => setCadeirasMesa(parseInt(e.target.value))}
                    required
                  />
                  <button type="submit">{editandoMesaId ? "Salvar Alterações" : "Cadastrar Mesa"}</button>
                </form>
                <table className="tabela-mesas">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Cadeiras</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMesas.map((mesa) => (
                      <tr key={mesa.id_tables}>
                        <td>{mesa.id_tables}</td>
                        <td>{mesa.tipo_tables}</td>
                        <td>{mesa.quantity_chairs}</td>
                        <td>
                          <button onClick={() => iniciarEdicao(mesa)}>Editar</button>
                          <button onClick={() => excluirMesa(mesa.id_tables)}>Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={currentPage === i + 1 ? "active" : ""}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}


            <button className="toggle-section" onClick={() => setMostrarHorarios(!mostrarHorarios)}>
              {mostrarHorarios ? "⯆ Ocultar Gerenciar Horários" : "⯈ Gerenciar Horários"}
            </button>
            {mostrarHorarios && (
              <div className="horarios-section">
                <h2>Gerenciar Horários</h2>
                <table className="tabela-horarios">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      <th>Abertura</th>
                      <th>Fechamento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((horario, index) => (
                      <tr key={index}>
                        <td>{horario.day_of_week}</td>
                        <td>{horarioEditando === horario.day_of_week ? (
                          <input type="time" value={horaAbertura} onChange={(e) => setHoraAbertura(e.target.value)} />
                        ) : horario.opening_time}</td>
                        <td>{horarioEditando === horario.day_of_week ? (
                          <input type="time" value={horaFechamento} onChange={(e) => setHoraFechamento(e.target.value)} />
                        ) : horario.closing_time}</td>
                        <td>{horarioEditando === horario.day_of_week ? (
                          <>
                            <button className="edit" onClick={salvarHorarioEditado}>Salvar</button>
                            <button className="canncel" onClick={() => setHorarioEditando(null)}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button className="edit" onClick={() => iniciarEdicaoHorario(horario)}>Editar</button>
                            <button className="canncel" onClick={() => excluirHorario(horario.day_of_week)}>Excluir</button>
                          </>
                        )}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="formulario-horario">
                  <h3>Adicionar novo horário</h3>
                  <select value={novoDia} onChange={(e) => setNovoDia(e.target.value)} required>
                    <option value="">Selecione o dia</option>
                    {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((dia) => (
                      <option key={dia} value={dia}>{dia}</option>
                    ))}
                  </select>
                  <input type="time" value={novoHorarioAbertura} onChange={(e) => setNovoHorarioAbertura(e.target.value)} required />
                  <input type="time" value={novoHorarioFechamento} onChange={(e) => setNovoHorarioFechamento(e.target.value)} required />
                  <button onClick={cadastrarHorario}>Cadastrar Horário</button>
                </div>
              </div>
            )}

            <button className="toggle-section" onClick={() => setMostrarCapacidade(!mostrarCapacidade)}>
              {mostrarCapacidade ? "⯆ Ocultar Capacidade Total" : "⯈ Capacidade Total"}
            </button>
            {mostrarCapacidade && (
              <div>
                <h2>Capacidade do Restaurante</h2>
                <p><strong>Total:</strong> {capacidadeTotal} pessoas</p>
                <p><strong>Ocupada:</strong> {capacidadeOcupada} pessoas</p>
                <p><strong>Disponível:</strong> {capacidadeTotal - capacidadeOcupada} pessoas</p>
                <div>
                  <input
                    type="number"
                    placeholder="Nova capacidade"
                    value={novaCapacidade}
                    onChange={(e) => setNovaCapacidade(parseInt(e.target.value))}
                    style={{ marginRight: "10px" }}
                  />
                  <button className="edit" onClick={atualizarCapacidade}>Atualizar Capacidade</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Configuracoes;
