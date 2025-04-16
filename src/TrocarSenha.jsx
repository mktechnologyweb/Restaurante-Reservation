//useState gerencia os estados dos componentes
import { useState } from "react";

// Importa a função do Tauri e chama comandos feitos no Rust.
import { invoke } from "@tauri-apps/api/core";

//useNavigate navega entre as rotas
import { useNavigate } from "react-router-dom";

//Importa o css
import './App.css';

//Função para trocar senha 
function TrocarSenha() {

    //Declara a inicialização da senha do usuario
    const [senhaAtual, setSenhaAtual] = useState("");

    //Declara a inicialização da nova senha do usuario
    const [novaSenha, setNovaSenha] = useState("");

    //Declara a inicialização da confirmação da senha do usuario
    const [confirmarSenha, setConfirmarSenha] = useState("");

    //Declara a inicialização para mostrar mensagens de erros 
    const [erro, setErro] = useState("");

    //Declara a inicialização para mostrar mensagens de sucasso
    const [sucesso, setSucesso] = useState("");

    //Recupera no localStorage o nome do usuario
    const nomeFuncionario = localStorage.getItem("employeeName");

    //Obtem a função para perimitir a navegação entre as paginas
    const navigate = useNavigate();

    //Função para enviar o formulario
    async function handleTrocarSenha(e) {
        //Recarrega a pagina
        e.preventDefault();
        //Verifica se os campos estão vazios 
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            //Mostra erro se vazia
            setErro("Preencha todos os campos.");
            return;
        }

        //Verifica se a senha atual não é igual a antiga
        if (novaSenha !== confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        try {

            //Chama  a função do rust e passa os dados
            const response = await invoke("alterar_senha_command", {
                nameEmployee: nomeFuncionario,
                oldPassword: senhaAtual,
                newPassword: novaSenha,
            });

            //Verifica a resposta de sucesso do rust
            if (response.success) {
                setSucesso("Senha atualizada com sucesso!");
                setErro("");
                setTimeout(() => {
                    //Manda para a pagina
                    navigate("/home");
                }, 1500);
            } else {
                setErro(response.message || "Erro ao atualizar senha.");
            }
        } catch (err) {
            setErro("Erro ao conectar ao servidor.");
        }
    }

    //Retorna a estrutura do jsx
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
