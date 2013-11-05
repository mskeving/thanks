$(window).scroll(function() {
	//load more posts when you're 100px from bottom
	if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
		last_post_on_page = $('.post').last();
		last_post_id = last_post_on_page.data('post-id');

		// pass in last post_id on page to get the next bundle
		data = {
			last_post_id: last_post_id
		}
		$.ajax({
			url: '/get_more_posts',
			type: 'POST',
			data: data,
			success: function(new_post_info){
				if (new_post_info['more_to_display']===false){
					$('#more-posts').remove()
				}
				$('.post-column').append(new_post_info['new_posts'])

			},
			error: function(){
				console.log('failed to load more posts');
			},
			dataType: 'json'
		})
   }
});

function show_modal(obj){
       obj.slideToggle(500);
}


function get_tag_list(obj, post_id){
	//gets tag list from db to populate autocomplete for tag modals
	//obj must have tag_input class

	var data = {
		post_id: post_id
	}

	$.ajax({
		type: "POST",
		url: "/create_tag_list",
		data: data,
		success: function(tag_info){

			tag_words = tag_info.tag_words;
			tag_dict = tag_info.tag_dict;
			tag_ids = tag_info.tag_ids;

			// this makes the tag input work for all tag autocompleters. uses tagsinput.js
			obj.tagsInput({
				width: 'auto',
				height: '30px',
				autocomplete_list: tag_words,
				autocomplete_dict: tag_dict,
				tag_ids: tag_ids,
			});
		},
		error: function(){
			console.log('error');
		},
		dataType: 'json'
	})
}

function collect_tags(form){
	//collects tags that you have chosen to submit with new post

	var all_tags = form.find("span.tag"); //gives you all tags in new post form 
	$.each(all_tags, function(){
		var hidden_tag_ids = form.find(".hidden_tag_ids");
		var hidden_tag_text = form.find(".hidden_tag_text");
		var tag_id = $(this).attr('id');	//tag_id === user or team_id of chosen tag
		hidden_tag_ids.val(hidden_tag_ids.val() + tag_id + "|");
		var tag_text = $(this).children("span").text();
		hidden_tag_text.val(hidden_tag_text.val() + tag_text + "|");
	});
	console.log($(".hidden_tag_ids").val());
};

function show_progress(clicked_element){
	clicked_element.css('cursor', 'progress');
	$('body').css('cursor', 'progress');

}

function end_show_progress(clicked_element){
	clicked_element.css('cursor', 'default');
	$('body').css('cursor', 'default');
}

function clear_post_modal_info(){
	$('#post_body').val("");
	$('.post-modal .tag_input').importTags('');
	$('.hidden_tag_ids').val("");
	$('.hidden_tag_text').val("");
	$('#chosen').text("");
	$('.submit-kudos').removeClass('error-post')
};

$('#nav-feedback').live('click', function(e){
	e.preventDefault();
	if ($('.feedback-modal').hasClass('displaying')){
		$('.feedback-modal').removeClass('displaying');
	}
	else{
		$('.feedback-modal').addClass('displaying');
	}
})

$('.submit-feedback-btn').live('click', function(e){
	e.preventDefault();
	console.log("in submit feedback");
	var feedback = $('.feedback-input').val();
	var data = {
		feedback: feedback
	};

	$.ajax({
		type: "POST",
		url: "/feedback",
		data: data,
		success: function(response){
			$('.feedback-input').val("");
			$('.feedback-modal').removeClass('displaying');
		},
		error: function(){
			console.log("could not submit feedback");
		}
	})
})

//escape key to exit out of feedback modal
document.onkeydown = function(evt) {
	evt = evt || window.event;
	if (evt.keyCode == 27) {
		if ($('.feedback-modal').hasClass('displaying')){
			$('.feedback-modal').removeClass('displaying');
			$('.feedback-input').val("");
		}
	}
};

