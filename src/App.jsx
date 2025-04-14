import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./Login";
import Home from "./Home";
import TrocarSenha from "./TrocarSenha";
import Cadastrar from "./Cadastrar";
import EditarCliente from "./EditarCliente";
import Reserva from "./Reserva";
import Detalhes from "./Detalhes";
import EditarReserva from './EditarReserva';
import ClienteDetalhes from './ClienteDetalhes';
import ReservasClientes from './admin/ReservasClientes'; 
import CadastrarUsuarios from './admin/CadastrarUsuarios'; 
import ListarFuncionario from "./admin/lista_funcionarios";
import ListarClientes from "./admin/lista_clientes";
import Configuracoes from "./admin/Configuracoes";
import Dashboard from "./admin/Dashboard";

function App() {
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
      const isLoggedIn = localStorage.getItem("isAuthenticated") === "true";
      setAuthenticated(isLoggedIn);
      console.log("App: isAuthenticated verificado. Valor:", isLoggedIn);
  }, []);

    return (
        <Router>
            <Routes>
                {/* inicia pelo login */}
                <Route path="/" element={<Login setAuthenticated={setAuthenticated} />} />

                {/* a pagina home so vai ter acesso quem estiver autenticado */}
                <Route 
                    path="/home" 
                    element={authenticated ? <Home /> : <Navigate to="/" />} 
                />

                <Route 
                    path="/trocar_senha" 
                    element={authenticated ? <TrocarSenha /> : <Navigate to="/" />} 
                />


                <Route 
                    path="/cadastrar" 
                    element={authenticated ? <Cadastrar /> : <Navigate to="/" />} 
                />
                 <Route 
                    path="/editar_clientes/:id" 
                    element={authenticated ? <EditarCliente /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/reserva" 
                    element={authenticated ? <Reserva /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/detalhes" 
                    element={authenticated ? <Detalhes /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/editar-reserva" 
                    element={authenticated ? <EditarReserva /> : <Navigate to="/" />} 
                />

                <Route 
                    path="/cliente-detalhes" 
                    element={authenticated ? <ClienteDetalhes /> : <Navigate to="/cliente-detalhes" />} 
                />
                <Route 
                    path="/admin/reservas-clientes" 
                    element={authenticated ? <ReservasClientes /> : <Navigate to="/reservas-clientes" />} 
                />
                <Route 
                    path="/admin/cadastrar-usuarios" 
                    element={authenticated ? <CadastrarUsuarios /> : <Navigate to="/cadastrar-usuarios" />} 
                />
                <Route 
                    path="/admin/lista_funcionarios" 
                    element={authenticated ? <ListarFuncionario /> : <Navigate to="/lista_funcionarios" />} 
                />

                <Route 
                    path="/admin/lista_clientes" 
                    element={authenticated ? <ListarClientes /> : <Navigate to="/lista_clientes" />} 
                />

                <Route 
                    path="/admin/configuracoes" 
                    element={authenticated ? <Configuracoes /> : <Navigate to="/admin/configuracoes" />} 
                />

                <Route 
                    path="/admin/dashboard" 
                    element={authenticated ? <Dashboard /> : <Navigate to="/admin/dashboard" />} 
                />

            </Routes>
        </Router>
    );
}

export default App;