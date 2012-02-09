<?php
# прикручиваем modx API
define('MODX_MANAGER_PATH', $_SERVER['DOCUMENT_ROOT'].'/manager');
require_once MODX_MANAGER_PATH.'/includes/protect.inc.php';
require_once MODX_MANAGER_PATH.'/includes/config.inc.php';
require_once MODX_MANAGER_PATH.'/includes/document.parser.class.inc.php';
$modx = new DocumentParser;
$modx->loadExtension("ManagerAPI");
$modx->getSettings();
session_name($site_sessionname);
session_start();

if(!isset($_SESSION['mgrValidated'])) die('not enougn mana...');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
	$fullPath = explode('?', $_POST['path']);
	$fullPath = $_SERVER['DOCUMENT_ROOT'].$fullPath[0];

	if(!file_exists($fullPath)) {
		$output = array(
			'fail' => true,
			'message' => 'Изображение не найдено - '.$fullPath
		);
	}
	elseif(!@unlink($fullPath)) {
		$output = array(
			'fail' => true,
			'message' => 'Не удалось удалить изображение'
		);
	}
	else {
		$output = array(
			'success' => true,
			'message' => 'Изображение удалено'
		);
	}
	die(json_encode($output));
}