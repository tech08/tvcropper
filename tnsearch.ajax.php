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

	/*TODO Неправильное определение адреса картинки. Возможные варианты:
	 * assets/images/...
	 * /assets/images/...
	 * http://domain.tld/assets/images
	 */
	
	# возвращает адрес сервера
	//TODO заменить на $modx->config...
	function getSiteUrl() {
		$httpsPort = 443;
		$siteUrl= ((isset ($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) == 'on') || $_SERVER['SERVER_PORT'] == $httpsPort) ? 'https://' : 'http://';
		$siteUrl .= $_SERVER['HTTP_HOST'];
		if ($_SERVER['SERVER_PORT'] != 80) {
			$siteUrl= str_replace(':' . $_SERVER['SERVER_PORT'], '', $siteUrl); // remove port from HTTP_HOST
		}
		$siteUrl .= ($_SERVER['SERVER_PORT'] == 80 || (isset ($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) == 'on') || $_SERVER['SERVER_PORT'] == $httpsPort) ? '' : ':' . $_SERVER['SERVER_PORT'];
		return $siteUrl.'/';
	}
	
	# возвращает абсолютный путь до изображения
	function getImagePath($url) {
		$siteUrl = getSiteUrl();
		
		# если url задан вместе с сервером
		if(strpos($url, $siteUrl)===0) {
			$url = end(explode($siteUrl, $url));
		}
		
		# удаляем слеш, если он есть
		$url = trim($url, '/');
		$url = str_replace('/', DIRECTORY_SEPARATOR, $url);
		
		return $_SERVER['DOCUMENT_ROOT'].DIRECTORY_SEPARATOR.$url;
	}
	
	
	
	
	$filePath = getImagePath($_POST['path']);
	$fileInfo = pathinfo($filePath);
	
	$files = scandir($fileInfo['dirname']);
	# ищем превью в папке
	$pattern = '#^\.tn_(\d+)x(\d+)_'.preg_quote($fileInfo['basename']).'$#Uusi';
	foreach($files as $file) {
		if(preg_match($pattern, $file)) {
			$output[] = array(
					'file' => dirname($_POST['path']).'/'.$file,
					'width' => preg_replace($pattern, '$1', $file),
					'height' => preg_replace($pattern, '$2', $file)
			);
		}
	}
	
	die(json_encode($output));
	
	
	
	
	
	
	/*$hostName = $modx->config['site_url'];
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
	die(json_encode($output));*/
}