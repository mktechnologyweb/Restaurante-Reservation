use tauri::State;
use serde_json::json;
use crate::database::Database;



#[tauri::command]
pub async fn buscar_estatisticas_dashboard(
    db: State<'_, Database>,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    // Reservas do dia
    let _reservas_dia: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) as count FROM reservations WHERE DATE(date_reservation) = CURDATE()"
    )
    .fetch_one(&*pool)
    .await
    .unwrap_or(0);

    // Reservas da semana
    let reservas_semana: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) as count FROM reservations WHERE YEARWEEK(date_reservation, 1) = YEARWEEK(CURDATE(), 1)"
    )
    .fetch_one(&*pool)
    .await
    .unwrap_or(0);

    // Reservas do mês
    let reservas_dia: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) as count FROM reservations WHERE DATE(date_reservation) = CURDATE()"
    )
    .fetch_one(&*pool)
    .await
    .unwrap_or(0);

    // Horário mais movimentado
    let horario_popular = sqlx::query!(
        "SELECT time_reservation, COUNT(*) as total FROM reservations GROUP BY time_reservation ORDER BY total DESC LIMIT 1"
    )
    .fetch_optional(&*pool)
    .await
    .ok()
    .flatten()
    .map(|row| row.time_reservation.map(|t| t.format("%H:%M").to_string()).unwrap_or("Sem dados".to_string()))
.unwrap_or("Sem dados".to_string());
  

    // Mesa mais reservada (ignorar se não existir)
    let mesa_popular = sqlx::query!(
        r#"
        SELECT r.table_id as "table_id?", COUNT(*) as total
        FROM reservations r
        GROUP BY r.table_id
        ORDER BY total DESC
        LIMIT 1
        "#
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())?
    .map(|row| row.table_id.unwrap_or_default())
    .unwrap_or_default();

    let reservas_mes: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) as count FROM reservations WHERE MONTH(date_reservation) = MONTH(CURDATE())"
    )
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(json!({
        "reservas_dia": reservas_dia,
        "reservas_semana": reservas_semana,
        "reservas_mes": reservas_mes,
        "horario_popular": horario_popular,
        "mesa_popular": mesa_popular,
    }))
}
