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
//die($_POST['resize']);
if(!isset($_SESSION['mgrValidated'])) die('not enougn mana...');


if ($_SERVER['REQUEST_METHOD'] == 'POST') {

	# вычисляем тип изображения
	$imageName = end(explode(DIRECTORY_SEPARATOR, $_POST['source_image']));
	$imageType = strtolower(end(explode('.', $imageName)));
	$imageType = ($imageType=='jpg') ? 'jpeg' : $imageType;

	switch($imageType) {
		case 'jpeg':
			$sourceImage = imagecreatefromjpeg($_POST['source_image']);
			$jpegQuality = 90;
			break;

		case 'png':
			$sourceImage = imagecreatefrompng($_POST['source_image']);
			break;

		case 'gif':
			$sourceImage = imagecreatefromgif($_POST['source_image']);
			break;
		default:
			die('Неподдерживаемый формат изображения');
	}




	$sourceX = $_POST['source_x'];
	$sourceY = $_POST['source_y'];
	$sourceWidth = $_POST['source_width'];
	$sourceHeight = $_POST['source_height'];

	$destWidth = ($_POST['resize']=='y') ? $_POST['dest_width'] : $sourceWidth;
	$destHeight = ($_POST['resize']=='y') ? $_POST['dest_height'] : $sourceHeight;
	$destImage = imagecreatetruecolor($destWidth, $destHeight);


	imagecopyresampled(
		$destImage,
		$sourceImage,
		0,
		0,
		$sourceX,
		$sourceY,
		$destWidth,
		$destHeight,
		$sourceWidth,
		$sourceHeight
	);


	# сохраняем превью
	$hostName = $modx->config['site_url'];
	$hostName = preg_replace('#^(.+://.+)/.*$#Uusi', '$1', $hostName);

	$sourcePath = end(explode($hostName, $_POST['source_image']));
	$sourcePathArr = explode('/', $sourcePath);
	$fileName = end($sourcePathArr);

	if($_POST['resize']=='y') {
		$newFileName = '.tn_'.$destWidth.'x'.$destHeight.'_'.array_pop($sourcePathArr);
	}
	else {
		$newFileName = '.tn_0x0_'.array_pop($sourcePathArr);
	}

	$sourcePathArr[] = $newFileName;
	$sourcePath = implode('/', $sourcePathArr);
	$sourcePathFull = $_SERVER['DOCUMENT_ROOT'].$sourcePath;

	# если есть такое превью - удаляем
	/*if(file_exists($sourcePathFull)) {
		@unlink($sourcePathFull);
		sleep(2);
	}*/

	switch($imageType) {
		case 'jpeg':
			if(imagejpeg($destImage, $_SERVER['DOCUMENT_ROOT'].$sourcePath, $jpegQuality)) {
				$output = array('success'=>true, 'path'=>$sourcePath);
				break;
			}

		case 'png':
			if(imagepng($destImage, $_SERVER['DOCUMENT_ROOT'].$sourcePath)) {
				$output = array('success'=>true, 'path'=>$sourcePath);
				break;
			}

		case 'gif':
			if(imagegif($destImage, $_SERVER['DOCUMENT_ROOT'].$sourcePath)) {
				$output = array('success'=>true, 'path'=>$sourcePath);
				break;
			}
	}
	/*imagedestroy($sourceImage);
	imagedestroy($destImage);*/

	die(json_encode($output));
}