# state-repeat
faster alternative to ng-repeat, avoid element redraws/reflows, fully compatible with javascript, jquery or other libraries

This directive is created as an alternative of ng-repeat in AngularJS.

Different from ng-repeat, when the array/object is replaced by a new one, this directive will try match as many items/attributes as possible then re-order/add/delete DOM elements while ng-repeat will simply redraw every elements.

Besides, array/object is watched by $scope.$watchCollection instead of deep watch used in ng-repeat

##Usage
{{}} = changable

1. state-repeat='{{item}} in {{array}} trackBy {{id}}'

  When used as array iterator, an attribute of object in the list must be explicitly given as the identification for mapping.

  Implicit mapping(e.g hash as key) is planned to implement later though

  Track by return value of function is also planned to implement later
  
2. state-repeat='({{key}}, {{value}}) in {{object}}'

  When used as object attributes iterator, it is exactly same as ng-repeat