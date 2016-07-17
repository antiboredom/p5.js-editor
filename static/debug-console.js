/*eslint-disable*/

/*
    cycle.js
    2013-02-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true, regexp: true */

/*members $ref, apply, call, decycle, hasOwnProperty, length, prototype, push,
    retrocycle, stringify, test, toString
*/

if (typeof JSON.decycle !== 'function') {
(function(){

  /**
   * Allows stringifing DOM elements.
   *
   * This is done in hope to identify the node when dumping.
   *
   * @param {Element} node DOM Node (works best for DOM Elements).
   * @returns {String}
   */
  function stringifyNode(node) {
    var text = "";
    switch (node.nodeType) {
      case node.ELEMENT_NODE:
        text = node.nodeName.toLowerCase();
        if (node.id.length) {
          text += '#' + node.id;
        }
        else {
          if (node.className.length) {
            text += '.' + node.className.replace(/ /, '.');
          }
          if ('textContent' in node) {
            text += '{textContent:'
                + (node.textContent.length < 20 ? node.textContent : node.textContent.substr(0, 20) + '...')
              + '}'
            ;
          }
        }
      break;
      // info on values: http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-1841493061
      default:
        text = node.nodeName;
        if (node.nodeValue !== null) {
          text += '{value:'
                + (node.nodeValue.length < 20 ? node.nodeValue : node.nodeValue.substr(0, 20) + '...')
            + '}'
          ;
        }
      break;
    }
    return text;
  }

    JSON.decycle = function decycle(object, stringifyNodes) {
        'use strict';

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form
//      {$ref: PATH}
// where the PATH is a JSONPath string that locates the first occurance.
// So,
//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));
// produces the string '[{"$ref":"$"}]'.

// NOTE! If your object contains DOM Nodes you might want to use `stringifyNodes` option
// This will dump e.g. `div` with id="some-id" to string: `div#some-id`.
// You will avoid some problems, but you won't to be able to fully retro-cycle.
// To dump almost any variable use: `alert(JSON.stringify(JSON.decycle(variable, true)));`

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child member or
// property.

        var objects = [],   // Keep a reference to each unique object or array
      stringifyNodes = typeof(stringifyNodes) === 'undefined' ? false : stringifyNodes,
            paths = [];     // Keep the path to each unique object or array

        return (function derez(value, path) {

// The derez recurses through the object, producing the deep copy.

            var i,          // The loop counter
                name,       // Property name
                nu;         // The new object or array

// if we have a DOM Element/Node convert it to textual info.

      if (stringifyNodes && typeof value === 'object' && value !== null && 'nodeType' in value) {
        return stringifyNode(value);
      }

// typeof null === 'object', so go on if this value is really an object but not
// one of the weird builtin objects.

            if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date)    &&
                    !(value instanceof Number)  &&
                    !(value instanceof RegExp)  &&
                    !(value instanceof String)) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a $ref/path object. This is a hard way,
// linear search that will get slower as the number of unique objects grows.

                for (i = 0; i < objects.length; i += 1) {
                    if (objects[i] === value) {
                        return {$ref: paths[i]};
                    }
                }

// Otherwise, accumulate the unique value and its path.

                objects.push(value);
                paths.push(path);

// If it is an array, replicate the array.

                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    nu = [];
                    for (i = 0; i < value.length; i += 1) {
                        nu[i] = derez(value[i], path + '[' + i + ']');
                    }
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    for (name in value) {
                        if (Object.prototype.hasOwnProperty.call(value, name)) {
                            nu[name] = derez(value[name],
                                path + '[' + JSON.stringify(name) + ']');
                        }
                    }
                }
                return nu;
            }
            return value;
        }(object, '$'));
    };
})();
}


if (typeof JSON.retrocycle !== 'function') {
    JSON.retrocycle = function retrocycle($) {
        'use strict';

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px =
            /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.

            var i, item, name, path;

            if (value && typeof value === 'object') {
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    for (i = 0; i < value.length; i += 1) {
                        item = value[i];
                        if (item && typeof item === 'object') {
                            path = item.$ref;
                            if (typeof path === 'string' && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    }
                } else {
                    for (name in value) {
                        if (typeof value[name] === 'object') {
                            item = value[name];
                            if (item) {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[name] = eval(path);
                                } else {
                                    rez(item);
                                }
                            }
                        }
                    }
                }
            }
        }($));
        return $;
    };
}







(function() {

  // parse the args to window (should include parent window id)
  // require('electron-window').parseArgs();

  // FIXME: Temporarily include parseArgs func from electron-window package due to webpack problems
  function parseArgs () {
    if (!window.location.hash) {
      window.__args__ = {}
    } else {
      var hash = window.location.hash.slice(1)
      window.__args__ = Object.freeze(JSON.parse(decodeURIComponent(hash)))
    }
  }
  parseArgs();


  var remote = require('electron').remote;

  // Set parentWindowId on the BrowserWindow object
  // remote.getCurrentWindow().parentWindowId = window.__args__.parentWindowId;

  var original = window.console;
  window.console = {};
  window._isNodeWebkit = true;

  window.sendMessageToParent = (message) => {
    original.log("Sending message to parent window")
    original.log(message)
    let parentWinId = window.__args__.parentWindowId
    let parentWin = remote.BrowserWindow.fromId(parentWinId)

    parentWin.webContents.send('debugMessage', message)
  }

  ["log", "warn", "error"].forEach(function(func) {
    window.console[func] = function(msg) {
      var style = null;
      if (arguments[2] && arguments[0].indexOf('%c') > -1) {
        style = arguments[1];
      }
      var data = {
        msg: JSON.stringify(JSON.decycle(msg, true), null, '  '),
        style: style,
        type: func
      };

      window.sendMessageToParent(JSON.stringify({ console: data }));

      original[func].apply(original, arguments);
    };
  });


  window.onerror = function(msg, url, num, column, errorObj) {
    var data = {
      num: num,
      // msg: JSON.stringify(JSON.decycle(msg, true), null, '  '),
      msg: msg,
      type: 'error'
    };

    window.sendMessageToParent(JSON.stringify({ console: data }));

    return false;
  };

  function downloadFile() {
    window.sendMessageToParent(JSON.stringify({ downloadFile: arguments }));
  }

  var booted = false;
  var interval = setInterval(function() {
    if (typeof p5 !== 'undefined' && !booted) {
      p5.prototype.downloadFile = downloadFile;
      booted = true;
      clearInterval(interval);
    }
  }, 10);

})();
/*eslint-disable*/
