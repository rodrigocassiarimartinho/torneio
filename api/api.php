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
    
    // --- INÍCIO DA MUDANÇA ---
    $allowed_image_types = ["jpg", "jpeg", "png", "gif"];
    $allowed_video_types = ["mp4", "webm", "mov"];
    $allowed_types = array_merge($allowed_image_types, $allowed_video_types);

    if (!in_array($file_extension, $allowed_types)) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid file type. Only JPG, PNG, GIF, MP4, WEBM, MOV are allowed.']);
        return;
    }
    // --- FIM DA MUDANÇA ---

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

function handlePostRequest($conn, $data) { /* ...código inalterado... */ }
function handleDeleteRequest($conn, $data) { /* ...código inalterado... */ }
function handleGetRequest($conn) { /* ...código inalterado... */ }
function handleListRequest($conn) { /* ...código inalterado... */ }
?>
