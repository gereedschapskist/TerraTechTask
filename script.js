var imgArray = {},
	currentPage = 1,
	lastPage = 100,
	polygon = {},
	radius = 1;

var firstdate = new Date(),
	lastdate = new Date(),
	picsByDate = {2018:[0,0,0,0,0,0,0,0,0,0,0,0]};

function fetchImg(polygon, radius, page) {
	$.getJSON('https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=6134646de9e85a8e2a6a09aa5a3882a4&has_geo=1&lat=' + polygon.getCenter().lat + '&lon=' + polygon.getCenter().lng + '&radius=' + radius + '&extras=date_taken%2C+owner_name%2C+url_t&page=' + currentPage + '&format=json&nojsoncallback=1', function(data) {
		if (data.stat == "ok") {
			imgArray[page] = data.photos.photo;
			lastPage = data.photos.pages;
			currentPage = data.photos.page;
			refreshpics();
			setchartdata(data);
		} else {
			error("Faled to load images. Try again.");
		}
	});
}

function refreshpics() {
	$('#results .container').append('<div id="page-' + currentPage + '"></div>');
	for (i=0; i < imgArray[currentPage].length; i++) {
		var photo = imgArray[currentPage][i];
		$('#results div[id="page-' + currentPage + '"]').append('<div class="item">\
									<div class="thumbnail"><img src="' + photo.url_t + '" /></div>\
									<p class="title">' + photo.title + '</p>\
									<p class="author">' + photo.ownername + '</p>\
									<p class="date">' + photo.datetaken + '</p>\
								</div>');
	}
	$('#results button').remove();
	if (currentPage !== lastPage) {
		$('#results .container').append('<button class="loadmore">Load More</button>');
		$('#results .loadmore').click(function(){
			currentPage++;
		    fetchImg(polygon, radius, currentPage);
		});
	}
}

function setchartdata() {
	//adding to numbers of pictures taken per month
	for (i=0; i < imgArray[currentPage].length; i++) {
		var datetaken = new Date(imgArray[currentPage][i].datetaken);
		var month = datetaken.getMonth();
		var year = datetaken.getFullYear();
		if (datetaken < firstdate) {firstdate = datetaken}
		if (datetaken > lastdate) {lastdate = datetaken}

		if (typeof(picsByDate[year]) == "undefined") {
			picsByDate[year] = [0,0,0,0,0,0,0,0,0,0,0,0];
		}
		picsByDate[year][month]++;
	}

	var chartdata = [];
	var chartlabels = [];

	//adding missing months + creating chart data & labels arrays
	for (year=firstdate.getFullYear();year <= lastdate.getFullYear();year++) {
		for (month=0; month<12; month++) {
			if (typeof(picsByDate[year]) == "undefined") {picsByDate[year] = [0,0,0,0,0,0,0,0,0,0,0,0];}
			chartdata.push(picsByDate[year][month]);
			chartlabels.push(month+1 + '.' + year);
		}
	}
	drawchart(chartlabels, chartdata);
}

function drawchart(labels, data) {
	var ctx = document.getElementById('chart').getContext('2d');
	var chart = new Chart(ctx, {
	    type: 'bar',
	    data: {
	        labels: labels,
	        datasets: [{
	        	label: "Pictures per month",
				data: data,
				fill : false,
				backgroundColor: "rgba(255, 99, 132, 0.5)"
	        }]
	    },
	    options: {
		    responsive: true,
		    maintainAspectRatio: false,
		    scales: {
		        yAxes: [{
			ticks: {
			beginAtZero:true
		            }
		        }],
		        xAxes: [{
		            barPercentage: 1.8
		        }]
		    }
		}
	});
}

function error(text) {
	$('#results .container').html('<div id="error-message">' + text + '</div>');
}

document.addEventListener("DOMContentLoaded", function(){
	var map = L.map('mapid').setView([55.74, 37.62], 13);
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
	    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	    maxZoom: 18,
	    id: 'mapbox.streets',
	    accessToken: 'pk.eyJ1IjoiZ2VyZWVkc2NoYXBza2lzdCIsImEiOiJjam9xeHhpaDUwOG05M3dwaHR0MW42M2htIn0.rFk_8fFhoFkZW19XkuhH_w'
	}).addTo(map);

	polygon = L.polygon([], {color: 'red', fillRule: 'nonzero'}).addTo(map);
	var distance = 0;

	function onMapClick(e) {
	    polygon.addLatLng([e.latlng.lat, e.latlng.lng]).redraw();
	    distance = map.distance(
	    	[polygon.getBounds()._northEast.lat, polygon.getBounds()._northEast.lng], 
	    	[polygon.getBounds()._southWest.lat, polygon.getBounds()._southWest.lng]
	    	);
	    radius = Math.round(distance/2000);
	    if (radius <= 0) {radius = 1;}
	    fetchImg(polygon, radius, currentPage);
	}

	map.on('click', onMapClick);
	$('#clear').click(function(){
		polygon.setLatLngs([]);
		$('#results .container').html('<div id="error-message">Choose the area of search</div>');
		imgArray = {};
		currentPage = 1;
		lastPage = 100;
		radius = 1;

		firstdate = new Date();
		lastdate = new Date();
		picsByDate = {2018:[0,0,0,0,0,0,0,0,0,0,0,0]};
		drawchart([], []);
	});
});