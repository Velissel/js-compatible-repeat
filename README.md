# stabable-repeat
faster alternative to ng-repeat, avoid element redraws/reflows, fully compatible with javascript, jquery or other libraries

This directive is created as an alternative of ng-repeat in AngularJS.

##Usage
{{}} = changable

1. statable-repeat='{{item}} in {{array}} trackBy {{id}}'

  When used as array iterator, an attribute of object in the list must be explicitly given as the identification for
  mapping, implicit mapping(e.g hash as key) is planned to implement later though
  
2. statable-repeat='({{key}}, {{value}}) in {{object}}'

  When used as object attributes iterator, it is exactly same as ng-repeat
