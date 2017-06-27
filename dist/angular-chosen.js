/**
 * angular-chosen-localytics - Angular Chosen directive is an AngularJS Directive that brings the Chosen jQuery in a Angular way
 * @version v1.7.0
 * @link http://github.com/leocaseiro/angular-chosen
 * @license MIT
 */
(function() {
  var chosenModule,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  (function($) {
    $.fn.chosenImage = function(options) {
      return this.each(function() {
        var $chosen, $select, cssObj, imgMap;
        $select = $(this);
        imgMap = {};
        cssObj = function(imgSrc) {
          var bgImg;
          bgImg = imgSrc ? 'url(' + imgSrc + ')' : 'none';
          return {
            'background-image': bgImg
          };
        };
        $select.find('option').filter(function() {
          return $(this).text();
        }).each(function(i) {
          imgMap[i] = $(this).attr('data-img-src');
        });
        $select.chosen(options);
        $chosen = $select.next('.chosen-container').addClass('chosenImage-container');
        $chosen.on('click.chosen, mousedown.chosen, keyup.chosen', function(event) {
          $chosen.find('.chosen-results li').each(function() {
            var imgIndex;
            imgIndex = $(this).attr('data-option-array-index');
            $(this).css(cssObj(imgMap[imgIndex]));
          });
        });
        $select.change(function() {
          var imgSrc;
          imgSrc = $select.find('option:selected').attr('data-img-src') || '';
          $chosen.find('.chosen-single span').css(cssObj(imgSrc));
        });
        $select.trigger('change');
      });
    };
  })(jQuery);

  angular.module('chosen.image', []);

  chosenModule = angular.module('chosen.image');

  chosenModule.provider('chosen', function() {
    var options;
    options = {};
    return {
      setOption: function(newOpts) {
        angular.extend(options, newOpts);
      },
      $get: function() {
        return options;
      }
    };
  });

  chosenModule.directive('chosen', [
    'chosen', '$timeout', function(config, $timeout) {
      var CHOSEN_OPTION_WHITELIST, NG_OPTIONS_REGEXP, isEmpty, snakeCase;
      NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
      CHOSEN_OPTION_WHITELIST = ['persistentCreateOption', 'createOptionText', 'createOption', 'skipNoResults', 'noResultsText', 'allowSingleDeselect', 'disableSearchThreshold', 'disableSearch', 'enableSplitWordSearch', 'inheritSelectClasses', 'maxSelectedOptions', 'placeholderTextMultiple', 'placeholderTextSingle', 'searchContains', 'singleBackstrokeDelete', 'displayDisabledOptions', 'displaySelectedOptions', 'width', 'includeGroupLabelInSelected', 'maxShownResults'];
      snakeCase = function(input) {
        return input.replace(/[A-Z]/g, function($1) {
          return "_" + ($1.toLowerCase());
        });
      };
      isEmpty = function(value) {
        var key;
        if (angular.isArray(value)) {
          return value.length === 0;
        } else if (angular.isObject(value)) {
          for (key in value) {
            if (value.hasOwnProperty(key)) {
              return false;
            }
          }
        }
        return true;
      };
      return {
        restrict: 'A',
        require: '?ngModel',
        priority: 1,
        link: function(scope, element, attr, ngModel) {
          var chosen, directiveOptions, empty, initOrUpdate, match, options, origRender, startLoading, stopLoading, updateMessage, valuesExpr, viewWatch;
          scope.disabledValuesHistory = scope.disabledValuesHistory ? scope.disabledValuesHistory : [];
          element = $(element);
          element.addClass('localytics-chosen');
          directiveOptions = scope.$eval(attr.chosen) || {};
          options = angular.copy(config);
          angular.extend(options, directiveOptions);
          angular.forEach(attr, function(value, key) {
            if (indexOf.call(CHOSEN_OPTION_WHITELIST, key) >= 0) {
              return attr.$observe(key, function(value) {
                var prefix;
                prefix = String(element.attr(attr.$attr[key])).slice(0, 2);
                options[snakeCase(key)] = prefix === '{{' ? value : scope.$eval(value);
                return updateMessage();
              });
            }
          });
          startLoading = function() {
            return element.addClass('loading').attr('disabled', true).trigger('chosen:updated');
          };
          stopLoading = function() {
            element.removeClass('loading');
            if (angular.isDefined(attr.disabled)) {
              element.attr('disabled', attr.disabled);
            } else {
              element.attr('disabled', false);
            }
            return element.trigger('chosen:updated');
          };
          chosen = null;
          empty = false;
          initOrUpdate = function() {
            var defaultText, dropListDom;
            if (chosen) {
              dropListDom = $(element.parent()).find("div.chosen-drop");
              if (dropListDom && dropListDom.length > 0 && parseInt(dropListDom.css("left")) >= 0) {
                return;
              }
              return element.trigger('chosen:updated');
            } else {
              scope.$evalAsync(function() {
                chosen = element.chosenImage(options).data('chosen');
              });
              if (angular.isObject(chosen)) {
                return defaultText = chosen.default_text;
              }
            }
          };
          updateMessage = function() {
            if (chosen && empty) {
              element.attr('data-placeholder', chosen.results_none_found).attr('disabled', true);
            } else {
              element.removeAttr('data-placeholder');
            }
            return element.trigger('chosen:updated');
          };
          if (ngModel) {
            origRender = ngModel.$render;
            ngModel.$render = function() {
              origRender();
              return initOrUpdate();
            };
            element.on('chosen:hiding_dropdown', function() {
              return scope.$apply(function() {
                return ngModel.$setTouched();
              });
            });
            if (attr.multiple) {
              viewWatch = function() {
                return ngModel.$viewValue;
              };
              scope.$watch(viewWatch, ngModel.$render, true);
            }
          } else {
            initOrUpdate();
          }
          attr.$observe('disabled', function() {
            return element.trigger('chosen:updated');
          });
          if (attr.ngOptions && ngModel) {
            match = attr.ngOptions.match(NG_OPTIONS_REGEXP);
            valuesExpr = match[7];
            scope.$watchCollection(valuesExpr, function(newVal, oldVal) {
              var timer;
              return timer = $timeout(function() {
                if (angular.isUndefined(newVal)) {
                  return startLoading();
                } else {
                  empty = isEmpty(newVal);
                  stopLoading();
                  return updateMessage();
                }
              });
            });
            return scope.$on('$destroy', function(event) {
              if (typeof timer !== "undefined" && timer !== null) {
                return $timeout.cancel(timer);
              }
            });
          }
        }
      };
    }
  ]);

}).call(this);
