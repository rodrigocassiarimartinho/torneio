<?php
require_once 'config.php';
$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST' && isset($_GET['action']) && $_GET['action'] == 'upload') {
    handleUploadRequest($conn);
} elseif ($method == 'GET') {
    if (isset($_GET['action']) && $_GET['action'] == 'list') {
        handleListRequest($conn);
    } elseif (isset($_GET['action']) && $_GET['action'] == 'get_photos') {
        handleGetPhotosRequest($conn);
    } else {
        handleGetRequest($conn);
    }
} elseif ($method == 'POST') {
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

function handleUploadRequest($conn) {
    if (!isset($_POST['public_id']) || empty($_POST['public_id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Tournament ID is required.']);
        return;
    }
    if (!isset($_FILES['photo'])) {
        http_response_code(400);
        echo json_encode(['message' => 'No file provided.']);
        return;
    }

    $public_id = $_POST['public_id'];
    $file = $_FILES['photo'];

    $stmt_find = $conn->prepare("SELECT tournament_id FROM tournaments WHERE public_id = ?");
    $stmt_find->bind_param("s", $public_id);
    $stmt_find->execute();
    $result = $stmt_find->get_result();
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Tournament not found.']);
        return;
    }
    $row = $result->fetch_assoc();
    $tournament_id = $row['tournament_id'];
    $stmt_find->close();

    $target_dir = "../uploads/";
    $file_extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $new_file_name = uniqid('media_', true) . '.' . $file_extension;
    $target_file = $target_dir . $new_file_name;
    
    $allowed_image_types = ["jpg", "jpeg", "png", "gif"];
    $allowed_video_types = ["mp4", "webm", "mov"];
    $allowed_types = array_merge($allowed_image_types, $allowed_video_types);

    if (!in_array($file_extension, $allowed_types)) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid file type. Only JPG, PNG, GIF, MP4, WEBM, MOV are allowed.']);
        return;
    }

    if (move_uploaded_file($file["tmp_name"], $target_file)) {
        $stmt_insert = $conn->prepare("INSERT INTO tournament_photos (tournament_id, file_name) VALUES (?, ?)");
        $stmt_insert->bind_param("is", $tournament_id, $new_file_name);
        if ($stmt_insert->execute()) {
            http_response_code(201);
            echo json_encode(['message' => 'File uploaded successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to save file record to database.']);
        }
        $stmt_insert->close();
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to upload file. Check server permissions and file size limits.']);
    }
}

function handleGetPhotosRequest($conn) {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Tournament ID is required.']);
        return;
    }
    $public_id = $_GET['id'];
    $stmt = $conn->prepare("SELECT p.file_name FROM tournament_photos p JOIN tournaments t ON p.tournament_id = t.tournament_id WHERE t.public_id = ? ORDER BY p.uploaded_at ASC");
    $stmt->bind_param("s", $public_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $photos = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $photos[] = $row['file_name'];
        }
    }
    http_response_code(200);
    echo json_encode($photos);
}

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

function handleGetRequest($conn) {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Tournament ID is required.']);
        return;
    }
    $public_id = $_GET['id'];
    $stmt = $conn->prepare("SELECT name, tournament_date, type, bracket_data FROM tournaments WHERE public_id = ?");
    $stmt->bind_param("s", $public_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $row['bracket_data'] = json_decode($row['bracket_data']); 
        http_response_code(200);
        echo json_encode($row);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Tournament not found.']);
    }
    $stmt->close();
}

// --- INÍCIO DA CORREÇÃO ---
function handleListRequest($conn) {
    $result = $conn->query("SELECT public_id, name, tournament_date, type FROM tournaments ORDER BY tournament_date DESC, name ASC");

    // Adiciona uma verificação para ver se a consulta SQL falhou
    if ($result === false) {
        http_response_code(500); // Internal Server Error
        // Retorna o erro específico do MySQL para nos ajudar a depurar
        echo json_encode(['message' => 'Database query failed.', 'error' => $conn->error]);
        return; // Para a execução
    }

    $tournaments = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $tournaments[] = $row;
        }
    }
    http_response_code(200);
    echo json_encode($tournaments);
}
// --- FIM DA CORREÇÃO ---
?>
