use crate::database::Database;
use sqlx::query;
use tauri::State;
use serde_json::json;
use chrono::{NaiveDateTime, NaiveTime, NaiveDate};
use serde::Serialize;




#[derive(Serialize)]
pub struct HorarioFuncionamento {
    pub opening_time: String,
    pub closing_time: String,
}

#[derive(Serialize)]
struct ReservaRecord {
    id_reservation: i32,
    date_reservation: Option<NaiveDate>,
    time_reservation: Option<NaiveTime>,
    number_people: Option<i32>,
    name_customer: Option<String>,
    telephone_customer: Option<String>,
    email_customer: Option<String>,
    pub status: Option<String>,
}

#[tauri::command]
pub async fn login_command(
    db: State<'_, Database>,
    name_employee: String,
    password_employee: String,
) -> Result<serde_json::Value, String> {
    match db.login(name_employee, password_employee).await {
        Ok(Some((employee_name, employee_position, is_first_login))) => {
            Ok(json!({
                "success": true,
                "message": "Login bem-sucedido",
                "employeeName": employee_name,
                "employeePosition": employee_position,
                "isFirstLogin": is_first_login
            }))
        }
        Ok(None) => Ok(json!({
            "success": false,
            "message": "Senha incorreta"
        })),
        Err(e) => Ok(json!({
            "success": false,
            "message": e.to_string()
        })),
    }
}


#[tauri::command]
pub async fn alterar_senha_command(
    db: State<'_, Database>,
    name_employee: String,
    old_password: String,
    new_password: String,
) -> Result<serde_json::Value, String> {
    match db.inner().alterar_senha(name_employee, old_password, new_password).await {
        Ok(_) => Ok(json!({
            "success": true,
            "message": "Senha atualizada com sucesso"
        })),
        Err(e) => Ok(json!({
            "success": false,
            "message": e
        })),
    }
}






#[tauri::command]
pub async fn cadastrar_cliente(
    db: State<'_, Database>,
    cpf: String,
    nome: String,
    sobrenome: String,
    telefone: String,
    email: String,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    match query!(
        "INSERT INTO customers (cpf_customer, name_customer, last_name_customer, telephone_customer, email_customer) VALUES (?, ?, ?, ?, ?)",
        cpf,
        nome,
        sobrenome,
        telefone,
        email
    )
    .execute(&*pool)
    .await
    {
        Ok(_) => Ok(json!({ "success": true, "message": "Cliente cadastrado com sucesso" })),
        Err(e) => {
            eprintln!("Erro ao cadastrar cliente: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao cadastrar cliente: {}", e) }))
        }
    }
}

#[tauri::command]
pub async fn buscar_cliente(
    db: State<'_, Database>,
    cpf: Option<String>,
    telefone: Option<String>,
    nome: Option<String>,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let mut query_str = "SELECT * FROM customers WHERE 1=1".to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(cpf) = cpf {
        query_str.push_str(" AND cpf_customer = ?");
        params.push(cpf);
    }
    if let Some(telefone) = telefone {
        if !telefone.is_empty() {
            query_str.push_str(" AND telephone_customer = ?");
            params.push(telefone);
        }
    }
    if let Some(nome) = nome {
        if !nome.is_empty() {
            query_str.push_str(" AND name_customer LIKE ?");
            params.push(format!("%{}%", nome));
        }
    }

    println!("Consulta SQL real: {} com valores {:?}", query_str, params);

    let mut query = sqlx::query_as::<_, (i32, String, String, String, String, String)>(&query_str);
    for param in &params {
        query = query.bind(param);
    }

    let result = query.fetch_one(&*pool).await;

    match result {
        Ok(cliente) => {
            println!("Cliente encontrado: {:?}", cliente);
            Ok(json!(cliente))
        }
        Err(e) => {
            eprintln!("Erro ao buscar cliente: {}", e);
            Err(format!("Erro ao buscar cliente: {}", e))
        }
    }
}

#[derive(serde::Serialize, sqlx::FromRow)]

pub struct Cliente {
    pub id_customer: i32,
    pub cpf_customer: String,
    pub name_customer: String,
    pub last_name_customer: String,
    pub telephone_customer: String,
    pub email_customer: String,
}


