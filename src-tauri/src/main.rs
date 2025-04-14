#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod commands;
mod admin;     
use database::Database;
use commands::{
    login_command, cadastrar_cliente, buscar_cliente, 
    obter_horario_funcionamento,
    buscar_reserva_command,criar_reserva_command,editar_reserva_command,
    cancelar_reserva_command,buscar_reservas_por_cpf,editar_cliente, excluir_cliente,listar_clientes,buscar_cliente_por_id,
    alterar_senha_command,verificar_lotacao_command,buscar_total_reservado_e_limite,mesas_disponiveis_para_reserva,
    mesas_disponiveis_para_reserva_edicao
};
use tauri::generate_handler;
use admin::reservas_clientes::{buscar_reservas_clientes_command,editar_reserva_admin_command,cancelar_reserva_admin_command,concluir_reserva_admin_command};
use admin::cadastrar_usuarios:: {cadastrar_usuario_command, listar_usuarios, editar_usuario_command, excluir_usuario_command};
use crate::admin::mesas::{listar_mesas,cadastrar_mesa,editar_mesa,excluir_mesa};
use crate::admin::horarios:: {listar_horarios,editar_horario,excluir_horario,cadastrar_horario};
use admin::capacidade::{obter_capacidade_total, atualizar_capacidade_total,obter_capacidade_ocupada};
use admin::estatisticas:: buscar_estatisticas_dashboard;
#[tokio::main]
async fn main() {
    let database_url = "mysql://root:@localhost:3306/restaurant_reservation";
    let database = match Database::new(database_url).await {
        Ok(db) => db,
        Err(e) => {
            eprintln!("Erro ao conectar ao banco de dados: {}", e);
            return;
        }
    };

    tauri::Builder::default()
        .manage(database)
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
        .run(tauri::generate_context!())
        .expect("Erro ao rodar a aplicação Tauri");
}


