class EventEmitter {
    constructor() {
        this.event = {}
    }
    on(key, listener) {
        this.event[key] || (this.event[key] = [])
        this.event[key].push(isObject(listener) ? listener : {listener, once: false})
        return this
    }
    // 只执行一次
    once(key, listener) {
        return this.on(key, {
            listener,
            once: true
        })
    }
    emit(...args) {
        let key = args.shift()
        let fns = this.event[key]
        if (!fns || fns.length === 0) {
            return false
        }
        fns.forEach((fn) => {
            if (isObject(fn)) {
                fn.listener(...args)
                if (fn.once) {
                    this.remove(key, fn)
                }
            }
        })
        return this
    }
    remove(key, listener) {
        let fns = this.event[key]
        if (!fns) {
            return false
        }
        if (!listener) {
            fns && (fns.length = 0)
            return this
        }
        let index = findIndex(fns, listener)
        fns.splice(index, 1)
        return this
    }
}
function isObject(listener) {
    return typeof listener === 'object'
}
function findIndex(arr, val) {
    val = typeof val === 'object' ? val.listener : val
    return arr.findIndex((fn) => {
        return fn === val
    })
}

class WaterFall extends EventEmitter{
    constructor(opts) {
        super()
        this.opts = Object.assign({}, WaterFall.defaultOpts, opts)
        this._container = document.querySelector(this.opts.container)
        this._pins = document.querySelectorAll(this.opts.pins)
        this._loader = document.querySelector(this.opts.loader)
        this.load = false
        this.init()
    }
    init() {
        this.getColumnNum()
        this.setCotainer()
        setTimeout(() => {
            this.setWaterFall()
        }, 17)
        this.bindScrollEvent()
    }
    getColumnNum() {
        this.calcWidth = this.opts.pinWidth + this.opts.gapWidth
        this.viewportWidth = window.innerWidth || document.documentElement.clientWidth
        this.viewportHeight = window.innerHeight || document.documentElement.clientHeight
        this.num = Math.floor((this.viewportWidth + this.opts.pinWidth) / this.calcWidth)
        this._columnHeightArr = (new Array(this.num)).fill(0)
    }
    setCotainer() {
        this._container.style.width = (this.calcWidth * this.num - this.opts.gapWidth) + 'px'
    }
    getMax() {
        return Math.max(...this._columnHeightArr)
    }
    getMin() {
        return Math.min(...this._columnHeightArr)
    }
    append(html, selector) {
        this._checkResult = []
        this._newPins = []
        let div = document.createElement('div')
        div.innerHTML = html
        let children = div.querySelectorAll(this.opts.pins)
        let fragment = document.createDocumentFragment()
        Array.from(children).forEach((child, index) => {
            fragment.appendChild(child)
            this._checkResult[index] = false
            this._newPins.push(child)
            this._checkImgHeight(child, selector, index)
        })
        this.isReadyAppend(fragment)
    }
    _checkImgHeight(node, selector, index) {
        let img = node.querySelector(selector)
        img.onload = () => {
            if (img.getAttribute('height')) {
                return
            }
            img.setAttribute('height', Math.floor(img.height / img.width * this.opts.pinWidth))
            this._checkResult[index] = true
        }
    }
    isReadyAppend(fragment) {
        let timer = null
        let checkAllHaveHeight = () => {
            if(!~findIndex(this._checkResult, false)) {
                this._container.appendChild(fragment)
                this.load = false
                this.setPosition(this._newPins)
                clearTimeout(timer)
            } else {
                setTimeout(checkAllHaveHeight, 17)
            }
        }
        timer = setTimeout(checkAllHaveHeight, 17)
    }
    setPosition(pins) {
        // pins = Array.from(pins)
        [...pins].forEach((pin) => {
            let min = this.getMin()
            let index = findIndex(this._columnHeightArr, min)
            pin.style.left = this.calcWidth * index + 'px'
            pin.style.top = min + 'px'
            this._columnHeightArr[index] += pin.offsetHeight + this.opts.gapHeight
        })
        // this._newPins = []
        this.setWaterFall()
        // console.log(this._columnHeightArr)
    }
    resetPosition() {
        this.getColumnNum()
        this.setCotainer()
        this.setPosition(document.querySelectorAll(this.opts.pins))
    }
    bindScrollEvent() {
        let timer = null
        addEvent(window, 'scroll',() => {
            if (this.checkScroll()) {
                this.appendPins()
            }
        })
        addEvent(window, 'resize',() => {
            clearTimeout(timer)
            timer = setTimeout(() => {
                this.resetPosition()
            }, 17)
        })
    }
    checkScroll() {
        let y = window.pageYOffset || document.documentElement.scrollTop
        // console.log('y:'+ y)
        // console.log('1:'+ (this.getMin() - y))
        // console.log('2:'+ this.viewportHeight)
        if ((this.getMin() - y) < this.viewportHeight) {
            return true
        }
        return false
    }
    appendPins() {
        if (this.load) {
            return
        }
        this.load = true
        this.emit('load')
    }
    setWaterFall() {
        if (this.getMin() < this.viewportHeight) {
            this.appendPins()
        }
    }
}
WaterFall.defaultOpts = {
    gapHeight: 20,
    gapWidth: 20,
    pinWidth: 216,
    threshold: 100
}
function findIndex(arr, val) {
    return arr.findIndex((item) => {
        return item === val
    })
}
const addEvent = (function() {
    if (window.addEventListener) {
        return function(el, type, fn) {
            el.addEventListener(type, fn, false)
        }
    } else if (window.attachEvent) {
        return function(el, type, fn) {
            el.attachEvent(`on${type}`, fn)
        }
    } else {
        return function(el, type, fn) {
            el[`on${type}`] = fn
        }
    }
})()
