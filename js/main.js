// remove parameters from URLs
function cleanURL(url) {
	if (url.indexOf("?") > -1) {
		url = url.slice(0, url.indexOf("?"));
	}
	
	return url;
}

// delete element if it exists
function tryDelete(selector) {
	var $delete_this = $(selector);
	if ($delete_this.length) {
		$delete_this.remove();
	}
}

function hideAllEpisodes() {
	$("#sidebar ul li").each(function(id, li){
		resetSearchResults(li);
		$(li).hide();
	});
}

function showAllEpisodes() {
	$("#sidebar ul li").each(function(id, li){
		resetSearchResults(li);
		$(li).show();
	});
}

// reset search results
function resetSearchResults(li) {
	$(li).removeAttr("data-begin");
	$(li).show();
	
	var $result_link = $(li).children(":first");
	$result_link.attr("href", cleanURL($result_link.attr("href")));
	
	tryDelete(".search-result");
}

// get variables from URL
function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable){return pair[1];}
	}
	return(false);
}

// download data for new episode or use cache if possible
function loadContent(url) {
	$("#loader").show();
	if (cached_data.hasOwnProperty(url) == 1) {
		updateContent(cached_data[url]);
	} else {
		$.ajax({
			url: domain + "content.php",
			dataType: "json",
			data: {id: cleanURL(url)},
			async: true,
			success: function(json) {
				cached_data[url] = json;
				updateContent(json);
			},
			error: function(xhr, textStatus, error) {
				window.location.href = url;
			}
		});
	}
}

// replace old episode data with current episode data
function updateContent(episode_data) {
	// get current episode
	var $current_episode = $("[data-episode='" + episode_data.Identifier + "']");
	
	// update page title
	document.title = "Episode #" + episode_data.Number + " \u00B7 Painkiller Already Archive";
	
	// update video
	if ($current_episode.attr("data-begin")) {
		player.loadVideoById(episode_data.YouTube, $current_episode.attr("data-begin"));
	} else {
		player.cueVideoById(episode_data.YouTube);
	}
	
	// change header
	$("#container h2").text("Painkiller Already #" + episode_data.Number);
	
	// update current episode
	$("nav ul").attr("data-current", episode_data.Identifier);
	
	// change date published
	var $published_time = $(".published time");
	$published_time.attr("datetime", episode_data.DateTime);
	$published_time.text(episode_data.Date);
	
	// change author name if timestamp is available
	tryDelete(".author");
	if (((episode_data.Timeline).hasOwnProperty("Author") == 1) && (episode_data.Timeline.Author.Name !== "")) {
		var $link = $("<a>", {"class": "author", "title": "Timeline Author", "href": episode_data.Timeline.Author.Link});
		$link.append($("<i>", {"class": "icon-user"}));
		$link.append($("<small>").text(episode_data.Timeline.Author.Name));
		$(".info").append($link);
	}
	
	// get comment count if possible
	tryDelete(".comments");
	if (episode_data.Reddit !== "") {
		var $comments_link = $("<a>", {"class": "comments", "title": "Discussion Comments", "href": "http://www.reddit.com/comments/" + episode_data.Reddit});
		var $icon = $("<i>", {"class": "icon-comments"});
		var $comment_text = $("<small>", {"data-reddit": episode_data.Reddit});
		$comment_text.text("Comments");
		
		$comments_link.append($icon);
		$comments_link.append($comment_text);
		
		$(".published").after($comments_link);
		
		setCommentCount($comment_text, episode_data.Reddit);
	}
	
	// update horizontal timeline if possible
	tryDelete("#timeline-horizontal");
	if ((episode_data.Timeline).hasOwnProperty("Timestamps") == 1) {
		var $timeline_horizontal = $("<div>", {"id": "timeline-horizontal", "class": "section"});
		$timeline_horizontal.append($("<h4>").addClass("section-header").text("Timeline"));
		
		var $line = $("<div>", {"class": "timeline"});
		$.each(episode_data.Timeline.Timestamps, function(timestamp_id, timestamp_data) {
			var $timelink = $("<a>", {"class": "timelink", "href": domain + "episode/" + episode_data.Number + "?timestamp=" + timestamp_data.Begin, "data-begin": timestamp_data.Begin, "data-end": timestamp_data.End});
			var $topic = $("<div>", {"class": "topic"}).css({"width": timestamp_data.Width + "%"});
			var $tooltip = $("<div>", {"class": "tooltip", "id": timestamp_id});
			if (timestamp_data.Begin > (episode_data.YouTubeLength / 2)) {
				$tooltip.addClass("right");
			}
			var $triangle = $("<div>", {"class": "triangle"});
			var $span = $("<span>").text(timestamp_data.Value);
			$tooltip.append($triangle);
			$tooltip.append($span);
			$topic.append($tooltip);
			$timelink.append($topic);
			$line.append($timelink);
		});
		
		$timeline_horizontal.append($line);
		
		$("#timeline-clear").after($timeline_horizontal);
	}
	
	// update timestamp table if possible
	tryDelete("#timeline-vertical");
	if ((episode_data.Timeline).hasOwnProperty("Timestamps") == 1) {
		var $timeline_vertical = $("<div>", {"id": "timeline-vertical", "class": "section"});
		var $table = $("<table>", {"id": "timeline-table"});
		var $thead = $("<thead>");
		var $head_row = $("<tr>");
		var $time_column = $("<th>").text("Time");
		var $event_column = $("<th>").text("Event");
		$head_row.append($time_column);
		$head_row.append($event_column);
		$thead.append($head_row);
		$table.append($thead);
		
		var $tbody = $("<tbody>");
		$.each(episode_data.Timeline.Timestamps, function(timestamp_id, timestamp_data) {
			var $body_row = $("<tr>");
			var $timestamp = $("<td>", {"class": "timestamp"});
			var $timelink = $("<a>", {"class": "timelink", "href": domain + "episode/" + episode_data.Number + "?timestamp=" + timestamp_data.Begin, "data-begin": timestamp_data.Begin, "data-end": timestamp_data.End}).text(timestamp_data.HMS);
			var $event = $("<td>", {"class": "event"}).text(timestamp_data.Value);
			if (timestamp_data.URL !== "") {
				$event.append($("<a>", {"target": "_blank", "href": timestamp_data.URL}).append($("<i>", {"class": "icon-external-link"})));
			}
			$timestamp.append($timelink);
			$body_row.append($timestamp);
			$body_row.append($event);
			$tbody.append($body_row);
		});
		
		$table.append($tbody);
		$timeline_vertical.append($table);
		
		$("#container").append($timeline_vertical);
	}
	
	// update active episode on the sidebar
	$("nav li").removeAttr("id");
	$current_episode.attr("id", "active");
	
	// update hosts box
	$("#video").after(generatePeople("hosts", "Hosts", episode_data.People));
	
	// update guests box
	$("#hosts").after(generatePeople("guests", "Guests", episode_data.People));
	
	// update sponsors box
	$("#timeline-clear").before(generatePeople("sponsors", "Sponsors", episode_data.People));
	
	// close sidebar if open
	var $sidebar = $(".sidebar");
	if ($sidebar.hasClass("toggled")) {
		$sidebar.removeClass("toggled");
	}
	
	// hide loader
	$("#loader").hide();
}