#[tauri::command]
pub async fn listar_clientes(db: State<'_, Database>) -> Result<Vec<Cliente>, String> {
    
    let pool = db.pool.lock().await;

    let clientes = sqlx::query_as!(
        Cliente,
      "SELECT id_customer, cpf_customer, name_customer, last_name_customer, telephone_customer, email_customer FROM customers"
    )
    .fetch_all(&*pool) 
    .await
    .map_err(|e| format!("Erro ao buscar usuários: {}", e))?;

    Ok(clientes)
}

#[tauri::command]
pub async fn buscar_cliente_por_id(
    db: State<'_, Database>,
    id: i32,
) -> Result<Cliente, String> {
    let pool = db.pool.lock().await;

    let result = sqlx::query_as!(
        Cliente,
        "SELECT id_customer, cpf_customer, name_customer, last_name_customer, telephone_customer, email_customer FROM customers WHERE id_customer = ?",
        id
    )
    .fetch_one(&*pool)
    .await;

    result.map_err(|e| format!("Erro ao buscar cliente: {}", e))
}

#[tauri::command]
pub async fn editar_cliente(
    db: State<'_, Database>,
    id_cliente: i32,
    cpf: String,
    nome: String,
    sobrenome: String,
    telefone: String,
    email: String,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let result = sqlx::query!(
        "UPDATE customers SET cpf_customer = ?, name_customer = ?, last_name_customer = ?, telephone_customer = ?, email_customer = ? WHERE id_customer = ?",
        cpf,
        nome,
        sobrenome,
        telefone,
        email,
        id_cliente
    )
    .execute(&*pool)
    .await;

    match result {
        Ok(_) => Ok(json!({ "success": true, "message": "Cliente atualizado com sucesso" })),
        Err(e) => {
            eprintln!("Erro ao atualizar cliente: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao atualizar cliente: {}", e) }))
        }
    }
}


#[tauri::command]
pub async fn excluir_cliente(
    db: State<'_, Database>,
    id_cliente: i32,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let result = sqlx::query!(
        "DELETE FROM customers WHERE id_customer = ?",
        id_cliente
    )
    .execute(&*pool)
    .await;

    match result {
        Ok(_) => Ok(json!({ "success": true, "message": "Cliente excluído com sucesso" })),
        Err(e) => {
            eprintln!("Erro ao excluir cliente: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao excluir cliente: {}", e) }))
        }
    }
}



#[tauri::command]
pub async fn buscar_reservas_por_cpf(
    db: State<'_, Database>,
    cpf: String,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let result = sqlx::query!(
        r#"
        SELECT 
            r.id_reservation, 
            CAST(r.date_reservation AS CHAR) as date_reservation, 
            CAST(r.time_reservation AS CHAR) as time_reservation, 
            r.number_people, 
            r.name_customer, 
            r.telephone_customer, 
            r.email_customer, 
            r.customer_id,
            r.status,
            r.table_id
        FROM reservations r 
        JOIN customers c ON r.customer_id = c.id_customer 
        WHERE c.cpf_customer = ?
        "#,
        cpf
    )
    .fetch_all(&*pool)
    .await;

    match result {
        Ok(reservas) => {
            let reservas_json: Vec<_> = reservas
                .into_iter()
                .map(|row| {
                    json!({
                        "id_reservation": row.id_reservation,
                        "date_reservation": row.date_reservation,
                        "time_reservation": row.time_reservation,
                        "number_people": row.number_people,
                        "name_customer": row.name_customer,
                        "telephone_customer": row.telephone_customer,
                        "email_customer": row.email_customer,
                        "customer_id": row.customer_id,
                        "status": row.status,
                        "table_id":row.table_id,
                    })
                })
                .collect();
            Ok(json!(reservas_json))
        }
        Err(e) => {
            eprintln!("Erro ao buscar reservas: {}", e);
            Err(format!("Erro ao buscar reservas: {}", e))
        }
    }
}


