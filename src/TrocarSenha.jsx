import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import './App.css';

function TrocarSenha() {
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const nomeFuncionario = localStorage.getItem("employeeName");
    const navigate = useNavigate();

    async function handleTrocarSenha(e) {
        e.preventDefault();

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            setErro("Preencha todos os campos.");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        try {
            const response = await invoke("alterar_senha_command", {
                nameEmployee: nomeFuncionario,
                oldPassword: senhaAtual,
                newPassword: novaSenha,
            });

            if (response.success) {
                setSucesso("Senha atualizada com sucesso!");
                setErro("");
                setTimeout(() => {
                    navigate("/home");
                }, 1500);
            } else {
                setErro(response.message || "Erro ao atualizar senha.");
            }
        } catch (err) {
            setErro("Erro ao conectar ao servidor.");
        }
    }

    return (
        <div className="container">
            <div className="overlay"></div>
            <div className="content">
                <h2 className="title">Trocar Senha</h2>
                {erro && <p className="text-red-500 text-sm mb-2">{erro}</p>}
                {sucesso && <p className="text-green-500 text-sm mb-2">{sucesso}</p>}
                <form onSubmit={handleTrocarSenha} className="flex flex-col">
                    <input
                        type="password"
                        placeholder="Senha atual"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Nova senha"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirmar nova senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                    />
                    <button type="submit">Atualizar Senha</button>
                </form>
            </div>
        </div>
    );
}

export default TrocarSenha;
