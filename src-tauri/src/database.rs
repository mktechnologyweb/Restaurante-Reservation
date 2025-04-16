//Importação das dependencias do codigo
//poo de conexões mysql do sqlx
use sqlx::mysql::MySqlPool;
//garantia do acesso seguro ao banco no ambiente assincrono
use std::sync::Arc;
//garantia do acesso seguro ao banco no ambiente assincrono
use tokio::sync::Mutex;
// hashing e verificação de senhas
use argon2::{Argon2, PasswordHash,PasswordHasher, PasswordVerifier};
use argon2::password_hash::{SaltString, rand_core::OsRng};



// Aqui sera definido a estrutura Database mantendo o poo de conexões sql
#[derive(Clone)]
pub struct Database {
 
    pub pool: Arc<Mutex<MySqlPool>>,
}

//Asociação a estrutura Database
impl Database {
    //Mantem a conexão com o banco
    pub async fn new(database_url: &str) -> Result<Self, String> {
        println!("Tentando conectar ao banco de dados...");
        //Tentativa de conexão
        match MySqlPool::connect(database_url).await {
            Ok(pool) => {
                println!("Conexão com o banco de dados bem-sucedida!");
                Ok(Self {
                    //Retorna o Database
                    pool: Arc::new(Mutex::new(pool)),
                })
            }
            //Caso ocorra algum erro
            Err(e) => {
                eprintln!("Erro ao conectar ao banco: {}", e);
                Err(format!("Erro ao conectar ao banco: {}", e))
            }
        }
    }
    // Aqui é a função de login dos funcionarios
    pub async fn login(
        &self,
        name_employee: String,
        password_employee: String,
    ) -> Result<Option<(String, String, bool)>, String> {
        println!("Verificando login para o usuário: {}", name_employee);
        //Bloqueia o acesso de consultas
        let pool = self.pool.lock().await;
        //Busca os dados do funcionario que esta tentando logar
        let result = sqlx::query!(
            "SELECT name_employee, password_employee, position_employee, is_first_login FROM employees WHERE name_employee = ?",
            name_employee
        )
        //Retorna o resultado da consulta
        .fetch_optional(&*pool)
        .await
        .map_err(|e| format!("Erro ao buscar funcionário: {}", e))?;

        //Funcionario encontrado
        if let Some(record) = result {
            // A senha esta hashada
            let hashed = record.password_employee;

            //Vai ser criado um objeto PasswordHash a partir do hash da senha
            let parsed_hash = PasswordHash::new(&hashed)
                .map_err(|_| "Hash de senha inválido no banco.".to_string())?;

            //Aqui sera verificado se a senha é igual ao hash do banco
            if Argon2::default()
                .verify_password(password_employee.as_bytes(), &parsed_hash)
                .is_ok()
            {
                println!("Login bem-sucedido para o usuário: {}", name_employee);
                //Retorna os dados do funcionario e o status de primeiro acesso ou não
                Ok(Some((
                    record.name_employee,
                    record.position_employee,
                    // Conversão de primeiro acesso ou não para booleano
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

    // Aqui é a finção onde pode ser alterado a senha pelo funcionario
    pub async fn alterar_senha(
        &self,
        name_employee: String,
        old_password: String,
        new_password: String,
    ) -> Result<(), String> {
        let pool = self.pool.lock().await;
    
        //Busca a senha
        let result = sqlx::query!(
            "SELECT password_employee FROM employees WHERE name_employee = ?",
            name_employee
        )
        .fetch_optional(&*pool)
        .await
        .map_err(|e| format!("Erro ao buscar senha: {}", e))?;
    
        if let Some(record) = result {
          
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
    
            //gera a nova senha
            let salt = SaltString::generate(&mut OsRng);
            let nova_senha_hash = argon2
            //Criação do hash da nova senha
                .hash_password(new_password.as_bytes(), &salt)
                .map_err(|e| format!("Erro ao gerar hash: {}", e))?
                .to_string();
    
           //Atualiza a nova senha com hash no banco
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