#[tauri::command]
pub async fn obter_horario_funcionamento(
    db: State<'_, Database>,
    dia_semana: String, // Recebe o dia (ainda vindo do JS, ex: "segunda-feira")
) -> Result<HorarioFuncionamento, String> {
    let pool = db.pool.lock().await;

    // Log para depuração: Ver o que está sendo recebido do JS
    println!("Backend: Recebido para buscar horário: {}", dia_semana);

    // *** MUDANÇA AQUI: Usar LOWER() na query SQL ***
    // Compara a versão minúscula da coluna com a versão minúscula do parâmetro
    let result = sqlx::query!(
        "SELECT opening_time, closing_time FROM operating_hours WHERE LOWER(day_of_week) = LOWER(?)",
        dia_semana // Passa o dia_semana como recebido (ex: "segunda-feira")
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|e| {
        eprintln!("Erro na query SQL (LOWER) para buscar horário: {}", e);
        format!("Erro de banco de dados ao buscar horário: {}", e)
    })?;

    match result {
        Some(row) => {
            let opening_time_naive = row.opening_time;
            let closing_time_naive = row.closing_time;

            let opening_time_str = opening_time_naive
                .map(|t| t.format("%H:%M").to_string())
                .unwrap_or_else(|| "00:00".to_string());

            let closing_time_str = closing_time_naive
                .map(|t| t.format("%H:%M").to_string())
                .unwrap_or_else(|| "23:59".to_string());

            println!("Backend: Horário encontrado (via LOWER) - Abertura: {}, Fechamento: {}", opening_time_str, closing_time_str);

            Ok(HorarioFuncionamento {
                opening_time: opening_time_str,
                closing_time: closing_time_str,
            })
        }
        None => {
            println!("Backend: Horário de funcionamento não encontrado no DB (via LOWER) para: {}", dia_semana);
            // Retorna o nome como recebido do JS na mensagem de erro
            Err(format!("Horário de funcionamento não encontrado para '{}'", dia_semana))
        }
    }
}

#[tauri::command]
pub async fn buscar_reserva_command(
    db: State<'_, Database>,
    date_reservation: String,
    time_reservation: String,
    number_people: i32,
    customer_id: i32,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let result = sqlx::query_as!(
        ReservaRecord,
        "SELECT id_reservation, date_reservation, time_reservation, number_people, name_customer, telephone_customer, email_customer, status
         FROM reservations
         WHERE date_reservation = ? AND time_reservation = ? AND number_people = ? AND customer_id = ?",
        date_reservation,
        time_reservation,
        number_people,
        customer_id
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|e| format!("Erro ao buscar reserva: {}", e))?;

    match result {
        Some(reserva) => Ok(json!(reserva)),
        None => Ok(json!(null)),
    }
}

#[derive(Debug, Serialize)] 
struct Mesa {
    id_tables: i32,
    quantity_chairs: i32,
    tipo_tables: Option<String>,
}


