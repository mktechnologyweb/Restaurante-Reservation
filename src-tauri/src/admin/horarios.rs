use sqlx::FromRow;
use tauri::State;
use crate::Database;
use serde::{Deserialize, Serialize};

#[derive(FromRow, Serialize)]
pub struct Horario {
    pub day_of_week: String,
    pub opening_time: Option<String>,
    pub closing_time: Option<String>,
}


#[tauri::command]
pub async fn listar_horarios(db: State<'_, Database>) -> Result<Vec<Horario>, String> {
    let pool = db.pool.lock().await;

    let horarios = sqlx::query_as!(
        Horario,
        r#"
        SELECT day_of_week,
               COALESCE(opening_time, '') AS opening_time,
               COALESCE(closing_time, '') AS closing_time
        FROM operating_hours
        ORDER BY
          CASE day_of_week
            WHEN 'Domingo' THEN 1
            WHEN 'Segunda-feira' THEN 2
            WHEN 'Terça-feira' THEN 3
            WHEN 'Quarta-feira' THEN 4
            WHEN 'Quinta-feira' THEN 5
            WHEN 'Sexta-feira' THEN 6
            WHEN 'Sábado' THEN 7
            ELSE 8
          END
        "#
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Erro ao listar horários: {}", e))?;

    Ok(horarios)
}

#[derive(Debug, Deserialize)]
pub struct AtualizarHorario {
    pub day_of_week: String,
    pub opening_time: String,
    pub closing_time: String,
}

#[tauri::command]
pub async fn editar_horario(
    db: State<'_, Database>,
    day_of_week: String,
    opening_time: String,
    closing_time: String,
) -> Result<(), String> {
    let pool = db.pool.lock().await;

    sqlx::query!(
        r#"
        UPDATE operating_hours
        SET opening_time = ?, closing_time = ?
        WHERE day_of_week = ?
        "#,
        opening_time,
        closing_time,
        day_of_week
    )
    .execute(&*pool)
    .await
    .map_err(|e| format!("Erro ao editar horário: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn excluir_horario(pool: State<'_, Database>, day_of_week: String) -> Result<(), String> {
    let pool = pool.pool.lock().await;

    match sqlx::query!("DELETE FROM operating_hours WHERE day_of_week = ?", day_of_week)
        .execute(&*pool)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            eprintln!("Erro ao excluir horário: {}", e);
            Err("Erro ao excluir horário".to_string())
        }
    }
}

#[tauri::command]
pub async fn cadastrar_horario(
    pool: State<'_, Database>,
    day_of_week: String,
    opening_time: String,
    closing_time: String,
) -> Result<(), String> {
    let pool = pool.pool.lock().await;

    match sqlx::query!(
        "INSERT INTO operating_hours (day_of_week, opening_time, closing_time) VALUES (?, ?, ?)",
        day_of_week,
        opening_time,
        closing_time
    )
    .execute(&*pool)
    .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            eprintln!("Erro ao cadastrar horário: {}", e);
            Err("Erro ao cadastrar horário".to_string())
        }
    }
}