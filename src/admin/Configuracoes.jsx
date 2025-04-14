import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import "../Home.css";
import "../Cadastrar.css";
import "./Mesa.css";

function Configuracoes() {
  const navigate = useNavigate();
  const employeeName = localStorage.getItem("employeeName") || "Usuário";
  const employeePosition = localStorage.getItem("employeePosition") || "";

  const [mesas, setMesas] = useState([]);
  const [tipoMesa, setTipoMesa] = useState("");
  const [cadeirasMesa, setCadeirasMesa] = useState(0);
  const [editandoMesaId, setEditandoMesaId] = useState(null);

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

  useEffect(() => {
    buscarMesas();
    buscarHorarios();
    buscarCapacidade();
    buscarCapacidadeOcupada();
  }, []);

  async function buscarMesas() {
    try {
      const resultado = await invoke("listar_mesas");
      setMesas(resultado);
    } catch (error) {
      console.error("Erro ao buscar mesas:", error);
    }
  }

  async function buscarHorarios() {
    try {
      const resultado = await invoke("listar_horarios");
      setHorarios(resultado);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    }
  }

  async function buscarCapacidade() {
    try {
      const resultado = await invoke("obter_capacidade_total");
      setCapacidadeTotal(resultado);
    } catch (error) {
      console.error("Erro ao obter capacidade total:", error);
    }
  }

  async function buscarCapacidadeOcupada() {
    try {
      const resultado = await invoke("obter_capacidade_ocupada");
      setCapacidadeOcupada(resultado);
    } catch (error) {
      console.error("Erro ao obter capacidade ocupada:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editandoMesaId) {
        await invoke("editar_mesa", {
          id: editandoMesaId,
          tipo: tipoMesa,
          cadeiras: cadeirasMesa,
        });
      } else {
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

  function iniciarEdicao(mesa) {
    setTipoMesa(mesa.tipo_tables);
    setCadeirasMesa(mesa.quantity_chairs);
    setEditandoMesaId(mesa.id_tables);
  }

  async function excluirMesa(id) {
    if (!window.confirm("Deseja excluir esta mesa?")) return;
    try {
      await invoke("excluir_mesa", { id });
      buscarMesas();
    } catch (error) {
      console.error("Erro ao excluir mesa:", error);
    }
  }

  async function cadastrarHorario() {
    try {
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

  function iniciarEdicaoHorario(horario) {
    setHorarioEditando(horario.day_of_week);
    setHoraAbertura(horario.opening_time);
    setHoraFechamento(horario.closing_time);
  }

  async function salvarHorarioEditado() {
    try {
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

  async function excluirHorario(dayOfWeek) {
    if (!window.confirm("Deseja excluir este horário?")) return;
    try {
      await invoke("excluir_horario", { dayOfWeek });
      buscarHorarios();
    } catch (error) {
      console.error("Erro ao excluir horário:", error);
    }
  }

  async function atualizarCapacidade() {
    try {
      await invoke("atualizar_capacidade_total", { novaCapacidade });
      setNovaCapacidade(0);
      buscarCapacidade();
    } catch (error) {
      console.error("Erro ao atualizar capacidade:", error);
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  const indexOfLastMesa = currentPage * mesasPerPage;
  const indexOfFirstMesa = indexOfLastMesa - mesasPerPage;
  const currentMesas = mesas.slice(indexOfFirstMesa, indexOfLastMesa);
  const totalPages = Math.ceil(mesas.length / mesasPerPage);

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
            {/* Mesas */}
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
                  <button  type="submit">{editandoMesaId ? "Salvar Alterações" : "Cadastrar Mesa"}</button>
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

            {/* Horários */}
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

            {/* Capacidade */}
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
