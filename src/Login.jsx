import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import './App.css';

function Login({ setAuthenticated }) {
    const [name_employee, setName_employee] = useState("");
    const [password_employee, setPassword_employee] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Componente Login montado. isAuthenticated:", localStorage.getItem("isAuthenticated"));
    }, []);

    async function handleLogin(e) {
        e.preventDefault();

        if (!name_employee || !password_employee) {
            setError("Preencha todos os campos.");
            return;
        }

        try {
            const response = await invoke("login_command", {
                nameEmployee: name_employee,
                passwordEmployee: password_employee,
            });

            if (response.success) {
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("employeeName", response.employeeName);
                localStorage.setItem("employeePosition", response.employeePosition);

                setAuthenticated(true);

                console.log("Login bem-sucedido. isAuthenticated definido como:", localStorage.getItem("isAuthenticated"));

                // Redirecionar com base no isFirstLogin
                if (response.isFirstLogin) {
                    navigate("/trocar_senha");
                } else {
                    navigate("/home");
                }

            } else {
                setError(response.message || "Credenciais inválidas.");
            }
        } catch (err) {
            setError("Erro ao conectar ao servidor.");
        }
    }

    return (
        <div className="container">
            <div className="overlay"></div>
            <div className="content">
                <img src="logo.png" alt="Logo" className="logo" />
                <h1 className="title">Restaurante</h1>
                <h2 className="subtitle">Reservas</h2>
                <div className="form-container">
                    <h2 className="login">Login</h2>
                    {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                    <form onSubmit={handleLogin} className="flex flex-col">
                        <input
                            type="text"
                            placeholder="Nome do funcionário"
                            value={name_employee}
                            onChange={(e) => setName_employee(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password_employee}
                            onChange={(e) => setPassword_employee(e.target.value)}
                        />
                        <button class="btn" type="submit">Login</button>
                      
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
