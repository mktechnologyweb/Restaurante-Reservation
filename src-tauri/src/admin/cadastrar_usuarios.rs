//Importa as característica para usar a struct Database
use crate::database::Database;

//Importa o hash de senhas da biblioteca argon2
use argon2::password_hash::{rand_core::OsRng, SaltString};
use argon2::{Argon2, PasswordHasher};

//Importa macro json
use serde_json::json;

//Importa o gerenciamento da aplicação
use tauri::State;

// Aqui é a função para cadastrar novos usuários
#[tauri::command]
pub async fn cadastrar_usuario_command(

    //Inclui o estado do banco na função
    db: State<'_, Database>,

    //Dados do FrontEnd
    name_employee: String,
    lastname_employee: String,
    position_employee: String,
    password_employee: String,
) -> Result<serde_json::Value, String> {

    //Valida a senha com os critérios
    if !validar_senha(&password_employee) {
        return Ok(json!({
            "success": false,
            "message": "A senha deve conter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula e número."
        }));
    }

   //Geração aleatoria do hash da senha
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    //Aqui será convertido para string caso tenha sucesso
    let hashed_password = match argon2.hash_password(password_employee.as_bytes(), &salt) {
        Ok(hash) => hash.to_string(),
        Err(_) => {
            return Ok(json!({ "success": false, "message": "Erro ao criptografar a senha." }))
        }
    };

    let pool = db.pool.lock().await;

    //Execulta o cadastroo no banco
    let result = sqlx::query!(
        "INSERT INTO employees (name_employee, lastname_employee, position_employee, password_employee) VALUES (?, ?, ?, ?)",
        name_employee,
        lastname_employee,
        position_employee,
        hashed_password
    )
    .execute(&*pool)
    .await;

    //Resultado da inclusão no banco
    match result {
        Ok(_) => Ok(json!({ "success": true, "message": "Funcionário cadastrado com sucesso!" })),
        Err(e) => {
            eprintln!("Erro ao cadastrar funcionário: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao cadastrar: {}", e) }))
        }
    }
}
//Função que vai validar a  senha com os critérios de segurança
fn validar_senha(senha: &str) -> bool {

    //Verifica se o comprimento da senha tem menos de 8 caracteres
    if senha.len() < 8 {
        return false;
    }

    //Tem letra maiuscula
    let tem_maiuscula = senha.chars().any(|c| c.is_uppercase());

     //Tem letra minuscula
    let tem_minuscula = senha.chars().any(|c| c.is_lowercase());

     //Tem letra numero
    let tem_numero = senha.chars().any(|c| c.is_ascii_digit());

    //Retorna verdadeiro se cumprir os requisitos
    tem_maiuscula && tem_minuscula && tem_numero
}

//Estrutura para representar um um usuário e mapealo no sql
#[derive(serde::Serialize, sqlx::FromRow)]
pub struct Usuario {
    pub id_employee: i32,
    pub name_employee: String,
    pub lastname_employee: String,
    pub position_employee: String,
}

// Função para listar os funcionários
#[tauri::command]
pub async fn listar_usuarios(db: State<'_, Database>) -> Result<Vec<Usuario>, String> {
    
    let pool = db.pool.lock().await;

    //Busca os funcionarios no banco
    let usuarios = sqlx::query_as!(
        Usuario,
        "SELECT id_employee, name_employee, lastname_employee, position_employee FROM employees"
    )

    //Obtem os resultados
    .fetch_all(&*pool)
    .await

    //Mapeia erros no sql
    .map_err(|e| format!("Erro ao buscar usuários: {}", e))?;

    //Retorna os usuários em caso de sucesso
    Ok(usuarios)
}

// Função para editar usuários  
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

    //Verifica se o campo da senha esta vazia, se estiver não atualiza a senha
    let result = if password_employee.trim().is_empty() {

       //Atualiza os dados menos a senha
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

        //Se a senha não estiver vazia gera uma hash
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let hashed_password = match argon2.hash_password(password_employee.as_bytes(), &salt) {
            Ok(hash) => hash.to_string(),
            Err(_) => {
                return Ok(json!({ "success": false, "message": "Erro ao criptografar a senha." }))
            }
        };

        //Atualiza com a senha
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

// Função para excluir um usário
#[tauri::command]
pub async fn excluir_usuario_command(
    db: State<'_, Database>,

    //Dados do  frontend
    id_employee: i32,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let result = sqlx::query!("DELETE FROM employees WHERE id_employee = ?", id_employee)
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
