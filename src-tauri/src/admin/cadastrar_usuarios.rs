use tauri::State;
use crate::database::Database;
use serde_json::json;
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{SaltString, rand_core::OsRng};




#[tauri::command]
pub async fn cadastrar_usuario_command(
    db: State<'_, Database>,
    name_employee: String,
    lastname_employee: String,
    position_employee: String,
    password_employee: String,
) -> Result<serde_json::Value, String> {
    if !validar_senha(&password_employee) {
        return Ok(json!({
            "success": false,
            "message": "A senha deve conter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula e número."
        }));
    }

    // Gerar hash seguro com Argon2
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hashed_password = match argon2.hash_password(password_employee.as_bytes(), &salt) {
        Ok(hash) => hash.to_string(),
        Err(_) => return Ok(json!({ "success": false, "message": "Erro ao criptografar a senha." })),
    };

    let pool = db.pool.lock().await;

    let result = sqlx::query!(
        "INSERT INTO employees (name_employee, lastname_employee, position_employee, password_employee) VALUES (?, ?, ?, ?)",
        name_employee,
        lastname_employee,
        position_employee,
        hashed_password
    )
    .execute(&*pool)
    .await;

    match result {
        Ok(_) => Ok(json!({ "success": true, "message": "Funcionário cadastrado com sucesso!" })),
        Err(e) => {
            eprintln!("Erro ao cadastrar funcionário: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao cadastrar: {}", e) }))
        }
    }
}

fn validar_senha(senha: &str) -> bool {
    if senha.len() < 8 {
        return false;
    }

    let tem_maiuscula = senha.chars().any(|c| c.is_uppercase());
    let tem_minuscula = senha.chars().any(|c| c.is_lowercase());
    let tem_numero = senha.chars().any(|c| c.is_ascii_digit());

    tem_maiuscula && tem_minuscula && tem_numero
}


#[derive(serde::Serialize, sqlx::FromRow)]
pub struct Usuario {
    pub id_employee: i32,
    pub name_employee: String,
    pub lastname_employee: String,
    pub position_employee: String,
}

#[tauri::command]
pub async fn listar_usuarios(db: State<'_, Database>) -> Result<Vec<Usuario>, String> {
    // Desbloqueia o mutex e obtém uma referência ao pool real
    let pool = db.pool.lock().await;

    let usuarios = sqlx::query_as!(
        Usuario,
        "SELECT id_employee, name_employee, lastname_employee, position_employee FROM employees"
    )
    .fetch_all(&*pool) 
    .await
    .map_err(|e| format!("Erro ao buscar usuários: {}", e))?;

    Ok(usuarios)
}

#[tauri::command]
pub async fn editar_usuario_command(
    db: State<'_, Database>,
    id_employee: i32,
    name_employee: String,
    lastname_employee: String,
    position_employee: String,
    password_employee: String,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let result = if password_employee.trim().is_empty() {
        // Atualiza sem alterar a senha
        sqlx::query!(
            "UPDATE employees SET name_employee = ?, lastname_employee = ?, position_employee = ? WHERE id_employee = ?",
            name_employee,
            lastname_employee,
            position_employee,
            id_employee
        )
        .execute(&*pool)
        .await
    } else {
        // Atualiza com nova senha
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let hashed_password = match argon2.hash_password(password_employee.as_bytes(), &salt) {
            Ok(hash) => hash.to_string(),
            Err(_) => return Ok(json!({ "success": false, "message": "Erro ao criptografar a senha." })),
        };

        sqlx::query!(
            "UPDATE employees SET name_employee = ?, lastname_employee = ?, position_employee = ?, password_employee = ? WHERE id_employee = ?",
            name_employee,
            lastname_employee,
            position_employee,
            hashed_password,
            id_employee
        )
        .execute(&*pool)
        .await
    };

    match result {
        Ok(_) => Ok(json!({ "success": true })),
        Err(e) => {
            eprintln!("Erro ao editar funcionário: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao editar: {}", e) }))
        }
    }
}


#[tauri::command]
pub async fn excluir_usuario_command(
    db: State<'_, Database>,
    id_employee: i32,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let result = sqlx::query!(
        "DELETE FROM employees WHERE id_employee = ?",
        id_employee
    )
    .execute(&*pool)
    .await;

    match result {
        Ok(_) => Ok(json!({ "success": true })),
        Err(e) => {
            eprintln!("Erro ao excluir funcionário: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao excluir: {}", e) }))
        }
    }
}