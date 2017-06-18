/*
 MkiScript:  Teenie-tiny JS library http://mkiscript.com
 */
;(function (win, doc, undefined) {
    'use strict';

    var docEl = doc.documentElement,
        keys = Object.keys || null,
        body = doc.body || null,
        cancelFrame,
        reqFrame,
        UA,
        P;


    // Does UA support us?
    if (!doc.querySelectorAll) {
        return;
    }


    // Semi sane UA detection
    UA = (function () {
        var styles = win.getComputedStyle(docEl, ''),
            pre = ([].slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1],
            dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1],
            nv = win.navigator,
            rx,
            ie;

        if (pre === 'ms') {
            rx = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
            rx.exec(nv.userAgent);
            ie = parseFloat(RegExp.$1);
        }

        return {
            css         : '-' + pre + '-',
            dom         : dom,
            lowercase   : pre,
            ie          : (ie || false),
            js          : pre[0].toUpperCase() + pre.substr(1),
            platform    : nv.platform.toLowerCase(),
            touch       : ('ontouchstart' in docEl || 'onmsgesturechange' in win) ? true : false
        };
    }());


    // QuerySelector
    function q$(selector, context) {
        if (typeof selector === 'string') {
            return [].slice.call((context || doc).querySelectorAll(selector));
        }
        return [selector];
    }


    // Add events
    function addEvent(el, evts, func) {
        evts.split(' ').forEach(function (evt) {
            el.addEventListener(evt, func, false);
        });
    }


    // Unique items only in []
    function distinct(arr, keepLast) {
        return arr.filter(function (value, index, array) {
            return keepLast ? array.indexOf(value, index + 1) < 0 : array.indexOf(value) === index;
        });
    }


    // Does an element already have a CSS class?
    function hasClass(el, cls) {
        return el.classList.contains(cls);
    }


    // Add a CSS class to an element
    function addClass(el, cls) {
        el.classList.add(cls);
    }


    // Remove a CSS class from an element
    function delClass(el, cls) {
        el.classList.remove(cls);
    }


    // Animation with setTimeout fallback
    reqFrame = (win.requestAnimationFrame || win[UA.js + 'RequestAnimationFrame'] || function (func) {
        win.setTimeout(func, 15);
    });


    // Cancel an animation with fallback
    cancelFrame = (win.cancelAnimationFrame || win[UA.js + 'CancelAnimationFrame'] || function (id) {
        win.clearTimeout(id);
    });


    // Ease-in-out-cubic
    function ease(t) {
        return (t < 0.5) ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }


    // Core
    function M(s, c) {
        var D = this;

        D.els = D.selectors = [];
        D.events = [];
        D.anims = {};

        if (s) {
            D.selectors.push([s, c]);
            D.els = q$(s, c);
        }

        D.length = D.els.length;

        return D;
    }
    P = M.prototype;

    // Extend prototype
    P.cancelAnimFrame = cancelFrame;
    P.requestAnimFrame = reqFrame;
    P.easeInOutCubic = ease;
    P.distinct = distinct;
    P.UA = UA;
    P.q$ = q$;

    // DOMContentLoaded? (hasTests)
    P.DOM = false;
    function domReady() {
        P.DOM = true;
    }
    addEvent(doc, 'DOMContentLoaded load', domReady);
    addEvent(win, 'load', domReady);


    // Get a specific element by index
    P.get = function (index) {
        return this.els[(index || 0)];
    };


    // Iterate all the things! (hasTests)
    P.each = function (obj, func) {
        var D = this,
            arr;

        if (typeof obj === 'function') {
            D.els.forEach(function (el, idx) {
                obj.call(D, el, idx);
            });
        } else if (Array.isArray(obj)) {
            arr = obj;
        } else {
            arr = keys(obj);
        }

        if (arr && func) {
            arr.forEach(func);
        }

        return D;
    };
    P.forEach = P.each;


    // Extend an object with 1 or more objects (hasTests)
    P.extend = function (obj) {
        var D = this;

        [].slice.call(arguments, 1).forEach(function (arg) {
            D.each(arg, function (o) {
                if (arg.hasOwnProperty(o)) {
                    obj[o] = arg[o];
                }
            });
        });
        return obj;
    };


    // Make a clone of an object
    P.clone = function (obj) {
        var copy;

        if (null == obj || 'object' != typeof obj) {
            return obj;
        }

        copy = obj.constructor();

        keys(obj).forEach(function (key) {
            if (obj.hasOwnProperty(key)) {
                copy[key] = obj[key];
            }
        });

        return copy;
    };


    // Is an object an object
    P.isObject = function (obj) {
        return (Object.prototype.toString.call(obj) === '[object Object]') ? true : false;
    };


    // Is an object an array
    P.isArray = function (arr) {
        return Array.isArray(arr);
    };


    // Is an object a function
    P.isFunction = function (fnc) {
        return !!(fnc && fnc.call && fnc.apply);
    };


    // add more elements, for fun and profit... (hasTests)
    P.push = function (selector, context) {
        var D = this;

        D.selectors.push([selector, context]);
        D.requery();

        return D;
    };


    // remove elements TODO: remove events (hasTests)
    P.pop = function (selector, context) {
        var D = this,
            remove = q$(selector, context);

        D.each(function (el, idx) {
            remove.forEach(function (R) {
                if (R === el) {
                    D.els.splice(idx, 1);
                }
            });
        });

        D.length = D.els.length;

        return D;
    };


    // Add event to contained elements
    P.on = function (event, func) {
        var D = this;

        D.each(function (el) {
            addEvent(el, event, func);
        });
        D.events.push([event, func]);

        return D;
    };
    P.addEvent = addEvent;


    // Remove event from contained elements (hasTests)
    P.remove = function (event, func, purge) {
        var D = this;

        D.each(function (el) {
            try {
                el.removeEventListener(event, func);
            } catch (ignore) {}
        });

        if (purge) {
            D.events.splice(D.events.indexOf([event, func]), 1);
        }

        return D;
    };
    P.removeEvent = P.remove;


    // Element offsets (hasTests)
    P.offset = function (el) {
        var r = (el || this.get()).getBoundingClientRect();

        return {
            left    : (r.left + (body.scrollLeft || docEl.scrollLeft)),
            top     : (r.top + (body.scrollTop || docEl.scrollTop)),
            width   : (r.right - r.left),
            height  : (r.bottom - r.top)
        };
    };


    // Apply CSS styles (hasTests)
    P.style = function (prop, val) {
        var D = this;

        D.each(function (el) {
            el.style[prop] = val;
        });

        return D;
    };


    // Bulk CSS styling (hasTests)
    P.css = function (obj) {
        var D = this;

        keys(obj).forEach(function (key) {
            D.style(key, obj[key]);
        });

        return D;
    };
    P.CSS = P.css;


    // Generate unique ID (hasTests)
    P.UID = function (uid) {
        if (!uid) {
            uid = Math.ceil(Math.random() * 99999999);
        }
        return uid;
    };


    // Animation engine (hasTests)
    P.anim = function (end, duration, callback, animateWith) {
        var D = this,
            start = {},
            then = Date.now(),
            dur = duration || 300,
            func = animateWith || ease,
            ID = D.UID();

        // Alternate interface
        if (end.end) {
            func = end.animateWith || func;
            callback = end.callback || callback;
            dur = end.duration || dur;
            end = end.end || {};
        }

        // Discover current state of properties
        D.each(function (el, idx) {
            start[idx] = {};

            keys(end).forEach(function (prop) {
                start[idx][prop] = parseInt((el[prop] ? el : el.style)[prop], 10) || 0.1;
            });
        });

        // Tweener(!)
        function tween(start, end, elapsed, dur) {
            if (elapsed > dur) {
                return end;
            }
            return start + (end - start) * func(elapsed / dur);
        }

        // What unit?
        function unit(prop, measure) {
            if (['opacity','scrollTop','scrollLeft','zIndex'].indexOf(prop) > -1) {
                return '';
            }
            return measure || 'px';
        }

        // Frame step
        function step() {
            var elapsed = Date.now() - then;

            D.each(function (el, idx) {
                keys(end).forEach(function (prop) {
                    ((el[prop]) ? el : el.style)[prop] = tween(start[idx][prop], end[prop], elapsed, dur) + unit(prop);
                });
            });

            if (elapsed > dur) {
                if (callback) {
                    D.timer(callback);
                }
                delete D.anims[ID];
            } else {
                D.anims[ID] = reqFrame(step);
            }
        }

        step();
        return D;
    };
    P.animate = P.anim;


    // Stop all animation (hasTests)
    P.stopAnim = function (callback) {
        var D = this;

        keys(D.anims).forEach(function (ID) {
            cancelFrame(D.anims[ID]);
        });
        D.anims = {};

        if (callback) {
            callback(D);
        }

        return D;
    };
    P.stop = P.stopAnim;


    // CSS class handling (hasTests)
    P.hasClass = function (cls) {
        return hasClass(this.get(), cls);
    };


    // Add a CSS class (hasTests)
    P.addClass = function (cls) {
        this.each(function (el) {
            addClass(el, cls);
        });

        return this;
    };


    // remove a CSS class (hasTests)
    P.delClass = function (cls) {
        this.each(function (el) {
            delClass(el, cls);
        });

        return this;
    };
    P.removeClass = P.delClass;


    // Toggle a CSS class (hasTests)
    P.toggleClass = function (cls) {
        var D = this;

        D.each(function (el) {
            if (hasClass(el, cls)) {
                delClass(el, cls);
            } else {
                addClass(el, cls);
            }
        });

        return D;
    };


    // XMLHTTP
    P.XHR = function (url, params) {
        var X = win.XMLHttpRequest ? new XMLHttpRequest() : new win.ActiveXObject('Microsoft.XMLHTTP'),
            o = params || {},
            p = o.message || '',
            v = o.verb || 'GET',
            h = o.headers || {
                    'Content-type': 'application/x-www-form-urlencoded'
                };


        X.open(v, url, true);

        keys(h).forEach(function (key) {
            X.setRequestHeader(key, h[key]);
        });

        X.timeout = 1000 * 60 * 10;
        X.ontimeout = function () {
            console.log('Timeout... ');
        };

        X.onreadystatechange = function () {
            var s, r;

            if (X.readyState === 4) {
                r = X.responseText;
                s = X.status;

                if (s < 200 || s > 299) {
                    if (o.fail) {
                        o.fail(r, X);
                    }
                } else {
                    if (o.success) {
                        o.success(r, X);
                    }
                }

                if (o.callback) {
                    o.callback(r, s, X);
                }

                X = null;
            }
        };

        X.send(p);
        return this;
    };


    // Postload script
    P.load = function (src, callback) {
        var f = doc.createElement('script'),
            D = this;

        if (callback) {
            f.onloadDone = false;

            f.onload = function () {
                f.onloadDone = true;
                callback();
            };

            f.onreadystatechange = function () {
                var r = f.readyState;

                if ((r === 'loaded' || r === 'complete') && !f.onloadDone) {
                    f.onloadDone = true;
                    callback(D);
                }
            };
        }

        P.append(f, body).src = src;
        return D;
    };


    // Get / Set innerHTML (hasTests)
    P.html = function (html, el) {
        el = el || this.get();

        if (html) {
            el.innerHTML = html;
            return this;
        }
        return el.innerHTML;
    };


    // Get / Set innerTEXT (hasTests)
    P.text = function (text, el) {
        var txt = (body.innerText) ? 'innerText' : 'textContent',
            D = this;

        el = el || D.get();

        if (text) {
            el[txt] = text;
            return D;
        }

        return el[txt];
    };


    // Append markup (hasTests)
    P.append = function (el, target) {
        var D = this,
            tEl;

        if (typeof el === 'string') {
            tEl = doc.createElement('i');
            tEl.innerHTML = el;
            el = tEl.firstChild.cloneNode(true);
        }

        if (target) {
            target.appendChild(el);
        } else {
            D.each(function (parent) {
                parent.appendChild(el.cloneNode(true));
            });
        }

        return el;
    };


    // Event target (hasTests)
    P.eventTarget = function (event) {
        event = event || win.event;
        return event.target || event.srcElement;
    };


    // Prevent default action (hasTests)
    P.preventDefault = function (event, immediate) {
        event = event || win.event;

        event.cancelBubble = true;
        event.returnValue = false;

        if (event.preventDefault) {
            event.preventDefault();
        }

        if (immediate && event.preventImmediatePropegation) {
            event.preventImmediatePropegation();
        }

        return this;
    };


    // Trigger an event (hasTests)
    P.fire = function (event, el) {
        var D = this,
            W3 = (doc.createEvent) ? true : false,
            evt;

        el = el || D.get();

        if (W3) {
            evt = doc.createEvent('HTMLEvents');
            evt.initEvent(event, W3, W3);
        } else {
            evt = doc.createEventObject();
            evt.eventType = event;
        }

        evt.eventName = event;

        if (W3) {
            el.dispatchEvent(evt);
        } else {
            el.fireEvent('on' + event, evt);
        }

        return D;
    };
    P.trigger = P.fire;


    // Plugin new functionality (hasTests)
    P.plugin = function (name, func, only) {
        var D = this;

        if (only) {
            D[name] = func;
        } else {
            P[name] = func;
        }

        return D;
    };


    // Chained setTimeout (hasTests)
    P.timer = function (func, delay) {
        var D = this;

        setTimeout(function () {
            func(D);
        }, delay || 0);

        return D;
    };


    // Requery stored selectors
    P.requery = function () {
        var D = this;

        // remove existing events
        D.events.forEach(function (evt) {
            D.remove(evt[0], evt[1]);
        });

        D.els = [];

        // Repopulate elements
        D.selectors.forEach(function (selector) {
            D.els = D.els.concat(q$(selector[0], selector[1]));
        });

        D.els = distinct(D.els);
        D.length = D.els.length;

        // Re-add events
        D.events.forEach(function (evt) {
            D.each(function (el) {
                addEvent(el, evt[0], evt[1]);
            });
        });

        return D;
    };


    // Shorthand doc ready (hasTests)
    P.ready = function (func) {
        var D = this;

        function ready(func) {
            if (D.DOM) {
                func(D);
            } else {
                setTimeout(ready(func), 9);
            }
        }

        if (func) {
            ready(func);
            return D;
        }

        return D.DOM;
    };


    // Public interface / factory
    win.M$ = function (selector, context) {
        return new M(selector, context);
    };


    // Add CSS-helpers
    docEl.className = (' ' + docEl.className + ' ua-' + UA.lowercase + ' ' + ' os-' + UA.platform + ' ie-' +  UA.ie + ' ' + ((UA.touch) ? 'has-touch' : 'no-touch') + ' ').replace(' no-js ', ' js ').replace(' loading ', ' loaded ').trim();
}(window, document));