//REMOVE/GIVE THANKS
$('.thank-button').live('click', function(e){
	e.preventDefault();
	var button = $(e.target);
	var post_id = $(this).data('post-id');
	thank_count_selector = $('[data-post-id=' + post_id + '] .thank-count');
	//REMOVE THANKS
	if (button.hasClass('pressed')){
		var data = {
			post_id: post_id
		}
	 	$.ajax({
	 		type: 'POST',
	 		url: '/removethanks', 
	 		data: data,
	 		success: function(response){
	 			console.log("success removing thanks");
	 			button.removeClass('pressed');
				change_count(thank_count_selector, -1);
	 		},
	 		error: function(){
	 			console.log("error removing thanks");
	 		}
	 	})
	}
	//SEND THANKS
	else{
		var data = {
          post_id: post_id
        };
        $.ajax({
        	type: 'POST',
        	url: '/sendthanks',
        	data: data,
        	success: function(response){
        		console.log("success giving thanks");
		    	button.addClass('pressed');
				change_count(thank_count_selector, 1);
        	},
        	error: function(){
        		console.log("error sending thanks");
        	}
        })
	}
});

//DISPLAY THANKER MODAL
$('.thank-count').live('click', function(e){
	e.preventDefault()
	thanker_modal = $(this).parent().children('.thanker-modal').clone();
	thanker_modal.dialog({
		title: "Thanks for your work!",
		close: function(){
			thanker_modal.remove();
		}
	});
})

//TAG MODAL
$('.addtag-button').live('click', function(e){
	e.preventDefault();
	var post_id = $(this).data('post-id'),
		tag_input = $('.tag_input[data-post-id=' + post_id + ']'),
		tag_modal = $('.tag-modal[data-post-id=' + post_id + ']');

	show_modal(tag_modal);

	if (!tag_modal.hasClass('pressed')){
		get_tag_list(tag_input, post_id);
		tag_modal.addClass('pressed');
	};

});

$('.no_new_tag_btn').live('click', function(e){
	e.preventDefault();
	show_modal($(this).parent());
})

//REMOVE TAG
$('.remove-tag').live('click', function(e) {
	e.preventDefault();
	var avatar = $(this).parent('.avatar-container'),
		tag_id = avatar.data('tag-id'),
		data = {
			tag_id: tag_id
		};


	$.ajax({
		type: "POST",
		url: '/deletetag',
		data: data,
		success: function(status){
			avatar.remove();
		},
		error: function(){
			console.log("error removing tag");
		}
	});
	
});


//SUBMIT NEW TAG
$('.new-tag-btn').live('click', function(e) {
	e.preventDefault();

	form = $(this).parent('.new-tag-form');
	collect_tags(form);
	tag_ids = form.find('.hidden_tag_ids').val();
	tag_text = form.find('.hidden_tag_text').val();
	post_photo_url = form.parent('.tag-modal').parent('.post').children('.white-card').children('.post-photo').attr('src');
	post_text = form.parent('.tag-modal').parent('.post').children('.white-card').children('blockquote').text()

	if (tag_ids != ""){
		var data = {
		post_id: $(this).data('post-id'),
		tag_ids: tag_ids,
		tag_text: tag_text,
		post_photo_url: post_photo_url,
		post_text: post_text
		};

		$.post('/newtag', data, function(tag_info){
			show_modal(form.parent());
			form.children('.tags').children('.tagsinput').children('span').remove(); //remove tag spans from input box
			form.children(".hidden_tag_ids").val(""); //and clear hidden values
			form.children(".hidden_tag_text").val("");
			console.log("tag_dict: " + tag_info);
			//turn tag_info json into usable array - avoidable if specify it's json datatype
			tag_array = jQuery.parseJSON(tag_info);

			//DISPLAY USER AVATARS
			for(var i = 0; i<tag_array.user_tags.length; i++){
				var username = $.trim(tag_array.user_tags[i].username);
				var user_id = tag_array.user_tags[i].user_id;
				var photo = tag_array.user_tags[i].photo;
				var new_avatar = $('<a class="avatar" href="/user/' + username + '"><div class="cropper"><img src=' + photo +' alt=' + username + '>');
				form.parent().parent().children(".taggees").children(".avatars").append(new_avatar);
			}

			//DISPLAY TEAM AVATARS
			for(var i = 0; i<tag_array.team_tags.length; i++){
				var teamname = tag_array.team_tags[i].teamname;
				var photo = tag_array.team_tags[i].photo;
				var new_avatar = $('<a class="avatar" href="/team/' + teamname + '""><div class="cropper"><img src=' + photo +' alt=' + teamname + '>');
				console.log("this" + this)
				form.parent().parent().children(".taggees").children(".avatars").append(new_avatar);
			}
		})
	}

	else{
		$(this).append("<span> No new tags </span>");
		e.preventDefault();
		console.log('no new tags');
	}

	
});



