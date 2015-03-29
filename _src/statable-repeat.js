(function () {
	/**
	* statable.repeat Module
	*
	* directive intended used as ng-repeat except that
	* this directive reorder items inside array instead of
	* rerender all the items when array/object is changed
	*
	* and this directive uses shallow watch instead of deep watch to avoid unnecessary watch is triggerd
	*
	* NB: currently key,value map is not implemented yet
	* NB: $index, $first, $middle, $last, $even, $odd are not implemented yet for simplicity
	*/
	var m = angular.module('statable.repeat', []);

	m.directive('statableRepeat', ['$compile', function($compile){
		// Runs during compile
		return {
			// name: '',
			priority: 1000,
			terminal: true,
			scope: true, // {} = isolate, true = child, false/undefined = no change
			// controller: function($scope, $element, $attrs, $transclude) {},
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			// restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '',
			// templateUrl: '',
			// replace: true,
			// transclude: 'element',
			compile: function(tElement, tAttrs) {
				tElement.removeAttr('statable-repeat');
				var html = tElement[0].outerHTML;
				tElement.replaceWith("<!--statable-repeat: " + tAttrs.statableRepeat + "-->");
				return function ($scope, iElm, iAttrs, controller) {
					// console.log(html);
					var children = {};

					// map reg: \((.+?), ?(.+?)\) in (.+)
					// set reg: (.+) in (.+)
					var _reg_1 = new RegExp();
					var _map_reg = /\((.+?), ?(.+?)\) in (.+)/;
					var _set_reg = /(.+?) in (.+?) trackBy (.+)/;

					var _listName;
					var _trackBy;
					var _eachAs;

					if (_map_reg.test(iAttrs.statableRepeat)) {
						throw new Error("map reg is not implemented yet");
					} else if (_set_reg.test(iAttrs.statableRepeat)) {
						var _res = _set_reg.exec(iAttrs.statableRepeat);
						_listName = _res[2];
						_trackBy = _res[3];
						_eachAs = _res[1];
					} else {
						throw new Error("unknown pattern");
					};

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
							oldList = angular.copy(oldList);
							////////////////////////////////////////////////
							// remove items which are no long in new list //
							////////////////////////////////////////////////
							for (var i = oldList ? oldList.length - 1 : 0; oldList && i >= 0; i--) {
								var _oid = oldList[i][_trackBy];
								var _found = false;
								for (var n = 0; n < newList.length; n++) {
									var _nid = newList[n][_trackBy];
									if (_oid == _nid) {
										_found = true;
										break;
									};
								};
								if (!_found) {
									oldList.splice(i, 1);
									children[_oid.toString()].scope.$destroy();
									children[_oid.toString()].element.remove();
									delete children[_oid.toString()];
								};
							};
							//////////////////////////////////////
							// insert or re-order items on page //
							//////////////////////////////////////
							var curr = 0;
							var total = oldList ? oldList.length : 0;
							for (var i = 0; i < newList.length; i++) {
								var _item = newList[i];

								if (curr >= total) {
									var _s = $scope.$new();
									_s[_eachAs] = _item;
									var _e = $compile(html)(_s);
									children[_item[_trackBy].toString()] = {
										scope: _s,
										element: _e
									};

									////////////////////////////////////////////////////////////////////////////////////////////////////////////////
									// if old list is undefined or empty, then there is not element there so that we have to insert it after iElm //
									////////////////////////////////////////////////////////////////////////////////////////////////////////////////
									if (oldList && total > 0) {
										var _oid = oldList[total - 1][_trackBy];
										children[_oid.toString()].element.parent()[0].insertBefore(_e[0], children[_oid.toString()].element[0]);
									} else {
										iElm.parent()[0].insertBefore(_e[0], iElm[0]);
									}
								} else {
									var _nid = _item[_trackBy];
									var _oid = oldList[curr][_trackBy];
									if (_nid == _oid) {
										if (!children[_oid.toString()]) {
											var _s = $scope.$new();
											_s[_eachAs] = _item;
											var _e = $compile(html)(_s);
											children[_nid.toString()] = {
												scope: _s,
												element: _e
											};
											
											iElm.parent()[0].insertBefore(_e[0], iElm[0]);
										} else {
											(children[_oid.toString()].scope[_eachAs] != _item) ? (children[_oid.toString()].scope[_eachAs] = _item) : "";
										}
										curr++;
										continue;
									} else {
										///////////////////////////////////
										// look for new item in old list //
										///////////////////////////////////
										var _isNew = true;
										var _index = 0;
										for (var n = 0; n < oldList.length; n++) {
											var _oitem = oldList[n];
											if (_oitem[_trackBy] == _nid) {
												_isNew = false;
												_index = n;
												break;
											};
										};

										if (_isNew) {
											var _s = $scope.$new();
											_s[_eachAs] = _item;
											var _e = $compile(html)(_s);
											children[_nid.toString()] = {
												scope: _s,
												element: _e
											};
											children[_oid.toString()].element.parent()[0].insertBefore(_e[0], children[_oid.toString()].element[0]);
										} else {
											(children[_nid.toString()].scope[_eachAs] != _item) ? (children[_nid.toString()].scope[_eachAs] = _item) : "";
											children[_oid.toString()].element.parent()[0].insertBefore(children[_nid.toString()].element[0], children[_oid.toString()].element[0]);
											oldList.splice(_index, 1);
											total = oldList.length;
											continue;
										}
									}
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
						update(nv, ov);
					});
				};
			},
			// link: function($scope, iElm, iAttrs, controller) {
			// 
			// }
		};
	}]);
})();