#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
//Importação dos modulos criados no projeto
//Conecta e manipula o banco
mod database;
// Comandos de sql com rust
mod commands;
//Funções de sql do amdiministrador do sistema
mod admin;     
//Acessa o banco
use database::Database;
//Operações da aplicação
use commands::{
    login_command, cadastrar_cliente, buscar_cliente, 
    obter_horario_funcionamento,
    buscar_reserva_command,criar_reserva_command,editar_reserva_command,
    cancelar_reserva_command,buscar_reservas_por_cpf,editar_cliente, excluir_cliente,listar_clientes,buscar_cliente_por_id,
    alterar_senha_command,verificar_lotacao_command,buscar_total_reservado_e_limite,mesas_disponiveis_para_reserva,
    mesas_disponiveis_para_reserva_edicao
};
//Aqui é gerado a manipulação dos comandos em Tauri
use tauri::generate_handler;

//Comando adiministrativos das reservas dos clientes
use admin::reservas_clientes::{buscar_reservas_clientes_command,editar_reserva_admin_command,cancelar_reserva_admin_command,concluir_reserva_admin_command};
//Comando adiministrativos do banco de usuarios
use admin::cadastrar_usuarios:: {cadastrar_usuario_command, listar_usuarios, editar_usuario_command, excluir_usuario_command};
//Comando adiministrativos do banco de mesas
use crate::admin::mesas::{listar_mesas,cadastrar_mesa,editar_mesa,excluir_mesa};
//Comando adiministrativos do banco de horarios
use crate::admin::horarios:: {listar_horarios,editar_horario,excluir_horario,cadastrar_horario};
//Comando adiministrativos do banco de mesas
use admin::capacidade::{obter_capacidade_total, atualizar_capacidade_total,obter_capacidade_ocupada};
//Comando adiministrativos do dashboard
use admin::estatisticas:: buscar_estatisticas_dashboard;
//Execução de funções assincronas
#[tokio::main]
async fn main() {
    //Configuração da conexão com o banco
    let database_url = "mysql://root:@localhost:3306/restaurant_reservation";
    //Tentativa da conexão
    let database = match Database::new(database_url).await {
        // Armazena a instancia da conexão bem sucedida
        Ok(db) => db,
        //Informa erro caso tenha
        Err(e) => {
            eprintln!("Erro ao conectar ao banco de dados: {}", e);
            return;
        }
    };
    //Aqui será inicializado e configurado o tauri mais comandos da interface
    tauri::Builder::default()
        //Instanciamento global do banco de dados
        .manage(database)
        //Aqui será definidos os comandos do tauri que podera ser invocado pala aplicação
        .invoke_handler(generate_handler![
            login_command, cadastrar_cliente, buscar_cliente,
            obter_horario_funcionamento,
             buscar_reserva_command,criar_reserva_command,editar_reserva_command,
             cancelar_reserva_command,buscar_reservas_por_cpf,
             buscar_reservas_clientes_command,editar_reserva_admin_command,
             cancelar_reserva_admin_command,cadastrar_usuario_command,listar_usuarios,
             editar_usuario_command, excluir_usuario_command,editar_cliente, excluir_cliente,listar_clientes, buscar_cliente_por_id,
             alterar_senha_command,listar_mesas,cadastrar_mesa,editar_mesa,excluir_mesa,
             listar_horarios,editar_horario,excluir_horario,cadastrar_horario,concluir_reserva_admin_command,verificar_lotacao_command,
             buscar_total_reservado_e_limite,obter_capacidade_total, atualizar_capacidade_total,
             obter_capacidade_ocupada,buscar_estatisticas_dashboard,mesas_disponiveis_para_reserva,
             mesas_disponiveis_para_reserva_edicao
        ])
        //Inicia o tauri
        .run(tauri::generate_context!())
        //Erros ao rodar a aplicação
        .expect("Erro ao rodar a aplicação Tauri");
}