//SHOW COMMENT MODAL
$('.comment-button').live('click', function(e){
	e.preventDefault();
	var post_id = $(this).data('post-id')
	show_modal($('.comment-modal[data-post-id=' + post_id + ']'));
});


//REMOVE COMMENT
$('.remove-comment').live('click', function(e){
	e.preventDefault();
	var post_id = $(this).data('comment-id');
	var parent_post_id = $(this).closest('.comments').data('post-id');
	var comment = $(this).parent().parent();
	data = {
		post_id: post_id
	};

	$.ajax({
		type: "POST",
		data: data,
		url: '/deletepost',
		success: function(comment_id){
			comment.remove();

			comment_count_selector = $('[data-post-id=' + parent_post_id + '] .comment-count');
			change_count(comment_count_selector, -1);

		}, 
		error: function(){
			console.log("error");
		}
	})
})


//SUBMIT NEW COMMENT
$('.new-comment-btn').live('click', function(e){
	e.preventDefault();
	var new_comment_btn = $(this);
	var data = {
		post_id: $(this).parent().data('post-id'),
		body: $(this).siblings('.reply-body').val()
	}

	var all_comments = $('.comments[data-post-id=' + data.post_id + ']');

	$.ajax({
		type: "POST",
		url: '/newcomment',
		data: data, 
		success: function(comment_template){
			all_comments.append(comment_template);

			comment_count_selector = $('[data-post-id=' + data.post_id + '] .comment-count');
			change_count(comment_count_selector, 1);

			//clear and hide comment modal
			new_comment_btn.siblings('.reply-body').val("");
			show_modal($('.comment-modal[data-post-id=' + data.post_id + ']'));
		},
		error: function(e){
			console.log('error creating new reply');
		}
	});
})


function change_count(jquery_selector, add_value){
	//add or subtract counts on white card (ex thanks or comments)
	//jquery_selector is the <a> tag selector

	var text = jquery_selector.text();
	var count = parseInt(text.split(' ', 1)[0]);
	var subject = text.split(' ')[1]; //ie. thanks or comments

	var new_count = count + add_value;

	//remove plural s at end of subject if already there
	if (subject.slice(-1) === 's'){
		subject = subject.slice(0,-1);
	}

	if (new_count === 1){
		jquery_selector.text(new_count + ' ' + subject);
	}
	else{
		jquery_selector.text(new_count + ' ' + subject + 's');
	}
}


