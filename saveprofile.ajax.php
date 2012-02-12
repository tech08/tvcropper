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
	
	if(!is_numeric($_POST['width']) || !is_numeric($_POST['height'])) die();
	if($_POST['action']=='add') {
		$xml = simplexml_load_file('profiles.xml');
		$root = $xml->xpath('/root');
		$root = $root[0];
		
		$newProfile = $root->addChild('profile');
		$newProfile->addAttribute('width', $_POST['width']);
		$newProfile->addAttribute('height', $_POST['height']);
		
		if($xml->asXML('profiles.xml')) {
			$output = array(
				'success' => true,
				'message' => 'Профиль сохранён'
			);
		}
		else {
			$output = array(
				'fail' => true,
				'message' => 'Не удалось сохранить профиль'
			);
		}
		die(json_encode($output));
	}
	elseif($_POST['action']=='remove') {
		$xml = new DOMDocument;
		$xml->load('profiles.xml');
		
		$xpath = new DOMXPath($xml);
		$profiles = $xpath->query('//profile[@width="'.$_POST['width'].'"][@height="'.$_POST['height'].'"]');
		
		foreach($profiles as $profile) {
			$profile->parentNode->removeChild($profile);
		}
		
		if($xml->save('profiles.xml')) {
			$output = array(
				'success' => true,
				'message' => 'Профиль удалён'
			);
		}
		else {
			$output = array(
				'fail' => true,
				'message' => 'Не удалось удалить профиль'
			);
		}
		die(json_encode($output));
	}
}