(function($) {
	var processTemplate = _.memoize(function(id) {
		var element = document.getElementById(id);
		if (!element) {
			return false;
		}

		// Use WordPress style Backbone template syntax
		var options = {
			evaluate:    /<#([\s\S]+?)#>/g,
			interpolate: /\{\{\{([\s\S]+?)\}\}\}/g,
			escape:      /\{\{([^\}]+?)\}\}(?!\})/g
		};

		return _.template(element.innerHTML, null, options);
	});

	var externalConnectionUrlField = document.getElementsByClassName('external-connection-url-field')[0];
	var externalConnectionMetaBox = document.getElementById('dt_external_connection_details');
	var externalConnectionTypeField = document.getElementsByClassName('external-connection-type-field')[0];
	var authFields = document.getElementsByClassName('auth-field');
	var titleField = document.getElementById('title');
	var endpointResult = document.querySelector('.endpoint-result');
	var postIdField = document.getElementById('post_ID');
	var $apiVerify = false;

	function checkConnections(event) {
		if ($apiVerify !== false) {
			$apiVerify.abort();
		}

		if ('' == externalConnectionUrlField.value) {
			endpointResult.innerText = '';
			return;
		}

		endpointResult.setAttribute('data-endpoint-state', 'loading');
		endpointResult.innerHTML = dt.endpoint_checking_message;

		var auth = {};

		_.each(authFields, function(authField) {
			if (authField.disabled) {
				return;
			}

			var key = authField.getAttribute('data-auth-field');

			if (key) {
				auth[key] = authField.value;
			}
		});

		var postId = 0;
		if (postIdField && postIdField.value) {
			postId = postIdField.value;
		}

		$apiVerify = $.ajax({
			url: ajaxurl,
			method: 'post',
			data: {
				nonce: dt.nonce,
				action: 'dt_verify_external_connection',
				auth: auth,
				url: externalConnectionUrlField.value,
				type: externalConnectionTypeField.value,
				endpoint_id: postId
			}
		}).done(function(response) {
			console.log(response);

			if (!response.success) {
				/*if (!event || event.currentTarget.classList.contains('external-connection-url-field')) {
					endpointResult.innerHTML = '<span class="dashicons dashicons-warning"></span>';
					endpointResult.innerHTML += dt.invalid_endpoint;
				}*/

				endpointResult.setAttribute('data-endpoint-state', 'error');
			} else {
				if (response.data.errors.no_external_connection) {
					endpointResult.setAttribute('data-endpoint-state', 'error');

					if (response.data.endpoint_suggestion) {
						endpointResult.innerHTML = ' ' + dt.endpoint_suggestion + ' <a class="suggest">' + response.data.endpoint_suggestion + '</a>';
					} else {
						endpointResult.innerHTML = dt.bad_connection;
					}
				} else if (response.data.errors.no_distributor) {
					endpointResult.setAttribute('data-endpoint-state', 'warning');
					endpointResult.innerHTML = dt.limited_connection;
				} else if (response.data.errors.no_types) {
					endpointResult.setAttribute('data-endpoint-state', 'valid');
					endpointResult.innerHTML = dt.successful_connection;
				}
			}
		}).complete(function() {
			endpointResult.classList.remove('loading');
		});
	}

	setTimeout(function() {
		checkConnections();
	}, 300);

	$(externalConnectionMetaBox).on('click', '.suggest', function(event) {
		externalConnectionUrlField.value = event.currentTarget.innerText;
		$(externalConnectionUrlField).trigger('input');
	});

	$(externalConnectionMetaBox).on('keyup input', '.auth-field, .external-connection-url-field', _.debounce(checkConnections, 250));

	$(externalConnectionUrlField).on('blur', function(event) {
		if ('' === titleField.value && '' !== event.currentTarget.value) {
			titleField.value = event.currentTarget.value.replace(/https?:\/\//i, '');
			titleField.focus();
			titleField.blur();
		}
	});
	/**
	 * JS for basic auth
	 *
	 * @todo  separate
	 */
	var passwordField = document.getElementById('dt_password');
	var usernameField = document.getElementById('dt_username');
	var changePassword = document.querySelector('.change-password');

	$(usernameField).on('keyup change', _.debounce(function() {
		if (changePassword) {
			passwordField.disabled = false;
			passwordField.value = '';
			changePassword.style.display = 'none';
		}
	}, 250));

	$(changePassword).on('click', function(event) {
		event.preventDefault();

		if (passwordField.disabled) {
			passwordField.disabled = false;
			passwordField.value = '';
			event.currentTarget.innerText = dt.cancel;
		} else {
			passwordField.disabled = true;
			passwordField.value = 'sdfdsfsdfdsfdsfsd'; // filler password
			event.currentTarget.innerText = dt.change;
		}

		checkConnections();
	});
})(jQuery);
