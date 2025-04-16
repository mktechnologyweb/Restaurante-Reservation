//Importa as característica para usar a struct Database
use crate::Database;

//Importa o gerenciamento da aplicação
use tauri::State;

//Função que obtem a capacidade total de mesas
#[tauri::command]
pub async fn obter_capacidade_total(state: State<'_, Database>) -> Result<i32, String> {
    let pool = state.pool.lock().await;

    //Seleciona no banco o limite 
    let row: Option<(i32,)> = sqlx::query_as("SELECT limit_people FROM capacity_limits LIMIT 1")
        .fetch_optional(&*pool)
        .await
        .map_err(|e| format!("Erro ao buscar capacidade: {}", e))?;

    //Verifica se foi encontrada
    match row {
        Some((capacidade,)) => Ok(capacidade),
        None => Err("Capacidade não encontrada.".to_string()),
    }
}

// Função para atualizar a capacidade
#[tauri::command]
pub async fn atualizar_capacidade_total(
    state: State<'_, Database>,
    nova_capacidade: i32,
) -> Result<(), String> {
    let pool = state.pool.lock().await;
    //Atualiza a capacidade
    sqlx::query("UPDATE capacity_limits SET limit_people = ?")
        .bind(nova_capacidade)
        .execute(&*pool)
        .await
        .map_err(|e| format!("Erro ao atualizar capacidade: {}", e))?;

    //Retorna ok em caso de sucesso
    Ok(())
}

//FEstrutura que representa a capacidade
#[derive(serde::Serialize)]
pub struct CapacidadeInfo {
    total: i32,
    ocupada: i32,
    disponivel: i32,
}

//Função para obeter a capacidade 
#[tauri::command]
pub async fn obter_capacidade_ocupada(state: State<'_, Database>) -> Result<u32, String> {
    let pool = state.pool.lock().await;

    //Busca no banco e mapeia para uma tupla um option unico u32
    let row: (Option<u32>,) = sqlx::query_as(
        "SELECT CAST(SUM(number_people) AS UNSIGNED) FROM reservations WHERE status = 'ativa'",
    )
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    //Extrai o valor opcional da tupla
    Ok(row.0.unwrap_or(0))
}
