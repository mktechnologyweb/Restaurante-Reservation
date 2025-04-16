/* Importa as característica do FromRow da biblioteca sqlx e permiti
 o mapeamento de linhas do banco de dados para estruturas.*/ 
use sqlx::FromRow;

//Importa as característica para usar a struct Database
use crate::Database;

//Importa o gerenciamento da aplicação
use tauri::State;

//Estrutura que representa as mesas
#[derive(Debug, FromRow, serde::Serialize)]
pub struct Mesa {
    pub id_tables: i32,
    pub tipo_tables: Option<String>,
    pub quantity_chairs: i32,
}

//Função para listar as mesas
#[tauri::command]
pub async fn listar_mesas(db: State<'_, Database>) -> Result<Vec<Mesa>, String> {
    let pool = db.pool.lock().await;

    //Busca no banco
    let mesas = sqlx::query_as!(
        Mesa,
        "SELECT id_tables, tipo_tables, quantity_chairs FROM tables"
    )

    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Erro ao buscar mesas: {}", e))?;

    Ok(mesas)
}


//Função para cadastrar as mesas
#[tauri::command]
pub async fn cadastrar_mesa(
    state: State<'_, Database>,
    tipo: String,
    cadeiras: i32,
) -> Result<(), String> {
    let pool = state.pool.lock().await;

    //Inseri as novas mesas no banco
    sqlx::query!(
        "INSERT INTO tables (tipo_tables, quantity_chairs) VALUES (?, ?)",
        tipo,
        cadeiras
    )
    .execute(&*pool)
    .await
    .map_err(|e| format!("Erro ao cadastrar mesa: {}", e))?;

    Ok(())
}

//Função para editar as mesas
#[tauri::command]
pub async fn editar_mesa(
    db: State<'_, Database>,
    id: i32,
    tipo: String,
    cadeiras: i32,
) -> Result<(), String> {
    let pool = db.pool.lock().await;

    sqlx::query!(

        //Atualiza no banco
        "UPDATE tables SET tipo_tables = ?, quantity_chairs = ? WHERE id_tables = ?",
        tipo,
        cadeiras,
        id
    )
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

//Função para excluir as mesas
#[tauri::command]
pub async fn excluir_mesa(pool: State<'_, Database>, id: i64) -> Result<(), String> {
    let pool = pool.pool.lock().await;

    //Exclui as mesas no banco
    match sqlx::query!("DELETE FROM tables WHERE id_tables = ?", id)
        .execute(&*pool)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            eprintln!("Erro ao excluir mesa: {}", e);
            Err("Erro ao excluir mesa".to_string())
        }
    }
}
