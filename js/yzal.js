function updateUi(socket, data) {
	// remove all items
	$('.col-md-4').html('');

	// fill with 'new' ones
	for (var i = 0; i < data.length; i++) {
		var $c = $('.col-md-4:eq(' + (i % 3) + ')');
		$c.append('<h2>' + data[i].name + '</h2>');

		for (var j = 0; j < data[i].items.length; j++) {
			var item = data[i].items[j];

			$c.append('<div class="btn-container"><span class="switch btn ' + (item.state ? 'btn-success' : 'btn-default') + (typeof(item.timer) != "undefined" && item.timer.length > 0 ? ' has-timer' : '') + '" data-system="' + item.system + '" data-remote="' + item.remote + '"><span class="glyphicon glyphicon-time"></span><i class="glyphicon glyphicon-off"></i><strong>' + item.name + '</strong></span></div>');
		}
	}

	// set click handlers
	$('.col-md-4 .switch').longpress(function(e) {
		var $t = $('#timer-modal');
		$t.attr('data-system', $(this).attr('data-system'));
		$t.attr('data-remote', $(this).attr('data-remote'));
		$t.modal('show');
	}, function(e) {
		$(this).addClass('disabled');
		socket.emit('switch', { system: $(this).attr('data-system'), remote: $(this).attr('data-remote'), state: ($(this).hasClass('btn-success') ? 0 : 1) });
	});
}

$(document).ready(function() {
	var socket = io.connect('/');

	// the initial setup sets the texts, ui and fades it in ;)
	socket.on('initial', function(data) {
		$.each(data['ui-settings'].text, function(k, v) {
			$('.' + k).text(v);
		});
		
		if (!data['ui-settings']['enable-masterout']) {
			$('#masterout-container').hide();
		}

		updateUi(socket, data.groups);

		$('.container').addClass('in');
	});

	socket.on('update', function(data) {
		updateUi(socket, data);
	});

	$('#master-off').click(function() {
		$('#are-you-sure-modal').modal('show');
	});

	$('#are-you-sure-modal .btn-primary').click(function(e) {
		$('.col-md-4 .switch').addClass('disabled');
		socket.emit('master-off', {});
		$('#are-you-sure-modal').modal('hide');
	});

	$('#timer-modal .btn-primary').click(function(e) {
		var $m = $('#timer-modal');
		var system = $m.attr('data-system');
		var remote = $m.attr('data-remote');
		var mode = 0; //$('.timer-mode .active input').val();
		var type = $('.timer-type .active input').val();
		var $t1 = $('#timer-time');

		if ($t1.val() === '') {
			$t1.parent().parent().addClass('has-error');
		} else {
			$t1.parent().parent().removeClass('has-error');
			socket.emit('timer', { system: $m.attr('data-system'), remote: $m.attr('data-remote'), mode: mode, type: type, time: $t1.val() });
			$m.modal('hide');
			$t1.val('');
		}
	})
});
