<?php
require_once 'config.php';
$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// A API agora pode lidar com um parâmetro 'upload' especial
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


// --- INÍCIO DAS NOVAS FUNÇÕES DE FOTOS ---

function handleUploadRequest($conn) {
    if (!isset($_POST['public_id']) || empty($_POST['public_id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Tournament ID is required.']);
        return;
    }
    if (!isset($_FILES['photo'])) {
        http_response_code(400);
        echo json_encode(['message' => 'No photo file provided.']);
        return;
    }

    $public_id = $_POST['public_id'];
    $photo = $_FILES['photo'];

    // Pega o ID interno do torneio a partir do ID público
    $stmt = $conn->prepare("SELECT tournament_id FROM tournaments WHERE public_id = ?");
    $stmt->bind_param("s", $public_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Tournament not found.']);
        return;
    }
    $row = $result->fetch_assoc();
    $tournament_id = $row['tournament_id'];
    $stmt->close();

    // Validação do arquivo
    $target_dir = "../uploads/";
    $imageFileType = strtolower(pathinfo($photo["name"], PATHINFO_EXTENSION));
    $new_file_name = uniqid('img_', true) . '.' . $imageFileType;
    $target_file = $target_dir . $new_file_name;
    
    // Verifica se é uma imagem real
    if (getimagesize($photo["tmp_name"]) === false) {
        http_response_code(400);
        echo json_encode(['message' => 'File is not an image.']);
        return;
    }
    // Verifica extensões permitidas
    if($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg" && $imageFileType != "gif" ) {
        http_response_code(400);
        echo json_encode(['message' => 'Only JPG, JPEG, PNG & GIF files are allowed.']);
        return;
    }

    // Tenta mover o arquivo e salvar no banco de dados
    if (move_uploaded_file($photo["tmp_name"], $target_file)) {
        $stmt_insert = $conn->prepare("INSERT INTO tournament_photos (tournament_id, file_name) VALUES (?, ?)");
        $stmt_insert->bind_param("is", $tournament_id, $new_file_name);
        if ($stmt_insert->execute()) {
            http_response_code(201);
            echo json_encode(['message' => 'Photo uploaded successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to save photo record to database.']);
        }
        $stmt_insert->close();
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to upload photo.']);
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

// --- FIM DAS NOVAS FUNÇÕES DE FOTOS ---


function handlePostRequest($conn, $data) { /* ...código inalterado... */ }
function handleDeleteRequest($conn, $data) { /* ...código inalterado... */ }
function handleGetRequest($conn) { /* ...código inalterado... */ }
function handleListRequest($conn) { /* ...código inalterado... */ }
?>
