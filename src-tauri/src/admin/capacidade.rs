
use tauri::State;
use crate::Database;


#[tauri::command]
pub async fn obter_capacidade_total(state: State<'_, Database>) -> Result<i32, String> {
    let pool = state.pool.lock().await;

    let row: Option<(i32,)> = sqlx::query_as("SELECT limit_people FROM capacity_limits LIMIT 1")
        .fetch_optional(&*pool)
        .await
        .map_err(|e| format!("Erro ao buscar capacidade: {}", e))?;

    match row {
        Some((capacidade,)) => Ok(capacidade),
        None => Err("Capacidade não encontrada.".to_string()),
    }
}
#[tauri::command]
pub async fn atualizar_capacidade_total(
    state: State<'_, Database>,
    nova_capacidade: i32,
) -> Result<(), String> {
    let pool = state.pool.lock().await;

    sqlx::query("UPDATE capacity_limits SET limit_people = ?")
        .bind(nova_capacidade)
        .execute(&*pool)
        .await
        .map_err(|e| format!("Erro ao atualizar capacidade: {}", e))?;

    Ok(())
}


#[derive(serde::Serialize)]
pub struct CapacidadeInfo {
    total: i32,
    ocupada: i32,
    disponivel: i32,
}

#[tauri::command]
pub async fn obter_capacidade_ocupada(state: State<'_, Database>) -> Result<u32, String> {
    let pool = state.pool.lock().await;

    let row: (Option<u32>,) = sqlx::query_as("SELECT CAST(SUM(number_people) AS UNSIGNED) FROM reservations WHERE status = 'ativa'")
        .fetch_one(&*pool) // Usa o pool como executor
        .await
        .map_err(|e| e.to_string())?;

    Ok(row.0.unwrap_or(0))
}