// fetch reddit comment count
function setCommentCount(element, reddit_id) {
	$.ajax({
		url: "http://www.reddit.com/comments/" + reddit_id + ".json",
		dataType: "json",
		async: true,
		success: function(data) {
			element.text(data[0].data.children[0].data.num_comments + " Comments");
		},
		error: function(xhr, textStatus, error) {
			element.text("Comments");
		}
	});
}

// generate people containers
function generatePeople(id, name, data) {
	tryDelete("#" + id);
	if (data.hasOwnProperty(name) == 1) {
		var $people = $("<div>", {"id": id, "class": "section items"});
		var $header = $("<h4>").addClass("section-header").text(name);
		
		$people.append($header);
		
		$.each(data[name], function(person_id, person_data) {
			$people.append(generatePerson(person_data.ID, person_data.Name, person_data.URL));
		});
		
		return $people;
	}
}

// generate person image
function generatePerson(id, name, url) {
	var $link = $("<a>", {"class": "item", "target": "_blank", "href": domain + "person/" + id, title: name});
	var $person = $("<div>", {"class": "person"});
	var $avatar = $("<img>", {"class": "person-image", "alt": name, "src": domain + "img/people/" + id + ".png"});
	
	$person.append($avatar);
	$link.append($person);
	
	return $link;
}

// load YT player
var player;
function onYouTubePlayerAPIReady() {
	player = new YT.Player("player", {
		events: {
			"onReady": onPlayerReady,
			"onStateChange": onPlayerStateChange
		}
	});
}

// setup pushState, handle search, and seek to timestamp
var cached_data = [];
function onPlayerReady() {
	// handle search query
	var search_query = getQueryVariable("query");
	if (search_query) {
		$("#search-field").val(search_query).trigger("input");
	}
	
	// seek to timestamp
	var search_timestamp = getQueryVariable("timestamp");
	if (search_timestamp) {
		// track in analytics
		if (typeof _gaq !== "undefined") {
			_gaq.push(["_trackEvent", "Timeline", "Seek", $("nav ul").attr("data-current"), parseInt(search_timestamp, 10)]);
		}
	}
	
	// check if pushState is available
	var hasPushstate = !!(window.history && history.pushState);
	
	if ($("body").attr("data-type") == "Episode") {
		// episode click interceptor
		$("nav a").click(function(e) {
			if (hasPushstate) {
				// cancel navigation
				e.preventDefault();
				
				// add page to history
				href = $(this).attr("href");
				history.pushState(null, null, href);
				
				// track page view
				if (typeof _gaq !== "undefined") {
					_gaq.push(["_trackPageview", "/" + href.replace(domain, "")]);
				}
				
				loadContent(href);
			}
		});
		
		// add popstate listener to catch back and forward navigation
		if (hasPushstate) {
			window.addEventListener("popstate", function() {
				loadContent(location.href);
			});
		}
	}
}

