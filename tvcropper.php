<?php
isset($modx) or die('not enougn mana...');


$e = $modx->Event;

switch($e->name) {

	case 'OnDocFormPrerender':
		$commaPattern = '#\s*,\s*#usi';
		if(trim($tvs)) {
			$tvs = preg_split($commaPattern, trim($tvs));
			$e->output('<script type="text/javascript">var tvcropperTVs = '.json_encode($tvs).'</script>');
		}
		if(trim($profiles)) {
			$profiles = preg_split($commaPattern, trim($profiles));
			$e->output('<script type="text/javascript">var tvcropperProfiles = '.json_encode($profiles).'</script>');
		}
		
		/*$profiles = simplexml_load_file($_SERVER['DOCUMENT_ROOT'].'/assets/plugins/tvcropper/profiles.xml')->xpath('//profile');
		foreach($profiles as $profile) {
			$profilesJSON[] = $profile['width'].' x '.$profile['height'];
		}

		
		$e->output('<script type="text/javascript">var tvcropperProfiles = '.json_encode($profilesJSON).'</script>');*/
		
		
		$e->output('<script type="text/javascript" src="/assets/plugins/tvcropper/js/jquery.Jcrop.min.js?'.mt_rand().'"></script>');
		break;

	case 'OnDocFormRender':
		$e->output('<script type="text/javascript" src="/assets/plugins/tvcropper/js/custom.js?'.mt_rand().'"></script>');
		break;

}