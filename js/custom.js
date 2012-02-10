(function($) {
	$(function() {

		// временный объект селекта профилей
		var profileSelectCache;

		// генерирует рандом для сброса кеша статичных файлов
		var getCacheRandom = function() {
			var min = 0, max = 10000;
			return Math.random()*(max-min)+min;
		}

		// добавляет css файл в head
		var regCss = function(path) {

			var tag = '<link href="'+path+'?'+getCacheRandom()+'" type="text/css" rel="stylesheet" />';
			$('head').append(tag);
		}

		var renameCroppedPreview = function() {
			$('.cropTpl[rel="0x0"]').find('.imageInfo em').text('Кадрированное');
		}

		// создаёт объект селекта с профилями
		var createProfileSelect = function() {
			if(profileSelectCache) {
				output = profileSelectCache.clone();
			}
			else {
				var output = '<select class="profiles" name="profiles">';
				for(var i=0; i<tvcropperProfiles.length; i++) {
					output += '<option value="'+tvcropperProfiles[i]+'">'+tvcropperProfiles[i]+'</option>';
				}
				output += '<option value="dontresize">без ресайза</option>';
				output += '<option value="custom">новый...</option>';
				output += '</select>';
				
				output = $(output);
				profileSelectCache = output.clone();
			}
			
			return output;
		}

		// показывает уже добавленные превью и кнопку "добавить"
		var showImages = function(tv, baseImage) {

			$.post(
				'/assets/plugins/tvcropper/tnsearch.ajax.php',
				{
					path: baseImage.src
				},
				function(answer, status, xhr) {
					// выводим все превьюшки
					if(answer) {
						for(var i=0; i<answer.length; i++) {
							var tnTpl = '<div class="cropTpl" rel="'+answer[i].width+'x'+answer[i].height+'">'+
								'<div class="imageInfo"><em>Превью: '+answer[i].width+' x '+answer[i].height+'</em> <span title="Удалить">(×)</span></div>'+
								'<img class="croppedPreview" src="'+answer[i].file+'?'+getCacheRandom()+'" alt="" />'+
								'</div>';
							tv.container.append(tnTpl);
						}
					}

					var template = '<button class="addTnButton">Ред. превью</button>';
					tv.container.append( $(template) );

					renameCroppedPreview();

					tv.wrapper.find('.addTnButton').click(function() {
						openWorkLayout(tv, this, baseImage);
						return false;
					});
				},
				'json'
			);
		}

		// выводит рабочую область для кропа
		var openWorkLayout = function(tv, button, baseImage) {
			var jcropAPI, boundx, boundy, tnWidth, tnHeight, previewWidth = 190, coords = {};

			// создаём элементы с событиями
			var img = $('<img class="cropImage" src="/'+tv.field.val()+'" alt="" />');  // основное изображение
			var preview = $('<img src="/'+tv.field.val()+'" alt="" />');                // превью
			var acceptButton = $('<button class="cropParamsAccept">OK</button>');       // принять ширину и высоту
			var cropButton = $('<button class="cropIt">Вырезать</button>');                // кропить
			var imageInfo = $('<div class="imageInfo">Исходное изображение: '+baseImage.width+' x '+baseImage.height+'</div>');
			var profileSelect = createProfileSelect();                                  // селект с профилями
			var saveProfileButton = $('<button class="saveProfile">Сохр. профиль</button>');
			var removeProfileButton = $('<button class="removeProfile">Удалить профиль</button>');


			// рабочий шаблон
			var cropTpl = '<div class="cropTpl"><div><div class="cropRight">'+
				'<div class="cropControls">'+
				'<label>Размеры:</label><input type="text" name="cropWidth" /> × <input type="text" name="cropHeight" />'+
				'</div>'+
				'<div class="cropPreview"></div>'+
				'</div></div></div>';
			cropTpl = $(cropTpl);
			cropTpl.find('>div').prepend(img);
			cropTpl.find('>div').prepend(imageInfo);
			cropTpl.find('[name="cropHeight"]').after(acceptButton);
			acceptButton.after('<br />').before(' &nbsp; ');
			cropTpl.find('.cropControls').append(cropButton);
			cropTpl.find('.cropControls').prepend(profileSelect);
			cropTpl.find('.cropPreview').width(previewWidth);
			cropTpl.find('.cropPreview').html(preview);
			cropButton.before(saveProfileButton);
			saveProfileButton.after(removeProfileButton);
			profileSelect.before('<label>Профиль:</label>').after(' &nbsp; ');

			// развешиваем события
			var updatePreview = function(c) {
				// обновляем объект с координатами
				coords = {
					x1: c.x,
					y1: c.y,
					x2: c.x2,
					y2: c.y2,
					w: c.w,
					h: c.h
				};

				// обновляем размеры tn, если стоит вариант без ресайза
				if(profileSelect.val()=='dontresize') {
					tnWidth = c.w;
					tnHeight = c.h;
				}


				// обновляем превью
				if (parseInt(c.w) > 0) {
					var rx = tnWidth / c.w * previewWidth / tnWidth;
					var ry = tnHeight / c.h * previewWidth / tnWidth;

					$(preview).css({
						width: Math.round(rx * boundx) + 'px',
						height: Math.round(ry * boundy) + 'px',
						marginLeft: '-' + Math.round(rx * c.x) + 'px',
						marginTop: '-' + Math.round(ry * c.y) + 'px'
					});
				}

				// обновляем высоту обёртки превью, если стоит вариант без ресайза
				if(profileSelect.val()=='dontresize') {
					var ratio = c.w/c.h;
					$('.cropPreview').height( Math.round($('.cropPreview').width()/ratio) );
				}



			};
			img.Jcrop({
				onChange: updatePreview,
				onSelect: updatePreview
			},function() {
				var bounds = this.getBounds();
				boundx = bounds[0];
				boundy = bounds[1];
				jcropAPI = this;
				jcropAPI.disable();
			});

			acceptButton.click(function() {
				var widthInput = $(cropTpl).find('[name="cropWidth"]');
				var heightInput = $(cropTpl).find('[name="cropHeight"]');

				if(profileSelect.val()=='dontresize') {
					// меняем ratio
					jcropAPI.setOptions({
						aspectRatio: false
					});

					// выключаем сохранение профиля
					saveProfileButton.attr('disabled', true);
				}
				else {
					// проверяем введённые значения на ошибки
					var error = false;
					if(widthInput.val().search(/^[1-9]\d*?/)) {
						error = true;
						widthInput.addClass('withError');
					}
					else {
						widthInput.removeClass('withError');
					}
					if(heightInput.val().search(/^[1-9]\d*?/)) {
						error = true;
						heightInput.addClass('withError');
					}
					else {
						heightInput.removeClass('withError');
					}
					if(error) {
						saveProfileButton.attr('disabled', true);
						return false;
					}

					// все данные корректны
					tnWidth = widthInput.val();
					tnHeight = heightInput.val()
					var aspectRatio = tnWidth/tnHeight;

					// меняем ratio
					jcropAPI.setOptions({
						aspectRatio: aspectRatio
					});

					// обновляем высоту превью
					cropTpl.find('.cropPreview').height( previewWidth/aspectRatio );

					// включаем сохр. профиля
					if(profileSelect.val()=='custom' && !profileSelect.find('option[value="'+tnWidth+' x '+tnHeight+'"]').length) {
						saveProfileButton.removeAttr('disabled');
					}
					else {
						saveProfileButton.attr('disabled', true);
					}
					jcropAPI.enable();
				}
				$(button).hide();
				return false;
			});

			profileSelect.change(function() {
				if($(this).val()=='custom') {
					// активируем инпуты
					$(cropTpl).find('[name="cropWidth"], [name="cropHeight"]').removeAttr('disabled');
					$(acceptButton).removeAttr('disabled').click();
				}
				else if($(this).val()=='dontresize') {
					// подставляем значения в инпуты и делаем неактивными
					$(cropTpl).find('[name="cropWidth"]').val('').attr('disabled', true);
					$(cropTpl).find('[name="cropHeight"]').val('').attr('disabled', true);
					$(acceptButton).click().attr('disabled', true);
				}
				else {
					var profileDimensions = $(this).val().split(' x ');
					var width = profileDimensions[0];
					var height = profileDimensions[1];

					// подставляем значения в инпуты и делаем неактивными
					$(cropTpl).find('[name="cropWidth"]').val(width).attr('disabled', true);
					$(cropTpl).find('[name="cropHeight"]').val(height).attr('disabled', true);
					$(acceptButton).click().attr('disabled', true);
				}
			});


			cropButton.click(function() {
				var resize = (profileSelect.val()=='dontresize') ? 'n' : 'y';
				if(resize=='n') {
					tnWidth = 0;
					tnHeight = 0;
				}

				var c = {};
				for(prop in coords) {
					c[prop] = coords[prop];
				}

				// вычисляем, во сколько раз рабочее изображение меньше
				var sizeRatio = baseImage.width / img.width();

				// корректируем координаты
				for(dim in c) {
					c[dim] = Math.round(c[dim]*sizeRatio);
				}

				// отправляем запрос на ресайз
				$.post(
					'/assets/plugins/tvcropper/crop.ajax.php',
					{
						source_image: baseImage.src,
						source_x: c.x1,
						source_y: c.y1,
						source_width: c.w,
						source_height: c.h,
						dest_width: tnWidth,
						dest_height: tnHeight,
						resize: resize
					},
					function(answer, status, xhr) {
						if(answer.success) {
							var newPreview = new Image;
							newPreview.onload = function() {
								// если уже есть такое превью, то просто обновляем там картинку
								if( $('.cropTpl[rel="'+tnWidth+'x'+tnHeight+'"]').length ) {
									$('.cropTpl[rel="'+tnWidth+'x'+tnHeight+'"]')
										.empty()
										.append('<div class="imageInfo"><em>Превью: '+tnWidth+' x '+tnHeight+'</em> <span title="Удалить">(×)</span></div>')
										.append('<img class="croppedPreview" src="'+answer.path+'?'+getCacheRandom()+'" alt="" />');

									cropTpl.remove();
								}
								else {
									cropTpl
										.empty()
										.attr('rel', tnWidth+'x'+tnHeight)
										.append('<div class="imageInfo"><em>Превью: '+tnWidth+' x '+tnHeight+'</em> <span title="Удалить">(×)</span></div>')
										.append('<img class="croppedPreview" src="'+answer.path+'?'+getCacheRandom()+'" alt="" />');
								}
								renameCroppedPreview();
								$(button).show();

							}
							newPreview.src = answer.path;
						}
					}
					,
					'json'
				);
				return false;
			});

			saveProfileButton.click(function () {
				$.post(
					'/assets/plugins/tvcropper/saveprofile.ajax.php',
					{
						action: 'add',
						width: tnWidth,
						height: tnHeight
					},
					function(answer, status, xhr) {
						if(answer.success) {
							alert(answer.message);
							profileSelect.prepend('<option name="'+tnWidth+' x '+tnHeight+'">'+tnWidth+' x '+tnHeight+'</option>');
							profileSelectCache = profileSelect.clone();
						}
						else if(answer.fail) {
							alert(answer.message);
						}
					},
					'json'
				);
				return false;
			});

			// выводим шаблон
			$(button).before(cropTpl);

			setTimeout(function() {
				$(profileSelect).change();
			}, 500);
		}



		regCss('/assets/plugins/tvcropper/css/style.css');
		regCss('/assets/plugins/tvcropper/css/jquery.Jcrop.css');

		// ищем все поля изображений
		$('input.imageField').each(function() {

			var tv = {};                                                                    // инстанс tv-параметра
			tv.field = $(this);                                                             // jquery-объект инпута tv-параметра
			tv.wrapper = tv.field.parents('td');                                            // jquery-объект ячейки tv-параметра
			tv.container = $('<div class="tvCropContainer"></div>').appendTo( tv.wrapper ); // делаем контейнер для наших нужд


			var container = $('<div></div>').appendTo( $(this).parents('td') );

			$(this).change(function() {
				// смотрим, есть ли такая картинка
				var baseImage = new Image;
				baseImage.onload = function() {
					tv.wrapper.find('.cropTpl, .addTnButton').remove();
					//tv.wrapper.find('.addTnButton').show();
					showImages(tv, baseImage);
				}
				baseImage.onerror = function() {
					tv.wrapper.find('.cropTpl, .addTnButton').remove();
					//tv.wrapper.find('.addTnButton').show();
				}

				baseImage.src = '/'+$(this).val();
			});

			// скрываем превью от managermanager
			//tv.wrapper.find('.tvimage').hide();
		});

		// удаляем превью
		$('.imageInfo span').live('click', function() {
			if(confirm('Удалить это превью?')) {
				var thisContainer = $(this).parents('.cropTpl');
				$.post(
					'/assets/plugins/tvcropper/remove.ajax.php',
					{
						path: thisContainer.find('.croppedPreview').attr('src')
					},
					function(answer, status, xhr) {
						if(answer.success) {
							thisContainer.slideUp('normal', function() {
								$(this).remove();
							});
						}
						else if(answer.fail) {
							alert(answer.message);
						}
					},
					'json'
				);
			}
		});

		$('.jcrop-holder').live('mouseover', function() {
			$('.cropPreview').stop().fadeTo('fast', 1);
		}).live('mouseout', function() {
			$('.cropPreview').stop().fadeOut('normal', 0);
		});
	});
})(jQuery);
