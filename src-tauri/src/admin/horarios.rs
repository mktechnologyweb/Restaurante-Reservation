//Importa as característica para usar a struct Database
use crate::Database;

/* Importa as característica do Serialize da biblioteca serde
 e permiti a conversão da estruturas em formatos json.*/ 
use serde::Serialize;

/* Importa as característica do FromRow da biblioteca sqlx e permiti
 o mapeamento de linhas do banco de dados para estruturas.*/ 
use sqlx::FromRow;

//Importa o gerenciamento da aplicação
use tauri::State;

//Definição da estrutura do horario de funcionamento
#[derive(FromRow, Serialize)]
pub struct Horario {
    pub day_of_week: String,
    pub opening_time: Option<String>,
    pub closing_time: Option<String>,
}

//Função para listar os horarios
#[tauri::command]
pub async fn listar_horarios(db: State<'_, Database>) -> Result<Vec<Horario>, String> {
    let pool = db.pool.lock().await;
    //Busca no banco
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

    //Obtem todos os horários
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Erro ao listar horários: {}", e))?;

    Ok(horarios)
}

//Função para editar os horários
#[tauri::command]
pub async fn editar_horario(
    db: State<'_, Database>,
    day_of_week: String,
    opening_time: String,
    closing_time: String,
) -> Result<(), String> {
    let pool = db.pool.lock().await;

    //Atualiza no banco
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

//Função para excluir os horários
#[tauri::command]
pub async fn excluir_horario(pool: State<'_, Database>, day_of_week: String) -> Result<(), String> {
    let pool = pool.pool.lock().await;

    //Deleta no banco
    match sqlx::query!(
        "DELETE FROM operating_hours WHERE day_of_week = ?",
        day_of_week
    )
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

//Função para cadastrar os horários
#[tauri::command]
pub async fn cadastrar_horario(
    pool: State<'_, Database>,
    day_of_week: String,
    opening_time: String,
    closing_time: String,
) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    
    //Inceri no banco
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
