use sqlx::mysql::MySqlPool;
use std::sync::Arc;
use tokio::sync::Mutex;
use argon2::{Argon2, PasswordHash,PasswordHasher, PasswordVerifier};
use argon2::password_hash::{SaltString, rand_core::OsRng};




#[derive(Clone)]
pub struct Database {
    pub pool: Arc<Mutex<MySqlPool>>,
}

impl Database {
    // conecta ao banco
    pub async fn new(database_url: &str) -> Result<Self, String> {
        println!("Tentando conectar ao banco de dados...");
        match MySqlPool::connect(database_url).await {
            Ok(pool) => {
                println!("Conexão com o banco de dados bem-sucedida!");
                Ok(Self {
                    pool: Arc::new(Mutex::new(pool)),
                })
            }
            Err(e) => {
                eprintln!("Erro ao conectar ao banco: {}", e);
                Err(format!("Erro ao conectar ao banco: {}", e))
            }
        }
    }

    pub async fn login(
        &self,
        name_employee: String,
        password_employee: String,
    ) -> Result<Option<(String, String, bool)>, String> {
        println!("Verificando login para o usuário: {}", name_employee);
        let pool = self.pool.lock().await;
    
        let result = sqlx::query!(
            "SELECT name_employee, password_employee, position_employee, is_first_login FROM employees WHERE name_employee = ?",
            name_employee
        )
        .fetch_optional(&*pool)
        .await
        .map_err(|e| format!("Erro ao buscar funcionário: {}", e))?;
    
        if let Some(record) = result {
            let hashed = record.password_employee;
            let parsed_hash = PasswordHash::new(&hashed)
                .map_err(|_| "Hash de senha inválido no banco.".to_string())?;
    
            if Argon2::default()
                .verify_password(password_employee.as_bytes(), &parsed_hash)
                .is_ok()
            {
                println!("Login bem-sucedido para o usuário: {}", name_employee);
                Ok(Some((
                    record.name_employee,
                    record.position_employee,
                    record.is_first_login.unwrap_or(0) != 0, 
                )))
            } else {
                println!("Senha incorreta para o usuário: {}", name_employee);
                Ok(None)
            }
        } else {
            println!("Funcionário não encontrado: {}", name_employee);
            Err("Funcionário não encontrado".to_string())
        }
    }

    pub async fn alterar_senha(
        &self,
        name_employee: String,
        old_password: String,
        new_password: String,
    ) -> Result<(), String> {
        let pool = self.pool.lock().await;
    
        // Verifica senha atual
        let result = sqlx::query!(
            "SELECT password_employee FROM employees WHERE name_employee = ?",
            name_employee
        )
        .fetch_optional(&*pool)
        .await
        .map_err(|e| format!("Erro ao buscar senha: {}", e))?;
    
        if let Some(record) = result {
            // Verifica a senha antiga com Argon2
            let senha_armazenada = record.password_employee;
            let parsed_hash = PasswordHash::new(&senha_armazenada)
                .map_err(|e| format!("Hash inválido: {}", e))?;
    
            let argon2 = Argon2::default();
            if argon2
                .verify_password(old_password.as_bytes(), &parsed_hash)
                .is_err()
            {
                return Err("Senha atual incorreta.".to_string());
            }
    
            // Gera novo hash com salt aleatório
            let salt = SaltString::generate(&mut OsRng);
            let nova_senha_hash = argon2
                .hash_password(new_password.as_bytes(), &salt)
                .map_err(|e| format!("Erro ao gerar hash: {}", e))?
                .to_string();
    
            // Atualiza a senha no banco
            sqlx::query!(
                "UPDATE employees SET password_employee = ?, is_first_login = false WHERE name_employee = ?",
                nova_senha_hash,
                name_employee
            )
            .execute(&*pool)
            .await
            .map_err(|e| format!("Erro ao atualizar senha: {}", e))?;
    
            Ok(())
        } else {
            Err("Funcionário não encontrado.".to_string())
        }
    }
}


