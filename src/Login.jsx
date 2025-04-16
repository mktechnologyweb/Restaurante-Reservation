
// Este Importe permite o gerenciaamento do estado e os efeitos do componente.
import { useState, useEffect } from "react";

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

// Este Importe permite a navegação entre as páginas.
import { useNavigate } from "react-router-dom";

//Importa o css
import './App.css';

//Função que recebe se esta logado
function Login({ setAuthenticated }) {
    const [name_employee, setName_employee] = useState("");
    const [password_employee, setPassword_employee] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

     // Este Hook useEffect é executado apenas uma vez após a primeira renderização do componente.
    useEffect(() => {
        console.log("Componente Login montado. isAuthenticated:", localStorage.getItem("isAuthenticated"));
    }, []);

    //Função para enviar o formulario de login
    async function handleLogin(e) {
        e.preventDefault();

        //Verifica se os campos não estão vazios
        if (!name_employee || !password_employee) {
            setError("Preencha todos os campos.");
            return;
        }


        //Lida com erros na chamada do rust
        try {
             //Busca a função no rust e envia os parametros
            const response = await invoke("login_command", {
                nameEmployee: name_employee,
                passwordEmployee: password_employee,
            });

            //Verifica se foi um sucesso
            if (response.success) {

                //Armazena verdadeiro e os dados do funcionário
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("employeeName", response.employeeName);
                localStorage.setItem("employeePosition", response.employeePosition);
                
                //Atualiza a função
                setAuthenticated(true);

                console.log("Login bem-sucedido. isAuthenticated definido como:", localStorage.getItem("isAuthenticated"));

               //Verifica se é o primeiro login se for manda trocar a senha
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

    //Retorna a estrutura do jsx
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
