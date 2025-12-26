<?php
/**
 * Private Notes Authentication Handler
 * 
 * Handles login/logout and session verification for PRIVATE notes.
 * Files ending with "PRIVATE.md" require authentication to view.
 */

session_start();
header('Content-Type: application/json');

// Load the password from the environment file
$passwordFile = __DIR__ . '/.env-password.php';
if (!file_exists($passwordFile)) {
    echo json_encode([
        'success' => false,
        'error' => 'Password configuration file not found'
    ]);
    exit;
}

include($passwordFile);

// Get the action from the request
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : null);

// Handle JSON body for POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if ($data) {
        $action = isset($data['action']) ? $data['action'] : $action;
        $submittedPassword = isset($data['password']) ? $data['password'] : null;
    }
}

switch ($action) {
    case 'login':
        // Verify the password
        if (!isset($submittedPassword)) {
            echo json_encode([
                'success' => false,
                'error' => 'Password is required'
            ]);
            exit;
        }
        
        if ($submittedPassword === $password) {
            $_SESSION['private_auth'] = true;
            $_SESSION['private_auth_time'] = time();
            echo json_encode([
                'success' => true,
                'message' => 'Authentication successful'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Invalid password'
            ]);
        }
        break;
        
    case 'logout':
        unset($_SESSION['private_auth']);
        unset($_SESSION['private_auth_time']);
        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
        break;
        
    case 'check':
        // Check if user is authenticated
        $isAuthenticated = isset($_SESSION['private_auth']) && $_SESSION['private_auth'] === true;
        echo json_encode([
            'success' => true,
            'authenticated' => $isAuthenticated
        ]);
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'error' => 'Invalid action. Use: login, logout, or check'
        ]);
        break;
}
?>