//Dropbox Chooser file selection
$(function () {
	var data = {};
	//.live is same as .on() for earlier jquery versions
	$('#chooser').live('DbxChooserSuccess', function (e) {
		console.log('chooser success');
		//e.preventDefault();
		data = {
			url: e.originalEvent.files[0].link,
			filename: e.originalEvent.files[0].name,
			thumbnail: e.originalEvent.files[0].thumbnails["200x200"]
		};

		$('#chosen').show();
		$('#filename').text(data['filename']);
		$('#submit').attr('disabled', false);			
		
	});
	$('#remove').live('click', function (e) {
		e.preventDefault();
		data = {}
		$('#chosen').hide();
		$('.dropbox-chooser').removeClass('dropbox-chooser-used');
		$('#submit').attr('disabled', true);
	});

	//Submit new post
	$('.submit-new-post').live('click', function(e){
		//Check if file selected from dropbox chooser
		if ($.isEmptyObject(data)===false){
			//can only send binary data using blob
			var xhr = new XMLHttpRequest();
			xhr.open("GET", data['thumbnail'], true);
			xhr.responseType = "blob";
			xhr.onload = function (oEvent)  {
				//handle errors in here
				var blob = xhr.response;
				s3_upload(
					{
					raw: blob,
			        filename: data['filename'],
			        type: xhr.getResponseHeader("Content-Type")},
			        function (public_url){
			        	create_post(public_url);
			        }
		        );
			};
			xhr.send();
		}
		else{
			create_post();
		}
	});	
});


//NEW POST MODAL
$('.new-post-modal-btn').live('click', function(e) {
	post_modal = $('.post-modal');
	tag_input = $('#new-post-tag-input');
	show_modal(post_modal);

	if (!post_modal.hasClass('pressed')){
		get_tag_list(tag_input);
	post_modal.addClass('pressed');
	};

});

$('.cancel-new-post').live('click', function(e) {
	show_modal($('.post-modal'));
	$('.post-column').css('margin', '0px');

	clear_post_modal_info()
});


function create_post(public_url){
	collect_tags($('.new-post-form'));
	post_body = $('#post_body').val();

	if (!post_body){
		$('.submit-kudos').addClass('error-post');
		return
	}
	data = {
		public_url: public_url,
		post_body: post_body,
		hidden_tag_ids: $('.hidden_tag_ids').val(),
		hidden_tag_text: $('.hidden_tag_text').val()
	}
	show_progress($('.submit-new-post'));
	$.ajax({
		type: "POST", 
		url: "/createpost",
		data: data, 
		success: function(new_post){
			$('.post-column').prepend(new_post);
			show_modal($('.post-modal'));
			$('.post-column').css('margin', '0px');
			clear_post_modal_info();
			post_modal.removeClass('pressed')
			console.log("success! created new post");
			end_show_progress($('.submit-new-post'));
		},
		error: function(resp){
			console.log("error! no new post created");
			end_show_progress($('.submit-new-post'));
		}
	});
}


//REMOVE POST
$('.remove-post-button').live('click', function(e){
	e.preventDefault();
	var post_id = $(this).parent().parent('.post').data('post-id');
	var parent_post = $(this).parent().parent('.post');
	data = {
		post_id : post_id
	}
	$.ajax({
		type: "POST",
		url: '/deletepost',
		data: data,
		success: function(resp){
			parent_post.remove();
			console.log("success deleting post");
		},
		error: function(resp){
			console.log("error deleting post");
		} 
	})

});

//Called if file chosen with dropbox chooser 
function s3_upload(data, callback){
	console.log('in s3_upload');
	var public_url = ""

	var settings = {
        s3_sign_put_url: '/sign_s3_upload/',
        s3_object_name: data['filename'],
    
        onProgress: function(percent, message) { 
            console.log("uploading file");
        },
        onFinishS3Put: function(public_url) { 
            //Create preview of photo: $("#avatar_url").val(public_url);
            //$("#preview").html('<img src="'+public_url+'" style="width:300px;" />');
            console.log("finished uploading file");
            callback(public_url);
        },
        onError: function(status) {
        	console.log("error uploading file: " + status);
        }
    };

    if (!data.raw) {
    	console.log("sending file dom data");		    	
    	// TODO: this "file" selector should be configurable from 'data'
    	settings.file_dom_selector = "file";
    }
    else {
    	console.log("sending raw data: " + data.raw.length);
    	settings.raw_data = {data: data.raw, type: data.type};
    }

    var s3upload = new S3Upload(settings);
};



