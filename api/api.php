<?php
// Inclui o arquivo de configuração
require_once 'config.php';

// Cria a conexão com o banco de dados
$conn = getDbConnection();

// Determina a ação baseada no método da requisição (GET para carregar, POST para salvar)
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // Ação: Salvar/Atualizar uma chave de torneio
        handlePostRequest($conn);
        break;
    case 'GET':
        // Ação: Carregar uma chave de torneio
        handleGetRequest($conn);
        break;
    default:
        // Método não permitido
        header('HTTP/1.0 405 Method Not Allowed');
        echo json_encode(['message' => 'Method not allowed']);
        break;
}

// Fecha a conexão
$conn->close();

function handlePostRequest($conn) {
    // Pega os dados enviados no corpo da requisição
    $data = json_decode(file_get_contents('php://input'));

    if (empty($data) || !isset($data->bracket_data) || !isset($data->name)) {
        http_response_code(400); // Bad Request
        echo json_encode(['message' => 'Invalid data provided.']);
        return;
    }
    
    // Gera um ID público aleatório e curto
    $public_id = substr(md5(uniqid(rand(), true)), 0, 8);
    $name = $data->name;
    $bracket_data_json = json_encode($data->bracket_data);

    // Usa "prepared statements" para segurança contra SQL Injection
    $stmt = $conn->prepare("INSERT INTO tournaments (public_id, name, bracket_data) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $public_id, $name, $bracket_data_json);

    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(['message' => 'Tournament created successfully.', 'id' => $public_id]);
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(['message' => 'Failed to create tournament.']);
    }
    $stmt->close();
}

function handleGetRequest($conn) {
    // Pega o 'id' da URL (ex: api.php?id=a8x3f)
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Tournament ID is required.']);
        return;
    }
    
    $public_id = $_GET['id'];

    $stmt = $conn->prepare("SELECT name, bracket_data FROM tournaments WHERE public_id = ?");
    $stmt->bind_param("s", $public_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        // O bracket_data já está em formato JSON, mas o PHP o lê como string
        // então decodificamos para re-codificar corretamente como objeto JSON na resposta.
        $row['bracket_data'] = json_decode($row['bracket_data']); 
        
        http_response_code(200);
        echo json_encode($row);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['message' => 'Tournament not found.']);
    }
    $stmt->close();
}
?>
