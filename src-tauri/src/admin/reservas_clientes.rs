use tauri::State;
use crate::database::Database;
use serde::{Deserialize, Serialize};
use sqlx::{Row, MySqlPool};
use chrono::NaiveDateTime;
use serde_json::json;

#[derive(Serialize, Clone)]
pub struct ReservaCliente {
    id_reservation: i32,
    name_customer: String,
    date_reservation: Option<String>,
    time_reservation: Option<String>,
    number_people: Option<i32>,
    customer_id: i32,
    table_id: i32,
    status: Option<String>, // Campo status
}
#[tauri::command]
pub async fn buscar_reservas_clientes_command(state: State<'_, Database>) -> Result<Vec<ReservaCliente>, String> {
    let pool_guard = state.pool.lock().await;
    let pool: &MySqlPool = &*pool_guard;

    let reservas = sqlx::query(
        "SELECT r.id_reservation, c.name_customer, r.date_reservation, r.time_reservation, r.number_people, r.table_id, c.id_customer, r.status FROM reservations r JOIN customers c ON r.customer_id = c.id_customer"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?
    .iter()
    .map(|row: &sqlx::mysql::MySqlRow| ReservaCliente {
        id_reservation: row.get(0),
        name_customer: row.get(1),
        date_reservation: row.try_get(2).ok().and_then(|d: Option<chrono::NaiveDate>| d.map(|d| d.to_string())),
        time_reservation: row.try_get(3).ok().and_then(|t: Option<chrono::NaiveTime>| t.map(|t| t.to_string())),
        number_people: row.try_get(4).ok(),
        table_id: row.get(5),
        customer_id: row.get(6),
        status: row.try_get(7).ok(),
    })
    .collect();

    Ok(reservas)
}

#[derive(Deserialize, Debug)]
pub struct EditarReservaPayload {
    pub id_reservation: i32,
    pub date_reservation: String,
    pub number_people: i32,
}

#[tauri::command]
pub async fn editar_reserva_admin_command(
    db: State<'_, Database>,
    payload: EditarReservaPayload,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let datetime = match NaiveDateTime::parse_from_str(&payload.date_reservation, "%Y-%m-%dT%H:%M:%S") {
        Ok(dt) => dt,
        Err(e) => return Err(format!("Formato de data e hora inválido: {}", e)),
    };

    // Verificar se existe mesa disponível com capacidade suficiente
    let mesa_disponivel = sqlx::query!(
        r#"
        SELECT m.id_tables
        FROM tables m
        WHERE m.quantity_chairs >= ?
          AND m.id_tables NOT IN (
              SELECT r.table_id
              FROM reservations r
              WHERE r.date_reservation = ?
                AND r.time_reservation = ?
                AND r.status != 'Cancelada'
                AND r.id_reservation != ?
          )
        LIMIT 1
        "#,
        payload.number_people,
        datetime.date(),
        datetime.time(),
        payload.id_reservation
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|e| format!("Erro ao verificar disponibilidade de mesa: {}", e))?;

    if let Some(mesa) = mesa_disponivel {
        // Atualizar a reserva com a nova mesa disponível
        sqlx::query!(
            "UPDATE reservations SET date_reservation = ?, time_reservation = ?, number_people = ?, table_id = ? WHERE id_reservation = ?",
            datetime.date(),
            datetime.time(),
            payload.number_people,
            mesa.id_tables,
            payload.id_reservation
        )
        .execute(&*pool)
        .await
        .map_err(|e| format!("Erro ao atualizar reserva: {}", e))?;

        Ok(json!({ "success": true, "message": "Reserva atualizada com sucesso" }))
    } else {
        Err("Nenhuma mesa disponível para esse horário e número de pessoas.".to_string())
    }
}

#[tauri::command]
pub async fn cancelar_reserva_admin_command(id_reservation: i32, state: State<'_, Database>) -> Result<(), String> {
    let pool = state.pool.lock().await;

    sqlx::query!(
        "UPDATE reservations SET status = 'Cancelada' WHERE id_reservation = ?",
        id_reservation
    )
    .execute(&*pool)
    .await
    .map_err(|e| format!("Erro ao cancelar reserva: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn concluir_reserva_admin_command(id_reservation: i32, state: State<'_, Database>) -> Result<(), String> {
    let pool = state.pool.lock().await;

    sqlx::query!(
        "UPDATE reservations SET status = 'Concluída' WHERE id_reservation = ?",
        id_reservation
    )
    .execute(&*pool)
    .await
    .map_err(|e| format!("Erro ao concluir reserva: {}", e))?;

    Ok(())
}