// toggle timestamp checker
function onPlayerStateChange() {
	if (player.getPlayerState() === 1) {
		time_updater = setInterval(updateTime, 1000);
	} else {
		time_updater = null;
	}
}

// repeatedly check timestamp
var video_time = 0;
var time_updater = null;
function updateTime() {
	var old_time = video_time;
	if (player && player.getCurrentTime) {
		video_time = player.getCurrentTime();
	}
	if (video_time !== old_time) {
		onProgress(video_time);
	}
}

// highlight active timestamp
function onProgress(currentTime) {
	$(".timelink").each(function(timelink_id, timelink){
		if ((currentTime > $(timelink).attr("data-begin")) && (currentTime < $(timelink).attr("data-end"))) {
			if ($(timelink).parent().prop("tagName").toLowerCase() == "td") {
				$(timelink).parent().parent().addClass("active-timestamp-vertical");
			} else {
				$(timelink).children(":first").addClass("active-timestamp-horizontal");
			}
		} else {
			if ($(timelink).parent().prop("tagName").toLowerCase() == "td") {
				$(timelink).parent().parent().removeClass("active-timestamp-vertical");
			} else {
				$(timelink).children(":first").removeClass("active-timestamp-horizontal");
			}
		}
	});
}

$(document).ready(function() {
	// add YT script tag
	var tag = document.createElement("script");
	var firstScriptTag = document.getElementsByTagName("script")[0];
	tag.src = "https://www.youtube.com/player_api";
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	
	// scroll to active episode
	if (document.getElementById("active")) {
		$("#sidebar").animate({scrollTop:$("#active").position().top},1000);
	}
	
	// load comment count on load
	if (document.getElementById("comments")) {
		setCommentCount($("#comments"), document.getElementById("comments").getAttribute("data-reddit"));
	}
	
	// collapsible sidebar
	$(".toggle-menu").click(function(e){
		e.preventDefault();
		$(".sidebar").toggleClass("toggled");
	});
	
	// capture timestamp click events
	$(document).on("click", "a.timelink", function() {
		// seek to timestamp
		player.seekTo($(this).attr("data-begin"));
		document.getElementsByTagName("header")[0].scrollIntoView();
		
		// track in analytics
		if (typeof _gaq !== "undefined") {
			_gaq.push(["_trackEvent", "Timeline", "Seek", $("nav ul").attr("data-current"), parseInt($(this).attr("data-begin"), 10)]);
		}
		
		return false;
	});
	
	// live search
	var search_timer;
	var previous_search;
	$("#search-field").on("propertychange input", function() {
		clearTimeout(search_timer);
		var search_value = this.value;
		
		search_timer = setTimeout(function() {
			if ($.trim(search_value) !== "") {
				if (previous_search != search_value) {
					// track search in analytics
					if (typeof _gaq !== "undefined") {
						_gaq.push(["_trackEvent", "Search", "Search", search_value]);
					}
					
					$("#search-error").hide();
					
					$.ajax({
						url: domain + "search.php",
						dataType: "json",
						data: {"query": search_value},
						async: true,
						success: function(results_json) {
							previous_search = search_value;
							
							// hide all episodes
							hideAllEpisodes();
							
							if (!jQuery.isEmptyObject(results_json)) {
								$.each(results_json, function(episode_identifier, episode_timestamp) {
									// show only returned episodes
									var $episode = $("li[data-episode='" + episode_identifier + "']");
									var $search_result = $("<span>").addClass("search-result").attr("title", episode_timestamp.Value).text(episode_timestamp.Value);
									var $result_link = $episode.children(":first");
									
									$episode.attr("data-begin", episode_timestamp.Timestamp);
									$result_link.attr("href", $result_link.attr("href") + "?timestamp=" + episode_timestamp.Timestamp);
									$result_link.append($search_result);
									$episode.show();
								});
							}
						},
						error: function(xhr, textStatus, error) {
							$("#search-error").show();
							hideAllEpisodes();
						}
					});
				}
			} else {
				// reset episode list
				previous_search = "";
				
				$("#search-error").hide();
				showAllEpisodes();
			}
		}, 200);
	});
});