#[tauri::command]
pub async fn mesas_disponiveis_para_reserva(
    state: tauri::State<'_, Database>,
    date_reservation: String,
    number_people: i32,
) -> Result<Vec<serde_json::Value>, String> {
    let pool = state.pool.lock().await;

    let datetime = chrono::NaiveDateTime::parse_from_str(&date_reservation, "%Y-%m-%dT%H:%M")
        .map_err(|e| format!("Erro ao converter data e hora: {}", e))?;

    let duration_minutes = 120;
    let start_time = datetime.time();
    let end_time = start_time + chrono::Duration::minutes(duration_minutes);

    let mesas = sqlx::query!(
        "
        SELECT m.id_tables, m.quantity_chairs
        FROM tables m
        WHERE m.quantity_chairs >= ?
        AND m.id_tables NOT IN (
            SELECT r.table_id
            FROM reservations r
            WHERE r.date_reservation = ?
            AND r.status = 'ativa'
            AND (
                (r.time_reservation BETWEEN ? AND ?)
                OR (? BETWEEN r.time_reservation AND ADDTIME(r.time_reservation, '01:59:00'))
            )
        )
        ",
        number_people,
        datetime.date(),
        start_time,
        end_time,
        start_time
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Erro ao buscar mesas disponíveis: {}", e))?;

    let mesas_json: Vec<serde_json::Value> = mesas
        .into_iter()
        .map(|r| {
            serde_json::json!({
                "id_tables": r.id_tables,
                "quantity_chairs": r.quantity_chairs
            })
        })
        .collect();

    Ok(mesas_json)
}
#[tauri::command]
pub async fn criar_reserva_command(
    db: State<'_, Database>,
    date_reservation: String,
    time_reservation: String,
    number_people: i32,
    name_customer: String,
    telephone_customer: String,
    email_customer: String,
    customer_id: i32,
    status: String,
    table_id: i32, // AGORA recebendo a mesa diretamente
) -> Result<serde_json::Value, String> {
   

    let date = NaiveDate::parse_from_str(&date_reservation, "%Y-%m-%d")
        .map_err(|e| format!("Formato de data inválido: {}", e))?;

    let time_str = if time_reservation.len() == 5 {
        format!("{}:00", time_reservation)
    } else {
        time_reservation.clone()
    };

    let time = NaiveTime::parse_from_str(&time_str, "%H:%M:%S")
        .map_err(|e| format!("Formato de hora inválido: {}", e))?;

    // Verifica se a mesa já está ocupada nesse horário
    let pool = db.inner().pool.lock().await;

    let duration_minutes = 120;
    let end_time = time + chrono::Duration::minutes(duration_minutes);
    
    let reserva_existente = sqlx::query(
        "
        SELECT 1 FROM reservations
        WHERE table_id = ?
        AND date_reservation = ?
        AND status = 'ativa'
        AND (
            (time_reservation BETWEEN ? AND ?)
            OR (? BETWEEN time_reservation AND ADDTIME(time_reservation, '01:59:00'))
        )
        "
    )
    .bind(table_id)
    .bind(date)
    .bind(time)
    .bind(end_time)
    .bind(time)
    .fetch_optional(&*pool)
    .await
    .map_err(|e| format!("Erro ao verificar reservas existentes: {}", e))?;

    // Realiza a reserva com a mesa informada
    let insert_result = sqlx::query!(
        r#"
        INSERT INTO reservations (
            date_reservation,
            time_reservation,
            number_people,
            name_customer,
            telephone_customer,
            email_customer,
            customer_id,
            status,
            table_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        date,
        time,
        number_people,
        name_customer,
        telephone_customer,
        email_customer,
        customer_id,
        status,
        table_id
    )
    .execute(&*pool)
    .await;

    match insert_result {
        Ok(_) => Ok(json!({
            "success": true,
            "message": format!("Reserva criada com sucesso na mesa {}", table_id)
        })),
        Err(e) => Err(format!("Erro ao criar reserva: {}", e)),
    }
}


#[tauri::command]
pub async fn mesas_disponiveis_para_reserva_edicao(
    db: State<'_, Database>,
    id_reservation: i32,
    date_reservation: String,
    number_people: i32
) -> Result<Vec<(i32, i32)>, String> {
    let pool = db.pool.lock().await;

    let datetime = NaiveDateTime::parse_from_str(&date_reservation, "%Y-%m-%dT%H:%M:%S")
        .or_else(|_| NaiveDateTime::parse_from_str(&date_reservation, "%Y-%m-%dT%H:%M"))
        .map_err(|_| "Formato de data e hora inválido".to_string())?;

    let start_time = datetime.time();
    let end_time = start_time + chrono::Duration::minutes(120);

    let mesas = sqlx::query!(
        "
        SELECT m.id_tables, m.quantity_chairs
        FROM tables m
        WHERE m.quantity_chairs >= ?
        AND m.id_tables NOT IN (
            SELECT r.table_id
            FROM reservations r
            WHERE r.date_reservation = ?
              AND r.status = 'ativa'
              AND r.id_reservation != ?
              AND (
                  (r.time_reservation BETWEEN ? AND ?)
                  OR (? BETWEEN r.time_reservation AND ADDTIME(r.time_reservation, '01:59:00'))
              )
        )
        ",
        number_people,
        datetime.date(),
        id_reservation,
        start_time,
        end_time,
        start_time
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Erro ao buscar mesas disponíveis: {}", e))?;

    Ok(mesas.into_iter().map(|r| (r.id_tables, r.quantity_chairs)).collect())
}





#[tauri::command]
pub async fn editar_reserva_command(
    db: State<'_, Database>,
    id_reservation: i32,
    date_reservation: String,
    number_people: i32,
    name_customer: String,
    telephone_customer: String,
    email_customer: String,
    status: String,
    table_id: i32,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let datetime = NaiveDateTime::parse_from_str(&date_reservation, "%Y-%m-%dT%H:%M")
        .map_err(|e| format!("Formato de data e hora inválido: {}, valor recebido: '{}'", e, date_reservation))?;

    let start_time = datetime.time();
    let end_time = start_time + chrono::Duration::minutes(120);

    // Verifica se a mesa ainda está disponível considerando intervalo
    let conflito = sqlx::query!(
        "
        SELECT COUNT(*) as count
        FROM reservations
        WHERE table_id = ?
          AND date_reservation = ?
          AND id_reservation != ?
          AND status = 'ativa'
          AND (
              (time_reservation BETWEEN ? AND ?)
              OR (? BETWEEN time_reservation AND ADDTIME(time_reservation, '01:59:00'))
          )
        ",
        table_id,
        datetime.date(),
        id_reservation,
        start_time,
        end_time,
        start_time
    )
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("Erro ao verificar disponibilidade da mesa: {}", e))?;

    if conflito.count > 0 {
        return Ok(json!({
            "success": false,
            "message": "A mesa já está reservada para o horário selecionado."
        }));
    }

    // Atualiza a reserva
    let result = sqlx::query!(
        "
        UPDATE reservations
        SET date_reservation = ?, time_reservation = ?, number_people = ?, name_customer = ?,
            telephone_customer = ?, email_customer = ?, status = ?, table_id = ?
        WHERE id_reservation = ?
        ",
        datetime.date(),
        datetime.time(),
        number_people,
        name_customer,
        telephone_customer,
        email_customer,
        status,
        table_id,
        id_reservation
    )
    .execute(&*pool)
    .await;

    match result {
        Ok(_) => Ok(json!({ "success": true, "message": "Reserva atualizada com sucesso" })),
        Err(e) => {
            eprintln!("Erro ao atualizar reserva: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao atualizar reserva: {}", e) }))
        }
    }
}


