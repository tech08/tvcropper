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

	$hostName = $modx->config['site_url'];
	$hostName = preg_replace('#^(.+://.+)/.*$#Uusi', '$1', $hostName);

	$filePath = end(explode($hostName, $_POST['path']));
	$fpArr = explode('/', $filePath);

	$fileName = array_pop($fpArr);
	#$fileName = reset(explode('.', $fileName));

	# папка файла
	$fileFolder = implode('/', $fpArr);
	$fileFolderFull = $_SERVER['DOCUMENT_ROOT'].$fileFolder;

	$files = scandir($fileFolderFull);
	# ищем превью в папке
	$pattern = '#^\.tn_(\d+)x(\d+)_'.preg_quote($fileName).'$#Uusi';
	foreach($files as $file) {
		if(preg_match($pattern, $file)) {
			$output[] = array(
				'file' => $fileFolder.'/'.$file,
				'width' => preg_replace($pattern, '$1', $file),
				'height' => preg_replace($pattern, '$2', $file)
			);
		}
	}
	#print_r($output);
	die(json_encode($output));
}