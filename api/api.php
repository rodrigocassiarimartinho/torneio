<?php
require_once 'config.php';
$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    if (isset($_GET['action']) && $_GET['action'] == 'list') {
        handleListRequest($conn);
    } else {
        handleGetRequest($conn);
    }
} elseif ($method == 'POST') {
    // A lógica POST agora verifica uma ação específica (delete)
    $data = json_decode(file_get_contents('php://input'));
    if (isset($data->action) && $data->action == 'delete') {
        handleDeleteRequest($conn, $data);
    } else {
        handlePostRequest($conn, $data);
    }
} else {
    header('HTTP/1.0 405 Method Not Allowed');
    echo json_encode(['message' => 'Method not allowed']);
}
$conn->close();

function handlePostRequest($conn, $data) {
    if (empty($data) || !isset($data->bracket_data) || !isset($data->name) || !isset($data->type) || !isset($data->date)) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid data. Name, type, date, and bracket_data are required.']);
        return;
    }
    
    $bracket_data_json = json_encode($data->bracket_data);
    $name = $data->name;
    $type = $data->type;
    $date = $data->date;

    if (isset($data->public_id) && !empty($data->public_id)) {
        $public_id = $data->public_id;
        $stmt = $conn->prepare("UPDATE tournaments SET name = ?, tournament_date = ?, type = ?, bracket_data = ? WHERE public_id = ?");
        $stmt->bind_param("sssss", $name, $date, $type, $bracket_data_json, $public_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(['message' => 'Tournament updated successfully.', 'id' => $public_id]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update tournament.']);
        }
    } else {
        $public_id = substr(md5(uniqid(rand(), true)), 0, 8);
        $stmt = $conn->prepare("INSERT INTO tournaments (public_id, name, tournament_date, type, bracket_data) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $public_id, $name, $date, $type, $bracket_data_json);
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(['message' => 'Tournament created successfully.', 'id' => $public_id]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create tournament.']);
        }
    }
    $stmt->close();
}

// --- INÍCIO DA NOVA FUNÇÃO ---
function handleDeleteRequest($conn, $data) {
    if (!isset($data->public_id) || empty($data->public_id)) {
        http_response_code(400);
        echo json_encode(['message' => 'Tournament ID is required.']);
        return;
    }

    $public_id = $data->public_id;
    $stmt = $conn->prepare("DELETE FROM tournaments WHERE public_id = ?");
    $stmt->bind_param("s", $public_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode(['message' => 'Tournament deleted successfully.']);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Tournament not found.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to delete tournament.']);
    }
    $stmt->close();
}
// --- FIM DA NOVA FUNÇÃO ---


function handleGetRequest($conn) {
    // ... (função inalterada)
}

function handleListRequest($conn) {
    // ... (função inalterada)
}
?>