#[tauri::command]
pub async fn cancelar_reserva_command(
    db: State<'_, Database>,
    id_reservation: i32,
) -> Result<serde_json::Value, String> {
    let pool = db.pool.lock().await;

    let result = sqlx::query!(
        "UPDATE reservations SET status = 'Cancelada' WHERE id_reservation = ?",
        id_reservation
    )
    .execute(&*pool)
    .await;

    match result {
        Ok(_) => Ok(json!({ "success": true, "message": "Reserva cancelada com sucesso" })),
        Err(e) => {
            eprintln!("Erro ao cancelar reserva: {}", e);
            Ok(json!({ "success": false, "message": format!("Erro ao cancelar reserva: {}", e) }))
        }
    }
}


#[tauri::command]
pub async fn buscar_total_reservado_e_limite(
    data: String,
    horario: String,
    state: tauri::State<'_, Database>
) -> Result<serde_json::Value, String> {
    let pool = state.pool.lock().await;

    let row: (Option<i32>,) = sqlx::query_as(
        "SELECT CAST(SUM(CAST(number_people AS SIGNED)) AS SIGNED) FROM reservations WHERE date_reservation = ? AND time_reservation = ?"
    )
    .bind(&data)
    .bind(&horario)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let total_reservado = row.0.unwrap_or(0);

    let row_limite: (Option<i32>,) = sqlx::query_as(
        "SELECT CAST(SUM(CAST(quantity_chairs AS SIGNED)) AS SIGNED) FROM tables"
    )
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let capacidade_maxima = row_limite.0.unwrap_or(0);

    Ok(serde_json::json!({
        "total_reservado": total_reservado,
        "capacidade_maxima": capacidade_maxima
    }))
}

#[tauri::command]

pub async fn verificar_lotacao_command(
    date: String,
    time_slot: String,
    state: tauri::State<'_, Database>
) -> Result<serde_json::Value, String> {
    buscar_total_reservado_e_limite(date, time_slot, state).await
}

