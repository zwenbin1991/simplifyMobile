/*
    simplifyMobile.js基于移动端javascript库
    语法更jquery一致，比zepto更轻量，源码更易读，支持三种模块形式
    QQ: 461153861
*/

(function (root, factory) {
    root.SM = root.$ = factory(root);
})(window, function (root) {
    'use strict';

    // 数组原生方法
    var emptyArray = [];
    var nativeSlice = emptyArray.slice;
    var nativeConcat = emptyArray.concat;
    var nativeFilter = emptyArray.filter;
    var nativeForEach = emptyArray.forEach;
    var nativeMap = emptyArray.map;
    var nativeSome = emptyArray.some;
    var nativeEvery = emptyArray.every;

    // 数组原生方法
    var emptyObject = {};
    var nativeKeys = Object.keys;
    var nativeToString = emptyObject.toString;

    // 函数原生方法
    var emptyFunction = Function.prototype;
    var nativeBind = emptyFunction.bind;

    // 常用正则表达式
    var readyStateRE = /(?:loading|complete)/i; // 匹配文档加载状态
    var htmlTagRE = /<!?([a-z]+)[^>]*?>/i; // 匹配是否是html标签
    var simpleHTMLTagRE = /<([a-z]+)[^>]*?><\/\1>/i; // 匹配是否不存在子标签
    var normalizeHTMLTagRE = /<(?!br|hr|img|input|meta|link)(([a-z]+)[^>]*)\/>/gi; // 匹配不符合格式的html标签; 例：<xx id='xx' />
    var selectorRE = /^[\w-]*?$/;

    // 全局'$'变量，用于恢复其他库对$变量的使用
    var prev$ = $;

    // 对子标签有特定要求的容器
    var containerMap = {
        'li': 'ul',
        'option': 'select'
    };

    // 定义数据类型映射
    var classTypeMap = {};

    nativeForEach.call(['Number', 'Boolean', 'String', 'Object', 'Function', 'Array', 'Date', 'RegExp', 'Error'], function (classType) {
        this['[object '+ classType +']'] = classType.toLowerCase();
    }, classTypeMap);



    /****************************************  自定义方法  ******************************************/



    /**
     * 扩展对象
     *
     * @param {Object} target 目标对象
     * @param {Object} source 扩展对象
     * @param {Boolean} deep 是否深拷贝
     * @return {Object}
     */
    function extend (target, source, deep) {
        nativeForEach.call(nativeKeys(source), function (property) {
            var value = source[property];

            if (deep && (SM.isObject(value) || SM.isArray(value))) {
                if (SM.isObject(value))
                    target[property] = {};
                else if (SM.isArray(value))
                    target[property] = [];

                extend(target[property], source[property], deep);
            } else {
                if (target[property] == null)
                    target[property] = source[property];
            }
        });

        return target;
    }

    /**
     * 获取变量类型
     *
     * @param {Type} variable 变量
     * @return {String}
     */
    function getType (variable) {
        return variable == null ?
            String(variable) :
            classTypeMap[nativeToString.call(variable)] || 'object';
    }

    /**
     * 根据html tag获取DOM
     *
     * @param {String} html
     * @param {Object} properties 属性对象 [可选]
     * @return {HTMLElement}
     */
    function getElementByHTMLTag (html, properties) {
        var dom, container;

        // 如果匹配类似的<xx id="xx"></xx> 这种没有子元素
        if (simpleHTMLTagRE.test(html))
            dom = document.createElement(RegExp.$1);
        else {
            // 清空左右空白字符
            html = SM.trim(html);

            // 清除不合法的html标签
            html = html.replace(normalizeHTMLTagRE, '<$1></$1>');
            container = document.createElement(containerMap[htmlTagRE.test(html) && RegExp.$1] || 'div');
            container.innerHTML = html;
            dom = container.firstElementChild.cloneNode(true);
            container.removeChild(container.firstElementChild);
        }

        // 填充属性
        if (SM.isPlainObject(properties)) {
            nativeForEach.call(nativeKeys(properties), function (property) {
                if (property != null)
                    dom.setAttribute(property, properties[property]);
            });
        }

        return dom;
    }

    /**
     * 根据CSS selector获取DOM集合
     *
     * @param {String} selector 选择器
     * @param {HTMLElement|HTMLDocument} context 上下文节点 [可选]
     * @return {Array}
     */
    function getElementsByCSSSelector (selector, context) {
        var isOnlySingleSelector = selectorRE.test(selector), isID, isClass, selectorName;

        context || (context = document);

        // 多个css选择器或者层级选择器
        if (!isOnlySingleSelector)
            return nativeSlice.call(context.querySelectorAll(selector));

        // 单个选择器
        else {
            isID = selector[0] === '#';
            isClass = selector[0] === '.';
            selectorName = isID || isClass ? selector.slice(1) : selector;

            if (isID)
                // 过滤掉没有查到的元素，统一返回数组形式
                return nativeFilter.call([context.getElementById(selectorName)], function (item) { return !!item; });
            else if (isClass)
                return nativeSlice.call(context.getElementsByClassName(selectorName));
            else
                return nativeSlice.call(context.getElementsByTagName(selectorName));
        }

    }

    /**
     * 检测是否是类数组对象
     *
     * @param {likeArray} likeArray 类数组对象
     * @return {Boolean}
     */
    function detectLikeArray (likeArray) {
        return getType(likeArray.length) === 'number';
    }

    /**
     * 数组去重
     *
     * @param {Array} array
     * @return {Array}
     */
    function uniq (array) {
        return nativeFilter.call(array, function (item, idx, arr) {
            return arr.indexOf(item) === idx;
        });
    }

    /**
     * 节点是否selector
     *
     * @param {HTMLElement} element dom节点
     * @param {String} selector 选择器
     * @return {Boolean}
     */
    function detectMatchSelector (element, selector) {
        return selector ? (element.webkitMatchesSelector || element.matchesSelector)(selector) : true;
    }



    /****************************************  SimplifyMobile类结构  ***********************************/



    /* SimplifyMobile类定义 */
    function SM (selector, context) {
        return new SM.fn.init(selector, context);
    }

    // 填充静态方法
    extend(SM, {
        isSM: function (object) {
            return this.fn.isPrototypeOf(object);
        },

        isArray: function (array) {
            return getType(array) === 'array';
        },
        
        isFunction: function (func) {
            return getType(func) === 'function';
        },
        
        isObject: function (object) {
            return getType(object) === 'object';
        },

        isPlainObject: function (object) {
            return this.isObject(object) && !this.isWindow(object) && !object.nodeType;
        },

        isEmptyObject: function (object) {
            return nativeEvery.call(nativeKeys(object), function () {
                return true;
            });
        },

        isWindow: function (object) {
            return this.isObject(object) && object.window === object;
        },

        isDocument: function (object) {
            return this.isObject(object) && object.nodeType === object.DOCUMENT_NODE;
        },

        parse: JSON.parse,
        trim: nativeBind.call(function (str) { return this.call(str); }, String.prototype.trim),

        camelCase: function (string) {
            return string.replace(/-+(.)/g, function (matcher, chr) {
                return chr.toUpperCase();
            })
        },

        noConflict: function () {
            if (prev$)
                root.$ = prev$;

            return this;
        },

        extend: function (target) {
            var sources = nativeSlice.call(arguments, 1), deep;

            if (typeof target === 'boolean') {
                deep = target;
                target = sources.shift();
            }

            nativeFilter.call(sources, function (source) {
                extend(target, source, deep);
            });

            return target;
        },

        _iteratee: function (defineFunc) {
            return function (collection, func) {
                var isLikeArray = detectLikeArray(collection);
                var list = isLikeArray ? collection : nativeKeys(collection), value;

                return defineFunc(list, isLikeArray, collection, func);
            }
        },

        each: SM.prototype._iteratee(function (list, isLikeArray, collection, func) {
            var value;

            nativeForEach.call(list, function (item, idx) {
                func.call((value = isLikeArray ? item : collection[item]), idx, value, collection);
            });
        }),

        map: SM.prototype._iteratee(function (list, isLikeArray, collection, func) {
            var ret = [], value, funcValue;

            nativeForEach.call(list, function (item, idx) {
                if ((funcValue = (func.call((value = isLikeArray ? item : collection[item]), value, idx, collection))) != null)
                    ret.push(funcValue);
            });

            return ret;
        })
    });

    // 填充实例方法
    extend(SM.fn = SM.prototype, {
        super: SM,

        init: function (selector, context) {
            var dom;

            // 如果selector是函数，直接注册DOMContentLoaded事件监听器
            if (this.super.isFunction(selector))
                return this.super(document).ready(selector);

            // 如果是实例
            else if (this.super.isSM(selector))
                return selector;

            // 如果是对象，包括dom和js对象
            else if (this.super.isObject(selector))
                dom = [selector];

            // 如果是数组
            else if (this.super.isArray(selector))
                dom = selector, selector = '';

            // 如果是字符串
            else if (getType(selector) === 'string') {
                // 如果是html
                if (htmlTagRE.test(selector))
                    dom = [getElementByHTMLTag(selector)];

                // 如果存在上下文
                else if (context)
                    dom = this.super(context).find(selector);

                // 如果是css选择器
                else
                    dom = getElementsByCSSSelector(selector);
            }

            // 创建以数字为键标识对应的dom
            nativeForEach.call(dom || [], function (item, idx) {
                this[idx] = item;
            }, this);

            this.length = dom ? dom.length : 0;
            this.selector = selector || '';
        },

        /**
         * 注册DOMContentLoaded事件监听器
         *
         * @param {Function} listener 事件监听器
         */
        ready: function (listener) {
            if (readyStateRE.test(document.readyState))
                listener(SM);
            else
                this.get(0).addEventListener('DOMContentLoaded', function () { listener(SM); }, false);

            return this;
        },

        /**
         * dom集合遍历
         *
         * @param {String} func 处理函数
         */
        each: function (func) {
            nativeEvery.call(this, function (el, idx) {
                return func.call(el, idx, el) !== false;
            });

            return this;
        },

        /**
         * dom集合个数
         */
        size: function () {
            return this.length;
        },

        /**
         * 根据索引获取集合或具体的dom元素
         *
         * @param {Number} idx 索引 [可选]
         */
        get: function (idx) {
            return idx == null ? nativeSlice.call(this) : this[idx >= 0 ? idx : idx + this.length];
        },

        /**
         * 根据索引得到对应的dom，重新构造成SM实例
         *
         * @param {Number} idx 索引 [可选]
         */
        eq: function (idx) {
            return this.super(this.get(idx || 0));
        },

        /**
         * 获取第一个索引对应的dom，重新构造成SM实例
         */
        first: function () {
            return this.eq(0);
        },

        /**
         * 获取最后一个索引对应的dom，重新构造成SM实例
         */
        last: function () {
            return this.eq(-1);
        },


        /**
          *
          *  定义获取父级元素api 如'parent' 'parents' 'closest'
          *
        **/


        /**
         * 通过dom集合去重并且产生新SM实例
         *
         * @param {Function} defineFunc 处理函数
         * @private
         */
        _getSMInstanceByUniq: function (defineFunc) {
            return function (selector) {
                return this.super(
                    nativeFilter.call(uniq(defineFunc.call(this, selector)), function (element) {
                        return detectMatchSelector(element, selector);
                    })
                );
            };
        },

        /**
         * 根据selector筛选出dom元素的父节点，重新构造成SM实例
         *
         * @param {String} selector 选择器 [可选]
         */
        parent: SM.prototype._getSMInstanceByUniq(function () {
            return this.super.map(this, function (element) {
                return element.parentNode;
            });
        }),

        /**
         * 根据selector筛选dom元素的父节点集合，重新构造成SM实例
         *
         * @param {String} selector 选择器 [可选]
         */
        parents: SM.prototype._getSMInstanceByUniq(function () {
            var ret = [];
            var elements = this;

            while (elements.length) {
                elements = this.super.map(elements, function (element) {
                    if ((element = element.parentNode) && !this.super.isDocument(element)) {
                        ret.push(element);

                        return element;
                    }
                })
            }

            return ret;
        }),

        /**
         * 根据selector筛选出dom元素的父节点，重新构造成SM实例，查找起始位置从自身开始
         *
         * @param {String} selector 选择器
         */
        closest: SM.prototype._getSMInstanceByUniq(function (selector) {
            var matchs = [];
            var unMatchs = [];
            var unMatchParentElements = [];

            this.each(function (element) {
                if (detectMatchSelector(element, selector))
                    matchs.push(element);
                else
                    unMatchs.push(element);
            });

            while (unMatchs.length) {
                unMatchs = this.super.map(unMatchs, function (element) {
                    if ((element = element.parentNode) && !this.super.isDocument(element)) {
                        unMatchParentElements.push(element);

                        return element;
                    }
                });
            }

            return nativeConcat.call(matchs, unMatchParentElements);
        })
    });

    // $.fn.init基于原型链继承SM
    SM.fn.init.prototype = SM.fn;

    return SM;
});