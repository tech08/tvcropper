<?php
# возвращает адрес сервера
if(!function_exists('getSiteUrl')) {
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
}

# возвращает абсолютный путь до изображения
if(!function_exists('getImagePath')) {
	function getImagePath($url) {
		$siteUrl = getSiteUrl();
	
		# если url задан вместе с сервером
		if(strpos($url, $siteUrl)===0) {
		$url = end(explode($siteUrl, $url));
		}
	
		# удаляем слеш, если он есть
		$url = trim($url, '/');
		$url = str_replace('/', DIRECTORY_SEPARATOR, $url);
		$url = reset(explode('?', $url));
	
		return $_SERVER['DOCUMENT_ROOT'].DIRECTORY_SEPARATOR.$url;
	}
}


$options = preg_split('#\s*x\s*#usi', $options);
$width = $options[0];
$height = $options[1];


$sourcePath = getImagePath($output);
$sourceInfo = pathinfo($sourcePath);

$tnName = ".tn_{$width}x{$height}_".$sourceInfo['basename'];

# проверяем наличие превью 
if(!file_exists($sourceInfo['dirname'].DIRECTORY_SEPARATOR.$tnName)) {
	$out = false;
	#$out = $sourceInfo['dirname'].DIRECTORY_SEPARATOR.$tnName;
}
else {
	$out = dirname($output).'/'.$tnName;
}

return $out;






/*$out = array(
	'output' => $output,
	'options' => $options,
	'input' => $input,
	'condition' => $condition
);

$out = '<pre>'.print_r($out,1).'</pre>';

return $out;*/