(function($) {
	$(function() {
		var pluginUrl = '/assets/plugins/tvcropper';
		
		// генерирует рандом для сброса кеша статичных файлов
		var getCacheRandom = function() {
			var min = 0, max = 10000;
			return Math.random()*(max-min)+min;
		};

		// добавляет css файл в head
		var regCss = function(path) {

			var tag = '<link href="'+path+'?'+getCacheRandom()+'" type="text/css" rel="stylesheet" />';
			$('head').append(tag);
		};

		var renameCroppedPreview = function() {
			$('.cropTpl[rel="0x0"]').find('.imageInfo em').text('Кадрированное');
		};

		// создаёт объект селекта с профилями
		var createProfileSelect = function() {
			var output = '<select class="profiles" name="profiles">';
			if(tvcropperProfiles) {
				for(var i=0; i<tvcropperProfiles.length; i++) {
					var arProfile = tvcropperProfiles[i].split('|');
					var profileDimensions = arProfile[0].split(/\s*x\s*/);
					var dimensionName;
					
					if(arProfile.length == 2) {
						dimensionName = arProfile[1] + ' ('+profileDimensions[0]+' x '+profileDimensions[1]+')';
					}
					else {
						dimensionName = profileDimensions[0]+' x '+profileDimensions[1];
					}
					output += '<option value="'+profileDimensions[0]+' x '+profileDimensions[1]+'">'+dimensionName+'</option>';
				}
			}
			output += '<option value="dontresize">только кадрировать</option>';
			output += '</select>';
			return $(output);
		};

		// показывает уже добавленные превью и кнопку "добавить"
		var showImages = function(tv, baseImage) {
			$.post(
				pluginUrl+'/ajax.php',
				{
					type: 'tnsearch',
					path: baseImage.src
				},
				function(answer, status, xhr) {
					tv.container.empty();
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

					var template = $('<button class="addTnButton">Ред. превью</button>');
					tv.container.append(template);

					renameCroppedPreview();

					//tv.wrapper.find('.addTnButton').click(function() {
					template.click(function() {
						openWorkLayout(tv, this, baseImage);
						return false;
					});
				},
				'json'
			);
		};

		// выводит рабочую область для кропа
		var openWorkLayout = function(tv, button, baseImage) {
			var jcropAPI, boundx, boundy, tnWidth, tnHeight, previewWidth = 190, coords = {};

			// создаём элементы с событиями
			var img = $('<img class="cropImage" src="/'+tv.field.val()+'" alt="" />');	// основное изображение
			var preview = $('<img src="/'+tv.field.val()+'" alt="" />');				// превью
			var acceptButton = $('<input title="Применить" class="cropParamsAccept" type="image" src="'+pluginUrl+'/images/ok.png" />');		// принять ширину и высоту
			
			var cropButton = $('<input title="Вырезать" class="cropIt" type="image" src="'+pluginUrl+'/images/crop.png" />');	// кропить
			
			var imageInfo = $('<div class="imageInfo">Исходное изображение: '+baseImage.width+' x '+baseImage.height+'</div>');
			var profileSelect = createProfileSelect();									// селект с профилями
			var closeWorkArea = $('<span class="closeWA" title="Закрыть">×</span>');
			

			// рабочий шаблон
			var cropTpl = '<div class="cropTpl"><div class="cropTplInner"><div class="cropRight">'+
				'<div class="cropControls">'+
				'</div>'+
				'<div class="cropPreview"></div>'+
				'</div></div></div>';
			cropTpl = $(cropTpl);
			cropTpl.find('>div').prepend(img);
			cropTpl.find('>div').prepend(imageInfo);
			cropTpl.find('>div').prepend(closeWorkArea);
			cropTpl.find('[name="cropHeight"]').after(acceptButton);
			acceptButton.after(' &nbsp; ').before(' &nbsp; ');
			cropTpl.find('.cropControls').append(cropButton);
			cropTpl.find('.cropControls').prepend(profileSelect);
			cropTpl.find('.cropPreview').width(previewWidth);
			cropTpl.find('.cropPreview').html(preview);
			profileSelect.before('<label>Размеры:</label>').after(' &nbsp; ');

			// развешиваем события
			
			// обновляем превью
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
			
			// включаем рабочую область кропа
			img.Jcrop({
				onChange: updatePreview,
				onSelect: updatePreview,
				boxWidth: 500,
				boxHeight: 500
			},function() {
				var bounds = this.getBounds();
				boundx = bounds[0];
				boundy = bounds[1];
				jcropAPI = this;
				jcropAPI.disable();
				
				// выбираем профиль из списка
				profileSelect.change(function() {
					if(profileSelect.val()=='dontresize') {
						// меняем ratio
						jcropAPI.setOptions({
							aspectRatio: false
						});
					}
					else {
						var dimensions = profileSelect.val().split(' x ');
						
						// проверяем размеры на ошибки
						if(dimensions[0].search(/^[1-9]\d*?/) || dimensions[1].search(/^[1-9]\d*?/)) {
							return false;
						}
	
						// все данные корректны
						tnWidth = dimensions[0];
						tnHeight = dimensions[1];
	
						var aspectRatio = tnWidth/tnHeight;
	
						// меняем ratio
						jcropAPI.setOptions({
							aspectRatio: aspectRatio
						});
	
						// обновляем высоту превью
						cropTpl.find('.cropPreview').height( previewWidth/aspectRatio );
					}
					jcropAPI.enable();
					$(button).hide();
					return false;
				});
	
				// вырезаем
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
						pluginUrl+'/ajax.php',
						{
							type: 'crop',
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
									/*if( tv.wrapper.find('.cropTpl[rel="'+tnWidth+'x'+tnHeight+'"]').length ) {
										tv.wrapper.find('.cropTpl[rel="'+tnWidth+'x'+tnHeight+'"]')*/
									var localWrapper = cropTpl.parent('.tvCropContainer');
									if( localWrapper.find('.cropTpl[rel="'+tnWidth+'x'+tnHeight+'"]').length ) {
										localWrapper.find('.cropTpl[rel="'+tnWidth+'x'+tnHeight+'"]')
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
	
								};
								newPreview.src = answer.path;
							}
							else if(answer.fail) {
								alert(answer.message);
							}
						}
						,
						'json'
					);
					return false;
				});
			});			
			
			// закрываем рабочую область
			closeWorkArea.click(function() {
				cropTpl.fadeOut('fast', function() {
					$(this).remove();
					$(button).show();
				});
			});

			// выводим шаблон
			$(button).before(cropTpl);

			setTimeout(function() {
				$(profileSelect).change();
			}, 500);
		};

		regCss(pluginUrl+'/css/style.css');
		regCss(pluginUrl+'/css/jquery.Jcrop.css');

		// ищем все поля изображений
		var searchSelector;
		
		// если указаны конкретные tv
		if(typeof tvcropperTVs != 'undefined') {
			searchSelector = [];
			for(var i=0; i<tvcropperTVs.length; i++) {
				searchSelector.push('input.imageField#tv'+tvcropperTVs[i]);
				searchSelector.push('input.image[id^="tv'+tvcropperTVs[i]+'image"]');
			}
			searchSelector = searchSelector.join(', ');
		}
		else {
			searchSelector = 'input.imageField';
		}
		
		$(searchSelector).each(function() {
			var tv = {};                                                                    // инстанс tv-параметра
			tv.field = $(this);                                                             // jquery-объект инпута tv-параметра
			tv.wrapper = tv.field.parents('td');                                            // jquery-объект ячейки tv-параметра
			tv.container = $('<div class="tvCropContainer"></div>').appendTo( tv.wrapper ); // делаем контейнер для наших нужд

			var container = $('<div></div>').appendTo( $(this).parents('td') );
			
			$(this).change(function() {
			
				// смотрим, есть ли такая картинка
				var baseImage = new Image;
				
				baseImage.onload = function() {
					showImages(tv, baseImage);
				};
				baseImage.onerror = function() {
					tv.container.empty();
				};

				baseImage.src = ('/'+$(this).val()).replace('//', '/');
			});
			
			$(this).change();
		});

		// удаляем превью
		$(document).on('click', '.imageInfo span', function() {
			if(confirm('Удалить это превью?')) {
				var thisContainer = $(this).parents('.cropTpl');
				$.post(
					pluginUrl+'/ajax.php',
					{
						type: 'remove',
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

		// показываем/убираем превью
		$(document).on('mouseover', '.jcrop-holder', function() {
			if($(window).width() > 940) {
				$(this).parents('.cropTpl').find('.cropPreview').stop().fadeTo('fast', 1);
			}
		}).on('mouseout', '.jcrop-holder', function() {
			$(this).parents('.cropTpl').find('.cropPreview').stop().fadeTo('normal', 0);
		});
	});
})(jQuery);
