(function () {
	/**
	* statable.repeat Module
	*
	* Description
	*/
	var m = angular.module('statable.repeat', []);

	m.directive('statableRepeat', ['$compile', function($compile){
		// Runs during compile
		return {
			// name: '',
			priority: 1000,
			terminal: true,
			scope: true, // {} = isolate, true = child, false/undefined = no change
			controller: function($scope, $element, $attrs, $transclude) {

			},
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			// restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '',
			// templateUrl: '',
			// replace: true,
			// transclude: 'element',
			compile: function(tElement, tAttrs) {
				tElement.removeAttr('statable-repeat');
				var html = tElement[0].outerHTML;
				tElement.remove();
				return function ($scope, iElm, iAttrs, controller) {
					// console.log(html);
					var children = {};

					var _listName = iAttrs.statableRepeat;
					var _trackBy = iAttrs.trackBy;
					var _eachAs = iAttrs.eachAs;

					$scope.$on('$destroy', function () {
						for(var k in children) {
							children[k].scope.$destroy();
							children[k].element.remove();
							delete children[k];
						}
						console.log('statableRepeat destory');
					});

					function update (newList, oldList) {
						if (!newList) {
							/////////////////////////////////////////////////
							// if new list is undefined, remove everything //
							/////////////////////////////////////////////////
							for(var k in children) {
								children[k].scope.$destroy();
								children[k].element.remove();
								delete children[k];
							}
							return;
						};
						if (newList.length > 0) {
							////////////////////////////////////////////////
							// remove items which are no long in new list //
							////////////////////////////////////////////////
							for (var i = 0; i < oldList.length; i++) {
								var _oid = oldList[i][_trackBy];
								var _found = false;
								for (var n = 0; n < newList.length; n++) {
									var _nid = newList[n][_trackBy];
									if (_oid == _nid) {_found = true; break;};
								};
								if (!_found) {
									children[_oid].scope.$destroy();
									children[_oid].element.remove();
									delete children[_oid];
								};
							};
							//////////////////////////////////////
							// insert or re-order items on page //
							//////////////////////////////////////
							var curr = 0;
							var total = 0;
							for(var k in children) {
								total++;
							}
							for (var i = 0; i < newList.length; i++) {
								var _item = newList[i];
								if (curr >= total) {
									var _oid = oldList[total - 1][_trackBy];
									var _s = $scope.$new();
									_s[_eachAs] = _item;
									var _e = $compile(html)(_s);
									children[_item[_trackBy]] = {
										scope: _s,
										element: _e
									};
									children[_oid].element.after(_e);
								} else {

								}
							};
						} else {
							/////////////////////////////////////////////
							// if new list is empty, remove everything //
							/////////////////////////////////////////////
							for(var k in children) {
								children[k].scope.$destroy();
								children[k].element.remove();
								delete children[k];
							}
						}
					};
					$scope.$watchCollection(_listName, function (nv, ov) {
						if (!nv) {return;};
						update(nv, ov);
					});
				};
			},
			// link: function($scope, iElm, iAttrs, controller) {
			// 	console.log(iElm[0].outerHTML);
			// 	var children = {};
			// 	$scope.$on('$destroy', function () {
			// 		for(var k in children) {
			// 			children[k].$destory();
			// 		}
			// 	});
			// 	var _listName = iAttrs.statableRepeat;
			// 	var _trackBy = iAttrs.trackBy;
			// 	var _eachAs = iAttrs.eachAs;
			// 	console.log(_listName, _trackBy, _eachAs);
			// 	// console.log($scope.data);
			// 	$scope.$watchCollection(_listName, function (nv) {
			// 		console.log(nv);
			// 		if (!nv) {return;};
			// 		var list = $scope.$eval(_listName);
			// 		for (var i = 0; i < list.length; i++) {
			// 			var item = list[i];
			// 			var _c = $scope.$new();
			// 			_c[_eachAs] = item;
			// 			children[item[_trackBy]] = _c;
			// 		};
			// 	});
			// }
		};
	}]);
})();