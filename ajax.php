<?php
# прикручиваем modx API
define('MODX_MANAGER_PATH', $_SERVER['DOCUMENT_ROOT'].'/manager/');
require_once MODX_MANAGER_PATH.'includes/protect.inc.php';
require_once MODX_MANAGER_PATH.'includes/config.inc.php';
require_once MODX_MANAGER_PATH.'includes/document.parser.class.inc.php';
$modx = new DocumentParser;
$modx->loadExtension("ManagerAPI");
$modx->getSettings();
session_name($site_sessionname);
session_start();

if(!isset($_SESSION['mgrValidated']) || !isset($_POST['type'])) die('not enougn mana...');


# возвращает абсолютный путь до изображения
if(!function_exists('getImagePath')) {
	function getImagePath($url) {
		# если url задан вместе с сервером
		if(strpos($url, '://')!==false) {
			$url = preg_replace('#https?://[^/]+/#Uusi', '', $url);
		}
			
		# удаляем слеш, если он есть
		$url = trim($url, '/');
		$url = str_replace('/', DIRECTORY_SEPARATOR, $url);
		$url = reset(explode('?', $url));
		
		return $_SERVER['DOCUMENT_ROOT'].DIRECTORY_SEPARATOR.$url;
	}
}




switch($_POST['type']) {
	
	# ищем превью при загрузке страницы
	case 'tnsearch':
		$fileInfo = pathinfo(getImagePath($_POST['path']));
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
		break;
	
	# делаем превью
	case 'crop':
		$jpegQuality = 90;
			
		$sourceFile = getImagePath($_POST['source_image']);
		$sourceInfo = pathinfo($sourceFile);
		
		# вычисляем тип изображения
		$sourceInfo['extension'] = strtolower($sourceInfo['extension']);
		$imageType = ($sourceInfo['extension']=='jpg') ? 'jpeg' : $sourceInfo['extension'];
		
		switch($imageType) {
			case 'jpeg': $sourceImage = imagecreatefromjpeg($sourceFile); break;
			case 'png': $sourceImage = imagecreatefrompng($sourceFile); break;
			case 'gif': $sourceImage = imagecreatefromgif($sourceFile); break;
			default:
				$output = array('fail' => true, 'message' => 'Неподдерживаемый формат изображения');
				die(json_encode($output));
		}
		
		$destWidth = ($_POST['resize']=='y') ? $_POST['dest_width'] : $_POST['source_width'];
		$destHeight = ($_POST['resize']=='y') ? $_POST['dest_height'] : $_POST['source_height'];
		$destImage = imagecreatetruecolor($destWidth, $destHeight);
		
		# обрезаем
		imagecopyresampled(
			$destImage,
			$sourceImage,
			0,
			0,
			$_POST['source_x'],
			$_POST['source_y'],
			$destWidth,
			$destHeight,
			$_POST['source_width'],
			$_POST['source_height']
		);
		
		# сохраняем превью
		if($_POST['resize']=='y') {
			$newFileName = '.tn_'.$destWidth.'x'.$destHeight.'_'.$sourceInfo['basename'];
		}
		else {
			$newFileName = '.tn_0x0_'.$sourceInfo['basename'];
		}
		
		$tnPath = $sourceInfo['dirname'].DIRECTORY_SEPARATOR.$newFileName;
		$tnUrl = dirname($_POST['source_image']).'/'.$newFileName;
		
		switch($imageType) {
			case 'jpeg':
				if(imagejpeg($destImage, $tnPath, $jpegQuality)) {
					$output = array('success'=>true, 'path'=>$tnUrl);
				}
				break;
					
			case 'png':
				if(imagepng($destImage, $tnPath)) {
					$output = array('success'=>true, 'path'=>$tnUrl);
				}
				break;
					
			case 'gif':
				if(imagegif($destImage, $tnPath)) {
					$output = array('success'=>true, 'path'=>$tnUrl);
				}
				break;
		}
		break;
		
	# удаляем превью
	case 'remove':
			$imagePath = getImagePath($_POST['path']);
			
			if(!file_exists($imagePath)) {
				$output = array(
						'fail' => true,
						'message' => 'Изображение не найдено - '.$imagePath
				);
			}
			elseif(!@unlink($imagePath)) {
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
			
		break;
		
	default: die;
}

die(json_encode($output));