(function () {
	/**
	* stateRepeat Module
	* License: MIT
	* Author: Velissel (william.wenyan@gmail.com)
	*
	* faster alternative to ng-repeat, avoid element redraws/reflows, fully compatible with javascript, jquery or other libraries
	*
	* and this directive uses shallow watch instead of deep watch to avoid unnecessary watch is triggerd
	*
	* NB: currently key,value map is now implemented
	* NB: $index, $first, $middle, $last, $even, $odd are now implemented
	*/
	var m = angular.module('stateRepeat', []);

	m.directive('stateRepeat', ['$compile', function($compile){
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
				tElement.removeAttr('state-repeat');
				var html = tElement[0].outerHTML;
				tElement.replaceWith("<!--state-repeat: " + tAttrs.stateRepeat + "-->");
				return function ($scope, iElm, iAttrs, controller) {
					// console.log(html);
					var children = {};

					// map reg: \((.+?), ?(.+?)\) in (.+)
					// set reg: (.+) in (.+)
					var _map_reg = /\((.+?), ?(.+?)\) in (.+)/;
					var _set_reg = /(.+?) in (.+?) trackBy (.+)/;

					var _listName;
					var _trackBy;
					var _eachAs;

					var type = "unknown";

					if (_map_reg.test(iAttrs.stateRepeat)) {
						// throw new Error("map reg is not implemented yet");
						var _res = _map_reg.exec(iAttrs.stateRepeat);
						_listName = _res[3];
						_trackBy = _res[1];
						_eachAs = _res[2];
						type = "map";
					} else if (_set_reg.test(iAttrs.stateRepeat)) {
						var _res = _set_reg.exec(iAttrs.stateRepeat);
						_listName = _res[2];
						_trackBy = _res[3];
						_eachAs = _res[1];
						type = "list";
					} else {
						throw new Error("unknown pattern");
					};

					$scope.$on('$destroy', function () {
						for(var k in children) {
							children[k].scope.$destroy();
							children[k].element.remove();
							delete children[k];
						}
						// console.log('stateRepeat destory', _listName, _trackBy, _eachAs);
					});

					function updateList (newList, oldList) {
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

						///////////////////////
						// update properties //
						///////////////////////
						for (var i = 0; newList && i < newList.length; i++) {
							var _item = newList[i];
							var _id = _item[_trackBy];
							var _s = children[_id].scope;
							_s['$index'] = i;
							_s['$first'] = i == 0;
							_s['$last'] = i == (newList.length - 1);
							_s['$middle'] = (!_s['$first'] && !_s['$last']);
							_s['$even'] = 0 == (i % 2);
							_s['$odd'] = 0 != (i % 2);
						};
					};
					function updateMap (newMap, oldMap) {
						if (!newMap || Object.keys(newMap).length == 0) {
							for(var k in children) {
								children[k].scope.$destroy();
								children[k].element.remove();
								delete children[k];
							}
						} else {
							if (oldMap) {
								oldMap = angular.copy(oldMap);
								/////////////////////////////////////////////
								// look for attributes no longer in object //
								/////////////////////////////////////////////
								for(var k in oldMap) {
									if (!newMap[k]) {
										children[k].scope.$destroy();
										children[k].element.remove();
										delete children[k];
										delete oldMap[k];
									};
								}

								var newKeys = Object.keys(newMap).sort();
								var oldKeys = Object.keys(oldMap).sort();
								var curr = 0;
								var total = oldKeys.length;
								for (var i = 0; i < newKeys.length; i++) {
									var _nk = newKeys[i];	/*new key*/
									if (curr >= total) {

									} else {
										var _ok = oldKeys[curr];	/*old key*/
										if (_nk == _ok) {
											if (!children[_ok]) {
												var _s = $scope.$new();
												_s[_trackBy] = _nk;
												_s[_eachAs] = newMap[_nk];
												var _e = $compile(html)(_s);
												children[_nk] = {
													scope: _s,
													element: _e
												};
												iElm.parent()[0].insertBefore(_e[0], iElm[0]);
											} else {
												newMap[_nk] != oldMap[_ok] ? children[_nk].scope[_eachAs] = newMap[_nk] : "";
											};
											curr++;
										} else {
											if (!oldMap[_nk]) {
												var _s = $scope.$new();
												_s[_trackBy] = _nk;
												_s[_eachAs] = newMap[_nk];
												var _e = $compile(html)(_s);
												children[_nk] = {
													scope: _s,
													element: _e
												};
												children[_ok].element.parent()[0].insertBefore(_e[0], children[_ok].element[0]);
											} else {
												newMap[_nk] != oldMap[_ok] ? children[_nk].scope[_eachAs] = newMap[_nk] : "";
												children[_ok].element.parent()[0].insertBefore(children[_nk].element[0], children[_ok].element[0]);
												oldKeys.splice(_index, 1);
												total = oldKeys.length;
											};
										};
									}
								};
							} else {
								var newKeys = Object.keys(newMap).sort();
								for (var i = 0; i < newKeys.length; i++) {
									var k = newKeys[i];
									var _s = $scope.$new();
									_s[_trackBy] = k;
									_s[_eachAs] = newMap[k];
									var _e = $compile(html)(_s);
									children[k] = {
										scope: _s,
										element: _e
									};
									iElm.parent()[0].insertBefore(_e[0], iElm[0]);
								};
							}
						}

						///////////////////////
						// update properties //
						///////////////////////
						if (newMap) {
							var newKeys = Object.keys(newMap).sort();
							for (var i = 0; i < newKeys.length; i++) {
								var k = newKeys[i];
								var _s = children[k].scope;
								_s['$index'] = i;
								_s['$first'] = i == 0;
								_s['$last'] = i == (newKeys.length - 1);
								_s['$middle'] = (!_s['$first'] && !_s['$last']);
								_s['$even'] = 0 == (i % 2);
								_s['$odd'] = 0 != (i % 2);
							};
						};
					};
					$scope.$watchCollection(_listName, function (nv, ov) {
						switch(type) {
							case "map":
							updateMap(nv, ov);
							break;
							case "list":
							updateList(nv, ov);
							break;
							default:
							throw new Error("unknown type");
						}
					});
				};
			},
			// link: function($scope, iElm, iAttrs, controller) {
			// 
			// }
		};
	}]);
})();